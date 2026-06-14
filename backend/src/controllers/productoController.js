const mongoose = require("mongoose");

const Producto = require("../models/productos");

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const precioEsValido = (precio) => {
  if (precio === undefined || precio === null || precio === "") {
    return false;
  }

  const precioNumerico = Number(precio);

  return !Number.isNaN(precioNumerico) && precioNumerico >= 0;
};

const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, precio, estado } = req.body;

    if (!nombre) {
      return res.status(400).json({
        mensaje: "El nombre del producto es obligatorio"
      });
    }

    if (!precioEsValido(precio)) {
      return res.status(400).json({
        mensaje: "El precio es obligatorio y debe ser mayor o igual a 0"
      });
    }

    const producto = await Producto.create({
      vendedorId: obtenerVendedorId(req),
      nombre,
      descripcion,
      categoria,
      precio,
      estado
    });

    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear producto",
      error: error.message
    });
  }
};

const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find({
      vendedorId: obtenerVendedorId(req)
    });

    res.json(productos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener productos",
      error: error.message
    });
  }
};

const obtenerProductoPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de producto invalido"
      });
    }

    const producto = await Producto.findOne({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener producto",
      error: error.message
    });
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const { nombre, descripcion, categoria, precio, estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de producto invalido"
      });
    }

    if (precio !== undefined && !precioEsValido(precio)) {
      return res.status(400).json({
        mensaje: "El precio debe ser mayor o igual a 0"
      });
    }

    const datosActualizar = {};

    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;
    if (categoria !== undefined) datosActualizar.categoria = categoria;
    if (precio !== undefined) datosActualizar.precio = precio;
    if (estado !== undefined) datosActualizar.estado = estado;

    const producto = await Producto.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      datosActualizar,
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar producto",
      error: error.message
    });
  }
};

const actualizarEstadoProducto = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de producto invalido"
      });
    }

    if (!estado) {
      return res.status(400).json({
        mensaje: "El estado es obligatorio"
      });
    }

    const producto = await Producto.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      { estado },
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar estado del producto",
      error: error.message
    });
  }
};

const eliminarProducto = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de producto invalido"
      });
    }

    const producto = await Producto.findOneAndDelete({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado"
      });
    }

    res.json({
      mensaje: "Producto eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar producto",
      error: error.message
    });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  actualizarEstadoProducto,
  eliminarProducto
};
