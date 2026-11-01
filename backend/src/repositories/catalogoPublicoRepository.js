const mongoose = require("mongoose");
const Live = require("../models/lives");
const PerfilVendedor = require("../models/perfilVendedor");
const Producto = require("../models/productos");
const User = require("../models/users");

const buscarVendedorPorId = async (vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  return User.findById(vendedorId);
};

const buscarPerfilPorVendedor = (vendedorId) => {
  return PerfilVendedor.findOne({
    vendedorId,
    activo: true
  });
};

const listarProductosActivosPorVendedor = (vendedorId) => {
  return Producto.find({
    vendedorId,
    estado: "activo"
  }).sort({ createdAt: -1 });
};

const listarLivesPublicosPorVendedor = (vendedorId) => {
  return Live.find({
    vendedorId,
    estado: { $in: ["programado", "activo"] }
  }).sort({ fecha: 1, createdAt: -1 });
};

module.exports = {
  buscarVendedorPorId,
  buscarPerfilPorVendedor,
  listarProductosActivosPorVendedor,
  listarLivesPublicosPorVendedor
};
