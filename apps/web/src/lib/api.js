const API_URL = import.meta.env?.VITE_API_URL || '/api';
export const DEMO_PASSWORD = 'seguraUTM2026';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function token() {
  return localStorage.getItem('utm_desk_token') || sessionStorage.getItem('utm_desk_token');
}

async function request(path, options = {}) {
  const authToken = token();
  if (!path.startsWith('/auth/') && authToken?.startsWith('mock-token-')) {
    throw new Error('Tu sesión es de demostración. Vuelve a iniciar sesión con la API conectada para guardar incidencias.');
  }
  let response;
  try {
    response = await fetch(API_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}), ...options.headers }
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Verifica que el servidor esté encendido. Tu reporte no se ha enviado.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (body.error) {
      const details = Array.isArray(body.details) ? body.details : typeof body.details === 'string' ? [body.details] : [];
      throw new Error([body.error, ...details].join('. '));
    }
    if (response.status === 413) throw new Error('Las fotos superan el límite permitido por el servidor.');
    if (response.status >= 500) throw new Error('La API no está disponible. Inicia el servidor y verifica su conexión con MongoDB. Tu reporte no se ha enviado.');
    throw new Error('No fue posible completar la solicitud (HTTP ' + response.status + ').');
  }
  return body;
}

export async function login(correo, contrasena) {
  const cleanEmail = correo?.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail || '') || !contrasena) throw new Error('Ingresa tu correo y contraseña.');
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ correo: cleanEmail, contrasena }) });
}

export async function register({ nombre, correo, contrasena, matricula, carrera }) {
  const cleanEmail = correo?.trim().toLowerCase();
  if (!nombre?.trim() || !EMAIL_REGEX.test(cleanEmail || '') || !contrasena || contrasena.length < 6) throw new Error('Ingresa tu nombre, un correo válido y una contraseña de al menos 6 caracteres.');
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ nombre: nombre.trim(), correo: cleanEmail, contrasena, matricula, carrera }) });
}

function toUiTicket(ticket) {
  const reportante = ticket.reportante?.usuario_id;
  const tecnico = ticket.asignacion?.tecnico_id;
  return {
    ...ticket,
    estado: ticket.estado?.replaceAll(' ', '_'),
    id: ticket._id,
    detalle_especifico: ticket.detalle_especifico || {},
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
      estadoNuevo: item.estado_nuevo?.replaceAll(' ', '_'),
      estadoAnterior: item.estado_anterior?.replaceAll(' ', '_') ?? null,
      horas: item.horas_agregadas || 0,
      actor: item.actor_id?.nombre || 'Usuario institucional'
    })),
    evidencias: [...(ticket.evidencias_adjuntas || []), ...(ticket.evidencias_tecnicas || [])]
  };
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

export async function getEvidenceFile(ticketId, evidenceId, { signal } = {}) {
  const authToken = token();
  let response;
  try {
    response = await fetch(API_URL + `/tickets/${ticketId}/evidencias/${evidenceId}`, {
      headers: authToken ? { Authorization: 'Bearer ' + authToken } : {}, signal
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar para descargar la evidencia.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'No fue posible descargar la evidencia.');
  }
  return response.blob();
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

export async function updateTicketTags(id, tags) {
  return toUiTicket(await request(`/tickets/${id}/tags`, { method: "PATCH", body: JSON.stringify({ tags }) }));
}

export async function updateTicketPriority(id, prioridad) {
  return toUiTicket(await request(`/tickets/${id}/prioridad`, { method: 'PATCH', body: JSON.stringify({ prioridad }) }));
}
