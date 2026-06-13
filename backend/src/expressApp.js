const expressFramework = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clienteRoutes = require("./routes/clienteRoutes");

const expressApp = expressFramework();

expressApp.use(cors());
expressApp.use(expressFramework.json());

expressApp.get("/", (req, res) => {
  res.send("API MIO funcionando");
});

expressApp.use("/api/auth", authRoutes);
expressApp.use("/api/usuarios", userRoutes);
expressApp.use("/api/clientes", clienteRoutes);

module.exports = expressApp;
