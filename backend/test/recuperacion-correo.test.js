const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configuracion } = require('../src/config/correoConfig');
const { expiracionMinutos } = require('../src/config/recuperacionConfig');
const correo = require('../src/services/correoService');
const { crearCola } = require('../src/services/recoveryQueue');
const base = { NODE_ENV: 'production', SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '587',
  SMTP_USER: 'sintetico', SMTP_PASSWORD: 'solo-sintetico', MAIL_FROM: 'mio@example.invalid', APP_URL: 'https://example.invalid' };
const token = 'a'.repeat(64);

test('TTL central y SMTP: configuración inválida falla cerrada; HTTPS productivo', () => {
  assert.equal(expiracionMinutos({}), 30); assert.equal(expiracionMinutos({ RECOVERY_TOKEN_TTL_MINUTES: '7' }), 7);
  for (const valor of ['0', '121', '3.5', '-1', '', 'Infinity', 'abc']) assert.throws(() => expiracionMinutos({ RECOVERY_TOKEN_TTL_MINUTES: valor }));
  for (const cambio of [{ SMTP_HOST: '' }, { SMTP_HOST: 'smtp..invalid' }, { SMTP_PORT: '587x' },
    { SMTP_PORT: '0' }, { SMTP_PORT: '65536' }, { SMTP_USER: '' }, { SMTP_PASSWORD: '' },
    { MAIL_FROM: 'a@example.invalid\r\nBcc: x@y.invalid' }, { APP_URL: 'http://example.invalid' },
    { APP_URL: 'https://user:password@example.invalid' }, { APP_URL: 'https://example.invalid/path' },
    { APP_URL: 'https://example.invalid/?a=b' }, { APP_URL: 'https://example.invalid/#x' }]) {
    assert.throws(() => configuracion({ ...base, ...cambio }), /Configuracion de correo invalida/);
  }
  assert.equal(configuracion({ ...base, NODE_ENV: 'test', APP_URL: 'http://localhost:4200' }).base.protocol, 'http:');
});

test('correo simulado: TLS obligatorio, URL sin token en query, TTL y Message-ID estables', async () => {
  Object.assign(process.env, base, { RECOVERY_TOKEN_TTL_MINUTES: '7' });
  const envios = [], opciones = []; let cerrados = 0;
  const createTransport = config => {
    opciones.push(config);
    return { close() { cerrados++; }, async sendMail(mensaje) {
      envios.push(mensaje);
      if (envios.length === 1) throw Object.assign(new Error('detalle-privado'), { command: 'CONN', code: 'ECONNECTION', beforeSmtp: true });
      return { accepted: [mensaje.to] };
    } };
  };
  await correo.enviarRecuperacion('test@example.invalid', token, { createTransport, sleep: async () => {} });
  assert.equal(envios.length, 2); assert.equal(cerrados, 2);
  assert.equal(envios[0].messageId, envios[1].messageId); assert.equal(envios[0].text, envios[1].text);
  const link = new URL(envios[0].text.match(/https:\/\/\S+/)[0]);
  assert.equal(link.search, ''); assert.equal(new URLSearchParams(link.hash.slice(1)).get('token'), token);
  assert.match(envios[0].text, /7 minutos/);
  for (const o of opciones) {
    assert.equal(o.requireTLS, true); assert.equal(o.ignoreTLS, false); assert.equal(o.tls.rejectUnauthorized, true);
    assert.equal(o.tls.minVersion, 'TLSv1.2'); assert.equal(o.logger, false); assert.equal(o.debug, false);
    assert.equal(o.connectionTimeout, 5000); assert.equal(o.socketTimeout, 10000);
  }
  delete process.env.RECOVERY_TOKEN_TTL_MINUTES;
});

