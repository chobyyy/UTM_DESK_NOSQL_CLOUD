import React, { useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG, EDIFICIOS_UTM } from '../mockData';

export default function CrearIncidenciaView({ user, onTicketCreado, onCancelar, addToast }) {
  const [categoria, setCategoria] = useState('computo_redes');
  const [paso, setPaso] = useState(1);

  // Campos Generales
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [edificio, setEdificio] = useState(EDIFICIOS_UTM[0]);
  const [espacio, setEspacio] = useState('');
  const [tags, setTags] = useState('');

  // Campos Específicos Cómputo y Telecomunicaciones
  const [computoEquipo, setComputoEquipo] = useState('');
  const [computoInventario, setComputoInventario] = useState('');
  const [computoIP, setComputoIP] = useState('');
  const [computoDispositivos, setComputoDispositivos] = useState('1');
  const [computoTipoFalla, setComputoTipoFalla] = useState('Red Wi-Fi');

  // Campos Específicos Infraestructura y Mantenimiento
  const [infraTipoDano, setInfraTipoDano] = useState('Luminaria / Eléctrico');
  const [infraNivelRiesgo, setInfraNivelRiesgo] = useState('Moderado');
  const [infraElemento, setInfraElemento] = useState('');
  const [infraMateriales, setInfraMateriales] = useState('');
  const [infraAcordonar, setInfraAcordonar] = useState(false);

  // Campos Específicos Sistemas Académicos
  const [acadPlataforma, setAcadPlataforma] = useState('Moodle LMS');
  const [acadTipoError, setAcadTipoError] = useState('Acceso denegado / Error de credenciales');
  const [acadCurso, setAcadCurso] = useState('');
  const [acadPeriodo, setAcadPeriodo] = useState('2026-2 (Otoño)');
  const [acadEstudiantesAfectados, setAcadEstudiantesAfectados] = useState('1');

  // Evidencias simuladas
  const [archivosSimulados, setArchivosSimulados] = useState([]);

  const handleSimularArchivo = () => {
    const nombres = ['foto_evidencia_1.jpg', 'captura_error_pantalla.png', 'registro_evento.log'];
    const elegido = nombres[Math.floor(Math.random() * nombres.length)];
    if (!archivosSimulados.find((a) => a.nombre === elegido)) {
      setArchivosSimulados([...archivosSimulados, { id: Date.now(), nombre: elegido, peso: '1.8 MB' }]);
      addToast(`Archivo ${elegido} adjuntado con éxito`, 'info');
    }
  };

  const handleEliminarArchivo = (id) => {
    setArchivosSimulados(archivosSimulados.filter((a) => a.id !== id));
  };

  const handleValidarPaso1 = () => {
    if (!categoria) {
      alert('Por favor selecciona un área');
      return;
    }
    setPaso(2);
  };

  const handleValidarPaso2 = () => {
    if (!titulo.trim() || !descripcion.trim() || !espacio.trim()) {
      alert('Por favor completa todos los campos obligatorios (*)');
      return;
    }
    setPaso(3);
  };

  const handleFinalizarSubmit = (e) => {
    e.preventDefault();

    // Construir detalle_especifico NoSQL según la categoría
    let detalleEspecifico = {};

    if (categoria === 'computo_redes') {
      detalleEspecifico = {
        tipo_falla: computoTipoFalla,
        equipo: computoEquipo || 'Equipo genérico',
        inventario: computoInventario || 'Sin inventario reportado',
        direccion_ip: computoIP || 'DHCP Automático',
        dispositivos_afectados: parseInt(computoDispositivos, 10) || 1
      };
    } else if (categoria === 'infraestructura') {
      detalleEspecifico = {
        tipo_dano: infraTipoDano,
        nivel_riesgo: infraNivelRiesgo,
        elemento_afectado: infraElemento || 'Instalación general',
        materiales_requeridos: infraMateriales || 'Por evaluar en sitio',
        requiere_acordonar: infraAcordonar ? 'Sí, urgente acordonar' : 'No se requiere acordonamiento'
      };
    } else {
      detalleEspecifico = {
        plataforma: acadPlataforma,
        tipo_error: acadTipoError,
        curso_afectado: acadCurso || 'Plataforma general',
        periodo_escolar: acadPeriodo,
        estudiantes_afectados: parseInt(acadEstudiantesAfectados, 10) || 1
      };
    }

    const nuevoCodigo = `INC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const tagsArray = tags
      ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [categoria.replace('_', '')];

    const nuevoTicket = {
      id: `t-${Date.now()}`,
      codigo: nuevoCodigo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      prioridad,
      estado: 'abierta',
      reportante: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      },
      ubicacion: {
        edificio,
        espacio: espacio.trim()
      },
      asignacion: {
        area: categoria,
        tecnicoId: null,
        tecnicoNombre: 'Sin asignar'
      },
      detalle_especifico: detalleEspecifico,
      tags: tagsArray,
      horas_invertidas: 0,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      fecha_resolucion: null,
      evidencias: archivosSimulados,
      historial: [
        {
          id: `h-${Date.now()}`,
          fecha: new Date().toISOString(),
          actor: `${user.nombre} (${user.rol.toUpperCase()})`,
          accion: 'Registro de incidencia en el portal',
          estadoAnterior: null,
          estadoNuevo: 'abierta',
          comentario: 'Se recibió la solicitud digital. Pendiente de asignación por coordinación.',
          horas: 0
        }
      ]
    };

    onTicketCreado(nuevoTicket);
    addToast(`¡Incidencia ${nuevoCodigo} creada con éxito!`, 'success');
  };

  const areaConfig = CATEGORIAS_CONFIG[categoria];

  return (
    <div className="create-ticket-page">
      {/* Header del Formulario */}
      <div className="create-header-banner">
        <button className="btn-back-link" onClick={onCancelar}>
          <Icon name="arrow-left" size={16} />
          <span>Volver al Panel</span>
        </button>
        <div className="create-title-box">
          <h2>Nuevo Reporte de Incidencia Universitaria</h2>
          <p>
            Completa el formulario interactivo. El sistema adaptará los campos según el área seleccionada
            garantizando que el equipo técnico reciba la información exacta.
          </p>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="wizard-stepper">
          <div className={`step-item ${paso >= 1 ? 'step-done' : ''} ${paso === 1 ? 'step-active' : ''}`}>
            <div className="step-circle">{paso > 1 ? '✓' : '1'}</div>
            <span>1. Seleccionar Área</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${paso >= 2 ? 'step-done' : ''} ${paso === 2 ? 'step-active' : ''}`}>
            <div className="step-circle">{paso > 2 ? '✓' : '2'}</div>
            <span>2. Datos Generales</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${paso === 3 ? 'step-active' : ''}`}>
            <div className="step-circle">3</div>
            <span>3. Datos Específicos NoSQL</span>
          </div>
        </div>
      </div>

      <div className="create-form-wrapper">
        {/* PASO 1: SELECCIÓN DE ÁREA */}
        {paso === 1 && (
          <div className="wizard-card-step">
            <div className="step-card-heading">
              <h3>Paso 1: ¿Qué tipo de problema deseas reportar?</h3>
              <p>Selecciona el área responsable para desplegar los campos adecuados:</p>
            </div>

            <div className="create-categories-grid">
              {Object.values(CATEGORIAS_CONFIG).map((cat) => (
                <div
                  key={cat.id}
                  className={`cat-select-card ${categoria === cat.id ? 'cat-selected' : ''}`}
                  onClick={() => setCategoria(cat.id)}
                  style={{
                    borderColor: categoria === cat.id ? cat.color : '#e2e8f0',
                    boxShadow: categoria === cat.id ? `0 0 0 2px ${cat.color}22` : 'none'
                  }}
                >
                  <div className="cat-select-icon" style={{ background: cat.colorSuave, color: cat.color }}>
                    <span className="cat-emoji">{cat.emoji}</span>
                  </div>
                  <h4>{cat.nombre}</h4>
                  <p>{cat.descripcion}</p>
                  <div className="cat-check-badge">
                    {categoria === cat.id ? '✓ Área Seleccionada' : 'Seleccionar'}
                  </div>
                </div>
              ))}
            </div>

            <div className="wizard-footer-actions">
              <button type="button" className="btn-secondary" onClick={onCancelar}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleValidarPaso1}>
                <span>Continuar a Datos Generales</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: DATOS GENERALES */}
        {paso === 2 && (
          <div className="wizard-card-step">
            <div className="step-card-heading">
              <div className="area-pill-active" style={{ background: areaConfig.colorSuave, color: areaConfig.color }}>
                {areaConfig.emoji} {areaConfig.nombre}
              </div>
              <h3>Paso 2: Información General y Ubicación en el Campus</h3>
              <p>Define claramente el título, la ubicación y el nivel de prioridad preliminar.</p>
            </div>

            <div className="form-fields-container">
              <div className="input-field-group">
                <label>Título Breve de la Incidencia *</label>
                <div className="input-with-icon">
                  <Icon name="file-text" size={17} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Ej. Intermitencia de red Wi-Fi en laboratorio C-204"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    maxLength={160}
                    required
                  />
                </div>
                <small className="char-count">{titulo.length}/160 caracteres</small>
              </div>

              <div className="input-field-group">
                <label>Descripción Completa del Problema *</label>
                <textarea
                  rows={4}
                  placeholder="Describe a detalle qué sucede, desde cuándo ocurre y de qué forma perjudica a los usuarios..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-3">
                <div className="input-field-group">
                  <label>Edificio de la UTM *</label>
                  <select
                    value={edificio}
                    onChange={(e) => setEdificio(e.target.value)}
                    className="select-custom"
                  >
                    {EDIFICIOS_UTM.map((ed, idx) => (
                      <option key={idx} value={ed}>{ed}</option>
                    ))}
                  </select>
                </div>

                <div className="input-field-group">
                  <label>Aula, Laboratorio o Espacio *</label>
                  <div className="input-with-icon">
                    <Icon name="building" size={17} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Ej. Salón 201, Pasillo central"
                      value={espacio}
                      onChange={(e) => setEspacio(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-field-group">
                  <label>Prioridad Preliminar</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="select-custom"
                  >
                    <option value="baja">🟢 Baja (No urgente)</option>
                    <option value="media">🟡 Media (Falla moderada)</option>
                    <option value="alta">🟠 Alta (Interrumpe docencia)</option>
                    <option value="critica">🔴 Crítica (Emergencia)</option>
                  </select>
                </div>
              </div>

              <div className="input-field-group">
                <label>Etiquetas Clave (Opcional, separadas por coma)</label>
                <input
                  type="text"
                  placeholder="ej. wifi, proyector, urgente, laboratorio"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            <div className="wizard-footer-actions">
              <button type="button" className="btn-secondary" onClick={() => setPaso(1)}>
                <Icon name="arrow-left" size={16} />
                <span>Anterior</span>
              </button>
              <button type="button" className="btn-primary" onClick={handleValidarPaso2}>
                <span>Continuar a Campos Específicos</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CAMPOS ESPECÍFICOS SEGÚN EL ÁREA + EVIDENCIAS */}
        {paso === 3 && (
          <form onSubmit={handleFinalizarSubmit} className="wizard-card-step">
            <div className="step-card-heading">
              <div className="area-pill-active" style={{ background: areaConfig.colorSuave, color: areaConfig.color }}>
                {areaConfig.emoji} {areaConfig.nombre}
              </div>
              <h3>Paso 3: Campos Específicos NoSQL y Evidencias</h3>
              <p>
                Información técnica especializada según los requerimientos de <b>{areaConfig.nombre}</b>:
              </p>
            </div>

            {/* SECCIÓN DINÁMICA: CÓMPUTO Y TELECOMUNICACIONES */}
            {categoria === 'computo_redes' && (
              <div className="dynamic-category-panel blue-tint">
                <div className="dynamic-panel-header">
                  <Icon name="laptop" size={20} color="#2563eb" />
                  <h4>Parámetros de Cómputo y Telecomunicaciones</h4>
                </div>
                <div className="form-grid-2">
                  <div className="input-field-group">
                    <label>Tipo de Falla Tecnológica *</label>
                    <select
                      value={computoTipoFalla}
                      onChange={(e) => setComputoTipoFalla(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Red Wi-Fi">Red Wi-Fi Institucional</option>
                      <option value="Cableado Ethernet / Switch">Cableado Ethernet / Switch</option>
                      <option value="Hardware de PC / Servidor">Hardware de PC o Servidor</option>
                      <option value="Proyector / Audio Aula">Proyector o Audio de Aula</option>
                      <option value="Telefonía IP / Impresora">Telefonía IP o Impresora de Red</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label>Equipo o Dispositivo Afectado</label>
                    <input
                      type="text"
                      placeholder="Ej. PC-LAB2-14, Switch Cisco 2960"
                      value={computoEquipo}
                      onChange={(e) => setComputoEquipo(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Número de Inventario UTM</label>
                    <input
                      type="text"
                      placeholder="Ej. UTM-DTI-INV-2041"
                      value={computoInventario}
                      onChange={(e) => setComputoInventario(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Dirección IP o Segmento (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. 10.15.42.105"
                      value={computoIP}
                      onChange={(e) => setComputoIP(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Usuarios / Dispositivos Afectados Aprox.</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={computoDispositivos}
                      onChange={(e) => setComputoDispositivos(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DINÁMICA: INFRAESTRUCTURA Y MANTENIMIENTO */}
            {categoria === 'infraestructura' && (
              <div className="dynamic-category-panel cyan-tint">
                <div className="dynamic-panel-header">
                  <Icon name="wrench" size={20} color="#0284c7" />
                  <h4>Parámetros de Infraestructura y Mantenimiento</h4>
                </div>
                <div className="form-grid-2">
                  <div className="input-field-group">
                    <label>Tipo de Daño Físico *</label>
                    <select
                      value={infraTipoDano}
                      onChange={(e) => setInfraTipoDano(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Luminaria / Eléctrico">Luminaria / Falla Eléctrica</option>
                      <option value="Fontanería / Fuga Hidráulica">Fontanería / Fuga Hidráulica</option>
                      <option value="Cerrajería / Puertas / Ventanas">Cerrajería / Puertas / Ventanas</option>
                      <option value="Climatización / Aire Acondicionado">Climatización / Aire Acondicionado</option>
                      <option value="Estructural / Techos / Muros">Estructural / Techos / Muros</option>
                      <option value="Mobiliario / Butacas">Mobiliario de Aula / Butacas</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label>Nivel de Riesgo para las Personas *</label>
                    <select
                      value={infraNivelRiesgo}
                      onChange={(e) => setInfraNivelRiesgo(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Bajo">Bajo (Incomodidad leve)</option>
                      <option value="Moderado">Moderado (Requiere atención pronta)</option>
                      <option value="Alto">Alto (Riesgo potencial de accidente)</option>
                      <option value="Crítico - Inmediato">Crítico (Peligro inminente de cortocircuito o colapso)</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label>Elemento Físico Afectado</label>
                    <input
                      type="text"
                      placeholder="Ej. Tubería de sanitarios, Plafón pasillo este"
                      value={infraElemento}
                      onChange={(e) => setInfraElemento(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Materiales o Herramientas Sugeridas</label>
                    <input
                      type="text"
                      placeholder="Ej. Foco LED 40W, Llave de paso 1/2 pulgada"
                      value={infraMateriales}
                      onChange={(e) => setInfraMateriales(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group full-width">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={infraAcordonar}
                        onChange={(e) => setInfraAcordonar(e.target.checked)}
                      />
                      <span className="checkbox-text">
                        <b>¿Se requiere acordonamiento preventivo con cinta de precaución?</b>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DINÁMICA: SISTEMAS ACADÉMICOS */}
            {categoria === 'academico' && (
              <div className="dynamic-category-panel teal-tint">
                <div className="dynamic-panel-header">
                  <Icon name="graduation" size={20} color="#0d9488" />
                  <h4>Parámetros de Sistemas y Servicios Académicos</h4>
                </div>
                <div className="form-grid-2">
                  <div className="input-field-group">
                    <label>Plataforma o Sistema Escolar Afectado *</label>
                    <select
                      value={acadPlataforma}
                      onChange={(e) => setAcadPlataforma(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Moodle LMS">Moodle LMS (Campus Virtual)</option>
                      <option value="SIIA Calificaciones">SIIA (Sistema de Calificaciones y Actas)</option>
                      <option value="Correo Institucional">Correo Institucional @utm.edu.mx</option>
                      <option value="Biblioteca Digital">Biblioteca Digital y Repositorio</option>
                      <option value="Portal de Alumnos">Portal Web de Alumnos</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label>Tipo de Error Detectado *</label>
                    <select
                      value={acadTipoError}
                      onChange={(e) => setAcadTipoError(e.target.value)}
                      className="select-custom"
                    >
                      <option value="Acceso denegado / Error de credenciales">Acceso denegado / Error de credenciales</option>
                      <option value="Error 500 / Base de datos colapsada">Error 500 / Base de datos colapsada</option>
                      <option value="No permite subir actas o tareas">No permite subir actas o tareas</option>
                      <option value="Calificación o curso no visible">Calificación o curso no visible</option>
                      <option value="Lentitud extrema del servidor">Lentitud extrema del servidor</option>
                    </select>
                  </div>

                  <div className="input-field-group">
                    <label>Materia, Curso o Grupo Afectado</label>
                    <input
                      type="text"
                      placeholder="Ej. Cálculo Integral - Grupo 401-A"
                      value={acadCurso}
                      onChange={(e) => setAcadCurso(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Periodo Escolar</label>
                    <input
                      type="text"
                      value={acadPeriodo}
                      onChange={(e) => setAcadPeriodo(e.target.value)}
                    />
                  </div>

                  <div className="input-field-group">
                    <label>Estudiantes o Docentes Afectados</label>
                    <input
                      type="number"
                      min="1"
                      max="3000"
                      value={acadEstudiantesAfectados}
                      onChange={(e) => setAcadEstudiantesAfectados(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DE EVIDENCIAS ADJUNTAS */}
            <div className="evidencias-upload-section">
              <div className="evidencias-header">
                <div>
                  <h4>Evidencias Fotográficas y Documentos (Opcional)</h4>
                  <p>Adjunta fotos del daño, capturas de error o logs para acelerar el diagnóstico.</p>
                </div>
                <button type="button" className="btn-add-file" onClick={handleSimularArchivo}>
                  <Icon name="plus" size={15} />
                  <span>+ Simular Carga de Evidencia</span>
                </button>
              </div>

              {archivosSimulados.length > 0 && (
                <div className="archivos-chips-list">
                  {archivosSimulados.map((a) => (
                    <div key={a.id} className="archivo-chip">
                      <Icon name="file-text" size={15} color="#2563eb" />
                      <span>{a.nombre} ({a.peso})</span>
                      <button type="button" onClick={() => handleEliminarArchivo(a.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen Final de Enlace */}
            <div className="ticket-summary-pill">
              <Icon name="sparkles" size={18} color="#2563eb" />
              <div>
                <b>Se generará un documento NoSQL en MongoDB Atlas:</b>
                <p>
                  Título: <i>"{titulo}"</i> | Prioridad: <b>{prioridad.toUpperCase()}</b> | Ubicación: <b>{edificio} ({espacio})</b>
                </p>
              </div>
            </div>

            <div className="wizard-footer-actions">
              <button type="button" className="btn-secondary" onClick={() => setPaso(2)}>
                <Icon name="arrow-left" size={16} />
                <span>Anterior</span>
              </button>
              <button type="submit" className="btn-primary-glow">
                <Icon name="check" size={18} />
                <span>Registrar Incidencia Oficial</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
