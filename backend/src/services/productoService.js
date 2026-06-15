const mongoose = require("mongoose");

const productoRepository = require("../repositories/productoRepository");

const ESTADOS_PRODUCTO = ["activo", "inactivo", "apartado"];

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdProducto = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(400, "ID de producto invalido");
  }
};

const precioEsValido = (precio) => {
  if (precio === undefined || precio === null || precio === "") {
    return false;
  }

  const precioNumerico = Number(precio);

  return !Number.isNaN(precioNumerico) && precioNumerico >= 0;
};

const validarEstadoProducto = (estado) => {
  if (!ESTADOS_PRODUCTO.includes(estado)) {
    throw crearError(400, "Estado de producto invalido");
  }
};

const crearProducto = async (data, vendedorId) => {
  const { nombre, descripcion, categoria, precio, estado } = data;

  if (!nombre) {
    throw crearError(400, "El nombre del producto es obligatorio");
  }

  if (!precioEsValido(precio)) {
    throw crearError(400, "El precio es obligatorio y debe ser mayor o igual a 0");
  }

  if (estado !== undefined) {
    validarEstadoProducto(estado);
  }

  return productoRepository.crearProducto({
    vendedorId,
    nombre,
    descripcion,
    categoria,
    precio,
    estado
  });
};

const listarProductos = (vendedorId) => {
  return productoRepository.listarPorVendedor(vendedorId);
};

const obtenerProductoPorId = async (id, vendedorId) => {
  validarIdProducto(id);

  const producto = await productoRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!producto) {
    throw crearError(404, "Producto no encontrado");
  }

  return producto;
};

const actualizarProducto = async (id, data, vendedorId) => {
  validarIdProducto(id);

  const { nombre, descripcion, categoria, precio, estado } = data;

  if (nombre !== undefined && !nombre) {
    throw crearError(400, "El nombre del producto es obligatorio");
  }

  if (precio !== undefined && !precioEsValido(precio)) {
    throw crearError(400, "El precio debe ser mayor o igual a 0");
  }

  if (estado !== undefined) {
    validarEstadoProducto(estado);
  }

  const datosActualizar = {};

  if (nombre !== undefined) datosActualizar.nombre = nombre;
  if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
  if (categoria !== undefined) datosActualizar.categoria = categoria;
  if (precio !== undefined) datosActualizar.precio = precio;
  if (estado !== undefined) datosActualizar.estado = estado;

  const producto = await productoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    datosActualizar
  );

  if (!producto) {
    throw crearError(404, "Producto no encontrado");
  }

  return producto;
};

const actualizarEstadoProducto = async (id, estado, vendedorId) => {
  validarIdProducto(id);

  if (!estado) {
    throw crearError(400, "El estado es obligatorio");
  }

  validarEstadoProducto(estado);

  const producto = await productoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    { estado }
  );

  if (!producto) {
    throw crearError(404, "Producto no encontrado");
  }

  return producto;
};

const eliminarProducto = async (id, vendedorId) => {
  validarIdProducto(id);

  const producto = await productoRepository.eliminarPorIdYVendedor(id, vendedorId);

  if (!producto) {
    throw crearError(404, "Producto no encontrado");
  }

  return {
    mensaje: "Producto eliminado correctamente"
  };
};

module.exports = {
  crearProducto,
  listarProductos,
  obtenerProductoPorId,
  actualizarProducto,
  actualizarEstadoProducto,
  eliminarProducto
};
