const resumenService = require("../services/resumenService");

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

const obtenerResumenPorLive = async (req, res) => {
  try {
    const { liveId } = req.params;
    const vendedorId = obtenerVendedorId(req);

    const resumen = await resumenService.obtenerResumenPorLive(
      liveId,
      vendedorId
    );

    res.json(resumen);
  } catch (error) {
    responderError(res, error, "Error al obtener resumen del Live");
  }
};

module.exports = {
  obtenerResumenPorLive
};
