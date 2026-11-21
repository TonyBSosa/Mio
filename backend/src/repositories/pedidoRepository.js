const mongoose = require("mongoose");
const Cliente = require("../models/clientes");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");
const Producto = require("../models/productos");

const crearPedido = async (data, session) => {
  return session ? (await Pedido.create([data], { session }))[0] : Pedido.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Pedido.find({
    vendedorId, canceladoEn: null
  }).sort({ createdAt: -1 });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Pedido.findOne({
    _id: id,
    vendedorId, canceladoEn: null
  });
};

const actualizarPorIdYVendedor = (id, vendedorId, data, session) => {
  const tocaFinanzas = ['clienteId', 'liveId', 'producto', 'cantidad', 'precio', 'estadoPago'].some(campo => data[campo] !== undefined);
  return Pedido.findOneAndUpdate(
    {
      _id: id,
      vendedorId, canceladoEn: null,
      ...(data.planEntrega !== undefined ? { estadoEntrega: 'pendiente' } : {}),
      ...(tocaFinanzas ? { reservaSolicitudId: null } : {})
    },
    data,
    { new: true, runValidators: true, session }
  );
};

const eliminarPorIdYVendedor = (id, vendedorId, session) => Pedido.findOneAndUpdate({ _id: id, vendedorId, reservaSolicitudId: null, canceladoEn: null }, { $set: { canceladoEn: new Date() } }, { new: true, session });
const transaccion = operacion => {
 if (mongoose.connection.readyState !== 1) throw Object.assign(new Error('MongoDB no esta conectado'), { status: 503 });
 return mongoose.connection.transaction(operacion, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
};

const buscarClientePorIdYVendedor = (clienteId, vendedorId, session) => {
  return Cliente.findOne({
    _id: clienteId,
    vendedorId
  }).session(session || null);
};

const buscarLivePorIdYVendedor = (liveId, vendedorId, session) => {
  return Live.findOne({
    _id: liveId,
    vendedorId
  }).session(session || null);
};

const buscarProductoPorIdYVendedor = (productoId, vendedorId, session) => {
  return Producto.findOne({
    _id: productoId,
    vendedorId
  }).session(session || null);
};

const apartarProductoPorIdYVendedor = async (productoId, vendedorId, session) => {
  if (mongoose.connection.readyState !== 1) { throw Object.assign(new Error("MongoDB no esta conectado"), { status: 503 }); }

  return Producto.findOneAndUpdate(
    {
      _id: productoId,
      vendedorId,
      estado: "activo",
      reservaSolicitudId: null
    },
    {
      $set: { estado: "apartado" }
    },
    { new: true, runValidators: true, session }
  );
};

const liberarProductoPorIdYVendedor = async (productoId, vendedorId, session) => {
  if (mongoose.connection.readyState !== 1) { throw Object.assign(new Error("MongoDB no esta conectado"), { status: 503 }); }

  return Producto.findOneAndUpdate(
    {
      _id: productoId,
      vendedorId,
      estado: "apartado",
      reservaSolicitudId: null
    },
    {
      $set: { estado: "activo" }
    },
    { new: true, runValidators: true, session }
  );
};

module.exports = {
  transaccion,
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
