const explorarPublicoService = require("../services/explorarPublicoService");

const responderError = (res, error, mensajeDefault) => {
  return res.status(500).json({
    mensaje: mensajeDefault,
    error: error.message
  });
};

const listarVendedores = async (req, res) => {
  try {
    const vendedores = await explorarPublicoService.listarVendedores();

    res.json(vendedores);
  } catch (error) {
    responderError(res, error, "Error al listar vendedores publicos");
  }
};

const listarEventos = async (req, res) => {
  try {
    const eventos = await explorarPublicoService.listarEventos();

    res.json(eventos);
  } catch (error) {
    responderError(res, error, "Error al listar eventos publicos");
  }
};

const buscar = async (req, res) => {
  try {
    const resultado = await explorarPublicoService.buscar(req.query.texto || "");

    res.json(resultado);
  } catch (error) {
    responderError(res, error, "Error al buscar informacion publica");
  }
};

module.exports = {
  listarVendedores,
  listarEventos,
  buscar
};
