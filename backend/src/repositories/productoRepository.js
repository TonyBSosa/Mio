const mongoose = require("mongoose");
const Pedido = require("../models/pedidos");
const Producto = require("../models/productos");

const crearProducto = (data) => {
  return Producto.create(data);
};

const listarPorVendedor = (vendedorId) => {
  return Producto.find({
    vendedorId
  }).sort({ createdAt: -1 });
};

const buscarPorIdYVendedor = (id, vendedorId) => {
  return Producto.findOne({
    _id: id,
    vendedorId
  });
};

const actualizarPorIdYVendedor = async (id, vendedorId, data) => {
 if (mongoose.connection.readyState !== 1) throw Object.assign(new Error('MongoDB no esta conectado'), { status: 503 });
 return mongoose.connection.transaction(async session => {
  const producto = await Producto.findOneAndUpdate({ _id: id, vendedorId, reservaSolicitudId: null }, { $inc: { __v: 1 } }, { new: true, session });
  if (!producto) return null;
  if (data.estado !== undefined && await Pedido.exists({ productoId: id, vendedorId, canceladoEn: null }).session(session)) throw Object.assign(new Error('No se puede cambiar la disponibilidad de una pieza vinculada a un pedido'), { status: 409 });
  return Producto.findOneAndUpdate({ _id: id, vendedorId, reservaSolicitudId: null }, data, { new: true, runValidators: true, session });
 }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
};

const eliminarPorIdYVendedor = (id, vendedorId) => {
  return Producto.findOneAndDelete({
    _id: id,
    vendedorId,
    reservaSolicitudId: null
  });
};

const tienePedidosAsociados = async (productoId, vendedorId) => {
  if (mongoose.connection.readyState !== 1) { throw Object.assign(new Error("MongoDB no esta conectado"), { status: 503 }); }

  const pedido = await Pedido.exists({
    productoId,
    vendedorId
  });

  return Boolean(pedido);
};

module.exports = {
  crearProducto,
  listarPorVendedor,
  buscarPorIdYVendedor,
  actualizarPorIdYVendedor,
  eliminarPorIdYVendedor,
  tienePedidosAsociados
};
