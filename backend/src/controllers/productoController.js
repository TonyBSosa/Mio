const productoService = require("../services/productoService");

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

const crearProducto = async (req, res) => {
  try {
    const producto = await productoService.crearProducto(
      req.body,
      obtenerVendedorId(req)
    );

    res.status(201).json(producto);
  } catch (error) {
    responderError(res, error, "Error al crear producto");
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const productos = await productoService.listarProductos(obtenerVendedorId(req));

    res.json(productos);
  } catch (error) {
    responderError(res, error, "Error al obtener productos");
  }
};

const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await productoService.obtenerProductoPorId(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(producto);
  } catch (error) {
    responderError(res, error, "Error al obtener producto");
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const producto = await productoService.actualizarProducto(
      req.params.id,
      req.body,
      obtenerVendedorId(req)
    );

    res.json(producto);
  } catch (error) {
    responderError(res, error, "Error al actualizar producto");
  }
};

const actualizarEstadoProducto = async (req, res) => {
  try {
    const { estado } = req.body;
    const producto = await productoService.actualizarEstadoProducto(
      req.params.id,
      estado,
      obtenerVendedorId(req)
    );

    res.json(producto);
  } catch (error) {
    responderError(res, error, "Error al actualizar estado del producto");
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const respuesta = await productoService.eliminarProducto(
      req.params.id,
      obtenerVendedorId(req)
    );

    res.json(respuesta);
  } catch (error) {
    responderError(res, error, "Error al eliminar producto");
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  actualizarEstadoProducto,
  eliminarProducto
};
