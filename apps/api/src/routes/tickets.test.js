const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User');
const { TechnicalEvidence } = require('../models/TechnicalEvidence');
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
  t.mock.method(TechnicalEvidence, 'find', () => ({ select() { return this; }, sort() { return this; }, lean: async () => [] }));
  t.mock.method(User, 'findById', async id => Object.values(users).find(user => user._id.equals(id)));
  t.mock.method(User, 'findOne', async filter => Object.values(users).find(user =>
    user._id.equals(filter._id) && user.rol === filter.rol && user.activo === filter.activo
  ));
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
  assert.equal(created.body.prioridad, 'media');
  for (const prioridad of ['baja', 'media', 'alta', 'critica', null]) {
    assert.equal((await call('', 'reportante', 'POST', { ...report('computo_redes'), prioridad })).status, 403);
  }
  assert.deepEqual(created.body.tags, []);
  assert.equal(created.body.evidencias_adjuntas[0].url_storage, url);
  const path = '/' + created.body._id;
  const loaded = await call(path, 'reportante');
  assert.equal(loaded.status, 200);
  assert.equal(loaded.body.evidencias_adjuntas[0].url_storage, url);
  const second = await call('', 'reportante', 'POST', report('computo_redes'));
  assert.equal(second.status, 201);
  const priorityPath = '/' + second.body._id + '/prioridad';
  for (const role of ['reportante', 'tecnico']) assert.equal((await call(priorityPath, role, 'PATCH', { prioridad: 'critica' })).status, 403);
  assert.equal((await call(priorityPath, 'coordinador', 'PATCH', { prioridad: 'inexistente' })).status, 400);
  assert.equal((await call('/invalido/prioridad', 'coordinador', 'PATCH', { prioridad: 'alta' })).status, 400);
  const prioritized = await call(priorityPath, 'coordinador', 'PATCH', { prioridad: 'alta' });
  assert.equal(prioritized.status, 200);
  assert.equal(prioritized.body.prioridad, 'alta');
  assert.equal(prioritized.body.asignacion.tecnico_id, null);
  assert.equal(prioritized.body.historial_seguimiento.at(-1).comentario, 'Prioridad actualizada de MEDIA a ALTA');
  const eventCount = prioritized.body.historial_seguimiento.length;
  assert.equal((await call(priorityPath, 'coordinador', 'PATCH', { prioridad: 'alta' })).body.historial_seguimiento.length, eventCount);
  updates.mock.mockImplementationOnce(async () => ({ matchedCount: 0 }));
  assert.equal((await call(priorityPath, 'coordinador', 'PATCH', { prioridad: 'critica' })).status, 409);
  assert.equal((await call('/' + second.body._id, 'reportante')).body.prioridad, 'alta');
  const assignment = { tecnico_id: users.tecnico._id.toString(), prioridad: 'baja', comentario: 'Revisar el equipo' };
  for (const id of [created.body._id, second.body._id]) {
    const assigned = await call('/' + id + '/asignacion', 'coordinador', 'PATCH', assignment);
    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.asignacion.tecnico_id, assignment.tecnico_id);
    assert.equal(assigned.body.prioridad, 'baja');
    assert.equal(assigned.body.historial_seguimiento.at(-1).accion, 'asignacion');
  }
  for (const rol of ['reportante', 'tecnico']) {
    assert.equal((await call(path + '/asignacion', rol, 'PATCH', assignment)).status, 403);
  }
  assert.equal((await call(path + '/asignacion', 'coordinador', 'PATCH', { ...assignment, prioridad: 'incorrecta' })).status, 400);
  assert.equal((await call(path + '/asignacion', 'coordinador', 'PATCH', { ...assignment, comentario: 'x'.repeat(2001) })).status, 400);
  users.tecnico.areas_autorizadas = ['infraestructura'];
  assert.equal((await call(path + '/asignacion', 'coordinador', 'PATCH', assignment)).status, 400);
  users.tecnico.areas_autorizadas = ['computo_redes'];
  updates.mock.mockImplementationOnce(async () => ({ matchedCount: 0 }));
  assert.equal((await call(path + '/asignacion', 'coordinador', 'PATCH', assignment)).status, 409);
  const advance = { estado: 'en_proceso', comentario: 'Se revisó el equipo', horas_agregadas: 1 };
  const advanced = await call(path + '/estado', 'tecnico', 'PATCH', advance);
  assert.equal(advanced.status, 200);
  assert.equal(advanced.body.horas_invertidas, 1);
  assert.equal(advanced.body.historial_seguimiento.at(-1).horas_agregadas, 1);
  for (const data of [{ ...advance, horas_agregadas: -1 }, { ...advance, horas_agregadas: 25 }, { ...advance, comentario: '' }]) {
    assert.equal((await call(path + '/estado', 'tecnico', 'PATCH', data)).status, 400);
  }
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
  assert.equal((await call(priorityPath, 'coordinador', 'PATCH', { prioridad: 'critica' })).status, 403);
  assert.equal((await call(priorityPath, 'administrador', 'PATCH', { prioridad: 'critica' })).status, 200);
  assert.equal((await call(path + '/asignacion', 'coordinador', 'PATCH', assignment)).status, 403);
  assert.equal((await call(path + '/tags', 'coordinador', 'PATCH', { tags: [] })).status, 403);
  assert.equal((await call(path + '/tags', 'administrador', 'PATCH', { tags: [] })).status, 200);
  assert.equal((await call('', 'reportante', 'POST', { ...report('computo_redes'), evidencias_adjuntas: [{ nombre_archivo: 'falso.png', tipo_mime: 'image/png', url_storage: 'data:image/png;base64,aG9sYQ==' }] })).status, 400);
});
