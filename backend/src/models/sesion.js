const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  credentialVersion: { type: String },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { collection: 'sesiones' });
module.exports = mongoose.model('Sesion', schema);
