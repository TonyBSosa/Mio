const { test } = require('node:test');
const assert = require('node:assert/strict');
const repository = require('../src/repositories/productoRepository');
const service = require('../src/services/productoService');
const Producto = require('../src/models/productos');

test('codigos de piezas: compatibilidad, validacion y conflictos', async (t) => {
  const vendedor = '507f1f77bcf86cd799439011';
  const id = '507f1f77bcf86cd799439012';
  const datos = { nombre: 'Blusa', precio: 200 };
  t.mock.method(repository, 'crearProducto', async (data) => data);
  t.mock.method(repository, 'actualizarPorIdYVendedor', async (id, vendedorId, data) => ({ id, vendedorId, ...data }));
  const creado = await service.crearProducto({ ...datos, codigo: ' blusa-01 ' }, vendedor);
  assert.equal(creado.codigo, 'BLUSA-01');
  assert.equal(creado.vendedorId, vendedor);
  assert.match((await service.crearProducto(datos, vendedor)).codigo, /^P-[A-F0-9]{12}$/);
  for (const codigo of [null, 23, '   ', 'A B', 'A'.repeat(31)]) {
    await assert.rejects(service.crearProducto({ ...datos, codigo }, vendedor), { status: 400 });
  }
  const editado = await service.actualizarProducto(id, { codigo: 'pieza-2' }, vendedor);
  assert.equal(editado.codigo, 'PIEZA-2');
  assert.equal(editado.vendedorId, vendedor);
  assert.equal(Object.hasOwn(await service.actualizarProducto(id, { nombre: 'Nueva' }, vendedor), 'codigo'), false);
  repository.crearProducto = async () => { throw Object.assign(new Error('duplicado'), { code: 11000, keyPattern: { vendedorId: 1, codigo: 1 } }); };
  await assert.rejects(service.crearProducto(datos, vendedor), { status: 409 });
  repository.actualizarPorIdYVendedor = repository.crearProducto;
  await assert.rejects(service.actualizarProducto(id, { codigo: 'ABC' }, vendedor), { status: 409 });
  const indice = Producto.schema.indexes().find(([keys]) => keys.codigo);
  assert.deepEqual(indice[0], { vendedorId: 1, codigo: 1 });
  assert.equal(indice[1].unique, true);
  assert.deepEqual(indice[1].partialFilterExpression, { codigo: { $type: 'string' } });
});
