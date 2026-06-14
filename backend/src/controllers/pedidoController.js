const mongoose = require("mongoose");

const Cliente = require("../models/clientes");
const Live = require("../models/lives");
const Pedido = require("../models/pedidos");

const ESTADOS_PAGO = ["pendiente", "pagado"];
const ESTADOS_ENTREGA = ["pendiente", "entregado"];

const obtenerVendedorId = (req) => req.usuario._id || req.usuario.id;

const numeroValido = (valor, minimo) => {
  if (valor === undefined || valor === null || valor === "") {
    return false;
  }

  const numero = Number(valor);

  return !Number.isNaN(numero) && numero >= minimo;
};

const validarClienteYLive = async (clienteId, liveId, vendedorId) => {
  if (!mongoose.Types.ObjectId.isValid(clienteId)) {
    return { valido: false, status: 400, mensaje: "ID de cliente invalido" };
  }

  if (!mongoose.Types.ObjectId.isValid(liveId)) {
    return { valido: false, status: 400, mensaje: "ID de Live invalido" };
  }

  const cliente = await Cliente.findOne({
    _id: clienteId,
    vendedorId
  });

  if (!cliente) {
    return { valido: false, status: 404, mensaje: "Cliente no encontrado" };
  }

  const live = await Live.findOne({
    _id: liveId,
    vendedorId
  });

  if (!live) {
    return { valido: false, status: 404, mensaje: "Live no encontrado" };
  }

  return { valido: true };
};

const crearPedido = async (req, res) => {
  try {
    const {
      clienteId,
      liveId,
      producto,
      cantidad,
      precio,
      estadoPago,
      estadoEntrega,
      observaciones
    } = req.body;
    const vendedorId = obtenerVendedorId(req);

    if (!clienteId) {
      return res.status(400).json({
        mensaje: "El clienteId es obligatorio"
      });
    }

    if (!liveId) {
      return res.status(400).json({
        mensaje: "El liveId es obligatorio"
      });
    }

    if (!producto) {
      return res.status(400).json({
        mensaje: "El producto es obligatorio"
      });
    }

    if (!numeroValido(precio, 0)) {
      return res.status(400).json({
        mensaje: "El precio es obligatorio y debe ser mayor o igual a 0"
      });
    }

    if (cantidad !== undefined && !numeroValido(cantidad, 1)) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser mayor o igual a 1"
      });
    }

    if (estadoPago !== undefined && !ESTADOS_PAGO.includes(estadoPago)) {
      return res.status(400).json({
        mensaje: "Estado de pago invalido"
      });
    }

    if (estadoEntrega !== undefined && !ESTADOS_ENTREGA.includes(estadoEntrega)) {
      return res.status(400).json({
        mensaje: "Estado de entrega invalido"
      });
    }

    const validacionRelaciones = await validarClienteYLive(
      clienteId,
      liveId,
      vendedorId
    );

    if (!validacionRelaciones.valido) {
      return res.status(validacionRelaciones.status).json({
        mensaje: validacionRelaciones.mensaje
      });
    }

    const pedido = await Pedido.create({
      clienteId,
      liveId,
      vendedorId,
      producto,
      cantidad,
      precio,
      estadoPago,
      estadoEntrega,
      observaciones
    });

    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al crear pedido",
      error: error.message
    });
  }
};

const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find({
      vendedorId: obtenerVendedorId(req)
    });

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener pedidos",
      error: error.message
    });
  }
};

const obtenerPedidoPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de pedido invalido"
      });
    }

    if (producto !== undefined && !producto) {
      return res.status(400).json({
        mensaje: "El producto es obligatorio"
      });
    }

    const pedido = await Pedido.findOne({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al obtener pedido",
      error: error.message
    });
  }
};

