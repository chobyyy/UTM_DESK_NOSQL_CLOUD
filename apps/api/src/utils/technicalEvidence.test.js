const { test } = require('node:test');
const assert = require('node:assert/strict');
const { decodeEvidence } = require('./technicalEvidence');

const file = (name, mime, bytes) => ({ nombre_archivo: name, tipo_mime: mime, peso_kb: 999, url_storage: `data:${mime};base64,${bytes.toString('base64')}` });

test('decodifica PDF y logs, conserva los bytes y calcula el tamaño real', () => {
  const pdf = Buffer.from('%PDF-1.7\n%%EOF');
  const log = Buffer.from('Diagnóstico: conexión restablecida\n', 'utf8');
  const result = decodeEvidence([file('reporte.pdf', 'application/pdf', pdf), file('diagnostico.log', 'text/plain', log)]);
  assert.deepEqual(result[0].contenido, pdf);
  assert.deepEqual(result[1].contenido, log);
  assert.equal(result[0].peso_kb, pdf.length / 1024);
  assert.deepEqual(decodeEvidence(), []);
});

test('rechaza contenido, tipos y tamaños inválidos antes de guardar la bitácora', () => {
  const text = Buffer.from('log');
  for (const files of [
    null, Array(4).fill(file('ok.log', 'text/plain', text)),
    [file('falso.pdf', 'application/pdf', text)],
    [file('falso.png', 'image/png', text)],
    [file('script.html', 'text/plain', text)],
    [file('vacio.txt', 'text/plain', Buffer.alloc(0))],
    [file('grande.txt', 'text/plain', Buffer.alloc(2 * 1024 * 1024 + 1, 65))],
    [file('binario.txt', 'text/plain', Buffer.from([0xff, 0xff]))],
    [file('nulo.txt', 'text/plain', Buffer.from([65, 0, 66]))],
    [file('nombre\ninvalido.log', 'text/plain', text)]
  ]) assert.throws(() => decodeEvidence(files), error => error.statusCode === 400);
});
