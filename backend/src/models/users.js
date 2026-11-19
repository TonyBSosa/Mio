const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Sin default en Required: documentos históricos NO se marcan verificados ni nuevos.
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationRequired: Boolean,
    emailVerification: { hash: String, email: String, credentialVersion: String, expiresAt: Date },
    verificationRequest: { slot: String, windowStartedAt: Date, count: Number, nextAllowedAt: Date },
    registrationPendingUntil: Date,
    credentialVersion: { type: String },
    deletedAt: { type: Date, default: null },
    recoveryRequest: {
      slot: String, windowStartedAt: Date, count: Number, nextAllowedAt: Date,
    },
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
    delete returnedObject.recoveryRequest;
    delete returnedObject.emailVerification;
    delete returnedObject.verificationRequest;
    delete returnedObject.registrationPendingUntil;
    return returnedObject;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
