const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Recuperacion = require('../src/models/recuperacion');
const correo = require('../src/services/correoService');
const Producto = require('../src/models/productos');
const app = require('../src/expressApp');
const id = '507f1f77bcf86cd799439011';
const sid = '507f1f77bcf86cd799439012';
test('HTTP: roles desde base, propiedad de tienda, logout, caducidad y recuperacion de un uso', async t => {
  process.env.JWT_SECRET = 'test-secret-only';
  const usuario = { _id: id, rol: 'vendedor', estado: 'activo' };
  let activa = true;
  t.mock.method(User, 'findById', async () => usuario);
  t.mock.method(Sesion, 'exists', async () => activa);
  t.mock.method(Sesion, 'deleteOne', async () => { activa = false; });
  t.mock.method(Producto, 'find', filtro => {
    assert.equal(filtro.vendedorId, id);
    return { sort: async () => [] };
  });
  t.mock.method(Producto, 'findOne', async filtro => {
    assert.equal(filtro.vendedorId, id);
    return null; // ID de otra tienda
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = jwt.sign({ id, sid, rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '30m' });
  const request = (path, method='GET', body, bearer=token) => fetch(base+path, { method, headers: { Authorization: 'Bearer '+bearer, 'Content-Type':'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal((await request('/productos', 'GET', null, '')).status, 401);
  assert.equal((await request('/productos')).status, 200);
  assert.equal((await request('/productos/507f1f77bcf86cd799439099')).status, 404);
  assert.equal((await request('/usuarios')).status, 403); // rol manipulado en JWT no autoriza
  usuario.rol = 'cliente';
  assert.equal((await request('/productos')).status, 403);
  usuario.rol = 'admin';
  assert.equal((await request('/productos')).status, 403); // menor privilegio
  usuario.rol = 'vendedor';
  assert.equal((await request('/auth/logout', 'POST', {})).status, 200);
  assert.equal((await request('/auth/me')).status, 401);
  activa = true;
  assert.equal((await request('/auth/me', 'GET', null, jwt.sign({id,sid}, process.env.JWT_SECRET, {expiresIn:-1}))).status,401);
  assert.equal((await request('/auth/me','GET',null,jwt.sign({id},process.env.JWT_SECRET))).status,401);
  let reset;
  t.mock.method(User,'findOne',async()=>usuario);
  t.mock.method(Recuperacion,'create',async data=>{reset=data;});
  let enviado;
  t.mock.method(correo,'enviarRecuperacion',async(email,token)=>{enviado=token;});
  const respuesta = await request('/auth/forgot-password','POST',{email:'demo@example.invalid'});
  assert.equal(respuesta.status,200);
  assert.equal(JSON.stringify(await respuesta.json()).includes(enviado),false);
  assert.equal(reset.tokenHash,Recuperacion.hashToken(enviado));
  let disponible = true;
  t.mock.method(Recuperacion,'findOneAndDelete',async filtro=>{
    assert.equal(filtro.tokenHash,reset.tokenHash);
    assert.ok(filtro.expiresAt.$gt instanceof Date);
    if (!disponible) return null;
    disponible=false; return reset;
  });
  t.mock.method(User,'updateOne',async(filtro,data)=>{assert.equal(await bcrypt.compare('nueva-clave-123',data.$set.password),true);});
  t.mock.method(Sesion,'deleteMany',async()=>{activa=false;});
  t.mock.method(Recuperacion,'deleteMany',async()=>{});
  assert.equal((await request('/auth/reset-password','POST',{token:enviado,password:'nueva-clave-123'})).status,200);
  assert.equal((await request('/auth/me')).status,401);
  assert.equal((await request('/auth/reset-password','POST',{token:enviado,password:'nueva-clave-123'})).status,400);
  t.mock.method(User, 'findOne', async () => null);
  assert.equal((await request('/auth/register','POST',{nombre:'Demo',email:'demo@example.invalid',password:'clave-larga-123',rol:'admin'})).status,400);
  const password = await bcrypt.hash('clave-larga-123', 10);
  t.mock.method(User, 'findOne', () => ({ select: async () => ({...usuario, password, email: 'demo@example.invalid'}) }));
  t.mock.method(Sesion, 'create', async data => {
    assert.equal(String(data.usuarioId),id);
    assert.ok(data.expiresAt > new Date());
    return {_id:sid};
  });
  const login = await request('/auth/login','POST',{email:'demo@example.invalid',password:'clave-larga-123'});
  assert.equal(login.status,200);
  const loginBody = await login.json();
  const payload = jwt.verify(loginBody.token,process.env.JWT_SECRET);
  assert.equal(payload.sid,sid);
  assert.equal(payload.exp-payload.iat,1800);
  assert.equal(loginBody.password,undefined);
  assert.equal((await request('/auth/login','POST',{email:'demo@example.invalid',password:'incorrecta'})).status,401);
});
