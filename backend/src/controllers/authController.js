const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/users");

const Sesion = require('../models/sesion');
const Recuperacion = require('../models/recuperacion');
const crypto = require('node:crypto');
const correo = require('../services/correoService');
const generarToken = async (usuarioId) => {
  const sesion = await Sesion.create({ usuarioId, expiresAt: new Date(Date.now() + 1800000) });
  return jwt.sign({ id: usuarioId, sid: String(sesion._id) }, process.env.JWT_SECRET, {
    expiresIn: "30m"
  });
};

const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";
    const emailNormalizado =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!nombreLimpio || !emailNormalizado || typeof password !== "string" || password.length < 10 || password.length > 128) {
      return res.status(400).json({
        mensaje: "Nombre y email son obligatorios; password debe tener entre 10 y 128 caracteres"
      });
    }

    const usuarioExiste = await User.findOne({ email: emailNormalizado });

    if (usuarioExiste) {
      return res.status(400).json({
        mensaje: "Ya existe un usuario con ese email"
      });
    }

    const passwordHasheado = await bcrypt.hash(password, 10);
    const rolRegistro = rol || "vendedor";

    if (rolRegistro === "admin") {
      return res.status(400).json({
        mensaje: "No se permite registrar administradores desde este formulario."
      });
    }

    if (!["vendedor", "cliente"].includes(rolRegistro)) {
      return res.status(400).json({
        mensaje: "Rol de usuario invalido"
      });
    }

    const usuario = await User.create({
      nombre: nombreLimpio,
      email: emailNormalizado,
      password: passwordHasheado,
      rol: rolRegistro
    });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      token: await generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al registrar usuario",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailNormalizado =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!emailNormalizado || typeof password !== "string" || !password) {
      return res.status(400).json({
        mensaje: "Email y password son obligatorios"
      });
    }

    const usuario = await User.findOne({ email: emailNormalizado }).select(
      "+password"
    );

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales invalidas"
      });
    }

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        mensaje: "Usuario inactivo"
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Credenciales invalidas"
      });
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      token: await generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al iniciar sesion",
      error: error.message
    });
  }
};

const obtenerPerfil = async (req, res) => {
  res.json(req.usuario);
};

const logout = async (req, res) => {
  await Sesion.deleteOne({ _id: req.sesionId, usuarioId: req.usuario._id });
  res.json({ mensaje: 'Sesion cerrada' });
};
const solicitarRecuperacion = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  try {
    const usuario = await User.findOne({ email, estado: 'activo' });
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      await Recuperacion.create({ usuarioId: usuario._id, tokenHash: Recuperacion.hashToken(token), expiresAt: new Date(Date.now() + 900000) });
      await correo.enviarRecuperacion(usuario.email, token);
    }
  } catch { console.error('No se pudo procesar el correo de recuperacion'); }
  res.json({ mensaje: 'Si la cuenta existe, recibiras un enlace de recuperacion.' });
};
const restablecerPassword = async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof password !== 'string' || password.length < 10 || password.length > 128) return res.status(400).json({ mensaje: 'Enlace invalido o contraseña fuera de 10 a 128 caracteres' });
  const hash = await bcrypt.hash(password, 12);
  const recuperacion = await Recuperacion.findOneAndDelete({ tokenHash: Recuperacion.hashToken(token), expiresAt: { $gt: new Date() } });
  if (!recuperacion) return res.status(400).json({ mensaje: 'Enlace invalido o vencido' });
  await User.updateOne({ _id: recuperacion.usuarioId, estado: 'activo' }, { $set: { password: hash } });
  await Promise.all([Sesion.deleteMany({ usuarioId: recuperacion.usuarioId }), Recuperacion.deleteMany({ usuarioId: recuperacion.usuarioId })]);
  res.json({ mensaje: 'Contraseña actualizada. Inicia sesion de nuevo.' });
};
module.exports = {
  logout, solicitarRecuperacion, restablecerPassword,
  registrar,
  login,
  obtenerPerfil
};
