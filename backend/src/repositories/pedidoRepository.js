const mongoose = require("mongoose");
const Cliente = require("../models/clientes");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");
const Producto = require("../models/productos");

const crearPedido = (data) => {
  return Pedido.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Pedido.find({
    vendedorId
  }).sort({ createdAt: -1 });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Pedido.findOne({
    _id: id,
    vendedorId
  });
};

const actualizarPorIdYVendedor = (id, vendedorId, data) => {
  return Pedido.findOneAndUpdate(
    {
      _id: id,
      vendedorId
    },
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorIdYVendedor = (id, vendedorId) => {
  return Pedido.findOneAndDelete({
    _id: id,
    vendedorId
  });
};

const buscarClientePorIdYVendedor = (clienteId, vendedorId) => {
  return Cliente.findOne({
    _id: clienteId,
    vendedorId
  });
};

const buscarLivePorIdYVendedor = (liveId, vendedorId) => {
  return Live.findOne({
    _id: liveId,
    vendedorId
  });
};

const buscarProductoPorIdYVendedor = (productoId, vendedorId) => {
  return Producto.findOne({
    _id: productoId,
    vendedorId
  });
};

const apartarProductoPorIdYVendedor = async (productoId, vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return { _id: productoId, vendedorId, estado: "apartado" };
  }

  return Producto.findOneAndUpdate(
    {
      _id: productoId,
      vendedorId,
      estado: "activo"
    },
    {
      $set: { estado: "apartado" }
    },
    { new: true, runValidators: true }
  );
};

const liberarProductoPorIdYVendedor = async (productoId, vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return { _id: productoId, vendedorId, estado: "activo" };
  }

  return Producto.findOneAndUpdate(
    {
      _id: productoId,
      vendedorId,
      estado: "apartado"
    },
    {
      $set: { estado: "activo" }
    },
    { new: true, runValidators: true }
  );
};

module.exports = {
  buscarProductoPorIdYVendedor,
  apartarProductoPorIdYVendedor,
  liberarProductoPorIdYVendedor,
  crearPedido,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor,
  buscarClientePorIdYVendedor,
  buscarLivePorIdYVendedor
};
