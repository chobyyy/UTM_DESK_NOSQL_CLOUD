import React, { useRef, useState } from 'react';
import Icon from './Icons';
import { CATEGORIAS_CONFIG, EDIFICIOS_UTM } from '../mockData';
import { createTicket } from '../lib/api';

export default function CrearIncidenciaView({ user, onTicketCreado, onCancelar, addToast }) {
  const [categoria, setCategoria] = useState('computo_redes');
  const [paso, setPaso] = useState(1);

  // Campos Generales
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [edificio, setEdificio] = useState(EDIFICIOS_UTM[0]);
  const [espacio, setEspacio] = useState('');


  const [fotos, setFotos] = useState([]);
  const [leyendoFotos, setLeyendoFotos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const selectorFotos = useRef(null);
  const handleSeleccionarFotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length + fotos.length > 3) return addToast('Puedes adjuntar hasta 3 fotos.', 'error');
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 2 * 1024 * 1024)) return addToast('Selecciona fotos JPEG, PNG o WebP de hasta 2 MB cada una.', 'error');
    setLeyendoFotos(true);
    try {
      const nuevas = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer la foto.'));
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
          image.onload = () => resolve({ nombre_archivo: file.name, tipo_mime: file.type, peso_kb: file.size / 1024, url_storage: reader.result });
          image.src = reader.result;
        };
        reader.readAsDataURL(file);
      })));
      setFotos(prev => [...prev, ...nuevas]);
    } catch (error) { addToast(error.message, 'error'); }
    finally { setLeyendoFotos(false); }
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

  const handleFinalizarSubmit = async (e) => {
    e.preventDefault();

    if (guardando || leyendoFotos) return;
    if (!titulo.trim() || !descripcion.trim() || !espacio.trim()) {
      addToast('Completa el título, la descripción y la ubicación.', 'error');
      setPaso(2);
      return;
    }

    const nuevoTicket = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      prioridad,
      ubicacion: {
        edificio,
        espacio: espacio.trim()
      },
      detalle_especifico: {},
      evidencias_adjuntas: fotos,
    };
    try {
      setGuardando(true);
      const ticketCreado = await createTicket(nuevoTicket);
      onTicketCreado(ticketCreado);
      addToast(`¡Incidencia ${ticketCreado.codigo} creada con éxito!`, 'success');
    } catch (error) {
      addToast(`No fue posible registrar la incidencia: ${error.message}`, 'error');
    } finally {
      setGuardando(false);
    }
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
            Cuéntanos qué sucede y dónde. El equipo responsable revisará los detalles técnicos.
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
            <span>3. Fotos y confirmación</span>
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
                  maxLength={5000}
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


            </div>

            <div className="wizard-footer-actions">
              <button type="button" className="btn-secondary" onClick={() => setPaso(1)}>
                <Icon name="arrow-left" size={16} />
                <span>Anterior</span>
              </button>
              <button type="button" className="btn-primary" onClick={handleValidarPaso2}>
                <span>Continuar a Fotos y Confirmación</span>
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
              <h3>Paso 3: Fotos y confirmación</h3>
              <p>
                Puedes adjuntar fotos de lo que observas. No necesitas conocer datos técnicos.
              </p>
            </div>

            <div className="evidencias-upload-section">
              <div className="evidencias-header">
                <div>
                  <h4>Evidencias fotográficas (Opcional)</h4>
                  <p>Hasta 3 fotos JPEG, PNG o WebP de 2 MB cada una.</p>
                </div>
                <input ref={selectorFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleSeleccionarFotos} />
                <button type="button" className="btn-add-file" disabled={guardando || leyendoFotos || fotos.length >= 3} onClick={() => selectorFotos.current.click()}>
                  <Icon name="plus" size={15} />
                  <span>{leyendoFotos ? 'Leyendo fotos...' : 'Adjuntar fotos'}</span>
                </button>
              </div>
              <div className="archivos-chips-list">
                {fotos.map((foto, index) => (
                  <div key={index} className="archivo-chip">
                    <img src={foto.url_storage} alt={foto.nombre_archivo} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />
                    <span>{foto.nombre_archivo} ({Math.round(foto.peso_kb)} KB)</span>
                    <button type="button" disabled={guardando} aria-label={'Eliminar ' + foto.nombre_archivo} onClick={() => setFotos(prev => prev.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen Final de Enlace */}
            <div className="ticket-summary-pill">
              <Icon name="sparkles" size={18} color="#2563eb" />
              <div>
                <b>Revisa tu reporte antes de enviarlo:</b>
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
              <button type="submit" className="btn-primary-glow" disabled={guardando || leyendoFotos}>
                <Icon name="check" size={18} />
                <span>{guardando ? 'Registrando…' : 'Registrar Incidencia Oficial'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
