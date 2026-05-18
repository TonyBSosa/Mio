const expressFramework = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");

const expressApp = expressFramework();

expressApp.use(cors());
expressApp.use(expressFramework.json());

expressApp.get("/", (req, res) => {
  res.send("API MIO funcionando");
});

expressApp.use("/api/users", userRoutes);

module.exports = expressApp;