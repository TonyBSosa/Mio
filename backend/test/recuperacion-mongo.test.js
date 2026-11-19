const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/users');
const Recuperacion = require('../src/models/recuperacion');
const correo = require('../src/services/correoService');
const servicio = require('../src/services/recuperacionService');
const auth = require('../src/controllers/authController');
const credenciales = require('../src/services/credentialService');
const uri = process.env.MIO_RECUPERACION_TEST_URI;
const respuesta = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const llamar = async (fn, body) => { const r = respuesta(); await fn({ body }, r); return r; };
const clave = 'Frase sintética para pruebas';

test('recuperación en MongoDB standalone aislado, SMTP siempre simulado', { skip: !uri }, async t => {
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27191\/mio_pruebas_recuperacion_[a-f0-9]{32}$/);
  process.env.JWT_SECRET = 'solo-pruebas-recuperacion';
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 4000 });
  t.after(async () => { await servicio.esperarPendientes(); await mongoose.disconnect(); });
  const crear = async extra => User.create({ nombre: 'Sintético', email: crypto.randomUUID() + '@example.invalid',
    password: await bcrypt.hash(clave, 10), ...extra });

  await t.test('solicitudes concurrentes consumen un solo cupo y envían un solo enlace hasheado', async () => {
    const u = await crear(); let n = 0, token, meta;
    const mock = t.mock.method(correo, 'enviarRecuperacion', async (_, valor, opciones) => { n++; token = valor; meta = opciones; });
    process.env.RECOVERY_TOKEN_TTL_MINUTES = '7';
    const antes = Date.now(); await Promise.all(Array.from({ length: 10 }, () => servicio.procesar(u.email)));
    mock.mock.restore(); delete process.env.RECOVERY_TOKEN_TTL_MINUTES;
    assert.equal(n, 1); assert.equal(meta.minutos, 7);
    const docs = await Recuperacion.find({ usuarioId: u._id }).lean(); assert.equal(docs.length, 1);
    assert.equal(docs[0].tokenHash, Recuperacion.hashToken(token)); assert.ok(!JSON.stringify(docs).includes(token));
    assert.ok(+docs[0].expiresAt >= antes + 7 * 60000 && +docs[0].expiresAt <= Date.now() + 7 * 60000);
  });

  await t.test('cuotas temporales por cuenta: tres/hora, reapertura al vencer y cuenta sin bloquear', async () => {
    const u = await crear(); let n = 0;
    const mock = t.mock.method(correo, 'enviarRecuperacion', async () => { n++; });
    await servicio.procesar(u.email); await servicio.procesar(u.email); assert.equal(n, 1);
    for (let i = 0; i < 4; i++) {
      await User.updateOne({ _id: u._id }, { $set: { 'recoveryRequest.nextAllowedAt': new Date(0) } });
      await servicio.procesar(u.email);
    }
    assert.equal(n, 3); assert.equal((await User.findById(u._id)).estado, 'activo');
    await User.updateOne({ _id: u._id }, { $set: { 'recoveryRequest.windowStartedAt': new Date(Date.now() - 3600001),
      'recoveryRequest.nextAllowedAt': new Date(0) } });
    await servicio.procesar(u.email); assert.equal(n, 4); mock.mock.restore();
  });

  await t.test('misma respuesta para existente, inexistente, suspendido, eliminado y fallo SMTP; logs sanitizados', async () => {
    const activos = [await crear(), await crear({ estado: 'inactivo' }), await crear({ deletedAt: new Date() })];
    const logs = [], enviados = [];
    const log = t.mock.method(console, 'error', (...args) => logs.push(args.join(' ')));
    const smtp = t.mock.method(correo, 'enviarRecuperacion', async (email, token) => {
      enviados.push(token); throw new Error(email + ' ' + token + ' secreto SMTP');
    });
    const resultados = [];
    for (const email of [...activos.map(u => u.email), 'inexistente@example.invalid']) {
      resultados.push(await llamar(auth.solicitarRecuperacion, { email }));
    }
    for (const r of resultados) { assert.equal(r.statusCode, 200); assert.deepEqual(r.body, resultados[0].body); }
    await servicio.esperarPendientes(); smtp.mock.restore(); log.mock.restore();
    assert.equal(enviados.length, 1);
    assert.deepEqual(logs, ['recuperacion_trabajo_fallido']);
  });

  await t.test('fallo previo al CAS permite reintentar; fallo de limpieza no permite reutilizar token', async () => {
    const u = await crear(); let token;
    const smtp = t.mock.method(correo, 'enviarRecuperacion', async (_, valor) => { token = valor; });
    await servicio.procesar(u.email); smtp.mock.restore();
    const mock = t.mock.method(credenciales, 'cambiarConVersion', async () => { throw new Error('fallo-sintetico'); });
    assert.equal((await llamar(auth.restablecerPassword, { token, password: clave })).statusCode, 503); mock.mock.restore();
    assert.ok(await Recuperacion.exists({ tokenHash: Recuperacion.hashToken(token) }));
    const log = t.mock.method(console, 'error', () => {});
    const borrar = t.mock.method(Recuperacion, 'deleteOne', async () => { throw new Error('fallo'); });
    assert.equal((await llamar(auth.restablecerPassword, { token, password: clave })).statusCode, 200);
    borrar.mock.restore(); log.mock.restore();
    assert.equal((await llamar(auth.restablecerPassword, { token, password: clave })).statusCode, 400);
  });

  await t.test('cambio administrativo concurrente y vencimiento en escritura ganan sobre reset anterior', async () => {
    const u = await crear(); let token;
    const smtp = t.mock.method(correo, 'enviarRecuperacion', async (_, valor) => { token = valor; });
    await servicio.procesar(u.email); smtp.mock.restore();
    const original = credenciales.cambiarConVersion;
    const carrera = t.mock.method(credenciales, 'cambiarConVersion', async (snapshot, hash, expiresAt) => {
      await User.updateOne({ _id: u._id }, { $set: { password: await bcrypt.hash('Clave posterior diferente', 10), credentialVersion: crypto.randomUUID() } });
      return original(snapshot, hash, expiresAt);
    });
    assert.equal((await llamar(auth.restablecerPassword, { token, password: clave })).statusCode, 400); carrera.mock.restore();
    const actual = await User.findById(u._id).select('+password');
    assert.equal(await bcrypt.compare('Clave posterior diferente', actual.password), true);
    assert.equal(await original(actual, await bcrypt.hash(clave, 10), new Date(0)), null);
  });

  await t.test('HTTP: límite por IP y cabeceras, independiente de si el correo existe', async () => {
    const app = require('../src/expressApp');
    const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    try {
      const url = `http://127.0.0.1:${server.address().port}/api/auth/forgot-password`;
      for (let i = 0; i < 11; i++) {
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'inexistente@example.invalid' }) });
        assert.equal(r.status, i < 10 ? 200 : 429);
        assert.equal(r.headers.get('cache-control'), 'no-store'); assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
        assert.ok(!JSON.stringify(await r.json()).includes('inexistente@example.invalid'));
      }
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  });
});
