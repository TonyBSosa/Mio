const nodemailer = require('nodemailer');
exports.enviarRecuperacion = async (email, token) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM, APP_URL } = process.env;
  if (!SMTP_HOST || !MAIL_FROM || !APP_URL) throw new Error('Configurar correo de recuperacion');
  const url = new URL('/recuperar', APP_URL);
  url.searchParams.set('token', token);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465,
    ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {})
  });
  await transport.sendMail({ from: MAIL_FROM, to: email, subject: 'Recuperar acceso a MIO',
    text: `Abre este enlace para cambiar tu contraseña. Vence en 15 minutos y solo puede usarse una vez: ${url.href}` });
};
