const express = require("express");

const {
  registrar,
  login,
  obtenerPerfil
} = require("../controllers/authController");
const protegerRuta = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registrar);
router.post("/login", login);
router.get("/me", protegerRuta, obtenerPerfil);

module.exports = router;
