const mongoose = require("mongoose");
const User = require("../models/users");
const Cliente = require("../models/clientes");
const Producto = require("../models/productos");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");
const PerfilVendedor = require("../models/perfilVendedor");
const { randomUUID } = require('node:crypto');

const crearUsuario = (data) => {
  return User.create(data);
};

const listarUsuarios = () => {
  return User.find({ deletedAt: null }).sort({ createdAt: -1 });
};

const buscarPorId = (id) => {
  return User.findById(id);
};

const buscarPorEmail = (email) => {
  return User.findOne({ email: String(email).trim().toLowerCase() });
};

const actualizarPorId = (id, data) => {
  const emailActualizado = data.email !== undefined ? { emailVerifiedAt: null, emailVerification: null, verificationRequest: null } : {};
  const revocar = ['password', 'estado', 'rol', 'email'].some(campo => data[campo] !== undefined);
  return User.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { ...data, ...emailActualizado, ...(revocar ? { credentialVersion: randomUUID() } : {}) } },
    { returnDocument: 'after', runValidators: true, writeConcern: { w: 'majority', wtimeout: 5000 } }
  );
};

const eliminarPorId = (id) => {
  return User.findOneAndUpdate({ _id: id, deletedAt: null }, {
    $set: { estado: 'inactivo', deletedAt: new Date(), credentialVersion: randomUUID() }
  }, { returnDocument: 'after', runValidators: true, writeConcern: { w: 'majority', wtimeout: 5000 } });
};

const tieneDatosDeTienda = async (vendedorId) => {
  if (mongoose.connection.readyState !== 1) { throw Object.assign(new Error("MongoDB no esta conectado"), { status: 503 }); }

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
  if (mongoose.connection.readyState !== 1) { throw Object.assign(new Error("MongoDB no esta conectado"), { status: 503 }); }

  await PerfilVendedor.updateOne(
    { vendedorId },
    { $set: { activo: Boolean(activo) } }
  );
};


module.exports = {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  buscarPorEmail,
  actualizarPorId,
  eliminarPorId,
  tieneDatosDeTienda,
  sincronizarEstadoPerfilVendedor
};
