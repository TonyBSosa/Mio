const mongoose = require("mongoose");
const User = require("../models/users");
const Cliente = require("../models/clientes");
const Producto = require("../models/productos");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");
const PerfilVendedor = require("../models/perfilVendedor");

const crearUsuario = (data) => {
  return User.create(data);
};

const listarUsuarios = () => {
  return User.find().sort({ createdAt: -1 });
};

const buscarPorId = (id) => {
  return User.findById(id);
};

const buscarPorEmail = (email) => {
  return User.findOne({ email: String(email).trim().toLowerCase() });
};

const actualizarPorId = (id, data) => {
  return User.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorId = (id) => {
  return User.findByIdAndDelete(id);
};

const tieneDatosDeTienda = async (vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return false;
  }

  const [tienePedidos, tieneProductos, tieneClientes, tieneLives] =
    await Promise.all([
      Pedido.exists({ vendedorId }),
      Producto.exists({ vendedorId }),
      Cliente.exists({ vendedorId }),
      Live.exists({ vendedorId })
    ]);

  return Boolean(tienePedidos || tieneProductos || tieneClientes || tieneLives);
};

const sincronizarEstadoPerfilVendedor = async (vendedorId, activo) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await PerfilVendedor.updateOne(
    { vendedorId },
    { $set: { activo: Boolean(activo) } }
  );
};

const eliminarPerfilPorVendedor = async (vendedorId) => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await PerfilVendedor.deleteOne({ vendedorId });
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  buscarPorEmail,
  actualizarPorId,
  eliminarPorId,
  tieneDatosDeTienda,
  sincronizarEstadoPerfilVendedor,
  eliminarPerfilPorVendedor
};
