const { hashPassword, validarPassword } = require('./passwordPolicy');
const mongoose = require("mongoose");

const userRepository = require("../repositories/userRepository");

const ROLES_USUARIO = ["admin", "vendedor", "cliente"];
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
  const { nombre, email, password, rol, estado } = data;
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";
  const emailNormalizado =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!nombreLimpio || !emailNormalizado || !password) {
    throw crearError(400, "Nombre, email y password son obligatorios");
  }
  validarPassword(password);

  if (rol !== undefined) {
    validarRolUsuario(rol);
  }

  if (estado !== undefined) {
    validarEstadoUsuario(estado);
  }

  const usuarioExiste = await userRepository.buscarPorEmail(emailNormalizado);

  if (usuarioExiste) {
    throw crearError(409, "No se pudo guardar el usuario con esos datos");
  }

  const passwordHasheado = await hashPassword(password);
  const usuario = await userRepository.crearUsuario({
    nombre: nombreLimpio,
    email: emailNormalizado,
    password: passwordHasheado,
    rol,
    estado
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

  if (!usuario || usuario.deletedAt) {
    throw crearError(404, "Usuario no encontrado");
  }

  return usuario;
};

const actualizarUsuario = async (id, data, adminId) => {
  validarIdUsuario(id);

  const { nombre, email, password, rol, estado } = data;
  const datosActualizar = {};

  if (nombre !== undefined && !String(nombre).trim()) {
    throw crearError(400, "El nombre es obligatorio");
  }

  if (email !== undefined && !String(email).trim()) {
    throw crearError(400, "El email es obligatorio");
  }

  if (rol) {
    validarRolUsuario(rol);
    if (adminId && String(id) === String(adminId) && rol !== "admin") {
      throw crearError(400, "No puedes quitarte el rol de administrador");
    }
    datosActualizar.rol = rol;
  }

  if (estado) {
    validarEstadoUsuario(estado);
    if (adminId && String(id) === String(adminId) && estado !== "activo") {
      throw crearError(400, "No puedes inactivar tu propio usuario");
    }
    datosActualizar.estado = estado;
  }

  if (nombre !== undefined) datosActualizar.nombre = String(nombre).trim();

  if (email !== undefined) {
    const emailNormalizado = String(email).trim().toLowerCase();
    const existente = await userRepository.buscarPorEmail(emailNormalizado);
    if (existente && String(existente._id) !== String(id)) {
      throw crearError(409, "Ya existe un usuario con ese email");
    }
    datosActualizar.email = emailNormalizado;
  }

  if (password !== undefined) datosActualizar.password = await hashPassword(password);

  const usuario = await userRepository.actualizarPorId(id, datosActualizar);

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  if (datosActualizar.estado !== undefined) {
    await userRepository.sincronizarEstadoPerfilVendedor?.(
      id,
      datosActualizar.estado === "activo"
    );
  }

  return usuario;
};

const actualizarEstadoUsuario = async (id, estado, adminId) => {
  validarIdUsuario(id);

  if (!estado) {
    throw crearError(400, "El estado es obligatorio");
  }

  validarEstadoUsuario(estado);

  if (adminId && String(id) === String(adminId) && estado !== "activo") {
    throw crearError(400, "No puedes inactivar tu propio usuario");
  }

  const usuario = await userRepository.actualizarPorId(id, { estado });

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  await userRepository.sincronizarEstadoPerfilVendedor?.(
    id,
    estado === "activo"
  );

  return usuario;
};

const eliminarUsuario = async (id, adminId) => {
  validarIdUsuario(id);

  if (adminId && String(id) === String(adminId)) {
    throw crearError(400, "No puedes eliminar tu propio usuario");
  }

  // Baja lógica incluso con relaciones: conservar usuario, tienda e historial.
  const usuario = await userRepository.eliminarPorId(id);

  if (!usuario) {
    throw crearError(404, "Usuario no encontrado");
  }

  return {
    mensaje: "Cuenta dada de baja; se conserva su historial"
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
