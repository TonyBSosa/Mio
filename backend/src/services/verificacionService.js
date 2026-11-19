const crypto = require('node:crypto');
const User = require('../models/users');
const credenciales = require('./credentialService');
const config = require('../config/verificacionConfig');
const correo = require('./correoService');
const { crearCola } = require('./recoveryQueue');
const diagnostico = require('./diagnosticoRecuperacion');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const inicial = () => ({ emailVerifiedAt: null, emailVerificationRequired: true,
  registrationPendingUntil: new Date(Date.now() + 7 * 86400000) });
async function procesar(email) {
  const horas = config.horas();
  const u = await User.findOne({ email, estado: 'activo', deletedAt: null });
  if (!credenciales.vigente(u) || u.emailVerifiedAt) return;
  // Registros abandonados no se borran ni liberan automáticamente.
  if (u.registrationPendingUntil && u.registrationPendingUntil <= new Date()) return;
  const now = new Date(), antes = u.verificationRequest;
  const ventana = antes?.windowStartedAt && now - antes.windowStartedAt < 3600000;
  if (antes?.nextAllowedAt > now || (ventana && antes.count >= 3)) return;
  const token = String(u._id) + '.' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Math.min(+now + horas * 3600000, u.registrationPendingUntil ? +u.registrationPendingUntil : Infinity));
  const aceptado = await User.findOneAndUpdate({ ...credenciales.filtroVersion(u), email,
    emailVerifiedAt: null, 'verificationRequest.slot': antes?.slot ?? null }, { $set: {
    emailVerification: { hash: hash(token), email, credentialVersion: credenciales.version(u), expiresAt },
    verificationRequest: { slot: crypto.randomUUID(), windowStartedAt: ventana ? antes.windowStartedAt : now,
      count: ventana ? antes.count + 1 : 1, nextAllowedAt: new Date(+now + 60000) },
  } }, { returnDocument: 'after', writeConcern: { w: 'majority', wtimeout: 5000 } });
  if (!aceptado) return;
  if (!await User.exists({ ...credenciales.filtroVersion(u), email, emailVerifiedAt: null,
    'emailVerification.hash': hash(token) })) return;
  await correo.enviarVerificacion(email, token, { horas, expiresAt });
}
async function pruebaVigente(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(token)) return null;
  const u = await User.findById(token.split('.')[0]);
  const prueba = u?.emailVerification;
  if (!credenciales.vigente(u) || u.emailVerifiedAt || !prueba || prueba.hash !== hash(token) ||
      prueba.email !== u.email || (prueba.credentialVersion ?? null) !== credenciales.version(u)) return null;
  if (+prueba.expiresAt <= Date.now()) return null;
  return u;
}
async function confirmar(token, password) {
  const u = await pruebaVigente(token);
  if (!u) return null;
  const prueba = u.emailVerification;
  // El dueño del buzón elige la clave final: no activar una clave que pudo elegir un tercero.
  const activacion = u.emailVerificationRequired === true ? {
    password: await require('./passwordPolicy').hashPassword(password), credentialVersion: credenciales.nuevaVersion(),
  } : {};
  // Un documento, un ganador: comprobar vigencia también con el reloj de MongoDB.
  return User.findOneAndUpdate({ ...credenciales.filtroVersion(u), email: prueba.email,
    emailVerifiedAt: null, 'emailVerification.hash': hash(token),
    $expr: { $gt: ['$emailVerification.expiresAt', '$$NOW'] } }, {
    $set: { emailVerifiedAt: new Date(), ...activacion }, $unset: { emailVerification: 1, registrationPendingUntil: 1 },
  }, { returnDocument: 'after', writeConcern: { w: 'majority', wtimeout: 5000 } });
}
const cola = crearCola(email => diagnostico.ejecutar('verificacion_trabajo', () => procesar(email)), {
  onError: error => diagnostico.registrar(error, 'verificacion_trabajo_fallido'),
});
module.exports = { pruebaVigente, inicial, procesar, confirmar, hash, encolar: email => cola.encolar(email),
  esperarPendientes: () => cola.esperarPendientes() };
