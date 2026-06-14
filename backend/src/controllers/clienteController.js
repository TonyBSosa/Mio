const clienteService = require("../services/clienteService");

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

const crearCliente = async (req, res) => {
  try {
    const cliente = await clienteService.crearCliente(
      req.body,
      obtenerVendedorId(req)
    );

    res.status(201).json(cliente);
  } catch (error) {
    responderError(res, error, "Error al crear cliente");
  }
};

const obtenerClientes = async (req, res) => {
  try {
    const clientes = await clienteService.listarClientes(obtenerVendedorId(req));

    res.json(clientes);
  } catch (error) {
    responderError(res, error, "Error al obtener clientes");
  }
};

const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await clienteService.obtenerClientePorId(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(cliente);
  } catch (error) {
    responderError(res, error, "Error al obtener cliente");
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const cliente = await clienteService.actualizarCliente(
      req.params.id,
      req.body,
      obtenerVendedorId(req)
    );

    res.json(cliente);
  } catch (error) {
    responderError(res, error, "Error al actualizar cliente");
  }
};

const eliminarCliente = async (req, res) => {
  try {
    const respuesta = await clienteService.eliminarCliente(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(respuesta);
  } catch (error) {
    responderError(res, error, "Error al eliminar cliente");
  }
};

module.exports = {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
};
