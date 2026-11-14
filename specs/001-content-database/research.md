# Research: Contenido y base de datos

Fase 0 de `/speckit-plan` para [spec.md](spec.md). Fecha: 2026-11-13. Las versiones se tomaron del registro de npm ese día; la regla es fijar la versión exacta más reciente con al menos dos semanas de antigüedad (publicada hasta el 2026-10-30).

## 1. Versiones del stack

**Decision**: fijar estas versiones exactas.

| Paquete | Versión | Publicada | Nota |
| --- | --- | --- | --- |
| Node.js | 24.x (LTS) | — | Engine `>=24`; Astro 7.4 pide `>=22.23.4`. |
| pnpm | 11.28.10 | 2026-10-30 | La 12.x salió hace menos de dos semanas. Se fija en `packageManager`. |
| astro | 7.4.4 | 2026-10-28 | La última (7.4.12) es de hoy. |
| @astrojs/vercel | 11.0.17 | 2026-10-28 | |
| @astrojs/check | 0.9.12 | 2026-10-21 | Pide `typescript ^5 \|\| ^6`. |
| typescript | 6.0.3 | 2026-04-16 | **No** 7.0.2: `@astrojs/check` no lo admite. |
| drizzle-orm | 0.45.4 | 2026-10-08 | |
| drizzle-kit | 0.31.11 | 2026-09-21 | |
| @neondatabase/serverless | 1.2.0 | 2026-10-01 | La 1.2.1 es de hoy. |
| @electric-sql/pglite | 0.5.13 | 2026-10-28 | Solo desarrollo y tests. |
| zod | 4.6.7 | 2026-10-12 | |
| vitest | 4.1.12 | 2026-10-15 | La 5.x salió hace menos de dos semanas. |
| @biomejs/biome | 2.6.4 | 2026-10-28 | |
| tsx | 4.23.15 | 2026-09-20 | Ejecuta los scripts TypeScript de base de datos. |
| @types/node | 26.6.6 | 2026-10-28 | |

**Rationale**: cumple la regla de `AGENTS.md` y la compatibilidad declarada en los `peerDependencies`.

**Alternatives considered**: TypeScript 7 (rompe `astro check`), Vitest 5 y pnpm 12 (demasiado recientes).

Fuera de esta funcionalidad: Tailwind, Preact, Better Auth, Vercel Blob, Resend, Playwright y Lighthouse CI se instalan en la funcionalidad que los usa (principio V).

## 2. Driver de Neon y transacciones

**Decision**: `drizzle-orm/neon-serverless` con `Pool` de `@neondatabase/serverless` (WebSocket). Aprobado por Sharlton el 2026-11-13 y anotado en la decisión 0002.

**Rationale**:

- Las escrituras necesitan transacciones interactivas. Por ejemplo, crear un valor comprueba que no haya 6, inserta y actualiza la fecha de última modificación (FR-008, FR-019, FR-023), y reordenar valida el conjunto antes de aplicarlo (FR-018).
- La documentación de Drizzle dice que el modo HTTP sirve para consultas sueltas y transacciones **no interactivas** (`batch`), y que el modo WebSocket es el necesario para las interactivas.
- El código del módulo usa `db.transaction(...)`, que funciona igual con el driver de Neon y con el de PGlite, y así los tests ejercitan el mismo código que producción.
- En Node 24 `WebSocket` es global. Si al implementar el driver lo pide, se configura `neonConfig.webSocketConstructor` con el paquete `ws`; se comprueba en la primera tarea de base de datos.

**Alternatives considered**:

- `neon-http` con `db.batch`: la decisión 0002 lo mencionaba. Obliga a escribir cada operación como un lote sin lógica intermedia, y PGlite no tiene `batch`, así que los tests necesitarían una rama real de Neon.
- `pg` (node-postgres) con la URL agrupada de Neon: también funciona, pero añade `pg` y, en funciones de Vercel, `@vercel/functions` para cerrar conexiones ociosas.

