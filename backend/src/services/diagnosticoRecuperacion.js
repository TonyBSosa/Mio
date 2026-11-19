const { randomUUID } = require('node:crypto');
const datos = new WeakMap();
const codigos = new Set(['EAUTH','ETLS','ESOCKET','ECONNECTION','ECONNREFUSED','ETIMEDOUT','EDELIVERYTIMEOUT','EDNS','ENOTFOUND','EAI_AGAIN','CERT_HAS_EXPIRED','DEPTH_ZERO_SELF_SIGNED_CERT','ERR_TLS_CERT_ALTNAME_INVALID','UNABLE_TO_VERIFY_LEAF_SIGNATURE','EENVELOPE','EMESSAGE']);
function clasificar(error) {
  const codigo = codigos.has(error?.code) ? error.code : 'NO_CLASIFICADO';
  const categoria = codigo === 'EAUTH' ? 'autenticacion' : /TLS|CERT|SELF_SIGNED|VERIFY/.test(codigo) ? 'tls' : /TIMEOUT|TIMEDOUT/.test(codigo) ? 'timeout' : ['ESOCKET','ECONNECTION','ECONNREFUSED','EDNS','ENOTFOUND','EAI_AGAIN'].includes(codigo) ? 'conexion' : 'procesamiento';
  return { categoria, codigo };
}
function marcar(error, etapa, categoria) {
  if (datos.has(error)) return error;
  const seguro = new Error('No se pudo procesar el correo de recuperacion');
  datos.set(seguro, { etapa, ...clasificar(error), ...(categoria ? { categoria } : {}) });
  return seguro;
}
async function ejecutar(etapa, fn, categoria) {
  try { return await fn(); } catch (error) { throw marcar(error, etapa, categoria); }
}
function registrar(error) {
  // Nunca serializar el error original ni sus mensajes o campos arbitrarios.
  console.error('recuperacion_trabajo_fallido', JSON.stringify({ ...(datos.get(error) || { etapa: 'trabajo', ...clasificar(error) }), correlacion: randomUUID() }));
}
module.exports = { ejecutar, marcar, registrar };
