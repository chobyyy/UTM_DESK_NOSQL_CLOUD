const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDatabase } = require('../config/database');
const { User } = require('../models/User');
const app = require('../app');

test('MongoDB real: roles, áreas y suspensiones compatibles con el validador de usuarios', async t => {
  let db, collection, server;
  t.after(async () => {
    try {
      if (server) await new Promise(resolve => server.close(resolve));
      if (collection) await db.dropCollection(collection);
    } finally { await mongoose.disconnect(); }
  });
  await connectDatabase();
  db = mongoose.connection.db;
  const [source] = await db.listCollections({ name: 'usuarios' }).toArray();
  assert.ok(source);
  const template = await db.collection('usuarios').findOne({ rol: 'reportante' });
  assert.ok(template);
  const name = '__check_roles_' + randomUUID().replaceAll('-', '');
  await db.createCollection(name, source.options);
  collection = name;
  const CheckUser = mongoose.model('RolePersistenceCheck', User.schema.clone(), collection);
  t.mock.method(User, 'findById', (...args) => CheckUser.findById(...args));
  t.mock.method(User, 'findOneAndUpdate', (...args) => CheckUser.findOneAndUpdate(...args));
  t.mock.method(User, 'find', (...args) => CheckUser.find(...args));
  const actors = {};
  for (const rol of ['administrador', 'reportante', 'tecnico', 'coordinador']) {
    const doc = { ...template, _id: new mongoose.Types.ObjectId(), nombre: 'Prueba temporal de rol',
      correo: `${rol}@example.invalid`, rol, activo: true,
      areas_autorizadas: ['tecnico', 'coordinador'].includes(rol) ? ['computo_redes'] : [] };
    await db.collection(collection).insertOne(doc);
    actors[rol] = doc;
  }
  const target = { ...template, _id: new mongoose.Types.ObjectId(), nombre: 'Cuenta temporal para cambio de rol', correo: 'target@example.invalid', activo: true };
  await db.collection(collection).insertOne(target);
  actors.target = target;
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const call = async (actor, data, action = 'rol', id = target._id) => {
    const token = jwt.sign({ sub: actors[actor]._id.toString() }, process.env.JWT_SECRET, { issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users${data ? '/' + id + '/' + action : ''}`, {
      method: data ? 'PATCH' : 'GET', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000)
    });
    return { status: response.status, body: await response.json() };
  };
  for (const data of [
    { rol: 'tecnico', areas_autorizadas: ['computo_redes'] },
    { rol: 'coordinador', areas_autorizadas: ['computo_redes', 'infraestructura', 'academico'] },
    { rol: 'coordinador', areas_autorizadas: ['academico'] },
    { rol: 'reportante', areas_autorizadas: [] }
  ]) {
    const saved = await call('administrador', data);
    assert.equal(saved.status, 200, saved.body.error);
    assert.equal(saved.body.rol, data.rol);
    assert.equal(saved.body.password_hash, undefined);
    const persisted = await db.collection(collection).findOne({ _id: target._id });
    assert.equal(persisted.rol, data.rol);
    assert.deepEqual(persisted.areas_autorizadas, data.areas_autorizadas);
    for (const [key, value] of Object.entries(target)) {
      if (!['rol', 'areas_autorizadas', 'fecha_actualizacion'].includes(key)) assert.deepEqual(persisted[key], value);
    }
    const listed = await call('administrador');
    assert.equal(listed.status, 200);
    assert.equal(listed.body.find(user => user._id === target._id.toString()).rol, data.rol);
    for (const actor of ['reportante', 'tecnico', 'coordinador']) assert.equal((await call(actor, data)).status, 403);
  }
  assert.equal((await call('administrador', { rol: 'tecnico', areas_autorizadas: [] })).status, 400);
  const beforeStatus = await db.collection(collection).findOne({ _id: target._id });
  for (const activo of [false, true]) {
    const saved = await call('administrador', { activo }, 'estado');
    assert.equal(saved.status, 200, saved.body.error);
    assert.equal(saved.body.activo, activo);
    assert.equal(saved.body.password_hash, undefined);
    const persisted = await db.collection(collection).findOne({ _id: target._id });
    assert.equal(persisted.activo, activo);
    for (const [key, value] of Object.entries(beforeStatus)) {
      if (!['activo', 'fecha_actualizacion'].includes(key)) assert.deepEqual(persisted[key], value);
    }
    const listed = await call('administrador');
    assert.equal(listed.body.find(user => user._id === target._id.toString()).activo, activo);
    const targetAccess = await call('target');
    assert.equal(targetAccess.status, activo ? 403 : 401);
    if (!activo) assert.equal(targetAccess.body.code, 'ACCOUNT_SUSPENDED');
    for (const actor of ['reportante', 'tecnico', 'coordinador']) assert.equal((await call(actor, { activo }, 'estado')).status, 403);
  }
  assert.equal((await call('administrador', { activo: false }, 'estado', actors.administrador._id)).status, 403);
  assert.equal((await db.collection(collection).findOne({ _id: actors.administrador._id })).activo, true);
  console.log('Roles, áreas y suspensiones persistidos; acceso bloqueado mientras está suspendida; datos conservados. Solo se usó una colección temporal.');
});
