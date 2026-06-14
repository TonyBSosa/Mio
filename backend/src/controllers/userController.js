const userService = require("../services/userService");

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

const crearUsuario = async (req, res) => {
  try {
    const usuario = await userService.crearUsuario(req.body);

    res.status(201).json(usuario);
  } catch (error) {
    responderError(res, error, "Error al crear usuario");
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await userService.listarUsuarios();

    res.json(usuarios);
  } catch (error) {
    responderError(res, error, "Error al obtener usuarios");
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await userService.obtenerUsuarioPorId(req.params.id);

    res.json(usuario);
  } catch (error) {
    responderError(res, error, "Error al obtener usuario");
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const usuario = await userService.actualizarUsuario(
      req.params.id,
      req.body
    );

    res.json(usuario);
  } catch (error) {
    responderError(res, error, "Error al actualizar usuario");
  }
};

const actualizarEstadoUsuario = async (req, res) => {
  try {
    const { estado } = req.body;
    const usuario = await userService.actualizarEstadoUsuario(
      req.params.id,
      estado
    );

    res.json(usuario);
  } catch (error) {
    responderError(res, error, "Error al actualizar estado del usuario");
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const respuesta = await userService.eliminarUsuario(req.params.id);

    res.json(respuesta);
  } catch (error) {
    responderError(res, error, "Error al eliminar usuario");
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  actualizarEstadoUsuario,
  eliminarUsuario
};
