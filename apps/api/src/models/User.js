const mongoose = require('mongoose');

const ROLES = ['reportante', 'tecnico', 'coordinador', 'administrador'];

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    rol: { type: String, enum: ROLES, default: 'reportante', index: true },
    areas_autorizadas: [{ type: String, trim: true }],
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'usuarios' }
);

module.exports = { User: mongoose.model('User', userSchema), ROLES };
