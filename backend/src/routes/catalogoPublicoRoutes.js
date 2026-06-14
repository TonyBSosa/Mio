const express = require("express");

const {
  obtenerCatalogo
} = require("../controllers/catalogoPublicoController");

const router = express.Router();

router.get("/:vendedorId", obtenerCatalogo);

module.exports = router;
