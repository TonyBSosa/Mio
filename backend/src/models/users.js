const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
      enum: ["vendedor", "admin"],
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
    return returnedObject;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
