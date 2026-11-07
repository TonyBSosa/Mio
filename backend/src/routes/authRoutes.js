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
router.use(['/login', '/register', '/forgot-password', '/reset-password'], limite);

router.post('/logout', protegerRuta, logout);
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);
router.post("/register", registrar);
router.post("/login", login);
router.get("/me", protegerRuta, obtenerPerfil);

module.exports = router;
