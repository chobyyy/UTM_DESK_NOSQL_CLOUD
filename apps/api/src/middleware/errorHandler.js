const { DATABASE_UNAVAILABLE, isDatabaseConnectionError } = require('../utils/databaseErrors');

function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  if (isDatabaseConnectionError(error)) {
    return res.status(503).json(DATABASE_UNAVAILABLE);
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Datos inválidos', details: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'El recurso ya existe' });
  }
  res.status(error.statusCode || 500).json({ error: error.message || 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
