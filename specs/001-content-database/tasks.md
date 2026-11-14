---

description: "Lista de tareas de la funcionalidad 001: contenido y base de datos"
---

# Tasks: Contenido y base de datos

**Input**: Design documents from `/specs/001-content-database/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-module.md, quickstart.md

**Tests**: obligatorios por la constitución (principio IV). Cada escenario de aceptación y cada FR tiene al menos un test. Como una tarea solo se marca hecha con tests, lint y build en verde, **cada tarea incluye su implementación y sus tests**: primero se escribe el test, se ve fallar y después se implementa. Los tests usan solo lo que exporta `src/content/index.ts`, sin leer ni escribir tablas directamente. Cada test nombra su escenario o requisito, por ejemplo `US2-4 rejects an order that omits a project` o `FR-021 ...`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Proyecto único en la raíz: `src/`, `tests/`, `scripts/` y `drizzle/` (ver plan.md). Cada tarea que crea funciones públicas añade su export a `src/content/index.ts`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: esqueleto del proyecto con lint, tipos, tests, build y CI.

- [X] T001 Crear `package.json` en la raíz:
  - Campos: `"name": "shar-dev"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@11.28.10"`, `"engines": { "node": ">=24" }`.
  - Scripts: `dev` (`astro dev`), `build` (`astro build`), `preview` (`astro preview`), `lint` (`biome check .`), `format` (`biome format --write .`), `typecheck` (`astro check`), `test` (`vitest run`), `db:generate` (`drizzle-kit generate`), `db:setup` (`tsx --env-file=.env.local scripts/db-setup.ts`).
  - Instalar con `pnpm add -E` estas versiones exactas: `astro@7.4.4`, `@astrojs/vercel@11.0.17`, `drizzle-orm@0.45.4`, `@neondatabase/serverless@1.2.0`, `zod@4.6.7`.
  - Instalar con `pnpm add -D -E`: `typescript@6.0.3`, `@astrojs/check@0.9.12`, `drizzle-kit@0.31.11`, `@electric-sql/pglite@0.5.13`, `vitest@4.1.12`, `@biomejs/biome@2.6.4`, `tsx@4.23.15`, `@types/node@26.6.6`.
  - Subir `pnpm-lock.yaml`. Crear `.env.example` con una sola línea, `DATABASE_URL=`. `.gitignore` ya ignora `.env.*` salvo `.env.example`.
  - Nota: se añadió `pnpm-workspace.yaml` con `allowBuilds: { esbuild: true }` (pnpm 11 falla el install si bloquea su postinstall) y `minimumReleaseAge: 20160`, para que la regla de dos semanas valga también para las dependencias transitivas. `pnpm audit` avisa de fallos en astro 7.4.4 que no aplican hoy; subir astro a la primera versión corregida con dos semanas (7.4.5 las cumple el 2026-11-16) antes de la funcionalidad del panel.
- [X] T002 Configurar Astro:
  - `astro.config.mjs`: `adapter: vercel()` de `@astrojs/vercel`, sin `output` explícito (estático por defecto).
  - `tsconfig.json`: extiende `astro/tsconfigs/strict` e incluye `src`, `tests`, `scripts`, `drizzle.config.ts` y `vitest.config.ts`.
  - `src/pages/index.astro`: página provisional prerenderizada con un `<title>SHAR.DEV</title>` y un párrafo «Coming soon», sin estilos ni contenido de marca (la reemplaza la funcionalidad 6).
  - Comprobar que `pnpm build` y `pnpm typecheck` pasan.
  - Nota: el `include` de `tsconfig.json` también lleva `.astro/types.d.ts`, porque un `include` propio reemplaza el del base, y `astro.config.mjs`, para que `astro check` revise la config.
- [X] T003 [P] Crear `biome.json` con el linter `recommended` y el formateador activos. Ignorar `drizzle/`, `dist/`, `.astro/`, `.vercel/`, `node_modules/` y `pnpm-lock.yaml`. Comprobar que `pnpm lint` pasa.
  - Nota: Biome 2.6.4 pide `rules.preset` en vez de `recommended: true`; sangría de 2 espacios como el resto del repo; `vcs.useIgnoreFile` para respetar `.gitignore`; sin formateo de Markdown; se excluyen también `.specify/`, `.agents/` y `.claude/` (Spec Kit); override para `*.astro` (modo heredado) y `css.parser.tailwindDirectives` para Tailwind 4.
