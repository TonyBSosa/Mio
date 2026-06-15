const expressFramework = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const liveRoutes = require("./routes/liveRoutes");
const productoRoutes = require("./routes/productoRoutes");
const pedidoRoutes = require("./routes/pedidoRoutes");
const resumenRoutes = require("./routes/resumenRoutes");
const perfilVendedorRoutes = require("./routes/perfilVendedorRoutes");
const catalogoPublicoRoutes = require("./routes/catalogoPublicoRoutes");
const explorarPublicoRoutes = require("./routes/explorarPublicoRoutes");

const expressApp = expressFramework();

expressApp.use(cors());
expressApp.use(expressFramework.json());

expressApp.get("/", (req, res) => {
  res.send("API MIO funcionando");
});

expressApp.use("/api/auth", authRoutes);
expressApp.use("/api/usuarios", userRoutes);
expressApp.use("/api/clientes", clienteRoutes);
expressApp.use("/api/lives", liveRoutes);
expressApp.use("/api/productos", productoRoutes);
expressApp.use("/api/pedidos", pedidoRoutes);
expressApp.use("/api/resumen", resumenRoutes);
expressApp.use("/api/perfil-vendedor", perfilVendedorRoutes);
expressApp.use("/api/public/catalogo", catalogoPublicoRoutes);
expressApp.use("/api/public/explorar", explorarPublicoRoutes);

module.exports = expressApp;
