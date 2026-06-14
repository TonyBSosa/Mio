const perfilVendedorService = require("../services/perfilVendedorService");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const obtenerMiPerfil = async (req, res) => {
  try {
    const perfil = await perfilVendedorService.obtenerMiPerfil(
      obtenerVendedorId(req)
    );

    res.json(perfil);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener perfil del vendedor",
      error: error.message
    });
  }
};

const guardarMiPerfil = async (req, res) => {
  try {
    const perfil = await perfilVendedorService.guardarMiPerfil(
      obtenerVendedorId(req),
      req.body
    );

    res.json(perfil);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al guardar perfil del vendedor",
      error: error.message
    });
  }
};

module.exports = {
  obtenerMiPerfil,
  guardarMiPerfil
};
