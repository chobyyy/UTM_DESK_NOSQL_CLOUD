import React, { useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG, EDIFICIOS_UTM, USUARIOS_DEMO } from '../mockData';

export default function DashboardAdmin({
  user,
  tickets,
  usuarios,
  onActualizarUsuarios,
  onVerDetalle,
  onNavigateAnalitica,
  addToast
}) {
  const [tabAdmin, setTabAdmin] = useState('tickets'); // 'tickets' | 'usuarios' | 'areas'
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  // Totales globales
  const total = tickets.length;
  const abiertas = tickets.filter((t) => t.estado === 'abierta').length;
  const enProceso = tickets.filter((t) => t.estado === 'en_proceso' || t.estado === 'en_espera').length;
  const resueltas = tickets.filter((t) => t.estado === 'resuelta' || t.estado === 'cerrada').length;
  const criticas = tickets.filter((t) => t.prioridad === 'critica').length;

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroArea !== 'todas' && t.categoria !== filtroArea) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        t.codigo.toLowerCase().includes(q) ||
        t.titulo.toLowerCase().includes(q) ||
        t.reportante.nombre.toLowerCase().includes(q) ||
        t.ubicacion.edificio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleUsuarioActivo = (usrId) => {
    const actualizados = usuarios.map((u) => {
      if (u.id === usrId) {
        const nuevoEstado = !u.activo;
        addToast(`Usuario ${u.nombre} ${nuevoEstado ? 'activado' : 'desactivado'}`, 'info');
        return { ...u, activo: nuevoEstado };
      }
      return u;
    });
    onActualizarUsuarios(actualizados);
  };

  const cambiarRolUsuario = (usrId, nuevoRol) => {
    const actualizados = usuarios.map((u) => {
      if (u.id === usrId) {
        addToast(`Rol de ${u.nombre} modificado a ${nuevoRol.toUpperCase()}`, 'success');
        return { ...u, rol: nuevoRol };
      }
      return u;
    });
    onActualizarUsuarios(actualizados);
    setUsuarioEditando(null);
  };

  return (
    <div className="dashboard-container">
      {/* Banner Administrador */}
      <div className="dash-welcome-card admin-theme">
        <div className="dash-welcome-info">
          <div className="badge-user-role">
            <Icon name="shield" size={13} />
            <span>Consola de Administración Central · DTI Campus UTM</span>
          </div>
          <h2>Control Maestro: {user.nombre} ⚡</h2>
          <p>
            Visión global del ecosistema de soporte, catálogo de áreas, control de permisos RBAC para usuarios,
            salud de la base documental MongoDB Atlas y reportes institucionales.
          </p>
        </div>
        <div className="dash-welcome-action">
          <button className="btn-analytics-dash" onClick={onNavigateAnalitica}>
            <Icon name="bar-chart" size={17} />
            <span>Ver Analítica Global</span>
          </button>
        </div>
      </div>

      {/* Métricas Globales del Campus */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-icon kpi-blue">
            <Icon name="database" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Total de Incidencias NoSQL</span>
            <b className="kpi-number">{total}</b>
            <small className="kpi-sub">Almacenadas en Atlas</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-amber">
            <Icon name="alert-triangle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Abiertas y En Proceso</span>
            <b className="kpi-number">{abiertas + enProceso}</b>
            <small className="kpi-sub">{criticas} de prioridad crítica</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Tasa de Resolución</span>
            <b className="kpi-number">{((resueltas / (total || 1)) * 100).toFixed(0)}%</b>
            <small className="kpi-sub">{resueltas} casos cerrados</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <Icon name="users" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Usuarios Activos</span>
            <b className="kpi-number">{usuarios.filter((u) => u.activo).length}</b>
            <small className="kpi-sub">4 roles autorizados</small>
          </div>
        </div>
      </div>

      {/* Pestañas de la Consola Admin */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${tabAdmin === 'tickets' ? 'active' : ''}`}
          onClick={() => setTabAdmin('tickets')}
        >
          <Icon name="ticket" size={16} />
          <span>Supervisión de Todas las Incidencias ({tickets.length})</span>
        </button>
        <button
          className={`admin-tab-btn ${tabAdmin === 'usuarios' ? 'active' : ''}`}
          onClick={() => setTabAdmin('usuarios')}
        >
          <Icon name="users" size={16} />
          <span>Directorio de Usuarios y Roles ({usuarios.length})</span>
        </button>
        <button
          className={`admin-tab-btn ${tabAdmin === 'areas' ? 'active' : ''}`}
          onClick={() => setTabAdmin('areas')}
        >
          <Icon name="building" size={16} />
          <span>Catálogo de Áreas y Edificios UTM</span>
        </button>
      </div>

      {/* Contenido Pestaña 1: Tickets Totales */}
      {tabAdmin === 'tickets' && (
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Inventario Campus de Incidencias</h3>
              <p className="dash-card-subtitle">
                Supervisión administrativa de todos los departamentos universitarios.
              </p>
            </div>

            <div className="dash-filters-row">
              <div className="dash-search-input">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por código, alumno, edificio..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="select-custom"
              >
                <option value="todas">🌐 Todas las Áreas</option>
                <option value="computo_redes">💻 Cómputo y Telecomunicaciones</option>
                <option value="infraestructura">🏗️ Infraestructura y Mantenimiento</option>
                <option value="academico">📚 Sistemas y Servicios Académicos</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Incidencia</th>
                  <th>Área</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Reportante</th>
                  <th>Técnico Asignado</th>
                  <th>Ubicación</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.map((t) => (
                  <tr key={t.id} className="table-row-hover" onClick={() => onVerDetalle(t)}>
                    <td><span className="ticket-code-tag">{t.codigo}</span></td>
                    <td><b>{t.titulo}</b></td>
                    <td>
                      <small className="area-text-tag">{CATEGORIAS_CONFIG[t.categoria]?.emoji} {CATEGORIAS_CONFIG[t.categoria]?.nombre.split(' ')[0]}</small>
                    </td>
                    <td><span className={`prio-badge prio-${t.prioridad}`}>{t.prioridad.toUpperCase()}</span></td>
                    <td><span className={`status-badge status-${t.estado}`}>{t.estado.replace('_', ' ').toUpperCase()}</span></td>
                    <td><small>{t.reportante.nombre}</small></td>
                    <td><small>{t.asignacion.tecnicoNombre || '—'}</small></td>
                    <td><small>{t.ubicacion.edificio}</small></td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-table-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(t);
                        }}
                      >
                        <Icon name="eye" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido Pestaña 2: Gestión de Usuarios */}
      {tabAdmin === 'usuarios' && (
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Control de Acceso y Roles Institucionales (RBAC)</h3>
              <p className="dash-card-subtitle">
                Administra los permisos de estudiantes, técnicos de soporte, coordinadores y administradores DTI.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Institucional</th>
                  <th>Rol Actual</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Modificar Permisos</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usr) => (
                  <tr key={usr.id}>
                    <td>
                      <div className="user-table-cell">
                        <span className="member-avatar">{usr.avatar}</span>
                        <div>
                          <b>{usr.nombre}</b>
                          <small>{usr.cargo || usr.carrera || usr.especialidad || 'Comunidad UTM'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono-tag">{usr.correo}</span>
                    </td>
                    <td>
                      <span className={`role-badge role-${usr.rol}`}>
                        {usr.rol.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-dot-text ${usr.activo ? 'active-user' : 'inactive-user'}`}>
                        <span className="dot-circle"></span>
                        {usr.activo ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="user-action-btns">
                        <select
                          value={usr.rol}
                          onChange={(e) => cambiarRolUsuario(usr.id, e.target.value)}
                          className="select-mini-role"
                        >
                          <option value="reportante">Reportante</option>
                          <option value="tecnico">Técnico</option>
                          <option value="coordinador">Coordinador</option>
                          <option value="administrador">Administrador</option>
                        </select>

                        <button
                          className={`btn-toggle-active ${usr.activo ? 'btn-deactivate' : 'btn-activate'}`}
                          onClick={() => toggleUsuarioActivo(usr.id)}
                          title={usr.activo ? 'Suspender acceso' : 'Habilitar acceso'}
                        >
                          {usr.activo ? 'Suspender' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido Pestaña 3: Catálogo de Áreas y Edificios */}
      {tabAdmin === 'areas' && (
        <div className="admin-catalog-grid">
          <div className="dash-content-card">
            <div className="dash-card-header">
              <div>
                <h3>Áreas de Atención Institucional</h3>
                <p className="dash-card-subtitle">Estructura temática y coordinaciones responsables.</p>
              </div>
            </div>
            <div className="catalog-areas-list">
              {Object.values(CATEGORIAS_CONFIG).map((c) => (
                <div key={c.id} className="catalog-area-item">
                  <div className="area-icon-box" style={{ background: c.colorSuave, color: c.color }}>
                    <span className="area-emoji">{c.emoji}</span>
                  </div>
                  <div className="catalog-area-info">
                    <b>{c.nombre}</b>
                    <p>{c.descripcion}</p>
                    <small><b>Responsable:</b> {c.responsable}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-content-card">
            <div className="dash-card-header">
              <div>
                <h3>Catálogo de Edificios Campus UTM</h3>
                <p className="dash-card-subtitle">Espacios geográficos monitoreados en la base de datos.</p>
              </div>
            </div>
            <ul className="edificios-catalog-list">
              {EDIFICIOS_UTM.map((edif, idx) => (
                <li key={idx} className="edificio-item">
                  <Icon name="building" size={17} color="#2563eb" />
                  <span>{edif}</span>
                  <span className="edificio-status-badge">Operativo</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
