# API: SHAR.DEV

Origen: manual, desde el código de `src/content/` (`published.ts`, `locale.ts`, `state.ts`) y [specs/001-content-database/contracts/content-module.md](../specs/001-content-database/contracts/content-module.md) · Fecha: 2026-11-24
Cómo regenerarlo: no hay generador. Si cambian los tipos de `src/content/published.ts`, primero cambia la spec 001 y su contrato, y después este documento.

## Entrega 1: sin API pública

En la entrega 1 (2026-11-27) no hay endpoints HTTP ni `docs/api/openapi.yaml`. El sitio público es estático: lee el contenido de Neon **una vez, durante el build**, con una función del módulo `src/content`, y publica HTML. El navegador del visitante nunca llama a funciones ni a la base de datos (AGENTS.md, «Estructura y reglas de dependencia»).

Los endpoints llegan en la entrega 2: el formulario de contacto (funcionalidad 5) y las acciones del panel (2, 3, 4 y 7). Entonces se actualiza este documento y se genera el OpenAPI.

## URLs por entorno

No hay URL de API. El build se conecta a Neon con `DATABASE_URL`:

| Entorno | De dónde sale `DATABASE_URL` |
| --- | --- |
| Local (`pnpm build`, `pnpm dev`) | `.env.local`, fuera de git |
| Vercel (build) | Variable de entorno del proyecto en Vercel |
| Tests | No hace falta: PGlite en memoria |

Base actual: Neon Free, proyecto `shar-dev`, AWS us-east-1, rama `main`.

## Autenticación

No aplica al sitio público: no hay endpoints ni sesión. El único secreto es `DATABASE_URL`, que solo existe en el entorno del build y nunca llega al HTML. Si falta, `getDb()` lanza `DATABASE_URL is not set. Add it to .env.local or the environment.` y el build falla.

## Errores

Todos rompen el build, que es lo correcto: es preferible no publicar a publicar un sitio a medias.

| Caso | Error | Detalle |
| --- | --- | --- |
| Idioma distinto de `en` o `es` | `ContentValidationError` | `issues: [{ field: "locale", code: "unsupported_locale", message: "Locale must be one of: en, es." }]` |
| Falta `DATABASE_URL` | `Error` | Mensaje de arriba |
| Neon no responde | Error del driver `@neondatabase/serverless` | El build falla; se reintenta redesplegando |

## Paginación, filtros y orden

No hay paginación: una llamada devuelve todo el contenido de un idioma (menos de 50 elementos). Cada lista llega en el orden que decide el administrador (`position`), no por fecha. Los proyectos en borrador nunca aparecen.

## Funciones que usa el build

En lugar de endpoints, el sitio usa estas funciones de `src/content/index.ts`. Ningún otro módulo importa archivos internos de `src/content/`.

| Función | Entrada | Salida | Errores |
| --- | --- | --- | --- |
| `getDb()` | — (lee `DATABASE_URL`) | `Database`; un pool por proceso | Falta `DATABASE_URL` |
| `getPublishedContent(db, locale)` | `locale`: `"en"` o `"es"` | `Promise<PublishedContent>` | `unsupported_locale` |

`getContentLastModified(db)` también existe, pero el sitio no la necesita. Es para la publicación automática (funcionalidad 4).

## Tipos de datos

### `PublishedContent`

Los textos llegan **ya resueltos** al idioma pedido. Si un texto no tiene versión en español (vacío o solo espacios), llega en inglés, campo por campo, y nunca vacío. Todo es texto plano: el sitio lo escapa al pintarlo y nunca lo interpreta como HTML.

```ts
type YearMonth = `${number}-${number}`; // "YYYY-MM"

type PublishedContent = {
  locale: "en" | "es";
  profile: {
    name: string;
    title: string;
    slogan: string;
    headline: string | null;   // null si no tiene texto en ningún idioma (hoy, null)
    summary: string;
    mission: string;
    vision: string;
  };
  values: { id: number; title: string; description: string }[]; // de 1 a 6
  experience: {
    id: number;
    company: string;
    role: string;
    location: string;          // modalidad o ubicación
    startMonth: YearMonth;
    endMonth: YearMonth | null;                // null = puesto actual
    endLabel: "Present" | "Presente" | null;   // solo en el puesto actual
    achievements: string[];    // de 1 a 5
    technologies: string[];    // al menos 1; no se traducen
  }[];
  skillCategories: {
    id: number;
    name: string;
    skills: { id: number; name: string }[];  // sin nivel ni números
  }[];
  projects: {                  // solo publicados
    id: number;
    title: string;
    description: string;
    technologies: string[];    // al menos 1
    demoUrl: string | null;    // https
    codeUrl: string | null;    // https
    image: { url: string; alt: string } | null; // en la entrega 1 siempre null
  }[];
  contact: {
    email: string;
    whatsapp: string;          // "+" y de 8 a 15 dígitos
    linkedinUrl: string | null;
    githubUrl: string | null;
  };
};
```

