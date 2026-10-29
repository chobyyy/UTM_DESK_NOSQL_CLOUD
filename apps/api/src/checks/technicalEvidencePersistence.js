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
const { TechnicalEvidence } = require('../models/TechnicalEvidence');
const app = require('../app');

test('MongoDB real: guarda y descarga evidencias con bitácora atómica en tickets actuales y antiguos', async t => {
  let db;
  let server;
  const collections = [];
  t.after(async () => {
    try {
      if (server) await new Promise(resolve => server.close(resolve));
      for (const name of collections) await db.dropCollection(name);
    } finally { await mongoose.disconnect(); }
  });
  await connectDatabase();
  db = mongoose.connection.db;
  const suffix = randomUUID().replaceAll('-', '');
  const [source] = await db.listCollections({ name: 'incidencias_campus' }).toArray();
  assert.ok(source);
  const ticketCollection = '__check_bitacora_' + suffix;
  const evidenceCollection = '__check_archivos_' + suffix;
  await db.createCollection(ticketCollection, source.options);
  collections.push(ticketCollection);
  await db.createCollection(evidenceCollection);
  collections.push(evidenceCollection);
  const CheckTicket = mongoose.model('EvidenceCheckTicket', Ticket.schema.clone(), ticketCollection);
  const CheckEvidence = mongoose.model('EvidenceCheckFile', TechnicalEvidence.schema.clone(), evidenceCollection);
  t.mock.method(Ticket, 'find', (...args) => CheckTicket.find(...args));
  t.mock.method(Ticket, 'findById', (...args) => CheckTicket.findById(...args));
  t.mock.method(Ticket.collection, 'updateOne', (...args) => CheckTicket.collection.updateOne(...args));
  t.mock.method(TechnicalEvidence, 'createCollection', () => CheckEvidence.createCollection());
  t.mock.method(TechnicalEvidence.collection, 'createIndex', (...args) => CheckEvidence.collection.createIndex(...args));
  t.mock.method(TechnicalEvidence, 'find', (...args) => CheckEvidence.find(...args));
  t.mock.method(TechnicalEvidence, 'findOne', (...args) => CheckEvidence.findOne(...args));
  t.mock.method(TechnicalEvidence, 'countDocuments', (...args) => CheckEvidence.countDocuments(...args));
  const inserts = t.mock.method(TechnicalEvidence, 'insertMany', (...args) => CheckEvidence.insertMany(...args));

  const reporter = await User.findOne({ rol: 'reportante', activo: true });
  const technician = await User.findOne({ rol: 'tecnico', activo: true, areas_autorizadas: 'computo_redes' });
  assert.ok(reporter);
  assert.ok(technician);
  const actors = { reportante: reporter, tecnico: technician };
  for (const name of ['otro_tecnico', 'otro_reportante', 'coordinador', 'otra_area', 'administrador']) {
    actors[name] = {
      _id: new mongoose.Types.ObjectId(), nombre: 'Verificación de evidencias', activo: true,
      rol: name === 'otro_tecnico' ? 'tecnico' : name === 'otro_reportante' ? 'reportante' : name === 'otra_area' ? 'coordinador' : name,
      areas_autorizadas: name === 'otra_area' ? ['infraestructura'] : ['computo_redes']
    };
  }
  t.mock.method(User, 'findById', async id => Object.values(actors).find(actor => actor._id.equals(id)));
  t.mock.method(console, 'error', () => {});
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = async (route, actor = 'tecnico', data) => {
    const token = jwt.sign({ sub: actors[actor]._id.toString() }, process.env.JWT_SECRET, {
      issuer: 'utm-desk-api', audience: 'utm-desk-web', expiresIn: '5m'
    });
    return fetch(`http://127.0.0.1:${server.address().port}/api/tickets${route}`, {
      method: data ? 'PATCH' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(20000)
    });
  };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
  const photo = Buffer.concat([png, Buffer.alloc(1100000)]);
  const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  const log = Buffer.from('Diagnóstico: conexión recuperada\n', 'utf8');
  const wireFile = (name, mime, bytes) => ({ nombre_archivo: name, tipo_mime: mime, url_storage: `data:${mime};base64,${bytes.toString('base64')}` });
  const files = [wireFile('reparacion.png', 'image/png', photo), wireFile('reporte.pdf', 'application/pdf', pdf), wireFile('diagnostico.log', 'text/plain', log)];
  const current = await CheckTicket.create({
    codigo: 'INC-2026-930001', titulo: 'Prueba de bitácora con evidencias', descripcion: 'Verificación temporal', categoria: 'computo_redes',
    reportante: { usuario_id: reporter._id, nombre: reporter.nombre }, ubicacion: { edificio: 'Edificio A', espacio: 'Aula 101' },
    asignacion: { area: 'computo_redes', tecnico_id: technician._id },
    evidencias_adjuntas: Array.from({ length: 3 }, (_, i) => ({ ...wireFile(`reporte-${i}.png`, 'image/png', png), peso_kb: png.length / 1024 })),
    historial_seguimiento: [{ actor_id: reporter._id, accion: 'creacion', estado_nuevo: 'abierta', comentario: 'Prueba temporal' }]
  });
  const legacy = await db.collection('incidencias_campus').findOne({ version: { $exists: true }, categoria: 'computo_redes' });
  assert.ok(legacy);
  const legacyCopy = {
    ...legacy, _id: new mongoose.Types.ObjectId(), codigo: 'INC-2026-930002', estado: 'abierta', resultado: null, fecha_cierre: null, fecha_resolucion: null,
    reportante: { usuario_id: reporter._id, nombre: reporter.nombre },
    asignacion: { area: 'computo_redes', tecnico_id: technician._id, asignado_por: actors.coordinador._id, fecha_asignacion: new Date() }
  };
  await db.collection(ticketCollection).insertOne(legacyCopy);
  for (const initial of [current.toObject(), legacyCopy]) {
    const route = '/' + initial._id;
    const advance = { estado: 'en_proceso', comentario: 'Se reparó la conexión', horas_agregadas: 1.5, evidencias_adjuntas: files };
    const response = await call(route + '/estado', 'tecnico', advance);
    const body = await response.json();
    assert.equal(response.status, 200, body.error);
    assert.equal(body.evidencias_tecnicas.length, 3);
    assert.ok(body.evidencias_tecnicas.every(file => file.contenido === undefined && file.evidencia_tecnica));
    const saved = await db.collection(ticketCollection).findOne({ _id: initial._id });
    assert.deepEqual(saved.evidencias_adjuntas, initial.evidencias_adjuntas);
    assert.equal(saved.horas_invertidas, Number(initial.horas_invertidas) + 1.5);
    assert.equal(saved.estado, initial.version === undefined ? 'en_proceso' : 'en proceso');
    assert.equal(saved.historial_seguimiento.at(-1).horas_agregadas, 1.5);
    const refreshed = await (await call(route, 'reportante')).json();
    assert.equal(refreshed.evidencias_tecnicas.length, 3);
    for (const [index, expected] of [photo, pdf, log].entries()) {
      const metadata = body.evidencias_tecnicas.find(file => file.nombre_archivo === files[index].nombre_archivo);
      const downloadRoute = route + '/evidencias/' + metadata._id;
      const download = await call(downloadRoute);
      assert.equal(download.status, 200);
      assert.deepEqual(Buffer.from(await download.arrayBuffer()), expected);
      assert.match(download.headers.get('content-disposition'), /^attachment;/);
      for (const actor of ['otro_tecnico', 'otro_reportante', 'otra_area']) assert.equal((await call(downloadRoute, actor)).status, 403);
      assert.equal((await call(downloadRoute, 'reportante')).status, 200);
    }
    for (const actor of ['reportante', 'otro_tecnico', 'otra_area']) assert.equal((await call(route + '/estado', actor, advance)).status, 403);
    const beforeRollback = await db.collection(ticketCollection).findOne({ _id: initial._id });
    inserts.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('Fallo de almacenamiento controlado'), { statusCode: 503 }); });
    assert.equal((await call(route + '/estado', 'tecnico', { ...advance, evidencias_adjuntas: [files[2]] })).status, 503);
    assert.deepEqual(await db.collection(ticketCollection).findOne({ _id: initial._id }), beforeRollback);
    assert.equal(await CheckEvidence.countDocuments({ ticket_id: initial._id }), 3);
    const resolved = await call(route + '/estado', 'tecnico', { estado: 'resuelta', comentario: 'Reparación verificada', horas_agregadas: 0 });
    assert.equal(resolved.status, 200, (await resolved.json()).error);
    const reopened = await call(route + '/estado', 'tecnico', { estado: 'en_espera', comentario: 'Pendiente de refacción', horas_agregadas: 0 });
    assert.equal(reopened.status, 200, (await reopened.json()).error);
    const final = await db.collection(ticketCollection).findOne({ _id: initial._id });
    assert.equal(final.fecha_resolucion, null);
    if (initial.version !== undefined) { assert.equal(final.resultado, null); assert.equal(final.fecha_cierre, null); }
    console.log(`${initial.version === undefined ? 'Actual con 3 fotos previas' : 'Antiguo'}: imágenes, PDF y LOG persistidos y descargados; permisos y reversión atómica verificados.`);
  }
  const list = await (await call('', 'tecnico')).json();
  assert.equal(list.length, 2);
  assert.ok(list.every(ticket => ticket.evidencias_tecnicas.length === 3));
});
