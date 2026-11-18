const mongoose = require('mongoose');
const Solicitud = require('../models/solicitudApartado');
const Producto = require('../models/productos');
const Pedido = require('../models/pedidos');
const reloj = require('./reloj');
const { esEntornoPruebasAislado } = require('./reservasPruebaPolicy');

const filtroVencidas = corte => ({
  esPrueba: true, comprobanteRecibidoEn: null,
  $or: [
    { estado: 'confirmada', venceEn: { $lte: corte } },
    { estado: 'comprobante_rechazado', corregirHasta: { $lte: corte } },
  ],
});

const expirarUna = async (id, corte = reloj.ahora()) => {
  if (!esEntornoPruebasAislado()) return null;
  return mongoose.connection.transaction(async session => {
    const filtro = { _id: id, ...filtroVencidas(corte) };
    const solicitud = await Solicitud.findOne(filtro).session(session).lean();
    if (!solicitud) return null; // Otro proceso ya venció/revisó esta reserva.
    const producto = await Producto.findOne({ _id: solicitud.productoId, vendedorId: solicitud.vendedorId }).session(session).lean();
    const tienePedido = await Pedido.exists({ canceladoEn: null, productoId: solicitud.productoId, vendedorId: solicitud.vendedorId }).session(session);
    let inventarioLiberado = false;
    let motivoLiberacion = 'referencia_distinta_o_producto_ausente';
    if (tienePedido) motivoLiberacion = 'pedido_asociado';
    else if (producto && String(producto.reservaSolicitudId) === String(solicitud._id)) {
      motivoLiberacion = 'estado_producto_no_apartado';
      if (producto.estado === 'apartado') {
        const liberado = await Producto.findOneAndUpdate({
          _id: solicitud.productoId, vendedorId: solicitud.vendedorId,
          estado: 'apartado', reservaSolicitudId: solicitud._id,
        }, { $set: { estado: 'activo' }, $unset: { reservaSolicitudId: '' } }, { session, returnDocument: 'after', runValidators: true });
        if (!liberado) throw Object.assign(new Error('Cambió el bloqueo de inventario. Reintentá la consulta.'), { status: 409 });
        inventarioLiberado = true;
        motivoLiberacion = 'liberado';
      }
    }
    const resultado = await Solicitud.findOneAndUpdate(filtro, { $set: {
      estado: 'expirada', expiradoEn: corte, inventarioLiberado, motivoLiberacion,
    } }, { session, returnDocument: 'after', runValidators: true });
    if (!resultado) throw Object.assign(new Error('Cambió el estado de la reserva. Reintentá la consulta.'), { status: 409 });
    return resultado;
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
};

const procesar = async (alcance = {}) => {
  if (!esEntornoPruebasAislado()) return { expiradas: 0, liberadas: 0, omitido: true };
  const corte = reloj.ahora();
  // Solo criterios construidos por el servidor; nunca filtros arbitrarios del body.
  const filtro = filtroVencidas(corte);
  for (const campo of ['productoId', 'vendedorId', 'compradorId']) {
    if (alcance[campo]) filtro[campo] = alcance[campo];
  }
  let expiradas = 0;
  let liberadas = 0;
  try {
    // Límite de trabajo por petición; si queda trabajo, falla cerrado y se reintenta.
    for (let lote = 0; lote < 10; lote++) {
      const candidatas = await Solicitud.find(filtro).select('_id').sort({ venceEn: 1, _id: 1 }).limit(100).lean();
      if (!candidatas.length) return { expiradas, liberadas, omitido: false };
      for (const candidata of candidatas) {
        const resultado = await expirarUna(candidata._id, corte);
        if (resultado) { expiradas++; if (resultado.inventarioLiberado) liberadas++; }
      }
    }
    if (await Solicitud.exists(filtro)) throw Object.assign(new Error('Quedan reservas por actualizar. Reintentá la consulta.'), { status: 503 });
    return { expiradas, liberadas, omitido: false };
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('No se pudo verificar el vencimiento de las reservas. Disponibilidad temporalmente no disponible.'), { status: 503 });
  }
};

module.exports = { procesar, expirarUna };
