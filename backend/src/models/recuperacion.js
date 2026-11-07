const crypto = require('node:crypto');
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { collection: 'recuperaciones' });
schema.statics.hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
module.exports = mongoose.model('Recuperacion', schema);
