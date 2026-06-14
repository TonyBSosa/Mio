const User = require("../models/users");

const crearUsuario = (data) => {
  return User.create(data);
};

const listarUsuarios = () => {
  return User.find();
};

const buscarPorId = (id) => {
  return User.findById(id);
};

const buscarPorEmail = (email) => {
  return User.findOne({ email });
};

const actualizarPorId = (id, data) => {
  return User.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
};

const eliminarPorId = (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  buscarPorId,
  buscarPorEmail,
  actualizarPorId,
  eliminarPorId
};
