import React, { useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG, EDIFICIOS_UTM } from '../mockData';

export default function IncidenciasView({ tickets, onVerDetalle, onNuevaIncidencia }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCat, setFiltroCat] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [filtroEdificio, setFiltroEdificio] = useState('todos');
  const [filtroTag, setFiltroTag] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  // Filtrado compuesto
  const filtrados = tickets.filter((t) => {
    if (filtroCat !== 'todas' && t.categoria !== filtroCat) return false;
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todas' && t.prioridad !== filtroPrioridad) return false;
    if (filtroEdificio !== 'todos' && !t.ubicacion.edificio.includes(filtroEdificio)) return false;
    if (filtroTag && !t.tags.some((tag) => tag.toLowerCase().includes(filtroTag.toLowerCase()))) return false;

    if (busqueda) {
      const q = busqueda.toLowerCase();
      const matchCodigo = t.codigo.toLowerCase().includes(q);
      const matchTitulo = t.titulo.toLowerCase().includes(q);
      const matchDesc = t.descripcion.toLowerCase().includes(q);
      const matchRep = t.reportante.nombre.toLowerCase().includes(q);
      const matchTec = t.asignacion.tecnicoNombre?.toLowerCase().includes(q);
      if (!matchCodigo && !matchTitulo && !matchDesc && !matchRep && !matchTec) return false;
    }

    return true;
  });

  // Cálculo de páginas
  const totalPaginas = Math.ceil(filtrados.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const ticketsPaginados = filtrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCat('todas');
    setFiltroEstado('todos');
    setFiltroPrioridad('todas');
    setFiltroEdificio('todos');
    setFiltroTag('');
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    busqueda || filtroCat !== 'todas' || filtroEstado !== 'todos' || filtroPrioridad !== 'todas' || filtroEdificio !== 'todos' || filtroTag;

  return (
    <div className="incidencias-page-container">
      {/* Top Header */}
      <div className="inc-top-banner">
        <div>
          <h2>Explorador Institucional de Incidencias</h2>
          <p>
            Consulta, busca y filtra todos los tickets registrados en la Universidad Tecnológica Metropolitana.
          </p>
        </div>
        <button className="btn-primary-glow" onClick={onNuevaIncidencia}>
          <Icon name="plus-circle" size={17} />
          <span>Reportar Incidencia</span>
        </button>
      </div>

      {/* Barra de Filtros Múltiples */}
      <div className="filter-bar-card">
        <div className="filter-main-row">
          <div className="search-box-large">
            <Icon name="search" size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Buscar por código (ej. INC-2026-0042), título, reportante o descripción..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
            />
            {busqueda && (
              <button className="clear-search-btn" onClick={() => setBusqueda('')}>✕</button>
            )}
          </div>

          {hayFiltrosActivos && (
            <button className="btn-clear-filters" onClick={limpiarFiltros}>
              <Icon name="refresh" size={14} />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="filter-selects-grid">
          <div className="filter-select-item">
            <label>Área / Categoría</label>
            <select
              value={filtroCat}
              onChange={(e) => {
                setFiltroCat(e.target.value);
                setPaginaActual(1);
              }}
              className="select-custom"
            >
              <option value="todas">Todas las Áreas</option>
              <option value="computo_redes">💻 Cómputo y Telecomunicaciones</option>
              <option value="infraestructura">🏗️ Infraestructura y Mantenimiento</option>
              <option value="academico">📚 Sistemas y Servicios Académicos</option>
            </select>
          </div>

          <div className="filter-select-item">
            <label>Estado del Ticket</label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
              className="select-custom"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierta">🔵 Abierta</option>
              <option value="en_proceso">🟡 En Proceso</option>
              <option value="en_espera">🟣 En Espera de Refacción</option>
              <option value="resuelta">🟢 Resuelta</option>
              <option value="cerrada">⚪ Cerrada</option>
            </select>
          </div>

          <div className="filter-select-item">
            <label>Prioridad</label>
            <select
              value={filtroPrioridad}
              onChange={(e) => {
                setFiltroPrioridad(e.target.value);
                setPaginaActual(1);
              }}
              className="select-custom"
            >
              <option value="todas">Todas las Prioridades</option>
              <option value="baja">🟢 Baja</option>
              <option value="media">🟡 Media</option>
              <option value="alta">🟠 Alta</option>
              <option value="critica">🔴 Crítica</option>
            </select>
          </div>

          <div className="filter-select-item">
            <label>Edificio UTM</label>
            <select
              value={filtroEdificio}
              onChange={(e) => {
                setFiltroEdificio(e.target.value);
                setPaginaActual(1);
              }}
              className="select-custom"
            >
              <option value="todos">Todos los Edificios</option>
              <option value="Edificio A">Edificio A</option>
              <option value="Edificio B">Edificio B</option>
              <option value="Edificio C">Edificio C</option>
              <option value="Biblioteca">Biblioteca Central</option>
              <option value="Servicios Escolares">Servicios Escolares</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resultados y Tabla */}
      <div className="dash-content-card">
        <div className="table-status-bar">
          <span>Mostrando <b>{filtrados.length}</b> incidencia(s) encontrada(s)</span>
          <span className="page-indicator">Página {paginaActual} de {totalPaginas}</span>
        </div>

        {filtrados.length === 0 ? (
          <div className="empty-state-box">
            <Icon name="search" size={48} color="#94a3b8" />
            <h4>No se encontraron coincidencias</h4>
            <p>Intenta cambiar los términos de búsqueda o limpiar los filtros seleccionados.</p>
            <button className="btn-secondary" onClick={limpiarFiltros}>
              Restablecer Criterios
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título / Resumen</th>
                  <th>Área NoSQL</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Ubicación</th>
                  <th>Técnico</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Expediente</th>
                </tr>
              </thead>
              <tbody>
                {ticketsPaginados.map((t) => {
                  const areaConfig = CATEGORIAS_CONFIG[t.categoria];
                  return (
                    <tr key={t.id} className="table-row-hover" onClick={() => onVerDetalle(t)}>
                      <td>
                        <span className="ticket-code-tag">{t.codigo}</span>
                      </td>
                      <td>
                        <div className="table-title-cell">
                          <b>{t.titulo}</b>
                          <small className="table-desc-preview">
                            {t.descripcion.length > 75 ? `${t.descripcion.substring(0, 75)}...` : t.descripcion}
                          </small>
                          {t.tags && t.tags.length > 0 && (
                            <div className="tags-cell-row">
                              {t.tags.slice(0, 3).map((tg, i) => (
                                <span key={i} className="mini-tag">#{tg}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="area-badge"
                          style={{ background: areaConfig?.colorSuave, color: areaConfig?.color }}
                        >
                          {areaConfig?.emoji} {areaConfig?.nombre.split(' ')[0]}
                        </span>
                      </td>
                      <td>
                        <span className={`prio-badge prio-${t.prioridad}`}>
                          {t.prioridad.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${t.estado}`}>
                          {t.estado.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="table-location-cell">
                          <b>{t.ubicacion.edificio.split(' ')[0]} {t.ubicacion.edificio.split(' ')[1] || ''}</b>
                          <small>{t.ubicacion.espacio}</small>
                        </div>
                      </td>
                      <td>
                        <small className="tech-assigned-name">
                          {t.asignacion.tecnicoNombre && t.asignacion.tecnicoNombre !== 'Sin asignar'
                            ? `👤 ${t.asignacion.tecnicoNombre.split(' ')[1] || t.asignacion.tecnicoNombre}`
                            : '⏳ Sin asignar'}
                        </small>
                      </td>
                      <td>
                        <small className="date-cell">
                          {new Date(t.fecha_creacion).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </small>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-table-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerDetalle(t);
                          }}
                        >
                          <Icon name="eye" size={15} />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {totalPaginas > 1 && (
          <div className="table-pagination-row">
            <button
              className="btn-pag"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(paginaActual - 1)}
            >
              <Icon name="arrow-left" size={14} />
              <span>Anterior</span>
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  className={`pag-num-btn ${paginaActual === num ? 'active' : ''}`}
                  onClick={() => setPaginaActual(num)}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              className="btn-pag"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(paginaActual + 1)}
            >
              <span>Siguiente</span>
              <Icon name="arrow-right" size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
