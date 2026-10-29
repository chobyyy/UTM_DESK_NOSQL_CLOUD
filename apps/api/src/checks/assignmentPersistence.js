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

test('MongoDB real: asigna varios tickets al mismo técnico, incluidos expedientes con adjuntos antiguos', async t => {
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
  const temporaryName = '__check_asignacion_' + randomUUID().replaceAll('-', '');
  await db.createCollection(temporaryName, source.options);
  collection = temporaryName;
  const CheckTicket = mongoose.model('AssignmentPersistenceCheck', Ticket.schema.clone(), collection);
  t.mock.method(Ticket, 'findById', (...args) => CheckTicket.findById(...args));
  t.mock.method(Ticket.collection, 'updateOne', (...args) => CheckTicket.collection.updateOne(...args));

  const reporter = await User.findOne({ rol: 'reportante', activo: true });
  const technician = await User.findOne({ rol: 'tecnico', activo: true, areas_autorizadas: 'computo_redes' });
  assert.ok(reporter);
  assert.ok(technician, 'Se necesita un técnico activo de cómputo');
  const actors = { reportante: reporter, tecnico: technician };
  for (const actor of ['coordinador', 'administrador', 'otra_area']) {
    actors[actor] = {
      _id: new mongoose.Types.ObjectId(), nombre: 'Prueba de asignación', activo: true,
      rol: actor === 'otra_area' ? 'coordinador' : actor,
      areas_autorizadas: actor === 'otra_area' ? ['infraestructura'] : ['computo_redes']
    };
  }
  t.mock.method(User, 'findById', async id => Object.values(actors).find(actor => actor._id.equals(id)));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = async (id, actor, data) => {
    const token = jwt.sign({ sub: actors[actor]._id.toString() }, process.env.JWT_SECRET, {
      issuer: 'utm-desk-api', audience: 'utm-desk-web', expiresIn: '5m'
    });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tickets/${id}${data ? '/asignacion' : ''}`, {
      method: data ? 'PATCH' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000)
    });
    return { status: response.status, body: await response.json() };
  };

  const legacy = await db.collection('incidencias_campus').findOne({
    version: { $exists: true }, categoria: 'computo_redes', estado: 'abierta',
    evidencias_adjuntas: { $elemMatch: { url_storage: { $type: 'null' } } }
  });
  assert.ok(legacy, 'Se necesita el formato antiguo con URL nula para reproducir la validación fallida');
  const examples = [];
  for (let i = 0; i < 2; i++) {
    const current = await CheckTicket.create({
      codigo: `INC-2026-91000${i}`, titulo: 'Verificación temporal de asignación', descripcion: 'Prueba de varios tickets',
      categoria: 'computo_redes', estado: 'abierta',
      reportante: { usuario_id: reporter._id, nombre: reporter.nombre },
      ubicacion: { edificio: 'Edificio A', espacio: 'Aula 101' },
      asignacion: { area: 'computo_redes', tecnico_id: null },
      historial_seguimiento: [{ actor_id: reporter._id, accion: 'creacion', estado_nuevo: 'abierta', comentario: 'Prueba temporal' }]
    });
    examples.push(current.toObject());
    const legacyCopy = { ...legacy, _id: new mongoose.Types.ObjectId(), codigo: `INC-2026-92000${i}` };
    await db.collection(collection).insertOne(legacyCopy);
    examples.push(legacyCopy);
  }
  const assignment = { tecnico_id: technician.id, prioridad: 'baja', comentario: 'Verificar pantalla' };
  for (const initial of examples) {
    const response = await call(initial._id, 'coordinador', assignment);
    assert.equal(response.status, 200, response.body.error);
    const saved = await db.collection(collection).findOne({ _id: initial._id });
    assert.ok(saved.asignacion.tecnico_id.equals(technician._id));
    assert.equal(saved.prioridad, 'baja');
    assert.equal(saved.estado, initial.estado);
    assert.deepEqual(saved.evidencias_adjuntas, initial.evidencias_adjuntas);
    assert.deepEqual(saved.detalle_especifico, initial.detalle_especifico);
    assert.deepEqual(saved.tags, initial.tags);
    assert.equal(saved.historial_seguimiento.length, initial.historial_seguimiento.length + 1);
    assert.deepEqual(saved.historial_seguimiento.slice(0, -1), initial.historial_seguimiento);
    const event = saved.historial_seguimiento.at(-1);
    assert.equal(event.accion, 'asignacion');
    assert.ok(event.actor_id.equals(actors.coordinador._id));
    if (initial.version !== undefined) {
      assert.equal(saved.version, initial.version + 1);
      assert.equal(saved.__v, undefined);
      assert.ok(saved.asignacion.asignado_por.equals(actors.coordinador._id));
      assert.ok(saved.asignacion.fecha_asignacion instanceof Date);
      assert.equal(event.visibilidad, 'publico');
      assert.ok(event._id);
    }
    const loaded = await call(initial._id, 'tecnico');
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body.asignacion.tecnico_id._id, technician.id);
    for (const actor of ['reportante', 'tecnico', 'otra_area']) {
      assert.equal((await call(initial._id, actor, assignment)).status, 403);
    }
    assert.equal((await call(initial._id, 'coordinador', { ...assignment, prioridad: 'invalida' })).status, 400);
    console.log(`${initial.version === undefined ? 'Actual' : 'Antiguo con adjunto de URL nula'}: asignación guardada y visible para el técnico; datos conservados.`);
  }
  assert.equal(await CheckTicket.countDocuments({ 'asignacion.tecnico_id': technician._id }), 4);
  assert.equal((await call(examples[0]._id, 'administrador', assignment)).status, 200);
});
