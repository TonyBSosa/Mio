const { test } = require('node:test');
const assert = require('node:assert/strict');
const explorar = require('../src/services/explorarPublicoService');
const repo = require('../src/repositories/explorarPublicoRepository');
const pedidos = require('../src/repositories/pedidoRepository');
const productos = require('../src/repositories/productoRepository');
const servicio = require('../src/services/pedidoService');

test('sin vendedores activos no se publican perfiles ni eventos, tampoco en busqueda', async t => {
  const perfil = { vendedorId: 'inactivo', nombrePublico: 'Tienda' };
  const evento = { vendedorId: 'inactivo', nombre: 'Live' };
  for (const metodo of ['listarPerfilesActivos', 'buscarPerfiles']) t.mock.method(repo, metodo, async () => [perfil]);
  for (const metodo of ['listarEventosPublicos', 'buscarEventos']) t.mock.method(repo, metodo, async () => [evento]);
  t.mock.method(repo, 'listarVendedoresUsuariosActivos', async () => []);
  assert.deepEqual(await explorar.listarVendedores(), []);
  assert.deepEqual(await explorar.listarEventos(), []);
  assert.deepEqual(await explorar.buscar('Tienda'), { vendedores: [], eventos: [] });
});

test('repositorios desconectados fallan explicitamente', async () => {
  for (const operacion of [() => pedidos.apartarProductoPorIdYVendedor('id', 'v'),
    () => pedidos.liberarProductoPorIdYVendedor('id', 'v'),
    () => productos.tienePedidosAsociados('id', 'v'),
    () => repo.listarVendedoresUsuariosActivos()]) {
    await assert.rejects(operacion, { status: 503 });
  }
});

test('cancelacion comparte sesion y aborta si no puede liberar inventario', async t => {
  const session = {};
  t.mock.method(pedidos, 'transaccion', async fn => fn(session));
  t.mock.method(pedidos, 'eliminarPorIdYVendedor', async (id, vendedor, sesion) => {
    assert.equal(sesion, session); return { productoId: 'pieza' };
  });
  t.mock.method(pedidos, 'liberarProductoPorIdYVendedor', async (id, vendedor, sesion) => {
    assert.equal(sesion, session); return null;
  });
  await assert.rejects(servicio.eliminarPedido('507f1f77bcf86cd799439014', 'vendedor'), { status: 409 });
});