- [ ] T004 [P] Crear `vitest.config.ts` con `environment: "node"`, `include: ["tests/**/*.test.ts"]` y `passWithNoTests: true` (se quita en T010, cuando exista el primer test). Comprobar que `pnpm test` pasa.
- [ ] T005 Crear `.github/workflows/ci.yml`:
  - Disparadores: `push` a `main` y `pull_request`. Runner `ubuntu-latest`, sin secretos.
  - Pasos: checkout, `pnpm/action-setup` (lee `packageManager`), `actions/setup-node` con Node 24 y caché `pnpm`, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.
  - Paso final de desvío del esquema: `pnpm db:generate` y después `git diff --exit-code drizzle/` y `test -z "$(git status --porcelain drizzle/)"`.
  - Fijar cada acción a su versión mayor vigente, verificándola en su repositorio de GitHub al implementar.

**Checkpoint**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` en verde, en local y en GitHub Actions.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema completo, conexión, base de tests y piezas compartidas del módulo.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Definir las 8 tablas en `src/content/schema.ts` exactamente como en `data-model.md`:
  - `profile` y `contact` y `content_state`: `id integer PRIMARY KEY CHECK (id = 1)`.
  - `profile_values`, `experience`, `skill_categories`, `skills`, `projects`: `id integer GENERATED ALWAYS AS IDENTITY` y `position integer NOT NULL`.
  - Textos bilingües como pares `<campo>_en text NOT NULL` / `<campo>_es text NULL`. `headline_en` y `headline_es` nulos los dos. `image_alt_en` e `image_alt_es` nulos.
  - `experience.achievements jsonb NOT NULL`; `experience.technologies` y `projects.technologies` `text[] NOT NULL`; `start_month date NOT NULL`, `end_month date NULL` con `CHECK (end_month IS NULL OR end_month >= start_month)`.
  - `skills.category_id integer NOT NULL` con FK a `skill_categories.id` `ON DELETE RESTRICT`, e índice único de expresión `UNIQUE (category_id, lower(name))`.
  - `projects.status text NOT NULL DEFAULT 'draft'` con `CHECK (status IN ('draft', 'published'))` y `CHECK (image_url IS NULL OR image_alt_en IS NOT NULL)`.
  - `contact.whatsapp` con `CHECK` `^\+\d{8,15}$`; `content_state.updated_at timestamptz NOT NULL DEFAULT now()`.
  - Crear `drizzle.config.ts` (`dialect: "postgresql"`, `schema: "./src/content/schema.ts"`, `out: "./drizzle"`, `dbCredentials.url` desde `process.env.DATABASE_URL`, y carga de `.env.local` con `process.loadEnvFile` solo si el archivo existe). Ejecutar `pnpm db:generate` y subir la migración inicial de `drizzle/`.
- [ ] T007 Crear la conexión y la base de tests:
  - En `src/content/db.ts`: exportar el tipo `Database` (el `PgDatabase` común a los drivers de Neon y PGlite, tipado con el esquema), `createDb(url)` con `Pool` de `@neondatabase/serverless` y `drizzle-orm/neon-serverless`, y `getDb()`, perezoso, con un único `Pool` por proceso, que lanza un error claro si falta `DATABASE_URL`.
  - Comprobar si el driver necesita `neonConfig.webSocketConstructor` en Node 24. Si hace falta, añadir `ws` con versión exacta de al menos dos semanas y anotarlo en research.md §2.
  - Crear `tests/helpers/test-db.ts` con `createTestDb()`: `new PGlite()` en memoria, `drizzle` de `drizzle-orm/pglite` con el esquema y `migrate` de `drizzle-orm/pglite/migrator` sobre `./drizzle`.
  - Exportar `Database`, `createDb` y `getDb` en `src/content/index.ts`. Sin tests propios: FR-024 se prueba en T010 por la interfaz pública.
- [ ] T008 [P] Crear los errores y las piezas de validación:
  - En `src/content/errors.ts`: `ContentValidationError` (`issues: { field, code, message }[]`) y `ContentNotFoundError` (`entity`, `id`), con el tipo `IssueCode` exacto de `contracts/content-module.md`.
  - En `src/content/validation.ts`, esquemas reutilizables Zod 4:
    - texto bilingüe con `en` obligatorio y `es` opcional;
    - texto bilingüe opcional en los dos idiomas;
    - recorte de extremos, y español vacío o solo de espacios → `null`;
    - longitud máxima contada en puntos de código (`[...texto].length`), con `code: "too_long"` y el límite en `message`;
    - URL `https` válida para `new URL()` (`invalid_url`), correo con `z.email()` (`invalid_email`), WhatsApp `^\+\d{8,15}$` (`invalid_phone`);
    - mes `YYYY-MM` (`invalid_date`) y comprobación de mes futuro frente al mes actual en `America/Costa_Rica` (`future_date`);
    - lista de tecnologías con al menos 1, cada una no vacía y de máx. 80.
  - También en `validation.ts`: todos los objetos de entrada con `z.strictObject` (campo desconocido → `unknown_field`) y la función `parseInput(schema, input)`, que convierte todos los problemas de Zod a `{ field: "ruta.con.puntos", code, message }` y lanza `ContentValidationError`.
  - Exportar los errores en `src/content/index.ts`. Sin tests propios: los cubren las historias y T019.
- [ ] T009 [P] Crear las piezas compartidas de idioma, estado y orden:
  - En `src/content/locale.ts`: `Locale`, `SUPPORTED_LOCALES = ["en", "es"]`, `assertLocale(value)`, que lanza `ContentValidationError` con `field: "locale"` y `code: "unsupported_locale"` indicando los idiomas admitidos, y `resolveText(en, es, locale)`, que devuelve `es` solo si `locale === "es"` y `es` no está vacío tras recortar.
  - En `src/content/state.ts`: `touchContentState(tx)`, que pone `updated_at = now()` en la fila 1, y `getContentLastModified(db)`.
  - En `src/content/ordering.ts`:
    - `nextPosition(tx, table, scope?)`, que devuelve `coalesce(max(position), -1) + 1`;
    - `applyReorder(tx, table, ids, scope?)`, que lee los IDs existentes del ámbito, lanza `ContentValidationError` (`field: "ids"`, `code: "invalid_order"`) si `ids` omite, repite o incluye IDs ajenos, y si no, asigna `position = índice`.
  - Exportar `Locale` y `getContentLastModified` en `src/content/index.ts`. Sin tests propios: los cubren las historias.

**Checkpoint**: el módulo tiene esquema, migración inicial, conexión, base de tests, validación, idioma, estado y orden; lint, tipos y build en verde.

---

## Phase 3: User Story 5 - Base de datos lista desde cero (Priority: P1)

**Goal**: un comando crea la estructura y carga los textos aprobados sin duplicar nada al repetirlo.

**Independent Test**: sobre una base vacía, aplicar migraciones y semilla dos veces seguidas y comprobar el contenido resultante.

- [ ] T010 [US5] Crear la semilla:
  - `src/content/seed-data.ts` con los textos copiados **literalmente** de `/Users/sharltonrb/Desktop/Proyectos/Personal/SharDev - portafolio/identidad-visual/contenido/perfil-mision-vision-valores.md` (solo lectura).
    - Perfil profesional, misión y visión EN/ES de las secciones 1, 2 y 3.
    - Los 4 valores de la tabla de la sección 4 en su orden. Cada celda se parte en título y descripción por « — » y se quitan los `**` de negrita de la fuente, sin cambiar mayúsculas ni puntuación. Por ejemplo, título `Autonomy` y descripción `I take ownership from design to production.`.
    - `name` «Sharlton Romero»; `title` EN «Java Backend Engineer» y ES `null`; `slogan` «One endpoint at a time.» / «Un endpoint a la vez.»; `headline` `null`/`null`.
    - Contacto `sromerobpersonal@gmail.com` y `+50670429481`; LinkedIn y GitHub `null`.
  - `src/content/seed.ts` con `seedContent(db): Promise<{ applied: boolean }>`, en una sola transacción:
    1. insertar `profile` con `ON CONFLICT DO NOTHING` y `RETURNING`;
    2. si no devuelve fila, terminar con `{ applied: false }`;
    3. si la devuelve, insertar los 4 valores con `position` 0 a 3, `contact` y `content_state` (los dos con `ON CONFLICT DO NOTHING`) y devolver `{ applied: true }`.
  - `getEditableContent(db)` en `src/content/published.ts`:
    - devuelve todo el contenido con los dos idiomas sin resolver (`{ en, es }`), los borradores y el `status` de cada proyecto, el `id` y la `position`, en orden;
    - sus tipos replican las entradas de escritura de `contracts/content-module.md`.
  - Exportar `seedContent` y `getEditableContent` en `src/content/index.ts`, y quitar `passWithNoTests` de `vitest.config.ts`.
  - Tests en `tests/content/setup.test.ts`, solo por la interfaz pública (`seedContent` y `getEditableContent`):
    - **FR-024**: sobre una base PGlite vacía con las migraciones de `drizzle/` aplicadas, `seedContent` devuelve `applied: true` y `getEditableContent` responde.
    - **US5-1**: perfil, valores y contacto con los textos de `seed-data.ts`, y además la misión EN y el valor 1 ES escritos a mano en el test como control (SC-001).
    - **US5-3**: experiencia, categorías y proyectos vacíos.
    - **SC-005** y **FR-026**: tras dos ejecuciones, `getEditableContent` devuelve lo mismo que tras una sola (1 perfil, 4 valores, 1 contacto), y la segunda devuelve `applied: false`.
    - **US5-2** (no pisar una edición) se prueba en T017, con `updateProfile`.
- [ ] T011 [US5] Crear `scripts/db-setup.ts`:
  1. leer `DATABASE_URL` y salir con un mensaje claro si falta;
  2. `createDb(url)`;
  3. `migrate` de `drizzle-orm/neon-serverless/migrator` con `migrationsFolder: "./drizzle"`;
  4. `seedContent`;
  5. imprimir «Migrations applied» y «Seed applied» o «Seed skipped: content already exists»;
  6. cerrar el `Pool` (`db.$client.end()`) y salir con código distinto de 0 si algo falla.

  Comprobar `pnpm typecheck`. La prueba contra Neon real queda para T022 (SC-007).

**Checkpoint**: `pnpm test` cubre US5 salvo US5-2, que se completa en T017; `pnpm db:setup` está listo para una base real.

---

## Phase 4: User Story 1 - Contenido publicado por idioma (Priority: P1) 🎯 MVP

**Goal**: la generación del sitio obtiene, en una llamada, todo el contenido publicado de `en` o `es` con respaldo al inglés.

**Independent Test**: con la semilla cargada, pedir el contenido en `en` y en `es` y comprobar que llegan todos los bloques, en orden, en el idioma correcto y sin borradores.

- [ ] T012 [US1] Implementar `getPublishedContent(db, locale)` en `src/content/published.ts`:
  - Llamar a `assertLocale` y después leer todos los bloques en una transacción de solo lectura.
  - Ordenar cada lista por `position` (y las habilidades por `position` dentro de su categoría), filtrar proyectos con `status = 'published'` y resolver cada texto con `resolveText`.
  - Formato de salida:
    - meses como `YYYY-MM`;
    - `endLabel` `"Present"` (en) o `"Presente"` (es) solo si `end_month` es `NULL`;
    - `headline` `null` si no tiene texto;
    - `image` `null` si `image_url` es `NULL`;
    - forma exacta de `PublishedContent` según `contracts/content-module.md`.
  - Exportar la función y el tipo en `src/content/index.ts`.
  - Tests en `tests/content/published.test.ts`:
    - **US1-1**: con la semilla, en `en` llegan el perfil, la misión, la visión, los 4 valores y el contacto.
    - **US1-2**: en `es` llegan en español, y `profile.title` llega en inglés (FR-002).
    - **US1-5**: `"fr"` se rechaza con `unsupported_locale` y el mensaje nombra `en` y `es` (FR-003).
    - **US1-6**: `experience`, `skillCategories` y `projects` llegan como `[]` y el resto completo (FR-004).
    - `headline` es `null` con la semilla.

**Checkpoint**: MVP. El build de las funcionalidades 4 y 6 ya puede leer el contenido sembrado.

---

## Phase 5: User Story 2 - Gestionar proyectos (Priority: P1)

**Goal**: crear, editar, publicar, reordenar y borrar proyectos.

**Independent Test**: crear, editar, reordenar, publicar y borrar proyectos mediante las operaciones de contenido y verificar el resultado en el contenido publicado.

- [ ] T013 [US2] Implementar en `src/content/projects.ts` `createProject`, `updateProject`, `setProjectStatus`, `deleteProject` y `reorderProjects`, con las firmas de `contracts/content-module.md`:
  - **Entrada**: `title` bilingüe con «EN obligatorio, máx. 80»; `description` bilingüe con «EN obligatorio, máx. 300»; `technologies` «Al menos 1; cada una no vacía, máx. 80»; `demoUrl`, `codeUrl` e `imageUrl` opcionales, «`https` válida»; `imageAlt` bilingüe opcional con «Máx. 150. Obligatorio en EN si hay `image_url`» (si falta, `field: "imageAlt.en"`, `code: "required"`).
  - **Creación**: siempre `status = 'draft'` y `position = nextPosition`. Actualizar no cambia `status`.
  - **Escritura**: en una transacción con `touchContentState`. `ContentNotFoundError` (`entity: "project"`) si el `id` no existe. `reorderProjects` incluye los borradores.
  - Exportar en `src/content/index.ts`.
  - Tests en `tests/content/projects.test.ts`:
    - **US2-1**: nace en borrador y al final.
    - **US2-2**: al publicarlo aparece en `en` y `es`.
    - **US2-3**: un nuevo orden con los tres se aplica.
    - **US2-4**: un orden que omite, repite o incluye un ID inexistente se rechaza y el orden no cambia.
    - **US2-5**: un enlace `http://` o inválido se rechaza indicando el campo.
    - **US2-6**: al borrar, los demás conservan su orden relativo.
    - **US2-7**: sin `title.en`, sin `description.en` o sin tecnologías se rechaza indicando los tres campos.
    - Una imagen sin texto alternativo en inglés se rechaza (FR-014).
    - Un proyecto sin demo ni código es válido y llega con `demoUrl` y `codeUrl` en `null`.
    - Editar o borrar un ID inexistente da `ContentNotFoundError` sin efectos.
    - **FR-023**: `getContentLastModified` avanza tras una escritura correcta y no cambia tras una rechazada.
