const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarPlanEntrega } = require('../src/services/entregaPolicy');
const repository = require('../src/repositories/pedidoRepository');
const service = require('../src/services/pedidoService');
const Pedido = require('../src/models/pedidos');

const id = '507f1f77bcf86cd799439011';
const vendedor = '507f1f77bcf86cd799439012';
const plan = { tipo: 'zona_comun', lugar: '  Entrada del centro comercial  ', fecha: '2026-11-25' };

test('entrega exige modalidad, lugar concreto y día real sin desplazar la fecha', () => {
  assert.deepEqual(validarPlanEntrega(plan), { ...plan, lugar: plan.lugar.trim() });
  for (const cambio of [null, {}, { ...plan, tipo: 'casa' }, { ...plan, lugar: ' ' }, { ...plan, lugar: 'a'.repeat(201) },
    { ...plan, fecha: '2026-02-30' }, { ...plan, fecha: '2026-13-01' }, { ...plan, fecha: '2026-11-25T00:00:00Z' }]) {
    assert.throws(() => validarPlanEntrega(cambio), { status: 400 });
  }
  assert.equal(validarPlanEntrega({ ...plan, tipo: 'local', fecha: '2028-02-29' }).fecha, '2028-02-29');
});

test('programación y confirmación aíslan tienda, conservan pago y admiten pedidos de comprobantes', async t => {
  let actual = { _id: id, vendedorId: vendedor, estadoEntrega: 'pendiente', estadoPago: 'pendiente', reservaSolicitudId: id };
  t.mock.method(repository, 'buscarPorIdYVendedor', async (pedidoId, tienda) => pedidoId === id && tienda === vendedor ? actual : null);
  const actualizar = t.mock.method(repository, 'actualizarPorIdYVendedor', async (pedidoId, tienda, datos) => {
    assert.equal(tienda, vendedor);
    assert.equal(pedidoId, id);
    assert.equal(datos.estadoPago, undefined);
    actual = { ...actual, ...datos };
    return actual;
  });
  await assert.rejects(service.actualizarEntregaPedido(id, 'entregado', vendedor), { status: 400 });
  await assert.rejects(service.actualizarEntregaPedido(id, undefined, id, plan), { status: 404 });
  assert.equal(actualizar.mock.callCount(), 0);
  const programado = await service.actualizarEntregaPedido(id, undefined, vendedor, plan);
  assert.equal(programado.estadoEntrega, 'pendiente');
  assert.equal(programado.planEntrega.fecha, plan.fecha);
  const entregado = await service.actualizarEntregaPedido(id, 'entregado', vendedor);
  assert.equal(entregado.estadoEntrega, 'entregado');
  assert.equal(entregado.estadoPago, 'pendiente');
  await assert.rejects(service.actualizarEntregaPedido(id, undefined, vendedor, plan), { status: 409 });
  await service.actualizarEntregaPedido(id, 'pendiente', vendedor);
  await service.actualizarEntregaPedido(id, undefined, vendedor, { ...plan, tipo: 'local' });
  assert.equal(actual.planEntrega.tipo, 'local');
});

test('crear/editar no permite saltarse la programación; documentos históricos conservan compatibilidad', async t => {
  await assert.rejects(service.crearPedido({ estadoEntrega: 'entregado' }, vendedor), { status: 400 });
  t.mock.method(repository, 'buscarPorIdYVendedor', async () => ({ _id: id, estadoEntrega: 'pendiente' }));
  await assert.rejects(service.actualizarPedido(id, { estadoEntrega: 'entregado' }, vendedor), { status: 400 });
  const historico = new Pedido({ clienteId: id, vendedorId: vendedor, producto: 'Blusa', precio: 200, estadoEntrega: 'entregado' });
  assert.equal(historico.validateSync(), undefined);
  assert.equal(historico.planEntrega, undefined);
  historico.planEntrega = validarPlanEntrega(plan);
  assert.equal(historico.validateSync(), undefined);
  assert.equal(historico.toObject().planEntrega.fecha, plan.fecha);
});
