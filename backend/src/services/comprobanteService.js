const mongoose = require('mongoose');
const Comprobante = require('../models/comprobante');
const Solicitud = require('../models/solicitudApartado');
const Producto = require('../models/productos');
const Pedido = require('../models/pedidos');
const Cliente = require('../models/clientes');
const storage = require('./comprobanteStorage');
const validarImagen = require('./validarComprobante');
const reloj = require('./reloj');
const expiracion = require('./expiracionReservasService');
const { esEntornoPruebasAislado } = require('./reservasPruebaPolicy');
const error = (status, mensaje) => Object.assign(new Error(mensaje), { status });
const politica = 'Un reenvío dentro de las 24 horas posteriores al primer rechazo. Un segundo rechazo vence la reserva.';
let indices, baseIndices;
const asegurarIndices = async () => {
  if (!indices || baseIndices !== mongoose.connection.db) {
    baseIndices = mongoose.connection.db;
    indices = Promise.all([Comprobante, Solicitud, Cliente, Pedido].map(modelo => modelo.createIndexes())).catch(e => { indices = null; throw e; });
  }
  return indices;
};
const dto = c => ({ _id: c._id, estado: c.estado, tipo: c.tipo, tamano: c.tamano,
  recibidoEn: c.recibidoEn, revisadoEn: c.revisadoEn, motivo: c.motivo, corregirHasta: c.corregirHasta });
const filtroPropio = (id, usuario) => {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) throw error(400, 'Identificador inválido.');
  if (usuario.rol === 'cliente') return { _id: id, compradorId: usuario._id };
  if (usuario.rol === 'vendedor') return { _id: id, vendedorId: usuario._id };
  throw error(403, 'No tenés acceso a los comprobantes.');
};
const reservaPropia = async (id, usuario) => {
  const reserva = await Solicitud.findOne(filtroPropio(id, usuario)).lean();
  if (!reserva) throw error(404, 'Reserva no encontrada.');
  return reserva;
};
const permitirEscritura = () => {
  if (!esEntornoPruebasAislado()) throw error(503, 'Los comprobantes siguen restringidos al entorno de pruebas aislado hasta validar la configuración externa.');
};
const limite = reserva => reserva.estado === 'comprobante_rechazado' ? reserva.corregirHasta : reserva.venceEn;
const admiteCarga = (reserva, ahora) => ['confirmada', 'comprobante_rechazado'].includes(reserva.estado) && new Date(limite(reserva)) > ahora;
const sanearCargas = reservaId => Comprobante.updateMany({ ...(reservaId ? { reservaId } : {}), estado: 'preparando', finalizaCargaEn: { $lte: reloj.ahora() } }, {
  $set: { estado: 'fallido', limpiezaPendiente: true },
});

const verificarCarga = async (id, usuario) => {
  if (usuario.rol !== 'cliente') throw error(403, 'Solo el comprador puede adjuntar comprobantes.');
  permitirEscritura();
  let reserva = await reservaPropia(id, usuario);
  await expiracion.procesar({ productoId: reserva.productoId });
  reserva = await reservaPropia(id, usuario);
  if (!admiteCarga(reserva, reloj.ahora())) throw error(409, 'La reserva no admite comprobantes o su plazo terminó.');
  if (!storage.configurado()) throw error(503, 'El almacenamiento privado todavía no está configurado.');
  await sanearCargas(reserva._id);
  if (await Comprobante.countDocuments({ reservaId: reserva._id, estado: { $in: ['en_revision', 'rechazado', 'aprobado'] } }) >= 2) {
    throw error(409, 'Ya se utilizó la corrección permitida.');
  }
  return reserva;
};

