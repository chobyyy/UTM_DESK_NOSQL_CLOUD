const API_URL = import.meta.env.VITE_API_URL || '/api';

function token() {
  return localStorage.getItem('utm_desk_token') || sessionStorage.getItem('utm_desk_token');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No fue posible completar la solicitud.');
  return body;
}

function toUiTicket(ticket) {
  const reportante = ticket.reportante?.usuario_id;
  const tecnico = ticket.asignacion?.tecnico_id;
  return {
    ...ticket,
    id: ticket._id,
    reportante: {
      ...ticket.reportante,
      id: reportante?._id || ticket.reportante?.usuario_id,
      nombre: reportante?.nombre || ticket.reportante?.nombre,
      correo: reportante?.correo || ''
    },
    asignacion: {
      ...ticket.asignacion,
      tecnicoId: tecnico?._id || ticket.asignacion?.tecnico_id || null,
      tecnicoNombre: tecnico?.nombre || 'Sin asignar'
    },
    historial: (ticket.historial_seguimiento || []).map((item, index) => ({
      id: `${ticket._id}-${index}`,
      fecha: item.fecha,
      accion: item.accion,
      comentario: item.comentario,
      estadoNuevo: item.estado_nuevo,
      estadoAnterior: item.estado_anterior,
      horas: item.horas_agregadas || 0,
      actor: item.actor_id?.nombre || 'Usuario institucional'
    })),
    evidencias: ticket.evidencias_adjuntas || []
  };
}

export async function login(correo, contrasena) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ correo: correo.trim().toLowerCase(), contrasena }) });
}

export async function listTickets() {
  return (await request('/tickets')).map(toUiTicket);
}

export async function createTicket(data) {
  return toUiTicket(await request('/tickets', { method: 'POST', body: JSON.stringify(data) }));
}

export async function updateTicketStatus(id, data) {
  return toUiTicket(await request(`/tickets/${id}/estado`, { method: 'PATCH', body: JSON.stringify(data) }));
}

export async function assignTicket(id, data) {
  return toUiTicket(await request(`/tickets/${id}/asignacion`, { method: 'PATCH', body: JSON.stringify(data) }));
}

export async function listTechnicians() {
  return (await request('/users/tecnicos')).map((user) => ({ ...user, id: user._id }));
}

export async function listUsers() {
  return (await request('/users')).map((user) => ({ ...user, id: user._id }));
}
