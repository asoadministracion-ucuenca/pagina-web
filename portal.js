const studentStorage = window.AdeStudent?.storage || window.localStorage;
let studentUiInitialized = false, studentRenderPending = false;
let renderedStudentOwner = window.AdeStudent?.getState().user?.id || 'guest';
window.addEventListener('ade-student-data', refreshStudentPreferences);
document.addEventListener('focusout', () => setTimeout(() => {
  if (studentRenderPending && !document.activeElement?.matches('input,textarea,select')) refreshStudentPreferences();
}, 0));
    // CONFIGURACION RAPIDA:
    // Cambia estos valores iniciales antes de publicar. Luego tambien puedes cambiarlos desde el panel admin.
    const ADMIN_EMAIL = "";
    const ASO_DRIVE_URL = "https://script.google.com/macros/s/AKfycbyaUsqLaGZg-IQDrOZXrOPnwgswc3w9JzY-o97Xzd-5Xs0gmVk5X9ftECnDJ5_ImQkgzw/exec";
    const UNIVERSIDAD = "Universidad de Cuenca";
    const CARRERA = "Administración de Empresas";

    const STORAGE_KEY = "portal-ade-v2-local-preferences";
    const OLD_REPO_KEY = "portal-administracion-empresas-repositorio-v1";
    const PROFILE_KEY = "portal_administracion_student_profile";
    const FAVORITES_KEY = "portal_administracion_favorites";
    const POMODORO_KEY = "portal_administracion_pomodoro_sessions";
    const INDICATORS_KEY = "portal_administracion_indicadores_admin";
    const INDICATORS_PREVIOUS_KEY = "portal_administracion_indicadores_previos";
    const STUDENT_SCHEDULE_KEY = "studentSchedule";
    const CURRICULUM_STATE_KEY = "ade-curriculum-state-v2";
    const PUBLIC_FAVORITES_KEY = "favorites";
    const APA_KEY = "apaList";
    const TASK_TRACKER_KEY = "taskTracker";
    const AI_SOURCES_KEY = "portal_administracion_ai_sources";
    const DRIVE_CACHE_KEY = "ade-drive-aso-cache-v2";
    const ADMIN_LOG_KEY = "portal_administracion_admin_log";
    const ADMIN_LAST_ACTIVITY_KEY = "portal_admin_last_activity";
    const ADMIN_BACKUP_REMINDER_KEY = "portal_admin_backup_reminder";
    const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const ADMIN_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
    const STUDY_ACTIVITY_KEY = "portal_administracion_study_activity";
    const QUIZ_HISTORY_KEY = "portal_administracion_quiz_history";
    const SEMESTER_KEY = "portal_administracion_selected_semester";
    const SECTIONS = ["inicio", "carrera", "informacion", "repositorio", "silabos", "tutorias", "introductorio", "merch", "herramientas", "banco", "consultas", "docentes", "recursos", "oportunidades", "representantes"];

    const CYCLES = [
      { id: "primer-ciclo", name: "Primer Ciclo", subjects: ["Cálculo Diferencial", "Contabilidad", "Estadística Descriptiva y Probabilidad", "Fundamentos de la Administración", "Introducción a la Economía Empresarial", "Álgebra Matricial"] },
      { id: "segundo-ciclo", name: "Segundo Ciclo", subjects: ["Cálculo Integral", "Contabilidad de Gestión", "Estadística Inferencial", "Gestión Administrativa", "Derecho Laboral", "Microeconomía"] },
      { id: "tercer-ciclo", name: "Tercer Ciclo", subjects: ["Contabilidad de Costos", "Liderazgo y Equipos", "Contexto económico", "Matemáticas Financieras", "Estadística Aplicada", "Fundamentos de Programación"] },
      { id: "cuarto-ciclo", name: "Cuarto Ciclo", subjects: ["Fundamentos de Marketing", "Finanzas Corporativas a Corto Plazo", "Gestión de Talento Humano", "Gestión Presupuestaria", "Investigación Operativa", "Planificación Estratégica, Táctica y Operativa"] },
      { id: "quinto-ciclo", name: "Quinto Ciclo", subjects: ["Auditoría de Gestión", "Derecho Empresarial", "Emprendimiento e Innovación", "Finanzas Corporativas a Largo Plazo", "Gestión de la Producción", "Administración de Marketing", "Prácticas de Servicio Comunitario"] },
      { id: "sexto-ciclo", name: "Sexto Ciclo", subjects: ["Management and Financial Training", "Formulación de Proyectos", "Administración Pública", "Herramientas Informáticas y Sistemas de Información Gerencial", "Logística Empresarial", "Práctica Laboral", "Comunicación Digital y E-Commerce"] },
      { id: "septimo-ciclo", name: "Séptimo Ciclo", subjects: ["Evaluación de Proyectos", "Finanzas Internacionales", "Técnicas y Métodos de Investigación Empresarial", "Gerencia de Sostenibilidad", "Gestión de Empresas Públicas", "Comercio Exterior"] },
      { id: "octavo-ciclo", name: "Octavo Ciclo", subjects: ["Gestión de Calidad", "Estrategia y Toma de Decisiones", "Trabajo de Integración Curricular", "Negociación", "Creación de Empresas", "Business Intelligence"] }
    ].map((cycle) => ({ ...cycle, subjects: cycle.subjects.map((name) => ({ id: slugify(cycle.id + "-" + name), name })) }));
    const SUBJECTS = CYCLES.flatMap((cycle) => cycle.subjects.map((subject) => ({ ...subject, cycleId: cycle.id, cycleName: cycle.name })));
    const SCHEDULE_CYCLES = CYCLES;

    const CATEGORIES = [
      { id: "apuntes", label: "Apuntes de clase", short: "AP" },
      { id: "diapositivas", label: "Diapositivas", short: "DP" },
      { id: "guias", label: "Guías de estudio", short: "GE" },
      { id: "ejercicios", label: "Ejercicios resueltos", short: "ER" },
      { id: "examenes", label: "Exámenes anteriores", short: "EX" },
      { id: "lecturas", label: "Libros o lecturas recomendadas", short: "LB" },
      { id: "videos", label: "Videos de clase", short: "VD" },
      { id: "clases-grabadas", label: "Links de clases grabadas", short: "CG" },
      { id: "proyectos", label: "Proyectos o trabajos", short: "PY" },
      { id: "adicional", label: "Material adicional", short: "AD" }
    ];

    const SYLLABUS_OFFICIAL_URL = "https://silabos.ucuenca.edu.ec/buscador/";
    const SYLLABUS_DOWNLOAD_BASE_URL = "https://apibuscador.ucuenca.edu.ec/api/documentos/download/";
    const SYLLABUS_PERIOD_ID = null;
    const SYLLABUS_PERIOD_LABEL = "Consulta el periodo vigente";
    const SYLLABUS_CAREER_LABEL = "ADMINISTRACIÓN DE EMPRESAS";
    const SYLLABUS_SOURCE_UPDATED_AT = "2026-10-02";
    const OFFICIAL_SYLLABUS_ROWS = [];
    const SYLLABUS_CYCLE_BY_SUBJECT = {};
    let syllabusState = { search: "", cycleFilter: "all", page: 0 };
    const SYLLABUS_PAGE_SIZE = 4;

    // GOOGLE DRIVE COMO REPOSITORIO AUTOMATICO
    // 1) Publica el Apps Script incluido en la carpeta google-apps-script.
    // 2) Copia aqui la URL terminada en /exec.
    // Ejemplo: const DRIVE_REPOSITORY_API_URL = "https://script.google.com/macros/s/XXXX/exec";
    let DRIVE_ROOT_FOLDER_ID = "";
    let DRIVE_FOLDER_URL = "";
    const DEFAULT_ADE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1_vvpmg-VLtj6DgkaSfFDShRZpqH0EOb3";
    const DEFAULT_ADE_DRIVE_FOLDER_ID = "1_vvpmg-VLtj6DgkaSfFDShRZpqH0EOb3";
    const DEFAULT_ADE_APPS_SCRIPT_URL = ASO_DRIVE_URL;
    let DRIVE_REPOSITORY_API_URL = DEFAULT_ADE_APPS_SCRIPT_URL;
    const DRIVE_RESOURCE_SOURCE = "google-drive-auto";
    const SHEETS_SYNC_API_URL = "/api/content";
    // Mantiene el contrato del Apps Script que ya usa el portal ECO.
    const CRITICAL_SHEET_COLLECTIONS = ["settings", "docentes", "resources", "oportunidades", "representantes", "tutorias", "introClasses", "merch", "physicalBooks", "carreraCards", "schedules"];
    // Must match the settings whitelist enforced by server.mjs.
    const PUBLISHED_SETTING_KEYS = ["welcome", "mission", "vision", "heroTitle", "heroSubtitle", "heroEyebrow", "heroImage", "heroPrimaryLabel", "heroPrimarySection", "heroSecondaryLabel", "heroSecondarySection", "homeBlocks", "announcement", "sectionMeta", "kitVideo", "driveFolderUrl", "simplifiedDriveUrl", "driveRootFolderId", "driveRepositoryApiUrl", "enabledSections"];
    const RECENT_TOOLS_KEY = "portal_ade_recent_tools";
    const POMODORO_STATE_KEY = "portal_ade_pomodoro_state";
    const THEME_KEY = "portal_theme";
    let contentRevision = null;
    let publishPending = false;
    let publishInFlight = null;
    let driveRepositoryStatus = { enabled: false, loading: false, count: 0, error: "", updatedAt: "" };
    let sheetsSyncStatus = { loading: false, error: "", updatedAt: "" };
    let sharedDataRefreshTimer = null;
    let sharedDataRefreshInFlight = false;
    let lastAutomaticDriveRefresh = Date.now();
    const TOOL_TABS = {
      toolCalculadora: { title: "Calculadora de promedio", description: "Calcula la nota final, revisa cuánto necesitas para aprobar y controla cada aporte del semestre.", pill: "Notas" },
      toolHorario: { title: "Horario académico", description: "Organiza materias, grupos, aulas, docentes y días de clase en una sola tabla semanal.", pill: "Planificación" },
      toolMalla: { title: "Avance de malla curricular", description: "Marca materias aprobadas, en curso o pendientes y revisa tu progreso por ciclo.", pill: "Malla" },
      toolPomodoro: { title: "Focus Pomodoro", description: "Estudia por bloques, registra sesiones completadas y mantén concentración para exámenes.", pill: "Concentración" },
      toolFormulas: { title: "Banco de fórmulas", description: "Consulta fórmulas, conceptos, indicadores y métodos por materia con vista ordenada.", pill: "Fórmulas" },
      toolDataSources: { title: "Fuentes para empresas y mercados", description: "Encuentra portales oficiales con información sobre empresas, empleo, mercados, finanzas y estadísticas del Ecuador.", pill: "Datos" },
      toolIA: { title: "Asistente IA académico", description: "Pregunta sobre materiales, PDFs de Drive, exámenes, fórmulas, docentes, oportunidades del portal.", pill: "IA" },
      toolPlan: { title: "Plan de estudio", description: "Genera una ruta rápida de repaso según la materia y la fecha de examen.", pill: "Repaso" },
      toolSimulador: { title: "Simulador de examen", description: "Practica preguntas por materia y dificultad para prepararte antes de una evaluación.", pill: "Práctica" }
    };
    let activeToolPanelId = "toolCalculadora";
    let dataSourceFilter = "Todas";
    let dataSourcePage = 0;
    const DATA_SOURCE_PAGE_SIZE = 4;

    const DATA_SOURCE_CATEGORIES = ["Todas", "Empresas", "Emprendimiento", "Finanzas", "Mercado laboral", "Internacional", "Ecuador", "Tributario", "Contexto económico", "Entorno social", "Producción y sectores"];
    const BUSINESS_DATA_SOURCES = [
      {
        name: "Banco Mundial - World Bank Open Data",
        url: "https://data.worldbank.org/",
        description: "Indicadores internacionales sobre PIB, pobreza, inflación, educación, salud, comercio, población y desarrollo.",
        type: "Indicadores internacionales, series de países y datos de desarrollo.",
        categories: ["Internacional", "Contexto económico", "Entorno social"]
      },
      {
        name: "Banco Mundial - DataBank / World Development Indicators",
        url: "https://databank.worldbank.org/",
        description: "Base de datos para comparar países, descargar series históricas y trabajar con indicadores del desarrollo mundial.",
        type: "Series históricas, comparaciones por país y World Development Indicators.",
        categories: ["Internacional", "Contexto económico", "Entorno social"]
      },
      {
        name: "Banco Central del Ecuador - Estadísticas Económicas",
        url: "https://www.bce.fin.ec/estadisticas-economicas/",
        description: "Datos macroeconómicos de Ecuador: PIB, inflación, sector externo, balanza de pagos, cuentas nacionales, empleo, inversión y más.",
        type: "PIB, inflación, balanza de pagos, cuentas nacionales y sector externo.",
        categories: ["Ecuador", "Contexto económico"]
      },
      {
        name: "Banco Central del Ecuador - Datos abiertos",
        url: "https://datosabiertos.gob.ec/dataset/?organization=banco-central-del-ecuador",
        description: "Bases descargables del Banco Central del Ecuador en formatos abiertos.",
        type: "Datasets abiertos del Banco Central del Ecuador.",
        categories: ["Ecuador", "Contexto económico"]
      },
      {
        name: "INEC Ecuador - Banco de Datos Abiertos",
        url: "https://aplicaciones3.ecuadorencifras.gob.ec/BIINEC-war/",
        description: "Bases de datos, metodologías, tabulados y sintaxis de operaciones estadísticas del INEC.",
        type: "Microdatos, tabulados, metodologías y sintaxis estadísticas.",
        categories: ["Ecuador", "Entorno social", "Empresas"]
      },
      {
        name: "INEC Ecuador - Estadísticas Económicas",
        url: "https://www.ecuadorencifras.gob.ec/estadisticas-economicas-3/",
        description: "Información sobre empresas, agricultura, industria, comercio, empleo, precios y otros indicadores económicos.",
        type: "Empresas, agricultura, industria, comercio, empleo y precios.",
        categories: ["Ecuador", "Empresas", "Producción y sectores", "Entorno social"]
      },
      {
        name: "SRI Ecuador - Estadísticas",
        url: "https://www.sri.gob.ec/estadisticas-sri",
        description: "Recaudación tributaria, impuestos, contribuyentes y datos fiscales del Ecuador.",
        type: "Recaudación, impuestos, contribuyentes y estadísticas fiscales.",
        categories: ["Ecuador", "Tributario", "Contexto económico"]
      },
      {
        name: "SRI Ecuador - Datasets",
        url: "https://www.sri.gob.ec/datasets",
        description: "Bases de datos descargables relacionadas con comprobantes, RUC y estadísticas tributarias.",
        type: "RUC, comprobantes, datasets tributarios y bases descargables.",
        categories: ["Ecuador", "Tributario", "Empresas"]
      },
      {
        name: "Datos Abiertos Ecuador",
        url: "https://datosabiertos.gob.ec/",
        description: "Portal nacional con datasets públicos de distintas instituciones del Ecuador.",
        type: "Datos públicos nacionales, datasets institucionales y formatos abiertos.",
        categories: ["Ecuador", "Entorno social", "Empresas", "Producción y sectores"]
      },
      {
        name: "CEPALSTAT",
        url: "https://statistics.cepal.org/portal/cepalstat/dashboard.html",
        description: "Estadísticas económicas, sociales y ambientales de América Latina y el Caribe.",
        type: "Indicadores regionales de América Latina y el Caribe.",
        categories: ["Internacional", "Contexto económico", "Entorno social"]
      },
      {
        name: "Fondo Monetario Internacional - IMF Data",
        url: "https://data.imf.org/",
        description: "Datos macroeconómicos y financieros internacionales: inflación, PIB, balanza de pagos, deuda, comercio y finanzas públicas.",
        type: "Macroeconomía, finanzas públicas, deuda, comercio y balanza de pagos.",
        categories: ["Internacional", "Contexto económico"]
      },
      {
        name: "Our World in Data",
        url: "https://ourworldindata.org/",
        description: "Datos y gráficos sobre pobreza, crecimiento económico, salud, educación, población, energía, desigualdad y desarrollo.",
        type: "Gráficos, datos comparables y ensayos visuales sobre desarrollo.",
        categories: ["Internacional", "Entorno social", "Contexto económico"]
      },
      {
        name: "FAOSTAT",
        url: "https://www.fao.org/faostat/en/",
        description: "Datos internacionales sobre agricultura, alimentos, producción, comercio agrícola y seguridad alimentaria.",
        type: "Agricultura, alimentos, producción, comercio agrícola y seguridad alimentaria.",
        categories: ["Internacional", "Producción y sectores"]
      }
    ];



    // Fórmulas y criterios de apoyo para materias de Administración de Empresas.
    const FORMULA_BANK_DATA = [
      { id: "ADE-01", ciclo: "Primer Ciclo", materia: "Fundamentos de la Administración", num: 1, tipo: "Concepto", nivel: "Básico", tema: "Eficacia", valor: "Objetivos alcanzados / objetivos planificados", definicion: "Mide si una organización consigue los resultados que se propuso.", uso: "Compara resultados reales con metas definidas." },
      { id: "ADE-02", ciclo: "Primer Ciclo", materia: "Fundamentos de la Administración", num: 2, tipo: "Concepto", nivel: "Básico", tema: "Eficiencia", valor: "Resultados obtenidos / recursos utilizados", definicion: "Relaciona los resultados de un proceso con el tiempo, el dinero y los recursos empleados.", uso: "Busca mejorar el uso de recursos sin sacrificar la calidad." },
      { id: "ADE-03", ciclo: "Primer Ciclo", materia: "Contabilidad", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Ecuación contable", valor: "Activos = Pasivos + Patrimonio", definicion: "Resume la relación entre los recursos de la entidad y las fuentes que los financian.", uso: "Base para revisar la consistencia del estado de situación financiera." },
      { id: "ADE-04", ciclo: "Primer Ciclo", materia: "Estadística Descriptiva y Probabilidad", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Media aritmética", valor: "x̄ = Σxᵢ / n", definicion: "Promedio de un conjunto de observaciones.", uso: "Resume ventas, costos, tiempos u otros datos cuantitativos." },
      { id: "ADE-05", ciclo: "Primer Ciclo", materia: "Introducción a la Economía Empresarial", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Punto de equilibrio", valor: "Q = Costos fijos / (Precio unitario − Costo variable unitario)", definicion: "Volumen de ventas en el que los ingresos cubren los costos totales.", uso: "Estima las unidades que deben venderse para no tener pérdida ni utilidad." },
      { id: "ADE-06", ciclo: "Segundo Ciclo", materia: "Contabilidad de Gestión", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Margen de contribución unitario", valor: "Precio de venta unitario − Costo variable unitario", definicion: "Aporte de cada unidad vendida a cubrir costos fijos y generar utilidad.", uso: "Apoya precios, mezcla de productos y análisis de equilibrio." },
      { id: "ADE-07", ciclo: "Segundo Ciclo", materia: "Gestión Administrativa", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Productividad laboral", valor: "Unidades producidas / horas trabajadas", definicion: "Mide la producción obtenida por unidad de trabajo.", uso: "Compara periodos o equipos cuando se mantiene una definición consistente de producción." },
      { id: "ADE-08", ciclo: "Tercer Ciclo", materia: "Contabilidad de Costos", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Costo total", valor: "Costos fijos + Costos variables", definicion: "Suma de los costos que no dependen del volumen y los que varían con la actividad.", uso: "Proyecta costos para diferentes niveles de producción." },
      { id: "ADE-09", ciclo: "Tercer Ciclo", materia: "Matemáticas Financieras", num: 1, tipo: "Fórmula", nivel: "Básico", tema: "Valor futuro con interés compuesto", valor: "VF = VP × (1 + i)ⁿ", definicion: "Capitaliza un valor presente a una tasa por varios periodos.", uso: "Compara opciones de ahorro, crédito e inversión verificando tasa y frecuencia." },
      { id: "ADE-10", ciclo: "Cuarto Ciclo", materia: "Fundamentos de Marketing", num: 1, tipo: "Indicador", nivel: "Básico", tema: "Participación de mercado", valor: "Ventas de la empresa / ventas totales del mercado × 100%", definicion: "Proporción de las ventas del mercado atribuible a una empresa.", uso: "Compara posición competitiva dentro de un mercado definido." },
      { id: "ADE-11", ciclo: "Cuarto Ciclo", materia: "Gestión de Talento Humano", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Rotación de personal", valor: "Salidas del periodo / promedio de empleados × 100%", definicion: "Porcentaje de la plantilla que sale durante un periodo determinado.", uso: "Interpreta junto con el periodo, tipo de salida y tamaño de la organización." },
      { id: "ADE-12", ciclo: "Cuarto Ciclo", materia: "Gestión Presupuestaria", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Variación presupuestaria", valor: "Valor real − valor presupuestado", definicion: "Diferencia entre el resultado observado y el presupuesto aprobado.", uso: "Investiga la causa y el efecto de las desviaciones antes de proponer ajustes." },
      { id: "ADE-13", ciclo: "Cuarto Ciclo", materia: "Finanzas Corporativas a Corto Plazo", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Razón corriente", valor: "Activos corrientes / Pasivos corrientes", definicion: "Indicador de cobertura de obligaciones de corto plazo con activos corrientes.", uso: "Evalúa liquidez junto con la calidad de inventarios y cuentas por cobrar." },
      { id: "ADE-14", ciclo: "Quinto Ciclo", materia: "Emprendimiento e Innovación", num: 1, tipo: "Indicador", nivel: "Básico", tema: "Retorno sobre la inversión", valor: "(Beneficio neto / inversión) × 100%", definicion: "Relaciona el beneficio obtenido con los recursos invertidos.", uso: "Compara alternativas explicando periodo, costos incluidos y criterio de beneficio." },
      { id: "ADE-15", ciclo: "Quinto Ciclo", materia: "Gestión de la Producción", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Utilización de capacidad", valor: "Producción real / capacidad disponible × 100%", definicion: "Mide cuánto de la capacidad productiva se está usando.", uso: "Identifica capacidad ociosa o restricciones de operación." },
      { id: "ADE-16", ciclo: "Sexto Ciclo", materia: "Logística Empresarial", num: 1, tipo: "Modelo", nivel: "Intermedio", tema: "Punto de reorden", valor: "Demanda durante el plazo de entrega + inventario de seguridad", definicion: "Nivel de inventario que activa una nueva orden de reposición.", uso: "Ajusta la política con demanda, plazo de proveedor y variabilidad observada." },
      { id: "ADE-17", ciclo: "Séptimo Ciclo", materia: "Evaluación de Proyectos", num: 1, tipo: "Fórmula", nivel: "Avanzado", tema: "Valor actual neto", valor: "VAN = Σ Flujosₜ / (1 + r)ᵗ − inversión inicial", definicion: "Valor presente de los flujos netos del proyecto menos la inversión inicial.", uso: "Un VAN positivo indica creación de valor bajo los supuestos y la tasa de descuento elegidos." },
      { id: "ADE-18", ciclo: "Octavo Ciclo", materia: "Gestión de Calidad", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Tasa de defectos", valor: "Unidades defectuosas / unidades producidas × 100%", definicion: "Proporción de unidades que no cumplen los criterios de calidad.", uso: "Compara procesos y verifica si las acciones correctivas reducen defectos." },
      { id: "ADE-19", ciclo: "Octavo Ciclo", materia: "Business Intelligence", num: 1, tipo: "Indicador", nivel: "Básico", tema: "Tasa de conversión", valor: "Conversiones / oportunidades × 100%", definicion: "Proporción de oportunidades que alcanzan el resultado definido.", uso: "Define con claridad qué cuenta como oportunidad y conversión antes de comparar." },
      { id: "ADE-20", ciclo: "Octavo Ciclo", materia: "Estrategia y Toma de Decisiones", num: 1, tipo: "Indicador", nivel: "Intermedio", tema: "Cumplimiento de objetivos", valor: "Objetivos alcanzados / objetivos planificados × 100%", definicion: "Mide el avance frente a las metas acordadas para un periodo.", uso: "Acompaña cada objetivo con responsable, plazo y evidencia verificable." }
    ];

    const PORTAL_DATA_CACHE = new Map();
    const FORMULA_DATA_ENDPOINT = "./data/formulas.json";
    const AI_CHAT_HISTORY_LIMIT = 6;
    let formulaBankRuntimeData = FORMULA_BANK_DATA;
    let formulaBankDataLoaded = false;
    let formulaBankDataLoading = false;
    let aiConversationHistory = [];

    const APP_CONFIG = {
      apa: { title: "Generador de Bibliografía APA", crumb: "Aprender", mode: "panel" },
      tasks: { title: "Rastreador de Tareas", crumb: "Comunidad", mode: "panel" },
      glossary: { title: "Glosario de Administración y Negocios", crumb: "Aprender", mode: "modal" },
      timeline: { title: "Historia de la Gestión Empresarial", crumb: "Aprender", mode: "modal" }
    };

    const defaultData = {
      settings: {
        adminEmail: ADMIN_EMAIL,
        heroTitle: "Tu carrera. Tu comunidad. Tu próximo paso.",
        heroEyebrow: "Administración de Empresas · Universidad de Cuenca",
        heroSubtitle: "La plataforma de la ASO 2026–2027 para estudiar, organizarte y participar.",
        heroImage: "",
        heroPrimaryLabel: "Abrir repositorio",
        heroPrimarySection: "repositorio",
        heroSecondaryLabel: "Enviar consulta",
        heroSecondarySection: "consultas",
        homeBlocks: [],
        announcement: { active: false, tone: "info", text: "", link: "", linkLabel: "" },
        sectionMeta: {},
        welcome: "Un espacio para quienes están construyendo el futuro de las organizaciones. Recursos, herramientas y representación para acompañarte en cada ciclo.",
        mission: "Formar investigadores y profesionales comprometidos con una sociedad justa, diversa y sostenible, dispuestos a ser agentes de transformación.",
        vision: "Al 2027, la Universidad de Cuenca es una comunidad universitaria innovadora y resiliente, integrada al mundo a través de la generación de conocimiento pertinente, de calidad y comprometida con la sociedad.",
        kitVideo: "",
        suggestionFormUrl: "https://forms.gle/",
        simplifiedDriveUrl: DEFAULT_ADE_DRIVE_FOLDER_URL,
        driveRepositoryApiUrl: DEFAULT_ADE_APPS_SCRIPT_URL,
        driveFolderUrl: DEFAULT_ADE_DRIVE_FOLDER_URL,
        driveRootFolderId: DEFAULT_ADE_DRIVE_FOLDER_ID,
        consultaEmailDestino: "",
        merchEmailDestino: "",
        enabledSections: Object.fromEntries(SECTIONS.map((section) => [section, true]))
      },
      resources: [],
      docentes: [],
      representantes: [{"id":"ade-president","nombre":"Ismael Masache","cargo":"Presidente","redes":"https://www.instagram.com/ismael.alejo0/","funciones":"Tu voz en las decisiones de nuestra carrera.","ciclo":"ASO 2026–2027","email":"","foto":""},{"id":"ade-vice","nombre":"@jess_quezadaaaa","cargo":"Vicepresidenta","redes":"https://www.instagram.com/jess_quezadaaaa/","funciones":"Coordinación y acompañamiento a la comunidad estudiantil.","ciclo":"ASO 2026–2027","email":"","foto":""},{"id":"ade-executive","nombre":"Mauricio León","cargo":"Comité Ejecutivo","redes":"https://www.instagram.com/mauricio.leonch/","funciones":"Colaboración y gestión de iniciativas estudiantiles.","ciclo":"ASO 2026–2027","email":"","foto":""}],
      oportunidades: [],
      tutorias: [],
      introClasses: [],
      merch: [],
      physicalBooks: [],
      gradebook: {},
      curriculumStatus: {},
      studentSchedules: [],
      schedules: [],
      carreraCards: [
        {
          id: uid(),
          orden: "01",
          titulo: "¿Qué estudia Administración de Empresas?",
          resumen: "Cómo crear, dirigir y mejorar organizaciones con responsabilidad y visión estratégica.",
          detalle: "La carrera prepara profesionales para gestionar organizaciones públicas y privadas, emprender y tomar decisiones en áreas como marketing, finanzas, talento humano, producción y logística. La formación combina conocimientos de gestión con herramientas tecnológicas, investigación, ética y sostenibilidad.",
          videos: ""
        },
        {
          id: uid(),
          orden: "02",
          titulo: "Perfil profesional",
          resumen: "Gestión, análisis, planificación y toma de decisiones en organizaciones.",
          detalle: "La formación desarrolla competencias para planificar y gestionar recursos, diseñar estrategias, interpretar información financiera y de mercado, coordinar equipos y evaluar resultados. El ejercicio profesional requiere criterio ético, comunicación, trabajo colaborativo y adaptación a distintos entornos empresariales.",
          videos: ""
        },
        {
          id: uid(),
          orden: "03",
          titulo: "Campo ocupacional",
          resumen: "Emprendimiento, gerencia, consultoría y gestión de áreas funcionales.",
          detalle: "El catálogo de la Universidad de Cuenca identifica oportunidades en emprendimientos propios, consultoría y asesoría a organizaciones, además de la dirección de áreas de marketing y ventas, producción y logística, talento humano, finanzas y contabilidad. También contempla docencia vinculada con la carrera.",
          videos: ""
        },
        {
          id: uid(),
          orden: "04",
          titulo: "Áreas de formación",
          resumen: "Finanzas, marketing, talento humano, operaciones, estrategia e innovación.",
          detalle: "La malla publicada por UCuenca integra contabilidad, gestión administrativa, marketing, finanzas, talento humano, logística, proyectos, sostenibilidad, negociación, creación de empresas y herramientas de información para la gestión. Consulta la página oficial para revisar el detalle actualizado por ciclo.",
          videos: ""
        }
      ],
      messages: [],
      adminLog: []
    };

    const defaultResources = [];

    let appData = loadData();
    let repoState = { view: "cycles", cycleId: null, subjectId: null, search: "", cycleFilter: "all", typeFilter: "all", sourceFilter: "all", viewMode: "grid", sortOrder: "desc" };
    const REPOSITORY_PAGE_SIZE = 4;
    let repositoryPages = {};
    let selectedCurveCycle = CYCLES[0]?.id || "";
    let isAdmin = false;
    let adminSessionToken = "";
    let adminInactivityTimer = null;
    let adminBackupReminderShown = false;
    let adminTab = "dashboard";
    // Draft settings shown on the public home while an administrator previews them (never published).
    let homePreviewSettings = null;
    // Operational facts reported by /api/admin: last backup, last Drive synchronization, mail relay.
    let adminServerState = {};
    // Raw public catalogue returned by the Drive reader, including files without a recognisable location.
    let driveCatalogFiles = [];
    let pendingPublishSummary = "";
    let pomodoroTimer = null;
    let pomodoroMode = "study";
    let pomodoroRemaining = 25 * 60;
    let pomodoroRunning = false;
    let pomodoroDeadline = 0;
    let commandResultsCache = [];
    let studentProfile = loadJson(PROFILE_KEY, {});
    let favoriteIds = loadJson(PUBLIC_FAVORITES_KEY, loadJson(FAVORITES_KEY, []));
    let pomodoroSessions = Number(studentStorage.getItem(POMODORO_KEY) || 0);
    let economicIndicators = null;
    let economicIndicatorsAt = 0;
    let economicIndicatorsFailed = false;
    let economicNewsAt = 0;
    let economicNewsScheduled = false;
    let economicIndicatorsTimer = null;
    let economicIndicatorsScheduled = false;
    const ECONOMIC_INDICATORS_REFRESH = window.AdeLiveSnapshot?.available ? 30*60*1000 : 60*1000;
    const ECONOMIC_NEWS_REFRESH = window.AdeLiveSnapshot?.available ? 30*60*1000 : 10*60*1000;
    let heroClockTimer = null;
    let activeApp = null;
    let activeAppMode = null;
    let apaType = "book";
    let generatedApa = "";
    let glossaryState = { query: "", category: "all", difficulty: "all", detailId: null };
    let timelineSchool = "all";
    let timelinePage = 0;
    const TIMELINE_PAGE_SIZE = 4;
    let taskShowForm = false;
    let scheduleViewMode = "list";
    let scheduleEditId = "";
    let examSimulatorState = { questions: [], index: 0, answers: [] };
    let formulaVisibleCount = 4;

    const el = {};
    const EAGER_RENDER_SECTIONS = new Set(["inicio", "herramientas"]);
    const renderedSections = {};

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
      if (location.protocol === 'file:') return;
      cacheElements();
      hydrateDefaults();
      applyDarkMode();
      populateSelects();
      bindEvents();
      cleanupOldLocalData();
      restorePomodoro();
      setupRealtimeValidation();
      applyFormSubmitConfig();
      hydrateDriveRepositoryCache();
      if (DRIVE_REPOSITORY_API_URL) {
        driveRepositoryStatus = { ...driveRepositoryStatus, enabled: true, loading: true, error: "" };
      }
      renderInitialState();
      studentUiInitialized = true;
      startHeroClock();
      startEconomicIndicatorUpdates();
      await validateAdminSessionOnLoad();
      syncAdminMode();
      if (isAdmin) renderAll();
      startSharedDataRefresh();
      startInitialRemoteSync();
    }

    function renderInitialState() {
      syncAdminMode();
      showSection(getInitialSection(), false);
      renderNotifications();
      renderProfileSummary();
      updateTaskBadge();
      applySectionVisibility();
    }

    function startInitialRemoteSync() {
      loadCriticalCollectionsFromSheets({ timeoutMs: 9000 })
        .then((result) => {
          if (result?.changed) {
            applyFormSubmitConfig();
            refreshVisibleDataAfterSync(result.changedCollections || CRITICAL_SHEET_COLLECTIONS);
          }
        })
        .then(() => loadDriveRepositoryResources())
        .then(() => {
          lastAutomaticDriveRefresh = Date.now();
          refreshVisibleDataAfterSync(["resources"]);
        })
        .catch((error) => console.warn("No se pudo completar la sincronización inicial en segundo plano.", error));
    }

    function refreshVisibleDataAfterSync(collections = []) {
      const changed = new Set(collections);
      const active = document.querySelector("[data-section].active")?.dataset.section || getInitialSection();

      if (active === "inicio") {
        if (["settings", "resources", "tutorias", "oportunidades"].some(name => changed.has(name))) renderHome();
      } else {
        const sectionCollections = {
          carrera: ["carreraCards"],
          repositorio: ["resources", "physicalBooks"],
          banco: ["resources"],
          tutorias: ["tutorias"],
          introductorio: ["introClasses"],
          merch: ["merch"],
          herramientas: ["schedules"],
          docentes: ["docentes"],
          oportunidades: ["oportunidades"],
          representantes: ["representantes"]
        };
        if (sectionCollections[active]?.some(name => changed.has(name))) renderSection(active, true);
      }

      renderNotifications();
    }

    function scheduleLowPriorityTask(callback, timeout = 1200) {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(callback, { timeout });
      } else {
        window.setTimeout(callback, Math.min(timeout, 300));
      }
    }

    function cacheElements() {
      [
        "navLinks", "hamburgerButton", "darkModeToggle", "alertBanner", "eventsNavBadge", "examNavBadge", "servicesOpenButton", "servicesCloseButton", "servicesBackdrop", "servicesPanel", "repositoryView", "breadcrumb", "backButton", "searchInput", "cycleFilter", "typeFilter", "sourceFilter", "repositoryViewMode", "sortOrder", "addMaterialButton",
        "globalSearchButton", "profileOpenButton", "profileCloseButton", "profileBackdrop", "profilePanel", "profileForm", "profileName", "profileEmail", "profileCycle", "profileSummary",
        "materialCounter", "heroMaterialCounter", "favoriteCounter", "subjectCounter", "exchangeStatus", "economicIndicators", "heroClockTime", "heroClockDate", "heroIntroStats", "semesterWidget", "nextClassWidget", "continueWidget", "recommendedWidget", "homeRecentMaterials", "economicNewsList", "materialModal", "materialForm", "materialTitle", "materialType", "materialDescription",
        "materialUrl", "materialUploader", "materialDate", "materialCycle", "materialSubject", "tutoriasContainer", "introClassesContainer", "merchContainer", "bancoSubjectChips", "bancoTableBody", "repoQuickFilters",
        "gpaCycle", "gpaSubject", "gpaRows", "calculateGpa", "gpaResult", "scheduleCycle", "scheduleGroup", "scheduleSubject", "scheduleDay", "scheduleStart", "scheduleEnd", "scheduleAula", "scheduleDocente", "addStudentSchedule", "printToolsButton", "scheduleTableWrap", "pomodoroMode", "pomodoroStatus", "pomodoroDisplay", "pomodoroProgress", "pomodoroStudy", "pomodoroBreak", "pomodoroSessions", "pomodoroStart", "pomodoroPause", "pomodoroReset", "curriculumGrid", "curriculumProgressBar", "curriculumProgressText", "formulaSubject", "formulaList", "syllabusSearch", "syllabusCycleFilter", "syllabusStatus", "syllabusGrid", "syllabusOfficialLink", "dataSourceSearch", "dataSourceFilters", "dataSourceSummary", "dataSourceGrid", "aiSubject", "aiQuestion", "aiAskButton", "aiResult", "aiSourceTitle", "aiSourceText", "aiAddSource", "studyPlanSubject", "studyPlanDate", "generateStudyPlan", "studyPlanResult", "examSimCycle", "examSimSubject", "examSimDifficulty", "startExamSim", "examSimResult",
        "bancoFilterCiclo", "bancoFilterTipo", "consultaForm", "consultaNombre", "consultaEmail", "consultaCiclo", "consultaTipo", "consultaMensaje", "consultaTelefono",
        "careerCardsContainer", "careerPathContainer", "docentesContainer", "recursosContainer", "oportunidadesContainer", "representantesContainer", "faqList",
        "welcomeText", "missionText", "visionText", "homeQuickLinks", "mostUsedGrid", "homeOpportunities", "kitVideoFrame", "physicalBooksContainer", "requestModal", "requestModalContent",
        "toastContainer", "commandPalette", "commandInput", "commandResults", "commandClose", "backToTopButton", "appBackdrop", "appPanel", "appPanelTitle", "appPanelCrumb", "appPanelContent", "appPanelClose", "appModal", "appModalTitle", "appModalCrumb", "appModalContent", "appModalClose", "adminModeBar", "adminLogoutButton", "adminOpenButton", "adminLoginModal", "adminLoginForm", "adminEmailInput", "adminPasswordInput", "adminPanel", "adminTabs", "adminContent"
      ].forEach((id) => { el[id] = document.getElementById(id); });
    }

    function hydrateDefaults() {
      appData.settings = { ...defaultData.settings, ...(appData.settings || {}) };
      DRIVE_FOLDER_URL = appData.settings.driveFolderUrl || appData.settings.simplifiedDriveUrl || DEFAULT_ADE_DRIVE_FOLDER_URL;
      appData.settings.driveFolderUrl = DRIVE_FOLDER_URL;
      appData.settings.simplifiedDriveUrl = appData.settings.simplifiedDriveUrl || DRIVE_FOLDER_URL;
      DRIVE_ROOT_FOLDER_ID = appData.settings.driveRootFolderId || getGoogleDriveId(DRIVE_FOLDER_URL) || DEFAULT_ADE_DRIVE_FOLDER_ID;
      appData.settings.driveRootFolderId = DRIVE_ROOT_FOLDER_ID;
      appData.settings.driveRepositoryApiUrl = appData.settings.driveRepositoryApiUrl || DEFAULT_ADE_APPS_SCRIPT_URL;
      DRIVE_REPOSITORY_API_URL = appData.settings.driveRepositoryApiUrl;
      driveRepositoryStatus.enabled = Boolean(DRIVE_REPOSITORY_API_URL);
      if (!appData.resources.length) appData.resources = [...defaultResources, ...migrateOldResources()];
      const savedStudentSchedule = loadJson(STUDENT_SCHEDULE_KEY, null);
      if (Array.isArray(savedStudentSchedule)) appData.studentSchedules = savedStudentSchedule;
      const savedCurriculumState = loadJson(CURRICULUM_STATE_KEY, null) || loadJson("curriculumState", null);
      if (savedCurriculumState && typeof savedCurriculumState === "object") appData.curriculumStatus = Object.fromEntries(SUBJECTS.filter(subject => ["pendiente","en-curso","aprobada"].includes(savedCurriculumState[subject.id])).map(subject=>[subject.id,savedCurriculumState[subject.id]]));
      const savedFavorites = loadJson(PUBLIC_FAVORITES_KEY, null);
      if (Array.isArray(savedFavorites)) favoriteIds = savedFavorites;
      saveData();
    }

    function bindEvents() {
      document.querySelectorAll("[data-tab]").forEach((node) => node.addEventListener("click", (event) => {
        if (node.matches("[data-nav-accordion]") && !isDesktopNav()) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        const sourceNavGroup = node.closest("[data-nav-group]");
        showSection(node.dataset.tab, true);
        handleServiceFocus(node.dataset.serviceFocus);
        setMobileMenuOpen(false);
        closeAllNavGroups();
        if (sourceNavGroup && !node.matches("[data-nav-accordion]")) dismissNavDropdown(sourceNavGroup);
        closeServicesPanel();
      }));
      document.querySelectorAll("[data-tool-tab]").forEach((node) => node.addEventListener("click", (event) => {
        const tabId = node.dataset.toolTab;
        if (!tabId) return;
        event.preventDefault();
        showSection("herramientas", true);
        activateToolTab(tabId, true);
        setMobileMenuOpen(false);
      }));
      el.hamburgerButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setMobileMenuOpen(!el.navLinks.classList.contains("open"));
      });
      document.addEventListener("click", (event) => {
        if (!el.navLinks.classList.contains("open")) return;
        if (!el.navLinks.contains(event.target) && !el.hamburgerButton.contains(event.target)) {
          setMobileMenuOpen(false);
          closeAllNavGroups();
        }
      });
      document.querySelectorAll("[data-nav-accordion]").forEach((node) => node.addEventListener("click", (event) => {
        const group = node.closest("[data-nav-group]");
        if (!group) return;
        group.classList.remove("dropdown-dismissed");
        clearDismissedDropdowns(group);
        if (isDesktopNav()) {
          if (!node.dataset.tab) event.preventDefault();
          openNavGroup(group);
          return;
        }
        const wasOpen = group.classList.contains("open");
        closeAllNavGroups(group);
        group.classList.toggle("open", !wasOpen);
        node.setAttribute("aria-expanded", String(!wasOpen));
        syncNavDropdownAria();
      }));
      bindNavHoverIntent();
      document.addEventListener("click", (event) => {
        const appTrigger = event.target.closest("[data-app]");
        if (!appTrigger) return;
        event.preventDefault();
        const sourceNavGroup = appTrigger.closest("[data-nav-group]");
        openApp(appTrigger.dataset.app);
        setMobileMenuOpen(false);
        closeAllNavGroups();
        dismissNavDropdown(sourceNavGroup);
      });
      el.servicesOpenButton?.addEventListener("click", openServicesPanel);
      el.servicesCloseButton?.addEventListener("click", closeServicesPanel);
      el.servicesBackdrop?.addEventListener("click", closeServicesPanel);
      el.globalSearchButton?.addEventListener("click", openCommandPalette);
      el.profileOpenButton?.addEventListener("click", openProfilePanel);
      el.profileCloseButton?.addEventListener("click", closeProfilePanel);
      el.profileBackdrop?.addEventListener("click", closeProfilePanel);
      el.profileForm?.addEventListener("submit", submitProfile);
      el.darkModeToggle?.addEventListener("click", toggleDarkMode);
      document.getElementById("mobileDarkModeToggle")?.addEventListener("click", () => {
        toggleDarkMode();
        setMobileMenuOpen(false);
      });
      document.addEventListener("keydown", handleGlobalKeydown);
      window.addEventListener("hashchange", () => showSection(getInitialSection(), false));
      el.commandClose?.addEventListener("click", closeCommandPalette);
      el.commandPalette?.addEventListener("click", (event) => { if (event.target === el.commandPalette) closeCommandPalette(); });
      el.commandInput?.addEventListener("input", renderCommandResults);
      el.commandResults?.addEventListener("click", handleCommandClick);
      el.appBackdrop?.addEventListener("click", closeApp);
      el.appPanelClose?.addEventListener("click", closeApp);
      el.appModalClose?.addEventListener("click", closeApp);
      document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-open-drive-repo]")) return;
        openDriveRepositoryNotice();
        setMobileMenuOpen(false);
        closeAllNavGroups();
      });
      document.querySelectorAll("[data-mobile-search]").forEach((button) => button.addEventListener("click", openCommandPalette));
      document.querySelectorAll("[data-mobile-profile]").forEach((button) => button.addEventListener("click", openProfilePanel));
      document.querySelectorAll("[data-mobile-more]").forEach((button) => button.addEventListener("click", openServicesPanel));
      el.backToTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: motionBehavior() }));
      window.addEventListener("scroll", updateBackToTopButton, { passive: true });
      updateBackToTopButton();
      document.querySelectorAll("[data-admin-quick-add]").forEach((button) => button.addEventListener("click", () => {
        if (!isAdmin) return openAdminLogin();
        showSection("repositorio", true);
        openMaterialModal();
      }));
      document.addEventListener("click", (event) => {
        if (event.target.closest("#appPanelClose, #appModalClose, [data-close-app]")) closeApp();
      });
      el.appPanelContent?.addEventListener("click", handleAppClick);
      el.appModalContent?.addEventListener("click", handleAppClick);
      el.appPanelContent?.addEventListener("submit", handleAppSubmit);
      el.appModalContent?.addEventListener("submit", handleAppSubmit);
      el.appPanelContent?.addEventListener("input", handleAppInput);
      el.appModalContent?.addEventListener("input", handleAppInput);
      el.appPanelContent?.addEventListener("change", handleAppChange);
      el.appModalContent?.addEventListener("change", handleAppChange);

      el.searchInput.addEventListener("input", (event) => { repoState.search = event.target.value; resetRepositoryPaging(); renderRepository(); });
      el.cycleFilter.addEventListener("change", (event) => {
        repoState.cycleFilter = event.target.value;
        if (repoState.cycleFilter === "all") openRepoRoot(); else openCycle(repoState.cycleFilter);
      });
      el.typeFilter.addEventListener("change", (event) => { repoState.typeFilter = event.target.value; resetRepositoryPaging(); renderRepository(); });
      el.sourceFilter?.addEventListener("change", (event) => { repoState.sourceFilter = event.target.value; resetRepositoryPaging(); renderRepository(); });
      el.repositoryViewMode?.addEventListener("change", (event) => { repoState.viewMode = event.target.value; renderRepository(); });
      el.sortOrder.addEventListener("change", (event) => { repoState.sortOrder = event.target.value; resetRepositoryPaging(); renderRepository(); });
      el.repoQuickFilters?.addEventListener("click", handleRepoQuickFilter);
      el.backButton.addEventListener("click", goRepoBack);
      el.addMaterialButton.addEventListener("click", () => {
        if (!isAdmin) return openAdminLogin();
        openMaterialModal();
      });
      el.repositoryView.addEventListener("click", handleRepositoryClick);
      el.breadcrumb.addEventListener("click", handleBreadcrumbClick);
      el.syllabusSearch?.addEventListener("input", () => {
        syllabusState.search = el.syllabusSearch.value;
        syllabusState.page = 0;
        renderSyllabiSection();
      });
      el.syllabusCycleFilter?.addEventListener("change", () => {
        syllabusState.cycleFilter = el.syllabusCycleFilter.value || "all";
        syllabusState.page = 0;
        renderSyllabiSection();
      });
      el.syllabusGrid?.addEventListener("click", handleSyllabusClick);
      el.materialCycle.addEventListener("change", () => populateSubjectSelect(el.materialCycle.value));
      el.materialUrl?.addEventListener("input", validateMaterialUrlField);
      el.materialUrl?.addEventListener("blur", validateMaterialUrlField);
      el.materialForm.addEventListener("submit", submitMaterial);
      document.querySelectorAll("[data-close-modal]").forEach((node) => node.addEventListener("click", closeMaterialModal));

      el.bancoFilterCiclo.addEventListener("change", () => {
        el.bancoSubjectChips.dataset.subject = "all";
        if (el.bancoFilterCiclo.value) {
          el.bancoSubjectChips.dataset.cycle = el.bancoFilterCiclo.value;
        } else {
          delete el.bancoSubjectChips.dataset.cycle;
        }
        renderBanco();
      });
      el.bancoFilterTipo.addEventListener("change", renderBanco);
      el.bancoSubjectChips?.addEventListener("click", handleBancoSubjectChipClick);
      el.bancoTableBody.addEventListener("click", handleBancoClick);
      el.gpaCycle?.addEventListener("change", () => { populateGpaSubjects(); renderGpaRows(); });
      el.gpaSubject?.addEventListener("change", renderGpaRows);
      el.calculateGpa?.addEventListener("click", calculateGpa);
      el.gpaRows?.addEventListener("input", saveGradebookFromInputs);
      el.scheduleCycle?.addEventListener("change", () => { populateScheduleSubjects(); renderSchedule(); });
      el.scheduleGroup?.addEventListener("change", renderSchedule);
      el.addStudentSchedule?.addEventListener("click", addStudentSchedule);
      el.printToolsButton?.addEventListener("click", printScheduleCalendar);
      el.scheduleTableWrap?.addEventListener("click", handleScheduleClick);
      el.pomodoroStart?.addEventListener("click", startPomodoro);
      el.pomodoroPause?.addEventListener("click", pausePomodoro);
      el.pomodoroReset?.addEventListener("click", resetPomodoro);
      el.pomodoroMode?.addEventListener("change", resetPomodoro);
      el.pomodoroStudy?.addEventListener("change", resetPomodoro);
      el.pomodoroBreak?.addEventListener("change", resetPomodoro);
      el.formulaSubject?.addEventListener("change", () => { formulaVisibleCount = 4; renderFormulaBank(); });
      el.dataSourceSearch?.addEventListener("input", () => {
        dataSourcePage = 0;
        renderEconomicDataSources();
      });
      el.dataSourceFilters?.addEventListener("click", (event) => {
        const filterButton = event.target.closest("[data-data-source-filter]");
        if (!filterButton) return;
        dataSourceFilter = filterButton.dataset.dataSourceFilter || "Todas";
        dataSourcePage = 0;
        renderEconomicDataSources();
      });
      document.addEventListener("click", (event) => {
        if (event.target.closest("[data-open-admin-config]")) { adminTab = "config"; openAdminPanel(); return; }
        if (event.target.closest("[data-syllabus-page]")) return handleSyllabusPagerClick(event);
        if (event.target.closest("[data-data-source-page]")) return handleDataSourcePagerClick(event);
      });
      el.aiAskButton?.addEventListener("click", answerMiniAiQuestion);
      el.aiQuestion?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); answerMiniAiQuestion(); }
      });
      el.aiAddSource?.addEventListener("click", addMiniAiSource);
      document.querySelectorAll("[data-ai-prompt]").forEach((button) => button.addEventListener("click", () => {
        if (el.aiQuestion) el.aiQuestion.value = button.dataset.aiPrompt || "";
        answerMiniAiQuestion();
      }));
      el.generateStudyPlan?.addEventListener("click", generateStudyPlan);
      el.examSimCycle?.addEventListener("change", () => populateExamSimulatorSubjects());
      el.startExamSim?.addEventListener("click", startExamSimulator);
      el.examSimResult?.addEventListener("click", handleExamSimulatorClick);
      el.curriculumGrid?.addEventListener("change", handleCurriculumChange);
      el.consultaForm.addEventListener("submit", submitConsulta);
      document.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));

      el.adminOpenButton.addEventListener("click", openAdminLogin);
      el.adminLogoutButton.addEventListener("click", logoutAdmin);
      el.adminLoginForm.addEventListener("submit", submitAdminLogin);
      document.querySelectorAll("[data-close-login]").forEach((node) => node.addEventListener("click", closeAdminLogin));
      document.querySelectorAll("[data-close-admin]").forEach((node) => node.addEventListener("click", closeAdminPanel));
      ["click", "keydown", "scroll", "mousemove"].forEach((eventName) => {
        document.addEventListener(eventName, touchAdminSession, { passive: true });
      });
      window.addEventListener("resize", () => {
        closeAllNavGroups();
        updateNavIndicator();
      });
    }

    function handleGlobalKeydown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
        return;
      }
      if (event.key === "Escape") {
        closeAllNavGroups();
        closeServicesPanel();
        closeProfilePanel();
        closeCommandPalette();
        closeApp();
      }
    }

    function showToast(title, message = "", type = "success") {
      if (!el.toastContainer) return;
      const toastTypes = ["success", "error", "info", "warning"];
      if (toastTypes.includes(message)) {
        const userTitle = type && !toastTypes.includes(type) ? type : "";
        type = message;
        message = title;
        title = userTitle || (type === "error" ? "Error" : type === "info" ? "Información" : type === "warning" ? "Atención" : "Listo");
      }
      const toast = document.createElement("div");
      toast.className = `toast ${type}`;
      const icon = type === "error" ? "!" : type === "warning" ? "i" : type === "info" ? "i" : "✓";
      toast.innerHTML = DOMPurify.sanitize(`<div><span class="toast-icon">${icon}</span><strong>${escapeHtml(title)}</strong>${message ? `<p>${escapeHtml(message)}</p>` : ""}</div><button type="button" aria-label="Cerrar notificación">×</button><span class="toast-progress"></span>`);
      const removeToast = () => {
        toast.classList.add("is-leaving");
        setTimeout(() => toast.remove(), 220);
      };
      toast.querySelector("button").addEventListener("click", removeToast);
      el.toastContainer.appendChild(toast);
      setTimeout(removeToast, 4000);
    }

    function confirmAction(title = "Confirmar acción", message = "¿Deseas continuar?", options = {}) {
      const config = typeof title === "object" ? title : { title, message, ...options };
      const confirmText = config.confirmText || "Confirmar";
      const cancelText = config.cancelText || "Cancelar";
      const danger = config.danger !== false;
      return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "confirm-modal";
        overlay.innerHTML = DOMPurify.sanitize(`
          <div class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmMessage">
            <span class="section-tag">${danger ? "Acción sensible" : "Confirmación"}</span>
            <h2 id="confirmTitle">${escapeHtml(config.title || "Confirmar acción")}</h2>
            <p id="confirmMessage">${escapeHtml(config.message || "¿Deseas continuar?")}</p>
            <div class="modal-actions">
              <button class="btn-secondary" type="button" data-confirm-cancel>${escapeHtml(cancelText)}</button>
              <button class="${danger ? "btn-danger" : "btn-primary"}" type="button" data-confirm-ok>${escapeHtml(confirmText)}</button>
            </div>
          </div>
        `);
        const previousFocus = document.activeElement;
        const cleanup = (value) => {
          document.removeEventListener("keydown", onKeydown);
          overlay.remove();
          if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
          resolve(value);
        };
        const onKeydown = (event) => {
          if (event.key === "Escape") cleanup(false);
          if (event.key === "Tab") {
            const focusable = [...overlay.querySelectorAll("button")];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        };
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay || event.target.closest("[data-confirm-cancel]")) cleanup(false);
          if (event.target.closest("[data-confirm-ok]")) cleanup(true);
        });
        document.addEventListener("keydown", onKeydown);
        document.body.appendChild(overlay);
        overlay.querySelector("[data-confirm-ok]")?.focus();
      });
    }

    function openCommandPalette() {
      if (!el.commandPalette) return;
      el.commandPalette.hidden = false;
      el.commandInput.value = "";
      renderCommandResults();
      setTimeout(() => el.commandInput.focus(), 30);
    }

    function closeCommandPalette() {
      if (el.commandPalette) el.commandPalette.hidden = true;
    }

    function buildCommandItems() {
      const sectionItems = [
        ["Inicio", "Panel principal y accesos rápidos", "inicio"],
        ["Carrera", "Información oficial y videos introductorios", "carrera"],
        ["Repositorio Académico", "Material por ciclos, materias y categorías", "repositorio"],
        ["Malla y sílabos", "Malla de Administración de Empresas y acceso a información académica oficial", "silabos"],
        ["Herramientas", "Calculadora, IA, fórmulas, fuentes de datos, horario, Pomodoro y malla", "herramientas"],
        ["Banco de Exámenes", "Exámenes por ciclo y materia", "banco"],
        ["Tutorías", "Clases de apoyo por materia", "tutorias"],
        ["Consultas", "Enviar dudas o solicitudes académicas", "consultas"],
        ["Docentes", "Directorio y horas de consulta", "docentes"],
        ["Oportunidades", "Becas, convocatorias y pasantías", "oportunidades"],
        ["Representantes", "Tu directiva y representación estudiantil", "representantes"],
        ["Información", "Trámites, horarios y enlaces universitarios", "informacion"],
        ["Merch", "Productos de la asociación", "merch"],
        ["Introductorio", "Clases y acompañamiento para empezar", "introductorio"],
        ["Recursos rápidos", "Servicios y actividades para estudiantes", "recursos"]
      ].map(([title, subtitle, section]) => ({ title, subtitle, section, action: "section", group: "Secciones" })).filter(item => isSectionEnabled(item.section));
      const cycleItems = CYCLES.map((cycle) => ({
        title: cycle.name,
        subtitle: `${cycle.subjects.length} materias · abrir carpeta del ciclo`,
        section: "repositorio",
        action: "cycle",
        group: "Ciclos",
        cycleId: cycle.id
      }));
      const subjectItems = SUBJECTS.map((subject) => ({
        title: subject.name,
        subtitle: `${subject.cycleName} · materia de la malla`,
        section: "repositorio",
        action: "subject",
        group: "Materias",
        cycleId: subject.cycleId,
        subjectId: subject.id
      }));
      const resourceItems = visibleResources().map((item) => ({
        title: item.title,
        subtitle: `${findCycle(item.cycleId)?.name || ""} · ${subjectName(item.cycleId, item.subjectId)} · ${categoryLabel(item.typeId)}`,
        section: "repositorio",
        action: "resource",
        group: "Repositorio",
        cycleId: item.cycleId,
        subjectId: item.subjectId,
        typeId: item.typeId
      }));
      const examItems = visibleResources().filter((item) => item.typeId === "examenes").map((item) => ({
        title: item.title,
        subtitle: `${subjectName(item.cycleId, item.subjectId)} · examen disponible`,
        section: "banco",
        action: "exam",
        group: "Exámenes",
        cycleId: item.cycleId,
        subjectId: item.subjectId,
        typeId: item.typeId
      }));
      const formulaItems = formulaBankRows().map((item) => ({
        title: `${item.materia}: ${item.tema}`,
        subtitle: `${item.ciclo} · ${item.tipo || "Fórmula"} · ${item.valor}`,
        section: "herramientas",
        action: "tool",
        toolTab: "toolFormulas",
        group: "Fórmulas"
      }));
      const dataSourceItems = BUSINESS_DATA_SOURCES.map((source) => ({
        title: source.name,
        subtitle: `${source.categories.join(", ")} · ${source.type}`,
        section: "herramientas",
        action: "tool",
        toolTab: "toolDataSources",
        group: "Fuentes de datos"
      }));
      const toolItems = Object.entries(TOOL_TABS).map(([toolTab, meta]) => ({
        title: meta.title,
        subtitle: `${meta.pill} · ${meta.description}`,
        section: "herramientas",
        action: "tool",
        toolTab,
        group: "Herramientas"
      }));
      const appItems = [
        ["Glosario de administración", "Definiciones, fórmulas y ejemplos", "glossary"],
        ["Historia y evolución de la administración", "Enfoques y autores de la administración", "timeline"],
        ["Bibliografía APA", "Generador de referencias académicas", "apa"],
        ["Rastreador de tareas", "Pendientes académicos y fechas", "tasks"]
      ].map(([title, subtitle, appId]) => ({ title, subtitle, section: "herramientas", action: "app", appId, group: "Mini apps" }));
      const docenteItems = (appData.docentes || []).map((item) => ({ title: item.nombre, subtitle: `${item.materia} · ${item.email}`, section: "docentes", action: "section", group: "Docentes" }));
      const opportunityItems = (appData.oportunidades || []).map((item) => ({ title: item.titulo, subtitle: `${item.tipo} · ${item.institucion}`, section: "oportunidades", action: "section", group: "Oportunidades" }));
      return [...sectionItems, ...toolItems, ...cycleItems, ...subjectItems, ...formulaItems, ...dataSourceItems, ...examItems, ...resourceItems, ...docenteItems, ...opportunityItems, ...appItems];
    }

    function renderCommandResults() {
      if (!el.commandResults) return;
      const rawQuery = el.commandInput?.value || "";
      const query = normalize(rawQuery);
      commandResultsCache = buildCommandItems()
        .filter((item) => !query || normalize(`${item.title} ${item.subtitle} ${item.group || ""}`).includes(query))
        .slice(0, 28);
      el.commandResults.innerHTML = DOMPurify.sanitize(commandResultsCache.length
        ? commandResultsCache.map((item, index, list) => `${index === 0 || list[index - 1].group !== item.group ? `<div class="command-group-title">${escapeHtml(item.group || "Resultados")}</div>` : ""}<button class="command-result" type="button" data-command-index="${index}" aria-label="Abrir ${escapeAttribute(item.title)}"><span class="result-chip">${escapeHtml(item.group || "Resultado")}</span><strong>${highlightText(item.title, rawQuery)}</strong><span>${highlightText(item.subtitle, rawQuery)}</span></button>`).join("")
        : renderEmpty("Sin resultados", "Prueba con otra materia, fórmula, fuente de datos, examen, docente, evento o herramienta."));
    }

    function handleCommandClick(event) {
      const button = event.target.closest("[data-command-index]");
      if (!button) return;
      const item = commandResultsCache[Number(button.dataset.commandIndex)];
      if (!item) return;
      closeCommandPalette();
      if (item.action === "app") return openApp(item.appId);
      if (item.action === "tool") {
        showSection("herramientas", true);
        activateToolTab(item.toolTab, true);
        return;
      }
      if (item.action === "cycle") {
        repoState = { ...repoState, view: "subjects", cycleId: item.cycleId, subjectId: null, cycleFilter: item.cycleId, typeFilter: "all" };
        showSection("repositorio", true);
        return;
      }
      if (item.action === "subject" || item.action === "resource" || item.action === "exam") {
        repoState = { ...repoState, view: "subject", cycleId: item.cycleId, subjectId: item.subjectId, cycleFilter: item.cycleId, typeFilter: item.typeId || "all" };
        if (item.action === "exam") {
          if (el.bancoFilterCiclo) el.bancoFilterCiclo.value = item.cycleId || "";
          if (el.bancoFilterTipo) el.bancoFilterTipo.value = "examenes";
        }
      }
      showSection(item.section, true);
    }

    function showSection(sectionId, updateHash) {
      const safeId = sectionId && (isSectionEnabled(sectionId) || ["inicio", "gracias"].includes(sectionId)) ? sectionId : "inicio";
      document.querySelectorAll("[data-section]").forEach((section) => section.classList.toggle("active", section.dataset.section === safeId));
      document.querySelectorAll("[data-tab]").forEach((link) => link.classList.toggle("active", link.dataset.tab === safeId));
      updateNavGroupActive(safeId);
      if (updateHash) history.pushState(null, "", "#" + safeId);
      renderSection(safeId);
      if (safeId === "inicio") {
        updateHeroClock();
        scheduleEconomicNewsLoad();
        scheduleEconomicIndicatorLoad();
      }
      requestAnimationFrame(updateNavIndicator);
    }

    function isSectionEnabled(sectionId) {
      if (!SECTIONS.includes(sectionId) && sectionId !== "gracias") return false;
      if (["inicio", "gracias", "informacion"].includes(sectionId)) return true;
      return (appData.settings.enabledSections || {})[sectionId] !== false;
    }

    function openServicesPanel() {
      if (!el.servicesPanel || !el.servicesBackdrop) return;
      setMobileMenuOpen(false);
      el.servicesBackdrop.hidden = false;
      el.servicesPanel.hidden = false;
      el.servicesBackdrop.classList.add("open");
      el.servicesPanel.classList.add("open");
    }

    function closeServicesPanel() {
      if (!el.servicesPanel || el.servicesPanel.hidden) return;
      el.servicesBackdrop.classList.remove("open");
      el.servicesPanel.classList.remove("open");
      if (motionBehavior() === "auto") { el.servicesBackdrop.hidden = true; el.servicesPanel.hidden = true; return; }
      setTimeout(() => {
        if (!el.servicesPanel.classList.contains("open")) {
          el.servicesBackdrop.hidden = true;
          el.servicesPanel.hidden = true;
        }
      }, 220);
    }

    function openProfilePanel() {
      if (!el.profilePanel || !el.profileBackdrop) return;
      setMobileMenuOpen(false);
      fillProfileForm();
      renderProfileSummary();
      el.profileBackdrop.hidden = false;
      el.profilePanel.hidden = false;
      el.profileBackdrop.classList.add("open");
      el.profilePanel.classList.add("open");
    }

    function closeProfilePanel() {
      if (!el.profilePanel || el.profilePanel.hidden) return;
      el.profileBackdrop.classList.remove("open");
      el.profilePanel.classList.remove("open");
      if (motionBehavior() === "auto") { el.profileBackdrop.hidden = true; el.profilePanel.hidden = true; return; }
      setTimeout(() => {
        if (!el.profilePanel.classList.contains("open")) {
          el.profileBackdrop.hidden = true;
          el.profilePanel.hidden = true;
        }
      }, 220);
    }

    function fillProfileForm() {
      if (!el.profileForm) return;
      el.profileName.value = studentProfile.name || "";
      el.profileEmail.value = studentProfile.email || "";
      el.profileCycle.value = studentProfile.cycle || "";
    }

    function submitProfile(event) {
      event.preventDefault();
      studentProfile = {
        name: el.profileName.value.trim(),
        email: el.profileEmail.value.trim(),
        cycle: el.profileCycle.value
      };
      studentStorage.setItem(PROFILE_KEY, JSON.stringify(studentProfile));
      prefillKnownForms();
      renderProfileSummary();
      showToast("Perfil guardado", "Tus datos se usarán para prellenar formularios.", "success");
    }

    function prefillKnownForms() {
      if (!studentProfile || !studentProfile.name) return;
      const pairs = [
        ["consultaNombre", "name"], ["consultaEmail", "email"], ["consultaCiclo", "cycle"],
        ["requestName", "name"], ["requestEmail", "email"], ["requestCycle", "cycle"],
        ["bookName", "name"], ["bookEmail", "email"], ["bookCycle", "cycle"]
      ];
      pairs.forEach(([id, key]) => {
        const node = document.getElementById(id);
        if (node && studentProfile[key] && !node.value) node.value = studentProfile[key];
      });
    }

    function renderProfileSummary() {
      if (!el.profileSummary) return;
      const approved = AdeCurriculum.summarize(SUBJECTS, appData.curriculumStatus).approved;
      const progress = countSubjects() ? Math.round((approved / countSubjects()) * 100) : 0;
      const firstName = String(studentProfile.name || "").split(/\s+/).filter(Boolean)[0] || "estudiante";
      const cycle = findCycle(studentProfile.cycle);
      const requests = (appData.messages || []).filter((message) => {
        const sameEmail = studentProfile.email && message.email === studentProfile.email;
        const sameName = studentProfile.name && normalize(message.name) === normalize(studentProfile.name);
        return sameEmail || sameName;
      }).slice(0, 5);
      const favorites = visibleResources().filter((item) => favoriteIds.includes(item.id)).slice(0, 4);
      const nextClass = getNextClass();
      const activity = loadJson(STUDY_ACTIVITY_KEY, {});
      el.profileSummary.innerHTML = DOMPurify.sanitize(`<h3>Bienvenido, ${escapeHtml(firstName)}</h3><p class="profile-muted">${escapeHtml(cycle?.name || "Configura tu ciclo actual para personalizar el portal.")}</p><div class="profile-stats"><div class="profile-stat"><strong>${favoriteIds.length}</strong><span>Favoritos</span></div><div class="profile-stat"><strong>${pomodoroSessions}</strong><span>Pomodoros</span></div><div class="profile-stat"><strong>${progress}%</strong><span>Malla aprobada</span></div><div class="profile-stat"><strong>${requests.length}</strong><span>Solicitudes</span></div></div><div class="profile-section"><h4>Seguir estudiando</h4>${activity.lastResourceTitle || activity.lastPractice ? `<ul>${activity.lastSubjectName ? `<li>Última materia vista <small>${escapeHtml(activity.lastSubjectName)}</small></li>` : ""}${activity.lastResourceTitle ? `<li>Último recurso abierto <small>${escapeHtml(activity.lastResourceTitle)}</small></li>` : ""}${activity.lastPractice ? `<li>Última práctica <small>${escapeHtml(activity.lastPractice)}</small></li>` : ""}</ul>` : `<p>Aún no hay actividad reciente. Abre un material o realiza un simulador para ver tu progreso aquí.</p>`}</div><div class="profile-section"><h4>Accesos sugeridos</h4><div class="quick-row"><button class="btn-secondary" type="button" data-profile-tab="repositorio">Repositorio de ${escapeHtml(cycle?.name || "tu ciclo")}</button><button class="btn-secondary" type="button" data-profile-tab="herramientas">Herramientas</button><button class="btn-secondary" type="button" data-profile-tab="banco">Banco</button></div></div><div class="profile-section"><h4>Próximo horario</h4><p>${escapeHtml(nextClass.subject)} · ${escapeHtml(nextClass.day || "Sin día")} ${escapeHtml(nextClass.start || "")}</p></div><div class="profile-section"><h4>Materiales favoritos</h4>${favorites.length ? `<ul>${favorites.map((item) => `<li>${escapeHtml(item.title)} <small>${escapeHtml(subjectName(item.cycleId, item.subjectId))}</small></li>`).join("")}</ul>` : `<p>Aún no tienes favoritos. Marca materiales con la estrella.</p>`}</div><div class="profile-section"><h4>Historial de solicitudes</h4>${requests.length ? `<ul>${requests.map((item) => `<li><strong>${escapeHtml(item.trackingCode || item.id)}</strong> · ${escapeHtml(item.type)} · ${escapeHtml(item.status || "pendiente")}${item.respuesta ? `<small>Respuesta: ${escapeHtml(item.respuesta)}</small>` : ""}</li>`).join("")}</ul>` : `<p>No hay solicitudes asociadas a tu perfil.</p>`}</div>`);
      el.profileSummary.querySelectorAll("[data-profile-tab]").forEach((button) => button.addEventListener("click", () => {
        closeProfilePanel();
        showSection(button.dataset.profileTab, true);
      }));
    }

    function handleServiceFocus(targetId) {
      if (!targetId) return;
      const isToolPanel = Boolean(TOOL_TABS[targetId]);
      if (isToolPanel) activateToolTab(targetId, false);
      const scrollTarget = isToolPanel ? "toolsWorkspace" : targetId;
      setTimeout(() => document.getElementById(scrollTarget)?.scrollIntoView({ behavior: motionBehavior(), block: "start" }), 90);
    }

    function activateToolTab(targetId, shouldScroll = false) {
      const panelId = TOOL_TABS[targetId] ? targetId : "toolCalculadora";
      activeToolPanelId = panelId;
      try {
        const recent = loadJson('ade-recent-tools', []);
        studentStorage.setItem('ade-recent-tools', JSON.stringify([panelId, ...(Array.isArray(recent) ? recent : []).filter(id => id !== panelId)].slice(0, 4)));
      } catch {}
      const meta = TOOL_TABS[panelId];
      document.querySelectorAll("[data-tool-panel]").forEach((panel) => {
        const active = panel.dataset.toolPanel === panelId;
        panel.classList.toggle("active", active);
        panel.setAttribute("aria-hidden", active ? "false" : "true");
      });
      document.querySelectorAll("[data-tool-tab]").forEach((button) => {
        const active = button.dataset.toolTab === panelId;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });
      const title = document.getElementById("toolsActiveTitle");
      const description = document.getElementById("toolsActiveDescription");
      const pill = document.getElementById("toolsActivePill");
      if (title) title.textContent = meta.title;
      if (description) description.textContent = meta.description;
      if (pill) pill.textContent = meta.pill;
      if (panelId === "toolFormulas") loadFormulaBankData();
      if (shouldScroll) setTimeout(() => document.getElementById("toolsWorkspace")?.scrollIntoView({ behavior: motionBehavior(), block: "start" }), 80);
    }

    function applyDarkMode() {
      const stored = studentStorage.getItem(THEME_KEY);
      const mode = ['light', 'dark', 'auto'].includes(stored) ? stored : studentStorage.getItem('portal_dark_mode') === 'true' ? 'dark' : 'auto';
      const enabled = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.body.classList.toggle('dark-mode', enabled);
      document.body.dataset.theme = mode;
      const label = {light:'Tema claro · cambiar a oscuro', dark:'Tema oscuro · cambiar a automático', auto:'Tema automático · cambiar a claro'}[mode];
      for (const button of [el.darkModeToggle, document.getElementById('mobileDarkModeToggle')]) {
        if (!button) continue;
        button.innerHTML = DOMPurify.sanitize(interfaceIcon(mode === 'auto' ? 'auto' : enabled ? 'moon' : 'sun') + '<span>' + label + '</span>');
        button.setAttribute('aria-label', label);
        button.title = label;
      }
    }

    function toggleDarkMode() {
      const current = document.body.dataset.theme || 'auto';
      studentStorage.setItem(THEME_KEY, {auto:'light', light:'dark', dark:'auto'}[current]);
      applyDarkMode();
    }

    function updateBackToTopButton() {
      el.backToTopButton?.classList.toggle("show", window.scrollY > 640);
    }

    function updateNavGroupActive(sectionId) {
      document.querySelectorAll("[data-nav-group]").forEach((group) => {
        const hasActive = Boolean(group.querySelector(`[data-tab="${sectionId}"]`));
        group.classList.toggle("active", hasActive);
      });
      syncNavDropdownAria();
    }

    function isDesktopNav() {
      return window.matchMedia("(min-width: 1025px)").matches;
    }

    function closeAllNavGroups(exceptGroup = null) {
      document.querySelectorAll("[data-nav-group].open").forEach((group) => {
        if (group !== exceptGroup) group.classList.remove("open");
      });
      syncNavDropdownAria();
    }

    function clearDismissedDropdowns(exceptGroup = null) {
      document.querySelectorAll("[data-nav-group].dropdown-dismissed").forEach((group) => {
        if (group !== exceptGroup) group.classList.remove("dropdown-dismissed");
      });
    }

    function dismissNavDropdown(group) {
      if (!group) return;
      group.classList.remove("open");
      group.classList.add("dropdown-dismissed");
      const active = document.activeElement;
      if (active && group.contains(active) && typeof active.blur === "function") active.blur();
      syncNavDropdownAria();
    }

    function openNavGroup(group) {
      if (!group || !isDesktopNav()) return;
      if (group.classList.contains("dropdown-dismissed")) return;
      clearDismissedDropdowns(group);
      closeAllNavGroups(group);
      group.classList.add("open");
      syncNavDropdownAria();
    }

    function closeNavGroup(group) {
      if (!group || !isDesktopNav()) return;
      group.classList.remove("open");
      syncNavDropdownAria();
    }

    function bindNavHoverIntent() {
      document.querySelectorAll("[data-nav-group]").forEach((group) => {
        let closeTimer = 0;
        const open = () => {
          if (!isDesktopNav()) return;
          if (group.classList.contains("dropdown-dismissed")) return;
          window.clearTimeout(closeTimer);
          openNavGroup(group);
        };
        const scheduleClose = () => {
          if (!isDesktopNav()) return;
          window.clearTimeout(closeTimer);
          closeTimer = window.setTimeout(() => closeNavGroup(group), 120);
        };
        group.addEventListener("pointerenter", open);
        group.addEventListener("pointerleave", () => {
          group.classList.remove("dropdown-dismissed");
          scheduleClose();
        });
        group.addEventListener("focusin", open);
        group.addEventListener("focusout", (event) => {
          if (!group.contains(event.relatedTarget)) scheduleClose();
        });
      });
    }

    function setMobileMenuOpen(open) {
      if (!el.navLinks || !el.hamburgerButton) return;
      el.navLinks.classList.toggle("open", Boolean(open));
      el.hamburgerButton.classList.toggle("active", Boolean(open));
      el.hamburgerButton.setAttribute("aria-expanded", open ? "true" : "false");
      el.hamburgerButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("mobile-nav-open", Boolean(open));
      if (!open) {
        closeAllNavGroups();
      }
    }

    function syncNavDropdownAria() {
      document.querySelectorAll("[data-nav-group]").forEach((group) => {
        const toggle = group.querySelector("[data-nav-accordion]");
        if (!toggle) return;
        toggle.setAttribute("aria-expanded", group.classList.contains("open") ? "true" : "false");
      });
    }

    function updateNavIndicator() {
      if (!el.navLinks || !isDesktopNav()) return;
      const active = el.navLinks.querySelector(":scope > a[data-tab].active, :scope > .nav-group.active > .nav-menu-toggle");
      if (!active) {
        el.navLinks.style.setProperty("--nav-indicator-opacity", "0");
        return;
      }
      const navRect = el.navLinks.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      el.navLinks.style.setProperty("--nav-indicator-left", `${activeRect.left - navRect.left}px`);
      el.navLinks.style.setProperty("--nav-indicator-width", `${activeRect.width}px`);
      el.navLinks.style.setProperty("--nav-indicator-opacity", "1");
    }

    function getInitialSection() {
      return (location.hash || "#inicio").replace("#", "");
    }

    function populateSelects() {
      const cycleOptions = ['<option value="all">Todos los ciclos</option>', ...CYCLES.map((cycle) => `<option value="${cycle.id}">${cycle.name}</option>`)].join("");
      const modalCycleOptions = ['<option value="">Seleccionar ciclo</option>', ...CYCLES.map((cycle) => `<option value="${cycle.id}">${cycle.name}</option>`)].join("");
      const scheduleCycleOptions = SCHEDULE_CYCLES.map((cycle) => `<option value="${cycle.id}">${cycle.name}</option>`).join("");
      const typeOptions = ['<option value="all">Todos los tipos</option>', ...CATEGORIES.map((cat) => `<option value="${cat.id}">${cat.label}</option>`)].join("");
      const modalTypeOptions = ['<option value="">Seleccionar tipo</option>', ...CATEGORIES.map((cat) => `<option value="${cat.id}">${cat.label}</option>`)].join("");
      el.cycleFilter.innerHTML = DOMPurify.sanitize(cycleOptions);
      el.bancoFilterCiclo.innerHTML = DOMPurify.sanitize('<option value="">Todos los ciclos</option>' + CYCLES.map((cycle) => `<option value="${cycle.id}">${cycle.name}</option>`).join(""));
      if (el.gpaCycle) el.gpaCycle.innerHTML = DOMPurify.sanitize(modalCycleOptions);
      if (el.scheduleCycle) el.scheduleCycle.innerHTML = DOMPurify.sanitize(scheduleCycleOptions);
      if (el.profileCycle) el.profileCycle.innerHTML = DOMPurify.sanitize(modalCycleOptions);
      if (el.formulaSubject) el.formulaSubject.innerHTML = DOMPurify.sanitize(subjectOptionsHtml());
      if (el.syllabusCycleFilter) el.syllabusCycleFilter.innerHTML = DOMPurify.sanitize(cycleOptions);
      if (el.studyPlanSubject) el.studyPlanSubject.innerHTML = DOMPurify.sanitize(subjectOptionsHtml());
      if (el.examSimCycle) el.examSimCycle.innerHTML = DOMPurify.sanitize(modalCycleOptions);
      if (el.examSimCycle && !el.examSimCycle.value) el.examSimCycle.value = CYCLES[0]?.id || "";
      populateExamSimulatorSubjects();
      el.typeFilter.innerHTML = DOMPurify.sanitize(typeOptions);
      el.materialCycle.innerHTML = DOMPurify.sanitize(modalCycleOptions);
      el.materialType.innerHTML = DOMPurify.sanitize(modalTypeOptions);
      el.consultaCiclo.innerHTML = DOMPurify.sanitize(modalCycleOptions);
      populateSubjectSelect("");
      populateGpaSubjects();
      populateScheduleSubjects();
      fillProfileForm();
      prefillKnownForms();
    }

    function populateSubjectSelect(cycleId, selectedSubject = "") {
      const cycle = findCycle(cycleId);
      el.materialSubject.disabled = !cycle;
      el.materialSubject.innerHTML = DOMPurify.sanitize(cycle ? '<option value="">Seleccionar materia</option>' + cycle.subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("") : '<option value="">Selecciona primero un ciclo</option>');
      el.materialSubject.value = selectedSubject;
    }

    function renderAll() {
      syncAdminMode();
      renderSection("inicio", true);
      renderSection("herramientas", true);
      const activeSection = document.querySelector("[data-section].active")?.dataset.section || getInitialSection();
      if (!EAGER_RENDER_SECTIONS.has(activeSection)) renderSection(activeSection, true);
      renderNotifications();
      renderProfileSummary();
      updateTaskBadge();
      applySectionVisibility();
      ensureLazyIframes();
    }

    function ensureLazyIframes(root = document) {
      root.querySelectorAll?.("iframe").forEach((frame) => {
        if (!frame.hasAttribute("loading")) frame.setAttribute("loading", "lazy");
        if (!frame.hasAttribute("referrerpolicy")) frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      });
    }

    function renderSection(sectionId, force = false) {
      if (!force && renderedSections[sectionId] && !EAGER_RENDER_SECTIONS.has(sectionId)) return;
      const renderers = {
        inicio: renderHome,
        carrera: renderCarrera,
        repositorio: () => { renderPhysicalBooks(); renderRepository(); },
        silabos: renderSyllabiSection,
        tutorias: renderTutorias,
        introductorio: renderIntroClasses,
        merch: renderMerch,
        herramientas: renderTools,
        banco: renderBanco,
        consultas: renderFAQ,
        docentes: renderDocentes,
        recursos: renderRecursos,
        oportunidades: renderOportunidades,
        representantes: renderRepresentantes,
        gracias: renderGracias
      };
      const renderer = renderers[sectionId];
      if (renderer) renderer();
      renderedSections[sectionId] = true;
      ensureLazyIframes(document.querySelector(`[data-section="${sectionId}"]`) || document);
    }

    function invalidateRenderedSections(sections = SECTIONS) {
      sections.forEach((section) => {
        if (!EAGER_RENDER_SECTIONS.has(section)) renderedSections[section] = false;
      });
    }

    function renderHome() {
      // While an administrator previews an unpublished draft, the home shows it instead of the saved text.
      const settings = homePreviewSettings || appData.settings;
      el.welcomeText.textContent = settings.welcome;
      const heroTitle=document.getElementById('heroTitle');
      heroTitle.textContent = settings.heroTitle || defaultData.settings.heroTitle;
      heroTitle.hidden = false;
      el.missionText.textContent = settings.mission;
      el.visionText.textContent = settings.vision;
      if (el.kitVideoFrame) {
        el.kitVideoFrame.loading = "lazy";
        el.kitVideoFrame.src = normalizeYouTubeEmbed(appData.settings.kitVideo || "https://www.youtube.com/watch?v=NU52K6NRXbA");
      }
      animateCounter(el.subjectCounter, countSubjects());
      animateCounter(el.heroMaterialCounter, visibleResources().length);
      animateCounter(el.favoriteCounter, favoriteIds.length);
      el.favoriteCounter?.closest(".metric-card")?.setAttribute("data-open-favorites", "hero");
      el.favoriteCounter?.closest(".metric-card")?.setAttribute("role", "button");
      el.favoriteCounter?.closest(".metric-card")?.setAttribute("tabindex", "0");
      renderAcademicCurve();
      renderEconomicIndicators();
      renderSemesterWidget();
      renderNextClassWidget();
      renderMostUsed();
      renderDashboardWidgets();
      if (el.homeQuickLinks) el.homeQuickLinks.innerHTML = DOMPurify.sanitize([
        ["Repositorio", "repositorio"], ["Herramientas", "herramientas"], ["Tutorías", "tutorias"], ["Consultas", "consultas"]
      ].map(([label, target]) => `<a class="btn-ghost" href="#${target}" data-tab="${target}">${label}</a>`).join(""));
      if (el.homeOpportunities) el.homeOpportunities.innerHTML = DOMPurify.sanitize(latest(appData.oportunidades.filter(item=>!item.hidden), "fecha", 2).map(renderCompactOpportunity).join("") || renderEmpty("Nuevas oportunidades, pronto", "Aquí aparecerán las próximas convocatorias de ASO ADE."));
      el.homeQuickLinks?.querySelectorAll("[data-tab]").forEach((node) => node.addEventListener("click", (event) => {
        event.preventDefault();
        showSection(node.dataset.tab, true);
      }));
      const favoriteMetric = el.favoriteCounter?.closest(".metric-card");
      if (favoriteMetric) {
        favoriteMetric.onclick = openFavoritesFromHero;
        favoriteMetric.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") openFavoritesFromHero(event);
        };
      }
      renderRecentTools();
      applyHomePresentation(settings);
      bindHomeDynamicActions();
    }

    function renderDashboardWidgets() {
      const activity = loadJson(STUDY_ACTIVITY_KEY, {});
      const profileCycle = findCycle(studentProfile.cycle);
      const recentMaterials = latest(visibleResources(), "date", 3);
      const recommendedCycle = profileCycle || CYCLES[0];
      const recommendedMaterials = visibleResources()
        .filter((item) => item.cycleId === recommendedCycle.id)
        .slice(0, 2);
      if (el.continueWidget) {
        const hasActivity = activity.lastResourceTitle || activity.lastPractice || activity.lastSubjectName;
        el.continueWidget.innerHTML = DOMPurify.sanitize(`
          <span class="widget-label">Continuar</span>
          <h3>${hasActivity ? escapeHtml(activity.lastSubjectName || "Tu última actividad") : "Empieza por tu ciclo"}</h3>
          <p>${hasActivity ? escapeHtml(activity.lastResourceTitle || activity.lastPractice || "Retoma desde donde lo dejaste.") : "Guarda tu perfil para recibir accesos más útiles."}</p>
          <button class="btn-secondary" type="button" ${hasActivity ? 'data-dashboard-tab="repositorio"' : 'data-dashboard-profile'}>${hasActivity ? "Seguir estudiando" : "Configurar ahora"}</button>`);
      }
      if (el.recommendedWidget) {
        el.recommendedWidget.innerHTML = DOMPurify.sanitize(`
          <span class="widget-label">Recomendado</span>
          <h3>${escapeHtml(recommendedCycle.name)}</h3>
          <p>${recommendedMaterials.length ? `${recommendedMaterials.length} recursos listos para revisar.` : "Explora materias, apuntes y exámenes de este ciclo."}</p>
          <button class="btn-secondary" type="button" data-dashboard-cycle="${recommendedCycle.id}">Abrir ciclo</button>`);
      }
      if (el.homeRecentMaterials) {
        el.homeRecentMaterials.innerHTML = DOMPurify.sanitize(recentMaterials.length
          ? recentMaterials.map((item) => `
            <button class="dashboard-list-item" type="button" data-open-recent-material="${item.id}">
              <span>${resourceKindLabel(item)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(subjectName(item.cycleId, item.subjectId))} · ${formatDate(item.date)}</small>
            </button>`).join("")
          : `<div class="empty-state repository-empty compact-empty"><div><strong>No hay materiales recientes</strong><span>Cuando el administrador publique recursos nuevos aparecerán aquí.</span><div class="inline-actions empty-actions"><button class="btn-secondary" type="button" data-dashboard-tab="repositorio">Ver repositorio</button></div></div></div>`);
      }
      [el.continueWidget, el.recommendedWidget].forEach((container) => {
        container?.querySelectorAll("[data-dashboard-profile]").forEach((button) => button.addEventListener("click", openProfilePanel));
        container?.querySelectorAll("[data-dashboard-tab]").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.dashboardTab, true)));
        container?.querySelectorAll("[data-dashboard-cycle]").forEach((button) => button.addEventListener("click", () => {
          repoState = { ...repoState, view: "subjects", cycleId: button.dataset.dashboardCycle, subjectId: null, cycleFilter: button.dataset.dashboardCycle };
          showSection("repositorio", true);
          renderRepository();
        }));
      });
      el.homeRecentMaterials?.querySelectorAll("[data-open-recent-material]").forEach((button) => button.addEventListener("click", () => {
        const item = appData.resources.find((resource) => resource.id === button.dataset.openRecentMaterial);
        if (!item) return;
        repoState = { ...repoState, view: "subject", cycleId: item.cycleId, subjectId: item.subjectId, typeFilter: item.typeId, cycleFilter: item.cycleId };
        showSection("repositorio", true);
        renderRepository();
      }));
      el.homeRecentMaterials?.querySelectorAll("[data-dashboard-tab]").forEach((button) => button.addEventListener("click", () => showSection(button.dataset.dashboardTab, true)));
    }

    function resourceKindLabel(item) {
      if (item.typeId === "examenes") return "Examen";
      if (["videos", "clases-grabadas"].includes(item.typeId)) return "Video";
      if (/drive\.google|docs\.google/i.test(item.url || "")) return "Drive";
      if (/\.(pdf)(\?|$)/i.test(item.url || "")) return "PDF";
      return categoryLabel(item.typeId);
    }

    // Widget de Inicio: organiza el dashboard por ciclo sin crear nuevas secciones.
    function renderSemesterWidget() {
      if (!el.semesterWidget) return;
      const savedCycleId = studentStorage.getItem(SEMESTER_KEY) || studentProfile.cycle || CYCLES[0].id;
      const cycle = findCycle(savedCycleId) || CYCLES[0];
      const resources = visibleResources().filter((item) => item.cycleId === cycle.id);
      const recent = latest(resources, "date", 3);
      const exams = resources.filter((item) => item.typeId === "examenes").length;
      const subjectNames = cycle.subjects.map((subject) => normalize(subject.name));
      const tutorias = (appData.tutorias || []).filter((item) => subjectNames.some((name) => normalize(item.materia).includes(name) || name.includes(normalize(item.materia)))).slice(0, 3);
      const state = appData.curriculumStatus || {};
      const approved = cycle.subjects.filter((subject) => state[subject.id] === "aprobada").length;
      const inProgress = cycle.subjects.filter((subject) => state[subject.id] === "en-curso").length;
      const progress = cycle.subjects.length ? Math.round((approved / cycle.subjects.length) * 100) : 0;
      el.semesterWidget.innerHTML = DOMPurify.sanitize(`
        <div class="semester-head">
          <div>
            <span class="widget-label">Dashboard académico</span>
            <h2>Mi semestre académico</h2>
            <p>Organiza tus materias, recursos y tutorías según tu ciclo actual.</p>
          </div>
          <label>
            <span>Ciclo</span>
            <select id="semesterCycleSelect" aria-label="Seleccionar ciclo académico">
              ${CYCLES.map((item) => `<option value="${item.id}" ${item.id === cycle.id ? "selected" : ""}>${item.name}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="semester-progress">
          <div><strong>${progress}%</strong><span>${approved} aprobadas · ${inProgress} en curso · ${cycle.subjects.length} materias</span></div>
          <span class="semester-progress-bar" style="--semester-progress:${progress}%"><i></i></span>
        </div>
        <div class="semester-subjects">
          ${cycle.subjects.map((subject) => `<button type="button" data-semester-subject="${subject.id}">${escapeHtml(subject.name)}</button>`).join("")}
        </div>
        <div class="semester-insights">
          <div><strong>${resources.length}</strong><span>Materiales</span></div>
          <div><strong>${exams}</strong><span>Exámenes</span></div>
          <div><strong>${tutorias.length}</strong><span>Tutorías</span></div>
        </div>
        <div class="semester-mini-list">
          <h3>Recientes del ciclo</h3>
          ${recent.length ? recent.map((item) => `<button type="button" data-semester-material="${item.id}"><span>${resourceKindLabel(item)}</span><strong>${escapeHtml(item.title)}</strong></button>`).join("") : `<p>Aún no hay materiales recientes para este ciclo.</p>`}
        </div>
        <div class="semester-mini-list">
          <h3>Tutorías relacionadas</h3>
          ${tutorias.length ? tutorias.map((item) => `<button type="button" data-semester-tutoria="${item.id}"><span>${escapeHtml(item.modalidad || "Tutoría")}</span><strong>${escapeHtml(item.materia)}</strong></button>`).join("") : `<p>No hay tutorías registradas para este ciclo todavía.</p>`}
        </div>
        <div class="semester-actions">
          <button class="btn-primary" type="button" data-semester-open-cycle="${cycle.id}">Ir al repositorio del ciclo</button>
          <button class="btn-secondary" type="button" data-semester-tab="tutorias">Ver tutorías</button>
        </div>`);
      el.semesterWidget.querySelector("#semesterCycleSelect")?.addEventListener("change", (event) => {
        studentStorage.setItem(SEMESTER_KEY, event.target.value);
        renderSemesterWidget();
      });
      el.semesterWidget.querySelectorAll("[data-semester-subject]").forEach((button) => button.addEventListener("click", () => {
        repoState = { ...repoState, view: "subject", cycleId: cycle.id, subjectId: button.dataset.semesterSubject, cycleFilter: cycle.id, typeFilter: "all" };
        showSection("repositorio", true);
        renderRepository();
      }));
      el.semesterWidget.querySelectorAll("[data-semester-material]").forEach((button) => button.addEventListener("click", () => {
        const item = appData.resources.find((resource) => resource.id === button.dataset.semesterMaterial);
        if (!item) return;
        repoState = { ...repoState, view: "subject", cycleId: item.cycleId, subjectId: item.subjectId, typeFilter: item.typeId, cycleFilter: item.cycleId };
        showSection("repositorio", true);
        renderRepository();
      }));
      el.semesterWidget.querySelectorAll("[data-semester-open-cycle]").forEach((button) => button.addEventListener("click", () => {
        repoState = { ...repoState, view: "subjects", cycleId: button.dataset.semesterOpenCycle, subjectId: null, cycleFilter: button.dataset.semesterOpenCycle, typeFilter: "all" };
        showSection("repositorio", true);
        renderRepository();
      }));
      el.semesterWidget.querySelectorAll("[data-semester-tab], [data-semester-tutoria]").forEach((button) => button.addEventListener("click", () => showSection("tutorias", true)));
    }

    function renderMostUsed() {
      if (!el.mostUsedGrid) return;
      const items = [
        { title: "Repositorio", text: "Materiales por ciclo y materia.", section: "repositorio", badge: "Materiales" },
        { title: "Banco de exámenes", text: "Practica con evaluaciones anteriores.", section: "banco", badge: "Práctica" },
        { title: "Pomodoro", text: "Bloques de estudio concentrado.", section: "herramientas", focus: "toolPomodoro", badge: "Concentración" },
        { title: "GPA", text: "Calcula cuánto necesitas para aprobar.", section: "herramientas", focus: "toolCalculadora", badge: "Recomendado" },
        { title: "Malla", text: "Revisa avance real por ciclo.", section: "herramientas", focus: "toolMalla", badge: "Progreso" },
        { title: "Planificación Estratégica", text: "Objetivos, indicadores y decisiones empresariales del cuarto ciclo.", section: "repositorio", badge: "4.º ciclo", special: "planificacion" }
      ];
      el.mostUsedGrid.innerHTML = DOMPurify.sanitize(items.map((item) => `<button class="most-used-card" type="button" data-tab="${item.section}"${item.focus ? ` data-service-focus="${item.focus}"` : ""}${item.special ? ` data-most-used="${item.special}"` : ""}><span>${escapeHtml(item.badge)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.text)}</small></button>`).join(""));
      el.mostUsedGrid.querySelectorAll("[data-tab]").forEach((node) => node.addEventListener("click", () => {
        if (node.dataset.mostUsed === "planificacion") {
          openRepositorySubjectByName("planificacion estrategica");
          return;
        }
        showSection(node.dataset.tab, true);
        handleServiceFocus(node.dataset.serviceFocus);
      }));
    }

    function openFavoritesFromHero(event) {
      event?.preventDefault?.();
      repoState = { ...repoState, view: "favorites", cycleId: null, subjectId: null, search: "" };
      showSection("repositorio", true);
      renderRepository();
    }

    function renderAcademicCurve() {
      const card = document.querySelector(".academic-curve-card");
      if (!card) return;
      const progress = cycleAcademicProgress();
      if (!selectedCurveCycle || !progress.some((item) => item.cycle.id === selectedCurveCycle)) selectedCurveCycle = progress[0]?.cycle.id || "";
      const selected = progress.find((item) => item.cycle.id === selectedCurveCycle) || progress[0];
      const width = 640;
      const height = 180;
      const bottom = 142;
      const top = 32;
      const step = 68;
      const startX = 70;
      const points = progress.map((item, index) => {
        const pct = Math.max(0, Math.min(100, item.percent));
        return {
          ...item,
          x: startX + (index * step),
          y: bottom - ((bottom - top) * pct / 100),
          barHeight: Math.max(10, ((bottom - top) * pct / 100))
        };
      });
      const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
      const maxPoint = points.reduce((best, point) => point.percent > best.percent ? point : best, points[0] || { x: 0, y: 0, percent: 0 });
      const safeSelected = selected || { cycle: { name: "Ciclo" }, approved: 0, inProgress: 0, total: 0, percent: 0 };
      card.innerHTML = DOMPurify.sanitize(`
        <div class="curve-card-header">
          <div>
            <span class="eyebrow">Avance real</span>
            <h3>Progreso académico por ciclo</h3>
          </div>
          <button class="mini-action" type="button" data-tab="herramientas">Actualizar malla</button>
        </div>
        <div class="curve-insight" id="academicCurveSummary">
          <strong>${escapeHtml(safeSelected.cycle.name)} · ${safeSelected.percent}% aprobado</strong>
          <span>${safeSelected.approved} aprobadas, ${safeSelected.inProgress} en curso y ${Math.max(safeSelected.total - safeSelected.approved - safeSelected.inProgress, 0)} pendientes.</span>
        </div>
        <svg class="academic-curve" viewBox="0 0 ${width} ${height}" role="img" aria-label="Progreso real de la malla curricular por ciclo">
          <g class="curve-grid">${[52, 82, 112, 142].map((y) => `<line x1="46" y1="${y}" x2="592" y2="${y}"></line>`).join("")}</g>
          <g>${points.map((point, index) => `<rect class="curve-bar" style="--i:${index}" x="${point.x - 17}" y="${bottom - point.barHeight}" width="34" height="${point.barHeight}" rx="6"></rect>`).join("")}</g>
          <path class="growth-line" pathLength="1" d="${path}" fill="none"></path>
          <g>${points.map((point, index) => `<circle class="curve-point ${point.cycle.id === selectedCurveCycle ? "active" : ""} ${point === maxPoint ? "is-max" : ""}" data-curve-cycle="${point.cycle.id}" cx="${point.x}" cy="${point.y}" r="${point.cycle.id === selectedCurveCycle ? 7 : 6}"></circle><text x="${point.x}" y="166" text-anchor="middle">C${index + 1}</text>`).join("")}</g>
          <g class="curve-tooltip" transform="translate(${Math.min(maxPoint.x + 14, 480)} ${Math.max(maxPoint.y - 48, 10)})">
            <path d="M0 0h132a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H38L18 68v-20H0a10 10 0 0 1-10-10V10A10 10 0 0 1 0 0z"></path>
            <text x="10" y="22">Mayor avance</text>
            <text x="10" y="38">${maxPoint?.percent || 0}% aprobado</text>
          </g>
        </svg>
        <div class="curve-cycle-list">
          ${points.map((point, index) => `<button class="${point.cycle.id === selectedCurveCycle ? "active" : ""}" type="button" data-curve-cycle="${point.cycle.id}"><span>C${index + 1}</span><strong>${point.percent}%</strong></button>`).join("")}
        </div>
      `);
      card.querySelectorAll("[data-curve-cycle]").forEach((node) => node.addEventListener("click", () => {
        selectedCurveCycle = node.dataset.curveCycle;
        renderAcademicCurve();
      }));
      card.querySelectorAll("[data-tab]").forEach((node) => node.addEventListener("click", (event) => {
        event.preventDefault();
        showSection(node.dataset.tab, true);
        handleServiceFocus("toolMalla");
      }));
    }

    function cycleAcademicProgress() {
      const state = appData.curriculumStatus || {};
      return CYCLES.map((cycle) => {
        const total = cycle.subjects.length;
        const approved = cycle.subjects.filter((subject) => state[subject.id] === "aprobada").length;
        const inProgress = cycle.subjects.filter((subject) => state[subject.id] === "en-curso").length;
        return {
          cycle,
          total,
          approved,
          inProgress,
          percent: total ? Math.round((approved / total) * 100) : 0
        };
      });
    }

    function bindHomeDynamicActions() {
 el.homeOpportunities?.querySelectorAll('[data-tab]').forEach(node => node.addEventListener('click', () => showSection(node.dataset.tab, true)));
}

    
    function animateCounter(node, target, duration = 1200) {
      if (!node) return;
      const numericTarget = Math.max(0, Number(target) || 0);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.dataset.motion === 'minimal') { node.textContent=String(numericTarget); return; }
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = String(Math.round(numericTarget * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    let heroClockMinute = -1;
    function startHeroClock() {
      updateHeroClock();
      if (heroClockTimer) clearInterval(heroClockTimer);
      // Only the visible home page is updated; the schedule widget changes once per minute.
      heroClockTimer = setInterval(() => {
        if (document.hidden || !el.heroClockTime?.closest(".page-section.active")) return;
        updateHeroClock();
        const minute = new Date().getMinutes();
        if (minute !== heroClockMinute) { heroClockMinute = minute; renderNextClassWidget(); }
      }, 1000);
    }

    function updateHeroClock() {
      if (!el.heroClockTime || !el.heroClockDate) return;
      const now = new Date();
      const time = now.toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      // Reuse the existing digit nodes so each tick touches only the digits that changed.
      const chars = time.replace(/:/g, "").split("");
      const digits = el.heroClockTime.querySelectorAll(".digit");
      if (digits.length === chars.length) {
        chars.forEach((char, index) => { if (digits[index].textContent !== char) digits[index].textContent = char; });
      } else {
        const [hours = "--", minutes = "--", seconds = "--"] = time.split(":");
        const renderDigits = (value) => String(value).split("").map((char) => `<span class="digit">${escapeHtml(char)}</span>`).join("");
        el.heroClockTime.innerHTML = DOMPurify.sanitize(`${renderDigits(hours)}<span class="clock-colon">:</span>${renderDigits(minutes)}<span class="clock-colon">:</span><span class="clock-seconds">${renderDigits(seconds)}</span>`);
      }
      const date = now.toLocaleDateString("es-EC", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      if (el.heroClockDate.textContent !== date) el.heroClockDate.textContent = date;
    }

    function homeIsVisible() {
      return document.visibilityState !== "hidden" && document.querySelector("[data-section].active")?.dataset.section === "inicio";
    }

    // Indicators refresh every minute and news every ten minutes while the home page is on screen.
    function liveServicesUnavailable() {
      return Boolean(window.AdeRuntime?.staticMode && !window.AdeRuntime.backendAvailable && !window.AdeLiveSnapshot?.available);
    }

    function startEconomicIndicatorUpdates() {
      if (liveServicesUnavailable()) return;
      scheduleEconomicIndicatorLoad();
      if (economicIndicatorsTimer) clearInterval(economicIndicatorsTimer);
      economicIndicatorsTimer = setInterval(refreshLiveHomeData, window.AdeLiveSnapshot?.available ? 60000 : 15000);
      document.addEventListener("visibilitychange", refreshLiveHomeData);
    }

    function refreshLiveHomeData() {
      if (!homeIsVisible()) return;
      if (Date.now() - economicIndicatorsAt >= ECONOMIC_INDICATORS_REFRESH) fetchEconomicIndicators();
      if (Date.now() - economicNewsAt >= ECONOMIC_NEWS_REFRESH) fetchEconomicNews();
    }

    function scheduleEconomicIndicatorLoad() {
      if (liveServicesUnavailable()) { renderEconomicIndicators(); return; }
      if (economicIndicatorsScheduled || Date.now() - economicIndicatorsAt < ECONOMIC_INDICATORS_REFRESH) return;
      economicIndicatorsScheduled = true;
      scheduleLowPriorityTask(() => {
        economicIndicatorsScheduled = false;
        if (homeIsVisible()) fetchEconomicIndicators();
      }, 1400);
    }

    async function fetchEconomicIndicators() {
      if (!el.economicIndicators) return;
      if (liveServicesUnavailable()) { renderEconomicIndicators(); return; }
      economicIndicatorsAt = Date.now();
      if (!economicIndicators) el.economicIndicators.innerHTML = DOMPurify.sanitize(`<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`);
      try {
        if(window.AdeLiveSnapshot?.available)economicIndicators=await window.AdeLiveSnapshot.get('indicators');
        else{
          const response = await fetch(window.AdeRuntime ? window.AdeRuntime.apiUrl('/api/indicadores') : '/api/indicadores', { cache: "no-store", signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error("No response");
          economicIndicators = await response.json();
        }
        economicIndicatorsFailed = false;
      } catch {
        economicIndicatorsFailed = true;
      }
      renderEconomicIndicators();
    }

    function renderEconomicIndicators() {
      if (!el.economicIndicators) return;
      if (liveServicesUnavailable()) {
        el.economicIndicators.innerHTML = DOMPurify.sanitize(`<div class="empty-state"><div><strong>Actualizaciones pendientes de activar</strong><span>Las cotizaciones se mostrarán cuando la ASO active las actualizaciones en vivo.</span></div></div>`);
        return;
      }
      const items = economicIndicators?.items || [];
      if (!items.length) {
        if (economicIndicatorsFailed) el.economicIndicators.innerHTML = DOMPurify.sanitize(`<div class="empty-state"><div><strong>Indicadores no disponibles</strong><span>No se pudo consultar la fuente. Se reintentará en un minuto.</span></div></div>`);
        return;
      }
      el.economicIndicators.innerHTML = DOMPurify.sanitize(items.map((item) => {
        const change = Number(item.change);
        const trend = !Number.isFinite(change) ? "" : `<small class="trend ${change > 0.005 ? "up" : change < -0.005 ? "down" : "neutral"}">${change > 0.005 ? "↑" : change < -0.005 ? "↓" : "→"} ${Math.abs(change).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</small>`;
        return `<div class="economic-item"><strong>${escapeHtml(item.display)} ${trend}</strong><span>${escapeHtml(item.label)}</span></div>`;
      }).join(""));
      if (el.exchangeStatus) {
        const time = new Date(economicIndicators.updatedAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" });
        const old = economicIndicatorsFailed || economicIndicators.stale;
        el.exchangeStatus.textContent = `${old ? "Último dato disponible" : window.AdeLiveSnapshot?.available ? "Referencia" : "En vivo"} · ${economicIndicators.source} · actualizado ${time} · variación del día`;
      }
    }

    function renderNextClassWidget() {
      if (!el.nextClassWidget) return;
      const next = getNextClass();
      el.nextClassWidget.innerHTML = DOMPurify.sanitize(`
        <div class="next-class-head">
          <h3>Próxima clase</h3>
          <span class="next-class-badge ${escapeAttribute(next.badgeClass || "")}">${escapeHtml(next.badge || "HOY")}</span>
        </div>
        <p><strong>${escapeHtml(next.subject)}</strong> · ${escapeHtml(next.day || "Por definir")} ${escapeHtml(next.start || "")}</p>
        <div class="next-class-progress" id="nextClassProgress" aria-label="Cercanía a la próxima clase" style="--progress: ${Math.round(next.progress || 0)}%"><span></span></div>
        <p>${escapeHtml(next.room || "Aula por definir")}${next.distanceText ? ` · ${escapeHtml(next.distanceText)}` : ""}</p>
        <div class="inline-actions"><button class="btn-secondary" type="button" data-tab="herramientas">Ver horario completo</button></div>`);
      el.nextClassWidget.querySelector("[data-tab]")?.addEventListener("click", () => { showSection("herramientas", true); handleServiceFocus("toolHorario"); });
    }

    function getNextClass() {
      const items = [...(appData.studentSchedules || [])];
      if (!items.length) return { subject: "Construye tu horario", day: "", start: "", room: "Agrega materias en Herramientas", badge: "SIN HORARIO", badgeClass: "empty", progress: 0, distanceText: "No hay horario guardado" };
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const now = new Date();
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const active = items.find((item) => {
        const dayIndex = days.indexOf(item.day);
        const startMinutes = minutesFromTime(item.start || "00:00");
        const endMinutes = minutesFromTime(item.end || "00:00");
        return dayIndex === currentDay && currentMinutes >= startMinutes && currentMinutes < endMinutes;
      });
      if (active) {
        const startMinutes = minutesFromTime(active.start || "00:00");
        const endMinutes = minutesFromTime(active.end || "00:00");
        const progress = endMinutes > startMinutes ? ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100 : 100;
        return {
          subject: subjectName(active.cycleId, active.subjectId) || "Clase en curso",
          day: active.day || "Hoy",
          start: `${active.start || ""} - ${active.end || ""}`,
          room: active.aula || "Aula por definir",
          badge: "EN CURSO",
          badgeClass: "active",
          progress,
          distanceText: "clase activa ahora"
        };
      }
      const ranked = items.map((item) => {
        const dayIndex = days.indexOf(item.day);
        const startMinutes = minutesFromTime(item.start || "07:00");
        const dayOffset = dayIndex >= 0 ? (dayIndex - currentDay + 7) % 7 : 0;
        let distance = dayOffset * 1440 + startMinutes - currentMinutes;
        if (distance < 0) distance += 7 * 1440;
        return { item, distance, dayOffset };
      }).sort((a, b) => a.distance - b.distance)[0];
      const rankedItem = ranked?.item;
      const badge = ranked?.dayOffset === 0 ? "HOY" : ranked?.dayOffset === 1 ? "MAÑANA" : String(rankedItem?.day || "PRÓXIMA").toUpperCase();
      const badgeClass = ranked?.dayOffset === 1 ? "tomorrow" : "";
      const progress = Math.max(4, Math.min(100, 100 - ((ranked?.distance || 0) / (24 * 60)) * 100));
      return {
        subject: subjectName(rankedItem?.cycleId, rankedItem?.subjectId) || "Materia de Administración",
        day: rankedItem?.day || "Hoy",
        start: rankedItem?.start || "",
        room: rankedItem?.aula || "Aula por definir",
        badge,
        badgeClass,
        progress,
        distanceText: formatClassDistance(ranked?.distance || 0)
      };
    }

    function minutesFromTime(value) {
      const [hours, minutes] = String(value || "00:00").split(":").map(Number);
      return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
    }

    function formatClassDistance(distance) {
      if (distance <= 0) return "empieza ahora";
      const days = Math.floor(distance / 1440);
      const hours = Math.floor((distance % 1440) / 60);
      const minutes = Math.round(distance % 60);
      if (days > 0) return `faltan ${days} d ${hours} h`;
      if (hours > 0) return `faltan ${hours} h ${minutes} min`;
      return `faltan ${minutes} min`;
    }

    function scheduleEconomicNewsLoad() {
      if (liveServicesUnavailable()) { if (el.economicNewsList) renderEconomicNewsItems([]); return; }
      if (!el.economicNewsList || economicNewsScheduled || Date.now() - economicNewsAt < ECONOMIC_NEWS_REFRESH) return;
      economicNewsScheduled = true;
      scheduleLowPriorityTask(() => {
        economicNewsScheduled = false;
        if (homeIsVisible()) fetchEconomicNews();
      }, 1800);
    }

    async function fetchEconomicNews(manual = false) {
      if (!el.economicNewsList) return;
      if (liveServicesUnavailable()) { renderEconomicNewsItems([]); return; }
      const firstLoad = !economicNewsAt;
      economicNewsAt = Date.now();
      if (firstLoad || manual) el.economicNewsList.innerHTML = DOMPurify.sanitize(`<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`);
      try {
        let data;
        if(window.AdeLiveSnapshot?.available)data=await window.AdeLiveSnapshot.get('news',manual);
        else{
          const response = await fetch(window.AdeRuntime ? window.AdeRuntime.apiUrl('/api/noticias') : '/api/noticias', { cache: "no-store", signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error("Noticias no disponibles");
          data = await response.json();
        }
        if (!data.items?.length) throw new Error("Sin titulares");
        renderEconomicNewsItems(data.items, data);
      } catch {
        // Keep headlines already on screen; only show the empty state if there are none.
        if (firstLoad || manual || !el.economicNewsList.querySelector(".news-item")) renderEconomicNewsItems([]);
      }
    }

    function renderEconomicNewsItems(items, meta = {}) {
      if (liveServicesUnavailable()) {
        el.economicNewsList.innerHTML = DOMPurify.sanitize(`<div class="empty-state"><div><strong>Noticias pendientes de activar</strong><span>Los titulares aparecerán cuando la ASO active este servicio.</span></div></div>`);
        return;
      }
      if (!items.length) {
        el.economicNewsList.innerHTML = DOMPurify.sanitize(`<div class="empty-state"><div><strong>No hay titulares disponibles</strong><span>Intenta actualizar las noticias sobre empresas, mercados y gestión.</span></div></div><div class="news-actions"><button class="btn-secondary" type="button" data-refresh-news>Actualizar noticias</button></div>`);
        el.economicNewsList.querySelector("[data-refresh-news]")?.addEventListener("click", () => fetchEconomicNews(true));
        return;
      }
      const updated = meta.updatedAt ? new Date(meta.updatedAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" }) : "";
      el.economicNewsList.innerHTML = DOMPurify.sanitize(`
        <div class="news-actions"><button class="btn-secondary" type="button" data-refresh-news>Actualizar noticias</button><span>${escapeHtml(meta.source || "")}${updated ? ` · ${escapeHtml(updated)}` : ""}${meta.stale ? " · último dato disponible" : ""}</span></div>
        ${items.map((item) => `
          <article class="news-item">
            <a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
            <span>${escapeHtml(item.source || "")}${item.source ? " · " : ""}${escapeHtml(formatNewsAge(item.date))}</span>
          </article>`).join("")}`);
      el.economicNewsList.querySelector("[data-refresh-news]")?.addEventListener("click", () => fetchEconomicNews(true));
    }

    function formatNewsAge(value) {
      const time = new Date(value).getTime();
      if (!Number.isFinite(time)) return "Sin fecha";
      const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
      if (minutes < 60) return `hace ${minutes} min`;
      if (minutes < 24 * 60) return `hace ${Math.round(minutes / 60)} h`;
      return formatDate(value);
    }

    function renderCarrera() {
      el.careerCardsContainer.innerHTML = DOMPurify.sanitize((appData.carreraCards || []).filter(item=>!item.hidden).sort((a, b) => String(a.orden || "").localeCompare(String(b.orden || ""))).map((card) => `
        <article class="portal-card career-card">
          <span class="portal-card-icon">${escapeHtml(card.orden || "")}</span>
          <h3>${escapeHtml(card.titulo)}</h3>
          <p>${escapeHtml(card.resumen)}</p>
          <button class="btn-secondary" type="button" data-career-card="${card.id}">Abrir detalle</button>
        </article>`).join(""));
      el.careerCardsContainer.querySelectorAll("button[data-career-card]").forEach((node) => {
        node.addEventListener("click", () => openCareerDetail(node.dataset.careerCard));
      });
      renderCareerPath();
    }

    function careerPathAreas() {
      return [
        { id: "marketing", title: "Marketing y ventas", text: "Comprensión de clientes, investigación de mercados y desarrollo comercial.", skills: "Estrategia de marca, ventas, análisis de mercado", subjects: "Fundamentos de Marketing, Administración de Marketing, Investigación de Mercados", careers: "Gestión comercial, marketing, ventas" },
        { id: "finanzas", title: "Finanzas y contabilidad", text: "Planificación financiera y evaluación del desempeño económico de las organizaciones.", skills: "Presupuestos, análisis financiero, control", subjects: "Contabilidad de Gestión, Finanzas Corporativas, Gestión Presupuestaria", careers: "Gestión financiera, contabilidad, asesoría" },
        { id: "talento", title: "Talento humano", text: "Organización del trabajo, liderazgo y desarrollo de equipos.", skills: "Liderazgo, comunicación, gestión de personas", subjects: "Liderazgo y Equipos, Gestión de Talento Humano, Derecho Laboral", careers: "Gestión de personas, desarrollo organizacional" },
        { id: "operaciones", title: "Producción y logística", text: "Mejora de procesos, calidad, abastecimiento y distribución.", skills: "Operaciones, calidad, cadena de suministro", subjects: "Gestión de la Producción, Logística Empresarial, Gestión de Calidad", careers: "Operaciones, logística, producción" },
        { id: "estrategia", title: "Estrategia y sostenibilidad", text: "Planificación y toma de decisiones considerando resultados e impacto organizacional.", skills: "Análisis estratégico, gestión de proyectos, sostenibilidad", subjects: "Planificación Estratégica, Evaluación de Proyectos, Gerencia de Sostenibilidad", careers: "Planificación, gerencia, consultoría" },
        { id: "emprendimiento", title: "Emprendimiento y consultoría", text: "Creación de iniciativas y acompañamiento a empresas públicas y privadas.", skills: "Diseño de negocios, innovación, negociación", subjects: "Emprendimiento e Innovación, Creación de Empresas, Negociación", careers: "Emprendimiento, asesoría, consultoría empresarial" }
      ];
    }

    function renderCareerPath() {
      if (!el.careerPathContainer) return;
      const areas = careerPathAreas();
      el.careerPathContainer.innerHTML = DOMPurify.sanitize(`
        <div class="view-heading">
          <div>
            <span class="section-tag">Ruta profesional</span>
            <h2>Áreas de desarrollo profesional</h2>
            <p>Explora áreas de Administración de Empresas. Abre cada tarjeta para ver habilidades, materias relacionadas y salidas laborales.</p>
          </div>
        </div>
        <div class="career-path-grid">
          ${areas.map((area) => `<button class="career-path-card" type="button" data-career-path="${area.id}"><span>${escapeHtml(area.title.slice(0, 2).toUpperCase())}</span><strong>${escapeHtml(area.title)}</strong><small>${escapeHtml(area.text)}</small></button>`).join("")}
        </div>`);
      el.careerPathContainer.querySelectorAll("[data-career-path]").forEach((button) => button.addEventListener("click", () => openCareerPathDetail(button.dataset.careerPath)));
    }

    function openCareerPathDetail(id) {
      const area = careerPathAreas().find((item) => item.id === id);
      if (!area) return;
      el.requestModalContent.innerHTML = DOMPurify.sanitize(`
        <div class="modal-header"><div><span class="eyebrow">Ruta profesional</span><h2>${escapeHtml(area.title)}</h2></div><button class="icon-only" type="button" data-close-request aria-label="Cerrar ruta profesional">×</button></div>
        <div class="career-detail career-path-detail">
          <p>${escapeHtml(area.text)}</p>
          <dl>
            <div><dt>Habilidades</dt><dd>${escapeHtml(area.skills)}</dd></div>
            <div><dt>Materias relacionadas</dt><dd>${escapeHtml(area.subjects)}</dd></div>
            <div><dt>Salidas laborales</dt><dd>${escapeHtml(area.careers)}</dd></div>
          </dl>
        </div>
        <div class="modal-actions"><button class="btn-primary" type="button" data-close-request>Cerrar</button></div>`);
      el.requestModalContent.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));
      el.requestModal.hidden = false;
    }

    function openCareerDetail(id) {
      const card = (appData.carreraCards || []).find((item) => item.id === id);
      if (!card) return;
      const videos = parseGallery(card.videos);
      el.requestModalContent.innerHTML = DOMPurify.sanitize(`
        <div class="modal-header"><div><span class="eyebrow">${escapeHtml(card.orden || "Carrera")}</span><h2>${escapeHtml(card.titulo)}</h2></div><button class="icon-only" type="button" data-close-request aria-label="Cerrar detalle de carrera">×</button></div>
        <div class="career-detail">
          <p>${escapeHtml(card.detalle || card.resumen)}</p>
          ${videos.length ? `<div class="career-video-grid">${videos.map((url) => renderVideoFrame(url, card.titulo)).join("")}</div>` : ""}
        </div>
        <div class="modal-actions"><button class="btn-primary" type="button" data-close-request>Cerrar</button></div>`);
      el.requestModalContent.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));
      el.requestModal.hidden = false;
    }

    function renderNotifications() {
      const events = upcomingItems([...(appData.oportunidades || [])]);
      const exams = upcomingItems(visibleResources().filter((item) => item.typeId === "examenes"));
      setBadge(el.examNavBadge, exams.length);
      const highlights = [...events.slice(0, 2), ...exams.slice(0, 1)];
      const signature = highlights.map((item) => item.id || item.titulo || item.title).join("|");
      const dismissed = sessionStorage.getItem("portal_alert_dismissed") === signature;
      document.body.classList.toggle("has-alert", highlights.length > 0 && !dismissed);
      if (!el.alertBanner) return;
      if (!highlights.length || dismissed) { el.alertBanner.hidden = true; return; }
      el.alertBanner.hidden = false;
      el.alertBanner.innerHTML = DOMPurify.sanitize(`<div><strong>Fechas próximas:</strong> <span>${highlights.map((item) => `${escapeHtml(item.titulo || item.title)} (${formatDate(item.fecha || item.date)})`).join(" · ")}</span></div><div class="inline-actions"><button class="btn-secondary" type="button" data-tab="oportunidades">Ver detalles</button><button class="alert-close" type="button" data-close-alert aria-label="Cerrar notificación">×</button></div>`);
      el.alertBanner.querySelector("[data-tab]")?.addEventListener("click", () => showSection("oportunidades", true));
      el.alertBanner.querySelector("[data-close-alert]")?.addEventListener("click", () => {
        sessionStorage.setItem("portal_alert_dismissed", signature);
        el.alertBanner.hidden = true;
        document.body.classList.remove("has-alert");
      });
    }

    function upcomingItems(items) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const limit = new Date(today);
      limit.setDate(limit.getDate() + 7);
      return items.filter((item) => {
        const raw = item.fecha || item.date;
        if (item.alertPriority) return true;
        if (!raw) return false;
        const date = new Date(String(raw).includes("T") ? raw : raw + "T00:00:00");
        return date >= today && date <= limit;
      }).sort((a, b) => new Date(a.fecha || a.date) - new Date(b.fecha || b.date));
    }

    function setBadge(node, count) {
      if (!node) return;
      node.textContent = String(count);
      node.classList.toggle("show", count > 0);
    }

    function renderRepository() {
      const resources = visibleResources();
      el.materialCounter && (el.materialCounter.textContent = `${resources.length} ${resources.length === 1 ? "material" : "materiales"}`);
      el.heroMaterialCounter && (el.heroMaterialCounter.textContent = String(resources.length));
      el.searchInput.value = repoState.search;
      el.cycleFilter.value = repoState.cycleFilter;
      el.typeFilter.value = repoState.typeFilter;
      if (el.sourceFilter) el.sourceFilter.value = repoState.sourceFilter;
      if (el.repositoryViewMode) el.repositoryViewMode.value = repoState.viewMode;
      el.repositoryView?.setAttribute("data-view-mode", repoState.viewMode);
      el.sortOrder.value = repoState.sortOrder;
      el.backButton.hidden = repoState.view === "cycles";
      el.addMaterialButton.hidden = !isAdmin;
      renderBreadcrumb();
      if (repoState.view === "cycles") renderCyclesView();
      if (repoState.view === "favorites") renderFavoritesView();
      if (repoState.view === "subjects") renderSubjectsView();
      if (repoState.view === "subject") renderSubjectView();
    }

    function renderPhysicalBooks() {
      if (!el.physicalBooksContainer) return;
      const books = appData.physicalBooks || [];
      el.physicalBooksContainer.innerHTML = DOMPurify.sanitize(`
        <article class="physical-books-card">
          <div class="physical-books-header">
            <div>
              <span class="section-tag">Biblioteca física</span>
              <h3>Reserva de Libros Físicos de la Asociación</h3>
              <p>Reserva el retiro presencial de libros de apoyo disponibles en la Asociación de Estudiantes.</p>
            </div>
            ${isAdmin ? `<button class="btn-secondary" type="button" data-open-admin-books>Administrar libros</button>` : ""}
          </div>
          ${books.length ? `<div class="books-grid">${books.map(renderBookCard).join("")}</div>` : renderEmpty("Sin libros registrados", "El administrador puede agregar títulos desde el panel.")}
        </article>`);
      el.physicalBooksContainer.querySelectorAll("[data-reserve-book]").forEach((btn) => btn.addEventListener("click", () => openBookReservation(btn.dataset.reserveBook)));
      el.physicalBooksContainer.querySelector("[data-open-admin-books]")?.addEventListener("click", () => { adminTab = "physicalBooks"; openAdminPanel(); });
    }

    function renderBookCard(book) {
      return `<article class="book-card"><span class="book-status">${escapeHtml(book.estado || "Disponible")}</span><strong>${escapeHtml(book.titulo)}</strong><p>${escapeHtml(book.descripcion || "Libro físico disponible para consulta y retiro presencial.")}</p><small>${escapeHtml(book.autor || "Biblioteca ASO Administración")}</small><button class="btn-primary" type="button" data-reserve-book="${book.id}">Reservar retiro presencial</button></article>`;
    }

    function renderBreadcrumb() {
      const cycle = findCycle(repoState.cycleId);
      const subject = cycle?.subjects.find((item) => item.id === repoState.subjectId);
      let html = '<button type="button" data-crumb="root">Repositorio</button>';
      if (repoState.view === "favorites") html += ` <span>›</span> <strong>Mis Favoritos</strong>`;
      if (cycle) html += ` <span>›</span> ${subject ? `<button type="button" data-crumb="cycle">${cycle.name}</button> <span>›</span> <strong>${subject.name}</strong>` : `<strong>${cycle.name}</strong>`}`;
      el.breadcrumb.innerHTML = DOMPurify.sanitize(html);
    }

    function renderCyclesView() {
      const query = normalize(repoState.search);
      const cycles = CYCLES.filter((cycle) => !query || normalize(cycle.name + " " + cycle.subjects.map((s) => s.name).join(" ")).includes(query));
      el.repositoryView.innerHTML = DOMPurify.sanitize(`
        <div class="view-heading"><div><h2>Repositorio Académico</h2><p>Selecciona un ciclo para abrir sus carpetas de materias.</p></div><div class="portal-card-meta"><span>${CYCLES.length} ciclos</span><span>${countSubjects()} materias</span><span>${visibleResources().length} materiales</span></div></div>
        ${renderDriveRepositoryStatus()}
        ${cycles.length ? `<div class="folder-grid">${renderFavoritesFolder()}${cycles.map(renderCycleCard).join("")}</div>` : renderRepositoryEmpty("No se encontraron carpetas", "No hay ciclos que coincidan con tu búsqueda. Prueba con otra materia o vuelve al inicio del repositorio.", [{ label: "Volver a ciclos", action: "repo-root" }])}
      `);
    }

    function renderFavoritesFolder() {
      return `<button class="folder-card favorites-folder" type="button" data-open-favorites><span class="folder-visual">★</span><span><span class="folder-title">Mis Favoritos</span><span class="folder-meta"><span>${favoriteIds.length} materiales guardados</span><span>Acceso rápido</span></span></span></button>`;
    }

    function renderCycleCard(cycle) {
      const index = CYCLES.findIndex((item) => item.id === cycle.id) + 1;
      return `<button class="folder-card cycle-tone-${index}" type="button" data-cycle-id="${cycle.id}" data-cycle-index="${index}"><span class="folder-visual">C${index}</span><span><span class="folder-title">${cycle.name}</span><span class="folder-meta"><span>${cycle.subjects.length} materias</span><span>${countResources({ cycleId: cycle.id })} materiales</span></span></span></button>`;
    }

    function renderSubjectsView() {
      const cycle = findCycle(repoState.cycleId);
      if (!cycle) return openRepoRoot();
      const query = normalize(repoState.search);
      const subjects = cycle.subjects.filter((subject) => !query || normalize(subject.name).includes(query));
      el.repositoryView.innerHTML = DOMPurify.sanitize(`
        <div class="view-heading"><div><h2>${cycle.name}</h2><p>Materias del ciclo seleccionado.</p></div><div class="portal-card-meta"><span>${subjects.length} materias visibles</span><span>${countResources({ cycleId: cycle.id })} materiales</span></div></div>
        ${subjects.length ? `<div class="folder-grid">${subjects.map((subject) => renderSubjectCard(cycle, subject)).join("")}</div>` : renderRepositoryEmpty("No se encontraron materias", "El buscador no coincide con este ciclo. Puedes revisar otros ciclos o solicitar material.", [{ label: "Volver a ciclos", action: "repo-root" }, { label: "Solicitar material", action: "request-material" }])}
      `);
    }

    function renderSubjectCard(cycle, subject) {
      return `<article class="folder-card" data-subject-id="${subject.id}"><span class="folder-visual subject">MAT</span><span><span class="folder-title">${subject.name}</span><span class="folder-meta"><span>${cycle.name}</span><span>${countResources({ cycleId: cycle.id, subjectId: subject.id })} materiales</span><span>${countResources({ cycleId: cycle.id, subjectId: subject.id, typeId: "apuntes" })} apuntes</span></span></span><div class="folder-actions"><button class="mini-action" type="button" data-open-subject="${subject.id}">Abrir materia</button><button class="mini-action active" type="button" data-subject-apuntes="${subject.id}">Ver apuntes</button></div></article>`;
    }

    function renderFavoritesView() {
      const items = visibleResources().filter((item) => favoriteIds.includes(item.id));
      const grouped = CYCLES.flatMap((cycle) => cycle.subjects.map((subject) => ({
        cycle,
        subject,
        items: items.filter((item) => item.cycleId === cycle.id && item.subjectId === subject.id)
      }))).filter((group) => group.items.length);
      el.repositoryView.innerHTML = DOMPurify.sanitize(`
        <div class="view-heading"><div><h2>Mis Favoritos</h2><p>Materiales guardados para volver rápido a ellos.</p></div><div class="portal-card-meta"><span>${items.length} favoritos</span></div></div>
        ${grouped.length ? `<div class="category-list">${grouped.map((group) => `<section class="category-panel"><div class="category-header"><div class="category-title-row"><span class="category-icon">★</span><div><h3>${group.subject.name}</h3><p>${group.cycle.name} · ${group.items.length} materiales</p></div></div></div><div class="material-list">${group.items.map(renderMaterialCard).join("")}</div></section>`).join("")}</div>` : renderRepositoryEmpty("Aún no tienes favoritos", "Marca materiales importantes con la estrella para encontrarlos rápido desde esta vista.", [{ label: "Ver ciclos", action: "repo-root" }])}
      `);
    }

    function renderSubjectView() {
      const cycle = findCycle(repoState.cycleId);
      const subject = cycle?.subjects.find((item) => item.id === repoState.subjectId);
      if (!cycle || !subject) return openRepoRoot();
      const categories = repoState.typeFilter === "all" ? CATEGORIES : CATEGORIES.filter((cat) => cat.id === repoState.typeFilter);
      el.repositoryView.innerHTML = DOMPurify.sanitize(`
        <div class="subject-board">
          <div class="subject-summary"><div><span class="eyebrow">${cycle.name}</span><h2>${subject.name}</h2><p>${countResources({ cycleId: cycle.id, subjectId: subject.id, typeId: repoState.typeFilter })} materiales organizados.</p></div><div class="inline-actions"><button class="mini-action ${repoState.typeFilter === "apuntes" ? "active" : ""}" data-view-apuntes>Ver apuntes</button><button class="mini-action ${repoState.typeFilter === "all" ? "active" : ""}" data-reset-category>Todas las carpetas</button>${isAdmin ? `<button class="btn-primary" data-add-category="${repoState.typeFilter === "all" ? "" : repoState.typeFilter}">Agregar material</button>` : ""}</div></div>
          <div class="category-list">${categories.map((cat) => renderCategoryPanel(cycle, subject, cat)).join("")}</div>
        </div>
      `);
    }

    function renderCategoryPanel(cycle, subject, category) {
      const items = getResources({ cycleId: cycle.id, subjectId: subject.id, typeId: category.id, query: repoState.search });
      const pageKey = repositoryPageKey(cycle.id, subject.id, category.id);
      const pageInfo = paginateRepositoryItems(items, pageKey);
      const rangeText = items.length > REPOSITORY_PAGE_SIZE ? ` · mostrando ${pageInfo.start + 1}-${pageInfo.end} de ${items.length}` : "";
      return `<section class="category-panel" data-category-panel="${escapeAttribute(pageKey)}"><div class="category-header"><div class="category-title-row"><span class="category-icon">${category.short}</span><div><h3>${category.label}</h3><p>${items.length} ${items.length === 1 ? "material" : "materiales"}${rangeText}</p></div></div><div class="category-header-actions">${isAdmin ? `<button class="mini-action" data-add-category="${category.id}">Agregar</button>` : ""}${items.length > REPOSITORY_PAGE_SIZE ? `<span class="category-page-pill">4 por página</span>` : ""}</div></div>${items.length ? `<div class="material-list">${pageInfo.items.map(renderMaterialCard).join("")}</div>${renderMaterialPager(pageKey, pageInfo.page, pageInfo.totalPages, items.length)}` : renderRepositoryEmpty("Aún no hay materiales para esta materia", "Puedes solicitar material al representante o compartir apuntes con el administrador para que se publiquen aquí.", [{ label: "Solicitar material", action: "request-material" }, { label: "Ver otras materias", action: "repo-subjects" }])}</section>`;
    }


    function repositoryPageKey(cycleId, subjectId, typeId) {
      return [cycleId || "all", subjectId || "all", typeId || "all"].join("__");
    }

    function resetRepositoryPaging() {
      repositoryPages = {};
    }

    function paginateRepositoryItems(items, pageKey) {
      const totalPages = Math.max(1, Math.ceil(items.length / REPOSITORY_PAGE_SIZE));
      const requested = Number(repositoryPages[pageKey] || 1);
      const page = Math.min(totalPages, Math.max(1, Number.isFinite(requested) ? requested : 1));
      repositoryPages[pageKey] = page;
      const start = (page - 1) * REPOSITORY_PAGE_SIZE;
      const end = Math.min(items.length, start + REPOSITORY_PAGE_SIZE);
      return { page, totalPages, start, end, items: items.slice(start, end) };
    }

    function renderMaterialPager(pageKey, page, totalPages, total) {
      if (totalPages <= 1) return "";
      const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
      return `<div class="material-pager" aria-label="Paginación de materiales">
        <div><strong>Página ${page} de ${totalPages}</strong><span>${total} materiales · 4 por página</span></div>
        <div class="material-pager-actions">
          <button class="mini-action" type="button" data-material-page="${escapeAttribute(pageKey)}" data-page-to="${Math.max(1, page - 1)}" ${page <= 1 ? "disabled" : ""}>Anterior</button>
          <div class="material-page-dots">${pages.map((number) => `<button class="${number === page ? "active" : ""}" type="button" data-material-page="${escapeAttribute(pageKey)}" data-page-to="${number}" aria-label="Ir a página ${number}">${number}</button>`).join("")}</div>
          <button class="mini-action" type="button" data-material-page="${escapeAttribute(pageKey)}" data-page-to="${Math.min(totalPages, page + 1)}" ${page >= totalPages ? "disabled" : ""}>Siguiente</button>
        </div>
      </div>`;
    }

    function materialDownloadUrl(item) {
      if (item.downloadUrl) return item.downloadUrl;
      const driveId = getGoogleDriveId(item.url || item.webViewUrl || "");
      return driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : "";
    }

    function materialOpenUrl(item) {
      return item.webViewUrl || item.viewUrl || item.url || pdfViewerUrl(item);
    }

    function materialFileLabel(item) {
      if (item.fileType === "application/pdf" || isPdfResource(item)) return "PDF";
      if (/presentation|powerpoint|ppt/i.test(item.fileType || item.url || "")) return "Diapositiva";
      if (/spreadsheet|excel|xls/i.test(item.fileType || item.url || "")) return "Hoja de cálculo";
      if (/document|word|doc/i.test(item.fileType || item.url || "")) return "Documento";
      if (resourceKind(item) === "video") return "Video";
      return "Enlace";
    }

    function renderMaterialCard(item) {
      const adminActions = isAdmin ? `<button class="btn-secondary" type="button" data-repo-hide="${item.id}">Ocultar</button><button class="btn-danger" type="button" data-repo-delete="${item.id}">Eliminar</button>` : "";
      const youtubeId = ["videos", "clases-grabadas"].includes(item.typeId) ? getYouTubeId(item.url) : "";
      const embed = youtubeId ? `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${escapeAttribute(youtubeId)}" title="${escapeAttribute(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : "";
      const favorite = favoriteIds.includes(item.id);
      const shareText = encodeURIComponent(`${item.title} - ${item.url}`);
      const sourceLabel = item.source === DRIVE_RESOURCE_SOURCE ? "Google Drive" : "Local";
      const openUrl = materialOpenUrl(item);
      const downloadUrl = materialDownloadUrl(item);
      const subject = subjectName(item.cycleId, item.subjectId);
      const cycle = findCycle(item.cycleId)?.name || "";
      return `<article class="material-card material-card-pro" data-material-id="${item.id}" data-material-kind="${resourceKind(item)}">
        <button class="favorite-toggle ${favorite ? "active" : ""}" type="button" data-favorite-resource="${item.id}" aria-label="${favorite ? "Quitar de favoritos" : "Agregar a favoritos"}">${favorite ? "★" : "☆"}</button>
        <div class="material-main">
          <div class="material-title-row"><span class="material-kind-pill">${escapeHtml(materialFileLabel(item))}</span><h4>${highlightText(item.title, repoState.search)}</h4></div>
          <p>${highlightText(item.description || "Material académico disponible para consulta.", repoState.search)}</p>
          <div class="material-meta material-meta-pro">
            <span>${escapeHtml(cycle)}</span>
            <span>${escapeHtml(subject)}</span>
            <span>${categoryLabel(item.typeId)}</span>
            <span>${formatDate(item.date)}</span>
            <span>${escapeHtml(sourceLabel)}</span>
            ${item.fileName ? `<span title="${escapeAttribute(item.fileName)}">${escapeHtml(words(item.fileName, 6))}</span>` : ""}
          </div>
        </div>
        <div class="material-actions material-actions-compact">
          ${isPdfResource(item) ? `<button class="link-button primary-preview" type="button" data-preview-pdf="${item.id}">Ver PDF</button>` : `<a class="link-button primary-preview" href="${escapeAttribute(openUrl)}" target="_blank" rel="noopener noreferrer" data-open-material="${item.id}">${linkLabel(item.typeId)} ↗</a>`}
          <details class="material-more-actions">
            <summary>Más acciones</summary>
            <div class="material-more-grid">
              <a class="link-button" href="${escapeAttribute(openUrl)}" target="_blank" rel="noopener noreferrer" data-open-material="${item.id}">Abrir en Drive</a>
              ${downloadUrl ? `<a class="link-button" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noopener noreferrer" download>Descargar</a>` : ""}
              <button class="link-button" type="button" data-copy-material="${item.id}">Copiar link</button>
              <a class="link-button" href="https://wa.me/?text=${shareText}" target="_blank" rel="noopener noreferrer" aria-label="Compartir ${escapeAttribute(item.title)} por WhatsApp">WhatsApp</a>
              ${adminActions}
            </div>
          </details>
        </div>
        ${embed}
      </article>`;
    }

    function renderRepositoryEmpty(title, text, actions = []) {
      const buttons = actions.map((action) => `<button class="btn-secondary" type="button" data-empty-action="${action.action}">${action.label}</button>`).join("");
      return `<div class="empty-state repository-empty"><div><strong>${title}</strong><span>${text}</span>${buttons ? `<div class="inline-actions empty-actions">${buttons}</div>` : ""}</div></div>`;
    }

    function handleRepositoryClick(event) {
      const favorite = event.target.closest("[data-favorite-resource]");
      const favoritesFolder = event.target.closest("[data-open-favorites]");
      const addCategory = event.target.closest("[data-add-category]");
      const subjectNotes = event.target.closest("[data-subject-apuntes]");
      const openSubjectButton = event.target.closest("[data-open-subject]");
      const repoHide = event.target.closest("[data-repo-hide]");
      const repoDelete = event.target.closest("[data-repo-delete]");
      const emptyAction = event.target.closest("[data-empty-action]");
      const copyMaterial = event.target.closest("[data-copy-material]");
      const previewPdf = event.target.closest("[data-preview-pdf]");
      const openMaterial = event.target.closest("[data-open-material]");
      const materialPage = event.target.closest("[data-material-page]");
      const cycleCard = event.target.closest("[data-cycle-id]");
      const subjectCard = event.target.closest("[data-subject-id]");
      if (materialPage) return setRepositoryPage(materialPage.dataset.materialPage, materialPage.dataset.pageTo);
      if (favorite) return toggleFavorite(favorite.dataset.favoriteResource);
      if (copyMaterial) return copyMaterialLink(copyMaterial.dataset.copyMaterial);
      if (previewPdf) return openPdfModal(previewPdf.dataset.previewPdf);
      if (openMaterial) storeStudyActivityFromMaterial(openMaterial.dataset.openMaterial);
      if (favoritesFolder) { repoState = { ...repoState, view: "favorites", cycleId: null, subjectId: null }; return renderRepository(); }
      if (addCategory && isAdmin) return openMaterialModal({ typeId: addCategory.dataset.addCategory });
      if (repoHide && isAdmin) return toggleResource(repoHide.dataset.repoHide);
      if (repoDelete && isAdmin) return deleteResourceInline(repoDelete.dataset.repoDelete);
      if (emptyAction) return handleRepositoryEmptyAction(emptyAction.dataset.emptyAction);
      if (subjectNotes) return openSubject(subjectNotes.dataset.subjectApuntes, "apuntes");
      if (openSubjectButton) return openSubject(openSubjectButton.dataset.openSubject);
      if (event.target.closest("[data-view-apuntes]")) { repoState.typeFilter = "apuntes"; return renderRepository(); }
      if (event.target.closest("[data-reset-category]")) { repoState.typeFilter = "all"; return renderRepository(); }
      if (cycleCard) return openCycle(cycleCard.dataset.cycleId);
      if (subjectCard) return openSubject(subjectCard.dataset.subjectId);
    }


    function setRepositoryPage(pageKey, pageTo) {
      repositoryPages[pageKey] = Number(pageTo) || 1;
      renderRepository();
      const panel = el.repositoryView?.querySelector(`[data-category-panel="${CSS.escape(pageKey)}"]`);
      panel?.scrollIntoView({ behavior: motionBehavior(), block: "start" });
    }

    function openRepositorySubjectByName(nameFragment) {
      const subject = SUBJECTS.find((item) => normalize(item.name).includes(nameFragment));
      if (!subject) return showSection("repositorio", true);
      repoState = {
        ...repoState,
        view: "subject",
        cycleId: subject.cycleId,
        subjectId: subject.id,
        cycleFilter: subject.cycleId,
        typeFilter: "all",
        search: ""
      };
      showSection("repositorio", true);
      renderRepository();
    }

    function handleRepoQuickFilter(event) {
      const button = event.target.closest("[data-repo-chip]");
      if (!button) return;
      const chip = button.dataset.repoChip;
      el.repoQuickFilters?.querySelectorAll("[data-repo-chip]").forEach((node) => node.classList.toggle("active", node === button));
      repoState = { ...repoState, view: "cycles", cycleId: null, subjectId: null, cycleFilter: "all", typeFilter: "all", search: "" };
      if (chip === "pdf") repoState.typeFilter = "lecturas";
      if (chip === "videos") repoState.typeFilter = "videos";
      if (chip === "examenes") repoState.typeFilter = "examenes";
      if (chip === "favoritos") repoState.view = "favorites";
      if (chip === "planificacion") {
        openRepositorySubjectByName("planificacion estrategica");
        return;
      }
      renderRepository();
    }

    function copyMaterialLink(id) {
      const item = appData.resources.find((resource) => resource.id === id);
      if (!item?.url) return showToast("No hay enlace", "Este material no tiene URL para copiar.", "error");
      const done = () => showToast("Link copiado", "Ya puedes pegarlo en un chat o documento.", "success");
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(item.url).then(done).catch(() => fallbackCopy(item.url, done));
      } else {
        fallbackCopy(item.url, done);
      }
    }

    function fallbackCopy(text, callback) {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      try { document.execCommand("copy"); callback?.(); } catch { showToast("No se pudo copiar", "Copia el enlace manualmente.", "error"); }
      input.remove();
    }

    function openPdfModal(id) {
      const item = appData.resources.find((resource) => resource.id === id);
      if (!item) return showToast("PDF no encontrado", "No se pudo ubicar el material seleccionado.", "error");
      storeStudyActivityFromMaterial(id);
      const viewer = pdfViewerUrl(item);
      const openUrl = materialOpenUrl(item);
      const downloadUrl = materialDownloadUrl(item);
      const overlay = document.createElement("div");
      overlay.className = "pdf-modal";
      overlay.innerHTML = DOMPurify.sanitize(`<div class="pdf-modal-backdrop" data-close-pdf></div>
        <article class="pdf-modal-card" role="dialog" aria-modal="true" aria-label="Vista previa PDF">
          <header class="pdf-modal-header">
            <div>
              <span class="section-tag">Vista previa PDF</span>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(findCycle(item.cycleId)?.name || "")} · ${escapeHtml(subjectName(item.cycleId, item.subjectId))} · ${categoryLabel(item.typeId)}</p>
            </div>
            <button class="icon-only" type="button" data-close-pdf aria-label="Cerrar PDF">×</button>
          </header>
          <div class="pdf-modal-frame">
            <iframe src="${escapeAttribute(viewer)}" title="${escapeAttribute(item.title)}" loading="lazy" allowfullscreen></iframe>
          </div>
          <div class="pdf-modal-help">Si Google Drive no permite la vista previa, abre el documento en una pestaña nueva o descarga el archivo.</div>
          <footer class="pdf-modal-actions">
            <button class="btn-secondary" type="button" data-fullscreen-pdf>Pantalla completa</button>
            <a class="btn-secondary" href="${escapeAttribute(openUrl)}" target="_blank" rel="noopener noreferrer">Abrir en Drive</a>
            ${downloadUrl ? `<a class="btn-primary" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noopener noreferrer" download>Descargar</a>` : ""}
          </footer>
        </article>`);
      const close = () => {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
      };
      const onKeydown = (event) => { if (event.key === "Escape") close(); };
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-close-pdf]")) close();
        if (event.target.closest("[data-fullscreen-pdf]")) {
          overlay.querySelector("iframe")?.requestFullscreen?.();
        }
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      overlay.querySelector("[data-close-pdf]")?.focus();
    }

    function storeStudyActivityFromMaterial(id) {
      const item = appData.resources.find((resource) => resource.id === id);
      if (!item) return;
      const activity = loadJson(STUDY_ACTIVITY_KEY, {});
      studentStorage.setItem(STUDY_ACTIVITY_KEY, JSON.stringify({
        ...activity,
        lastResourceId: item.id,
        lastResourceTitle: item.title,
        lastSubjectId: item.subjectId,
        lastSubjectName: subjectName(item.cycleId, item.subjectId),
        updatedAt: new Date().toISOString()
      }));
      renderProfileSummary();
    }

    function handleRepositoryEmptyAction(action) {
      if (action === "repo-root") return openRepoRoot();
      if (action === "repo-subjects") {
        repoState = { ...repoState, view: repoState.cycleId ? "subjects" : "cycles", subjectId: null, typeFilter: "all" };
        return renderRepository();
      }
      if (action === "request-material") return showSection("consultas", true);
    }

    function toggleFavorite(id) {
      const wasFavorite = favoriteIds.includes(id);
      favoriteIds = favoriteIds.includes(id) ? favoriteIds.filter((item) => item !== id) : [...favoriteIds, id];
      studentStorage.setItem(PUBLIC_FAVORITES_KEY, JSON.stringify(favoriteIds));
      studentStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
      renderRepository();
      const card = el.repositoryView.querySelector(`[data-material-id="${CSS.escape(id)}"]`);
      if (card && !wasFavorite) {
        card.classList.add("favorite-pulse");
        setTimeout(() => card.classList.remove("favorite-pulse"), 700);
      }
      renderHome();
      renderProfileSummary();
      showToast(favoriteIds.includes(id) ? "Agregado a favoritos" : "Quitado de favoritos", "Tu lista de favoritos se actualizó.", "info");
    }

    function handleBreadcrumbClick(event) {
      const crumb = event.target.closest("[data-crumb]");
      if (!crumb) return;
      if (crumb.dataset.crumb === "root") openRepoRoot();
      if (crumb.dataset.crumb === "cycle") openCycle(repoState.cycleId);
    }

    function openRepoRoot() { repoState = { ...repoState, view: "cycles", cycleId: null, subjectId: null, cycleFilter: "all" }; renderRepository(); }
    function openCycle(cycleId) { repoState = { ...repoState, view: "subjects", cycleId, subjectId: null, cycleFilter: cycleId }; renderRepository(); }
    function openSubject(subjectId, typeId = "all") { const cycle = repoState.cycleId ? findCycle(repoState.cycleId) : findCycleBySubject(subjectId); repoState = { ...repoState, view: "subject", cycleId: cycle.id, subjectId, cycleFilter: cycle.id, typeFilter: typeId }; renderRepository(); }
    function goRepoBack() { repoState.view === "subject" ? openCycle(repoState.cycleId) : openRepoRoot(); }

    function openMaterialModal(defaults = {}) {
      if (!isAdmin) return openAdminLogin();
      el.materialForm.reset();
      const cycleId = defaults.cycleId || repoState.cycleId || (repoState.cycleFilter !== "all" ? repoState.cycleFilter : "");
      el.materialCycle.value = cycleId;
      populateSubjectSelect(cycleId, defaults.subjectId || repoState.subjectId || "");
      el.materialType.value = defaults.typeId || (repoState.typeFilter !== "all" ? repoState.typeFilter : "");
      el.materialDate.value = new Date().toISOString().slice(0, 10);
      validateMaterialUrlField();
      el.materialModal.hidden = false;
    }
    function closeMaterialModal() { el.materialModal.hidden = true; }
    async function submitMaterial(event) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(el.materialForm).entries());
      const file = el.materialForm.file?.files?.[0];
      if (file && file.type !== "application/pdf") return showToast("Archivo no válido", "Por ahora el visor integrado acepta archivos PDF.", "error");
      if (data.url && !isValidMaterialUrl(data.url)) return showToast("Enlace no válido", "Pega un enlace válido de Google Drive, Google Docs o un PDF externo.", "error");
      if (!data.title || !data.type || (!data.url && !file) || !data.cycle || !data.subject) return showToast("Campos incompletos", "Completa título, tipo, ciclo, materia y un link o PDF.", "error");
      // PDFs are stored by the server (signature-checked); base64 text was always rejected on publish.
      let url = data.url.trim();
      if (file) {
        if (file.size > 3_000_000) return showToast("Archivo demasiado grande", "El PDF debe pesar menos de 3 MB. Para archivos mayores usa Google Drive.", "error");
        try { url = (await portalApi('/api/upload', { data: String(await fileToBase64(file)).split(',')[1], kind: 'pdf' })).url; }
        catch (error) { return showToast("No se pudo subir el PDF", error.message, "error"); }
      }
      pendingPublishSummary = `Agregó el material «${data.title.trim()}»`;
      const created = addResource({
        title: data.title.trim(), typeId: data.type, description: data.description.trim(), url, uploader: data.uploader.trim() || "Administrador", date: data.date,
        cycleId: data.cycle, subjectId: data.subject, hidden: false, fileName: file?.name || "", fileType: file?.type || ""
      });
      logAdminAction("Agregó material", "resources", data.title.trim());
      closeMaterialModal();
      showToast("Material agregado", "Material agregado correctamente al repositorio académico.", "success");
      openSubject(data.subject);
      renderAll();
      scrollToCreatedItem(`[data-material-id="${CSS.escape(created.id)}"]`);
    }

    function validateMaterialUrlField() {
      if (!el.materialUrl) return;
      const label = el.materialUrl.closest("label");
      const note = label?.querySelector(".field-note");
      const value = el.materialUrl.value.trim();
      label?.classList.remove("url-valid", "url-invalid");
      if (!value) {
        if (note) note.textContent = "Pega aquí el enlace compartido. El portal lo convertirá automáticamente en vista previa dentro de la página.";
        return;
      }
      const valid = isValidMaterialUrl(value);
      label?.classList.add(valid ? "url-valid" : "url-invalid");
      if (note) note.textContent = valid ? "Enlace válido. Se podrá abrir o previsualizar desde el portal." : "Enlace no válido. Usa Google Drive, Google Docs o un enlace directo a PDF.";
    }

    function isValidMaterialUrl(value) {
      try {
        const url = new URL(String(value || "").trim());
        return /^https?:$/.test(url.protocol) && (/drive\.google\.com|docs\.google\.com/i.test(url.hostname) || /\.pdf(?:$|\?)/i.test(url.pathname));
      } catch {
        return /^\/uploads\/[a-f0-9]+\.pdf$/.test(String(value || ""));
      }
    }

    function scrollToCreatedItem(selector) {
      setTimeout(() => {
        const node = document.querySelector(selector);
        node?.scrollIntoView({ behavior: motionBehavior(), block: "center" });
        node?.classList.add("just-created");
        setTimeout(() => node?.classList.remove("just-created"), 2200);
      }, 180);
    }

    function syllabusDownloadUrl(fileId) {
      return `${SYLLABUS_DOWNLOAD_BASE_URL}${encodeURIComponent(fileId || "")}`;
    }

    function syllabusViewerUrl(fileId) {
      const sourceUrl = syllabusDownloadUrl(fileId);
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(sourceUrl)}`;
    }

    function syllabusCycleId(row) {
      return SYLLABUS_CYCLE_BY_SUBJECT[normalize(row.subject)] || "otros-silabos";
    }

    function syllabusCycleName(cycleId) {
      return findCycle(cycleId)?.name || "Electivas y complementarias";
    }

    function syllabusPrettySubject(value) {
      const overrides = {
        [normalize("ALGEBRA LINEAL")]: "Álgebra Lineal",
        [normalize("MATEMÁTICAS-1")]: "Matemáticas I",
        [normalize("MATEMÁTICAS-2")]: "Matemáticas II",
        [normalize("INTRODUCCION A LA MICROECONOMIA")]: "Introducción a la Microeconomía",
        [normalize("ECONOMETRIA III")]: "Econometría III",
        [normalize("UNIDAD DE INTEGRACIÒN CURRICULAR I")]: "Unidad de Integración Curricular I",
        [normalize("UNIDAD DE INTEGRACIÒN CURRICULAR II")]: "Unidad de Integración Curricular II",
        [normalize("PRACTICA LABORAL I")]: "Práctica Laboral I",
        [normalize("PRACTICAS LABORALES II")]: "Prácticas Laborales II",
        [normalize("DISEÑO Y EVALUACIÓN DE PROGRAMAS Y POLÍTICAS PUBLICAS")]: "Diseño y Evaluación de Programas y Políticas Públicas"
      };
      const key = normalize(value);
      if (overrides[key]) return overrides[key];
      return String(value || "")
        .toLocaleLowerCase("es-EC")
        .replace(/(^|[\s-])([a-záéíóúüñ])/g, (_, spacer, letter) => `${spacer}${letter.toLocaleUpperCase("es-EC")}`)
        .replace(/\b(De|Del|La|Las|Los|Y|A|Al|El)\b/g, (word) => word.toLocaleLowerCase("es-EC"))
        .replace(/\bIi\b/g, "II")
        .replace(/\bIii\b/g, "III")
        .replace(/\bIv\b/g, "IV")
        .replace(/\bI\b/g, "I");
    }

    function syllabusGroups() {
      const grouped = new Map();
      OFFICIAL_SYLLABUS_ROWS.forEach((row) => {
        const key = normalize(row.subject);
        const cycleId = syllabusCycleId(row);
        if (!grouped.has(key)) {
          grouped.set(key, {
            key,
            subject: row.subject,
            title: syllabusPrettySubject(row.subject),
            cycleId,
            cycleName: syllabusCycleName(cycleId),
            code: row.code,
            period: row.period,
            rows: []
          });
        }
        grouped.get(key).rows.push({ ...row, cycleId, cycleName: syllabusCycleName(cycleId) });
      });
      const cycleOrder = [...CYCLES.map((cycle) => cycle.id), "otros-silabos"];
      return [...grouped.values()].sort((a, b) => {
        const cycleDiff = cycleOrder.indexOf(a.cycleId) - cycleOrder.indexOf(b.cycleId);
        return cycleDiff || a.title.localeCompare(b.title, "es");
      });
    }

    function filteredSyllabusGroups() {
      const query = normalize(syllabusState.search || "");
      const cycle = syllabusState.cycleFilter || "all";
      return syllabusGroups().filter((group) => {
        const cycleMatch = cycle === "all" || group.cycleId === cycle;
        const haystack = normalize(`${group.title} ${group.subject} ${group.cycleName} ${group.code} ${group.rows.map((row) => `${row.teacher} grupo ${row.group}`).join(" ")}`);
        return cycleMatch && (!query || haystack.includes(query));
      });
    }

    function curriculumSyllabusSubjects() {
      const query = normalize(syllabusState.search || "");
      const cycle = syllabusState.cycleFilter || "all";
      return CYCLES.flatMap((item) => item.subjects.map((subject) => ({
        title: typeof subject === "string" ? subject : subject.name,
        cycleId: item.id,
        cycleName: item.name
      }))).filter((subject) => {
        const cycleMatch = cycle === "all" || subject.cycleId === cycle;
        const textMatch = !query || normalize(`${subject.title} ${subject.cycleName}`).includes(query);
        return cycleMatch && textMatch;
      });
    }

    function createCurriculumSubjectCard(subject) {
      const article = document.createElement("article");
      article.className = "syllabus-card curriculum-subject-card";
      article.dataset.syllabusCycle = subject.cycleId;

      const head = document.createElement("div");
      head.className = "syllabus-card-head";
      const cycleBadge = document.createElement("span");
      cycleBadge.className = "syllabus-cycle-badge";
      cycleBadge.textContent = subject.cycleName;
      const sourceBadge = document.createElement("span");
      sourceBadge.className = "syllabus-code";
      sourceBadge.textContent = "Malla ADE";
      head.append(cycleBadge, sourceBadge);

      const title = document.createElement("h3");
      title.textContent = subject.title;
      const description = document.createElement("p");
      description.textContent = "Entra al buscador oficial para revisar si el sílabo de esta materia está publicado para el periodo vigente.";
      const meta = document.createElement("div");
      meta.className = "syllabus-card-meta";
      ["Administración de Empresas", "Plan de estudios"].forEach((label) => {
        const item = document.createElement("span");
        item.textContent = label;
        meta.appendChild(item);
      });
      const actions = document.createElement("div");
      actions.className = "syllabus-primary-actions";
      const official = document.createElement("a");
      official.className = "btn-primary";
      official.href = SYLLABUS_OFFICIAL_URL;
      official.target = "_blank";
      official.rel = "noopener noreferrer";
      official.textContent = "Buscar sílabo oficial ↗";
      actions.appendChild(official);

      article.append(head, title, description, meta, actions);
      return article;
    }

    function renderSyllabiSection() {
      if (!el.syllabusGrid) return;
      if (el.syllabusSearch) syllabusState.search = el.syllabusSearch.value || "";
      if (el.syllabusCycleFilter) syllabusState.cycleFilter = el.syllabusCycleFilter.value || "all";
      if (el.syllabusOfficialLink) el.syllabusOfficialLink.href = SYLLABUS_OFFICIAL_URL;

      if (!OFFICIAL_SYLLABUS_ROWS.length) {
        const subjects = curriculumSyllabusSubjects();
        const pageCount = Math.max(1, Math.ceil(subjects.length / SYLLABUS_PAGE_SIZE));
        syllabusState.page = Math.min(Math.max(0, syllabusState.page || 0), pageCount - 1);
        const start = syllabusState.page * SYLLABUS_PAGE_SIZE;
        const pageSubjects = subjects.slice(start, start + SYLLABUS_PAGE_SIZE);
        const rangeStart = subjects.length ? start + 1 : 0;
        const rangeEnd = Math.min(start + SYLLABUS_PAGE_SIZE, subjects.length);
        if (el.syllabusStatus) {
          el.syllabusStatus.innerHTML = DOMPurify.sanitize(`
            <div class="syllabus-status-metrics">
              <span><strong>${subjects.length}</strong> materias encontradas</span>
              <span><strong>${CYCLES.length}</strong> ciclos en la malla</span>
              <span><strong>UCuenca</strong> fuente académica</span>
            </div>
            <div class="syllabus-pager" aria-label="Navegación de materias">
              <span>Mostrando ${rangeStart}-${rangeEnd} de ${subjects.length} materias</span>
              <div>
                <button class="btn-secondary" type="button" data-syllabus-page="prev" ${syllabusState.page <= 0 ? "disabled" : ""}>Anterior</button>
                <strong>Página ${syllabusState.page + 1}/${pageCount}</strong>
                <button class="btn-secondary" type="button" data-syllabus-page="next" ${syllabusState.page >= pageCount - 1 ? "disabled" : ""}>Siguiente</button>
              </div>
            </div>
            <p>La lista ayuda a ubicar cada materia por ciclo. Los sílabos y sus archivos vigentes se consultan en el buscador oficial.</p>
          `);
        }
        el.syllabusGrid.textContent = "";
        if (pageSubjects.length) {
          const fragment = document.createDocumentFragment();
          pageSubjects.forEach((subject) => fragment.appendChild(createCurriculumSubjectCard(subject)));
          el.syllabusGrid.appendChild(fragment);
        } else {
          el.syllabusGrid.innerHTML = DOMPurify.sanitize(renderEmpty("No encontramos materias", "Prueba con otro término o selecciona todos los ciclos."));
        }
        return;
      }

      const groups = filteredSyllabusGroups();
      const totalSubjects = syllabusGroups().length;
      const totalGroups = OFFICIAL_SYLLABUS_ROWS.length;
      const visibleFiles = groups.reduce((sum, group) => sum + group.rows.length, 0);
      const pageCount = Math.max(1, Math.ceil(groups.length / SYLLABUS_PAGE_SIZE));
      syllabusState.page = Math.min(Math.max(0, syllabusState.page || 0), pageCount - 1);
      const start = syllabusState.page * SYLLABUS_PAGE_SIZE;
      const pageGroups = groups.slice(start, start + SYLLABUS_PAGE_SIZE);
      const rangeStart = groups.length ? start + 1 : 0;
      const rangeEnd = Math.min(start + SYLLABUS_PAGE_SIZE, groups.length);
      if (el.syllabusStatus) {
        el.syllabusStatus.innerHTML = DOMPurify.sanitize(`
          <div class="syllabus-status-metrics">
            <span><strong>${groups.length}</strong> materias visibles</span>
            <span><strong>${visibleFiles}</strong> PDF de grupos</span>
            <span><strong>${SYLLABUS_PERIOD_LABEL}</strong> periodo oficial</span>
          </div>
          <div class="syllabus-pager" aria-label="Navegación de sílabos">
            <span>Mostrando ${rangeStart}-${rangeEnd} de ${groups.length}</span>
            <div>
              <button class="btn-secondary" type="button" data-syllabus-page="prev" ${syllabusState.page <= 0 ? "disabled" : ""}>Anterior</button>
              <strong>Página ${syllabusState.page + 1}/${pageCount}</strong>
              <button class="btn-secondary" type="button" data-syllabus-page="next" ${syllabusState.page >= pageCount - 1 ? "disabled" : ""}>Siguiente</button>
            </div>
          </div>
          <p>Base verificada desde el buscador oficial de sílabos UCuenca. Total del catálogo: ${totalSubjects} materias y ${totalGroups} archivos PDF. Revisa el buscador oficial si necesitas validar una actualización posterior.</p>
        `);
      }
      el.syllabusGrid.textContent = "";
      if (pageGroups.length) {
        el.syllabusGrid.appendChild(renderSyllabusCardsFragment(pageGroups));
      } else {
        el.syllabusGrid.innerHTML = DOMPurify.sanitize(renderEmpty("Sin sílabos para este filtro", "Prueba con otra materia, docente o selecciona todos los ciclos."));
      }
    }

    function renderSyllabusCardsFragment(groups) {
      const fragment = document.createDocumentFragment();
      groups.forEach((group) => fragment.appendChild(createSyllabusCardElement(group)));
      return fragment;
    }

    function createSyllabusCardElement(group) {
      const primary = group.rows[0] || {};
      const article = document.createElement("article");
      article.className = "syllabus-card";
      article.dataset.syllabusCycle = group.cycleId || "";

      const head = document.createElement("div");
      head.className = "syllabus-card-head";
      const cycleBadge = document.createElement("span");
      cycleBadge.className = "syllabus-cycle-badge";
      cycleBadge.textContent = group.cycleName;
      const code = document.createElement("span");
      code.className = "syllabus-code";
      code.textContent = `Cod. ${group.code}`;
      head.append(cycleBadge, code);

      const title = document.createElement("h3");
      title.textContent = group.title;
      const description = document.createElement("p");
      description.textContent = `Sílabo oficial de ${SYLLABUS_CAREER_LABEL} para ${group.period}. Disponible por grupo y docente.`;

      const meta = document.createElement("div");
      meta.className = "syllabus-card-meta";
      [`${group.rows.length} ${group.rows.length === 1 ? "grupo" : "grupos"}`, "Pregrado", "PDF oficial"].forEach((label) => {
        const item = document.createElement("span");
        item.textContent = label;
        meta.appendChild(item);
      });

      const actions = document.createElement("div");
      actions.className = "syllabus-primary-actions";
      const preview = document.createElement("button");
      preview.className = "btn-primary";
      preview.type = "button";
      preview.dataset.syllabusFile = primary.fileId || "";
      preview.textContent = "Ver primer PDF";
      const official = document.createElement("a");
      official.className = "btn-secondary";
      official.href = SYLLABUS_OFFICIAL_URL;
      official.target = "_blank";
      official.rel = "noopener noreferrer";
      official.textContent = "Fuente oficial";
      actions.append(preview, official);

      const details = document.createElement("details");
      details.className = "syllabus-group-list";
      if (group.rows.length <= 2) details.open = true;
      const summary = document.createElement("summary");
      summary.textContent = "PDF por grupo";
      const rowsWrap = document.createElement("div");
      group.rows.forEach((row) => {
        const rowNode = document.createElement("div");
        rowNode.className = "syllabus-group-row";
        const rowInfo = document.createElement("div");
        const rowGroup = document.createElement("strong");
        rowGroup.textContent = `Grupo ${row.group}`;
        const teacher = document.createElement("span");
        teacher.textContent = row.teacher;
        rowInfo.append(rowGroup, teacher);
        const rowActions = document.createElement("div");
        rowActions.className = "syllabus-group-actions";
        const rowPreview = document.createElement("button");
        rowPreview.className = "link-button primary-preview";
        rowPreview.type = "button";
        rowPreview.dataset.syllabusFile = row.fileId;
        rowPreview.textContent = "Ver PDF";
        const download = document.createElement("a");
        download.className = "link-button";
        download.href = syllabusDownloadUrl(row.fileId);
        download.target = "_blank";
        download.rel = "noopener noreferrer";
        download.download = "";
        download.textContent = "Descargar";
        rowActions.append(rowPreview, download);
        rowNode.append(rowInfo, rowActions);
        rowsWrap.appendChild(rowNode);
      });
      details.append(summary, rowsWrap);

      article.append(head, title, description, meta, actions, details);
      return article;
    }

    function handleSyllabusPagerClick(event) {
      const button = event.target.closest("[data-syllabus-page]");
      if (!button) return;
      const direction = button.dataset.syllabusPage;
      const total = OFFICIAL_SYLLABUS_ROWS.length ? filteredSyllabusGroups().length : curriculumSyllabusSubjects().length;
      const pageCount = Math.max(1, Math.ceil(total / SYLLABUS_PAGE_SIZE));
      syllabusState.page = direction === "next"
        ? Math.min(pageCount - 1, (syllabusState.page || 0) + 1)
        : Math.max(0, (syllabusState.page || 0) - 1);
      renderSyllabiSection();
      el.syllabusGrid?.scrollIntoView({ behavior: motionBehavior(), block: "start" });
    }

    
    function handleSyllabusClick(event) {
      const pdfButton = event.target.closest("[data-syllabus-file]");
      if (!pdfButton) return;
      event.preventDefault();
      openSyllabusPdfModal(pdfButton.dataset.syllabusFile);
    }

    function openSyllabusPdfModal(fileId) {
      const row = OFFICIAL_SYLLABUS_ROWS.find((item) => item.fileId === fileId);
      if (!row) return showToast("Sílabo no encontrado", "No se pudo ubicar el PDF seleccionado.", "error");
      const title = `${syllabusPrettySubject(row.subject)} · Grupo ${row.group}`;
      const downloadUrl = syllabusDownloadUrl(row.fileId);
      const overlay = document.createElement("div");
      overlay.className = "pdf-modal syllabus-pdf-modal";
      overlay.innerHTML = DOMPurify.sanitize(`<div class="pdf-modal-backdrop" data-close-pdf></div>
        <article class="pdf-modal-card" role="dialog" aria-modal="true" aria-label="Vista previa de sílabo">
          <header class="pdf-modal-header">
            <div>
              <span class="section-tag">Sílabo oficial UCuenca</span>
              <h2>${escapeHtml(title)}</h2>
              <p>${escapeHtml(syllabusCycleName(syllabusCycleId(row)))} · ${escapeHtml(row.period)} · ${escapeHtml(row.teacher)}</p>
            </div>
            <button class="icon-only" type="button" data-close-pdf aria-label="Cerrar PDF">×</button>
          </header>
          <div class="pdf-modal-frame">
            <iframe src="${escapeAttribute(syllabusViewerUrl(row.fileId))}" title="${escapeAttribute(title)}" loading="lazy" allowfullscreen></iframe>
          </div>
          <div class="pdf-modal-help">Vista integrada mediante Google Docs Viewer usando el PDF oficial de UCuenca. Si no carga, usa “Abrir PDF” o “Descargar”.</div>
          <footer class="pdf-modal-actions">
            <button class="btn-secondary" type="button" data-fullscreen-pdf>Pantalla completa</button>
            <a class="btn-secondary" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noopener noreferrer">Abrir PDF</a>
            <a class="btn-primary" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noopener noreferrer" download>Descargar</a>
          </footer>
        </article>`);
      document.body.appendChild(overlay);
      overlay.querySelectorAll("[data-close-pdf]").forEach((node) => node.addEventListener("click", () => overlay.remove()));
      overlay.querySelector("[data-fullscreen-pdf]")?.addEventListener("click", () => overlay.querySelector("iframe")?.requestFullscreen?.());
    }

    function renderTutorias() {
      const adminPanel = isAdmin ? `<article class="portal-card admin-section-panel"><h3>Inscripciones recibidas</h3><p>${countMessages("Tutoría")} solicitudes guardadas. Gestiona estados y exporta CSV desde el panel administrador.</p><button class="card-action" type="button" data-open-admin-shortcut="mensajes">Abrir bandeja</button></article>` : "";
      const suggestion = renderSuggestionCard("Tutorías", "Cuéntanos qué materia, horario o modalidad necesitas reforzar.");
      el.tutoriasContainer.innerHTML = DOMPurify.sanitize(appData.tutorias.filter(item=>!item.hidden).map((item) => `<article class="portal-card tutoria-card"><span class="portal-card-icon">${item.nivel.slice(0, 2).toUpperCase()}</span><h3>${escapeHtml(item.materia)}</h3><p>${escapeHtml(tutoriaDescription(item))}</p><div class="portal-card-meta"><span>${escapeHtml(item.nivel)}</span><span>${escapeHtml(item.modalidad)}</span><span>${escapeHtml(item.horario)}</span><span>${escapeHtml(item.tutor)}</span></div><div class="tutoria-actions"><button class="btn-secondary" type="button" data-open-syllabus="${item.id}">Mini sílabo</button><button class="card-action" data-open-request="tutoria" data-context="${item.id}">Inscribirme</button></div></article>`).join("") + suggestion + adminPanel);
      el.tutoriasContainer.querySelectorAll("[data-open-request]").forEach((btn) => btn.addEventListener("click", () => openRequestModal("tutoria", btn.dataset.context)));
      el.tutoriasContainer.querySelectorAll("[data-open-syllabus]").forEach((btn) => btn.addEventListener("click", () => openTutorialSyllabus(btn.dataset.openSyllabus)));
      el.tutoriasContainer.querySelectorAll("[data-open-admin-shortcut]").forEach((btn) => btn.addEventListener("click", () => { adminTab = btn.dataset.openAdminShortcut; openAdminPanel(); }));
    }

    function tutoriaDescription(item) {
      if (normalize(item.materia).includes("econometria")) {
        return item.syllabus || "Refuerzo de regresión lineal, supuestos del modelo, interpretación de coeficientes y lectura de resultados econométricos con enfoque aplicado.";
      }
      return item.tema || item.syllabus || "Refuerzo académico guiado con ejercicios y revisión de dudas frecuentes.";
    }

    function openTutorialSyllabus(id) {
      const item = (appData.tutorias || []).find((row) => row.id === id);
      if (!item) return;
      const overlay = document.createElement("div");
      overlay.className = "syllabus-modal";
      overlay.innerHTML = DOMPurify.sanitize(`<article class="syllabus-card" role="dialog" aria-modal="true" aria-labelledby="syllabusTitle">
        <button class="syllabus-back" type="button" data-close-syllabus>← Atrás a tutorías</button>
        <span class="section-tag">Mini sílabo</span>
        <h3 id="syllabusTitle">${escapeHtml(item.materia)}</h3>
        <p>${escapeHtml(item.syllabus || item.tema || "Contenido por definir.")}</p>
        <dl>
          <div><dt>Tutor</dt><dd>${escapeHtml(item.tutor || "Tutor por definir")}</dd></div>
          <div><dt>Horario</dt><dd>${escapeHtml(item.horario || "Horario por definir")}</dd></div>
          <div><dt>Modalidad</dt><dd>${escapeHtml(item.modalidad || "Modalidad por definir")}</dd></div>
          <div><dt>Domina</dt><dd>${escapeHtml(item.domina || "Temas centrales de la materia y resolución de ejercicios.")}</dd></div>
        </dl>
        <div class="modal-actions"><button class="btn-secondary" type="button" data-close-syllabus>Volver</button><button class="btn-primary" type="button" data-open-request-from-syllabus="${item.id}">Inscribirme</button></div>
      </article>`);
      const close = () => {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
      };
      const onKeydown = (event) => { if (event.key === "Escape") close(); };
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-close-syllabus]")) close();
        const request = event.target.closest("[data-open-request-from-syllabus]");
        if (request) {
          close();
          openRequestModal("tutoria", request.dataset.openRequestFromSyllabus);
        }
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      overlay.querySelector("[data-close-syllabus]")?.focus();
    }

    function renderIntroClasses() {
      if (!el.introClassesContainer) return;
      const adminPanel = isAdmin ? `<article class="portal-card admin-section-panel"><h3>Gestión de introductorios</h3><p>Agrega, edita o elimina mini-cursos desde el panel administrador.</p><button class="card-action" type="button" data-open-admin-shortcut="introClasses">Administrar intro</button></article>` : "";
      el.introClassesContainer.innerHTML = DOMPurify.sanitize((appData.introClasses || []).filter(item=>!item.hidden).map((item) => {
        const videoData = getYouTubeEmbed(item.videoUrl);
        const video = videoData ? `<div class="intro-video"><iframe src="${escapeAttribute(videoData)}" title="${escapeAttribute(item.materia)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : `<a class="card-action" href="${escapeAttribute(item.videoUrl)}" target="_blank" rel="noopener noreferrer">Abrir video</a>`;
        return `<article class="portal-card"><span class="portal-card-icon">IN</span><h3>${escapeHtml(item.materia)}</h3><p>${escapeHtml(item.descripcion)}</p><div class="portal-card-meta"><span>${escapeHtml(item.nivel || "Introductorio")}</span><span>${escapeHtml(item.tutor || "Tutor por definir")}</span></div>${video}</article>`;
      }).join("") + adminPanel);
      el.introClassesContainer.querySelectorAll("[data-open-admin-shortcut]").forEach((btn) => btn.addEventListener("click", () => { adminTab = btn.dataset.openAdminShortcut; openAdminPanel(); }));
    }

    async function answerMiniAiQuestion() {
      if (!el.aiResult || !el.aiQuestion) return;
      const question = el.aiQuestion.value.trim();
      if (!question) {
        el.aiResult.innerHTML = DOMPurify.sanitize(`<div class="mini-ai-empty"><strong>Escribe una pregunta</strong><span>Ejemplo: resuelve 2x² + 3x - 5 = 0, calcula interés compuesto de $1000 al 5% por 3 años, explica oferta y demanda, busca ejercicios de Álgebra Lineal.</span></div>`);
        return;
      }

      const subjectId = el.aiSubject?.value || "all";
      const mode = document.querySelector("#aiMode")?.value || "study";
      const useDeepDrive = document.querySelector("#aiDeepDrive")?.checked !== false;
      const useOnline = document.querySelector("#aiOnlineSearch")?.checked === true;
      const conversation = aiHistoryForBackend();
      el.aiResult.innerHTML = DOMPurify.sanitize(renderAiTypingIndicator("Analizando tu pregunta", "Primero intento resolver localmente; si es una pregunta abierta consulto Apps Script/Gemini con espera corta."));

      // Paso 1: Resolver localmente de inmediato (instantáneo)
      const docs = miniAiDocuments().filter((doc) => subjectId === "all" || !doc.subjectId || doc.subjectId === subjectId);
      const tokens = expandAiTokens(meaningfulTokens(question), question);
      const localMatches = rankMiniAiDocs(docs, tokens, question).slice(0, 10);
      const problemSolution = solveAcademicProblem(question, mode);
      const economicReasoning = buildEconomicReasoningAnswer(question, mode);

      // Paso 2: Si hay solución matemática, mostrar INMEDIATAMENTE sin esperar Drive/Gemini
      if (problemSolution) {
        const answer = buildPowerAiAnswer({ question, mode, matches: localMatches.slice(0, 6), problemSolution, economicReasoning: null, onlineNote: null, docsCount: docs.length, driveCount: 0 });
        el.aiResult.innerHTML = DOMPurify.sanitize(answer);
        rememberAiInteraction(question, htmlToPlainText(answer), { mode, source: "portal" });
        bindAiMaterialButtons();
        return;
      }

      // Paso 3: Drive, web y Gemini con espera corta. Primero se muestra una respuesta base.
      const withTimeout = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
      const [driveMatches, onlineNote] = await Promise.all([
        useDeepDrive ? withTimeout(searchDriveKnowledge(question, subjectId), 1300).then((value) => value || []) : Promise.resolve([]),
        useOnline ? withTimeout(fetchOnlineKnowledge(question), 1400) : Promise.resolve(null)
      ]);
      const allMatches = mergeMiniAiMatches(localMatches, driveMatches).slice(0, 12);

      const hasBaseAnswer = allMatches.length || onlineNote || economicReasoning;
      if (hasBaseAnswer) {
        el.aiResult.innerHTML = DOMPurify.sanitize(buildPowerAiAnswer({ question, mode, matches: allMatches, problemSolution, economicReasoning, onlineNote, docsCount: docs.length, driveCount: driveMatches.length }));
        bindAiMaterialButtons();
      } else {
        el.aiResult.innerHTML = DOMPurify.sanitize(renderAiTypingIndicator("Consultando asistente académico", "No encontré una coincidencia local fuerte; intento una respuesta breve con Apps Script."));
      }

      const geminiAnswer = DRIVE_REPOSITORY_API_URL
        ? await withTimeout(askGeminiAcademicAssistant({ question, subjectId, mode, matches: allMatches, problemSolution, economicReasoning, useWeb: useOnline, conversation }), useOnline ? 2800 : 2200)
        : null;
      if (geminiAnswer?.ok && (geminiAnswer.text || geminiAnswer.answer)) {
        el.aiResult.innerHTML = DOMPurify.sanitize(renderGeminiAcademicAnswer({ payload: geminiAnswer, matches: allMatches, docsCount: docs.length, driveCount: driveMatches.length }));
        rememberAiInteraction(question, geminiAnswer.text || geminiAnswer.answer, { mode, source: "gemini" });
        bindAiMaterialButtons();
        return;
      }

      if (!hasBaseAnswer) {
        const suggestions = SUBJECTS.slice(0, 8).map((subject) => subject.name).join(", ");
        el.aiResult.innerHTML = DOMPurify.sanitize(`<article class="mini-ai-answer ai-detailed-answer ai-pro-answer"><strong>No encontré suficiente información para responder bien.</strong><p>Prueba escribiendo la materia, el tema y el tipo de material. Por ejemplo: "ejercicios de Álgebra Lineal", "explica probabilidad condicional", "resuelve 2x² + 3x - 5 = 0".</p><div class="ai-recommendation"><strong>Materias disponibles:</strong><span>${escapeHtml(suggestions)}...</span></div></article>`);
        return;
      }
      rememberAiInteraction(question, htmlToPlainText(el.aiResult.innerHTML), { mode, source: "portal" });
    }

    function renderAiTypingIndicator(title, text) {
      return `<div class="mini-ai-empty ai-loading-card ai-typing-card"><strong>${escapeHtml(title)}<span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span></strong><span>${escapeHtml(text)}</span></div>`;
    }

    function aiHistoryForBackend() {
      return aiConversationHistory.slice(-(AI_CHAT_HISTORY_LIMIT * 2));
    }

    function rememberAiInteraction(question, answer, meta = {}) {
      const userText = words(question, 80);
      const assistantText = words(String(answer || "").replace(/\s+/g, " "), 180);
      if (!userText || !assistantText) return;
      aiConversationHistory = [
        ...aiConversationHistory,
        { role: "user", text: userText, mode: meta.mode || "study" },
        { role: "assistant", text: assistantText, source: meta.source || "portal" }
      ].slice(-(AI_CHAT_HISTORY_LIMIT * 2));
    }

    function htmlToPlainText(html) {
      const temp = document.createElement("div");
      temp.innerHTML = DOMPurify.sanitize(String(html || ""));
      return temp.textContent || temp.innerText || "";
    }

    function bindAiMaterialButtons() {
      el.aiResult?.querySelectorAll("[data-open-material]").forEach((btn) => btn.addEventListener("click", () => {
        const item = appData.resources.find((resource) => resource.id === btn.dataset.openMaterial);
        if (item) openMaterialPreview(item);
      }));
    }

    function openMaterialPreview(item) {
      if (!item) return;
      if (isPdfResource(item)) {
        openPdfModal(item.id);
        return;
      }
      const url = materialOpenUrl(item) || item.url || item.previewUrl || item.downloadUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        showToast("Vista no disponible", "Este material no tiene enlace de vista previa.", "error");
      }
    }

    function renderMerch() {
      const adminPanel = isAdmin ? `<article class="portal-card admin-section-panel"><h3>Reservas recibidas</h3><p>${countMessages("Merch")} reservas guardadas. Gestiona estados y exporta CSV desde el panel administrador.</p><button class="card-action" type="button" data-open-admin-shortcut="mensajes">Abrir reservas</button></article>` : "";
      el.merchContainer.innerHTML = DOMPurify.sanitize(appData.merch.filter(item=>!item.hidden).map((item) => `<article class="portal-card"><span class="portal-card-icon">ME</span><h3>${escapeHtml(item.nombre)}</h3><p>${escapeHtml(item.descripcion)}</p>${(item.videos || "").split(";").map((url) => url.trim()).filter(Boolean).map((url) => { const embed = getYouTubeEmbed(url); return embed ? `<div class="intro-video"><iframe src="${escapeAttribute(embed)}" title="Video de ${escapeAttribute(item.nombre)}" loading="lazy" allowfullscreen></iframe></div>` : `<a class="card-action" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">Ver video del producto ↗</a>`; }).join("")}<div class="portal-card-meta"><span>${escapeHtml(item.precio)}</span><span>Reserva</span></div><div class="inline-actions"><button class="btn-secondary" data-open-gallery="${item.id}" type="button">Ver diseño</button><button class="card-action" data-open-request="merch" data-context="${item.id}">Reservar</button></div></article>`).join("") + adminPanel);
      el.merchContainer.querySelectorAll("[data-open-request]").forEach((btn) => btn.addEventListener("click", () => openRequestModal("merch", btn.dataset.context)));
      el.merchContainer.querySelectorAll("[data-open-gallery]").forEach((btn) => btn.addEventListener("click", () => openGalleryModal(btn.dataset.openGallery)));
      el.merchContainer.querySelectorAll("[data-open-admin-shortcut]").forEach((btn) => btn.addEventListener("click", () => { adminTab = btn.dataset.openAdminShortcut; openAdminPanel(); }));
    }

    function renderTools() {
      if (!el.gpaCycle) return;
      if (!el.gpaCycle.value) el.gpaCycle.value = CYCLES[0].id;
      if (!el.scheduleCycle.value) el.scheduleCycle.value = SCHEDULE_CYCLES[0].id;
      populateGpaSubjects();
      populateScheduleSubjects();
      renderGpaRows();
      renderSchedule();
      updatePomodoroDisplay();
      renderCurriculum();
      renderFormulaBank();
      renderEconomicDataSources();
      renderMiniAiAssistant();
      renderStudyActivity();
      activateToolTab(activeToolPanelId || "toolCalculadora", false);
    }

    function renderEconomicDataSources() {
      if (!el.dataSourceGrid) return;
      const query = normalize(el.dataSourceSearch?.value || "");
      const activeCategory = dataSourceFilter || "Todas";
      const filtered = BUSINESS_DATA_SOURCES.filter((source) => {
        const categoryMatch = activeCategory === "Todas" || source.categories.includes(activeCategory);
        const haystack = normalize(`${source.name} ${source.description} ${source.type} ${source.categories.join(" ")}`);
        return categoryMatch && (!query || haystack.includes(query));
      });
      const pageCount = Math.max(1, Math.ceil(filtered.length / DATA_SOURCE_PAGE_SIZE));
      dataSourcePage = Math.min(Math.max(0, dataSourcePage || 0), pageCount - 1);
      const start = dataSourcePage * DATA_SOURCE_PAGE_SIZE;
      const pageSources = filtered.slice(start, start + DATA_SOURCE_PAGE_SIZE);
      const rangeStart = filtered.length ? start + 1 : 0;
      const rangeEnd = Math.min(start + DATA_SOURCE_PAGE_SIZE, filtered.length);

      if (el.dataSourceFilters) {
        el.dataSourceFilters.innerHTML = DOMPurify.sanitize(DATA_SOURCE_CATEGORIES.map((category) => `
          <button class="data-source-filter ${category === activeCategory ? "active" : ""}" type="button" data-data-source-filter="${escapeAttribute(category)}" aria-pressed="${category === activeCategory ? "true" : "false"}">${escapeHtml(category)}</button>
        `).join(""));
      }

      if (el.dataSourceSummary) {
        const categoryText = activeCategory === "Todas" ? "todas las categorías" : activeCategory;
        el.dataSourceSummary.innerHTML = DOMPurify.sanitize(`
          <div>
            <strong>${filtered.length}</strong><span> ${filtered.length === 1 ? "fuente encontrada" : "fuentes encontradas"} · ${escapeHtml(categoryText)}</span>
            <small>Mostrando ${rangeStart}-${rangeEnd} de ${filtered.length}</small>
          </div>
          <div class="data-source-pager" aria-label="Navegación de fuentes de datos">
            <button class="btn-secondary" type="button" data-data-source-page="prev" ${dataSourcePage <= 0 ? "disabled" : ""}>Anterior</button>
            <strong>${dataSourcePage + 1}/${pageCount}</strong>
            <button class="btn-secondary" type="button" data-data-source-page="next" ${dataSourcePage >= pageCount - 1 ? "disabled" : ""}>Siguiente</button>
          </div>
        `);
      }

      el.dataSourceGrid.innerHTML = DOMPurify.sanitize(pageSources.length
        ? pageSources.map(renderEconomicDataSourceCard).join("")
        : `<div class="empty-state data-source-empty"><div><strong>Sin fuentes para este filtro</strong><span>Prueba con otra palabra clave o selecciona “Todas”.</span></div></div>`);
    }

    function handleDataSourcePagerClick(event) {
      const button = event.target.closest("[data-data-source-page]");
      if (!button) return;
      const query = normalize(el.dataSourceSearch?.value || "");
      const activeCategory = dataSourceFilter || "Todas";
      const filtered = BUSINESS_DATA_SOURCES.filter((source) => {
        const categoryMatch = activeCategory === "Todas" || source.categories.includes(activeCategory);
        const haystack = normalize(`${source.name} ${source.description} ${source.type} ${source.categories.join(" ")}`);
        return categoryMatch && (!query || haystack.includes(query));
      });
      const pageCount = Math.max(1, Math.ceil(filtered.length / DATA_SOURCE_PAGE_SIZE));
      dataSourcePage = button.dataset.dataSourcePage === "next"
        ? Math.min(pageCount - 1, dataSourcePage + 1)
        : Math.max(0, dataSourcePage - 1);
      renderEconomicDataSources();
      el.dataSourceGrid?.scrollIntoView({ behavior: motionBehavior(), block: "start" });
    }

    function renderEconomicDataSourceCard(source) {
      return `<article class="data-source-card">
        <div class="data-source-card-head">
          <span class="data-source-tag">${escapeHtml(source.categories[0] || "Datos")}</span>
          <span class="data-source-domain">${escapeHtml(new URL(source.url).hostname.replace(/^www\./, ""))}</span>
        </div>
        <h4>${escapeHtml(source.name)}</h4>
        <p>${escapeHtml(source.description)}</p>
        <div class="data-source-type"><strong>Tipo de datos:</strong><span>${escapeHtml(source.type)}</span></div>
        <div class="data-source-categories">${source.categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}</div>
        <a class="btn-primary data-source-open" href="${escapeAttribute(source.url)}" target="_blank" rel="noopener noreferrer">Abrir fuente</a>
      </article>`;
    }

    function renderMiniAiAssistant() {
      if (!el.aiSubject) return;
      if (!el.aiSubject.value) el.aiSubject.innerHTML = DOMPurify.sanitize(`<option value="all">Todas las materias</option>${subjectOptionsHtml()}`);
      const docs = miniAiDocuments();
      const driveCount = visibleResources().filter((item) => item.source === DRIVE_RESOURCE_SOURCE).length;
      if (el.aiResult && !el.aiResult.innerHTML.trim()) {
        el.aiResult.innerHTML = DOMPurify.sanitize(`<div class="mini-ai-empty ai-ready-card"><strong>Asistente listo · ${docs.length} fuentes internas</strong><span>Conoce materias, ciclos, repositorio, fórmulas, docentes, oportunidades y libros registrados. También puede usar archivos sincronizados desde Drive (${driveCount}).</span><small>Consejo: pregunta “¿qué hay de Álgebra Lineal?”, “resume los exámenes de Matemáticas I” o “qué fórmulas tengo de Estadística I”.</small></div>`);
      }
      document.querySelector(".mini-ai-admin")?.classList.toggle("show", isAdmin);
    }

    function addMiniAiSource() {
      if (!isAdmin) return openAdminLogin();
      const title = el.aiSourceTitle?.value.trim();
      const text = el.aiSourceText?.value.trim();
      if (!title || !text) return showToast("Base incompleta", "Agrega título y extracto para guardar la fuente.", "error");
      const subjectId = el.aiSubject?.value && el.aiSubject.value !== "all" ? el.aiSubject.value : "";
      const sources = loadJson(AI_SOURCES_KEY, []);
      sources.unshift({ id: uid(), title, text, subjectId, date: new Date().toISOString().slice(0, 10) });
      studentStorage.setItem(AI_SOURCES_KEY, JSON.stringify(sources.slice(0, 80)));
      el.aiSourceTitle.value = "";
      el.aiSourceText.value = "";
      renderMiniAiAssistant();
      showToast("Fuente agregada", "La mini AI ya puede consultar ese extracto.", "success");
    }

    function miniAiDocuments() {
      const customSources = loadJson(AI_SOURCES_KEY, []);
      const resourceDocs = visibleResources().map((item) => ({
        id: item.id,
        kind: categoryLabel(item.typeId),
        title: item.title,
        text: `${item.title}. ${item.description || ""}. ${item.fileName || ""}. Ciclo: ${findCycle(item.cycleId)?.name || ""}. Materia: ${subjectName(item.cycleId, item.subjectId)}. Categoría: ${categoryLabel(item.typeId)}. Fuente: ${item.source === DRIVE_RESOURCE_SOURCE ? "Google Drive" : "Local"}. Fecha: ${formatDate(item.date)}.`,
        subjectId: item.subjectId,
        subjectName: subjectName(item.cycleId, item.subjectId),
        url: materialOpenUrl(item)
      }));
      const formulaDocs = formulaBankRows().map((item) => {
        const subject = SUBJECTS.find((subjectItem) => normalize(subjectItem.name) === normalize(item.materia) && normalize(subjectItem.cycleName) === normalize(item.ciclo));
        return {
          id: item.id,
          kind: `Fórmula · ${item.tipo || "Concepto"}`,
          title: `${item.materia}: ${item.tema}`,
          text: `${item.tema}. ${item.valor}. ${item.definicion || ""}. Uso: ${item.uso || ""}. Nivel: ${item.nivel || ""}. Etiquetas: ${(item.tags || []).join(", ")}. Materia: ${item.materia}. Ciclo: ${item.ciclo}.`,
          subjectId: subject?.id || "",
          subjectName: item.materia
        };
      });
      const glossaryDocs = glossaryTerms().map((term) => ({
        id: `glossary-${term.id}`,
        kind: `Glosario · ${term.category}`,
        title: term.term,
        text: `${term.term}. ${term.definition || ""}. ${term.formula ? `Fórmula o criterio: ${term.formula}.` : ""} Ejemplo: ${term.example || ""}. Uso académico: ${term.use || ""}. Nivel: ${term.difficulty || ""}. Términos relacionados: ${(term.relatedTerms || []).join(", ")}.`,
        subjectId: "",
        subjectName: term.category || ""
      }));
      const dataSourceDocs = BUSINESS_DATA_SOURCES.map((source) => ({
        id: `data-source-${slugify(source.name)}`,
        kind: `Fuente de datos · ${source.categories[0] || "Datos"}`,
        title: source.name,
        text: `${source.name}. ${source.description}. Tipo de datos: ${source.type}. Categorías: ${source.categories.join(", ")}. URL: ${source.url}.`,
        subjectId: "",
        subjectName: source.categories.join(", "),
        url: source.url
      }));
      const subjectDocs = SUBJECTS.map((subject) => ({
        id: `subject-${subject.id}`,
        kind: "Materia de la malla",
        title: subject.name,
        text: `${subject.name} pertenece a ${subject.cycleName}. En el repositorio puede tener apuntes, diapositivas, guías, ejercicios resueltos, exámenes anteriores, lecturas, videos, clases grabadas, proyectos y material adicional.`,
        subjectId: subject.id,
        subjectName: subject.name
      }));
      const tutorDocs = (appData.tutorias || []).map((item) => ({
        id: item.id,
        kind: "Tutoría",
        title: `Tutoría: ${item.materia}`,
        text: `${item.materia}. Tema: ${item.tema || ""}. Nivel: ${item.nivel || ""}. Horario: ${item.horario || ""}. Modalidad: ${item.modalidad || ""}. Tutor: ${item.tutor || ""}. ${item.syllabus || ""}. Domina: ${item.domina || ""}.`,
        subjectId: subjectByName(item.materia)?.id || "",
        subjectName: item.materia
      }));
      const eventDocs = [...(appData.oportunidades || [])].map((item) => ({
        id: item.id,
        kind: item.tipo ? "Oportunidad" : "Evento",
        title: item.titulo,
        text: `${item.titulo}. ${item.descripcion || ""}. Fecha: ${formatDate(item.fecha)}. Lugar o institución: ${item.lugar || item.institucion || ""}. Tipo: ${item.tipo || "Evento"}.`,
        subjectId: "",
        subjectName: "",
        url: item.link || ""
      }));
      const careerDocs = (appData.carreraCards || []).map((card) => ({
        id: card.id,
        kind: "Información de carrera",
        title: card.titulo,
        text: `${card.titulo}. ${card.resumen || ""}. ${card.detalle || ""}`,
        subjectId: "",
        subjectName: ""
      }));
      const bookDocs = (appData.physicalBooks || []).map((book) => ({
        id: book.id,
        kind: "Libro físico",
        title: book.titulo,
        text: `${book.titulo}. ${book.autor || ""}. ${book.descripcion || ""}. ${book.estado || ""}`,
        subjectId: "",
        subjectName: ""
      }));
      const sourceDocs = customSources.map((source) => ({
        id: source.id,
        kind: "Extracto de libro",
        title: source.title,
        text: source.text,
        subjectId: source.subjectId || "",
        subjectName: subjectById(source.subjectId)?.name || ""
      }));
      return [...sourceDocs, ...resourceDocs, ...formulaDocs, ...glossaryDocs, ...dataSourceDocs, ...subjectDocs, ...tutorDocs, ...eventDocs, ...careerDocs, ...bookDocs].filter((doc) => doc.title && doc.text);
    }


    function subjectByName(name) {
      const normalized = normalize(name || "");
      return SUBJECTS.find((subject) => normalize(subject.name) === normalized || normalized.includes(normalize(subject.name)) || normalize(subject.name).includes(normalized));
    }

    function meaningfulTokens(value) {
      return normalize(value).split(/\s+/).filter((word) => word.length > 2 && !["que", "con", "por", "para", "del", "los", "las", "una", "uno", "sobre", "como", "cual", "cuando", "donde"].includes(word));
    }

    function expandAiTokens(tokens, question = "") {
      const normalizedQuestion = normalize(question);
      const synonymGroups = [
        ["pib", "producto", "interno", "bruto", "produccion", "crecimiento"],
        ["inflacion", "precios", "ipc", "canasta", "salario", "real"],
        ["oferta", "demanda", "mercado", "equilibrio", "precio", "cantidad"],
        ["elasticidad", "sensibilidad", "precio", "ingreso", "demanda"],
        ["fiscal", "impuestos", "gasto", "presupuesto", "deficit", "deuda"],
        ["monetaria", "tasas", "interes", "liquidez", "credito", "banco", "central"],
        ["tributario", "sri", "impuesto", "recaudacion", "ruc", "contribuyente"],
        ["econometria", "regresion", "mco", "coeficiente", "variable", "modelo"],
        ["datos", "fuente", "base", "estadistica", "indicador", "dataset"]
      ];
      const expanded = new Set(tokens);
      synonymGroups.forEach((group) => {
        if (group.some((term) => normalizedQuestion.includes(term))) group.forEach((term) => expanded.add(term));
      });
      return [...expanded];
    }

    function scoreMiniAiDoc(doc, tokens) {
      const title = normalize(doc.title);
      const text = normalize(doc.text);
      return tokens.reduce((score, token) => score + (title.includes(token) ? 5 : 0) + (text.includes(token) ? 2 : 0), 0);
    }

    function bestMiniAiSnippets(doc, tokens) {
      const sentences = String(doc.text || "").split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
      return sentences
        .map((sentence) => ({ sentence, score: scoreMiniAiDoc({ title: doc.title, text: sentence }, tokens) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((item) => item.sentence);
    }

    
    function rankMiniAiDocs(docs, tokens, question) {
      return docs
        .map((doc) => ({ ...doc, score: scoreMiniAiDoc(doc, tokens), snippets: bestMiniAiSnippets(doc, tokens) }))
        .filter((doc) => doc.score > 0 || normalize(doc.title).includes(normalize(question)) || tokens.some((token) => normalize(doc.kind || "").includes(token)))
        .sort((a, b) => b.score - a.score);
    }

    function mergeMiniAiMatches(localMatches, driveMatches) {
      const seen = new Set();
      return [...(localMatches || []), ...(driveMatches || [])].filter((doc) => {
        const key = doc.id || doc.url || normalize(doc.title);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    async function searchDriveKnowledge(question, subjectId = "all") {
      if (!DRIVE_REPOSITORY_API_URL) return [];
      try {
        const endpoint = new URL(DRIVE_REPOSITORY_API_URL);
        endpoint.searchParams.set("mode", "search");
        endpoint.searchParams.set("q", question);
        endpoint.searchParams.set("limit", "8");
        if (subjectId && subjectId !== "all") {
          const subject = subjectById(subjectId);
          if (subject) endpoint.searchParams.set("subject", subject.name);
        }
        const payload = await readDriveRepositoryPayload(endpoint);
        const rows = payload.matches || payload.files || [];
        return rows.map((item) => {
          const mapped = mapDriveFileToResource(item) || item;
          return {
            id: mapped.id || item.id,
            kind: `Drive · ${categoryLabel(mapped.typeId || item.typeId || "adicional")}`,
            title: mapped.title || item.title || item.name || "Archivo de Drive",
            text: item.excerpt || mapped.description || `${mapped.title || item.name || "Archivo"}. Archivo encontrado en Google Drive. Materia: ${mapped.subjectName || item.subjectName || ""}. Categoría: ${categoryLabel(mapped.typeId || item.typeId || "adicional")}.`,
            subjectId: mapped.subjectId || item.subjectId || "",
            subjectName: mapped.subjectName || item.subjectName || "",
            url: mapped.previewUrl || mapped.url || item.previewUrl || item.viewUrl || "",
            resourceId: mapped.id || "",
            score: 18 + (item.score || 0)
          };
        });
      } catch (error) {
        console.warn("Búsqueda profunda en Drive no disponible", error);
        return [];
      }
    }

    async function fetchOnlineKnowledge(question) {
      const cleaned = buildOnlineSearchQuery(question);
      if (!cleaned || cleaned.length < 3) return null;
      try {
        const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=${encodeURIComponent(cleaned)}`;
        const searchResponse = await fetch(searchUrl, { cache: "force-cache" });
        if (!searchResponse.ok) return null;
        const searchData = await searchResponse.json();
        const page = searchData?.query?.search?.[0];
        if (!page?.title) return null;
        const summaryUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
        const summaryResponse = await fetch(summaryUrl, { cache: "force-cache" });
        if (!summaryResponse.ok) return null;
        const summary = await summaryResponse.json();
        return summary?.extract ? { title: summary.title || page.title, text: summary.extract } : null;
      } catch (error) {
        console.warn("Consulta en línea no disponible", error);
        return null;
      }
    }

    function buildOnlineSearchQuery(question) {
      const normalized = normalize(question);
      if (/\binflacion\b/.test(normalized)) return "inflación economía";
      if (/\bpib\b|producto interno bruto/.test(normalized)) return "producto interno bruto economía";
      if (/\boferta\b.*\bdemanda\b|\bdemanda\b.*\boferta\b/.test(normalized)) return "oferta y demanda economía";
      if (/\belasticidad\b/.test(normalized)) return "elasticidad economía";
      const filler = new Set(["explica", "explicar", "resumen", "resumir", "rapido", "detallado", "paso", "tema", "concepto", "definicion", "ayuda", "ejemplo", "ejercicio", "calcula", "resuelve"]);
      const tokens = expandAiTokens(meaningfulTokens(question), question).filter((token) => !filler.has(token)).slice(0, 6);
      return words(tokens.join(" "), 9);
    }

    async function askGeminiAcademicAssistant({ question, subjectId, mode, matches, problemSolution, economicReasoning, useWeb, conversation = [] }) {
      if (!DRIVE_REPOSITORY_API_URL) return null;
      try {
        const endpoint = new URL(DRIVE_REPOSITORY_API_URL);
        endpoint.searchParams.set("action", "askGemini");
        endpoint.searchParams.set("q", question);
        endpoint.searchParams.set("question", question);
        endpoint.searchParams.set("responseMode", mode || "study");
        endpoint.searchParams.set("web", useWeb ? "1" : "0");
        const subject = subjectId && subjectId !== "all" ? subjectById(subjectId) : null;
        endpoint.searchParams.set("subject", subject ? subject.name : "all");
        const history = (conversation || []).slice(-(AI_CHAT_HISTORY_LIMIT * 2)).map((item) => ({
          role: item.role,
          text: words(item.text || "", item.role === "assistant" ? 90 : 55),
          source: item.source || ""
        }));
        const context = {
          history,
          driveFiles: appData.resources
            .filter((item) => item.source === DRIVE_RESOURCE_SOURCE)
            .slice(0, 35)
            .map((item) => ({ title: words(item.title || item.fileName || "", 14), subjectName: subjectName(item.cycleId, item.subjectId), type: categoryLabel(item.typeId), url: materialOpenUrl(item) })),
          formulas: relevantFormulaContext(question, subjectId),
          reasoning: economicReasoning ? {
            title: economicReasoning.title,
            direct: economicReasoning.direct,
            mechanism: economicReasoning.mechanism,
            example: economicReasoning.example,
            caveat: economicReasoning.caveat
          } : null,
          matches: (matches || []).slice(0, 6).map((doc) => ({
            title: words(doc.title || "", 16),
            kind: doc.kind || "",
            subjectName: doc.subjectName || "",
            text: words(doc.text || "", 95),
            url: doc.url || ""
          })),
          problemSolution: problemSolution ? { summary: problemSolution.summary, steps: problemSolution.steps, result: problemSolution.result } : null
        };
        endpoint.searchParams.set("history", JSON.stringify(history).slice(0, 2800));
        endpoint.searchParams.set("context", JSON.stringify(context).slice(0, 7500));
        const payload = await readDriveRepositoryPayload(endpoint);
        return payload || null;
      } catch (error) {
        console.warn("Gemini académico no disponible", error);
        return null;
      }
    }

    function relevantFormulaContext(question, subjectId = "all") {
      const tokens = meaningfulTokens(question);
      const selectedSubject = subjectId && subjectId !== "all" ? subjectById(subjectId) : null;
      return formulaBankRows()
        .map((item) => {
          const subjectMatch = selectedSubject ? normalize(item.materia) === normalize(selectedSubject.name) : true;
          const text = `${item.materia} ${item.tema} ${item.valor} ${item.definicion} ${(item.tags || []).join(" ")}`;
          const score = (subjectMatch ? 4 : 0) + tokens.reduce((sum, token) => sum + (normalize(text).includes(token) ? 2 : 0), 0);
          return { item, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ item }) => ({ materia: item.materia, tema: item.tema, formula: item.valor, uso: item.uso || item.definicion || "" }));
    }

    function renderGeminiAcademicAnswer({ payload, matches, docsCount, driveCount }) {
      const materialMatches = (matches || []).filter((doc) => doc.url).slice(0, 4);
      const geminiText = formatGeminiText(payload.text || payload.answer || "");
      const setupNotice = payload.requiresApiKey ? `<div class="ai-online-note"><strong>Gemini no está configurado:</strong><p>Agrega GEMINI_API_KEY en las propiedades del Apps Script y vuelve a implementar la Web App.</p></div>` : "";
      const webLabel = payload.usedWeb ? " · búsqueda web activa" : "";
      return `
        <article class="mini-ai-answer ai-detailed-answer ai-pro-answer ai-gemini-answer">
          <div class="ai-answer-head">
            <span class="feature-badge recommended">Respuesta generada con Gemini</span>
            <small>${escapeHtml(payload.model || "Gemini")} · ${docsCount || 0} fuentes internas${driveCount ? ` · ${driveCount} resultados de Drive` : ""}${webLabel}</small>
          </div>
          <h4>Respuesta directa</h4>
          <div class="ai-main-response gemini-rich-text">${geminiText}</div>
          ${payload.usedDrive ? `<div class="ai-online-note"><strong>También revisé Drive:</strong><p>Se usaron materiales del repositorio como contexto para mejorar la respuesta.</p></div>` : ""}
          ${setupNotice}
          ${materialMatches.length ? renderAiMaterials(materialMatches) : ""}
          <div class="ai-next-steps"><strong>Consejo:</strong><span>Para mejores respuestas, pregunta con materia + tema + tipo de ayuda. Ejemplo: “resuelve paso a paso este sistema 2x2” o “explícame inflación con ejemplo actual”.</span></div>
        </article>`;
    }

    function formatGeminiText(text) {
      const clean = String(text || "").replace(/\r/g, "").trim();
      if (!clean) return "<p>No se generó respuesta.</p>";
      let html = "";
      let listType = "";
      let paragraph = [];
      const flushParagraph = () => {
        if (!paragraph.length) return;
        html += `<p>${formatInlineMarkdown(paragraph.join(" "))}</p>`;
        paragraph = [];
      };
      const closeList = () => {
        if (!listType) return;
        html += `</${listType}>`;
        listType = "";
      };
      clean.split("\n").forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) {
          flushParagraph();
          closeList();
          return;
        }
        const heading = line.match(/^(#{2,4})\s+(.+)/);
        if (heading) {
          flushParagraph();
          closeList();
          html += `<h5>${formatInlineMarkdown(heading[2])}</h5>`;
          return;
        }
        const ordered = line.match(/^\d+[.)]\s+(.+)/);
        const unordered = line.match(/^[-*]\s+(.+)/);
        if (ordered || unordered) {
          flushParagraph();
          const nextListType = ordered ? "ol" : "ul";
          if (listType !== nextListType) {
            closeList();
            html += `<${nextListType}>`;
            listType = nextListType;
          }
          html += `<li>${formatInlineMarkdown((ordered || unordered)[1])}</li>`;
          return;
        }
        closeList();
        paragraph.push(line);
      });
      flushParagraph();
      closeList();
      return html;
    }

    function formatInlineMarkdown(value) {
      return escapeHtml(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
        .replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>');
    }

    function buildPowerAiAnswer({ question, mode, matches, problemSolution, economicReasoning, onlineNote, docsCount, driveCount }) {
      const isMaterialMode = mode === "materials" || /material|pdf|archivo|drive|examen|gu[ií]a|diapositiva|apunte|libro/i.test(question);
      const mainText = composeDetailedAiResponse(question, matches, problemSolution, economicReasoning, onlineNote, mode);
      const materialMatches = matches.filter((doc) => doc.url).slice(0, 6);
      const conceptMatches = problemSolution ? [] : matches.filter((doc) => !doc.url).slice(0, 6);
      return `
        <article class="mini-ai-answer ai-detailed-answer ai-pro-answer">
          <div class="ai-answer-head">
            <span class="feature-badge recommended">Respuesta generada con el portal</span>
            <small>${matches.length} coincidencias · ${docsCount} fuentes internas${driveCount ? ` · ${driveCount} resultados de Drive` : ""}</small>
          </div>
          <h4>Respuesta directa</h4>
          <div class="ai-main-response">${mainText}</div>
          ${problemSolution ? renderProblemSolution(problemSolution) : ""}
          ${economicReasoning && !problemSolution ? renderEconomicReasoningBox(economicReasoning) : ""}
          ${isMaterialMode && materialMatches.length ? renderAiMaterials(materialMatches) : ""}
          ${conceptMatches.length ? renderAiKeyPoints(conceptMatches) : ""}
          ${onlineNote ? `<div class="ai-online-note"><strong>Apoyo en línea${onlineNote.title ? ` · ${escapeHtml(onlineNote.title)}` : ""}:</strong><p>${escapeHtml(words(onlineNote.text, 95))}</p></div>` : ""}
          <div class="ai-next-steps"><strong>Para mejorar la respuesta:</strong><span>Pregunta con tema + materia + tipo de ayuda. Ejemplo: “resuelve este ejercicio de matrices paso a paso” o “explícame elasticidad con un ejemplo”.</span></div>
        </article>`;
    }

    function composeDetailedAiResponse(question, matches, problemSolution, economicReasoning, onlineNote, mode) {
      if (problemSolution) {
        return `<p>${escapeHtml(problemSolution.summary)}</p>`;
      }
      if (economicReasoning) {
        return renderEconomicReasoningMain(economicReasoning, mode);
      }
      if (onlineNote && /explica|resumen|resumir|qu[eé]\s+es|definici[oó]n|concepto/i.test(question)) {
        return `<p>${escapeHtml(words(onlineNote.text, mode === "summary" ? 70 : 130))}</p>`;
      }
      if (!matches.length && onlineNote) {
        return `<p>${escapeHtml(words(onlineNote.text, mode === "summary" ? 55 : 120))}</p>`;
      }
      const snippets = matches.flatMap((doc) => (doc.snippets && doc.snippets.length ? doc.snippets : [doc.text]).map((snippet) => ({ doc, snippet }))).slice(0, 5);
      const merged = snippets.map(({ snippet }) => String(snippet || "").trim()).filter(Boolean).join(" ");
      if (/que hay|qu[eé] tengo|material|pdf|archivo|drive/i.test(question)) {
        return `<p>Encontré materiales relacionados en el portal. Los más relevantes aparecen abajo para abrirlos o verlos directamente. ${matches.length ? `La búsqueda coincide principalmente con ${escapeHtml(matches.slice(0, 3).map((doc) => doc.title).join(", "))}.` : ""}</p>`;
      }
      if (/formula|f[oó]rmula|ecuaci[oó]n|defin/i.test(question)) {
        return `<p>${escapeHtml(words(merged || "Encontré fórmulas y conceptos relacionados en el banco académico del portal.", mode === "summary" ? 55 : 140))}</p>`;
      }
      return `<p>${escapeHtml(words(merged || "Encontré información relacionada en el portal, pero falta más texto para elaborar una respuesta amplia.", mode === "summary" ? 60 : 155))}</p>`;
    }

    function renderProblemSolution(solution) {
      return `<div class="ai-solution-box"><strong>Desarrollo paso a paso</strong><ol>${solution.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>${solution.result ? `<div class="ai-final-result">Resultado: ${escapeHtml(solution.result)}</div>` : ""}</div>`;
    }

    function renderAiMaterials(materials) {
      return `<div class="ai-materials-box"><strong>Materiales útiles</strong><div class="ai-material-list">${materials.map((doc) => `<div class="ai-material-row"><span><b>${escapeHtml(words(doc.title, 8))}</b><small>${escapeHtml(doc.kind || "Material")} ${doc.subjectName ? `· ${escapeHtml(doc.subjectName)}` : ""}</small></span><div>${doc.resourceId ? `<button class="mini-action" type="button" data-open-material="${escapeAttribute(doc.resourceId)}">Ver PDF</button>` : ""}${doc.url ? `<a class="mini-action" href="${escapeAttribute(doc.url)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : ""}</div></div>`).join("")}</div></div>`;
    }

    function renderAiKeyPoints(matches) {
      return `<div class="ai-answer-grid"><div><strong>Puntos clave encontrados</strong><ul>${matches.slice(0, 5).map((doc) => `<li>${escapeHtml(words(doc.title, 10))}<small> (${escapeHtml(doc.kind || "Dato")}${doc.subjectName ? ` · ${escapeHtml(doc.subjectName)}` : ""})</small></li>`).join("")}</ul></div><div><strong>Cómo usar esta información</strong><ul><li>Revisa el material relacionado antes de estudiar.</li><li>Pide una explicación paso a paso si es un ejercicio.</li><li>Agrega extractos de libros en modo administrador para respuestas más profundas.</li></ul></div></div>`;
    }

    function buildEconomicReasoningAnswer(question, mode = "study") {
      const normalizedQuestion = normalize(question);
      const topic = economicReasoningTopics().find((item) => item.keys.some((key) => normalizedQuestion.includes(key)));
      if (!topic) return null;
      const asksComparison = /compara|diferencia|relacion|versus|vs|contrasta/.test(normalizedQuestion);
      const asksEssay = /ensayo|redacta|argumenta|analiza|critica|conclusion|introduccion/.test(normalizedQuestion);
      return {
        ...topic,
        mode,
        asksComparison,
        asksEssay,
        focus: asksEssay ? "respuesta argumentativa" : asksComparison ? "comparación conceptual" : "explicación aplicada"
      };
    }

    function renderEconomicReasoningMain(reasoning, mode = "study") {
      const mechanism = mode === "summary" ? reasoning.mechanism.slice(0, 2) : reasoning.mechanism;
      const essayLine = reasoning.asksEssay ? `<p><strong>Tesis sugerida:</strong> ${escapeHtml(reasoning.thesis || reasoning.direct)}</p>` : "";
      return `<p><strong>${escapeHtml(reasoning.title)}:</strong> ${escapeHtml(reasoning.direct)}</p>
        ${essayLine}
        <ul>${mechanism.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <p><strong>Ejemplo aplicado:</strong> ${escapeHtml(reasoning.example)}</p>`;
    }

    function renderEconomicReasoningBox(reasoning) {
      return `<div class="ai-reasoning-box">
        <strong>Marco de análisis académico</strong>
        <div class="ai-reasoning-grid">
          <span><b>Enfoque:</b> ${escapeHtml(reasoning.focus)}</span>
          <span><b>Variables clave:</b> ${escapeHtml(reasoning.variables.join(", "))}</span>
          <span><b>Precaución:</b> ${escapeHtml(reasoning.caveat)}</span>
          <span><b>Para redactar:</b> define, explica el mecanismo, usa evidencia y cierra con interpretación.</span>
        </div>
      </div>`;
    }

    function economicReasoningTopics() {
      return [
        {
          title: "PIB y crecimiento económico",
          keys: ["pib", "producto interno bruto", "crecimiento", "produccion agregada", "cuentas nacionales"],
          variables: ["producción", "precios", "consumo", "inversión", "gasto público", "sector externo"],
          direct: "el PIB mide el valor de los bienes y servicios finales producidos en una economía durante un periodo. Sirve para analizar el tamaño de la actividad económica, pero no resume por sí solo bienestar, desigualdad ni calidad ambiental.",
          thesis: "El PIB es una medida central de actividad económica, aunque debe complementarse con indicadores sociales, distributivos y ambientales para evaluar desarrollo.",
          mechanism: [
            "Por el enfoque del gasto se lee como C + I + G + X - M.",
            "Si aumenta la producción real, el PIB real crece; si suben precios, el PIB nominal puede crecer sin mayor producción.",
            "Para análisis académico conviene separar variación real, inflación y estructura sectorial."
          ],
          example: "si el PIB nominal aumenta 8% pero la inflación es 6%, el crecimiento real aproximado es cercano a 2%, no 8%.",
          caveat: "no confundir PIB nominal con PIB real ni PIB total con PIB per cápita."
        },
        {
          title: "Inflación",
          keys: ["inflacion", "ipc", "precios", "canasta", "salario real", "poder adquisitivo"],
          variables: ["nivel de precios", "salarios", "costos", "demanda agregada", "tipo de cambio", "expectativas"],
          direct: "la inflación es el aumento sostenido del nivel general de precios. Reduce poder adquisitivo cuando los ingresos no crecen al mismo ritmo y afecta decisiones de consumo, ahorro, inversión y política monetaria.",
          thesis: "La inflación debe analizarse por sus causas, persistencia y efectos distributivos, no solo por el dato porcentual.",
          mechanism: [
            "Puede originarse por exceso de demanda, aumentos de costos, depreciación cambiaria o expectativas.",
            "El banco central suele responder con política monetaria para moderar demanda y expectativas.",
            "El impacto no es igual para todos: hogares con ingresos fijos sufren más pérdida de poder de compra."
          ],
          example: "si los precios suben 10% y el salario nominal sube 4%, el salario real cae aproximadamente 6%.",
          caveat: "un alza puntual de un producto no equivale a inflación general sostenida."
        },
        {
          title: "Oferta, demanda y equilibrio",
          keys: ["oferta", "demanda", "equilibrio", "mercado", "precio", "cantidad demandada", "cantidad ofertada"],
          variables: ["precio", "cantidad", "ingreso", "costos", "preferencias", "tecnología", "impuestos"],
          direct: "el equilibrio de mercado surge donde la cantidad demandada coincide con la cantidad ofrecida. Cambios en ingreso, costos, impuestos o expectativas desplazan curvas y modifican precio y cantidad.",
          thesis: "El modelo oferta-demanda permite explicar cambios de precios si se identifica correctamente qué curva se desplaza y por qué.",
          mechanism: [
            "Un aumento de demanda eleva precio y cantidad de equilibrio, ceteris paribus.",
            "Un aumento de costos reduce oferta, eleva precio y baja cantidad.",
            "Un impuesto crea una brecha entre precio pagado y precio recibido, reduciendo transacciones."
          ],
          example: "si aumenta el ingreso y el bien es normal, la demanda se desplaza a la derecha y el precio tiende a subir.",
          caveat: "diferencia movimiento sobre la curva por precio y desplazamiento de la curva por otros factores."
        },
        {
          title: "Elasticidad",
          keys: ["elasticidad", "inelastica", "elastica", "sensibilidad", "precio de demanda", "ingreso de demanda"],
          variables: ["precio", "cantidad demandada", "ingreso", "sustitutos", "horizonte temporal"],
          direct: "la elasticidad mide qué tan sensible es una variable ante cambios porcentuales de otra. En demanda, permite estimar cuánto cambia la cantidad demandada cuando cambia el precio.",
          thesis: "La elasticidad es clave para interpretar ingresos, impuestos y respuesta de consumidores ante cambios de precios.",
          mechanism: [
            "Si |E| > 1, la demanda es elástica: la cantidad responde más que proporcionalmente.",
            "Si |E| < 1, la demanda es inelástica: la cantidad responde poco.",
            "Con demanda inelástica, un aumento de precio puede elevar ingreso total; con demanda elástica puede reducirlo."
          ],
          example: "si el precio sube 10% y la cantidad cae 20%, la elasticidad precio es -2 y la demanda es elástica.",
          caveat: "usa cambios porcentuales, no cambios absolutos; el signo suele interpretarse junto con el valor absoluto."
        },
        {
          title: "Política fiscal",
          keys: ["politica fiscal", "gasto publico", "impuestos", "deficit", "deuda publica", "presupuesto"],
          variables: ["gasto público", "impuestos", "déficit", "deuda", "multiplicador", "actividad económica"],
          direct: "la política fiscal usa gasto público e impuestos para influir en demanda agregada, distribución, provisión de bienes públicos y sostenibilidad de las finanzas públicas.",
          thesis: "La política fiscal tiene efectos macroeconómicos y distributivos, pero debe evaluarse junto con financiamiento, eficiencia y sostenibilidad.",
          mechanism: [
            "Una expansión fiscal aumenta demanda agregada en el corto plazo si eleva gasto o reduce impuestos.",
            "El efecto depende del multiplicador, capacidad ociosa, apertura externa y forma de financiamiento.",
            "Déficits persistentes pueden elevar deuda y restricciones futuras."
          ],
          example: "un programa de inversión pública puede aumentar empleo y producción, pero debe compararse con su costo y su impacto en deuda.",
          caveat: "no todo gasto tiene el mismo multiplicador ni toda reducción de impuestos tiene igual efecto."
        },
        {
          title: "Política monetaria",
          keys: ["politica monetaria", "tasa de interes", "liquidez", "credito", "banco central", "dinero"],
          variables: ["tasa de interés", "crédito", "inflación", "expectativas", "tipo de cambio", "liquidez"],
          direct: "la política monetaria actúa sobre tasas de interés, liquidez y expectativas para estabilizar precios y, según el marco institucional, apoyar actividad económica.",
          thesis: "La política monetaria afecta la economía por el canal del crédito, expectativas, tipo de cambio y decisiones de gasto intertemporal.",
          mechanism: [
            "Subir tasas encarece crédito, enfría consumo e inversión y puede moderar inflación.",
            "Bajar tasas estimula crédito y demanda, pero puede presionar precios o tipo de cambio.",
            "Su eficacia depende de credibilidad, sistema financiero y expectativas."
          ],
          example: "si el banco central sube tasas, una empresa puede posponer inversión porque financiarse cuesta más.",
          caveat: "en economías dolarizadas, el margen de política monetaria tradicional es más limitado."
        },
        {
          title: "Econometría y regresión",
          keys: ["econometria", "regresion", "mco", "coeficiente", "variable dependiente", "variable independiente", "heterocedasticidad"],
          variables: ["Y", "X", "coeficientes", "error", "significancia", "supuestos"],
          direct: "la econometría usa datos y modelos estadísticos para estimar relaciones económicas, contrastar hipótesis y medir efectos con evidencia.",
          thesis: "Una regresión es útil si la pregunta está bien planteada, los datos son adecuados y los supuestos se discuten con criterio económico.",
          mechanism: [
            "El coeficiente mide el cambio esperado en Y ante un cambio unitario en X, manteniendo constantes las demás variables.",
            "La significancia estadística no garantiza relevancia económica ni causalidad.",
            "Se deben revisar supuestos como exogeneidad, homocedasticidad, no multicolinealidad perfecta y especificación."
          ],
          example: "si el coeficiente de educación sobre salario es 0.08 en log-salario, un año adicional se asocia aproximadamente con 8% más salario.",
          caveat: "correlación no implica causalidad; identifica posible sesgo por variables omitidas o causalidad inversa."
        },
        {
          title: "Fuentes de datos económicos",
          keys: ["datos", "dataset", "base de datos", "fuentes", "indicadores", "estadisticas", "world bank", "bce", "inec", "sri", "cepal", "fmi", "faostat"],
          variables: ["institución", "indicador", "año", "país", "metodología", "enlace"],
          direct: "para trabajos académicos conviene usar fuentes oficiales, revisar metodología y citar institución, año, indicador y enlace de consulta.",
          thesis: "La calidad del análisis económico depende tanto del modelo como de la fuente y trazabilidad de los datos utilizados.",
          mechanism: [
            "Para Ecuador: BCE, INEC, SRI y Datos Abiertos Ecuador.",
            "Para comparaciones internacionales: Banco Mundial, IMF Data, CEPALSTAT, Our World in Data y FAOSTAT.",
            "Antes de descargar, verifica cobertura temporal, frecuencia, unidad de medida y cambios metodológicos."
          ],
          example: "para inflación de Ecuador puedes revisar BCE o INEC; para compararla con otros países puedes usar Banco Mundial o IMF Data.",
          caveat: "no mezcles series de instituciones distintas sin revisar definiciones y metodología."
        }
      ];
    }

    function solveAcademicProblem(question, mode = "study") {
      const q = normalizeMathText(question);

      // PIB por enfoque del gasto: PIB = C + I + G + X - M
      if (/pib|producto interno bruto|\bc\s*=.*\bi\s*=.*\bg\s*=/.test(normalize(q))) {
        const c = extractNamedNumber(q, "c");
        const i = extractNamedNumber(q, "i");
        const g = extractNamedNumber(q, "g");
        const x = extractNamedNumber(q, "x");
        const m = extractNamedNumber(q, "m");
        if ([c, i, g, x, m].every(Number.isFinite)) {
          const result = c + i + g + x - m;
          return {
            summary: "Calculo el PIB por el enfoque del gasto: PIB = C + I + G + X - M.",
            steps: [
              `Consumo (C) = ${c}, inversión (I) = ${i}, gasto público (G) = ${g}, exportaciones (X) = ${x}, importaciones (M) = ${m}.`,
              `Sustituimos: PIB = ${c} + ${i} + ${g} + ${x} - ${m}.`,
              `PIB = ${roundNumber(result)}.`,
              "Interpretación: este resultado mide el valor de la demanda agregada de bienes y servicios finales producidos internamente."
            ],
            result: `PIB = ${roundNumber(result)}`
          };
        }
      }

      // PORCENTAJE: 20% de 350 / 20 por ciento de 350
      const percent = q.match(/(-?\d+(?:[\.,]\d+)?)\s*(?:%|por\s+ciento)\s*(?:de|sobre|x|\*)\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (percent) {
        const p = parseNumber(percent[1]);
        const n = parseNumber(percent[2]);
        const result = n * p / 100;
        return { summary: `Para calcular ${p}% de ${n}, se convierte el porcentaje a decimal y se multiplica.`, steps: [`Convertimos ${p}% a decimal: ${p}/100 = ${p/100}.`, `Multiplicamos: ${n} × ${p/100} = ${roundNumber(result)}.`, `Interpretación: ${p}% de ${n} equivale a ${roundNumber(result)}.`], result: String(roundNumber(result)) };
      }

      const percentOfTotal = q.match(/(-?\d+(?:[\.,]\d+)?)\s*(?:es|representa|equivale\s+a)\s*(?:qu[eé]\s+porcentaje|cu[aá]nto\s+porcentaje|que\s+%)\s*(?:de|sobre)\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (percentOfTotal) {
        const part = parseNumber(percentOfTotal[1]);
        const total = parseNumber(percentOfTotal[2]);
        if (total !== 0) {
          const result = (part / total) * 100;
          return { summary: `Para saber qué porcentaje representa ${part} de ${total}, dividimos la parte para el total y multiplicamos por 100.`, steps: [`Dividimos: ${part} / ${total} = ${roundNumber(part / total)}.`, `Multiplicamos por 100: ${roundNumber(part / total)} × 100 = ${roundNumber(result)}%.`, `Interpretación: ${part} representa el ${roundNumber(result)}% de ${total}.`], result: `${roundNumber(result)}%` };
        }
      }

      // PROMEDIO / MEDIA
      if (/promedio|media/i.test(q)) {
        const nums = extractNumbers(q);
        if (nums.length >= 2) {
          const sum = nums.reduce((a, b) => a + b, 0);
          const avg = sum / nums.length;
          return { summary: `Calculo el promedio sumando los valores y dividiendo para la cantidad de datos.`, steps: [`Datos identificados: ${nums.join(", ")}.`, `Suma: ${nums.join(" + ")} = ${roundNumber(sum)}.`, `Cantidad de datos: ${nums.length}.`, `Promedio: ${roundNumber(sum)} / ${nums.length} = ${roundNumber(avg)}.`], result: String(roundNumber(avg)) };
        }
      }

      // ECUACIÓN CUADRÁTICA: ax² + bx + c = 0
      const quadratic = q.match(/(-?\d*(?:[\.,]\d+)?)\s*x\s*[²2^]\s*([+-]\s*\d*(?:[\.,]\d+)?)\s*x\s*([+-]\s*\d+(?:[\.,]\d+)?)\s*=\s*0/i);
      if (quadratic) {
        const a = quadratic[1] === "" || quadratic[1] === "+" ? 1 : quadratic[1] === "-" ? -1 : parseNumber(quadratic[1]);
        const b = quadratic[2] ? (quadratic[2].replace(/\s+/g, "") === "+" ? 1 : quadratic[2].replace(/\s+/g, "") === "-" ? -1 : parseNumber(quadratic[2].replace(/\s+/g, ""))) : 0;
        const c = quadratic[3] ? parseNumber(quadratic[3].replace(/\s+/g, "")) : 0;
        const discriminant = b * b - 4 * a * c;
        const steps = [`Ecuación identificada: ${a}x² ${b >= 0 ? "+" : ""}${b}x ${c >= 0 ? "+" : ""}${c} = 0.`, `Discriminante: Δ = b² − 4ac = ${b}² − 4(${a})(${c}) = ${roundNumber(discriminant)}.`];
        if (discriminant > 0) {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          steps.push(`Δ > 0: dos raíces reales.`, `x₁ = (−${b} + √${roundNumber(discriminant)}) / (2·${a}) = ${roundNumber(x1)}.`, `x₂ = (−${b} − √${roundNumber(discriminant)}) / (2·${a}) = ${roundNumber(x2)}.`);
          return { summary: `Ecuación cuadrática resuelta con la fórmula general. Tiene dos raíces reales distintas.`, steps, result: `x₁ = ${roundNumber(x1)}, x₂ = ${roundNumber(x2)}` };
        } else if (discriminant === 0) {
          const x = -b / (2 * a);
          steps.push(`Δ = 0: una raíz doble.`, `x = −${b} / (2·${a}) = ${roundNumber(x)}.`);
          return { summary: `Ecuación cuadrática con raíz doble.`, steps, result: `x = ${roundNumber(x)}` };
        } else {
          steps.push(`Δ < 0: no tiene raíces reales (raíces complejas).`);
          return { summary: `Ecuación cuadrática sin soluciones reales.`, steps, result: `Sin raíces reales (Δ = ${roundNumber(discriminant)})` };
        }
      }

      // SISTEMA 2x2: ax + by = c, dx + ey = f
      const sys = q.match(/(-?\d*(?:[\.,]\d+)?)\s*x\s*([+-]\s*\d*(?:[\.,]\d+)?)\s*y\s*=\s*(-?\d+(?:[\.,]\d+)?)\s*[,;y]\s*(-?\d*(?:[\.,]\d+)?)\s*x\s*([+-]\s*\d*(?:[\.,]\d+)?)\s*y\s*=\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (sys) {
        const a1 = sys[1] === "" || sys[1] === "+" ? 1 : sys[1] === "-" ? -1 : parseNumber(sys[1]);
        const b1 = sys[2] ? (sys[2].replace(/\s+/g, "") === "+" ? 1 : sys[2].replace(/\s+/g, "") === "-" ? -1 : parseNumber(sys[2].replace(/\s+/g, ""))) : 0;
        const c1 = parseNumber(sys[3]);
        const a2 = sys[4] === "" || sys[4] === "+" ? 1 : sys[4] === "-" ? -1 : parseNumber(sys[4]);
        const b2 = sys[5] ? (sys[5].replace(/\s+/g, "") === "+" ? 1 : sys[5].replace(/\s+/g, "") === "-" ? -1 : parseNumber(sys[5].replace(/\s+/g, ""))) : 0;
        const c2 = parseNumber(sys[6]);
        const det = a1 * b2 - a2 * b1;
        if (det !== 0) {
          const x = (c1 * b2 - c2 * b1) / det;
          const y = (a1 * c2 - a2 * c1) / det;
          return { summary: `Sistema de 2 ecuaciones con 2 incógnitas resuelto por el método de Cramer.`, steps: [`Ecuación 1: ${a1}x ${b1 >= 0 ? "+" : ""}${b1}y = ${c1}.`, `Ecuación 2: ${a2}x ${b2 >= 0 ? "+" : ""}${b2}y = ${c2}.`, `Determinante: D = ${a1}·${b2} − ${a2}·${b1} = ${roundNumber(det)}.`, `x = (${c1}·${b2} − ${c2}·${b1}) / ${roundNumber(det)} = ${roundNumber(x)}.`, `y = (${a1}·${c2} − ${a2}·${c1}) / ${roundNumber(det)} = ${roundNumber(y)}.`], result: `x = ${roundNumber(x)}, y = ${roundNumber(y)}` };
        }
      }

      // REGLA DE TRES: si A es a B, cuánto es C
      const ruleOf3 = q.match(/(?:si|cuando)\s*(-?\d+(?:[\.,]\d+)?)\s*(?:es|equivale|corresponde)\s*(?:a)?\s*(-?\d+(?:[\.,]\d+)?)\s*[,;]\s*(?:cuanto|cu[aá]nto|qu[eé])\s*(?:es|ser[aá]|equivale)?\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (ruleOf3) {
        const a = parseNumber(ruleOf3[1]);
        const b = parseNumber(ruleOf3[2]);
        const c = parseNumber(ruleOf3[3]);
        const result = (c * b) / a;
        return { summary: `Regla de tres simple directa: si ${a} → ${b}, entonces ${c} → ?`, steps: [`Proporción: ${a}/${b} = ${c}/x.`, `Despejamos x: x = (${c} × ${b}) / ${a}.`, `x = ${roundNumber(c * b)} / ${a} = ${roundNumber(result)}.`], result: String(roundNumber(result)) };
      }

      // INTERÉS SIMPLE: capital al r% por t años/meses
      const intSimple = q.match(/(?:inter[eé]s simple|interes simple).*?(\d+(?:[\.,]\d+)?).*?(\d+(?:[\.,]\d+)?)\s*%.*?(\d+(?:[\.,]\d+)?)\s*(?:a[nñ]o|mes|periodo)/i);
      if (intSimple) {
        const capital = parseNumber(intSimple[1]);
        const rate = parseNumber(intSimple[2]) / 100;
        const time = parseNumber(intSimple[3]);
        const interest = capital * rate * time;
        const total = capital + interest;
        return { summary: `Interés simple: I = C × r × t`, steps: [`Capital (C): $${capital}.`, `Tasa (r): ${intSimple[2]}% = ${rate}.`, `Tiempo (t): ${time} periodos.`, `Interés: I = ${capital} × ${rate} × ${time} = $${roundNumber(interest)}.`, `Monto total: M = C + I = $${capital} + $${roundNumber(interest)} = $${roundNumber(total)}.`], result: `Interés = $${roundNumber(interest)}, Monto = $${roundNumber(total)}` };
      }

      // INTERÉS COMPUESTO: capital al r% por t periodos
      const intComp = q.match(/(?:inter[eé]s compuesto|interes compuesto).*?(\d+(?:[\.,]\d+)?).*?(\d+(?:[\.,]\d+)?)\s*%.*?(\d+(?:[\.,]\d+)?)\s*(?:a[nñ]o|mes|periodo)/i);
      if (intComp) {
        const capital = parseNumber(intComp[1]);
        const rate = parseNumber(intComp[2]) / 100;
        const time = parseNumber(intComp[3]);
        const total = capital * Math.pow(1 + rate, time);
        const interest = total - capital;
        return { summary: `Interés compuesto: M = C × (1 + r)^t`, steps: [`Capital (C): $${capital}.`, `Tasa (r): ${intComp[2]}% = ${rate}.`, `Tiempo (t): ${time} periodos.`, `Monto: M = ${capital} × (1 + ${rate})^${time} = ${capital} × ${roundNumber(Math.pow(1 + rate, time))}.`, `Monto total: M = $${roundNumber(total)}.`, `Interés ganado: I = $${roundNumber(total)} − $${capital} = $${roundNumber(interest)}.`], result: `Monto = $${roundNumber(total)}, Interés = $${roundNumber(interest)}` };
      }

      // FACTORIAL: n!
      const factMatch = q.match(/(?:factorial|fact).*?(\d+)|(?:(\d+))\s*!/i);
      if (factMatch) {
        const n = parseInt(factMatch[1] || factMatch[2]);
        if (n >= 0 && n <= 170) {
          let f = 1; for (let i = 2; i <= n; i++) f *= i;
          return { summary: `Factorial de ${n}: n! = n × (n−1) × ... × 2 × 1`, steps: [`${n}! = ${Array.from({length: Math.min(n, 8)}, (_, i) => n - i).join(" × ")}${n > 8 ? " × ..." : ""}.`, `${n}! = ${f}.`], result: `${n}! = ${f}` };
        }
      }

      // COMBINACIONES: C(n,r) o "combinaciones de n en r"
      const combMatch = q.match(/(?:combinacion|combina|C\()\s*(\d+)\s*[,en]+\s*(\d+)/i);
      if (combMatch) {
        const n = parseInt(combMatch[1]), r = parseInt(combMatch[2]);
        if (n >= r && r >= 0 && n <= 170) {
          const fac = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
          const result = fac(n) / (fac(r) * fac(n - r));
          return { summary: `Combinaciones C(${n},${r}) = n! / (r! × (n−r)!)`, steps: [`C(${n},${r}) = ${n}! / (${r}! × ${n - r}!).`, `= ${fac(n)} / (${fac(r)} × ${fac(n - r)}).`, `= ${roundNumber(result)}.`], result: `C(${n},${r}) = ${roundNumber(result)}` };
        }
      }

      // PERMUTACIONES: P(n,r)
      const permMatch = q.match(/(?:permutacion|permuta|P\()\s*(\d+)\s*[,en]+\s*(\d+)/i);
      if (permMatch) {
        const n = parseInt(permMatch[1]), r = parseInt(permMatch[2]);
        if (n >= r && r >= 0 && n <= 170) {
          const fac = (x) => { let f = 1; for (let i = 2; i <= x; i++) f *= i; return f; };
          const result = fac(n) / fac(n - r);
          return { summary: `Permutaciones P(${n},${r}) = n! / (n−r)!`, steps: [`P(${n},${r}) = ${n}! / ${n - r}!.`, `= ${fac(n)} / ${fac(n - r)}.`, `= ${roundNumber(result)}.`], result: `P(${n},${r}) = ${roundNumber(result)}` };
        }
      }

      // RAÍZ CUADRADA / CÚBICA
      const sqrtMatch = q.match(/(?:ra[ií]z\s*(?:cuadrada)?|sqrt)\s*(?:de)?\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (sqrtMatch) {
        const n = parseNumber(sqrtMatch[1]);
        if (n >= 0) {
          const result = Math.sqrt(n);
          return { summary: `Raíz cuadrada de ${n}.`, steps: [`√${n} = ${roundNumber(result)}.`], result: `√${n} = ${roundNumber(result)}` };
        }
      }

      // POTENCIA: a^b o "a elevado a b"
      const powMatch = q.match(/(\d+(?:[\.,]\d+)?)\s*(?:elevado|\^|\*\*)\s*(?:a)?\s*(\d+(?:[\.,]\d+)?)/i);
      if (powMatch) {
        const base = parseNumber(powMatch[1]);
        const exp = parseNumber(powMatch[2]);
        const result = Math.pow(base, exp);
        if (Number.isFinite(result)) {
          return { summary: `${base} elevado a la ${exp}.`, steps: [`${base}^${exp} = ${roundNumber(result)}.`], result: `${base}^${exp} = ${roundNumber(result)}` };
        }
      }

      // LOGARITMO: log(x), ln(x)
      const logMatch = q.match(/(?:log|logaritmo)\s*(?:base)?\s*(\d+)?\s*(?:de)?\s*(\d+(?:[\.,]\d+)?)/i);
      if (logMatch) {
        const base = logMatch[1] ? parseNumber(logMatch[1]) : 10;
        const n = parseNumber(logMatch[2]);
        if (n > 0 && base > 0 && base !== 1) {
          const result = Math.log(n) / Math.log(base);
          return { summary: `Logaritmo base ${base} de ${n}.`, steps: [`log_${base}(${n}) = ln(${n}) / ln(${base}).`, `= ${roundNumber(Math.log(n))} / ${roundNumber(Math.log(base))} = ${roundNumber(result)}.`], result: `log_${base}(${n}) = ${roundNumber(result)}` };
        }
      }

      const lnMatch = q.match(/ln\s*(?:de)?\s*(\d+(?:[\.,]\d+)?)/i);
      if (lnMatch) {
        const n = parseNumber(lnMatch[1]);
        if (n > 0) return { summary: `Logaritmo natural de ${n}.`, steps: [`ln(${n}) = ${roundNumber(Math.log(n))}.`], result: `ln(${n}) = ${roundNumber(Math.log(n))}` };
      }

      // ECUACIÓN LINEAL: ax + b = c
      const linear = q.match(/(-?\d*(?:[\.,]\d+)?)\s*x\s*([+-]\s*\d+(?:[\.,]\d+)?)?\s*=\s*(-?\d+(?:[\.,]\d+)?)/i);
      if (linear) {
        const a = linear[1] === "" || linear[1] === "+" ? 1 : linear[1] === "-" ? -1 : parseNumber(linear[1]);
        const b = linear[2] ? parseNumber(linear[2].replace(/\s+/g, "")) : 0;
        const c = parseNumber(linear[3]);
        if (a !== 0) {
          const x = (c - b) / a;
          return { summary: `Ecuación lineal ax + b = c resuelta despejando x.`, steps: [`Ecuación: ${a}x ${b >= 0 ? "+" : ""}${b} = ${c}.`, `Restamos ${b}: ${a}x = ${roundNumber(c - b)}.`, `Dividimos para ${a}: x = ${roundNumber(c - b)} / ${a} = ${roundNumber(x)}.`], result: `x = ${roundNumber(x)}` };
        }
      }

      // EXPRESIÓN ARITMÉTICA GENERAL: 2+3*5, (10+5)/3, etc.
      const expression = q.match(/(?:calcula|resolver|resuelve|resultado de)?\s*([\d\s+\-*/().,^]+)$/i);
      if (expression && /[+\-*/^]/.test(expression[1])) {
        const expr = expression[1].replace(/,/g, ".").replace(/\^/g, "**");
        if (/^[\d\s+\-*/().*]+$/.test(expr)) {
          try {
            const result = Function(`"use strict"; return (${expr});`)();
            if (Number.isFinite(result)) {
              return { summary: `Operación aritmética resuelta con jerarquía de operaciones.`, steps: [`Expresión: ${expression[1].trim()}.`, `Se resuelven paréntesis, potencias, multiplicaciones/divisiones, sumas/restas.`, `Resultado: ${roundNumber(result)}.`], result: String(roundNumber(result)) };
            }
          } catch (error) {}
        }
      }
      return null;
    }

    function normalizeMathText(value) {
      return String(value || "").replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").trim();
    }

    function parseNumber(value) {
      const clean = String(value || "").replace(/,/g, ".").replace(/\s+/g, "");
      if (clean === "" || clean === "+") return 1;
      if (clean === "-") return -1;
      return Number(clean);
    }

    function extractNumbers(value) {
      return (String(value || "").match(/-?\d+(?:[\.,]\d+)?/g) || []).map(parseNumber).filter(Number.isFinite);
    }

    function extractNamedNumber(value, name) {
      const match = String(value || "").match(new RegExp(`\\b${name}\\s*=\\s*(-?\\d+(?:[\\.,]\\d+)?)`, "i"));
      return match ? parseNumber(match[1]) : NaN;
    }

    function roundNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return value;
      return Math.round((n + Number.EPSILON) * 10000) / 10000;
    }

    function renderFormulaBank() {
      if (!el.formulaList || !el.formulaSubject) return;
      if (formulaBankDataLoading) {
        el.formulaList.innerHTML = DOMPurify.sanitize(renderFormulaSkeleton());
        return;
      }
      const subject = subjectById(el.formulaSubject.value) || SUBJECTS.find((item) => normalize(item.name).includes("econometria")) || SUBJECTS[0];
      const formulas = formulasForSubject(subject);
      formulaVisibleCount = Math.min(Math.max(4, formulaVisibleCount || 4), Math.max(formulas.length, 4));
      const visibleItems = formulas.slice(0, formulaVisibleCount);
      const remaining = Math.max(0, formulas.length - visibleItems.length);
      el.formulaList.innerHTML = DOMPurify.sanitize(`
        <div class="formula-bank-head">
          <div>
            <span class="formula-bank-label">${escapeHtml(subject.cycleName || findCycleBySubject(subject.id)?.name || "Malla curricular")}</span>
            <strong>${escapeHtml(subject.name)}</strong>
            <p>${formulas.length} fórmulas, conceptos, métodos o indicadores disponibles para esta materia.</p>
          </div>
          <span class="formula-count">${visibleItems.length} / ${formulas.length}</span>
        </div>
        <div class="formula-grid">
          ${visibleItems.map((item) => renderFormulaCard(item)).join("") || renderEmpty("Sin fórmulas", "Todavía no hay registros para esta materia.")}
        </div>
        ${formulas.length > 4 ? `<div class="formula-more-actions">
          ${remaining > 0 ? `<button class="btn-secondary formula-load-more" type="button" data-formula-more>Mostrar 4 más ↓</button><button class="btn-ghost formula-show-all" type="button" data-formula-all>Mostrar todas</button>` : `<button class="btn-secondary formula-load-more" type="button" data-formula-less>Volver a 4 ↑</button>`}
        </div>` : ""}
      `);
      el.formulaList.querySelector("[data-formula-more]")?.addEventListener("click", () => {
        formulaVisibleCount = Math.min(formulas.length, formulaVisibleCount + 4);
        renderFormulaBank();
      });
      el.formulaList.querySelector("[data-formula-all]")?.addEventListener("click", () => {
        formulaVisibleCount = formulas.length;
        renderFormulaBank();
      });
      el.formulaList.querySelector("[data-formula-less]")?.addEventListener("click", () => {
        formulaVisibleCount = 4;
        renderFormulaBank();
      });
      el.formulaList.querySelectorAll("[data-copy-formula]").forEach((button) => {
        button.addEventListener("click", () => {
          const value = button.dataset.copyFormula || "";
          const done = () => showToast("Fórmula copiada", "Ya puedes pegarla en tus apuntes.", "success");
          if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done).catch(() => fallbackCopy(value, done));
          else fallbackCopy(value, done);
        });
      });
    }

    function renderFormulaCard(item) {
      const mathLike = isMathLike(item.valor) || ["fórmula", "formula", "modelo", "indicador"].includes(normalize(item.tipo));
      return `
        <article class="formula-item ${mathLike ? "is-math" : "is-concept"}">
          <div class="formula-item-top">
            <span class="formula-topic">${escapeHtml(item.tema)}</span>
            <span class="formula-type">${escapeHtml(item.tipo || "Concepto")}</span>
          </div>
          <div class="formula-expression ${mathLike ? "math-display" : "concept-display"}">${renderMathExpression(item.valor)}</div>
          <button class="mini-action formula-copy-action" type="button" data-copy-formula="${escapeAttribute(item.valor || "")}">Copiar fórmula</button>
          ${item.definicion ? `<p class="formula-definition">${escapeHtml(item.definicion)}</p>` : ""}
          ${item.uso ? `<p class="formula-use"><strong>Uso:</strong> ${escapeHtml(item.uso)}</p>` : ""}
          <div class="formula-tags">
            <span>${escapeHtml(item.nivel || "General")}</span>
            ${(item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>`;
    }

    function formulaBankRows() {
      return Array.isArray(formulaBankRuntimeData) && formulaBankRuntimeData.length ? formulaBankRuntimeData : FORMULA_BANK_DATA;
    }

    async function fetchPortalData(endpoint, fallback = []) {
      if (!endpoint) return fallback;
      if (PORTAL_DATA_CACHE.has(endpoint)) return PORTAL_DATA_CACHE.get(endpoint);
      try {
        const response = await fetch(endpoint, { cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        PORTAL_DATA_CACHE.set(endpoint, data);
        return data;
      } catch (error) {
        console.info(`Datos externos no disponibles: ${endpoint}. Se usa respaldo local.`, error);
        return fallback;
      }
    }

    async function loadFormulaBankData() {
      if (formulaBankDataLoaded || formulaBankDataLoading) return formulaBankRows();
      formulaBankDataLoading = true;
      renderFormulaBank();
      const rows = await fetchPortalData(FORMULA_DATA_ENDPOINT, FORMULA_BANK_DATA);
      formulaBankRuntimeData = Array.isArray(rows) && rows.length ? rows : FORMULA_BANK_DATA;
      formulaBankDataLoaded = true;
      formulaBankDataLoading = false;
      renderFormulaBank();
      return formulaBankRows();
    }

    function renderFormulaSkeleton() {
      const cards = Array.from({ length: 4 }, () => `<article class="formula-item formula-skeleton-card" aria-hidden="true"><span></span><b></b><p></p><p></p></article>`).join("");
      return `
        <div class="formula-bank-head formula-bank-loading">
          <div>
            <span class="formula-bank-label">Banco académico</span>
            <strong>Cargando fórmulas...</strong>
            <p>Preparando datos externos con respaldo local.</p>
          </div>
          <span class="formula-count">...</span>
        </div>
        <div class="formula-grid formula-skeleton-grid">${cards}</div>`;
    }

    function formulasForSubject(subject) {
      const subjectName = normalize(subject?.name || "");
      const cycleName = normalize(subject?.cycleName || findCycleBySubject(subject?.id)?.name || "");
      const rowsSource = formulaBankRows();
      let rows = rowsSource.filter((item) => normalize(item.materia) === subjectName && (!cycleName || normalize(item.ciclo) === cycleName));
      if (!rows.length) rows = rowsSource.filter((item) => normalize(item.materia) === subjectName);
      if (!rows.length) rows = rowsSource.filter((item) => normalize(item.materia).includes(subjectName) || subjectName.includes(normalize(item.materia)));
      return rows.slice().sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0));
    }

    function isMathLike(value) {
      return /[=+\-*/^√Σ∑∫∂∞≈≠≤≥<>%]|[₀₁₂₃₄₅₆₇₈₉ᵢⱼₙₜₖₗₘ]|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ]/.test(String(value || ""));
    }

    function renderMathExpression(value) {
      const supMap = { "⁰":"0", "¹":"1", "²":"2", "³":"3", "⁴":"4", "⁵":"5", "⁶":"6", "⁷":"7", "⁸":"8", "⁹":"9", "⁺":"+", "⁻":"-", "⁼":"=", "⁽":"(", "⁾":")", "ⁿ":"n", "ᵀ":"T" };
      const subMap = { "₀":"0", "₁":"1", "₂":"2", "₃":"3", "₄":"4", "₅":"5", "₆":"6", "₇":"7", "₈":"8", "₉":"9", "₊":"+", "₋":"-", "₌":"=", "₍":"(", "₎":")", "ᵢ":"i", "ⱼ":"j", "ₙ":"n", "ₜ":"t", "ₖ":"k", "ₗ":"l", "ₘ":"m" };
      const toChars = (text, map) => [...text].map((char) => map[char] || char).join("");
      return escapeHtml(value)
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵀ]+/g, (match) => `<sup>${toChars(match, supMap)}</sup>`)
        .replace(/[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ᵢⱼₙₜₖₗₘ]+/g, (match) => `<sub>${toChars(match, subMap)}</sub>`)
        .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
        .replace(/\^\(([^)]+)\)/g, "<sup>($1)</sup>")
        .replace(/\^([A-Za-z0-9+\-]+)/g, "<sup>$1</sup>")
        .replace(/_\{([^}]+)\}/g, "<sub>$1</sub>")
        .replace(/_([A-Za-z0-9]+)/g, "<sub>$1</sub>");
    }

    function generateStudyPlan() {
      if (!el.studyPlanResult || !el.studyPlanSubject) return;
      const subject = subjectById(el.studyPlanSubject.value) || SUBJECTS[0];
      const rawDate = el.studyPlanDate?.value;
      const days = rawDate ? Math.max(1, daysUntil(rawDate)) : 7;
      const blocks = Math.min(6, Math.max(3, Math.ceil(days / 2)));
      const topics = studyRouteForSubject(subject).slice(0, blocks);
      el.studyPlanResult.innerHTML = DOMPurify.sanitize(`
        <article class="study-plan-card">
          <span class="feature-badge recommended">${days} días</span>
          <h4>${escapeHtml(subject.name)}</h4>
          <p>Plan sugerido hasta ${rawDate ? formatDate(rawDate) : "tu próxima evaluación"}.</p>
          <ol>${topics.map((topic, index) => `<li><strong>Día ${index + 1}</strong><span>${escapeHtml(topic)}</span></li>`).join("")}</ol>
          <button class="btn-secondary" type="button" data-tab="repositorio">Buscar materiales de esta materia</button>
        </article>`);
      el.studyPlanResult.querySelector("[data-tab]")?.addEventListener("click", () => {
        repoState.search = subject.name;
        showSection("repositorio", true);
        renderRepository();
      });
      showToast("Plan generado", `Ruta de repaso lista para ${subject.name}.`, "success");
    }

    function studyRouteForSubject(subject) {
      const name = normalize(subject?.name || "");
      if (name.includes("econometria")) return ["Repasar modelo lineal y supuestos", "Interpretar coeficientes y signos", "Resolver ejercicios de MCO", "Practicar pruebas t y F", "Revisar heterocedasticidad y errores estándar", "Simular un examen corto"];
      if (name.includes("metodos dinamicos")) return ["Identificar variables de estado", "Resolver ecuaciones en diferencias", "Calcular estado estacionario", "Analizar estabilidad", "Dibujar trayectoria o fase", "Resolver ejercicio aplicado"];
      if (name.includes("algebra")) return ["Matrices y operaciones", "Determinantes", "Inversa y rango", "Sistemas lineales", "Vectores y producto punto", "Problemas de examen"];
      if (name.includes("estadistica")) return ["Medidas descriptivas", "Probabilidad básica", "Distribuciones", "Inferencia y pruebas", "Interpretación de resultados", "Ejercicios mixtos"];
      if (name.includes("finanzas")) return ["Valor del dinero en el tiempo", "VAN y TIR", "Riesgo y rendimiento", "Razones financieras", "Casos de decisión", "Simulacro de cálculo"];
      return ["Revisar conceptos centrales", "Leer apuntes principales", "Resolver ejercicios básicos", "Revisar ejemplos aplicados", "Practicar preguntas del banco", "Hacer resumen final"];
    }

    function populateExamSimulatorSubjects() {
      if (!el.examSimSubject) return;
      const cycle = findCycle(el.examSimCycle?.value) || CYCLES[0];
      const current = el.examSimSubject.value;
      el.examSimSubject.innerHTML = DOMPurify.sanitize((cycle?.subjects || []).map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}</option>`).join(""));
      if ((cycle?.subjects || []).some((subject) => subject.id === current)) el.examSimSubject.value = current;
    }

    function startExamSimulator() {
      if (!el.examSimResult || !el.examSimSubject) return;
      const subjectId = el.examSimSubject.value;
      const difficulty = el.examSimDifficulty?.value || "facil";
      const subject = subjectById(subjectId);
      const pool = quizQuestions().filter((question) => question.materia === subjectId && question.difficulty === difficulty);
      const fallback = quizQuestions().filter((question) => question.materia === subjectId);
      const selected = shuffle(pool.length ? pool : fallback).slice(0, 5);
      if (!selected.length) {
        el.examSimResult.innerHTML = DOMPurify.sanitize(renderEmpty("Sin preguntas para esta materia", "Prueba otra materia o abre el Quiz de Autoevaluación."));
        return showToast("Sin preguntas", "No hay preguntas disponibles para esta materia.", "error");
      }
      examSimulatorState = { questions: selected, index: 0, answers: [], subject: subject?.name || "Materia" };
      renderExamSimulatorQuestion();
    }

    function renderExamSimulatorQuestion() {
      if (!el.examSimResult) return;
      const q = examSimulatorState.questions[examSimulatorState.index];
      if (!q) {
        const score = examSimulatorState.answers.filter(Boolean).length;
        const history = loadJson(QUIZ_HISTORY_KEY, []);
        studentStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify([{ date: new Date().toISOString().slice(0, 10), score, total: examSimulatorState.questions.length, subject: examSimulatorState.subject, mode: "Simulador" }, ...history]));
        studentStorage.setItem(STUDY_ACTIVITY_KEY, JSON.stringify({ ...loadJson(STUDY_ACTIVITY_KEY, {}), lastQuiz: `${examSimulatorState.subject}: ${score}/${examSimulatorState.questions.length}`, updatedAt: new Date().toISOString() }));
        renderProfileSummary();
        el.examSimResult.innerHTML = DOMPurify.sanitize(`<article class="exam-sim-card"><h4>Resultado: ${score}/${examSimulatorState.questions.length}</h4><p>${score >= 4 ? "Muy buen repaso. Puedes subir dificultad." : "Conviene repasar errores y repetir el simulador."}</p><button class="btn-primary" type="button" data-exam-sim-restart>Reintentar</button></article>`);
        return;
      }
      el.examSimResult.innerHTML = DOMPurify.sanitize(`<article class="exam-sim-card"><div class="curriculum-progress"><span style="width:${Math.round((examSimulatorState.index / examSimulatorState.questions.length) * 100)}%"></span></div><p>${examSimulatorState.index + 1}/${examSimulatorState.questions.length} · ${escapeHtml(examSimulatorState.subject)}</p><h4>${formatMathText(q.question)}</h4><div class="quiz-options-grid">${q.options.map((option, index) => `<button class="btn-secondary quiz-option" type="button" data-exam-answer="${index}">${formatMathText(option)}</button>`).join("")}</div></article>`);
    }

    function handleExamSimulatorClick(event) {
      const restart = event.target.closest("[data-exam-sim-restart]");
      if (restart) return startExamSimulator();
      const answer = event.target.closest("[data-exam-answer]");
      if (!answer) return;
      const q = examSimulatorState.questions[examSimulatorState.index];
      if (!q) return;
      const selected = Number(answer.dataset.examAnswer);
      const correct = selected === q.correct;
      examSimulatorState.answers[examSimulatorState.index] = correct;
      el.examSimResult.querySelectorAll("[data-exam-answer]").forEach((button) => {
        const value = Number(button.dataset.examAnswer);
        button.disabled = true;
        button.classList.toggle("correct", value === q.correct);
        button.classList.toggle("wrong", value === selected && !correct);
      });
      el.examSimResult.querySelector(".exam-sim-card")?.insertAdjacentHTML("beforeend", `<div class="quiz-feedback ${correct ? "success" : "error"}"><strong>${correct ? "Correcto" : "Incorrecto"}</strong><p><b>Respuesta:</b> ${formatMathText(q.options[q.correct])}</p><p>${formatMathText(q.explanation || "Revisa el concepto central y vuelve a resolver paso a paso.")}</p><p><b>Sugerencia:</b> ${formatMathText(q.tip || "Escribe datos, fórmula y reemplazo antes de elegir.")}</p><button class="btn-primary" type="button" data-exam-next>${examSimulatorState.index + 1 >= examSimulatorState.questions.length ? "Ver resultado" : "Siguiente"}</button></div>`);
      el.examSimResult.querySelector("[data-exam-next]")?.addEventListener("click", () => {
        examSimulatorState.index += 1;
        renderExamSimulatorQuestion();
      }, { once: true });
    }

    function renderStudyActivity() {
      const activity = loadJson(STUDY_ACTIVITY_KEY, {});
      const panel = document.querySelector(".study-activity-panel");
      if (panel || !el.studyPlanResult) return;
    }

    function populateGpaSubjects() {
      if (!el.gpaSubject) return;
      const cycle = findCycle(el.gpaCycle.value) || CYCLES[0];
      const current = el.gpaSubject.value;
      el.gpaSubject.innerHTML = DOMPurify.sanitize(cycle.subjects.map((subject) => `<option value="${subject.id}">${subject.name}</option>`).join(""));
      el.gpaSubject.value = cycle.subjects.some((subject) => subject.id === current) ? current : cycle.subjects[0]?.id || "";
    }

    function gradeKey() { return `${el.gpaCycle.value}_${el.gpaSubject.value}`; }
    function defaultGradeRows() {
      return [
        { id: "aprovechamiento-1", name: "Primer aprovechamiento", max: 25, score: "" },
        { id: "interciclo", name: "Examen interciclo", max: 20, score: "" },
        { id: "aprovechamiento-2", name: "Segundo aprovechamiento", max: 25, score: "" },
        { id: "final", name: "Examen final", max: 30, score: "" }
      ];
    }
    function gradeRows() {
      const key = gradeKey();
      const saved = Array.isArray(appData.gradebook[key]) ? appData.gradebook[key] : [];
      appData.gradebook[key] = defaultGradeRows().map((row) => ({ ...row, score: saved.find((item) => item.id === row.id || item.name === row.name)?.score || "" }));
      return appData.gradebook[key];
    }

    function renderGpaRows() {
      if (!el.gpaRows || !el.gpaSubject.value) return;
      el.gpaRows.innerHTML = DOMPurify.sanitize(gradeRows().map((row, index) => `
        <div class="grade-row" data-grade-row="${index}">
          <label><span>Componente</span><input value="${escapeAttribute(row.name)}" readonly></label>
          <label><span>Valor máximo</span><input value="${row.max} puntos" readonly></label>
          <label><span>Tu nota sobre 100</span><input data-grade-field="score" type="number" min="0" max="100" step="0.01" value="${escapeAttribute(row.score || "")}" placeholder="0 - 100"></label>
          <span class="grade-max-note">${convertComponentScore(row.score, row.max).toFixed(2)} / ${row.max}</span>
        </div>`).join(""));
      calculateGpa();
    }

    function saveGradebookFromInputs() {
      const rows = [...el.gpaRows.querySelectorAll("[data-grade-row]")].map((row) => ({
        ...gradeRows()[Number(row.dataset.gradeRow)],
        score: row.querySelector('[data-grade-field="score"]').value
      }));
      appData.gradebook[gradeKey()] = rows;
      saveData();
      [...el.gpaRows.querySelectorAll("[data-grade-row]")].forEach((row) => {
        const index = Number(row.dataset.gradeRow);
        const item = appData.gradebook[gradeKey()][index];
        const note = row.querySelector(".grade-max-note");
        if (note && item) note.textContent = `${convertComponentScore(item.score, item.max).toFixed(2)} / ${item.max}`;
      });
      calculateGpa();
    }

    function calculateGpa() {
      if (!el.gpaResult) return;
      const rows = gradeRows().map((row) => ({ ...row, hasScore: String(row.score).trim() !== "", score100: Math.min(Number(row.score) || 0, 100), contribution: convertComponentScore(row.score, row.max) }));
      const finalRow = rows.find((row) => row.id === "final");
      const beforeFinalRows = rows.filter((row) => row.id !== "final");
      const beforeFinal = beforeFinalRows.reduce((sum, row) => sum + row.contribution, 0);
      const accumulated = rows.reduce((sum, row) => sum + (row.hasScore ? row.contribution : 0), 0);
      const finalMax = 30;
      const minimumFinal = 12;
      const passScore = 60;
      const finalContribution = finalRow?.hasScore ? finalRow.contribution : 0;
      const finalScoreOver30 = finalRow?.hasScore ? finalContribution : null;
      const totalWithFinal = beforeFinal + finalContribution;
      const pointsNeeded = passScore - beforeFinal;
      const neededFinal = Math.max(minimumFinal, pointsNeeded);
      let status = "";
      if (finalRow?.hasScore) {
        const passed = totalWithFinal >= passScore && finalScoreOver30 >= minimumFinal;
        status = passed
          ? `<span class="status-pass">Apruebas con ${totalWithFinal.toFixed(2)}/100 y cumples el mínimo de ${minimumFinal}/${finalMax} en el final.</span>`
          : `<span class="status-risk">Aún no apruebas: necesitas llegar a ${passScore}/100 y sacar mínimo ${minimumFinal}/${finalMax} en el examen final.</span>`;
      } else if (neededFinal > finalMax) {
        status = `<span class="status-risk">Necesitarías ${neededFinal.toFixed(2)}/${finalMax}; matemáticamente no alcanza para aprobar con ${passScore}/100.</span>`;
      } else {
        status = `<span class="status-pass">Para aprobar necesitas ${neededFinal.toFixed(2)}/${finalMax} en el examen final. Recuerda que el final siempre debe ser mínimo ${minimumFinal}/${finalMax}.</span>`;
      }
      el.gpaResult.innerHTML = DOMPurify.sanitize(`<strong>Nota total actual: ${accumulated.toFixed(2)} / 100</strong>${rows.map((row) => `<span>${escapeHtml(row.name)}: ${row.hasScore ? row.score100.toFixed(2) : "sin ingresar"}/100 equivale a ${row.hasScore ? row.contribution.toFixed(2) : "0.00"}/${row.max}</span>`).join("")}<span>Acumulado antes del final frente a la meta de aprobación: ${beforeFinal.toFixed(2)} / ${passScore}</span>${status}`);
    }

    function convertComponentScore(score, maxValue) {
      return (Math.min(Number(score) || 0, 100) / 100) * Number(maxValue || 0);
    }

    function populateScheduleSubjects() {
      if (!el.scheduleSubject) return;
      const cycle = findCycle(el.scheduleCycle.value) || SCHEDULE_CYCLES[0];
      const current = el.scheduleSubject.value;
      el.scheduleSubject.innerHTML = DOMPurify.sanitize(cycle.subjects.map((subject) => `<option value="${subject.id}">${subject.name}</option>`).join(""));
      el.scheduleSubject.value = cycle.subjects.some((subject) => subject.id === current) ? current : cycle.subjects[0]?.id || "";
    }

    function renderSchedule() {
      if (!el.scheduleTableWrap) return;
      const cycleId = el.scheduleCycle.value || SCHEDULE_CYCLES[0].id;
      const group = el.scheduleGroup?.value || "Grupo 1";
      el.scheduleCycle.value = cycleId;
      const studentItems = (appData.studentSchedules || []).map((item) => ({ ...item, source: "Mi horario" }));
      const dayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const items = studentItems
        .filter((item) => item.cycleId === cycleId && (item.group || "Grupo 1") === group)
        .sort((a, b) => (dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)) || String(a.start || "").localeCompare(String(b.start || "")));
      const viewButtons = `<div class="schedule-view-actions" aria-label="Vista del horario">
          <button class="btn-secondary ${scheduleViewMode === "list" ? "active" : ""}" type="button" data-schedule-view="list">Ver lista</button>
          <button class="btn-secondary ${scheduleViewMode === "calendar" ? "active" : ""}" type="button" data-schedule-view="calendar">Ver calendario semanal</button>
          ${scheduleEditId ? `<button class="btn-secondary" type="button" data-schedule-cancel-edit>Cancelar edición</button>` : ""}
        </div>`;
      el.scheduleTableWrap.innerHTML = DOMPurify.sanitize(`
        <div class="form-note">Mostrando ${findCycle(cycleId)?.name || ""} · ${group}. Puedes agregar materias a tu horario y luego imprimir esta página.</div>
        ${viewButtons}
        ${scheduleViewMode === "calendar" ? renderScheduleCalendar(items) : renderScheduleList(items)}`);
    }

    function renderScheduleList(items) {
      return `<table class="schedule-table schedule-list-table">
        <thead><tr><th>Día</th><th>Materia</th><th>Inicio</th><th>Fin</th><th>Aula</th><th>Grupo</th><th>Acción</th></tr></thead>
        <tbody>${items.length ? items.map(renderScheduleRow).join("") : `<tr><td colspan="7">${renderEmpty("Sin horario registrado", "Agrega una materia para construir tu horario personalizado.")}</td></tr>`}</tbody>
      </table>`;
    }

    function renderScheduleRow(item) {
      return `<tr data-schedule-row="${item.id || ""}"><td>${escapeHtml(item.day || "")}</td><td><strong>${subjectName(item.cycleId, item.subjectId) || escapeHtml(item.subjectId)}</strong><small>${escapeHtml(item.docente || "Docente por definir")} · ${escapeHtml(item.source || "Mi horario")}</small></td><td>${escapeHtml(item.start || "")}</td><td>${escapeHtml(item.end || "")}</td><td>${escapeHtml(item.aula || "Aula por definir")}</td><td>${escapeHtml(item.group || "Grupo 1")}</td><td><div class="schedule-row-actions"><button class="schedule-edit" type="button" data-edit-student-schedule="${item.id}">Editar</button><button class="schedule-delete" type="button" data-delete-student-schedule="${item.id}">Eliminar</button></div></td></tr>`;
    }

    function renderScheduleCalendar(items) {
      const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
      const slots = [
        ["07:00", "09:00"], ["09:00", "11:00"], ["11:00", "13:00"],
        ["13:00", "15:00"], ["15:00", "17:00"], ["17:00", "19:00"], ["19:00", "21:00"]
      ];
      return `<div class="schedule-poster">
        <div class="schedule-poster-header">
          <span class="schedule-poster-logo" aria-hidden="true">EC</span>
          <div><span>Universidad de Cuenca</span><h4>Horario Semanal de Administración</h4><p>${escapeHtml(findCycle(el.scheduleCycle.value)?.name || "Ciclo")} · ${escapeHtml(el.scheduleGroup?.value || "Grupo 1")}</p></div>
        </div>
        <div class="schedule-calendar-wrap">
          <table class="schedule-calendar-table" aria-label="Horario semanal tipo calendario">
            <thead><tr><th>Hora</th>${days.map((day) => `<th>${day}</th>`).join("")}</tr></thead>
            <tbody>${slots.map(([start, end]) => `<tr><th>${start} - ${end}</th>${days.map((day) => `<td>${renderScheduleCalendarCell(items, day, start, end)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
        <p class="schedule-print-note">Cada color identifica una materia. Toca una viñeta para ver docente, aula y grupo.</p>
      </div>`;
    }

    function renderScheduleCalendarCell(items, day, slotStart, slotEnd) {
      const matches = items.filter((item) => item.day === day && timeRangesOverlap(item.start, item.end, slotStart, slotEnd));
      if (!matches.length) return '<span class="calendar-empty">Disponible</span>';
      return matches.map((item) => `<article class="calendar-class" data-schedule-row="${item.id || ""}" data-schedule-detail="${item.id}" style="--schedule-color:${scheduleColor(item.subjectId)};--schedule-bg:${hexToRgba(scheduleColor(item.subjectId), 0.12)}">
        <strong>${subjectName(item.cycleId, item.subjectId) || escapeHtml(item.subjectId)}</strong>
        <span>${escapeHtml(item.start || "")} - ${escapeHtml(item.end || "")}</span>
        <small>${escapeHtml(item.aula || "Aula por definir")}</small>
        <em>${escapeHtml(item.docente || "Docente por definir")}</em>
        <button type="button" data-edit-student-schedule="${item.id}">Editar</button>
      </article>`).join("");
    }

    function scheduleColor(subjectId) {
      const palette = ["#1a56db", "#059669", "#ea580c", "#7c3aed", "#dc2626", "#0f766e", "#4f46e5", "#c8970a", "#be185d", "#0891b2"];
      const index = SUBJECTS.findIndex((subject) => subject.id === subjectId);
      return palette[Math.max(index, 0) % palette.length];
    }

    function hexToRgba(hex, alpha = 1) {
      const clean = String(hex).replace("#", "");
      const value = parseInt(clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean, 16);
      const red = (value >> 16) & 255;
      const green = (value >> 8) & 255;
      const blue = value & 255;
      return `rgba(${red},${green},${blue},${alpha})`;
    }

    function timeToMinutes(value) {
      const [hour, minute] = String(value || "00:00").split(":").map(Number);
      return (Number(hour) || 0) * 60 + (Number(minute) || 0);
    }

    function timeRangesOverlap(startA, endA, startB, endB) {
      const aStart = timeToMinutes(startA);
      const aEnd = timeToMinutes(endA);
      const bStart = timeToMinutes(startB);
      const bEnd = timeToMinutes(endB);
      return aStart < bEnd && aEnd > bStart;
    }

    
    function addStudentSchedule() {
      if (!el.scheduleSubject.value) return showToast("Horario incompleto", "Selecciona una materia.", "error");
      if (!el.scheduleStart.value || !el.scheduleEnd.value) return showToast("Horario incompleto", "Selecciona hora de inicio y fin.", "error");
      if (timeToMinutes(el.scheduleEnd.value) <= timeToMinutes(el.scheduleStart.value)) return showToast("Horario inválido", "La hora de fin debe ser mayor que la hora de inicio.", "error");
      const addedId = uid();
      const editingId = scheduleEditId;
      const subjectLabel = subjectName(el.scheduleCycle.value, el.scheduleSubject.value) || el.scheduleSubject.value;
      appData.studentSchedules = appData.studentSchedules || [];
      const payload = {
        cycleId: el.scheduleCycle.value,
        group: el.scheduleGroup.value,
        subjectId: el.scheduleSubject.value,
        day: el.scheduleDay.value,
        start: el.scheduleStart.value,
        end: el.scheduleEnd.value,
        aula: el.scheduleAula.value,
        docente: el.scheduleDocente?.value.trim() || "Docente por definir"
      };
      if (editingId) {
        appData.studentSchedules = appData.studentSchedules.map((item) => item.id === editingId ? { ...item, ...payload } : item);
      } else {
        appData.studentSchedules.push({ id: addedId, ...payload });
      }
      el.scheduleAula.value = "";
      if (el.scheduleDocente) el.scheduleDocente.value = "";
      scheduleEditId = "";
      el.addStudentSchedule.textContent = "Agregar materia";
      studentStorage.setItem(STUDENT_SCHEDULE_KEY, JSON.stringify(appData.studentSchedules));
      saveData();
      renderSchedule();
      renderNextClassWidget();
      const rowId = editingId || addedId;
      const row = el.scheduleTableWrap?.querySelector(`[data-schedule-row="${CSS.escape(rowId)}"]`);
      if (row) {
        row.classList.add("row-highlight");
        setTimeout(() => row.classList.remove("row-highlight"), 2400);
      }
      showToast("Horario actualizado", `${editingId ? "Se actualizó" : "Se agregó"} ${subjectLabel} los ${el.scheduleDay.value} de ${el.scheduleStart.value} a ${el.scheduleEnd.value}.`, "success");
    }

    function handleScheduleClick(event) {
      const viewButton = event.target.closest("[data-schedule-view]");
      const cancelEditButton = event.target.closest("[data-schedule-cancel-edit]");
      const editButton = event.target.closest("[data-edit-student-schedule]");
      const deleteButton = event.target.closest("[data-delete-student-schedule]");
      const detailCard = event.target.closest("[data-schedule-detail]");
      if (viewButton) {
        scheduleViewMode = viewButton.dataset.scheduleView;
        renderSchedule();
        return;
      }
      if (cancelEditButton) {
        scheduleEditId = "";
        el.addStudentSchedule.textContent = "Agregar materia";
        el.scheduleAula.value = "";
        if (el.scheduleDocente) el.scheduleDocente.value = "";
        renderSchedule();
        showToast("Edición cancelada", "Puedes seguir agregando materias a tu horario.", "info");
        return;
      }
      if (editButton) {
        const item = (appData.studentSchedules || []).find((row) => row.id === editButton.dataset.editStudentSchedule);
        if (!item) return;
        beginScheduleEdit(item);
        return;
      }
      if (detailCard) {
        openScheduleDetail(detailCard.dataset.scheduleDetail);
        return;
      }
      if (!deleteButton) return;
      appData.studentSchedules = (appData.studentSchedules || []).filter((item) => item.id !== deleteButton.dataset.deleteStudentSchedule);
      if (scheduleEditId === deleteButton.dataset.deleteStudentSchedule) {
        scheduleEditId = "";
        el.addStudentSchedule.textContent = "Agregar materia";
      }
      studentStorage.setItem(STUDENT_SCHEDULE_KEY, JSON.stringify(appData.studentSchedules));
      saveData();
      renderSchedule();
      renderNextClassWidget();
      showToast("Horario actualizado", "La materia fue eliminada de tu horario.", "info");
    }

    function openScheduleDetail(id) {
      const item = (appData.studentSchedules || []).find((row) => row.id === id);
      if (!item) return;
      const subject = subjectName(item.cycleId, item.subjectId) || item.subjectId;
      const overlay = document.createElement("div");
      overlay.className = "schedule-detail-modal";
      overlay.innerHTML = DOMPurify.sanitize(`<article class="schedule-detail-card" role="dialog" aria-modal="true" aria-labelledby="scheduleDetailTitle" style="--schedule-color:${scheduleColor(item.subjectId)};--schedule-bg:${hexToRgba(scheduleColor(item.subjectId), 0.12)}">
        <button class="schedule-detail-close" type="button" data-close-schedule-detail aria-label="Cerrar detalle">×</button>
        <span class="schedule-detail-badge">${escapeHtml(item.day || "Día")} · ${escapeHtml(item.start || "")} - ${escapeHtml(item.end || "")}</span>
        <h3 id="scheduleDetailTitle">${escapeHtml(subject)}</h3>
        <dl>
          <div><dt>Docente</dt><dd>${escapeHtml(item.docente || "Docente por definir")}</dd></div>
          <div><dt>Aula / lugar</dt><dd>${escapeHtml(item.aula || "Aula por definir")}</dd></div>
          <div><dt>Grupo</dt><dd>${escapeHtml(item.group || "Grupo 1")}</dd></div>
          <div><dt>Ciclo</dt><dd>${escapeHtml(findCycle(item.cycleId)?.name || "Ciclo")}</dd></div>
        </dl>
        <div class="modal-actions"><button class="btn-secondary" type="button" data-edit-from-detail="${item.id}">Editar materia</button><button class="btn-primary" type="button" data-close-schedule-detail>Cerrar</button></div>
      </article>`);
      const close = () => {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
      };
      const onKeydown = (event) => { if (event.key === "Escape") close(); };
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-close-schedule-detail]")) close();
        const edit = event.target.closest("[data-edit-from-detail]");
        if (edit) {
          close();
          beginScheduleEdit(item);
        }
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      overlay.querySelector("[data-close-schedule-detail]")?.focus();
    }

    function beginScheduleEdit(item) {
      scheduleEditId = item.id;
      el.scheduleCycle.value = item.cycleId;
      populateScheduleSubjects();
      el.scheduleGroup.value = item.group || "Grupo 1";
      el.scheduleSubject.value = item.subjectId;
      el.scheduleDay.value = item.day || "Lunes";
      el.scheduleStart.value = item.start || "07:00";
      el.scheduleEnd.value = item.end || "09:00";
      el.scheduleAula.value = item.aula || "";
      if (el.scheduleDocente) el.scheduleDocente.value = item.docente || "";
      el.addStudentSchedule.textContent = "Guardar cambios";
      document.querySelector(".schedule-builder")?.scrollIntoView({ behavior: motionBehavior(), block: "center" });
      showToast("Editando horario", "Ajusta los campos y presiona Guardar cambios.", "info");
    }

    function printScheduleCalendar() {
      const cycleId=el.scheduleCycle.value,group=el.scheduleGroup.value||'Grupo 1';
      const days=['Lunes','Martes','Miércoles','Jueves','Viernes'];
      const items=(appData.studentSchedules||[]).filter(item=>item.cycleId===cycleId&&(item.group||'Grupo 1')===group).sort((a,b)=>days.indexOf(a.day)-days.indexOf(b.day)||String(a.start).localeCompare(String(b.start)));
      const opened=window.AdeSchedulePrint?.open({markup:renderScheduleCalendar(items),title:'Mi horario · ASO ADE',subtitle:(findCycle(cycleId)?.name||'')+' · '+group});
      if(!opened)showToast('Abrir horario para imprimir','Permite la ventana emergente del portal y vuelve a pulsar Imprimir horario.','info');
    }

    function startPomodoro() {
      if (pomodoroRunning) return;
      requestPomodoroNotificationPermission();
      if (!pomodoroRemaining || pomodoroRemaining <= 0) resetPomodoro();
      pomodoroRunning = true;
      pomodoroDeadline = Date.now() + pomodoroRemaining * 1000;
      savePomodoro();
      document.querySelector(".pomodoro-panel")?.classList.add("is-running");
      updatePomodoroDisplay();
      pomodoroTimer = setInterval(() => {
        pomodoroRemaining = Math.max(0, Math.ceil((pomodoroDeadline - Date.now()) / 1000));
        if (pomodoroRemaining <= 0) switchPomodoroMode();
        updatePomodoroDisplay();
      }, 1000);
      showToast("Pomodoro iniciado", "Tu bloque de concentración está corriendo.", "success");
    }

    function pausePomodoro() {
      if (pomodoroRunning) pomodoroRemaining = Math.max(0, Math.ceil((pomodoroDeadline - Date.now()) / 1000));
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
      pomodoroRunning = false;
      document.querySelector(".pomodoro-panel")?.classList.remove("is-running");
      updatePomodoroDisplay();
      showToast("Pomodoro pausado", "Puedes retomarlo cuando quieras.", "warning");
    }

    function resetPomodoro() {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
      pomodoroRunning = false;
      document.querySelector(".pomodoro-panel")?.classList.remove("is-running");
      pomodoroMode = el.pomodoroMode?.value || "study";
      pomodoroRemaining = pomodoroMinutes(pomodoroMode) * 60;
      updatePomodoroDisplay();
    }

    function switchPomodoroMode() {
      if (pomodoroMode === "study") {
        pomodoroSessions += 1;
        studentStorage.setItem(POMODORO_KEY, String(pomodoroSessions));
      }
      playPomodoroSound();
      showPomodoroNotification();
      pomodoroMode = pomodoroMode === "study" ? "short" : "study";
      if (el.pomodoroMode) el.pomodoroMode.value = pomodoroMode;
      pomodoroRemaining = pomodoroMinutes(pomodoroMode) * 60;
      pomodoroDeadline = Date.now() + pomodoroRemaining * 1000;
      savePomodoro();
      renderProfileSummary();
      showToast(pomodoroMode !== "study" ? "Descanso activo" : "Volver a estudiar", pomodoroMode !== "study" ? "Terminó el bloque. Toma un descanso." : "Descanso terminado. Inicia otro bloque.", "success");
    }

    function pomodoroMinutes(mode) {
      const input = mode === "study" ? el.pomodoroStudy : el.pomodoroBreak;
      const fallback = mode === "study" ? 25 : mode === "long" ? 15 : 5;
      if (mode === "long") return 15;
      return Math.max(1, Number(input?.value) || fallback);
    }

    function updatePomodoroDisplay() {
      if (!el.pomodoroDisplay) return;
      savePomodoro();
      if (!pomodoroRunning && (!pomodoroRemaining || pomodoroRemaining <= 0)) pomodoroRemaining = pomodoroMinutes(pomodoroMode) * 60;
      const minutes = Math.floor(pomodoroRemaining / 60);
      const seconds = pomodoroRemaining % 60;
      el.pomodoroDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const total = pomodoroMinutes(pomodoroMode) * 60;
      const progress = total ? 314 * (1 - (pomodoroRemaining / total)) : 0;
      if (el.pomodoroProgress) el.pomodoroProgress.style.strokeDashoffset = String(progress);
      if (el.pomodoroSessions) el.pomodoroSessions.textContent = `${pomodoroSessions} sesiones completadas.`;
      const label = pomodoroMode === "study" ? "Sesión de estudio" : pomodoroMode === "long" ? "Descanso largo" : "Descanso corto";
      el.pomodoroStatus.textContent = `${label}${pomodoroRunning ? " en curso" : " pausada"}`;
    }

    function playPomodoroSound() {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 440;
        gain.gain.setValueAtTime(0.001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
      } catch {}
    }

    function requestPomodoroNotificationPermission() {
      if (!("Notification" in window) || Notification.permission !== "default") return;
      Notification.requestPermission().catch(() => {});
    }

    function showPomodoroNotification() {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
        new Notification("Sesión completada, toma un descanso", {
          body: "Portal Estudiantil ADE",
          tag: "pomodoro-ade"
        });
      } catch {}
    }

    function renderCurriculum() {
      if (!el.curriculumGrid) return;
      const statuses = appData.curriculumStatus || {};
      const total = countSubjects();
      const approved = AdeCurriculum.summarize(SUBJECTS, statuses).approved;
      const progress = total ? Math.round((approved / total) * 100) : 0;
      el.curriculumProgressBar.style.width = `${progress}%`;
      el.curriculumProgressText.textContent = `${approved} de ${total} materias aprobadas · ${progress}% de la carrera. Solo se cuentan las materias de esta malla.`;
      el.curriculumGrid.innerHTML = DOMPurify.sanitize(CYCLES.map((cycle) => `<article class="portal-card cycle-progress-card"><h3>${cycle.name}</h3>${cycle.subjects.map((subject) => {
        const status = statuses[subject.id] || "pendiente";
        return `<div class="curriculum-subject ${status}"><span>${subject.name}</span><select aria-label="Estado de ${escapeAttribute(subject.name)}" data-curriculum-subject="${subject.id}"><option value="pendiente" ${status === "pendiente" ? "selected" : ""}>Pendiente</option><option value="en-curso" ${status === "en-curso" ? "selected" : ""}>En curso</option><option value="aprobada" ${status === "aprobada" ? "selected" : ""}>Aprobada</option></select></div>`;
      }).join("")}</article>`).join(""));
    }

    function handleCurriculumChange(event) {
      const select = event.target.closest("[data-curriculum-subject]");
      if (!select) return;
      appData.curriculumStatus[select.dataset.curriculumSubject] = select.value;
      studentStorage.setItem(CURRICULUM_STATE_KEY, JSON.stringify(appData.curriculumStatus));
      safeSetLocalStorage(STORAGE_KEY,JSON.stringify({gradebook:appData.gradebook,curriculumStatus:appData.curriculumStatus,studentSchedules:appData.studentSchedules}));
      renderCurriculum();
      renderAcademicCurve();
      renderSemesterWidget();
      renderProfileSummary();
    }

    function renderBanco() {
      const cycleId = el.bancoFilterCiclo.value;
      const type = el.bancoFilterTipo.value;
      renderBancoSubjectChips();
      const selectedSubject = el.bancoSubjectChips?.dataset.subject || "all";
      const exams = visibleResources().filter((r) => {
        const subject = subjectName(r.cycleId, r.subjectId);
        const haystack = normalize(`${r.title} ${r.description} ${subject} ${findCycle(r.cycleId)?.name || ""} ${r.date} ${r.source === DRIVE_RESOURCE_SOURCE ? "google drive" : "local"}`);
        return r.typeId === "examenes" && (!cycleId || r.cycleId === cycleId) && (!type || haystack.includes(normalize(type))) && (selectedSubject === "all" || r.subjectId === selectedSubject);
      });
      const grouped = CYCLES.map((cycle) => {
        const subjects = cycle.subjects.map((subject) => ({ subject, exams: exams.filter((exam) => exam.cycleId === cycle.id && exam.subjectId === subject.id) })).filter((group) => group.exams.length || (isAdmin && (!cycleId || cycleId === cycle.id)));
        return { cycle, subjects };
      }).filter((group) => group.subjects.length);
      const content = grouped.length
        ? `<div class="exam-tree">${grouped.map(renderExamCycleTree).join("")}</div>`
        : `<div class="banco-empty-wrap">${renderEmpty("Sin exámenes en este filtro", "Sube PDFs a Google Drive dentro de la carpeta Exámenes de cada materia y pulsa Reintentar sincronización. También puedes agregar un enlace manual desde el modo administrador.")}</div>`;
      el.bancoTableBody.innerHTML = DOMPurify.sanitize(`<tr class="${grouped.length ? "" : "banco-empty-row"}"><td colspan="5">${renderBancoDrivePanel(exams.length)}${content}</td></tr>`);
    }

    function renderBancoDrivePanel(examCount = 0) {
      const driveExams = visibleResources().filter((item) => item.typeId === "examenes" && item.source === DRIVE_RESOURCE_SOURCE).length;
      const statusText = driveRepositoryStatus.loading
        ? "Sincronizando Drive..."
        : driveRepositoryStatus.error
        ? "Drive necesita revisión"
        : driveRepositoryStatus.enabled
        ? `Drive conectado: ${driveExams} examen(es) sincronizado(s)`
        : "Drive no configurado";
      const statusClass = driveRepositoryStatus.loading ? "warning" : driveRepositoryStatus.error ? "error" : driveRepositoryStatus.enabled ? "success" : "muted";
      const helper = driveRepositoryStatus.error
        ? "Revisa que Apps Script esté publicado como Web App pública y que la URL termine en /exec. Mientras tanto puedes abrir la carpeta Drive."
        : "Para subir exámenes: Drive → Repositorio ADE → Ciclo → Materia → Exámenes. Sube el PDF y luego pulsa Reintentar sincronización.";
      return `<section class="banco-drive-panel ${statusClass}">
        <div>
          <span class="section-tag">Exámenes vinculados con Drive</span>
          <h3>${escapeHtml(statusText)}</h3>
          <p>${escapeHtml(helper)}</p>
          <small>Mostrando ${examCount} examen(es) según el filtro actual.</small>
        </div>
        <div class="banco-drive-actions">
          <button class="btn-primary" type="button" data-banco-drive-sync>Reintentar sincronización</button>
          <a class="btn-secondary" href="${escapeAttribute(driveRepositoryUrl())}" target="_blank" rel="noopener noreferrer">Abrir carpeta Drive</a>
          ${isAdmin ? `<button class="btn-secondary" type="button" data-banco-add="${escapeAttribute((el.bancoFilterCiclo.value || CYCLES[0].id) + "|" + ((el.bancoSubjectChips?.dataset.subject && el.bancoSubjectChips.dataset.subject !== "all") ? el.bancoSubjectChips.dataset.subject : findCycle(el.bancoFilterCiclo.value || CYCLES[0].id)?.subjects[0]?.id || ""))}">Agregar enlace manual</button>` : ""}
        </div>
      </section>`;
    }

    function renderBancoSubjectChips() {
      if (!el.bancoSubjectChips) return;
      const activeSubject = el.bancoSubjectChips.dataset.subject || "all";
      const activeCycle = el.bancoSubjectChips.dataset.cycle || "";
      const cycle = findCycle(activeCycle);
      if (!cycle) {
        el.bancoSubjectChips.innerHTML = DOMPurify.sanitize(`
          <div class="filter-stage">
            <div class="filter-stage-header">
              <div>
                <strong>Filtro por materia</strong>
                <span>Primero selecciona un ciclo</span>
              </div>
            </div>
            <div class="filter-list">
              <button class="subject-chip ${activeSubject === "all" ? "active" : ""}" type="button" data-banco-subject="all">Todas las materias</button>
              ${CYCLES.map((item) => `<button class="filter-list-button" type="button" data-banco-cycle="${item.id}"><span>${item.name}</span><small>${item.subjects.length} materias</small></button>`).join("")}
            </div>
          </div>`);
        return;
      }
      el.bancoSubjectChips.innerHTML = DOMPurify.sanitize(`
        <div class="filter-stage">
          <button class="filter-back" type="button" data-banco-back>← Volver a ciclos</button>
          <div class="filter-stage-header">
            <div>
              <strong>${cycle.name}</strong>
              <span>Ahora elige una materia</span>
            </div>
          </div>
          <div class="filter-list">
            <button class="subject-chip ${activeSubject === "all" && el.bancoFilterCiclo.value === cycle.id ? "active" : ""}" type="button" data-banco-cycle-all="${cycle.id}">Todas las materias de ${cycle.name}</button>
            ${cycle.subjects.map((subject) => `<button class="subject-chip ${activeSubject === subject.id ? "active" : ""}" type="button" data-banco-subject="${subject.id}">${subject.name}</button>`).join("")}
          </div>
        </div>`);
    }

    function handleBancoSubjectChipClick(event) {
      const cycleButton = event.target.closest("[data-banco-cycle]");
      if (cycleButton) {
        el.bancoSubjectChips.dataset.cycle = cycleButton.dataset.bancoCycle;
        el.bancoSubjectChips.dataset.subject = "all";
        el.bancoFilterCiclo.value = cycleButton.dataset.bancoCycle;
        renderBanco();
        return;
      }
      const cycleAllButton = event.target.closest("[data-banco-cycle-all]");
      if (cycleAllButton) {
        el.bancoSubjectChips.dataset.cycle = cycleAllButton.dataset.bancoCycleAll;
        el.bancoSubjectChips.dataset.subject = "all";
        el.bancoFilterCiclo.value = cycleAllButton.dataset.bancoCycleAll;
        renderBanco();
        return;
      }
      const backButton = event.target.closest("[data-banco-back]");
      if (backButton) {
        delete el.bancoSubjectChips.dataset.cycle;
        renderBancoSubjectChips();
        return;
      }
      const chip = event.target.closest("[data-banco-subject]");
      if (!chip) return;
      el.bancoSubjectChips.dataset.subject = chip.dataset.bancoSubject;
      if (chip.dataset.bancoSubject === "all") {
        delete el.bancoSubjectChips.dataset.cycle;
        el.bancoFilterCiclo.value = "";
      } else {
        const cycle = findCycleBySubject(chip.dataset.bancoSubject);
        if (cycle) {
          el.bancoSubjectChips.dataset.cycle = cycle.id;
          el.bancoFilterCiclo.value = cycle.id;
        }
      }
      renderBanco();
    }

    function renderExamCycleTree(group) {
      return `<details><summary>${group.cycle.name} · ${group.subjects.reduce((sum, item) => sum + item.exams.length, 0)} exámenes</summary><div class="exam-subjects">${group.subjects.map(({ subject, exams }) => `<details><summary>${subject.name}${isAdmin ? ` <button class="mini-action" type="button" data-banco-add="${group.cycle.id}|${subject.id}">Agregar examen</button>` : ""}</summary><div class="exam-items">${exams.length ? exams.map((item, index) => renderExamCard(item, index)).join("") : `<div class="banco-empty-wrap compact">${renderEmpty("Sin exámenes registrados", "Sube el PDF en Google Drive: " + group.cycle.name + " / " + subject.name + " / Exámenes.")}</div>`}</div></details>`).join("")}</div></details>`;
    }

    function renderExamCard(item, index = 0) {
      const sourceLabel = item.source === DRIVE_RESOURCE_SOURCE ? "Google Drive" : "Local";
      const openUrl = materialOpenUrl(item);
      const downloadUrl = materialDownloadUrl(item);
      const canPreview = isPdfResource(item) || /drive\.google|docs\.google/i.test(item.url || item.webViewUrl || "");
      return `<article class="exam-card" style="--row-index:${index}">
        <strong>${escapeHtml(item.title)}</strong>
        <div class="portal-card-meta">
          <span class="exam-type-badge ${examTypeClass(inferExamType(item))}">${inferExamType(item)}</span>
          <span>${formatDate(item.date)}</span>
          <span>${escapeHtml(sourceLabel)}</span>
        </div>
        <p>${escapeHtml(item.description || "Examen disponible para consulta académica.")}</p>
        <div class="inline-actions">
          ${canPreview ? `<button class="btn-secondary" type="button" data-preview-pdf="${item.id}">Ver PDF</button>` : ""}
          <a class="card-action" href="${escapeAttribute(openUrl)}" target="_blank" rel="noopener noreferrer">Abrir en Drive</a>
          ${downloadUrl ? `<a class="btn-secondary" href="${escapeAttribute(downloadUrl)}" target="_blank" rel="noopener noreferrer">Descargar</a>` : ""}
          <button class="btn-secondary" type="button" data-calendar-exam="${item.id}">Añadir al calendario</button>
        </div>
      </article>`;
    }
    function handleBancoClick(event) {
      const syncDrive = event.target.closest("[data-banco-drive-sync]");
      const previewPdf = event.target.closest("[data-preview-pdf]");
      const add = event.target.closest("[data-banco-add]");
      const calendar = event.target.closest("[data-calendar-exam]");
      if (syncDrive) {
        syncDrive.disabled = true;
        syncDrive.textContent = "Sincronizando...";
        loadDriveRepositoryResources().then(() => {
          refreshVisibleDataAfterSync(["resources"]);
          showToast("Drive actualizado", "Se volvió a cargar el banco de exámenes desde Google Drive.", "success");
        }).catch(() => {
          renderBanco();
          showToast("No se pudo sincronizar", "Revisa la implementación de Apps Script y los permisos de Drive.", "error");
        });
        return;
      }
      if (previewPdf) return openPdfModal(previewPdf.dataset.previewPdf);
      if (calendar) {
        const exam = visibleResources().find((item) => item.id === calendar.dataset.calendarExam);
        if (exam) downloadCalendarEvent({ id: exam.id, titulo: exam.title, fecha: exam.date, lugar: subjectName(exam.cycleId, exam.subjectId), descripcion: exam.description });
        return;
      }
      if (!add || !isAdmin) return;
      event.preventDefault();
      event.stopPropagation();
      const [cycleId, subjectId] = add.dataset.bancoAdd.split("|");
      openMaterialModal({ typeId: "examenes", cycleId, subjectId });
    }
    function inferExamType(item) {
      const text = normalize(`${item.title} ${item.description}`);
      if (text.includes("interciclo")) return "Interciclo";
      if (text.includes("final")) return "Final";
      if (text.includes("deber")) return "Deber";
      if (text.includes("practica")) return "Práctica";
      if (text.includes("leccion")) return "Lección";
      return "Examen";
    }
    function renderDocentes() {
      el.docentesContainer.innerHTML = DOMPurify.sanitize(appData.docentes.filter(item=>!item.hidden).map(docenteCardHtml).join("") + renderSuggestionCard("Docentes", "Comparte de forma anónima una sugerencia sobre atención docente, horarios o comunicación."));
    }
    function renderSuggestionCard(title, text) {
      const url = appData.settings.suggestionFormUrl || "https://forms.gle/";
      return `<article class="suggestion-card"><span class="section-tag">Sugerencias</span><h3>Dejar sugerencia anónima</h3><p>${escapeHtml(text)}</p><a class="btn-secondary" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">Abrir Google Forms</a></article>`;
    }

    function renderOportunidades() { const items = latest(appData.oportunidades.filter(item=>!item.hidden), "fecha", 99); el.oportunidadesContainer.innerHTML = DOMPurify.sanitize(items.length ? items.map(renderOpportunityCard).join("") : renderEmpty("No hay convocatorias cargadas", "Aquí se publicarán pasantías, becas y oportunidades de emprendimiento vigentes.")); }

    function renderRepresentantes() {
      el.representantesContainer.innerHTML = DOMPurify.sanitize(appData.representantes.filter(r=>!r.hidden).map(representativeCardHtml).join('') || renderEmpty('Directiva en actualización','Pronto encontrarás aquí a tus representantes.'));
    }
    function renderFAQ() { if(el.faqList) el.faqList.innerHTML=DOMPurify.sanitize('<article class="faq-item"><h3>¿Quién recibe mi consulta?</h3><p>La directiva de la ASO, en su correo oficial. Te responderemos por correo, llamada o WhatsApp.</p></article><article class="faq-item"><h3>¿Cómo encuentro mis materiales?</h3><p>Abre el repositorio, elige tu ciclo y busca por materia o categoría.</p></article><article class="faq-item"><h3>¿Dónde se guarda mi progreso?</h3><p>Tu horario, favoritos y avance académico permanecen en este navegador. El contenido institucional se guarda en el servidor.</p></article>'); }

    function renderGracias() {
      const wrap = document.querySelector("#gracias .section-wrap");
      if (!wrap) return;
      const last = loadJson("portal_last_thanks", null);
      const map = {
        consulta: ["Consulta registrada", "Tu consulta fue registrada. Te responderán por el medio indicado."],
        tutoria: ["Inscripción registrada", "Tu inscripción fue registrada. El tutor te contactará pronto."],
        merch: ["Reserva registrada", "Tu reserva fue registrada. Te contactaremos para coordinar la entrega."]
      };
      const [title, text] = map[last?.type] || ["Gracias", "Tu información fue registrada correctamente."];
      wrap.innerHTML = DOMPurify.sanitize(`<div class="section-header"><span class="section-tag">Mensaje enviado</span><h2>${title}</h2><p>${text}</p>${last?.code ? `<div class="tracking-code">Código de seguimiento: <strong>${escapeHtml(last.code)}</strong></div>` : ""}</div><div class="quick-row" style="justify-content:center"><a class="btn-primary" href="#inicio" data-tab="inicio">Volver al inicio</a><a class="btn-secondary" href="#repositorio" data-tab="repositorio">Ir al repositorio</a><a class="btn-secondary" href="#perfil" data-profile-link>Ver historial</a></div>`);
      wrap.querySelectorAll("[data-tab]").forEach((node) => node.addEventListener("click", (event) => {
        event.preventDefault();
        showSection(node.dataset.tab, true);
      }));
      wrap.querySelector("[data-profile-link]")?.addEventListener("click", (event) => {
        event.preventDefault();
        openProfilePanel();
      });
    }



    function renderOpportunityCard(item) {
      const urgent = daysUntil(item.fecha) <= 7;
      return `<article class="portal-card opportunity-card">${urgent ? `<span class="urgency-badge">Próximo a vencer</span>` : ""}<span class="portal-card-icon">${escapeHtml(item.tipo.slice(0, 2))}</span><h3>${escapeHtml(item.titulo)}</h3><p>${escapeHtml(item.descripcion)}</p><div class="portal-card-meta"><span>${escapeHtml(item.institucion)}</span><span>Hasta: ${formatDate(item.fecha)}</span></div>${item.link ? `<a class="card-action" href="${escapeAttribute(item.link)}" target="_blank">Postular</a>` : ""}</article>`;
    }
    function renderCompactOpportunity(item) {
      const remaining = daysUntil(item.fecha);
      const urgent = Number.isFinite(remaining) && remaining >= 0 && remaining <= 7;
      return `<article class="portal-card home-highlight-card opportunity-mini-card">
        <div class="home-type-pill ${urgent ? "urgent" : ""}">${urgent ? "Próximo" : escapeHtml(item.tipo.slice(0, 3).toUpperCase())}</div>
        <div class="home-highlight-body">
          <h3>${escapeHtml(item.titulo)}</h3>
          <p>${escapeHtml(item.tipo)} · ${escapeHtml(item.institucion)}</p>
          <div class="inline-actions compact-actions">
            ${item.link ? `<a class="mini-action" href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">Abrir</a>` : ""}
            <button class="mini-action" type="button" data-tab="oportunidades">Ver más</button>
          </div>
        </div>
      </article>`;
    }





    
    
    
    function openApp(appId) {
      const config = APP_CONFIG[appId];
      if (!config) return;
      activeApp = appId;
      activeAppMode = config.mode;
      if (config.mode === "panel") {
        closeApp("modal");
        el.appPanel.dataset.activeApp = appId;
        el.appPanelTitle.textContent = config.title;
        el.appPanelCrumb.textContent = config.crumb;
        el.appPanel.hidden = false;
        el.appBackdrop.hidden = false;
        renderActiveApp();
        requestAnimationFrame(() => {
          el.appPanel.classList.add("open");
          el.appBackdrop.classList.add("open");
        });
      } else {
        closeApp("panel");
        el.appModal.dataset.activeApp = appId;
        el.appModalTitle.textContent = config.title;
        el.appModalCrumb.textContent = config.crumb;
        el.appModal.hidden = false;
        renderActiveApp();
        el.appModal.classList.add("open");
        resetActiveAppScroll();
        requestAnimationFrame(() => {
          el.appModal.classList.add("open");
          resetActiveAppScroll();
          setTimeout(resetActiveAppScroll, 80);
        });
      }
    }

    function closeApp(scope = "all") {
      if (typeof scope !== "string") scope = "all";
      if ((scope === "all" || scope === "panel") && el.appPanel && !el.appPanel.hidden) {
        el.appPanel.classList.remove("open");
        el.appBackdrop?.classList.remove("open");
        setTimeout(() => {
          if (!el.appPanel.classList.contains("open")) {
            el.appPanel.hidden = true;
            el.appPanel.removeAttribute("data-active-app");
            if (el.appBackdrop) el.appBackdrop.hidden = true;
          }
        }, 260);
      }
      if ((scope === "all" || scope === "modal") && el.appModal && !el.appModal.hidden) {
        el.appModal.classList.remove("open");
        setTimeout(() => {
          if (!el.appModal.classList.contains("open")) {
            el.appModal.hidden = true;
            el.appModal.removeAttribute("data-active-app");
          }
        }, 300);
      }
      if (scope === "all") activeApp = null;
    }

    function openDriveRepositoryNotice() {
      const url = driveRepositoryUrl();
      const overlay = document.createElement("div");
      overlay.className = "drive-notice-modal";
      overlay.innerHTML = DOMPurify.sanitize(`<article class="drive-notice-card" role="dialog" aria-modal="true" aria-labelledby="driveNoticeTitle">
        <button class="syllabus-back" type="button" data-close-drive-notice>← Atrás</button>
        <span class="section-tag">Repositorio alternativo</span>
        <h3 id="driveNoticeTitle">Drive / repositorio simplificado</h3>
        <p>Abre la carpeta compartida de Administración de Empresas para acceder a los materiales de ADE.</p>
        <div class="drive-notice-actions">
          <a class="btn-primary" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Google Drive">Abrir Drive ↗</a>
          <button class="btn-secondary" type="button" data-tab-from-drive="repositorio">Usar repositorio web</button>
        </div>
      </article>`);
      const close = () => {
        document.removeEventListener("keydown", onKeydown);
        overlay.remove();
      };
      const onKeydown = (event) => { if (event.key === "Escape") close(); };
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-close-drive-notice]")) close();
        if (event.target.closest("[data-tab-from-drive]")) {
          close();
          showSection("repositorio", true);
        }
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      overlay.querySelector("[data-close-drive-notice]")?.focus();
    }

    function driveRepositoryUrl() {
      const savedUrl = appData.settings.simplifiedDriveUrl || "";
      return savedUrl && savedUrl !== "https://drive.google.com/" ? savedUrl : (DRIVE_FOLDER_URL || DEFAULT_ADE_DRIVE_FOLDER_URL);
    }

    function activeAppContainer() {
      return activeAppMode === "panel" ? el.appPanelContent : el.appModalContent;
    }

    function resetActiveAppScroll() {
      const container = activeAppContainer();
      [container, el.appModal, el.appPanel].forEach((node) => {
        if (!node) return;
        node.scrollTop = 0;
        node.scrollLeft = 0;
        node.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
      });
    }

    function renderActiveApp() {
      const container = activeAppContainer();
      if (!container || !activeApp) return;
      const renderers = {
        apa: renderApaApp,
        glossary: renderGlossaryApp,
        timeline: renderTimelineApp,
        tasks: renderTasksApp
      };
      container.innerHTML = DOMPurify.sanitize(renderers[activeApp]?.() || renderEmpty("Aplicación no disponible", "Este módulo todavía no está configurado."));
      resetActiveAppScroll();
      ensureLazyIframes(container);
    }

    function handleAppClick(event) {
      const tab = event.target.closest("[data-app-tab]");
      if (tab) {
        const value = tab.dataset.appTab;
        if (activeApp === "apa") apaType = value;
        renderActiveApp();
        return;
      }
      const action = event.target.closest("[data-app-action]");
      if (!action) return;
      const name = action.dataset.appAction;
      if (name === "apa-copy") return copyGeneratedApa();
      if (name === "apa-save") return saveGeneratedApa();
      if (name === "apa-export") return exportApaList();
      if (name === "apa-delete") return deleteApa(action.dataset.id);
      if (name === "task-form") { taskShowForm = !taskShowForm; return renderActiveApp(); }
      if (name === "task-delete") return deleteTask(action.dataset.id);
      if (name === "glossary-detail") { glossaryState.detailId = action.dataset.id; return renderActiveApp(); }
      if (name === "glossary-reset") { glossaryState = { query: "", category: "all", difficulty: "all", detailId: "" }; return renderActiveApp(); }
      if (name === "timeline-school") { timelineSchool = action.dataset.value; timelinePage = 0; return renderActiveApp(); }
      if (name === "timeline-page") {
        const total = timelineItems().filter((item) => timelineSchool === "all" || item.school === timelineSchool).length;
        const pageCount = Math.max(1, Math.ceil(total / TIMELINE_PAGE_SIZE));
        timelinePage = action.dataset.direction === "next" ? Math.min(pageCount - 1, timelinePage + 1) : Math.max(0, timelinePage - 1);
        return renderActiveApp();
      }
    }

    function handleAppSubmit(event) {
      if (!event.target.matches("[data-app-form]")) return;
      event.preventDefault();
      const form = event.target;
      const type = form.dataset.appForm;
      if (type === "apa") generateApa(form);
      if (type === "task") createTask(form);
      renderActiveApp();
    }

    function handleAppInput(event) {
      if (!activeApp) return;
      if (event.target.matches("[data-glossary-query]")) {
        glossaryState.query = event.target.value;
        renderActiveApp();
        setTimeout(() => {
          const input = activeAppContainer()?.querySelector("[data-glossary-query]");
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }, 0);
      }
      if (event.target.matches("[data-group-search]")) {
        event.target.closest(".app-modal-body").querySelectorAll("[data-group-card]").forEach((card) => {
          card.hidden = !normalize(card.textContent).includes(normalize(event.target.value));
        });
      }
    }

    function handleAppChange(event) {
      if (!activeApp) return;
      if (event.target.matches("[data-glossary-category]")) {
        glossaryState.category = event.target.value;
        renderActiveApp();
      }
      if (event.target.matches("[data-glossary-difficulty]")) {
        glossaryState.difficulty = event.target.value;
        renderActiveApp();
      }
      if (event.target.matches("[data-task-status]")) updateTaskStatus(event.target.dataset.id, event.target.value);
      if (event.target.id === "quizCycle") {
        const subjectSelect = document.getElementById("quizSubject");
        if (subjectSelect) subjectSelect.innerHTML = DOMPurify.sanitize(subjectOptions(event.target.value, ""));
      }
    }

    function renderApaApp() {
      const tabs = ["book", "article", "web", "thesis", "chapter"];
      const labels = { book: "Libro", article: "Artículo", web: "Sitio web", thesis: "Tesis", chapter: "Capítulo" };
      const list = loadJson(APA_KEY, []);
      return `<div class="app-tabs">${tabs.map((id) => `<button class="app-tab ${apaType === id ? "active" : ""}" type="button" data-app-tab="${id}">${labels[id]}</button>`).join("")}</div>
        <form class="portal-form-grid" data-app-form="apa">
          <input type="hidden" name="type" value="${apaType}">
          ${apaFields(apaType)}
          <button class="btn-primary full" type="submit">Generar cita APA</button>
        </form>
        ${generatedApa ? `<div class="apa-output">${generatedApa}</div><div class="inline-actions"><button class="btn-secondary" type="button" data-app-action="apa-copy">Copiar</button><button class="btn-primary" type="button" data-app-action="apa-save">Guardar en mi lista</button></div>` : ""}
        <div class="view-heading"><div><h3>Mi biblioteca</h3><p>${list.length} citas guardadas.</p></div><button class="btn-secondary" type="button" data-app-action="apa-export">Exportar todo</button></div>
        <div class="admin-list">${list.length ? list.map((item) => `<div class="admin-row"><div>${item.html}</div><button class="btn-danger" type="button" data-app-action="apa-delete" data-id="${item.id}">Eliminar</button></div>`).join("") : renderEmpty("Sin citas guardadas", "Genera y guarda referencias para crear tu bibliografía.")}</div>`;
    }

    function apaFields(type) {
      const common = `<label><span>Autor</span><input name="author" placeholder="Apellido, N." required></label><label><span>Año</span><input name="year" placeholder="2026" required></label><label class="full"><span>Título</span><input name="title" required></label>`;
      if (type === "article") return `${common}<label><span>Revista</span><input name="container" required></label><label><span>Volumen/Número</span><input name="volume"></label><label><span>DOI o URL</span><input name="url"></label>`;
      if (type === "web") return `${common}<label><span>Sitio web</span><input name="container" required></label><label class="full"><span>URL</span><input name="url" required></label>`;
      if (type === "thesis") return `${common}<label><span>Universidad</span><input name="container" required></label><label><span>Tipo</span><input name="volume" value="Tesis"></label><label><span>URL</span><input name="url"></label>`;
      if (type === "chapter") return `${common}<label><span>Libro</span><input name="container" required></label><label><span>Páginas</span><input name="volume" placeholder="pp. 12-28"></label><label><span>Editorial</span><input name="publisher"></label>`;
      return `${common}<label><span>Editorial</span><input name="publisher" required></label><label><span>URL o DOI</span><input name="url"></label>`;
    }

    function generateApa(form) {
      const data = Object.fromEntries(new FormData(form));
      const author = formatApaAuthor(data.author);
      const year = escapeHtml(data.year || "s. f.");
      const title = escapeHtml(data.title || "Sin título");
      const url = data.url ? ` ${escapeHtml(data.url)}` : "";
      if (data.type === "article") generatedApa = `${author} (${year}). ${title}. <em>${escapeHtml(data.container || "Revista")}</em>${data.volume ? `, ${escapeHtml(data.volume)}` : ""}.${url}`;
      else if (data.type === "web") generatedApa = `${author} (${year}). <em>${title}</em>. ${escapeHtml(data.container || "Sitio web")}.${url}`;
      else if (data.type === "thesis") generatedApa = `${author} (${year}). <em>${title}</em> [${escapeHtml(data.volume || "Tesis")}]. ${escapeHtml(data.container || "Universidad")}.${url}`;
      else if (data.type === "chapter") generatedApa = `${author} (${year}). ${title}. En <em>${escapeHtml(data.container || "Libro")}</em>${data.volume ? ` (${escapeHtml(data.volume)})` : ""}. ${escapeHtml(data.publisher || "Editorial")}.${url}`;
      else generatedApa = `${author} (${year}). <em>${title}</em>. ${escapeHtml(data.publisher || "Editorial")}.${url}`;
      showToast("Cita generada", "Puedes copiarla o guardarla en tu biblioteca.", "success");
    }

    function formatApaAuthor(value) {
      const text = String(value || "Autor desconocido").trim();
      const [last, rest] = text.split(",").map((part) => part.trim());
      return `${escapeHtml((last || text).toUpperCase())}${rest ? `, ${escapeHtml(rest)}` : ""}`;
    }

    function copyGeneratedApa() {
      const plain = generatedApa.replace(/<[^>]+>/g, "");
      navigator.clipboard?.writeText(plain).then(() => showToast("Copiado", "La cita APA está en el portapapeles.", "success")).catch(() => showToast("No se pudo copiar", "Selecciona la cita manualmente.", "error"));
    }

    function saveGeneratedApa() {
      if (!generatedApa) return;
      const list = loadJson(APA_KEY, []);
      studentStorage.setItem(APA_KEY, JSON.stringify([...list, { id: uid(), html: generatedApa, text: generatedApa.replace(/<[^>]+>/g, "") }]));
      renderActiveApp();
    }

    function deleteApa(id) {
      studentStorage.setItem(APA_KEY, JSON.stringify(loadJson(APA_KEY, []).filter((item) => item.id !== id)));
      renderActiveApp();
    }

    function exportApaList() {
      const list = loadJson(APA_KEY, []).map((item) => item.text).sort().join("\n\n");
      downloadText("bibliografia-apa.txt", list || "Sin citas guardadas.");
    }





































    function renderGlossaryApp() {
      const terms = glossaryTerms().filter((term) => (!glossaryState.query || normalize(`${term.term} ${term.definition}`).includes(normalize(glossaryState.query))) && (glossaryState.category === "all" || term.category === glossaryState.category) && (glossaryState.difficulty === "all" || term.difficulty === glossaryState.difficulty));
      const detail = glossaryTerms().find((term) => term.id === glossaryState.detailId) || terms[0];
      const categories = ["all", ...new Set(glossaryTerms().map((term) => term.category))];
      const activeCategory = glossaryState.category === "all" ? "Todas las áreas" : glossaryState.category;
      const activeDifficulty = glossaryState.difficulty === "all" ? "Todos los niveles" : glossaryState.difficulty;
      return `<section class="glossary-app glossary-app-pro">
        <div class="glossary-hero">
          <div>
            <span class="section-tag">Glosario académico</span>
            <h3>Conceptos de administración para estudiar y decidir mejor</h3>
            <p>Busca por término, filtra por área y revisa definición, fórmula, ejemplo aplicado y uso académico sin perder el contexto.</p>
          </div>
          <div class="glossary-hero-metrics" aria-label="Resumen del glosario">
            <span><strong>${terms.length}</strong><small>resultados</small></span>
            <span><strong>${categories.length - 1}</strong><small>áreas</small></span>
          </div>
          <div class="glossary-hero-actions">
            <button class="btn-secondary" type="button" data-app-action="glossary-reset">Limpiar filtros</button>
          </div>
        </div>
        <div class="glossary-layout">
          <div class="glossary-main-column">
            <div class="tools-grid glossary-tools">
              <input class="repo-search" data-glossary-query value="${escapeAttribute(glossaryState.query)}" placeholder="Buscar concepto empresarial">
              <select data-glossary-category>${categories.map((cat) => `<option value="${cat}" ${glossaryState.category === cat ? "selected" : ""}>${cat === "all" ? "Todas las categorías" : cat}</option>`).join("")}</select>
              <select data-glossary-difficulty>${["all", "básico", "intermedio", "avanzado"].map((d) => `<option value="${d}" ${glossaryState.difficulty === d ? "selected" : ""}>${d === "all" ? "Todas las dificultades" : d}</option>`).join("")}</select>
            </div>
            <div class="glossary-statusbar">
              <span><strong>${escapeHtml(activeCategory)}</strong> · ${escapeHtml(activeDifficulty)}</span>
              <span>${detail ? `Detalle activo: ${escapeHtml(detail.term)}` : "Selecciona un concepto para revisar el detalle"}</span>
            </div>
            <div class="app-grid glossary-grid">${terms.map((term) => `<article class="app-card glossary-term-card ${detail?.id === term.id ? "active" : ""}">
            <div class="glossary-term-top"><span class="badge-blue">${escapeHtml(term.category)}</span><span>${escapeHtml(term.difficulty)}</span></div>
            <h3>${highlightText(term.term, glossaryState.query)}</h3>
            <p>${highlightText(words(term.definition, 30), glossaryState.query)}</p>
            <button class="btn-secondary" type="button" data-app-action="glossary-detail" data-id="${term.id}">Ver detalle</button>
          </article>`).join("") || renderEmpty("Sin términos", "Ajusta los filtros del glosario.")}</div>
          </div>
          ${detail ? `<aside class="app-card glossary-detail">
            <div class="glossary-detail-head"><span class="badge-blue">${escapeHtml(detail.category)}</span><span>${escapeHtml(detail.difficulty)}</span></div>
            <h3>${escapeHtml(detail.term)}</h3>
            <p>${formatMathText(detail.definition)}</p>
            ${detail.formula ? `<div class="glossary-formula"><span>Fórmula o criterio</span><code>${escapeHtml(detail.formula)}</code></div>` : ""}
            <div class="apa-output">${formatMathText(detail.example)}</div>
            <div class="glossary-extra"><strong>Uso académico:</strong> ${formatMathText(detail.use || "Se usa para interpretar evidencia, construir argumentos y conectar teoría con decisiones empresariales reales.")}</div>
            <div class="glossary-extra glossary-writing-tip"><strong>Formato recomendado:</strong> define el concepto, explica el mecanismo, agrega un ejemplo y cierra con interpretación empresarial.</div>
            <div class="quick-row">${(detail.relatedTerms || []).map((id) => `<button class="app-chip" type="button" data-app-action="glossary-detail" data-id="${id}">${escapeHtml(glossaryTerms().find((t) => t.id === id)?.term || id)}</button>`).join("")}</div>
          </aside>` : ""}
        </div>
      </section>`;
    }

















    function renderTimelineApp() {
      const schools = ["all", ...new Set(timelineItems().map((item) => item.school))];
      const items = timelineItems().filter((item) => timelineSchool === "all" || item.school === timelineSchool);
      const pageCount = Math.max(1, Math.ceil(items.length / TIMELINE_PAGE_SIZE));
      timelinePage = Math.min(Math.max(0, timelinePage || 0), pageCount - 1);
      const start = timelinePage * TIMELINE_PAGE_SIZE;
      const visibleItems = items.slice(start, start + TIMELINE_PAGE_SIZE);
      const rangeStart = items.length ? start + 1 : 0;
      const rangeEnd = Math.min(start + TIMELINE_PAGE_SIZE, items.length);
      const firstYear = visibleItems[0]?.year || items[0]?.year || "";
      const lastYear = visibleItems.at(-1)?.year || items.at(-1)?.year || "";
      return `<section class="timeline-app timeline-app-pro">
        <div class="timeline-intro">
          <div>
            <span class="section-tag">Historia de la administración</span>
            <h3>${items.length} hitos ${timelineSchool === "all" ? "principales" : `de ${escapeHtml(timelineSchool)}`}</h3>
            <p>Recorrido cronológico por autores, obras y debates que explican valor, mercado, Estado, crisis, instituciones, información y comportamiento.</p>
          </div>
          <div class="timeline-count-card"><strong>${firstYear}</strong><span>${lastYear}</span></div>
        </div>
        <div class="app-tabs timeline-school-tabs">${schools.map((school) => `<button class="app-chip ${timelineSchool === school ? "active" : ""}" type="button" data-app-action="timeline-school" data-value="${school}">${school === "all" ? "Todas" : school}</button>`).join("")}</div>
        <div class="timeline-range-bar">
          <div>
            <span>Tramo ${rangeStart}-${rangeEnd} de ${items.length}</span>
            <strong>${firstYear} - ${lastYear}</strong>
          </div>
          <div class="timeline-pager">
            <button class="btn-secondary" type="button" data-app-action="timeline-page" data-direction="prev" ${timelinePage <= 0 ? "disabled" : ""}>Anterior</button>
            <span>Página ${timelinePage + 1}/${pageCount}</span>
            <button class="btn-primary" type="button" data-app-action="timeline-page" data-direction="next" ${timelinePage >= pageCount - 1 ? "disabled" : ""}>Siguiente</button>
          </div>
        </div>
        <div class="timeline-track timeline-window">${visibleItems.map((item, index) => `<article class="timeline-item" style="--school-color:${item.color};--row:${index % 2}">
          <span class="timeline-dot" aria-hidden="true"></span>
          <span class="badge-blue">${item.year}</span>
          <h3>${escapeHtml(item.person)}</h3>
          <p class="timeline-work"><strong>${escapeHtml(item.work)}</strong></p>
          <p>${escapeHtml(item.description)}</p>
          <div class="timeline-tags"><span class="badge-gold">${escapeHtml(item.school)}</span><span>${escapeHtml(item.concept)}</span></div>
        </article>`).join("")}</div>
      </section>`;
    }

    function renderTasksApp() {
      archiveOldTasks();
      const tasks = loadJson(TASK_TRACKER_KEY, []);
      const pending = tasks.filter((task) => task.status !== "Completada").length;
      const columns = ["Pendiente", "En progreso", "Completada"];
      return `<div class="view-heading"><div><h3>${pending} tareas pendientes</h3><p>Organiza entregas, lecturas y evaluaciones.</p></div><button class="btn-primary" type="button" data-app-action="task-form">Nueva tarea</button></div>${taskShowForm ? `<form class="portal-form-grid" data-app-form="task"><label><span>Título</span><input name="title" required></label><label><span>Materia</span><select name="subject">${subjectOptionsHtml()}</select></label><label><span>Fecha límite</span><input name="due" type="date" required></label><label><span>Prioridad</span><select name="priority"><option>Alta</option><option>Media</option><option>Baja</option></select></label><label class="full"><span>Notas</span><textarea name="notes"></textarea></label><button class="btn-primary full" type="submit">Guardar tarea</button></form>` : ""}<div class="kanban-board">${columns.map((col) => `<section class="kanban-column ${col === "Pendiente" ? "pending" : col === "En progreso" ? "progress" : "done"}"><h3>${col}</h3>${tasks.filter((task) => task.status === col).map(renderTaskCard).join("") || renderEmpty("Sin tareas", "No hay elementos en esta columna.")}</section>`).join("")}</div>${renderTaskCalendar(tasks)}`;
    }

    function renderTaskCard(task) {
      return `<article class="app-card"><span class="${taskUrgencyClass(task)}">${escapeHtml(task.priority)}</span><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(subjectById(task.subject)?.name || task.subject)}</p><small>Vence: ${formatDate(task.due)}</small><select data-task-status data-id="${task.id}">${["Pendiente", "En progreso", "Completada"].map((status) => `<option ${task.status === status ? "selected" : ""}>${status}</option>`).join("")}</select><button class="btn-secondary" type="button" data-app-action="task-delete" data-id="${task.id}">Eliminar</button></article>`;
    }

    function createTask(form) {
      const tasks = loadJson(TASK_TRACKER_KEY, []);
      tasks.unshift({ id: uid(), ...Object.fromEntries(new FormData(form)), status: "Pendiente", createdAt: Date.now() });
      studentStorage.setItem(TASK_TRACKER_KEY, JSON.stringify(tasks));
      taskShowForm = false;
      updateTaskBadge();
      showToast("Tarea creada", "Tu tablero se actualizó.", "success");
    }

    function updateTaskStatus(id, status) {
      const tasks = loadJson(TASK_TRACKER_KEY, []);
      const task = tasks.find((item) => item.id === id);
      if (task) {
        task.status = status;
        if (status === "Completada") {
          task.completedAt = Date.now();
        }
      }
      studentStorage.setItem(TASK_TRACKER_KEY, JSON.stringify(tasks));
      updateTaskBadge();
      renderActiveApp();
    }

    function deleteTask(id) {
      studentStorage.setItem(TASK_TRACKER_KEY, JSON.stringify(loadJson(TASK_TRACKER_KEY, []).filter((task) => task.id !== id)));
      updateTaskBadge();
      renderActiveApp();
    }

    function renderTaskCalendar(tasks) {
      const days = Array.from({ length: 31 }, (_, i) => i + 1);
      return `<article class="app-card"><h3>Calendario mensual</h3><div class="quick-row">${days.map((day) => {
        const has = tasks.some((task) => new Date(task.due + "T00:00:00").getDate() === day);
        return `<span class="app-chip ${has ? "active" : ""}">${day}</span>`;
      }).join("")}</div></article>`;
    }

    function updateTaskBadge() {
      const pending = loadJson(TASK_TRACKER_KEY, []).filter((task) => task.status !== "Completada").length;
      document.querySelectorAll('[data-app="tasks"]').forEach((button) => {
        button.dataset.pending = String(pending);
        button.title = `${pending} tareas pendientes`;
      });
    }

    function openGalleryModal(id) {
      const item = appData.merch.find((x) => x.id === id);
      const images = parseGallery(item?.imagenes);
      el.requestModalContent.innerHTML = DOMPurify.sanitize(`
        <div class="modal-header"><div><span class="eyebrow">Galería merch</span><h2>${escapeHtml(item?.nombre || "Producto")}</h2></div><button class="icon-only" type="button" data-close-request aria-label="Cerrar galería">×</button></div>
        ${images.length ? `<div class="gallery-grid">${images.map((src) => `<a href="${escapeAttribute(src)}" target="_blank" rel="noopener noreferrer"><img src="${escapeAttribute(src)}" alt="${escapeAttribute(item.nombre)}"></a>`).join("")}</div>` : renderEmpty("Sin imágenes cargadas", "El administrador puede agregar links de imágenes desde el panel de Merch.")}
        <div class="modal-actions"><button class="btn-primary" type="button" data-close-request>Cerrar</button></div>`);
      el.requestModalContent.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));
      el.requestModal.hidden = false;
    }
    function parseGallery(value = "") { return String(value || "").split(";").map((src) => src.trim()).filter(Boolean).slice(0, 4); }

    function openRequestModal(type, id) {
      const isTutoria = type === "tutoria";
      const item = isTutoria ? appData.tutorias.find((x) => x.id === id) : appData.merch.find((x) => x.id === id);
      const subject = isTutoria ? `Nueva inscripción a tutoría de ${item.materia}` : `Nueva reserva de merch: ${item.nombre}`;
      el.requestModalContent.innerHTML = DOMPurify.sanitize(`
        <div class="modal-header"><div><span class="eyebrow">${isTutoria ? "Tutoría" : "Merch"}</span><h2>${escapeHtml(isTutoria ? item.materia : item.nombre)}</h2></div><button class="icon-only" type="button" data-close-request aria-label="Cerrar solicitud">×</button></div>
        <form class="formsubmit-form" id="dynamicRequestForm" data-email-target="${isTutoria ? "tutoria" : "merch"}" method="POST" target="formSubmitFrame">
          <input type="hidden" name="_captcha" value="false"><input type="hidden" name="_template" value="table"><input type="hidden" name="_subject" value="${escapeAttribute(subject)}"><input type="hidden" name="_next" value="">
          <input type="hidden" name="${isTutoria ? "Materia" : "Producto"}" value="${escapeAttribute(isTutoria ? item.materia : item.nombre)}">
          <div class="portal-form-grid">
            <label><span>Nombre</span><input name="Nombre" id="requestName" type="text" required></label>
            <label><span>Correo</span><input name="Correo" id="requestEmail" type="email" required></label>
            <label><span>Ciclo</span><select name="Ciclo" id="requestCycle">${el.consultaCiclo.innerHTML}</select></label>
            ${isTutoria ? '<label class="full"><span>Mensaje opcional</span><textarea name="Mensaje" id="requestMessage" placeholder="Cuenta brevemente qué necesitas reforzar"></textarea></label>' : '<label><span>Talla</span><select name="Talla" id="requestSize"><option>No aplica</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></label><label><span>Cantidad</span><input name="Cantidad" id="requestQuantity" type="number" min="1" value="1" required></label><label class="full"><span>Método de pago preferido</span><select name="Método de pago" id="requestPayment"><option>Efectivo</option><option>Transferencia</option><option>Por coordinar</option></select></label>'}
          </div>
          <div class="modal-actions"><button class="btn-secondary" type="button" data-close-request>Cancelar</button><button class="btn-primary" type="submit">Enviar</button></div>
        </form>`);
      applyFormSubmitConfig();
      prefillKnownForms();
      el.requestModalContent.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));
      document.getElementById("dynamicRequestForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (event.currentTarget.dataset.emailConfigured !== "true") {
          event.preventDefault(); return showToast("Configura el correo receptor en Panel administrador → Configuración antes de enviar.", "error", "Correo destino pendiente");
        }
        const name = document.getElementById("requestName").value.trim();
        const email = document.getElementById("requestEmail").value.trim();
        const cycle = document.getElementById("requestCycle").value;
        if (!name || !email) { event.preventDefault(); return showToast("Campos incompletos", "Completa nombre y correo.", "error"); }
        const message = isTutoria ? (document.getElementById("requestMessage")?.value.trim() || item.tema) : `${item.nombre} · Talla: ${document.getElementById("requestSize")?.value || "No aplica"} · Cantidad: ${document.getElementById("requestQuantity")?.value || "1"} · Pago: ${document.getElementById("requestPayment")?.value || "Por coordinar"}`;
        if (!(await saveMessage({ type: isTutoria ? "Tutoría" : "Merch", name, email, cycle, subject, materia: isTutoria ? item.materia : "", producto: isTutoria ? "" : item.nombre, message, status: isTutoria ? "pendiente" : "pendiente" }))) return;
        showToast(isTutoria ? "Inscripción registrada" : "Reserva registrada", isTutoria ? "El tutor te contactará pronto." : "Te contactaremos para coordinar la entrega.", "success");
        setTimeout(closeRequestModal, 250);
        setTimeout(() => showSection("gracias", true), 300);
      });
      el.requestModal.hidden = false;
    }

    function openBookReservation(id) {
      const book = (appData.physicalBooks || []).find((item) => item.id === id);
      if (!book) return;
      const subject = `Reserva de libro físico: ${book.titulo}`;
      el.requestModalContent.innerHTML = DOMPurify.sanitize(`
        <div class="modal-header"><div><span class="eyebrow">Biblioteca física</span><h2>${escapeHtml(book.titulo)}</h2></div><button class="icon-only" type="button" data-close-request aria-label="Cerrar biblioteca física">×</button></div>
        <form class="formsubmit-form" id="bookReservationForm" method="POST" target="formSubmitFrame">
          <input type="hidden" name="_captcha" value="false"><input type="hidden" name="_template" value="table"><input type="hidden" name="_subject" value="${escapeAttribute(subject)}"><input type="hidden" name="_next" value="">
          <input type="hidden" name="Libro" value="${escapeAttribute(book.titulo)}">
          <div class="portal-form-grid">
            <label><span>Nombre completo</span><input name="Nombre" id="bookName" type="text" required></label>
            <label><span>Correo institucional</span><input name="Correo" id="bookEmail" type="email" required></label>
            <label><span>Ciclo</span><select name="Ciclo" id="bookCycle">${el.consultaCiclo.innerHTML}</select></label>
            <label><span>Teléfono o WhatsApp</span><input name="Teléfono" id="bookPhone" type="tel" placeholder="Opcional"></label>
            <label><span>Fecha sugerida de retiro</span><input name="Fecha de retiro" id="bookPickup" type="date"></label>
            <label class="full"><span>Comentario</span><textarea name="Comentario" id="bookMessage" placeholder="Horario en el que podrías acercarte o información adicional"></textarea></label>
          </div>
          <div class="modal-actions"><button class="btn-secondary" type="button" data-close-request>Cancelar</button><button class="btn-primary" type="submit">Reservar libro</button></div>
        </form>`);
      applyFormSubmitConfig();
      prefillKnownForms();
      el.requestModalContent.querySelectorAll("[data-close-request]").forEach((node) => node.addEventListener("click", closeRequestModal));
      document.getElementById("bookReservationForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("bookName").value.trim();
        const email = document.getElementById("bookEmail").value.trim();
        const cycle = document.getElementById("bookCycle").value;
        if (!name || !email || !cycle) { event.preventDefault(); return showToast("Campos incompletos", "Completa nombre, correo y ciclo.", "error"); }
        const pickup = document.getElementById("bookPickup").value;
        const phone = document.getElementById("bookPhone").value.trim();
        const message = `${book.titulo} · Retiro sugerido: ${pickup || "por coordinar"} · WhatsApp: ${phone || "no registrado"} · ${document.getElementById("bookMessage").value.trim()}`;
        if (!(await saveMessage({ type: "Libro Físico", name, email, cycle, producto: book.titulo, subject, message, status: "pendiente" }))) return;
        showToast("Reserva registrada", "Te contactaremos para coordinar el retiro presencial.", "success");
        setTimeout(closeRequestModal, 250);
        setTimeout(() => showSection("gracias", true), 300);
      });
      el.requestModal.hidden = false;
    }
    function closeRequestModal() { el.requestModal.hidden = true; }

    async function submitConsulta(event) {
 event.preventDefault(); if(!updateFormValidation(el.consultaForm,true))return;
 const button=event.submitter; if(button)button.disabled=true;
 const label=button?.textContent; if(button)button.textContent='Enviando…';
 const saved=await saveMessage({type:'Consulta',name:el.consultaNombre.value.trim(),email:el.consultaEmail.value.trim(),phone:el.consultaTelefono.value.trim(),cycle:el.consultaCiclo.value,subject:el.consultaTipo.value,message:el.consultaMensaje.value.trim()});
 if(button){button.disabled=false;button.textContent=label;} if(!saved)return;
 studentStorage.setItem('portal_last_thanks',JSON.stringify({type:'consulta',code:saved.trackingCode,date:saved.date}));
 el.consultaForm.reset(); showSection('gracias',true); showToast('Consulta enviada','Código: '+saved.trackingCode);
}

    
    function setupRealtimeValidation() {
      const forms = [el.consultaForm].filter(Boolean);
      forms.forEach((form) => {
        getValidationFields(form).forEach((field) => {
          if (field.tagName === "TEXTAREA") field.maxLength = 500;
          ["input", "change", "blur"].forEach((eventName) => field.addEventListener(eventName, () => updateFormValidation(form)));
          updateTextareaCounter(field);
        });
        updateFormValidation(form);
      });
    }

    function getValidationFields(form) {return [...form.querySelectorAll('input[required],select[required],textarea[required]')];}

    function updateFormValidation(form, reveal = false) {
      if (!form) return false;
      let valid = true;
      getValidationFields(form).forEach((field) => {
        const message = validateFieldMessage(field);
        valid = valid && !message;
        const shouldReveal = reveal || field.dataset.touched === "true" || String(field.value || "").trim().length > 0;
        setFieldError(field, shouldReveal ? message : "");
        updateTextareaCounter(field);
        if (!field.dataset.validationBlurBound) {
          field.dataset.validationBlurBound = "true";
          field.addEventListener("blur", () => {
            field.dataset.touched = "true";
            setFieldError(field, validateFieldMessage(field));
            updateFormValidation(form);
          });
        }
      });
      // The button stays usable: submitting reveals every pending field and focuses the first one.
      form.querySelector('button[type="submit"]')?.classList.toggle("is-incomplete", !valid);
      if (reveal && !valid) getValidationFields(form).find((field) => validateFieldMessage(field))?.focus();
      return valid;
    }

    function validateFieldMessage(field) {
      const value = String(field.value || "").trim();
      if (!value) return "Este campo es obligatorio.";
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ingresa un correo válido.";
      if (field.type === "tel" && !/^\+?[0-9][0-9 ()-]{6,18}[0-9]$/.test(value)) return "Ingresa un número válido, por ejemplo 0991234567.";
      if (field.tagName === "TEXTAREA" && value.length > 500) return "Máximo 500 caracteres.";
      return "";
    }

    function setFieldError(field, message) {
      const holder = field.closest("label") || field.parentElement;
      if (!holder) return;
      let error = holder.querySelector(".field-error");
      if (!error) {
        error = document.createElement("small");
        error.className = "field-error";
        holder.appendChild(error);
      }
      field.classList.toggle("is-invalid", Boolean(message));
      error.textContent = message || "";
      error.hidden = !message;
    }

    function updateTextareaCounter(field) {
      if (!field || field.tagName !== "TEXTAREA") return;
      const holder = field.closest("label") || field.parentElement;
      let counter = holder?.querySelector(".char-counter");
      if (!counter && holder) {
        counter = document.createElement("small");
        counter.className = "char-counter";
        holder.appendChild(counter);
      }
      if (!counter) return;
      const length = String(field.value || "").length;
      counter.textContent = `${length}/500 caracteres`;
      counter.classList.toggle("danger", length >= 400);
    }

    function openAdminLogin() {
 if (window.AdeRuntime?.staticMode && !window.AdeCloudAdmin?.available) {
   if (window.AdeRuntime.apiBase) window.open(window.AdeRuntime.apiBase, '_blank', 'noopener');
   else showToast('Administración no disponible', 'Esta publicación aún no está conectada con la administración.', 'info');
   return;
 }
 if (isAdmin) return openAdminPanel();
 el.adminEmailInput.value = ''; el.adminPasswordInput.value = '';
 if(window.AdeCloudAdmin?.available){
   el.adminEmailInput.value=window.AdeCloudAdmin.ownerEmail;
   document.querySelector('#adminLoginForm .admin-security-note').textContent='Acceso exclusivo de la ASO mediante Firebase. Debes verificar el correo antes de entrar. La sesión se cierra tras 30 minutos de inactividad.';
 }
 const cloudActions=document.getElementById('adminCloudActions');if(cloudActions)cloudActions.hidden=!window.AdeCloudAdmin?.available;
 el.adminLoginModal.hidden = false;
 setTimeout(()=>el.adminEmailInput.focus(),50);
}
    function closeAdminLogin() { el.adminLoginModal.hidden = true; }
    async function validateAdminByAppsScript(email, password) {
 try { return await portalApi('/api/login', {email,password}); }
 catch(error) { return {ok:false,error:error.message === 'Failed to fetch' ? 'No se puede conectar con el servidor de ASO ADE. Abre el portal desde la dirección del servidor, no como archivo HTML.' : error.message}; }
}

    async function submitAdminLogin(event) {
      event.preventDefault();
      const submitButton = event.submitter || el.adminLoginForm.querySelector('button[type="submit"]');
      submitButton?.classList.add("is-loading");
      if (submitButton) submitButton.disabled = true;
      const email = (el.adminEmailInput?.value || appData.settings.adminEmail || ADMIN_EMAIL || "").trim();
      const password = el.adminPasswordInput.value;
      const remote = await validateAdminByAppsScript(email, password);
      submitButton?.classList.remove("is-loading");
      if (submitButton) submitButton.disabled = false;
      if (!remote.ok) return showToast("No se pudo ingresar", remote.error || "Credenciales no autorizadas.", "error");
      if (!remote.token) return showToast("Sesión no válida", "El servidor no devolvió una sesión válida.", "error");
      el.adminPasswordInput.value = "";
      isAdmin = true;
      adminSessionToken = String(remote.token || "");
      await loadCriticalCollectionsFromSheets();
      await loadAdminInbox();
      touchAdminSession();
      logAdminAction("Inició sesión", "admin", "Acceso al panel de administración");
      closeAdminLogin();
      renderAll();
      openAdminPanel();
    }
    async function logoutAdmin() {
 if (typeof adminHasUnsavedChanges === 'function' && adminHasUnsavedChanges() && !(await confirmAction({title:'Cerrar sesión sin publicar',message:'Tienes cambios sin publicar. Se descartarán al cerrar la sesión.',confirmText:'Descartar y salir',cancelText:'Seguir editando'}))) return;
 el.adminLogoutButton.textContent='Cerrando sesión…';
 try { if(publishPending || publishInFlight) { const saved=await syncCriticalCollectionsToSheets(); if(!saved.ok) { el.adminLogoutButton.textContent='Cerrar sesión'; return; } } await portalApi('/api/logout',{}); }
 catch(error) { el.adminLogoutButton.textContent='Cerrar sesión'; showToast('No se pudo cerrar sesión',error.message,'error'); return; }
 isAdmin=false; adminSessionToken=''; appData.messages=[]; appData.adminLog=[];
 sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY); clearTimeout(adminInactivityTimer); lastAdminActivityWrite=0; closeAdminPanel();
 syncAdminMode(); await loadCriticalCollectionsFromSheets(); renderAll(); el.adminLogoutButton.textContent='Cerrar sesión'; showToast('Sesión cerrada','Has salido de la administración.');
}
    function syncAdminMode() {
      document.body.classList.toggle("admin-active", isAdmin);
      el.adminModeBar.hidden = !isAdmin;
      if (el.addMaterialButton) el.addMaterialButton.hidden = !isAdmin;
      el.adminOpenButton.setAttribute("aria-label", isAdmin ? "Abrir panel administrador activo" : "Abrir panel administrador");
    }
    async function validateAdminSessionOnLoad() {
 if (typeof window !== 'undefined' && window.AdeRuntime?.staticMode && !window.AdeCloudAdmin?.available) return;
 let restoredToken='';
 try { const session=await portalApi('/api/session'); if(adminSessionToken) return; isAdmin=true; restoredToken=session.token; adminSessionToken=restoredToken; await Promise.all([loadCriticalCollectionsFromSheets(),loadAdminInbox()]); touchAdminSession(); }
 catch { if(adminSessionToken===restoredToken) {isAdmin=false;adminSessionToken='';} }
}
    let lastAdminActivityWrite = 0;
    function touchAdminSession() {
      if (!isAdmin) return;
      const now = Date.now();
      if (now - lastAdminActivityWrite < 1000) return;
      lastAdminActivityWrite = now;
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(now));
      clearTimeout(adminInactivityTimer);
      adminInactivityTimer = setTimeout(expireAdminSession, ADMIN_SESSION_TIMEOUT_MS);
    }
    async function expireAdminSession() {
 if (!isAdmin) return;
 try { await portalApi('/api/logout',{}); } catch {}
 isAdmin=false; adminSessionToken=''; appData.messages=[]; appData.adminLog=[];
 clearTimeout(adminInactivityTimer); lastAdminActivityWrite=0; closeAdminPanel(); renderAll(); showToast('Sesión cerrada','Vuelve a ingresar para editar.','info');
}
    // The administration interface lives in admin.js; these wrappers keep repository shortcuts working.
    function toggleResource(id) { return admToggle("resources", id); }
    function deleteResourceInline(id) { return admDelete("resources", id); }
    function upsert(collection, payload) { appData[collection] = appData[collection] || []; const index = appData[collection].findIndex((item) => item.id === payload.id); if (index >= 0) appData[collection][index] = { ...appData[collection][index], ...payload }; else appData[collection].push(payload); }
    function addResource(payload) {
      const item = { id: uid(), ...payload };
      appData.resources.push(item);
      saveData();
      return item;
    }

    function hydrateDriveRepositoryCache() {
      const cached = loadJson(DRIVE_CACHE_KEY, null);
      if (cached && cached.rootFolderId === DRIVE_ROOT_FOLDER_ID && Array.isArray(cached.files)) applyDriveRepositoryPayload(cached, { fromCache: true });
      else driveRepositoryStatus.count = appData.resources.filter((item) => item.source === DRIVE_RESOURCE_SOURCE).length;
    }

    function applyDriveRepositoryPayload(payload, options = {}) {
      const files = Array.isArray(payload) ? payload : (payload.files || payload.resources || []);
      driveCatalogFiles = files;
      const driveResources = files.map(mapDriveFileToResource).filter(Boolean);
      const localResources = appData.resources.filter((item) => item.source !== DRIVE_RESOURCE_SOURCE);
      const seen = new Set();
      appData.resources = [...localResources, ...driveResources].filter((item) => {
        const key = item.id || `${item.cycleId}-${item.subjectId}-${item.typeId}-${item.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      driveRepositoryStatus = {
        enabled: true,
        loading: Boolean(options.fromCache && DRIVE_REPOSITORY_API_URL),
        count: driveResources.length,
        error: "",
        updatedAt: payload.updatedAt || payload.cachedAt || new Date().toISOString(),
        cached: Boolean(options.fromCache)
      };
      return driveResources;
    }

    async function loadDriveRepositoryResources(options = {}) {
      if (!DRIVE_REPOSITORY_API_URL) {
        driveRepositoryStatus = { ...driveRepositoryStatus, enabled: false, loading: false, count: appData.resources.filter((item) => item.source === DRIVE_RESOURCE_SOURCE).length, error: "", updatedAt: "" };
        return;
      }
      driveRepositoryStatus = { ...driveRepositoryStatus, enabled: true, loading: true, error: "" };
      try {
        const endpoint = new URL(DRIVE_REPOSITORY_API_URL, window.location.href);
        endpoint.searchParams.set("format", "json");
        endpoint.searchParams.set("rootFolderId", DRIVE_ROOT_FOLDER_ID);
        if (options.refresh) endpoint.searchParams.set("refresh", "1");
        endpoint.searchParams.set("_", Date.now().toString());
        const payload = window.AdeRuntime?.staticMode && !window.AdeRuntime.backendAvailable
          ? window.AdeLiveSnapshot?.available&&!options.refresh
            ? await window.AdeLiveSnapshot.get('drive').catch(()=>readDriveRepositoryPayload(endpoint))
            : await readDriveRepositoryPayload(endpoint)
          : await portalApi('/api/drive' + (options.refresh ? '?refresh=1' : ''));
        if (payload && payload.ok === false) throw new Error(payload.error || "Apps Script devolvió un error.");
        if (payload.rootFolderId && payload.rootFolderId !== DRIVE_ROOT_FOLDER_ID) throw new Error("El lector responde a otra carpeta de Drive. Revisa la configuración.");
        const driveResources = applyDriveRepositoryPayload(payload);
        try {
          studentStorage.setItem(DRIVE_CACHE_KEY, JSON.stringify({
            files: Array.isArray(payload) ? payload : (payload.files || payload.resources || []),
            rootFolderId: DRIVE_ROOT_FOLDER_ID,
            updatedAt: payload.updatedAt || new Date().toISOString(),
            cachedAt: new Date().toISOString()
          }));
        } catch (cacheError) {
          console.warn("No se pudo guardar caché de Drive.", cacheError);
        }
      } catch (error) {
        console.warn("No se pudo sincronizar Google Drive.", error);
        const cachedDriveCount = appData.resources.filter((item) => item.source === DRIVE_RESOURCE_SOURCE).length;
        driveRepositoryStatus = { enabled: true, loading: false, count: cachedDriveCount, error: error.message || "Error de conexión", updatedAt: driveRepositoryStatus.updatedAt || "" };
      }
    }

    async function readDriveRepositoryPayload(endpoint) {
      try {
        const response = await fetch(endpoint.toString(), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (/accounts\.google|ServiceLogin|signin|Inicia sesi[oó]n/i.test(text)) {
          throw new Error("Apps Script responde una pantalla de inicio de sesión");
        }
        try {
          return JSON.parse(text);
        } catch (error) {
          const scriptError = extractAppsScriptError(text);
          throw new Error(scriptError || "Apps Script no devolvió JSON válido");
        }
      } catch (fetchError) {
        return fetchDriveRepositoryJsonp(endpoint).catch((jsonpError) => {
          const reason = fetchError?.message || "Fetch falló";
          const jsonpReason = jsonpError?.message || "sin respuesta JSONP";
          throw new Error(`${reason}; respaldo JSONP: ${jsonpReason}`);
        });
      }
    }

    function extractAppsScriptError(text) {
      const clean = String(text || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const missingDoGet = clean.match(/No se encontr[oó][^\.]*(?:doGet|secuencia de comandos)[^\.]*/i);
      if (missingDoGet) return missingDoGet[0];
      if (/Exception|Error/i.test(clean)) return clean.slice(0, 220);
      return "";
    }

    function fetchDriveRepositoryJsonp(endpoint) {
      return new Promise((resolve, reject) => {
        const callback = `__driveRepoCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const url = new URL(endpoint.toString());
        const script = document.createElement("script");
        let finished = false;
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("tiempo de espera agotado"));
        }, 20000);
        const cleanup = () => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeout);
          delete window[callback];
          script.remove();
        };
        window[callback] = (payload) => {
          cleanup();
          resolve(payload);
        };
        script.onerror = () => {
          cleanup();
          reject(new Error("no se pudo cargar el script público"));
        };
        url.searchParams.set("callback", callback);
        script.src = url.toString();
        document.head.appendChild(script);
      });
    }

    function mapDriveFileToResource(file) {
      const cycle = matchDriveCycle(file.cycleId || file.cycle, file.cycleName || file.ciclo);
      if (!cycle) return null;
      const subject = matchDriveSubject(cycle, file.subjectId || file.subject, file.subjectName || file.materia);
      if (!subject) return null;
      const fileId = file.id || file.fileId || getGoogleDriveId(file.url || file.previewUrl || file.webViewUrl);
      const previewUrl = file.previewUrl || buildDrivePreviewUrl(file);
      const openUrl = file.webViewUrl || file.viewUrl || file.url || previewUrl;
      const typeId = normalizeDriveCategory(file.typeId || file.categoryId || file.categoryName || file.categoria || file.folderName || file.mimeType || file.name);
      const title = file.title || file.name || "Documento de Google Drive";
      return {
        id: `drive-${fileId || slugify(`${cycle.id}-${subject.id}-${typeId}-${title}`)}`,
        title,
        typeId,
        description: file.description || `Archivo sincronizado automáticamente desde Google Drive para ${subject.name}.`,
        url: previewUrl || openUrl,
        webViewUrl: openUrl,
        viewUrl: openUrl,
        downloadUrl: file.downloadUrl || (fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : ""),
        uploader: file.uploader || "Google Drive",
        date: String(file.updatedAt || file.createdAt || new Date().toISOString()).slice(0, 10),
        cycleId: cycle.id,
        subjectId: subject.id,
        hidden: false,
        fileName: file.name || title,
        fileType: file.mimeType || "",
        source: DRIVE_RESOURCE_SOURCE
      };
    }

    function matchDriveCycle(cycleId, cycleName) {
      const byId = cycleId ? CYCLES.find((cycle) => cycle.id === cycleId) : null;
      if (byId) return byId;
      const needle = normalize(cycleName || cycleId || "");
      if (!needle) return null;
      return CYCLES.find((cycle) => normalize(cycle.name) === needle || normalize(cycle.name).includes(needle) || needle.includes(normalize(cycle.name)));
    }

    function matchDriveSubject(cycle, subjectId, subjectNameValue) {
      const byId = subjectId ? cycle.subjects.find((subject) => subject.id === subjectId) : null;
      if (byId) return byId;
      const needle = normalize(subjectNameValue || subjectId || "");
      if (!needle) return null;
      return cycle.subjects.find((subject) => normalize(subject.name) === needle || normalize(subject.name).includes(needle) || needle.includes(normalize(subject.name)));
    }

    function normalizeDriveCategory(value) {
      const text = normalize(value || "");
      const direct = CATEGORIES.find((cat) => cat.id === value || normalize(cat.label) === text || text.includes(normalize(cat.label)));
      if (direct) return direct.id;
      if (/apunte|nota/.test(text)) return "apuntes";
      if (/diapositiva|presentacion|slide/.test(text)) return "diapositivas";
      if (/guia|guía/.test(text)) return "guias";
      if (/ejercicio|resuelto/.test(text)) return "ejercicios";
      if (/examen|prueba|leccion|lección/.test(text)) return "examenes";
      if (/libro|lectura|pdf/.test(text)) return "lecturas";
      if (/video/.test(text)) return "videos";
      if (/grabada|clase/.test(text)) return "clases-grabadas";
      if (/proyecto|trabajo/.test(text)) return "proyectos";
      return "adicional";
    }

    function buildDrivePreviewUrl(file) {
      const id = file.id || file.fileId || getGoogleDriveId(file.url || "");
      if (!id) return file.url || "";
      const mime = String(file.mimeType || "");
      if (mime === "application/vnd.google-apps.document") return `https://docs.google.com/document/d/${id}/preview`;
      if (mime === "application/vnd.google-apps.presentation") return `https://docs.google.com/presentation/d/${id}/preview`;
      if (mime === "application/vnd.google-apps.spreadsheet") return `https://docs.google.com/spreadsheets/d/${id}/preview`;
      return `https://drive.google.com/file/d/${id}/preview`;
    }

    function renderDriveRepositoryStatus() {
      if (!driveRepositoryStatus.enabled) {
        const folderUrl = appData.settings.driveFolderUrl || appData.settings.simplifiedDriveUrl || DRIVE_FOLDER_URL;
        return folderUrl
          ? `<div class="drive-sync-card muted"><strong>Carpeta compartida de ADE vinculada</strong><span>La carpeta se abre con tu cuenta y muestra los archivos actuales. La actualización automática del catálogo requiere un Apps Script lector válido; los ${driveRepositoryStatus.count || 0} materiales ya importados siguen disponibles.</span><a class="mini-action" href="${escapeAttribute(folderUrl)}" target="_blank" rel="noopener noreferrer">Abrir carpeta compartida</a></div>`
          : `<div class="drive-sync-card muted"><strong>Drive listo para conectar</strong><span>Configura la URL de la carpeta compartida y la URL /exec del lector de Apps Script. Los ${driveRepositoryStatus.count || 0} materiales guardados siguen en el repositorio.</span><button class="mini-action" type="button" data-open-admin-config>Configurar conexión</button></div>`;
      }
      if (driveRepositoryStatus.loading) {
        const cachedText = driveRepositoryStatus.cached && driveRepositoryStatus.count
          ? `Mostrando ${driveRepositoryStatus.count} materiales guardados mientras se actualiza Drive.`
          : "Buscando materiales en tu carpeta.";
        return `<div class="drive-sync-card muted"><strong>Sincronizando Google Drive</strong><span>${cachedText} Esta conexión puede tardar cerca de un minuto, pero el portal sigue funcionando.</span><a class="mini-action" href="${escapeAttribute(driveRepositoryUrl())}" target="_blank" rel="noopener noreferrer">Abrir carpeta</a></div>`;
      }
      if (driveRepositoryStatus.error) {
        const missingDoGet = /doGet|funci[oó]n de la secuencia/i.test(driveRepositoryStatus.error);
        const missingDeployment = /HTTP 404/i.test(driveRepositoryStatus.error);
        const accessIssue = /inicio de sesi[oó]n|signin|ServiceLogin|accounts\.google|Failed to fetch|no se pudo cargar el script p[uú]blico|tard[oó] m[aá]s de 30 segundos/i.test(driveRepositoryStatus.error);
        const helpText = missingDeployment
          ? "La URL de Apps Script guardada respondió HTTP 404 a la consulta del repositorio. Publica la Web App con doGet para Drive y actualiza la URL /exec en portal.js."
          : missingDoGet
          ? "El despliegue publicado no tiene el Code.gs correcto. Pega el archivo actualizado, guarda y reimplementa una nueva versión de la Web App."
          : accessIssue
          ? "Apps Script no está disponible para la página: puede estar privado o publicado sin doGet. Pega el Code.gs actualizado y reimplementa la Web App con acceso para cualquier persona."
          : "Revisa permisos, URL /exec, despliegue de Apps Script y carpetas compartidas.";
        const cacheText = driveRepositoryStatus.count
          ? ` Se mantienen ${driveRepositoryStatus.count} materiales de la última sincronización.`
          : " No hay materiales guardados de una sincronización anterior.";
        const statusTitle = missingDeployment && driveRepositoryStatus.count
          ? "Drive pendiente · materiales guardados disponibles"
          : "No se pudo sincronizar Drive";
        return `<div class="drive-sync-card error"><strong>${statusTitle}</strong><span>${escapeHtml(driveRepositoryStatus.error)}. ${helpText}${cacheText}</span><a class="mini-action" href="${escapeAttribute(driveRepositoryUrl())}" target="_blank" rel="noopener noreferrer">Abrir carpeta Drive</a></div>`;
      }
      return `<div class="drive-sync-card success"><strong>Drive de ASO conectado</strong><span>${driveRepositoryStatus.count} documentos públicos disponibles${driveRepositoryStatus.updatedAt ? ` · ${formatDate(driveRepositoryStatus.updatedAt)}` : ""}${driveRepositoryStatus.count ? "" : ". Añade materiales compartidos en Repositorio ADE para que aparezcan aquí."}</span><a class="mini-action" href="${escapeAttribute(driveRepositoryUrl())}" target="_blank" rel="noopener noreferrer">Abrir Repositorio ADE</a></div>`;
    }

    async function saveMessage(payload) {
 try {const result=await portalApi('/api/messages',payload); appData.messages.unshift(result.message); renderProfileSummary(); return result.message;}
 catch(error) {showToast('No se pudo enviar',error.message,'error');return null;}
}
    
    function countMessages(type, status) { return (appData.messages || []).filter((m) => m.type === type && (!status || m.status === status)).length; }

    function applyFormSubmitConfig() { document.querySelectorAll('.formsubmit-form').forEach(form=>{form.removeAttribute('action');form.removeAttribute('target');form.dataset.emailConfigured='true';}); }
    function applySectionVisibility() {
      document.querySelectorAll("[data-section]").forEach((section) => {
        if (["gracias"].includes(section.dataset.section)) return;
        section.classList.toggle("hidden-section", !isSectionEnabled(section.dataset.section));
      });
      document.querySelectorAll("#navLinks [data-tab]").forEach((link) => link.classList.toggle("hidden-section", !isSectionEnabled(link.dataset.tab)));
      applySectionMeta();
    }

    function visibleResources() { return appData.resources.filter((r) => !r.hidden); }
    function getResources({ cycleId, subjectId, typeId, query } = {}) {
      const q = normalize(query || "");
      return visibleResources().filter((r) => {
        const sourceOk = repoState.sourceFilter === "all"
          || (repoState.sourceFilter === "drive" && r.source === DRIVE_RESOURCE_SOURCE)
          || (repoState.sourceFilter === "local" && r.source !== DRIVE_RESOURCE_SOURCE);
        const searchable = [
          r.title,
          r.description,
          r.uploader,
          r.fileName,
          r.fileType,
          r.source === DRIVE_RESOURCE_SOURCE ? "Google Drive Drive automático" : "Local",
          categoryLabel(r.typeId),
          subjectName(r.cycleId, r.subjectId),
          findCycle(r.cycleId)?.name,
          resourceKind(r)
        ].join(" ");
        return sourceOk && (!cycleId || r.cycleId === cycleId) && (!subjectId || r.subjectId === subjectId) && (!typeId || typeId === "all" || r.typeId === typeId) && (!q || normalize(searchable).includes(q));
      }).sort((a, b) => repoState.sortOrder === "asc" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));
    }
    function countResources(filters) { return getResources(filters).length; }
    function countSubjects() { return SUBJECTS.length; }
    function findCycle(id) { return CYCLES.find((cycle) => cycle.id === id); }
    function findCycleBySubject(subjectId) { return CYCLES.find((cycle) => cycle.subjects.some((subject) => subject.id === subjectId)); }
    function subjectName(cycleId, subjectId) { return findCycle(cycleId)?.subjects.find((s) => s.id === subjectId)?.name || ""; }
    function categoryLabel(id) { return CATEGORIES.find((cat) => cat.id === id)?.label || id; }
    function linkLabel(id) { return ({ apuntes: "Ver apuntes", videos: "Ver video", "clases-grabadas": "Abrir clase", examenes: "Ver examen", diapositivas: "Ver diapositivas" })[id] || "Abrir link"; }
    function getYouTubeId(url) {
      const text = String(url || "");
      const match = text.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return match ? match[1] : "";
    }
    function normalizeYouTubeEmbed(url) {
      const youtubeId = getYouTubeId(url);
      return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : escapeAttribute(url || "https://www.youtube.com/embed/NU52K6NRXbA");
    }
    function renderVideoFrame(url, title = "Video") {
      const youtubeId = getYouTubeId(url);
      return youtubeId
        ? `<iframe src="https://www.youtube.com/embed/${escapeAttribute(youtubeId)}" title="${escapeAttribute(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
        : `<a class="portal-card" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer"><h3>Recurso externo</h3><p>${escapeHtml(url)}</p></a>`;
    }
    function getYouTubeEmbed(url) {
      try {
        const parsed = new URL(String(url || ""));
        const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
        if (!["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) return "";
        const videoId = host === "youtu.be" ? parsed.pathname.split("/").filter(Boolean)[0] : parsed.searchParams.get("v") || parsed.pathname.match(/^\/embed\/([^/]+)/)?.[1] || parsed.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
        const listId = parsed.searchParams.get("list");
        if (videoId && /^[\w-]{6,}$/.test(videoId)) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}${listId ? `?list=${encodeURIComponent(listId)}` : ""}`;
        if (listId) return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}`;
      } catch (_) { return ""; }
      return "";
    }

    function getGoogleDriveId(url) {
      const text = String(url || "");
      const patterns = [
        /drive\.google\.com\/drive\/folders\/([^/?#]+)/i,
        /drive\.google\.com\/file\/d\/([^/?#]+)/i,
        /drive\.google\.com\/open\?id=([^&#]+)/i,
        /drive\.google\.com\/uc\?id=([^&#]+)/i,
        /[?&]id=([^&#]+)/i
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return decodeURIComponent(match[1]);
      }
      return "";
    }
    function isPdfResource(item) {
      const url = String(item?.url || "").toLowerCase();
      return item?.fileType === "application/pdf" || url.startsWith("data:application/pdf") || /\.pdf(\?|#|$)/.test(url) || /drive\.google\.com\//.test(url);
    }
    function pdfViewerUrl(item) {
      const url = String(item?.url || "");
      const driveId = getGoogleDriveId(url);
      if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
      return url;
    }
    
    function renderEmpty(title, text) { return `<div class="empty-state"><div><strong>${title}</strong><span>${text}</span></div></div>`; }
    function latest(items, field, limit) { return [...items].sort((a, b) => new Date(b[field]) - new Date(a[field])).slice(0, limit); }
    function initials(value) {
      return String(value || "NA").replace(/^(Eco\.|Mgtr\.|PhD\.|Est\.)\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NA";
    }
    function resourceKind(item) {
      const url = String(item.url || "").toLowerCase();
      if (isPdfResource(item)) return "pdf";
      if (["videos", "clases-grabadas"].includes(item.typeId) || url.includes("youtube") || url.includes("youtu.be")) return "video";
      if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/.test(url)) return "image";
      if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip)(\?|$)/.test(url) || ["apuntes", "diapositivas", "guias", "lecturas", "examenes"].includes(item.typeId)) return "document";
      return "link";
    }
    function examTypeClass(value) {
      return normalize(value).replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u");
    }
    
    function daysUntil(value) {
      const target = new Date(String(value || new Date().toISOString().slice(0, 10)) + "T00:00:00");
      const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
      return Math.ceil((target - today) / 86400000);
    }
    
    function subjectOptionsHtml(selected = "") {
      return SUBJECTS.map((subject) => `<option value="${subject.id}" ${subject.id === selected ? "selected" : ""}>${subject.cycleName} · ${subject.name}</option>`).join("");
    }
    function subjectById(id) {
      return SUBJECTS.find((subject) => subject.id === id);
    }
    function words(value, max) {
      return String(value || "").split(/\s+/).slice(0, max).join(" ");
    }
    function shuffle(items) {
      return [...items].map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map((item) => item.value);
    }
    function downloadText(filename, text) {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    function archiveOldTasks() {
      const now = Date.now();
      const tasks = loadJson(TASK_TRACKER_KEY, []).filter((task) => task.status !== "Completada" || !task.completedAt || now - task.completedAt < 7 * 86400000);
      studentStorage.setItem(TASK_TRACKER_KEY, JSON.stringify(tasks));
    }
    function taskUrgencyClass(task) {
      const days = daysUntil(task.due);
      if (days <= 0 || task.priority === "Alta") return "badge-red";
      if (days <= 3 || task.priority === "Media") return "badge-orange";
      return "badge-green";
    }

    function quizQuestions() {
      // QUIZ ESTRICTO POR MATERIA:
      // No se usa EXCEL_QUIZ_BANK porque la base importada mezclaba temas
      // (ej. preguntas de cálculo dentro de Álgebra Lineal).
      // Cada pregunta se genera desde el nombre real de la asignatura.
      return SUBJECTS.flatMap((subject) => subjectQuizBank(subject).map((item, index) => ({
        id: `${subject.id}-strict-q-${index}`,
        ciclo: subject.cycleId,
        materia: subject.id,
        subjectName: subject.name,
        ...item
      })));
    }

    
    function subjectQuizBank(subject) {
      const area = getStrictQuizArea(subject.name);
      return buildStrictQuizBank(subject, area);
    }

    function getStrictQuizArea(subjectName = "") {
      const name = normalize(subjectName);
      if (name.includes("algebra")) return "algebra";
      if (name.includes("matematica financiera")) return "finanzas";
      if (name.includes("marketing") || name.includes("ventas") || name.includes("consumidor")) return "marketing";
      if (name.includes("talento humano") || name.includes("liderazgo") || name.includes("equipos")) return "talento";
      if (name.includes("financial") || name.includes("finanzas") || name.includes("presupuest")) return "finanzas";
      if (name.includes("sistema de informacion") || name.includes("herramientas informaticas") || name.includes("business intelligence") || name.includes("digital") || name.includes("e-commerce")) return "programacion";
      if (name.includes("estrategia") || name.includes("planificacion") || name.includes("negociacion") || name.includes("comunicacion")) return "administracion";
      if (name.includes("produccion") || name.includes("logistica") || name.includes("operaciones") || name.includes("calidad")) return "operativa";
      if (name.includes("emprendimiento") || name.includes("innovacion")) return "proyectos";
      if (name.includes("sostenibilidad") || name.includes("responsabilidad social")) return "administracion";
      if (name.includes("finanzas") || name.includes("evaluacion financiera")) return "finanzas";
      if (name.includes("calculo") || name.includes("matematica") || name.includes("matematicas")) return "matematica";
      if (name.includes("estadistica") || name.includes("multivariante")) return "estadistica";
      if (name.includes("contabilidad") || name.includes("costos")) return "contabilidad";
      if (name.includes("programacion")) return "programacion";
      if (name.includes("metodos dinamicos")) return "dinamicos";
      if (name.includes("econometria")) return "econometria";
      if (name.includes("microeconomia") || name.includes("organizacion industrial") || name.includes("economia empresarial")) return "micro";
      if (name.includes("macroeconomia") || name.includes("crecimiento") || name.includes("desarrollo") || name.includes("medicion economica")) return "macro";
      if (name.includes("teoria de juegos")) return "juegos";
      if (name.includes("internacional")) return "internacional";
      if (name.includes("historia") || name.includes("pensamiento") || name.includes("economia politica")) return "historia";
      if (name.includes("investigacion operativa")) return "operativa";
      if (name.includes("investigacion") || name.includes("mercados") || name.includes("integracion curricular") || name.includes("practica") || name.includes("auditoria")) return "investigacion";
      if (name.includes("politica") || name.includes("planificacion") || name.includes("publicas")) return "politica";
      if (name.includes("proyectos") || name.includes("programas")) return "proyectos";
      if (name.includes("experimental") || name.includes("comportamiento")) return "comportamiento";
      if (name.includes("administracion")) return "administracion";
      if (name.includes("derecho") || name.includes("estado") || name.includes("grupos sociales")) return "derecho";
      return "general";
    }

    function makeStrictQuestion(difficulty, topic, question, answer, distractors, explanation, tip) {
      const answerKey = normalize(String(answer || "").replace(/\[\/?math\]/g, ""));
      const seen = new Set([answerKey]);
      const safeDistractors = (distractors || []).filter((item) => {
        const key = normalize(String(item || "").replace(/\[\/?math\]/g, ""));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const options = shuffle([answer, ...safeDistractors].slice(0, 4));
      while (options.length < 4) options.push(["No corresponde al tema", "Depende de datos externos", "No se puede determinar"][options.length % 3]);
      return { difficulty, topic, question, options, correct: options.findIndex((item) => item === answer), explanation, tip };
    }

    function buildStrictQuizBank(subject, area) {
      const base = strictBaseQuestions(area);
      const topics = strictTopics(area);
      const result = [...base];
      let index = 0;
      const difficultyCycle = ["facil", "medio", "dificil"];
      while (result.length < 24) {
        const topic = topics[index % topics.length];
        const difficulty = difficultyCycle[index % difficultyCycle.length];
        result.push(makeStrictQuestion(
          difficulty,
          topic.title,
          `En ${subject.name}, ¿qué elemento corresponde mejor al tema "${topic.title}"?`,
          topic.answer,
          topic.distractors,
          `${topic.answer} es parte del tema "${topic.title}" dentro de ${subject.name}.`,
          `Relaciona el concepto con la asignatura ${subject.name}; no elijas respuestas de otras materias.`
        ));
        index += 1;
      }
      return result;
    }

    function strictBaseQuestions(area) {
      const q = makeStrictQuestion;
      const banks = {
        algebra: [
          q("facil", "Matrices", "En Álgebra Lineal, ¿qué es una matriz?", "Un arreglo rectangular de números organizado en filas y columnas", ["Una función de oferta", "Un impuesto indirecto", "Una tasa de interés"], "Una matriz organiza datos o coeficientes en filas y columnas.", "Piensa en tablas de coeficientes para sistemas de ecuaciones."),
          q("facil", "Determinantes", "Calcula el determinante de [[A = [2 3; 1 4]]].", "[[5]]", ["[[11]]", "[[-5]]", "[[8]]"], "[[det(A)=2·4-3·1=8-3=5]].", "Diagonal principal menos diagonal secundaria."),
          q("facil", "Vectores", "Si [[u=(2,3)]] y [[v=(1,4)]], ¿cuál es [[u+v]]?", "[[(3,7)]]", ["[[(2,12)]]", "[[(1,1)]]", "[[(3,1)]]"], "Se suman las componentes: [[(2+1,3+4)=(3,7)]].", "Suma componente con componente."),
          q("medio", "Sistemas lineales", "Resuelve el sistema [[x+y=5]], [[x-y=1]]. ¿Cuál es [[x]]?", "[[3]]", ["[[2]]", "[[4]]", "[[1]]"], "Sumando las ecuaciones: [[2x=6]], entonces [[x=3]].", "Usa suma o eliminación."),
          q("medio", "Inversa", "Una matriz cuadrada tiene inversa si:", "Su determinante es distinto de cero", ["Todas sus entradas son positivas", "Tiene más columnas que filas", "Su traza es igual a cero"], "La condición de invertibilidad es [[det(A)≠0]].", "Antes de invertir, revisa el determinante."),
          q("medio", "Producto matricial", "Si [[A]] es [[2x3]] y [[B]] es [[3x2]], entonces [[AB]] tiene dimensión:", "[[2x2]]", ["[[3x3]]", "[[2x3]]", "[[3x2]]"], "Las dimensiones internas coinciden y el resultado toma las externas: [[2x2]].", "Primera dimensión de A y segunda dimensión de B."),
          q("medio", "Independencia lineal", "Dos vectores son linealmente independientes cuando:", "Ninguno puede escribirse como múltiplo del otro", ["Siempre son paralelos", "Tienen la misma longitud", "Su suma es cero"], "La independencia significa que no hay combinación no trivial que genere el vector cero.", "Pregunta si uno depende del otro."),
          q("dificil", "Rango", "El rango de una matriz representa:", "El número de filas o columnas linealmente independientes", ["La suma de la diagonal", "La media de sus datos", "El valor máximo de la matriz"], "El rango mide cuánta información independiente contiene la matriz.", "Relaciona rango con pivotes e independencia."),
          q("dificil", "Valores propios", "Un valor propio [[λ]] de una matriz [[A]] cumple:", "[[Av = λv]] para algún vector no nulo [[v]]", ["[[A+λ=0]]", "[[v=0]] siempre", "[[det(A)=1]]"], "Los valores propios escalan vectores propios sin cambiar su dirección.", "Recuerda la ecuación característica."),
          q("dificil", "Diagonalización", "Una matriz diagonalizable permite:", "Representar la transformación usando una base de vectores propios", ["Eliminar todas las variables económicas", "Convertir cualquier matriz en una fila", "Evitar calcular determinantes"], "La diagonalización simplifica potencias y sistemas dinámicos lineales.", "Busca suficientes vectores propios independientes.")
        ],
        matematica: [
          q("facil", "Funciones", "Si [[f(x)=2x+5]], ¿cuál es [[f(3)]]?", "[[11]]", ["[[6]]", "[[8]]", "[[15]]"], "[[f(3)=2·3+5=11]].", "Sustituye x por 3."),
          q("facil", "Pendiente", "La pendiente de la recta que pasa por [[(2,5)]] y [[(6,13)]] es:", "[[2]]", ["[[4]]", "[[8]]", "[[1/2]]"], "[[m=(13-5)/(6-2)=8/4=2]].", "Usa cambio en y sobre cambio en x."),
          q("facil", "Ecuaciones", "Resuelve [[3x-7=11]].", "[[x=6]]", ["[[x=3]]", "[[x=4]]", "[[x=18]]"], "[[3x=18]], por tanto [[x=6]].", "Primero despeja el término con x."),
          q("medio", "Derivadas", "Deriva [[f(x)=3x^4-5x^2+7x]].", "[[f'(x)=12x^3-10x+7]]", ["[[f'(x)=3x^3-5x+7]]", "[[f'(x)=12x^4-10x^2]]", "[[f'(x)=7]]"], "Aplica la regla de la potencia a cada término.", "Baja el exponente y réstale uno."),
          q("medio", "Integrales", "Calcula [[∫(6x^2-4x+1)dx]].", "[[2x^3-2x^2+x+C]]", ["[[6x^3-4x^2+x+C]]", "[[12x-4+C]]", "[[2x^2-2x+C]]"], "Integra término a término.", "Comprueba derivando tu respuesta."),
          q("medio", "Límites", "Calcula [[lim_{x→2} (x^2-4)/(x-2)]].", "[[4]]", ["[[0]]", "[[2]]", "No existe"], "Factoriza: [[x^2-4=(x-2)(x+2)]], queda [[x+2]], en 2 vale 4.", "Factoriza antes de sustituir."),
          q("medio", "Logaritmos", "Resuelve [[ln(x)=3]].", "[[x=e^3]]", ["[[x=3e]]", "[[x=ln(3)]]", "[[x=0]]"], "La función inversa de [[ln]] es la exponencial.", "Aplica exponencial a ambos lados."),
          q("dificil", "Optimización", "Maximiza [[π(q)=80q-2q^2-200]]. ¿Cuál es [[q*]]?", "[[q*=20]]", ["[[q*=40]]", "[[q*=10]]", "[[q*=80]]"], "[[π'(q)=80-4q=0]], entonces [[q=20]].", "Deriva e iguala a cero."),
          q("dificil", "Cálculo económico", "Si [[C(q)=q^2+10q+25]], el costo marginal en [[q=5]] es:", "[[20]]", ["[[40]]", "[[10]]", "[[5]]"], "[[C'(q)=2q+10]], entonces [[C'(5)=20]].", "El marginal es la derivada."),
          q("dificil", "Series", "Para una progresión geométrica con [[a1=5]] y [[r=0.8]], la suma infinita es:", "[[25]]", ["[[5]]", "[[4]]", "[[10]]"], "[[S=a1/(1-r)=5/(1-0.8)=25]].", "Solo aplica si [[|r|<1]].")
        ],
        estadistica: [
          q("facil", "Media", "Datos: 70, 80 y 90. ¿Cuál es la media?", "[[80]]", ["[[70]]", "[[90]]", "[[240]]"], "[[(70+80+90)/3=80]].", "Suma y divide para el número de datos."),
          q("facil", "Mediana", "Datos ordenados: 2, 4, 7, 9, 10. La mediana es:", "[[7]]", ["[[4]]", "[[9]]", "[[6.4]]"], "La mediana es el valor central.", "Ordena los datos primero."),
          q("medio", "Probabilidad", "Si [[P(A)=0.4]] y [[P(B)=0.5]] son independientes, [[P(A∩B)]] es:", "[[0.20]]", ["[[0.90]]", "[[0.10]]", "[[0.45]]"], "Para independientes se multiplica: [[0.4·0.5=0.20]].", "Independencia implica producto."),
          q("medio", "Varianza", "La varianza mide:", "La dispersión promedio respecto a la media", ["El valor más frecuente", "La suma total", "El tamaño de la muestra únicamente"], "La varianza resume variabilidad de los datos.", "No confundir con media."),
          q("medio", "Correlación", "Una correlación cercana a [[1]] indica:", "Relación lineal positiva fuerte", ["Ausencia total de relación", "Relación negativa fuerte", "Causalidad garantizada"], "Correlación positiva alta no significa causalidad automática.", "Distingue correlación de causalidad."),
          q("dificil", "Puntaje z", "Con media [[10]] y desviación [[2]], el z-score de [[x=14]] es:", "[[2]]", ["[[4]]", "[[-2]]", "[[0.5]]"], "[[z=(14-10)/2=2]].", "Resta la media y divide para la desviación."),
          q("dificil", "Hipótesis", "En una prueba estadística, el p-valor pequeño generalmente lleva a:", "Rechazar [[H0]] si es menor que el nivel de significancia", ["Aceptar siempre [[H0]]", "Ignorar la muestra", "Aumentar la varianza"], "Si [[p<α]], se rechaza la hipótesis nula.", "Compara p-valor con alfa.")
        ],
        contabilidad: [
          q("facil", "Ecuación contable", "La ecuación contable básica es:", "Activo = Pasivo + Patrimonio", ["Pasivo = Activo + Patrimonio", "Ingreso = Activo + Gasto", "Patrimonio = Pasivo + Gasto"], "La empresa financia activos con deuda y patrimonio.", "Debe cuadrar siempre."),
          q("facil", "Debe y Haber", "Una cuenta de activo normalmente aumenta por:", "Debe", ["Haber", "Cierre", "Nota de crédito únicamente"], "Los activos aumentan en el Debe.", "Recuerda la naturaleza de las cuentas."),
          q("medio", "Patrimonio", "Si Activo=10000 y Pasivo=4000, el Patrimonio es:", "6000", ["14000", "4000", "10000"], "Patrimonio = Activo - Pasivo = 6000.", "Despeja la ecuación contable."),
          q("medio", "Asiento contable", "Una compra de equipo al contado produce:", "Aumenta equipo y disminuye caja", ["Aumenta solo gastos", "Disminuye pasivo", "Aumenta ingresos"], "Se cambia un activo por otro.", "Identifica qué cuentas se afectan."),
          q("dificil", "Depreciación", "La depreciación registra:", "La pérdida de valor de un activo fijo por uso o tiempo", ["Un aumento de caja", "Un ingreso financiero", "Una deuda bancaria"], "Distribuye el costo del activo en su vida útil.", "Relaciona depreciación con activos fijos."),
          q("dificil", "Costos", "En costos, la materia prima directa es:", "Un costo identificable con el producto", ["Un gasto administrativo", "Un impuesto", "Un ingreso diferido"], "Se puede asociar directamente a la producción.", "Diferencia costo directo e indirecto.")
        ],
        programacion: [
          q("facil", "Variables", "En programación, una variable sirve para:", "Guardar un valor que puede cambiar o usarse después", ["Crear solo imágenes", "Eliminar datos", "Definir una ley económica"], "Una variable almacena información.", "Piensa en una caja con nombre."),
          q("facil", "Condicionales", "Un [[if]] se usa para:", "Ejecutar instrucciones según una condición", ["Repetir siempre infinitamente", "Guardar imágenes", "Ordenar una matriz económica"], "Los condicionales deciden caminos en el programa.", "Si se cumple, hace una cosa; si no, otra."),
          q("medio", "Bucles", "Un bucle [[for]] permite:", "Repetir instrucciones sobre una secuencia", ["Declarar impuestos", "Calcular PIB únicamente", "Cerrar un archivo siempre"], "Recorre listas, rangos u objetos iterables.", "Úsalo cuando haya repetición."),
          q("medio", "Listas", "Una lista en Python se escribe normalmente con:", "[[corchetes []]]", ["Paréntesis solo", "Comillas dobles únicamente", "Signo igual sin nombre"], "Las listas se declaran con corchetes.", "Ejemplo: [[datos=[1,2,3]]]."),
          q("dificil", "Funciones", "Una función sirve para:", "Agrupar instrucciones reutilizables", ["Eliminar variables", "Convertir texto en impuesto", "Bloquear todo código"], "Permite organizar y reutilizar código.", "Evita repetir instrucciones."),
          q("dificil", "Depuración", "Depurar código significa:", "Encontrar y corregir errores", ["Aumentar el precio", "Guardar una matriz", "Eliminar todas las funciones"], "La depuración mejora funcionamiento y confiabilidad.", "Lee mensajes de error y prueba por partes.")
        ],
        micro: [
          q("facil", "Demanda", "Según la ley de demanda, si sube el precio, la cantidad demandada normalmente:", "Disminuye", ["Aumenta", "No cambia jamás", "Se vuelve infinita"], "Precio y cantidad demandada suelen moverse en sentido contrario.", "No confundas movimiento con desplazamiento."),
          q("facil", "Oferta", "La curva de oferta normalmente tiene pendiente:", "Positiva", ["Negativa", "Cero siempre", "Vertical siempre"], "A mayor precio, los productores desean ofrecer más.", "Relaciona precio con incentivo a producir."),
          q("medio", "Equilibrio", "Si [[Qd=100-2P]] y [[Qs=20+2P]], el precio de equilibrio es:", "[[20]]", ["[[30]]", "[[40]]", "[[10]]"], "Iguala demanda y oferta: [[100-2P=20+2P]], [[P=20]].", "En equilibrio, cantidad demandada iguala ofrecida."),
          q("medio", "Elasticidad", "Si la elasticidad precio es [[-2]] y el precio sube 5%, la cantidad cambia aproximadamente:", "[[-10%]]", ["[[+10%]]", "[[-2%]]", "[[+5%]]"], "[[%ΔQ=E·%ΔP=-2·5%=-10%]].", "Multiplica elasticidad por variación del precio."),
          q("dificil", "Excedente", "El excedente del consumidor mide:", "La diferencia entre disposición a pagar y precio pagado", ["El costo total", "La deuda pública", "La inflación"], "Mide beneficio neto del consumidor.", "Área bajo demanda y sobre precio."),
          q("dificil", "Monopolio", "En monopolio, el precio suele ser mayor que:", "El costo marginal", ["El ingreso total", "La población", "La tasa de desempleo"], "El monopolista elige cantidad donde IMg=CMg y cobra sobre la demanda.", "Compara poder de mercado con competencia perfecta.")
        ],
        macro: [
          q("facil", "PIB", "La identidad del PIB por gasto es:", "[[PIB=C+I+G+X-M]]", ["[[PIB=P+Q]]", "[[PIB=A-P]]", "[[PIB=IT-CT]]"], "El PIB por gasto suma consumo, inversión, gasto público y exportaciones netas.", "Recuerda restar importaciones."),
          q("facil", "Inflación", "La inflación es:", "Aumento sostenido del nivel general de precios", ["Caída de la población", "Aumento de una sola mercancía", "Un asiento contable"], "Se mide con índices de precios.", "No confundir con precio individual."),
          q("medio", "PIB", "Si [[C=50]], [[I=20]], [[G=30]], [[X=15]], [[M=10]], el PIB es:", "[[105]]", ["[[115]]", "[[95]]", "[[125]]"], "[[50+20+30+15-10=105]].", "Suma C, I, G y X; resta M."),
          q("medio", "Multiplicador", "Con propensión marginal a consumir [[c=0.8]], el multiplicador simple es:", "[[5]]", ["[[1.25]]", "[[0.2]]", "[[4]]"], "[[1/(1-c)=1/(1-0.8)=5]].", "Mientras más alta c, mayor el multiplicador."),
          q("dificil", "Política fiscal", "Una política fiscal expansiva normalmente busca:", "Aumentar demanda agregada mediante gasto o impuestos", ["Reducir siempre el PIB", "Eliminar todo consumo", "Cerrar el banco central"], "Se usa para estimular actividad económica.", "Relaciona gasto público e impuestos."),
          q("dificil", "Desempleo", "La tasa de desempleo se calcula respecto a:", "La población económicamente activa", ["Toda la población total", "Solo niños", "Solo jubilados"], "Mide desempleados sobre fuerza laboral.", "No uses población total como denominador.")
        ],
        econometria: [
          q("facil", "Regresión", "En [[y=β0+β1x+u]], [[β1]] representa:", "El cambio esperado de y ante una unidad adicional de x", ["El error aleatorio", "El tamaño de muestra", "La media de x"], "La pendiente mide efecto marginal esperado.", "Interpreta signos y unidades."),
          q("medio", "Predicción", "Si [[β1=2.5]] y [[x]] aumenta 4, el cambio esperado en [[y]] es:", "[[10]]", ["[[2.5]]", "[[4]]", "[[6.5]]"], "[[2.5·4=10]].", "Multiplica pendiente por cambio de x."),
          q("medio", "R cuadrado", "El [[R^2]] mide:", "Proporción de variabilidad de y explicada por el modelo", ["Causalidad garantizada", "Sesgo cero siempre", "Número de variables"], "Es una medida de ajuste, no prueba causalidad por sí sola.", "No confundir ajuste con causalidad."),
          q("dificil", "Heterocedasticidad", "La heterocedasticidad significa:", "Varianza del error no constante", ["Media de x igual a cero", "Intercepto nulo", "R² negativo"], "Afecta errores estándar y pruebas.", "Mira dispersión de residuos."),
          q("dificil", "Variables omitidas", "El sesgo por variable omitida aparece cuando:", "Se excluye una variable relevante correlacionada con la explicativa", ["Aumenta el tamaño muestral", "Todas las variables son constantes", "El modelo tiene intercepto"], "La omisión contamina el coeficiente estimado.", "Pregunta si falta un factor importante.")
        ],
        dinamicos: [
          q("facil", "Equilibrio", "En un sistema dinámico, un equilibrio ocurre cuando:", "Las variables no cambian en el tiempo", ["Todas las variables crecen siempre", "No existen ecuaciones", "El tiempo desaparece"], "En equilibrio las derivadas o diferencias son cero.", "Busca puntos donde el cambio sea nulo."),
          q("medio", "Estabilidad", "Un equilibrio estable implica que:", "Trayectorias cercanas tienden a regresar al equilibrio", ["Las trayectorias se alejan siempre", "No hay solución", "El sistema no cambia jamás"], "La estabilidad analiza comportamiento alrededor del equilibrio.", "Observa qué pasa ante una pequeña perturbación."),
          q("medio", "Linealización", "Linealizar un sistema sirve para:", "Aproximar el comportamiento local cerca del equilibrio", ["Cambiar la materia a contabilidad", "Eliminar variables", "Garantizar crecimiento infinito"], "La matriz jacobiana resume efectos locales.", "Se usa para estudiar estabilidad local."),
          q("dificil", "Autovalores", "En sistemas lineales, autovalores con parte real negativa suelen indicar:", "Estabilidad local", ["Explosión siempre", "Ausencia de solución", "Precio de equilibrio"], "La parte real determina convergencia o divergencia.", "Revisa signo de la parte real."),
          q("dificil", "Diagrama de fase", "Un diagrama de fase muestra:", "Dirección de movimiento de las variables", ["Solo balances contables", "Un histograma", "Una tabla de costos"], "Ayuda a visualizar trayectorias dinámicas.", "Usa flechas y nulclinas.")
        ],
        finanzas: [
          q("facil", "Interés simple", "Con capital 100 y tasa 10% por un año, el monto es:", "[[110]]", ["[[100]]", "[[90]]", "[[10]]"], "[[100(1+0.10)=110]].", "Convierte porcentaje a decimal."),
          q("medio", "Valor presente", "El valor presente sirve para:", "Traer flujos futuros al momento actual", ["Sumar unidades sin descuento", "Medir inflación únicamente", "Registrar inventarios"], "Descuenta flujos con una tasa.", "El dinero en el tiempo no vale igual."),
          q("medio", "VAN", "Si inviertes 100 y recibes 120 en un año con tasa 10%, el VAN aproximado es:", "[[9.09]]", ["[[20]]", "[[-9.09]]", "[[120]]"], "[[VAN=-100+120/1.10=9.09]].", "Descuenta antes de restar la inversión."),
          q("dificil", "TIR", "La TIR es:", "La tasa que hace VAN igual a cero", ["La tasa de inflación", "El impuesto al consumo", "La utilidad bruta"], "Es una tasa interna de rentabilidad del proyecto.", "Compárala con el costo de capital."),
          q("dificil", "Riesgo", "Mayor riesgo financiero normalmente exige:", "Mayor rendimiento esperado", ["Menor tasa siempre", "Eliminar descuento", "No evaluar flujos"], "El inversionista pide compensación por riesgo.", "Relaciona riesgo y retorno.")
        ],
        historia: [
          q("facil", "Economía clásica", "Adam Smith se asocia con:", "Mano invisible y división del trabajo", ["Curva IS-LM", "Teoría de juegos moderna", "Modelo probit"], "Smith explicó coordinación de mercado y especialización.", "Ubica autores por escuela."),
          q("medio", "Keynes", "Keynes planteó que en recesión puede ser necesario:", "Impulsar demanda agregada con política fiscal", ["Eliminar toda intervención", "Reducir siempre gasto", "Ignorar desempleo"], "Keynes enfatizó demanda efectiva y rol estabilizador del Estado.", "Conecta teoría con crisis y desempleo."),
          q("dificil", "Marxismo", "El marxismo analiza principalmente:", "Relaciones de producción, clases y distribución", ["Solo matrices", "Solo derivadas", "Únicamente encuestas"], "Estudia conflicto distributivo e instituciones económicas.", "Mira poder, propiedad y distribución.")
        ],
        investigacion: [
          q("facil", "Pregunta de investigación", "Una buena pregunta de investigación debe ser:", "Clara, delimitada y investigable", ["Ambigua", "Imposible de medir", "Solo opinión personal"], "Debe guiar objetivos, método y datos.", "Evita mezclar dos problemas."),
          q("medio", "Hipótesis", "Una hipótesis es:", "Una proposición comprobable sobre relación entre variables", ["Un dato ya confirmado siempre", "Una tabla de Excel", "Un título decorativo"], "Se contrasta con evidencia.", "Debe poder evaluarse."),
          q("medio", "Muestra", "Una muestra representativa busca:", "Reflejar características de la población", ["Elegir solo conocidos", "Eliminar variabilidad", "Evitar datos"], "Reduce sesgo de selección.", "Piensa en la población objetivo."),
          q("dificil", "Validez", "La validez interna se refiere a:", "Credibilidad causal del resultado", ["Tamaño de letra", "Color de tabla", "Número de páginas"], "Evalúa si el diseño permite atribuir efectos.", "Distingue validez interna y externa."),
          q("dificil", "Ética", "El consentimiento informado es importante porque:", "La persona acepta participar conociendo objetivos y uso de datos", ["Obliga a responder", "Elimina todo sesgo", "Sustituye el análisis"], "Protege derechos de participantes.", "La ética no es opcional.")
        ],
        operativa: [
          q("facil", "Programación lineal", "Una restricción representa:", "Un límite de recursos o condición del problema", ["Una variable aleatoria", "Un impuesto", "Una tasa de inflación"], "Delimita la región factible.", "Piensa en capacidad, presupuesto o tiempo."),
          q("medio", "Función objetivo", "La función objetivo sirve para:", "Maximizar o minimizar un criterio", ["Registrar contabilidad", "Medir población", "Crear un gráfico sin datos"], "Puede ser utilidad, costo o beneficio.", "Pregunta qué se quiere optimizar."),
          q("dificil", "Óptimo", "En programación lineal, el óptimo suele ubicarse en:", "Un punto extremo de la región factible", ["El centro exacto siempre", "Un punto fuera de restricciones", "Una variable eliminada"], "Los vértices son candidatos principales.", "Evalúa esquinas factibles.")
        ],
        juegos: [
          q("facil", "Estrategia", "En teoría de juegos, una estrategia es:", "Un plan de acción de un jugador", ["Un asiento contable", "Una derivada", "Un indicador macro"], "Define cómo actúa ante escenarios.", "Piensa en decisiones de jugadores."),
          q("medio", "Nash", "Un equilibrio de Nash ocurre cuando:", "Ningún jugador quiere desviarse unilateralmente", ["Todos ganan lo máximo social", "No existen incentivos", "Siempre cooperan"], "Cada estrategia es mejor respuesta a las demás.", "Fija la decisión rival y evalúa."),
          q("dificil", "Dominante", "Una estrategia dominante es:", "Mejor sin importar lo que haga el otro jugador", ["Peor en todos los casos", "Aleatoria siempre", "Solo válida con impuestos"], "Domina frente a cualquier acción rival.", "Compara por filas o columnas.")
        ],
        internacional: [
          q("facil", "Ventaja comparativa", "La ventaja comparativa depende de:", "Menor costo de oportunidad", ["Mayor población", "Mayor inflación", "Más impuestos"], "Se especializa donde sacrifica menos.", "No es lo mismo que ventaja absoluta."),
          q("medio", "Tipo de cambio", "Una depreciación de la moneda local tiende a:", "Abaratar exportaciones y encarecer importaciones", ["Eliminar déficit fiscal", "Reducir exportaciones siempre", "No afectar precios"], "Cambia precios relativos externos.", "Piensa en bienes transables."),
          q("dificil", "Balanza comercial", "La condición Marshall-Lerner se relaciona con:", "Elasticidades de exportaciones e importaciones", ["Tasa de desempleo natural", "Rango matricial", "Depreciación contable"], "Indica si depreciar mejora balanza comercial.", "Importa la respuesta de cantidades.")
        ],
        politica: [
          q("facil", "Política pública", "Una política pública es:", "Una acción del Estado para atender un problema colectivo", ["Un asiento contable", "Una matriz identidad", "Una preferencia individual sin instituciones"], "Busca resolver problemas públicos.", "Identifica problema, instrumento y población."),
          q("medio", "Indicadores", "Un buen indicador debe ser:", "Medible, relevante y verificable", ["Ambiguo", "Imposible de observar", "Solo decorativo"], "Permite evaluar avance.", "Sin indicadores no hay seguimiento."),
          q("dificil", "Evaluación", "Evaluar una política significa:", "Analizar resultados frente a objetivos y evidencia", ["Solo anunciarla", "Ignorar costos", "Eliminar beneficiarios"], "La evaluación mejora decisiones públicas.", "Compara antes/después y contrafactual si aplica.")
        ],
        proyectos: [
          q("facil", "Proyecto", "Un proyecto se caracteriza por:", "Objetivos, actividades, recursos y tiempo definido", ["Ser permanente sin metas", "No usar presupuesto", "No tener beneficiarios"], "Tiene inicio, fin y resultados esperados.", "Identifica objetivo y alcance."),
          q("medio", "Beneficio-costo", "Si beneficios presentes son 150 y costos presentes 100, la relación B/C es:", "[[1.5]]", ["[[0.67]]", "[[50]]", "[[250]]"], "[[B/C=150/100=1.5]].", "Divide beneficios para costos."),
          q("dificil", "Impacto", "Un grupo de control sirve para:", "Estimar qué habría ocurrido sin intervención", ["Subir el presupuesto", "Eliminar todos los datos", "Reemplazar objetivos"], "Permite construir contrafactual.", "La clave es atribución causal.")
        ],
        comportamiento: [
          q("facil", "Sesgos", "Un sesgo cognitivo es:", "Una desviación sistemática en la toma de decisiones", ["Una cuenta contable", "Un impuesto", "Una matriz diagonal"], "Afecta elecciones individuales.", "Relaciona psicología y economía."),
          q("medio", "Nudge", "Un nudge busca:", "Orientar decisiones sin prohibir opciones", ["Obligar siempre", "Eliminar libertad", "Subir impuestos"], "Modifica arquitectura de elección.", "No confundir con mandato."),
          q("dificil", "Aversión a pérdidas", "La aversión a pérdidas implica que:", "Las pérdidas pesan más que ganancias equivalentes", ["Las ganancias siempre pesan más", "No existen preferencias", "La gente decide perfectamente siempre"], "Es un resultado central de economía conductual.", "Compara utilidad percibida.")
        ],
        marketing: [
          q("facil", "Segmentación", "Una empresa agrupa clientes por necesidades y hábitos de compra. ¿Qué decisión está tomando?", "Segmentación de mercado", ["Depreciación contable", "Control de calidad", "Estructura de capital"], "La segmentación identifica grupos con características o necesidades semejantes.", "Piensa en cómo se define el público objetivo."),
          q("facil", "Propuesta de valor", "¿Qué debe explicar una propuesta de valor?", "Qué necesidad atiende y qué beneficio ofrece a un segmento", ["Solo el organigrama", "La suma de activos y pasivos", "El calendario tributario"], "Una propuesta de valor conecta una oferta con una necesidad relevante del cliente.", "Define cliente, problema y beneficio."),
          q("medio", "Tasa de conversión", "Una campaña recibe 200 visitas y genera 14 compras. ¿Cuál es su conversión?", "7 %", ["14 %", "28 %", "0,7 %"], "Conversión = compras / visitas × 100 = 14 / 200 × 100 = 7 %.", "Divide las compras para el total de visitas y multiplica por 100."),
          q("medio", "Margen de contribución", "Un producto se vende en $40 y su costo variable es $25. ¿Cuánto aporta cada unidad a cubrir costos fijos?", "$15", ["$25", "$40", "$65"], "Margen unitario = precio − costo variable = 40 − 25 = $15.", "Resta el costo variable del precio."),
          q("dificil", "Elasticidad de demanda", "Si la elasticidad precio es −1,5 y el precio sube 4 %, ¿qué variación aproximada se espera en la cantidad demandada?", "Disminuye 6 %", ["Aumenta 6 %", "Disminuye 1,5 %", "Aumenta 4 %"], "%ΔQ ≈ elasticidad × %ΔP = −1,5 × 4 % = −6 %.", "Multiplica la elasticidad por el cambio porcentual del precio."),
          q("dificil", "Marketing mix", "Una empresa cambia el canal de venta, mantiene el producto y ajusta promoción y precio. ¿Qué está coordinando?", "Las variables del marketing mix", ["El ciclo contable", "La matriz de pagos", "La política monetaria"], "Producto, precio, plaza y promoción deben responder al segmento y a la propuesta de valor.", "Revisa las cuatro decisiones comerciales."),
        ],
        talento: [
          q("facil", "Perfil de puesto", "¿Para qué sirve un perfil de puesto?", "Definir funciones, responsabilidades y competencias requeridas", ["Calcular el VAN", "Establecer precios al consumidor", "Determinar el tipo de cambio"], "El perfil orienta selección, evaluación y desarrollo de personas.", "Relaciona el cargo con tareas y competencias."),
          q("facil", "Inducción", "¿Cuál es el objetivo de la inducción de una persona nueva?", "Facilitar su integración al rol, las normas y el equipo", ["Reemplazar toda capacitación", "Medir la inflación", "Aumentar inventario"], "Una inducción clara reduce incertidumbre y acelera la incorporación.", "Piensa en los primeros días de trabajo."),
          q("medio", "Rotación de personal", "Una empresa inicia el trimestre con 48 trabajadores, termina con 52 y registra 5 salidas. ¿Cuál es la rotación aproximada?", "10 %", ["5 %", "9,6 %", "20 %"], "Promedio de personal = (48 + 52) / 2 = 50; rotación = 5 / 50 × 100 = 10 %.", "Calcula primero el promedio de trabajadores."),
          q("medio", "Evaluación del desempeño", "Una evaluación útil compara resultados con:", "Metas, funciones y criterios acordados", ["Preferencias personales sin evidencia", "Solo la antigüedad", "Resultados de otra organización sin contexto"], "Los criterios claros hacen la evaluación más consistente y útil para mejorar.", "Busca evidencia relacionada con el rol."),
          q("dificil", "Capacitación", "¿Qué indicador ayuda a valorar si una capacitación mejoró el desempeño?", "Cambio en un resultado laboral relacionado con el objetivo del curso", ["Número de diapositivas", "Duración sin medir aprendizaje", "Asistencia de personas ajenas al área"], "La evaluación debe relacionar aprendizaje con aplicación y resultados del trabajo.", "Compara una medida pertinente antes y después."),
          q("dificil", "Compensación", "Al comparar salarios entre puestos, ¿qué criterio ayuda a sostener equidad interna?", "Responsabilidad, competencias y valoración consistente de los puestos", ["Asignar montos al azar", "Usar solo el salario de la jefatura", "Ignorar funciones y nivel de responsabilidad"], "La equidad interna compara puestos con criterios comunes y transparentes.", "Distingue equidad interna de competitividad externa."),
        ],
        administracion: [
          q("facil", "Planeación", "La planeación consiste en:", "Definir objetivos y acciones para lograrlos", ["Registrar solo ventas", "Calcular determinantes", "Medir inflación"], "Es una función básica de administración.", "Primero se planifica, luego se ejecuta."),
          q("medio", "Organización", "Organizar implica:", "Asignar recursos, tareas y responsabilidades", ["No delegar nada", "Eliminar objetivos", "Ignorar procesos"], "Ordena el trabajo para cumplir metas.", "Relaciona personas, recursos y funciones."),
          q("dificil", "Control", "El control administrativo sirve para:", "Comparar resultados con objetivos y corregir desviaciones", ["Crear inflación", "Resolver matrices", "Evitar evaluación"], "Permite retroalimentación.", "Mide, compara y ajusta.")
        ],
        derecho: [
          q("facil", "Contrato", "Un contrato es:", "Un acuerdo que genera obligaciones entre partes", ["Una matriz", "Un indicador de inflación", "Una derivada"], "El derecho regula obligaciones y responsabilidades.", "Identifica sujetos, objeto y obligaciones."),
          q("medio", "Empresa", "La responsabilidad limitada significa:", "Los socios responden hasta el monto aportado según la figura legal", ["Responden siempre con todo sin excepción", "No existen obligaciones", "La empresa no paga impuestos"], "Depende del tipo societario.", "Distingue persona natural y jurídica."),
          q("dificil", "Estado", "El Estado regula la actividad económica para:", "Ordenar mercados, derechos y obligaciones", ["Eliminar toda producción", "Calcular integrales", "Sustituir la contabilidad"], "Define reglas de intercambio y protección.", "Relaciona normas con actividad económica.")
        ],
        general: [
          q("facil", "Conceptos", "Una respuesta académica debe comenzar con:", "Definición clara del concepto", ["Una opinión sin justificar", "Una respuesta al azar", "Un dato inventado"], "Primero se define el concepto central.", "Orden: concepto, desarrollo, ejemplo."),
          q("medio", "Aplicación", "Aplicar un concepto económico implica:", "Relacionarlo con un caso, datos o decisión", ["Solo memorizar", "Evitar ejemplos", "Eliminar el contexto"], "La aplicación conecta teoría y realidad.", "Explica el mecanismo."),
          q("dificil", "Interpretación", "Una buena interpretación debe:", "Explicar qué significa el resultado en contexto", ["Repetir el número sin análisis", "Ignorar supuestos", "Cambiar la pregunta"], "La interpretación da sentido al resultado.", "Cierra con implicación económica.")
        ]
      };
      return banks[area] || banks.general;
    }

    function strictTopics(area) {
      const topics = {
        algebra: [
          ["Determinantes", "El determinante permite saber si una matriz tiene inversa", ["Una tasa de inflación", "Un asiento contable", "Un impuesto"]],
          ["Vectores", "Los vectores representan magnitudes con componentes", ["Un contrato jurídico", "Un gasto público", "Una cuenta de pasivo"]],
          ["Sistemas lineales", "Los sistemas lineales resuelven varias ecuaciones simultáneas", ["Una encuesta", "Una política fiscal", "Una depreciación"]],
          ["Espacios vectoriales", "Un espacio vectorial cumple operaciones de suma y producto escalar", ["Un inventario", "Un presupuesto público", "Una tasa de desempleo"]]
        ],
        matematica: [
          ["Derivadas", "La derivada mide cambio instantáneo", ["La pendiente de la recta", "La segunda derivada", "El valor de la función en cero"]],
          ["Integrales", "La integral acumula cantidades en un intervalo", ["La tasa de cambio instantánea", "La pendiente promedio", "El valor inicial de la función"]],
          ["Límites", "El límite describe comportamiento al acercarse a un valor", ["El valor de la derivada", "El área acumulada", "La pendiente de una secante"]],
          ["Optimización", "La optimización busca máximos o mínimos", ["Solo un máximo", "Solo un mínimo", "Un punto fuera del dominio"]]
        ],
        estadistica: [
          ["Media", "La media resume tendencia central", ["Una moda", "Un rango", "Un valor extremo"]],
          ["Probabilidad", "La probabilidad mide incertidumbre", ["Un activo fijo", "Una cuenta de pasivo", "Un costo hundido"]],
          ["Intervalos de confianza", "Un intervalo estima un parámetro con incertidumbre", ["Una media sin incertidumbre", "Un dato individual", "Una frecuencia acumulada"]],
          ["Regresión", "La regresión estudia relación entre variables", ["Una mediana", "Una varianza", "Una frecuencia relativa"]]
        ],
        contabilidad: [
          ["Activo", "El activo representa bienes y derechos de la empresa", ["Derivada", "Elasticidad", "Autovalor"]],
          ["Pasivo", "El pasivo representa obligaciones", ["PIB", "Correlación", "Vector"]],
          ["Patrimonio", "El patrimonio es la diferencia entre activo y pasivo", ["P-valor", "Tipo de cambio", "Muestra"]],
          ["Asiento", "El asiento registra una transacción en debe y haber", ["Oferta", "Límite", "Función objetivo"]]
        ],
        programacion: [
          ["Variables", "Una variable almacena datos", ["Inflación", "Pasivo", "Excedente"]],
          ["Condicionales", "Un condicional decide según una condición", ["Costo de oportunidad", "Rango matricial", "Arancel"]],
          ["Bucles", "Un bucle repite instrucciones", ["Política monetaria", "Contrato", "Balanza"]],
          ["Funciones", "Una función agrupa código reutilizable", ["Hipótesis nula", "Depreciación", "Demanda"]]
        ],
        micro: [
          ["Demanda", "La demanda relaciona precio y cantidad demandada", ["PIB", "Matriz inversa", "Contrato"]],
          ["Oferta", "La oferta relaciona precio y cantidad ofrecida", ["P-valor", "Estado de resultados", "Autovalor"]],
          ["Elasticidad", "La elasticidad mide sensibilidad porcentual", ["Balance general", "Tasa de desempleo", "Bucle for"]],
          ["Excedentes", "Los excedentes miden bienestar en el mercado", ["Varianza muestral", "Patrimonio", "Tipo de cambio"]]
        ],
        macro: [
          ["PIB", "El PIB mide producción agregada", ["Matriz inversa", "Debe y haber", "Variable Python"]],
          ["Inflación", "La inflación mide aumento general de precios", ["Elasticidad precio", "Determinante", "Contrato"]],
          ["Desempleo", "El desempleo mide personas sin trabajo dentro de la PEA", ["Costo fijo", "Lista en Python", "Vector propio"]],
          ["Política fiscal", "La política fiscal usa gasto e impuestos", ["Asiento contable", "Producto matricial", "Función if"]]
        ],
        econometria: [
          ["MCO", "MCO estima coeficientes minimizando residuos cuadrados", ["Asiento contable", "Vector propio", "Oferta"]],
          ["Supuestos", "Los supuestos permiten validez de inferencia", ["Contrato", "Inventario", "Dilema del prisionero"]],
          ["Errores estándar", "Los errores estándar miden precisión del estimador", ["Tasa arancelaria", "Activo fijo", "Oferta agregada"]],
          ["Sesgo", "El sesgo aparece cuando el estimador se aleja sistemáticamente", ["Demanda individual", "Función Python", "Cuenta T"]]
        ],
        dinamicos: [
          ["Equilibrio", "El equilibrio dinámico ocurre cuando el cambio es cero", ["Activo", "Contrato", "P-valor"]],
          ["Estabilidad", "La estabilidad indica retorno ante perturbaciones", ["Elasticidad", "Debe", "Balanza comercial"]],
          ["Autovalores", "Los autovalores ayudan a clasificar trayectorias", ["Gasto público", "Variable cualitativa", "Pasivo"]],
          ["Diagrama de fase", "El diagrama de fase muestra movimientos del sistema", ["Estado financiero", "Encuesta", "Tipo de cambio"]]
        ],
        finanzas: [
          ["Valor presente", "El valor presente descuenta flujos futuros", ["Determinante", "Demanda", "P-valor"]],
          ["VAN", "El VAN mide creación de valor descontada", ["Matriz identidad", "Contrato", "Media"]],
          ["TIR", "La TIR iguala el VAN a cero", ["Inflación mensual", "Bucle for", "Pasivo corriente"]],
          ["Riesgo", "El riesgo exige compensación en rendimiento", ["Vector", "Población muestral", "Oferta"]]
        ],
        historia: [
          ["Clásicos", "Los clásicos estudiaron mercado, valor y distribución", ["MCO", "Depreciación", "Python"]],
          ["Keynesianismo", "El keynesianismo analiza demanda agregada y empleo", ["Matriz inversa", "Activo fijo", "Restricción"]],
          ["Marxismo", "El marxismo analiza clases, propiedad y distribución", ["P-valor", "Costo marginal", "Bucle"]],
          ["Neoclásicos", "Los neoclásicos enfatizan elección racional y marginalismo", ["Asiento", "Arancel", "HTML"]]
        ],
        investigacion: [
          ["Objetivos", "Los objetivos guían el estudio", ["Derivada", "Pasivo", "Monopolio"]],
          ["Hipótesis", "La hipótesis plantea una relación comprobable", ["TIR", "Oferta", "Matriz"]],
          ["Muestra", "La muestra representa una población", ["Activo", "Tipo de cambio", "Nash"]],
          ["Método", "El método define cómo se obtienen y analizan datos", ["Costo marginal", "PIB", "Valor propio"]]
        ],
        operativa: [
          ["Función objetivo", "La función objetivo expresa lo que se optimiza", ["Contrato", "Inflación", "Activo"]],
          ["Restricción", "La restricción limita el conjunto factible", ["Mediana", "PIB", "Derivada"]],
          ["Vértice", "El vértice es candidato a solución óptima", ["Pasivo", "Oferta monetaria", "P-valor"]],
          ["Holgura", "La holgura mide recurso no utilizado", ["Elasticidad", "Tipo de cambio", "Autovalor"]]
        ],
        juegos: [
          ["Estrategia", "La estrategia define la acción de un jugador", ["Activo", "Derivada", "Inflación"]],
          ["Nash", "Nash ocurre sin incentivos a desviarse", ["PIB", "Matriz inversa", "Hipótesis"]],
          ["Dominante", "Una estrategia dominante es mejor ante cualquier rival", ["VAN", "P-valor", "Oferta"]],
          ["Pagos", "La matriz de pagos muestra resultados de decisiones", ["Depreciación", "Balanza", "Media"]]
        ],
        internacional: [
          ["Ventaja comparativa", "La ventaja comparativa depende del costo de oportunidad", ["Pasivo", "MCO", "Media"]],
          ["Tipo de cambio", "El tipo de cambio relaciona monedas", ["Determinante", "Activo", "P-valor"]],
          ["Balanza comercial", "La balanza comercial compara exportaciones e importaciones", ["Elasticidad de demanda", "Bucle", "Contrato"]],
          ["Arancel", "El arancel grava importaciones", ["Autovalor", "Depreciación", "Media"]]
        ],
        politica: [
          ["Problema público", "El problema público justifica intervención estatal", ["Matriz", "Activo", "Derivada"]],
          ["Indicador", "El indicador mide avance o resultado", ["Oferta", "Pasivo", "Autovalor"]],
          ["Evaluación", "La evaluación contrasta objetivos con evidencia", ["Bucle for", "VAN", "Mediana"]],
          ["Instrumento", "El instrumento es el medio de política utilizado", ["Contrato privado", "Rango", "P-valor"]]
        ],
        proyectos: [
          ["Objetivo", "El objetivo define el resultado esperado", ["Determinante", "Inflación", "Pasivo"]],
          ["Presupuesto", "El presupuesto estima recursos necesarios", ["Autovalor", "Elasticidad", "P-valor"]],
          ["Cronograma", "El cronograma ordena actividades en el tiempo", ["Activo", "Nash", "Media"]],
          ["Impacto", "El impacto mide cambios atribuibles al proyecto", ["Producto matricial", "Debe", "Tipo de cambio"]]
        ],
        comportamiento: [
          ["Sesgo", "El sesgo altera decisiones de forma sistemática", ["Pasivo", "Autovalor", "PIB"]],
          ["Nudge", "Un nudge orienta decisiones sin prohibir opciones", ["Contrato", "Vector", "Cuenta T"]],
          ["Heurística", "La heurística simplifica decisiones", ["Balanza comercial", "VAN", "Depreciación"]],
          ["Aversión a pérdidas", "La pérdida pesa más que una ganancia equivalente", ["Oferta monetaria", "MCO", "Activo"]]
        ],
        marketing: [
          ["Segmentación", "Divide el mercado en grupos con necesidades o características semejantes", ["Clasificación de gastos por naturaleza", "Agrupación de puestos por antigüedad", "Distribución de productos por costo unitario"]],
          ["Posicionamiento", "Lugar que una oferta busca ocupar en la percepción del segmento elegido", ["Porcentaje de merma de inventario", "Margen calculado sobre el costo", "Porción de ventas de un canal sin contexto de marca"]],
          ["Conversión", "Porcentaje de oportunidades que completan una acción definida", ["Porcentaje de visitantes que abandona antes de la acción", "Costo de adquirir cada cliente", "Valor promedio de un pedido"]],
          ["Elasticidad precio", "Cambio porcentual de cantidad demandada ante un cambio porcentual del precio", ["Porcentaje de margen sobre costo", "Cambio porcentual de clientes que vuelven a comprar", "Porcentaje de visitas que completa una compra"]]
        ],
        talento: [
          ["Perfil de puesto", "Define funciones, responsabilidades y competencias del cargo", ["Descripción del público objetivo", "Presupuesto anual del área", "Calendario de producción"]],
          ["Rotación", "Proporción de salidas respecto del promedio de personal en un periodo", ["Vacantes sobre postulaciones recibidas", "Ausencias sobre días laborables", "Personas capacitadas sobre personal total"]],
          ["Inducción", "Proceso que facilita la integración de una persona a la organización", ["Evaluación anual de resultados", "Cálculo de nómina", "Entrevista de salida"]],
          ["Evaluación del desempeño", "Contrasta resultados laborales con metas y criterios acordados", ["Encuesta de satisfacción de clientes", "Control de inventario", "Presupuesto de caja"]]
        ],
        administracion: [
          ["Planeación", "La planeación define objetivos y acciones", ["Matriz", "Inflación", "P-valor"]],
          ["Organización", "Organización asigna recursos y responsabilidades", ["Derivada", "PIB", "Nash"]],
          ["Dirección", "Dirección guía personas hacia objetivos", ["Elasticidad", "Pasivo", "Autovalor"]],
          ["Control", "Control compara resultados con metas", ["Valor presente", "Oferta", "Vector"]]
        ],
        derecho: [
          ["Contrato", "El contrato genera obligaciones entre partes", ["Derivada", "PIB", "MCO"]],
          ["Empresa", "La empresa actúa dentro de reglas jurídicas", ["Vector", "Elasticidad", "Media"]],
          ["Responsabilidad", "La responsabilidad define alcance de obligaciones", ["VAN", "Bucle", "Oferta"]],
          ["Estado", "El Estado fija reglas y garantías", ["Pasivo", "Autovalor", "P-valor"]]
        ],
        general: [
          ["Concepto", "El concepto debe definirse con claridad", ["Respuesta al azar", "Dato inventado", "Sin contexto"]],
          ["Método", "El método organiza el procedimiento", ["Decoración", "Improvisación", "Omisión"]],
          ["Interpretación", "La interpretación conecta resultado y contexto", ["Copiar número", "Ignorar supuestos", "No explicar"]],
          ["Aplicación", "La aplicación vincula teoría con un caso", ["Memorizar sin analizar", "No usar datos", "Evitar ejemplos"]]
        ]
      };
      return (topics[area] || topics.general).map(([title, answer, distractors]) => ({ title, answer, distractors }));
    }



    
    function migrateOldResources() {
      try {
        return (JSON.parse(studentStorage.getItem(OLD_REPO_KEY)) || []).map((item) => ({ id: uid(), title: item.title, typeId: item.typeId, description: item.description, url: item.url, uploader: item.uploader, date: item.date, cycleId: item.cycleId, subjectId: item.subjectId, hidden: false }));
      } catch { return []; }
    }
    function loadData() {
      try {
        const saved = JSON.parse(studentStorage.getItem(STORAGE_KEY));
        return saved ? mergeData(defaultData, saved) : structuredClone(defaultData);
      } catch { return structuredClone(defaultData); }
    }
    function mergeData(base, saved) { return { ...structuredClone(base), ...saved, settings: { ...base.settings, ...(saved.settings || {}), enabledSections: { ...base.settings.enabledSections, ...(saved.settings?.enabledSections || {}) } } }; }
    function saveData() {
 try {
   const preferences={gradebook:appData.gradebook,curriculumStatus:appData.curriculumStatus,studentSchedules:appData.studentSchedules};
   safeSetLocalStorage(STORAGE_KEY,JSON.stringify(preferences));
   if(isAdmin) {invalidateRenderedSections(); scheduleCriticalCollectionsSync();}
   return true;
 } catch(error) {showToast('No se pudo guardar',error.message,'error');return false;}
}

    let criticalSheetsSyncTimer = null;

    function scheduleCriticalCollectionsSync() {
 if(!isAdmin || contentRevision === null) return;
 publishPending=true; setPublishStatus('Cambios pendientes…');
 clearTimeout(criticalSheetsSyncTimer); criticalSheetsSyncTimer=setTimeout(()=>syncCriticalCollectionsToSheets(),500);
}

    async function loadCriticalCollectionsFromSheets() {
 try { return applySharedCollectionsPayload(await portalApi('/api/content'+(isAdmin?'?admin=1':''))); }
 catch(error) { sheetsSyncStatus={loading:false,error:error.message,updatedAt:''}; return {ok:false,error:error.message}; }
}

    function applySharedCollectionsPayload(payload) {
 if(!payload?.ok || !payload.collections || publishPending) return {ok:false};
 const changedCollections=[];
 for(const collection of CRITICAL_SHEET_COLLECTIONS) {
   if(!(collection in payload.collections)) continue;
   let value=payload.collections[collection];
   if(collection==='settings') value={...defaultData.settings,...value};
   if(collection==='resources') value=[...value,...appData.resources.filter(r=>r.source===DRIVE_RESOURCE_SOURCE && !value.some(x=>x.id===r.id))];
   if(JSON.stringify(appData[collection])!==JSON.stringify(value)) {appData[collection]=value; changedCollections.push(collection);}
 }
 contentRevision=payload.revision; sheetsSyncStatus={loading:false,error:'',updatedAt:new Date().toISOString()};
 invalidateRenderedSections(); hydrateDriveSettings();
 if(changedCollections.includes('settings')) {renderHome(); applySectionVisibility();}
 return {...payload,changed:!!changedCollections.length,changedCollections};
}

    
    function startSharedDataRefresh() {
      if (sharedDataRefreshTimer) clearInterval(sharedDataRefreshTimer);
      sharedDataRefreshTimer = window.setInterval(async () => {
        if (isAdmin || document.visibilityState === "hidden" || sharedDataRefreshInFlight) return;
        sharedDataRefreshInFlight = true;
        try {
          const result = await loadCriticalCollectionsFromSheets();
          if (result?.changed) {
            applyFormSubmitConfig();
            refreshVisibleDataAfterSync(result.changedCollections || CRITICAL_SHEET_COLLECTIONS);
          }
          if (Date.now() - lastAutomaticDriveRefresh >= 10 * 60 * 1000) {
            await loadDriveRepositoryResources();
            lastAutomaticDriveRefresh = Date.now();
            refreshVisibleDataAfterSync(["resources"]);
          }
        } finally {
          sharedDataRefreshInFlight = false;
        }
      }, window.AdeCloudAdmin?.available ? 1800000 : 60000);
    }

    async function syncCriticalCollectionsToSheets() {
 if(publishInFlight) { await publishInFlight; return publishPending ? syncCriticalCollectionsToSheets() : {ok:!sheetsSyncStatus.error}; }
 if(!isAdmin || contentRevision===null) return {ok:false};
 clearTimeout(criticalSheetsSyncTimer);
 const snapshot=JSON.stringify(publicContent()); publishPending=false;
 const summary=pendingPublishSummary; pendingPublishSummary='';
 publishInFlight=(async()=>{try {
   setPublishStatus('Guardando…');
   const result=await portalApi('/api/content',{collections:JSON.parse(snapshot),revision:contentRevision,...(summary?{summary}:{})});
   contentRevision=result.revision; sheetsSyncStatus={loading:false,error:'',updatedAt:new Date().toISOString()};
   setPublishStatus('Guardado y publicado ✓'); return {ok:true};
 } catch(error) { publishPending=true; sheetsSyncStatus={loading:false,error:error.message,updatedAt:''}; setPublishStatus('Sin publicar · '+error.message); showToast('Cambios sin publicar',error.message,'error'); return {ok:false}; }
 finally {publishInFlight=null;} })();
 return publishInFlight;
}

    function safeSetLocalStorage(key, value, options = {}) {
      try {
        studentStorage.setItem(key, value);
        return true;
      } catch (error) {
        if (options.silent) {
          console.warn(`No se pudo sincronizar ${key}.`, error);
          return false;
        }
        throw error;
      }
    }
    
    function loadJson(key, fallback) {
      try {
        const value = JSON.parse(studentStorage.getItem(key));
        return value ?? fallback;
      } catch {
        return fallback;
      }
    }
    function logAdminAction() { /* El servidor registra las operaciones confirmadas en SQLite. */ }
    function cleanupOldLocalData() { /* Se conserva el historial anterior sin borrados automáticos. */ }
    function fileToBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
    function uid() { return "id-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16); }
    function slugify(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
    function normalize(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
    function highlightText(value, query) {
      const raw = String(value || "");
      const normalizedQuery = normalize(query || "");
      if (!normalizedQuery) return escapeHtml(raw);
      const folded = foldWithMap(raw);
      let cursor = 0;
      let position = folded.text.indexOf(normalizedQuery);
      let html = "";
      while (position !== -1) {
        const start = folded.map[position];
        const end = (folded.map[position + normalizedQuery.length - 1] ?? start) + 1;
        html += escapeHtml(raw.slice(cursor, start));
        html += `<mark>${escapeHtml(raw.slice(start, end))}</mark>`;
        cursor = end;
        position = folded.text.indexOf(normalizedQuery, position + normalizedQuery.length);
      }
      html += escapeHtml(raw.slice(cursor));
      return html;
    }
    function foldWithMap(value) {
      let text = "";
      const map = [];
      [...String(value || "")].forEach((char, index) => {
        const folded = normalize(char);
        [...folded].forEach((foldedChar) => {
          text += foldedChar;
          map.push(index);
        });
      });
      return { text, map };
    }
    function normalizePhone(value) { return String(value || "").replace(/\D/g, ""); }
    function parseMoney(value) { return Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0; }
    function formatDate(value) { if (!value) return "Sin fecha"; const raw=String(value); const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00Z':raw); if(Number.isNaN(date.getTime()))return "Sin fecha"; return new Intl.DateTimeFormat("es", { year: "numeric", month: "short", day: "2-digit", timeZone:"America/Guayaquil" }).format(date); }
    function formatMathText(value) {
      return escapeHtml(value)
        .replace(/\[math\]([\s\S]*?)\[\/math\]/g, '<span class="math-inline">$1</span>')
        .replace(/\[blockmath\]([\s\S]*?)\[\/blockmath\]/g, '<div class="math-block">$1</div>')
        .replace(/\[\[([\s\S]*?)\]\]/g, '<span class="math-inline">$1</span>')
        .replace(/\[eq\]([\s\S]*?)\[\/eq\]/g, '<div class="math-block">$1</div>');
    }
    function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
    function escapeAttribute(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }

    // Contenido orientado a Administración de Empresas para glosario, cronología y práctica.
    function glossaryTerms() {
      const source = [
        ["Eficacia", "Gestión", "Grado en que se alcanzan los objetivos establecidos.", "Objetivos alcanzados / objetivos planificados", "Un equipo compara sus entregables con la meta aprobada."],
        ["Eficiencia", "Gestión", "Relación entre los resultados obtenidos y los recursos utilizados.", "Resultados / recursos utilizados", "Una empresa compara unidades producidas con horas de trabajo."],
        ["Delegación", "Gestión", "Asignación de tareas y autoridad con resultados y seguimiento claros.", "", "Una jefatura asigna una decisión, sus límites y la fecha de revisión."],
        ["Partes interesadas", "Gestión", "Personas o grupos que influyen en la organización o reciben impactos de ella.", "", "Un proyecto identifica clientes, personal, proveedores y comunidad."],
        ["Liquidez", "Finanzas y contabilidad", "Capacidad para atender obligaciones de corto plazo.", "Activos corrientes / pasivos corrientes", "El área financiera revisa si puede cubrir pagos próximos."],
        ["Capital de trabajo neto", "Finanzas y contabilidad", "Diferencia entre activos corrientes y pasivos corrientes.", "Activos corrientes − pasivos corrientes", "Se usa para revisar recursos disponibles para operar."],
        ["Ecuación contable", "Finanzas y contabilidad", "Relación entre los recursos de una entidad y sus fuentes de financiamiento.", "Activos = pasivos + patrimonio", "Cada compra o financiamiento debe conservar el equilibrio contable."],
        ["Valor actual neto", "Finanzas y contabilidad", "Valor presente de los flujos estimados menos la inversión inicial.", "VAN = Σ Ft/(1+r)^t − I₀", "Una empresa compara el VAN de alternativas de inversión."],
        ["Segmentación", "Marketing", "División del mercado en grupos con necesidades o características semejantes.", "", "Una campaña se diseña para clientes con necesidades similares."],
        ["Propuesta de valor", "Marketing", "Beneficio relevante que una oferta promete entregar a un segmento.", "", "Un emprendimiento explica qué necesidad resuelve y para quién."],
        ["Marketing mix", "Marketing", "Decisiones coordinadas sobre producto, precio, plaza y promoción.", "Producto · precio · plaza · promoción", "El equipo alinea precio, canal y comunicación con el producto."],
        ["Tasa de conversión", "Marketing", "Proporción de oportunidades que completan una acción definida.", "Conversiones / oportunidades × 100 %", "Una tienda calcula qué porcentaje de visitas termina en compra."],
        ["Perfil de puesto", "Talento humano", "Descripción de funciones, responsabilidades y competencias requeridas para un rol.", "", "La selección compara requisitos del cargo con la experiencia pertinente."],
        ["Inducción", "Talento humano", "Proceso que orienta a una persona nueva sobre su rol y la organización.", "", "El personal nuevo recibe información sobre tareas, normas y equipo."],
        ["Evaluación del desempeño", "Talento humano", "Revisión de resultados y competencias frente a criterios acordados.", "Resultados observados / metas acordadas", "Una jefatura conversa sobre logros y próximos objetivos."],
        ["Rotación de personal", "Talento humano", "Proporción de salidas de personal en un periodo definido.", "Salidas / promedio de empleados × 100 %", "La organización revisa las salidas trimestrales junto con sus causas."],
        ["Mapa de procesos", "Operaciones", "Representación de actividades, secuencia, decisiones y responsables.", "", "Un equipo identifica esperas y traspasos entre etapas de atención."],
        ["Cuello de botella", "Operaciones", "Etapa cuya capacidad limita el flujo total de un proceso.", "", "La etapa más lenta retrasa los pedidos listos para despacho."],
        ["Productividad", "Operaciones", "Relación entre producción obtenida e insumos utilizados.", "Producción / recursos utilizados", "La empresa compara unidades producidas por hora trabajada."],
        ["Control de calidad", "Operaciones", "Comparación de resultados con criterios para detectar y corregir desviaciones.", "", "El equipo registra defectos y revisa sus causas antes del despacho."],
        ["Modelo de negocio", "Emprendimiento", "Descripción de cómo una iniciativa crea, entrega y captura valor.", "", "Un plan conecta clientes, solución, actividades e ingresos."],
        ["Producto mínimo viable", "Emprendimiento", "Versión inicial que permite probar supuestos y aprender con evidencia.", "", "Un equipo ofrece una versión básica a clientes para recoger comentarios."],
        ["Validación de mercado", "Emprendimiento", "Contraste de hipótesis sobre clientes y demanda con evidencia observable.", "", "Entrevistas y pruebas de compra contrastan el interés declarado."],
        ["Flujo de ingresos", "Emprendimiento", "Forma en que una iniciativa recibe ingresos de sus clientes.", "", "Una plataforma compara suscripciones y pagos por transacción."],
        ["Alcance del proyecto", "Proyectos e investigación", "Entregables y límites del trabajo acordado.", "", "El equipo registra qué funciones incluye la primera versión."],
        ["Hito", "Proyectos e investigación", "Punto de control que marca un resultado o etapa relevante del proyecto.", "", "La aprobación del prototipo se fija como hito previo al lanzamiento."],
        ["Pregunta de investigación", "Proyectos e investigación", "Pregunta clara y delimitada que puede estudiarse con evidencia.", "", "El estudio pregunta qué factores se asocian con la recompra de clientes."],
        ["Operacionalización", "Proyectos e investigación", "Definición de cómo se observará o medirá un concepto.", "Concepto → dimensiones → indicadores", "La satisfacción se traduce en preguntas e indicadores observables."],
        ["Indicador clave de desempeño", "Datos empresariales", "Métrica vinculada a un objetivo que apoya el seguimiento y las decisiones.", "", "El área de servicio sigue el tiempo medio de respuesta."],
        ["Business Intelligence", "Datos empresariales", "Integración y análisis de datos para apoyar decisiones organizacionales.", "", "Un tablero combina ventas, inventario y fechas de reposición."],
        ["Tablero de control", "Datos empresariales", "Vista resumida de indicadores para supervisar objetivos y resultados.", "", "La gerencia compara metas mensuales con resultados observados."],
        ["Calidad de datos", "Datos empresariales", "Grado en que los datos son completos, consistentes y adecuados para su uso.", "", "Antes de analizar ventas se revisan duplicados y valores faltantes."],
        ["Cumplimiento", "Gobierno y cumplimiento", "Gestión de obligaciones aplicables mediante responsables, controles y seguimiento.", "", "La empresa mantiene un calendario de obligaciones y responsables."],
        ["Gobierno corporativo", "Gobierno y cumplimiento", "Mecanismos de dirección, supervisión y rendición de cuentas.", "", "El directorio revisa resultados, riesgos y responsabilidades."],
        ["Contrato", "Gobierno y cumplimiento", "Acuerdo que establece condiciones y obligaciones para las partes.", "", "Un acuerdo de servicio delimita alcance, plazos y obligaciones."],
        ["Protección de datos", "Gobierno y cumplimiento", "Prácticas para tratar y resguardar datos personales con fines definidos.", "", "Una empresa limita el acceso a datos de sus clientes."],
        ["Arancel", "Comercio internacional", "Impuesto aplicado a ciertos bienes importados según las reglas vigentes.", "", "Una empresa considera los aranceles al estimar el costo de importación."],
        ["Incoterms", "Comercio internacional", "Reglas que distribuyen tareas, costos y riesgos de entrega en compraventas internacionales.", "", "Exportador e importador acuerdan responsabilidades de transporte y entrega."],
        ["Riesgo cambiario", "Comercio internacional", "Exposición a cambios en el valor relativo de monedas.", "", "Un importador revisa cómo una variación cambiaria afecta sus costos."],
        ["Logística internacional", "Comercio internacional", "Coordinación de transporte, documentos y entrega entre países.", "", "La empresa compara rutas por costo, plazo y confiabilidad."],
        ["Triple impacto", "Sostenibilidad", "Consideración de efectos económicos, sociales y ambientales en las decisiones.", "Económico · social · ambiental", "Un proyecto revisa empleo local, costos e impactos ambientales."],
        ["Economía circular", "Sostenibilidad", "Enfoque que busca reducir residuos y mantener recursos en uso.", "", "Una empresa recupera envases para reutilizarlos en su proceso."],
        ["Huella de carbono", "Sostenibilidad", "Medida de emisiones asociadas a una actividad bajo límites definidos.", "", "Una organización estima emisiones de energía y transporte de su operación."],
        ["Cadena de suministro responsable", "Sostenibilidad", "Gestión de riesgos e impactos en proveedores y etapas de suministro.", "", "La empresa revisa calidad, continuidad e impactos de proveedores clave."],
        ["Punto de equilibrio", "Economía empresarial", "Nivel de ventas en que los ingresos igualan los costos totales.", "Costos fijos / (precio unitario − costo variable unitario)", "Un negocio estima cuántas unidades debe vender para cubrir costos."],
        ["Elasticidad precio", "Economía empresarial", "Respuesta porcentual de la cantidad demandada ante cambios porcentuales del precio.", "%Δ cantidad / %Δ precio", "Una empresa estima cómo podrían responder las ventas a un cambio de precio."],
        ["Costo de oportunidad", "Economía empresarial", "Valor de la mejor alternativa que se deja de elegir.", "", "El uso de un local para bodega excluye otras alternativas de uso."],
        ["Competencia", "Economía empresarial", "Rivalidad entre organizaciones que buscan atender un mercado.", "", "Una empresa compara alternativas, sustitutos y ventajas de su oferta."],
        ["Media aritmética", "Estadística", "Medida que resume un conjunto de valores mediante su promedio.", "x̄ = Σxᵢ / n", "Una empresa calcula la venta diaria promedio del mes."],
        ["Mediana", "Estadística", "Valor central de un conjunto ordenado de observaciones.", "", "El área de talento humano compara la mediana salarial para reducir el efecto de valores extremos."],
        ["Desviación estándar", "Estadística", "Medida de cuánto suelen separarse los datos respecto de su media.", "s = √(Σ(xᵢ − x̄)² / (n − 1))", "Un equipo compara la variación semanal de los tiempos de entrega."],
        ["Probabilidad", "Estadística", "Medida numérica de la posibilidad de que ocurra un evento.", "0 ≤ P(A) ≤ 1", "Una empresa estima la probabilidad de retraso usando registros previos."],
        ["Correlación", "Estadística", "Medida de la dirección y fuerza de asociación entre variables.", "−1 ≤ r ≤ 1", "Ventas y gasto publicitario pueden moverse juntas; eso por sí solo no demuestra causalidad."],
        ["Intervalo de confianza", "Estadística", "Rango estimado que expresa la incertidumbre de un parámetro bajo un nivel de confianza definido.", "Estimación ± margen de error", "Una encuesta informa un rango probable para la proporción de clientes satisfechos."],
        ["Revolución Industrial", "Historia Económica", "Transformación de la producción, el trabajo y los mercados asociada con la industrialización.", "", "Una empresa estudia cómo la mecanización cambió capacidad, costos y organización laboral."],
        ["Administración científica", "Historia Económica", "Enfoque histórico que analizó tareas y métodos de trabajo para organizar la producción.", "", "El estudio de tiempos y métodos forma parte de los primeros debates sobre productividad."],
        ["Producción en cadena", "Historia Económica", "Sistema de producción que organiza tareas secuenciales para elaborar bienes en flujo continuo.", "", "La línea de montaje modificó escala, tiempos y coordinación de la producción."],
        ["Relaciones humanas", "Historia Económica", "Enfoque de gestión que incorporó los factores sociales y humanos al estudio del trabajo.", "", "Una empresa analiza cómo comunicación y condiciones laborales influyen en sus equipos."],
        ["Globalización económica", "Historia Económica", "Integración creciente de mercados, producción y flujos entre países a lo largo del tiempo.", "", "Una compañía revisa cómo cadenas internacionales cambiaron proveedores y mercados."]
      ];
      return source.map(([term, category, definition, formula, example], index) => ({
        id: slugify(term), term, category,
        difficulty: index % 3 === 0 ? "básico" : index % 3 === 1 ? "intermedio" : "avanzado",
        formula: formula || null, definition, example,
        use: `Se aplica para analizar decisiones de ${category.toLowerCase()} con criterios claros y evidencia.`,
        relatedTerms: source.filter((row) => row[1] === category && row[0] !== term).slice(0, 4).map((row) => slugify(row[0]))
      }));
    }

    function timelineItems() {
      const rows = [
        [1881, "Wharton School", "Formación universitaria en negocios", "Educación gerencial", "#304bd2", "Se establece una escuela universitaria dedicada a la formación empresarial.", "Educación empresarial"],
        [1911, "Frederick W. Taylor", "The Principles of Scientific Management", "Gestión científica", "#202e91", "Propone estudiar tareas y métodos de trabajo de forma sistemática para mejorar la gestión.", "Estudio del trabajo"],
        [1916, "Henri Fayol", "Administration industrielle et générale", "Teoría administrativa", "#526cf0", "Presenta principios y funciones generales aplicables a la administración de organizaciones.", "Funciones administrativas"],
        [1954, "Peter F. Drucker", "The Practice of Management", "Dirección", "#304bd2", "Sitúa objetivos, responsabilidad gerencial y resultados en el centro de la práctica directiva.", "Dirección por objetivos"],
        [1980, "Michael Porter", "Competitive Strategy", "Estrategia", "#202e91", "Organiza el análisis de la competencia y la posición estratégica de una organización.", "Análisis competitivo"],
        [1992, "Robert Kaplan y David Norton", "The Balanced Scorecard", "Control de gestión", "#526cf0", "Plantean complementar medidas financieras con indicadores de clientes, procesos y aprendizaje.", "Cuadro de mando integral"],
        [2020, "Gestión digital y analítica", "Decisiones basadas en datos", "Transformación digital", "#304bd2", "Las organizaciones amplían el uso de sistemas digitales y datos para coordinar operaciones y servicios.", "Analítica empresarial"]
      ];
      return rows.map(([year, person, work, school, color, description, concept]) => ({ year, person, work, school, color, description, concept }));
    }





let publicContentResponse = null;
async function portalApi(url, data) {
 if(location.protocol === 'file:') throw Error('Abre http://127.0.0.1:4173 para usar el panel. El archivo HTML por sí solo no conecta con el servidor.');
 if(typeof window!=='undefined' && window.AdeCloudAdmin?.available && ['/api/content','/api/login','/api/logout','/api/session','/api/admin','/api/message','/api/messages','/api/backup','/api/upload'].includes(url.split('?')[0])){
   const load=()=>window.AdeCloudAdmin.request(url,data);
   if(url==='/api/content'&&data===undefined&&window.AdePublicContentCache)return window.AdePublicContentCache.read(load);
   const result=await load();if(url==='/api/content'&&data!==undefined)window.AdePublicContentCache?.invalidate();return result;
 }
 const publicRequest = url === '/api/content' && data === undefined;
 const runtime = typeof window !== 'undefined' ? window.AdeRuntime : null;
 const endpoint = runtime?.staticMode && !runtime.backendAvailable && publicRequest
   ? new URL('./public-content.json', document.baseURI).toString()
   : runtime ? runtime.apiUrl(url) : url;
 const headers = data===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':adminSessionToken};
 if(publicRequest && publicContentResponse?.etag) headers['If-None-Match']=publicContentResponse.etag;
 const response=await fetch(endpoint,{method:data===undefined?'GET':'POST',credentials:runtime?.staticMode?'omit':'same-origin',cache:'no-store',signal:AbortSignal.timeout(url==='/api/drive'?40000:15000),headers,body:data===undefined?undefined:JSON.stringify(data)});
 if(publicRequest && response.status===304 && publicContentResponse) return structuredClone(publicContentResponse.data);
 let result;try{result=await response.json();}catch{throw Error('El servidor no está disponible. Inicia el proyecto con npm start.');}
 if(!response.ok || !result.ok) throw Error(result.error || 'No se pudo completar la operación.');
 if(publicRequest && runtime?.apiBase) result = runtime.normalizeContent(result);
 if(publicRequest) publicContentResponse={etag:response.headers.get('ETag'),data:structuredClone(result)};
 return result;
}
function renderRecursos() {
  el.recursosContainer.innerHTML = DOMPurify.sanitize([['Repositorio','repositorio'],['Herramientas','herramientas'],['Oportunidades','oportunidades'],['Docentes','docentes']].map(([label,id])=>`<a class="portal-card" href="#${id}"><h3>${label} ↗</h3><p>Explora los recursos de tu comunidad.</p></a>`).join(''));
}
function publicContent() {
 const data=Object.fromEntries(CRITICAL_SHEET_COLLECTIONS.map(key=>[key,appData[key]]));
 data.settings=Object.fromEntries(PUBLISHED_SETTING_KEYS.filter(key=>key in appData.settings).map(key=>[key,appData.settings[key]]));
 data.settings.enabledSections=Object.fromEntries(SECTIONS.map(key=>[key,isSectionEnabled(key)]));
 data.resources=appData.resources.filter(r=>r.source!==DRIVE_RESOURCE_SOURCE);return data;
}
function hydrateDriveSettings() {
 DRIVE_FOLDER_URL=appData.settings.driveFolderUrl || DEFAULT_ADE_DRIVE_FOLDER_URL;
 DRIVE_ROOT_FOLDER_ID=getGoogleDriveId(DRIVE_FOLDER_URL) || DEFAULT_ADE_DRIVE_FOLDER_ID;
 DRIVE_REPOSITORY_API_URL=appData.settings.driveRepositoryApiUrl || DEFAULT_ADE_APPS_SCRIPT_URL;
}
// The publish indicator lives in the administration top bar; its state drives colour and the retry action.
function setPublishStatus(message, state) {
 const node=document.getElementById('publishStatus');
 if(!node) return;
 const resolved=state || (/Guardando/.test(message) ? 'saving' : /Sin publicar|Conflicto/.test(message) ? 'error' : /pendientes/.test(message) ? 'pending' : 'saved');
 node.dataset.state=resolved;
 const label=node.querySelector('[data-publish-label]');
 if(label) label.textContent=message; else node.textContent=message;
}
async function loadAdminInbox() {
 const data=await portalApi('/api/admin');
 appData.messages=data.messages;
 appData.adminLog=data.audit.map(row=>({...row,type:'Servidor',detail:''}));
 adminServerState=data.state || {};
}
window.addEventListener('beforeunload',event=>{if(publishPending || publishInFlight){event.preventDefault();event.returnValue='';}});

// Home blocks the administration may reorder or hide (the hero is always first).
const HOME_BLOCKS = [
 { id:'anuncio', label:'Mensaje institucional', description:'Aviso editable desde Alertas y avisos' },
 { id:'panel', label:'Panel académico', description:'Semestre, progreso, próxima clase y continuidad' },
 { id:'herramientas', label:'Accesos y herramientas', description:'Accesos rápidos y herramientas usadas recientemente' },
 { id:'recomendaciones', label:'Recomendaciones y novedades', description:'Sugerencias según tu malla, materiales y oportunidades' },
 { id:'mision', label:'Misión y visión', description:'Textos institucionales' },
 { id:'datos', label:'Datos de la carrera', description:'Fundación, modalidad, duración y título' },
 { id:'competencias', label:'Competencias', description:'Áreas que desarrollarás' },
 { id:'pasos', label:'Primeros pasos', description:'Guía breve para usar el portal' },
 { id:'kit', label:'Kit de nuevo ingreso', description:'Recursos para quienes empiezan' },
 { id:'noticias', label:'Noticias y mercado', description:'Titulares y tipo de cambio de referencia' }
];
function resolveHomeBlocks(saved) {
 const list=Array.isArray(saved) ? saved.filter(block=>HOME_BLOCKS.some(item=>item.id===block?.id)) : [];
 const seen=new Set(list.map(block=>block.id));
 return [...list.map(block=>({id:block.id,visible:block.visible!==false})), ...HOME_BLOCKS.filter(block=>!seen.has(block.id)).map(block=>({id:block.id,visible:true}))];
}
const SECTION_LABELS = { inicio:'Inicio', carrera:'Carrera', informacion:'Información', repositorio:'Repositorio', silabos:'Malla y sílabos', tutorias:'Tutorías', introductorio:'Introductorio', merch:'Merch', herramientas:'Herramientas', banco:'Banco de exámenes', consultas:'Consultas', docentes:'Docentes', recursos:'Recursos rápidos', oportunidades:'Oportunidades', representantes:'Representantes' };
const SECTION_ICONS = { inicio:'home', carrera:'chart', informacion:'link', repositorio:'book', silabos:'file', tutorias:'cap', introductorio:'play', merch:'bag', herramientas:'calculator', banco:'shield', consultas:'mail', docentes:'user', recursos:'spark', oportunidades:'briefcase', representantes:'people' };
const sectionLabel = section => SECTION_LABELS[section] || section;
// Original headers are read once from the markup so an empty override restores them.
const SECTION_HEADER_DEFAULTS = {};
function applySectionMeta() {
 const meta=(homePreviewSettings || appData.settings).sectionMeta || {};
 document.querySelectorAll('[data-section]').forEach(section=>{
  const id=section.dataset.section, header=section.querySelector('.section-header');
  if(!header || id==='inicio' || id==='gracias') return;
  const nodes={tag:header.querySelector('.section-tag'),title:header.querySelector('h2'),description:header.querySelector('p')};
  if(!SECTION_HEADER_DEFAULTS[id]) SECTION_HEADER_DEFAULTS[id]={tag:nodes.tag?.textContent.trim()||'',title:nodes.title?.textContent.trim()||'',description:nodes.description?.textContent.trim()||''};
  for(const key of ['tag','title','description']) if(nodes[key]) nodes[key].textContent=meta[id]?.[key] || SECTION_HEADER_DEFAULTS[id][key];
 });
}
function announcementHtml(announcement) {
 if(!announcement?.active || !String(announcement.text||'').trim()) return '';
 const tone=['info','aviso','urgente'].includes(announcement.tone) ? announcement.tone : 'info';
 const label={info:'Información',aviso:'Aviso importante',urgente:'Urgente'}[tone];
 return `<div class="hx-announcement-card tone-${tone}" role="${tone==='urgente'?'alert':'status'}"><span class="hx-announcement-icon" aria-hidden="true">${interfaceIcon(tone==='info'?'megaphone':'alert')}</span><div><strong>${label}</strong><p>${escapeHtml(announcement.text)}</p></div>${announcement.link?`<a class="hx-announcement-link" href="${escapeAttribute(announcement.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(announcement.linkLabel||'Más información')} <span aria-hidden="true">↗</span></a>`:''}</div>`;
}
function socialLabel(url) {
 const host=(()=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}})();
 if(/instagram/.test(host)) return 'Instagram'; if(/linkedin/.test(host)) return 'LinkedIn'; if(/tiktok/.test(host)) return 'TikTok'; if(/facebook|fb\.com/.test(host)) return 'Facebook'; if(/x\.com|twitter/.test(host)) return 'X';
 return 'redes';
}
function representativeCardHtml(r, i) {
 const network=r.redes ? socialLabel(r.redes) : '';
 return '<article class="representative '+(i===0?'representative-lead':'')+'"><div class="rep-top"><span class="section-tag">'+escapeHtml(r.cargo||'Representante')+'</span><span>'+String(i+1).padStart(2,'0')+'</span></div><div class="rep-portrait">'+(r.foto?'<img loading="lazy" src="'+escapeAttribute(r.foto)+'" alt="'+escapeAttribute(r.nombre||'')+'">':'<span aria-hidden="true">'+initials(r.nombre||'?')+'</span>')+'</div><h3>'+escapeHtml(r.nombre||'Nombre')+'</h3><p>'+escapeHtml(r.funciones||'')+'</p>'+(r.redes?'<a class="rep-link" href="'+escapeAttribute(r.redes)+'" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/></svg> Conectar en '+network+' <span aria-hidden="true">↗</span></a>':'')+(r.email?'<a class="rep-link rep-mail" href="mailto:'+escapeAttribute(r.email)+'">'+interfaceIcon('mail')+' '+escapeHtml(r.email)+'</a>':'')+'</article>';
}
function docenteCardHtml(d) {
 const phone=normalizePhone(d.whatsapp || "");
 const whatsapp=phone ? `<a class="btn-secondary" href="https://wa.me/${phone}" target="_blank" rel="noopener noreferrer">Enviar WhatsApp</a>` : `<button class="btn-secondary btn-disabled" type="button" disabled>WhatsApp no disponible</button>`;
 return `<article class="portal-card docente-card"><div class="docente-band"></div><span class="avatar-initials">${initials(d.nombre||'?')}</span><h3>${escapeHtml(d.nombre)}</h3><p>${escapeHtml(d.titulo)}</p><p class="docente-materia">${escapeHtml(d.materia)}</p><div class="consulta-pill"><strong>Horas de consulta</strong><span>${escapeHtml(d.horario || "Horario por definir")}</span></div><div class="inline-actions">${d.email?`<a class="card-action" href="mailto:${escapeAttribute(d.email)}">Enviar correo</a>`:''}${whatsapp}</div></article>`;
}

// One stroke icon family shared by navigation, tools and administration.
function interfaceIcon(name) {
 const paths={
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2',
  calendar:'M4 6h16v15H4zM8 3v6M16 3v6M4 11h16M8 15h2M14 15h2',
  chart:'M4 20h17M5 16l5-5 4 3 6-9M16 5h4v4',
  people:'M4 21v-2a6 6 0 0 1 12 0v2M17 4a4 4 0 0 1 0 8M20 21v-2a6 6 0 0 0-3-5M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  mail:'M3 5h18v14H3zM3 6l9 7 9-7',
  settings:'M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  drive:'M9 4h6l6 11-3 5H6l-3-5zM9 4l6 11M15 4 6 20M3 15h18',
  shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6',
  bell:'M7 9a5 5 0 0 1 10 0v6l3 3H4l3-3zM10 21h4',
  bag:'M4 7h16l-1 14H5zM8 8V6a4 4 0 0 1 8 0v2',
  upload:'M12 16V3M7 8l5-5 5 5M4 14v7h16v-7',
  play:'M6 4l14 8-14 8z',
  timer:'M9 2h6M12 5v2M12 9v5l3 2M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16',
  calculator:'M5 3h14v18H5zM8 7h8M8 11h1M15 11h1M8 15h1M15 15h1M8 18h1M15 18h1',
  formula:'M18 4H7l7 8-7 8h11',
  spark:'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z',
  moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
  sun:'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10',
  auto:'M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18',
  home:'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5',
  layers:'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  library:'M4 4h4v16H4zM10 4h4v16h-4zM16 5.5l3.8-1 3.2 14.7-3.8 1z',
  briefcase:'M3 7h18v13H3zM8 7V4h8v3M3 12.5h18',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-1a8 8 0 0 1 16 0v1',
  cap:'M2 9.5 12 4.5l10 5-10 5zM6 11.5v5c3.5 2.4 8.5 2.4 12 0v-5M22 9.5v6',
  search:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M15.5 15.5 21 21',
  plus:'M12 5v14M5 12h14',
  menu:'M4 7h16M4 12h16M4 17h16',
  chevronLeft:'M15 5 8 12l7 7',
  chevronRight:'M9 5l7 7-7 7',
  chevronDown:'M5 9l7 7 7-7',
  external:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  check:'M5 12.5l4.5 4.5L19 7',
  x:'M6 6l12 12M18 6 6 18',
  trash:'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  edit:'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  eye:'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  eyeOff:'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  dots:'M5 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 1 0 0-2.8M12 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 1 0 0-2.8M19 10.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 1 0 0-2.8',
  arrowUp:'M12 19V5M6 11l6-6 6 6',
  arrowDown:'M12 5v14M6 13l6 6 6-6',
  arrowRight:'M5 12h14M13 6l6 6-6 6',
  refresh:'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  download:'M12 4v12M7 11l5 5 5-5M4 20h16',
  logout:'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  phone:'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  chat:'M4 5h16v11H9l-5 4z',
  copy:'M9 9h11v11H9zM5 15H4V4h11v1',
  alert:'M12 3 22 20H2zM12 10v4.5M12 17.5h.01',
  clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  link:'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  image:'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01',
  file:'M6 3h8l5 5v13H6zM14 3v5h5',
  lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  sidebar:'M3 4h18v16H3zM9 4v16',
  inbox:'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
  megaphone:'M3 10v4h4l8 5V5l-8 5zM18.5 9a4 4 0 0 1 0 6',
  target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 12h.01',
  compass:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z',
  history:'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 8v4l3 2'
 };
 const aliases={dashboard:'grid',repositorio:'book',physicalBooks:'library',schedules:'calendar',alertas:'megaphone',introClasses:'play',carreraCards:'chart',tutorias:'cap',merch:'bag',docentes:'user',representantes:'people',oportunidades:'briefcase',mensajes:'inbox',config:'settings',backup:'download',toolCalculadora:'calculator',toolHorario:'calendar',toolMalla:'chart',toolPomodoro:'timer',toolFormulas:'formula',toolDataSources:'grid',toolIA:'spark',toolPlan:'compass',toolSimulador:'target'};
 const path=paths[aliases[name] || name] || paths.grid;
 return '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';
}
function motionBehavior(){return matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.dataset.motion==='minimal'?'auto':'smooth';}

// One ordered set of real home blocks, shared by published settings and preview.
function applyHomePresentation(settings) {
  const home = document.getElementById('inicio');
  if (!home) return;
  const intro = home.querySelector('.hero-intro');
  // Preserve the established two-column composition and institutional heading.
  const title = document.getElementById('heroTitle');
  title.textContent = settings.heroTitle || defaultData.settings.heroTitle;
  title.hidden = false;
  intro.querySelector('.eyebrow').textContent = settings.heroEyebrow || 'Carrera oficial';
  let subtitle = document.getElementById('heroSubtitle');
  if (!subtitle) { subtitle = document.createElement('p'); subtitle.id = 'heroSubtitle'; title.after(subtitle); }
  subtitle.textContent = settings.heroSubtitle || ''; subtitle.hidden = !subtitle.textContent;
  const buttons = intro.querySelectorAll('.hero-actions a');
  ['Primary','Secondary'].forEach((kind, index) => {
    const button = buttons[index]; if (!button) return;
    const target = settings['hero'+kind+'Section'] || (index ? 'consultas' : 'repositorio');
    button.textContent = settings['hero'+kind+'Label'] || (index ? 'Enviar consulta' : 'Abrir repositorio');
    button.href = '#'+target; button.dataset.tab = target;
  });
  let image = document.getElementById('heroFeatureImage');
  if (!image) { image = document.createElement('img'); image.id = 'heroFeatureImage'; image.alt = 'Imagen destacada de ASO ADE'; home.querySelector('.hero-panel').prepend(image); }
  if (settings.heroImage) image.src = settings.heroImage; else image.removeAttribute('src');
  image.hidden = !settings.heroImage;
  let announcement = document.getElementById('homeAnnouncement');
  if (!announcement) { announcement = document.createElement('div'); announcement.id = 'homeAnnouncement'; intro.append(announcement); }
  announcement.innerHTML = DOMPurify.sanitize(announcementHtml(settings.announcement));
  const groups = {
    anuncio:['#homeAnnouncement'], panel:['#semesterWidget','.academic-curve-card','#nextClassWidget','.dashboard-widget-grid'],
    herramientas:['#homeQuickLinks','.home-most-used','#recentTools'], recomendaciones:['.home-dynamic'],
    mision:['.mission-grid','.hero-quote'], datos:['.hero-institutional-facts'],
    competencias:['.hero-skills-block'], pasos:['.hero-steps-block'], kit:['#kitNuevoIngreso'],
    noticias:['.economic-widget','.economic-news-widget']
  };
  // Apply CMS ordering within each original column; never reparent live widgets.
  resolveHomeBlocks(settings.homeBlocks).forEach((item, index) => {
    for (const selector of groups[item.id] || []) for (const node of home.querySelectorAll(selector)) {
      node.dataset.homeBlock = item.id;
      node.hidden = !item.visible || (item.id === 'anuncio' && !announcement.childElementCount);
      if (Array.isArray(settings.homeBlocks) && settings.homeBlocks.length) node.style.setProperty('order', String(index + 1), 'important');
      else node.style.removeProperty('order');
    }
  });
  applySectionMeta();
}

function renderRecentTools() {
  const host = document.querySelector('#inicio .home-most-used');
  if (!host) return;
  let recent = document.getElementById('recentTools');
  if (!recent) { recent = document.createElement('div'); recent.id = 'recentTools'; host.prepend(recent); }
  const saved = loadJson('ade-recent-tools', []);
  const ids = (Array.isArray(saved) ? saved : []).filter(id => Object.hasOwn(TOOL_TABS,id)).slice(0,4);
  recent.innerHTML = DOMPurify.sanitize('<div class="view-heading"><div><span class="eyebrow">Tu espacio de estudio</span><h3>Retoma donde te quedaste</h3></div></div>' + (ids.length ? '<div class="recent-tools-list">'+ids.map(id => '<button type="button" data-recent-tool="'+id+'">'+interfaceIcon(id)+'<span>'+escapeHtml(TOOL_TABS[id].title)+'</span><span aria-hidden="true">↗</span></button>').join('')+'</div>' : '<p class="recent-tools-empty">Tus últimas herramientas aparecerán aquí cuando las utilices en este dispositivo.</p>'));
  recent.querySelectorAll('[data-recent-tool]').forEach(button => button.addEventListener('click', () => { showSection('herramientas',true); handleServiceFocus(button.dataset.recentTool); }));
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (document.body.dataset.theme === 'auto') applyDarkMode(); });

function savePomodoro() {
  try { studentStorage.setItem('ade-pomodoro-state', JSON.stringify({mode:pomodoroMode, remaining:pomodoroRemaining, running:pomodoroRunning, deadline:pomodoroDeadline, study:el.pomodoroStudy?.value, rest:el.pomodoroBreak?.value})); } catch {}
}
function refreshStudentPreferences() {
  if (!studentUiInitialized) return;
  const account = window.AdeStudent?.getState().user;
  const nextOwner = account?.id || 'guest';
  const changedOwner = nextOwner !== renderedStudentOwner;
  const personal = loadJson(STORAGE_KEY, {});
  appData.gradebook = personal.gradebook || {};
  appData.curriculumStatus = loadJson(CURRICULUM_STATE_KEY, personal.curriculumStatus || {});
  appData.studentSchedules = loadJson(STUDENT_SCHEDULE_KEY, personal.studentSchedules || []);
  studentProfile = loadJson(PROFILE_KEY, {});
  if (!studentProfile.email && account) studentProfile.email = account.email;
  favoriteIds = loadJson(PUBLIC_FAVORITES_KEY, loadJson(FAVORITES_KEY, []));
  pomodoroSessions = Number(studentStorage.getItem(POMODORO_KEY) || 0);
  if (changedOwner) {
    clearInterval(pomodoroTimer); pomodoroTimer = null; pomodoroRunning = false; pomodoroDeadline = 0; pomodoroRemaining = 25 * 60; pomodoroMode = 'study';
    generatedApa = ''; taskShowForm = false;
    el.consultaForm?.reset(); closeRequestModal();
    if (!isAdmin) appData.messages = [];
    renderedStudentOwner = nextOwner;
    restorePomodoro();
  }
  if (!changedOwner && document.activeElement?.matches('input,textarea,select')) { studentRenderPending = true; return; }
  studentRenderPending = false;
  fillProfileForm(); prefillKnownForms(); renderAll(); renderRecentTools();
  if (activeApp) renderActiveApp();
}
function restorePomodoro() {
  const saved = loadJson('ade-pomodoro-state', null);
  if (!saved || !['study','short','long'].includes(saved.mode) || !Number.isFinite(saved.remaining) || saved.remaining < 0) return;
  pomodoroMode = saved.mode;
  if (el.pomodoroMode) el.pomodoroMode.value = saved.mode;
  if (el.pomodoroStudy && Number(saved.study)>0) el.pomodoroStudy.value = saved.study;
  if (el.pomodoroBreak && Number(saved.rest)>0) el.pomodoroBreak.value = saved.rest;
  pomodoroRemaining = saved.running && Number.isFinite(saved.deadline) ? Math.max(0, Math.ceil((saved.deadline-Date.now())/1000)) : saved.remaining;
  // A completed block is counted once; returning to the page does not fabricate subsequent sessions.
  if (saved.running && pomodoroRemaining === 0) { switchPomodoroMode(); updatePomodoroDisplay(); }
  else if (saved.running) startPomodoro();
  else updatePomodoroDisplay();
}
