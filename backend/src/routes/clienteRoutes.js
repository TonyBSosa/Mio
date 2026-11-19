const express = require("express");

const {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
} = require("../controllers/clienteController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use((req, res, next) => ['GET','HEAD','OPTIONS'].includes(req.method) ? next() : require('../middlewares/verificacionMiddleware').sensible(req, res, next));
router.use(validarRol("vendedor"));

router.post("/", crearCliente);
router.get("/", obtenerClientes);
router.get("/:id", obtenerClientePorId);
router.put("/:id", actualizarCliente);
router.delete("/:id", eliminarCliente);

module.exports = router;
