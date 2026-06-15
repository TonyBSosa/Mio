const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    nombre: {
      type: String,
      required: true,
      trim: true
    },

    descripcion: {
      type: String,
      trim: true
    },

    categoria: {
      type: String,
      trim: true
    },

    foto: {
      type: String,
      trim: true
    },

    precio: {
      type: Number,
      required: true,
      min: 0
    },

    estado: {
      type: String,
      enum: ["activo", "inactivo", "apartado"],
      default: "activo"
    }
  },
  {
    timestamps: true,
    collection: "productos"
  }
);

const Producto = mongoose.model("Producto", productoSchema);

module.exports = Producto;
