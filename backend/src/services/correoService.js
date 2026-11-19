const nodemailer = require('nodemailer');
const diagnostico = require('./diagnosticoRecuperacion');
const net = require('node:net');
const tls = require('node:tls');
const { randomUUID } = require('node:crypto');
const { configuracion, validoEmail } = require('../config/correoConfig');
const { expiracionMinutos } = require('../config/recuperacionConfig');
const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));
const falloPublico = () => new Error('No se pudo procesar el correo de recuperacion');

// Solo reintentar si consta que el servidor NO aceptó el mensaje.
// Nodemailer también etiqueta CONN algunos fallos DESPUÉS de DATA. No basta command.
const reintentable = error => (error.beforeSmtp === true &&
  ['ECONNECTION', 'ESOCKET', 'ETIMEDOUT', 'EDNS', 'ECONNREFUSED', 'EAI_AGAIN'].includes(error.code)) ||
  (error.responseCode >= 400 && error.responseCode < 500 && ['MAIL FROM', 'RCPT TO', 'DATA'].includes(error.command));

async function enviarIntento(config, mensaje, { createTransport = nodemailer.createTransport,
  deadlineMs = 20000, verificar = false } = {}) {
  let socket, transport, temporizador, connectionTimer;
  const opciones = { host: config.host, port: config.port, secure: config.port === 465,
    requireTLS: true, ignoreTLS: false, opportunisticTLS: false,
    auth: config.auth, tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true, servername: config.host },
    connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 10000, dnsTimeout: 5000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
    // Poseer el socket permite cerrarlo al llegar al límite absoluto, incluso si
    // un servidor mantiene el socket activo enviando bytes lentamente.
    getSocket(options, callback) {
      let entregado = false;
      const terminar = error => {
        if (entregado) return;
        entregado = true;
        clearTimeout(connectionTimer);
        if (error) { error.command = 'CONN'; error.beforeSmtp = true; callback(error); }
        else callback(null, { connection: socket, secured: config.port === 465 });
      };
      const params = { host: config.host, port: config.port };
      socket = config.port === 465 ? tls.connect({ ...params, ...opciones.tls }, () => terminar()) :
        net.connect(params, () => terminar());
      socket.once('error', terminar);
      connectionTimer = setTimeout(() => {
        terminar(Object.assign(new Error('Conexion agotada'), { code: 'ETIMEDOUT' }));
        socket.destroy();
      }, 5000); // Incluye DNS y handshake del socket que suministramos.
    },
  };
  try {
    transport = createTransport(opciones);
    return await Promise.race([
      verificar ? transport.verify() : transport.sendMail(mensaje),
      new Promise((_, reject) => {
        temporizador = setTimeout(() => {
          const error = Object.assign(new Error('Envio agotado'), { code: 'EDELIVERYTIMEOUT' });
          socket?.destroy(error); reject(error); // Resultado ambiguo: nunca reintentar.
        }, deadlineMs);
      }),
    ]);
  } finally { clearTimeout(temporizador); clearTimeout(connectionTimer); socket?.destroy(); transport?.close(); }
}

async function enviarRecuperacion(email, token, { minutos = expiracionMinutos(),
  expiresAt = new Date(Date.now() + minutos * 60000), createTransport, sleep = esperar, deadlineMs } = {}) {
  try {
    const config = await diagnostico.ejecutar('configuracion_correo', () => configuracion(), 'configuracion');
    if (!validoEmail(email) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw falloPublico();
    const url = new URL('/recuperar', config.base);
    // El fragmento no se envía al servidor HTTP ni como Referer.
    url.hash = new URLSearchParams({ token }).toString();
    const mensaje = { from: config.from, to: email, subject: 'Recuperar acceso a MIO',
      messageId: `<${randomUUID()}@${config.from.split('@')[1]}>`,
      text: `Abre este enlace para cambiar tu contraseña. El enlace dura ${minutos} minutos desde su emisión y solo puede usarse una vez: ${url.href}\nSi no solicitaste el cambio, ignora este mensaje.` };
    return await enviarMensaje(config, mensaje, expiresAt, { createTransport, sleep, deadlineMs });
  } catch (error) { throw diagnostico.marcar(error, 'preparar_correo'); }
}
async function enviarMensaje(config, mensaje, expiresAt, { createTransport, sleep = esperar, deadlineMs } = {}) {
    for (let intento = 0; intento < 3; intento++) {
      if (+expiresAt <= Date.now()) throw falloPublico();
      try { return await enviarIntento(config, mensaje, { createTransport, deadlineMs }); }
      catch (error) {
        if (intento === 2 || !reintentable(error)) throw diagnostico.marcar(error, 'smtp_envio');
        await sleep(250 * (intento + 1));
      }
    }
}
const escaparHTML = texto => texto.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function enviarVerificacion(email, token, { horas = 24, expiresAt = new Date(Date.now() + horas * 3600000), ...opciones } = {}) {
  try {
    const config = await diagnostico.ejecutar('configuracion_correo', () => configuracion(), 'configuracion');
    if (!validoEmail(email) || !/^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(token)) throw falloPublico();
    const url = new URL('/verificar-correo', config.base);
    url.hash = new URLSearchParams({ token }).toString();
    const enlace = escaparHTML(url.href);
    const mensaje = { from: config.from, to: email, subject: 'Verifica tu correo en MIO',
      messageId: '<' + randomUUID() + '@' + config.from.split('@')[1] + '>',
      text: 'Bienvenido a MIO. Verifica tu correo: ' + url.href + '\nEl enlace vence en ' + horas + ' horas y solo puede usarse una vez. Si no creaste esta cuenta, ignora este mensaje. No compartas el enlace.',
      html: '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>Verifica tu correo</title></head><body style="margin:0;background:#f4f6f4;color:#132925;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #d6e0db;border-radius:16px" cellspacing="0" cellpadding="0"><tr><td style="padding:32px"><p style="color:#0d6b55;font-size:28px;font-weight:bold;margin-top:0">MIO</p><h1 style="font-size:26px">Te damos la bienvenida</h1><p style="line-height:1.6">Confirma tu correo para empezar a usar tu cuenta.</p><p style="margin:32px 0"><a href="' + enlace + '" style="display:inline-block;background:#0d6b55;color:#fff;padding:16px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Verificar mi correo</a></p><p style="line-height:1.6">Este enlace vence en ' + horas + ' horas y solo puede usarse una vez.</p><p style="line-height:1.6;color:#52645e">Si no creaste esta cuenta, ignora este mensaje. No compartas el enlace.</p></td></tr></table></td></tr></table></body></html>' };
    return await enviarMensaje(config, mensaje, expiresAt, opciones);
  } catch (error) { throw diagnostico.marcar(error, 'verificacion_correo'); }
}
async function verificarSMTP(opciones = {}) {
  const config = await diagnostico.ejecutar('configuracion_correo', () => configuracion(), 'configuracion');
  return diagnostico.ejecutar('smtp_verificacion', () => enviarIntento(config, undefined, { ...opciones, verificar: true }));
}
module.exports = { enviarRecuperacion, enviarIntento, reintentable, verificarSMTP, enviarVerificacion };
