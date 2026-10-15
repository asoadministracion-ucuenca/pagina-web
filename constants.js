(function () {
  "use strict";

  const CYCLES = [
    { id: "primer-ciclo", name: "Primer Ciclo", subjects: ["Cálculo Diferencial", "Contabilidad", "Estadística Descriptiva y Probabilidad", "Fundamentos de la Administración", "Introducción a la Economía Empresarial", "Álgebra Matricial"] },
    { id: "segundo-ciclo", name: "Segundo Ciclo", subjects: ["Cálculo Integral", "Contabilidad de Gestión", "Estadística Inferencial", "Gestión Administrativa", "Derecho Laboral", "Microeconomía"] },
    { id: "tercer-ciclo", name: "Tercer Ciclo", subjects: ["Contabilidad de Costos", "Liderazgo y Equipos", "Macroeconomía", "Matemáticas Financieras", "Estadística Aplicada", "Fundamentos de Programación"] },
    { id: "cuarto-ciclo", name: "Cuarto Ciclo", subjects: ["Fundamentos de Marketing", "Finanzas Corporativas a Corto Plazo", "Gestión de Talento Humano", "Gestión Presupuestaria", "Investigación Operativa", "Planificación Estratégica, Táctica y Operativa"] },
    { id: "quinto-ciclo", name: "Quinto Ciclo", subjects: ["Auditoría de Gestión", "Derecho Empresarial", "Emprendimiento e Innovación", "Finanzas Corporativas a Largo Plazo", "Gestión de la Producción", "Administración de Marketing", "Prácticas de Servicio Comunitario"] },
    { id: "sexto-ciclo", name: "Sexto Ciclo", subjects: ["Management and Financial Training", "Formulación de Proyectos", "Administración Pública", "Herramientas Informáticas y Sistemas de Información Gerencial", "Logística Empresarial", "Práctica Laboral", "Comunicación Digital y E-Commerce"] },
    { id: "septimo-ciclo", name: "Séptimo Ciclo", subjects: ["Evaluación de Proyectos", "Finanzas Internacionales", "Técnicas y Métodos de Investigación Empresarial", "Gerencia de Sostenibilidad", "Gestión de Empresas Públicas", "Comercio Exterior"] },
    { id: "octavo-ciclo", name: "Octavo Ciclo", subjects: ["Gestión de Calidad", "Estrategia y Toma de Decisiones", "Trabajo de Integración Curricular", "Negociación", "Creación de Empresas", "Business Intelligence"] }
  ];

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

  window.PortalEconomiaShared = Object.freeze({
    CYCLES,
    CATEGORIES,
    STORAGE_KEY: "repositorio-academico-materiales-v1"
  });
})();
