const mongoose = require("mongoose");
const Live = require("../models/lives");
const PerfilVendedor = require("../models/perfilVendedor");
const User = require("../models/users");

const escaparRegex = (texto) => {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const listarVendedoresUsuariosActivos = async () => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  return User.find({
    rol: "vendedor",
    estado: "activo"
  }).select("_id nombre estado rol");
};

const listarPerfilesActivos = () => {
  return PerfilVendedor.find({
    activo: true
  });
};

const listarEventosPublicos = () => {
  return Live.find({
    estado: { $in: ["activo", "programado"] }
  }).sort({ fecha: 1, createdAt: -1 });
};

const buscarPerfiles = (texto) => {
  const patron = escaparRegex(texto.trim());

  return PerfilVendedor.find({
    activo: true,
    $or: [
      { nombrePublico: { $regex: patron, $options: "i" } },
      { descripcion: { $regex: patron, $options: "i" } }
    ]
  });
};

const buscarEventos = (texto) => {
  const patron = escaparRegex(texto.trim());

  return Live.find({
    estado: { $in: ["activo", "programado"] },
    $or: [
      { nombre: { $regex: patron, $options: "i" } },
      { descripcion: { $regex: patron, $options: "i" } }
    ]
  }).sort({ fecha: 1, createdAt: -1 });
};

module.exports = {
  escaparRegex,
  listarVendedoresUsuariosActivos,
  listarPerfilesActivos,
  listarEventosPublicos,
  buscarPerfiles,
  buscarEventos
};
