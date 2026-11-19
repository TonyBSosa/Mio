const { test } = require('node:test');
const assert = require('node:assert/strict');
const correo = require('../src/services/correoService');
const diagnostico = require('../src/services/diagnosticoRecuperacion');
const { crearCola } = require('../src/services/recoveryQueue');
const env = { NODE_ENV:'test', SMTP_HOST:'smtp.example.invalid', SMTP_PORT:'465', SMTP_USER:'sintetico', SMTP_PASSWORD:'SECRETO_SINTETICO', MAIL_FROM:'test@example.invalid', APP_URL:'https://example.invalid' };
test('verificación manual simulada autentica con TLS465 sin enviar; errores seguros por categoría', async t => {
  Object.assign(process.env, env);
  let verificaciones=0, cierres=0;
  await correo.verificarSMTP({createTransport: opciones => {
    assert.equal(opciones.secure,true); assert.equal(opciones.tls.rejectUnauthorized,true);
    return {verify:async()=>{verificaciones++;return true;},sendMail:()=>assert.fail('No debe enviar'),close:()=>{cierres++;}};
  }});
  assert.equal(verificaciones,1);assert.equal(cierres,1);
  const registros=[]; t.mock.method(console,'error',(...args)=>registros.push(args));
  for(const [code,categoria] of [['EAUTH','autenticacion'],['ECONNREFUSED','conexion'],['ETIMEDOUT','timeout'],['CERT_HAS_EXPIRED','tls']]) {
    try {await correo.verificarSMTP({createTransport:()=>({verify:async()=>{throw Object.assign(new Error('SECRETO_SINTETICO token@example.invalid'),{code,response:'datos privados'});},close(){}})});assert.fail();}
    catch(error){diagnostico.registrar(error);}
    const dato=JSON.parse(registros.at(-1)[1]);assert.equal(dato.categoria,categoria);assert.equal(dato.codigo,code);assert.equal(dato.etapa,'smtp_verificacion');
    assert.match(dato.correlacion,/^[a-f0-9-]{36}$/);assert.deepEqual(Object.keys(dato).sort(),['categoria','codigo','correlacion','etapa']);
  }
  assert.doesNotMatch(JSON.stringify(registros),/SECRETO|token@example|datos privados/);
});
test('MAIL_FROM inválido falla antes de transporte; cola conserva etapa sin filtrar datos',async t=>{
  Object.assign(process.env,env,{MAIL_FROM:'MIO <test@example.invalid>'});
  let transportes=0; const registros=[]; t.mock.method(console,'error',(...args)=>registros.push(args));
  const cola=crearCola(()=>correo.enviarRecuperacion('test@example.invalid','a'.repeat(64),{createTransport:()=>{transportes++;assert.fail();}}));
  cola.encolar('test@example.invalid'); await cola.esperarPendientes();
  assert.equal(transportes,0);const dato=JSON.parse(registros[0][1]);assert.equal(dato.etapa,'configuracion_correo');assert.equal(dato.categoria,'configuracion');
  assert.doesNotMatch(JSON.stringify(registros),/example|aaaaaa|SECRETO/);
  Object.assign(process.env,env);
});
test('persistencia conserva etapa y oculta mensajes MongoDB',async t=>{
  const registros=[];t.mock.method(console,'error',(...args)=>registros.push(args));
  await assert.rejects(diagnostico.ejecutar('token_persistencia',()=>{throw new Error('mongodb://privado usuario@example.invalid');},'persistencia').catch(error=>{diagnostico.registrar(error);throw error;}));
  assert.equal(JSON.parse(registros[0][1]).categoria,'persistencia');assert.doesNotMatch(JSON.stringify(registros),/mongodb|example/);
});
