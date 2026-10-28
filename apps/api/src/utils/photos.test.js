const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePhotos } = require('./photos');
const { allowRoles } = require('../middleware/auth');

const photo = () => ({ nombre_archivo: 'foto.png', tipo_mime: 'image/png', url_storage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=' });

test('acepta fotos y calcula su tamaño real', () => {
  const photos = [photo()];
  assert.equal(validatePhotos(photos), null);
  assert.ok(photos[0].peso_kb > 0);
  assert.equal(validatePhotos(), null);
});

test('rechaza documentos, contenido falso, exceso de fotos y tamaño excesivo', () => {
  assert.ok(validatePhotos(null));
  assert.ok(validatePhotos(Array.from({ length: 4 }, photo)));
  assert.ok(validatePhotos([{ ...photo(), tipo_mime: 'application/pdf' }]));
  assert.ok(validatePhotos([{ ...photo(), url_storage: 'data:image/png;base64,aG9sYQ==' }]));
  assert.ok(validatePhotos([{ ...photo(), url_storage: 'https://example.com/foto.png' }]));
  assert.ok(validatePhotos([{ ...photo(), url_storage: 'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64') }]));
});

test('solo coordinadores y administradores pasan el permiso de etiquetas', () => {
  for (const rol of ['reportante', 'tecnico', 'coordinador', 'administrador']) {
    let allowed = false;
    let status;
    const res = { status(code) { status = code; return this; }, json() {} };
    allowRoles('coordinador', 'administrador')({ user: { rol } }, res, () => { allowed = true; });
    assert.equal(allowed, ['coordinador', 'administrador'].includes(rol));
    if (!allowed) assert.equal(status, 403);
  }
});
