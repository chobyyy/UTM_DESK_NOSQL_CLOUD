import React, { useEffect, useRef, useState } from 'react';
import { updateTicketPriority } from '../lib/api';

export default function PriorityModal({ ticket, onClose, onActualizarTicket, addToast, triggerRef }) {
  const [prioridad, setPrioridad] = useState(ticket.prioridad);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.querySelector('select')?.focus();
    const trigger = triggerRef.current;
    return () => trigger?.focus();
  }, [triggerRef]);

  const guardar = async event => {
    event.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      const actualizado = await updateTicketPriority(ticket.id, prioridad);
      onActualizarTicket(actualizado);
      addToast('Prioridad guardada correctamente', 'success');
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
      const controls = dialogRef.current.querySelectorAll('button:not(:disabled), select:not(:disabled)');
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="modal-backdrop priority-modal-backdrop" onClick={event => { event.stopPropagation(); if (!guardando) onClose(); }}>
      <form ref={dialogRef} className="modal-box priority-modal" role="dialog" aria-modal="true" aria-labelledby="priority-modal-title" aria-busy={guardando} onClick={event => event.stopPropagation()} onKeyDown={manejarTeclado} onSubmit={guardar}>
        <div className="modal-header">
          <div className="modal-title-with-icon"><div><h3 id="priority-modal-title">Asignar prioridad</h3><small>{ticket.codigo}</small></div></div>
          <button type="button" className="modal-close-btn" disabled={guardando} onClick={onClose} aria-label="Cerrar selección de prioridad">✕</button>
        </div>
        <div className="input-field-group">
          <label htmlFor="ticket-priority">Prioridad de la incidencia</label>
          <select id="ticket-priority" className="select-custom" value={prioridad} onChange={event => { setPrioridad(event.target.value); setError(''); }} disabled={guardando} required>
            <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Crítica</option>
          </select>
        </div>
        {error && <p className="exp-tags-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" disabled={guardando} onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando || prioridad === ticket.prioridad}>{guardando ? 'Guardando...' : 'Guardar prioridad'}</button>
        </div>
      </form>
    </div>
  );
}
