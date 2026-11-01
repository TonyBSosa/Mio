const mongoose = require("mongoose");

const resumenRepository = require("../repositories/resumenRepository");

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdLive = (liveId) => {
  if (!mongoose.Types.ObjectId.isValid(liveId)) {
    throw crearError(400, "ID de Live invalido");
  }
};

const calcularTotalPedido = (pedido) => {
  const cantidad = Number(pedido.cantidad) || 0;
  const precio = Number(pedido.precio) || 0;

  return cantidad * precio;
};

const construirResumen = (liveId, nombreLive, pedidos) => {
  return pedidos.reduce(
    (acumulador, pedido) => {
      const totalPedido = calcularTotalPedido(pedido);

      acumulador.totalPedidos += 1;
      acumulador.totalVendido += totalPedido;

      if (pedido.estadoPago === "pagado") {
        acumulador.totalPagado += totalPedido;
      }

      if (pedido.estadoPago === "pendiente") {
        acumulador.totalPendientePago += totalPedido;
      }

      if (pedido.estadoEntrega === "entregado") {
        acumulador.totalEntregados += 1;
      }

      if (pedido.estadoEntrega === "pendiente") {
        acumulador.totalPendienteEntrega += 1;
      }

      return acumulador;
    },
    {
      liveId,
      nombreLive,
      totalPedidos: 0,
      totalVendido: 0,
      totalPagado: 0,
      totalPendientePago: 0,
      totalEntregados: 0,
      totalPendienteEntrega: 0
    }
  );
};

const obtenerResumenPorLive = async (liveId, vendedorId) => {
  if (liveId === "directa") {
    const pedidos =
      await resumenRepository.listarPedidosDirectosPorVendedor(vendedorId);

    return construirResumen(
      "directa",
      "Ventas directas (sin Live)",
      pedidos
    );
  }

  if (liveId === "todos") {
    const pedidos =
      await resumenRepository.listarTodosPedidosPorVendedor(vendedorId);

    return construirResumen(
      "todos",
      "Resumen general de la tienda",
      pedidos
    );
  }

  validarIdLive(liveId);

  const live = await resumenRepository.buscarLivePorIdYVendedor(
    liveId,
    vendedorId
  );

  if (!live) {
    throw crearError(404, "Live no encontrado");
  }

  const pedidos = await resumenRepository.listarPedidosPorLiveYVendedor(
    liveId,
    vendedorId
  );

  return construirResumen(live._id, live.nombre, pedidos);
};

module.exports = {
  obtenerResumenPorLive
};
