const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user._id.toString(), _id: user._id, nombre: user.nombre, correo: user.correo, rol: user.rol, areas_autorizadas: user.areas_autorizadas || [], activo: user.activo };
}

async function login(req, res, next) {
  try {
    const correo = req.body.correo?.trim().toLowerCase();
    const contrasena = req.body.contrasena;
    if (!correo || !contrasena) return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    if (!VALID_EMAIL.test(correo)) return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'El servicio de autenticación no está configurado.' });

    const user = await User.findOne({ correo }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(contrasena, user.passwordHash))) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    if (!user.activo) return res.status(403).json({ error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.' });

    const token = jwt.sign({ sub: user._id.toString(), rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    return res.json({ token, user: publicUser(user) });
  } catch (error) { next(error); }
}

module.exports = { login, VALID_EMAIL, UTM_EMAIL: VALID_EMAIL };
