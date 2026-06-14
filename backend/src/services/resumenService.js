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

const obtenerResumenPorLive = async (liveId, vendedorId) => {
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
      liveId: live._id,
      nombreLive: live.nombre,
      totalPedidos: 0,
      totalVendido: 0,
      totalPagado: 0,
      totalPendientePago: 0,
      totalEntregados: 0,
      totalPendienteEntrega: 0
    }
  );
};

module.exports = {
  obtenerResumenPorLive
};
