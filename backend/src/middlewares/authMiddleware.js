const jwt = require("jsonwebtoken");

const User = require("../models/users");

const protegerRuta = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "Token no enviado"
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await User.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Usuario no encontrado para este token"
      });
    }

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        mensaje: "Usuario inactivo"
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({
      mensaje: "Token invalido"
    });
  }
};

module.exports = protegerRuta;
