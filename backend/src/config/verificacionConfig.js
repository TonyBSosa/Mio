function horas(env = process.env) {
  const valor = env.EMAIL_VERIFICATION_TTL_HOURS ?? '24';
  if (!/^\d+$/.test(valor) || +valor < 1 || +valor > 72) throw new Error('Configuracion de verificacion invalida');
  return +valor;
}
function modoHistorico(env = process.env) {
  const modo = env.EMAIL_VERIFICATION_LEGACY_MODE ?? 'off';
  // Un valor mal escrito no debe desactivar controles silenciosamente.
  if (!['off', 'sensitive'].includes(modo)) throw new Error('Configuracion de verificacion invalida');
  return modo;
}
const pendienteNueva = u => u?.emailVerificationRequired === true && !u.emailVerifiedAt;
module.exports = { horas, modoHistorico, pendienteNueva };
