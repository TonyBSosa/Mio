const pedidoService = require("../services/pedidoService");

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

const crearPedido = async (req, res) => {
  try {
    const pedido = await pedidoService.crearPedido(
      req.body,
      obtenerVendedorId(req)
    );

    res.status(201).json(pedido);
  } catch (error) {
    responderError(res, error, "Error al crear pedido");
  }
};

const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await pedidoService.listarPedidos(obtenerVendedorId(req));

    res.json(pedidos);
  } catch (error) {
    responderError(res, error, "Error al obtener pedidos");
  }
};

const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await pedidoService.obtenerPedidoPorId(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(pedido);
  } catch (error) {
    responderError(res, error, "Error al obtener pedido");
  }
};

const actualizarPedido = async (req, res) => {
  try {
    const pedido = await pedidoService.actualizarPedido(
      req.params.id,
      req.body,
      obtenerVendedorId(req)
    );

    res.json(pedido);
  } catch (error) {
    responderError(res, error, "Error al actualizar pedido");
  }
};

const actualizarPagoPedido = async (req, res) => {
  try {
    const { estadoPago } = req.body;
    const pedido = await pedidoService.actualizarPagoPedido(
      req.params.id,
      estadoPago,
      obtenerVendedorId(req)
    );

    res.json(pedido);
  } catch (error) {
    responderError(res, error, "Error al actualizar pago del pedido");
  }
};

const actualizarEntregaPedido = async (req, res) => {
  try {
    const { estadoEntrega } = req.body;
    const pedido = await pedidoService.actualizarEntregaPedido(
      req.params.id,
      estadoEntrega,
      obtenerVendedorId(req)
    );

    res.json(pedido);
  } catch (error) {
    responderError(res, error, "Error al actualizar entrega del pedido");
  }
};

const eliminarPedido = async (req, res) => {
  try {
    const respuesta = await pedidoService.eliminarPedido(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(respuesta);
  } catch (error) {
    responderError(res, error, "Error al eliminar pedido");
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  actualizarPagoPedido,
  actualizarEntregaPedido,
  eliminarPedido
};
