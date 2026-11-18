const bcrypt = require('bcryptjs');
const bloqueadas = require('../config/passwordBlocklist.json');
const lista = new Set(bloqueadas.map(p => p.normalize('NFKC').toLowerCase()));
const MENSAJE = 'Usa al menos 15 caracteres y como máximo 72 bytes UTF-8; evita contraseñas comunes o comprometidas.';
const validarPassword = password => {
  if (typeof password !== 'string' || !password.isWellFormed() || password.includes('\0') ||
      [...password].length < 15 || Buffer.byteLength(password, 'utf8') > 72 ||
      !password.trim() || lista.has(password.normalize('NFKC').toLowerCase())) {
    throw Object.assign(new Error(MENSAJE), { status: 400, mensaje: MENSAJE });
  }
  // No normalizar, recortar ni cambiar el secreto que se hashea.
  return password;
};
const hashPassword = async password => bcrypt.hash(validarPassword(password), 12);
// Login heredado NO aplica la política de emisión ni el límite nuevo de bcrypt.
const verificarPassword = (password, hash) => bcrypt.compare(password, hash);
module.exports = { validarPassword, hashPassword, verificarPassword, MENSAJE };
