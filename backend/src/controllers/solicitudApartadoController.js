const service = require('../services/solicitudApartadoService');

const responderError = (res, error) => res.status(error.status || 500).json({
  mensaje: error.status ? error.message : 'No se pudo procesar la solicitud. Intentá de nuevo.',
});

exports.crear = async (req, res) => {
  try { res.status(201).json(await service.crear(req.body, req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.listar = async (req, res) => {
  try { res.json(await service.listar(req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.obtener = async (req, res) => {
  try { res.json(await service.obtener(req.params.id, req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.configuracion = async (req, res) => {
  try { res.json(await service.configuracion(req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.guardarConfiguracion = async (req, res) => {
  try { res.json(await service.guardarConfiguracion(req.body, req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.resolver = accion => async (req, res) => {
  try { res.json(await service.resolver(req.params.id, accion, req.usuario)); }
  catch (error) { responderError(res, error); }
};
exports.cancelar = async (req, res) => {
  try { res.json(await service.cancelar(req.params.id, req.usuario)); }
  catch (error) { responderError(res, error); }
};
