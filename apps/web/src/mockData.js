// Datos iniciales realistas para el prototipo UTM Desk NoSQL Cloud

export const ROLES = {
  REPORTANTE: 'reportante',
  TECNICO: 'tecnico',
  COORDINADOR: 'coordinador',
  ADMINISTRADOR: 'administrador'
};

export const USUARIOS_DEMO = [
  {
    id: 'usr-1',
    nombre: 'Ana Sofía García Mendoza',
    correo: 'alumno.garcia@utm.edu.mx',
    rol: ROLES.REPORTANTE,
    matricula: '2023020045',
    carrera: 'Ingeniería en Computación',
    avatar: 'AG',
    activo: true
  },
  {
    id: 'usr-2',
    nombre: 'Ing. Roberto Juárez Pérez',
    correo: 'ing.roberto.juarez@utm.edu.mx',
    rol: ROLES.TECNICO,
    especialidad: 'Redes y Telecomunicaciones',
    area: 'computo_redes',
    avatar: 'RJ',
    activo: true
  },
  {
    id: 'usr-3',
    nombre: 'Ing. Pedro Ruiz Zárate',
    correo: 'ing.pedro.ruiz@utm.edu.mx',
    rol: ROLES.TECNICO,
    especialidad: 'Infraestructura Eléctrica y Climas',
    area: 'infraestructura',
    avatar: 'PR',
    activo: true
  },
  {
    id: 'usr-4',
    nombre: 'Mtra. Elena Morales Ramos',
    correo: 'coord.redes@utm.edu.mx',
    rol: ROLES.COORDINADOR,
    areaAsignada: 'computo_redes',
    cargo: 'Coordinadora de Tecnologías de Información',
    avatar: 'EM',
    activo: true
  },
  {
    id: 'usr-5',
    nombre: 'Dr. Alejandro Benítez Cruz',
    correo: 'admin.dti@utm.edu.mx',
    rol: ROLES.ADMINISTRADOR,
    cargo: 'Director DTI · Administrador General',
    avatar: 'AB',
    activo: true
  }
];

export const CATEGORIAS_CONFIG = {
  computo_redes: {
    id: 'computo_redes',
    nombre: 'Cómputo y Telecomunicaciones',
    icono: 'Laptop',
    emoji: '💻',
    color: '#2563eb',
    colorSuave: '#eff6ff',
    bordeColor: '#93c5fd',
    descripcion: 'Red Wi-Fi institucional, cableado estructurado, laboratorios de cómputo, servidores, telefonía IP y proyectores.',
    responsable: 'Mtra. Elena Morales (Coordinadora DTI)'
  },
  infraestructura: {
    id: 'infraestructura',
    nombre: 'Infraestructura y Mantenimiento',
    icono: 'Wrench',
    emoji: '🏗️',
    color: '#0284c7',
    colorSuave: '#f0f9ff',
    bordeColor: '#7dd3fc',
    descripcion: 'Instalaciones eléctricas, luminarias, fontanería, cerrajería, impermeabilización, mobiliario y climatización.',
    responsable: 'Ing. Fernando Castillo (Coord. Servicios Generales)'
  },
  academico: {
    id: 'academico',
    nombre: 'Sistemas y Servicios Académicos',
    icono: 'GraduationCap',
    emoji: '📚',
    color: '#0d9488',
    colorSuave: '#f0fdfa',
    bordeColor: '#99f6e4',
    descripcion: 'Plataforma Moodle LMS, Sistema de Calificaciones SIIA, correo institucional, biblioteca digital y credencialización.',
    responsable: 'Lic. Patricia Salinas (Coord. Servicios Escolares)'
  }
};

export const EDIFICIOS_UTM = [
  'Edificio A (Aulas y Rectoría)',
  'Edificio B (Aulas de Docencia)',
  'Edificio C (Laboratorios de Cómputo)',
  'Edificio D (Electrónica y Mecatrónica)',
  'Biblioteca Central Universitaria',
  'Edificio de Servicios Escolares (SIIA)',
  'Auditorio Principal Paraninfo',
  'Cafetería y Áreas Comunes'
];

