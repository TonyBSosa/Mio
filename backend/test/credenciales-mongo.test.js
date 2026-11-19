const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Recuperacion = require('../src/models/recuperacion');
const Perfil = require('../src/models/perfilVendedor');
const controller = require('../src/controllers/authController');
const usuarios = require('../src/services/userService');
const proteger = require('../src/middlewares/authMiddleware');
const correo = require('../src/services/correoService');
const crypto = require('node:crypto');
const uri = process.env.MIO_CREDENCIALES_TEST_URI;
const clave = 'Una frase sintética 2026';
const admin = '507f1f77bcf86cd799439099';
const respuesta = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; },
  json(body) { this.body = body; return this; } });
async function llamar(fn, body) { const res = respuesta(); await fn({ body }, res); return res; }
async function acceso(token) {
  const res = respuesta(); let autorizado = false;
  await proteger({ headers: { authorization: 'Bearer ' + token } }, res, () => { autorizado = true; });
  return autorizado;
}

test('MongoDB standalone desechable: credenciales, carreras, baja y compatibilidad', { skip: !uri }, async t => {
  // No admite MONGO_URI, servidores remotos, otro puerto, credenciales ni bases arbitrarias.
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27191\/mio_pruebas_credenciales_[a-f0-9]{32}$/);
  process.env.JWT_SECRET = 'solo-test-credenciales-sinteticas';
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 4000 });
  t.after(() => mongoose.disconnect()); // Sin dropDatabase: el proceso/almacenamiento es exclusivo de esta ejecución.
  const topologia = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.equal(topologia.setName, undefined, 'esta prueba demuestra funcionamiento SIN transacciones');
  const fixture = async (extra = {}) => User.create({ nombre: 'Sintético',
    email: crypto.randomUUID() + '@example.invalid', rol: 'vendedor', estado: 'activo',
    password: await bcrypt.hash(clave, 10), ...extra });
  const login = user => llamar(controller.login, { email: user.email, password: clave });
  const recuperar = async user => {
    // Fixture de enlace: las cuotas/envío se ejercitan en recuperacion-mongo.test.js.
    const token = crypto.randomBytes(32).toString('hex');
    const actual = await User.findById(user._id);
    await Recuperacion.create({ usuarioId: user._id, credentialVersion: actual.credentialVersion ?? null,
      tokenHash: Recuperacion.hashToken(token), expiresAt: new Date(Date.now() + 1800000) });
    return token;
  };

  await t.test('claves heredadas, sesiones sin versión y login concurrente', async () => {
    const u = await fixture();
    const sesion = await Sesion.create({ usuarioId: u._id, expiresAt: new Date(Date.now() + 60000) });
    assert.equal(await acceso(jwt.sign({ id: u.id, sid: sesion.id }, process.env.JWT_SECRET)), true);
    const sesiones = await Promise.all([login(u), login(u)]);
    assert.ok(sesiones.every(r => r.statusCode === 200));
    assert.ok((await Promise.all(sesiones.map(r => acceso(r.body.token)))).every(Boolean));
    const token = await recuperar(u);
    await usuarios.actualizarUsuario(u.id, { password: 'Otra frase válida 2026' }, admin);
    for (const r of sesiones) assert.equal(await acceso(r.body.token), false);
    assert.equal(await acceso(jwt.sign({ id: u.id, sid: sesion.id }, process.env.JWT_SECRET)), false);
    assert.equal((await llamar(controller.restablecerPassword, { token, password: clave })).statusCode, 400);
    assert.equal((await login(u)).statusCode, 401);
    assert.equal((await llamar(controller.login, { email: u.email, password: 'Otra frase válida 2026' })).statusCode, 200);
  });

  await t.test('login entre comprobación bcrypt y cambio de clave no obtiene sesión válida', async () => {
    const u = await fixture();
    const create = Sesion.create.bind(Sesion);
    const mock = t.mock.method(Sesion, 'create', async data => {
      await usuarios.actualizarUsuario(u.id, { password: 'Clave cambiada durante login' }, admin);
      return create(data);
    });
    const r = await login(u); mock.mock.restore();
    assert.equal(r.statusCode, 401);
  });

  await t.test('suspender/reactivar invalida sesiones y recuperaciones, incluso versiones heredadas', async () => {
    const u = await fixture(); const r = await login(u); const token = await recuperar(u);
    await usuarios.actualizarEstadoUsuario(u.id, 'inactivo', admin);
    assert.equal(await acceso(r.body.token), false);
    const inactivo = await login(u);
    const inexistente = await llamar(controller.login, { email: 'no-existe@example.invalid', password: clave });
    assert.deepEqual(inactivo.body, inexistente.body); assert.equal(inactivo.statusCode, 401);
    await usuarios.actualizarEstadoUsuario(u.id, 'activo', admin);
    assert.equal(await acceso(r.body.token), false);
    assert.equal((await llamar(controller.restablecerPassword, { token, password: clave })).statusCode, 400);
    assert.equal((await login(u)).statusCode, 200);
  });

  await t.test('dos resets simultáneos con el mismo token y con tokens distintos: un solo ganador', async () => {
    for (const mismoToken of [true, false]) {
      const u = await fixture(); const sesion = await login(u);
      const a = await recuperar(u), b = mismoToken ? a : await recuperar(u);
      const resultados = await Promise.all([a, b].map(token => llamar(controller.restablecerPassword,
        { token, password: 'Nueva frase para carrera 2026' })));
      assert.deepEqual(resultados.map(r => r.statusCode).sort(), [200, 400]);
      assert.equal(await acceso(sesion.body.token), false);
      assert.equal((await llamar(controller.restablecerPassword, { token: a, password: clave })).statusCode, 400);
    }
  });

  await t.test('reset vencido, manipulado y fallo de escritura nunca anuncian éxito', async () => {
    const u = await fixture(); const token = await recuperar(u);
    await Recuperacion.updateOne({ usuarioId: u._id }, { $set: { expiresAt: new Date(0) } });
    assert.equal((await llamar(controller.restablecerPassword, { token, password: clave })).statusCode, 400);
    assert.equal((await llamar(controller.restablecerPassword, { token: 'x'.repeat(64), password: clave })).statusCode, 400);
    const nuevo = await recuperar(u);
    const mock = t.mock.method(User, 'findOneAndUpdate', async () => { throw new Error('secreto-no-exponer'); });
    const r = await llamar(controller.restablecerPassword, { token: nuevo, password: clave }); mock.mock.restore();
    assert.equal(r.statusCode, 503); assert.ok(!JSON.stringify(r.body).includes('secreto-no-exponer'));
    assert.equal((await login(u)).statusCode, 200);
  });

  await t.test('baja conserva ID y todas las referencias, y no permite reactivar ni login/reset', async () => {
    const u = await fixture(); const sesion = await login(u); const token = await recuperar(u);
    await Perfil.create({ vendedorId: u._id, nombrePublico: 'Sintética' });
    const comprador = await fixture({ rol: 'cliente' });
    const ids = Object.fromEntries(['producto', 'cliente', 'live', 'pedido', 'reserva', 'comprobante'].map(k => [k, new mongoose.Types.ObjectId()]));
    const referencias = [
      ['productos', { _id: ids.producto, vendedorId: u._id, reservaSolicitudId: ids.reserva }],
      ['clientes', { _id: ids.cliente, vendedorId: u._id, usuarioId: comprador._id }],
      ['lives', { _id: ids.live, vendedorId: u._id }],
      ['solicitudes_apartado', { _id: ids.reserva, vendedorId: u._id, compradorId: comprador._id,
        productoId: ids.producto, pedidoId: ids.pedido, comprobanteActualId: ids.comprobante }],
      ['comprobantes', { _id: ids.comprobante, reservaId: ids.reserva, vendedorId: u._id, compradorId: comprador._id }],
      ['pedidos', { _id: ids.pedido, vendedorId: u._id, clienteId: ids.cliente, productoId: ids.producto,
        liveId: ids.live, reservaSolicitudId: ids.reserva, comprobanteId: ids.comprobante }],
    ];
    const antes = [];
    for (const [c, doc] of referencias) antes.push([c, (await mongoose.connection.db.collection(c).insertOne(doc)).insertedId]);
    await usuarios.eliminarUsuario(u.id, admin);
    await usuarios.eliminarUsuario(comprador.id, admin);
    const borrado = await User.findById(u._id);
    assert.ok(borrado.deletedAt); assert.equal(borrado.estado, 'inactivo');
    assert.ok(await Perfil.findOne({ vendedorId: u._id }));
    for (const [c, doc] of referencias) assert.deepEqual(await mongoose.connection.db.collection(c).findOne({ _id: doc._id }), doc);
    assert.ok((await User.findById(comprador._id)).deletedAt);
    assert.equal(await acceso(sesion.body.token), false); assert.equal((await login(u)).statusCode, 401);
    assert.equal((await llamar(controller.restablecerPassword, { token, password: clave })).statusCode, 400);
    await assert.rejects(usuarios.actualizarEstadoUsuario(u.id, 'activo', admin), { status: 404 });
    assert.ok(await User.exists({ _id: u._id, deletedAt: { $ne: null } }));
  });

  await t.test('registro y administración comparten política; errores E11000 no filtran detalles', async () => {
    for (const password of ['corta', 'á'.repeat(40), 'passwordpassword']) {
      assert.equal((await llamar(controller.registrar, { nombre: 'Test', email: 'test@example.invalid', password })).statusCode, 400);
      await assert.rejects(usuarios.crearUsuario({ nombre: 'Test', email: 'test@example.invalid', password }), { status: 400 });
      const u = await fixture();
      await assert.rejects(usuarios.actualizarUsuario(u.id, { password }, admin), { status: 400 });
    }
    const mock = t.mock.method(User, 'create', async () => { throw Object.assign(new Error('email-privado'), { code: 11000 }); });
    const r = await llamar(controller.registrar, { nombre: 'Test', email: 'duplicado@example.invalid', password: clave });
    mock.mock.restore(); assert.equal(r.statusCode, 409); assert.ok(!JSON.stringify(r.body).includes('email-privado'));
  });

  await t.test('JWT manipulado, sid ajeno y versión falsificada se rechazan; sin índices nuevos', async () => {
    const a = await fixture(), b = await fixture(); const sesion = await login(a);
    const payload = jwt.verify(sesion.body.token, process.env.JWT_SECRET);
    assert.equal(await acceso(jwt.sign({ id: b.id, sid: payload.sid }, process.env.JWT_SECRET)), false);
    assert.equal(await acceso(jwt.sign({ id: a.id, sid: payload.sid, cv: 'falsa' }, process.env.JWT_SECRET)), false);
    assert.equal(await acceso(sesion.body.token.slice(0, -8) + 'alterado'), false);
    for (const modelo of [User, Sesion, Recuperacion]) {
      const indices = await modelo.collection.indexes();
      assert.deepEqual(indices.map(i => i.name), ['_id_']);
    }
  });
});
