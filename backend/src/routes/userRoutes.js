const express = require("express");

const {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  actualizarEstadoUsuario,
  eliminarUsuario
} = require("../controllers/userController");
const protegerRuta = require("../middlewares/authMiddleware");
const validarRol = require("../middlewares/roleMiddleware");

const router = express.Router();

router.use(protegerRuta);
router.use(validarRol("admin"));

router.post("/", crearUsuario);
router.get("/", obtenerUsuarios);
router.get("/:id", obtenerUsuarioPorId);
router.put("/:id", actualizarUsuario);
router.patch("/:id/estado", actualizarEstadoUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;
