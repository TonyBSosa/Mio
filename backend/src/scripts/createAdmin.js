require("dotenv").config();

const { hashPassword, validarPassword } = require('../services/passwordPolicy');
const mongoose = require("mongoose");

const User = require("../models/users");

const crearAdmin = async () => {
  try {
    const { ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

    if (!MONGO_URI) {
      console.log("Falta configurar MONGO_URI en el archivo .env");
      process.exit(1);
    }

    if (!ADMIN_NOMBRE || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log("Faltan datos del admin: ADMIN_NOMBRE, ADMIN_EMAIL o ADMIN_PASSWORD");
      process.exit(1);
    }

    validarPassword(ADMIN_PASSWORD);
    const emailNormalizado = ADMIN_EMAIL.trim().toLowerCase();
    await mongoose.connect(MONGO_URI);

    const adminExiste = await User.findOne({ email: emailNormalizado });

    if (adminExiste) {
      console.log("Ya existe un usuario con ese email");
      process.exit(0);
    }

    const passwordHasheado = await hashPassword(ADMIN_PASSWORD);

    await User.create({
      nombre: ADMIN_NOMBRE,
      email: emailNormalizado,
      password: passwordHasheado,
      rol: "admin",
      estado: "activo"
    });

    console.log("Admin creado correctamente");
    process.exit(0);
  } catch (error) {
    console.log(error.status === 400 ? error.mensaje : 'No se pudo crear el administrador');
    process.exit(1);
  }
};

crearAdmin();
