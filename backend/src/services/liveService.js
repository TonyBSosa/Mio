const mongoose = require("mongoose");

const liveRepository = require("../repositories/liveRepository");

const ESTADOS_LIVE = ["programado", "activo", "finalizado", "cancelado"];

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdLive = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(400, "ID de Live invalido");
  }
};

const validarEstadoLive = (estado) => {
  if (!ESTADOS_LIVE.includes(estado)) {
    throw crearError(400, "Estado de Live invalido");
  }
};

const crearLive = async (data, vendedorId) => {
  const { nombre, descripcion, fecha, estado } = data;

  if (!nombre) {
    throw crearError(400, "El nombre del Live es obligatorio");
  }

  if (estado !== undefined) {
    validarEstadoLive(estado);
  }

  return liveRepository.crearLive({
    nombre,
    descripcion,
    fecha,
    estado,
    vendedorId
  });
};

const listarLives = (vendedorId) => {
  return liveRepository.listarPorVendedor(vendedorId);
};

const obtenerLivePorId = async (id, vendedorId) => {
  validarIdLive(id);

  const live = await liveRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  return live;
};

const actualizarLive = async (id, data, vendedorId) => {
  validarIdLive(id);

  const { nombre, descripcion, fecha, estado } = data;

  if (nombre !== undefined && !nombre) {
    throw crearError(400, "El nombre del Live es obligatorio");
  }

  if (estado !== undefined) {
    validarEstadoLive(estado);
  }

  const datosActualizar = {};

  if (nombre !== undefined) datosActualizar.nombre = nombre;
  if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
  if (fecha !== undefined) datosActualizar.fecha = fecha;
  if (estado !== undefined) datosActualizar.estado = estado;

  const live = await liveRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    datosActualizar
  );

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  return live;
};

const actualizarEstadoLive = async (id, estado, vendedorId) => {
  validarIdLive(id);

  if (!estado) {
    throw crearError(400, "El estado es obligatorio");
  }

  validarEstadoLive(estado);

  const live = await liveRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    { estado }
  );

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  return live;
};

const eliminarLive = async (id, vendedorId) => {
  validarIdLive(id);

  const live = await liveRepository.eliminarPorIdYVendedor(id, vendedorId);

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  return {
    mensaje: "Live eliminado correctamente"
  };
};

module.exports = {
  crearLive,
  listarLives,
  obtenerLivePorId,
  actualizarLive,
  actualizarEstadoLive,
  eliminarLive
};