- [ ] T014 [US2] Probar los proyectos en las dos lecturas, `getPublishedContent` (T012) y `getEditableContent` (T010). Si un test falla, se corrige en `src/content/published.ts`.
  - Tests:
    - En `tests/content/published.test.ts`: **US1-3**, un proyecto publicado solo con texto en inglés aparece en `es` con título y descripción en inglés; **US1-4** y **SC-003**, con dos publicados y un borrador solo aparecen los dos publicados, en el orden definido, en los dos idiomas.
    - En `tests/content/projects.test.ts`: `getEditableContent` devuelve el borrador con su `status` y los dos idiomas.

**Checkpoint**: US1 y US2 completas; los proyectos se gestionan y se publican.

---

## Phase 6: User Story 3 - Gestionar experiencia y habilidades (Priority: P2)

**Goal**: registrar puestos y habilidades agrupadas por categoría, sin niveles ni números.

**Independent Test**: crear puestos y categorías con habilidades, reordenarlos y verificarlos en el contenido publicado.

- [ ] T015 [US3] Implementar en `src/content/experience.ts` `createExperience`, `updateExperience`, `deleteExperience` y `reorderExperience`:
  - **Entrada**: `company` «Sin traducción. Máx. 80»; `role` y `location` bilingües con «EN obligatorio, máx. 80»; `startMonth` `YYYY-MM` «No futura»; `endMonth` `YYYY-MM` o `null`, «`NULL` = puesto actual», «No futura» y no anterior a `startMonth` (`field: "endMonth"`, `code: "invalid_date_range"`); `achievements` «De 1 a 5 elementos `{en, es}`; `en` obligatorio, máx. 200 cada uno» (`too_few` / `too_many`); `technologies` «Al menos 1; cada una no vacía, máx. 80».
  - **Escritura**: posición al final, transacción con `touchContentState` y `ContentNotFoundError` (`entity: "experience"`).
  - Exportar en `src/content/index.ts`.
  - Tests en `tests/content/experience.test.ts`:
    - **US3-1**: puesto sin fecha de fin; en `en` llega `endLabel: "Present"` y `endMonth: null`, y en `es` llega `"Presente"`.
    - **US3-2**: fin anterior al inicio se rechaza.
    - **US3-3**: 0 y 6 logros se rechazan.
    - **FR-010**: un inicio o un fin futuros se rechazan, usando `vi.setSystemTime`.
    - Caso límite: un puesto actual y otro pasado se devuelven en el orden del administrador, no por fecha.
    - Reordenar con un ID ajeno se rechaza.
    - **FR-018**: un puesto nuevo va al final.
