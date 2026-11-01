require("dotenv").config();

const expressApp = require("./src/expressApp");
const connectDatabase = require("./src/config/db");

const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('Configura MONGO_URI y JWT_SECRET antes de iniciar MIO');
}

connectDatabase().then(() => {
  expressApp.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
