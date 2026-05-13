const expressFramework = require("express");
const cors = require("cors");

const expressApp  = expressFramework();

expressApp .use(cors());
expressApp .use(expressFramework.json());

 
expressApp .get("/", (req, res) => {
  res.send("API MIO funcionando");
});
 
module.exports = expressApp ;