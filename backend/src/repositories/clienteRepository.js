const Cliente = require("../models/clientes");

const crearCliente = (data) => {
  return Cliente.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Cliente.find({
    vendedorId
  });
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

module.exports = {
  crearCliente,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor
};