- [ ] T016 [US3] Implementar en `src/content/skills.ts` `createSkillCategory`, `updateSkillCategory`, `deleteSkillCategory`, `reorderSkillCategories`, `createSkill(db, categoryId, input)`, `updateSkill`, `deleteSkill` y `reorderSkills(db, categoryId, ids)`:
  - **Entrada**: categoría `name` bilingüe con «EN obligatorio, máx. 80»; habilidad `name` «Sin traducción, máx. 80», sin ningún campo de nivel, porcentaje ni años.
  - **Reglas**:
    - borrar una categoría con habilidades se rechaza con `code: "not_empty"`;
    - un nombre de habilidad repetido sin distinguir mayúsculas en la misma categoría se rechaza con `field: "name"` y `code: "duplicate"`, comprobado dentro de la transacción antes de escribir;
    - `createSkill` con una categoría inexistente lanza `ContentNotFoundError` (`entity: "skillCategory"`);
    - el orden de las habilidades es por categoría (`nextPosition` y `applyReorder` con ámbito `category_id`).
  - Exportar en `src/content/index.ts`.
  - Tests en `tests/content/skills.test.ts`:
    - **US3-4**: el nuevo orden de habilidades dentro de una categoría se publica.
    - **US3-5**: borrar una categoría con habilidades se rechaza, y vacía se borra.
    - **US3-6** y **FR-012**: `createSkill` con `level`, `percentage` o `years` se rechaza con `unknown_field`, no se guarda y no aparece en el contenido publicado.
    - **US3-7**: `"Java"` y `"java"` en la misma categoría se rechazan; en categorías distintas se aceptan.
    - `reorderSkills` con una habilidad de otra categoría se rechaza.
    - Las categorías se publican en orden con sus habilidades (FR-011).
    - **FR-018**: una categoría nueva va al final de las categorías, y una habilidad nueva, al final de su categoría.

