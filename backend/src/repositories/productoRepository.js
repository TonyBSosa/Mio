const mongoose = require("mongoose");
const Pedido = require("../models/pedidos");
const Producto = require("../models/productos");

const crearProducto = (data) => {
  return Producto.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Producto.find({
    vendedorId
  }).sort({ createdAt: -1 });
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

const tienePedidosAsociados = async (productoId, vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  const pedido = await Pedido.exists({
    productoId,
    vendedorId
  });

  return Boolean(pedido);
};

module.exports = {
  crearProducto,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor,
  tienePedidosAsociados
};
