const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const protegerRuta = require('../middlewares/authMiddleware');
const rol = require('../middlewares/roleMiddleware');
const service = require('../services/comprobanteService');
const respuestaError = (res, e) => res.status(e.status || 503).json({ mensaje: e.status ? e.message : 'No se pudo procesar el comprobante. Consultá su estado antes de reintentar.' });
const manejar = fn => async (req, res) => { try { res.set('Cache-Control', 'no-store'); res.json(await fn(req)); } catch (e) { respuestaError(res, e); } };
const carga = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5242880, files: 1, fields: 0, parts: 2 }, fileFilter: (req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(Object.assign(new Error('Solo se aceptan JPG, PNG o WebP.'), { status: 400 }));
  cb(null, true);
} }).single('archivo');
router.use(protegerRuta, rol('cliente', 'vendedor'));
router.use(rateLimit({ windowMs: 600000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
router.get('/', manejar(req => service.listar(req.params.id, req.usuario)));
router.get('/:comprobanteId/acceso', manejar(req => service.accesoTemporal(req.params.id, req.params.comprobanteId, req.usuario)));
router.post('/', rol('cliente'), rateLimit({ windowMs: 600000, limit: 5, keyGenerator: req => String(req.usuario._id), standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
  try { await service.verificarCarga(req.params.id, req.usuario); }
  catch (e) { return respuestaError(res, e); }
  req.setTimeout(30000, () => req.destroy());
  carga(req, res, async e => {
    req.setTimeout(0);
    if (e) return res.status(e.code === 'LIMIT_FILE_SIZE' ? 413 : e.status || 400).json({ mensaje: e.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 5 MB.' : e.status ? e.message : 'Adjuntá un solo archivo, sin campos adicionales.' });
    try { res.set('Cache-Control', 'no-store'); res.status(201).json(await service.subir(req.params.id, req.usuario, req.file)); }
    catch (causa) { respuestaError(res, causa); }
  });
});
router.patch('/:comprobanteId/aprobar', rol('vendedor'), manejar(req => service.revisar(req.params.id, req.params.comprobanteId, req.usuario, 'aprobar')));
router.patch('/:comprobanteId/rechazar', rol('vendedor'), manejar(req => service.revisar(req.params.id, req.params.comprobanteId, req.usuario, 'rechazar', req.body?.motivo)));
module.exports = router;
