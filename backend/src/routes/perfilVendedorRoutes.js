const express = require("express");

const {
  obtenerMiPerfil,
  guardarMiPerfil
} = require("../controllers/perfilVendedorController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use((req, res, next) => ['GET','HEAD','OPTIONS'].includes(req.method) ? next() : require('../middlewares/verificacionMiddleware').sensible(req, res, next));
router.use(validarRol("vendedor"));

router.get("/me", obtenerMiPerfil);
router.put("/me", guardarMiPerfil);

module.exports = router;
