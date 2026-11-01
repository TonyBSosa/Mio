const { test } = require('node:test');
const assert = require('node:assert/strict');
const repository = require('../src/repositories/pedidoRepository');
const service = require('../src/services/pedidoService');
const Pedido = require('../src/models/pedidos');

test('venta directa y vinculacion de piezas sin modificar pedidos heredados', async (t) => {
  const vendedor = '507f1f77bcf86cd799439011';
  const clienteId = '507f1f77bcf86cd799439012';
  const productoId = '507f1f77bcf86cd799439013';
  const pedidoId = '507f1f77bcf86cd799439014';
  t.mock.method(repository, 'buscarClientePorIdYVendedor', async (id, tienda) => {
    assert.equal(tienda, vendedor); return { _id: id };
  });
  const liveMock = t.mock.method(repository, 'buscarLivePorIdYVendedor', async () => ({ estado: 'activo' }));
  t.mock.method(repository, 'buscarProductoPorIdYVendedor', async (id, tienda) => {
    assert.equal(tienda, vendedor); return { _id: id, nombre: 'Blusa real', estado: 'activo' };
  });
  t.mock.method(repository, 'crearPedido', async (data) => data);
  const base = { clienteId, productoId, producto: 'Nombre alterado', precio: 500, cantidad: 1, liveId: '' };
  const pedido = await service.crearPedido(base, vendedor);
  assert.equal(pedido.productoId, productoId);
  assert.equal(pedido.producto, 'Blusa real');
  assert.equal(pedido.liveId, undefined);
  assert.equal(liveMock.mock.callCount(), 0);
  assert.equal(new Pedido(pedido).validateSync(), undefined);
  await assert.rejects(service.crearPedido({ ...base, cantidad: 2 }, vendedor), { status: 400 });
  await assert.rejects(service.crearPedido({ ...base, precio: Infinity }, vendedor), { status: 400 });
  await assert.rejects(service.crearPedido({ ...base, liveId: 'invalido' }, vendedor), { status: 400 });
  t.mock.method(repository, 'buscarPorIdYVendedor', async () => pedido);
  t.mock.method(repository, 'actualizarPorIdYVendedor', async (id, tienda, data) => ({ ...pedido, ...data }));
  await assert.rejects(service.actualizarPedido(pedidoId, { productoId: pedidoId }, vendedor), { status: 400 });
  await assert.rejects(service.actualizarPedido(pedidoId, { cantidad: 2 }, vendedor), { status: 400 });
  assert.equal((await service.actualizarPedido(pedidoId, { observaciones: 'Retiro viernes', liveId: '' }, vendedor)).liveId, null);
  repository.buscarProductoPorIdYVendedor = async () => null;
  await assert.rejects(service.crearPedido(base, vendedor), { status: 404 });
  repository.buscarProductoPorIdYVendedor = async () => ({ estado: 'apartado' });
  await assert.rejects(service.crearPedido(base, vendedor), { status: 409 });
  const heredado = await service.crearPedido({ clienteId, producto: 'Captura manual', precio: 200 }, vendedor);
  assert.equal(heredado.producto, 'Captura manual');
  assert.equal(heredado.productoId, undefined);
});
