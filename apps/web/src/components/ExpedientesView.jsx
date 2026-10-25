import React, { useState } from 'react';

const EXPEDIENTES = [
  {
    id: 1, codigo: 'INC-2026-0042', titulo: 'Intermitencia de red Wi-Fi en Laboratorio 2', categoria: 'computo_redes',
    prioridad: 'alta', estado: 'en_proceso', edificio: 'Edificio A', espacio: 'Laboratorio 2',
    reportante: 'Carlos Méndez', tecnico: 'Ing. Roberto Juárez', fecha: '2026-10-21',
    descripcion: 'Se reporta intermitencia en la conexión Wi-Fi del Laboratorio 2 del Edificio A. Varios estudiantes no pueden conectarse durante las prácticas. El problema ocurre de manera aleatoria desde hace 3 días.',
    detalle: { tipo_falla: 'Red Wi-Fi', equipo: 'AP-LAB2-01', usuarios_afectados: 35 },
    historial: [
      { fecha: '2026-10-21 09:15', actor: 'Carlos Méndez', accion: 'Reporte creado', estado: 'abierta', comentario: 'Se registró la incidencia en el sistema.' },
      { fecha: '2026-10-21 10:30', actor: 'Coord. Redes', accion: 'Asignación', estado: 'abierta', comentario: 'Se asignó a Ing. Roberto Juárez para su diagnóstico.' },
      { fecha: '2026-10-21 14:00', actor: 'Ing. Roberto Juárez', accion: 'Diagnóstico', estado: 'en_proceso', comentario: 'Se detectó saturación en el access point. Se procede a reconfigurar canales.' },
      { fecha: '2026-10-22 09:00', actor: 'Ing. Roberto Juárez', accion: 'Avance', estado: 'en_proceso', comentario: 'Se reconfiguró el AP y se actualizó firmware. Monitoreando estabilidad.' },
    ],
    evidencias: [
      { nombre: 'captura_error_wifi.png', tipo: 'image/png', peso: 245 },
      { nombre: 'log_ap_lab2.txt', tipo: 'text/plain', peso: 12 },
    ],
    horas: 4.5
  },
  {
    id: 2, codigo: 'INC-2026-0040', titulo: 'Fuga de agua en sanitarios del segundo piso', categoria: 'infraestructura',
    prioridad: 'critica', estado: 'en_proceso', edificio: 'Edificio C', espacio: 'Sanitarios 2do piso',
    reportante: 'Ana Torres', tecnico: 'Ing. Pedro Ruiz', fecha: '2026-10-20',
    descripcion: 'Se detectó una fuga de agua considerable en los sanitarios del segundo piso del Edificio C. El agua se acumula en el piso y hay riesgo de daño a las instalaciones eléctricas cercanas.',
    detalle: { tipo_dano: 'Hidráulico', elemento_afectado: 'Tubería principal de sanitarios', nivel_riesgo: 'Crítico - Riesgo inmediato' },
    historial: [
      { fecha: '2026-10-20 08:00', actor: 'Ana Torres', accion: 'Reporte creado', estado: 'abierta', comentario: 'Se detectó la fuga y se reportó de inmediato.' },
      { fecha: '2026-10-20 08:15', actor: 'Coord. Infraestructura', accion: 'Escalamiento', estado: 'abierta', comentario: 'Incidencia marcada como CRÍTICA. Se asigna de inmediato.' },
      { fecha: '2026-10-20 09:00', actor: 'Ing. Pedro Ruiz', accion: 'Intervención', estado: 'en_proceso', comentario: 'Se cerró la llave de paso. Evaluando daño en la tubería.' },
    ],
    evidencias: [
      { nombre: 'foto_fuga_1.jpg', tipo: 'image/jpeg', peso: 512 },
      { nombre: 'foto_fuga_2.jpg', tipo: 'image/jpeg', peso: 480 },
    ],
    horas: 6
  },
  {
    id: 3, codigo: 'INC-2026-0035', titulo: 'Error en sistema de calificaciones', categoria: 'academico',
    prioridad: 'critica', estado: 'resuelta', edificio: 'Servicios Académicos', espacio: 'Sistema SIIA',
    reportante: 'Prof. Miguel Ángel', tecnico: 'Ing. Luisa Martínez', fecha: '2026-10-18',
    descripcion: 'El sistema SIIA muestra errores al intentar capturar calificaciones del periodo 2026-2. Los docentes no pueden registrar evaluaciones parciales.',
    detalle: { plataforma: 'SIIA', tipo_error: 'Error de sistema', periodo_escolar: '2026-2' },
    historial: [
      { fecha: '2026-10-18 10:00', actor: 'Prof. Miguel Ángel', accion: 'Reporte creado', estado: 'abierta', comentario: 'No se pueden capturar calificaciones parciales.' },
      { fecha: '2026-10-18 10:30', actor: 'Coord. Sistemas', accion: 'Asignación', estado: 'abierta', comentario: 'Se asignó prioridad crítica por periodo de evaluaciones.' },
      { fecha: '2026-10-18 14:00', actor: 'Ing. Luisa Martínez', accion: 'Diagnóstico', estado: 'en_proceso', comentario: 'Se identificó un bug en el módulo de captura. Aplicando parche.' },
      { fecha: '2026-10-19 09:00', actor: 'Ing. Luisa Martínez', accion: 'Resolución', estado: 'resuelta', comentario: 'Parche aplicado y verificado. El sistema funciona correctamente.' },
    ],
    evidencias: [
      { nombre: 'screenshot_error.png', tipo: 'image/png', peso: 189 },
    ],
    horas: 8
  },
];

