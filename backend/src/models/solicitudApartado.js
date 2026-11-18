const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  compradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true, immutable: true },
  vendedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  compradorNombre: { type: String, required: true, immutable: true },
  productoNombre: { type: String, required: true, immutable: true },
  productoCodigo: { type: String, default: '', immutable: true },
  tiendaNombre: { type: String, required: true, immutable: true },
  precioRegistrado: { type: Number, min: 0, immutable: true },
  precioConfirmado: { type: Number, min: 0 },
  estado: { type: String, enum: ['pendiente', 'confirmada', 'rechazada', 'expirada', 'comprobante_en_revision', 'comprobante_rechazado', 'pagada'], default: 'pendiente', required: true },
  confirmadoEn: Date,
  rechazadoEn: Date,
  venceEn: Date,
  expiradoEn: Date,
  inventarioLiberado: Boolean,
  motivoLiberacion: String,
  comprobanteRecibidoEn: Date,
  comprobanteActualId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comprobante' },
  corregirHasta: Date,
  pagadoEn: Date,
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
  plazoReservaDias: { type: Number, enum: [3, 7] },
  esPrueba: { type: Boolean, default: false },
}, { timestamps: true, collection: 'solicitudes_apartado' });

solicitudSchema.index({ compradorId: 1, productoId: 1 }, {
  unique: true, partialFilterExpression: { estado: 'pendiente' }, name: 'solicitud_pendiente_unica',
});
solicitudSchema.index({ compradorId: 1, createdAt: -1 });
solicitudSchema.index({ compradorId: 1, productoId: 1 }, {
  unique: true, partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada'] } }, name: 'solicitud_activa_unica',
});
solicitudSchema.index({ vendedorId: 1, createdAt: -1 });
solicitudSchema.index({ compradorId: 1, productoId: 1 }, {
  unique: true, partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada', 'comprobante_en_revision'] } }, name: 'solicitud_ciclo_activo_unica',
});
solicitudSchema.index({ estado: 1, esPrueba: 1, venceEn: 1 }); // Sin TTL: conservar historial.
solicitudSchema.index({ compradorId: 1, productoId: 1 }, {
  unique: true, partialFilterExpression: { estado: { $in: ['pendiente', 'confirmada', 'comprobante_en_revision', 'comprobante_rechazado', 'pagada'] } }, name: 'solicitud_financiera_unica',
});
solicitudSchema.index({ estado: 1, esPrueba: 1, corregirHasta: 1 });

module.exports = mongoose.model('SolicitudApartado', solicitudSchema);
