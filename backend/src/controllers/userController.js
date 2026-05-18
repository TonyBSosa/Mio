const User = require("../models/users");

// CREATE - crear usuario
const createUser = async (req, res) => {
  const USER = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role
  });

  const resultado = await USER.save();

  res.json(resultado);
};

// READ - mostrar todos los usuarios
const getUsers = async (req, res) => {
  const users = await User.find();

  res.json(users);
};

// READ - mostrar un usuario por ID
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);

  res.json(user);
};

// UPDATE - actualizar usuario
const updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    },
    { new: true }
  );

  res.json(user);
};

// DELETE - eliminar usuario
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  res.json(user);
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};