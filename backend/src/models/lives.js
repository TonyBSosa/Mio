const mongoose = require("mongoose");

const liveSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    descripcion: {
      type: String,
      trim: true
    },

    fecha: {
      type: Date
    },

    estado: {
      type: String,
      enum: ["programado", "activo", "pausado", "finalizado", "cancelado"],
      default: "programado"
    },

    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    collection: "lives"
  }
);

const Live = mongoose.model("Live", liveSchema);

module.exports = Live;
