const express = require("express");

const {
  listarVendedores,
  listarEventos,
  buscar
} = require("../controllers/explorarPublicoController");

const router = express.Router();

router.get("/vendedores", listarVendedores);
router.get("/eventos", listarEventos);
router.get("/buscar", buscar);

module.exports = router;
