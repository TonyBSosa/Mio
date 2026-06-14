const PerfilVendedor = require("../models/perfilVendedor");

const buscarPorVendedor = (vendedorId) => {
  return PerfilVendedor.findOne({
    vendedorId
  });
};

const crearPerfil = (data) => {
  return PerfilVendedor.create(data);
};

const actualizarPorVendedor = (vendedorId, data) => {
  return PerfilVendedor.findOneAndUpdate(
    {
      vendedorId
    },
    data,
    { new: true, runValidators: true, upsert: true }
  );
};

module.exports = {
  buscarPorVendedor,
  crearPerfil,
  actualizarPorVendedor
};
