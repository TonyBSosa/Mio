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
    liveId,
    vendedorId
  });
};

module.exports = {
  buscarLivePorIdYVendedor,
  listarPedidosPorLiveYVendedor
};
