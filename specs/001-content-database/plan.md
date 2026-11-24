# Implementation Plan: Contenido y base de datos

**Branch**: `001-content-database` (sin rama propia; se trabaja en `main`) | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-content-database/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Se monta el esqueleto del proyecto (Astro 7 con el adaptador de Vercel, TypeScript, Biome, Vitest y GitHub Actions) y el módulo de dominio `src/content/`:

- esquema de Postgres con Drizzle y migraciones versionadas en `drizzle/`;
- validación de entrada con Zod;
- operaciones de crear, editar, borrar y ordenar para valores, experiencia, categorías, habilidades y proyectos, y de edición para perfil y contacto;
- lectura del contenido publicado por idioma con respaldo al inglés;
- semilla idempotente con los textos aprobados;
- carga desde un archivo JSON local de experiencia, habilidades y proyectos (`importContent` y `pnpm content:import <ruta>`), para la entrega 1 del 2026-11-27, que va sin panel (cambio del 2026-11-23, historia 6).

Producción usa Neon con el driver WebSocket, para tener transacciones interactivas. Los tests corren contra PGlite en memoria con las mismas migraciones. No se expone nada por HTTP: el login llega en la funcionalidad 2 y el panel en la 7.

## Technical Context

**Language/Version**: TypeScript 6.0.3 sobre Node.js 24 (research §1)

**Primary Dependencies**: astro 7.4.4, @astrojs/vercel 11.0.17, drizzle-orm 0.45.4, @neondatabase/serverless 1.2.0, zod 4.6.7. En desarrollo: drizzle-kit 0.31.11, @electric-sql/pglite 0.5.13, vitest 4.1.12, @biomejs/biome 2.6.4, @astrojs/check 0.9.12, tsx 4.23.15 y @types/node 26.6.6. Gestor: pnpm 11.28.10.

**Storage**: Neon Postgres (plan Free) vía `drizzle-orm/neon-serverless` (WebSocket). PGlite en tests.

**Testing**: Vitest. Los tests de integración del módulo usan PGlite en memoria y las migraciones reales.

**Target Platform**: Vercel Hobby (funciones Node en `iad1`) y scripts Node locales (`pnpm db:setup`).

**Project Type**: aplicación web, como monolito modular en Astro. Esta funcionalidad aporta el módulo de dominio, los scripts de base de datos y el esqueleto.

**Performance Goals**: `getPublishedContent` en menos de 2 s con 50 elementos (SC-006).

**Constraints**: costo $0 (Neon Free, GitHub Actions en repo público, sin secretos en CI), textos planos sin interpretar marcado y escrituras atómicas.

**Scale/Scope**: menos de 50 registros de contenido y un administrador. 8 tablas.

Sin `NEEDS CLARIFICATION` pendientes: el titular quedó resuelto en la spec (Clarifications) y el driver con aprobación de Sharlton (research §2).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Comprobación | Antes | Después del diseño |
| --- | --- | --- | --- |
| I. La spec es el contrato | El hueco del titular se resolvió editando primero `spec.md` (FR-007, FR-025, Clarifications). El plan no contradice ningún FR. | ✅ | ✅ |
| II. Idioma | Plan y artefactos en español; tablas, columnas, funciones y códigos de error en inglés. | ✅ | ✅ |
| III. Fuentes del proyecto | Se leyeron `AGENTS.md`, `docs/vision.md`, `docs/funcionalidades.md` y la decisión 0002. El cambio de driver HTTP → WebSocket es un detalle de la capa ya decidida (Neon con Drizzle), propuesto y aprobado de forma explícita y anotado en 0002. No hay `docs/glosario.md`. | ✅ | ✅ |
| IV. Calidad verificable | Cada escenario y cada FR tiene un test de integración por la interfaz pública del módulo; CI ejecuta lint, tipos, tests, build y desvío del esquema. | ✅ | ✅ |
| V. Simplicidad | Sin capa de repositorio ni interfaces con una sola implementación; funciones con `db` inyectado; dos clases de error; las dependencias de funcionalidades futuras no se instalan. | ✅ | ✅ |

Desviaciones a justificar: ninguna (Complexity Tracking vacío).

