import React, { useState } from 'react';
import Icon from './Icons';
import { USUARIOS_DEMO } from '../mockData';

export default function PortalHeader({
  user,
  vistaActual,
  onCambiarVista,
  onCambiarUsuarioDemo,
  onLogout,
  onNuevaIncidencia,
  addToast
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notificaciones = [
    { id: 1, texto: 'El ticket INC-2026-0042 cambió a estado EN PROCESO', tiempo: 'Hace 10 min' },
    { id: 2, texto: 'Nueva asignación técnica en Edificio B (Aulas)', tiempo: 'Hace 35 min' },
    { id: 3, texto: 'Mantenimiento preventivo en cluster MongoDB Atlas programado para el domingo', tiempo: 'Hace 2 horas' }
  ];

  return (
    <header className="portal-top-navbar">
      <div className="portal-nav-left">
        {/* Brand */}
        <div className="portal-brand-clickable" onClick={() => onCambiarVista('dashboard')}>
          <div className="portal-brand-icon">
            <Icon name="building" size={20} color="#ffffff" />
          </div>
          <div>
            <div className="portal-brand-text">UTM Desk <span className="brand-pill-sm">NoSQL</span></div>
            <div className="portal-brand-sub">Universidad Tecnológica de la Mixteca</div>
          </div>
        </div>

        {/* Links de Navegación según el rol */}
        <nav className="portal-nav-menu">
          <button
            className={`portal-nav-link ${vistaActual === 'dashboard' ? 'active' : ''}`}
            onClick={() => onCambiarVista('dashboard')}
          >
            <Icon name="home" size={16} />
            <span>Mi Dashboard ({user.rol.toUpperCase()})</span>
          </button>

          <button
            className={`portal-nav-link ${vistaActual === 'incidencias' ? 'active' : ''}`}
            onClick={() => onCambiarVista('incidencias')}
          >
            <Icon name="ticket" size={16} />
            <span>Incidencias</span>
          </button>

          {/* Analítica disponible para todos, destacada para Coord y Admin */}
          <button
            className={`portal-nav-link ${vistaActual === 'analitica' ? 'active' : ''}`}
            onClick={() => onCambiarVista('analitica')}
          >
            <Icon name="bar-chart" size={16} />
            <span>Analítica Campus</span>
          </button>

          {/* Menú de administración si es admin */}
          {user.rol === 'administrador' && (
            <button
              className={`portal-nav-link ${vistaActual === 'admin' ? 'active' : ''}`}
              onClick={() => onCambiarVista('dashboard')}
            >
              <Icon name="shield" size={16} />
              <span>Consola Admin</span>
            </button>
          )}
        </nav>
      </div>

      <div className="portal-nav-right">
        {/* Botón Nueva Incidencia */}
        <button className="btn-nav-new-ticket" onClick={onNuevaIncidencia}>
          <Icon name="plus" size={15} />
          <span>Nueva Incidencia</span>
        </button>

        {/* Notificaciones */}
        <div className="nav-notif-wrapper">
          <button
            className="btn-icon-nav"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notificaciones"
          >
            <Icon name="bell" size={18} />
            <span className="notif-badge-dot"></span>
          </button>

          {showNotifications && (
            <div className="notif-dropdown-card">
              <div className="notif-header">
                <b>Notificaciones del Sistema</b>
                <span className="badge-p badge-open">3 nuevas</span>
              </div>
              <div className="notif-list">
                {notificaciones.map((n) => (
                  <div key={n.id} className="notif-item">
                    <p>{n.texto}</p>
                    <small>{n.tiempo}</small>
                  </div>
                ))}
              </div>
              <button
                className="notif-close-btn"
                onClick={() => {
                  setShowNotifications(false);
                  addToast('Notificaciones marcadas como leídas', 'info');
                }}
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>

        {/* Selector Rápido de Cambio de Rol para el Prototipo */}
        <div className="role-switcher-box">
          <label className="role-switcher-label">Cambiar Perfil:</label>
          <select
            value={user.id}
            onChange={(e) => {
              const u = USUARIOS_DEMO.find((usr) => usr.id === e.target.value);
              if (u) {
                onCambiarUsuarioDemo(u);
                addToast(`Cambiado a perfil: ${u.nombre} (${u.rol.toUpperCase()})`, 'info');
              }
            }}
            className="role-switcher-select"
          >
            {USUARIOS_DEMO.map((u) => (
              <option key={u.id} value={u.id}>
                {u.rol.toUpperCase()} - {u.nombre.split(' ')[0]} {u.nombre.split(' ')[1] || ''}
              </option>
            ))}
          </select>
        </div>

        {/* Perfil del Usuario y Logout */}
        <div className="user-profile-nav">
          <div className="user-nav-avatar">{user.avatar}</div>
          <div className="user-nav-info">
            <b>{user.nombre.split(' ')[0]} {user.nombre.split(' ')[1] || ''}</b>
            <span className={`role-badge-sm role-${user.rol}`}>{user.rol}</span>
          </div>
          <button className="btn-logout-nav" onClick={onLogout} title="Cerrar sesión">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
