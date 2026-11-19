const Sesion = require('../models/sesion');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const { version, vigente } = require('../services/credentialService');
module.exports = async (req, res, next) => {
  const rechazar = () => res.status(401).json({ mensaje: 'Sesion invalida o vencida' });
  try {
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return rechazar();
    const decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (decoded.scope !== undefined || !decoded.sid || !decoded.id) return rechazar();
    const usuario = await User.findById(decoded.id);
    if (!vigente(usuario) || require('../config/verificacionConfig').pendienteNueva(usuario) || (decoded.cv ?? null) !== version(usuario)) return rechazar();
    if (!await Sesion.exists({ _id: decoded.sid, usuarioId: decoded.id,
      credentialVersion: version(usuario), expiresAt: { $gt: new Date() } })) return rechazar();
    req.sesionId = decoded.sid;
    req.usuario = usuario;
    next();
  } catch { return rechazar(); }
};
