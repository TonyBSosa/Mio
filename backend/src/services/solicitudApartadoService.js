const mongoose = require('mongoose');
const repository = require('../repositories/solicitudApartadoRepository');
const policy = require('./reservasPruebaPolicy');
const expiracion = require('./expiracionReservasService');
const reloj = require('./reloj');

const presentar = solicitud => {
  const datos = solicitud?.toObject ? solicitud.toObject() : solicitud;
  if (!datos) return datos;
  const calculadoEn = reloj.ahora();
  return { ...datos, calculadoEn,
    tiempoRestanteSegundos: datos.estado === 'confirmada' && datos.venceEn
      ? Math.max(0, Math.ceil((new Date(datos.venceEn) - calculadoEn) / 1000)) : null,
  };
};

const error = (status, mensaje) => Object.assign(new Error(mensaje), { status });
const filtroPropio = usuario => {
  if (usuario.rol === 'cliente') return { compradorId: usuario._id };
  if (usuario.rol === 'vendedor') return { vendedorId: usuario._id };
  throw error(403, 'No tenés acceso a las solicitudes.');
};
const validarId = id => {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id) || !mongoose.Types.ObjectId.isValid(id)) {
    throw error(400, 'Identificador inválido.');
  }
};

const crear = async (datos, usuario) => {
  if (usuario.rol !== 'cliente') throw error(403, 'Solo los compradores pueden solicitar apartados.');
  const productoId = datos?.productoId;
  validarId(productoId);
  await expiracion.procesar({ productoId });
  const producto = await repository.buscarProducto(productoId);
  if (!producto) throw error(404, 'Producto no encontrado.');
  if (producto.estado !== 'activo' || producto.reservaSolicitudId) throw error(409, 'El producto ya no está disponible.');
  const vendedor = await repository.buscarVendedor(producto.vendedorId);
  if (!vendedor || vendedor.deletedAt || require('../config/verificacionConfig').pendienteNueva(vendedor)) throw error(404, 'La tienda ya no está disponible.');
  if (!vendedor.emailVerifiedAt && require('../config/verificacionConfig').modoHistorico() === 'sensitive') {
    throw error(409, 'La tienda debe confirmar su correo antes de recibir nuevas solicitudes.');
  }
  const perfil = await repository.buscarPerfil(producto.vendedorId);
  try {
    return await repository.crear({
      compradorId: usuario._id,
      vendedorId: producto.vendedorId,
      productoId: producto._id,
      compradorNombre: usuario.nombre,
      productoNombre: producto.nombre,
      productoCodigo: producto.codigo || '',
      tiendaNombre: perfil?.nombrePublico || vendedor.nombre,
      precioRegistrado: producto.precio,
      estado: 'pendiente',
    });
  } catch (causa) {
    if (causa.code === 11000) throw error(409, 'Ya tenés una solicitud pendiente para este producto.');
    throw causa;
  }
};

const listar = async usuario => {
  const filtro = filtroPropio(usuario);
  await expiracion.procesar(filtro);
  return (await repository.listar(filtro)).map(presentar);
};
const obtener = async (id, usuario) => {
  validarId(id);
  await expiracion.procesar(filtroPropio(usuario));
  const solicitud = await repository.buscarPropia({ _id: id, ...filtroPropio(usuario) });
  if (!solicitud) throw error(404, 'Solicitud no encontrada.');
  return presentar(solicitud);
};

const configuracion = async usuario => {
  if (usuario.rol !== 'vendedor') throw error(403, 'Solo el vendedor puede configurar sus reservas.');
  const perfil = await repository.buscarConfiguracion(usuario._id);
  const permiso = await policy(usuario._id);
  return { plazoReservaDias: perfil?.plazoReservaDias || 3, confirmacionPruebaHabilitada: permiso.habilitada, motivo: permiso.motivo };
};
const guardarConfiguracion = async (datos, usuario) => {
  if (usuario.rol !== 'vendedor') throw error(403, 'Solo el vendedor puede configurar sus reservas.');
  if (![3, 7].includes(datos?.plazoReservaDias)) throw error(400, 'El plazo debe ser de 3 o 7 días.');
  await repository.guardarPlazo(usuario._id, datos.plazoReservaDias);
  return configuracion(usuario);
};
const resolver = async (id, accion, usuario) => {
  if (usuario.rol !== 'vendedor') throw error(403, 'Solo el vendedor puede gestionar solicitudes.');
  validarId(id);
  const filtro = { _id: id, vendedorId: usuario._id };
  let solicitud = await repository.buscarPropia(filtro);
  if (!solicitud) throw error(404, 'Solicitud no encontrada.');
  await expiracion.procesar({ productoId: solicitud.productoId });
  solicitud = await repository.buscarPropia(filtro);
  if (!solicitud) throw error(404, 'Solicitud no encontrada.');
  if (solicitud.estado !== 'pendiente') throw error(409, 'La solicitud ya no está pendiente.');
  if (accion === 'rechazar') {
    const resultado = await repository.rechazar(filtro);
    if (!resultado) throw error(409, 'La solicitud ya no está pendiente.');
    const eliminada = resultado.toObject ? resultado.toObject() : resultado;
    return presentar({ ...eliminada, estado: 'rechazada', eliminada: true });
  }
  if (accion !== 'confirmar') throw error(400, 'Acción no válida.');
  const permiso = await policy(usuario._id);
  if (!permiso.habilitada) throw error(503, permiso.motivo);
  const perfil = await repository.buscarConfiguracion(usuario._id);
  try { return presentar(await repository.confirmar(filtro, perfil?.plazoReservaDias || 3)); }
  catch (causa) {
    if (causa.code === 20 || causa.code === 303) throw error(503, 'Se necesitan transacciones para confirmar de forma segura.');
    throw causa;
  }
};

const cancelar = async (id, usuario) => {
  if (usuario.rol !== 'cliente') throw error(403, 'Solo el comprador puede cancelar su apartado.');
  validarId(id);
  const filtro = { _id: id, compradorId: usuario._id };
  let eliminada = await repository.cancelarPendiente(filtro);
  if (!eliminada) {
    const actual = await repository.buscarPropia(filtro);
    if (!actual) throw error(404, 'Apartado no encontrado.');
    if (actual.estado !== 'confirmada' || actual.comprobanteRecibidoEn || actual.comprobanteActualId || actual.pedidoId) {
      throw error(409, 'Solo podés cancelar solicitudes pendientes o reservas sin comprobantes ni pagos.');
    }
    if (!policy.esEntornoPruebasAislado()) throw error(503, 'La cancelación de una reserva confirmada necesita el entorno de pruebas con transacciones.');
    eliminada = await repository.cancelarConfirmada(filtro);
  }
  return { _id: eliminada._id, estado: 'cancelada', eliminada: true };
};

module.exports = { crear, listar, obtener, configuracion, guardarConfiguracion, resolver, cancelar };
