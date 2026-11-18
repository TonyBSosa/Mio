const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/users');
const Sesion = require('../src/models/sesion');
const Producto = require('../src/models/productos');
const Solicitud = require('../src/models/solicitudApartado');
const Perfil = require('../src/models/perfilVendedor');
const Cliente = require('../src/models/clientes');
const Pedido = require('../src/models/pedidos');
const reloj = require('../src/services/reloj');
const expiracion = require('../src/services/expiracionReservasService');
const app = require('../src/expressApp');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');

const uri = process.env.MIO_MONGO_PRUEBAS_URI;
test('MongoDB real: ciclo de vencimiento con reloj inyectable', { skip: !uri }, async t => {
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:27182\/mio_pruebas_[a-z0-9_]+\?replicaSet=mioPruebas$/);
  await mongoose.connect(uri.replace('?replicaSet', '_expiracion?replicaSet'), { serverSelectionTimeoutMS: 8000 });
  t.after(async () => {
    assert.match(mongoose.connection.name, /^mio_pruebas_/);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  await Promise.all([User, Sesion, Producto, Solicitud, Perfil, Cliente, Pedido].map(model => model.init()));
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'expiracion-test-only';
  process.env.RESERVAS_PRUEBA_HABILITADAS = 'true';
  const [a, b, vendedor, ajeno] = await User.create(['cliente', 'cliente', 'vendedor', 'vendedor'].map((rol, i) => ({
    nombre: `Usuario prueba ${i}`, email: `vencimiento-${i}@example.invalid`, password: 'hash-no-utilizable', rol,
  })));
  process.env.RESERVAS_PRUEBA_VENDEDORES = String(vendedor._id);
  const tokens = new Map();
  const renovarSesion = async user => {
    const sesion = await Sesion.create({ usuarioId: user._id, expiresAt: new Date(Date.now() + 600000) });
    tokens.set(String(user._id), jwt.sign({ id: String(user._id), sid: String(sesion._id) }, process.env.JWT_SECRET, { expiresIn: '10m' }));
  };
  for (const user of [a, b, vendedor, ajeno]) await renovarSesion(user);
  let ahora = Date.UTC(2030, 0, 1);
  t.mock.method(reloj, 'ahora', () => new Date(ahora));
  const dia = 86400000;
  const legado = await Pedido.create({ clienteId: new mongoose.Types.ObjectId(), vendedorId: vendedor._id, producto: 'Pedido heredado', precio: 80 });
  const legadoAntes = await Pedido.findById(legado._id).lean();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (user, path, method = 'GET', body) => fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: 'Bearer ' + tokens.get(String(user._id)) } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const solicitudes = '/solicitudes-apartado';
  let numero = 0;
  const preparar = async (dias = 3, segunda = false) => {
    const pieza = await Producto.create({ vendedorId: vendedor._id, nombre: `Pieza ${++numero}`, codigo: `EXP-${numero}`, precio: 200 });
    const creada = await request(a, solicitudes, 'POST', { productoId: pieza.id });
    assert.equal(creada.status, 201);
    const solicitud = await creada.json();
    let otra;
    if (segunda) {
      const respuesta = await request(b, solicitudes, 'POST', { productoId: pieza.id });
      assert.equal(respuesta.status, 201);
      otra = await respuesta.json();
    }
    assert.equal((await request(vendedor, solicitudes + '/configuracion', 'PATCH', { plazoReservaDias: dias })).status, 200);
    const confirmada = await request(vendedor, `${solicitudes}/${solicitud._id}/confirmar`, 'PATCH');
    assert.equal(confirmada.status, 200);
    return { pieza, solicitud: await confirmada.json(), otra, inicio: ahora };
  };

  await t.test('tres días exactos, confirmación duplicada, persistencia y catálogo tras inactividad', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    assert.equal((await request(vendedor, `${solicitudes}/${solicitud._id}/confirmar`, 'PATCH')).status, 409);
    assert.equal((await request(ajeno, `${solicitudes}/${solicitud._id}/confirmar`, 'PATCH')).status, 404);
    let detalle = await (await request(a, `${solicitudes}/${solicitud._id}`)).json();
    assert.equal(detalle.tiempoRestanteSegundos, 3 * 86400);
    assert.ok(await mongoose.connection.db.collection('solicitudes_apartado').findOne({ _id: new mongoose.Types.ObjectId(solicitud._id), estado: 'confirmada' }));
    ahora = inicio + 3 * dia - 1;
    detalle = await (await request(a, `${solicitudes}/${solicitud._id}`)).json();
    assert.equal(detalle.estado, 'confirmada');
    assert.equal(detalle.tiempoRestanteSegundos, 1);
    ahora = inicio + 3 * dia;
    // No se ejecutó ningún intervalo. La primera consulta pública tras la espera debe liberar.
    const respuestaCatalogo = await request(null, `/public/catalogo/${vendedor.id}`);
    assert.equal(respuestaCatalogo.status, 200);
    assert.equal(respuestaCatalogo.headers.get('cache-control'), 'no-store');
    assert.ok((await respuestaCatalogo.json()).productos.some(p => p._id === pieza.id));
    const vencida = await Solicitud.findById(solicitud._id).lean();
    assert.equal(vencida.estado, 'expirada');
    assert.equal(vencida.expiradoEn.getTime(), ahora);
    assert.equal(vencida.inventarioLiberado, true);
    assert.equal((await Producto.findById(pieza._id)).estado, 'activo');
    assert.equal((await Producto.findById(pieza._id)).reservaSolicitudId, undefined);
    for (let i = 0; i < 2; i++) {
      const recarga = await (await request(a, `${solicitudes}/${solicitud._id}`)).json();
      assert.equal(recarga.estado, 'expirada');
      assert.equal(recarga.tiempoRestanteSegundos, null);
    }
  });

  await t.test('siete días y preferencia persistente: cambiar el plazo no mueve reservas previas', async () => {
    const { pieza, solicitud, inicio } = await preparar(7);
    assert.equal((await request(vendedor, '/auth/logout', 'POST', {})).status, 200);
    await renovarSesion(vendedor);
    assert.equal((await (await request(vendedor, solicitudes + '/configuracion')).json()).plazoReservaDias, 7);
    assert.equal((await request(vendedor, solicitudes + '/configuracion', 'PATCH', { plazoReservaDias: 3 })).status, 200);
    const persistida = await Solicitud.findById(solicitud._id);
    assert.equal(persistida.plazoReservaDias, 7);
    assert.equal(persistida.venceEn.getTime(), inicio + 7 * dia);
    ahora = inicio + 7 * dia - 1;
    assert.equal((await (await request(a, `${solicitudes}/${solicitud._id}`)).json()).estado, 'confirmada');
    ahora = inicio + 7 * dia;
    // La consulta privada de productos también reconcilia vencimientos antes de leer disponibilidad.
    assert.equal((await (await request(vendedor, `/productos/${pieza.id}`)).json()).estado, 'activo');
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'expirada');
  });

  await t.test('el intento de solicitar de nuevo procesa el vencimiento antes de evaluar duplicados', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    ahora = inicio + 3 * dia;
    const nueva = await request(a, solicitudes, 'POST', { productoId: pieza.id });
    assert.equal(nueva.status, 201);
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'expirada');
    assert.equal(await Solicitud.countDocuments({ productoId: pieza._id }), 2);
  });

  await t.test('barridos concurrentes y nueva confirmación no liberan una reserva posterior', async () => {
    const { pieza, solicitud, otra, inicio } = await preparar(3, true);
    ahora = inicio + 3 * dia;
    const resultados = await Promise.all([
      expiracion.procesar({ productoId: pieza._id }),
      expiracion.procesar({ productoId: pieza._id }),
      request(vendedor, `${solicitudes}/${otra._id}/confirmar`, 'PATCH'),
    ]);
    assert.equal(resultados[2].status, 200);
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'expirada');
    const piezaNuevaReserva = await Producto.findById(pieza._id).lean();
    assert.equal(piezaNuevaReserva.estado, 'apartado');
    assert.equal(String(piezaNuevaReserva.reservaSolicitudId), otra._id);
    assert.equal(await expiracion.expirarUna(solicitud._id), null);
    assert.deepEqual(await Producto.findById(pieza._id).lean(), piezaNuevaReserva);
  });

  await t.test('comprobante en revisión y señal de recepción protegen de una liberación automática', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    // Preparación conceptual por servidor: NO existe endpoint de recepción/subida en este incremento.
    await Solicitud.updateOne({ _id: solicitud._id }, { $set: {
      estado: 'comprobante_en_revision', comprobanteRecibidoEn: new Date(inicio + dia),
    } }, { runValidators: true });
    ahora = inicio + 4 * dia;
    await expiracion.procesar({ productoId: pieza._id });
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'comprobante_en_revision');
    assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
    // Incluso una señal de recepción con estado aún confirmado falla de forma conservadora.
    await Solicitud.updateOne({ _id: solicitud._id }, { $set: { estado: 'confirmada' } });
    await expiracion.procesar({ productoId: pieza._id });
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'confirmada');
    assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
  });

  await t.test('una recepción concurrente protegida y el vencimiento no dejan estados mezclados', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    const corte = new Date(inicio + 3 * dia);
    const [, recibida] = await Promise.all([
      expiracion.expirarUna(solicitud._id, corte),
      // Simula exclusivamente la escritura condicional que deberá usar el siguiente incremento.
      Solicitud.findOneAndUpdate({ _id: solicitud._id, estado: 'confirmada' }, { $set: {
        estado: 'comprobante_en_revision', comprobanteRecibidoEn: new Date(inicio + 2 * dia),
      } }, { returnDocument: 'after' }),
    ]);
    const producto = await Producto.findById(pieza._id);
    const actual = await Solicitud.findById(solicitud._id);
    assert.equal(actual.estado, recibida ? 'comprobante_en_revision' : 'expirada');
    assert.equal(producto.estado, recibida ? 'apartado' : 'activo');
  });

  await t.test('no se libera una pieza con otra referencia, estado inactivo o pedido asociado', async () => {
    for (const caso of ['otra_referencia', 'inactivo', 'pedido']) {
      const { pieza, solicitud, inicio } = await preparar(3);
      if (caso === 'otra_referencia') await Producto.updateOne({ _id: pieza._id }, { $set: { reservaSolicitudId: new mongoose.Types.ObjectId() } });
      if (caso === 'inactivo') await Producto.updateOne({ _id: pieza._id }, { $set: { estado: 'inactivo' } });
      if (caso === 'pedido') await Pedido.create({ vendedorId: vendedor._id, clienteId: new mongoose.Types.ObjectId(), productoId: pieza._id, producto: pieza.nombre, precio: 200 });
      const antes = await Producto.findById(pieza._id).lean();
      ahora = inicio + 3 * dia;
      await expiracion.procesar({ productoId: pieza._id });
      assert.deepEqual(await Producto.findById(pieza._id).lean(), antes);
      const vencida = await Solicitud.findById(solicitud._id);
      assert.equal(vencida.estado, 'expirada');
      assert.equal(vencida.inventarioLiberado, false);
    }
  });

  await t.test('fallo al expirar revierte liberación; la consulta falla sin afirmar disponibilidad', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    ahora = inicio + 3 * dia;
    const fallo = t.mock.method(Solicitud, 'findOneAndUpdate', async () => { throw Error('fallo de escritura simulado'); });
    await assert.rejects(expiracion.procesar({ productoId: pieza._id }), { status: 503 });
    const noDisponible = await request(null, `/public/catalogo/${vendedor.id}`);
    assert.equal(noDisponible.status, 503);
    assert.match((await noDisponible.json()).mensaje, /verificar el vencimiento/);
    fallo.mock.restore();
    assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'confirmada');
    await expiracion.procesar({ productoId: pieza._id });
    assert.equal((await Producto.findById(pieza._id)).estado, 'activo');
  });

  await t.test('el pedido anterior sigue funcionando y un nuevo pedido puede usar una pieza ya vencida', async () => {
    const { pieza, solicitud, inicio } = await preparar(3);
    ahora = inicio + 3 * dia;
    const cliente = await Cliente.create({ vendedorId: vendedor._id, nombre: 'Ficha de cliente de prueba' });
    const respuesta = await request(vendedor, '/pedidos', 'POST', { productoId: pieza.id, clienteId: cliente.id, precio: 200 });
    assert.equal(respuesta.status, 201);
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'expirada');
    assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
    assert.equal((await Producto.findById(pieza._id)).reservaSolicitudId, undefined);
    await expiracion.expirarUna(solicitud._id);
    assert.equal((await Producto.findById(pieza._id)).estado, 'apartado');
    assert.deepEqual(await Pedido.findById(legado._id).lean(), legadoAntes);
  });

  await t.test('el comando externo procesa sin tráfico y se niega a hacerlo en producción', async () => {
    const pieza = await Producto.create({ vendedorId: vendedor._id, nombre: 'Pieza para barrido externo', codigo: 'EXP-CRON', precio: 50 });
    const solicitud = await Solicitud.create({
      compradorId: a._id, vendedorId: vendedor._id, productoId: pieza._id,
      compradorNombre: 'Prueba', productoNombre: pieza.nombre, tiendaNombre: 'Prueba',
      estado: 'confirmada', esPrueba: true, confirmadoEn: new Date('2001-01-01T00:00:00Z'),
      venceEn: new Date('2001-01-04T00:00:00Z'), plazoReservaDias: 3,
    });
    await Producto.updateOne({ _id: pieza._id }, { $set: { estado: 'apartado', reservaSolicitudId: solicitud._id } });
    const opciones = {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, MONGO_URI: uri.replace('?replicaSet', '_expiracion?replicaSet'), NODE_ENV: 'production' },
      windowsHide: true,
    };
    await assert.rejects(promisify(execFile)(process.execPath, ['src/scripts/expirarReservas.js'], opciones), { code: 1 });
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'confirmada');
    const { stdout } = await promisify(execFile)(process.execPath, ['src/scripts/expirarReservas.js'], {
      ...opciones, env: { ...opciones.env, NODE_ENV: 'test', RESERVAS_PRUEBA_HABILITADAS: 'false' },
    });
    assert.ok(JSON.parse(stdout).expiradas >= 1);
    assert.equal((await Solicitud.findById(solicitud._id)).estado, 'expirada');
    assert.equal((await Producto.findById(pieza._id)).estado, 'activo');
  });
});
