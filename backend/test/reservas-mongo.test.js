const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Producto = require('../src/models/productos');
const Solicitud = require('../src/models/solicitudApartado');
const Perfil = require('../src/models/perfilVendedor');
const Cliente = require('../src/models/clientes');
const Pedido = require('../src/models/pedidos');
const pedidoRepository = require('../src/repositories/pedidoRepository');
const solicitudRepository = require('../src/repositories/solicitudApartadoRepository');
const productoRepository = require('../src/repositories/productoRepository');
const app = require('../src/expressApp');

const uri = process.env.MIO_MONGO_PRUEBAS_URI;
test('MongoDB real aislado: persistencia, roles, rechazo, transacciones y concurrencia', { skip: !uri }, async t => {
  // Este test nunca usa MONGO_URI ni permite una base de aplicación/producción.
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27182\/mio_pruebas_[a-z0-9_]+\?replicaSet=mioPruebas$/);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  t.after(async () => {
    assert.match(mongoose.connection.name, /^mio_pruebas_/);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all([User, Sesion, Producto, Solicitud, Perfil, Cliente, Pedido].map(model => model.init()));
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'solo-pruebas-reservas';
  process.env.RESERVAS_PRUEBA_HABILITADAS = 'false';
  const [a, b, vendedor, ajeno, admin] = await User.create(['cliente', 'cliente', 'vendedor', 'vendedor', 'admin'].map((rol, i) => ({
    nombre: `Prueba ${i}`, email: `prueba-${i}@example.invalid`, password: 'hash-no-utilizable-para-login', rol,
  })));
  const sesiones = await Sesion.create([a, b, vendedor, ajeno, admin].map(u => ({ usuarioId: u._id, expiresAt: new Date(Date.now() + 600000) })));
  const tokens = new Map([a, b, vendedor, ajeno, admin].map((u, i) => [String(u._id), jwt.sign({ id: String(u._id), sid: String(sesiones[i]._id) }, process.env.JWT_SECRET, { expiresIn: '10m' })]));
  const pieza = await Producto.create({ vendedorId: vendedor._id, nombre: 'Blusa prueba', codigo: 'B-1', precio: 250 });
  const legado = await Pedido.create({ clienteId: new mongoose.Types.ObjectId(), vendedorId: vendedor._id, producto: 'Pedido previo', precio: 90 });
  const legadoAntes = await Pedido.findById(legado._id).lean();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/solicitudes-apartado`;
  const request = (user, method = 'GET', suffix = '', body) => fetch(base + suffix, {
    method, headers: { Authorization: `Bearer ${tokens.get(String(user._id))}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const crear = user => request(user, 'POST', '', { productoId: String(pieza._id), precioRegistrado: 1, vendedorId: String(ajeno._id) });
  const duplicadas = await Promise.all([crear(a), crear(a)]);
  assert.deepEqual(duplicadas.map(r => r.status).sort(), [201, 409]);
  const s1 = await duplicadas.find(r => r.status === 201).json();
  assert.equal(s1.precioRegistrado, 250);
  assert.equal(String(s1.vendedorId), String(vendedor._id));
  assert.ok(await mongoose.connection.db.collection('solicitudes_apartado').findOne({ _id: new mongoose.Types.ObjectId(s1._id) }));
  const respuestaB = await crear(b);
  assert.equal(respuestaB.status, 201);
  const s2 = await respuestaB.json();
  for (const user of [a, b]) assert.equal((await (await request(user)).json()).length, 1);
  assert.equal((await (await request(vendedor)).json()).length, 2);
  assert.equal((await (await request(ajeno)).json()).length, 0);
  assert.equal((await request(b, 'GET', '/' + s1._id)).status, 404);
  assert.equal((await request(ajeno, 'PATCH', `/${s1._id}/confirmar`)).status, 404);
  assert.equal((await request(ajeno, 'PATCH', `/${s1._id}/rechazar`)).status, 404);
  for (const user of [a, admin]) assert.equal((await request(user, 'PATCH', `/${s1._id}/confirmar`)).status, 403);
  assert.equal((await request(vendedor, 'PATCH', `/${s1._id}/confirmar`)).status, 503);
  assert.equal((await Producto.findById(pieza._id)).estado, 'activo');

  process.env.RESERVAS_PRUEBA_HABILITADAS = 'true';
  process.env.RESERVAS_PRUEBA_VENDEDORES = String(vendedor._id);
  assert.equal((await request(vendedor, 'PATCH', '/configuracion', { plazoReservaDias: 4 })).status, 400);
  assert.equal((await request(vendedor, 'PATCH', '/configuracion', { plazoReservaDias: 7, vendedorId: ajeno._id })).status, 200);
  assert.equal((await Perfil.findOne({ vendedorId: vendedor._id })).plazoReservaDias, 7);
  assert.equal(await Perfil.findOne({ vendedorId: ajeno._id }), null);
  assert.equal((await (await request(vendedor, 'GET', '/configuracion')).json()).confirmacionPruebaHabilitada, true);
  process.env.NODE_ENV = 'production';
  assert.equal((await request(vendedor, 'PATCH', `/${s1._id}/confirmar`)).status, 503);
  process.env.NODE_ENV = 'test';
  for (const estado of ['inactivo', 'apartado']) {
    await Producto.updateOne({ _id: pieza._id }, { $set: { estado } });
    assert.equal((await request(vendedor, 'PATCH', `/${s1._id}/confirmar`)).status, 409);
  }
  await Producto.updateOne({ _id: pieza._id }, { $set: { estado: 'activo' } });
  const carrera = await Promise.all([s1, s2].map(s => request(vendedor, 'PATCH', `/${s._id}/confirmar`)));
  assert.deepEqual(carrera.map(r => r.status).sort(), [200, 409]);
  const ganadora = await Solicitud.findOne({ estado: 'confirmada' }).lean();
  const perdedora = await Solicitud.findOne({ estado: 'pendiente' }).lean();
  const reservada = await Producto.findById(pieza._id).lean();
  assert.equal(reservada.estado, 'apartado');
  assert.equal(String(reservada.reservaSolicitudId), String(ganadora._id));
  assert.equal(ganadora.venceEn - ganadora.confirmadoEn, 7 * 86400000);
  assert.equal(ganadora.precioConfirmado, 250);
  assert.equal(ganadora.esPrueba, true);
  const vistaComprador = await (await request(String(ganadora.compradorId) === String(a._id) ? a : b)).json();
  assert.equal(vistaComprador[0].estado, 'confirmada');
  assert.equal(await productoRepository.actualizarPorIdYVendedor(pieza._id, vendedor._id, { estado: 'activo' }), null);
  assert.equal(await productoRepository.eliminarPorIdYVendedor(pieza._id, vendedor._id), null);
  assert.equal(await pedidoRepository.liberarProductoPorIdYVendedor(pieza._id, vendedor._id), null);
  assert.equal(await pedidoRepository.apartarProductoPorIdYVendedor(pieza._id, vendedor._id), null);
  const rechazo = await request(vendedor, 'PATCH', `/${perdedora._id}/rechazar`);
  assert.equal(rechazo.status, 200);
  assert.equal((await rechazo.json()).estado, 'rechazada');
  assert.equal(await Solicitud.findById(perdedora._id), null);
  assert.equal((await request(a, 'GET', '/' + perdedora._id)).status, 404);
  assert.equal((await request(b, 'GET', '/' + perdedora._id)).status, 404);
  assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
  assert.equal((await request(vendedor, 'PATCH', `/${ganadora._id}/rechazar`)).status, 409);
  assert.equal((await request(vendedor, 'PATCH', `/${perdedora._id}/rechazar`)).status, 404);

  const libre = await Producto.create({ vendedorId: vendedor._id, nombre: 'Otra pieza', codigo: 'B-2', precio: 180 });
  const pendiente = await Solicitud.create({ compradorId: a._id, vendedorId: vendedor._id, productoId: libre._id, compradorNombre: 'Prueba', productoNombre: libre.nombre, tiendaNombre: 'Prueba' });
  // Fallo real dentro de la transacción después de escribir el producto: debe revertir ambas escrituras.
  const fallo = t.mock.method(Solicitud, 'findOneAndUpdate', async () => { throw Error('fallo de prueba antes de guardar solicitud'); });
  await assert.rejects(solicitudRepository.confirmar({ _id: pendiente._id, vendedorId: vendedor._id }, 3), /fallo de prueba/);
  fallo.mock.restore();
  assert.equal((await Producto.findById(libre._id)).estado, 'activo');
  assert.equal((await Producto.findById(libre._id)).reservaSolicitudId, undefined);
  assert.equal((await Solicitud.findById(pendiente._id)).estado, 'pendiente');
  assert.equal((await request(vendedor, 'PATCH', `/${pendiente._id}/rechazar`)).status, 200);
  assert.equal((await Producto.findById(libre._id)).estado, 'activo');
  const nueva = await request(a, 'POST', '', { productoId: String(libre._id) });
  assert.equal(nueva.status, 201); // La solicitud rechazada fue eliminada y permite volver a solicitar.
  const nuevaSolicitud = await nueva.json();
  assert.equal(await Solicitud.countDocuments({ productoId: libre._id }), 1);
  assert.equal((await request(vendedor, 'PATCH', '/configuracion', { plazoReservaDias: 3 })).status, 200);
  assert.equal((await request(vendedor, 'PATCH', `/${nuevaSolicitud._id}/confirmar`)).status, 200);
  const reservaTresDias = await Solicitud.findById(nuevaSolicitud._id);
  assert.equal(reservaTresDias.venceEn - reservaTresDias.confirmadoEn, 3 * 86400000);
  assert.equal((await request(b, 'PATCH', `/${nuevaSolicitud._id}/cancelar`)).status, 404);
  assert.equal((await request(vendedor, 'PATCH', `/${nuevaSolicitud._id}/cancelar`)).status, 403);
  const falloCancelacion = t.mock.method(Solicitud, 'findOneAndDelete', async filtro => {
    if (filtro.estado === 'confirmada') throw Error('Fallo de cancelación de prueba');
    return null;
  });
  assert.equal((await request(a, 'PATCH', `/${nuevaSolicitud._id}/cancelar`)).status, 500);
  falloCancelacion.mock.restore();
  assert.equal((await Producto.findById(libre._id)).estado, 'apartado');
  assert.equal((await Solicitud.findById(nuevaSolicitud._id)).estado, 'confirmada');
  assert.equal((await request(a, 'PATCH', `/${nuevaSolicitud._id}/cancelar`)).status, 200);
  assert.equal(await Solicitud.findById(nuevaSolicitud._id), null);
  assert.equal((await Producto.findById(libre._id)).estado, 'activo');
  assert.equal((await Producto.findById(libre._id)).reservaSolicitudId, undefined);
  const paraCancelar = await (await request(a, 'POST', '', { productoId: libre.id })).json();
  process.env.NODE_ENV = 'production'; // Las pendientes no requieren transacción ni flags de pruebas.
  assert.equal((await request(a, 'PATCH', `/${paraCancelar._id}/cancelar`)).status, 200);
  process.env.NODE_ENV = 'test';
  assert.equal((await request(a, 'PATCH', `/${paraCancelar._id}/cancelar`)).status, 404);
  assert.equal(await Solicitud.findById(paraCancelar._id), null);
  assert.equal((await Producto.findById(libre._id)).estado, 'activo');
  const carreraSolicitud = await (await request(a, 'POST', '', { productoId: libre.id })).json();
  const carreraCancelacion = await Promise.all([
    request(vendedor, 'PATCH', `/${carreraSolicitud._id}/confirmar`),
    request(a, 'PATCH', `/${carreraSolicitud._id}/cancelar`),
  ]);
  assert.ok([200, 404, 409].includes(carreraCancelacion[0].status));
  assert.equal(carreraCancelacion[1].status, 200);
  assert.equal(await Solicitud.findById(carreraSolicitud._id), null);
  assert.equal((await Producto.findById(libre._id)).estado, 'activo');
  assert.deepEqual(await Pedido.findById(legado._id).lean(), legadoAntes);
  assert.equal(await Pedido.countDocuments(), 1);
});