## 3. Base de datos para los tests

**Decision**: PGlite en memoria (Postgres compilado a WASM) con `drizzle-orm/pglite`. Cada archivo de test crea su instancia, aplica las migraciones reales de `drizzle/` con el `migrate` de `drizzle-orm/pglite/migrator` y trabaja contra ella.

**Rationale**: es Postgres de verdad, así que valen las restricciones, los índices sobre `lower(name)`, `jsonb` y `text[]`. No necesita Docker ni red, cuesta $0 y corre igual en local y en GitHub Actions. Además prueba FR-024: las migraciones se aplican sobre una base vacía en cada ejecución.

**Alternatives considered**: Testcontainers (exige Docker en local), una rama de Neon por ejecución (gasta CU-h, necesita secretos en CI y falla sin red).

## 4. Forma del módulo `src/content/`

**Decision**: funciones exportadas que reciben `db` como primer argumento, por ejemplo `createProject(db, input)`. `src/content/index.ts` es la única superficie pública; el resto del proyecto no importa archivos internos. El tipo `Database` es el `PgDatabase` común a los dos drivers, con el esquema.

**Rationale**: no hay interfaz ni capa de repositorio con una sola implementación (principio V). Los tests pasan una base PGlite y las Astro Actions de la funcionalidad 7 pasarán `getDb()`.

**Alternatives considered**: una clase de servicio o un patrón repositorio (añaden una capa sin segunda implementación), y las Astro Actions directamente (aún no hay panel ni login; la spec pide que esto solo se use desde tests y la semilla).

## 5. Validación

**Decision**: esquemas Zod 4 de entrada con `z.strictObject`, que rechaza campos desconocidos. Todo se valida antes de abrir la transacción; las reglas que dependen de la base (duplicados, límite de valores, categoría con habilidades, orden) se comprueban dentro de ella. Un fallo lanza `ContentValidationError` con la lista completa de problemas `{ field, code, message }`.

- **Longitudes en caracteres**: se cuentan puntos de código (`[...texto].length`), no unidades UTF-16, para que un emoji cuente como uno.
- **Normalización**: se recortan los espacios de los extremos; un texto en español vacío o solo de espacios se guarda como `null` (FR-002).
- **Límites no listados en FR-021**: nombre, título profesional, empresa, cargo, modalidad o ubicación, nombre de categoría, nombre de habilidad y nombre de tecnología se tratan como «títulos» (80). Quedó recogido en FR-021 tras `/speckit-analyze`.
- **URL**: `https:` y válida para `new URL()` (FR-020). **Correo**: `z.email()`. **WhatsApp**: `^\+\d{8,15}$`.
- **Fechas**: entrada `YYYY-MM`. Se guardan como `date` con día 1. «Futura» es posterior al mes en curso en `America/Costa_Rica`.

**Rationale**: SC-004 pide indicar cada campo y no guardar nada parcial. Con campos estrictos, un nivel o un porcentaje en una habilidad se rechaza explícitamente (escenario 3.6) en lugar de descartarse sin aviso.

**Alternatives considered**: `drizzle-zod` (acopla la validación de entrada a las columnas, y aquí la entrada es bilingüe y anidada), y validar solo con restricciones SQL (no devuelve todos los campos a la vez).

## 6. Errores

**Decision**: dos clases exportadas.

- `ContentValidationError` (`issues: { field, code, message }[]`): entrada inválida y reglas de negocio, incluido el idioma no admitido (`field: "locale"`).
- `ContentNotFoundError` (`entity`, `id`): el elemento no existe; no hay efectos.

Los `code` son estables (por ejemplo `required`, `too_long`, `duplicate`, `not_empty`) para que el panel muestre el texto en su idioma.

**Rationale**: dos casos bastan para la spec y se traducen directamente a `ActionError` en la funcionalidad 7.

## 7. Orden de las listas

