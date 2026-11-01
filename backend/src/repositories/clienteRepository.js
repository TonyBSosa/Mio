const mongoose = require("mongoose");
const Cliente = require("../models/clientes");
const Pedido = require("../models/pedidos");

const crearCliente = (data) => {
  return Cliente.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Cliente.find({
    vendedorId
  }).sort({ createdAt: -1 });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Cliente.findOne({
    _id: id,
    vendedorId
  });
};

const actualizarPorIdYVendedor = (id, vendedorId, data) => {
  return Cliente.findOneAndUpdate(
    {
      _id: id,
      vendedorId
    },
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorIdYVendedor = (id, vendedorId) => {
  return Cliente.findOneAndDelete({
    _id: id,
    vendedorId
  });
};

const tienePedidosAsociados = async (clienteId, vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  const pedido = await Pedido.exists({
    clienteId,
    vendedorId
  });

  return Boolean(pedido);
};

module.exports = {
  crearCliente,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor,
  tienePedidosAsociados
};
