/* ASO ADE · Centro de control administrativo.
 * The server stays the authority for sessions, roles, validation and storage;
 * this module only presents and edits what /api/content and /api/admin return.
 * It relies on the shared state and helpers declared by portal.js. */

// ---------------------------------------------------------------------------
// Pure model helpers. They hold no DOM access and are covered by tests.
// ---------------------------------------------------------------------------
(function (root) {
  'use strict';
  const DAY = 86_400_000;
  const OPEN_STATUSES = ['pendiente', 'en proceso'];
  const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  function startOfWeek(time) {
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  }

  // Requests per calendar week (Monday start), oldest first.
  function weeklyBuckets(dates, weeks = 8, now = Date.now()) {
    const current = startOfWeek(now);
    const buckets = Array.from({ length: weeks }, (_, index) => {
      const start = new Date(current);
      start.setDate(start.getDate() - (weeks - 1 - index) * 7);
      return { start: start.getTime(), count: 0 };
    });
    for (const value of dates) {
      const time = new Date(value).getTime();
      if (!Number.isFinite(time)) continue;
      const bucket = buckets.find(item => item.start === startOfWeek(time).getTime());
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }

  const isOpen = message => OPEN_STATUSES.includes(message?.status || 'pendiente');

  function messageMatches(message, filters = {}) {
    if (filters.type && filters.type !== 'all' && message.type !== filters.type) return false;
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'abiertas' ? !isOpen(message) : (message.status || 'pendiente') !== filters.status) return false;
    }
    if (filters.subject && filters.subject !== 'all' && (message.subject || '') !== filters.subject) return false;
    const time = new Date(message.date).getTime();
    if (filters.from && !(time >= new Date(filters.from + 'T00:00:00').getTime())) return false;
    if (filters.to && !(time <= new Date(filters.to + 'T23:59:59.999').getTime())) return false;
    if (filters.query) {
      const haystack = fold([message.name, message.email, message.phone, message.subject, message.message, message.trackingCode, message.materia, message.producto, message.cycle].join(' '));
      if (!fold(filters.query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word))) return false;
    }
    return true;
  }

  // Ecuadorian mobile numbers are written locally as 09XXXXXXXX; wa.me needs 5939XXXXXXXX.
  function whatsappNumber(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('593')) return digits;
    if (digits.length === 10 && digits.startsWith('0')) return '593' + digits.slice(1);
    if (digits.length === 9 && digits.startsWith('9')) return '593' + digits;
    return digits;
  }

  function moveItem(list, index, delta) {
    const target = index + delta;
    const copy = list.slice();
    if (index < 0 || index >= list.length || target < 0 || target >= list.length) return copy;
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    return copy;
  }

  const SAFE_LINK = /^https:\/\/\S+$/i;
  const UPLOAD_LINK = /^\/uploads\/[a-f0-9]+\.(png|jpg|webp|pdf)$/;
  function validateRecord(fields, data) {
    const errors = {};
    for (const field of fields) {
      const raw = data[field.name];
      const value = typeof raw === 'string' ? raw.trim() : raw;
      if (field.required && (value === '' || value === undefined || value === null)) { errors[field.name] = 'Este campo es obligatorio.'; continue; }
      if (typeof value !== 'string' || !value) continue;
      if (/[<>]/.test(value)) errors[field.name] = 'Usa texto simple, sin etiquetas HTML.';
      else if (field.max && value.length > field.max) errors[field.name] = `Máximo ${field.max} caracteres.`;
      else if (['url', 'image', 'file'].includes(field.type) && !SAFE_LINK.test(value) && !UPLOAD_LINK.test(value)) errors[field.name] = 'Usa un enlace que empiece con https://';
      else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.name] = 'Escribe un correo válido.';
      else if (field.type === 'urls' && value.split(';').map(item => item.trim()).filter(Boolean).some(item => !SAFE_LINK.test(item) && !UPLOAD_LINK.test(item))) errors[field.name] = 'Cada enlace debe empezar con https://';
    }
    if (fields.some(field => field.name === 'end') && data.start && data.end && String(data.end) <= String(data.start)) errors.end = 'La hora de fin debe ser posterior al inicio.';
    return errors;
  }

  function dashboardStats({ collections = {}, messages = [], resources = [] } = {}) {
    const published = rows => (rows || []).filter(row => !row.hidden).length;
    const consultas = messages.filter(message => message.type === 'Consulta');
    const visible = resources.filter(row => !row.hidden);
    return {
      resources: visible.length,
      resourcesDrive: visible.filter(row => row.source === 'google-drive-auto').length,
      representantes: (collections.representantes || []).length,
      representantesPublished: published(collections.representantes),
      docentes: (collections.docentes || []).length,
      consultas: consultas.length,
      consultasPendientes: consultas.filter(isOpen).length,
      tutorias: (collections.tutorias || []).length,
      inscripciones: messages.filter(message => message.type === 'Tutoría').length,
      oportunidades: published(collections.oportunidades),
      solicitudesAbiertas: messages.filter(isOpen).length,
      borradores: Object.entries(collections).filter(([name, rows]) => name !== 'settings' && Array.isArray(rows)).reduce((sum, [, rows]) => sum + rows.filter(row => row.hidden).length, 0)
    };
  }

  function relativeTime(value, now = Date.now()) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return 'Sin fecha';
    const minutes = Math.round((now - time) / 60_000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Guayaquil' }).format(new Date(time));
  }

  function rankSearch(entries, query, limit = 12) {
    const needle = fold(query);
    if (!needle) return [];
    const words = needle.split(/\s+/).filter(Boolean);
    return entries
      .map(entry => {
        const title = fold(entry.title), haystack = fold(`${entry.title} ${entry.subtitle || ''} ${entry.keywords || ''}`);
        if (!words.every(word => haystack.includes(word))) return null;
        return { entry, score: title.startsWith(needle) ? 0 : title.includes(needle) ? 1 : 2 };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title, 'es'))
      .slice(0, limit)
      .map(item => item.entry);
  }

  root.AdeAdminModel = Object.freeze({ weeklyBuckets, messageMatches, whatsappNumber, moveItem, validateRecord, dashboardStats, relativeTime, rankSearch, isOpen, fold, DAY });
})(globalThis);

// ---------------------------------------------------------------------------
// Interface. Everything below runs in the browser only.
// ---------------------------------------------------------------------------
const ADM = globalThis.AdeAdminModel;
const admState = {
  view: 'dashboard',
  bound: false,
  filters: {},
  selection: new Set(),
  drawer: null,
  inbox: { type: 'all', status: 'abiertas', subject: 'all', from: '', to: '', query: '', selected: '' },
  homeDraft: null, homeDirty: false,
  sectionsDraft: null, sectionsDirty: false,
  alertDraft: null, alertDirty: false,
  configDirty: false,
  driveFilters: { cycle: 'all', subject: 'all', category: 'all', query: '', unclassified: false },
  auditQuery: '',
  pollTimer: null,
  searchIndex: -1
};

const ADMIN_VIEWS = [
  { id: 'dashboard', label: 'Resumen', icon: 'grid', group: 'General' },
  { id: 'mensajes', label: 'Bandeja', icon: 'inbox', group: 'General' },
  { id: 'portada', label: 'Portada', icon: 'home', group: 'Sitio público' },
  { id: 'secciones', label: 'Secciones', icon: 'layers', group: 'Sitio público' },
  { id: 'alertas', label: 'Alertas y avisos', icon: 'megaphone', group: 'Sitio público' },
  { id: 'carreraCards', label: 'Carrera', icon: 'chart', group: 'Sitio público' },
  { id: 'introClasses', label: 'Introductorio', icon: 'play', group: 'Sitio público' },
  { id: 'repositorio', label: 'Repositorio', icon: 'book', group: 'Académico' },
  { id: 'drive', label: 'Google Drive', icon: 'drive', group: 'Académico' },
  { id: 'physicalBooks', label: 'Libros físicos', icon: 'library', group: 'Académico' },
  { id: 'schedules', label: 'Horarios', icon: 'calendar', group: 'Académico' },
  { id: 'tutorias', label: 'Tutorías', icon: 'cap', group: 'Académico' },
  { id: 'docentes', label: 'Docentes', icon: 'user', group: 'Académico' },
  { id: 'representantes', label: 'Representantes', icon: 'people', group: 'Comunidad' },
  { id: 'oportunidades', label: 'Oportunidades', icon: 'briefcase', group: 'Comunidad' },
  { id: 'merch', label: 'Merch', icon: 'bag', group: 'Comunidad' },
  { id: 'config', label: 'Integraciones', icon: 'settings', group: 'Sistema' },
  { id: 'backup', label: 'Respaldo', icon: 'download', group: 'Sistema' },
  { id: 'auditoria', label: 'Auditoría', icon: 'shield', group: 'Sistema' }
];

