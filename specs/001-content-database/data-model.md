# Data Model: Contenido y base de datos

Fase 1 de `/speckit-plan`. Tablas de Postgres (Neon en producción, PGlite en tests) definidas con Drizzle en `src/content/schema.ts`. Los nombres de tablas y columnas van en inglés (`snake_case`).

## Convenciones

- **Texto bilingüe**: un par de columnas `<campo>_en text NOT NULL` y `<campo>_es text NULL`. El español vacío se guarda como `NULL` (research §5). Los campos bilingües opcionales, como el titular, tienen las dos columnas nulas.
- **Lista bilingüe** (logros): `jsonb` con un arreglo de `{ "en": string, "es": string | null }`.
- **Lista sin traducción** (tecnologías): `text[] NOT NULL`.
- **Orden**: `position integer NOT NULL`, de 0 en adelante, sin índice único (research §7).
- **IDs**: `integer GENERATED ALWAYS AS IDENTITY`. Las tablas de registro único usan `id integer PRIMARY KEY CHECK (id = 1)`.
- **Mes**: `date` con día 1; la entrada y la salida son `YYYY-MM`.
- Las longitudes y formatos se validan en Zod (research §5). En SQL solo se fijan los invariantes que protegen la integridad: `NOT NULL`, `CHECK` de rangos, claves foráneas y unicidad.

## Entidades

### `profile`: Perfil (registro único) · FR-007

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK | `CHECK (id = 1)` |
| `name` | text NOT NULL | Sin traducción. Máx. 80. |
| `title_en` / `title_es` | text | Título profesional. EN obligatorio, máx. 80. |
| `slogan_en` / `slogan_es` | text | EN obligatorio, máx. 80. |
| `headline_en` / `headline_es` | text NULL / NULL | **Opcional** en ambos idiomas (Clarifications). Máx. 120. |
| `summary_en` / `summary_es` | text | Perfil profesional. EN obligatorio, máx. 1200. |
| `mission_en` / `mission_es` | text | EN obligatorio, máx. 1200. |
| `vision_en` / `vision_es` | text | EN obligatorio, máx. 1200. |

No se crea ni se borra desde las operaciones; solo la semilla lo inserta y `updateProfile` lo reemplaza.

### `profile_values`: Valor · FR-008

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK identity | |
| `title_en` / `title_es` | text | EN obligatorio, máx. 80. |
| `description_en` / `description_es` | text | EN obligatorio, máx. 200. |
| `position` | integer NOT NULL | |

Invariante: entre 1 y 6 filas. `createValue` rechaza el 7.º y `deleteValue` rechaza borrar el último (`code: too_many` / `too_few`).

### `experience`: Puesto · FR-009, FR-010

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK identity | |
| `company` | text NOT NULL | Sin traducción. Máx. 80. |
| `role_en` / `role_es` | text | Cargo. EN obligatorio, máx. 80. |
| `start_month` | date NOT NULL | No futura. |
| `end_month` | date NULL | `NULL` = puesto actual. `CHECK (end_month IS NULL OR end_month >= start_month)`. No futura. |
| `location_en` / `location_es` | text | Modalidad o ubicación. EN obligatorio, máx. 80. |
| `achievements` | jsonb NOT NULL | De 1 a 5 elementos `{en, es}`; `en` obligatorio, máx. 200 cada uno. |
| `technologies` | text[] NOT NULL | Al menos 1; cada una no vacía, máx. 80. |
| `position` | integer NOT NULL | |

Sin estado borrador: todo puesto se publica (Assumptions).

### `skill_categories`: Categoría de habilidades · FR-011, FR-013

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK identity | |
| `name_en` / `name_es` | text | EN obligatorio, máx. 80. |
| `position` | integer NOT NULL | |

Borrar una categoría con habilidades se rechaza (`code: not_empty`). La FK de `skills` es `ON DELETE RESTRICT` como red de seguridad.

### `skills`: Habilidad · FR-011, FR-012, FR-013

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK identity | |
| `category_id` | integer NOT NULL FK → `skill_categories.id` | `ON DELETE RESTRICT` |
| `name` | text NOT NULL | Sin traducción, máx. 80. |
| `position` | integer NOT NULL | Orden dentro de su categoría. |

- `UNIQUE (category_id, lower(name))` (índice de expresión). El duplicado se detecta antes de insertar y se informa como `field: "name"`, `code: duplicate`.
- **No existe** ninguna columna de nivel, porcentaje ni años (FR-012). La entrada estricta rechaza esos campos (`code: unknown_field`).
- El orden de las habilidades es por categoría, y una habilidad no cambia de categoría (la spec no lo pide).

### `projects`: Proyecto · FR-014, FR-015

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK identity | |
| `title_en` / `title_es` | text | EN obligatorio, máx. 80. |
| `description_en` / `description_es` | text | EN obligatorio, máx. 300. |
| `technologies` | text[] NOT NULL | Al menos 1; cada una no vacía, máx. 80. |
| `demo_url` | text NULL | `https` válida. |
| `code_url` | text NULL | `https` válida. |
| `image_url` | text NULL | `https` válida. La rellena la funcionalidad 3. |
| `image_alt_en` / `image_alt_es` | text NULL | Máx. 150. Obligatorio en EN si hay `image_url`. `CHECK (image_url IS NULL OR image_alt_en IS NOT NULL)`. |
| `status` | text NOT NULL DEFAULT `'draft'` | `CHECK (status IN ('draft', 'published'))` |
| `position` | integer NOT NULL | |

### `contact`: Contacto (registro único) · FR-016

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK | `CHECK (id = 1)` |
| `email` | text NOT NULL | Correo válido. |
| `whatsapp` | text NOT NULL | `^\+\d{8,15}$` (también como `CHECK`). |
| `linkedin_url` | text NULL | `https` válida. |
| `github_url` | text NULL | `https` válida. |

### `content_state`: Estado del contenido (registro único) · FR-023

| Columna | Tipo | Regla |
| --- | --- | --- |
| `id` | integer PK | `CHECK (id = 1)` |
| `updated_at` | timestamptz NOT NULL DEFAULT `now()` | Se actualiza en la misma transacción que cada escritura correcta. |

## Relaciones

```text
profile (1) ── profile_values (1..6)     relación lógica: About = perfil + valores
skill_categories (1) ── skills (0..n)    FK category_id, ON DELETE RESTRICT
experience, projects, contact, content_state: independientes
```

## Transiciones de estado

Proyecto:

```text
(create) ──► draft ◄──► published        setProjectStatus(db, id, status)
                 └──────────► (delete)
```

Un proyecto nuevo siempre nace en `draft` (FR-015). Solo `published` aparece en el contenido publicado (FR-006).

## Semilla (FR-025, FR-026)

| Tabla | Contenido |
| --- | --- |
| `profile` | `name` «Sharlton Romero»; `title_en` «Java Backend Engineer», `title_es` NULL; eslogan «One endpoint at a time.» / «Un endpoint a la vez.»; `headline` NULL/NULL; perfil, misión y visión literales de la fuente. |
| `profile_values` | 4 filas en el orden de la fuente: Autonomy, Technical rigor, Clear communication, Continuous learning, con título y descripción separados por «—». |
| `contact` | `sromerobpersonal@gmail.com`, `+50670429481`, `https://www.linkedin.com/in/sharlton-rb/` y `https://github.com/SharltonRB`. |
| `content_state` | una fila con `now()`. |
| `experience`, `skill_categories`, `skills`, `projects` | vacías. |
