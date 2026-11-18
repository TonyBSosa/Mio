const mongoose = require('mongoose');
const Solicitud = require('../models/solicitudApartado');
const Producto = require('../models/productos');
const User = require('../models/users');
const Perfil = require('../models/perfilVendedor');
const Pedido = require('../models/pedidos');
const Comprobante = require('../models/comprobante');
const reloj = require('../services/reloj');
const expiracion = require('../services/expiracionReservasService');

// No aceptar escrituras antes de que MongoDB confirme el índice de unicidad.
// Un fallo de permisos/construcción del índice impide crear solicitudes.
let indicesListos;
const asegurarIndices = () => {
  if (!indicesListos) {
    indicesListos = Solicitud.createIndexes().catch(error => { indicesListos = undefined; throw error; });
  }
  return indicesListos;
};

module.exports = {
  asegurarIndices,
  buscarProducto: id => Producto.findById(id).lean(),
  buscarVendedor: id => User.findOne({ _id: id, rol: 'vendedor', estado: 'activo' }).lean(),
  buscarPerfil: vendedorId => Perfil.findOne({ vendedorId, activo: true }).lean(),
  buscarConfiguracion: vendedorId => Perfil.findOne({ vendedorId }).lean(),
  crear: async datos => { await asegurarIndices(); return Solicitud.create(datos); },
  listar: filtro => Solicitud.find(filtro).sort({ createdAt: -1 }).lean(),
  buscarPropia: filtro => Solicitud.findOne(filtro).lean(),
  rechazar: filtro => Solicitud.findOneAndDelete({ ...filtro, estado: 'pendiente' }),
  cancelarPendiente: filtro => Solicitud.findOneAndDelete({ ...filtro, estado: 'pendiente' }),
  cancelarConfirmada: filtro => mongoose.connection.transaction(async session => {
    const solicitud = await Solicitud.findOne(filtro).session(session).lean();
    const conflicto = mensaje => Object.assign(new Error(mensaje), { status: 409 });
    if (!solicitud || solicitud.estado !== 'confirmada' || solicitud.comprobanteRecibidoEn || solicitud.comprobanteActualId || solicitud.pedidoId) {
      throw conflicto('El apartado cambió o tiene un comprobante. Actualizá la lista antes de cancelar.');
    }
    if (await Pedido.exists({ canceladoEn: null, productoId: solicitud.productoId, vendedorId: solicitud.vendedorId }).session(session) ||
        await Comprobante.exists({ reservaId: solicitud._id, estado: { $in: ['en_revision', 'aprobado', 'rechazado'] } }).session(session)) {
      throw conflicto('No se puede cancelar un apartado con pago o comprobante recibido.');
    }
    const pieza = await Producto.findOneAndUpdate({
      _id: solicitud.productoId, vendedorId: solicitud.vendedorId, estado: 'apartado', reservaSolicitudId: solicitud._id,
    }, { $set: { estado: 'activo' }, $unset: { reservaSolicitudId: '' } }, { session, returnDocument: 'after' });
    if (!pieza) throw conflicto('La pieza ya no mantiene este apartado. Consultá con la tienda.');
    const eliminada = await Solicitud.findOneAndDelete({ ...filtro, estado: 'confirmada', comprobanteRecibidoEn: null, comprobanteActualId: null, pedidoId: null }, { session });
    if (!eliminada) throw conflicto('El apartado cambió durante la cancelación.');
    return eliminada;
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } }),
  guardarPlazo: (vendedorId, plazoReservaDias) => Perfil.findOneAndUpdate({ vendedorId }, {
    $set: { plazoReservaDias },
  }, { upsert: true, new: true, runValidators: true }),
  confirmar: async (filtro, plazoReservaDias) => {
    await asegurarIndices();
    const preliminar = await Solicitud.findOne(filtro).lean();
    if (preliminar) await expiracion.procesar({ productoId: preliminar.productoId });
    return mongoose.connection.transaction(async session => {
      const solicitud = await Solicitud.findOne(filtro).session(session).lean();
      if (!solicitud || solicitud.estado !== 'pendiente') {
        throw Object.assign(new Error('La solicitud ya no está pendiente.'), { status: 409 });
      }
      if (await Pedido.exists({ canceladoEn: null, productoId: solicitud.productoId, vendedorId: filtro.vendedorId }).session(session)) {
        throw Object.assign(new Error('La pieza ya está vinculada a un pedido.'), { status: 409 });
      }
      const producto = await Producto.findOneAndUpdate({
        _id: solicitud.productoId, vendedorId: filtro.vendedorId, estado: 'activo', reservaSolicitudId: null,
      }, { $set: { estado: 'apartado', reservaSolicitudId: solicitud._id } }, { new: true, session, runValidators: true });
      if (!producto) throw Object.assign(new Error('El producto ya no está disponible.'), { status: 409 });
      const confirmadoEn = reloj.ahora();
      const actualizada = await Solicitud.findOneAndUpdate({ ...filtro, estado: 'pendiente' }, { $set: {
        estado: 'confirmada', confirmadoEn, plazoReservaDias,
        venceEn: new Date(confirmadoEn.getTime() + plazoReservaDias * 86400000),
        precioConfirmado: producto.precio, esPrueba: true,
      } }, { new: true, session, runValidators: true });
      if (!actualizada) throw Object.assign(new Error('La solicitud ya no está pendiente.'), { status: 409 });
      return actualizada;
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  },
};
