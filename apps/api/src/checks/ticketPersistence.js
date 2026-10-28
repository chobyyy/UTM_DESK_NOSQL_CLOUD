const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../config/database');
const { upgradeTicketValidator } = require('../config/ticketValidator');
const { Ticket, CATEGORIAS } = require('../models/Ticket');
const { User } = require('../models/User');
const app = require('../app');

test('MongoDB real: persiste reportes de las tres áreas con y sin fotos y conserva la validación', async t => {
  let db;
  let temporaryCollection;
  let server;
  t.after(async () => {
    try {
      if (server) await new Promise(resolve => server.close(resolve));
      if (temporaryCollection) await db.dropCollection(temporaryCollection);
    } finally { await mongoose.disconnect(); }
  });
  await connectDatabase();
  db = mongoose.connection.db;
  const [source] = await db.listCollections({ name: 'incidencias_campus' }).toArray();
  assert.ok(source, 'Debe existir la colección de incidencias');
  const previous = source.options.validator || {};
  const validator = upgradeTicketValidator(previous);
  assert.deepEqual(upgradeTicketValidator(validator), validator, 'La migración debe ser idempotente');
  if (validator.$or && !previous.$or) {
    assert.deepEqual(validator.$or[0], previous, 'Debe conservar el validador original completo');
  }

  const collection = `__check_incidencias_${randomUUID().replaceAll('-', '')}`;
  await db.createCollection(collection, { validator, validationLevel: 'strict', validationAction: 'error' });
  temporaryCollection = collection;
  const CheckTicket = mongoose.model('TicketPersistenceCheck', Ticket.schema.clone(), collection);
  // Solo redirige la colección: las inserciones, BSON y validación son de MongoDB real.
  t.mock.method(Ticket, 'create', (...args) => CheckTicket.create(...args));
  t.mock.method(Ticket, 'findById', (...args) => CheckTicket.findById(...args));

  const reporter = await User.findOne({ rol: 'reportante', activo: true }).select('_id');
  assert.ok(reporter, 'Se necesita una cuenta de reportante activa para verificar las rutas');
  const token = jwt.sign({ sub: reporter.id, rol: 'reportante' }, process.env.JWT_SECRET, {
    issuer: 'utm-desk-api', audience: 'utm-desk-web', expiresIn: '5m'
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = async (endpoint = '', data) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tickets${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}),
      signal: AbortSignal.timeout(15000)
    });
    return { status: response.status, body: await response.json() };
  };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
  // Supera 1 MB para cubrir el caso de la captura y el límite anterior del parser.
  const photoUrl = 'data:image/png;base64,' + Buffer.concat([png, Buffer.alloc(1732 * 1024 - png.length)]).toString('base64');
  let saved;
  for (const categoria of CATEGORIAS) {
    for (const withPhoto of [false, true]) {
      const result = await call('', {
        titulo: 'Prueba de persistencia', descripcion: 'Verificación temporal del registro de incidencias.',
        categoria, prioridad: 'media', ubicacion: { edificio: 'Edificio A (Aulas y Rectoría)', espacio: 'Aula 101' },
        detalle_especifico: {},
        evidencias_adjuntas: withPhoto ? [{ nombre_archivo: 'prueba.png', tipo_mime: 'image/png', url_storage: photoUrl }] : []
      });
      assert.equal(result.status, 201, `${categoria}, foto=${withPhoto}: ${result.body.error}`);
      saved = await CheckTicket.findById(result.body._id).lean();
      assert.deepEqual(saved.detalle_especifico, {});
      assert.equal(saved.evidencias_adjuntas.length, withPhoto ? 1 : 0);
      if (withPhoto) assert.equal(saved.evidencias_adjuntas[0].url_storage, photoUrl);
      const loaded = await call('/' + result.body._id);
      assert.equal(loaded.status, 200);
      assert.equal(loaded.body.evidencias_adjuntas.length, withPhoto ? 1 : 0);
      console.log(`${categoria}: registrado y recuperado ${withPhoto ? 'con foto de 1732 KB' : 'sin foto'}`);
    }
  }
  for (const invalid of [
    { titulo: '' },
    { categoria: 'inexistente' },
    { asignacion: { area: 'computo_redes', tecnico_id: null } },
    { detalle_especifico: null },
    { campo_desconocido: true }
  ]) {
    await assert.rejects(db.collection(collection).insertOne({
      ...saved, _id: new mongoose.Types.ObjectId(), ...invalid
    }), error => error.code === 121, 'MongoDB debe seguir rechazando documentos inválidos');
  }
  assert.equal(await CheckTicket.countDocuments(), 6);
});
