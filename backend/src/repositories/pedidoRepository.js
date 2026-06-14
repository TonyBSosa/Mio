const Cliente = require("../models/clientes");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");

const crearPedido = (data) => {
  return Pedido.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Pedido.find({
    vendedorId
  });
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

module.exports = {
  crearPedido,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor,
  buscarClientePorIdYVendedor,
  buscarLivePorIdYVendedor
};
