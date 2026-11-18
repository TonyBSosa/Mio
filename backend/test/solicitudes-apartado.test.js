const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const repository = require('../src/repositories/solicitudApartadoRepository');
const Solicitud = require('../src/models/solicitudApartado');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Pedido = require('../src/models/pedidos');
const Producto = require('../src/models/productos');
const app = require('../src/expressApp');

const ids = Array.from({ length: 8 }, (_, i) => `507f1f77bcf86cd7994390${20 + i}`);
const [comprador, otroComprador, vendedor, otroVendedor, productoId, solicitudId, admin, sid] = ids;

test('solicitudes HTTP: creación segura, duplicados concurrentes, aislamiento y compatibilidad', async t => {
  process.env.JWT_SECRET = 'solicitudes-test-only';
  const usuarios = {
    [comprador]: { _id: comprador, nombre: 'Compradora A', rol: 'cliente', estado: 'activo' },
    [otroComprador]: { _id: otroComprador, nombre: 'Compradora B', rol: 'cliente', estado: 'activo' },
    [vendedor]: { _id: vendedor, nombre: 'Tienda A', rol: 'vendedor', estado: 'activo' },
    [otroVendedor]: { _id: otroVendedor, nombre: 'Tienda B', rol: 'vendedor', estado: 'activo' },
    [admin]: { _id: admin, nombre: 'Admin', rol: 'admin', estado: 'activo' },
  };
  t.mock.method(User, 'findById', async id => usuarios[id]);
  t.mock.method(Sesion, 'exists', async () => true);
  let producto = { _id: productoId, vendedorId: vendedor, nombre: 'Blusa', codigo: 'BL-01', estado: 'activo' };
  t.mock.method(repository, 'buscarProducto', async () => producto);
  t.mock.method(repository, 'buscarVendedor', async id => usuarios[id]?.estado === 'activo' ? usuarios[id] : null);
  t.mock.method(repository, 'buscarPerfil', async () => ({ nombrePublico: 'Mi tienda' }));
  const registros = [];
  t.mock.method(repository, 'crear', async datos => {
    // Simula la respuesta atómica del índice MongoDB, no un chequeo previo en memoria de la app.
    if (registros.some(s => s.compradorId === datos.compradorId && s.productoId === datos.productoId)) {
      throw Object.assign(new Error('duplicate'), { code: 11000 });
    }
    const solicitud = { ...datos, _id: solicitudId, createdAt: new Date().toISOString() };
    registros.push(solicitud);
    return solicitud;
  });
  const coincide = (s, filtro) => Object.entries(filtro).every(([k, v]) => s[k] === v);
  t.mock.method(repository, 'listar', async filtro => registros.filter(s => coincide(s, filtro)));
  t.mock.method(repository, 'buscarPropia', async filtro => registros.find(s => coincide(s, filtro)) || null);
  const pedidos = t.mock.method(Pedido, 'create', () => { throw Error('No debe crear pedidos'); });
  const inventario = t.mock.method(Producto, 'findOneAndUpdate', () => { throw Error('No debe reservar'); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/solicitudes-apartado`;
  const request = (id, method = 'GET', body, suffix = '') => fetch(base + suffix, {
    method,
    headers: { 'Content-Type': 'application/json', ...(id ? { Authorization: 'Bearer ' + jwt.sign({ id, sid, rol: 'admin' }, process.env.JWT_SECRET) } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  assert.equal((await request(null, 'POST', { productoId })).status, 401);
  for (const id of [vendedor, admin]) assert.equal((await request(id, 'POST', { productoId })).status, 403);
  assert.equal((await request(comprador, 'POST', { productoId: { $ne: null } })).status, 400);
  assert.equal((await request(comprador, 'POST', {})).status, 400);
  const respuestas = await Promise.all([1, 2].map(() => request(comprador, 'POST', {
    productoId, compradorId: otroComprador, vendedorId: otroVendedor, estado: 'pagado', precio: 1,
  })));
  assert.deepEqual(respuestas.map(r => r.status).sort(), [201, 409]);
  const creada = await respuestas.find(r => r.status === 201).json();
  assert.equal(creada.compradorId, comprador);
  assert.equal(creada.vendedorId, vendedor);
  assert.equal(creada.estado, 'pendiente');
  assert.equal(creada.precio, undefined);
  assert.equal(creada.productoNombre, 'Blusa');
  assert.equal(creada.tiendaNombre, 'Mi tienda');
  assert.ok(creada.createdAt);

  assert.equal((await (await request(comprador)).json()).length, 1);
  assert.equal((await (await request(otroComprador, 'GET', null, `?compradorId=${comprador}`)).json()).length, 0);
  assert.equal((await (await request(vendedor)).json()).length, 1);
  assert.equal((await (await request(otroVendedor, 'GET', null, `?vendedorId=${vendedor}`)).json()).length, 0);
  for (const id of [otroComprador, otroVendedor]) assert.equal((await request(id, 'GET', null, '/' + solicitudId)).status, 404);
  for (const id of [comprador, vendedor]) assert.equal((await request(id, 'GET', null, '/' + solicitudId)).status, 200);
  assert.equal((await request(admin)).status, 403);
  assert.equal((await request(vendedor, 'PATCH', { estado: 'confirmado' }, '/' + solicitudId)).status, 404);

  for (const estado of ['inactivo', 'apartado']) {
    producto.estado = estado;
    assert.equal((await request(otroComprador, 'POST', { productoId })).status, 409);
  }
  producto.estado = 'activo';
  usuarios[vendedor].estado = 'inactivo';
  assert.equal((await request(otroComprador, 'POST', { productoId })).status, 404);
  producto = null;
  assert.equal((await request(otroComprador, 'POST', { productoId })).status, 404);
  assert.equal(registros.length, 1);
  assert.equal(pedidos.mock.callCount(), 0);
  assert.equal(inventario.mock.callCount(), 0);
});

test('Mongo: índice parcial único y espera de su construcción antes de crear', async t => {
  const indice = Solicitud.schema.indexes().find(([campos]) => campos.compradorId === 1 && campos.productoId === 1);
  assert.equal(indice[1].unique, true);
  assert.deepEqual(indice[1].partialFilterExpression, { estado: 'pendiente' });
  let confirmarIndices;
  t.mock.method(Solicitud, 'createIndexes', () => new Promise(resolve => { confirmarIndices = resolve; }));
  const crear = t.mock.method(Solicitud, 'create', async datos => datos);
  const guardado = repository.crear({ productoId });
  await Promise.resolve();
  assert.equal(crear.mock.callCount(), 0);
  confirmarIndices();
  await guardado;
  assert.equal(crear.mock.callCount(), 1);
});
