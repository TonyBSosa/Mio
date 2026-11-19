const nodemailer = require('nodemailer');
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
  deadlineMs = 20000 } = {}) {
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
      transport.sendMail(mensaje),
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
    const config = configuracion();
    if (!validoEmail(email) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw falloPublico();
    const url = new URL('/recuperar', config.base);
    // El fragmento no se envía al servidor HTTP ni como Referer.
    url.hash = new URLSearchParams({ token }).toString();
    const mensaje = { from: config.from, to: email, subject: 'Recuperar acceso a MIO',
      messageId: `<${randomUUID()}@${config.from.split('@')[1]}>`,
      text: `Abre este enlace para cambiar tu contraseña. El enlace dura ${minutos} minutos desde su emisión y solo puede usarse una vez: ${url.href}\nSi no solicitaste el cambio, ignora este mensaje.` };
    for (let intento = 0; intento < 3; intento++) {
      if (+expiresAt <= Date.now()) throw falloPublico();
      try { return await enviarIntento(config, mensaje, { createTransport, deadlineMs }); }
      catch (error) {
        if (intento === 2 || !reintentable(error)) throw falloPublico();
        await sleep(250 * (intento + 1));
      }
    }
  } catch { throw falloPublico(); }
}
module.exports = { enviarRecuperacion, enviarIntento, reintentable };
