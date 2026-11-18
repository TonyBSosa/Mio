const mongoose = require('mongoose');

module.exports = async vendedorId => {
  const permitidos = (process.env.RESERVAS_PRUEBA_VENDEDORES || '').split(',').map(id => id.trim());
  if (process.env.NODE_ENV !== 'test' || process.env.RESERVAS_PRUEBA_HABILITADAS !== 'true' ||
      !permitidos.includes(String(vendedorId)) || !/^mio_pruebas_/.test(mongoose.connection.name || '')) {
    return { habilitada: false, motivo: 'Confirmación restringida a pruebas aisladas. Falta validar el almacenamiento privado y la operación completa antes de habilitar reservas reales.' };
  }
  if (mongoose.connection.readyState !== 1) return { habilitada: false, motivo: 'La base de pruebas no está conectada.' };
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  return hello.setName || hello.msg === 'isdbgrid'
    ? { habilitada: true, motivo: 'Pruebas aisladas: reservas y revisión manual de comprobantes. No usar para pagos reales hasta validar la configuración externa.' }
    : { habilitada: false, motivo: 'La base actual no admite transacciones. Se necesita un replica set o MongoDB Atlas.' };
};
module.exports.esEntornoPruebasAislado = () => process.env.NODE_ENV === 'test' &&
  /^mio_pruebas_/.test(mongoose.connection.name || '') && mongoose.connection.readyState === 1;