const OPPORTUNITY_TYPES = ['Beca', 'Pasantía', 'Práctica', 'Curso', 'Convocatoria', 'Concurso', 'Voluntariado', 'Evento', 'Otro'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const GROUPS = ['Grupo 1', 'Grupo 2', 'Grupo 3'];
const MESSAGE_TYPES = [['all', 'Todas'], ['Consulta', 'Consultas'], ['Tutoría', 'Tutorías'], ['Merch', 'Merch'], ['Libro Físico', 'Libros'], ['Introductorio', 'Introductorio']];
const MESSAGE_FLOW = { Consulta: ['pendiente', 'en proceso', 'respondida', 'archivada'], 'Tutoría': ['pendiente', 'atendida', 'cancelada', 'archivada'], Merch: ['pendiente', 'entregada', 'cancelada', 'archivada'], 'Libro Físico': ['pendiente', 'entregada', 'cancelada', 'archivada'], Introductorio: ['pendiente', 'atendida', 'archivada'] };
const STATUS_TONE = { pendiente: 'warn', 'en proceso': 'info', respondida: 'ok', atendida: 'ok', entregada: 'ok', cancelada: 'muted', archivada: 'muted' };

const esc = value => escapeHtml(value);
const attr = value => escapeAttribute(value);
const icon = name => interfaceIcon(name);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
const fieldId = name => 'adm-f-' + name;
const youTubeThumb = url => { const id = typeof getYouTubeId === 'function' ? getYouTubeId(url || '') : ''; return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''; };

function cycleOptions(selected, { all = false } = {}) {
  return (all ? `<option value="all">Todos los ciclos</option>` : '') + CYCLES.map(cycle => `<option value="${cycle.id}" ${cycle.id === selected ? 'selected' : ''}>${esc(cycle.name)}</option>`).join('');
}
function subjectOptionsFor(cycleId, selected) {
  const cycle = findCycle(cycleId) || CYCLES[0];
  return cycle.subjects.map(subject => `<option value="${subject.id}" ${subject.id === selected ? 'selected' : ''}>${esc(subject.name)}</option>`).join('');
}

// Every editable collection declares its own form, list layout and public preview.
const COLLECTION_SCHEMAS = {
  representantes: {
    singular: 'representante', plural: 'representantes', layout: 'cards', orderable: true,
    description: 'La directiva estudiantil tal como aparece en la sección Representantes. El orden de la lista es el orden público.',
    title: row => row.nombre, subtitle: row => row.cargo,
    thumb: row => row.foto ? `<img src="${attr(row.foto)}" alt="" loading="lazy">` : `<span>${esc(initials(row.nombre || '?'))}</span>`,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true, max: 120, placeholder: 'Nombre y apellido' },
      { name: 'cargo', label: 'Cargo', required: true, max: 80, placeholder: 'Presidente, Vicepresidenta…' },
      { name: 'ciclo', label: 'Periodo o ciclo', max: 60, placeholder: 'ASO 2026–2027' },
      { name: 'funciones', label: 'Descripción de funciones', type: 'textarea', max: 600, full: true },
      { name: 'foto', label: 'Fotografía autorizada', type: 'image', full: true, help: 'PNG, JPG o WebP de hasta 3 MB. Usa solo fotografías con autorización.' },
      { name: 'redes', label: 'Red social principal', type: 'url', placeholder: 'https://www.instagram.com/usuario/' },
      { name: 'email', label: 'Correo de contacto', type: 'email', placeholder: 'nombre@ucuenca.edu.ec' }
    ],
    preview: (row, index) => `<div class="card-grid adm-preview-grid">${representativeCardHtml(row, index ?? 0)}</div>`
  },
  docentes: {
    singular: 'docente', plural: 'docentes', layout: 'table',
    description: 'Directorio de atención docente con correo, WhatsApp y horarios de consulta.',
    title: row => row.nombre, subtitle: row => [row.materia, row.titulo].filter(Boolean).join(' · '),
    thumb: row => `<span>${esc(initials(row.nombre || '?'))}</span>`,
    columns: [['Materia', row => row.materia || '—'], ['Correo', row => row.email || '—'], ['Atención', row => row.horario || 'Por definir']],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true, max: 120 },
      { name: 'titulo', label: 'Título académico', max: 120, placeholder: 'Mgt., PhD…' },
      { name: 'materia', label: 'Materia', max: 160 },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'whatsapp', label: 'WhatsApp con código de país', max: 20, placeholder: '593 99 123 4567' },
      { name: 'horario', label: 'Horario de atención', max: 160, placeholder: 'Martes 10:00–12:00' }
    ],
    preview: row => `<div class="card-grid adm-preview-grid">${docenteCardHtml(row)}</div>`
  },
  oportunidades: {
    singular: 'oportunidad', plural: 'oportunidades', layout: 'list',
    description: 'Becas, pasantías y convocatorias. Las marcadas como prioritarias aparecen en el aviso superior del portal.',
    title: row => row.titulo, subtitle: row => [row.tipo, row.institucion].filter(Boolean).join(' · '),
    thumb: row => `<span>${esc(String(row.tipo || 'OP').slice(0, 2).toUpperCase())}</span>`,
    chips: row => {
      const days = daysUntil(row.fecha);
      const chips = [];
      if (row.fecha) chips.push(Number.isFinite(days) && days < 0 ? ['Vencida', 'muted'] : Number.isFinite(days) && days <= 7 ? [`Vence en ${Math.max(days, 0)} d`, 'warn'] : [`Hasta ${formatDate(row.fecha)}`, 'neutral']);
      if (row.alertPriority) chips.push(['Prioritaria', 'info']);
      return chips;
    },
    fields: [
      { name: 'titulo', label: 'Título', required: true, max: 160, full: true },
      { name: 'tipo', label: 'Tipo', type: 'select', options: OPPORTUNITY_TYPES, required: true },
      { name: 'institucion', label: 'Institución', max: 120 },
      { name: 'fecha', label: 'Fecha límite', type: 'date' },
      { name: 'link', label: 'Enlace para postular', type: 'url' },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', max: 1200, full: true },
      { name: 'alertPriority', label: 'Mostrar como alerta prioritaria', type: 'checkbox', full: true, help: 'Aparece en el aviso superior aunque falten más de 7 días.' }
    ],
    preview: row => `<div class="card-grid adm-preview-grid">${renderOpportunityCard({ tipo: 'Otro', ...row })}</div>`
  },
  tutorias: {
    singular: 'tutoría', plural: 'tutorías', layout: 'list',
    description: 'Tutorías que los estudiantes pueden consultar e inscribirse. Las inscripciones llegan a la Bandeja.',
    title: row => row.materia, subtitle: row => [row.tema, row.tutor].filter(Boolean).join(' · '),
    thumb: row => `<span>${esc(String(row.nivel || 'TU').slice(0, 2).toUpperCase())}</span>`,
    chips: row => [[row.modalidad || 'Modalidad por definir', 'neutral'], ...(row.horario ? [[row.horario, 'neutral']] : [])],
    fields: [
      { name: 'materia', label: 'Materia', required: true, max: 160 },
      { name: 'tema', label: 'Tema', max: 200 },
      { name: 'nivel', label: 'Nivel', type: 'select', options: ['Básico', 'Intermedio', 'Avanzado'] },
      { name: 'modalidad', label: 'Modalidad', type: 'select', options: ['Presencial', 'Virtual', 'Híbrida'] },
      { name: 'horario', label: 'Horario', max: 120, placeholder: 'Jueves 15:00–17:00' },
      { name: 'tutor', label: 'Tutor', max: 120 },
      { name: 'syllabus', label: 'Mini sílabo', type: 'textarea', max: 1500, full: true },
      { name: 'domina', label: 'Temas que domina', type: 'textarea', max: 600, full: true }
    ],
    preview: row => `<div class="card-grid adm-preview-grid"><article class="portal-card tutoria-card"><span class="portal-card-icon">${esc(String(row.nivel || 'TU').slice(0, 2).toUpperCase())}</span><h3>${esc(row.materia || 'Materia')}</h3><p>${esc(row.tema || row.syllabus || 'Refuerzo académico guiado.')}</p><div class="portal-card-meta"><span>${esc(row.nivel || 'Nivel')}</span><span>${esc(row.modalidad || 'Modalidad')}</span><span>${esc(row.horario || 'Horario')}</span><span>${esc(row.tutor || 'Tutor')}</span></div></article></div>`
  },
  introClasses: {
    singular: 'clase introductoria', plural: 'clases introductorias', layout: 'cards',
    description: 'Mini cursos en video para primer ciclo. Pega un enlace de YouTube para mostrar el reproductor.',
    title: row => row.materia, subtitle: row => [row.nivel, row.tutor].filter(Boolean).join(' · '),
    thumb: row => youTubeThumb(row.videoUrl) ? `<img src="${attr(youTubeThumb(row.videoUrl))}" alt="" loading="lazy">` : `<span>IN</span>`,
    fields: [
      { name: 'materia', label: 'Materia', required: true, max: 160 },
      { name: 'nivel', label: 'Nivel', max: 60, placeholder: 'Introductorio' },
      { name: 'tutor', label: 'Tutor o canal', max: 120 },
      { name: 'videoUrl', label: 'Enlace de YouTube', type: 'url', full: true },
      { name: 'descripcion', label: 'Descripción corta', type: 'textarea', max: 600, full: true }
    ],
    preview: row => `<div class="card-grid adm-preview-grid"><article class="portal-card"><span class="portal-card-icon">IN</span><h3>${esc(row.materia || 'Materia')}</h3><p>${esc(row.descripcion || '')}</p>${youTubeThumb(row.videoUrl) ? `<img class="adm-preview-video" src="${attr(youTubeThumb(row.videoUrl))}" alt="Miniatura del video">` : ''}<div class="portal-card-meta"><span>${esc(row.nivel || 'Introductorio')}</span><span>${esc(row.tutor || 'Tutor por definir')}</span></div></article></div>`
  },
  merch: {
    singular: 'producto', plural: 'productos', layout: 'cards',
    description: 'Productos de la asociación. El costo unitario es privado: nunca se envía a la vista pública.',
    title: row => row.nombre, subtitle: row => row.precio || 'Precio por definir',
    thumb: row => { const first = String(row.imagenes || '').split(';').map(item => item.trim()).find(Boolean); return first ? `<img src="${attr(first)}" alt="" loading="lazy">` : `<span>ME</span>`; },
    chips: row => { const sale = parseMoney(row.precio), cost = parseMoney(row.costoUnitario); return row.costoUnitario ? [[`Margen $${(sale - cost).toFixed(2)}`, sale - cost >= 0 ? 'ok' : 'warn']] : []; },
    fields: [
      { name: 'nombre', label: 'Producto', required: true, max: 120 },
      { name: 'precio', label: 'Precio de venta', max: 20, placeholder: '$12.00' },
      { name: 'costoUnitario', label: 'Costo unitario (privado)', max: 20, placeholder: '$7.50', help: 'Solo visible en administración.' },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', max: 800, full: true },
      { name: 'imagenes', label: 'Imágenes del producto', type: 'urls', full: true, help: 'Enlaces HTTPS separados por punto y coma, o sube una imagen.' },
      { name: 'videos', label: 'Videos de YouTube', type: 'textarea', max: 800, full: true, help: 'Separados por punto y coma.' }
    ],
    preview: row => { const first = String(row.imagenes || '').split(';').map(item => item.trim()).find(Boolean); return `<div class="card-grid adm-preview-grid"><article class="portal-card">${first ? `<img class="adm-preview-video" src="${attr(first)}" alt="">` : '<span class="portal-card-icon">ME</span>'}<h3>${esc(row.nombre || 'Producto')}</h3><p>${esc(row.descripcion || '')}</p><div class="portal-card-meta"><span>${esc(row.precio || '$0.00')}</span><span>Reserva</span></div></article></div>`; }
  },
  physicalBooks: {
    singular: 'libro', plural: 'libros físicos', layout: 'list',
    description: 'Libros de la asociación que los estudiantes pueden reservar para retiro presencial.',
    title: row => row.titulo, subtitle: row => row.autor || 'Biblioteca ASO',
    thumb: () => `<span>${icon('library')}</span>`,
    chips: row => [[row.estado || 'Disponible', /prestado|reservado/i.test(row.estado || '') ? 'warn' : 'ok']],
    fields: [
      { name: 'titulo', label: 'Título del libro', required: true, max: 200, full: true },
      { name: 'autor', label: 'Autor o área', max: 160 },
      { name: 'estado', label: 'Estado', type: 'select', options: ['Disponible', 'Prestado', 'Reservado', 'En revisión'] },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', max: 800, full: true }
    ],
    preview: row => `<div class="books-grid adm-preview-grid">${renderBookCard({ estado: 'Disponible', ...row })}</div>`
  },
  carreraCards: {
    singular: 'cuadro de carrera', plural: 'cuadros de carrera', layout: 'cards',
    description: 'Tarjetas de la sección Carrera. Se ordenan por el número indicado.',
    title: row => row.titulo, subtitle: row => row.resumen,
    thumb: row => `<span>${esc(row.orden || '··')}</span>`,
    fields: [
      { name: 'orden', label: 'Número', max: 4, placeholder: '05' },
      { name: 'titulo', label: 'Título', required: true, max: 160 },
      { name: 'resumen', label: 'Resumen corto', type: 'textarea', max: 300, full: true },
      { name: 'detalle', label: 'Texto extenso', type: 'textarea', max: 4000, full: true },
      { name: 'videos', label: 'Videos (separados por punto y coma)', type: 'textarea', max: 800, full: true }
    ],
    preview: row => `<div class="card-grid adm-preview-grid"><article class="portal-card career-card"><span class="portal-card-icon">${esc(row.orden || '')}</span><h3>${esc(row.titulo || 'Título')}</h3><p>${esc(row.resumen || '')}</p><span class="btn-secondary">Abrir detalle</span></article></div>`
  },
  schedules: {
    singular: 'horario', plural: 'horarios', layout: 'timetable',
    description: 'Horarios institucionales por ciclo y grupo.',
    title: row => subjectName(row.cycleId, row.subjectId) || 'Horario', subtitle: row => `${row.day || ''} · ${row.start || ''}–${row.end || ''} · ${row.group || 'Grupo 1'}`,
    thumb: row => `<span>${esc(String(row.day || '··').slice(0, 2))}</span>`,
    fields: [
      { name: 'cycleId', label: 'Ciclo', type: 'cycle', required: true },
      { name: 'subjectId', label: 'Materia', type: 'subject', required: true },
      { name: 'group', label: 'Grupo', type: 'select', options: GROUPS },
      { name: 'day', label: 'Día', type: 'select', options: DAYS, required: true },
      { name: 'start', label: 'Inicio', type: 'time', required: true },
      { name: 'end', label: 'Fin', type: 'time', required: true },
      { name: 'aula', label: 'Aula', max: 80 },
      { name: 'docente', label: 'Docente', max: 120 }
    ],
    preview: row => `<div class="adm-timetable-preview"><strong>${esc(subjectName(row.cycleId, row.subjectId) || 'Materia')}</strong><span>${esc(row.day || 'Día')} · ${esc(row.start || '--:--')}–${esc(row.end || '--:--')}</span><small>${esc(row.aula || 'Aula por definir')} · ${esc(row.docente || 'Docente por definir')}</small></div>`
  },
  resources: {
    singular: 'recurso', plural: 'recursos', layout: 'table', view: 'repositorio',
    description: 'Materiales cargados manualmente. Los archivos de Google Drive se gestionan en su propio módulo.',
    title: row => row.title, subtitle: row => `${findCycle(row.cycleId)?.name || 'Sin ciclo'} · ${subjectName(row.cycleId, row.subjectId) || 'Sin materia'}`,
    thumb: row => `<span>${esc(CATEGORIES.find(cat => cat.id === row.typeId)?.short || 'RC')}</span>`,
    columns: [['Tipo', row => categoryLabel(row.typeId)], ['Fecha', row => formatDate(row.date)], ['Archivo', row => /^\/uploads\//.test(row.url || '') ? 'PDF subido' : /drive|docs\.google/.test(row.url || '') ? 'Google Drive' : row.url ? 'Enlace' : '—']],
    fields: [
      { name: 'title', label: 'Título', required: true, max: 200, full: true },
      { name: 'typeId', label: 'Tipo', type: 'select', options: () => CATEGORIES.map(cat => [cat.id, cat.label]), required: true },
      { name: 'date', label: 'Fecha', type: 'date' },
      { name: 'cycleId', label: 'Ciclo', type: 'cycle', required: true },
      { name: 'subjectId', label: 'Materia', type: 'subject', required: true },
      { name: 'url', label: 'Enlace o PDF', type: 'file', required: true, full: true, help: 'Pega un enlace HTTPS (Drive, Docs o PDF) o sube un PDF de hasta 3 MB.' },
      { name: 'description', label: 'Descripción', type: 'textarea', max: 1000, full: true }
    ],
    preview: row => `<div class="adm-resource-preview"><span class="adm-chip info">${esc(categoryLabel(row.typeId) || 'Tipo')}</span><strong>${esc(row.title || 'Título del recurso')}</strong><p>${esc(row.description || 'Sin descripción.')}</p><small>${esc(findCycle(row.cycleId)?.name || 'Ciclo')} · ${esc(subjectName(row.cycleId, row.subjectId) || 'Materia')}</small></div>`
  }
};
const VIEW_COLLECTION = { repositorio: 'resources' };
const collectionForView = view => VIEW_COLLECTION[view] || (COLLECTION_SCHEMAS[view] ? view : null);
const viewMeta = id => ADMIN_VIEWS.find(view => view.id === id) || ADMIN_VIEWS[0];

// --------------------------------------------------------------- lifecycle
function openAdminPanel() {
  if (!isAdmin || !adminSessionToken) return openAdminLogin();
  touchAdminSession();
  bindAdminShell();
  admState.view = ADMIN_VIEWS.some(view => view.id === adminTab) ? adminTab : 'dashboard';
  el.adminPanel.hidden = false;
  document.body.classList.add('adm-open');
  document.documentElement.classList.toggle('adm-sidebar-collapsed', admReadPref('collapsed') === '1');
  renderAdminTabs();
  renderAdminContent();
  refreshAdminData({ silent: true });
  clearInterval(admState.pollTimer);
  admState.lastPoll = Date.now();
  admState.pollTimer = setInterval(() => {
    const pending = (appData.messages || []).some(message => message.emailStatus === 'enviando');
    if (!el.adminPanel.hidden && document.visibilityState === 'visible' && !admState.refreshing && Date.now() - admState.lastPoll >= (pending ? 3000 : 60_000)) {
      admState.lastPoll = Date.now();
      refreshAdminData({ silent: true });
    }
  }, 3000);
}

function closeAdminPanel() {
  el.adminPanel.hidden = true;
  document.body.classList.remove('adm-open', 'adm-nav-open');
  clearInterval(admState.pollTimer);
  closeDrawer(true);
  admState.homeDraft = null; admState.homeDirty = false;
  admState.sectionsDraft = null; admState.sectionsDirty = false;
  admState.alertDraft = null; admState.alertDirty = false;
  admState.configDirty = false;
}

function adminHasUnsavedChanges() {
  return Boolean(admState.drawer?.dirty || admState.homeDirty || admState.sectionsDirty || admState.alertDirty || admState.configDirty);
}

async function requestCloseAdmin() {
  if (adminHasUnsavedChanges() && !(await confirmAction({ title: 'Salir sin publicar', message: 'Tienes cambios sin publicar. Si sales ahora se descartarán.', confirmText: 'Descartar y salir', cancelText: 'Seguir editando' }))) return;
  closeAdminPanel();
}

async function admNavigate(view, options = {}) {
  if (view === admState.view && !options.force) { document.body.classList.remove('adm-nav-open'); return; }
  const leavingDirty = (admState.view === 'portada' && admState.homeDirty) || (admState.view === 'secciones' && admState.sectionsDirty) || (admState.view === 'alertas' && admState.alertDirty) || (admState.view === 'config' && admState.configDirty);
  if (leavingDirty && !(await confirmAction({ title: 'Cambios sin publicar', message: 'Esta vista tiene cambios que aún no se publicaron. ¿Quieres descartarlos?', confirmText: 'Descartar cambios', cancelText: 'Volver' }))) return false;
  if (leavingDirty) { admState.homeDraft = null; admState.homeDirty = false; admState.sectionsDraft = null; admState.sectionsDirty = false; admState.alertDraft = null; admState.alertDirty = false; admState.configDirty = false; }
  admState.view = view; adminTab = view; admState.selection.clear();
  document.body.classList.remove('adm-nav-open');
  renderAdminTabs(); renderAdminContent();
  el.adminContent?.scrollTo?.({ top: 0 });
  el.adminContent?.focus?.({ preventScroll: true });
}

async function refreshAdminData({ silent = false } = {}) {
  if (admState.refreshing) return;
  admState.refreshing = true;
  try {
    await loadAdminInbox();
    renderAdminTabs();
    if (['dashboard', 'mensajes', 'auditoria', 'backup', 'drive', 'config'].includes(admState.view) && !adminHasUnsavedChanges() && !el.adminContent.contains(document.activeElement)) renderAdminContent({ keepScroll: true });
  } catch (error) { if (!silent) showToast('No se pudo actualizar', error.message, 'error'); }
  finally { admState.refreshing = false; }
}

function admReadPref(key) { try { return localStorage.getItem('adm-' + key); } catch { return null; } }
function admWritePref(key, value) { try { localStorage.setItem('adm-' + key, value); } catch {} }

// ---------------------------------------------------------------- publishing
async function admPublish(summary) {
  if (publishInFlight) { try { await publishInFlight; } catch {} }
  clearTimeout(criticalSheetsSyncTimer);
  setPublishStatus('Guardando…', 'saving');
  try {
    const result = await portalApi('/api/content', { collections: publicContent(), revision: contentRevision, summary: String(summary || '').replace(/[<>]/g, '').slice(0, 160) });
    contentRevision = result.revision; publishPending = false;
    sheetsSyncStatus = { loading: false, error: '', updatedAt: new Date().toISOString() };
    setPublishStatus('Guardado y publicado', 'saved');
    loadAdminInbox().then(() => { renderAdminTabs(); if (admState.view === 'dashboard' && !admState.drawer) renderAdminContent({ keepScroll: true }); }).catch(() => {});
    return { ok: true };
  } catch (error) {
    const conflict = /Otra sesión/i.test(error.message);
    setPublishStatus(conflict ? 'Conflicto: otra sesión publicó cambios' : 'Sin publicar · ' + error.message, 'error');
    return { ok: false, error: error.message, conflict };
  }
}

// Applies a change locally, publishes it and rolls it back if the server refuses it.
async function admCommit(mutate, summary, { success = 'Cambios publicados' } = {}) {
  const snapshot = structuredClone(Object.fromEntries(CRITICAL_SHEET_COLLECTIONS.map(name => [name, appData[name]])));
  mutate();
  invalidateRenderedSections(); renderAll();
  const result = await admPublish(summary);
  if (!result.ok) {
    Object.assign(appData, snapshot);
    publishPending = false;
    invalidateRenderedSections(); renderAll(); hydrateDriveSettings();
    if (result.conflict) admOfferReload();
    else showToast('No se publicó', result.error + ' Los datos del portal no cambiaron.', 'error');
  } else showToast(success, 'El servidor confirmó el guardado.', 'success');
  return result;
}

async function admOfferReload() {
  const reload = await confirmAction({ title: 'Otra sesión modificó el contenido', message: 'Para no sobrescribir su trabajo, recarga la versión más reciente del servidor antes de volver a editar.', confirmText: 'Recargar ahora', cancelText: 'Más tarde', danger: false });
  if (!reload) return;
  publishPending = false;
  await loadCriticalCollectionsFromSheets();
  renderAll(); renderAdminContent();
  setPublishStatus('Contenido actualizado desde el servidor', 'saved');
}

// ---------------------------------------------------------------- shell
function bindAdminShell() {
  if (admState.bound || !el.adminPanel) return;
  admState.bound = true;
  const panel = el.adminPanel;
  panel.addEventListener('click', handleAdminClick);
  panel.addEventListener('input', handleAdminInput);
  panel.addEventListener('change', handleAdminChange);
  panel.addEventListener('submit', handleAdminSubmit);
  panel.addEventListener('keydown', handleAdminKeydown);
  window.addEventListener('beforeunload', event => { if (!el.adminPanel.hidden && adminHasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('click', event => { if (!event.target.closest('.adm-menu, [data-adm-menu-toggle]')) admCloseMenus(); });
}

function renderAdminTabs() {
  if (!el.adminTabs) return;
  const open = (appData.messages || []).filter(ADM.isOpen).length;
  const driveIssue = Boolean(driveRepositoryStatus.error);
  const groups = [...new Set(ADMIN_VIEWS.map(view => view.group))];
  el.adminTabs.innerHTML = DOMPurify.sanitize(groups.map(group => `<div class="adm-nav-group"><p class="adm-nav-label">${esc(group)}</p>${ADMIN_VIEWS.filter(view => view.group === group).map(view => {
    const badge = view.id === 'mensajes' && open ? `<span class="adm-nav-badge" aria-label="${open} abiertas">${open > 99 ? '99+' : open}</span>` : view.id === 'drive' && driveIssue ? '<span class="adm-nav-dot" aria-label="Revisar conexión"></span>' : '';
    return `<button type="button" class="adm-nav-item ${admState.view === view.id ? 'active' : ''}" data-adm-view="${view.id}" ${admState.view === view.id ? 'aria-current="page"' : ''} title="${attr(view.label)}">${icon(view.icon)}<span>${esc(view.label)}</span>${badge}</button>`;
  }).join('')}</div>`).join(''));
  const counter = document.getElementById('admOpenCount');
  if (counter) { counter.textContent = String(open); counter.hidden = !open; }
}

function renderAdminContent({ keepScroll = false } = {}) {
  if (!el.adminContent) return;
  const scroll = el.adminContent.scrollTop;
  const view = admState.view;
  const renderers = { dashboard: renderAdmDashboard, mensajes: renderAdmInbox, portada: renderAdmHomeEditor, secciones: renderAdmSections, alertas: renderAdmAlerts, drive: renderAdmDrive, config: renderAdmConfig, backup: renderAdmBackup, auditoria: renderAdmAudit };
  const collection = collectionForView(view);
  const html = collection ? renderAdmCollection(collection) : (renderers[view] || renderAdmDashboard)();
  el.adminContent.innerHTML = DOMPurify.sanitize(html);
  el.adminContent.classList.remove('adm-view-enter'); void el.adminContent.offsetWidth; el.adminContent.classList.add('adm-view-enter');
  renderAdmBreadcrumbs();
  if (view === 'portada') updateHomePreview();
  if (view === 'alertas') updateAlertPreview();
  admAnimateCounts(el.adminContent);
  if (keepScroll) el.adminContent.scrollTop = scroll;
}

function renderAdmBreadcrumbs(extra) {
  const node = document.getElementById('admBreadcrumbs');
  if (!node) return;
  const meta = viewMeta(admState.view);
  const parts = [`<button type="button" data-adm-view="dashboard">Administración</button>`, `<span>${esc(meta.group)}</span>`, `<strong>${esc(meta.label)}</strong>`];
  if (extra) parts.push(`<strong>${esc(extra)}</strong>`);
  node.innerHTML = DOMPurify.sanitize(parts.join('<span class="adm-crumb-sep" aria-hidden="true">/</span>'));
}

function admAnimateCounts(root) {
  root.querySelectorAll('[data-adm-count]').forEach(node => animateCounter(node, Number(node.dataset.admCount), 700));
}

function pageHead({ kicker, title, text, actions = '' }) {
  return `<header class="adm-page-head"><div><p class="adm-kicker">${esc(kicker)}</p><h1>${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ''}</div>${actions ? `<div class="adm-head-actions">${actions}</div>` : ''}</header>`;
}
function chip(label, tone = 'neutral') { return `<span class="adm-chip ${tone}">${esc(label)}</span>`; }
function admEmpty(title, text, action = '') { return `<div class="adm-empty"><span class="adm-empty-art" aria-hidden="true">${icon('spark')}</span><strong>${esc(title)}</strong><p>${esc(text)}</p>${action}</div>`; }

// ---------------------------------------------------------------- dashboard
function renderAdmDashboard() {
  const stats = ADM.dashboardStats({ collections: appData, messages: appData.messages || [], resources: appData.resources || [] });
  const state = adminServerState || {};
  const hour = Number(new Intl.DateTimeFormat('es-EC', { hour: 'numeric', hour12: false, timeZone: 'America/Guayaquil' }).format(new Date()));
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const driveText = driveRepositoryStatus.loading ? 'Sincronizando' : driveRepositoryStatus.error ? 'Con error' : driveRepositoryStatus.enabled ? 'Conectado' : 'Sin configurar';
  const driveTone = driveRepositoryStatus.error ? 'bad' : driveRepositoryStatus.loading ? 'warn' : driveRepositoryStatus.enabled ? 'ok' : 'muted';
  const cards = [
    { label: 'Recursos publicados', value: stats.resources, sub: `${stats.resourcesDrive} desde Drive · ${stats.resources - stats.resourcesDrive} manuales`, view: 'repositorio', icon: 'book' },
    { label: 'Consultas recibidas', value: stats.consultas, sub: stats.consultasPendientes ? `${plural(stats.consultasPendientes, 'pendiente', 'pendientes')} de respuesta` : 'Sin pendientes', view: 'mensajes', icon: 'inbox', tone: stats.consultasPendientes ? 'warn' : '' },
    { label: 'Representantes', value: stats.representantes, sub: `${stats.representantesPublished} visibles en el portal`, view: 'representantes', icon: 'people' },
    { label: 'Docentes', value: stats.docentes, sub: 'En el directorio', view: 'docentes', icon: 'user' },
    { label: 'Tutorías registradas', value: stats.tutorias, sub: plural(stats.inscripciones, 'inscripción recibida', 'inscripciones recibidas'), view: 'tutorias', icon: 'cap' },
    { label: 'Oportunidades publicadas', value: stats.oportunidades, sub: 'Becas, pasantías y convocatorias', view: 'oportunidades', icon: 'briefcase' }
  ];
  const buckets = ADM.weeklyBuckets((appData.messages || []).map(message => message.date), 8);
  const maxBucket = Math.max(1, ...buckets.map(bucket => bucket.count));
  const totalWeeks = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const chart = `<svg class="adm-chart" viewBox="0 0 400 170" role="img" aria-label="Solicitudes recibidas por semana durante las últimas ocho semanas">
    ${[0, 1, 2, 3].map(line => `<line x1="28" x2="392" y1="${20 + line * 40}" y2="${20 + line * 40}" class="adm-chart-grid"/>`).join('')}
    <text x="22" y="24" text-anchor="end" class="adm-chart-axis">${maxBucket}</text><text x="22" y="144" text-anchor="end" class="adm-chart-axis">0</text>
    ${buckets.map((bucket, index) => { const height = Math.max(bucket.count ? 4 : 2, (bucket.count / maxBucket) * 120); const x = 40 + index * 44; const label = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(new Date(bucket.start)); return `<g class="adm-bar-group" style="--i:${index}"><rect class="adm-bar ${bucket.count ? '' : 'empty'}" x="${x}" y="${140 - height}" width="28" height="${height}" rx="6"><title>${label}: ${plural(bucket.count, 'solicitud', 'solicitudes')}</title></rect>${bucket.count ? `<text x="${x + 14}" y="${134 - height}" text-anchor="middle" class="adm-chart-value">${bucket.count}</text>` : ''}<text x="${x + 14}" y="160" text-anchor="middle" class="adm-chart-axis">${label}</text></g>`; }).join('')}
  </svg>`;
  const consultas = (appData.messages || []).filter(message => message.type === 'Consulta');
  const statusCounts = ['pendiente', 'en proceso', 'respondida', 'archivada'].map(status => [status, consultas.filter(message => (message.status || 'pendiente') === status).length]);
  const statusTotal = Math.max(1, consultas.length);
  const modules = [['Representantes', 'representantes'], ['Docentes', 'docentes'], ['Oportunidades', 'oportunidades'], ['Tutorías', 'tutorias'], ['Merch', 'merch'], ['Libros', 'physicalBooks'], ['Horarios', 'schedules'], ['Introductorio', 'introClasses'], ['Carrera', 'carreraCards'], ['Recursos manuales', 'resources']]
    .map(([label, key]) => { const rows = key === 'resources' ? (appData.resources || []).filter(row => row.source !== DRIVE_RESOURCE_SOURCE) : (appData[key] || []); return { label, key, total: rows.length, drafts: rows.filter(row => row.hidden).length }; });
  const maxModule = Math.max(1, ...modules.map(item => item.total));
  const audit = (appData.adminLog || []).slice(0, 7);
  const lastBackup = state.lastBackup?.at;
  const driveServer = state.drive || {};
  const pendingList = (appData.messages || []).filter(ADM.isOpen).slice(0, 4);
  return `${pageHead({ kicker: 'Centro de control', title: `${greeting}, equipo ASO`, text: 'Todo lo que ves aquí sale de los datos guardados en el servidor y del registro de auditoría.', actions: `<button class="adm-btn ghost" type="button" data-adm-refresh>${icon('refresh')}<span>Actualizar</span></button><button class="adm-btn primary" type="button" data-adm-view="mensajes">${icon('inbox')}<span>Abrir bandeja</span></button>` })}
  <section class="adm-stats" aria-label="Indicadores del portal">${cards.map((card, index) => `<button type="button" class="adm-stat ${card.tone || ''}" data-adm-view="${card.view}" style="--i:${index}"><span class="adm-stat-icon">${icon(card.icon)}</span><span class="adm-stat-label">${esc(card.label)}</span><strong data-adm-count="${card.value}">${card.value}</strong><small>${esc(card.sub)}</small></button>`).join('')}</section>
  <div class="adm-grid adm-grid-2">
    <section class="adm-card"><header class="adm-card-head"><div><h2>Solicitudes por semana</h2><p>${totalWeeks ? `${plural(totalWeeks, 'solicitud', 'solicitudes')} en las últimas 8 semanas` : 'Aún no hay solicitudes en las últimas 8 semanas'}</p></div></header>${chart}</section>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Estado de las consultas</h2><p>${plural(consultas.length, 'consulta', 'consultas')} en total</p></div><button class="adm-link" type="button" data-adm-view="mensajes">Ver todas ${icon('chevronRight')}</button></header>
      <div class="adm-stack" role="img" aria-label="${statusCounts.map(([status, count]) => `${status}: ${count}`).join(', ')}">${consultas.length ? statusCounts.filter(([, count]) => count).map(([status, count]) => `<span class="adm-stack-seg ${STATUS_TONE[status]}" style="flex:${count}" title="${attr(status)}: ${count}"></span>`).join('') : '<span class="adm-stack-seg empty" style="flex:1"></span>'}</div>
      <ul class="adm-legend">${statusCounts.map(([status, count]) => `<li><i class="${STATUS_TONE[status]}"></i>${esc(status)}<strong>${count}</strong><small>${Math.round(count / statusTotal * 100)}%</small></li>`).join('')}</ul>
      <div class="adm-mini-list">${pendingList.length ? pendingList.map(message => `<button type="button" data-adm-open-message="${attr(message.id)}"><span class="adm-dot ${message.read ? '' : 'unread'}"></span><strong>${esc(message.name || 'Sin nombre')}</strong><span>${esc(message.type)} · ${esc(message.subject || message.materia || message.producto || '')}</span><small>${esc(ADM.relativeTime(message.date))}</small></button>`).join('') : '<p class="adm-muted">No hay solicitudes abiertas. Buen trabajo.</p>'}</div>
    </section>
  </div>
  <div class="adm-grid adm-grid-2">
    <section class="adm-card"><header class="adm-card-head"><div><h2>Contenido por módulo</h2><p>${plural(stats.borradores, 'borrador sin publicar', 'borradores sin publicar')}</p></div></header>
      <ul class="adm-hbars">${modules.map(item => `<li><button type="button" data-adm-view="${item.key === 'resources' ? 'repositorio' : item.key}"><span>${esc(item.label)}</span><span class="adm-hbar"><i style="--w:${item.total / maxModule * 100}%"></i>${item.drafts ? `<b style="--w:${item.drafts / maxModule * 100}%"></b>` : ''}</span><strong>${item.total}</strong></button></li>`).join('')}</ul>
      <p class="adm-legend-inline"><i class="ok"></i>Total <i class="warn"></i>Borradores</p>
    </section>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Estado del sistema</h2><p>Integraciones y continuidad</p></div></header>
      <dl class="adm-system">
        <div><dt>${icon('drive')} Google Drive</dt><dd><span class="adm-status ${driveTone}">${esc(driveText)}</span><small>${driveServer.at ? `Última sincronización: ${esc(ADM.relativeTime(driveServer.at))} · ${plural(driveServer.count || 0, 'archivo público', 'archivos públicos')}` : 'Sin sincronizaciones registradas en el servidor'}</small></dd></div>
        <div><dt>${icon('download')} Último respaldo</dt><dd><span class="adm-status ${lastBackup ? 'ok' : 'warn'}">${lastBackup ? esc(ADM.relativeTime(lastBackup)) : 'Sin respaldo registrado'}</span><small>${lastBackup ? `Descargado por ${esc(state.lastBackup.actor || 'administración')}` : 'Descarga uno desde Respaldo'}</small></dd></div>
        <div><dt>${icon('mail')} Reenvío de correo</dt><dd><span class="adm-status ${state.mailRelay ? 'ok' : 'warn'}">${state.mailRelay ? 'Servicio configurado' : 'Sin configurar'}</span><small>El estado real de cada envío se muestra en la bandeja.</small></dd></div>
        <div><dt>${icon('shield')} Contenido</dt><dd><span class="adm-status ok">Revisión ${esc(String(contentRevision ?? state.revision ?? '—'))}</span><small>Cada publicación incrementa la revisión y evita sobrescrituras.</small></dd></div>
      </dl>
    </section>
  </div>
  <div class="adm-grid adm-grid-2">
    <section class="adm-card"><header class="adm-card-head"><div><h2>Actividad reciente</h2><p>Registro de auditoría del servidor</p></div><button class="adm-link" type="button" data-adm-view="auditoria">Ver registro ${icon('chevronRight')}</button></header>
      ${audit.length ? `<ol class="adm-timeline">${audit.map(entry => `<li><span class="adm-timeline-dot"></span><div><strong>${esc(entry.action)}</strong><small>${esc(entry.actor || 'Administración')} · ${esc(ADM.relativeTime(entry.date))}</small></div></li>`).join('')}</ol>` : admEmpty('Sin actividad', 'Las acciones administrativas aparecerán aquí.')}
    </section>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Acciones rápidas</h2><p>Lo más frecuente, a un clic</p></div></header>
      <div class="adm-quick">${[['resources', 'Nuevo recurso', 'book'], ['representantes', 'Nuevo representante', 'people'], ['oportunidades', 'Nueva oportunidad', 'briefcase'], ['tutorias', 'Nueva tutoría', 'cap']].map(([collection, label, name]) => `<button type="button" data-adm-new="${collection}">${icon(name)}<span>${esc(label)}</span></button>`).join('')}<button type="button" data-adm-view="alertas">${icon('megaphone')}<span>Mensaje institucional</span></button><button type="button" data-adm-view="portada">${icon('home')}<span>Editar portada</span></button></div>
    </section>
  </div>`;
}

// ---------------------------------------------------------------- collections
function admRows(collection) {
  const rows = appData[collection] || [];
  return collection === 'resources' ? rows.filter(row => row.source !== DRIVE_RESOURCE_SOURCE) : rows;
}

function admFilteredRows(collection) {
  const schema = COLLECTION_SCHEMAS[collection];
  const filters = admState.filters[collection] || {};
  let rows = admRows(collection).map((row, index) => ({ row, index }));
  if (filters.status === 'published') rows = rows.filter(({ row }) => !row.hidden);
  if (filters.status === 'drafts') rows = rows.filter(({ row }) => row.hidden);
  if (filters.cycle && filters.cycle !== 'all') rows = rows.filter(({ row }) => row.cycleId === filters.cycle);
  if (filters.query) {
    const words = ADM.fold(filters.query).split(/\s+/).filter(Boolean);
    rows = rows.filter(({ row }) => { const haystack = ADM.fold(`${schema.title(row)} ${schema.subtitle(row)} ${Object.values(row).filter(value => typeof value === 'string').join(' ')}`); return words.every(word => haystack.includes(word)); });
  }
  if (filters.sort === 'az') rows.sort((a, b) => String(schema.title(a.row) || '').localeCompare(String(schema.title(b.row) || ''), 'es'));
  if (filters.sort === 'recent') rows.sort((a, b) => String(b.row.updatedAt || b.row.date || '').localeCompare(String(a.row.updatedAt || a.row.date || '')));
  return rows;
}

function renderAdmCollection(collection) {
  const schema = COLLECTION_SCHEMAS[collection];
  const view = schema.view || collection;
  const meta = viewMeta(view);
  const all = admRows(collection);
  const filters = admState.filters[collection] || {};
  const rows = admFilteredRows(collection);
  const drafts = all.filter(row => row.hidden).length;
  const manualOrder = schema.orderable && (!filters.sort || filters.sort === 'manual') && !filters.query && (!filters.status || filters.status === 'all');
  const selection = [...admState.selection].filter(id => all.some(row => row.id === id));
  const driveCount = collection === 'resources' ? (appData.resources || []).filter(row => row.source === DRIVE_RESOURCE_SOURCE).length : 0;
  const toolbar = `<div class="adm-toolbar" role="search">
      <label class="adm-search-field">${icon('search')}<input type="search" placeholder="Buscar ${attr(schema.plural)}…" value="${attr(filters.query || '')}" data-adm-filter="query" data-collection="${collection}" aria-label="Buscar ${attr(schema.plural)}"></label>
      <div class="adm-segmented" role="group" aria-label="Estado de publicación">${[['all', `Todos ${all.length}`], ['published', `Publicados ${all.length - drafts}`], ['drafts', `Borradores ${drafts}`]].map(([value, label]) => `<button type="button" class="${(filters.status || 'all') === value ? 'active' : ''}" data-adm-filter-status="${value}" data-collection="${collection}" aria-pressed="${(filters.status || 'all') === value}">${esc(label)}</button>`).join('')}</div>
      ${['resources', 'schedules'].includes(collection) ? `<select class="adm-select" data-adm-filter="cycle" data-collection="${collection}" aria-label="Filtrar por ciclo">${cycleOptions(filters.cycle || 'all', { all: true })}</select>` : ''}
      <select class="adm-select" data-adm-filter="sort" data-collection="${collection}" aria-label="Ordenar">${[schema.orderable ? ['manual', 'Orden público'] : ['manual', 'Orden de registro'], ['az', 'Nombre A–Z'], ['recent', 'Editados recientemente']].map(([value, label]) => `<option value="${value}" ${(filters.sort || 'manual') === value ? 'selected' : ''}>${label}</option>`).join('')}</select>
    </div>`;
  const bulk = selection.length ? `<div class="adm-bulkbar" role="region" aria-label="Acciones masivas"><strong>${plural(selection.length, 'seleccionado', 'seleccionados')}</strong><button type="button" class="adm-btn ghost sm" data-adm-bulk="publish" data-collection="${collection}">${icon('eye')}<span>Publicar</span></button><button type="button" class="adm-btn ghost sm" data-adm-bulk="draft" data-collection="${collection}">${icon('eyeOff')}<span>Pasar a borrador</span></button><button type="button" class="adm-btn danger sm" data-adm-bulk="delete" data-collection="${collection}">${icon('trash')}<span>Eliminar</span></button><button type="button" class="adm-btn ghost sm" data-adm-bulk="clear">Cancelar</button></div>` : '';
  const body = rows.length ? renderAdmRows(collection, rows, { manualOrder }) : all.length
    ? admEmpty('Sin coincidencias', 'Ningún registro coincide con los filtros actuales.', `<button class="adm-btn ghost" type="button" data-adm-clear-filters="${collection}">Limpiar filtros</button>`)
    : admEmpty(`Aún no hay ${schema.plural}`, `Crea el primero; podrás guardarlo como borrador antes de publicarlo.`, `<button class="adm-btn primary" type="button" data-adm-new="${collection}">${icon('plus')}<span>Crear ${esc(schema.singular)}</span></button>`);
  return `${pageHead({ kicker: meta.group, title: meta.label, text: schema.description, actions: `${collection === 'resources' ? `<button class="adm-btn ghost" type="button" data-adm-view="drive">${icon('drive')}<span>${plural(driveCount, 'archivo de Drive', 'archivos de Drive')}</span></button>` : ''}<button class="adm-btn primary" type="button" data-adm-new="${collection}">${icon('plus')}<span>Nuevo ${esc(schema.singular)}</span></button>` })}
    ${toolbar}${bulk}
    <p class="adm-result-count" aria-live="polite">${rows.length === all.length ? plural(all.length, 'registro', 'registros') : `${rows.length} de ${all.length} registros`}${manualOrder && rows.length > 1 ? ' · usa las flechas para cambiar el orden público' : ''}</p>
    ${body}`;
}

function renderAdmRows(collection, rows, { manualOrder }) {
  const schema = COLLECTION_SCHEMAS[collection];
  const layout = schema.layout;
  const total = admRows(collection).length;
  const actions = (row, index) => `<div class="adm-row-actions">
      ${manualOrder ? `<button type="button" class="adm-icon-btn" data-adm-move="-1" data-collection="${collection}" data-id="${attr(row.id)}" ${index === 0 ? 'disabled' : ''} aria-label="Subir">${icon('arrowUp')}</button><button type="button" class="adm-icon-btn" data-adm-move="1" data-collection="${collection}" data-id="${attr(row.id)}" ${index === total - 1 ? 'disabled' : ''} aria-label="Bajar">${icon('arrowDown')}</button>` : ''}
      <button type="button" class="adm-icon-btn" data-adm-edit="${attr(row.id)}" data-collection="${collection}" aria-label="Editar ${attr(schema.title(row) || '')}" title="Editar">${icon('edit')}</button>
      <button type="button" class="adm-icon-btn" data-adm-toggle="${attr(row.id)}" data-collection="${collection}" aria-label="${row.hidden ? 'Publicar' : 'Pasar a borrador'}" title="${row.hidden ? 'Publicar' : 'Pasar a borrador'}">${icon(row.hidden ? 'eye' : 'eyeOff')}</button>
      <div class="adm-menu-wrap"><button type="button" class="adm-icon-btn" data-adm-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Más acciones">${icon('dots')}</button>
        <div class="adm-menu" role="menu" hidden><button type="button" role="menuitem" data-adm-duplicate="${attr(row.id)}" data-collection="${collection}">${icon('copy')}Duplicar como borrador</button><button type="button" role="menuitem" class="danger" data-adm-delete="${attr(row.id)}" data-collection="${collection}">${icon('trash')}Eliminar</button></div></div>
    </div>`;
  const select = row => `<label class="adm-check"><input type="checkbox" data-adm-select="${attr(row.id)}" data-collection="${collection}" ${admState.selection.has(row.id) ? 'checked' : ''} aria-label="Seleccionar ${attr(schema.title(row) || 'registro')}"><span></span></label>`;
  const status = row => row.hidden ? chip('Borrador', 'warn') : chip('Publicado', 'ok');
  const chipsFor = row => (schema.chips?.(row) || []).map(([label, tone]) => chip(label, tone)).join('');
  if (layout === 'cards') {
    return `<div class="adm-cards ${collection}">${rows.map(({ row, index }, position) => `<article class="adm-record-card ${row.hidden ? 'is-draft' : ''}" style="--i:${position}">
      <div class="adm-record-top">${select(row)}${manualOrder ? `<span class="adm-order">${String(index + 1).padStart(2, '0')}</span>` : ''}${status(row)}</div>
      <button type="button" class="adm-record-main" data-adm-edit="${attr(row.id)}" data-collection="${collection}"><span class="adm-thumb lg">${schema.thumb(row)}</span><strong>${esc(schema.title(row) || 'Sin título')}</strong><small>${esc(schema.subtitle(row) || '')}</small></button>
      <div class="adm-record-chips">${chipsFor(row)}</div>${actions(row, index)}</article>`).join('')}</div>`;
  }
  if (layout === 'table') {
    const columns = schema.columns || [];
    return `<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th class="adm-col-check"><span class="sr-only">Seleccionar</span></th><th>Registro</th>${columns.map(([label]) => `<th>${esc(label)}</th>`).join('')}<th>Estado</th><th class="adm-col-actions"><span class="sr-only">Acciones</span></th></tr></thead><tbody>${rows.map(({ row, index }) => `<tr class="${row.hidden ? 'is-draft' : ''}"><td class="adm-col-check">${select(row)}</td><td><button type="button" class="adm-cell-main" data-adm-edit="${attr(row.id)}" data-collection="${collection}"><span class="adm-thumb">${schema.thumb(row)}</span><span><strong>${esc(schema.title(row) || 'Sin título')}</strong><small>${esc(schema.subtitle(row) || '')}</small></span></button></td>${columns.map(([label, read]) => `<td data-label="${attr(label)}">${esc(read(row))}</td>`).join('')}<td data-label="Estado">${status(row)}</td><td class="adm-col-actions">${actions(row, index)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if (layout === 'timetable') {
    const byCycle = CYCLES.map(cycle => ({ cycle, items: rows.filter(({ row }) => row.cycleId === cycle.id) })).filter(group => group.items.length);
    return byCycle.map(group => `<section class="adm-card adm-timetable"><header class="adm-card-head"><div><h2>${esc(group.cycle.name)}</h2><p>${plural(group.items.length, 'bloque', 'bloques')}</p></div></header><div class="adm-week">${DAYS.map(day => `<div class="adm-day"><h3>${day}</h3>${group.items.filter(({ row }) => row.day === day).sort((a, b) => String(a.row.start).localeCompare(String(b.row.start))).map(({ row, index }) => `<article class="adm-slot ${row.hidden ? 'is-draft' : ''}" style="--slot:${scheduleColor(row.subjectId)}"><button type="button" data-adm-edit="${attr(row.id)}" data-collection="${collection}"><strong>${esc(subjectName(row.cycleId, row.subjectId) || 'Materia')}</strong><span>${esc(row.start || '')}–${esc(row.end || '')} · ${esc(row.group || 'Grupo 1')}</span><small>${esc(row.aula || 'Aula por definir')}</small></button>${actions(row, index)}</article>`).join('') || '<p class="adm-slot-empty">Libre</p>'}</div>`).join('')}</div></section>`).join('');
  }
  return `<ul class="adm-list">${rows.map(({ row, index }, position) => `<li class="adm-row ${row.hidden ? 'is-draft' : ''}" style="--i:${position}">${select(row)}<button type="button" class="adm-row-main" data-adm-edit="${attr(row.id)}" data-collection="${collection}"><span class="adm-thumb">${schema.thumb(row)}</span><span class="adm-row-text"><strong>${esc(schema.title(row) || 'Sin título')}</strong><small>${esc(schema.subtitle(row) || '')}</small></span></button><div class="adm-row-chips">${chipsFor(row)}${status(row)}</div>${actions(row, index)}</li>`).join('')}</ul>`;
}

// ---------------------------------------------------------------- editor drawer
function openEditor(collection, id = null, { duplicateOf = null } = {}) {
  const schema = COLLECTION_SCHEMAS[collection];
  if (!schema) return;
  const source = (appData[collection] || []).find(row => row.id === (id || duplicateOf));
  const record = source ? structuredClone(source) : {};
  if (duplicateOf) { record.id = ''; record.hidden = true; }
  if (!source) {
    if (collection === 'resources') Object.assign(record, { cycleId: CYCLES[0].id, subjectId: CYCLES[0].subjects[0].id, typeId: 'apuntes', date: new Date().toISOString().slice(0, 10) });
    if (collection === 'schedules') Object.assign(record, { cycleId: CYCLES[0].id, subjectId: CYCLES[0].subjects[0].id, group: 'Grupo 1', day: 'Lunes', start: '07:00', end: '09:00' });
    if (collection === 'oportunidades') record.tipo = 'Beca';
  }
  admState.drawer = { collection, id: duplicateOf ? null : id, record, dirty: Boolean(duplicateOf), errors: {} };
  renderDrawer();
}

function renderDrawer() {
  const drawer = document.getElementById('adminDrawer');
  const state = admState.drawer;
  if (!drawer || !state) return;
  const schema = COLLECTION_SCHEMAS[state.collection];
  const isNew = !state.id;
  const title = isNew ? `Nuevo ${schema.singular}` : (schema.title(state.record) || `Editar ${schema.singular}`);
  drawer.innerHTML = DOMPurify.sanitize(`<div class="adm-drawer-backdrop" data-adm-close-drawer></div>
    <section class="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="admDrawerTitle">
      <header class="adm-drawer-head"><div><p class="adm-kicker">${isNew ? 'Crear registro' : 'Editar registro'} · ${esc(viewMeta(schema.view || state.collection).label)}</p><h2 id="admDrawerTitle">${esc(title)}</h2></div><div class="adm-drawer-head-actions">${isNew ? chip('Nuevo', 'info') : state.record.hidden ? chip('Borrador', 'warn') : chip('Publicado', 'ok')}<button type="button" class="adm-icon-btn" data-adm-close-drawer aria-label="Cerrar editor">${icon('x')}</button></div></header>
      <div class="adm-drawer-body">
        <form id="admEditor" class="adm-form" novalidate data-collection="${state.collection}">${schema.fields.map(field => renderField(field, state.record)).join('')}</form>
        <aside class="adm-preview" aria-label="Vista previa pública"><div class="adm-preview-head"><span>${icon('eye')} Vista previa pública</span><small>Se actualiza mientras escribes</small></div><div class="adm-preview-stage" id="admPreview"></div></aside>
      </div>
      <footer class="adm-drawer-foot"><p class="adm-form-summary" id="admFormSummary" role="alert"></p><div class="adm-drawer-buttons"><button type="button" class="adm-btn ghost" data-adm-close-drawer>Cancelar</button><button type="button" class="adm-btn secondary" data-adm-save="draft">${icon('eyeOff')}<span>Guardar como borrador</span></button><button type="button" class="adm-btn primary" data-adm-save="publish">${icon('check')}<span>${isNew || state.record.hidden ? 'Publicar' : 'Guardar y publicar'}</span></button></div></footer>
    </section>`);
  drawer.hidden = false;
  renderAdmBreadcrumbs(isNew ? `Nuevo ${schema.singular}` : `Editar`);
  updateDrawerPreview();
  requestAnimationFrame(() => drawer.querySelector('input:not([type=hidden]):not([type=checkbox]), textarea, select')?.focus({ preventScroll: true }));
}

function renderField(field, record) {
  const value = record[field.name] ?? '';
  const id = fieldId(field.name);
  const required = field.required ? '<span class="adm-required" aria-hidden="true">*</span>' : '';
  const help = field.help ? `<small class="adm-help" id="${id}-help">${esc(field.help)}</small>` : '';
  const error = `<small class="adm-error" data-error-for="${field.name}" id="${id}-error"></small>`;
  const described = `aria-describedby="${field.help ? id + '-help ' : ''}${id}-error"`;
  const wrap = (control, extra = '') => `<div class="adm-field ${field.full ? 'full' : ''} ${extra}"><label for="${id}">${esc(field.label)}${required}</label>${control}${help}${error}</div>`;
  const common = `id="${id}" name="${field.name}" ${field.required ? 'required aria-required="true"' : ''} ${described}`;
  switch (field.type) {
    case 'textarea': return wrap(`<textarea ${common} rows="${field.max > 1000 ? 6 : 4}" ${field.max ? `maxlength="${field.max}"` : ''} placeholder="${attr(field.placeholder || '')}">${esc(value)}</textarea>${field.max ? `<span class="adm-counter" data-counter-for="${field.name}">${String(value).length}/${field.max}</span>` : ''}`);
    case 'select': {
      const options = typeof field.options === 'function' ? field.options() : field.options;
      return wrap(`<select ${common}>${options.map(option => { const [optionValue, label] = Array.isArray(option) ? option : [option, option]; return `<option value="${attr(optionValue)}" ${String(value) === String(optionValue) ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}</select>`);
    }
    case 'checkbox': return `<div class="adm-field full"><label class="adm-switch"><input type="checkbox" id="${id}" name="${field.name}" ${value ? 'checked' : ''}><span class="adm-switch-track"><span></span></span><span>${esc(field.label)}</span></label>${help}</div>`;
    case 'cycle': return wrap(`<select ${common} data-adm-cycle-select>${cycleOptions(value || CYCLES[0].id)}</select>`);
    case 'subject': return wrap(`<select ${common} data-adm-subject-select>${subjectOptionsFor(record.cycleId || CYCLES[0].id, value)}</select>`);
    case 'image': return wrap(`<div class="adm-media"><span class="adm-media-thumb" data-media-thumb="${field.name}">${value ? `<img src="${attr(value)}" alt="">` : icon('image')}</span><div class="adm-media-controls"><input ${common} type="url" inputmode="url" value="${attr(value)}" placeholder="https://… o sube una imagen"><div class="adm-media-buttons"><label class="adm-btn ghost sm adm-upload">${icon('upload')}<span>Subir imagen</span><input type="file" accept="image/png,image/jpeg,image/webp" data-adm-upload="${field.name}" data-kind="image" hidden></label>${value ? `<button type="button" class="adm-btn ghost sm" data-adm-clear-field="${field.name}">Quitar</button>` : ''}</div></div></div>`, 'adm-field-media');
    case 'file': return wrap(`<div class="adm-media"><span class="adm-media-thumb">${icon('file')}</span><div class="adm-media-controls"><input ${common} type="url" inputmode="url" value="${attr(value)}" placeholder="https://drive.google.com/…"><div class="adm-media-buttons"><label class="adm-btn ghost sm adm-upload">${icon('upload')}<span>Subir PDF</span><input type="file" accept="application/pdf,.pdf" data-adm-upload="${field.name}" data-kind="pdf" hidden></label>${value ? `<a class="adm-btn ghost sm" href="${attr(value)}" target="_blank" rel="noopener noreferrer">${icon('external')}<span>Abrir</span></a>` : ''}</div></div></div>`, 'adm-field-media');
    case 'urls': return wrap(`<textarea ${common} rows="3" placeholder="https://…; https://…">${esc(value)}</textarea><div class="adm-media-buttons"><label class="adm-btn ghost sm adm-upload">${icon('upload')}<span>Subir y añadir imagen</span><input type="file" accept="image/png,image/jpeg,image/webp" data-adm-upload="${field.name}" data-kind="image" data-append="1" hidden></label></div>`);
    default: return wrap(`<input ${common} type="${['url', 'email', 'date', 'time', 'number'].includes(field.type) ? field.type : 'text'}" value="${attr(value)}" ${field.max ? `maxlength="${field.max}"` : ''} placeholder="${attr(field.placeholder || '')}" ${field.type === 'url' ? 'inputmode="url"' : ''}>`);
  }
}

function readEditor() {
  const form = document.getElementById('admEditor');
  const state = admState.drawer;
  if (!form || !state) return {};
  const schema = COLLECTION_SCHEMAS[state.collection];
  const data = {};
  for (const field of schema.fields) {
    const input = form.elements[field.name];
    if (!input) continue;
    data[field.name] = field.type === 'checkbox' ? input.checked : String(input.value || '').trim();
  }
  return data;
}

function updateDrawerPreview() {
  const state = admState.drawer;
  const node = document.getElementById('admPreview');
  if (!state || !node) return;
  const schema = COLLECTION_SCHEMAS[state.collection];
  const data = { ...state.record, ...readEditor() };
  const index = Math.max(0, (appData[state.collection] || []).findIndex(row => row.id === state.id));
  try { node.innerHTML = DOMPurify.sanitize(schema.preview(data, index)); } catch { node.innerHTML = ''; }
}

function showFieldErrors(errors) {
  const form = document.getElementById('admEditor');
  if (!form) return;
  form.querySelectorAll('[data-error-for]').forEach(node => {
    const message = errors[node.dataset.errorFor] || '';
    node.textContent = message;
    node.closest('.adm-field')?.classList.toggle('has-error', Boolean(message));
    form.elements[node.dataset.errorFor]?.setAttribute?.('aria-invalid', message ? 'true' : 'false');
  });
  const count = Object.keys(errors).length;
  const summary = document.getElementById('admFormSummary');
  if (summary) summary.textContent = count ? `Revisa ${plural(count, 'campo marcado', 'campos marcados')}.` : '';
}

async function saveEditor(mode) {
  const state = admState.drawer;
  if (!state) return;
  const schema = COLLECTION_SCHEMAS[state.collection];
  const data = readEditor();
  const errors = ADM.validateRecord(schema.fields, data);
  showFieldErrors(errors);
  if (Object.keys(errors).length) { document.querySelector('#admEditor .has-error input, #admEditor .has-error textarea, #admEditor .has-error select')?.focus(); return; }
  const id = state.id || uid();
  const record = { ...state.record, ...data, id, hidden: mode === 'draft', updatedAt: new Date().toISOString() };
  if (state.collection === 'resources') Object.assign(record, { uploader: record.uploader || 'Administración', fileName: record.fileName || '', fileType: /^\/uploads\/.+\.pdf$/.test(record.url) ? 'application/pdf' : (record.fileType || '') });
  const buttons = document.querySelectorAll('#adminDrawer [data-adm-save]');
  buttons.forEach(button => { button.disabled = true; button.classList.toggle('is-loading', button.dataset.admSave === mode); });
  const label = schema.title(record) || schema.singular;
  const verb = state.id ? (mode === 'draft' ? 'Guardó como borrador' : 'Editó y publicó') : (mode === 'draft' ? 'Creó como borrador' : 'Creó y publicó');
  const result = await admCommit(() => {
    const rows = appData[state.collection] || (appData[state.collection] = []);
    const index = rows.findIndex(row => row.id === id);
    if (index >= 0) rows[index] = record; else rows.push(record);
  }, `${verb} ${schema.singular} «${label}»`, { success: mode === 'draft' ? 'Borrador guardado' : 'Publicado en el portal' });
  buttons.forEach(button => { button.disabled = false; button.classList.remove('is-loading'); });
  if (result.ok) { closeDrawer(true); renderAdminContent({ keepScroll: true }); admFlash(id); }
  else if (!result.conflict) { const summary = document.getElementById('admFormSummary'); if (summary) summary.textContent = 'No se guardó: ' + result.error; }
}

async function closeDrawer(force = false) {
  const drawer = document.getElementById('adminDrawer');
  if (!admState.drawer || !drawer) return;
  if (!force && admState.drawer.dirty && !(await confirmAction({ title: 'Descartar cambios', message: 'Los cambios de este formulario no se han guardado.', confirmText: 'Descartar', cancelText: 'Seguir editando' }))) return;
  admState.drawer = null;
  drawer.classList.add('is-closing');
  const finish = () => { drawer.hidden = true; drawer.classList.remove('is-closing'); drawer.innerHTML = ''; };
  if (motionBehavior() === 'auto') finish(); else setTimeout(finish, 200);
  renderAdmBreadcrumbs();
}

function admFlash(id) {
  requestAnimationFrame(() => {
    const node = el.adminContent?.querySelector(`[data-adm-edit="${CSS.escape(id)}"]`)?.closest('.adm-record-card, tr, .adm-row, .adm-slot');
    if (!node) return;
    node.classList.add('adm-flash');
    node.scrollIntoView({ block: 'nearest', behavior: motionBehavior() });
    setTimeout(() => node.classList.remove('adm-flash'), 1600);
  });
}

async function admUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  const kind = input.dataset.kind;
  if (file.size > 3_000_000) { showToast('Archivo demasiado grande', 'El máximo es 3 MB.', 'error'); input.value = ''; return; }
  if (kind === 'image' && !/^image\/(png|jpeg|webp)$/.test(file.type)) { showToast('Formato no permitido', 'Usa PNG, JPG o WebP.', 'error'); input.value = ''; return; }
  if (kind === 'pdf' && file.type !== 'application/pdf') { showToast('Formato no permitido', 'Sube un documento PDF.', 'error'); input.value = ''; return; }
  const label = input.closest('.adm-upload');
  label?.classList.add('is-loading');
  try {
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
    const result = await portalApi('/api/upload', { data, kind });
    const form = input.closest('form') || document.getElementById('admEditor') || input.closest('.adm-card');
    const target = form?.querySelector(`[name="${CSS.escape(input.dataset.admUpload)}"]`);
    if (target) {
      target.value = input.dataset.append ? [target.value.trim(), result.url].filter(Boolean).join('; ') : result.url;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (admState.drawer && input.dataset.kind === 'pdf') admState.drawer.record.fileName = file.name;
    const thumb = form?.querySelector(`[data-media-thumb="${CSS.escape(input.dataset.admUpload)}"]`);
    if (thumb && kind === 'image' && !input.dataset.append) thumb.innerHTML = DOMPurify.sanitize(`<img src="${attr(result.url)}" alt="">`);
    showToast(kind === 'pdf' ? 'PDF subido' : 'Imagen subida', 'Se publicará cuando guardes el registro.', 'success');
  } catch (error) { showToast('No se pudo subir', error.message, 'error'); }
  finally { label?.classList.remove('is-loading'); input.value = ''; }
}

// ---------------------------------------------------------------- record actions
async function admToggle(collection, id) {
  const schema = COLLECTION_SCHEMAS[collection];
  const row = (appData[collection] || []).find(item => item.id === id);
  if (!row) return;
  const publish = Boolean(row.hidden);
  await admCommit(() => { row.hidden = !publish; row.updatedAt = new Date().toISOString(); }, `${publish ? 'Publicó' : 'Pasó a borrador'} ${schema.singular} «${schema.title(row) || ''}»`, { success: publish ? 'Publicado en el portal' : 'Ahora es un borrador' });
  renderAdminContent({ keepScroll: true });
}

async function admDelete(collection, id) {
  const schema = COLLECTION_SCHEMAS[collection];
  const row = (appData[collection] || []).find(item => item.id === id);
  if (!row) return;
  if (!(await confirmAction({ title: `Eliminar ${schema.singular}`, message: `«${schema.title(row) || 'Sin título'}» se eliminará del portal y del servidor. Esta acción no se puede deshacer; si lo necesitas, descarga antes un respaldo.`, confirmText: 'Eliminar definitivamente' }))) return;
  await admCommit(() => { appData[collection] = appData[collection].filter(item => item.id !== id); }, `Eliminó ${schema.singular} «${schema.title(row) || ''}»`, { success: 'Registro eliminado' });
  admState.selection.delete(id);
  renderAdminContent({ keepScroll: true });
}

async function admMove(collection, id, delta) {
  const schema = COLLECTION_SCHEMAS[collection];
  const rows = appData[collection] || [];
  const index = rows.findIndex(item => item.id === id);
  if (index < 0) return;
  await admCommit(() => { appData[collection] = ADM.moveItem(rows, index, delta); }, `Reordenó ${schema.plural}`, { success: 'Orden actualizado' });
  renderAdminContent({ keepScroll: true });
  requestAnimationFrame(() => el.adminContent?.querySelector(`[data-adm-move="${delta}"][data-id="${CSS.escape(id)}"]:not(:disabled)`)?.focus());
}

async function admBulk(collection, action) {
  const schema = COLLECTION_SCHEMAS[collection];
  const ids = [...admState.selection].filter(id => (appData[collection] || []).some(row => row.id === id));
  if (!ids.length) return;
  if (action === 'delete' && !(await confirmAction({ title: `Eliminar ${plural(ids.length, schema.singular, schema.plural)}`, message: 'Los registros seleccionados se eliminarán del portal y del servidor. Esta acción no se puede deshacer.', confirmText: 'Eliminar seleccionados' }))) return;
  const set = new Set(ids);
  const now = new Date().toISOString();
  const summary = action === 'delete' ? `Eliminó ${plural(ids.length, schema.singular, schema.plural)}` : `${action === 'publish' ? 'Publicó' : 'Pasó a borrador'} ${plural(ids.length, schema.singular, schema.plural)}`;
  const result = await admCommit(() => {
    if (action === 'delete') appData[collection] = appData[collection].filter(row => !set.has(row.id));
    else appData[collection].forEach(row => { if (set.has(row.id)) { row.hidden = action !== 'publish'; row.updatedAt = now; } });
  }, summary, { success: summary });
  if (result.ok) admState.selection.clear();
  renderAdminContent({ keepScroll: true });
}

// ---------------------------------------------------------------- inbox
function renderAdmInbox() {
  const messages = appData.messages || [];
  const filters = admState.inbox;
  const rows = messages.filter(message => ADM.messageMatches(message, filters));
  const subjects = [...new Set(messages.filter(message => filters.type === 'all' || message.type === filters.type).map(message => message.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const selected = messages.find(message => message.id === filters.selected) || null;
  const counts = Object.fromEntries(MESSAGE_TYPES.map(([type]) => [type, messages.filter(message => (type === 'all' || message.type === type) && ADM.isOpen(message)).length]));
  const statuses = [...new Set(Object.values(MESSAGE_FLOW).flat())];
  return `${pageHead({ kicker: 'Atención institucional', title: 'Bandeja', text: 'Consultas, inscripciones y reservas guardadas de forma privada en el servidor.', actions: `<button class="adm-btn ghost" type="button" data-adm-refresh>${icon('refresh')}<span>Actualizar</span></button><button class="adm-btn ghost" type="button" data-adm-export ${rows.length ? '' : 'disabled'}>${icon('download')}<span>Exportar CSV (${rows.length})</span></button>` })}
    <div class="adm-tabs" role="tablist" aria-label="Tipo de solicitud">${MESSAGE_TYPES.map(([type, label]) => `<button type="button" role="tab" aria-selected="${filters.type === type}" class="${filters.type === type ? 'active' : ''}" data-adm-inbox-type="${attr(type)}">${esc(label)}${counts[type] ? `<span class="adm-tab-count">${counts[type]}</span>` : ''}</button>`).join('')}</div>
    <div class="adm-toolbar">
      <label class="adm-search-field">${icon('search')}<input type="search" value="${attr(filters.query)}" placeholder="Buscar por nombre, correo, código o texto…" data-adm-inbox="query" aria-label="Buscar en la bandeja"></label>
      <select class="adm-select" data-adm-inbox="status" aria-label="Estado"><option value="abiertas" ${filters.status === 'abiertas' ? 'selected' : ''}>Abiertas</option><option value="all" ${filters.status === 'all' ? 'selected' : ''}>Todos los estados</option>${statuses.map(status => `<option value="${attr(status)}" ${filters.status === status ? 'selected' : ''}>${esc(status[0].toUpperCase() + status.slice(1))}</option>`).join('')}</select>
      <select class="adm-select" data-adm-inbox="subject" aria-label="Asunto"><option value="all">Todos los asuntos</option>${subjects.map(subject => `<option value="${attr(subject)}" ${filters.subject === subject ? 'selected' : ''}>${esc(subject)}</option>`).join('')}</select>
      <label class="adm-date-field"><span>Desde</span><input type="date" value="${attr(filters.from)}" data-adm-inbox="from"></label>
      <label class="adm-date-field"><span>Hasta</span><input type="date" value="${attr(filters.to)}" data-adm-inbox="to"></label>
    </div>
    <div class="adm-inbox ${selected ? 'has-selection' : ''}">
      <div class="adm-inbox-list" role="list" aria-label="Solicitudes">${rows.length ? rows.map(message => `<button type="button" role="listitem" class="adm-message ${message.id === filters.selected ? 'active' : ''} ${message.read ? '' : 'unread'}" data-adm-open-message="${attr(message.id)}"><span class="adm-avatar">${esc(initials(message.name || '?'))}</span><span class="adm-message-body"><span class="adm-message-top"><strong>${esc(message.name || 'Sin nombre')}</strong><small>${esc(ADM.relativeTime(message.date))}</small></span><span class="adm-message-subject">${esc(message.type)} · ${esc(message.subject || message.materia || message.producto || 'Sin asunto')}</span><span class="adm-message-snippet">${esc(String(message.message || '').slice(0, 120))}</span><span class="adm-message-chips">${chip(message.status || 'pendiente', STATUS_TONE[message.status || 'pendiente'] || 'neutral')}${message.type === 'Consulta' ? emailChip(message) : ''}</span></span></button>`).join('') : admEmpty(messages.length ? 'Sin resultados' : 'Bandeja vacía', messages.length ? 'Ninguna solicitud coincide con los filtros.' : 'Cuando alguien envíe una consulta o inscripción aparecerá aquí.', messages.length ? '<button class="adm-btn ghost" type="button" data-adm-inbox-reset>Limpiar filtros</button>' : '')}</div>
      <div class="adm-inbox-detail">${selected ? renderMessageDetail(selected) : `<div class="adm-inbox-placeholder">${icon('inbox')}<strong>Selecciona una solicitud</strong><p>Verás los datos de contacto, el historial de estados y las respuestas rápidas.</p></div>`}</div>
    </div>`;
}

function emailChip(message) {
  const status = message.emailStatus;
  if (status === 'enviado') return chip('Correo enviado', 'ok');
  if (status === 'error') return chip('Correo fallido', 'bad');
  if (status === 'sin configurar') return chip('Correo sin configurar', 'warn');
  if (status === 'enviando') return chip('Enviando correo', 'info');
  return '';
}

function renderMessageDetail(message) {
  const flow = MESSAGE_FLOW[message.type] || MESSAGE_FLOW.Consulta;
  const phone = String(message.phone || '');
  const wa = ADM.whatsappNumber(phone);
  const code = message.trackingCode || '';
  const firstName = String(message.name || '').split(/\s+/)[0] || '';
  const mailto = message.email ? `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(`Re: ${code ? `[${code}] ` : ''}${message.subject || message.type}`)}&body=${encodeURIComponent(`Hola ${firstName},\n\nGracias por escribir a la ASO de Administración de Empresas.\n\n`)}` : '';
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${firstName}, te escribimos de la ASO de Administración de Empresas${code ? ` sobre tu solicitud ${code}` : ''}.`)}` : '';
  const history = Array.isArray(message.history) && message.history.length ? message.history : [{ date: message.date, status: 'pendiente', actor: 'Formulario público' }];
  const fields = [['Correo', message.email], ['Teléfono', phone], ['Ciclo', message.cycle], ['Asunto', message.subject], ['Materia', message.materia], ['Producto', message.producto]].filter(([, value]) => value);
  const email = message.type === 'Consulta' ? (message.emailStatus === 'enviado'
    ? `<div class="adm-callout ok">${icon('check')}<div><strong>Envío de correo confirmado</strong><p>Apps Script confirmó el envío a asoadmiucuenca@gmail.com.</p></div></div>`
    : message.emailStatus === 'sin configurar'
      ? `<div class="adm-callout warn">${icon('alert')}<div><strong>El reenvío por correo no está configurado</strong><p>La consulta está guardada aquí. Para recibir una copia en asoadmiucuenca@gmail.com, despliega la versión actual del Apps Script (README → «Consultas al correo de la ASO») y configura la URL en Integraciones.</p><button type="button" class="adm-btn ghost sm" data-adm-resend="${attr(message.id)}">${icon('refresh')}<span>Reintentar envío</span></button></div></div>`
      : message.emailStatus === 'enviando'
        ? `<div class="adm-callout info">${icon('clock')}<div><strong>Envío en curso</strong><p>El servidor todavía no confirmó el resultado. Actualiza en unos segundos.</p><button type="button" class="adm-btn ghost sm" data-adm-refresh>${icon('refresh')}<span>Actualizar</span></button></div></div>`
        : `<div class="adm-callout bad">${icon('alert')}<div><strong>El correo no se pudo enviar</strong><p>${esc(message.emailError || 'Sin detalle del servicio.')} La consulta sigue guardada en la bandeja.</p><button type="button" class="adm-btn ghost sm" data-adm-resend="${attr(message.id)}">${icon('refresh')}<span>Reintentar envío</span></button></div></div>`) : '';
  return `<article class="adm-detail">
    <header class="adm-detail-head"><button type="button" class="adm-icon-btn adm-detail-back" data-adm-close-message aria-label="Volver a la lista">${icon('chevronLeft')}</button><span class="adm-avatar lg">${esc(initials(message.name || '?'))}</span><div><h2>${esc(message.name || 'Sin nombre')}</h2><p>${esc(message.type)}${code ? ` · <span class="adm-mono">${esc(code)}</span>` : ''} · ${esc(formatDate(message.date))}</p></div>${chip(message.status || 'pendiente', STATUS_TONE[message.status || 'pendiente'] || 'neutral')}</header>
    <div class="adm-reply">${mailto ? `<a class="adm-btn primary sm" href="${attr(mailto)}">${icon('mail')}<span>Responder por correo</span></a>` : ''}${waLink ? `<a class="adm-btn secondary sm" href="${attr(waLink)}" target="_blank" rel="noopener noreferrer">${icon('chat')}<span>WhatsApp</span></a>` : ''}${phone ? `<a class="adm-btn ghost sm" href="tel:${attr(phone.replace(/[^0-9+]/g, ''))}">${icon('phone')}<span>Llamar</span></a>` : ''}<button type="button" class="adm-btn ghost sm" data-adm-copy="${attr(message.email || phone)}">${icon('copy')}<span>Copiar contacto</span></button></div>
    <dl class="adm-detail-fields">${fields.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
    <section class="adm-detail-message"><h3>Mensaje</h3><p>${esc(message.message || '')}</p></section>
    ${email}
    <section class="adm-detail-status"><h3>Estado de seguimiento</h3><div class="adm-segmented wrap" role="group" aria-label="Cambiar estado">${flow.map(status => `<button type="button" class="${(message.status || 'pendiente') === status ? 'active' : ''}" data-adm-status="${attr(status)}" data-id="${attr(message.id)}" aria-pressed="${(message.status || 'pendiente') === status}">${esc(status[0].toUpperCase() + status.slice(1))}</button>`).join('')}</div></section>
    <section class="adm-detail-note"><h3>Nota interna</h3><form data-adm-note-form="${attr(message.id)}"><textarea name="note" rows="3" maxlength="1000" placeholder="Visible solo para la administración">${esc(message.adminNote || '')}</textarea><div class="adm-note-actions"><button type="submit" class="adm-btn ghost sm">${icon('check')}<span>Guardar nota</span></button></div></form></section>
    <section class="adm-detail-history"><h3>Historial</h3><ol class="adm-timeline">${history.slice().reverse().map(entry => `<li><span class="adm-timeline-dot ${STATUS_TONE[entry.status] || ''}"></span><div><strong>${esc(entry.status)}</strong><small>${esc(entry.actor || '')} · ${esc(ADM.relativeTime(entry.date))}</small></div></li>`).join('')}</ol></section>
    <footer class="adm-detail-foot"><button type="button" class="adm-btn ghost sm" data-adm-read="${attr(message.id)}">${icon(message.read ? 'eyeOff' : 'eye')}<span>${message.read ? 'Marcar como no leída' : 'Marcar como leída'}</span></button><button type="button" class="adm-btn danger sm" data-adm-delete-message="${attr(message.id)}">${icon('trash')}<span>Eliminar</span></button></footer>
  </article>`;
}

async function admUpdateMessage(payload, success) {
  try {
    const result = await portalApi('/api/message', payload);
    if (payload.remove) appData.messages = appData.messages.filter(message => message.id !== payload.id);
    else if (result.message) appData.messages = appData.messages.map(message => message.id === payload.id ? result.message : message);
    if (success) showToast(success, '', 'success');
    renderAdminTabs(); renderAdminContent({ keepScroll: true });
    return true;
  } catch (error) { showToast('No se pudo actualizar', error.message, 'error'); return false; }
}

async function admSetStatus(id, status) {
  const message = (appData.messages || []).find(item => item.id === id);
  if (!message || message.status === status) return;
  if (['cancelada', 'archivada'].includes(status) && !(await confirmAction({ title: `Marcar como ${status}`, message: 'La solicitud saldrá de la vista de abiertas. Podrás cambiar el estado más tarde.', confirmText: `Marcar como ${status}`, danger: false }))) return;
  await admUpdateMessage({ id, status, read: true }, `Estado actualizado: ${status}`);
}

async function admResend(button) {
  button.disabled = true; button.classList.add('is-loading');
  try {
    const result = await portalApi('/api/message', { id: button.dataset.admResend, resend: true });
    await loadAdminInbox();
    renderAdminTabs(); renderAdminContent({ keepScroll: true });
    if (result.emailStatus === 'enviado') showToast('Correo enviado a la ASO', 'El servicio confirmó el envío.', 'success');
    else if (result.emailStatus === 'enviando') showToast('Envío en cola', 'Puedes seguir trabajando. La bandeja actualizará el resultado automáticamente.', 'success');
    else showToast(result.emailStatus === 'sin configurar' ? 'Correo sin configurar' : 'El correo no se pudo enviar', result.emailError || 'Revisa la configuración del Apps Script.', 'error');
  } catch (error) { showToast('No se pudo reenviar', error.message, 'error'); button.disabled = false; button.classList.remove('is-loading'); }
}

function admExportCsv() {
  const rows = (appData.messages || []).filter(message => ADM.messageMatches(message, admState.inbox));
  const headers = ['Fecha', 'Código', 'Tipo', 'Estado', 'Nombre', 'Correo', 'Teléfono', 'Ciclo', 'Materia/Producto', 'Asunto', 'Mensaje', 'Correo ASO'];
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = '﻿' + [headers, ...rows.map(message => [formatDate(message.date), message.trackingCode, message.type, message.status || 'pendiente', message.name, message.email, message.phone, message.cycle, message.materia || message.producto, message.subject, message.message, message.emailStatus])].map(row => row.map(cell).join(',')).join('\n');
  admDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `bandeja-aso-${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('CSV exportado', plural(rows.length, 'solicitud', 'solicitudes'), 'success');
}

function admDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- home editor
function currentHomeSettings() {
  const settings = appData.settings || {};
  return {
    heroEyebrow: settings.heroEyebrow || '', heroTitle: settings.heroTitle || '', heroSubtitle: settings.heroSubtitle || '', welcome: settings.welcome || '', heroImage: settings.heroImage || '',
    heroPrimaryLabel: settings.heroPrimaryLabel || '', heroPrimarySection: settings.heroPrimarySection || 'repositorio', heroSecondaryLabel: settings.heroSecondaryLabel || '', heroSecondarySection: settings.heroSecondarySection || 'consultas',
    mission: settings.mission || '', vision: settings.vision || '', homeBlocks: resolveHomeBlocks(settings.homeBlocks)
  };
}

function renderAdmHomeEditor() {
  if (!admState.homeDraft) admState.homeDraft = currentHomeSettings();
  const draft = admState.homeDraft;
  const sectionOptions = selected => SECTIONS.filter(section => isSectionEnabled(section)).map(section => `<option value="${section}" ${section === selected ? 'selected' : ''}>${esc(sectionLabel(section))}</option>`).join('');
  const text = (name, label, { max, area, help, placeholder } = {}) => `<div class="adm-field ${area ? 'full' : ''}"><label for="adm-h-${name}">${esc(label)}</label>${area ? `<textarea id="adm-h-${name}" data-adm-home="${name}" rows="${area}" maxlength="${max}" placeholder="${attr(placeholder || '')}">${esc(draft[name])}</textarea>` : `<input id="adm-h-${name}" data-adm-home="${name}" value="${attr(draft[name])}" maxlength="${max}" placeholder="${attr(placeholder || '')}">`}<span class="adm-counter">${String(draft[name] || '').length}/${max}</span>${help ? `<small class="adm-help">${esc(help)}</small>` : ''}</div>`;
  return `${pageHead({ kicker: 'Sitio público', title: 'Editor de portada', text: 'Cambia textos, botones, imagen y el orden de los bloques. Revisa la vista previa antes de publicar.', actions: `<button class="adm-btn ghost" type="button" data-adm-home-reset ${admState.homeDirty ? '' : 'disabled'}>Descartar</button><button class="adm-btn secondary" type="button" data-adm-home-preview>${icon('eye')}<span>Ver en el portal</span></button><button class="adm-btn primary" type="button" data-adm-home-publish ${admState.homeDirty ? '' : 'disabled'}>${icon('check')}<span>Publicar portada</span></button>` })}
    ${admState.homeDirty ? `<div class="adm-callout info compact">${icon('clock')}<div><strong>Cambios sin publicar</strong><p>Los estudiantes siguen viendo la versión anterior hasta que publiques.</p></div></div>` : ''}
    <div class="adm-editor-split">
      <div class="adm-editor-forms">
        <section class="adm-card"><header class="adm-card-head"><div><h2>Mensaje principal</h2><p>Lo primero que ve cada estudiante</p></div></header><div class="adm-form">
          ${text('heroEyebrow', 'Antetítulo', { max: 80, placeholder: 'Administración de Empresas · Universidad de Cuenca' })}
          ${text('heroTitle', 'Título principal', { max: 140, area: 2, placeholder: 'Tu carrera. Tu comunidad. Tu próximo paso.' })}
          ${text('heroSubtitle', 'Subtítulo', { max: 240, area: 2 })}
          ${text('welcome', 'Texto de bienvenida', { max: 600, area: 3 })}
        </div></section>
        <section class="adm-card"><header class="adm-card-head"><div><h2>Botones de acción</h2><p>Cada botón abre una sección activa del portal</p></div></header><div class="adm-form">
          ${text('heroPrimaryLabel', 'Botón principal', { max: 40, placeholder: 'Abrir repositorio' })}
          <div class="adm-field"><label for="adm-h-heroPrimarySection">Destino</label><select id="adm-h-heroPrimarySection" data-adm-home="heroPrimarySection">${sectionOptions(draft.heroPrimarySection)}</select></div>
          ${text('heroSecondaryLabel', 'Botón secundario', { max: 40, placeholder: 'Enviar consulta' })}
          <div class="adm-field"><label for="adm-h-heroSecondarySection">Destino</label><select id="adm-h-heroSecondarySection" data-adm-home="heroSecondarySection">${sectionOptions(draft.heroSecondarySection)}</select></div>
        </div></section>
        <section class="adm-card"><header class="adm-card-head"><div><h2>Elemento destacado</h2><p>Opcional: reemplaza la ilustración abstracta por una imagen institucional</p></div></header><div class="adm-form">
          <div class="adm-field full adm-field-media"><label for="adm-h-heroImage">Imagen destacada</label><div class="adm-media"><span class="adm-media-thumb" data-media-thumb="heroImage">${draft.heroImage ? `<img src="${attr(draft.heroImage)}" alt="">` : icon('image')}</span><div class="adm-media-controls"><input id="adm-h-heroImage" name="heroImage" data-adm-home="heroImage" type="url" value="${attr(draft.heroImage)}" placeholder="https://… o sube una imagen"><div class="adm-media-buttons"><label class="adm-btn ghost sm adm-upload">${icon('upload')}<span>Subir imagen</span><input type="file" accept="image/png,image/jpeg,image/webp" data-adm-upload="heroImage" data-kind="image" hidden></label>${draft.heroImage ? `<button type="button" class="adm-btn ghost sm" data-adm-home-clear-image>Usar ilustración</button>` : ''}</div></div></div><small class="adm-help">Formato horizontal recomendado (1600×1000). Usa solo imágenes con derechos de uso.</small></div>
        </div></section>
        <section class="adm-card"><header class="adm-card-head"><div><h2>Bloques de la portada</h2><p>Ordena y muestra u oculta cada bloque. La portada principal siempre va primero.</p></div></header>
          <ol class="adm-blocks">${draft.homeBlocks.map((block, index) => { const meta = HOME_BLOCKS.find(item => item.id === block.id); return `<li class="${block.visible ? '' : 'is-off'}"><span class="adm-order">${String(index + 1).padStart(2, '0')}</span><div><strong>${esc(meta?.label || block.id)}</strong><small>${esc(meta?.description || '')}</small></div><label class="adm-switch compact" title="${block.visible ? 'Visible' : 'Oculto'}"><input type="checkbox" data-adm-block-visible="${block.id}" ${block.visible ? 'checked' : ''} aria-label="Mostrar ${attr(meta?.label || block.id)}"><span class="adm-switch-track"><span></span></span></label><button type="button" class="adm-icon-btn" data-adm-block-move="-1" data-block="${block.id}" ${index === 0 ? 'disabled' : ''} aria-label="Subir bloque">${icon('arrowUp')}</button><button type="button" class="adm-icon-btn" data-adm-block-move="1" data-block="${block.id}" ${index === draft.homeBlocks.length - 1 ? 'disabled' : ''} aria-label="Bajar bloque">${icon('arrowDown')}</button></li>`; }).join('')}</ol>
        </section>
        <section class="adm-card"><header class="adm-card-head"><div><h2>Misión y visión</h2><p>Textos institucionales del bloque Misión y visión</p></div></header><div class="adm-form">
          ${text('mission', 'Misión', { max: 1200, area: 4 })}
          ${text('vision', 'Visión', { max: 1200, area: 4 })}
        </div></section>
      </div>
      <aside class="adm-editor-preview"><div class="adm-preview-head"><span>${icon('eye')} Vista previa</span><small>Aún no publicada</small></div><div class="adm-home-preview" id="admHomePreview"></div></aside>
    </div>`;
}

function updateHomePreview() {
  const node = document.getElementById('admHomePreview');
  const draft = admState.homeDraft;
  if (!node || !draft) return;
  const title = draft.heroTitle || defaultData.settings.heroTitle;
  const primary = draft.heroPrimaryLabel || 'Abrir repositorio', secondary = draft.heroSecondaryLabel || 'Enviar consulta';
  node.innerHTML = DOMPurify.sanitize(`<div class="adm-hp-hero">
      <div class="adm-hp-copy"><span class="adm-hp-eyebrow">${esc(draft.heroEyebrow || 'Administración de Empresas · Universidad de Cuenca')}</span><h3>${esc(title)}</h3>${draft.heroSubtitle ? `<p class="adm-hp-sub">${esc(draft.heroSubtitle)}</p>` : ''}<p>${esc(draft.welcome)}</p><div class="adm-hp-actions"><span class="adm-hp-btn primary">${esc(primary)} →</span><span class="adm-hp-btn">${esc(secondary)}</span></div><small>${esc(sectionLabel(draft.heroPrimarySection))} · ${esc(sectionLabel(draft.heroSecondarySection))}</small></div>
      <div class="adm-hp-art">${draft.heroImage ? `<img src="${attr(draft.heroImage)}" alt="">` : '<span class="adm-hp-shape a"></span><span class="adm-hp-shape b"></span><span class="adm-hp-shape c"></span>'}</div>
    </div>
    <ol class="adm-hp-blocks">${draft.homeBlocks.filter(block => block.visible).map(block => `<li>${esc(HOME_BLOCKS.find(item => item.id === block.id)?.label || block.id)}</li>`).join('') || '<li>Solo la portada principal</li>'}</ol>`);
}

function homeDraftPayload() {
  const draft = admState.homeDraft;
  const payload = {};
  for (const key of ['heroEyebrow', 'heroTitle', 'heroSubtitle', 'welcome', 'heroImage', 'heroPrimaryLabel', 'heroPrimarySection', 'heroSecondaryLabel', 'heroSecondarySection', 'mission', 'vision']) payload[key] = String(draft[key] || '').trim();
  payload.homeBlocks = draft.homeBlocks.map(block => ({ id: block.id, visible: Boolean(block.visible) }));
  return payload;
}

function validateHomeDraft(payload) {
  if (Object.values(payload).some(value => typeof value === 'string' && /[<>]/.test(value))) return 'Usa texto simple, sin etiquetas HTML.';
  if (payload.heroImage && !/^https:\/\/\S+$/i.test(payload.heroImage) && !/^\/uploads\/[a-f0-9]+\.(png|jpg|webp)$/.test(payload.heroImage)) return 'La imagen destacada debe usar un enlace HTTPS o una imagen subida.';
  if (!payload.heroTitle) return 'El título principal no puede quedar vacío.';
  return '';
}

async function publishHomeDraft() {
  const payload = homeDraftPayload();
  const problem = validateHomeDraft(payload);
  if (problem) { showToast('Revisa la portada', problem, 'error'); return false; }
  const result = await admCommit(() => { appData.settings = { ...appData.settings, ...payload }; homePreviewSettings = null; }, 'Actualizó la portada del portal', { success: 'Portada publicada' });
  if (result.ok) { admState.homeDraft = null; admState.homeDirty = false; document.body.classList.remove('home-preview-active'); }
  if (!el.adminPanel.hidden) renderAdminContent({ keepScroll: true });
  return result.ok;
}

function previewHomeInPortal() {
  const payload = homeDraftPayload();
  const problem = validateHomeDraft(payload);
  if (problem) { showToast('Revisa la portada', problem, 'error'); return; }
  homePreviewSettings = { ...appData.settings, ...payload };
  el.adminPanel.hidden = true;
  document.body.classList.remove('adm-open');
  document.body.classList.add('home-preview-active');
  const bar = document.getElementById('homePreviewBar');
  if (bar) bar.hidden = false;
  showSection('inicio', true);
  renderHome();
  window.scrollTo({ top: 0, behavior: motionBehavior() });
}

function exitHomePreview({ reopen = true } = {}) {
  homePreviewSettings = null;
  document.body.classList.remove('home-preview-active');
  const bar = document.getElementById('homePreviewBar');
  if (bar) bar.hidden = true;
  renderHome();
  if (reopen) { adminTab = 'portada'; el.adminPanel.hidden = false; document.body.classList.add('adm-open'); admState.view = 'portada'; renderAdminTabs(); renderAdminContent(); }
}

// ---------------------------------------------------------------- sections
function renderAdmSections() {
  if (!admState.sectionsDraft) admState.sectionsDraft = { enabled: Object.fromEntries(SECTIONS.map(section => [section, isSectionEnabled(section)])), meta: structuredClone(appData.settings.sectionMeta || {}) };
  const draft = admState.sectionsDraft;
  const editable = SECTIONS.filter(section => section !== 'inicio');
  const active = editable.filter(section => draft.enabled[section]).length;
  return `${pageHead({ kicker: 'Sitio público', title: 'Secciones', text: 'Activa o desactiva secciones y ajusta su encabezado. Inicio e Información son esenciales y permanecen visibles; el acceso administrativo siempre está disponible en la barra superior y en el pie.', actions: `<button class="adm-btn ghost" type="button" data-adm-sections-reset ${admState.sectionsDirty ? '' : 'disabled'}>Descartar</button><button class="adm-btn primary" type="button" data-adm-sections-publish ${admState.sectionsDirty ? '' : 'disabled'}>${icon('check')}<span>Publicar cambios</span></button>` })}
    <p class="adm-result-count">${active} de ${editable.length} secciones activas</p>
    <div class="adm-section-list">${SECTIONS.map(section => {
      const locked = ['inicio', 'informacion'].includes(section);
      const defaults = SECTION_HEADER_DEFAULTS[section] || {};
      const meta = draft.meta[section] || {};
      const on = locked || draft.enabled[section];
      return `<article class="adm-section-item ${on ? '' : 'is-off'}"><div class="adm-section-row"><span class="adm-thumb">${icon(SECTION_ICONS[section] || 'grid')}</span><span class="adm-section-name"><strong>${esc(meta.title || defaults.title || sectionLabel(section))}</strong><small>#${section} · ${on ? 'visible' : 'oculta'}${meta.title || meta.description || meta.tag ? ' · encabezado personalizado' : ''}</small></span>${locked ? `<span class="adm-chip muted" title="Sección esencial: siempre visible">${icon('lock')} Esencial</span>` : `<label class="adm-switch compact"><input type="checkbox" data-adm-section-toggle="${section}" ${on ? 'checked' : ''} aria-label="Mostrar ${attr(sectionLabel(section))}"><span class="adm-switch-track"><span></span></span></label>`}</div>
        ${section === 'inicio' ? '<p class="adm-muted adm-section-note">El contenido de Inicio se edita desde el Editor de portada.</p>' : `<details><summary>${icon('edit')}<span>Editar encabezado</span><span class="adm-summary-caret" aria-hidden="true">${icon('chevronDown')}</span></summary><div class="adm-form adm-section-form">
          <div class="adm-field"><label for="adm-s-${section}-tag">Etiqueta</label><input id="adm-s-${section}-tag" data-adm-section-meta="${section}" data-key="tag" maxlength="60" value="${attr(meta.tag || '')}" placeholder="${attr(defaults.tag || '')}"></div>
          <div class="adm-field"><label for="adm-s-${section}-title">Título</label><input id="adm-s-${section}-title" data-adm-section-meta="${section}" data-key="title" maxlength="120" value="${attr(meta.title || '')}" placeholder="${attr(defaults.title || '')}"></div>
          <div class="adm-field full"><label for="adm-s-${section}-description">Descripción</label><textarea id="adm-s-${section}-description" rows="2" data-adm-section-meta="${section}" data-key="description" maxlength="400" placeholder="${attr(defaults.description || '')}">${esc(meta.description || '')}</textarea><small class="adm-help">Deja un campo vacío para usar el texto original.</small></div>
          ${meta.title || meta.description || meta.tag ? `<div class="adm-field full"><button type="button" class="adm-btn ghost sm" data-adm-section-restore="${section}">Restablecer texto original</button></div>` : ''}
        </div></details>`}</article>`;
    }).join('')}</div>`;
}

async function publishSections() {
  const draft = admState.sectionsDraft;
  const meta = Object.fromEntries(Object.entries(draft.meta).map(([section, value]) => [section, Object.fromEntries(Object.entries(value || {}).map(([key, text]) => [key, String(text || '').trim()]).filter(([, text]) => text))]).filter(([, value]) => Object.keys(value).length));
  if (JSON.stringify(meta).match(/[<>]/)) { showToast('Revisa los textos', 'Usa texto simple, sin etiquetas HTML.', 'error'); return; }
  const enabledSections = Object.fromEntries(SECTIONS.map(section => [section, ['inicio', 'informacion'].includes(section) || Boolean(draft.enabled[section])]));
  const result = await admCommit(() => { appData.settings = { ...appData.settings, enabledSections, sectionMeta: meta }; applySectionVisibility(); applySectionMeta(); }, 'Actualizó las secciones del portal', { success: 'Secciones publicadas' });
  if (result.ok) { admState.sectionsDraft = null; admState.sectionsDirty = false; applySectionMeta(); }
  renderAdminContent({ keepScroll: true });
}

// ---------------------------------------------------------------- alerts
function renderAdmAlerts() {
  if (!admState.alertDraft) admState.alertDraft = { active: false, tone: 'info', text: '', link: '', linkLabel: '', ...(appData.settings.announcement || {}) };
  const draft = admState.alertDraft;
  const opportunities = (appData.oportunidades || []).slice().sort((a, b) => String(a.fecha || '9999').localeCompare(String(b.fecha || '9999')));
  const exams = upcomingItems(visibleResources().filter(item => item.typeId === 'examenes'));
  return `${pageHead({ kicker: 'Sitio público', title: 'Alertas y avisos', text: 'Publica un mensaje institucional en la portada y decide qué convocatorias se destacan en el aviso superior.' })}
    <section class="adm-card"><header class="adm-card-head"><div><h2>Mensaje institucional</h2><p>Se muestra en la portada cuando está activo y el bloque «Mensaje institucional» es visible</p></div><div class="adm-head-actions"><button class="adm-btn ghost sm" type="button" data-adm-alert-reset ${admState.alertDirty ? '' : 'disabled'}>Descartar</button><button class="adm-btn primary sm" type="button" data-adm-alert-publish ${admState.alertDirty ? '' : 'disabled'}>${icon('check')}<span>Publicar aviso</span></button></div></header>
      <div class="adm-form">
        <div class="adm-field full"><label class="adm-switch"><input type="checkbox" data-adm-alert="active" ${draft.active ? 'checked' : ''}><span class="adm-switch-track"><span></span></span><span>Mostrar el mensaje en la portada</span></label></div>
        <div class="adm-field"><label for="adm-a-tone">Tono</label><select id="adm-a-tone" data-adm-alert="tone">${[['info', 'Informativo'], ['aviso', 'Aviso importante'], ['urgente', 'Urgente']].map(([value, label]) => `<option value="${value}" ${draft.tone === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
        <div class="adm-field"><label for="adm-a-linkLabel">Texto del enlace</label><input id="adm-a-linkLabel" data-adm-alert="linkLabel" maxlength="40" value="${attr(draft.linkLabel)}" placeholder="Más información"></div>
        <div class="adm-field full"><label for="adm-a-text">Mensaje</label><textarea id="adm-a-text" data-adm-alert="text" rows="3" maxlength="280" placeholder="Ej.: Las matrículas extraordinarias cierran el viernes 20 de noviembre.">${esc(draft.text)}</textarea><span class="adm-counter">${String(draft.text || '').length}/280</span></div>
        <div class="adm-field full"><label for="adm-a-link">Enlace (opcional)</label><input id="adm-a-link" data-adm-alert="link" type="url" value="${attr(draft.link)}" placeholder="https://…"></div>
      </div>
      <div class="adm-preview-head"><span>${icon('eye')} Vista previa</span></div><div id="admAlertPreview"></div>
    </section>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Convocatorias en el aviso superior</h2><p>El aviso muestra las oportunidades de los próximos 7 días y las marcadas como prioritarias</p></div><button class="adm-btn ghost sm" type="button" data-adm-view="oportunidades">Gestionar oportunidades</button></header>
      ${opportunities.length ? `<ul class="adm-list">${opportunities.map(row => { const days = daysUntil(row.fecha); return `<li class="adm-row"><span class="adm-thumb">${icon('briefcase')}</span><span class="adm-row-text"><strong>${esc(row.titulo || 'Sin título')}</strong><small>${esc(row.institucion || '')}${row.fecha ? ` · ${formatDate(row.fecha)}` : ''}</small></span><div class="adm-row-chips">${row.hidden ? chip('Borrador', 'warn') : ''}${Number.isFinite(days) && days < 0 ? chip('Vencida', 'muted') : ''}</div><label class="adm-switch compact"><input type="checkbox" data-adm-priority="${attr(row.id)}" ${row.alertPriority ? 'checked' : ''}><span class="adm-switch-track"><span></span></span><span>Prioritaria</span></label></li>`; }).join('')}</ul>` : admEmpty('Sin oportunidades', 'Agrega una oportunidad para poder destacarla.', `<button class="adm-btn primary" type="button" data-adm-new="oportunidades">${icon('plus')}<span>Nueva oportunidad</span></button>`)}
    </section>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Exámenes próximos</h2><p>Detectados en el repositorio para los próximos 7 días</p></div></header>${exams.length ? `<ul class="adm-list">${exams.map(exam => `<li class="adm-row"><span class="adm-thumb">${icon('calendar')}</span><span class="adm-row-text"><strong>${esc(exam.title)}</strong><small>${esc(formatDate(exam.date))} · ${esc(subjectName(exam.cycleId, exam.subjectId))}</small></span></li>`).join('')}</ul>` : '<p class="adm-muted">No hay exámenes con fecha en los próximos 7 días.</p>'}</section>`;
}

function updateAlertPreview() {
  const node = document.getElementById('admAlertPreview');
  if (!node || !admState.alertDraft) return;
  node.innerHTML = DOMPurify.sanitize(announcementHtml({ ...admState.alertDraft, active: true }) || '<p class="adm-muted">Escribe un mensaje para ver la vista previa.</p>');
}

async function publishAlert() {
  const draft = admState.alertDraft;
  const announcement = { active: Boolean(draft.active), tone: draft.tone || 'info', text: String(draft.text || '').trim(), link: String(draft.link || '').trim(), linkLabel: String(draft.linkLabel || '').trim() };
  if (announcement.active && !announcement.text) { showToast('Falta el mensaje', 'Escribe el texto antes de activarlo.', 'error'); return; }
  if (announcement.link && !/^https:\/\/\S+$/i.test(announcement.link)) { showToast('Enlace no válido', 'Usa un enlace que empiece con https://', 'error'); return; }
  if (/[<>]/.test(announcement.text + announcement.linkLabel)) { showToast('Revisa el mensaje', 'Usa texto simple, sin etiquetas HTML.', 'error'); return; }
  const result = await admCommit(() => { appData.settings = { ...appData.settings, announcement }; }, announcement.active ? 'Publicó un mensaje institucional' : 'Desactivó el mensaje institucional', { success: announcement.active ? 'Aviso publicado' : 'Aviso desactivado' });
  if (result.ok) { admState.alertDraft = null; admState.alertDirty = false; }
  renderAdminContent({ keepScroll: true });
}

// ---------------------------------------------------------------- Drive
function driveDiagnosticMessages() {
  const messages = [];
  if (!DRIVE_REPOSITORY_API_URL) messages.push('Falta la URL publicada del lector de Drive (Apps Script terminado en /exec).');
  if (DRIVE_REPOSITORY_API_URL && !/\/exec(?:\?|$)/.test(DRIVE_REPOSITORY_API_URL)) messages.push('La URL de Apps Script debe terminar en /exec.');
  if (!DRIVE_ROOT_FOLDER_ID) messages.push('Falta el ID de la carpeta compartida de ADE.');
  if (driveRepositoryStatus.error) {
    if (/inicio de sesi[oó]n|privad|Failed to fetch|script p[uú]blico/i.test(driveRepositoryStatus.error)) messages.push('Apps Script puede estar privado o sin permisos para cualquier persona.');
    if (/doGet|secuencia de comandos/i.test(driveRepositoryStatus.error)) messages.push('El despliegue publicado no contiene la función doGet. Guarda el código y despliega una versión nueva.');
    if (/carpeta|folder|permission|permiso|otra carpeta/i.test(driveRepositoryStatus.error)) messages.push('Revisa que el lector responda desde la carpeta raíz configurada.');
  }
  if (!driveRepositoryStatus.loading && !driveRepositoryStatus.error && driveRepositoryStatus.enabled && !driveCatalogFiles.length) messages.push('La conexión funciona, pero el lector informa 0 archivos públicos. Comparte los materiales con «Cualquier persona con el enlace» dentro de Repositorio ADE.');
  return messages;
}

function renderAdmDrive() {
  const files = driveCatalogFiles.map(file => ({ file, resource: mapDriveFileToResource(file) }));
  const filters = admState.driveFilters;
  const classified = files.filter(item => item.resource);
  const unclassified = files.filter(item => !item.resource);
  let list = filters.unclassified ? unclassified : classified;
  if (!filters.unclassified) {
    if (filters.cycle !== 'all') list = list.filter(item => item.resource.cycleId === filters.cycle);
    if (filters.subject !== 'all') list = list.filter(item => item.resource.subjectId === filters.subject);
    if (filters.category !== 'all') list = list.filter(item => item.resource.typeId === filters.category);
  }
  if (filters.query) { const words = ADM.fold(filters.query).split(/\s+/).filter(Boolean); list = list.filter(item => { const haystack = ADM.fold(`${item.file.name || item.file.title || ''} ${item.file.path || ''} ${item.file.cycleName || ''} ${item.file.subjectName || ''} ${item.file.categoryName || ''}`); return words.every(word => haystack.includes(word)); }); }
  const status = driveRepositoryStatus.loading ? ['Sincronizando', 'warn'] : driveRepositoryStatus.error ? ['Con error', 'bad'] : driveRepositoryStatus.enabled ? ['Conectado', 'ok'] : ['Sin configurar', 'muted'];
  const server = adminServerState?.drive || {};
  const messages = driveDiagnosticMessages();
  const cycleForSubjects = filters.cycle !== 'all' ? findCycle(filters.cycle) : null;
  const tree = CYCLES.map(cycle => ({ cycle, count: classified.filter(item => item.resource.cycleId === cycle.id).length }));
  const mime = file => { const type = String(file.mimeType || ''); return /pdf/.test(type) ? 'PDF' : /document/.test(type) ? 'Doc' : /presentation/.test(type) ? 'Slides' : /spreadsheet/.test(type) ? 'Sheet' : /video/.test(type) ? 'Video' : /image/.test(type) ? 'Imagen' : 'Archivo'; };
  return `${pageHead({ kicker: 'Académico', title: 'Google Drive', text: 'Catálogo público del Repositorio ADE leído por el Apps Script de la ASO. El portal nunca cambia permisos ni expone archivos privados.', actions: `<a class="adm-btn ghost" href="${attr(driveRepositoryUrl())}" target="_blank" rel="noopener noreferrer">${icon('external')}<span>Abrir carpeta</span></a><button class="adm-btn primary" type="button" data-adm-drive-sync ${driveRepositoryStatus.loading ? 'disabled' : ''}>${icon('refresh')}<span>${driveRepositoryStatus.loading ? 'Sincronizando…' : 'Actualizar catálogo'}</span></button>` })}
    <div class="adm-grid adm-grid-3">
      <section class="adm-card adm-drive-status"><span class="adm-status ${status[1]} lg">${esc(status[0])}</span><h2>${plural(files.length, 'archivo público', 'archivos públicos')}</h2><p>${plural(classified.length, 'clasificado', 'clasificados')} · ${plural(unclassified.length, 'sin clasificación', 'sin clasificación')}</p></section>
      <section class="adm-card"><h3 class="adm-card-title">Última sincronización</h3><p class="adm-big">${server.at ? esc(ADM.relativeTime(server.at)) : driveRepositoryStatus.updatedAt ? esc(ADM.relativeTime(driveRepositoryStatus.updatedAt)) : 'Pendiente'}</p><small class="adm-muted">${server.errorAt && (!server.at || server.errorAt > server.at) ? `Último error: ${esc(ADM.relativeTime(server.errorAt))}` : 'Registrada por el servidor'}</small></section>
      <section class="adm-card"><h3 class="adm-card-title">Carpeta raíz</h3><p class="adm-mono adm-break">${esc(DRIVE_ROOT_FOLDER_ID || 'Sin configurar')}</p><button class="adm-link" type="button" data-adm-view="config">Cambiar conexión ${icon('chevronRight')}</button></section>
    </div>
    ${driveRepositoryStatus.error || messages.length ? `<div class="adm-callout ${driveRepositoryStatus.error ? 'bad' : 'info'}">${icon(driveRepositoryStatus.error ? 'alert' : 'spark')}<div><strong>${driveRepositoryStatus.error ? 'Diagnóstico de la conexión' : 'Sugerencias'}</strong>${driveRepositoryStatus.error ? `<p class="adm-mono">${esc(driveRepositoryStatus.error)}</p>` : ''}<ul>${messages.map(message => `<li>${esc(message)}</li>`).join('')}</ul></div></div>` : ''}
    <div class="adm-drive-layout">
      <nav class="adm-card adm-drive-tree" aria-label="Ciclos">
        <button type="button" class="${!filters.unclassified && filters.cycle === 'all' ? 'active' : ''}" data-adm-drive-cycle="all">${icon('drive')}<span>Todos los ciclos</span><b>${classified.length}</b></button>
        ${tree.map(({ cycle, count }) => `<button type="button" class="${!filters.unclassified && filters.cycle === cycle.id ? 'active' : ''}" data-adm-drive-cycle="${cycle.id}">${icon('book')}<span>${esc(cycle.name)}</span><b>${count}</b></button>`).join('')}
        <button type="button" class="${filters.unclassified ? 'active' : ''} ${unclassified.length ? 'warn' : ''}" data-adm-drive-unclassified>${icon('alert')}<span>Sin clasificación</span><b>${unclassified.length}</b></button>
      </nav>
      <section class="adm-drive-files">
        <div class="adm-toolbar">
          <label class="adm-search-field">${icon('search')}<input type="search" value="${attr(filters.query)}" placeholder="Buscar archivos…" data-adm-drive="query" aria-label="Buscar archivos de Drive"></label>
          ${filters.unclassified ? '' : `<select class="adm-select" data-adm-drive="subject" aria-label="Materia"><option value="all">Todas las materias</option>${(cycleForSubjects ? cycleForSubjects.subjects : SUBJECTS).map(subject => `<option value="${subject.id}" ${filters.subject === subject.id ? 'selected' : ''}>${esc(subject.name)}</option>`).join('')}</select><select class="adm-select" data-adm-drive="category" aria-label="Categoría"><option value="all">Todas las categorías</option>${CATEGORIES.map(cat => `<option value="${cat.id}" ${filters.category === cat.id ? 'selected' : ''}>${esc(cat.label)}</option>`).join('')}</select>`}
        </div>
        ${filters.unclassified && unclassified.length ? `<div class="adm-callout warn compact">${icon('alert')}<div><strong>Archivos sin ciclo o materia reconocible</strong><p>No se asignan automáticamente a ninguna materia. Muévelos en Drive a «Ciclo → Materia → Categoría» con los nombres de la malla y actualiza el catálogo.</p></div></div>` : ''}
        ${list.length ? `<ul class="adm-files">${list.map(({ file, resource }, index) => `<li style="--i:${index}"><span class="adm-file-type">${esc(mime(file))}</span><div><strong>${esc(file.name || file.title || 'Archivo sin nombre')}</strong><small>${resource ? `${esc(findCycle(resource.cycleId)?.name || '')} › ${esc(subjectName(resource.cycleId, resource.subjectId))} › ${esc(categoryLabel(resource.typeId))}` : esc(file.path || [file.cycleName, file.subjectName, file.categoryName].filter(Boolean).join(' › ') || 'Ubicación no reconocida')}${file.updatedAt ? ` · ${esc(formatDate(String(file.updatedAt).slice(0, 10)))}` : ''}</small></div>${(file.webViewUrl || file.url) ? `<a class="adm-icon-btn" href="${attr(file.webViewUrl || file.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${attr(file.name || 'archivo')} en Drive">${icon('external')}</a>` : ''}</li>`).join('')}</ul>`
          : files.length ? admEmpty('Sin coincidencias', 'Ningún archivo coincide con los filtros.') : admEmpty('Catálogo vacío', driveRepositoryStatus.enabled ? 'El lector no informa archivos públicos. Sube materiales a Repositorio ADE, compártelos con «Cualquier persona con el enlace» y pulsa Actualizar catálogo.' : 'Configura la carpeta y el lector de Apps Script en Integraciones.', `<button class="adm-btn ghost" type="button" data-adm-view="config">Ir a Integraciones</button>`)}
      </section>
    </div>`;
}

async function admDriveSync(button) {
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  driveRepositoryStatus = { ...driveRepositoryStatus, loading: true };
  renderAdminContent({ keepScroll: true });
  await loadDriveRepositoryResources({ refresh: true });
  await loadAdminInbox().catch(() => {});
  invalidateRenderedSections(['repositorio', 'banco']); renderAll();
  renderAdminTabs(); renderAdminContent({ keepScroll: true });
  if (driveRepositoryStatus.error) showToast('Drive no respondió', driveRepositoryStatus.error, 'error');
  else showToast('Catálogo actualizado', plural(driveCatalogFiles.length, 'archivo público', 'archivos públicos'), 'success');
}

// ---------------------------------------------------------------- integrations
function renderAdmConfig() {
  const settings = appData.settings;
  const state = adminServerState || {};
  return `${pageHead({ kicker: 'Sistema', title: 'Integraciones', text: 'Conexión con Google Drive y con el servicio de correo de la ASO. Las credenciales nunca se guardan en el navegador.' })}
    <form class="adm-card" id="admConfigForm" novalidate><header class="adm-card-head"><div><h2>Repositorio en Google Drive</h2><p>El ID de la carpeta se deriva automáticamente del enlace</p></div></header>
      <div class="adm-form">
        <div class="adm-field full"><label for="adm-c-folder">Carpeta de Drive</label><input id="adm-c-folder" name="driveFolderUrl" type="url" value="${attr(settings.driveFolderUrl || '')}" placeholder="https://drive.google.com/drive/folders/…" data-adm-config><small class="adm-help" id="admFolderId">ID detectado: <span class="adm-mono">${esc(getGoogleDriveId(settings.driveFolderUrl || '') || '—')}</span></small><small class="adm-error" data-error-for="driveFolderUrl"></small></div>
        <div class="adm-field full"><label for="adm-c-script">Lector de Apps Script (/exec)</label><input id="adm-c-script" name="driveRepositoryApiUrl" type="url" value="${attr(settings.driveRepositoryApiUrl || '')}" placeholder="https://script.google.com/macros/s/…/exec" data-adm-config><small class="adm-help">El mismo despliegue reenvía las consultas al correo de la ASO.</small><small class="adm-error" data-error-for="driveRepositoryApiUrl"></small></div>
      </div>
      <footer class="adm-card-foot"><button class="adm-btn ghost" type="button" data-adm-drive-sync>${icon('refresh')}<span>Probar conexión</span></button><button class="adm-btn primary" type="submit">${icon('check')}<span>Guardar y publicar</span></button></footer>
    </form>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Correo de consultas</h2><p>Reenvío al buzón asoadmiucuenca@gmail.com mediante Apps Script</p></div><span class="adm-status ${state.mailRelay ? 'ok' : 'warn'}">${state.mailRelay ? 'Servicio configurado' : 'Sin configurar'}</span></header>
      <ol class="adm-steps"><li>Abre el proyecto Apps Script de la ASO y reemplaza su código por <span class="adm-mono">google-apps-script/drive-reader.gs</span>.</li><li>Copia el manifiesto <span class="adm-mono">drive-reader.manifest.json</span> en <span class="adm-mono">appsscript.json</span>.</li><li>En Propiedades del script crea <span class="adm-mono">PORTAL_MAIL_SECRET</span> con el valor de <span class="adm-mono">.private/correo-secreto.txt</span>.</li><li>Implementar → Administrar implementaciones → Versión nueva, y autoriza el envío de correo.</li></ol>
      <p class="adm-muted">Mientras no esté desplegado, cada consulta se guarda igualmente en la Bandeja y muestra el estado real del envío.</p>
    </section>`;
}

async function submitAdmConfig(form) {
  const folder = form.elements.driveFolderUrl.value.trim(), script = form.elements.driveRepositoryApiUrl.value.trim();
  const errors = {};
  if (folder && (!/^https:\/\/drive\.google\.com\//i.test(folder) || !getGoogleDriveId(folder))) errors.driveFolderUrl = 'Pega el enlace de una carpeta de Google Drive.';
  if (script && !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(script)) errors.driveRepositoryApiUrl = 'Debe ser una URL https://script.google.com/macros/s/…/exec';
  form.querySelectorAll('[data-error-for]').forEach(node => { node.textContent = errors[node.dataset.errorFor] || ''; node.closest('.adm-field')?.classList.toggle('has-error', Boolean(errors[node.dataset.errorFor])); });
  if (Object.keys(errors).length) return;
  const result = await admCommit(() => {
    appData.settings = { ...appData.settings, driveFolderUrl: folder, simplifiedDriveUrl: folder, driveRepositoryApiUrl: script, driveRootFolderId: getGoogleDriveId(folder) || DEFAULT_ADE_DRIVE_FOLDER_ID };
    hydrateDriveSettings();
  }, 'Actualizó la conexión con Google Drive', { success: 'Integraciones guardadas' });
  if (result.ok) admState.configDirty = false;
  hydrateDriveSettings();
  renderAdminContent({ keepScroll: true });
}

// ---------------------------------------------------------------- backup & audit
function renderAdmBackup() {
  const last = adminServerState?.lastBackup;
  return `${pageHead({ kicker: 'Sistema', title: 'Respaldo', text: 'Descarga una copia completa desde el servidor o restaura el contenido institucional desde un archivo.' })}
    <div class="adm-grid adm-grid-2">
      <section class="adm-card"><header class="adm-card-head"><div><h2>Descargar respaldo completo</h2><p>Contenido, solicitudes privadas y auditoría reciente</p></div></header>
        <p class="adm-big">${last?.at ? esc(ADM.relativeTime(last.at)) : 'Nunca'}</p><p class="adm-muted">${last?.at ? `Último respaldo: ${esc(formatDate(last.at.slice(0, 10)))} por ${esc(last.actor || 'administración')}` : 'Aún no se registra ningún respaldo en el servidor.'}</p>
        <div class="adm-callout warn compact">${icon('lock')}<div><p>El archivo incluye datos personales de las solicitudes. Guárdalo en un lugar privado y no lo compartas.</p></div></div>
        <footer class="adm-card-foot"><button class="adm-btn primary" type="button" data-adm-backup>${icon('download')}<span>Descargar respaldo</span></button></footer>
      </section>
      <section class="adm-card"><header class="adm-card-head"><div><h2>Restaurar contenido</h2><p>Reemplaza las colecciones institucionales; la bandeja no cambia</p></div></header>
        <p class="adm-muted">Acepta respaldos descargados aquí o exportaciones anteriores del portal. Antes de aplicar verás un resumen y deberás confirmar.</p>
        <footer class="adm-card-foot"><label class="adm-btn secondary adm-upload">${icon('upload')}<span>Elegir archivo JSON</span><input type="file" accept="application/json,.json" data-adm-import hidden></label></footer>
      </section>
    </div>
    <section class="adm-card"><header class="adm-card-head"><div><h2>Copia del servidor</h2><p>Para un respaldo a nivel de archivos</p></div></header><p class="adm-muted">Detén el servidor y copia la carpeta <span class="adm-mono">.private</span> completa (base SQLite, archivos auxiliares e imágenes subidas).</p></section>`;
}

async function admDownloadBackup(button) {
  button.disabled = true; button.classList.add('is-loading');
  try {
    const response = await fetch('/api/backup', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) { let message = 'No se pudo generar el respaldo.'; try { message = (await response.json()).error || message; } catch {} throw new Error(message); }
    admDownload(await response.blob(), `aso-ade-respaldo-${new Date().toISOString().slice(0, 10)}.json`);
    await loadAdminInbox();
    showToast('Respaldo descargado', 'Guárdalo en un lugar privado.', 'success');
    renderAdminContent({ keepScroll: true });
  } catch (error) { showToast('No se pudo descargar', error.message, 'error'); }
  finally { button.disabled = false; button.classList.remove('is-loading'); }
}

async function admImport(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch { showToast('Archivo no válido', 'El archivo no contiene JSON válido.', 'error'); return; }
  const source = parsed?.kind === 'aso-ade-backup' ? parsed.collections : parsed;
  if (!source || typeof source !== 'object') { showToast('Archivo no válido', 'No se reconoce el formato del respaldo.', 'error'); return; }
  const next = {};
  for (const name of CRITICAL_SHEET_COLLECTIONS) {
    if (!(name in source)) continue;
    if (name === 'settings') { if (source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings)) next.settings = source.settings; continue; }
    if (!Array.isArray(source[name])) continue;
    next[name] = source[name].filter(row => row && typeof row === 'object' && !Array.isArray(row)).map(row => ({ ...row, id: typeof row.id === 'string' && row.id ? row.id : uid() }));
  }
  if (next.resources) next.resources = next.resources.filter(row => row.source !== DRIVE_RESOURCE_SOURCE);
  const names = Object.keys(next);
  if (!names.length) { showToast('Nada que restaurar', 'El archivo no contiene colecciones del portal.', 'error'); return; }
  const summary = names.map(name => name === 'settings' ? 'configuración' : `${(next[name] || []).length} ${COLLECTION_SCHEMAS[name]?.plural || name}`).join(', ');
  if (!(await confirmAction({ title: 'Restaurar contenido', message: `Se reemplazará: ${summary}. La bandeja de solicitudes no cambia. ¿Continuar?`, confirmText: 'Restaurar y publicar' }))) return;
  const settingsKeys = ['welcome', 'mission', 'vision', 'heroTitle', 'heroSubtitle', 'heroEyebrow', 'heroImage', 'heroPrimaryLabel', 'heroPrimarySection', 'heroSecondaryLabel', 'heroSecondarySection', 'homeBlocks', 'announcement', 'sectionMeta', 'kitVideo', 'driveFolderUrl', 'simplifiedDriveUrl', 'driveRootFolderId', 'driveRepositoryApiUrl', 'enabledSections'];
  await admCommit(() => {
    for (const name of names) {
      if (name === 'settings') appData.settings = { ...appData.settings, ...Object.fromEntries(Object.entries(next.settings).filter(([key]) => settingsKeys.includes(key))) };
      else if (name === 'resources') appData.resources = [...next.resources, ...appData.resources.filter(row => row.source === DRIVE_RESOURCE_SOURCE)];
      else appData[name] = next[name];
    }
    hydrateDriveSettings();
  }, 'Restauró contenido desde un respaldo', { success: 'Contenido restaurado' });
  renderAdminContent();
}

function renderAdmAudit() {
  const query = ADM.fold(admState.auditQuery);
  const rows = (appData.adminLog || []).filter(entry => !query || ADM.fold(`${entry.action} ${entry.actor || ''}`).includes(query));
  return `${pageHead({ kicker: 'Sistema', title: 'Auditoría', text: 'Registro inalterable de accesos y cambios confirmados por el servidor (últimos 200).', actions: `<button class="adm-btn ghost" type="button" data-adm-refresh>${icon('refresh')}<span>Actualizar</span></button>` })}
    <div class="adm-toolbar"><label class="adm-search-field">${icon('search')}<input type="search" value="${attr(admState.auditQuery)}" placeholder="Filtrar por acción o cuenta…" data-adm-audit aria-label="Filtrar auditoría"></label></div>
    <section class="adm-card">${rows.length ? `<ol class="adm-timeline adm-audit">${rows.map(entry => `<li><span class="adm-timeline-dot"></span><div><strong>${esc(entry.action)}</strong><small>${esc(entry.actor || 'Administración')} · ${esc(new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Guayaquil' }).format(new Date(entry.date)))} · ${esc(ADM.relativeTime(entry.date))}</small></div></li>`).join('')}</ol>` : admEmpty('Sin registros', query ? 'Ningún registro coincide con el filtro.' : 'Aún no hay actividad registrada.')}</section>`;
}

// ---------------------------------------------------------------- global search
function admSearchEntries() {
  const entries = ADMIN_VIEWS.map(view => ({ kind: 'view', title: view.label, subtitle: `Ir a ${view.group}`, view: view.id, icon: view.icon }));
  for (const [collection, schema] of Object.entries(COLLECTION_SCHEMAS)) {
    for (const row of admRows(collection)) entries.push({ kind: 'record', collection, id: row.id, title: String(schema.title(row) || 'Sin título'), subtitle: `${viewMeta(schema.view || collection).label}${row.hidden ? ' · borrador' : ''} · ${schema.subtitle(row) || ''}`, icon: viewMeta(schema.view || collection).icon });
  }
  for (const message of appData.messages || []) entries.push({ kind: 'message', id: message.id, title: `${message.name || 'Sin nombre'} · ${message.type}`, subtitle: `${message.trackingCode || ''} · ${message.subject || message.email || ''}`, keywords: `${message.email} ${message.phone} ${message.message}`, icon: 'inbox' });
  return entries;
}

function renderAdmSearch(query) {
  const box = document.getElementById('admSearchResults');
  const input = document.getElementById('admSearch');
  if (!box) return;
  const results = ADM.rankSearch(admSearchEntries(), query, 10);
  admState.searchResults = results; admState.searchIndex = results.length ? 0 : -1;
  if (!query.trim()) { box.hidden = true; input?.setAttribute('aria-expanded', 'false'); return; }
  box.innerHTML = DOMPurify.sanitize(results.length ? results.map((entry, index) => `<button type="button" role="option" id="adm-sr-${index}" class="${index === 0 ? 'active' : ''}" aria-selected="${index === 0}" data-adm-search-index="${index}">${icon(entry.icon)}<span><strong>${highlightText(entry.title, query)}</strong><small>${esc(entry.subtitle)}</small></span><em>${entry.kind === 'view' ? 'Vista' : entry.kind === 'message' ? 'Solicitud' : 'Registro'}</em></button>`).join('') : `<p class="adm-search-empty">Sin resultados para «${esc(query)}»</p>`);
  box.hidden = false;
  input?.setAttribute('aria-expanded', 'true');
  input?.setAttribute('aria-activedescendant', results.length ? 'adm-sr-0' : '');
}

function admOpenSearchResult(entry) {
  const input = document.getElementById('admSearch');
  if (input) input.value = '';
  document.getElementById('admSearchResults').hidden = true;
  if (!entry) return;
  if (entry.kind === 'view') return admNavigate(entry.view);
  if (entry.kind === 'message') { admState.inbox = { ...admState.inbox, type: 'all', status: 'all', subject: 'all', query: '', from: '', to: '', selected: entry.id }; return admNavigate('mensajes', { force: true }); }
  const schema = COLLECTION_SCHEMAS[entry.collection];
  admNavigate(schema.view || entry.collection).then(() => openEditor(entry.collection, entry.id));
}

function admCloseMenus() {
  document.querySelectorAll('#adminPanel .adm-menu:not([hidden])').forEach(menu => { menu.hidden = true; menu.previousElementSibling?.setAttribute('aria-expanded', 'false'); });
}

// ---------------------------------------------------------------- events
async function handleAdminClick(event) {
  const target = event.target;
  const closest = selector => target.closest(selector);
  let node;
  if ((node = closest('[data-adm-view]'))) { event.preventDefault(); return admNavigate(node.dataset.admView); }
  if (closest('[data-adm-close-panel]')) return requestCloseAdmin();
  if (closest('[data-adm-logout]')) return logoutAdmin();
  if (closest('[data-adm-toggle-nav]')) { document.body.classList.toggle('adm-nav-open'); return; }
  if (closest('[data-adm-collapse]')) { const collapsed = document.documentElement.classList.toggle('adm-sidebar-collapsed'); admWritePref('collapsed', collapsed ? '1' : '0'); return; }
  if (closest('.adm-nav-scrim')) { document.body.classList.remove('adm-nav-open'); return; }
  if ((node = closest('[data-adm-menu-toggle]'))) { const menu = node.nextElementSibling; const open = menu.hidden; admCloseMenus(); menu.hidden = !open; node.setAttribute('aria-expanded', String(open)); if (open) menu.querySelector('button')?.focus(); return; }
  if ((node = closest('[data-adm-new]'))) { admCloseMenus(); const collection = node.dataset.admNew; const schema = COLLECTION_SCHEMAS[collection]; if ((schema.view || collection) !== admState.view && await admNavigate(schema.view || collection) === false) return; return openEditor(collection); }
  if ((node = closest('[data-adm-edit]'))) return openEditor(node.dataset.collection, node.dataset.admEdit);
  if ((node = closest('[data-adm-duplicate]'))) { admCloseMenus(); return openEditor(node.dataset.collection, null, { duplicateOf: node.dataset.admDuplicate }); }
  if ((node = closest('[data-adm-delete]'))) { admCloseMenus(); return admDelete(node.dataset.collection, node.dataset.admDelete); }
  if ((node = closest('[data-adm-toggle]'))) return admToggle(node.dataset.collection, node.dataset.admToggle);
  if ((node = closest('[data-adm-move]'))) return admMove(node.dataset.collection, node.dataset.id, Number(node.dataset.admMove));
  if ((node = closest('[data-adm-bulk]'))) { if (node.dataset.admBulk === 'clear') { admState.selection.clear(); return renderAdminContent({ keepScroll: true }); } return admBulk(node.dataset.collection, node.dataset.admBulk); }
  if ((node = closest('[data-adm-filter-status]'))) { admState.filters[node.dataset.collection] = { ...(admState.filters[node.dataset.collection] || {}), status: node.dataset.admFilterStatus }; return renderAdminContent({ keepScroll: true }); }
  if ((node = closest('[data-adm-clear-filters]'))) { admState.filters[node.dataset.admClearFilters] = {}; return renderAdminContent(); }
  if (closest('[data-adm-close-drawer]')) return closeDrawer();
  if ((node = closest('[data-adm-save]'))) return saveEditor(node.dataset.admSave);
  if ((node = closest('[data-adm-clear-field]'))) { const input = document.querySelector(`#admEditor [name="${CSS.escape(node.dataset.admClearField)}"]`); if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); const thumb = document.querySelector(`[data-media-thumb="${CSS.escape(node.dataset.admClearField)}"]`); if (thumb) thumb.innerHTML = DOMPurify.sanitize(icon('image')); node.remove(); } return; }
  if (closest('[data-adm-refresh]')) { const button = closest('[data-adm-refresh]'); button.classList.add('is-loading'); await refreshAdminData(); showToast('Datos actualizados', '', 'success'); return; }
  if ((node = closest('[data-adm-open-message]'))) { admState.inbox.selected = node.dataset.admOpenMessage; if (admState.view !== 'mensajes') { admState.inbox = { ...admState.inbox, type: 'all', status: 'all' }; return admNavigate('mensajes'); } return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-close-message]')) { admState.inbox.selected = ''; return renderAdminContent({ keepScroll: true }); }
  if ((node = closest('[data-adm-inbox-type]'))) { admState.inbox = { ...admState.inbox, type: node.dataset.admInboxType, subject: 'all' }; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-inbox-reset]')) { admState.inbox = { type: 'all', status: 'all', subject: 'all', from: '', to: '', query: '', selected: '' }; return renderAdminContent(); }
  if ((node = closest('[data-adm-status]'))) return admSetStatus(node.dataset.id, node.dataset.admStatus);
  if ((node = closest('[data-adm-read]'))) { const message = appData.messages.find(item => item.id === node.dataset.admRead); return message && admUpdateMessage({ id: message.id, status: message.status || 'pendiente', read: !message.read }, message.read ? 'Marcada como no leída' : 'Marcada como leída'); }
  if ((node = closest('[data-adm-delete-message]'))) { const message = appData.messages.find(item => item.id === node.dataset.admDeleteMessage); if (message && await confirmAction({ title: 'Eliminar solicitud', message: `La solicitud de ${message.name || 'esta persona'} se eliminará definitivamente del servidor.`, confirmText: 'Eliminar' })) { admState.inbox.selected = ''; await admUpdateMessage({ id: message.id, remove: true }, 'Solicitud eliminada'); } return; }
  if ((node = closest('[data-adm-resend]'))) return admResend(node);
  if (closest('[data-adm-export]')) return admExportCsv();
  if ((node = closest('[data-adm-copy]'))) { try { await navigator.clipboard.writeText(node.dataset.admCopy); showToast('Copiado', node.dataset.admCopy, 'success'); } catch { showToast('No se pudo copiar', 'Copia el dato manualmente.', 'error'); } return; }
  if ((node = closest('[data-adm-block-move]'))) { const blocks = admState.homeDraft.homeBlocks; const index = blocks.findIndex(block => block.id === node.dataset.block); admState.homeDraft.homeBlocks = ADM.moveItem(blocks, index, Number(node.dataset.admBlockMove)); admState.homeDirty = true; renderAdminContent({ keepScroll: true }); requestAnimationFrame(() => el.adminContent.querySelector(`[data-adm-block-move="${node.dataset.admBlockMove}"][data-block="${CSS.escape(node.dataset.block)}"]:not(:disabled)`)?.focus()); return; }
  if (closest('[data-adm-home-clear-image]')) { admState.homeDraft.heroImage = ''; admState.homeDirty = true; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-home-reset]')) { admState.homeDraft = null; admState.homeDirty = false; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-home-preview]')) return previewHomeInPortal();
  if (closest('[data-adm-home-publish]')) return publishHomeDraft();
  if (closest('[data-adm-sections-reset]')) { admState.sectionsDraft = null; admState.sectionsDirty = false; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-sections-publish]')) return publishSections();
  if ((node = closest('[data-adm-section-restore]'))) { delete admState.sectionsDraft.meta[node.dataset.admSectionRestore]; admState.sectionsDirty = true; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-alert-reset]')) { admState.alertDraft = null; admState.alertDirty = false; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-alert-publish]')) return publishAlert();
  if ((node = closest('[data-adm-drive-cycle]'))) { admState.driveFilters = { ...admState.driveFilters, cycle: node.dataset.admDriveCycle, subject: 'all', unclassified: false }; return renderAdminContent({ keepScroll: true }); }
  if (closest('[data-adm-drive-unclassified]')) { admState.driveFilters = { ...admState.driveFilters, unclassified: true }; return renderAdminContent({ keepScroll: true }); }
  if ((node = closest('[data-adm-drive-sync]'))) return admDriveSync(node);
  if ((node = closest('[data-adm-backup]'))) return admDownloadBackup(node);
  if ((node = closest('[data-adm-search-index]'))) return admOpenSearchResult(admState.searchResults?.[Number(node.dataset.admSearchIndex)]);
  if (!closest('.adm-search')) { const box = document.getElementById('admSearchResults'); if (box) box.hidden = true; }
}

const admDebounced = (() => { let timer = 0; return (callback, delay = 160) => { clearTimeout(timer); timer = setTimeout(callback, delay); }; })();

function handleAdminInput(event) {
  const target = event.target;
  if (target.id === 'admSearch') return renderAdmSearch(target.value);
  if (target.closest('#admEditor')) {
    if (admState.drawer) admState.drawer.dirty = true;
    const counter = target.name && document.querySelector(`[data-counter-for="${CSS.escape(target.name)}"]`);
    if (counter) counter.textContent = `${target.value.length}/${target.maxLength}`;
    if (target.closest('.adm-field')?.classList.contains('has-error')) { const errors = ADM.validateRecord(COLLECTION_SCHEMAS[admState.drawer.collection].fields, readEditor()); showFieldErrors(errors); }
    if (target.type === 'url' && target.closest('.adm-field-media')) { const thumb = target.closest('.adm-field-media').querySelector('[data-media-thumb]'); if (thumb) thumb.innerHTML = DOMPurify.sanitize(/^(https:\/\/|\/uploads\/)/.test(target.value) ? `<img src="${attr(target.value)}" alt="">` : icon('image')); }
    return admDebounced(updateDrawerPreview, 120);
  }
  if (target.dataset.admFilter === 'query') { admState.filters[target.dataset.collection] = { ...(admState.filters[target.dataset.collection] || {}), query: target.value }; return admDebounced(() => admRerenderKeepingFocus(target)); }
  if (target.dataset.admInbox === 'query') { admState.inbox.query = target.value; return admDebounced(() => admRerenderKeepingFocus(target)); }
  if (target.dataset.admDrive === 'query') { admState.driveFilters.query = target.value; return admDebounced(() => admRerenderKeepingFocus(target)); }
  if (target.hasAttribute('data-adm-audit')) { admState.auditQuery = target.value; return admDebounced(() => admRerenderKeepingFocus(target)); }
  if (target.dataset.admHome) {
    admState.homeDraft[target.dataset.admHome] = target.value; admState.homeDirty = true;
    const counter = target.parentElement.querySelector('.adm-counter'); if (counter && target.maxLength > 0) counter.textContent = `${target.value.length}/${target.maxLength}`;
    if (target.dataset.admHome === 'heroImage') { const thumb = document.querySelector('[data-media-thumb="heroImage"]'); if (thumb) thumb.innerHTML = DOMPurify.sanitize(/^(https:\/\/|\/uploads\/)/.test(target.value) ? `<img src="${attr(target.value)}" alt="">` : icon('image')); }
    admSyncDirtyButtons('home'); return admDebounced(updateHomePreview, 100);
  }
  if (target.dataset.admSectionMeta) { const meta = admState.sectionsDraft.meta[target.dataset.admSectionMeta] ||= {}; meta[target.dataset.key] = target.value; admState.sectionsDirty = true; return admSyncDirtyButtons('sections'); }
  if (target.dataset.admAlert) { admState.alertDraft[target.dataset.admAlert] = target.type === 'checkbox' ? target.checked : target.value; admState.alertDirty = true; const counter = target.parentElement.querySelector('.adm-counter'); if (counter) counter.textContent = `${target.value.length}/280`; admSyncDirtyButtons('alert'); return updateAlertPreview(); }
  if (target.hasAttribute('data-adm-config')) { admState.configDirty = true; if (target.name === 'driveFolderUrl') { const node = document.getElementById('admFolderId'); if (node) node.innerHTML = DOMPurify.sanitize(`ID detectado: <span class="adm-mono">${esc(getGoogleDriveId(target.value) || '—')}</span>`); } }
}

function admSyncDirtyButtons(kind) {
  const map = { home: ['[data-adm-home-reset]', '[data-adm-home-publish]', admState.homeDirty], sections: ['[data-adm-sections-reset]', '[data-adm-sections-publish]', admState.sectionsDirty], alert: ['[data-adm-alert-reset]', '[data-adm-alert-publish]', admState.alertDirty] };
  const [reset, publish, dirty] = map[kind];
  el.adminContent.querySelectorAll(`${reset}, ${publish}`).forEach(button => { button.disabled = !dirty; });
}

function admRerenderKeepingFocus(input) {
  const selector = input.dataset.admFilter ? `[data-adm-filter="${input.dataset.admFilter}"][data-collection="${input.dataset.collection}"]` : input.dataset.admInbox ? `[data-adm-inbox="${input.dataset.admInbox}"]` : input.dataset.admDrive ? `[data-adm-drive="${input.dataset.admDrive}"]` : '[data-adm-audit]';
  const position = input.selectionStart;
  renderAdminContent({ keepScroll: true });
  const next = el.adminContent.querySelector(selector);
  if (next) { next.focus({ preventScroll: true }); try { next.setSelectionRange(position, position); } catch {} }
}

function handleAdminChange(event) {
  const target = event.target;
  if (target.matches('[data-adm-upload]')) return admUpload(target);
  if (target.matches('[data-adm-import]')) return admImport(target);
  if (target.matches('[data-adm-cycle-select]')) { const subject = document.querySelector('#admEditor [data-adm-subject-select]'); if (subject) subject.innerHTML = DOMPurify.sanitize(subjectOptionsFor(target.value, '')); if (admState.drawer) admState.drawer.dirty = true; return updateDrawerPreview(); }
  if (target.closest('#admEditor')) { if (admState.drawer) admState.drawer.dirty = true; return updateDrawerPreview(); }
  if (target.dataset.admSelect) { target.checked ? admState.selection.add(target.dataset.admSelect) : admState.selection.delete(target.dataset.admSelect); return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admFilter && target.dataset.admFilter !== 'query') { admState.filters[target.dataset.collection] = { ...(admState.filters[target.dataset.collection] || {}), [target.dataset.admFilter]: target.value }; return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admInbox && target.dataset.admInbox !== 'query') { admState.inbox[target.dataset.admInbox] = target.value; return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admDrive && target.dataset.admDrive !== 'query') { admState.driveFilters[target.dataset.admDrive] = target.value; return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admHome) { admState.homeDraft[target.dataset.admHome] = target.value; admState.homeDirty = true; admSyncDirtyButtons('home'); return updateHomePreview(); }
  if (target.dataset.admBlockVisible) { const block = admState.homeDraft.homeBlocks.find(item => item.id === target.dataset.admBlockVisible); if (block) block.visible = target.checked; admState.homeDirty = true; return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admSectionToggle) { admState.sectionsDraft.enabled[target.dataset.admSectionToggle] = target.checked; admState.sectionsDirty = true; return renderAdminContent({ keepScroll: true }); }
  if (target.dataset.admAlert) return handleAdminInput(event);
  if (target.dataset.admPriority) {
    const row = (appData.oportunidades || []).find(item => item.id === target.dataset.admPriority);
    if (row) admCommit(() => { row.alertPriority = target.checked; }, `${target.checked ? 'Marcó como prioritaria' : 'Quitó la prioridad de'} la oportunidad «${row.titulo || ''}»`, { success: target.checked ? 'Oportunidad destacada' : 'Prioridad retirada' }).then(() => renderAdminContent({ keepScroll: true }));
  }
}

function handleAdminSubmit(event) {
  const form = event.target;
  if (form.id === 'admEditor') { event.preventDefault(); return saveEditor('publish'); }
  if (form.id === 'admConfigForm') { event.preventDefault(); return submitAdmConfig(form); }
  if (form.dataset.admNoteForm) { event.preventDefault(); const message = appData.messages.find(item => item.id === form.dataset.admNoteForm); if (message) admUpdateMessage({ id: message.id, status: message.status || 'pendiente', read: message.read, note: form.elements.note.value }, 'Nota guardada'); }
}

function handleAdminKeydown(event) {
  if (event.target.id === 'admSearch') {
    const results = admState.searchResults || [];
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results.length) return;
      admState.searchIndex = (admState.searchIndex + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      document.querySelectorAll('#admSearchResults [data-adm-search-index]').forEach((node, index) => { node.classList.toggle('active', index === admState.searchIndex); node.setAttribute('aria-selected', String(index === admState.searchIndex)); if (index === admState.searchIndex) node.scrollIntoView({ block: 'nearest' }); });
      event.target.setAttribute('aria-activedescendant', `adm-sr-${admState.searchIndex}`);
      return;
    }
    if (event.key === 'Enter') { event.preventDefault(); return admOpenSearchResult(results[admState.searchIndex]); }
    if (event.key === 'Escape') { event.stopPropagation(); event.target.value = ''; document.getElementById('admSearchResults').hidden = true; return; }
  }
  if (event.key === 'Escape') {
    event.stopPropagation();
    if (!document.querySelector('#adminPanel .adm-menu:not([hidden])') && admState.drawer && !document.querySelector('.confirm-modal')) return closeDrawer();
    admCloseMenus();
    document.body.classList.remove('adm-nav-open');
  }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && event.target.closest('#admEditor')) { event.preventDefault(); saveEditor('publish'); }
}

// '/' or Ctrl+K focus the administration search while the panel is open.
document.addEventListener('keydown', event => {
  if (!el.adminPanel || el.adminPanel.hidden || admState.drawer || document.querySelector('.confirm-modal')) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
  if ((event.key === '/' && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
    event.preventDefault(); event.stopImmediatePropagation();
    document.getElementById('admSearch')?.focus();
  }
}, true);

// Floating bar shown while an unpublished home draft is previewed on the public page.
document.addEventListener('click', event => {
  if (event.target.closest('[data-preview-exit]')) exitHomePreview();
  else if (event.target.closest('[data-preview-publish]')) publishHomeDraft().then(ok => { if (ok) exitHomePreview({ reopen: false }); });
});
