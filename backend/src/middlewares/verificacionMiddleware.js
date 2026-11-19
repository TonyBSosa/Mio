const jwt = require('jsonwebtoken');
const User = require('../models/users');
const proteger = require('./authMiddleware');
const { vigente, version } = require('../services/credentialService');
const config = require('../config/verificacionConfig');
async function identidad(req, res, next) {
  res.set('Cache-Control', 'no-store'); res.set('Referrer-Policy', 'no-referrer');
  try {
    const cabecera = req.headers.authorization;
    if (typeof cabecera !== 'string' || !cabecera.startsWith('Bearer ')) throw new Error();
    const token = jwt.verify(cabecera.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (token.scope === undefined) return proteger(req, res, next);
    if (token.scope !== 'email-verification' || !token.id) throw new Error();
    const u = await User.findById(token.id);
    if (!vigente(u) || (token.cv ?? null) !== version(u) || !config.pendienteNueva(u)) throw new Error();
    req.usuario = u; return next();
  } catch { return res.status(401).json({ mensaje: 'Inicia sesión nuevamente para verificar tu correo.' }); }
}
function sensible(req, res, next) {
  try {
    if (!req.usuario.emailVerifiedAt && (config.pendienteNueva(req.usuario) || config.modoHistorico() === 'sensitive')) {
      return res.status(403).json({ codigo: 'EMAIL_VERIFICATION_REQUIRED', mensaje: 'Verifica tu correo para continuar con esta operación.' });
    }
    return next();
  } catch { return res.status(503).json({ mensaje: 'No se pudo comprobar el acceso.' }); }
}
module.exports = { identidad, sensible };