const actualizarPedido = async (req, res) => {
  try {
    const {
      clienteId,
      liveId,
      producto,
      cantidad,
      precio,
      estadoPago,
      estadoEntrega,
      observaciones
    } = req.body;
    const vendedorId = obtenerVendedorId(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de pedido invalido"
      });
    }

    if (precio !== undefined && !numeroValido(precio, 0)) {
      return res.status(400).json({
        mensaje: "El precio debe ser mayor o igual a 0"
      });
    }

    if (cantidad !== undefined && !numeroValido(cantidad, 1)) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser mayor o igual a 1"
      });
    }

    if (estadoPago !== undefined && !ESTADOS_PAGO.includes(estadoPago)) {
      return res.status(400).json({
        mensaje: "Estado de pago invalido"
      });
    }

    if (estadoEntrega !== undefined && !ESTADOS_ENTREGA.includes(estadoEntrega)) {
      return res.status(400).json({
        mensaje: "Estado de entrega invalido"
      });
    }

    const pedidoActual = await Pedido.findOne({
      _id: req.params.id,
      vendedorId
    });

    if (!pedidoActual) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    const clienteIdFinal =
      clienteId !== undefined ? clienteId : pedidoActual.clienteId;
    const liveIdFinal = liveId !== undefined ? liveId : pedidoActual.liveId;
    const validacionRelaciones = await validarClienteYLive(
      clienteIdFinal,
      liveIdFinal,
      vendedorId
    );

    if (!validacionRelaciones.valido) {
      return res.status(validacionRelaciones.status).json({
        mensaje: validacionRelaciones.mensaje
      });
    }

    const datosActualizar = {};

    if (clienteId !== undefined) datosActualizar.clienteId = clienteId;
    if (liveId !== undefined) datosActualizar.liveId = liveId;
    if (producto !== undefined) datosActualizar.producto = producto;
    if (cantidad !== undefined) datosActualizar.cantidad = cantidad;
    if (precio !== undefined) datosActualizar.precio = precio;
    if (estadoPago !== undefined) datosActualizar.estadoPago = estadoPago;
    if (estadoEntrega !== undefined) datosActualizar.estadoEntrega = estadoEntrega;
    if (observaciones !== undefined) datosActualizar.observaciones = observaciones;

    const pedido = await Pedido.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId
      },
      datosActualizar,
      { new: true, runValidators: true }
    );

    res.json(pedido);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar pedido",
      error: error.message
    });
  }
};

const actualizarPagoPedido = async (req, res) => {
  try {
    const { estadoPago } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de pedido invalido"
      });
    }

    if (!estadoPago) {
      return res.status(400).json({
        mensaje: "El estadoPago es obligatorio"
      });
    }

    if (!ESTADOS_PAGO.includes(estadoPago)) {
      return res.status(400).json({
        mensaje: "Estado de pago invalido"
      });
    }

    const pedido = await Pedido.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      { estadoPago },
      { new: true, runValidators: true }
    );

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar pago del pedido",
      error: error.message
    });
  }
};

const actualizarEntregaPedido = async (req, res) => {
  try {
    const { estadoEntrega } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de pedido invalido"
      });
    }

    if (!estadoEntrega) {
      return res.status(400).json({
        mensaje: "El estadoEntrega es obligatorio"
      });
    }

    if (!ESTADOS_ENTREGA.includes(estadoEntrega)) {
      return res.status(400).json({
        mensaje: "Estado de entrega invalido"
      });
    }

    const pedido = await Pedido.findOneAndUpdate(
      {
        _id: req.params.id,
        vendedorId: obtenerVendedorId(req)
      },
      { estadoEntrega },
      { new: true, runValidators: true }
    );

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    res.json(pedido);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar entrega del pedido",
      error: error.message
    });
  }
};

const eliminarPedido = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        mensaje: "ID de pedido invalido"
      });
    }

    const pedido = await Pedido.findOneAndDelete({
      _id: req.params.id,
      vendedorId: obtenerVendedorId(req)
    });

    if (!pedido) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado"
      });
    }

    res.json({
      mensaje: "Pedido eliminado correctamente"
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al eliminar pedido",
      error: error.message
    });
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarPedido,
  actualizarPagoPedido,
  actualizarEntregaPedido,
  eliminarPedido
};
