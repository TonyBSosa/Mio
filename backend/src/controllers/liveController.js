const liveService = require("../services/liveService");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const responderError = (res, error, mensajeDefault) => {
  if (error.status) {
    return res.status(error.status).json({
      mensaje: error.mensaje
    });
  }

  return res.status(500).json({
    mensaje: mensajeDefault,
    error: error.message
  });
};

const crearLive = async (req, res) => {
  try {
    const live = await liveService.crearLive(
      req.body,
      obtenerVendedorId(req)
    );

    res.status(201).json(live);
  } catch (error) {
    responderError(res, error, "Error al crear Live");
  }
};

const obtenerLives = async (req, res) => {
  try {
    const lives = await liveService.listarLives(obtenerVendedorId(req));

    res.json(lives);
  } catch (error) {
    responderError(res, error, "Error al obtener Lives");
  }
};

const obtenerLivePorId = async (req, res) => {
  try {
    const live = await liveService.obtenerLivePorId(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(live);
  } catch (error) {
    responderError(res, error, "Error al obtener Live");
  }
};

const actualizarLive = async (req, res) => {
  try {
    const live = await liveService.actualizarLive(
      req.params.id,
      req.body,
      obtenerVendedorId(req)
    );

    res.json(live);
  } catch (error) {
    responderError(res, error, "Error al actualizar Live");
  }
};

const actualizarEstadoLive = async (req, res) => {
  try {
    const { estado } = req.body;
    const live = await liveService.actualizarEstadoLive(
      req.params.id,
      estado,
      obtenerVendedorId(req)
    );

    res.json(live);
  } catch (error) {
    responderError(res, error, "Error al actualizar estado del Live");
  }
};

const eliminarLive = async (req, res) => {
  try {
    const respuesta = await liveService.eliminarLive(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(respuesta);
  } catch (error) {
    responderError(res, error, "Error al eliminar Live");
  }
};

module.exports = {
  crearLive,
  obtenerLives,
  obtenerLivePorId,
  actualizarLive,
  actualizarEstadoLive,
  eliminarLive
};
