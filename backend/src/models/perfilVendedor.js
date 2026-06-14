const mongoose = require("mongoose");

const perfilVendedorSchema = new mongoose.Schema(
  {
    vendedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    nombrePublico: {
      type: String,
      trim: true
    },

    descripcion: {
      type: String,
      trim: true
    },

    facebook: {
      type: String,
      trim: true
    },

    instagram: {
      type: String,
      trim: true
    },

    tiktok: {
      type: String,
      trim: true
    },

    whatsapp: {
      type: String,
      trim: true
    },

    enlaceLive: {
      type: String,
      trim: true
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: "perfiles_vendedores"
  }
);

const PerfilVendedor = mongoose.model("PerfilVendedor", perfilVendedorSchema);

module.exports = PerfilVendedor;
