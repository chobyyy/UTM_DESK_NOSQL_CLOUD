const mongoose = require('mongoose');

const technicalEvidenceSchema = new mongoose.Schema({
  ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  subido_por: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nombre_archivo: { type: String, required: true, maxlength: 255 },
  tipo_mime: { type: String, required: true, enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'] },
  peso_kb: { type: Number, required: true, min: 0, max: 2048 },
  contenido: { type: Buffer, required: true, select: false },
  fecha_carga: { type: Date, required: true, default: Date.now }
}, { collection: 'evidencias_tecnicas', versionKey: false, autoCreate: false, autoIndex: false });

module.exports = { TechnicalEvidence: mongoose.model('TechnicalEvidence', technicalEvidenceSchema) };
