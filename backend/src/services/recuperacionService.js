const crypto = require('node:crypto');
const User = require('../models/users');
const Recuperacion = require('../models/recuperacion');
const credenciales = require('./credentialService');
const correo = require('./correoService');
const config = require('../config/recuperacionConfig');
const { crearCola } = require('./recoveryQueue');

async function procesar(email) {
  const minutos = config.expiracionMinutos(); // Fallar antes de persistir si el TTL es inválido.
  const usuario = await User.findOne({ email, estado: 'activo', deletedAt: null });
  if (!credenciales.vigente(usuario)) return;
  const ahora = new Date(), anterior = usuario.recoveryRequest;
  const mismaVentana = anterior?.windowStartedAt && ahora - anterior.windowStartedAt < config.WINDOW_MS;
  if (anterior?.nextAllowedAt > ahora || (mismaVentana && anterior.count >= config.MAX_PER_WINDOW)) return;
  const slot = crypto.randomUUID();
  const aceptado = await User.findOneAndUpdate({ ...credenciales.filtroVersion(usuario),
    'recoveryRequest.slot': anterior?.slot ?? null }, { $set: { recoveryRequest: {
      slot, windowStartedAt: mismaVentana ? anterior.windowStartedAt : ahora,
      count: mismaVentana ? anterior.count + 1 : 1,
      nextAllowedAt: new Date(+ahora + config.COOLDOWN_MS),
    } } }, { returnDocument: 'after', writeConcern: { w: 'majority', wtimeout: 5000 } });
  if (!aceptado) return; // Otra instancia consumió el mismo slot. Sin retry que cause doble envío.
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + minutos * 60000);
  await Recuperacion.create({ usuarioId: usuario._id, credentialVersion: credenciales.version(usuario),
    tokenHash: Recuperacion.hashToken(token), expiresAt });
  if (!await User.exists(credenciales.filtroVersion(usuario))) return;
  // Reintentos usan este mismo token/enlace; no crean tokens adicionales.
  await correo.enviarRecuperacion(usuario.email, token, { minutos, expiresAt });
}
const cola = crearCola(procesar);
module.exports = { procesar, encolar: email => cola.encolar(email), esperarPendientes: () => cola.esperarPendientes() };
