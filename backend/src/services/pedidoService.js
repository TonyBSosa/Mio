const mongoose = require("mongoose");

const pedidoRepository = require("../repositories/pedidoRepository");

const ESTADOS_PAGO = ["pendiente", "pagado"];
const ESTADOS_ENTREGA = ["pendiente", "entregado"];

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdPedido = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(400, "ID de pedido invalido");
  }
};

const validarIdCliente = (clienteId) => {
  if (!mongoose.Types.ObjectId.isValid(clienteId)) {
    throw crearError(400, "ID de cliente invalido");
  }
};

const validarIdLive = (liveId) => {
  if (!mongoose.Types.ObjectId.isValid(liveId)) {
    throw crearError(400, "ID de Live invalido");
  }
};

const numeroValido = (valor, minimo) => {
  if (valor === undefined || valor === null || valor === "") {
    return false;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) && numero >= minimo;
};

const validarEstadoPago = (estadoPago) => {
  if (!ESTADOS_PAGO.includes(estadoPago)) {
    throw crearError(400, "Estado de pago invalido");
  }
};

const validarEstadoEntrega = (estadoEntrega) => {
  if (!ESTADOS_ENTREGA.includes(estadoEntrega)) {
    throw crearError(400, "Estado de entrega invalido");
  }
};

const validarClienteYLive = async (
  clienteId,
  liveId,
  vendedorId,
  requerirLiveActivo = false
) => {
  validarIdCliente(clienteId);
  if (liveId) validarIdLive(liveId);

  const cliente = await pedidoRepository.buscarClientePorIdYVendedor(
    clienteId,
    vendedorId
  );

  if (!cliente) {
    throw crearError(404, "Cliente no encontrado");
  }

  if (!liveId) return;

  const live = await pedidoRepository.buscarLivePorIdYVendedor(
    liveId,
    vendedorId
  );

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  if (requerirLiveActivo && live.estado !== "activo") {
    throw crearError(400, "Solo se pueden registrar pedidos en un Live activo.");
  }
};

const crearPedido = async (data, vendedorId) => {
  const {
    clienteId,
    liveId,
    producto,
    cantidad,
    precio,
    estadoPago,
    estadoEntrega,
    observaciones
  } = data;

  if (!clienteId) {
    throw crearError(400, "El clienteId es obligatorio");
  }

  const productoNombre = typeof producto === "string" ? producto.trim() : "";

  if (!productoNombre && !data.productoId) {
    throw crearError(400, "El producto es obligatorio");
  }

  if (!numeroValido(precio, 0)) {
    throw crearError(400, "El precio es obligatorio y debe ser mayor o igual a 0");
  }

  if (cantidad !== undefined && !numeroValido(cantidad, 1)) {
    throw crearError(400, "La cantidad debe ser mayor o igual a 1");
  }

  if (estadoPago !== undefined) {
    validarEstadoPago(estadoPago);
  }

  if (estadoEntrega !== undefined) {
    validarEstadoEntrega(estadoEntrega);
  }

  await validarClienteYLive(clienteId, liveId, vendedorId, true);

  let pieza;
  if (data.productoId) {
    if (!mongoose.Types.ObjectId.isValid(data.productoId)) {
      throw crearError(400, "ID de producto invalido");
    }
    pieza = await pedidoRepository.buscarProductoPorIdYVendedor(data.productoId, vendedorId);
    if (!pieza) throw crearError(404, "Producto no encontrado");
    if (pieza.estado !== "activo") throw crearError(409, "La pieza no esta disponible");
    if (cantidad !== undefined && Number(cantidad) !== 1) {
      throw crearError(400, "Una pieza unica debe tener cantidad 1");
    }

    const piezaApartada = await pedidoRepository.apartarProductoPorIdYVendedor(
      pieza._id || data.productoId,
      vendedorId
    );

    if (!piezaApartada) {
      throw crearError(409, "La pieza no esta disponible");
    }
  }

  try {
    return await pedidoRepository.crearPedido({
      clienteId,
      liveId: liveId || undefined,
      productoId: pieza?._id,
      vendedorId,
      producto: pieza ? pieza.nombre : productoNombre,
      cantidad: pieza ? 1 : cantidad,
      precio,
      estadoPago,
      estadoEntrega,
      observaciones
    });
  } catch (error) {
    if (pieza?._id) {
      await pedidoRepository.liberarProductoPorIdYVendedor(pieza._id, vendedorId);
    }
    throw error;
  }
};

