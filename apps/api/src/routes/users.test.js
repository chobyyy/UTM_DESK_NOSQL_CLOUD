const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const app = require('../app');

test('HTTP: administra roles y suspensiones; protege cuentas, sesiones y datos privados', async t => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'role-edit-test-only';
  t.after(() => { if (secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secret; });
  const records = new Map();
  for (const rol of ['administrador', 'coordinador', 'tecnico', 'reportante']) {
    const user = new User({ nombre: 'Usuario de prueba', correo: rol + '@example.invalid', rol,
      areas_autorizadas: rol === 'tecnico' || rol === 'coordinador' ? ['computo_redes'] : [], password_hash: 'privado' });
    records.set(rol, user);
  }
  const target = new User({ nombre: 'Cuenta a editar', correo: 'target@example.invalid', rol: 'reportante',
    areas_autorizadas: [], tipo_reportante: 'docente', password_hash: 'hash-conservado', activo: false });
  records.set('target', target);
  const publicUser = user => user && Object.fromEntries(['_id', 'nombre', 'correo', 'rol', 'areas_autorizadas', 'activo', 'tipo_reportante'].map(key => [key, user[key]]));
  const query = value => ({ select: async () => publicUser(value), then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
  t.mock.method(User, 'findById', id => query([...records.values()].find(user => user._id.equals(id))));
  const update = t.mock.method(User, 'findOneAndUpdate', (filter, change) => {
    const user = [...records.values()].find(user => user._id.equals(filter._id));
    if (!user || (filter.rol !== undefined && user.rol !== filter.rol) || (filter.activo !== undefined && user.activo !== filter.activo)) return query(null);
    Object.assign(user, change.$set);
    return query(user);
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const call = async (actor, data, id = target.id, action = 'rol') => {
    const token = actor && jwt.sign({ sub: records.get(actor).id }, process.env.JWT_SECRET, { issuer: 'utm-desk-api', audience: 'utm-desk-web' });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/users/${id}/${action}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data)
    });
    return { status: response.status, body: await response.json() };
  };
  const valid = { rol: 'tecnico', areas_autorizadas: ['computo_redes'] };
  assert.equal((await call(null, valid)).status, 401);
  for (const actor of ['reportante', 'tecnico', 'coordinador']) assert.equal((await call(actor, valid)).status, 403);
  assert.equal(update.mock.callCount(), 0);
  for (const data of [
    { rol: 'administrador', areas_autorizadas: [] },
    { rol: 'invalido', areas_autorizadas: [] },
    { rol: 'tecnico', areas_autorizadas: [] },
    { rol: 'coordinador', areas_autorizadas: [] },
    { rol: 'tecnico', areas_autorizadas: 'computo_redes' },
    { rol: 'coordinador', areas_autorizadas: ['inventada'] },
    { rol: 'coordinador', areas_autorizadas: ['academico', 'academico'] },
    { rol: 'reportante', areas_autorizadas: ['academico'] }
  ]) assert.equal((await call('administrador', data)).status, 400);
  assert.equal((await call('administrador', valid, 'invalido')).status, 400);
  assert.equal((await call('administrador', valid, new mongoose.Types.ObjectId())).status, 404);
  assert.equal((await call('administrador', valid, records.get('administrador').id)).status, 403);
  const creation = target.fecha_creacion;
  for (const data of [valid, { rol: 'coordinador', areas_autorizadas: ['academico', 'infraestructura'] }, { rol: 'reportante', areas_autorizadas: [] }]) {
    const result = await call('administrador', { ...data, password_hash: 'ataque', activo: true, nombre: 'Otro nombre' });
    assert.equal(result.status, 200);
    assert.equal(result.body.rol, data.rol);
    assert.deepEqual(result.body.areas_autorizadas, data.areas_autorizadas);
    assert.equal(result.body.password_hash, undefined);
    assert.equal(target.password_hash, 'hash-conservado');
    assert.equal(target.nombre, 'Cuenta a editar');
    assert.equal(target.correo, 'target@example.invalid');
    assert.equal(target.activo, false);
    assert.equal(target.tipo_reportante, 'docente');
    assert.deepEqual(target.fecha_creacion, creation);
  }
  update.mock.mockImplementationOnce(() => query(null));
  assert.equal((await call('administrador', valid)).status, 409);

  const estado = (actor, data, id) => call(actor, data, id, 'estado');
  assert.equal((await estado(null, { activo: true })).status, 401);
  for (const actor of ['reportante', 'tecnico', 'coordinador']) assert.equal((await estado(actor, { activo: true })).status, 403);
  for (const activo of ['true', 'false', 0, 1, null, {}, []]) assert.equal((await estado('administrador', { activo })).status, 400);
  assert.equal((await estado('administrador', {})).status, 400);
  assert.equal((await estado('administrador', { activo: false }, 'invalido')).status, 400);
  assert.equal((await estado('administrador', { activo: false }, new mongoose.Types.ObjectId())).status, 404);
  assert.equal((await estado('administrador', { activo: false }, records.get('administrador').id.toUpperCase())).status, 403);
  assert.equal(records.get('administrador').activo, true);

  const before = target.toObject();
  assert.equal((await estado('administrador', { activo: true })).status, 200);
  const previousToken = jwt.sign({ sub: target.id }, process.env.JWT_SECRET, { issuer: 'utm-desk-api', audience: 'utm-desk-web' });
  const sessionRequest = () => fetch(`http://127.0.0.1:${server.address().port}/api/users`, { headers: { Authorization: 'Bearer ' + previousToken } });
  assert.equal((await sessionRequest()).status, 403, 'Cuenta activa llega al control de roles');
  const suspended = await estado('administrador', { activo: false, rol: 'administrador', password_hash: 'ataque' });
  assert.equal(suspended.status, 200);
  assert.equal(suspended.body.activo, false);
  assert.equal(suspended.body.password_hash, undefined);
  const deniedSession = await sessionRequest();
  assert.equal(deniedSession.status, 401);
  assert.equal((await deniedSession.json()).code, 'ACCOUNT_SUSPENDED');
  assert.equal((await call('target', valid)).status, 401, 'Cuenta suspendida no puede realizar cambios');
  const noOpCount = update.mock.callCount();
  assert.equal((await estado('administrador', { activo: false })).status, 200);
  assert.equal(update.mock.callCount(), noOpCount);

  t.mock.method(User, 'findOne', () => ({ select: async () => target }));
  t.mock.method(bcrypt, 'compare', async () => true);
  const login = () => fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo: target.correo, contrasena: 'password-test' })
  });
  const blockedLogin = await login();
  assert.equal(blockedLogin.status, 403);
  assert.equal((await blockedLogin.json()).token, undefined);
  update.mock.mockImplementationOnce(() => query(null));
  assert.equal((await estado('administrador', { activo: true })).status, 409);
  assert.equal(target.activo, false);
  assert.equal((await estado('administrador', { activo: true })).status, 200);
  assert.equal((await login()).status, 200, 'La reactivación permite iniciar sesión');
  for (const [key, value] of Object.entries(before)) {
    if (!['activo', 'fecha_actualizacion'].includes(key)) assert.deepEqual(target.toObject()[key], value);
  }
  assert.equal((await estado('administrador', { activo: false }, records.get('coordinador').id)).status, 200);
  assert.equal((await estado('coordinador', { activo: false })).status, 401);
});
