const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/expressApp');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Pedido = require('../src/models/pedidos');
const repo = require('../src/repositories/pedidoRepository');

test('entregas HTTP y MongoDB aislado: persistencia, roles, propiedad y carrera con confirmación', {
  skip: !process.env.MIO_ENTREGAS_MONGOD,
}, async t => {
  const tmp = path.resolve(__dirname, '../../tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const dbpath = fs.mkdtempSync(path.join(tmp, 'entregas-mongo-'));
  const uri = 'mongodb://127.0.0.1:27196/mio_pruebas_entregas';
  const mongo = spawn(process.env.MIO_ENTREGAS_MONGOD, ['--dbpath', dbpath, '--port', '27196', '--bind_ip', '127.0.0.1', '--logpath', path.join(dbpath, 'mongod.log')], {
    windowsHide: true, stdio: 'ignore',
  });
  const cerrado = new Promise(resolve => mongo.once('close', resolve));
  let falloInicio;
  mongo.on('error', error => { falloInicio = error; });
  let conectado = false;
  let instanciaPropia = false;
  let server;
  t.after(async () => {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    if (conectado) {
      assert.equal(mongoose.connection.name, 'mio_pruebas_entregas');
      assert.equal(mongoose.connection.port, 27196);
      if (instanciaPropia) await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
    mongo.kill(); await cerrado;
    const destino = path.resolve(dbpath);
    assert.ok(destino.startsWith(tmp + path.sep + 'entregas-mongo-'));
    fs.rmSync(destino, { recursive: true, force: true });
  });
  for (let intento = 0; intento < 15; intento++) {
    if (falloInicio) throw falloInicio;
    try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 700 }); conectado = true; break; }
    catch { /* Esperar al arranque sin usar MONGO_URI ni la base de la aplicación. */ }
  }
  assert.ok(conectado, 'MongoDB de pruebas debe iniciar en el puerto aislado');
  const opciones = await mongoose.connection.db.admin().command({ getCmdLineOpts: 1 });
  assert.equal(path.resolve(opciones.parsed.storage.dbPath), path.resolve(dbpath), 'Usar exclusivamente la instancia temporal iniciada por esta prueba');
  instanciaPropia = true;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'solo-prueba-local-entregas';
  const usuarios = await User.create(['vendedor', 'vendedor', 'cliente', 'admin'].map((rol, i) => ({
    nombre: `Prueba ${i}`, email: `entrega-${i}@example.invalid`, password: 'hash-ficticio', rol,
  })));
  const sesiones = await Sesion.create(usuarios.map(u => ({ usuarioId: u._id, expiresAt: new Date(Date.now() + 600000) })));
  const tokens = usuarios.map((u, i) => jwt.sign({ id: String(u._id), sid: String(sesiones[i]._id) }, process.env.JWT_SECRET));
  const pedido = await Pedido.create({ clienteId: new mongoose.Types.ObjectId(), vendedorId: usuarios[0]._id,
    producto: 'Pieza ficticia', precio: 200, estadoPago: 'pendiente' });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/pedidos/${pedido.id}`;
  const request = (usuario, body, suffix = '/entrega', method = 'PATCH') => fetch(url + suffix, {
    method, headers: { 'Content-Type': 'application/json', ...(usuario === null ? {} : { Authorization: 'Bearer ' + tokens[usuario] }) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const planEntrega = { tipo: 'local', lugar: 'Local ficticio frente al parque', fecha: '2026-11-25' };
  assert.equal((await request(null, { planEntrega })).status, 401);
  for (const rol of [2, 3]) assert.equal((await request(rol, { planEntrega })).status, 403);
  assert.equal((await request(1, { planEntrega })).status, 404);
  assert.equal((await request(0, { estadoEntrega: 'entregado' })).status, 400);
  assert.equal((await request(0, { planEntrega: { ...planEntrega, fecha: '2026-02-30' } })).status, 400);
  assert.equal((await request(0, { planEntrega })).status, 200);
  const lectura = await (await request(0, null, '', 'GET')).json();
  assert.deepEqual(lectura.planEntrega, planEntrega);
  assert.equal(lectura.estadoEntrega, 'pendiente');
  assert.equal(lectura.estadoPago, 'pendiente');
  assert.equal((await request(0, { estadoEntrega: 'entregado' })).status, 200);
  assert.equal((await request(0, { planEntrega })).status, 409);
  assert.equal((await request(0, { estadoEntrega: 'pendiente' })).status, 200);
  const nuevo = { ...planEntrega, tipo: 'zona_comun', lugar: 'Entrada ficticia', fecha: '2026-11-26' };
  assert.equal((await request(0, { planEntrega: nuevo })).status, 200);
  assert.equal((await request(0, { estadoEntrega: 'entregado' })).status, 200);
  // Una escritura de programación iniciada antes de la confirmación no puede aplicarse después.
  assert.equal(await repo.actualizarPorIdYVendedor(pedido.id, usuarios[0]._id, { planEntrega }), null);
  const final = await Pedido.findById(pedido.id).lean();
  assert.deepEqual(final.planEntrega, nuevo);
  assert.equal(final.estadoEntrega, 'entregado');
  assert.equal(final.estadoPago, 'pendiente');
  await Pedido.updateOne({ _id: pedido._id }, { $set: { canceladoEn: new Date() } });
  assert.equal((await request(0, { estadoEntrega: 'pendiente' })).status, 404);
});
