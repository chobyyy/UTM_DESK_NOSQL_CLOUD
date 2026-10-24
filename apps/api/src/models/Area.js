const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    coordinadores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'areas_catalogo' }
);

module.exports = mongoose.model('Area', areaSchema);
