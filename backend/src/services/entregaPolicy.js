const fallo = mensaje => Object.assign(new Error(mensaje), { status: 400, mensaje });

// Fecha de calendario, sin conversión de zona horaria.
const validarPlanEntrega = plan => {
  if (!plan || !['local', 'zona_comun'].includes(plan.tipo)) throw fallo('Elegí entrega en local o en zona común');
  if (typeof plan.lugar !== 'string' || !plan.lugar.trim() || plan.lugar.trim().length > 200) {
    throw fallo('Indicá un lugar de entrega de hasta 200 caracteres');
  }
  const fecha = plan.fecha;
  const valor = typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? new Date(`${fecha}T12:00:00Z`) : null;
  if (!valor || !Number.isFinite(valor.getTime()) || valor.toISOString().slice(0, 10) !== fecha || fecha < '2000-01-01' || fecha > '2100-12-31') {
    throw fallo('Indicá una fecha de entrega válida entre 2000 y 2100');
  }
  return { tipo: plan.tipo, lugar: plan.lugar.trim(), fecha };
};

module.exports = { validarPlanEntrega };
