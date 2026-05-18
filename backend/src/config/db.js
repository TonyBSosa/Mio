const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB conectado correctamente");

  } catch (error) {

    console.log("Error conectando MongoDB:", error);

    process.exit(1);
  }
};

module.exports = connectDatabase;
