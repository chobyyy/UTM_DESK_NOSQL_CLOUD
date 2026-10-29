const express = require('express');
const mongoose = require('mongoose');
const { Ticket, ESTADOS, PRIORIDADES } = require('../models/Ticket');
const { User } = require('../models/User');
const { TechnicalEvidence } = require('../models/TechnicalEvidence');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { validateTicketInput } = require('../utils/ticketRules');

const { validatePhotos } = require('../utils/photos');
const { updateTicketWithEvent } = require('../utils/ticketUpdates');
const { decodeEvidence, ensureEvidenceStorage, withTechnicalEvidence, MAX_TICKET_FILES } = require('../utils/technicalEvidence');

const router = express.Router();

function ticketCode() {
  return `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
}

router.post('/', requireAuth, allowRoles('reportante'), async (req, res, next) => {
  try {
    if (req.body.prioridad !== undefined) return res.status(403).json({ error: 'La prioridad la asigna la coordinación. Envía el reporte sin ese campo' });
    if (req.body.tags !== undefined && (!Array.isArray(req.body.tags) || req.body.tags.length)) return res.status(403).json({ error: 'Solo el coordinador y el administrador pueden asignar etiquetas' });
    const photoError = validatePhotos(req.body.evidencias_adjuntas);
    if (photoError) return res.status(400).json({ error: photoError });
    const errors = validateTicketInput(req.body);
    if (errors.length) return res.status(400).json({ error: 'Validación fallida', details: errors });

    const ticket = await Ticket.create({
      ...req.body,
      prioridad: 'media',
      tags: [],
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
    res.json(await withTechnicalEvidence(tickets));
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
    res.json(await withTechnicalEvidence(ticket));
  } catch (error) { next(error); }
});

router.patch('/:id/asignacion', requireAuth, allowRoles('coordinador', 'administrador'), async (req, res, next) => {
  try {
    const { tecnico_id, prioridad, comentario = 'Ticket asignado' } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador de incidencia no válido' });
    if (!mongoose.isValidObjectId(tecnico_id)) return res.status(400).json({ error: 'tecnico_id no válido' });
    if (prioridad !== undefined && !PRIORIDADES.includes(prioridad)) return res.status(400).json({ error: 'Selecciona una prioridad válida' });
    if (typeof comentario !== 'string' || comentario.trim().length > 2000) return res.status(400).json({ error: 'El comentario debe ser un texto de máximo 2000 caracteres' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (req.user.rol === 'coordinador' && !req.user.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(403).json({ error: 'Área no autorizada' });
    const tecnico = await User.findOne({ _id: tecnico_id, rol: 'tecnico', activo: true });
    if (!tecnico) return res.status(400).json({ error: 'El técnico seleccionado no está disponible' });
    if (!tecnico.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(400).json({ error: 'El técnico no está autorizado para el área del ticket' });
    const fields = {
      'asignacion.tecnico_id': tecnico._id,
      ...(prioridad !== undefined ? { prioridad } : {})
    };
    if (ticket.get('version') !== undefined) {
      fields['asignacion.asignado_por'] = req.user._id;
      fields['asignacion.fecha_asignacion'] = new Date();
    }
    const result = await updateTicketWithEvent(ticket, {
      actorId: req.user._id, accion: 'asignacion',
      comentario: comentario.trim() || 'Ticket asignado', fields
    });
    if (!result.matchedCount) return res.status(409).json({ error: 'La incidencia cambió mientras asignabas el técnico. Vuelve a abrirla antes de confirmar' });
    const actualizado = await Ticket.findById(ticket._id)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre');
    res.json(await withTechnicalEvidence(actualizado));
  } catch (error) { next(error); }
});

router.patch('/:id/prioridad', requireAuth, allowRoles('coordinador', 'administrador'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador de incidencia no válido' });
    const { prioridad } = req.body;
    if (!PRIORIDADES.includes(prioridad)) return res.status(400).json({ error: 'Selecciona una prioridad válida' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (req.user.rol === 'coordinador' && !req.user.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(403).json({ error: 'Área no autorizada' });
    if (ticket.prioridad !== prioridad) {
      const result = await updateTicketWithEvent(ticket, {
        actorId: req.user._id, accion: 'comentario',
        comentario: `Prioridad actualizada de ${ticket.prioridad.toUpperCase()} a ${prioridad.toUpperCase()}`,
        fields: { prioridad }
      });
      if (!result.matchedCount) return res.status(409).json({ error: 'La incidencia cambió mientras editabas. Vuelve a abrirla antes de guardar la prioridad' });
    }
    const actualizado = await Ticket.findById(ticket._id)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre');
    res.json(await withTechnicalEvidence(actualizado));
  } catch (error) { next(error); }
});

router.patch('/:id/estado', requireAuth, allowRoles('tecnico', 'coordinador', 'administrador'), async (req, res, next) => {
  try {
    const { estado, comentario, horas_agregadas = 0 } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador de incidencia no válido' });
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'estado no válido' });
    if (typeof comentario !== 'string' || !comentario.trim() || comentario.trim().length > 2000) return res.status(400).json({ error: 'Escribe una nota de entre 1 y 2000 caracteres' });
    if (typeof horas_agregadas !== 'number' || !Number.isFinite(horas_agregadas) || horas_agregadas < 0 || horas_agregadas > 24) return res.status(400).json({ error: 'Las horas adicionales deben ser un número entre 0 y 24' });
    if (['resuelta', 'cerrada'].includes(estado) && comentario.trim().length < 5) return res.status(400).json({ error: 'Describe la solución con al menos 5 caracteres' });
    const files = decodeEvidence(req.body.evidencias_adjuntas);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const isAssignedTech = ticket.asignacion.tecnico_id?.equals(req.user._id);
    const isAllowedCoordinator = req.user.rol !== 'coordinador' || req.user.areas_autorizadas.includes(ticket.asignacion.area);
    if (req.user.rol === 'tecnico' && !isAssignedTech) return res.status(403).json({ error: 'No tienes asignado este ticket' });
    if (!isAllowedCoordinator) return res.status(403).json({ error: 'Área no autorizada' });
    if (estado !== 'abierta' && !ticket.asignacion.tecnico_id) return res.status(400).json({ error: 'Asigna un técnico antes de registrar el avance' });
    const antiguo = ticket.get('version') !== undefined;
    const estadoGuardado = antiguo ? estado.replaceAll('_', ' ') : estado;
    const finalizado = ['resuelta', 'cerrada'].includes(estado);
    const fields = {
      estado: estadoGuardado,
      horas_invertidas: Number(ticket.horas_invertidas || 0) + horas_agregadas,
      fecha_resolucion: finalizado ? ticket.fecha_resolucion || new Date() : null,
      ...(antiguo ? { resultado: finalizado ? comentario.trim() : null, fecha_cierre: estado === 'cerrada' ? new Date() : null } : {})
    };
    const saveAdvance = async session => {
      const result = await updateTicketWithEvent(ticket, {
        actorId: req.user._id, accion: 'cambio_estado', comentario: comentario.trim(), fields,
        estadoNuevo: estadoGuardado, horasAgregadas: horas_agregadas, session
      });
      if (!result.matchedCount) throw Object.assign(new Error('La incidencia cambió mientras editabas. Vuelve a abrirla antes de guardar el avance'), { statusCode: 409 });
      if (files.length) {
        const count = await TechnicalEvidence.countDocuments({ ticket_id: ticket._id }).session(session);
        if (count + files.length > MAX_TICKET_FILES) throw Object.assign(new Error('La incidencia admite hasta 20 evidencias técnicas'), { statusCode: 400 });
        await TechnicalEvidence.insertMany(files.map(file => ({ ...file, ticket_id: ticket._id, subido_por: req.user._id })), { session });
      }
    };
    if (files.length) {
      await ensureEvidenceStorage();
      await mongoose.connection.transaction(saveAdvance);
    } else { await saveAdvance(); }
    const actualizado = await Ticket.findById(ticket._id)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre');
    res.json(await withTechnicalEvidence(actualizado));
  } catch (error) { next(error); }
});

router.patch('/:id/tags', requireAuth, allowRoles('coordinador', 'administrador'), async (req, res, next) => {
  try {
    const { tags } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Identificador de incidencia no válido' });
    if (!Array.isArray(tags) || tags.length > 20 || tags.some(tag => typeof tag !== 'string')) return res.status(400).json({ error: 'Ingresa hasta 20 etiquetas' });
    const etiquetas = [...new Set(tags.map(tag => tag.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '-')))];
    if (etiquetas.some(tag => tag.length < 2 || tag.length > 40 || !/^[a-z0-9_áéíóúñ-]+$/.test(tag))) {
      return res.status(400).json({ error: 'Cada etiqueta debe tener de 2 a 40 caracteres: letras, números, guiones o guiones bajos' });
    }
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (req.user.rol === 'coordinador' && !req.user.areas_autorizadas.includes(ticket.asignacion.area)) return res.status(403).json({ error: 'Área no autorizada' });
    const result = await updateTicketWithEvent(ticket, {
      actorId: req.user._id, accion: 'etiquetas',
      comentario: 'Etiquetas actualizadas', fields: { tags: etiquetas }
    });
    if (!result.matchedCount) return res.status(409).json({ error: 'La incidencia cambió mientras editabas. Vuelve a abrirla antes de guardar las etiquetas' });
    const actualizado = await Ticket.findById(ticket._id)
      .populate('reportante.usuario_id', 'nombre correo')
      .populate('asignacion.tecnico_id', 'nombre correo')
      .populate('historial_seguimiento.actor_id', 'nombre');
    res.json(await withTechnicalEvidence(actualizado));
  } catch (error) { next(error); }
});

router.get('/:id/evidencias/:evidenciaId', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.evidenciaId)) return res.status(400).json({ error: 'Identificador de evidencia no válido' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const owner = ticket.reportante.usuario_id?.equals(req.user._id);
    const assigned = ticket.asignacion.tecnico_id?.equals(req.user._id);
    const areaAllowed = req.user.areas_autorizadas?.includes(ticket.asignacion.area);
    if ((req.user.rol === 'reportante' && !owner) || (req.user.rol === 'tecnico' && !assigned) || (req.user.rol === 'coordinador' && !areaAllowed)) return res.status(403).json({ error: 'No puedes consultar esta evidencia' });
    const file = await TechnicalEvidence.findOne({ _id: req.params.evidenciaId, ticket_id: ticket._id }).select('+contenido');
    if (!file) return res.status(404).json({ error: 'Evidencia no encontrada' });
    res.attachment(file.nombre_archivo).type(file.tipo_mime)
      .set('X-Content-Type-Options', 'nosniff').set('Cache-Control', 'private, no-store').send(Buffer.from(file.contenido));
  } catch (error) { next(error); }
});

module.exports = router;
