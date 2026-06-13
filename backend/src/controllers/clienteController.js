const mongoose = require("mongoose");

const Cliente = require("../models/clientes");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const crearCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre del cliente es obligatorio"
      });
    }

    const cliente = await Cliente.create({
      nombre,
      telefono,
      direccion,
      vendedorId: obtenerVendedorId(req)
    });

    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear cliente",
      error: error.message
    });
  }
};

const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({
      vendedorId: obtenerVendedorId(req)
    });

    res.json(clientes);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener clientes",
      error: error.message
    });
  }
};

const obtenerClientePorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de cliente invalido"
      });
    }

    const cliente = await Cliente.findOne({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!cliente) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado"
      });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener cliente",
      error: error.message
    });
  }
};

const actualizarCliente = async (req, res) => {
  try {
    const { nombre, telefono, direccion } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de cliente invalido"
      });
    }

    const datosActualizar = {};

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (direccion !== undefined) datosActualizar.direccion = direccion;

    const cliente = await Cliente.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      datosActualizar,
      { new: true, runValidators: true }
    );

    if (!cliente) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado"
      });
    }

    res.json(cliente);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar cliente",
      error: error.message
    });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de cliente invalido"
      });
    }

    const cliente = await Cliente.findOneAndDelete({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!cliente) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado"
      });
    }

    res.json({
      mensaje: "Cliente eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar cliente",
      error: error.message
    });
  }
};

module.exports = {
  crearCliente,
  obtenerClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente
};
