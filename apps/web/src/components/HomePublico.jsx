import React from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';

export default function HomePublico({ onNavigateLogin, onReportarIncidencia }) {
  return (
    <div className="home-public">
      {/* Top Bar Institucional */}
      <header className="home-navbar">
        <div className="home-nav-container">
          <div className="home-brand">
            <div className="brand-badge-icon">
              <Icon name="building" size={20} color="#ffffff" />
            </div>
            <div>
              <div className="brand-title">UTM Desk <span className="brand-pill">NoSQL Cloud</span></div>
              <div className="brand-sub">Universidad Tecnológica de la Mixteca · Campus Inteligente</div>
            </div>
          </div>

          <nav className="home-nav-links">
            <a href="#areas">Áreas de Atención</a>
            <a href="#flujo">¿Cómo Funciona?</a>
            <a href="#metricas">Métricas en Vivo</a>
            <a href="#tecnologia">Arquitectura NoSQL</a>
          </nav>

          <div className="home-nav-actions">
            <button className="btn-portal-outline" onClick={onNavigateLogin}>
              <Icon name="lock" size={15} />
              <span>Acceso al Portal</span>
            </button>
            <button className="btn-portal-primary" onClick={onReportarIncidencia}>
              <Icon name="plus" size={16} />
              <span>Reportar Incidencia</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-dot"></span>
            <span>Mesa de Ayuda Universitaria 2026 · MongoDB Atlas Cloud</span>
          </div>

          <h1 className="hero-headline">
            Centraliza, resuelve y analiza las <span className="text-gradient">incidencias universitarias</span> en tiempo real.
          </h1>

          <p className="hero-subtext">
            Plataforma integral para estudiantes, docentes y personal de la UTM. Reporta fallas en telecomunicaciones,
            infraestructura física y sistemas académicos con trazabilidad documental NoSQL de extremo a extremo.
          </p>

          <div className="hero-cta-group">
            <button className="hero-btn-primary" onClick={onReportarIncidencia}>
              <Icon name="plus-circle" size={18} />
              <span>Generar Nuevo Reporte</span>
            </button>
            <button className="hero-btn-secondary" onClick={onNavigateLogin}>
              <Icon name="user" size={18} />
              <span>Ingresar con Cuenta UTM</span>
              <Icon name="arrow-right" size={16} />
            </button>
          </div>

          <div className="hero-trust-bar">
            <div className="trust-item">
              <Icon name="shield" size={16} color="#06b6d4" />
              <span>4 Roles Seguros (Reportante, Técnico, Coordinador, Admin)</span>
            </div>
            <div className="trust-item">
              <Icon name="database" size={16} color="#06b6d4" />
              <span>Esquema Flexible NoSQL con MongoDB Atlas</span>
            </div>
            <div className="trust-item">
              <Icon name="cloud" size={16} color="#06b6d4" />
              <span>Despliegue Cloud en Render</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="hero-preview-wrapper">
          <div className="hero-preview-card">
            <div className="preview-top">
              <div className="preview-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-amber"></span>
                <span className="dot dot-green"></span>
              </div>
              <span className="preview-label">UTM Desk · Monitor Operativo</span>
              <span className="preview-status"><span className="pulse-green"></span> 100% Operativo</span>
            </div>

            <div className="preview-stats-row">
              <div className="p-stat">
                <small>Tickets Activos</small>
                <strong>47</strong>
                <span className="trend positive">Campus UTM</span>
              </div>
              <div className="p-stat">
                <small>Tiempo Promedio</small>
                <strong>4.2 hrs</strong>
                <span className="trend positive">-35% vs 2025</span>
              </div>
              <div className="p-stat">
                <small>Satisfacción</small>
                <strong>97.2%</strong>
                <span className="trend positive">Comunidad</span>
              </div>
            </div>

            <div className="preview-ticket-list">
              <div className="p-ticket">
                <div className="p-ticket-tag blue">Cómputo y Redes</div>
                <div className="p-ticket-body">
                  <b>INC-2026-0042 · Switch PoE y Wi-Fi en Lab C-204</b>
                  <p>Edificio C · En proceso de solución técnica</p>
                </div>
                <span className="badge-p badge-prog">En Proceso</span>
              </div>
              <div className="p-ticket">
                <div className="p-ticket-tag cyan">Infraestructura</div>
                <div className="p-ticket-body">
                  <b>INC-2026-0040 · Fuga sanitaria en Edificio B</b>
                  <p>Área acordonada · Técnico asignado en sitio</p>
                </div>
                <span className="badge-p badge-crit">Crítica</span>
              </div>
              <div className="p-ticket">
                <div className="p-ticket-tag teal">Sistemas Académicos</div>
                <div className="p-ticket-body">
                  <b>INC-2026-0038 · Carga de actas SIIA 2026-2</b>
                  <p>Revisión por Coordinación Escolar</p>
                </div>
                <span className="badge-p badge-open">Abierta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Áreas de Servicio */}
      <section id="areas" className="home-section areas-section">
        <div className="section-head">
          <span className="section-eyebrow">Áreas Atendidas</span>
          <h2 className="section-title">Estructura adaptada para cada necesidad del campus</h2>
          <p className="section-desc">
            Gracias al modelo NoSQL de MongoDB Atlas, cada área recopila la información exacta y necesaria
            sin rigideces relacionales.
          </p>
        </div>

        <div className="areas-grid">
          {Object.values(CATEGORIAS_CONFIG).map((cat) => (
            <div key={cat.id} className="area-card" style={{ borderColor: cat.bordeColor }}>
              <div className="area-icon-box" style={{ background: cat.colorSuave, color: cat.color }}>
                <span className="area-emoji">{cat.emoji}</span>
              </div>
              <h3 className="area-title">{cat.nombre}</h3>
              <p className="area-desc">{cat.descripcion}</p>
              
              <div className="area-meta">
                <span className="area-resp-label">Coordinación Responsable:</span>
                <span className="area-resp-val">{cat.responsable}</span>
              </div>

              <div className="area-features">
                <div className="area-pill">Formulario Especializado</div>
                <div className="area-pill">Asignación por Roles</div>
                <div className="area-pill">SLA Garantizado</div>
              </div>

              <button className="area-action-btn" onClick={onReportarIncidencia}>
                <span>Reportar en esta área</span>
                <Icon name="arrow-right" size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Flujo de Funcionamiento */}
      <section id="flujo" className="home-section flow-section">
        <div className="section-head">
          <span className="section-eyebrow">Proceso Ágil</span>
          <h2 className="section-title">¿Cómo funciona el ciclo de vida de un ticket?</h2>
          <p className="section-desc">Transparencia y trazabilidad garantizada desde el reporte hasta el cierre formal.</p>
        </div>

        <div className="flow-steps-grid">
          <div className="flow-step-card">
            <div className="step-num-bubble">1</div>
            <div className="step-icon"><Icon name="file-text" size={24} color="#2563eb" /></div>
            <h4>1. Registro Digital</h4>
            <p>El estudiante o docente ingresa con su cuenta institucional y reporta con fotos y campos específicos de su área.</p>
          </div>
          <div className="flow-step-card">
            <div className="step-num-bubble">2</div>
            <div className="step-icon"><Icon name="users" size={24} color="#0284c7" /></div>
            <h4>2. Asignación y Prioridad</h4>
            <p>El coordinador supervisa la cola de su área, valida la criticidad y asigna al técnico disponible idóneo.</p>
          </div>
          <div className="flow-step-card">
            <div className="step-num-bubble">3</div>
            <div className="step-icon"><Icon name="wrench" size={24} color="#0d9488" /></div>
            <h4>3. Diagnóstico y Avances</h4>
            <p>El técnico acude al sitio, registra bitácoras, agrega horas invertidas y adjunta evidencias fotográficas.</p>
          </div>
          <div className="flow-step-card">
            <div className="step-num-bubble">4</div>
            <div className="step-icon"><Icon name="check-circle" size={24} color="#10b981" /></div>
            <h4>4. Resolución y Expediente</h4>
            <p>Se notifica al reportante, se archiva el expediente completo y se alimenta la analítica del campus.</p>
          </div>
        </div>
      </section>

      {/* Métricas del Campus */}
      <section id="metricas" className="home-section metrics-section">
        <div className="metrics-banner">
          <div className="metric-col">
            <span className="metric-big-num">1,480+</span>
            <span className="metric-big-label">Incidencias Atendidas</span>
            <small>En ciclo escolar 2025 - 2026</small>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-col">
            <span className="metric-big-num">4.2 h</span>
            <span className="metric-big-label">Tiempo Medio de Respuesta</span>
            <small>En reportes de alta criticidad</small>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-col">
            <span className="metric-big-num">97.2%</span>
            <span className="metric-big-label">Satisfacción Global</span>
            <small>Evaluación de alumnos y docentes</small>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-col">
            <span className="metric-big-num">100%</span>
            <span className="metric-big-label">Cloud MongoDB Atlas</span>
            <small>Base NoSQL en la nube sin caídas</small>
          </div>
        </div>
      </section>

      {/* Arquitectura Tecnológica */}
      <section id="tecnologia" className="home-section tech-section">
        <div className="tech-box">
          <div className="tech-text">
            <span className="section-eyebrow">Stack de Vanguardia</span>
            <h3>Arquitectura Cloud y Base de Datos Documental</h3>
            <p>
              Diseñado bajo arquitectura desacoplada para garantizar escalabilidad durante periodos de inscripciones
              y exámenes finales de la UTM.
            </p>
            <div className="tech-tags">
              <span className="tech-tag">⚛️ React 18 SPA</span>
              <span className="tech-tag">⚡ Vite Fast Engine</span>
              <span className="tech-tag">🍃 MongoDB Atlas NoSQL</span>
              <span className="tech-tag">🟢 Node.js & Express API</span>
              <span className="tech-tag">🐘 PHP / Laravel</span>
              <span className="tech-tag">🚀 Render Cloud Hosting</span>
            </div>
          </div>
          <div className="tech-card-code">
            <div className="code-header">
              <span>sample_ticket.json (MongoDB Document)</span>
              <Icon name="database" size={14} color="#10b981" />
            </div>
            <pre>
{`{
  "_id": ObjectId("6719ab2..."),
  "codigo": "INC-2026-0042",
  "categoria": "computo_redes",
  "prioridad": "alta",
  "estado": "en_proceso",
  "detalle_especifico": {
    "tipo_falla": "Conectividad AP",
    "equipo": "Cisco Catalyst 9120",
    "inventario": "UTM-DTI-AP-0982",
    "usuarios_afectados": 35
  },
  "historial_seguimiento": [ ... ],
  "evidencias": [ ... ]
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Icon name="building" size={22} color="#ffffff" />
              <span>UTM Desk NoSQL Cloud</span>
            </div>
            <p>
              Universidad Tecnológica de la Mixteca · Carretera a Acatlima Km. 2.5, Huajuapan de León, Oaxaca.
              Dirección de Tecnologías de Información (DTI).
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h5>Navegación</h5>
              <a href="#areas">Áreas de Soporte</a>
              <a href="#flujo">Flujo Operativo</a>
              <a href="#metricas">Métricas en Vivo</a>
            </div>
            <div className="footer-col">
              <h5>Portal Institucional</h5>
              <button onClick={onNavigateLogin}>Iniciar Sesión</button>
              <button onClick={onReportarIncidencia}>Levantar Ticket</button>
              <a href="mailto:soporte.dti@utm.edu.mx">soporte.dti@utm.edu.mx</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Universidad Tecnológica de la Mixteca (UTM). Todos los derechos reservados.</p>
          <div className="footer-bottom-badge">
            <Icon name="shield" size={14} />
            <span>Sistema Protegido por UTM-AUTH & MongoDB Atlas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
