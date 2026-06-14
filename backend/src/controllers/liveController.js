const mongoose = require("mongoose");

const Live = require("../models/lives");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const crearLive = async (req, res) => {
  try {
    const { nombre, descripcion, fecha, estado } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre del Live es obligatorio"
      });
    }

    const live = await Live.create({
      nombre,
      descripcion,
      fecha,
      estado,
      vendedorId: obtenerVendedorId(req)
    });

    res.status(201).json(live);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear Live",
      error: error.message
    });
  }
};

const obtenerLives = async (req, res) => {
  try {
    const lives = await Live.find({
      vendedorId: obtenerVendedorId(req)
    });

    res.json(lives);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener Lives",
      error: error.message
    });
  }
};

const obtenerLivePorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de Live invalido"
      });
    }

    const live = await Live.findOne({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!live) {
      return res.status(404).json({
        mensaje: "Live no encontrado"
      });
    }

    res.json(live);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener Live",
      error: error.message
    });
  }
};

const actualizarLive = async (req, res) => {
  try {
    const { nombre, descripcion, fecha, estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de Live invalido"
      });
    }

    const datosActualizar = {};

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
    if (fecha !== undefined) datosActualizar.fecha = fecha;
    if (estado !== undefined) datosActualizar.estado = estado;

    const live = await Live.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      datosActualizar,
      { new: true, runValidators: true }
    );

    if (!live) {
      return res.status(404).json({
        mensaje: "Live no encontrado"
      });
    }

    res.json(live);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar Live",
      error: error.message
    });
  }
};

const actualizarEstadoLive = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de Live invalido"
      });
    }

    if (!estado) {
      return res.status(400).json({
        mensaje: "El estado es obligatorio"
      });
    }

    const live = await Live.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      { estado },
      { new: true, runValidators: true }
    );

    if (!live) {
      return res.status(404).json({
        mensaje: "Live no encontrado"
      });
    }

    res.json(live);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar estado del Live",
      error: error.message
    });
  }
};

const eliminarLive = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de Live invalido"
      });
    }

    const live = await Live.findOneAndDelete({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!live) {
      return res.status(404).json({
        mensaje: "Live no encontrado"
      });
    }

    res.json({
      mensaje: "Live eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar Live",
      error: error.message
    });
  }
};

module.exports = {
  crearLive,
  obtenerLives,
  obtenerLivePorId,
  actualizarLive,
  actualizarEstadoLive,
  eliminarLive
};
