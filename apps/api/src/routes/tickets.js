const express = require('express');
const mongoose = require('mongoose');
const { Ticket, ESTADOS } = require('../models/Ticket');
const { User } = require('../models/User');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { validateTicketInput } = require('../utils/ticketRules');

const router = express.Router();

function ticketCode() {
  return `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
}

router.post('/', requireAuth, allowRoles('reportante'), async (req, res, next) => {
  try {
    const errors = validateTicketInput(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validación fallida', details: errors });

    const ticket = await Ticket.create({
      ...req.body,
      codigo: ticketCode(),
      asignacion: { area: req.body.categoria, tecnico_id: null },
      reportante: { usuario_id: req.user._id, nombre: req.user.nombre },
      estado: 'abierta',
      historial_seguimiento: [{ actor_id: req.user._id, accion: 'creacion', estado_anterior: null, estado_nuevo: 'abierta', comentario: 'Se recibió el reporte' }]
    });
    res.status(201).json(ticket);
  } catch (error) { next(error); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    for (const key of ['categoria', 'estado', 'prioridad']) if (req.query[key]) filter[key] = req.query[key];
    if (req.query.edificio) filter['ubicacion.edificio'] = req.query.edificio;
    if (req.user.rol === 'reportante') filter['reportante.usuario_id'] = req.user._id;
    if (req.user.rol === 'tecnico') filter['asignacion.tecnico_id'] = req.user._id;
    if (req.user.rol === 'coordinador') filter['asignacion.area'] = { $in: req.user.areas_autorizadas };
    const tickets = await Ticket.find(filter)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre')
      .sort({ fecha_creacion: -1 }).limit(100);
    res.json(tickets);
  } catch (error) { next(error); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre');
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const owner = ticket.reportante.usuario_id.equals(req.user._id);
    const technician = ticket.asignacion.tecnico_id?.equals(req.user._id);
    const areaAllowed = req.user.areas_autorizadas?.includes(ticket.asignacion.area);
    if (req.user.rol === 'reportante' && !owner) return res.status(403).json({ error: 'No puedes consultar este ticket' });
    if (req.user.rol === 'tecnico' && !technician) return res.status(403).json({ error: 'No puedes consultar este ticket' });
    if (req.user.rol === 'coordinador' && !areaAllowed) return res.status(403).json({ error: 'No puedes consultar este ticket' });
    res.json(ticket);
  } catch (error) { next(error); }
});

router.patch('/:id/asignacion', requireAuth, allowRoles('coordinador', 'administrador'), async (req, res, next) => {
  try {
    const { tecnico_id, prioridad, comentario = 'Ticket asignado' } = req.body;
    if (!mongoose.isValidObjectId(tecnico_id)) return res.status(400).json({ error: 'tecnico_id no válido' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (req.user.rol === 'coordinador' && !req.user.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(403).json({ error: 'Área no autorizada' });
    const tecnico = await User.findOne({ _id: tecnico_id, rol: 'tecnico', activo: true });
    if (!tecnico) return res.status(400).json({ error: 'El técnico seleccionado no está disponible' });
    if (!tecnico.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(400).json({ error: 'El técnico no está autorizado para el área del ticket' });
    if (prioridad) ticket.prioridad = prioridad;
    ticket.asignacion.tecnico_id = tecnico_id;
    ticket.historial_seguimiento.push({ actor_id: req.user._id, accion: 'asignacion', estado_anterior: ticket.estado, estado_nuevo: ticket.estado, comentario });
    await ticket.save();
    await ticket.populate('reportante.usuario_id', 'nombre correo');
    await ticket.populate('asignacion.tecnico_id', 'nombre correo');
    await ticket.populate('historial_seguimiento.actor_id', 'nombre');
    res.json(ticket);
  } catch (error) { next(error); }
});

router.patch('/:id/estado', requireAuth, allowRoles('tecnico', 'coordinador', 'administrador'), async (req, res, next) => {
  try {
    const { estado, comentario, horas_agregadas = 0 } = req.body;
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'estado no válido' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const isAssignedTech = ticket.asignacion.tecnico_id?.equals(req.user._id);
    const isAllowedCoordinator = req.user.rol !== 'coordinador' || req.user.areas_autorizadas.includes(ticket.asignacion.area);
    if (req.user.rol === 'tecnico' && !isAssignedTech) return res.status(403).json({ error: 'No tienes asignado este ticket' });
    if (!isAllowedCoordinator) return res.status(403).json({ error: 'Área no autorizada' });
    const previous = ticket.estado;
    ticket.estado = estado;
    if (estado === 'resuelta') ticket.fecha_resolucion = new Date();
    if (estado === 'en_proceso') ticket.fecha_resolucion = null;
    ticket.horas_invertidas += Number(horas_agregadas) || 0;
    ticket.historial_seguimiento.push({ actor_id: req.user._id, accion: 'cambio_estado', estado_anterior: previous, estado_nuevo: estado, comentario, horas_agregadas });
    await ticket.save();
    await ticket.populate('reportante.usuario_id', 'nombre correo');
    await ticket.populate('asignacion.tecnico_id', 'nombre correo');
    await ticket.populate('historial_seguimiento.actor_id', 'nombre');
    res.json(ticket);
  } catch (error) { next(error); }
});

module.exports = router;
