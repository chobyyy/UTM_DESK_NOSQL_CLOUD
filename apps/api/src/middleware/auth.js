const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Se requiere autenticación' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    const user = await User.findById(payload.sub);
    if (!user || !user.activo) return res.status(401).json({ error: 'Cuenta no disponible' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.rol)
    ? next()
    : res.status(403).json({ error: 'No tienes permiso para esta acción' });
}

module.exports = { requireAuth, allowRoles };
