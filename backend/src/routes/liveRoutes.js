const express = require("express");

const {
  crearLive,
  obtenerLives,
  obtenerLivePorId,
  actualizarLive,
  actualizarEstadoLive,
  eliminarLive
} = require("../controllers/liveController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("vendedor"));

router.post("/", crearLive);
router.get("/", obtenerLives);
router.get("/:id", obtenerLivePorId);
router.put("/:id", actualizarLive);
router.patch("/:id/estado", actualizarEstadoLive);
router.delete("/:id", eliminarLive);

module.exports = router;
