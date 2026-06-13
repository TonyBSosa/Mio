require("dotenv").config();

const bcrypt = require("bcryptjs");
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

    await mongoose.connect(MONGO_URI);

    const adminExiste = await User.findOne({ email: ADMIN_EMAIL });

    if (adminExiste) {
      console.log("Ya existe un usuario con ese email");
      process.exit(0);
    }

    const passwordHasheado = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.create({
      nombre: ADMIN_NOMBRE,
      email: ADMIN_EMAIL,
      password: passwordHasheado,
      rol: "admin",
      estado: "activo"
    });

    console.log("Admin creado correctamente");
    process.exit(0);
  } catch (error) {
    console.log("Error al crear admin:", error.message);
    process.exit(1);
  }
};

crearAdmin();
