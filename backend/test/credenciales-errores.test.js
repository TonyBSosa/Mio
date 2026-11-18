const { test } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/users');
const repo = require('../src/repositories/userRepository');
const auth = require('../src/controllers/authController');
const admin = require('../src/controllers/userController');
const res = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });

test('errores internos y E11000 de administración se traducen sin datos privados', async t => {
  t.mock.method(repo, 'buscarPorEmail', async () => null);
  const mock = t.mock.method(repo, 'crearUsuario', async () => { throw Object.assign(new Error('correo-privado'), { code: 11000 }); });
  const req = { body: { nombre: 'Sintético', email: 'sintetico@example.invalid', password: 'Frase sintética de prueba' } };
  const conflicto = res(); await admin.crearUsuario(req, conflicto);
  assert.equal(conflicto.statusCode, 409); assert.equal(JSON.stringify(conflicto.body).includes('privado'), false);
  mock.mock.restore();
  t.mock.method(repo, 'crearUsuario', async () => { throw new Error('detalle-interno'); });
  const fallo = res(); await admin.crearUsuario(req, fallo);
  assert.equal(fallo.statusCode, 500); assert.equal(JSON.stringify(fallo.body).includes('interno'), false);
});

test('login: mismo error para inexistente, inactivo, eliminado y password erróneo', async t => {
  const bcrypt = require('bcryptjs');
  const password = await bcrypt.hash('Frase sintética válida', 10);
  let usuario;
  t.mock.method(User, 'findOne', () => ({ select: async () => usuario }));
  const resultados = [];
  for (const u of [null, { password, estado: 'inactivo' }, { password, estado: 'activo', deletedAt: new Date() }, { password, estado: 'activo' }]) {
    usuario = u; const respuesta = res();
    await auth.login({ body: { email: 'test@example.invalid', password: 'Otra frase incorrecta' } }, respuesta);
    resultados.push({ status: respuesta.statusCode, body: respuesta.body });
  }
  for (const r of resultados) assert.deepEqual(r, { status: 401, body: { mensaje: 'Credenciales invalidas' } });
});

test('registro no admite admin ni campos para elevar privilegios o falsificar versión', async t => {
  const r = res();
  await auth.registrar({ body: { rol: 'admin', nombre: 'Test', email: 'test@example.invalid', password: 'Frase sintética válida' } }, r);
  assert.equal(r.statusCode, 400);
  // Una llamada de administrador tampoco puede quitarse a sí mismo ni darse de baja.
  const servicio = require('../src/services/userService');
  const id = '507f1f77bcf86cd799439011';
  await assert.rejects(servicio.actualizarUsuario(id, { rol: 'cliente' }, id), { status: 400 });
  await assert.rejects(servicio.eliminarUsuario(id, id), { status: 400 });
  process.env.JWT_SECRET = 'solo-prueba-registro';
  t.mock.method(User, 'findOne', async () => null);
  t.mock.method(User, 'exists', async () => true);
  let datos;
  t.mock.method(User, 'create', async data => { datos = data; return { _id: id, ...data, estado: 'activo' }; });
  t.mock.method(require('../src/models/sesion'), 'create', async () => ({ _id: id }));
  const registro = res();
  await auth.registrar({ body: { nombre: 'Test', email: 'test@example.invalid', password: 'Frase sintética válida',
    rol: 'cliente', credentialVersion: 'elegida', deletedAt: new Date(), estado: 'inactivo' } }, registro);
  assert.equal(registro.statusCode, 201);
  assert.notEqual(datos.credentialVersion, 'elegida');
  assert.equal(datos.deletedAt, undefined); assert.equal(datos.estado, undefined);
});