**Checkpoint**: US3 completa; experiencia y habilidades se gestionan y se publican.

---

## Phase 7: User Story 4 - Editar perfil, About y contacto (Priority: P2)

**Goal**: cambiar titular, perfil, misión, visión, valores y contacto en los dos idiomas.

**Independent Test**: editar cada campo y verificar el cambio en el contenido publicado del idioma correspondiente.

- [ ] T017 [US4] Implementar en `src/content/profile.ts` `updateProfile`, `createValue`, `updateValue`, `deleteValue` y `reorderValues`:
  - **Perfil** (reemplazo completo): `name` «Sin traducción. Máx. 80»; `title` y `slogan` bilingües con «EN obligatorio, máx. 80»; `headline` «**Opcional** en ambos idiomas. Máx. 120»; `summary`, `mission` y `vision` bilingües con «EN obligatorio, máx. 1200».
  - **Valor**: `title` con «EN obligatorio, máx. 80» y `description` con «EN obligatorio, máx. 200».
  - **Límites**: «entre 1 y 6 filas». `createValue` rechaza el 7.º (`too_many`) y `deleteValue` rechaza borrar el último (`too_few`), los dos comprobados en la transacción.
  - **Escritura**: transacción con `touchContentState`; `ContentNotFoundError` (`entity: "value"`).
  - Exportar en `src/content/index.ts`.
  - Tests en `tests/content/profile.test.ts`:
    - **US4-1**: cambiar solo `summary.es` cambia `es` y deja `en` igual.
    - **US4-2**: un texto obligatorio en inglés vacío se rechaza indicando el campo.
    - **US4-3**: reordenar, añadir y borrar valores se refleja; el 7.º y el borrado del último se rechazan (FR-008).
    - **FR-018**: un valor nuevo va al final.
    - **FR-007**: el titular vacío se acepta y llega `null`; con texto, llega en su idioma.
    - **US5-2** con la operación real: tras `updateProfile`, `seedContent` no pisa la edición.
