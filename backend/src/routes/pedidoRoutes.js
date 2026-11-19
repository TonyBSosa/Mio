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
router.use(require('../middlewares/expirarReservasMiddleware'));

router.post("/", require('../middlewares/verificacionMiddleware').sensible, crearPedido);
router.get("/", obtenerPedidos);
router.get("/:id", obtenerPedidoPorId);
router.put("/:id", (req, res, next) => ['clienteId','liveId','producto','productoId','cantidad','precio'].some(campo => req.body?.[campo] !== undefined)
  ? require('../middlewares/verificacionMiddleware').sensible(req, res, next) : next(), actualizarPedido);
router.patch("/:id/pago", actualizarPagoPedido);
router.patch("/:id/entrega", actualizarEntregaPedido);
router.delete("/:id", eliminarPedido);

module.exports = router;
