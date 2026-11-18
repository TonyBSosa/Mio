const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Producto = require('../src/models/productos');
const Solicitud = require('../src/models/solicitudApartado');
const Comprobante = require('../src/models/comprobante');
const Cliente = require('../src/models/clientes');
const Pedido = require('../src/models/pedidos');
const Perfil = require('../src/models/perfilVendedor');
const reloj = require('../src/services/reloj');
const storage = require('../src/services/comprobanteStorage');
const service = require('../src/services/comprobanteService');
const expiracion = require('../src/services/expiracionReservasService');
const app = require('../src/expressApp');
const uri = process.env.MIO_MONGO_PRUEBAS_URI;

test('MongoDB real + almacenamiento simulado: comprobantes y contabilidad', { skip: !uri }, async t => {
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27182\/mio_pruebas_[a-z0-9_]+\?replicaSet=mioPruebas$/);
  await mongoose.connect(uri.replace('?replicaSet', '_comprobantes?replicaSet'), { serverSelectionTimeoutMS: 8000 });
  t.after(async () => { assert.match(mongoose.connection.name, /^mio_pruebas_/); await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([User, Sesion, Producto, Solicitud, Comprobante, Cliente, Pedido, Perfil].map(m => m.init()));
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'comprobantes-test-only';
  process.env.RESERVAS_PRUEBA_HABILITADAS = 'true';
  let ahora = Date.UTC(2030, 0, 1);
  t.mock.method(reloj, 'ahora', () => new Date(ahora));
  const archivos = new Map();
  let falloStorage = false;
  let despuesCarga;
  let configurado = true;
  t.mock.method(storage, 'configurado', () => configurado);
  t.mock.method(storage, 'subir', async (clave, buffer) => {
    if (falloStorage) throw Object.assign(new Error('Almacenamiento no disponible'), { status: 503 });
    assert.equal((await sharp(buffer).metadata()).format, 'webp');
    archivos.set(clave, buffer);
    if (despuesCarga) await despuesCarga();
  });
  t.mock.method(storage, 'firmar', async clave => {
    assert.ok(archivos.has(clave)); return { url: 'https://storage.example.invalid/private?token=test', duraSegundos: 60 };
  });
  t.mock.method(storage, 'eliminar', async clave => { archivos.delete(clave); });
  const [vendedor, ajeno] = await User.create(['vendedor', 'vendedor'].map((rol, i) => ({ nombre: `Tienda ${i}`, email: `tienda-${i}@example.invalid`, password: 'no-login', rol })));
  process.env.RESERVAS_PRUEBA_VENDEDORES = vendedor.id;
  const tokens = new Map();
  const autenticar = async user => {
    const sesion = await Sesion.create({ usuarioId: user._id, expiresAt: new Date(Date.now() + 600000) });
    tokens.set(user.id, jwt.sign({ id: user.id, sid: sesion.id }, process.env.JWT_SECRET, { expiresIn: '10m' }));
  };
  await autenticar(vendedor); await autenticar(ajeno);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (user, path, method = 'GET', body) => fetch(base + path, {
    method, headers: { ...(user ? { Authorization: `Bearer ${tokens.get(user.id)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const imagen = await sharp({ create: { width: 24, height: 24, channels: 3, background: '#199970' } }).png().toBuffer();
  let numero = 0;
  const preparar = async (confirmar = true) => {
    const comprador = await User.create({ nombre: `Comprador ${++numero}`, email: `comprador-${numero}@example.invalid`, password: 'no-login', rol: 'cliente' });
    await autenticar(comprador);
    const producto = await Producto.create({ nombre: `Pieza ${numero}`, codigo: `REC-${numero}`, vendedorId: vendedor._id, precio: 350 });
    const creada = await request(comprador, '/solicitudes-apartado', 'POST', { productoId: producto.id });
    assert.equal(creada.status, 201);
    const reserva = await creada.json();
    if (confirmar) assert.equal((await request(vendedor, `/solicitudes-apartado/${reserva._id}/confirmar`, 'PATCH')).status, 200);
    return { comprador, producto, id: reserva._id, url: `/solicitudes-apartado/${reserva._id}/comprobantes` };
  };
  const subir = async (caso, usuario = caso.comprador, buffer = imagen, tipo = 'image/png') => {
    const form = new FormData(); form.append('archivo', new Blob([buffer], { type: tipo }), 'nombre-no-confiable.png');
    return fetch(base + caso.url, { method: 'POST', headers: { Authorization: `Bearer ${tokens.get(usuario.id)}` }, body: form });
  };
  const legado = await Pedido.create({ vendedorId: vendedor._id, clienteId: new mongoose.Types.ObjectId(), producto: 'Venta anterior', precio: 80 });
  const anterior = await Pedido.findById(legado._id).lean();

  await t.test('carga válida, metadata privada, acceso propio y revisión sin expiración', async () => {
    const caso = await preparar();
    const respuesta = await subir(caso);
    assert.equal(respuesta.status, 201);
    const recibido = await respuesta.json();
    assert.equal(recibido.estado, 'en_revision');
    assert.equal(recibido.clavePrivada, undefined);
    assert.equal((await Solicitud.findById(caso.id)).estado, 'comprobante_en_revision');
    assert.equal((await request(caso.comprador, `/solicitudes-apartado/${caso.id}/cancelar`, 'PATCH')).status, 409);
    const metadata = await Comprobante.findById(recibido._id).select('+clavePrivada').lean();
    assert.match(metadata.clavePrivada, /^[a-f\d/]+\.webp$/);
    assert.equal(metadata.tipo, 'image/webp');
    assert.equal(Object.values(metadata).some(v => Buffer.isBuffer(v)), false);
    assert.equal((await request(vendedor, `${caso.url}/${recibido._id}/acceso`)).status, 200);
    assert.equal((await request(ajeno, `${caso.url}/${recibido._id}/acceso`)).status, 404);
    assert.equal((await request(ajeno, caso.url)).status, 404);
    assert.equal((await request(null, caso.url)).status, 401);
    ahora += 10 * 86400000;
    await expiracion.procesar({ productoId: caso.producto._id });
    assert.equal((await Producto.findById(caso.producto._id)).estado, 'apartado');
    assert.equal((await Solicitud.findById(caso.id)).estado, 'comprobante_en_revision');
  });

  await t.test('rechaza contenido falso, formato no permitido, más de 5 MB y comprador ajeno', async () => {
    const caso = await preparar();
    const otro = await preparar();
    assert.equal((await subir(caso, otro.comprador)).status, 404);
    assert.equal((await subir(caso, caso.comprador, Buffer.from('<script>x</script>'), 'image/png')).status, 400);
    assert.equal((await subir(caso, caso.comprador, imagen, 'image/svg+xml')).status, 400);
    assert.equal((await subir(caso, caso.comprador, Buffer.alloc(5242881), 'image/png')).status, 413);
    assert.equal(await Comprobante.countDocuments({ reservaId: caso.id }), 0);
    assert.equal((await Solicitud.findById(caso.id)).estado, 'confirmada');
  });

  await t.test('no admite comprobantes en pendientes, rechazadas o expiradas', async () => {
    const pendiente = await preparar(false);
    assert.equal((await subir(pendiente)).status, 409);
    assert.equal((await request(vendedor, `/solicitudes-apartado/${pendiente.id}/rechazar`, 'PATCH')).status, 200);
    assert.equal((await subir(pendiente)).status, 404);
    const vencida = await preparar();
    ahora = (await Solicitud.findById(vencida.id)).venceEn.getTime();
    assert.equal((await subir(vencida)).status, 409);
    assert.equal(await Comprobante.countDocuments({ reservaId: vencida.id }), 0);
  });

  await t.test('aprobar es idempotente y concurrente, crea un pedido pagado y suma una sola vez', async () => {
    const caso = await preparar();
    const recibo = await (await subir(caso)).json();
    assert.equal((await request(ajeno, `${caso.url}/${recibo._id}/aprobar`, 'PATCH')).status, 404);
    assert.equal((await request(caso.comprador, `${caso.url}/${recibo._id}/aprobar`, 'PATCH')).status, 403);
    const antes = await (await request(vendedor, '/resumen/live/todos')).json();
    const aprobaciones = await Promise.all([1, 2].map(() => request(vendedor, `${caso.url}/${recibo._id}/aprobar`, 'PATCH', { precio: 1, estadoPago: 'pendiente' })));
    assert.deepEqual(aprobaciones.map(r => r.status), [200, 200]);
    assert.equal(await Pedido.countDocuments({ reservaSolicitudId: caso.id }), 1);
    const pagada = await Solicitud.findById(caso.id);
    assert.equal(pagada.estado, 'pagada');
    assert.equal((await request(caso.comprador, `/solicitudes-apartado/${caso.id}/cancelar`, 'PATCH')).status, 409);
    const pedido = await Pedido.findById(pagada.pedidoId);
    assert.equal(pedido.precio, 350); assert.equal(pedido.estadoPago, 'pagado');
    assert.equal((await Cliente.findById(pedido.clienteId)).usuarioId.toString(), caso.comprador.id);
    const despues = await (await request(vendedor, '/resumen/live/todos')).json();
    assert.equal(despues.totalPagado - antes.totalPagado, 350);
    assert.equal(despues.totalPedidos - antes.totalPedidos, 1);
    assert.equal((await request(vendedor, `/pedidos/${pedido.id}`, 'PUT', { precio: 1 })).status, 409);
    assert.equal((await request(vendedor, `/pedidos/${pedido.id}/pago`, 'PATCH', { estadoPago: 'pendiente' })).status, 409);
    assert.equal((await request(vendedor, `/pedidos/${pedido.id}`, 'DELETE')).status, 404);
    ahora += 20 * 86400000; await expiracion.procesar();
    assert.equal((await Solicitud.findById(caso.id)).estado, 'pagada');
    assert.equal((await Producto.findById(caso.producto._id)).estado, 'apartado');
  });

  await t.test('un fallo en el pedido revierte la aprobación y un reintento seguro registra una sola venta', async () => {
    const caso = await preparar();
    const recibo = await (await subir(caso)).json();
    const fallo = t.mock.method(Pedido, 'create', async () => { throw Error('fallo de escritura de prueba'); });
    assert.equal((await request(vendedor, `${caso.url}/${recibo._id}/aprobar`, 'PATCH')).status, 503);
    fallo.mock.restore();
    assert.equal((await Solicitud.findById(caso.id)).estado, 'comprobante_en_revision');
    assert.equal((await Comprobante.findById(recibo._id)).estado, 'en_revision');
    assert.equal(await Pedido.countDocuments({ reservaSolicitudId: caso.id }), 0);
    assert.equal(await Cliente.countDocuments({ vendedorId: vendedor._id, usuarioId: caso.comprador._id }), 0);
    assert.equal((await request(vendedor, `${caso.url}/${recibo._id}/aprobar`, 'PATCH')).status, 200);
    assert.equal(await Pedido.countDocuments({ reservaSolicitudId: caso.id }), 1);
  });

  await t.test('dos cargas concurrentes solo aceptan un comprobante activo', async () => {
    const caso = await preparar();
    const respuestas = await Promise.all([subir(caso), subir(caso)]);
    assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
    assert.equal(await Comprobante.countDocuments({ reservaId: caso.id, estado: 'en_revision' }), 1);
  });

  await t.test('rechazo con motivo, una corrección de 24 h y segundo rechazo libera sin perder historial', async () => {
    const caso = await preparar();
    const uno = await (await subir(caso)).json();
    assert.equal((await request(vendedor, `${caso.url}/${uno._id}/rechazar`, 'PATCH', { motivo: '' })).status, 400);
    assert.equal((await request(vendedor, `${caso.url}/${uno._id}/rechazar`, 'PATCH', { motivo: 'La imagen no se lee' })).status, 200);
    let r = await Solicitud.findById(caso.id);
    assert.equal(r.estado, 'comprobante_rechazado');
    assert.equal(r.corregirHasta.getTime(), ahora + 86400000);
    const dosRespuesta = await subir(caso); assert.equal(dosRespuesta.status, 201);
    const dos = await dosRespuesta.json();
    assert.equal((await request(vendedor, `${caso.url}/${uno._id}/aprobar`, 'PATCH')).status, 409);
    assert.equal((await request(vendedor, `${caso.url}/${dos._id}/rechazar`, 'PATCH', { motivo: 'No corresponde a esta reserva' })).status, 200);
    r = await Solicitud.findById(caso.id);
    assert.equal(r.estado, 'expirada');
    assert.equal((await Producto.findById(caso.producto._id)).estado, 'activo');
    assert.equal(await Comprobante.countDocuments({ reservaId: caso.id, estado: 'rechazado' }), 2);
    assert.equal((await subir(caso)).status, 409);
  });

  await t.test('la corrección no enviada expira a las 24 h y no se aceptan cargas tardías', async () => {
    const caso = await preparar();
    const c = await (await subir(caso)).json();
    await request(vendedor, `${caso.url}/${c._id}/rechazar`, 'PATCH', { motivo: 'Falta el importe' });
    ahora += 86400000;
    assert.equal((await subir(caso)).status, 409);
    assert.equal((await Solicitud.findById(caso.id)).estado, 'expirada');
    assert.equal((await Producto.findById(caso.producto._id)).estado, 'activo');
  });

  await t.test('fallo y carga terminada después del plazo no congelan la reserva; limpieza de archivos huérfanos', async () => {
    const caso = await preparar();
    falloStorage = true;
    assert.equal((await subir(caso)).status, 503);
    falloStorage = false;
    assert.equal((await Solicitud.findById(caso.id)).estado, 'confirmada');
    assert.equal((await Solicitud.findById(caso.id)).comprobanteRecibidoEn, undefined);
    const vence = (await Solicitud.findById(caso.id)).venceEn.getTime();
    despuesCarga = async () => { ahora = vence; };
    assert.equal((await subir(caso)).status, 409);
    despuesCarga = null;
    await expiracion.procesar({ productoId: caso.producto._id });
    assert.equal((await Producto.findById(caso.producto._id)).estado, 'activo');
    await service.limpiarCargas();
    const fallidos = await Comprobante.find({ reservaId: caso.id, estado: 'fallido' }).select('+clavePrivada').lean();
    assert.equal(fallidos.length, 2);
    for (const c of fallidos) assert.equal(archivos.has(c.clavePrivada), false);
    // La limpieza repetida también elimina un objeto remoto que terminó tarde tras un timeout.
    archivos.set(fallidos[0].clavePrivada, imagen);
    await service.limpiarCargas();
    assert.equal(archivos.has(fallidos[0].clavePrivada), false);
  });

  await t.test('metadato preparando abandonado no pausa vencimiento y se puede reintentar tras la concesión', async () => {
    const caso = await preparar();
    const id = new mongoose.Types.ObjectId();
    await Comprobante.create({ _id: id, reservaId: caso.id, compradorId: caso.comprador._id, vendedorId: vendedor._id,
      clavePrivada: `${vendedor.id}/${caso.id}/${id}.webp`, tipo: 'image/webp', tamano: 10, estado: 'preparando', finalizaCargaEn: new Date(ahora - 1) });
    assert.equal((await subir(caso)).status, 201);
    assert.equal((await Comprobante.findById(id)).estado, 'fallido');
  });

  await t.test('sin configuración externa falla sin pausar la reserva y se aplica límite de frecuencia', async () => {
    const caso = await preparar();
    configurado = false;
    assert.equal((await subir(caso)).status, 503);
    configurado = true;
    for (let i = 0; i < 4; i++) assert.equal((await subir(caso, caso.comprador, Buffer.from('falso'))).status, 400);
    assert.equal((await subir(caso)).status, 429);
    assert.equal((await Solicitud.findById(caso.id)).estado, 'confirmada');
    assert.deepEqual(await Pedido.findById(legado._id).lean(), anterior);
  });
});
