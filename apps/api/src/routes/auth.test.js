const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { User } = require('../models/User');
const app = require('../app');

test('HTTP: una caída de MongoDB no expone OpenSSL ni permite registrar cuentas', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'auth-connectivity-test';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  t.mock.method(console, 'error', () => {});
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const create = t.mock.method(User, 'create', () => { throw new Error('No debe crear una cuenta'); });

  for (const failure of [
    new Error('48080000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:SSL alert number 80'),
    new mongoose.Error.MongooseServerSelectionError('No hay servidores disponibles'),
    new mongoose.mongo.MongoNetworkError('Conexión perdida')
  ]) {
    await t.test(failure.name + ': registro e inicio de sesión responden 503', async (t) => {
      t.mock.method(User, 'findOne', () => { throw failure; });
      for (const action of ['register', 'login']) {
        const response = await fetch(`${base}/auth/${action}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: 'Prueba de conexión', correo: 'check@example.invalid', contrasena: 'test-password' })
        });
        const body = await response.json();
        assert.equal(response.status, 503);
        assert.equal(body.code, 'DATABASE_UNAVAILABLE');
        assert.match(body.error, /base de datos/);
        assert.doesNotMatch(JSON.stringify(body), /SSL|tlsv1|48080000/);
        assert.equal(body.token, undefined);
      }
    });
  }
  assert.equal(create.mock.callCount(), 0);

  await t.test('health informa de la desconexión aunque Express funcione', async (t) => {
    const previousState = mongoose.connection._readyState;
    t.after(() => { mongoose.connection._readyState = previousState; });
    mongoose.connection._readyState = 0;
    const response = await fetch(`${base}/health`);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.database, 'unavailable');
  });

  await t.test('health comprueba la conexión real y detecta fallos de ping', async (t) => {
    const previousState = mongoose.connection._readyState;
    t.after(() => { mongoose.connection._readyState = previousState; });
    mongoose.connection._readyState = 1;
    const previousDb = mongoose.connection.db;
    t.after(() => { mongoose.connection.db = previousDb; });
    let pingFails = false;
    mongoose.connection.db = {
      async command(command, options) {
        assert.deepEqual(command, { ping: 1 });
        assert.equal(options.timeoutMS, 2000);
        if (pingFails) throw new mongoose.mongo.MongoNetworkError('Conexión perdida');
        return { ok: 1 };
      }
    };
    const healthy = await fetch(`${base}/health`);
    assert.equal(healthy.status, 200);
    assert.equal((await healthy.json()).database, 'connected');
    pingFails = true;
    const failed = await fetch(`${base}/health`);
    assert.equal(failed.status, 503);
    assert.equal((await failed.json()).database, 'unavailable');
  });
});
