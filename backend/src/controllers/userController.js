const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/users");

const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        mensaje: "Nombre, email y password son obligatorios"
      });
    }

    const usuarioExiste = await User.findOne({ email });

    if (usuarioExiste) {
      return res.status(400).json({
        mensaje: "Ya existe un usuario con ese email"
      });
    }

    const passwordHasheado = await bcrypt.hash(password, 10);

    const usuario = await User.create({
      nombre,
      email,
      password: passwordHasheado,
      rol
    });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear usuario",
      error: error.message
    });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await User.find();

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener usuarios",
      error: error.message
    });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de usuario invalido"
      });
    }

    const usuario = await User.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener usuario",
      error: error.message
    });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de usuario invalido"
      });
    }

    const datosActualizar = {};

    if (nombre) datosActualizar.nombre = nombre;
    if (email) datosActualizar.email = email;
    if (rol) datosActualizar.rol = rol;
    if (estado) datosActualizar.estado = estado;
    if (password) datosActualizar.password = await bcrypt.hash(password, 10);

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      datosActualizar,
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar usuario",
      error: error.message
    });
  }
};

const actualizarEstadoUsuario = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de usuario invalido"
      });
    }

    if (!estado) {
      return res.status(400).json({
        mensaje: "El estado es obligatorio"
      });
    }

    const usuario = await User.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar estado del usuario",
      error: error.message
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de usuario invalido"
      });
    }

    const usuario = await User.findByIdAndDelete(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado"
      });
    }

    res.json({
      mensaje: "Usuario eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar usuario",
      error: error.message
    });
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
