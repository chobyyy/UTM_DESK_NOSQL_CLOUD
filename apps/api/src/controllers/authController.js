const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return {
    id: user._id.toString(),
    _id: user._id,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    matricula: user.matricula || '',
    carrera: user.carrera || '',
    avatar: user.avatar || (user.nombre ? user.nombre.slice(0, 2).toUpperCase() : 'US'),
    areas_autorizadas: user.areas_autorizadas || [],
    activo: user.activo
  };
}

async function register(req, res, next) {
  try {
    const { contrasena, matricula, carrera } = req.body;
    const nombre = req.body.nombre?.trim();
    const correo = req.body.correo?.trim().toLowerCase();

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }
    if (!VALID_EMAIL.test(correo)) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'El servicio de autenticación no está configurado.' });
    }

    const existe = await User.findOne({ correo });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(contrasena, 12);
    const iniciales = nombre
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';

    const user = await User.create({
      nombre,
      correo,
      password_hash: passwordHash,
      rol: 'reportante',
      matricula: matricula?.trim() || `UTM-${Math.floor(100000 + Math.random() * 900000)}`,
      carrera: carrera?.trim() || 'Comunidad Universitaria',
      avatar: iniciales,
      activo: true,
      areas_autorizadas: []
    });

    const token = jwt.sign(
      { sub: user._id.toString(), rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h', issuer: 'utm-desk-api', audience: 'utm-desk-web' }
    );

    return res.status(201).json({
      token,
      user: publicUser(user),
      message: 'Cuenta creada exitosamente.'
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const correo = req.body.correo?.trim().toLowerCase();
    const contrasena = req.body.contrasena;
    if (!correo || !contrasena) return res.status(400).json({ error: 'Correo y contrasena son obligatorios.' });
    if (!VALID_EMAIL.test(correo)) return res.status(400).json({ error: 'Ingresa un correo electronico valido.' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'El servicio de autenticacion no esta configurado.' });

    const user = await User.findOne({ correo }).select('+password_hash');
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    const passwordOk = await bcrypt.compare(contrasena, user.password_hash);
    if (!passwordOk) return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    if (!user.activo) return res.status(403).json({ error: 'Tu cuenta está suspendida. Contacta al administrador.', code: 'ACCOUNT_SUSPENDED' });

    const token = jwt.sign({ sub: user._id.toString(), rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    return res.json({ token, user: publicUser(user) });
  } catch (error) { next(error); }
}

module.exports = { login, register, VALID_EMAIL, UTM_EMAIL: VALID_EMAIL };