### Longitudes máximas (FR-021)

Sirven para que el diseño aguante el peor caso. Se cuentan en caracteres (puntos de código).

| Campo | Máximo |
| --- | --- |
| `headline` | 120 |
| `slogan`, `name`, `title`, `company`, `role`, `location`, títulos de valor y proyecto, nombres de categoría, habilidad y tecnología | 80 |
| Descripción de proyecto | 300 |
| Logro, descripción de valor | 200 |
| `summary`, `mission`, `vision` | 1200 |
| Texto alternativo de imagen | 150 |

### Lo que el sitio formatea

- **Fechas:** `startMonth` y `endMonth` llegan como `"YYYY-MM"`. El formato visible por idioma (por ejemplo «Mar 2024» o «mar. 2024») lo decide el sitio (funcionalidad 6).
- **Puesto actual:** se pinta `endLabel` («Present» o «Presente») en lugar de la fecha de fin.
- **Enlaces opcionales:** si `demoUrl`, `codeUrl`, `linkedinUrl` o `githubUrl` son `null`, no se muestra el enlace.
- **Titular:** si `headline` es `null`, no se muestra.

## Límites y CORS

- No hay CORS: el navegador no hace peticiones.
- Rendimiento (SC-006): `getPublishedContent` tarda 1786 ms con Neon en frío y entre 717 y 853 ms en caliente, medido desde Costa Rica el 2026-11-24 ([research.md §12](../specs/001-content-database/research.md)). El build hace dos llamadas, una por idioma.
- Neon Free suspende el cómputo tras 5 minutos sin uso. Solo afecta a la duración del build, nunca al visitante.

## Cómo consumirla desde el frontend

No hay cliente HTTP que generar. Las páginas prerenderizadas que crea la funcionalidad 6, `src/pages/index.astro` (`en`) y `src/pages/es/index.astro` (`es`), llamarán en su frontmatter a `getPublishedContent(getDb(), locale)` y pasarán el resultado a los componentes de `src/ui/`.

Por comprobar en la funcionalidad 6: `getDb()` lee `process.env.DATABASE_URL`. Hay que confirmar que en `pnpm build` local la variable de `.env.local` llega a `process.env` (en Vercel ya está en el entorno).

## Pantallas cubiertas

Entrega 1, según `docs/vision.md`:

| Pantalla o bloque | Datos |
| --- | --- |
| Inicio: presentación y eslogan | `profile.name`, `profile.title`, `profile.slogan`, `profile.headline` |
| Inicio: «Start Mission» | `contact.email`; el asunto del correo es un texto de la interfaz, no contenido |
| Inicio: descarga del CV | Ninguno: archivo fijo en `public/` |
| About | `profile.summary`, `profile.mission`, `profile.vision`, `values` |
| Experiencia | `experience` |
| Habilidades | `skillCategories` |
| Proyectos | `projects` |
| Contacto | `contact` |
| 404 | Ninguno |

Los textos fijos de la interfaz (títulos de sección, botones, selector de idioma, SEO y Open Graph) no son contenido de la base: van en el código de la funcionalidad 6, en EN y ES.

Huecos, todos planificados para la entrega 2 y sin efecto en la 1:

- Formulario de contacto del footer: falta el endpoint (funcionalidad 5) y la interfaz (9).
- Panel de administración, con todas sus pantallas: funcionalidades 2, 3, 4, 7 y 8.
- Imágenes de proyectos y CV en Blob: funcionalidad 3.

Diferencia con la visión: `docs/vision.md` habla de 3 a 5 logros por puesto, pero la spec 001 (FR-009), que manda, admite de 1 a 5. El diseño debe aguantar un puesto con un solo logro.
