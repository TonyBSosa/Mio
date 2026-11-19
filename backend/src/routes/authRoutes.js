const express = require("express");

const {
  logout, solicitarRecuperacion, restablecerPassword,
  registrar,
  login,
  obtenerPerfil
} = require("../controllers/authController");
const protegerRuta = require("../middlewares/authMiddleware");

const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const limite = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { mensaje: 'Demasiados intentos. Espera 15 minutos.' } });
router.use(['/login', '/register'], limite);
const limiteRecuperacion = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { mensaje: 'Demasiadas solicitudes. Espera 15 minutos e intenta de nuevo.' } });
const limiteReset = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' } });
router.use(['/forgot-password', '/reset-password'], (req, res, next) => {
  res.set('Cache-Control', 'no-store'); res.set('Referrer-Policy', 'no-referrer'); next();
});
router.use('/forgot-password', limiteRecuperacion);
router.use('/reset-password', limiteReset);

router.post('/logout', protegerRuta, logout);
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);
router.post("/register", registrar);
router.post("/login", login);
router.get("/me", protegerRuta, obtenerPerfil);

const verificacion = require('../controllers/verificacionController');
const { identidad } = require('../middlewares/verificacionMiddleware');
const limiteVerificacion = rateLimit({ windowMs: 15 * 60000, limit: 10,
  standardHeaders: 'draft-8', legacyHeaders: false, message: { mensaje: 'Espera unos minutos antes de volver a intentarlo.' } });
router.use('/email-verification', (req, res, next) => {
  res.set('Cache-Control', 'no-store'); res.set('Referrer-Policy', 'no-referrer'); next();
}, limiteVerificacion);
router.get('/email-verification/status', identidad, verificacion.estado);
router.post('/email-verification/resend', identidad, verificacion.reenviar);
router.post('/email-verification/link-status', verificacion.enlace);
router.post('/email-verification/confirm', verificacion.confirmar);
module.exports = router;
