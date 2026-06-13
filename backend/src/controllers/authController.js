const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/users");

const generarToken = (usuarioId) => {
  return jwt.sign({ id: usuarioId }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};

const registrar = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

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
      password: passwordHasheado
    });

    res.status(201).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      token: generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al registrar usuario",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        mensaje: "Email y password son obligatorios"
      });
    }

    const usuario = await User.findOne({ email }).select("+password");

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Credenciales invalidas"
      });
    }

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        mensaje: "Usuario inactivo"
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Credenciales invalidas"
      });
    }

    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      token: generarToken(usuario._id)
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al iniciar sesion",
      error: error.message
    });
  }
};

const obtenerPerfil = async (req, res) => {
  res.json(req.usuario);
};

module.exports = {
  registrar,
  login,
  obtenerPerfil
};
