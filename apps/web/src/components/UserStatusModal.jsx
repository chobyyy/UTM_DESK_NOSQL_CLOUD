import React, { useEffect, useRef, useState } from 'react';
import { updateUserStatus } from '../lib/api';

export default function UserStatusModal({ usuario, onClose, onActualizarUsuario, addToast }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const suspender = usuario.activo;

  useEffect(() => {
    const trigger = document.activeElement;
    dialogRef.current?.querySelector('[data-cancel]')?.focus();
    return () => trigger?.focus();
  }, []);

  const guardar = async event => {
    event.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      const actualizado = await updateUserStatus(usuario.id || usuario._id, !suspender);
      onActualizarUsuario(actualizado);
      addToast(suspender ? 'Cuenta suspendida correctamente' : 'Cuenta reactivada correctamente', 'success');
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
      const controls = dialogRef.current.querySelectorAll('button:not(:disabled)');
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="modal-backdrop admin-role-backdrop" onClick={() => { if (!guardando) onClose(); }}>
      <form ref={dialogRef} className="modal-box admin-role-modal" role="dialog" aria-modal="true" aria-labelledby="user-status-title" aria-describedby="user-status-description" aria-busy={guardando} onClick={event => event.stopPropagation()} onKeyDown={manejarTeclado} onSubmit={guardar}>
        <div className="modal-header">
          <div className="modal-title-with-icon"><div><h3 id="user-status-title">{suspender ? 'Suspender cuenta' : 'Reactivar cuenta'}</h3><small>{usuario.nombre}</small></div></div>
          <button type="button" className="modal-close-btn" disabled={guardando} onClick={onClose} aria-label="Cerrar cambio de estado">✕</button>
        </div>
        <p id="user-status-description" className="admin-status-description">
          {suspender
            ? 'La cuenta no podrá iniciar sesión ni realizar acciones en el sistema mientras esté suspendida. Sus incidencias y datos se conservarán. Puedes reactivarla desde este directorio.'
            : 'La cuenta podrá volver a iniciar sesión con su mismo correo y contraseña, conservando su rol y sus áreas autorizadas.'}
        </p>
        {error && <p className="exp-tags-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" data-cancel disabled={guardando} onClick={onClose}>Cancelar</button>
          <button type="submit" className={`btn-primary ${suspender ? 'admin-suspend-confirm' : ''}`} disabled={guardando}>
            {guardando ? 'Guardando...' : suspender ? 'Confirmar suspensión' : 'Reactivar cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
}
