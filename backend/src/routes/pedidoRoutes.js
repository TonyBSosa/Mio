const express = require("express");

const {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  actualizarPagoPedido,
  actualizarEntregaPedido,
  eliminarPedido
} = require("../controllers/pedidoController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("vendedor"));

router.post("/", crearPedido);
router.get("/", obtenerPedidos);
router.get("/:id", obtenerPedidoPorId);
router.put("/:id", actualizarPedido);
router.patch("/:id/pago", actualizarPagoPedido);
router.patch("/:id/entrega", actualizarEntregaPedido);
router.delete("/:id", eliminarPedido);

module.exports = router;
