# Encargo de diseño: SHAR.DEV, portafolio de Sharlton Romero

Para pegar en Claude Design. Adjunta en la conversación los archivos de `docs/diseno/marca/` que se indican en «Lo que ya existe».

## Producto

Portafolio profesional de Sharlton Romero, Java Backend Engineer en San José, Costa Rica, abierto a roles remotos. Es una página única con secciones ancladas, en inglés (principal) y español, más una página 404. Lo visitan reclutadores y equipos técnicos: suelen revisarlo en el escritorio, pero el enlace de LinkedIn se abre mucho en el celular. Tiene que entenderse en segundos quién es, qué ha hecho y cómo contactarlo.

El tema sigue la preferencia del sistema y tiene interruptor. **El modo claro es el principal y se diseña primero**; el oscuro también se entrega.

Stack de la interfaz: Astro con páginas estáticas y Tailwind CSS 4, con muy poco JavaScript. El objetivo es Lighthouse ≥ 95, así que todo lo que diseñes debe poder construirse con HTML, CSS y poco JS.

## Sensación

Debe sentirse **creativo, bien compuesto y profesional**. Nunca **sobresaturado, infantil ni poco profesional**.

Nivel de riesgo: seguro en la estructura y atrevido en un solo lugar. La audacia va en **cómo se presentan la experiencia y los proyectos**. El resto se mantiene sobrio.

## Mundo del producto

Una **ventana de terminal en pixel art**, con toques de consola de 16 y 32 bits. De ahí salen la forma y los detalles:

- la barra de título de la ventana con los tres cuadrados;
- el cursor `_` que parpadea;
- la cuadrícula de fondo y los rombos pixel;
- los bordes gruesos y las sombras duras sin desenfoque;
- los bloques sólidos de color.

No hay personajes ni escenas de videojuego. Las secciones llevan nombres normales (About, Experience, Skills, Projects, Contact), y el guiño de juego queda en detalles como la frase del footer.

## Referencias

- **Me gusta mi página actual en construcción**, https://shardev-portfolio.vercel.app/ (captura adjunta `pagina-en-construccion.png`): la ventana de terminal como marco, el logo grande, la barra de progreso pixel y el tono sobrio.
- **Me gustan mis mockups de identidad** (adjuntos `mockup-proporciones.png` y `mockup-proporciones-oscuro.png`):
  - navbar con logo y botón naranja;
  - hero en bloque naranja con etiqueta del título profesional, «Hello, I'm Sharlton Romero» y dos botones;
  - tarjetas con cabecera de color;
  - footer con una frase de juego.

  Úsalos como punto de partida, no como diseño cerrado.
- **De esos mockups NO quiero:**
  - las barras de progreso del bloque «Stats», porque las habilidades no llevan niveles, barras, porcentajes ni números;
  - los badges con números como «LVL 81»;
  - el cian en modo oscuro.
- **Referencias de apoyo, con el mismo tono:**
  - https://fahimarifen.com/: une la estética pixel y terminal con un posicionamiento de ingeniero senior.
  - https://8-bitquest.domidex01.workers.dev/: proyectos presentados como trabajo de ingeniería real y sin imagen.

  No copies su escena ni su estructura.
- **No quiero parecerme a las plantillas de «pixel portfolio»** con Press Start 2P, scanlines pesadas, barras de vida y colores arcade. Son justo lo infantil y sobresaturado que hay que evitar.

## Pantallas

Los textos de la interfaz van en inglés, con su versión en español al lado. En la versión en español, los textos del contenido llegan en español (ver el Anexo).

### 1. Página única (`/` en inglés, `/es/` en español)

Propósito: que un reclutador entienda en segundos quién es Sharlton y lo contacte.

**Navbar** (fija o visible al hacer scroll):
- logo horizontal;
- anclas: About, Experience, Skills, Projects, Contact (Sobre mí, Experiencia, Habilidades, Proyectos, Contacto);
- selector «EN / ES»;
- interruptor de tema claro/oscuro;
- botón «Start Mission».

