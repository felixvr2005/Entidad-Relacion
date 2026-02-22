// ===================================================================
// PROMPT TEMPLATES — Professional prompt engineering system
// ===================================================================

const PROMPT_CATEGORIES = [
  {
    id: 'programming',
    icon: '💻',
    name: 'Programación',
    description: 'Código, arquitectura, debug',
    templates: [
      {
        name: 'Plan de Implementación',
        trigger: ['implementar', 'crear', 'desarrollar', 'feature', 'funcionalidad', 'hacer'],
        generate: (input) => `Actúa como un arquitecto de software senior con 15+ años de experiencia.

## TAREA
Genera un plan de implementación detallado y profesional para: "${input}"

## INSTRUCCIONES
1. **Análisis de Requisitos**: Identifica requisitos funcionales y no funcionales
2. **Arquitectura Propuesta**: Diseño de alto nivel con componentes y sus responsabilidades
3. **Plan de Tareas**: Lista numerada con:
   - Nombre de la tarea
   - Archivos a crear/modificar
   - Funciones/clases principales
   - Estimación de tiempo
   - Dependencias entre tareas
4. **Stack Tecnológico**: Justifica cada tecnología elegida
5. **Testing**: Plan de pruebas (unitarias, integración, E2E)
6. **Consideraciones**: Seguridad, rendimiento, escalabilidad
7. **Diagrama de Componentes**: Describe la arquitectura visualmente

Responde de forma estructurada con markdown. Sé específico en nombres de archivos, funciones y variables.`
      },
      {
        name: 'Debug Strategy',
        trigger: ['error', 'bug', 'debug', 'fallo', 'no funciona', 'problema', 'arreglar'],
        generate: (input) => `Actúa como un ingeniero de debugging experto con experiencia en resolución de problemas complejos.

## PROBLEMA
"${input}"

## INSTRUCCIONES
Genera una estrategia de debugging profesional:

1. **Hipótesis Iniciales**: Lista las 3-5 causas más probables ordenadas por probabilidad
2. **Plan de Investigación**: Pasos específicos para verificar cada hipótesis
3. **Comandos/Herramientas**: Comandos exactos de debug, logs a revisar, herramientas a usar
4. **Reproducción**: Pasos para reproducir el error de forma consistente
5. **Soluciones Propuestas**: Para cada causa, una solución con código
6. **Prevención**: Cómo evitar que este tipo de error ocurra en el futuro
7. **Tests**: Tests que detectarían este bug

Incluye snippets de código cuando sea relevante. Sé preciso y actionable.`
      },
      {
        name: 'Code Review',
        trigger: ['review', 'revisar', 'código', 'mejorar', 'optimizar', 'refactor'],
        generate: (input) => `Actúa como un lead engineer realizando un code review exhaustivo.

## CÓDIGO/CONTEXTO A REVISAR
"${input}"

## ANALIZA LOS SIGUIENTES ASPECTOS
1. **Correctitud**: ¿El código hace lo que se espera? ¿Hay edge cases no cubiertos?
2. **SOLID Principles**: ¿Se respetan SRP, OCP, LSP, ISP, DIP?
3. **Seguridad**: XSS, inyección SQL, autenticación, autorización
4. **Performance**: Complejidad algorítmica, queries N+1, memory leaks
5. **Clean Code**: Naming, funciones pequeñas, DRY, KISS
6. **Testing**: ¿Es testeable? ¿Qué tests faltan?
7. **Mantenibilidad**: ¿Es fácil de modificar en el futuro?

Para cada hallazgo, indica: severidad (P0-P3), ubicación, problema y solución propuesta con código.`
      },
      {
        name: 'Generador de API',
        trigger: ['api', 'endpoint', 'rest', 'graphql', 'backend', 'servidor'],
        generate: (input) => `Actúa como un arquitecto de APIs con expertise en diseño RESTful y mejores prácticas.

## REQUISITO
"${input}"

## GENERA
1. **Diseño de Endpoints**: Tabla con método HTTP, ruta, descripción, request body, response
2. **Modelos de Datos**: Schemas/interfaces con tipos y validaciones
3. **Autenticación**: Estrategia de auth recomendada (JWT, OAuth2, API keys)
4. **Códigos de Error**: Tabla de error codes personalizados
5. **Rate Limiting**: Política de rate limiting
6. **Documentación OpenAPI**: Ejemplo de spec YAML
7. **Implementación**: Código del controller y service principal
8. **Tests**: Tests de integración para los endpoints principales

Usa convenciones REST estándar. Incluye paginación, filtrado y ordenamiento.`
      }
    ]
  },
  {
    id: 'writing',
    icon: '📝',
    name: 'Escritura',
    description: 'Textos, artículos, emails',
    templates: [
      {
        name: 'Artículo Profesional',
        trigger: ['artículo', 'blog', 'post', 'escribir', 'texto', 'contenido', 'redactar'],
        generate: (input) => `Actúa como un redactor profesional con experiencia en content marketing y SEO.

## TEMA
"${input}"

## GENERA UN ARTÍCULO PROFESIONAL CON:
1. **Título**: Atractivo, con keyword principal (máx 60 caracteres)
2. **Meta Description**: SEO-optimizada (máx 155 caracteres)
3. **Introducción**: Hook que capture la atención en las primeras 2 líneas
4. **Estructura H2/H3**: Mínimo 5 secciones bien organizadas
5. **Contenido**: 1500-2000 palabras, tono profesional pero accesible
6. **Datos/Estadísticas**: Incluye datos relevantes y verificables
7. **Ejemplos Prácticos**: Al menos 3 ejemplos o casos de uso
8. **CTA**: Call-to-action al final
9. **Keywords**: Lista de keywords secundarias utilizadas

Estilo: Profesional, informativo, con personalidad. Sin relleno ni repeticiones.`
      },
      {
        name: 'Email Profesional',
        trigger: ['email', 'correo', 'mail', 'mensaje', 'comunicación'],
        generate: (input) => `Actúa como un experto en comunicación corporativa.

## CONTEXTO
"${input}"

## GENERA 3 VERSIONES DE EMAIL:
Para cada versión incluye:
1. **Asunto**: Conciso y claro (máx 50 caracteres)
2. **Cuerpo**: Estructura clara con saludo, contexto, propósito, acción requerida, cierre
3. **Tono**: Versión formal / Versión amigable / Versión directa

## CRITERIOS
- Máximo 150 palabras por versión
- Primera línea impactante
- Un solo CTA claro
- Sin jerga innecesaria
- Firma profesional`
      }
    ]
  },
  {
    id: 'marketing',
    icon: '📊',
    name: 'Marketing',
    description: 'Copy, campañas, SEO',
    templates: [
      {
        name: 'Copy Publicitario',
        trigger: ['copy', 'anuncio', 'publicidad', 'campaña', 'ad', 'vender', 'producto', 'marketing'],
        generate: (input) => `Actúa como un copywriter senior especializado en conversión y persuasión.

## PRODUCTO/SERVICIO
"${input}"

## GENERA:
1. **Headlines**: 10 titulares usando fórmulas probadas (AIDA, PAS, 4U)
2. **Social Ads**: 3 variantes para Facebook/Instagram (texto + sugerencia visual)
3. **Google Ads**: 3 variantes (headline 30 chars + description 90 chars)
4. **Landing Page**: Hero section + 3 bloques de beneficios + testimonial + CTA
5. **Email Sequence**: Secuencia de 3 emails (awareness → consideration → conversion)
6. **Propuesta de Valor**: USP en una frase
7. **Buyer Persona**: Perfil del cliente ideal

Aplica principios de copywriting: especificidad, urgencia, prueba social, beneficios sobre características.`
      },
      {
        name: 'Estrategia SEO',
        trigger: ['seo', 'posicionamiento', 'google', 'keywords', 'tráfico', 'orgánico'],
        generate: (input) => `Actúa como un consultor SEO con 10+ años de experiencia en posicionamiento orgánico.

## SITIO WEB / NEGOCIO
"${input}"

## GENERA UNA ESTRATEGIA SEO COMPLETA:
1. **Keyword Research**: 20 keywords organizadas por intención (informacional, transaccional, navegacional)
2. **Arquitectura Web**: Estructura de URLs y silos de contenido
3. **Plan de Contenido**: Calendario mensual con 12 artículos (keyword, título, tipo, longitud)
4. **On-Page**: Checklist de optimización técnica
5. **Link Building**: 5 estrategias de link building con pasos concretos
6. **Technical SEO**: Auditoría de Core Web Vitals y Schema Markup
7. **KPIs**: Métricas a trackear y objetivos a 3/6/12 meses

Prioriza acciones por impacto y dificultad. Incluye herramientas recomendadas.`
      }
    ]
  },
  {
    id: 'analysis',
    icon: '🔍',
    name: 'Análisis',
    description: 'Datos, investigación, reportes',
    templates: [
      {
        name: 'Análisis de Datos',
        trigger: ['datos', 'análisis', 'data', 'métricas', 'estadísticas', 'dashboard', 'reporte'],
        generate: (input) => `Actúa como un data analyst senior con expertise en business intelligence.

## DATOS/CONTEXTO
"${input}"

## GENERA:
1. **Preguntas Clave**: 10 preguntas que los datos deberían responder
2. **Metodología**: Enfoque analítico paso a paso
3. **Métricas**: KPIs principales y secundarios con fórmulas
4. **Segmentación**: Dimensiones de análisis recomendadas
5. **Visualizaciones**: Tipos de gráficos recomendados para cada insight
6. **SQL Queries**: Consultas base para extraer los datos
7. **Dashboard**: Estructura del dashboard con secciones y widgets
8. **Insights Template**: Plantilla para documentar hallazgos
9. **Recomendaciones**: Framework para convertir insights en acciones

Usa frameworks como MECE, 5 Whys o Pareto donde aplique.`
      }
    ]
  },
  {
    id: 'education',
    icon: '🎓',
    name: 'Educación',
    description: 'Explicaciones, guías, tutoriales',
    templates: [
      {
        name: 'Explicación Experta',
        trigger: ['explicar', 'explicame', 'qué es', 'cómo funciona', 'tutorial', 'aprender', 'entender', 'enseñar'],
        generate: (input) => `Actúa como un profesor universitario experto que sabe explicar conceptos complejos de forma simple.

## TEMA
"${input}"

## GENERA UNA EXPLICACIÓN EN 5 NIVELES:
1. **ELI5** (Explain Like I'm 5): Analogía simple y cotidiana
2. **Estudiante**: Explicación con terminología básica y ejemplos
3. **Intermedio**: Con detalles técnicos, pros/contras, casos de uso
4. **Avanzado**: Implementación, optimizaciones, edge cases
5. **Experto**: Estado del arte, papers relevantes, tendencias

## TAMBIÉN INCLUYE:
- **Diagrama conceptual**: Descripción textual de un diagrama explicativo
- **Ejercicios prácticos**: 3 ejercicios de dificultad creciente
- **Recursos**: 5 recursos recomendados para profundizar
- **Errores comunes**: Top 5 misconceptions sobre el tema

Usa analogías, ejemplos del mundo real y código cuando aplique.`
      }
    ]
  },
  {
    id: 'design',
    icon: '🎨',
    name: 'Diseño',
    description: 'UI/UX, branding, wireframes',
    templates: [
      {
        name: 'Brief de Diseño',
        trigger: ['diseño', 'diseñar', 'ui', 'ux', 'interfaz', 'mockup', 'wireframe', 'prototipo'],
        generate: (input) => `Actúa como un UI/UX lead designer con experiencia en design systems.

## PROYECTO
"${input}"

## GENERA UN BRIEF DE DISEÑO COMPLETO:
1. **Research**: Análisis de 3 competidores con fortalezas/debilidades
2. **User Personas**: 2 personas con goals, pain points, behaviors
3. **User Flow**: Flujo principal paso a paso
4. **Wireframe**: Descripción detallada de cada pantalla (layout, componentes, jerarquía)
5. **Design System**: Tokens de diseño (colores, tipografía, espaciado, border-radius)
6. **Componentes**: Lista de componentes UI necesarios con estados
7. **Responsive**: Breakpoints y adaptaciones
8. **Accesibilidad**: Checklist WCAG 2.1 AA
9. **Micro-interactions**: Animaciones y transiciones clave

Prioriza usabilidad y consistencia. Incluye principios de diseño aplicados.`
      }
    ]
  },
  {
    id: 'business',
    icon: '💼',
    name: 'Negocios',
    description: 'Planes, propuestas, estrategia',
    templates: [
      {
        name: 'Plan de Negocio',
        trigger: ['negocio', 'business', 'empresa', 'startup', 'emprender', 'propuesta', 'plan', 'estrategia'],
        generate: (input) => `Actúa como un consultor de estrategia de McKinsey con experiencia en startups y transformación digital.

## IDEA/NEGOCIO
"${input}"

## GENERA UN PLAN ESTRATÉGICO:
1. **Executive Summary**: Resumen ejecutivo en 3 párrafos
2. **Problem-Solution Fit**: Problema que resuelve y propuesta de valor (Value Proposition Canvas)
3. **Mercado**: TAM, SAM, SOM con estimaciones justificadas
4. **Business Model Canvas**: Los 9 bloques completados
5. **Competencia**: Matriz competitiva con 5 competidores
6. **Go-To-Market**: Estrategia de lanzamiento en 3 fases
7. **Revenue Model**: Modelo de ingresos con proyecciones a 12 meses
8. **Equipo**: Perfiles necesarios y estructura organizacional
9. **Roadmap**: Milestones a 3, 6 y 12 meses
10. **Riesgos**: Top 5 riesgos con plan de mitigación
11. **Financiamiento**: Necesidades de capital y posibles fuentes

Sé específico con números y plazos. Usa frameworks de estrategia reconocidos.`
      }
    ]
  }
];

function findBestTemplate(input, categoryId) {
  const lower = input.toLowerCase();

  // If category is specified, search within it
  if (categoryId && categoryId !== 'all') {
    const cat = PROMPT_CATEGORIES.find(c => c.id === categoryId);
    if (cat) {
      // Find best matching template in category
      let best = null;
      let bestScore = 0;
      for (const t of cat.templates) {
        const score = t.trigger.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
        if (score > bestScore) { best = t; bestScore = score; }
      }
      return best || cat.templates[0]; // fallback to first template in category
    }
  }

  // Search across all categories
  let best = null;
  let bestScore = 0;
  for (const cat of PROMPT_CATEGORIES) {
    for (const t of cat.templates) {
      const score = t.trigger.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) { best = t; bestScore = score; }
    }
  }

  // If no keywords match, default to programming plan
  return best || PROMPT_CATEGORIES[0].templates[0];
}

function generateFromTemplate(input, categoryId) {
  const template = findBestTemplate(input, categoryId);
  return {
    templateName: template.name,
    prompt: template.generate(input)
  };
}
