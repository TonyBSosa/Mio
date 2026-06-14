const mongoose = require("mongoose");

const Live = require("../models/lives");
const Pedido = require("../models/pedidos");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const calcularTotalPedido = (pedido) => {
  const cantidad = Number(pedido.cantidad) || 0;
  const precio = Number(pedido.precio) || 0;

  return cantidad * precio;
};

const obtenerResumenPorLive = async (req, res) => {
  try {
    const { liveId } = req.params;
    const vendedorId = obtenerVendedorId(req);

    if (!mongoose.Types.ObjectId.isValid(liveId)) {
      return res.status(400).json({
        mensaje: "ID de Live invalido"
      });
    }

    const live = await Live.findOne({
      _id: liveId,
      vendedorId
    });

    if (!live) {
      return res.status(404).json({
        mensaje: "Live no encontrado"
      });
    }

    const pedidos = await Pedido.find({
      liveId,
      vendedorId
    });

    const resumen = pedidos.reduce(
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

    res.json(resumen);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener resumen del Live",
      error: error.message
    });
  }
};

module.exports = {
  obtenerResumenPorLive
};
