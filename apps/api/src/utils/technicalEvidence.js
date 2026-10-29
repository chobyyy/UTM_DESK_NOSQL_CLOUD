const { TextDecoder } = require('node:util');
const { TechnicalEvidence } = require('../models/TechnicalEvidence');
const { validatePhotos } = require('./photos');

const MAX_FILES = 3;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_TICKET_FILES = 20;

function decodeEvidence(files = []) {
  const invalid = message => { throw Object.assign(new Error(message), { statusCode: 400 }); };
  if (!Array.isArray(files) || files.length > MAX_FILES) invalid('Adjunta hasta 3 archivos por avance');
  return files.map(file => {
    if (!file || typeof file.nombre_archivo !== 'string' || !file.nombre_archivo.trim() || file.nombre_archivo.length > 255 || /[\u0000-\u001f]/.test(file.nombre_archivo)) invalid('Nombre de archivo inválido');
    const match = typeof file.url_storage === 'string' && file.url_storage.match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf|text\/plain);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || match[1] !== file.tipo_mime) invalid('Selecciona imágenes JPEG, PNG o WebP, PDF, TXT o LOG');
    if (match[2].length > 4 * Math.ceil(MAX_BYTES / 3)) invalid('Cada archivo debe pesar como máximo 2 MB');
    const contenido = Buffer.from(match[2], 'base64');
    if (!contenido.length || contenido.length > MAX_BYTES || contenido.toString('base64') !== match[2]) invalid('Cada archivo debe contener datos válidos y pesar como máximo 2 MB');
    if (file.tipo_mime.startsWith('image/')) {
      const error = validatePhotos([{ ...file }]);
      if (error) invalid(error);
    } else if (file.tipo_mime === 'application/pdf') {
      if (contenido.toString('ascii', 0, 5) !== '%PDF-') invalid('El archivo no contiene un PDF válido');
    } else {
      if (!/\.(txt|log)$/i.test(file.nombre_archivo)) invalid('Los archivos de texto deben tener extensión .txt o .log');
      try { new TextDecoder('utf-8', { fatal: true }).decode(contenido); }
      catch { invalid('El archivo de texto debe estar codificado en UTF-8'); }
      if (contenido.includes(0)) invalid('El archivo no contiene texto válido');
    }
    return { nombre_archivo: file.nombre_archivo.trim(), tipo_mime: file.tipo_mime, peso_kb: contenido.length / 1024, contenido };
  });
}

let storageReady;
async function ensureEvidenceStorage() {
  if (!storageReady) {
    storageReady = (async () => {
      await TechnicalEvidence.createCollection();
      await TechnicalEvidence.collection.createIndex({ ticket_id: 1, fecha_carga: 1 });
    })().catch(error => { storageReady = undefined; throw error; });
  }
  await storageReady;
}

async function withTechnicalEvidence(input) {
  const list = Array.isArray(input) ? input : [input];
  const files = await TechnicalEvidence.find({ ticket_id: { $in: list.map(ticket => ticket._id) } })
    .select('-contenido').sort({ fecha_carga: 1, _id: 1 }).lean();
  const grouped = new Map();
  for (const file of files) {
    const key = String(file.ticket_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({
      _id: file._id, nombre_archivo: file.nombre_archivo, tipo_mime: file.tipo_mime,
      peso_kb: file.peso_kb, fecha_carga: file.fecha_carga, subido_por: file.subido_por,
      evidencia_tecnica: true
    });
  }
  const result = list.map(ticket => ({
    ...(ticket.toObject ? ticket.toObject() : ticket),
    evidencias_tecnicas: grouped.get(String(ticket._id)) || []
  }));
  return Array.isArray(input) ? result : result[0];
}

module.exports = { decodeEvidence, ensureEvidenceStorage, withTechnicalEvidence, MAX_TICKET_FILES };
