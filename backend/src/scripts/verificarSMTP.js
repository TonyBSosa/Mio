// Solo ejecución manual: no importa servidor ni conecta MongoDB.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const { verificarSMTP } = require('../services/correoService');
const { registrar } = require('../services/diagnosticoRecuperacion');
verificarSMTP().then(() => console.log('smtp_verificacion_correcta: conexion y autenticacion; no se enviaron mensajes'))
  .catch(error => { registrar(error); process.exitCode = 1; });
