const mongoose = require("mongoose");

const liveRepository = require("../repositories/liveRepository");

const ESTADOS_LIVE = ["programado", "activo", "pausado", "finalizado", "cancelado"];

const TRANSICIONES_ESTADO = {
  programado: ["activo", "cancelado"],
  activo: ["pausado", "finalizado", "cancelado"],
  pausado: ["activo", "finalizado", "cancelado"],
  finalizado: [],
  cancelado: []
};

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

const normalizarEstadoLive = (estado) => {
  return String(estado).trim().toLowerCase();
};

const validarTransicionEstado = (estadoActual, estadoNuevo) => {
  if (estadoActual === estadoNuevo) {
    return;
  }

  const estadosPermitidos = TRANSICIONES_ESTADO[estadoActual] || [];

  if (!estadosPermitidos.includes(estadoNuevo)) {
    throw crearError(
      400,
      `No se puede cambiar un Live de ${estadoActual} a ${estadoNuevo}`
    );
  }
};

const validarUnicoLiveActivo = async (id, vendedorId) => {
  const liveActivo = await liveRepository.buscarOtroActivoPorVendedor(
    id,
    vendedorId
  );

  if (liveActivo) {
    throw crearError(
      400,
      "Ya existe un Live activo. Finalice o pause el Live actual antes de activar otro."
    );
  }
};

const validarNoExisteLiveActivo = async (vendedorId) => {
  const liveActivo = await liveRepository.buscarActivoPorVendedor(vendedorId);

  if (liveActivo) {
    throw crearError(
      400,
      "Ya existe un Live activo. Finalice o pause el Live actual antes de activar otro."
    );
  }
};

const normalizarFechaLive = (fecha) => {
  if (fecha === undefined || fecha === null || fecha === "") {
    return null;
  }

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) {
    throw crearError(400, "La fecha del Live no es valida");
  }

  return fechaObj;
};

const crearLive = async (data, vendedorId) => {
  const { nombre, descripcion, fecha, estado } = data;
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";
  const estadoNormalizado =
    estado !== undefined && estado !== "" ? normalizarEstadoLive(estado) : undefined;

  if (!nombreLimpio) {
    throw crearError(400, "El nombre del Live es obligatorio");
  }

  const fechaNormalizada =
    fecha !== undefined ? normalizarFechaLive(fecha) : undefined;

  if (estadoNormalizado !== undefined) {
    validarEstadoLive(estadoNormalizado);

    if (estadoNormalizado === "activo") {
      await validarNoExisteLiveActivo(vendedorId);
    }
  }

  return liveRepository.crearLive({
    nombre: nombreLimpio,
    descripcion: typeof descripcion === "string" ? descripcion.trim() : descripcion,
    fecha: fechaNormalizada || undefined,
    estado: estadoNormalizado,
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
  const estadoNormalizado =
    estado !== undefined && estado !== "" ? normalizarEstadoLive(estado) : undefined;

  if (nombre !== undefined && !String(nombre).trim()) {
    throw crearError(400, "El nombre del Live es obligatorio");
  }

  const fechaNormalizada =
    fecha !== undefined ? normalizarFechaLive(fecha) : undefined;

  if (estadoNormalizado !== undefined) {
    validarEstadoLive(estadoNormalizado);
  }

  const liveActual = await liveRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!liveActual) {
    throw crearError(404, "Live no encontrado");
  }

  if (estadoNormalizado !== undefined) {
    validarTransicionEstado(liveActual.estado, estadoNormalizado);

    if (estadoNormalizado === "activo") {
      await validarUnicoLiveActivo(id, vendedorId);
    }
  }

  const datosActualizar = {};

  if (nombre !== undefined) datosActualizar.nombre = String(nombre).trim();
  if (descripcion !== undefined) {
    datosActualizar.descripcion =
      typeof descripcion === "string" ? descripcion.trim() : descripcion;
  }
  if (fecha !== undefined) datosActualizar.fecha = fechaNormalizada;
  if (estadoNormalizado !== undefined) datosActualizar.estado = estadoNormalizado;

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

  const estadoNormalizado = normalizarEstadoLive(estado);

  validarEstadoLive(estadoNormalizado);

  const liveActual = await liveRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!liveActual) {
    throw crearError(404, "Live no encontrado");
  }

  validarTransicionEstado(liveActual.estado, estadoNormalizado);

  if (estadoNormalizado === "activo") {
    await validarUnicoLiveActivo(id, vendedorId);
  }

  const live = await liveRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    { estado: estadoNormalizado }
  );

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  return live;
};

const obtenerLiveActivoActual = (vendedorId) => {
  return liveRepository.buscarActivoPorVendedor(vendedorId);
};

const eliminarLive = async (id, vendedorId) => {
  validarIdLive(id);

  const liveActual = await liveRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!liveActual) {
    throw crearError(404, "Live no encontrado");
  }

  if (liveActual.estado === "activo") {
    throw crearError(
      409,
      "No se puede eliminar un Live activo. Finalízalo o cancélalo primero."
    );
  }

  const tienePedidos = await liveRepository.tienePedidosAsociados?.(
    id,
    vendedorId
  );

  if (tienePedidos) {
    throw crearError(
      409,
      "No se puede eliminar un Live que tiene pedidos registrados"
    );
  }

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
  obtenerLiveActivoActual,
  actualizarLive,
  actualizarEstadoLive,
  eliminarLive
};
