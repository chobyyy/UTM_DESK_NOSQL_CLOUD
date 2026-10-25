import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// Mock Data
import { TICKETS_INICIALES, USUARIOS_DEMO, ROLES } from './mockData';

// Componentes
import HomePublico from './components/HomePublico';
import LoginView from './components/LoginView';
import PortalHeader from './components/PortalHeader';
import DashboardReportante from './components/DashboardReportante';
import DashboardTecnico from './components/DashboardTecnico';
import DashboardCoordinador from './components/DashboardCoordinador';
import DashboardAdmin from './components/DashboardAdmin';
import CrearIncidenciaView from './components/CrearIncidenciaView';
import IncidenciasView from './components/IncidenciasView';
import DetalleTicketModal from './components/DetalleTicketModal';
import AnaliticaView from './components/AnaliticaView';
import Icon from './components/Icons';

function App() {
  // Estado de Tickets (persistente en localStorage o mock)
  const [tickets, setTickets] = useState(() => {
    const guardados = localStorage.getItem('utm_desk_tickets');
    if (guardados) {
      try {
        return JSON.parse(guardados);
      } catch {
        return TICKETS_INICIALES;
      }
    }
    return TICKETS_INICIALES;
  });

  // Estado de Usuarios
  const [usuarios, setUsuarios] = useState(() => {
    const guardados = localStorage.getItem('utm_desk_usuarios');
    if (guardados) {
      try {
        return JSON.parse(guardados);
      } catch {
        return USUARIOS_DEMO;
      }
    }
    return USUARIOS_DEMO;
  });

  // Estado de Autenticación
  const [usuarioActual, setUsuarioActual] = useState(() => {
    const guardado = localStorage.getItem('utm_desk_user') || sessionStorage.getItem('utm_desk_user');
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [recordarSesion, setRecordarSesion] = useState(() => Boolean(localStorage.getItem('utm_desk_user')));

  // Vistas
  // Si no está logueado: 'home' | 'login'
  const [vistaPublica, setVistaPublica] = useState('home');
  // Si está logueado: 'dashboard' | 'crear' | 'incidencias' | 'analitica'
  const [vistaAutenticada, setVistaAutenticada] = useState('dashboard');

  // Modal de Detalle / Expediente
  const [ticketParaDetalle, setTicketParaDetalle] = useState(null);

  // Sistema de Notificaciones Toast
  const [toasts, setToasts] = useState([]);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('utm_desk_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('utm_desk_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    const storage = recordarSesion ? localStorage : sessionStorage;
    const otherStorage = recordarSesion ? sessionStorage : localStorage;
    if (usuarioActual) storage.setItem('utm_desk_user', JSON.stringify(usuarioActual));
    else storage.removeItem('utm_desk_user');
    otherStorage.removeItem('utm_desk_user');
  }, [usuarioActual, recordarSesion]);

  const addToast = (mensaje, tipo = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const handleLoginSuccess = (user, token, recordar = true) => {
    const normalizedUser = { ...user, id: user.id || user._id, areaAsignada: user.areas_autorizadas?.[0] };
    const storage = recordar ? localStorage : sessionStorage;
    const otherStorage = recordar ? sessionStorage : localStorage;
    storage.setItem('utm_desk_token', token);
    otherStorage.removeItem('utm_desk_token');
    setRecordarSesion(recordar);
    setUsuarioActual(normalizedUser);
    setVistaAutenticada('dashboard');
  };

  const handleLogout = () => {
    setUsuarioActual(null);
    localStorage.removeItem('utm_desk_token');
    sessionStorage.removeItem('utm_desk_token');
    setVistaPublica('home');
    addToast('Sesión cerrada correctamente', 'info');
  };

  const handleTicketCreado = (nuevoTicket) => {
    setTickets([nuevoTicket, ...tickets]);
    setVistaAutenticada('dashboard');
  };

  const handleActualizarTicket = (ticketActualizado) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketActualizado.id ? ticketActualizado : t))
    );
    if (ticketParaDetalle && ticketParaDetalle.id === ticketActualizado.id) {
      setTicketParaDetalle(ticketActualizado);
    }
  };

  const handleActualizarUsuarios = (nuevosUsuarios) => {
    setUsuarios(nuevosUsuarios);
  };

  return (
    <div className="app-root">
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item toast-${t.tipo}`}>
            <span className="toast-icon">
              {t.tipo === 'success' && '✓'}
              {t.tipo === 'error' && '✕'}
              {t.tipo === 'info' && 'ℹ'}
            </span>
            <span className="toast-msg">{t.mensaje}</span>
          </div>
        ))}
      </div>

      {/* Si NO está logueado */}
      {!usuarioActual ? (
        <>
          {vistaPublica === 'home' && (
            <HomePublico
              onNavigateLogin={() => setVistaPublica('login')}
              onReportarIncidencia={() => setVistaPublica('login')}
            />
          )}

          {vistaPublica === 'login' && (
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onBackToHome={() => setVistaPublica('home')}
              addToast={addToast}
            />
          )}
        </>
      ) : (
        /* Si ESTÁ logueado */
        <div className="portal-authenticated-shell">
          <PortalHeader
            user={usuarioActual}
            vistaActual={vistaAutenticada}
            onCambiarVista={setVistaAutenticada}
            onCambiarUsuarioDemo={(nuevoUser) => {
              setUsuarioActual(nuevoUser);
              setVistaAutenticada('dashboard');
            }}
            onLogout={handleLogout}
            onNuevaIncidencia={() => setVistaAutenticada('crear')}
            addToast={addToast}
          />

          <main className="portal-main-stage">
            {/* VISTA 1: DASHBOARD SEGÚN EL ROL */}
            {vistaAutenticada === 'dashboard' && (
              <>
                {usuarioActual.rol === ROLES.REPORTANTE && (
                  <DashboardReportante
                    user={usuarioActual}
                    tickets={tickets}
                    onCrearIncidencia={() => setVistaAutenticada('crear')}
                    onVerDetalle={(t) => setTicketParaDetalle(t)}
                  />
                )}

                {usuarioActual.rol === ROLES.TECNICO && (
                  <DashboardTecnico
                    user={usuarioActual}
                    tickets={tickets}
                    onActualizarTicket={handleActualizarTicket}
                    onVerDetalle={(t) => setTicketParaDetalle(t)}
                    addToast={addToast}
                  />
                )}

                {usuarioActual.rol === ROLES.COORDINADOR && (
                  <DashboardCoordinador
                    user={usuarioActual}
                    tickets={tickets}
                    onActualizarTicket={handleActualizarTicket}
                    onVerDetalle={(t) => setTicketParaDetalle(t)}
                    addToast={addToast}
                  />
                )}

                {usuarioActual.rol === ROLES.ADMINISTRADOR && (
                  <DashboardAdmin
                    user={usuarioActual}
                    tickets={tickets}
                    usuarios={usuarios}
                    onActualizarUsuarios={handleActualizarUsuarios}
                    onVerDetalle={(t) => setTicketParaDetalle(t)}
                    onNavigateAnalitica={() => setVistaAutenticada('analitica')}
                    addToast={addToast}
                  />
                )}
              </>
            )}

            {/* VISTA 2: CREACIÓN DE INCIDENCIA */}
            {vistaAutenticada === 'crear' && (
              <CrearIncidenciaView
                user={usuarioActual}
                onTicketCreado={handleTicketCreado}
                onCancelar={() => setVistaAutenticada('dashboard')}
                addToast={addToast}
              />
            )}

            {/* VISTA 3: LISTADO DE INCIDENCIAS */}
            {vistaAutenticada === 'incidencias' && (
              <IncidenciasView
                tickets={tickets}
                onVerDetalle={(t) => setTicketParaDetalle(t)}
                onNuevaIncidencia={() => setVistaAutenticada('crear')}
              />
            )}

            {/* VISTA 4: ANALÍTICA Y ESTADÍSTICAS */}
            {vistaAutenticada === 'analitica' && (
              <AnaliticaView
                tickets={tickets}
                onVolver={() => setVistaAutenticada('dashboard')}
              />
            )}
          </main>

          {/* Modal de Detalle / Expediente Completo */}
          {ticketParaDetalle && (
            <DetalleTicketModal
              ticket={ticketParaDetalle}
              user={usuarioActual}
              onClose={() => setTicketParaDetalle(null)}
              onActualizarTicket={handleActualizarTicket}
              addToast={addToast}
            />
          )}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