export const TICKETS_INICIALES = [
  {
    id: 't-101',
    codigo: 'INC-2026-0042',
    titulo: 'Pérdida de conectividad Wi-Fi institucional en Laboratorio C-204',
    descripcion: 'Durante la sesión práctica de Redes Avanzadas, los 35 equipos perdieron conexión simultáneamente. El access point principal parpadea en color ámbar persistente.',
    categoria: 'computo_redes',
    prioridad: 'alta',
    estado: 'en_proceso',
    reportante: {
      id: 'usr-1',
      nombre: 'Ana Sofía García Mendoza',
      correo: 'alumno.garcia@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Edificio C (Laboratorios de Cómputo)',
      espacio: 'Laboratorio de Redes C-204'
    },
    asignacion: {
      area: 'computo_redes',
      tecnicoId: 'usr-2',
      tecnicoNombre: 'Ing. Roberto Juárez Pérez'
    },
    detalle_especifico: {
      tipo_falla: 'Conectividad inalámbrica (AP saturado/desconectado)',
      equipo: 'Access Point Cisco Catalyst 9120',
      inventario: 'UTM-DTI-AP-0982',
      direccion_ip: '10.15.42.1',
      dispositivos_afectados: 35
    },
    tags: ['wifi', 'laboratorio', 'cisco', 'docencia'],
    horas_invertidas: 3.5,
    fecha_creacion: '2026-10-21T09:30:00Z',
    fecha_actualizacion: '2026-10-22T14:15:00Z',
    fecha_resolucion: null,
    evidencias: [
      { id: 'ev-1', nombre: 'ap_led_status_amber.jpg', peso: '2.4 MB', fecha: '2026-10-21' },
      { id: 'ev-2', nombre: 'ping_test_packet_loss.png', peso: '450 KB', fecha: '2026-10-21' }
    ],
    historial: [
      {
        id: 'h-1',
        fecha: '2026-10-21T09:30:00Z',
        actor: 'Ana Sofía García (Reportante)',
        accion: 'Reporte registrado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Reporte iniciado desde el portal de alumnos durante práctica docente.',
        horas: 0
      },
      {
        id: 'h-2',
        fecha: '2026-10-21T10:15:00Z',
        actor: 'Mtra. Elena Morales (Coordinadora)',
        accion: 'Asignación técnica',
        estadoAnterior: 'abierta',
        estadoNuevo: 'en_proceso',
        comentario: 'Se asigna al Ing. Roberto Juárez con prioridad Alta por tratarse de aula en horario activo.',
        horas: 0
      },
      {
        id: 'h-3',
        fecha: '2026-10-21T15:20:00Z',
        actor: 'Ing. Roberto Juárez (Técnico)',
        accion: 'Diagnóstico en sitio',
        estadoAnterior: 'en_proceso',
        estadoNuevo: 'en_proceso',
        comentario: 'Se verificó corte en el switch PoE del rack C2. Se reinició puerto y se actualizó firmware. Monitoreando estabilidad.',
        horas: 3.5
      }
    ]
  },
  {
    id: 't-102',
    codigo: 'INC-2026-0040',
    titulo: 'Fuga de agua en tubería principal de sanitarios de planta alta',
    descripcion: 'Se reporta escurrimiento de agua constante por el plafón del pasillo este hacia el piso inferior. Hay riesgo de daño al cableado eléctrico superficial.',
    categoria: 'infraestructura',
    prioridad: 'critica',
    estado: 'en_proceso',
    reportante: {
      id: 'usr-6',
      nombre: 'Prof. Carlos Salgado Ruiz',
      correo: 'prof.salgado@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Edificio B (Aulas de Docencia)',
      espacio: 'Sanitarios Planta Alta y Pasillo Este'
    },
    asignacion: {
      area: 'infraestructura',
      tecnicoId: 'usr-3',
      tecnicoNombre: 'Ing. Pedro Ruiz Zárate'
    },
    detalle_especifico: {
      tipo_dano: 'Fuga hidráulica con filtración a plafón',
      nivel_riesgo: 'Crítico - Riesgo de cortocircuito y resbalón',
      elemento_afectado: 'Tubería de cobre 1" y plafón falso',
      materiales_requeridos: 'Codo cobre 1", soldadura estaño, 4 placas de plafón acústico',
      requiere_acordonar: 'Sí, zona acordonada de inmediato'
    },
    tags: ['fuga', 'plomeria', 'seguridad', 'acordonado'],
    horas_invertidas: 5.0,
    fecha_creacion: '2026-10-20T08:10:00Z',
    fecha_actualizacion: '2026-10-22T11:00:00Z',
    fecha_resolucion: null,
    evidencias: [
      { id: 'ev-3', nombre: 'fuga_sanitarios_plafon.jpg', peso: '3.1 MB', fecha: '2026-10-20' }
    ],
    historial: [
      {
        id: 'h-4',
        fecha: '2026-10-20T08:10:00Z',
        actor: 'Prof. Carlos Salgado (Reportante)',
        accion: 'Reporte de emergencia creado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Agua goteando sobre el pasillo en cambio de hora.',
        horas: 0
      },
      {
        id: 'h-5',
        fecha: '2026-10-20T08:25:00Z',
        actor: 'Ing. Pedro Ruiz (Técnico)',
        accion: 'Cierre de válvula de paso',
        estadoAnterior: 'abierta',
        estadoNuevo: 'en_proceso',
        comentario: 'Se cerró la llave general y se colocó cinta de precaución. Se programa reemplazo de sección de tubería.',
        horas: 5.0
      }
    ]
  },
  {
    id: 't-103',
    codigo: 'INC-2026-0038',
    titulo: 'Error 500 al subir actas finales en sistema de calificaciones SIIA',
    descripcion: 'Al intentar asentar calificaciones ordinarias del segundo parcial de Cálculo Integral, la plataforma expira con error interno de base de datos.',
    categoria: 'academico',
    prioridad: 'alta',
    estado: 'abierta',
    reportante: {
      id: 'usr-7',
      nombre: 'Dra. Verónica Méndez',
      correo: 'dra.mendez@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Edificio de Servicios Escolares (SIIA)',
      espacio: 'Módulo Web de Profesores'
    },
    asignacion: {
      area: 'academico',
      tecnicoId: null,
      tecnicoNombre: 'Sin asignar'
    },
    detalle_especifico: {
      plataforma: 'SIIA Web Profesores v4.2',
      tipo_error: 'HTTP 500 Internal Database Deadlock',
      periodo_escolar: '2026-2 (Otoño)',
      curso_afectado: 'Cálculo Integral - Grupo 401-A',
      estudiantes_afectados: 32
    },
    tags: ['siia', 'actas', 'calificaciones', 'docencia'],
    horas_invertidas: 0,
    fecha_creacion: '2026-10-22T08:45:00Z',
    fecha_actualizacion: '2026-10-22T08:45:00Z',
    fecha_resolucion: null,
    evidencias: [
      { id: 'ev-4', nombre: 'error_500_siia_screenshot.png', peso: '680 KB', fecha: '2026-10-22' }
    ],
    historial: [
      {
        id: 'h-6',
        fecha: '2026-10-22T08:45:00Z',
        actor: 'Dra. Verónica Méndez (Docente)',
        accion: 'Reporte registrado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Plazo límite de actas vence este viernes a las 18:00 hrs.',
        horas: 0
      }
    ]
  },
  {
    id: 't-104',
    codigo: 'INC-2026-0037',
    titulo: 'Lámparas LED intermitentes en pasillo sur de Biblioteca Central',
    descripcion: 'Tres balastros presentan parpadeo constante provocando fatiga visual a los alumnos en el área de lectura individual.',
    categoria: 'infraestructura',
    prioridad: 'media',
    estado: 'resuelta',
    reportante: {
      id: 'usr-1',
      nombre: 'Ana Sofía García Mendoza',
      correo: 'alumno.garcia@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Biblioteca Central Universitaria',
      espacio: 'Sala de Lectura Silenciosa 2do Nivel'
    },
    asignacion: {
      area: 'infraestructura',
      tecnicoId: 'usr-3',
      tecnicoNombre: 'Ing. Pedro Ruiz Zárate'
    },
    detalle_especifico: {
      tipo_dano: 'Falla en driver electrónico y balastro LED',
      nivel_riesgo: 'Bajo',
      elemento_afectado: '3 paneles LED 60x60 cm',
      materiales_requeridos: '3 drivers Phillips 40W',
      requiere_acordonar: 'No'
    },
    tags: ['iluminacion', 'biblioteca', 'led'],
    horas_invertidas: 2.0,
    fecha_creacion: '2026-10-18T11:20:00Z',
    fecha_actualizacion: '2026-10-19T16:00:00Z',
    fecha_resolucion: '2026-10-19T16:00:00Z',
    evidencias: [],
    historial: [
      {
        id: 'h-7',
        fecha: '2026-10-18T11:20:00Z',
        actor: 'Ana Sofía García (Reportante)',
        accion: 'Reporte registrado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Reporte ingresado por alumnos en módulo de biblioteca.',
        horas: 0
      },
      {
        id: 'h-8',
        fecha: '2026-10-19T16:00:00Z',
        actor: 'Ing. Pedro Ruiz (Técnico)',
        accion: 'Resolución completa',
        estadoAnterior: 'en_proceso',
        estadoNuevo: 'resuelta',
        comentario: 'Se cambiaron drivers y luminarias. Iluminación operando a 100%.',
        horas: 2.0
      }
    ]
  },
  {
    id: 't-105',
    codigo: 'INC-2026-0036',
    titulo: 'Proyector Epson con lámpara agotada en Aula Magna A-101',
    descripcion: 'El proyector enciende el indicador de advertencia Temp/Lamp y se apaga tras 2 minutos de uso.',
    categoria: 'computo_redes',
    prioridad: 'media',
    estado: 'en_espera',
    reportante: {
      id: 'usr-8',
      nombre: 'Lic. David Ortiz',
      correo: 'david.ortiz@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Edificio A (Aulas y Rectoría)',
      espacio: 'Aula Magna A-101'
    },
    asignacion: {
      area: 'computo_redes',
      tecnicoId: 'usr-2',
      tecnicoNombre: 'Ing. Roberto Juárez Pérez'
    },
    detalle_especifico: {
      tipo_falla: 'Lámpara de proyector quemada (4,800 hrs de uso)',
      equipo: 'Proyector Epson PowerLite 2250U',
      inventario: 'UTM-DTI-PRY-0412',
      direccion_ip: 'N/A',
      dispositivos_afectados: 1
    },
    tags: ['proyector', 'aulamagna', 'epson'],
    horas_invertidas: 1.5,
    fecha_creacion: '2026-10-19T12:00:00Z',
    fecha_actualizacion: '2026-10-21T10:00:00Z',
    fecha_resolucion: null,
    evidencias: [],
    historial: [
      {
        id: 'h-9',
        fecha: '2026-10-19T12:00:00Z',
        actor: 'Lic. David Ortiz',
        accion: 'Reporte registrado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Urgente para presentaciones de titulación del próximo lunes.',
        horas: 0
      },
      {
        id: 'h-10',
        fecha: '2026-10-21T10:00:00Z',
        actor: 'Ing. Roberto Juárez',
        accion: 'Pausado en espera de refacción',
        estadoAnterior: 'en_proceso',
        estadoNuevo: 'en_espera',
        comentario: 'Se solicitó lámpara de repuesto ELPLP95 al almacén central.',
        horas: 1.5
      }
    ]
  },
  {
    id: 't-106',
    codigo: 'INC-2026-0033',
    titulo: 'Bloqueo de acceso masivo a Moodle LMS tras actualización de certificados',
    descripcion: 'Alumnos que intentan ingresar reciben advertencia de seguridad SSL_ERROR_BAD_CERT_DOMAIN.',
    categoria: 'academico',
    prioridad: 'critica',
    estado: 'resuelta',
    reportante: {
      id: 'usr-1',
      nombre: 'Ana Sofía García Mendoza',
      correo: 'alumno.garcia@utm.edu.mx'
    },
    ubicacion: {
      edificio: 'Edificio de Servicios Escolares (SIIA)',
      espacio: 'Campus Virtual Moodle'
    },
    asignacion: {
      area: 'academico',
      tecnicoId: 'usr-2',
      tecnicoNombre: 'Ing. Roberto Juárez Pérez'
    },
    detalle_especifico: {
      plataforma: 'Moodle LMS v4.3',
      tipo_error: 'Certificado SSL Let\'s Encrypt caducado / SAN mismatch',
      periodo_escolar: '2026-2',
      curso_afectado: 'Todos los cursos del campus virtual',
      estudiantes_afectados: 1200
    },
    tags: ['moodle', 'ssl', 'seguridad', 'campusvirtual'],
    horas_invertidas: 4.0,
    fecha_creacion: '2026-10-17T07:15:00Z',
    fecha_actualizacion: '2026-10-17T11:40:00Z',
    fecha_resolucion: '2026-10-17T11:40:00Z',
    evidencias: [],
    historial: [
      {
        id: 'h-11',
        fecha: '2026-10-17T07:15:00Z',
        actor: 'Ana Sofía García',
        accion: 'Reporte creado',
        estadoAnterior: null,
        estadoNuevo: 'abierta',
        comentario: 'Nadie puede subir tareas hoy temprano.',
        horas: 0
      },
      {
        id: 'h-12',
        fecha: '2026-10-17T11:40:00Z',
        actor: 'Ing. Roberto Juárez',
        accion: 'Renovación y recarga Nginx',
        estadoAnterior: 'en_proceso',
        estadoNuevo: 'resuelta',
        comentario: 'Certificado Wildcard renovado y Nginx reiniciado sin contratiempos.',
        horas: 4.0
      }
    ]
  }
];

