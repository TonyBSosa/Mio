const Live = require("../models/lives");
const Pedido = require("../models/pedidos");

const buscarLivePorIdYVendedor = (liveId, vendedorId) => {
  return Live.findOne({
    _id: liveId,
    vendedorId
  });
};

const listarPedidosPorLiveYVendedor = (liveId, vendedorId) => {
  return Pedido.find({
    canceladoEn: null,
    liveId,
    vendedorId
  });
};

const listarPedidosDirectosPorVendedor = (vendedorId) => {
  return Pedido.find({
    canceladoEn: null,
    vendedorId,
    $or: [{ liveId: null }, { liveId: { $exists: false } }]
  });
};

const listarTodosPedidosPorVendedor = (vendedorId) => {
  return Pedido.find({
    canceladoEn: null,
    vendedorId
  });
};

module.exports = {
  buscarLivePorIdYVendedor,
  listarPedidosPorLiveYVendedor,
  listarPedidosDirectosPorVendedor,
  listarTodosPedidosPorVendedor
};
