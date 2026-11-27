# AGENTS.md — SHAR.DEV

Portafolio profesional de Sharlton Romero (Java Backend Engineer), con la identidad visual SHAR.DEV. Sitio público bilingüe (EN principal, ES de apoyo) de una sola página, panel de administración para editar el contenido y formulario de contacto. Despliegue en Vercel con **costo $0**.

Documentos de referencia (en español):

- `docs/vision.md`: requisitos, alcance y restricciones.
- `docs/decisiones/0002-arquitectura-del-portafolio.md`: arquitectura aceptada.
- `docs/funcionalidades.md`: funcionalidades en orden; `/estado` dice cuál sigue.

## Stack

Monolito modular en un solo repo (público, en la cuenta personal de GitHub) y un proyecto de Vercel Hobby.

| Capa | Tecnología |
| --- | --- |
| Sitio público | Astro, páginas prerenderizadas; i18n con `en` sin prefijo (`/`) y `es` en `/es/` |
| Estilos | Tailwind CSS 4 con los tokens de marca y la paleta por defecto desactivada |
| Panel | Astro con render bajo demanda y Astro Actions; islas Preact solo para ordenar y subir archivos |
| API | Funciones de Vercel vía `@astrojs/vercel` |
| Autenticación | Better Auth con GitHub, restringido al ID numérico en `ADMIN_GITHUB_ID` |
| Base de datos | Neon Postgres (plan Free) con Drizzle ORM |
| Archivos | Vercel Blob (store público, subida directa desde el navegador) |
| Correo | Resend (plan Free; la cuenta usa sromerobpersonal@gmail.com) |
| Antispam | Honeypot, Cloudflare Turnstile y regla de rate limit en el WAF de Vercel |
| Analítica | Vercel Web Analytics |
| Calidad | Vitest, Playwright y Lighthouse CI en GitHub Actions |

Al instalar, fija versiones exactas con al menos dos semanas de antigüedad. Antes de usar una API que pueda haber cambiado, consulta la documentación actual (Context7).

## Comandos

Node 24 y pnpm 11.28.10 (fijado en `packageManager`). La app vive en `proyecto/` (regla de entrega del curso): ejecuta los comandos desde ahí; `docs/`, `specs/` y `.github/` siguen en la raíz.

```bash
pnpm install
pnpm dev                          # servidor de desarrollo de Astro
pnpm lint                         # Biome
pnpm format                       # Biome, escribe el formato
pnpm typecheck                    # astro check
pnpm test                         # Vitest + PGlite
pnpm build                        # astro build con @astrojs/vercel
pnpm db:generate                  # genera SQL en drizzle/ tras cambiar src/content/schema.ts
pnpm db:setup                     # migraciones + semilla contra DATABASE_URL; se puede repetir
pnpm content:import <ruta.json>   # sustituye experiencia, habilidades y proyectos
```

- Los tests usan PGlite en memoria con las migraciones de `drizzle/` y no necesitan `DATABASE_URL` ni red.
- `.env.local` (fuera de git) lleva `DATABASE_URL`, la cadena de conexión de Neon, para `db:setup`, `content:import` y `drizzle-kit`. `.env.example` muestra el nombre.
- Plantilla del archivo de contenido: `scripts/portfolio.example.json`.

## Estructura y reglas de dependencia

```
src/
  content/      domain: schemas, repository, published content per language (EN fallback)
  messages/     contact form: validation, honeypot, Turnstile, storage, Resend
  publishing/   deploy hook with debounce, last deployment status
  files/        Blob uploads, CV replacement, orphan cleanup
  auth/         Better Auth, allowlist, /admin middleware
  ui/           public components
  pages/        index, es/index, 404 (prerendered) · admin/**, api/** (on demand)
```

- Las páginas públicas solo dependen de `content/` y solo durante el build. El sitio público nunca llama a funciones ni a la base de datos en tiempo de ejecución.
- `admin/` usa los módulos a través de sus funciones públicas. Ningún módulo importa el interior de otro.

## Convenciones

- **Idioma:** código, identificadores, comentarios y mensajes de commit en **inglés**. Los documentos de `docs/` y `specs/`, en español.
- **Commits:** Conventional Commits.
- **SDD:** toda funcionalidad o cambio de comportamiento pasa por Spec Kit (`desarrollar-con-spec`); `spec.md` se actualiza antes que el código.
- **Secretos:** solo en variables de entorno (`.env.local` y Vercel). Nunca en código, logs ni commits.

## Reglas de costo ($0 sin excepción)

- Solo planes gratuitos permanentes. Antes de añadir un servicio, verifica con su documentación oficial que no pueda generar cobros.
- Nunca inicies la prueba de Vercel Pro: al terminar cobra la analítica recogida durante la prueba.
- Si se agota un límite, el servicio debe bloquear o pausar, nunca cobrar.
- Sin publicidad ni venta de servicios en el sitio (Vercel Hobby es solo para uso no comercial).

## Marca

- Fuente de verdad: `/Users/sharltonrb/Desktop/Cenfo/2026/C3/Portafolio Profesional/docs referencia/identidad-visual/` (fuera del repo, **solo lectura**). Los archivos necesarios (logos, favicon, fuentes) se copian al proyecto (los del diseño, en `docs/diseno/marca/`); nunca se modifican allí.
- Modo claro 60-30-10: naranja `#FF6B35`, negro `#0A0A0A`, cian `#22D3EE`, sobre lienzo `#FAFAFA`.
- Modo oscuro 60-30-10, solo naranja: `#FF6B35`, gris `#D4D4D8`, naranja brasa `#FF9A5C`, sobre `#0A0A0A`.
- El texto sobre naranja siempre es negro. El naranja como texto solo va sobre fondo oscuro. Ningún color fuera de la paleta (ni verde ni rosa).
- Logo y favicon tal cual, sin variantes de color; en modo oscuro se usan las versiones `-dark`.
- Tipografía autoalojada: Handjet 600 para títulos y Space Grotesk 400/500/700 para párrafos, con `font-display: swap`.
- Estilo pixel art / retro gaming: bordes gruesos, sombras duras, fondos de cuadrícula y rombos pixel. Respeta `prefers-reduced-motion`.
- Habilidades sin niveles, barras, porcentajes ni números.
- No inventes contenido de experiencia, habilidades ni proyectos: lo entrega Sharlton.
- La interfaz sigue `docs/diseno.md` cuando exista (fase `/definir-diseno`).
