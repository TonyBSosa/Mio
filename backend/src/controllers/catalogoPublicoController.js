const catalogoPublicoService = require("../services/catalogoPublicoService");

const responderError = (res, error, mensajeDefault) => {
  if (error.status) {
    return res.status(error.status).json({
      mensaje: error.mensaje || error.message
    });
  }

  return res.status(500).json({
    mensaje: mensajeDefault,
    error: error.message
  });
};

const obtenerCatalogo = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const catalogo = await catalogoPublicoService.obtenerCatalogo(
      req.params.vendedorId
    );

    res.json(catalogo);
  } catch (error) {
    responderError(res, error, "Error al obtener catalogo publico");
  }
};

module.exports = {
  obtenerCatalogo
};
