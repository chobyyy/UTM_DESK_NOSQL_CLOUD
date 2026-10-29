const { CATEGORIAS } = require('../models/Ticket');

function validateTicketInput(data) {
  const errors = [];
  if (!data.titulo?.trim()) errors.push('titulo es obligatorio');
  if (!data.descripcion?.trim()) errors.push('descripcion es obligatoria');
  if (!CATEGORIAS.includes(data.categoria)) errors.push('categoria no válida');
  if (!data.ubicacion?.edificio?.trim() || !data.ubicacion?.espacio?.trim()) errors.push('ubicacion.edificio y ubicacion.espacio son obligatorios');
  if (data.detalle_especifico !== undefined && (!data.detalle_especifico || typeof data.detalle_especifico !== 'object' || Array.isArray(data.detalle_especifico))) {
    errors.push('detalle_especifico debe ser un objeto');
  }
  return errors;
}

module.exports = { validateTicketInput };