En el celular, las anclas pasan a un menú.

**Inicio (hero):**
- Etiqueta: «Java Backend Engineer».
- Titular: «Hello, I'm Sharlton Romero» / «Hola, soy Sharlton Romero».
- Eslogan: «One endpoint at a time.» / «Un endpoint a la vez.».
- Botón principal: «Start Mission»; abre el correo del visitante con el asunto ya puesto.
- Botón secundario: «Download CV» / «Descargar CV»; el PDF es solo en inglés.
- Prevé el hueco del titular (`headline`, hasta 120 caracteres). Hoy está vacío y, si no hay texto, no se muestra.

**About:**
- El perfil profesional, un párrafo de unos 650 caracteres.
- La misión y la visión.
- Los 4 valores, cada uno con título y descripción corta.

**Experience (elemento distintivo):**
- Hay 2 puestos, en el orden que decide Sharlton.
- Cada puesto muestra: empresa, cargo, fechas («Oct 2026 – Present» / «oct. 2026 – Presente»), ubicación, de 1 a 5 logros y tecnologías.
- El puesto actual se distingue del pasado.

**Skills:**
- 6 categorías con 38 habilidades en total; algunas categorías tienen 4 habilidades y otras 11.
- **Sin niveles, barras, porcentajes, estrellas ni números.**
- La forma de presentarlas queda abierta: propón algo que encaje con la terminal pixel sin ser una nube de etiquetas genérica.

**Projects (elemento distintivo):**
- Tarjetas sin imagen, con título, descripción (hasta 300 caracteres), tecnologías y enlaces «View code» / «Ver código» y «Live demo» / «Ver demo». Cada enlace aparece solo si existe.
- Hoy hay **un solo proyecto** (Tucán, solo con código). El diseño debe verse completo con uno y también funcionar con 6.

**Contact:**
- Correo, WhatsApp, LinkedIn y GitHub.
- Botón «Start Mission».
- No hay formulario en esta versión; llegará más adelante en el footer, así que deja sitio.

**Footer:**
- «Game over? Not yet.» / «¿Game over? Todavía no.» (el texto en español es una propuesta).
- «© 2026 Sharlton Romero».
- Enlaces a LinkedIn y GitHub.

**Flujo principal:** el visitante entra en el hero, recorre la experiencia y los proyectos, y pulsa «Start Mission» o «Download CV». En cualquier momento puede cambiar el idioma o el tema.

### 2. Página 404

- Titular: «404 — Endpoint not found» / «404 — Endpoint no encontrado».
- Texto: «This page doesn't exist or was moved.» / «Esta página no existe o se movió.».
- Botón: «Back to home» / «Volver al inicio».
- Con el tono de terminal y en los dos modos.

## Datos y conexión

El sitio es estático: el contenido se lee de la base de datos al construir la página y llega ya traducido, con respaldo al inglés (ver `docs/api.md`). No hay estados de «cargando» ni errores de red. Usa **solo los datos reales del Anexo**, no inventes puestos, proyectos, cifras ni logos de empresas. El diseño debe aguantar:

- **Puesto actual:** «Present» / «Presente» en lugar de la fecha de fin.
- **Proyecto sin demo** (el caso de Tucán), sin código, o sin ninguno de los dos enlaces.
- **Uno o varios proyectos.** Si no hubiera ninguno, la sección se oculta.
- **Un puesto con un solo logro y otro con 5.**
- **Peor caso de longitud:** títulos y cargos de 80 caracteres, logros de 200, descripciones de proyecto de 300, y perfil, misión y visión de hasta 1200.
- **Español:** sus textos son entre un 15 y un 25 % más largos que en inglés; revisa sobre todo los botones y la navbar.

No hay autenticación: el sitio es público.

## Lo que ya existe (obligatorio, no se rediseña)

Adjunta desde `docs/diseno/marca/`:

