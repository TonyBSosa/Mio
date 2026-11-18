const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', immutable: true },
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

clienteSchema.index({ vendedorId: 1, usuarioId: 1 }, { unique: true, partialFilterExpression: { usuarioId: { $type: 'objectId' } } });
const Cliente = mongoose.model("Cliente", clienteSchema);

module.exports = Cliente;
