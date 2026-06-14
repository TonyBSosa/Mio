const express = require("express");

const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  actualizarEstadoProducto,
  eliminarProducto
} = require("../controllers/productoController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("vendedor"));

router.post("/", crearProducto);
router.get("/", obtenerProductos);
router.get("/:id", obtenerProductoPorId);
router.put("/:id", actualizarProducto);
router.patch("/:id/estado", actualizarEstadoProducto);
router.delete("/:id", eliminarProducto);

module.exports = router;
