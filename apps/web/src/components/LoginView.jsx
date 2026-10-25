import React, { useState } from 'react';
import Icon from './Icons';
import { USUARIOS_DEMO } from '../mockData';

export default function LoginView({ onLoginSuccess, onBackToHome, addToast }) {
  const [correo, setCorreo] = useState('alumno.garcia@utm.edu.mx');
  const [password, setPassword] = useState('seguraUTM2026');
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const correoClean = correo.trim().toLowerCase();

    // Validar correo institucional
    if (!correoClean.endsWith('@utm.edu.mx')) {
      setErrorMsg('Debes ingresar un correo institucional válido con dominio @utm.edu.mx');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña institucional debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Buscar usuario en base de datos demo
      const userFound = USUARIOS_DEMO.find((u) => u.correo.toLowerCase() === correoClean);

      if (userFound) {
        if (!userFound.activo) {
          setErrorMsg('Esta cuenta institucional se encuentra suspendida o inactiva.');
          return;
        }
        addToast(`Bienvenido(a), ${userFound.nombre} (${userFound.rol.toUpperCase()})`, 'success');
        onLoginSuccess(userFound);
      } else {
        setErrorMsg('Credenciales no encontradas en el directorio universitario UTM. Prueba una de las cuentas demo.');
      }
    }, 600);
  };

  const handleSelectDemoUser = (userDemo) => {
    setCorreo(userDemo.correo);
    setPassword('seguraUTM2026');
    setErrorMsg('');
    addToast(`Credenciales cargadas para ${userDemo.nombre} (${userDemo.rol})`, 'info');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.endsWith('@utm.edu.mx')) {
      alert('Por favor introduce tu correo @utm.edu.mx');
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotModal(false);
      setForgotEmail('');
      addToast('Se enviaron las instrucciones a tu correo universitario', 'success');
    }, 2000);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-container">
        {/* Botón Volver */}
        <button className="login-back-btn" onClick={onBackToHome}>
          <Icon name="arrow-left" size={16} />
          <span>Volver al Portal Público</span>
        </button>

        <div className="login-main-card">
          {/* Header de la tarjeta */}
          <div className="login-header">
            <div className="login-brand-icon">
              <Icon name="building" size={26} color="#ffffff" />
            </div>
            <h2>Acceso a UTM Desk</h2>
            <p className="login-subtitle">
              Ingresa con tu correo institucional de la Universidad Tecnológica de la Mixteca.
            </p>
          </div>

          {/* Mensaje de error si existe */}
          {errorMsg && (
            <div className="login-alert-error">
              <Icon name="alert-triangle" size={18} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-field-group">
              <label>
                <span>Correo Institucional UTM</span>
                <span className="label-badge">@utm.edu.mx</span>
              </label>
              <div className="input-with-icon">
                <Icon name="mail" size={17} color="#64748b" />
                <input
                  type="email"
                  placeholder="ejemplo@utm.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-field-group">
              <div className="label-flex">
                <label>Contraseña</label>
                <button
                  type="button"
                  className="btn-forgot-link"
                  onClick={() => setShowForgotModal(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="input-with-icon">
                <Icon name="lock" size={17} color="#64748b" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} color="#64748b" />
                </button>
              </div>
            </div>

            <div className="login-checkbox-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                />
                <span className="checkbox-text">Recordar mi sesión en este equipo</span>
              </label>
              <span className="secure-badge">
                <Icon name="shield" size={12} color="#0d9488" />
                <span>SSL / NoSQL</span>
              </span>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icon name="refresh" size={17} className="animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión en el Portal</span>
                  <Icon name="arrow-right" size={17} />
                </>
              )}
            </button>
          </form>

          {/* Selector de Cuentas Demo de Prueba */}
          <div className="demo-accounts-box">
            <div className="demo-accounts-title">
              <Icon name="sparkles" size={14} color="#2563eb" />
              <span>Cuentas Universitarias de Prueba (1-Click)</span>
            </div>
            <p className="demo-accounts-hint">
              Haz clic en cualquiera para precargar credenciales autorizadas y acceder al dashboard de ese rol:
            </p>
            <div className="demo-accounts-grid">
              {USUARIOS_DEMO.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`demo-acc-btn ${correo === u.correo ? 'active-demo' : ''}`}
                  onClick={() => handleSelectDemoUser(u)}
                >
                  <div className="demo-acc-top">
                    <span className="demo-acc-avatar">{u.avatar}</span>
                    <span className={`role-badge role-${u.rol}`}>{u.rol.toUpperCase()}</span>
                  </div>
                  <b className="demo-acc-name">{u.nombre}</b>
                  <small className="demo-acc-email">{u.correo}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperar Contraseña */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Icon name="mail" size={20} color="#2563eb" />
                <h3>Recuperación de Contraseña</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>✕</button>
            </div>
            {forgotSuccess ? (
              <div className="modal-success-state">
                <Icon name="check-circle" size={40} color="#10b981" />
                <h4>¡Enlace enviado!</h4>
                <p>Revisa tu bandeja de entrada en @utm.edu.mx con el código de restablecimiento.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="modal-body-form">
                <p className="modal-instructions">
                  Escribe tu correo institucional. Te enviaremos un enlace seguro para restablecer tu clave mediante el servidor de directorio UTM.
                </p>
                <div className="input-field-group">
                  <label>Correo Institucional</label>
                  <div className="input-with-icon">
                    <Icon name="mail" size={17} color="#64748b" />
                    <input
                      type="email"
                      placeholder="tunombre@utm.edu.mx"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForgotModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Enviar Instrucciones
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