| Qué | Archivos |
| --- | --- |
| Logo | `logo/shardev-logo.svg`, `shardev-navbar.svg`, `shardev-lockup.svg` y sus versiones `-dark` para modo oscuro, tal cual, sin cambiar colores |
| Favicon | `favicon/favicon.svg` |
| Paleta clara | `paleta/colors.css`, `paleta/paleta-60-30-10.png` |
| Paleta oscura | `paleta/colors-dark.css`, `paleta/paleta-modo-oscuro.png` |
| Tipografía | `tipografia/fuentes.css`, `tipografia/tipografias.png` |
| Fondos | `fondos/fondo-claro.png`, `fondo-oscuro.png`, `ejemplo-contenido.png`, `ejemplo-portada.png` |
| Referencias | `referencias/mockup-proporciones.png`, `mockup-proporciones-oscuro.png`, `pagina-en-construccion.png` |

Reglas de la marca:

- **Modo claro 60-30-10:**
  - 60 %: Naranja Pixel `#FF6B35`, para marca, bloques grandes, cabeceras y botones;
  - 30 %: Negro Tinta `#0A0A0A`, para texto, bordes, sombras, navbar y footer;
  - 10 %: Cian Cursor `#22D3EE`, para hover, foco, badges y elemento activo.

  El lienzo es `#FAFAFA` / `#FFFFFF`. Variantes: `#C2410C` (sombras y estado pressed), `#FFE4D6` (fondos suaves), `#3F3F46` (texto secundario) y `#0E7490` (enlaces sobre claro).
- **Modo oscuro, solo naranja:**
  - 60 %: `#FF6B35`;
  - 30 %: Gris Niebla `#D4D4D8`;
  - 10 %: Naranja Brasa `#FF9A5C`.

  El fondo es `#0A0A0A`, los paneles `#111111` y las líneas `#1C1C1C`. **Sin cian.**
- **Texto sobre naranja:** siempre negro (6.98:1); el blanco no cumple.
- **Naranja como texto:** solo sobre fondo oscuro. Sobre claro, el naranja se usa como bloque, no como letra.
- **Colores:** ninguno fuera de la paleta, ni verde ni rosa.
- **Tipografía:** Handjet 600 para títulos, botones y etiquetas, a 20 px o más. Space Grotesk 400/500/700 para párrafos, navegación y datos. Ambas OFL. Escala de referencia: h1 64/64, h2 44/48, h3 30/34, cuerpo 16/24 y lead 20/30.
- **Estilo:** bordes gruesos, sombras duras desplazadas sin desenfoque, cuadrícula de fondo y rombos pixel.

## Recursos aprobados

- **Movimiento:**
  - con CSS nativo: entradas con scroll-driven animations y respaldo visible, cursor con `steps()`, y hovers en los que la sombra dura se acorta y el elemento se desplaza;
  - Motion, la librería JS ligera, solo si una interacción concreta lo exige.
- **Componentes:** HTML semántico estilado a mano con los tokens de la marca; nada de colecciones pixel prefabricadas (8bitcn, NES.css).
- **Fuentes:** solo las de la marca.

## Requisitos

- Contraste de texto de 4.5:1 como mínimo (3:1 en texto grande y controles), en los dos modos.
- Foco visible en todo lo interactivo, en cian en claro y en naranja brasa en oscuro.
- Áreas táctiles de 44 px.
- Responsive de verdad: escritorio primero, pero el celular bien pensado, no solo apilado. Sin scroll horizontal a 320 px.
- Densidad de aire medio: espacio para respirar, sin llegar a lo vacío.
- Movimiento de nivel 3 a 4 de 5, con alternativa estática con `prefers-reduced-motion`. El movimiento nunca compite con la lectura.
- Tema sin parpadeo al cargar.
- Fuentes con licencia apta para uso comercial (ya lo son).

## Evitar

