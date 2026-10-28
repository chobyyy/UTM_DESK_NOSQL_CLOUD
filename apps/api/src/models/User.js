const mongoose = require('mongoose');

const ROLES = ['reportante', 'tecnico', 'coordinador', 'administrador'];
const TIPOS_REPORTANTE = ['alumno', 'docente', 'administrativo'];

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    password_hash: { type: String, default: null, select: false },
    rol: { type: String, enum: ROLES, default: 'reportante', index: true },
    tipo_reportante: { type: String, enum: TIPOS_REPORTANTE, default: 'alumno' },
    areas_autorizadas: [{ type: String, trim: true }],
    activo: { type: Boolean, default: true },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now }
  },
  { timestamps: false, versionKey: false, collection: 'usuarios' }
);

module.exports = { User: mongoose.model('User', userSchema), ROLES, TIPOS_REPORTANTE };