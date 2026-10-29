const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../config/database');
const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User');
const app = require('../app');

test('MongoDB real: guarda etiquetas y prioridades en expedientes actuales y antiguos', async t => {
  let db;
  let collection;
  let server;
  t.after(async () => {
    try {
      if (server) await new Promise(resolve => server.close(resolve));
      if (collection) await db.dropCollection(collection);
    } finally { await mongoose.disconnect(); }
  });
  await connectDatabase();
  db = mongoose.connection.db;
  const [source] = await db.listCollections({ name: 'incidencias_campus' }).toArray();
  assert.ok(source);
  const temporaryName = '__check_etiquetas_' + randomUUID().replaceAll('-', '');
  await db.createCollection(temporaryName, source.options);
  collection = temporaryName;
  const CheckTicket = mongoose.model('TagPersistenceCheck', Ticket.schema.clone(), collection);
  t.mock.method(Ticket, 'findById', (...args) => CheckTicket.findById(...args));
  t.mock.method(Ticket.collection, 'updateOne', (...args) => CheckTicket.collection.updateOne(...args));

  const reporter = await User.findOne({ rol: 'reportante', activo: true });
  assert.ok(reporter);
  const actors = { reportante: reporter };
  for (const rol of ['coordinador', 'administrador', 'tecnico', 'otra_area']) {
    actors[rol] = {
      _id: new mongoose.Types.ObjectId(), nombre: 'Prueba de etiquetas',
      rol: rol === 'otra_area' ? 'coordinador' : rol, activo: true,
      areas_autorizadas: rol === 'otra_area' ? ['infraestructura'] : ['computo_redes']
    };
  }
  t.mock.method(User, 'findById', async id => Object.values(actors).find(actor => actor._id.equals(id)));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = async (id, actor = 'coordinador', value, field = 'tags') => {
    const token = jwt.sign({ sub: actors[actor]._id.toString() }, process.env.JWT_SECRET, {
      issuer: 'utm-desk-api', audience: 'utm-desk-web', expiresIn: '5m'
    });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tickets/${id}${value === undefined ? '' : '/' + field}`, {
      method: value === undefined ? 'GET' : 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(value === undefined ? {} : { body: JSON.stringify({ [field]: value }) }),
      signal: AbortSignal.timeout(15000)
    });
    return { status: response.status, body: await response.json() };
  };

  const current = await CheckTicket.create({
    codigo: 'INC-2026-900001', titulo: 'Prueba temporal de etiquetas', descripcion: 'Verificación de persistencia',
    categoria: 'computo_redes', prioridad: 'media', estado: 'abierta',
    reportante: { usuario_id: reporter._id, nombre: reporter.nombre },
    ubicacion: { edificio: 'Edificio A', espacio: 'Aula 101' },
    asignacion: { area: 'computo_redes', tecnico_id: null },
    historial_seguimiento: [{ actor_id: reporter._id, accion: 'creacion', estado_nuevo: 'abierta', comentario: 'Prueba temporal' }]
  });
  const legacy = await db.collection('incidencias_campus').findOne({
    version: { $exists: true }, categoria: 'computo_redes', estado: 'cerrada', evidencias_adjuntas: { $size: 0 }
  });
  assert.ok(legacy, 'Se requiere un expediente antiguo cerrado para reproducir el error');
  const legacyCopy = { ...legacy, _id: new mongoose.Types.ObjectId(), codigo: 'INC-2026-900002' };
  await db.collection(collection).insertOne(legacyCopy);

  for (const [format, initial] of [['actual', current.toObject()], ['antiguo cerrado', legacyCopy]]) {
    const saved = await call(initial._id, 'coordinador', [' WIFI ', 'wifi', 'Red inalambrica']);
    assert.equal(saved.status, 200, `${format}: ${saved.body.error}`);
    assert.deepEqual(saved.body.tags, ['wifi', 'red-inalambrica']);
    const persisted = await db.collection(collection).findOne({ _id: initial._id });
    assert.deepEqual(persisted.tags, ['wifi', 'red-inalambrica']);
    assert.equal(persisted.estado, initial.estado);
    assert.equal(persisted.historial_seguimiento.length, initial.historial_seguimiento.length + 1);
    assert.ok(persisted.historial_seguimiento.at(-1).actor_id.equals(actors.coordinador._id));
    const loaded = await call(initial._id);
    assert.equal(loaded.status, 200);
    assert.deepEqual(loaded.body.tags, ['wifi', 'red-inalambrica']);
    if (format === 'antiguo cerrado') {
      assert.equal(persisted.__v, undefined);
      assert.equal(persisted.version, initial.version + 1);
      assert.equal(persisted.resultado, initial.resultado);
      assert.deepEqual(persisted.fecha_cierre, initial.fecha_cierre);
      assert.deepEqual(persisted.detalle_especifico, initial.detalle_especifico);
      assert.equal(persisted.historial_seguimiento.at(-1).visibilidad, 'publico');
      assert.ok(persisted.historial_seguimiento.at(-1)._id);
    }
    for (const actor of ['reportante', 'tecnico', 'otra_area']) {
      assert.equal((await call(initial._id, actor, ['prohibida'])).status, 403);
    }
    assert.equal((await call(initial._id, 'coordinador', ['etiqueta!'])).status, 400);
    assert.deepEqual((await db.collection(collection).findOne({ _id: initial._id })).tags, persisted.tags);
    assert.equal((await call(initial._id, 'administrador', ['revision'])).status, 200);
    const cleared = await call(initial._id, 'coordinador', []);
    assert.equal(cleared.status, 200, cleared.body.error);
    assert.deepEqual((await call(initial._id)).body.tags, []);
    const beforePriority = await db.collection(collection).findOne({ _id: initial._id });
    const prioridad = beforePriority.prioridad === 'critica' ? 'baja' : 'critica';
    const prioritized = await call(initial._id, 'coordinador', prioridad, 'prioridad');
    assert.equal(prioritized.status, 200, prioritized.body.error);
    assert.equal((await call(initial._id)).body.prioridad, prioridad);
    const afterPriority = await db.collection(collection).findOne({ _id: initial._id });
    assert.deepEqual(afterPriority.asignacion, beforePriority.asignacion);
    assert.deepEqual(afterPriority.evidencias_adjuntas, beforePriority.evidencias_adjuntas);
    assert.equal(afterPriority.estado, beforePriority.estado);
    assert.deepEqual(afterPriority.fecha_resolucion, beforePriority.fecha_resolucion);
    assert.equal(afterPriority.historial_seguimiento.at(-1).accion, 'comentario');
    assert.match(afterPriority.historial_seguimiento.at(-1).comentario, /Prioridad actualizada/);
    assert.ok(afterPriority.historial_seguimiento.at(-1).actor_id.equals(actors.coordinador._id));
    const historyLength = afterPriority.historial_seguimiento.length;
    assert.equal((await call(initial._id, 'coordinador', prioridad, 'prioridad')).status, 200);
    assert.equal((await db.collection(collection).findOne({ _id: initial._id })).historial_seguimiento.length, historyLength);
    for (const actor of ['reportante', 'tecnico', 'otra_area']) assert.equal((await call(initial._id, actor, 'alta', 'prioridad')).status, 403);
    assert.equal((await call(initial._id, 'administrador', 'alta', 'prioridad')).status, 200);
    console.log(`Expediente ${format}: etiquetas y prioridad persistidas; permisos, historial y datos conservados.`);
  }
});
