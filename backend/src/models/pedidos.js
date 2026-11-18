const mongoose = require("mongoose");

const pedidoSchema = new mongoose.Schema(
  {
    reservaSolicitudId: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudApartado', immutable: true },
    comprobanteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comprobante', immutable: true },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true
    },

    liveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Live"
    },

    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto"
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

pedidoSchema.index({ reservaSolicitudId: 1 }, { unique: true, partialFilterExpression: { reservaSolicitudId: { $type: 'objectId' } } });
const Pedido = mongoose.model("Pedido", pedidoSchema);

module.exports = Pedido;
