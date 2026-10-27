import React, { useEffect, useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';
import { assignTicket, listTechnicians } from '../lib/api';

export default function DashboardCoordinador({ user, tickets, onActualizarTicket, onVerDetalle, addToast }) {
  const areaKey = user.areaAsignada || 'computo_redes';
  const areaConfig = CATEGORIAS_CONFIG[areaKey] || CATEGORIAS_CONFIG.computo_redes;

  const [ticketParaAsignar, setTicketParaAsignar] = useState(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('');
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('media');
  const [comentarioAsignacion, setComentarioAsignacion] = useState('');
  const [filtroArea, setFiltroArea] = useState(areaKey);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Técnicos registrados
  const [listaTecnicos, setListaTecnicos] = useState([]);

  useEffect(() => {
    listTechnicians().then(setListaTecnicos).catch((error) => addToast(`No fue posible cargar técnicos: ${error.message}`, 'error'));
  }, []);

  // Tickets pertenecientes al área supervisada (o todas si cambia filtro)
  const ticketsArea = tickets.filter((t) => (filtroArea === 'todas' ? true : t.categoria === filtroArea));

  const sinAsignar = ticketsArea.filter((t) => !t.asignacion.tecnicoId || t.asignacion.tecnicoNombre === 'Sin asignar').length;
  const enProceso = ticketsArea.filter((t) => t.estado === 'en_proceso' || t.estado === 'en_espera').length;
  const resueltas = ticketsArea.filter((t) => t.estado === 'resuelta').length;
  const criticas = ticketsArea.filter((t) => t.prioridad === 'critica').length;

  const ticketsFiltrados = ticketsArea.filter((t) => {
    if (filtroEstado === 'sin_asignar') return !t.asignacion.tecnicoId || t.asignacion.tecnicoNombre === 'Sin asignar';
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    return true;
  });

  const abrirModalAsignacion = (t, e) => {
    e?.stopPropagation();
    setTicketParaAsignar(t);
    setTecnicoSeleccionado(t.asignacion.tecnicoId || listaTecnicos[0]?.id || '');
    setPrioridadSeleccionada(t.prioridad);
    setComentarioAsignacion(`Asignado por Coordinación de ${areaConfig.nombre}`);
  };

  const guardarAsignacion = async (e) => {
    e.preventDefault();
    const tecnicoObj = listaTecnicos.find((u) => u.id === tecnicoSeleccionado);
    if (!tecnicoObj) {
      alert('Selecciona un técnico válido');
      return;
    }

    try {
      const ticketActualizado = await assignTicket(ticketParaAsignar.id, {
        tecnico_id: tecnicoObj.id,
        prioridad: prioridadSeleccionada,
        comentario: comentarioAsignacion
      });
      onActualizarTicket(ticketActualizado);
      addToast(`Ticket ${ticketParaAsignar.codigo} asignado a ${tecnicoObj.nombre}`, 'success');
      setTicketParaAsignar(null);
    } catch (error) {
      addToast(`No fue posible asignar el ticket: ${error.message}`, 'error');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Banner Coordinador */}
      <div className="dash-welcome-card coordinador-theme">
        <div className="dash-welcome-info">
          <div className="badge-user-role">
            <Icon name="shield" size={13} />
            <span>Coordinación de Área · {areaConfig.nombre}</span>
          </div>
          <h2>Panel de Coordinación: {user.nombre}</h2>
          <p>
            Supervisa el flujo de incidencias, distribuye la carga operativa de tu cuadrilla técnica, valida
            la prioridad de emergencias en el campus y garantiza el cumplimiento de acuerdos de nivel de servicio (SLA).
          </p>
        </div>
        <div className="dash-welcome-action">
          <div className="coord-live-badge">
            <span className="live-dot"></span>
            <span>Área Asignada: <b>{areaConfig.nombre}</b></span>
          </div>
        </div>
      </div>

      {/* KPIs del Coordinador */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <Icon name="alert-triangle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Sin Asignar (Nuevos)</span>
            <b className="kpi-number">{sinAsignar}</b>
            <small className="kpi-sub">Requieren técnico inmediato</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-blue">
            <Icon name="wrench" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">En Atención Activa</span>
            <b className="kpi-number">{enProceso}</b>
            <small className="kpi-sub">En manos de los técnicos</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-red">
            <Icon name="alert" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Prioridad Crítica</span>
            <b className="kpi-number">{criticas}</b>
            <small className="kpi-sub">Afectan clases o seguridad</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Resueltas en el Área</span>
            <b className="kpi-number">{resueltas}</b>
            <small className="kpi-sub">Cierre satisfactorio</small>
          </div>
        </div>
      </div>

      {/* Carga de Trabajo de los Técnicos del Equipo */}
      <div className="coord-team-strip">
        <div className="team-strip-title">
          <Icon name="users" size={17} color="#2563eb" />
          <b>Disponibilidad de Técnicos de Soporte:</b>
        </div>
        <div className="team-cards-row">
          {listaTecnicos.map((tec) => {
            const carga = tickets.filter((t) => t.asignacion.tecnicoId === tec.id && t.estado !== 'resuelta').length;
            return (
              <div key={tec.id} className="team-member-chip">
                <span className="member-avatar">{tec.avatar}</span>
                <div className="member-info">
                  <b>{tec.nombre}</b>
                  <small>{tec.especialidad}</small>
                </div>
                <span className={`member-load-badge ${carga > 2 ? 'load-high' : 'load-ok'}`}>
                  {carga} activo(s)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla con Acciones de Asignación */}
      <div className="dash-content-card">
        <div className="dash-card-header">
          <div>
            <h3>Gestión y Asignación de Tickets</h3>
            <p className="dash-card-subtitle">
              Haz clic en "Asignar Técnico" para delegar la atención del reporte o reasignar una nueva prioridad.
            </p>
          </div>

          <div className="dash-filters-row">
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="select-custom"
            >
              <option value="computo_redes">💻 Cómputo y Telecomunicaciones</option>
              <option value="infraestructura">🏗️ Infraestructura y Mantenimiento</option>
              <option value="academico">📚 Sistemas y Servicios Académicos</option>
              <option value="todas">🌐 Todas las Áreas del Campus</option>
            </select>

            <div className="dash-filter-pills">
              <button
                className={`filter-pill ${filtroEstado === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({ticketsArea.length})
              </button>
              <button
                className={`filter-pill ${filtroEstado === 'sin_asignar' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('sin_asignar')}
              >
                Sin Asignar ({sinAsignar})
              </button>
              <button
                className={`filter-pill ${filtroEstado === 'en_proceso' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('en_proceso')}
              >
                En Proceso ({enProceso})
              </button>
              <button
                className={`filter-pill ${filtroEstado === 'resuelta' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('resuelta')}
              >
                Resueltas ({resueltas})
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Incidencia / Ubicación</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Técnico Responsable</th>
                <th>Reportante</th>
                <th style={{ textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {ticketsFiltrados.map((t) => (
                <tr key={t.id} className="table-row-hover" onClick={() => onVerDetalle(t)}>
                  <td><span className="ticket-code-tag">{t.codigo}</span></td>
                  <td>
                    <div className="table-title-cell">
                      <b>{t.titulo}</b>
                      <small>📍 {t.ubicacion.edificio} · {t.ubicacion.espacio}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`prio-badge prio-${t.prioridad}`}>{t.prioridad.toUpperCase()}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${t.estado}`}>{t.estado.replace('_', ' ').toUpperCase()}</span>
                  </td>
                  <td>
                    {t.asignacion.tecnicoNombre && t.asignacion.tecnicoNombre !== 'Sin asignar' ? (
                      <span className="tech-assigned-tag">👤 {t.asignacion.tecnicoNombre}</span>
                    ) : (
                      <span className="tech-unassigned-tag">⚠️ Sin Asignar</span>
                    )}
                  </td>
                  <td>
                    <small>{t.reportante.nombre}</small>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-action-btns">
                      <button
                        className="btn-table-assign"
                        onClick={(e) => abrirModalAsignacion(t, e)}
                        title="Asignar o reasignar técnico"
                      >
                        <Icon name="users" size={14} />
                        <span>Asignar</span>
                      </button>
                      <button
                        className="btn-table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(t);
                        }}
                      >
                        <Icon name="eye" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Asignación y Prioridad */}
      {ticketParaAsignar && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Icon name="users" size={20} color="#2563eb" />
                <div>
                  <h3>Asignación de Técnico Responsable</h3>
                  <small>{ticketParaAsignar.codigo} · {ticketParaAsignar.titulo}</small>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setTicketParaAsignar(null)}>✕</button>
            </div>

            <form onSubmit={guardarAsignacion} className="modal-body-form">
              <div className="input-field-group">
                <label>Seleccionar Técnico de Soporte</label>
                <select
                  value={tecnicoSeleccionado}
                  onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                  className="select-custom"
                  required
                >
                  <option value="">-- Elige un técnico calificado --</option>
                  {listaTecnicos.map((tec) => (
                    <option key={tec.id} value={tec.id}>
                      {tec.nombre} ({tec.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-field-group">
                <label>Nivel de Prioridad Institucional</label>
                <select
                  value={prioridadSeleccionada}
                  onChange={(e) => setPrioridadSeleccionada(e.target.value)}
                  className="select-custom"
                >
                  <option value="baja">🟢 Baja (Atención preventiva o no urgente)</option>
                  <option value="media">🟡 Media (Falla menor sin interrupción crítica)</option>
                  <option value="alta">🟠 Alta (Afecta clase o laboratorio en curso)</option>
                  <option value="critica">🔴 Crítica (Riesgo a personas o paro masivo)</option>
                </select>
              </div>

              <div className="input-field-group">
                <label>Instrucciones de Asignación / Comentario</label>
                <textarea
                  rows={3}
                  value={comentarioAsignacion}
                  onChange={(e) => setComentarioAsignacion(e.target.value)}
                  placeholder="Instrucciones específicas para el técnico que acudirá..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setTicketParaAsignar(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
