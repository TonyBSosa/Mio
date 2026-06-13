const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    telefono: {
      type: String,
      trim: true
    },

    direccion: {
      type: String,
      trim: true
    },

    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
    collection: "clientes"
  }
);

const Cliente = mongoose.model("Cliente", clienteSchema);

module.exports = Cliente;
