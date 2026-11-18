const expiracion = require('../services/expiracionReservasService');

module.exports = async (req, res, next) => {
  try {
    const usuario = req.usuario;
    if (usuario?.rol === 'vendedor') await expiracion.procesar({ vendedorId: usuario._id });
    else if (usuario?.rol === 'cliente') await expiracion.procesar({ compradorId: usuario._id });
    res.set('Cache-Control', 'no-store');
    next();
  } catch (error) { res.status(error.status || 503).json({ mensaje: error.message }); }
};
