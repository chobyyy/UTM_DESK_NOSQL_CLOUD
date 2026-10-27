import React, { useState } from 'react';
import Icon from './Icons';
import { login, register, DEMO_PASSWORD } from '../lib/api';

const DEMO_ACCOUNTS = [
  {
    nombre: 'Ana Sofía García Mendoza',
    rol: 'Reportante · Alumna',
    correo: 'alumno.garcia@utm.edu.mx',
    iniciales: 'AG',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    nombre: 'Ing. Roberto Juárez Pérez',
    rol: 'Técnico · Cómputo y Redes',
    correo: 'ing.roberto.juarez@utm.edu.mx',
    iniciales: 'RJ',
    color: 'bg-cyan-100 text-cyan-700'
  },
  {
    nombre: 'Ing. Pedro Ruíz Zárate',
    rol: 'Técnico · Infraestructura',
    correo: 'ing.pedro.ruiz@utm.edu.mx',
    iniciales: 'PR',
    color: 'bg-amber-100 text-amber-700'
  },
  {
    nombre: 'Mtra. Elena Morales Ramos',
    rol: 'Coordinadora de TI',
    correo: 'coord.redes@utm.edu.mx',
    iniciales: 'EM',
    color: 'bg-violet-100 text-violet-700'
  },
  {
    nombre: 'Administrador General UTM',
    rol: 'Director / Administrador',
    correo: 'admin.dti@utm.edu.mx',
    iniciales: 'AD',
    color: 'bg-rose-100 text-rose-700'
  }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginView({ onLoginSuccess, onBackToHome, addToast }) {
  // Modo: 'login' | 'registro'
  const [modo, setModo] = useState('login');

  // Campos de Iniciar Sesión
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Campos de Crear Cuenta
  const [regNombre, setRegNombre] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regMatricula, setRegMatricula] = useState('');
  const [regCarrera, setRegCarrera] = useState('');
  const [regContrasena, setRegContrasena] = useState('');
  const [regConfirmar, setRegConfirmar] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Estados UI
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Manejador de Login
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = correo.trim().toLowerCase();
    const cleanPass = contrasena.trim();

    setError('');
    if (!cleanEmail || !cleanPass) {
      setError('Por favor ingresa tu correo y tu contraseña.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Ingresa una dirección de correo electrónico válida.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await login(cleanEmail, cleanPass);
      addToast(`Bienvenido(a) a UTM Desk, ${user.nombre}.`, 'success');
      onLoginSuccess(user, token, recordar);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Manejador de Registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanNombre = regNombre.trim();
    const cleanEmail = regCorreo.trim().toLowerCase();
    const cleanPass = regContrasena.trim();
    const cleanConf = regConfirmar.trim();

    setError('');

    if (!cleanNombre || !cleanEmail || !cleanPass) {
      setError('El nombre, correo y contraseña son campos obligatorios.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Ingresa un correo institucional o personal válido.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (cleanPass !== cleanConf) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await register({
        nombre: cleanNombre,
        correo: cleanEmail,
        contrasena: cleanPass,
        matricula: regMatricula.trim(),
        carrera: regCarrera.trim()
      });

      addToast(`¡Cuenta creada con éxito! Bienvenido(a), ${user.nombre}.`, 'success');
      onLoginSuccess(user, token, true);
    } catch (err) {
      setError(err.message || 'No fue posible completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  // Login rápido con cuenta de demostración oficial
  const handleQuickDemo = async (account) => {
    setModo('login');
    setCorreo(account.correo);
    setContrasena(DEMO_PASSWORD);
    setError('');
    setLoading(true);

    try {
      const { token, user } = await login(account.correo, DEMO_PASSWORD);
      addToast(`Sesión demo iniciada: ${account.nombre} (${account.rol})`, 'info');
      onLoginSuccess(user, token, true);
    } catch (err) {
      setError(err.message || 'Error con la cuenta de demostración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_34%),linear-gradient(135deg,_#f8fafc,_#eef4ff)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        {/* Botón de volver */}
        <button
          type="button"
          onClick={onBackToHome}
          className="mb-4 inline-flex items-center gap-2 self-start text-sm font-medium text-slate-600 transition hover:text-utm-700"
        >
          <Icon name="arrow-left" size={17} /> Volver al portal público
        </button>

        {/* Tarjeta Principal */}
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/10">
          
          {/* Header de la tarjeta */}
          <div className="border-b border-slate-100 px-6 pb-5 pt-7 text-center sm:px-10">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-utm-700 text-white shadow-lg shadow-blue-600/30">
              <Icon name="building" size={28} color="#ffffff" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              UTM Desk
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
              Sistema de Gestión y Seguimiento de Incidencias Institucionales
            </p>

            {/* Selector de Pestañas: Iniciar Sesión / Crear Cuenta */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setModo('login'); setError(''); }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  modo === 'login'
                    ? 'bg-white text-utm-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setModo('registro'); setError(''); }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  modo === 'registro'
                    ? 'bg-white text-utm-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          </div>

          {/* Banner de Errores */}
          {error && (
            <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:mx-10">
              <div className="flex items-start gap-2.5">
                <Icon name="alert-triangle" size={18} color="#dc2626" className="mt-0.5 shrink-0" />
                <div className="text-xs font-medium text-red-800">{error}</div>
              </div>
            </div>
          )}

          {/* ============================================================
              FORMULARIO 1: INICIAR SESIÓN
             ============================================================ */}
          {modo === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 px-6 py-6 sm:px-10">
              <div>
                <label htmlFor="login-correo" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Correo Electrónico
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="mail" size={18} color="#64748b" />
                  <input
                    id="login-correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@utm.edu.mx"
                    autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-contrasena" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Contraseña
                  </label>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="lock" size={18} color="#64748b" />
                  <input
                    id="login-contrasena"
                    type={showPassword ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Tu contraseña registrada"
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="rounded p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex cursor-pointer items-center gap-2 select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-utm-600 focus:ring-utm-600"
                  />
                  Recordar sesión en este equipo
                </label>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Icon name="shield" size={13} color="#10b981" /> Auth Seguro
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-utm-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-utm-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Icon name="refresh" size={17} className="animate-spin" /> Verificando credenciales…
                  </>
                ) : (
                  <>
                    Iniciar Sesión <Icon name="arrow-right" size={17} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                ¿Aún no tienes una cuenta registrada?{' '}
                <button
                  type="button"
                  onClick={() => { setModo('registro'); setError(''); }}
                  className="font-bold text-utm-700 hover:underline"
                >
                  Crea tu cuenta aquí
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              FORMULARIO 2: CREAR CUENTA
             ============================================================ */}
          {modo === 'registro' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 px-6 py-6 sm:px-10">
              <div>
                <label htmlFor="reg-nombre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Nombre Completo *
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="user" size={18} color="#64748b" />
                  <input
                    id="reg-nombre"
                    type="text"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Ej. Sofía Mendoza Martínez"
                    autoComplete="name"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-correo" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Correo Electrónico *
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="mail" size={18} color="#64748b" />
                  <input
                    id="reg-correo"
                    type="email"
                    value={regCorreo}
                    onChange={(e) => setRegCorreo(e.target.value)}
                    placeholder="usuario@utm.edu.mx o personal"
                    autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-matricula" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Matrícula / ID
                  </label>
                  <input
                    id="reg-matricula"
                    type="text"
                    value={regMatricula}
                    onChange={(e) => setRegMatricula(e.target.value)}
                    placeholder="Ej. 2024090123"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-utm-600 focus:bg-white focus:ring-4 focus:ring-utm-600/20 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="reg-carrera" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Carrera / Área
                  </label>
                  <input
                    id="reg-carrera"
                    type="text"
                    value={regCarrera}
                    onChange={(e) => setRegCarrera(e.target.value)}
                    placeholder="Ej. Ing. en Computación"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-utm-600 focus:bg-white focus:ring-4 focus:ring-utm-600/20 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-contrasena" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contraseña (mínimo 6 caracteres) *
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="lock" size={18} color="#64748b" />
                  <input
                    id="reg-contrasena"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regContrasena}
                    onChange={(e) => setRegContrasena(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="rounded p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Icon name={showRegPassword ? 'eye-off' : 'eye'} size={17} />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirmar" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Confirmar Contraseña *
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50/70 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:bg-white focus-within:ring-4">
                  <Icon name="lock" size={18} color="#64748b" />
                  <input
                    id="reg-confirmar"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmar}
                    onChange={(e) => setRegConfirmar(e.target.value)}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Icon name="refresh" size={17} className="animate-spin" /> Registrando cuenta…
                  </>
                ) : (
                  <>
                    Crear Cuenta y Entrar <Icon name="arrow-right" size={17} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                ¿Ya tienes una cuenta registrada?{' '}
                <button
                  type="button"
                  onClick={() => { setModo('login'); setError(''); }}
                  className="font-bold text-utm-700 hover:underline"
                >
                  Inicia sesión aquí
                </button>
              </div>
            </form>
          )}

          {/* ============================================================
              CUENTAS DE DEMOSTRACIÓN RÁPIDA (OFICIALES)
             ============================================================ */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  ⚡ Cuentas Universitarias de Prueba (1-Click)
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Acceso directo con roles del sistema (usa la clave institucional <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px] text-slate-800 font-bold">{DEMO_PASSWORD}</code>).
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.correo}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickDemo(account)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:opacity-60"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${account.color}`}>
                    {account.iniciales}
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate text-xs text-slate-800">{account.nombre}</b>
                    <small className="block truncate text-[11px] text-slate-500">{account.rol}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          UTM Desk NoSQL Cloud · Universidad Tecnológica de la Mixteca
        </p>
      </div>
    </section>
  );
}
