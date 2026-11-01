const mongoose = require("mongoose");
const { randomBytes } = require("node:crypto");

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

const normalizarCodigo = (codigo) => {
  if (codigo === undefined || codigo === "") return undefined;
  if (typeof codigo !== "string") throw crearError(400, "Codigo de producto invalido");
  const valor = codigo.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,29}$/.test(valor)) {
    throw crearError(400, "El codigo debe tener entre 1 y 30 letras, numeros, guiones o guiones bajos");
  }
  return valor;
};

const guardarConCodigo = async (operacion) => {
  try {
    return await operacion();
  } catch (error) {
    if (
      error.code === 11000 &&
      (error.keyPattern?.codigo || String(error.message || "").includes("codigo"))
    ) {
      throw crearError(409, "Ya existe un producto con ese codigo en tu tienda");
    }
    throw error;
  }
};

const precioEsValido = (precio) => {
  if (precio === undefined || precio === null || precio === "") {
    return false;
  }

  const precioNumerico = Number(precio);

  return Number.isFinite(precioNumerico) && precioNumerico >= 0;
};

const validarEstadoProducto = (estado) => {
  if (!ESTADOS_PRODUCTO.includes(estado)) {
    throw crearError(400, "Estado de producto invalido");
  }
};

const crearProducto = async (data, vendedorId) => {
  const { nombre, descripcion, categoria, foto, precio, estado } = data;
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";

  if (!nombreLimpio) {
    throw crearError(400, "El nombre del producto es obligatorio");
  }

  if (!precioEsValido(precio)) {
    throw crearError(400, "El precio es obligatorio y debe ser mayor o igual a 0");
  }

  if (estado !== undefined) {
    validarEstadoProducto(estado);
  }

  const codigo = normalizarCodigo(data.codigo) || `P-${randomBytes(6).toString("hex").toUpperCase()}`;
  return guardarConCodigo(() => productoRepository.crearProducto({
    vendedorId,
    codigo,
    nombre: nombreLimpio,
    descripcion,
    categoria,
    foto,
    precio,
    estado
  }));
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

  const { nombre, descripcion, categoria, foto, precio, estado } = data;

  if (nombre !== undefined && !String(nombre).trim()) {
    throw crearError(400, "El nombre del producto es obligatorio");
  }

  if (precio !== undefined && !precioEsValido(precio)) {
    throw crearError(400, "El precio debe ser mayor o igual a 0");
  }

  if (estado !== undefined) {
    validarEstadoProducto(estado);

    if (estado === "activo" || estado === "inactivo") {
      const tienePedidos = await productoRepository.tienePedidosAsociados?.(
        id,
        vendedorId
      );
      if (tienePedidos) {
        throw crearError(
          409,
          "No se puede cambiar la disponibilidad de una pieza vinculada a un pedido"
        );
      }
    }
  }

  const datosActualizar = {};
  const codigo = normalizarCodigo(data.codigo);
  if (codigo !== undefined) datosActualizar.codigo = codigo;

  if (nombre !== undefined) datosActualizar.nombre = String(nombre).trim();
  if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
  if (categoria !== undefined) datosActualizar.categoria = categoria;
  if (foto !== undefined) datosActualizar.foto = foto;
  if (precio !== undefined) datosActualizar.precio = precio;
  if (estado !== undefined) datosActualizar.estado = estado;

  const producto = await guardarConCodigo(() => productoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    datosActualizar
  ));

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

  if (estado === "activo" || estado === "inactivo") {
    const tienePedidos = await productoRepository.tienePedidosAsociados?.(
      id,
      vendedorId
    );
    if (tienePedidos) {
      throw crearError(
        409,
        "No se puede cambiar la disponibilidad de una pieza vinculada a un pedido"
      );
    }
  }

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

  const tienePedidos = await productoRepository.tienePedidosAsociados?.(
    id,
    vendedorId
  );

  if (tienePedidos) {
    throw crearError(
      409,
      "No se puede eliminar un producto que tiene pedidos asociados"
    );
  }

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
