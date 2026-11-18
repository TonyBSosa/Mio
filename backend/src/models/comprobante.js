const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  reservaId: { type: mongoose.Schema.Types.ObjectId, ref: 'SolicitudApartado', required: true, immutable: true },
  compradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  vendedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  clavePrivada: { type: String, required: true, immutable: true, select: false },
  tipo: { type: String, enum: ['image/webp'], required: true },
  tamano: { type: Number, min: 1, max: 5242880, required: true },
  estado: { type: String, enum: ['preparando', 'en_revision', 'aprobado', 'rechazado', 'fallido'], required: true },
  finalizaCargaEn: Date,
  recibidoEn: Date,
  revisadoEn: Date,
  revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  motivo: { type: String, maxlength: 500 },
  limpiezaPendiente: { type: Boolean, default: false },
  ultimaLimpiezaEn: Date,
  corregirHasta: Date,
}, { timestamps: true, collection: 'comprobantes' });
schema.index({ reservaId: 1 }, { unique: true, partialFilterExpression: { estado: 'preparando' }, name: 'carga_en_curso_unica' });
schema.index({ reservaId: 1, createdAt: -1 });
schema.index({ estado: 1, finalizaCargaEn: 1 });
schema.index({ estado: 1, limpiezaPendiente: 1, ultimaLimpiezaEn: 1 });
module.exports = mongoose.model('Comprobante', schema);
