const Live = require("../models/lives");
const PerfilVendedor = require("../models/perfilVendedor");
const Producto = require("../models/productos");

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
  });
};

const listarLivesPublicosPorVendedor = (vendedorId) => {
  return Live.find({
    vendedorId,
    estado: { $in: ["programado", "activo"] }
  });
};

module.exports = {
  buscarPerfilPorVendedor,
  listarProductosActivosPorVendedor,
  listarLivesPublicosPorVendedor
};
