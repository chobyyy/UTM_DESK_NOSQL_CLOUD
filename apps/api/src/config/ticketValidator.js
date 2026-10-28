const { isDeepStrictEqual } = require('node:util');
const { CATEGORIAS, PRIORIDADES, ESTADOS } = require('../models/Ticket');

const text = (minLength = 1, maxLength) => ({
  bsonType: 'string', minLength, ...(maxLength ? { maxLength } : {})
});
const objectId = { bsonType: 'objectId' };
const nullableId = { bsonType: ['objectId', 'null'] };
const date = { bsonType: 'date' };
const nonnegativeNumber = { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 0 };
const object = (required, properties) => ({
  bsonType: 'object', required, additionalProperties: false, properties
});

// Contrato de los documentos que realmente guarda Ticket. Los datos técnicos
// pueden completarse después; no son requisitos para reportar un problema.
const applicationValidator = {
  $and: [
    {
      $jsonSchema: object([
        '_id', 'codigo', 'titulo', 'descripcion', 'categoria', 'prioridad', 'estado',
        'reportante', 'ubicacion', 'asignacion', 'detalle_especifico', 'tags',
        'historial_seguimiento', 'evidencias_adjuntas', 'horas_invertidas',
        'fecha_creacion', 'fecha_actualizacion', 'fecha_resolucion'
      ], {
        _id: objectId,
        __v: { bsonType: ['int', 'long'], minimum: 0 },
        codigo: { ...text(), pattern: '^INC-[0-9]{4}-[0-9]{6,}$' },
        titulo: text(1, 160),
        descripcion: text(1, 5000),
        categoria: { enum: CATEGORIAS },
        prioridad: { enum: PRIORIDADES },
        estado: { enum: ESTADOS },
        reportante: object(['usuario_id', 'nombre'], { usuario_id: objectId, nombre: text() }),
        ubicacion: object(['edificio', 'espacio'], { edificio: text(), espacio: text() }),
        asignacion: object(['area', 'tecnico_id'], {
          area: { enum: CATEGORIAS }, tecnico_id: nullableId
        }),
        detalle_especifico: { bsonType: 'object' },
        tags: { bsonType: 'array', uniqueItems: true, maxItems: 20, items: text(1, 50) },
        historial_seguimiento: {
          bsonType: 'array', minItems: 1,
          items: object([
            'fecha', 'actor_id', 'accion', 'estado_anterior', 'estado_nuevo', 'horas_agregadas'
          ], {
            fecha: date,
            actor_id: objectId,
            accion: { enum: ['creacion', 'asignacion', 'cambio_estado', 'comentario', 'registro_horas', 'evidencia', 'etiquetas'] },
            estado_anterior: { enum: [...ESTADOS, null] },
            estado_nuevo: { enum: ESTADOS },
            comentario: text(0, 2000),
            horas_agregadas: nonnegativeNumber
          })
        },
        evidencias_adjuntas: {
          bsonType: 'array', maxItems: 3,
          items: object([
            'nombre_archivo', 'tipo_mime', 'peso_kb', 'url_storage', 'fecha_carga'
          ], {
            nombre_archivo: text(1, 255),
            tipo_mime: { enum: ['image/jpeg', 'image/png', 'image/webp'] },
            peso_kb: { ...nonnegativeNumber, exclusiveMinimum: true, maximum: 2048 },
            url_storage: {
              ...text(1, 4 * Math.ceil(2 * 1024 * 1024 / 3) + 32),
              pattern: '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$'
            },
            fecha_carga: date
          })
        },
        horas_invertidas: nonnegativeNumber,
        fecha_creacion: date,
        fecha_actualizacion: date,
        fecha_resolucion: { bsonType: ['date', 'null'] }
      })
    },
    {
      $expr: {
        $and: [
          { $eq: ['$categoria', '$asignacion.area'] },
          { $gte: ['$fecha_actualizacion', '$fecha_creacion'] },
          { $or: [
            { $eq: ['$fecha_resolucion', null] },
            { $gte: ['$fecha_resolucion', '$fecha_creacion'] }
          ] }
        ]
      }
    }
  ]
};

function upgradeTicketValidator(existing = {}) {
  if (!Object.keys(existing).length) return structuredClone(applicationValidator);
  if (isDeepStrictEqual(existing, applicationValidator) ||
      existing.$or?.some(branch => isDeepStrictEqual(branch, applicationValidator))) {
    return structuredClone(existing);
  }
  // Conserva íntegro el contrato anterior para los expedientes ya existentes.
  return { $or: [structuredClone(existing), structuredClone(applicationValidator)] };
}

module.exports = { upgradeTicketValidator };
