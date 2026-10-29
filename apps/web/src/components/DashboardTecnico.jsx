import React, { useRef, useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';
import { updateTicketStatus } from '../lib/api';
import { readEvidenceFiles } from '../lib/evidenceFiles';

export default function DashboardTecnico({ user, tickets, onActualizarTicket, onVerDetalle, addToast }) {
  const [ticketParaEditar, setTicketParaEditar] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('en_proceso');
  const [horasNuevas, setHorasNuevas] = useState('1.5');
  const [notaTecnica, setNotaTecnica] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [evidenciasNuevas, setEvidenciasNuevas] = useState([]);
  const [leyendoEvidencias, setLeyendoEvidencias] = useState(false);
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const selectorEvidencias = useRef(null);
  const lecturaEnCurso = useRef(false);

  const seleccionarEvidencias = async files => {
    if (guardandoAvance || lecturaEnCurso.current) return;
    lecturaEnCurso.current = true;
    setLeyendoEvidencias(true);
    try {
      const nuevas = await readEvidenceFiles(files, evidenciasNuevas.length);
      setEvidenciasNuevas(previous => [...previous, ...nuevas]);
    } catch (error) { addToast(error.message, 'error'); }
    finally { lecturaEnCurso.current = false; setLeyendoEvidencias(false); }
  };

  // Tickets asignados a este técnico
  const asignados = tickets.filter(
    (t) => t.asignacion.tecnicoId === user.id || t.asignacion.tecnicoNombre?.includes(user.nombre)
  );

  const enCurso = asignados.filter((t) => t.estado === 'en_proceso').length;
  const enEspera = asignados.filter((t) => t.estado === 'en_espera').length;
  const resueltos = asignados.filter((t) => t.estado === 'resuelta').length;
  const totalHoras = asignados.reduce((acc, curr) => acc + (Number(curr.horas_invertidas) || 0), 0);

  const ticketsFiltrados = asignados.filter((t) => {
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    return true;
  });

  const abrirModalAvance = (t, e) => {
    e?.stopPropagation();
    setTicketParaEditar(t);
    setNuevoEstado(t.estado === 'abierta' ? 'en_proceso' : t.estado);
    setHorasNuevas('1.0');
    setNotaTecnica('');
    setEvidenciasNuevas([]);
  };

  const guardarAvance = async (e) => {
    e.preventDefault();
    if (guardandoAvance || leyendoEvidencias) return;
    if (!notaTecnica.trim()) {
      alert('Por favor agrega una nota técnica sobre las acciones realizadas.');
      return;
    }

    try {
      setGuardandoAvance(true);
      const ticketActualizado = await updateTicketStatus(ticketParaEditar.id, {
        estado: nuevoEstado,
        comentario: notaTecnica,
        horas_agregadas: parseFloat(horasNuevas) || 0,
        evidencias_adjuntas: evidenciasNuevas
      });
      onActualizarTicket(ticketActualizado);
      addToast(`Bitácora de ${ticketParaEditar.codigo} guardada${evidenciasNuevas.length ? ' con ' + evidenciasNuevas.length + ' evidencia(s)' : ''}`, 'success');
      setTicketParaEditar(null);
    } catch (error) {
      addToast(`No fue posible actualizar el ticket: ${error.message}`, 'error');
    } finally { setGuardandoAvance(false); }
  };

  return (
    <div className="dashboard-container">
      {/* Banner de Bienvenida Técnico */}
      <div className="dash-welcome-card tecnico-theme">
        <div className="dash-welcome-info">
          <div className="badge-user-role">
            <Icon name="wrench" size={13} />
            <span>Panel Operativo · Cuadrilla de Soporte Técnico</span>
          </div>
          <h2>Área de Trabajo: {user.nombre} 🛠️</h2>
          <p>
            Revisa tu cola de asignaciones, registra bitácoras de campo, actualiza estados y documenta las horas
            invertidas en el mantenimiento del campus UTM.
          </p>
        </div>
        <div className="dash-welcome-action">
          <div className="tech-stat-pill">
            <Icon name="clock" size={16} />
            <span><b>{totalHoras.toFixed(1)} hrs</b> invertidas esta semana</span>
          </div>
        </div>
      </div>

      {/* KPIs del Técnico */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-icon kpi-blue">
            <Icon name="ticket" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Asignados a Mí</span>
            <b className="kpi-number">{asignados.length}</b>
            <small className="kpi-sub">Total en cola de trabajo</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <Icon name="wrench" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">En Diagnóstico / Proceso</span>
            <b className="kpi-number">{enCurso}</b>
            <small className="kpi-sub">Atención activa en sitio</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <Icon name="clock" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">En Espera de Refacciones</span>
            <b className="kpi-number">{enEspera}</b>
            <small className="kpi-sub">Pausadas temporalmente</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Tickets Resueltos</span>
            <b className="kpi-number">{resueltos}</b>
            <small className="kpi-sub">Solucionados con éxito</small>
          </div>
        </div>
      </div>

      {/* Listado de Tareas Técnicas */}
      <div className="dash-content-card">
        <div className="dash-card-header">
          <div>
            <h3>Cola de Incidencias Asignadas</h3>
            <p className="dash-card-subtitle">
              Selecciona una incidencia para registrar avances de campo o cambiar su estado a Resuelta.
            </p>
          </div>

          <div className="dash-filter-pills">
            <button
              className={`filter-pill ${filtroEstado === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('todos')}
            >
              Todos ({asignados.length})
            </button>
            <button
              className={`filter-pill ${filtroEstado === 'en_proceso' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('en_proceso')}
            >
              En Proceso ({enCurso})
            </button>
            <button
              className={`filter-pill ${filtroEstado === 'en_espera' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('en_espera')}
            >
              En Espera ({enEspera})
            </button>
            <button
              className={`filter-pill ${filtroEstado === 'resuelta' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('resuelta')}
            >
              Resueltas ({resueltos})
            </button>
          </div>
        </div>

        {ticketsFiltrados.length === 0 ? (
          <div className="empty-state-box">
            <Icon name="check-circle" size={48} color="#10b981" />
            <h4>¡Sin pendientes en este filtro!</h4>
            <p>Buen trabajo. No tienes tickets pendientes en la condición seleccionada.</p>
          </div>
        ) : (
          <div className="tech-ticket-grid">
            {ticketsFiltrados.map((t) => {
              const area = CATEGORIAS_CONFIG[t.categoria];
              return (
                <div key={t.id} className="tech-task-card" onClick={() => onVerDetalle(t)}>
                  <div className="tech-task-top">
                    <span className="ticket-code-tag">{t.codigo}</span>
                    <span className={`prio-badge prio-${t.prioridad}`}>{t.prioridad.toUpperCase()}</span>
                    <span className={`status-badge status-${t.estado}`}>{t.estado.replace('_', ' ').toUpperCase()}</span>
                  </div>

                  <h4 className="tech-task-title">{t.titulo}</h4>
                  <p className="tech-task-desc">{t.descripcion}</p>

                  <div className="tech-task-location">
                    <Icon name="building" size={15} color="#64748b" />
                    <span><b>{t.ubicacion.edificio}</b> · {t.ubicacion.espacio}</span>
                  </div>

                  {/* Detalle NoSQL rápido */}
                  <div className="tech-nosql-preview">
                    {t.categoria === 'computo_redes' && (
                      <small><b>Equipo:</b> {t.detalle_especifico.equipo || 'N/A'} | <b>IP:</b> {t.detalle_especifico.direccion_ip || 'N/A'}</small>
                    )}
                    {t.categoria === 'infraestructura' && (
                      <small><b>Daño:</b> {t.detalle_especifico.tipo_dano || 'N/A'} | <b>Riesgo:</b> {t.detalle_especifico.nivel_riesgo || 'N/A'}</small>
                    )}
                    {t.categoria === 'academico' && (
                      <small><b>Plataforma:</b> {t.detalle_especifico.plataforma || 'N/A'} | <b>Periodo:</b> {t.detalle_especifico.periodo_escolar || 'N/A'}</small>
                    )}
                  </div>

                  <div className="tech-task-footer">
                    <div className="tech-task-hours">
                      <Icon name="clock" size={14} color="#64748b" />
                      <span>{t.horas_invertidas || 0} hrs dedicadas</span>
                    </div>

                    <div className="tech-card-actions">
                      <button
                        className="btn-sm-advance"
                        onClick={(e) => abrirModalAvance(t, e)}
                      >
                        <Icon name="wrench" size={14} />
                        <span>Actualizar Avance</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Interactivo de Actualización de Avance */}
      {ticketParaEditar && (
        <div className="modal-backdrop">
          <div className="modal-box modal-lg tech-log-modal">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Icon name="wrench" size={20} color="#2563eb" />
                <div>
                  <h3>Bitácora Técnica: {ticketParaEditar.codigo}</h3>
                  <small>{ticketParaEditar.titulo}</small>
                </div>
              </div>
              <button className="modal-close-btn" disabled={guardandoAvance || leyendoEvidencias} onClick={() => setTicketParaEditar(null)}>✕</button>
            </div>

            <form onSubmit={guardarAvance} className="modal-body-form">
              <div className="form-grid-2">
                <div className="input-field-group">
                  <label>Actualizar Estado del Ticket</label>
                  <select
                    value={nuevoEstado}
                    disabled={guardandoAvance}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="select-custom"
                  >
                    <option value="en_proceso">🟡 En Proceso (Trabajando en sitio)</option>
                    <option value="en_espera">🟣 En Espera (Materiales / Refacciones)</option>
                    <option value="resuelta">🟢 Resuelta (Problema solucionado)</option>
                  </select>
                </div>

                <div className="input-field-group">
                  <label>Horas adicionales dedicadas a esta labor</label>
                  <div className="input-with-icon">
                    <Icon name="clock" size={16} color="#64748b" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={horasNuevas}
                      disabled={guardandoAvance}
                      onChange={(e) => setHorasNuevas(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="input-field-group">
                <label>Notas de Bitácora / Acciones Realizadas *</label>
                <textarea
                  rows={4}
                  placeholder="Detalla qué revisiones hiciste, mediciones, cambio de cables, parches o piezas reemplazadas..."
                  value={notaTecnica}
                  disabled={guardandoAvance}
                  maxLength={2000}
                  onChange={(e) => setNotaTecnica(e.target.value)}
                  required
                />
              </div>

              <div className="evidence-upload" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); seleccionarEvidencias(event.dataTransfer.files); }}>
                <Icon name="folder" size={22} color="#2563eb" />
                <div>
                  <b>Adjuntar evidencias de la reparación</b>
                  <p>Selecciona o arrastra hasta 3 archivos por avance: JPEG, PNG, WebP, PDF, TXT o LOG. Máximo 2 MB por archivo.</p>
                </div>
                <input ref={selectorEvidencias} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.txt,.log" onChange={event => { seleccionarEvidencias(event.target.files); event.target.value = ''; }} />
                <button type="button" className="btn-sm-outline" disabled={guardandoAvance || leyendoEvidencias || evidenciasNuevas.length >= 3} onClick={() => selectorEvidencias.current.click()}>
                  {leyendoEvidencias ? 'Leyendo...' : 'Examinar...'}
                </button>
              </div>
              {evidenciasNuevas.length > 0 && (
                <div className="tech-evidence-list" aria-label="Evidencias pendientes de guardar">
                  {evidenciasNuevas.map((file, index) => (
                    <div className="tech-evidence-item" key={index}>
                      {file.tipo_mime.startsWith('image/') ? <img src={file.url_storage} alt={file.nombre_archivo} /> : <Icon name="file-text" size={28} color="#2563eb" />}
                      <div><b>{file.nombre_archivo}</b><small>{Math.ceil(file.peso_kb)} KB · Se guardará con la bitácora</small></div>
                      <button type="button" className="btn-sm-outline" disabled={guardandoAvance || leyendoEvidencias} aria-label={'Quitar ' + file.nombre_archivo} onClick={() => setEvidenciasNuevas(previous => previous.filter((_, position) => position !== index))}>Quitar</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" disabled={guardandoAvance || leyendoEvidencias} onClick={() => setTicketParaEditar(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardandoAvance || leyendoEvidencias}>
                  {guardandoAvance ? 'Guardando bitácora...' : 'Guardar Bitácora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
