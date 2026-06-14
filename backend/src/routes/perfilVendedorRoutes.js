const express = require("express");

const {
  obtenerMiPerfil,
  guardarMiPerfil
} = require("../controllers/perfilVendedorController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("vendedor"));

router.get("/me", obtenerMiPerfil);
router.put("/me", guardarMiPerfil);

module.exports = router;
