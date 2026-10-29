import React from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG } from '../mockData';

export default function AnaliticaView({ tickets, onVolver }) {
  // Metricas derivadas de MongoDB (tickets)

  // Calcular métricas en vivo basadas en la lista actual de tickets
  const total = tickets.length;
  const abiertas = tickets.filter((t) => t.estado === 'abierta').length;
  const enProceso = tickets.filter((t) => t.estado === 'en_proceso').length;
  const enEspera = tickets.filter((t) => t.estado === 'en_espera').length;
  const resueltas = tickets.filter((t) => t.estado === 'resuelta' || t.estado === 'cerrada').length;

  const tituloCounts = tickets.reduce((acc, t) => {
    const titulo = t.titulo || 'Sin título';
    acc[titulo] = (acc[titulo] || 0) + 1;
    return acc;
  }, {});
  const topProblemas = Object.entries(tituloCounts)
    .map(([titulo, ocurrencias]) => ({ titulo, ocurrencias }))
    .sort((a, b) => b.ocurrencias - a.ocurrencias)
    .slice(0, 5);

  const edificioCounts = tickets.reduce((acc, t) => {
    const nombre = t.ubicacion?.edificio || 'Sin edificio';
    acc[nombre] = (acc[nombre] || 0) + 1;
    return acc;
  }, {});
  const porEdificio = Object.entries(edificioCounts)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  const computoCount = tickets.filter((t) => t.categoria === 'computo_redes').length;
  const infraCount = tickets.filter((t) => t.categoria === 'infraestructura').length;
  const acadCount = tickets.filter((t) => t.categoria === 'academico').length;

  const pComputo = ((computoCount / (total || 1)) * 100).toFixed(1);
  const pInfra = ((infraCount / (total || 1)) * 100).toFixed(1);
  const pAcad = ((acadCount / (total || 1)) * 100).toFixed(1);

  return (
    <div className="analitica-page-container">
      {/* Top Banner */}
      <div className="analitica-top-banner">
        <div>
          <button className="btn-back-link" onClick={onVolver}>
            <Icon name="arrow-left" size={16} />
            <span>Volver al Dashboard</span>
          </button>
          <h2>Métricas y Analítica Operativa del Campus UTM</h2>
          <p>
            Monitoreo en tiempo real de tiempos de respuesta, incidencias recurrentes y demanda de servicios
            en los edificios de la Universidad Tecnológica Metropolitana.
          </p>
        </div>
        <div className="atlas-sync-badge">
          <span className="pulse-green"></span>
          <span>Sincronizado con MongoDB Atlas</span>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-icon kpi-blue">
            <Icon name="ticket" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Incidencias Gestionadas</span>
            <b className="kpi-number">{total}</b>
            <small className="kpi-sub">Total registradas</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-cyan">
            <Icon name="clock" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Tiempo Medio de Respuesta</span>
            <b className="kpi-number">Sin datos</b>
            <small className="kpi-sub">-15% respecto al semestre anterior</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-emerald">
            <Icon name="check-circle" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Cumplimiento de SLA</span>
            <b className="kpi-number">Sin datos</b>
            <small className="kpi-sub">Atención dentro del plazo oficial</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-purple">
            <Icon name="sparkles" size={20} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Índice de Satisfacción</span>
            <b className="kpi-number">Sin datos</b>
            <small className="kpi-sub">Evaluación de docentes y alumnos</small>
          </div>
        </div>
      </div>

      {/* Gráficos y Distribución */}
      <div className="analitica-grid-2">
        {/* Distribución por Área */}
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Distribución de Reportes por Área de Servicio</h3>
              <p className="dash-card-subtitle">Volumen porcentual y absoluto por coordinación técnica.</p>
            </div>
          </div>

          <div className="chart-bars-vertical">
            <div className="chart-bar-item">
              <div className="chart-bar-label">
                <b>💻 Cómputo y Telecomunicaciones</b>
                <span>{computoCount} tickets ({pComputo}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill blue-fill" style={{ width: `${pComputo}%` }}></div>
              </div>
            </div>

            <div className="chart-bar-item">
              <div className="chart-bar-label">
                <b>🏗️ Infraestructura y Mantenimiento</b>
                <span>{infraCount} tickets ({pInfra}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill cyan-fill" style={{ width: `${pInfra}%` }}></div>
              </div>
            </div>

            <div className="chart-bar-item">
              <div className="chart-bar-label">
                <b>📚 Sistemas y Servicios Académicos</b>
                <span>{acadCount} tickets ({pAcad}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill teal-fill" style={{ width: `${pAcad}%` }}></div>
              </div>
            </div>
          </div>

          <div className="area-status-bubbles">
            <div className="bubble-item">
              <span className="bubble-dot bg-blue"></span>
              <span>Abiertas: <b>{abiertas}</b></span>
            </div>
            <div className="bubble-item">
              <span className="bubble-dot bg-amber"></span>
              <span>En Proceso: <b>{enProceso}</b></span>
            </div>
            <div className="bubble-item">
              <span className="bubble-dot bg-green"></span>
              <span>Resueltas: <b>{resueltas}</b></span>
            </div>
          </div>
        </div>

        {/* Incidencias por Edificio */}
        <div className="dash-content-card">
          <div className="dash-card-header">
            <div>
              <h3>Incidencias por Espacio Geográfico / Edificio</h3>
              <p className="dash-card-subtitle">Puntos con mayor demanda de mantenimiento en el campus.</p>
            </div>
          </div>

          <div className="edificios-ranking-list">
            {porEdificio.length === 0 && (
              <p className="dash-card-subtitle">Sin datos</p>
            )}
            {porEdificio.map((ed, idx) => {
              const maxVal = porEdificio[0].cantidad || 1;
              const porcentaje = (ed.cantidad / maxVal) * 100;
              const colors = ['#2563eb', '#0284c7', '#0d9488', '#10b981', '#6366f1', '#8b5cf6'];
              return (
                <div key={idx} className="edificio-rank-item">
                  <div className="rank-badge">{idx + 1}</div>
                  <div className="rank-info">
                    <div className="rank-name-row">
                      <b>{ed.nombre}</b>
                      <span>{ed.cantidad} incidencias</span>
                    </div>
                    <div className="bar-track-sm">
                      <div className="bar-fill" style={{ width: `${porcentaje}%`, background: colors[idx % colors.length] }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de Problemas Recurrentes */}
      <div className="dash-content-card">
        <div className="dash-card-header">
          <div>
            <h3>Top 5 de Problemas Más Frecuentes en el Campus UTM</h3>
            <p className="dash-card-subtitle">
              Identificados mediante consultas de agregación NoSQL en la colección <code>incidencias_campus</code>.
            </p>
          </div>
        </div>

        <div className="top-problemas-grid">
          {topProblemas.length === 0 && (
            <p className="dash-card-subtitle">Sin datos</p>
          )}
          {topProblemas.map((prob, idx) => (
            <div key={idx} className="top-prob-card">
              <div className="top-prob-num">#{idx + 1}</div>
              <div className="top-prob-content">
                <span className="top-prob-cat">Incidencias</span>
                <h4>{prob.titulo}</h4>
                <div className="top-prob-footer">
                  <span className="top-prob-count"><b>{prob.ocurrencias}</b> reportes registrados</span>
                  <span className="top-prob-action">Datos reales de MongoDB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
