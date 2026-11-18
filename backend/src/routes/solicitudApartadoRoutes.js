const router = require('express').Router();
const protegerRuta = require('../middlewares/authMiddleware');
const validarRol = require('../middlewares/roleMiddleware');
const controller = require('../controllers/solicitudApartadoController');

router.use(protegerRuta);
router.use(require('../middlewares/expirarReservasMiddleware'));
router.post('/', validarRol('cliente'), controller.crear);
router.get('/configuracion', validarRol('vendedor'), controller.configuracion);
router.patch('/configuracion', validarRol('vendedor'), controller.guardarConfiguracion);
router.patch('/:id/confirmar', validarRol('vendedor'), controller.resolver('confirmar'));
router.patch('/:id/rechazar', validarRol('vendedor'), controller.resolver('rechazar'));
router.patch('/:id/cancelar', validarRol('cliente'), controller.cancelar);
router.get('/', validarRol('cliente', 'vendedor'), controller.listar);
router.get('/:id', validarRol('cliente', 'vendedor'), controller.obtener);

module.exports = router;
