import React, { useState } from 'react';
import Icon from './Icons';
import { login } from '../lib/api';

const DEMO_PASSWORD = 'seguraUTM2026';
const DEMO_ACCOUNTS = [
  { nombre: 'Ana Sofía García Mendoza', rol: 'Reportante', correo: 'alumno.garcia@utm.edu.mx', iniciales: 'AG', color: 'bg-blue-100 text-blue-700' },
  { nombre: 'Ing. Roberto Juárez Pérez', rol: 'Técnico · Redes', correo: 'ing.roberto.juarez@utm.edu.mx', iniciales: 'RJ', color: 'bg-cyan-100 text-cyan-700' },
  { nombre: 'Ing. Pedro Ruíz Zárate', rol: 'Técnico · Infraestructura', correo: 'ing.pedro.ruiz@utm.edu.mx', iniciales: 'PR', color: 'bg-amber-100 text-amber-700' },
  { nombre: 'Mtra. Elena Morales Ramos', rol: 'Coordinadora', correo: 'coord.redes@utm.edu.mx', iniciales: 'EM', color: 'bg-violet-100 text-violet-700' },
  { nombre: 'Administrador General', rol: 'Administrador', correo: 'admin.dti@utm.edu.mx', iniciales: 'AD', color: 'bg-rose-100 text-rose-700' }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginView({ onLoginSuccess, onBackToHome, addToast }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (email = correo, password = contrasena) => {
    const cleanEmail = email.trim().toLowerCase();
    setError('');
    if (!cleanEmail || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await login(cleanEmail, password);
      addToast(`Bienvenido(a), ${user.nombre}.`, 'success');
      onLoginSuccess(user, token, recordar);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitLogin();
  };

  const oneClickLogin = (account) => {
    setCorreo(account.correo);
    setContrasena(DEMO_PASSWORD);
    submitLogin(account.correo, DEMO_PASSWORD);
  };

  return (
    <section className="min-h-screen bg-slate-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_34%),linear-gradient(135deg,_#f8fafc,_#eef4ff)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <button type="button" onClick={onBackToHome} className="mb-5 inline-flex items-center gap-2 self-start text-sm font-medium text-slate-600 transition hover:text-utm-700">
          <Icon name="arrow-left" size={17} /> Volver al portal público
        </button>

        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/10">
          <div className="border-b border-slate-100 px-6 pb-6 pt-8 text-center sm:px-10">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-utm-700 shadow-lg shadow-blue-600/30">
              <Icon name="building" size={28} color="#ffffff" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acceso a UTM Desk</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Ingresa con tu correo y contraseña para acceder a la plataforma.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-10">
            {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><Icon name="alert-triangle" size={19} color="#dc2626" /><span>{error}</span></div>}

            <div>
              <div className="mb-2 flex items-center justify-between"><label htmlFor="correo" className="text-sm font-semibold text-slate-700">Correo electrónico</label></div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:ring-4"><Icon name="mail" size={18} color="#64748b" /><input id="correo" type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} placeholder="ejemplo@correo.com" autoComplete="email" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required /></div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4"><label htmlFor="contrasena" className="text-sm font-semibold text-slate-700">Contraseña</label><button type="button" className="text-xs font-semibold text-utm-700 hover:text-utm-900 hover:underline">¿Olvidaste tu contraseña?</button></div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3 ring-utm-600/20 transition focus-within:border-utm-600 focus-within:ring-4"><Icon name="lock" size={18} color="#64748b" /><input id="contrasena" type={showPassword ? 'text' : 'password'} value={contrasena} onChange={(event) => setContrasena(event.target.value)} placeholder="Introduce tu contraseña" autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded p-1 text-slate-500 hover:bg-slate-200" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icon name={showPassword ? 'eye-off' : 'eye'} size={18} /></button></div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600"><input type="checkbox" checked={recordar} onChange={(event) => setRecordar(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-utm-600 focus:ring-utm-600" />Recordar mi sesión en este equipo</label>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-medium text-emerald-700"><Icon name="shield" size={13} /> SSL / NoSQL</span>
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-utm-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-utm-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70">
              {loading ? <><Icon name="refresh" size={18} className="animate-spin" /> Verificando credenciales…</> : <>Iniciar Sesión en el Portal <Icon name="arrow-right" size={18} /></>}
            </button>
          </form>

          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-6 sm:px-10">
            <h2 className="text-sm font-bold text-slate-800">✨ Cuentas Universitarias de Prueba (1-Click)</h2>
            <p className="mt-1 text-xs text-slate-500">Usan la contraseña de demostración configurada en el servidor.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => <button key={account.correo} type="button" disabled={loading} onClick={() => oneClickLogin(account)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:opacity-60"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${account.color}`}>{account.iniciales}</span><span className="min-w-0"><b className="block truncate text-xs text-slate-800">{account.nombre}</b><small className="block truncate text-[11px] text-slate-500">{account.rol}</small></span></button>)}
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">Acceso protegido para la comunidad universitaria UTM.</p>
      </div>
    </section>
  );
}
