import { test } from 'node:test';
import assert from 'node:assert/strict';
import { login, register, createTicket, assignTicket, updateTicketStatus, getEvidenceFile, updateTicketPriority } from './api.js';

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
  for (const details of ['El técnico no está disponible', ['El técnico no está disponible']]) {
    fetchMock.mock.mockImplementation(async () => Response.json({ error: 'Datos inválidos', details }, { status: 400 }));
    await assert.rejects(assignTicket('inc-1', {}), /Datos inválidos\. El técnico no está disponible/);
  }
  fetchMock.mock.mockImplementation(async () => Response.json({
    _id: 'inc-1', estado: 'en proceso', evidencias_adjuntas: [{ nombre_archivo: 'reporte.png' }],
    evidencias_tecnicas: [{ _id: 'archivo-1', nombre_archivo: 'reparacion.pdf', evidencia_tecnica: true }],
    historial_seguimiento: [{ estado_anterior: 'abierta', estado_nuevo: 'en proceso' }]
  }));
  const advanced = await updateTicketStatus('inc-1', {});
  assert.equal(advanced.estado, 'en_proceso');
  assert.equal(advanced.historial[0].estadoNuevo, 'en_proceso');
  assert.equal(advanced.evidencias.length, 2);
  const bytes = new Uint8Array([1, 2, 3, 4]);
  fetchMock.mock.mockImplementation(async () => new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } }));
  const downloaded = await getEvidenceFile('inc-1', 'archivo-1');
  assert.deepEqual(new Uint8Array(await downloaded.arrayBuffer()), bytes);
  const downloadRequest = fetchMock.mock.calls.at(-1).arguments;
  assert.equal(downloadRequest[0], '/api/tickets/inc-1/evidencias/archivo-1');
  assert.equal(downloadRequest[1].headers.Authorization, 'Bearer token-real');
  fetchMock.mock.mockImplementation(async () => Response.json({ error: 'No puedes consultar esta evidencia' }, { status: 403 }));
  await assert.rejects(getEvidenceFile('inc-1', 'archivo-1'), /No puedes consultar esta evidencia/);
  fetchMock.mock.mockImplementation(async () => Response.json({ _id: 'inc-1', prioridad: 'critica', historial_seguimiento: [] }));
  const prioritized = await updateTicketPriority('inc-1', 'critica');
  assert.equal(prioritized.prioridad, 'critica');
  assert.equal(fetchMock.mock.calls.at(-1).arguments[0], '/api/tickets/inc-1/prioridad');
  assert.deepEqual(JSON.parse(fetchMock.mock.calls.at(-1).arguments[1].body), { prioridad: 'critica' });
});