## Project Structure

### Documentation (this feature)

```text
specs/001-content-database/
├── plan.md              # este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── content-module.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.github/workflows/ci.yml        lint, typecheck, test, build, desvío del esquema
astro.config.mjs                adaptador @astrojs/vercel
biome.json
drizzle.config.ts               dialecto postgresql, schema src/content/schema.ts, out drizzle/;
                                carga .env.local con process.loadEnvFile si existe
drizzle/                        migraciones SQL generadas (versionadas)
package.json                    packageManager pnpm@11.28.10, engines node >=24
tsconfig.json                   extiende astro/tsconfigs/strict
vitest.config.ts
.env.example                    DATABASE_URL=
scripts/
├── db-setup.ts                 migrate (neon-serverless) + seedContent
├── content-import.ts           lee el JSON de la ruta dada y llama a importContent
└── portfolio.example.json      plantilla con datos ficticios evidentes
src/
├── content/
│   ├── index.ts                única superficie pública (contracts/content-module.md)
│   ├── db.ts                   Database, getDb, createDb
│   ├── schema.ts               tablas Drizzle (data-model.md)
│   ├── validation.ts           esquemas Zod, conteo por puntos de código, normalización ES
│   ├── errors.ts               ContentValidationError, ContentNotFoundError
│   ├── locale.ts               Locale, resolución con respaldo EN
│   ├── ordering.ts             siguiente posición y reordenar con validación del conjunto
│   ├── state.ts                touch y lectura de content_state
│   ├── published.ts            getPublishedContent, getEditableContent
│   ├── profile.ts              updateProfile y CRUD de valores
│   ├── contact.ts              updateContact
│   ├── experience.ts
│   ├── skills.ts               categorías y habilidades
│   ├── projects.ts
│   ├── import.ts               importContent (reutiliza los esquemas de experience, skills y projects)
│   ├── seed.ts                 seedContent
│   └── seed-data.ts            textos aprobados, literales de la fuente
└── pages/
    └── index.astro             provisional, prerenderizada; la reemplaza la funcionalidad 6
tests/
├── helpers/
│   └── test-db.ts              PGlite en memoria + migrate de drizzle/
└── content/
    ├── published.test.ts       US1, FR-001..006, SC-001..003, SC-006
    ├── projects.test.ts        US2, FR-014, FR-015, FR-018, FR-020
    ├── experience.test.ts      US3 (puestos), FR-009, FR-010
    ├── skills.test.ts          US3 (habilidades), FR-011..013
    ├── profile.test.ts         US4, FR-007, FR-008, FR-016, FR-021
    ├── validation.test.ts      FR-019, FR-021, FR-022 y casos límite
    ├── setup.test.ts           US5, FR-023..026, SC-005
    └── import.test.ts          US6, FR-027, FR-028, SC-008
└── scripts/
    └── content-import.test.ts  US6-5, lanzando el script en un proceso hijo
```

**Structure Decision**: un solo proyecto Astro en la raíz, con la estructura modular de `AGENTS.md`. Esta funcionalidad crea solo `src/content/` y una página provisional. Los demás módulos (`messages/`, `publishing/`, `files/`, `auth/`, `ui/`) se crean en sus funcionalidades. Los tests van en `tests/` y prueban solo lo que exporta `src/content/index.ts` o, en los scripts, su línea de comandos.

## Orden sugerido de implementación

1. Esqueleto: `package.json`, Astro, TypeScript, Biome, Vitest, página provisional y CI en verde con un test trivial.
2. Esquema, primera migración y helper de PGlite, con un test de que las migraciones se aplican sobre una base vacía (FR-024).
3. Validación, errores, idioma, orden y estado del contenido.
4. Perfil, valores y contacto, y después la semilla y `db:setup` (US4, US5).
5. Proyectos (US2), seguidos de experiencia y habilidades (US3).
6. Lectura publicada y editable (US1), con el test de rendimiento.
7. Carga desde archivo (US6), después de US2, US3 y US4 porque reutiliza sus esquemas.
8. Actualizar la sección «Comandos» de `AGENTS.md` y probar `pnpm db:setup` contra una rama real de Neon.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
