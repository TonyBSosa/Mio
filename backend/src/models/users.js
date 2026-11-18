const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    credentialVersion: { type: String },
    deletedAt: { type: Date, default: null },
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    rol: {
      type: String,
      enum: ["vendedor", "admin", "cliente"],
      default: "vendedor"
    },

    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo"
    }
  },
  {
    timestamps: true,
    collection: "usuarios"
  }
);

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.credentialVersion;
    return returnedObject;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
