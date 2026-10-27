const express = require('express');
const { User } = require('../models/User');
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

module.exports = router;