const mongoose = require("mongoose");

const clienteRepository = require("../repositories/clienteRepository");

const crearError = (status, mensaje) => {
  const error = new Error(mensaje);
  error.status = status;
  error.mensaje = mensaje;
  return error;
};

const validarIdCliente = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw crearError(400, "ID de cliente invalido");
  }
};

const crearCliente = async (data, vendedorId) => {
  const { nombre, telefono, direccion } = data;

  if (!nombre) {
    throw crearError(400, "El nombre del cliente es obligatorio");
  }

  return clienteRepository.crearCliente({
    nombre,
    telefono,
    direccion,
    vendedorId
  });
};

const listarClientes = (vendedorId) => {
  return clienteRepository.listarPorVendedor(vendedorId);
};

const obtenerClientePorId = async (id, vendedorId) => {
  validarIdCliente(id);

  const cliente = await clienteRepository.buscarPorIdYVendedor(id, vendedorId);

  if (!cliente) {
    throw crearError(404, "Cliente no encontrado");
  }

  return cliente;
};

const actualizarCliente = async (id, data, vendedorId) => {
  validarIdCliente(id);

  const { nombre, telefono, direccion } = data;

  if (nombre !== undefined && !nombre) {
    throw crearError(400, "El nombre del cliente es obligatorio");
  }

  const datosActualizar = {};

  if (nombre !== undefined) datosActualizar.nombre = nombre;
  if (telefono !== undefined) datosActualizar.telefono = telefono;
  if (direccion !== undefined) datosActualizar.direccion = direccion;

  const cliente = await clienteRepository.actualizarPorIdYVendedor(
    id,
    vendedorId,
    datosActualizar
  );

  if (!cliente) {
    throw crearError(404, "Cliente no encontrado");
  }

  return cliente;
};

const eliminarCliente = async (id, vendedorId) => {
  validarIdCliente(id);

  const cliente = await clienteRepository.eliminarPorIdYVendedor(id, vendedorId);

  if (!cliente) {
    throw crearError(404, "Cliente no encontrado");
  }

  return {
    mensaje: "Cliente eliminado correctamente"
  };
};

module.exports = {
  crearCliente,
  listarClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
};
