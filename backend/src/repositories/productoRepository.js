const Producto = require("../models/productos");

const crearProducto = (data) => {
  return Producto.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Producto.find({
    vendedorId
  });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Producto.findOne({
    _id: id,
    vendedorId
  });
};

const actualizarPorIdYVendedor = (id, vendedorId, data) => {
  return Producto.findOneAndUpdate(
    {
      _id: id,
      vendedorId
    },
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorIdYVendedor = (id, vendedorId) => {
  return Producto.findOneAndDelete({
    _id: id,
    vendedorId
  });
};

module.exports = {
  crearProducto,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor
};