export const ESTADISTICAS_CAMPUS = {
  totales: {
    totalTickets: 148,
    abiertas: 19,
    enProceso: 28,
    enEspera: 7,
    resueltas: 94,
    tiempoPromedioResolucion: '4.2 horas',
    satisfaccionUsuarios: '97.2%',
    cumplimientoSLA: '94.8%'
  },
  porArea: [
    { area: 'Cómputo y Telecomunicaciones', abiertas: 9, resueltas: 48, total: 57, porcentaje: 38.5 },
    { area: 'Infraestructura y Mantenimiento', abiertas: 7, resueltas: 31, total: 38, porcentaje: 25.7 },
    { area: 'Sistemas y Servicios Académicos', abiertas: 10, resueltas: 43, total: 53, porcentaje: 35.8 }
  ],
  porEdificio: [
    { nombre: 'Edificio C (Laboratorios)', cantidad: 42, color: '#2563eb' },
    { nombre: 'Edificio B (Docencia)', cantidad: 31, color: '#0284c7' },
    { nombre: 'Edificio A (Rectoría)', cantidad: 26, color: '#0d9488' },
    { nombre: 'Biblioteca Central', cantidad: 21, color: '#10b981' },
    { nombre: 'Servicios Escolares', cantidad: 18, color: '#6366f1' },
    { nombre: 'Otros espacios', cantidad: 10, color: '#8b5cf6' }
  ],
  topProblemas: [
    { titulo: 'Intermitencia de Red Wi-Fi en Aulas', categoria: 'Cómputo y Redes', ocurrencias: 29 },
    { titulo: 'Fallas de Luminarias y Balastros', categoria: 'Infraestructura', ocurrencias: 22 },
    { titulo: 'Bloqueo de Contraseña o Cuenta Moodle', categoria: 'Académico', ocurrencias: 19 },
    { titulo: 'Proyectores con Lámpara Agotada', categoria: 'Cómputo y Redes', ocurrencias: 14 },
    { titulo: 'Filtraciones o Fugas Sanitarias', categoria: 'Infraestructura', ocurrencias: 11 }
  ]
};
