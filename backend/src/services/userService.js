const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userRepository = require("../repositories/userRepository");

const ROLES_USUARIO = ["admin", "vendedor"];
const ESTADOS_USUARIO = ["activo", "inactivo"];

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdUsuario = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(400, "ID de usuario invalido");
  }
};

const validarRolUsuario = (rol) => {
  if (!ROLES_USUARIO.includes(rol)) {
    throw crearError(400, "Rol de usuario invalido");
  }
};

const validarEstadoUsuario = (estado) => {
  if (!ESTADOS_USUARIO.includes(estado)) {
    throw crearError(400, "Estado de usuario invalido");
  }
};

const crearUsuario = async (data) => {
  const { nombre, email, password, rol } = data;

  if (!nombre || !email || !password) {
    throw crearError(400, "Nombre, email y password son obligatorios");
  }

  if (rol !== undefined) {
    validarRolUsuario(rol);
  }

  const usuarioExiste = await userRepository.buscarPorEmail(email);

  if (usuarioExiste) {
    throw crearError(400, "Ya existe un usuario con ese email");
  }

  const passwordHasheado = await bcrypt.hash(password, 10);
  const usuario = await userRepository.crearUsuario({
    nombre,
    email,
    password: passwordHasheado,
    rol
  });

  return {
    _id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    estado: usuario.estado
  };
};

const listarUsuarios = () => {
  return userRepository.listarUsuarios();
};

const obtenerUsuarioPorId = async (id) => {
  validarIdUsuario(id);

  const usuario = await userRepository.buscarPorId(id);

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  return usuario;
};

const actualizarUsuario = async (id, data) => {
  validarIdUsuario(id);

  const { nombre, email, password, rol, estado } = data;
  const datosActualizar = {};

  if (rol) {
    validarRolUsuario(rol);
    datosActualizar.rol = rol;
  }

  if (estado) {
    validarEstadoUsuario(estado);
    datosActualizar.estado = estado;
  }

  if (nombre) datosActualizar.nombre = nombre;
  if (email) datosActualizar.email = email;
  if (password) datosActualizar.password = await bcrypt.hash(password, 10);

  const usuario = await userRepository.actualizarPorId(id, datosActualizar);

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  return usuario;
};

const actualizarEstadoUsuario = async (id, estado) => {
  validarIdUsuario(id);

  if (!estado) {
    throw crearError(400, "El estado es obligatorio");
  }

  validarEstadoUsuario(estado);

  const usuario = await userRepository.actualizarPorId(id, { estado });

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  return usuario;
};

const eliminarUsuario = async (id) => {
  validarIdUsuario(id);

  const usuario = await userRepository.eliminarPorId(id);

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  return {
    mensaje: "Usuario eliminado correctamente"
  };
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  actualizarEstadoUsuario,
  eliminarUsuario
};
