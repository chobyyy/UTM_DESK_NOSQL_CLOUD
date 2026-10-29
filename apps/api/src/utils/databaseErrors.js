const CONNECTION_ERROR_NAMES = new Set([
  'MongooseServerSelectionError',
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoTopologyClosedError',
  'MongoNotConnectedError'
]);

const DATABASE_UNAVAILABLE = Object.freeze({
  code: 'DATABASE_UNAVAILABLE',
  error: 'No se pudo conectar con la base de datos. Intenta de nuevo en unos momentos. Si el problema continúa, contacta al administrador.'
});

function isDatabaseConnectionError(error) {
  const visited = new Set();
  for (let current = error; current && !visited.has(current); current = current.cause) {
    visited.add(current);
    if (CONNECTION_ERROR_NAMES.has(current.name)) return true;
    if (/^ERR_(SSL|TLS)_/.test(current.code || '')) return true;
    // El controlador puede propagar el fallo de OpenSSL como un Error común.
    if (/SSL routines:|SSL alert number|tlsv1 alert|buffering timed out after/i.test(current.message || '')) return true;
  }
  return false;
}

module.exports = { DATABASE_UNAVAILABLE, isDatabaseConnectionError };
