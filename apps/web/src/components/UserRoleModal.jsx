import React, { useEffect, useRef, useState } from 'react';
import { CATEGORIAS_CONFIG } from '../mockData';
import { updateUserRole } from '../lib/api';

export default function UserRoleModal({ usuario, onClose, onActualizarUsuario, addToast }) {
  const [rol, setRol] = useState(usuario.rol);
  const [areas, setAreas] = useState(usuario.areas_autorizadas || []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const areasGuardadas = rol === 'reportante' ? [] : areas;
  const sinCambios = rol === usuario.rol &&
    [...areasGuardadas].sort().join(',') === [...(usuario.areas_autorizadas || [])].sort().join(',');

  useEffect(() => {
    const trigger = document.activeElement;
    dialogRef.current?.querySelector('select')?.focus();
    return () => trigger?.focus();
  }, []);

  const guardar = async event => {
    event.preventDefault();
    if (guardando || sinCambios) return;
    if (rol !== 'reportante' && areas.length === 0) {
      setError('Selecciona al menos un área autorizada.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const actualizado = await updateUserRole(usuario.id || usuario._id, { rol, areas_autorizadas: areasGuardadas });
      onActualizarUsuario(actualizado);
      addToast('Rol y áreas autorizadas guardados correctamente', 'success');
      onClose();
    } catch (failure) { setError(failure.message); }
    finally { setGuardando(false); }
  };

  const manejarTeclado = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (!guardando) onClose();
    }
    if (event.key === 'Tab') {
      const controls = dialogRef.current.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)');
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="modal-backdrop admin-role-backdrop" onClick={() => { if (!guardando) onClose(); }}>
      <form ref={dialogRef} className="modal-box admin-role-modal" role="dialog" aria-modal="true" aria-labelledby="user-role-title" aria-busy={guardando} onClick={event => event.stopPropagation()} onKeyDown={manejarTeclado} onSubmit={guardar}>
        <div className="modal-header">
          <div className="modal-title-with-icon"><div><h3 id="user-role-title">Cambiar rol y áreas</h3><small>{usuario.nombre}</small></div></div>
          <button type="button" className="modal-close-btn" disabled={guardando} onClick={onClose} aria-label="Cerrar edición de rol">✕</button>
        </div>
        <div className="input-field-group">
          <label htmlFor="user-role">Rol del usuario</label>
          <select id="user-role" className="select-custom" value={rol} disabled={guardando} onChange={event => { setRol(event.target.value); setError(''); }}>
            <option value="reportante">Reportante</option>
            <option value="tecnico">Técnico</option>
            <option value="coordinador">Coordinador</option>
          </select>
        </div>
        {rol !== 'reportante' ? (
          <fieldset className="admin-role-areas" disabled={guardando}>
            <legend>Áreas autorizadas (selecciona al menos una)</legend>
            {Object.values(CATEGORIAS_CONFIG).map(area => (
              <label key={area.id}>
                <input type="checkbox" checked={areas.includes(area.id)} onChange={event => {
                  setAreas(prev => event.target.checked ? [...prev, area.id] : prev.filter(id => id !== area.id));
                  setError('');
                }} />
                <span>{area.nombre}</span>
              </label>
            ))}
          </fieldset>
        ) : <p className="dash-card-subtitle">Los reportantes pueden registrar incidencias en cualquier área y no requieren áreas autorizadas.</p>}
        <p className="dash-card-subtitle admin-role-help">El usuario verá su nuevo panel al cerrar sesión y volver a entrar.</p>
        {error && <p className="exp-tags-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" disabled={guardando} onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando || sinCambios}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </div>
  );
}
