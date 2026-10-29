const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { CATEGORIAS } = require('../models/Ticket');
const { requireAuth, allowRoles } = require('../middleware/auth');

const router = express.Router();

const PUBLIC_FIELDS = '_id nombre correo rol areas_autorizadas activo tipo_reportante';

router.get('/', requireAuth, allowRoles('administrador'), async (req, res, next) => {
  try {
    const users = await User.find({}).select(PUBLIC_FIELDS).sort({ nombre: 1 });
    res.json(users);
  } catch (error) { next(error); }
});

router.get('/tecnicos', requireAuth, allowRoles('coordinador', 'administrador'), async (req, res, next) => {
  try {
    const filter = { rol: 'tecnico', activo: true };
    if (req.user.rol === 'coordinador') filter.areas_autorizadas = { $in: req.user.areas_autorizadas };
    const tecnicos = await User.find(filter).select('nombre correo rol areas_autorizadas').sort({ nombre: 1 });
    res.json(tecnicos);
  } catch (error) { next(error); }
});

router.patch('/:id/rol', requireAuth, allowRoles('administrador'), async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: 'Usuario inválido' });
    const { rol, areas_autorizadas: areas } = req.body || {};
    if (!['reportante', 'tecnico', 'coordinador'].includes(rol)) {
      return res.status(400).json({ error: 'Selecciona reportante, técnico o coordinador' });
    }
    if (!Array.isArray(areas) || areas.some(area => !CATEGORIAS.includes(area)) || new Set(areas).size !== areas.length) {
      return res.status(400).json({ error: 'Selecciona áreas autorizadas válidas, sin repetir' });
    }
    if (rol !== 'reportante' && areas.length === 0) {
      return res.status(400).json({ error: 'Los técnicos y coordinadores necesitan al menos un área autorizada' });
    }
    if (rol === 'reportante' && areas.length !== 0) {
      return res.status(400).json({ error: 'Los reportantes no necesitan áreas autorizadas' });
    }
    const current = await User.findById(req.params.id).select(PUBLIC_FIELDS);
    if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (current.rol === 'administrador') {
      return res.status(403).json({ error: 'Las cuentas de administrador conservan su rol' });
    }
    const updated = await User.findOneAndUpdate(
      { _id: current._id, rol: current.rol, areas_autorizadas: current.areas_autorizadas },
      { $set: { rol, areas_autorizadas: areas, fecha_actualizacion: new Date(),
        ...(rol === 'reportante' && !current.tipo_reportante ? { tipo_reportante: 'alumno' } : {}) } },
      { new: true, runValidators: true }
    ).select(PUBLIC_FIELDS);
    if (!updated) return res.status(409).json({ error: 'El usuario cambió durante la edición. Actualiza el directorio y vuelve a intentarlo' });
    res.json(updated);
  } catch (error) { next(error); }
});

router.patch('/:id/estado', requireAuth, allowRoles('administrador'), async (req, res, next) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: 'Usuario inválido' });
    const { activo } = req.body || {};
    if (typeof activo !== 'boolean') return res.status(400).json({ error: 'Indica si la cuenta debe estar activa o suspendida' });
    if (req.user._id.toString() === req.params.id.toLowerCase()) {
      return res.status(403).json({ error: 'No puedes suspender tu propia cuenta' });
    }
    const current = await User.findById(req.params.id).select(PUBLIC_FIELDS);
    if (!current) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (current.activo === activo) return res.json(current);
    const updated = await User.findOneAndUpdate(
      { _id: current._id, activo: current.activo },
      { $set: { activo, fecha_actualizacion: new Date() } },
      { new: true, runValidators: true }
    ).select(PUBLIC_FIELDS);
    if (!updated) return res.status(409).json({ error: 'El estado de la cuenta cambió. Actualiza el directorio y vuelve a intentarlo' });
    res.json(updated);
  } catch (error) { next(error); }
});

module.exports = router;
