const { CATEGORIAS, PRIORIDADES } = require('../models/Ticket');

const requiredFields = {
  computo_redes: ['tipo_falla', 'equipo'],
  infraestructura: ['tipo_dano', 'elemento_afectado', 'nivel_riesgo'],
  academico: ['plataforma', 'tipo_error', 'periodo_escolar']
};

function validateTicketInput(data) {
  const errors = [];
  if (!data.titulo?.trim()) errors.push('titulo es obligatorio');
  if (!data.descripcion?.trim()) errors.push('descripcion es obligatoria');
  if (!CATEGORIAS.includes(data.categoria)) errors.push('categoria no válida');
  if (data.prioridad && !PRIORIDADES.includes(data.prioridad)) errors.push('prioridad no válida');
  if (!data.ubicacion?.edificio?.trim() || !data.ubicacion?.espacio?.trim()) errors.push('ubicacion.edificio y ubicacion.espacio son obligatorios');
  if (!data.detalle_especifico || typeof data.detalle_especifico !== 'object') {
    errors.push('detalle_especifico es obligatorio');
  } else if (data.categoria) {
    for (const field of requiredFields[data.categoria] || []) {
      if (data.detalle_especifico[field] === undefined || data.detalle_especifico[field] === '') errors.push(`detalle_especifico.${field} es obligatorio`);
    }
  }
  return errors;
}

module.exports = { validateTicketInput };