- Barras de nivel, porcentajes, estrellas, «LVL» o cualquier número en las habilidades.
- Press Start 2P u otras fuentes pixel gruesas para párrafos; scanlines, brillos CRT y neón como decoración.
- Que cada sección entre con el mismo fundido que sube y que cada tarjeta se anime igual al pasar el cursor. Mejor un momento orquestado en el hero y animaciones que respondan a lo que hace el usuario.
- Fila de tres tarjetas iguales con íconos de línea, o un bento genérico, para habilidades o proyectos.
- Numeración 01 / 02 / 03 o un número gigante con estadísticas en el hero, cuando el contenido no es una secuencia.
- Etiquetas en mayúsculas espaciadas encima de cada título, y una flecha «→» pegada a cada botón.
- Degradados, glassmorphism o cualquier color fuera de la paleta.
- Emojis como íconos, logos de empresas inventados o cifras que no estén en el Anexo.

## Pedido

1. Propón **tres direcciones** distintas en concepto, composición o tipografía, no solo en color: una segura y al menos una atrevida. Muéstralas en el hero y en la sección de experiencia, en modo claro, y explica la idea de cada una en una frase.
2. Cuando elija una, aplícala a toda la página en claro y en oscuro, en escritorio y en celular, y a la 404. Hazlo primero en inglés y comprueba después la versión en español.
3. Deja el sistema de diseño reutilizable:
   - tokens de color con su uso en cada modo;
   - tipografía y escala;
   - espaciado, bordes, radios y sombras;
   - componentes con sus estados (normal, hover, foco, pressed y desactivado): botón principal y secundario, enlace, navbar y menú móvil, selector de idioma, interruptor de tema, tarjeta de puesto, tarjeta de proyecto, grupo de habilidades y footer.

## Entrega

Deja el resultado como **sistema de diseño reutilizable** en Claude Design y prepáralo para enviarlo a Claude Code con su paquete de handoff. Sharlton traerá de vuelta a `docs/diseno/` el handoff o el sistema exportado, y el HTML de la página en claro y en oscuro.

## Anexo: contenido real

Lo devuelve hoy la base de datos para cada idioma. Las descripciones de los valores son literales de la fuente aprobada: dos empiezan en minúscula porque en el original van tras una raya («Technical rigor — quality is built in, not added later.»).

### Inglés (/)