const listarPedidos = (vendedorId) => {
  return pedidoRepository.listarPorVendedor(vendedorId);
};

const obtenerPedidoPorId = async (id, vendedorId) => {
  validarIdPedido(id);

  const pedido = await pedidoRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!pedido) {
    throw crearError(404, "Pedido no encontrado");
  }

  return pedido;
};

const actualizarPedido = async (id, data, vendedorId) => {
  validarIdPedido(id);

  const {
    clienteId,
    liveId,
    producto,
    cantidad,
    precio,
    estadoPago,
    estadoEntrega,
    observaciones
  } = data;

  if (precio !== undefined && !numeroValido(precio, 0)) {
    throw crearError(400, "El precio debe ser mayor o igual a 0");
  }

  if (cantidad !== undefined && !numeroValido(cantidad, 1)) {
    throw crearError(400, "La cantidad debe ser mayor o igual a 1");
  }

  if (estadoPago !== undefined) {
    validarEstadoPago(estadoPago);
  }

  if (estadoEntrega !== undefined) {
    validarEstadoEntrega(estadoEntrega);
  }

  const pedidoActual = await pedidoRepository.buscarPorIdYVendedor(
    id,
    vendedorId
  );

  if (!pedidoActual) {
    throw crearError(404, "Pedido no encontrado");
  }

  if (data.productoId && String(data.productoId) !== String(pedidoActual.productoId || "")) {
    throw crearError(400, "No se puede cambiar la pieza de un pedido existente");
  }
  if (pedidoActual.productoId) {
    if ((producto !== undefined && producto !== pedidoActual.producto) ||
        (cantidad !== undefined && Number(cantidad) !== 1)) {
      throw crearError(400, "La pieza y su cantidad no se pueden cambiar");
    }
  } else if (producto !== undefined && !String(producto).trim()) {
    throw crearError(400, "El producto es obligatorio");
  }

  const clienteIdFinal =
    clienteId !== undefined ? clienteId : pedidoActual.clienteId;
  const liveIdFinal = liveId !== undefined ? liveId : pedidoActual.liveId;

  await validarClienteYLive(clienteIdFinal, liveIdFinal, vendedorId);

  const datosActualizar = {};

  if (clienteId !== undefined) datosActualizar.clienteId = clienteId;
  if (liveId !== undefined) datosActualizar.liveId = liveId || null;
  if (producto !== undefined) datosActualizar.producto = String(producto).trim();
  if (cantidad !== undefined) datosActualizar.cantidad = cantidad;
  if (precio !== undefined) datosActualizar.precio = precio;
  if (estadoPago !== undefined) datosActualizar.estadoPago = estadoPago;
  if (estadoEntrega !== undefined) datosActualizar.estadoEntrega = estadoEntrega;
  if (observaciones !== undefined) datosActualizar.observaciones = observaciones;

  const pedido = await pedidoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    datosActualizar
  );

  if (!pedido) {
    throw crearError(404, "Pedido no encontrado");
  }

  return pedido;
};

const actualizarPagoPedido = async (id, estadoPago, vendedorId) => {
  validarIdPedido(id);

  if (!estadoPago) {
    throw crearError(400, "El estadoPago es obligatorio");
  }

  validarEstadoPago(estadoPago);

  const pedido = await pedidoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    { estadoPago }
  );

  if (!pedido) {
    throw crearError(404, "Pedido no encontrado");
  }

  return pedido;
};

const actualizarEntregaPedido = async (id, estadoEntrega, vendedorId) => {
  validarIdPedido(id);

  if (!estadoEntrega) {
    throw crearError(400, "El estadoEntrega es obligatorio");
  }

  validarEstadoEntrega(estadoEntrega);

  const pedido = await pedidoRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    { estadoEntrega }
  );

  if (!pedido) {
    throw crearError(404, "Pedido no encontrado");
  }

  return pedido;
};

const eliminarPedido = async (id, vendedorId) => {
  validarIdPedido(id);

  const pedido = await pedidoRepository.eliminarPorIdYVendedor(id, vendedorId);

  if (!pedido) {
    throw crearError(404, "Pedido no encontrado");
  }

  if (pedido.productoId) {
    await pedidoRepository.liberarProductoPorIdYVendedor(
      pedido.productoId,
      vendedorId
    );
  }

  return {
    mensaje: "Pedido eliminado correctamente"
  };
};

module.exports = {
  crearPedido,
  listarPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  actualizarPagoPedido,
  actualizarEntregaPedido,
  eliminarPedido
};
