const service = require('../services/verificacionService');
exports.estado = (req, res) => res.json({ verified: !!req.usuario.emailVerifiedAt,
  legacy: req.usuario.emailVerificationRequired !== true,
  registrationExpired: !!req.usuario.registrationPendingUntil && req.usuario.registrationPendingUntil <= new Date(),
  mensaje: req.usuario.emailVerifiedAt ? 'Correo verificado.' : 'Verifica tu correo para proteger tu cuenta.' });
exports.reenviar = (req, res) => {
  service.encolar(req.usuario.email);
  return res.json({ mensaje: 'Si corresponde, recibirás un nuevo enlace. Revisa también el correo no deseado.' });
};
exports.confirmar = async (req, res) => {
  try {
    const u = await service.confirmar(req.body?.token, req.body?.password);
    if (!u) return res.status(400).json({ mensaje: 'El enlace no es válido, venció o ya fue utilizado.' });
    return res.json({ mensaje: 'Correo verificado. Ya puedes iniciar sesión.' });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ mensaje: error.mensaje });
    return res.status(503).json({ mensaje: 'No se pudo confirmar el correo. Intenta iniciar sesión antes de solicitar otro enlace.' });
  }
};

exports.enlace = async (req, res) => {
  try {
    const u = await service.pruebaVigente(req.body?.token);
    if (!u) return res.status(400).json({ mensaje: 'El enlace no es válido, venció o ya fue utilizado.' });
    return res.json({ requiresPassword: u.emailVerificationRequired === true });
  } catch { return res.status(503).json({ mensaje: 'No se pudo comprobar el enlace.' }); }
};
