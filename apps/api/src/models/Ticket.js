const mongoose = require('mongoose');

const CATEGORIAS = ['computo_redes', 'infraestructura', 'academico'];
const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];
const ESTADOS = ['abierta', 'en_proceso', 'en_espera', 'resuelta', 'cerrada'];

const seguimientoSchema = new mongoose.Schema(
  {
    fecha: { type: Date, default: Date.now },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accion: { type: String, required: true, trim: true },
    estado_anterior: { type: String, enum: [...ESTADOS, null], default: null },
    estado_nuevo: { type: String, enum: ESTADOS, required: true },
    comentario: { type: String, trim: true, maxlength: 2000 },
    horas_agregadas: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const evidenciaSchema = new mongoose.Schema(
  {
    nombre_archivo: { type: String, required: true, trim: true },
    tipo_mime: { type: String, required: true, trim: true },
    peso_kb: { type: Number, required: true, min: 0 },
    url_storage: { type: String, required: true, trim: true },
    fecha_carga: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, index: true },
    titulo: { type: String, required: true, trim: true, maxlength: 160 },
    descripcion: { type: String, required: true, trim: true, maxlength: 5000 },
    categoria: { type: String, required: true, enum: CATEGORIAS },
    prioridad: { type: String, required: true, enum: PRIORIDADES, default: 'media' },
    estado: { type: String, required: true, enum: ESTADOS, default: 'abierta' },
    reportante: {
      usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      nombre: { type: String, required: true, trim: true }
    },
    ubicacion: {
      edificio: { type: String, required: true, trim: true },
      espacio: { type: String, required: true, trim: true }
    },
    asignacion: {
      area: { type: String, required: true, enum: CATEGORIAS },
      tecnico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    detalle_especifico: { type: mongoose.Schema.Types.Mixed, required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    historial_seguimiento: [seguimientoSchema],
    evidencias_adjuntas: [evidenciaSchema],
    horas_invertidas: { type: Number, min: 0, default: 0 },
    fecha_resolucion: { type: Date, default: null }
  },
  { timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' }, collection: 'incidencias_campus' }
);

ticketSchema.index({ categoria: 1, estado: 1, 'ubicacion.edificio': 1 });
ticketSchema.index({ titulo: 'text', descripcion: 'text' });
ticketSchema.index({ fecha_resolucion: 1 }, { expireAfterSeconds: 5184000 });

module.exports = { Ticket: mongoose.model('Ticket', ticketSchema), CATEGORIAS, PRIORIDADES, ESTADOS };
