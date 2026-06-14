const mongoose = require("mongoose");

const pedidoSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true
    },

    liveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Live",
      required: true
    },

    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    producto: {
      type: String,
      required: true,
      trim: true
    },

    cantidad: {
      type: Number,
      default: 1,
      min: 1
    },

    precio: {
      type: Number,
      required: true,
      min: 0
    },

    estadoPago: {
      type: String,
      enum: ["pendiente", "pagado"],
      default: "pendiente"
    },

    estadoEntrega: {
      type: String,
      enum: ["pendiente", "entregado"],
      default: "pendiente"
    },

    observaciones: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "pedidos"
  }
);

const Pedido = mongoose.model("Pedido", pedidoSchema);

module.exports = Pedido;
