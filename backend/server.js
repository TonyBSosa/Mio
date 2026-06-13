require("dotenv").config();

const expressApp = require("./src/expressApp");
const connectDatabase = require("./src/config/db");

const PORT = process.env.PORT || 3000;

connectDatabase();
expressApp.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
