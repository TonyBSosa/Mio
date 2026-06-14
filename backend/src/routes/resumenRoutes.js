const express = require("express");

const {
  obtenerResumenPorLive
} = require("../controllers/resumenController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("vendedor"));

router.get("/live/:liveId", obtenerResumenPorLive);

module.exports = router;
