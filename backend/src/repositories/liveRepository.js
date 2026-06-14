const Live = require("../models/lives");

const crearLive = (data) => {
  return Live.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Live.find({
    vendedorId
  });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Live.findOne({
    _id: id,
    vendedorId
  });
};

const buscarActivoPorVendedor = (vendedorId) => {
  return Live.findOne({
    vendedorId,
    estado: "activo"
  }).sort({ updatedAt: -1 });
};

const buscarOtroActivoPorVendedor = (id, vendedorId) => {
  return Live.findOne({
    _id: { $ne: id },
    vendedorId,
    estado: "activo"
  });
};

const actualizarPorIdYVendedor = (id, vendedorId, data) => {
  return Live.findOneAndUpdate(
    {
      _id: id,
      vendedorId
    },
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorIdYVendedor = (id, vendedorId) => {
  return Live.findOneAndDelete({
    _id: id,
    vendedorId
  });
};

module.exports = {
  crearLive,
  listarPorVendedor,
  buscarPorIdYVendedor,
  buscarActivoPorVendedor,
  buscarOtroActivoPorVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor
};
