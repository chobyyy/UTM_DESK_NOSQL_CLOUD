const mongoose = require('mongoose');
const { Ticket } = require('../models/Ticket');

async function updateTicketWithEvent(ticket, { actorId, accion, comentario, fields, estadoNuevo = ticket.estado, horasAgregadas = 0, session }) {
  const antiguo = ticket.get('version') !== undefined;
  const campoVersion = antiguo ? 'version' : '__v';
  const version = ticket.get(campoVersion);
  const fecha = new Date();
  const evento = {
    fecha, actor_id: actorId, accion,
    estado_anterior: ticket.estado, estado_nuevo: estadoNuevo,
    comentario, horas_agregadas: horasAgregadas,
    ...(antiguo ? { _id: new mongoose.Types.ObjectId(), visibilidad: 'publico' } : {})
  };
  // Conserva los campos y adjuntos antiguos. MongoDB sigue validando el cambio
  // completo; la versión impide sobrescribir una edición concurrente.
  return Ticket.collection.updateOne({
    _id: ticket._id,
    estado: ticket.estado,
    [campoVersion]: version === undefined ? { $exists: false } : version
  }, {
    $set: { ...fields, fecha_actualizacion: fecha },
    $push: { historial_seguimiento: evento },
    $inc: { [campoVersion]: 1 }
  }, session ? { session } : {});
}

module.exports = { updateTicketWithEvent };