- [ ] T018 [US4] Implementar `updateContact` en `src/content/contact.ts`:
  - **Entrada**: `email` «Correo válido»; `whatsapp` `^\+\d{8,15}$`; `linkedinUrl` y `githubUrl` opcionales, «`https` válida».
  - Transacción con `touchContentState`.
  - Exportar en `src/content/index.ts`.
  - Tests en `tests/content/profile.test.ts`:
    - **US4-4**: un correo inválido, un WhatsApp sin `+` o con 7 o 16 dígitos, y un enlace `http://` se rechazan indicando cada campo.
    - **FR-016**: LinkedIn y GitHub vacíos se aceptan y llegan `null`; con valor, llegan en el contenido publicado.

**Checkpoint**: las cinco historias completas.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: requisitos transversales, rendimiento, documentación y validación real.

- [ ] T019 Tests transversales en `tests/content/validation.test.ts`, usando las operaciones públicas:
  - **FR-019** y **SC-004**: una entrada con varios campos inválidos devuelve un `issue` por cada uno y no guarda nada.
  - **FR-021**: tabla de casos en el límite y en límite + 1 para titular 120, eslogan 80, títulos 80, descripción de proyecto 300, logro 200, perfil, misión y visión 1200, descripción de valor 200 y texto alternativo 150. Un texto de emojis cuenta un carácter por emoji.
  - **FR-022**: tildes, ñ, comillas, `<script>alert(1)</script>` y emoji se guardan y vuelven idénticos.
  - **FR-002** y **SC-002**: un español de solo espacios en proyecto, valor, puesto y categoría llega en inglés y nunca vacío.
  - **FR-001**: los nombres de tecnologías y habilidades, el correo, el WhatsApp y las URL llegan iguales en `en` y `es`.
  - **FR-023**: cada función de escritura, al terminar bien, avanza `getContentLastModified`; si se rechaza, no lo cambia.

  Si algún test falla por un hueco de la implementación, se corrige en el archivo del módulo afectado.