**Decision**: columna `position` entera. Un elemento nuevo recibe `max(position) + 1` de su lista. Reordenar recibe la lista completa de IDs, comprueba dentro de la transacción que coincide exactamente con los existentes (sin omitidos, repetidos ni ajenos) y asigna `position = índice`. Borrar no renumera: los huecos no cambian el orden relativo.

**Rationale**: cubre FR-005, FR-018 y el escenario 2.6 con el mínimo de lógica. No hay índice único en `position`, así se evitan las restricciones diferidas.

## 8. Fecha de última modificación

**Decision**: tabla `content_state` con una fila (`id = 1`, `updated_at`). Cada escritura correcta la actualiza en la misma transacción. Se lee con `getContentLastModified(db)`. La semilla la crea.

**Rationale**: FR-023, y la funcionalidad 4 la usa para saber si hay cambios sin publicar.

## 9. Idioma y respaldo

**Decision**: `getPublishedContent(db, locale)` acepta solo `en` y `es`. Para cada texto bilingüe devuelve `es` si existe y no está vacío; si no, `en`. Además del recorte al guardar, la lectura vuelve a comprobarlo por seguridad. En los puestos actuales, `endMonth` es `null` y `endLabel` es `"Present"` o `"Presente"`; el formato de las fechas visibles queda para la funcionalidad 6.

**Rationale**: FR-002, FR-003 y el escenario 3.1, que pide que el contenido muestre «Present» / «Presente».

## 10. Migraciones y semilla

**Decision**:

- `drizzle-kit generate` crea SQL versionado en `drizzle/`, que se sube al repositorio.
- `pnpm db:setup` (`tsx --env-file=.env.local scripts/db-setup.ts`) aplica las migraciones con el migrador de `drizzle-orm/neon-serverless` y después ejecuta `seedContent(db)`. Es el único comando para un entorno nuevo (SC-007).
- `seedContent` corre en una transacción: inserta el perfil con `ON CONFLICT DO NOTHING`. Si el perfil ya existía, no toca nada más. Si es nuevo, inserta los 4 valores, el contacto y `content_state` (FR-026, SC-005).
- Los textos aprobados se copian **literalmente** de `identidad-visual/contenido/perfil-mision-vision-valores.md` a `src/content/seed-data.ts`. Cada valor se parte en título y descripción por la raya «—», sin cambiar mayúsculas (SC-001). El título profesional en español queda vacío y cae al inglés. LinkedIn, GitHub y el titular quedan vacíos.

**Rationale**: la semilla nunca pisa ediciones (escenario 5.2) y no inventa contenido.

**Alternatives considered**: `drizzle-kit push` (no deja historial versionado), y una semilla con `upsert` (sobrescribiría ediciones).

## 11. Esqueleto y CI

**Decision**:

- Proyecto Astro con `@astrojs/vercel`, `output: "static"` por defecto y una página provisional `src/pages/index.astro`, prerenderizada y sin contenido de marca, solo para que el build tenga salida. La reemplaza la funcionalidad 6.
- **Lint y formato**: Biome (un solo paquete). **Tipos**: `astro check`. **Tests**: `vitest run`.
- **GitHub Actions** (`.github/workflows/ci.yml`, en `push` y `pull_request`):
  1. `pnpm install --frozen-lockfile`
  2. `pnpm lint`
  3. `pnpm typecheck`
  4. `pnpm test`
  5. `pnpm build`
  6. Comprobación de desvío del esquema: `pnpm db:generate` y `git diff --exit-code drizzle/`.

  Las acciones (`checkout`, `setup-node`, `pnpm/action-setup`) se fijan a la versión mayor vigente, que se verifica al implementar.
- `.env.example` con `DATABASE_URL=`; `.env.local` está ignorado. CI no necesita secretos.

**Rationale**: gratis en un repositorio público (S22 de la decisión 0002) y con las herramientas mínimas.

**Alternatives considered**: ESLint con Prettier (más paquetes y configuración); en esta funcionalidad casi no hay archivos `.astro`.
