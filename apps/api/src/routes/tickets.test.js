const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User');
const { validateTicketInput } = require('../utils/ticketRules');
const app = require('../app');

const report = (categoria) => ({ titulo: 'No funciona', descripcion: 'El equipo no enciende.', categoria, ubicacion: { edificio: 'Edificio A', espacio: 'Aula 101' } });

test('un alumno puede reportar en las tres áreas sin información técnica', async () => {
  for (const categoria of ['computo_redes', 'infraestructura', 'academico']) {
    assert.deepEqual(validateTicketInput(report(categoria)), []);
    const doc = new Ticket({ ...report(categoria), codigo: 'INC-TEST', reportante: { usuario_id: new mongoose.Types.ObjectId(), nombre: 'Alumno' }, asignacion: { area: categoria } });
    await doc.validate();
    assert.deepEqual(doc.toObject().detalle_especifico, {}, 'Debe persistir el objeto vacío de datos técnicos');
  }
  assert.ok(validateTicketInput({ ...report('computo_redes'), detalle_especifico: [] }).length);
  assert.ok(validateTicketInput({ ...report('computo_redes'), titulo: '' }).length);
});

test('HTTP: registra y recupera una foto; aplica roles y áreas al editar etiquetas', async (t) => {
  // Reemplaza solo el acceso a MongoDB; ejecuta Express, JWT, validación y modelos reales.
  const users = {};
  for (const rol of ['reportante', 'tecnico', 'coordinador', 'administrador']) {
    users[rol] = { _id: new mongoose.Types.ObjectId(), nombre: rol, rol, activo: true, areas_autorizadas: ['computo_redes'] };
  }
  const records = new Map();
  t.mock.method(User, 'findById', async id => Object.values(users).find(user => user._id.equals(id)));
  t.mock.method(Ticket, 'create', async data => {
    const doc = new Ticket(data);
    await doc.validate();
    records.set(doc.id, doc);
    return doc;
  });
  t.mock.method(Ticket, 'findById', id => {
    const query = { populate() { return this; }, then(resolve, reject) { return Promise.resolve(records.get(String(id))).then(resolve, reject); } };
    return query;
  });
  const updates = t.mock.method(Ticket.collection, 'updateOne', async (filter, update) => {
    const doc = records.get(String(filter._id));
    const versionField = Object.keys(update.$inc)[0];
    const currentVersion = doc?.get(versionField);
    const expected = filter[versionField];
    if (!doc || doc.estado !== filter.estado || (typeof expected === 'object' ? currentVersion !== undefined : currentVersion !== expected)) return { matchedCount: 0 };
    for (const [key, value] of Object.entries(update.$set)) doc.set(key, value);
    doc.historial_seguimiento.push(update.$push.historial_seguimiento);
    doc.set(versionField, (currentVersion || 0) + 1);
    await doc.validate();
    return { matchedCount: 1 };
  });
  t.mock.method(Ticket.prototype, 'save', async function () { await this.validate(); return this; });
  t.mock.method(Ticket.prototype, 'populate', async function () { return this; });
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-no-production';
  t.after(() => { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const call = async (path, rol, method = 'GET', data) => {
    const token = jwt.sign({ sub: users[rol]._id.toString() }, process.env.JWT_SECRET, { issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/tickets${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: data && JSON.stringify(data)
    });
    return { status: res.status, body: await res.json() };
  };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
  // Mayor que el límite anterior de 1 MB del parser JSON.
  const url = 'data:image/png;base64,' + Buffer.concat([png, Buffer.alloc(1100000)]).toString('base64');
  const created = await call('', 'reportante', 'POST', { ...report('computo_redes'), evidencias_adjuntas: [{ nombre_archivo: 'evidencia.png', tipo_mime: 'image/png', url_storage: url }] });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.tags, []);
  assert.equal(created.body.evidencias_adjuntas[0].url_storage, url);
  const path = '/' + created.body._id;
  const loaded = await call(path, 'reportante');
  assert.equal(loaded.status, 200);
  assert.equal(loaded.body.evidencias_adjuntas[0].url_storage, url);
  assert.equal((await call('', 'reportante', 'POST', { ...report('computo_redes'), tags: ['prohibida'] })).status, 403);
  for (const rol of ['reportante', 'tecnico']) assert.equal((await call(path + '/tags', rol, 'PATCH', { tags: ['red'] })).status, 403);
  const etiquetado = await call(path + '/tags', 'coordinador', 'PATCH', { tags: [' Red ', 'red', 'Red inalambrica'] });
  assert.equal(etiquetado.status, 200);
  assert.deepEqual(etiquetado.body.tags, ['red', 'red-inalambrica']);
  assert.deepEqual((await call(path, 'reportante')).body.tags, ['red', 'red-inalambrica']);
  assert.equal(etiquetado.body.historial_seguimiento.at(-1).accion, 'etiquetas');
  for (const tags of [['x'], ['x'.repeat(41)], ['etiqueta!'], [null], Array(21).fill('red')]) {
    assert.equal((await call(path + '/tags', 'coordinador', 'PATCH', { tags })).status, 400);
  }
  updates.mock.mockImplementationOnce(async () => ({ matchedCount: 0 }));
  assert.equal((await call(path + '/tags', 'coordinador', 'PATCH', { tags: ['otra'] })).status, 409);
  assert.deepEqual((await call(path, 'reportante')).body.tags, ['red', 'red-inalambrica']);
  users.coordinador.areas_autorizadas = ['academico'];
  assert.equal((await call(path + '/tags', 'coordinador', 'PATCH', { tags: [] })).status, 403);
  assert.equal((await call(path + '/tags', 'administrador', 'PATCH', { tags: [] })).status, 200);
  assert.equal((await call('', 'reportante', 'POST', { ...report('computo_redes'), evidencias_adjuntas: [{ nombre_archivo: 'falso.png', tipo_mime: 'image/png', url_storage: 'data:image/png;base64,aG9sYQ==' }] })).status, 400);
});
