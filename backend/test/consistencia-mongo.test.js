const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Producto = require('../src/models/productos');
const Cliente = require('../src/models/clientes');
const Pedido = require('../src/models/pedidos');
const service = require('../src/services/pedidoService');
const repo = require('../src/repositories/pedidoRepository');
const productos = require('../src/repositories/productoRepository');
const uri = process.env.MIO_MONGO_PRUEBAS_URI;

test('MongoDB: rollback, concurrencia de disponibilidad y cancelacion con historial', { skip: !uri }, async t => {
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27182\/mio_pruebas_[a-z0-9_]+\?replicaSet=mioPruebas$/);
  await mongoose.connect(uri, { dbName: 'mio_pruebas_consistencia_' + process.pid, serverSelectionTimeoutMS: 8000 });
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
  await Promise.all([Producto.init(), Cliente.init(), Pedido.init()]);
  const vendedorId = new mongoose.Types.ObjectId();
  const cliente = await Cliente.create({ vendedorId, nombre: 'Cliente prueba', telefono: '99999999' });
  const pieza = await Producto.create({ vendedorId, nombre: 'Pieza', codigo: 'CONSISTENCIA', precio: 100 });
  const data = { clienteId: String(cliente._id), productoId: String(pieza._id), precio: 100 };
  const fallo = t.mock.method(repo, 'crearPedido', async () => { throw new Error('fallo inyectado'); });
  await assert.rejects(service.crearPedido(data, vendedorId), /fallo inyectado/);
  assert.equal((await Producto.findById(pieza._id)).estado, 'activo');
  assert.equal(await Pedido.countDocuments(), 0);
  fallo.mock.restore();
  const resultados = await Promise.allSettled([
    service.crearPedido(data, vendedorId), service.crearPedido(data, vendedorId),
    productos.actualizarPorIdYVendedor(pieza._id, vendedorId, { estado: 'inactivo' })
  ]);
  const pedidos = await Pedido.find({ canceladoEn: null });
  assert.ok(pedidos.length <= 1);
  if (!pedidos.length) {
    assert.equal((await Producto.findById(pieza._id)).estado, 'inactivo');
    await productos.actualizarPorIdYVendedor(pieza._id, vendedorId, { estado: 'activo' });
    await service.crearPedido(data, vendedorId);
  } else assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
  assert.ok(resultados.some(r => r.status === 'rejected'));
  const pedido = await Pedido.findOne({ canceladoEn: null });
  const liberar = t.mock.method(repo, 'liberarProductoPorIdYVendedor', async () => { throw new Error('fallo liberar'); });
  await assert.rejects(service.eliminarPedido(String(pedido._id), vendedorId), /fallo liberar/);
  assert.equal((await Pedido.findById(pedido._id)).canceladoEn, null);
  assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
  liberar.mock.restore();
  await service.eliminarPedido(String(pedido._id), vendedorId);
  assert.ok((await Pedido.findById(pedido._id)).canceladoEn);
  assert.equal((await Producto.findById(pieza._id)).estado, 'activo');
  assert.deepEqual(await repo.listarPorVendedor(vendedorId), []);
  await service.crearPedido(data, vendedorId);
  assert.equal(await Pedido.countDocuments(), 2);
});
