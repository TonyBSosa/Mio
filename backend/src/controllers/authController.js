const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const User = require('../models/users');
const Sesion = require('../models/sesion');
const Recuperacion = require('../models/recuperacion');
const correo = require('../services/correoService');
const politica = require('../services/passwordPolicy');
const credenciales = require('../services/credentialService');
const bcrypt = require('bcryptjs');
const hashFicticio = bcrypt.hashSync('solo-comparacion-ficticia', 12);
const credencialesInvalidas = res => res.status(401).json({ mensaje: 'Credenciales invalidas' });
const errorSeguro = (res, error, mensaje) => {
  if (error.code === 11000) return res.status(409).json({ mensaje: 'No se pudo completar el registro con esos datos.' });
  if (error.status === 400) return res.status(400).json({ mensaje: error.mensaje });
  return res.status(503).json({ mensaje });
};
const generarToken = async usuario => {
  const cv = credenciales.version(usuario);
  const sesion = await Sesion.create({ usuarioId: usuario._id, credentialVersion: cv,
    expiresAt: new Date(Date.now() + 1800000) });
  // Vincular al snapshot cuya clave se verificó, nunca a una versión releída.
  const filtro = credenciales.filtroVersion(usuario);
  if (usuario.password) filtro.password = usuario.password;
  if (!await User.exists(filtro)) {
    await Sesion.deleteOne({ _id: sesion._id, usuarioId: usuario._id });
    return null;
  }
  return jwt.sign({ id: usuario._id, sid: String(sesion._id), cv }, process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '30m' });
};
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'vendedor' } = req.body || {};
    const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!nombreLimpio || !emailNormalizado || !['vendedor', 'cliente'].includes(rol)) {
      return res.status(400).json({ mensaje: 'Nombre, correo y rol de registro validos son obligatorios.' });
    }
    politica.validarPassword(password);
    if (await User.findOne({ email: emailNormalizado })) {
      return res.status(409).json({ mensaje: 'No se pudo completar el registro con esos datos.' });
    }
    const usuario = await User.create({ nombre: nombreLimpio, email: emailNormalizado,
      password: await politica.hashPassword(password), rol, credentialVersion: credenciales.nuevaVersion() });
    const token = await generarToken(usuario);
    if (!token) return credencialesInvalidas(res);
    return res.status(201).json({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email,
      rol: usuario.rol, estado: usuario.estado, token });
  } catch (error) { return errorSeguro(res, error, 'No se pudo procesar el registro.'); }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!emailNormalizado || typeof password !== 'string' || !password || Buffer.byteLength(password) > 4096) {
      return credencialesInvalidas(res);
    }
    const usuario = await User.findOne({ email: emailNormalizado }).select('+password');
    const correcto = await politica.verificarPassword(password, usuario?.password || hashFicticio);
    if (!correcto || !credenciales.vigente(usuario)) return credencialesInvalidas(res);
    const token = await generarToken(usuario);
    if (!token) return credencialesInvalidas(res);
    return res.json({ _id: usuario._id, nombre: usuario.nombre, email: usuario.email,
      rol: usuario.rol, estado: usuario.estado, token });
  } catch { return res.status(503).json({ mensaje: 'No se pudo iniciar sesion.' }); }
};
const obtenerPerfil = async (req, res) => res.json(req.usuario);
const logout = async (req, res) => {
  try {
    await Sesion.deleteOne({ _id: req.sesionId, usuarioId: req.usuario._id });
    return res.json({ mensaje: 'Sesion cerrada' });
  } catch { return res.status(503).json({ mensaje: 'No se pudo cerrar la sesion.' }); }
};
const solicitarRecuperacion = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  try {
    const usuario = await User.findOne({ email, estado: 'activo', deletedAt: null });
    if (credenciales.vigente(usuario)) {
      const token = crypto.randomBytes(32).toString('hex');
      await Recuperacion.create({ usuarioId: usuario._id, credentialVersion: credenciales.version(usuario),
        tokenHash: Recuperacion.hashToken(token), expiresAt: new Date(Date.now() + 900000) });
      await correo.enviarRecuperacion(usuario.email, token);
    }
  } catch { console.error('No se pudo procesar el correo de recuperacion'); }
  return res.json({ mensaje: 'Si la cuenta existe, recibiras un enlace de recuperacion.' });
};
const restablecerPassword = async (req, res) => {
  const invalido = () => res.status(400).json({ mensaje: 'Enlace invalido o vencido' });
  try {
    const { token, password } = req.body || {};
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return invalido();
    politica.validarPassword(password);
    const filtro = { tokenHash: Recuperacion.hashToken(token), expiresAt: { $gt: new Date() } };
    const recuperacion = await Recuperacion.findOne(filtro);
    if (!recuperacion) return invalido();
    const usuario = await User.findById(recuperacion.usuarioId);
    if (!credenciales.vigente(usuario) || credenciales.version(usuario) !== credenciales.version(recuperacion)) return invalido();
    const hash = await politica.hashPassword(password);
    const consumido = await Recuperacion.findOneAndDelete({ ...filtro, _id: recuperacion._id,
      credentialVersion: credenciales.version(recuperacion), expiresAt: { $gt: new Date() } });
    if (!consumido) return invalido();
    // CAS: password y revocación lógica se confirman juntos en un documento.
    if (!await credenciales.cambiarConVersion(usuario, hash)) return invalido();
    return res.json({ mensaje: 'Contraseña actualizada. Inicia sesion de nuevo.' });
  } catch (error) { return errorSeguro(res, error, 'No se pudo restablecer la contraseña. Solicita otro enlace.'); }
};
module.exports = { registrar, login, obtenerPerfil, logout, solicitarRecuperacion, restablecerPassword };