const subir = async (id, usuario, archivo) => {
  const reserva = await verificarCarga(id, usuario);
  const buffer = await validarImagen(archivo);
  await asegurarIndices();
  const _id = new mongoose.Types.ObjectId();
  const clavePrivada = `${reserva.vendedorId}/${reserva._id}/${_id}.webp`;
  let comprobante;
  try {
    comprobante = await Comprobante.create({ _id, reservaId: reserva._id, compradorId: usuario._id,
      vendedorId: reserva.vendedorId, clavePrivada, tipo: 'image/webp', tamano: buffer.length,
      estado: 'preparando', finalizaCargaEn: new Date(reloj.ahora().getTime() + 120000) });
  } catch (e) {
    if (e.code === 11000) throw error(409, 'Ya hay una carga en curso. Consultá el historial antes de reintentar.');
    throw e;
  }
  try {
    await storage.subir(clavePrivada, buffer);
    return await mongoose.connection.transaction(async session => {
      const actual = await Solicitud.findOne(filtroPropio(id, usuario)).session(session).lean();
      const ahora = reloj.ahora();
      if (!actual || !admiteCarga(actual, ahora)) throw error(409, 'El plazo terminó o la reserva cambió durante la carga.');
      const pieza = await Producto.exists({ _id: actual.productoId, vendedorId: actual.vendedorId, estado: 'apartado', reservaSolicitudId: actual._id }).session(session);
      if (!pieza) throw error(409, 'La reserva ya no mantiene el bloqueo del artículo.');
      const recibido = await Comprobante.findOneAndUpdate({ _id, estado: 'preparando', finalizaCargaEn: { $gt: ahora } }, {
        $set: { estado: 'en_revision', recibidoEn: ahora },
      }, { session, returnDocument: 'after', runValidators: true });
      if (!recibido) throw error(409, 'La carga superó su tiempo permitido. Intentá de nuevo.');
      const transicion = await Solicitud.updateOne({ _id: actual._id, estado: actual.estado }, { $set: {
        estado: 'comprobante_en_revision', comprobanteRecibidoEn: ahora, comprobanteActualId: _id,
      }, $unset: { corregirHasta: '' } }, { session, runValidators: true });
      if (transicion.matchedCount !== 1) throw error(409, 'La reserva cambió durante la recepción. Consultá su estado.');
      return dto(recibido);
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (e) {
    // No borrar un archivo que quizá se confirmó si el resultado del commit es desconocido.
    await Comprobante.updateOne({ _id: comprobante._id, estado: 'preparando' }, { $set: { estado: 'fallido', limpiezaPendiente: true } }).catch(() => {});
    if (e.status) throw e;
    throw error(503, 'No pudimos confirmar la carga. Consultá el historial antes de intentar de nuevo.');
  }
};

const listar = async (id, usuario) => {
  const propia = await reservaPropia(id, usuario);
  await expiracion.procesar({ productoId: propia.productoId });
  await sanearCargas(propia._id);
  const reserva = await reservaPropia(id, usuario);
  const comprobantes = await Comprobante.find({ reservaId: propia._id }).sort({ createdAt: 1 }).lean();
  return { comprobantes: comprobantes.map(dto), politicaCorreccion: politica,
    cargaHabilitada: usuario.rol === 'cliente' && esEntornoPruebasAislado() && storage.configurado() && admiteCarga(reserva, reloj.ahora()) && !comprobantes.some(c => c.estado === 'preparando') && comprobantes.filter(c => ['en_revision', 'aprobado', 'rechazado'].includes(c.estado)).length < 2,
    limiteCargaEn: limite(reserva), estadoReserva: reserva.estado,
    almacenamientoConfigurado: storage.configurado(),
  };
};
const buscarComprobante = async (id, comprobanteId, usuario, conClave = false) => {
  await reservaPropia(id, usuario);
  if (!/^[a-f\d]{24}$/i.test(comprobanteId || '')) throw error(400, 'Identificador inválido.');
  let query = Comprobante.findOne({ _id: comprobanteId, reservaId: id, estado: { $in: ['en_revision', 'aprobado', 'rechazado'] } });
  if (conClave) query = query.select('+clavePrivada');
  const comprobante = await query.lean();
  if (!comprobante) throw error(404, 'Comprobante no encontrado.');
  return comprobante;
};
const accesoTemporal = async (id, comprobanteId, usuario) => {
  const comprobante = await buscarComprobante(id, comprobanteId, usuario, true);
  return storage.firmar(comprobante.clavePrivada);
};

const revisar = async (id, comprobanteId, usuario, accion, motivo) => {
  if (usuario.rol !== 'vendedor') throw error(403, 'Solo el vendedor puede revisar comprobantes.');
  permitirEscritura();
  await buscarComprobante(id, comprobanteId, usuario);
  if (!['aprobar', 'rechazar'].includes(accion)) throw error(400, 'Acción inválida.');
  const texto = typeof motivo === 'string' ? motivo.trim() : '';
  if (accion === 'rechazar' && (!texto || texto.length > 500 || /[\x00-\x1f<>]/.test(texto))) throw error(400, 'Indicá un motivo de rechazo de 1 a 500 caracteres, sin etiquetas.');
  await asegurarIndices();
  for (let intento = 0; intento < 3; intento++) {
    try {
      const resultado = await mongoose.connection.transaction(async session => {
        const reserva = await Solicitud.findOne(filtroPropio(id, usuario)).session(session).lean();
        const comprobante = await Comprobante.findOne({ _id: comprobanteId, reservaId: id }).session(session).lean();
        if (!reserva || !comprobante) throw error(404, 'Comprobante no encontrado.');
        if (comprobante.estado === 'aprobado' && reserva.estado === 'pagada' && accion === 'aprobar') return dto(comprobante);
        if (comprobante.estado === 'rechazado' && accion === 'rechazar') return dto(comprobante);
        if (reserva.estado !== 'comprobante_en_revision' || String(reserva.comprobanteActualId) !== comprobanteId || comprobante.estado !== 'en_revision') throw error(409, 'El comprobante ya fue revisado o dejó de ser el actual.');
        const ahora = reloj.ahora();
        if (accion === 'rechazar') {
          const cantidad = await Comprobante.countDocuments({ reservaId: id, estado: { $in: ['en_revision', 'rechazado', 'aprobado'] } }).session(session);
          const corregirHasta = new Date(ahora.getTime() + (cantidad < 2 ? 86400000 : 0));
          const rechazado = await Comprobante.findOneAndUpdate({ _id: comprobanteId, estado: 'en_revision' }, { $set: {
            estado: 'rechazado', revisadoPor: usuario._id, revisadoEn: ahora, motivo: texto, corregirHasta,
          } }, { session, returnDocument: 'after', runValidators: true });
          const transicion = await Solicitud.updateOne({ _id: id, estado: 'comprobante_en_revision' }, { $set: { estado: 'comprobante_rechazado', corregirHasta }, $unset: { comprobanteRecibidoEn: '' } }, { session, runValidators: true });
          if (transicion.matchedCount !== 1) throw error(409, 'La reserva ya fue revisada.');
          return dto(rechazado);
        }
        const pieza = await Producto.exists({ _id: reserva.productoId, vendedorId: usuario._id, estado: 'apartado', reservaSolicitudId: reserva._id }).session(session);
        if (!pieza || !Number.isFinite(reserva.precioConfirmado)) throw error(409, 'La reserva perdió su bloqueo o no tiene precio confirmado. Requiere revisión.');
        if (await Pedido.exists({ productoId: reserva.productoId, vendedorId: usuario._id }).session(session)) throw error(409, 'El artículo ya tiene un pedido asociado.');
        const cliente = await Cliente.findOneAndUpdate({ vendedorId: usuario._id, usuarioId: reserva.compradorId }, { $setOnInsert: {
          nombre: reserva.compradorNombre, vendedorId: usuario._id, usuarioId: reserva.compradorId,
        } }, { session, upsert: true, returnDocument: 'after', runValidators: true });
        const [pedido] = await Pedido.create([{
          clienteId: cliente._id, vendedorId: usuario._id, productoId: reserva.productoId,
          reservaSolicitudId: reserva._id, comprobanteId: comprobante._id,
          producto: reserva.productoNombre, cantidad: 1, precio: reserva.precioConfirmado,
          estadoPago: 'pagado', estadoEntrega: 'pendiente',
        }], { session });
        const transicion = await Solicitud.updateOne({ _id: id, estado: 'comprobante_en_revision' }, { $set: { estado: 'pagada', pagadoEn: ahora, pedidoId: pedido._id } }, { session, runValidators: true });
        if (transicion.matchedCount !== 1) throw error(409, 'La reserva ya fue revisada.');
        const aprobado = await Comprobante.findOneAndUpdate({ _id: comprobanteId, estado: 'en_revision' }, { $set: { estado: 'aprobado', revisadoEn: ahora, revisadoPor: usuario._id } }, { session, returnDocument: 'after', runValidators: true });
        return dto(aprobado);
      }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
      await expiracion.procesar({ productoId: (await reservaPropia(id, usuario)).productoId });
      return resultado;
    } catch (e) {
      if (e.code === 11000 && intento < 2) continue;
      throw e;
    }
  }
};

const limpiarCargas = async () => {
  permitirEscritura();
  await sanearCargas();
  if (!storage.configurado()) return { eliminados: 0, omitido: true };
  const candidatas = await Comprobante.find({ estado: 'fallido', limpiezaPendiente: true }).select('+clavePrivada').sort({ ultimaLimpiezaEn: 1 }).limit(100).lean();
  let eliminados = 0;
  for (const candidata of candidatas) {
    await storage.eliminar(candidata.clavePrivada);
    // Mantener candidato para repetir: una carga remota tardía podría terminar tras un timeout.
    await Comprobante.updateOne({ _id: candidata._id, estado: 'fallido' }, { $set: { ultimaLimpiezaEn: reloj.ahora() } });
    eliminados++;
  }
  return { eliminados, omitido: false };
};

module.exports = { verificarCarga, subir, listar, accesoTemporal, revisar, limpiarCargas };
