import React, { useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';

export default function DashboardReportante({ user, tickets, onCrearIncidencia, onVerDetalle }) {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar solo los tickets creados por este reportante
  const misTickets = tickets.filter((t) => t.reportante.correo.toLowerCase() === user.correo.toLowerCase());

  const abiertas = misTickets.filter((t) => t.estado === 'abierta').length;
  const enProceso = misTickets.filter((t) => t.estado === 'en_proceso' || t.estado === 'en_espera').length;
  const resueltas = misTickets.filter((t) => t.estado === 'resuelta' || t.estado === 'cerrada').length;

  const ticketsFiltrados = misTickets.filter((t) => {
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        t.codigo.toLowerCase().includes(q) ||
        t.titulo.toLowerCase().includes(q) ||
        t.ubicacion.edificio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dash-welcome-card reportante-theme">
        <div className="dash-welcome-info">
          <div className="badge-user-role">
            <Icon name="user" size={13} />
            <span>Perfil Estudiante / Docente (Reportante)</span>
          </div>
          <h2>Hola, {user.nombre} 👋</h2>
          <p>
            Bienvenido a tu panel personal de soporte en la UTM. Aquí puedes dar seguimiento a tus reportes,
            revisar diagnósticos técnicos y solicitar asistencia para tus aulas y laboratorios.
          </p>
        </div>
        <div className="dash-welcome-action">
          <button className="btn-primary-glow" onClick={onCrearIncidencia}>
            <Icon name="plus-circle" size={18} />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Propias */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-icon kpi-blue">
            <Icon name="ticket" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Mis Reportes Totales</span>
            <b className="kpi-number">{misTickets.length}</b>
            <small className="kpi-sub">En el campus UTM</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-cyan">
            <Icon name="clock" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Abiertas / En Espera</span>
            <b className="kpi-number">{abiertas}</b>
            <small className="kpi-sub">Pendientes de atención</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <Icon name="wrench" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">En Proceso Técnico</span>
            <b className="kpi-number">{enProceso}</b>
            <small className="kpi-sub">Con técnico asignado</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Casos Resueltos</span>
            <b className="kpi-number">{resueltas}</b>
            <small className="kpi-sub">Solución verificada</small>
          </div>
        </div>
      </div>

      {/* Sección Principal con Filtros y Listado */}
      <div className="dash-content-card">
        <div className="dash-card-header">
          <div>
            <h3>Mis Incidencias Registradas</h3>
            <p className="dash-card-subtitle">
              Haz clic en cualquier ticket para consultar el expediente completo, fotos y avances del personal técnico.
            </p>
          </div>

          <div className="dash-filters-row">
            <div className="dash-search-input">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Buscar por código, título o edificio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="dash-filter-pills">
              <button
                className={`filter-pill ${filtroEstado === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({misTickets.length})
              </button>
              <button
                className={`filter-pill ${filtroEstado === 'abierta' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('abierta')}
              >
                Abiertas ({abiertas})
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

        {/* Tabla o Lista de Tickets */}
        {ticketsFiltrados.length === 0 ? (
          <div className="empty-state-box">
            <Icon name="folder" size={48} color="#94a3b8" />
            <h4>No se encontraron reportes</h4>
            <p>
              {misTickets.length === 0
                ? 'Aún no has registrado ninguna incidencia en la plataforma. ¿Tienes algún problema en tu aula o laboratorio?'
                : 'No hay reportes que coincidan con los filtros aplicados.'}
            </p>
            <button className="btn-primary" onClick={onCrearIncidencia}>
              <Icon name="plus" size={16} />
              <span>Registrar Primera Incidencia</span>
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Incidencia / Detalle</th>
                  <th>Área</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Técnico Asignado</th>
                  <th>Fecha de Reporte</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.map((t) => {
                  const areaConfig = CATEGORIAS_CONFIG[t.categoria];
                  return (
                    <tr key={t.id} className="table-row-hover" onClick={() => onVerDetalle(t)}>
                      <td>
                        <span className="ticket-code-tag">{t.codigo}</span>
                      </td>
                      <td>
                        <div className="table-title-cell">
                          <b>{t.titulo}</b>
                          <small>📍 {t.ubicacion.edificio} · {t.ubicacion.espacio}</small>
                        </div>
                      </td>
                      <td>
                        <span className="area-badge" style={{ background: areaConfig?.colorSuave, color: areaConfig?.color }}>
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
                        <small className="tech-assigned-name">
                          {t.asignacion.tecnicoNombre || '⏳ Pendiente de asignación'}
                        </small>
                      </td>
                      <td>
                        <small className="date-cell">
                          {new Date(t.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
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
      </div>
    </div>
  );
}