```json
{
  "locale": "en",
  "profile": {
    "name": "Sharlton Romero",
    "title": "Java Backend Engineer",
    "slogan": "One endpoint at a time.",
    "headline": null,
    "summary": "Java Backend Engineer with 2+ years of experience building production-grade REST and GraphQL APIs with Java and Spring Boot in a Fortune 500 environment. I design secure, scalable microservices and third-party integrations, and I'm comfortable owning a solution from design through deployment. My focus is turning complex business needs into reliable, high-performance backend systems that teams can build on. My toolkit includes Spring Security, JWT/OAuth2, PostgreSQL, Oracle, Docker and CI/CD. Apollo-certified GraphQL developer who works daily in English with global teams. Based in San José, Costa Rica, open to remote opportunities.",
    "mission": "To build secure, reliable and well-documented backend systems that turn complex business logic into services teams and users can trust — one endpoint at a time.",
    "vision": "To grow into a Senior Software Engineer and backend architect who leads scalable distributed systems and helps other developers grow, working on products with global impact."
  },
  "values": [
    {
      "title": "Autonomy",
      "description": "I take ownership from design to production."
    },
    {
      "title": "Technical rigor",
      "description": "quality is built in, not added later."
    },
    {
      "title": "Clear communication",
      "description": "complex ideas, explained simply."
    },
    {
      "title": "Continuous learning",
      "description": "I keep growing while I deliver."
    }
  ],
  "experience": [
    {
      "company": "Emerson",
      "role": "Automation Developer Intern",
      "location": "San José, Costa Rica",
      "startMonth": "2026-10",
      "endMonth": null,
      "endLabel": "Present",
      "achievements": [
        "Developing workflow automations for internal business processes with Microsoft Power Automate (Power Platform).",
        "Getting to know Emerson's internal systems, teams and delivery practices from the inside, while deepening Java, Spring Boot and Oracle SQL skills."
      ],
      "technologies": [
        "Microsoft Power Automate",
        "Power Platform"
      ]
    },
    {
      "company": "World Kinect Corporation",
      "role": "Backend Software Engineer (IT Developer)",
      "location": "San José, Costa Rica",
      "startMonth": "2022-08",
      "endMonth": "2025-02",
      "endLabel": null,
      "achievements": [
        "Enhanced and maintained Spring Boot microservices (Java 17, REST and GraphQL) on Oracle, integrating a global network of fuel suppliers with real-time order sync.",
        "Independently built a complete integration with Shell's fuel-order REST APIs in a single two-week sprint, closing documentation gaps directly with Shell's team.",
        "Released the Shell integration behind a LaunchDarkly feature flag, keeping the legacy version as an instant fallback without a redeploy.",
        "Designed an in-memory cache for a frequently requested airport list, removing repeated heavy Oracle queries and reducing response times.",
        "Secured new endpoints with Spring Security, OAuth2 and JWT, and delivered with TDD (JUnit, Mockito), code reviews and CI/CD on Bitbucket Pipelines."
      ],
      "technologies": [
        "Java 17",
        "Spring Boot",
        "GraphQL",
        "Oracle Database",
        "Spring Data JPA",
        "Hibernate",
        "Spring Security",
        "OAuth2",
        "JWT",
        "JUnit",
        "Mockito",
        "Docker",
        "Bitbucket Pipelines",
        "LaunchDarkly",
        "New Relic"
      ]
    }
  ],
  "skillCategories": [
    {
      "name": "Java & Spring Boot",
      "skills": [
        {
          "name": "Java"
        },
        {
          "name": "Spring Boot"
        },
        {
          "name": "Spring MVC"
        },
        {
          "name": "SOLID"
        }
      ]
    },
    {
      "name": "Databases",
      "skills": [
        {
          "name": "Oracle Database"
        },
        {
          "name": "Oracle SQL"
        },
        {
          "name": "Spring Data JPA"
        },
        {
          "name": "Hibernate"
        },
        {
          "name": "Flyway"
        },
        {
          "name": "MySQL"
        },
        {
          "name": "PostgreSQL"
        }
      ]
    },
    {
      "name": "APIs & Integration",
      "skills": [
        {
          "name": "REST"
        },
        {
          "name": "GraphQL"
        },
        {
          "name": "Microservices"
        },
        {
          "name": "OpenAPI / Swagger"
        },
        {
          "name": "Postman"
        }
      ]
    },
    {
      "name": "Security",
      "skills": [
        {
          "name": "Spring Security"
        },
        {
          "name": "OAuth2"
        },
        {
          "name": "JWT"
        },
        {
          "name": "RBAC"
        }
      ]
    },
    {
      "name": "Testing & CI/CD",
      "skills": [
        {
          "name": "JUnit 5"
        },
        {
          "name": "Mockito"
        },
        {
          "name": "TDD"
        },
        {
          "name": "Maven"
        },
        {
          "name": "Docker"
        },
        {
          "name": "Git"
        },
        {
          "name": "Bitbucket Pipelines"
        },
        {
          "name": "GitHub Actions"
        },
        {
          "name": "LaunchDarkly"
        },
        {
          "name": "New Relic"
        },
        {
          "name": "Jira"
        }
      ]
    },
    {
      "name": "Web & Automation",
      "skills": [
        {
          "name": "HTML"
        },
        {
          "name": "CSS"
        },
        {
          "name": "JavaScript"
        },
        {
          "name": "React"
        },
        {
          "name": "TypeScript"
        },
        {
          "name": "Power Automate"
        },
        {
          "name": "Claude Code"
        }
      ]
    }
  ],
  "projects": [
    {
      "title": "Tucán · Personal Finance API",
      "description": "Low-friction expense logging in daily use: an iOS Shortcut calls a REST API that writes straight to a Google Sheet. API-key auth, fail-fast config validation and an enum-driven domain model, covered by 114 automated tests.",
      "technologies": [
        "Java 21",
        "Spring Boot 3.3",
        "Google Sheets API",
        "Google Cloud Run"
      ],
      "demoUrl": null,
      "codeUrl": "https://github.com/SharltonRB/Tucan-Finanzas",
      "image": null
    }
  ],
  "contact": {
    "email": "sromerobpersonal@gmail.com",
    "whatsapp": "+50670429481",
    "linkedinUrl": "https://www.linkedin.com/in/sharlton-rb/",
    "githubUrl": "https://github.com/SharltonRB"
  }
}
```

