const { test } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../src/config/verificacionConfig');
const correo = require('../src/services/correoService');
const middleware = require('../src/middlewares/verificacionMiddleware');
test('configuración verificación 24h y transición histórica explícita', () => {
  assert.equal(config.horas({}),24); assert.equal(config.horas({EMAIL_VERIFICATION_TTL_HOURS:'48'}),48);
  for(const value of ['0','73','abc','1.5','']) assert.throws(()=>config.horas({EMAIL_VERIFICATION_TTL_HOURS:value}));
  assert.equal(config.modoHistorico({}),'off'); assert.throws(()=>config.modoHistorico({EMAIL_VERIFICATION_LEGACY_MODE:'oops'}));
});
test('correo HTML/texto simulado: identidad MIO, HTTPS, fragmento, TLS, sin tokens en query', async () => {
  Object.assign(process.env,{NODE_ENV:'production',SMTP_HOST:'smtp.example.invalid',SMTP_PORT:'465',SMTP_USER:'test',SMTP_PASSWORD:'solo-test',MAIL_FROM:'test@example.invalid',APP_URL:'https://example.invalid'});
  const token='a'.repeat(24)+'.'+'b'.repeat(64); let mensaje;
  await correo.enviarVerificacion('destino@example.invalid',token,{createTransport:opts=>{
    assert.equal(opts.secure,true);assert.equal(opts.requireTLS,true);
    return {close(){},sendMail:async msg=>{mensaje=msg;return {};}};
  }});
  assert.match(mensaje.html,/Verificar mi correo/);assert.match(mensaje.html,/max-width:560px/);assert.match(mensaje.text,/24 horas/);
  const url=new URL(mensaje.text.match(/https:\/\/\S+/)[0]); assert.equal(url.pathname,'/verificar-correo');assert.equal(url.search,'');assert.equal(new URLSearchParams(url.hash.slice(1)).get('token'),token);
});
test('modo histórico conserva lecturas por rutas; nueva operación necesita verificación', () => {
  process.env.EMAIL_VERIFICATION_LEGACY_MODE='sensitive';let paso=false;let status;
  const res={status(n){status=n;return this;},json(){}};
  middleware.sensible({usuario:{emailVerificationRequired:undefined,emailVerifiedAt:null}},res,()=>paso=true);
  assert.equal(status,403);assert.equal(paso,false);
  middleware.sensible({usuario:{emailVerifiedAt:new Date()}},res,()=>paso=true);assert.equal(paso,true);
  process.env.EMAIL_VERIFICATION_LEGACY_MODE='off';
});
