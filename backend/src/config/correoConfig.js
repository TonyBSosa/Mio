const validoEmail = valor => typeof valor === 'string' && valor.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(valor);
const configuracion = (env = process.env) => {
  const fallo = () => { throw new Error('Configuracion de correo invalida'); };
  const host = env.SMTP_HOST, port = env.SMTP_PORT ?? '587';
  if (typeof host !== 'string' || host.length > 253 || !host.split('.').every(label => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label)) ||
      !/^\d+$/.test(port) || +port < 1 || +port > 65535 || !validoEmail(env.MAIL_FROM) ||
      typeof env.SMTP_USER !== 'string' || typeof env.SMTP_PASSWORD !== 'string' ||
      !env.SMTP_USER || !env.SMTP_PASSWORD || /[\r\n\0]/.test(env.SMTP_USER + env.SMTP_PASSWORD)) fallo();
  let base;
  try { base = new URL(env.APP_URL); } catch { fallo(); }
  const desarrolloLocal = env.NODE_ENV !== 'production' && base.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((!desarrolloLocal && base.protocol !== 'https:') || base.username || base.password ||
      base.search || base.hash || base.pathname !== '/') fallo();
  return { base, from: env.MAIL_FROM, host, port: +port,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } };
};
module.exports = { configuracion, validoEmail };
