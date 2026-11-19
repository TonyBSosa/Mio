const { createHmac, randomBytes } = require('node:crypto');

// Cola acotada en memoria. No pretende ser un outbox durable ni garantizar entrega.
function crearCola(procesar, { now = Date.now, max = 100, concurrency = 2 } = {}) {
  const secreto = randomBytes(32), cooldown = new Map(), trabajos = [], esperas = [];
  let activos = 0, programado = false;
  const vacia = () => !activos && !trabajos.length && !programado;
  const avisar = () => { if (vacia()) esperas.splice(0).forEach(resolve => resolve()); };
  const bombear = () => {
    programado = false;
    while (activos < concurrency && trabajos.length) {
      const email = trabajos.shift(); activos++;
      Promise.resolve().then(() => procesar(email)).catch(() => {
        // Nunca imprimir error.message, dirección, token o payload SMTP.
        console.error('recuperacion_trabajo_fallido');
      }).finally(() => { activos--; bombear(); avisar(); });
    }
    avisar();
  };
  return {
    encolar(email) {
      if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return;
      const ahora = now();
      for (const [k, vence] of cooldown) if (vence <= ahora) cooldown.delete(k);
      const key = createHmac('sha256', secreto).update(email).digest('hex');
      if (cooldown.has(key) || cooldown.size >= 2000 || trabajos.length + activos >= max) return;
      cooldown.set(key, ahora + 60000);
      trabajos.push(email);
      if (!programado) { programado = true; setImmediate(bombear); }
    },
    esperarPendientes() { return vacia() ? Promise.resolve() : new Promise(resolve => esperas.push(resolve)); },
  };
}
module.exports = { crearCola };