test('fallo SMTP ambiguo, autenticación y TLS no reenvían; deadline y reintentos acotados', async () => {
  Object.assign(process.env, base);
  for (const error of [Object.assign(new Error('token-privado'), { code: 'ETIMEDOUT', command: 'DATA' }),
    { code: 'ETIMEDOUT', command: 'CONN' },
    { code: 'EAUTH', command: 'AUTH' }, { code: 'ETLS', command: 'STARTTLS' }]) {
    let n = 0;
    await assert.rejects(correo.enviarRecuperacion('test@example.invalid', token, {
      createTransport: () => ({ close() {}, async sendMail() { n++; throw error; } }), sleep: async () => {},
    }), { message: 'No se pudo procesar el correo de recuperacion' });
    assert.equal(n, 1);
  }
  let n = 0, cerrado = false;
  await assert.rejects(correo.enviarRecuperacion('test@example.invalid', token, { deadlineMs: 10,
    createTransport: () => ({ close() { cerrado = true; }, sendMail() { n++; return new Promise(() => {}); } }),
  }));
  assert.equal(n, 1); assert.equal(cerrado, true);
  n = 0;
  await assert.rejects(correo.enviarRecuperacion('test@example.invalid', token, {
    createTransport: () => ({ close() {}, async sendMail() { n++; throw { command: 'CONN', code: 'ECONNECTION', beforeSmtp: true }; } }),
    sleep: async () => {},
  })); assert.equal(n, 3);
  n = 0;
  await correo.enviarRecuperacion('test@example.invalid', token, {
    createTransport: () => ({ close() {}, async sendMail() {
      if (++n === 1) throw { responseCode: 451, command: 'DATA' };
      return { accepted: ['test@example.invalid'] };
    } }), sleep: async () => {},
  }); assert.equal(n, 2);
});

test('sockets simulados: 465 usa TLS validado y otros puertos requieren STARTTLS; deadline cierra socket', async t => {
  const { EventEmitter } = require('node:events');
  const net = require('node:net'), tls = require('node:tls');
  let ultimo, parametros, cerrar = 0, conectar = true;
  const fabricar = (opciones, callback) => {
    parametros = opciones;
    ultimo = new EventEmitter(); ultimo.setTimeout = () => ultimo;
    ultimo.destroy = () => { cerrar++; };
    if (conectar) setImmediate(callback);
    return ultimo;
  };
  t.mock.method(net, 'connect', fabricar); t.mock.method(tls, 'connect', fabricar);
  for (const port of [465, 587, 2525]) {
    const config = configuracion({ ...base, SMTP_PORT: String(port) });
    await correo.enviarIntento(config, {}, { createTransport: opciones => ({ close() {}, sendMail() {
      assert.equal(opciones.secure, port === 465); assert.equal(opciones.requireTLS, true);
      return new Promise((resolve, reject) => opciones.getSocket({}, (error, socketOptions) => {
        if (error) return reject(error);
        assert.equal(socketOptions.secured, port === 465); assert.equal(socketOptions.connection, ultimo);
        resolve({ accepted: ['test@example.invalid'] });
      }));
    } }) });
    if (port === 465) { assert.equal(parametros.rejectUnauthorized, true); assert.equal(parametros.servername, base.SMTP_HOST); }
  }
  conectar = false;
  await assert.rejects(correo.enviarIntento(configuracion(base), {}, { deadlineMs: 10,
    createTransport: opciones => ({ close() {}, sendMail() {
      opciones.getSocket({}, () => {}); return new Promise(() => {});
    } }),
  }));
  assert.ok(cerrar >= 4);
});

test('cola acotada: uniforme para cuentas desconocidas, sin espera de SMTP, cooldown expirable', async () => {
  let ahora = 0, liberar, n = 0;
  const espera = new Promise(resolve => { liberar = resolve; });
  const cola = crearCola(async () => { n++; await espera; }, { now: () => ahora, max: 2, concurrency: 1 });
  cola.encolar('test@example.invalid'); cola.encolar('test@example.invalid'); cola.encolar('otra@example.invalid');
  cola.encolar('llena@example.invalid');
  assert.equal(n, 0); await new Promise(setImmediate); assert.equal(n, 1);
  liberar(); await cola.esperarPendientes(); assert.equal(n, 2);
  ahora = 60001; cola.encolar('test@example.invalid'); await cola.esperarPendientes(); assert.equal(n, 3);
});
