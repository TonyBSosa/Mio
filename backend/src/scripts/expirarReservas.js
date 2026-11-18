require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const expiracion = require('../services/expiracionReservasService');
const { esEntornoPruebasAislado } = require('../services/reservasPruebaPolicy');

(async () => {
  try {
    if (process.env.NODE_ENV !== 'test') throw Error('El barrido solo está habilitado en pruebas.');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false, autoCreate: false });
    if (!esEntornoPruebasAislado()) throw Error('El barrido solo está habilitado en una base de pruebas aislada.');
    const vencimientos = await expiracion.procesar();
    const limpieza = await require('../services/comprobanteService').limpiarCargas();
    console.log(JSON.stringify({ ...vencimientos, limpieza }));
  } catch (error) {
    console.error(error.status ? error.message : 'No se completó el barrido de reservas. Revisá conexión y entorno de pruebas.');
    process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
})();
