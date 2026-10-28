import { test } from 'node:test';
import assert from 'node:assert/strict';
import { login, register, createTicket } from './api.js';

test('API apagada: no genera sesiones ficticias y explica el fallo al guardar', async t => {
  const originalLocal = globalThis.localStorage;
  const originalSession = globalThis.sessionStorage;
  let storedToken = null;
  globalThis.localStorage = { getItem: () => storedToken };
  globalThis.sessionStorage = { getItem: () => null };
  t.after(() => { globalThis.localStorage = originalLocal; globalThis.sessionStorage = originalSession; });
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 500 }));
  await assert.rejects(login('alumno@utm.edu.mx', 'password'), /API no está disponible/);
  await assert.rejects(register({ nombre: 'Alumno', correo: 'alumno@utm.edu.mx', contrasena: 'password' }), /API no está disponible/);
  await assert.rejects(createTicket({}), /API no está disponible/);
  fetchMock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(createTicket({}), /No se pudo conectar con la API/);
  storedToken = 'mock-token-antiguo';
  await assert.rejects(createTicket({}), /Vuelve a iniciar sesión/);
  storedToken = 'token-real';
  fetchMock.mock.mockImplementation(async () => Response.json({ _id: 'inc-1', titulo: 'No enciende', evidencias_adjuntas: [{ nombre_archivo: 'foto.png' }] }, { status: 201 }));
  const saved = await createTicket({ titulo: 'No enciende' });
  assert.equal(saved.id, 'inc-1');
  assert.deepEqual(saved.detalle_especifico, {});
  assert.equal(saved.evidencias[0].nombre_archivo, 'foto.png');
});
