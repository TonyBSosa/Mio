// Una sola fuente para persistencia y texto del correo. No lee archivos .env.
const expiracionMinutos = (env = process.env) => {
  const valor = env.RECOVERY_TOKEN_TTL_MINUTES ?? '30';
  if (!/^\d+$/.test(valor) || Number(valor) < 1 || Number(valor) > 120) {
    throw new Error('Configuracion de recuperacion invalida');
  }
  return Number(valor);
};
module.exports = { expiracionMinutos, COOLDOWN_MS: 60000, WINDOW_MS: 3600000, MAX_PER_WINDOW: 3 };