- [ ] T020 **SC-006**: añadir a `tests/content/published.test.ts` un test que siembra 50 elementos (proyectos, puestos y habilidades) con las operaciones públicas y comprueba que `getPublishedContent` responde en menos de 2 s.
- [ ] T021 [P] Actualizar la sección «Comandos» de `AGENTS.md`:
  - sustituir «Aún no hay código…» por los comandos de `quickstart.md` (`pnpm install`, `dev`, `lint`, `format`, `typecheck`, `test`, `build`, `db:generate`, `db:setup`);
  - añadir la nota de que los tests usan PGlite y no necesitan `DATABASE_URL`;
  - añadir que `.env.local` lleva `DATABASE_URL`.
- [ ] T022 Validar `quickstart.md` de principio a fin:
  - **Escenario A**: todo en verde y sin desvío en `drizzle/`.
  - **Escenario B**: `pnpm db:setup` dos veces contra una rama vacía de Neon Free. **Requiere que Sharlton cree el proyecto de Neon y ponga `DATABASE_URL` en `.env.local`.** Hasta entonces, la tarea queda abierta y se informa.
  - **SC-006** contra Neon: medir `getPublishedContent` con la semilla, incluido el primer acceso tras el arranque en frío del cómputo, y anotar el tiempo en `research.md`.
  - Comprobar en GitHub Actions que el CI pasa en `main`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup y bloquea todas las historias.
