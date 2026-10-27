import React, { useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG, EDIFICIOS_UTM } from '../mockData';

export default function DashboardAdmin({
  user,
  tickets,
  usuarios,
  cargandoUsuarios,
  errorUsuarios,
  onVerDetalle,
  onNavigateAnalitica,
  addToast
}) {
  const [tabAdmin, setTabAdmin] = useState('tickets'); // 'tickets' | 'usuarios' | 'areas'
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);

  // Filtros del directorio de usuarios
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('todos');
  const [filtroAreaUsuario, setFiltroAreaUsuario] = useState('todas');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('todos');

  // Totales globales derivados de MongoDB (tickets)
  const total = tickets.length;
  const abiertas = tickets.filter((t) => t.estado === 'abierta').length;
  const enProceso = tickets.filter((t) => t.estado === 'en_proceso').length;
  const enEspera = tickets.filter((t) => t.estado === 'en_espera').length;
  const resueltasCerradas = tickets.filter((t) => t.estado === 'resuelta' || t.estado === 'cerrada').length;
  const criticas = tickets.filter((t) => t.prioridad === 'critica').length;

  const porPrioridad = {
    baja: tickets.filter((t) => t.prioridad === 'baja').length,
    media: tickets.filter((t) => t.prioridad === 'media').length,
    alta: tickets.filter((t) => t.prioridad === 'alta').length,
    critica: tickets.filter((t) => t.prioridad === 'critica').length
  };

  const porcentajeResolucion = total > 0
    ? `${((resueltasCerradas / total) * 100).toFixed(0)}%`
    : 'Sin datos';

  const usuariosActivos = cargandoUsuarios ? '...' : (usuarios || []).filter((u) => u.activo).length;

  const ticketsFiltrados = tickets.filter((t) => {
    if (filtroArea !== 'todas' && t.categoria !== filtroArea) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        t.codigo?.toLowerCase().includes(q) ||
        t.titulo?.toLowerCase().includes(q) ||
        t.reportante?.nombre?.toLowerCase().includes(q) ||
        t.ubicacion?.edificio?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const usuariosFiltrados = (usuarios || []).filter((u) => {
    if (filtroRolUsuario !== 'todos' && u.rol !== filtroRolUsuario) return false;
    if (filtroAreaUsuario !== 'todas' && !(u.areas_autorizadas || []).includes(filtroAreaUsuario)) return false;
    if (filtroEstadoUsuario === 'activo' && !u.activo) return false;
    if (filtroEstadoUsuario === 'inactivo' && u.activo) return false;
    if (busquedaUsuarios) {
      const q = busquedaUsuarios.toLowerCase();
      if (!u.nombre?.toLowerCase().includes(q) && !u.correo?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      {/* Banner Administrador */}
      <div className="dash-welcome-card admin-theme">
        <div className="dash-welcome-info">
          <div className="badge-user-role">
            <Icon name="shield" size={13} />
            <span>Consola de Administraci��n Central �� DTI Campus UTM</span>
          </div>
          <h2>Control Maestro: {user.nombre} �s�</h2>
          <p>
            Visi��n global del ecosistema de soporte, catǭlogo de ǭreas, control de permisos RBAC para usuarios,
            salud de la base documental MongoDB Atlas y reportes institucionales.
          </p>
        </div>
        <div className="dash-welcome-action">
          <button className="btn-analytics-dash" onClick={onNavigateAnalitica}>
            <Icon name="bar-chart" size={17} />
            <span>Ver Anal��tica Global</span>
          </button>
        </div>
      </div>

      {/* MǸtricas Globales del Campus */}
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
            <small className="kpi-sub">{criticas} de prioridad cr��tica �� {enEspera} en espera</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Tasa de Resoluci��n</span>
            <b className="kpi-number">{porcentajeResolucion}</b>
            <small className="kpi-sub">{resueltasCerradas} casos resueltos/cerrados</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <Icon name="users" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Usuarios Activos</span>
            <b className="kpi-number">{usuariosActivos}</b>
            <small className="kpi-sub">{(usuarios || []).length} usuarios totales</small>
          </div>
        </div>
      </div>

      {/* Resumen de estados y prioridades */}
      <div className="kpi-grid-4" style={{ marginTop: '12px' }}>
        <div className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-title">Abiertas</span>
            <b className="kpi-number">{abiertas}</b>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-title">En Proceso</span>
            <b className="kpi-number">{enProceso}</b>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-title">En Espera</span>
            <b className="kpi-number">{enEspera}</b>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-body">
            <span className="kpi-title">Resueltas/Cerradas</span>
            <b className="kpi-number">{resueltasCerradas}</b>
          </div>
        </div>
      </div>

      <div className="dash-content-card" style={{ marginTop: '12px' }}>
        <div className="dash-card-header">
          <div>
            <h3>Incidencias por Prioridad</h3>
            <p className="dash-card-subtitle">Distribuci��n de prioridades en MongoDB.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px 4px' }}>
          <span className="prio-badge prio-baja">BAJA: {porPrioridad.baja}</span>
          <span className="prio-badge prio-media">MEDIA: {porPrioridad.media}</span>
          <span className="prio-badge prio-alta">ALTA: {porPrioridad.alta}</span>
          <span className="prio-badge prio-critica">CR�?TICA: {porPrioridad.critica}</span>
        </div>
      </div>

      {/* Pesta��as de la Consola Admin */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-btn ${tabAdmin === 'tickets' ? 'active' : ''}`}
          onClick={() => setTabAdmin('tickets')}
        >
          <Icon name="ticket" size={16} />
          <span>Supervisi��n de Todas las Incidencias ({tickets.length})</span>
        </button>
        <button
          className={`admin-tab-btn ${tabAdmin === 'usuarios' ? 'active' : ''}`}
          onClick={() => setTabAdmin('usuarios')}
        >
          <Icon name="users" size={16} />
          <span>Directorio de Usuarios y Roles ({(usuarios || []).length})</span>
        </button>
        <button
          className={`admin-tab-btn ${tabAdmin === 'areas' ? 'active' : ''}`}
          onClick={() => setTabAdmin('areas')}
        >
          <Icon name="building" size={16} />
          <span>Catǭlogo de �?reas y Edificios UTM</span>
        </button>
      </div>

      {/* Contenido Pesta��a 1: Tickets Totales */}
      {tabAdmin === 'tickets' && (
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Inventario Campus de Incidencias</h3>
              <p className="dash-card-subtitle">
                Supervisi��n administrativa de todos los departamentos universitarios.
              </p>
            </div>

            <div className="dash-filters-row">
              <div className="dash-search-input">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por c��digo, alumno, edificio..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="select-custom"
              >
                <option value="todas">�YO? Todas las �?reas</option>
                <option value="computo_redes">�Y'� C��mputo y Telecomunicaciones</option>
                <option value="infraestructura">�Y?-��? Infraestructura y Mantenimiento</option>
                <option value="academico">�Y"s Sistemas y Servicios AcadǸmicos</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>C��digo</th>
                  <th>Incidencia</th>
                  <th>�?rea</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Reportante</th>
                  <th>TǸcnico Asignado</th>
                  <th>Ubicaci��n</th>
                  <th style={{ textAlign: 'right' }}>Acci��n</th>
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
                    <td><small>{t.asignacion.tecnicoNombre || '�?"'}</small></td>
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

      {/* Contenido Pesta��a 2: Directorio de Usuarios (solo lectura) */}
      {tabAdmin === 'usuarios' && (
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Directorio de Usuarios Institucionales (solo lectura)</h3>
              <p className="dash-card-subtitle">
                Consulta de usuarios reales almacenados en MongoDB Atlas. No se modifican roles ni registros.
              </p>
            </div>
          </div>

          {/* Filtros y bǧsqueda */}
          <div className="dash-filters-row" style={{ marginBottom: '12px' }}>
            <div className="dash-search-input">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busquedaUsuarios}
                onChange={(e) => setBusquedaUsuarios(e.target.value)}
              />
            </div>

            <select
              value={filtroRolUsuario}
              onChange={(e) => setFiltroRolUsuario(e.target.value)}
              className="select-custom"
            >
              <option value="todos">Todos los roles</option>
              <option value="reportante">Reportante</option>
              <option value="tecnico">TǸcnico</option>
              <option value="coordinador">Coordinador</option>
              <option value="administrador">Administrador</option>
            </select>

            <select
              value={filtroAreaUsuario}
              onChange={(e) => setFiltroAreaUsuario(e.target.value)}
              className="select-custom"
            >
              <option value="todas">Todas las �?reas</option>
              <option value="computo_redes">C��mputo y Telecomunicaciones</option>
              <option value="infraestructura">Infraestructura y Mantenimiento</option>
              <option value="academico">Sistemas y Servicios AcadǸmicos</option>
            </select>

            <select
              value={filtroEstadoUsuario}
              onChange={(e) => setFiltroEstadoUsuario(e.target.value)}
              className="select-custom"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          {cargandoUsuarios && (
            <p className="dash-card-subtitle">Cargando directorio de usuarios...</p>
          )}

          {errorUsuarios && (
            <p className="dash-card-subtitle" style={{ color: '#dc2626' }}>
              Error al cargar usuarios: {errorUsuarios}
            </p>
          )}

          {!cargandoUsuarios && !errorUsuarios && usuariosFiltrados.length === 0 && (
            <p className="dash-card-subtitle">No se encontraron usuarios con los filtros aplicados.</p>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Institucional</th>
                  <th>Rol</th>
                  <th>�?reas Autorizadas</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usr) => (
                  <tr key={usr.id}>
                    <td>
                      <div className="user-table-cell">
                        <span className="member-avatar">
                          {(usr.nombre || '').split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                        </span>
                        <div>
                          <b>{usr.nombre}</b>
                          {usr.tipo_reportante && <small>{usr.tipo_reportante}</small>}
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
                      <small>{(usr.areas_autorizadas || []).join(', ') || '�?"'}</small>
                    </td>
                    <td>
                      <span className={`status-dot-text ${usr.activo ? 'active-user' : 'inactive-user'}`}>
                        <span className="dot-circle"></span>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-table-action"
                        onClick={() => setUsuarioDetalle(usr)}
                        title="Ver detalle"
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

      {/* Contenido Pesta��a 3: Catǭlogo de �?reas y Edificios */}
      {tabAdmin === 'areas' && (
        <div className="admin-catalog-grid">
          <div className="dash-content-card">
            <div className="dash-card-header">
              <div>
                <h3>�?reas de Atenci��n Institucional</h3>
                <p className="dash-card-subtitle">Estructura temǭtica y coordinaciones responsables.</p>
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
                <h3>Catǭlogo de Edificios Campus UTM</h3>
                <p className="dash-card-subtitle">Espacios geogrǭficos monitoreados en la base de datos.</p>
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

      {/* Modal de detalle de usuario (solo lectura) */}
      {usuarioDetalle && (
        <div className="modal-backdrop-expediente" onClick={() => setUsuarioDetalle(null)}>
          <div className="modal-expediente-container" onClick={(e) => e.stopPropagation()}>
            <div className="expediente-topbar">
              <div className="expediente-breadcrumbs">
                <span className="font-mono-tag">{usuarioDetalle._id}</span>
              </div>
              <div className="expediente-top-actions">
                <button className="btn-close-circle" onClick={() => setUsuarioDetalle(null)} title="Cerrar">�o</button>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <p><b>Nombre:</b> {usuarioDetalle.nombre}</p>
              <p><b>Correo:</b> {usuarioDetalle.correo}</p>
              <p><b>Rol:</b> {usuarioDetalle.rol}</p>
              <p><b>�?reas autorizadas:</b> {(usuarioDetalle.areas_autorizadas || []).join(', ') || 'Ninguna'}</p>
              <p><b>Estado:</b> {usuarioDetalle.activo ? 'Activo' : 'Inactivo'}</p>
              {usuarioDetalle.tipo_reportante && (
                <p><b>Tipo de reportante:</b> {usuarioDetalle.tipo_reportante}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}