const CAT_LABELS = { computo_redes: 'Cómputo y Redes', infraestructura: 'Infraestructura', academico: 'Académico' };
const ESTADO_LABELS = { abierta: 'Abierta', en_proceso: 'En proceso', en_espera: 'En espera', resuelta: 'Resuelta', cerrada: 'Cerrada' };
const PRIOR_LABELS = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' };

export default function ExpedientesView({ Icon }) {
  const [selected, setSelected] = useState(null);

  const exp = selected !== null ? EXPEDIENTES.find((e) => e.id === selected) : null;

  if (exp) {
    return (
      <div className="exp-detail">
        <button className="inc-back" onClick={() => setSelected(null)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Volver a expedientes
        </button>

        <div className="exp-header">
          <div>
            <span className="inc-detail-code">{exp.codigo}</span>
            <h2>{exp.titulo}</h2>
            <div className="inc-detail-meta">
              <span className={`ticket-status ${exp.estado.replace('_', '-')}`}>{ESTADO_LABELS[exp.estado]}</span>
              <span className={`prior-badge prior-${exp.prioridad}`}>{PRIOR_LABELS[exp.prioridad]}</span>
              <span className="inc-cat-badge">{CAT_LABELS[exp.categoria]}</span>
              <span className="exp-hours">⏱ {exp.horas}h invertidas</span>
            </div>
          </div>
        </div>

        <div className="exp-body">
          <div className="exp-main-col">
            <div className="detail-section">
              <h4>📝 Descripción completa</h4>
              <p>{exp.descripcion}</p>
            </div>

            <div className="detail-section">
              <h4>🔧 Detalle técnico ({CAT_LABELS[exp.categoria]})</h4>
              <div className="detail-kv-grid">
                {Object.entries(exp.detalle).map(([k, v]) => (
                  <div key={k} className="detail-kv">
                    <small>{k.replace(/_/g, ' ')}</small>
                    <b>{String(v)}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>📋 Historial de seguimiento completo</h4>
              <div className="timeline">
                {exp.historial.map((h, i) => (
                  <div className="timeline-item" key={i}>
                    <div className={`timeline-dot ${i === exp.historial.length - 1 ? 'active' : ''}`} />
                    <div>
                      <b>{h.accion}</b>
                      <small>{h.fecha} · {h.actor}</small>
                      <p>{h.comentario}</p>
                      <span className={`ticket-status ${h.estado.replace('_', '-')}`} style={{ fontSize: '8px', padding: '2px 6px' }}>{ESTADO_LABELS[h.estado]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="exp-side-col">
            <div className="detail-card">
              <h4>Información del expediente</h4>
              <dl>
                <dt>Reportante</dt><dd>{exp.reportante}</dd>
                <dt>Técnico asignado</dt><dd>{exp.tecnico}</dd>
                <dt>Ubicación</dt><dd>{exp.edificio} · {exp.espacio}</dd>
                <dt>Fecha de reporte</dt><dd>{exp.fecha}</dd>
                <dt>Horas invertidas</dt><dd>{exp.horas}h</dd>
                <dt>Categoría</dt><dd>{CAT_LABELS[exp.categoria]}</dd>
              </dl>
            </div>

            <div className="detail-card">
              <h4>📎 Evidencias adjuntas ({exp.evidencias.length})</h4>
              {exp.evidencias.map((ev, i) => (
                <div key={i} className="evidence-item">
                  <div className="ev-icon">{ev.tipo.startsWith('image') ? '🖼️' : '📄'}</div>
                  <div>
                    <b>{ev.nombre}</b>
                    <small>{ev.peso} KB · {ev.tipo}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exp-view">
      <div className="exp-intro">
        <div>
          <h3>Expedientes de incidencias</h3>
          <p>Consulta el historial completo, evidencias y trazabilidad de cada incidencia registrada en el sistema.</p>
        </div>
        <span className="exp-count">{EXPEDIENTES.length} expedientes</span>
      </div>

      <div className="exp-list">
        {EXPEDIENTES.map((exp) => (
          <article key={exp.id} className="exp-card" onClick={() => setSelected(exp.id)}>
            <div className="exp-card-top">
              <span className="inc-code">{exp.codigo}</span>
              <span className={`ticket-status ${exp.estado.replace('_', '-')}`}>{ESTADO_LABELS[exp.estado]}</span>
            </div>
            <h4>{exp.titulo}</h4>
            <p>{exp.descripcion.slice(0, 120)}...</p>
            <div className="exp-card-footer">
              <div className="exp-card-meta">
                <span className="inc-cat-badge">{CAT_LABELS[exp.categoria]}</span>
                <span className={`prior-badge prior-${exp.prioridad}`}>{PRIOR_LABELS[exp.prioridad]}</span>
              </div>
              <div className="exp-card-info">
                <small>📍 {exp.edificio}</small>
                <small>👤 {exp.tecnico}</small>
                <small>⏱ {exp.horas}h</small>
                <small>📎 {exp.evidencias.length}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