### Español (/es/)

```json
{
  "locale": "es",
  "profile": {
    "name": "Sharlton Romero",
    "title": "Java Backend Engineer",
    "slogan": "Un endpoint a la vez.",
    "headline": null,
    "summary": "Ingeniero Backend Java con más de 2 años de experiencia construyendo APIs REST y GraphQL de nivel productivo con Java y Spring Boot en un entorno Fortune 500. Diseño microservicios e integraciones con terceros seguros y escalables, y me siento cómodo asumiendo una solución desde el diseño hasta el despliegue. Mi enfoque es convertir necesidades de negocio complejas en sistemas backend confiables y de alto rendimiento sobre los que los equipos puedan construir. Mi caja de herramientas incluye Spring Security, JWT/OAuth2, PostgreSQL, Oracle, Docker y CI/CD. Desarrollador GraphQL certificado por Apollo que trabaja a diario en inglés con equipos globales. Radicado en San José, Costa Rica, abierto a oportunidades remotas.",
    "mission": "Construir sistemas backend seguros, confiables y bien documentados que conviertan la lógica de negocio compleja en servicios en los que equipos y usuarios puedan confiar, un endpoint a la vez.",
    "vision": "Crecer hasta convertirme en Ingeniero de Software Senior y arquitecto backend que lidera sistemas distribuidos escalables y ayuda a otros desarrolladores a crecer, trabajando en productos de alcance global."
  },
  "values": [
    {
      "title": "Autonomía",
      "description": "asumo la responsabilidad desde el diseño hasta producción."
    },
    {
      "title": "Rigor técnico",
      "description": "la calidad se construye desde el inicio, no se agrega después."
    },
    {
      "title": "Comunicación clara",
      "description": "ideas complejas, explicadas con sencillez."
    },
    {
      "title": "Aprendizaje constante",
      "description": "sigo creciendo mientras entrego resultados."
    }
  ],
  "experience": [
    {
      "company": "Emerson",
      "role": "Practicante de Desarrollo de Automatizaciones",
      "location": "San José, Costa Rica",
      "startMonth": "2026-10",
      "endMonth": null,
      "endLabel": "Presente",
      "achievements": [
        "Desarrollo automatizaciones de flujos de trabajo para procesos internos de negocio con Microsoft Power Automate (Power Platform).",
        "Conozco desde dentro los sistemas, equipos y prácticas de entrega de Emerson, mientras sigo profundizando en Java, Spring Boot y Oracle SQL."
      ],
      "technologies": [
        "Microsoft Power Automate",
        "Power Platform"
      ]
    },
    {
      "company": "World Kinect Corporation",
      "role": "Ingeniero de Software Backend (IT Developer)",
      "location": "San José, Costa Rica",
      "startMonth": "2022-08",
      "endMonth": "2025-02",
      "endLabel": null,
      "achievements": [
        "Mejoré y mantuve microservicios Spring Boot (Java 17, REST y GraphQL) sobre Oracle, integrando una red global de proveedores de combustible con pedidos en tiempo real.",
        "Construí por mi cuenta la integración completa con las API REST de pedidos de combustible de Shell en un sprint de dos semanas, resolviendo vacíos con su equipo.",
        "Lancé la integración de Shell tras un feature flag de LaunchDarkly, con la versión anterior como respaldo inmediato sin redesplegar.",
        "Diseñé una caché en memoria para una lista de aeropuertos muy consultada, eliminando consultas pesadas repetidas a Oracle y reduciendo los tiempos de respuesta.",
        "Aseguré nuevos endpoints con Spring Security, OAuth2 y JWT, y entregué con TDD (JUnit, Mockito), code reviews y CI/CD en Bitbucket Pipelines."
      ],
      "technologies": [
        "Java 17",
        "Spring Boot",
        "GraphQL",
        "Oracle Database",
        "Spring Data JPA",
        "Hibernate",
        "Spring Security",
        "OAuth2",
        "JWT",
        "JUnit",
        "Mockito",
        "Docker",
        "Bitbucket Pipelines",
        "LaunchDarkly",
        "New Relic"
      ]
    }
  ],
  "skillCategories": [
    {
      "name": "Java y Spring Boot",
      "skills": [
        {
          "name": "Java"
        },
        {
          "name": "Spring Boot"
        },
        {
          "name": "Spring MVC"
        },
        {
          "name": "SOLID"
        }
      ]
    },
    {
      "name": "Bases de datos",
      "skills": [
        {
          "name": "Oracle Database"
        },
        {
          "name": "Oracle SQL"
        },
        {
          "name": "Spring Data JPA"
        },
        {
          "name": "Hibernate"
        },
        {
          "name": "Flyway"
        },
        {
          "name": "MySQL"
        },
        {
          "name": "PostgreSQL"
        }
      ]
    },
    {
      "name": "APIs e integración",
      "skills": [
        {
          "name": "REST"
        },
        {
          "name": "GraphQL"
        },
        {
          "name": "Microservices"
        },
        {
          "name": "OpenAPI / Swagger"
        },
        {
          "name": "Postman"
        }
      ]
    },
    {
      "name": "Seguridad",
      "skills": [
        {
          "name": "Spring Security"
        },
        {
          "name": "OAuth2"
        },
        {
          "name": "JWT"
        },
        {
          "name": "RBAC"
        }
      ]
    },
    {
      "name": "Pruebas y CI/CD",
      "skills": [
        {
          "name": "JUnit 5"
        },
        {
          "name": "Mockito"
        },
        {
          "name": "TDD"
        },
        {
          "name": "Maven"
        },
        {
          "name": "Docker"
        },
        {
          "name": "Git"
        },
        {
          "name": "Bitbucket Pipelines"
        },
        {
          "name": "GitHub Actions"
        },
        {
          "name": "LaunchDarkly"
        },
        {
          "name": "New Relic"
        },
        {
          "name": "Jira"
        }
      ]
    },
    {
      "name": "Web y automatización",
      "skills": [
        {
          "name": "HTML"
        },
        {
          "name": "CSS"
        },
        {
          "name": "JavaScript"
        },
        {
          "name": "React"
        },
        {
          "name": "TypeScript"
        },
        {
          "name": "Power Automate"
        },
        {
          "name": "Claude Code"
        }
      ]
    }
  ],
  "projects": [
    {
      "title": "Tucán · API de finanzas personales",
      "description": "Registro de gastos sin fricción, en uso diario: un Atajo de iOS llama a una API REST que escribe directo en una hoja de Google Sheets. Autenticación por API key, validación temprana de la configuración y un dominio guiado por enums, con 114 tests automáticos.",
      "technologies": [
        "Java 21",
        "Spring Boot 3.3",
        "Google Sheets API",
        "Google Cloud Run"
      ],
      "demoUrl": null,
      "codeUrl": "https://github.com/SharltonRB/Tucan-Finanzas",
      "image": null
    }
  ],
  "contact": {
    "email": "sromerobpersonal@gmail.com",
    "whatsapp": "+50670429481",
    "linkedinUrl": "https://www.linkedin.com/in/sharlton-rb/",
    "githubUrl": "https://github.com/SharltonRB"
  }
}
```
