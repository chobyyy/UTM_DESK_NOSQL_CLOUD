import React, { useEffect, useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';
import { updateTicketStatus, updateTicketTags } from '../lib/api';

export default function DetalleTicketModal({ ticket, user, onClose, onActualizarTicket, addToast }) {
  const [tagsTexto, setTagsTexto] = useState((ticket?.tags || []).join(', '));
  const [guardandoTags, setGuardandoTags] = useState(false);
  const [errorTags, setErrorTags] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [horasExtra, setHorasExtra] = useState('0');
  const [cambiarEstado, setCambiarEstado] = useState(ticket?.estado);

  useEffect(() => {
    setTagsTexto((ticket?.tags || []).join(', '));
    setErrorTags('');
  }, [ticket?.id, ticket?.tags]);

  if (!ticket) return null;

  const areaConfig = CATEGORIAS_CONFIG[ticket.categoria];
  const puedeEditarTags = user.rol === 'administrador' || (
    user.rol === 'coordinador' && user.areas_autorizadas?.includes(ticket.asignacion?.area || ticket.categoria)
  );

  const handleGuardarTags = async event => {
    event.preventDefault();
    if (guardandoTags) return;
    setGuardandoTags(true);
    setErrorTags('');
    try {
      const actualizado = await updateTicketTags(ticket.id, tagsTexto.split(',').map(tag => tag.trim()).filter(Boolean));
      onActualizarTicket(actualizado);
      setTagsTexto((actualizado.tags || []).join(', '));
      addToast('Etiquetas guardadas correctamente', 'success');
    } catch (error) {
      setErrorTags(error.message);
      addToast(`No se pudieron guardar las etiquetas: ${error.message}`, 'error');
    } finally { setGuardandoTags(false); }
  };

  const handleAgregarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) {
      alert('Por favor escribe un comentario o nota de seguimiento.');
      return;
    }

    try {
      const ticketActualizado = await updateTicketStatus(ticket.id, {
        estado: cambiarEstado,
        comentario: nuevoComentario.trim(),
        horas_agregadas: parseFloat(horasExtra) || 0
      });
      onActualizarTicket(ticketActualizado);
      addToast('Nota registrada y expediente actualizado', 'success');
      setNuevoComentario('');
      setHorasExtra('0');
    } catch (error) {
      addToast(`No fue posible actualizar el expediente: ${error.message}`, 'error');
    }
  };

  return (
    <div className="modal-backdrop-expediente" onClick={onClose}>
      <div className="modal-expediente-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="expediente-topbar">
          <div className="expediente-breadcrumbs">
            <span className="font-mono-tag">{ticket.codigo}</span>
            <span className="breadcrumb-slash">/</span>
            <span className="expediente-area-tag" style={{ background: areaConfig?.colorSuave, color: areaConfig?.color }}>
              {areaConfig?.emoji} {areaConfig?.nombre}
            </span>
          </div>

          <div className="expediente-top-actions">
            <span className={`prio-badge prio-${ticket.prioridad}`}>
              Prioridad {ticket.prioridad.toUpperCase()}
            </span>
            <span className={`status-badge status-${ticket.estado}`}>
              {ticket.estado.replace('_', ' ').toUpperCase()}
            </span>
            <button className="btn-close-circle" onClick={onClose} title="Cerrar expediente">✕</button>
          </div>
        </div>

        {/* Modal Main Content Layout */}
        <div className="expediente-body-grid">
          {/* Columna Izquierda: Información Principal + Historial */}
          <div className="expediente-left-col">
            {/* Título y Descripción */}
            <div className="exp-section-card">
              <h2 className="exp-title">{ticket.titulo}</h2>
              <div className="exp-meta-row">
                <span><b>Reportado por:</b> {ticket.reportante.nombre} ({ticket.reportante.correo})</span>
                <span>•</span>
                <span><b>Fecha de registro:</b> {new Date(ticket.fecha_creacion).toLocaleString('es-MX')}</span>
              </div>
              <p className="exp-desc-box">{ticket.descripcion}</p>

              {puedeEditarTags && (
                <form className="exp-tags-form" onSubmit={handleGuardarTags} aria-busy={guardandoTags}>
                  <label htmlFor="ticket-tags">Etiquetas de la incidencia</label>
                  <p id="ticket-tags-help" className="exp-tags-help">Separa con comas hasta 20 etiquetas de 2 a 40 caracteres. Los espacios se guardan como guiones.</p>
                  <div className="exp-tags-controls">
                    <input id="ticket-tags" type="text" value={tagsTexto} onChange={event => { setTagsTexto(event.target.value); setErrorTags(''); }} disabled={guardandoTags} placeholder="wifi, laboratorio, conexion" aria-describedby={errorTags ? 'ticket-tags-help ticket-tags-error' : 'ticket-tags-help'} aria-invalid={Boolean(errorTags)} />
                    <button type="submit" className="btn-primary" disabled={guardandoTags}>{guardandoTags ? 'Guardando...' : 'Guardar etiquetas'}</button>
                  </div>
                  {errorTags && <p id="ticket-tags-error" className="exp-tags-error" role="alert">{errorTags}</p>}
                </form>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="exp-tags-row">
                  {ticket.tags.map((tg, i) => (
                    <span key={i} className="mini-tag">#{tg}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline Vertical de Historial de Seguimiento */}
            <div className="exp-section-card">
              <div className="timeline-section-header">
                <Icon name="clock" size={18} color="#2563eb" />
                <h4>Línea de Tiempo y Trazabilidad de Auditoría ({ticket.historial?.length || 0} eventos)</h4>
              </div>

              <div className="timeline-flow">
                {ticket.historial && ticket.historial.map((h, idx) => (
                  <div key={h.id || idx} className="timeline-node">
                    <div className="timeline-node-line"></div>
                    <div className="timeline-node-dot">
                      <Icon name="check-circle" size={14} color="#ffffff" />
                    </div>
                    <div className="timeline-node-card">
                      <div className="timeline-node-head">
                        <b>{h.accion}</b>
                        <span className="timeline-date">
                          {new Date(h.fecha).toLocaleString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="timeline-actor">👤 {h.actor}</div>
                      <p className="timeline-comment">{h.comentario}</p>
                      <div className="timeline-node-footer">
                        <span className={`status-badge status-${h.estadoNuevo}`}>
                          Estado: {h.estadoNuevo.toUpperCase()}
                        </span>
                        {h.horas > 0 && (
                          <span className="timeline-hours-pill">⏱ +{h.horas} hrs registradas</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario Interactivo para Agregar Nota o Avance */}
            {['tecnico', 'coordinador', 'administrador'].includes(user.rol) && <div className="exp-section-card add-note-card">
              <h4>Agregar Nota de Seguimiento al Expediente</h4>
              <p className="sub-hint">Esta acción se registrará con tu firma institucional: <b>{user.nombre}</b>.</p>

              <form onSubmit={handleAgregarComentario} className="add-note-form">
                <div className="form-grid-2">
                  <div className="input-field-group">
                    <label>Actualizar Estado del Caso</label>
                    <select
                      value={cambiarEstado}
                      onChange={(e) => setCambiarEstado(e.target.value)}
                      className="select-custom"
                    >
                      <option value="abierta">🔵 Abierta</option>
                      <option value="en_proceso">🟡 En Proceso</option>
                      <option value="en_espera">🟣 En Espera de Materiales</option>
                      <option value="resuelta">🟢 Resuelta (Concluido)</option>
                    </select>
                  </div>

                  {user.rol === 'tecnico' && (
                    <div className="input-field-group">
                      <label>Horas extras invertidas</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="12"
                        value={horasExtra}
                        onChange={(e) => setHorasExtra(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="input-field-group">
                  <label>Comentario / Diagnóstico / Avance *</label>
                  <textarea
                    rows={3}
                    placeholder="Escribe aquí los avances técnicos, respuestas o indicaciones..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    required
                  />
                </div>

                <div className="note-submit-row">
                  <button type="submit" className="btn-primary">
                    <Icon name="plus" size={16} />
                    <span>Guardar en el Historial</span>
                  </button>
                </div>
              </form>
            </div>}
          </div>

          {/* Columna Derecha: Tarjeta de Metadatos y Evidencias */}
          <div className="expediente-right-col">
            <div className="exp-sidebar-card">
              <h4>Ficha de Ubicación y Asignación</h4>

              <div className="exp-sidebar-item">
                <span className="sidebar-label">Edificio UTM</span>
                <span className="sidebar-val">🏛️ {ticket.ubicacion.edificio}</span>
              </div>

              <div className="exp-sidebar-item">
                <span className="sidebar-label">Espacio / Aula</span>
                <span className="sidebar-val">📍 {ticket.ubicacion.espacio}</span>
              </div>

              <div className="exp-sidebar-item">
                <span className="sidebar-label">Técnico Asignado</span>
                <span className="sidebar-val">
                  {ticket.asignacion.tecnicoNombre && ticket.asignacion.tecnicoNombre !== 'Sin asignar'
                    ? `👤 ${ticket.asignacion.tecnicoNombre}`
                    : '⏳ Sin técnico asignado'}
                </span>
              </div>

              <div className="exp-sidebar-item">
                <span className="sidebar-label">Tiempo Total Registrado</span>
                <span className="sidebar-val font-mono-tag">⏱ {ticket.horas_invertidas || 0} horas</span>
              </div>

              {ticket.fecha_resolucion && (
                <div className="exp-sidebar-item">
                  <span className="sidebar-label">Fecha de Resolución</span>
                  <span className="sidebar-val resolved-date">
                    ✓ {new Date(ticket.fecha_resolucion).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
            </div>

            {/* Evidencias Adjuntas */}
            <div className="exp-sidebar-card">
              <h4>📎 Evidencias fotográficas ({ticket.evidencias?.length || 0})</h4>
              {(!ticket.evidencias || ticket.evidencias.length === 0) ? (
                <div className="no-evidencias-box">
                  <Icon name="folder" size={28} color="#94a3b8" />
                  <p>No se adjuntaron fotos al crear este ticket.</p>
                </div>
              ) : (
                <div className="evidencias-list">
                  {ticket.evidencias.map((ev, i) => (
                    <div key={ev.id || i} className="evidencia-card-item">
                      <div className="evidencia-icon">
                        <img src={ev.url_storage} alt={ev.nombre_archivo || ev.nombre} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                      </div>
                      <div className="evidencia-meta">
                        <b>{ev.nombre_archivo || ev.nombre}</b>
                        <small>{ev.peso_kb != null ? Math.round(ev.peso_kb) + ' KB' : ev.peso}</small>
                      </div>
                      {ev.url_storage?.startsWith('data:image/') && (
                        <a className="btn-download-ev" href={ev.url_storage} download={ev.nombre_archivo} title="Descargar foto">↓</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
