const mongoose = require('mongoose');

const ROLES = ['reportante', 'tecnico', 'coordinador', 'administrador'];

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, default: null, select: false },
    rol: { type: String, enum: ROLES, default: 'reportante', index: true },
    matricula: { type: String, trim: true },
    carrera: { type: String, trim: true },
    avatar: { type: String, trim: true },
    areas_autorizadas: [{ type: String, trim: true }],
    activo: { type: Boolean, default: true },
    tipo_reportante: { type: String, trim: true },
    fecha_creacion: { type: Date, default: null },
    fecha_actualizacion: { type: Date, default: null }
  },
  { timestamps: false, collection: 'usuarios' }
);

module.exports = { User: mongoose.model('User', userSchema), ROLES };