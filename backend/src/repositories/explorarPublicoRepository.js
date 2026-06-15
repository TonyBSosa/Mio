const Live = require("../models/lives");
const PerfilVendedor = require("../models/perfilVendedor");

const listarPerfilesActivos = () => {
  return PerfilVendedor.find({
    activo: true
  });
};

const listarEventosPublicos = () => {
  return Live.find({
    estado: { $in: ["activo", "programado"] }
  }).sort({ fecha: 1 });
};

const buscarPerfiles = (texto) => {
  return PerfilVendedor.find({
    activo: true,
    $or: [
      { nombrePublico: { $regex: texto, $options: "i" } },
      { descripcion: { $regex: texto, $options: "i" } }
    ]
  });
};

const buscarEventos = (texto) => {
  return Live.find({
    estado: { $in: ["activo", "programado"] },
    $or: [
      { nombre: { $regex: texto, $options: "i" } },
      { descripcion: { $regex: texto, $options: "i" } }
    ]
  }).sort({ fecha: 1 });
};

module.exports = {
  listarPerfilesActivos,
  listarEventosPublicos,
  buscarPerfiles,
  buscarEventos
};