- **US5 (Phase 3)**: depende de Foundational.
- **US1 (Phase 4)**: depende de US5, porque sus tests parten de la semilla.
- **US2 (Phase 5)**: depende de US1 (T014 prueba los escenarios US1-3 y US1-4 sobre `getPublishedContent`).
- **US3 (Phase 6)** y **US4 (Phase 7)**: dependen de US1 (verifican por el contenido publicado). Son independientes entre sí y de US2.
- **Polish (Phase 8)**: depende de todas las historias.

### User Story Dependencies

```text
Setup → Foundational → US5 → US1 (MVP) ─┬─► US2
                                        ├─► US3
                                        └─► US4
                                              └─► Polish
```

### Within Each User Story

- Dentro de cada tarea, primero el test (se ve fallar) y después la implementación.
- La validación de entrada y las reglas antes de escribir; la escritura siempre en transacción con `touchContentState`.
- Una tarea se marca `[X]` solo con `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` en verde.

### Parallel Opportunities

- T003 y T004, tras T001 (archivos distintos).
- T008 y T009, tras T006 y T007 (archivos distintos; cada uno añade sus exports a `src/content/index.ts`, solo líneas nuevas).
- T021 en cualquier momento después de la fase 2.
- US2, US3 y US4 pueden avanzar a la vez una vez terminada US1. Comparten solo líneas nuevas de exports en `src/content/index.ts`, por eso sus tareas no llevan `[P]`.

---

## Parallel Example: User Story 3

```bash
# Con US1 terminada, experiencia y habilidades no comparten archivos de módulo ni de test:
Task: "T015 [US3] experience.ts + tests/content/experience.test.ts"
Task: "T016 [US3] skills.ts + tests/content/skills.test.ts"
# Al integrar, unir las líneas de export de src/content/index.ts.
```

---

## Implementation Strategy

### MVP First (US5 + US1)

1. Fase 1: Setup y CI en verde.
2. Fase 2: Foundational.
3. Fase 3: US5 (semilla).
4. Fase 4: US1 (contenido publicado).
5. **STOP and VALIDATE**: con `pnpm db:setup` contra Neon, el sitio de la funcionalidad 6 ya tiene perfil, About y contacto que mostrar. Es el paso 1 de la entrega de la decisión 0002.

### Incremental Delivery

1. MVP (US5 + US1).
2. US2 (proyectos): lo que más cambia.
3. US3 (experiencia y habilidades) y US4 (perfil y contacto).
4. Polish: tests transversales, rendimiento, `AGENTS.md` y validación contra Neon.

## Cobertura de requisitos

| Requisito | Tareas |
| --- | --- |
| FR-001, FR-002 | T008, T009, T012, T014, T019 |
| FR-003 | T009, T012 |
| FR-004, FR-005, FR-006 | T012, T013, T014, T015, T016 |
| FR-007, FR-008 | T017 |
| FR-009, FR-010 | T015 |
| FR-011, FR-012, FR-013 | T016 |
| FR-014, FR-015 | T013 |
| FR-016 | T018 |
| FR-017 | T013–T018 |
| FR-018 | T009, T013, T015, T016, T017 |
| FR-019, FR-020, FR-021, FR-022 | T008, T013, T015, T017, T018, T019 |
| FR-023 | T009, T013, T019 |
| FR-024 | T006, T010 |
| FR-025, FR-026 | T010, T017 |
| SC-001 a SC-005 | T010, T012, T014, T019 |
| SC-006 | T020, T022 |
| SC-007 | T011, T022 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Si al implementar algo contradice la spec, se detiene la tarea y se propone el cambio en `spec.md` (principio I).
- Commit tras cada tarea con Conventional Commits en inglés, solo cuando Sharlton lo pida.
- No inventar contenido de experiencia, habilidades ni proyectos: los tests usan datos ficticios evidentes (por ejemplo «Test Project») y la semilla solo trae los textos aprobados.
