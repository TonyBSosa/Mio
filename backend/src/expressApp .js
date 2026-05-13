const express = require("express");
const cors = require("cors");

const expressApp  = express();

expressApp .use(cors());
expressApp .use(express.json());

 
expressApp .get("/", (req, res) => {
  res.send("API MIO funcionando");
});
 
module.exports = expressApp ;