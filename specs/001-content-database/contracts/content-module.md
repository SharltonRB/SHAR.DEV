# Contrato: módulo `src/content`

Superficie pública que exporta `src/content/index.ts`. Ningún otro módulo importa archivos internos de `src/content/`. No hay endpoints HTTP en esta funcionalidad: las escrituras se exponen en la funcionalidad 7 como Astro Actions protegidas por la 2. El build (funcionalidades 4 y 6) solo usa la lectura publicada.

Las firmas son TypeScript. Los tipos de entrada se infieren de los esquemas Zod del módulo, que también se exportan.

## Conexión

```ts
type Database; // PgDatabase con el esquema; lo cumplen el driver de Neon y el de PGlite
function getDb(): Database;               // perezoso, lee DATABASE_URL; un Pool por proceso
function createDb(url: string): Database; // para scripts que reciben la URL
```

## Tipos comunes

```ts
type Locale = "en" | "es";
type BilingualInput = { en: string; es?: string | null };          // en obligatorio salvo que se indique
type OptionalBilingualInput = { en?: string | null; es?: string | null };
type YearMonth = `${number}-${number}`;                             // "YYYY-MM"
type Id = number;
```

## Lectura

### `getPublishedContent(db, locale: string): Promise<PublishedContent>`

Rechaza con `ContentValidationError` (`field: "locale"`, `code: "unsupported_locale"`) si `locale` no es `en` ni `es`. Cada texto bilingüe llega ya resuelto al idioma, con respaldo al inglés. Las listas llegan ordenadas por `position`, y los proyectos `draft` no aparecen.

```ts
type PublishedContent = {
  locale: Locale;
  profile: {
    name: string; title: string; slogan: string;
    headline: string | null;               // null si no tiene texto en ningún idioma
    summary: string; mission: string; vision: string;
  };
  values: { id: Id; title: string; description: string }[];
  experience: {
    id: Id; company: string; role: string; location: string;
    startMonth: YearMonth;
    endMonth: YearMonth | null;            // null = puesto actual
    endLabel: "Present" | "Presente" | null; // solo en puestos actuales
    achievements: string[]; technologies: string[];
  }[];
  skillCategories: { id: Id; name: string; skills: { id: Id; name: string }[] }[];
  projects: {
    id: Id; title: string; description: string; technologies: string[];
    demoUrl: string | null; codeUrl: string | null;
    image: { url: string; alt: string } | null;
  }[];
  contact: { email: string; whatsapp: string; linkedinUrl: string | null; githubUrl: string | null };
};
```

### `getEditableContent(db): Promise<EditableContent>`

Todo el contenido con los dos idiomas sin resolver, incluidos los borradores y el `status` de cada proyecto, en orden. Lo usa el panel para precargar los formularios (FR-017). La forma replica las entradas de escritura con `id`, `position` y, en proyectos, `status`.

### `getContentLastModified(db): Promise<Date>`

Fecha de la última escritura correcta (FR-023).

## Escritura

Toda escritura:

1. valida la entrada completa (`z.strictObject`) y, si falla, lanza `ContentValidationError` con todos los problemas;
2. abre una transacción, comprueba las reglas que dependen de la base, aplica el cambio y actualiza `content_state.updated_at`;
3. si algo falla, no deja nada aplicado (FR-019).

Los `update*` reemplazan el elemento completo: reciben la misma forma que el `create*` correspondiente. Si el `id` no existe, lanzan `ContentNotFoundError` sin efectos.

| Función | Entrada | Devuelve | Reglas propias |
| --- | --- | --- | --- |
| `updateProfile(db, input)` | `{ name, title, slogan, headline?: OptionalBilingualInput, summary, mission, vision }` | `void` | |
| `createValue(db, input)` | `{ title, description }` | `{ id }` | Máximo 6 (`too_many`) |
| `updateValue(db, id, input)` | igual | `void` | |
| `deleteValue(db, id)` | — | `void` | Mínimo 1 (`too_few`) |
| `reorderValues(db, ids)` | `Id[]` | `void` | Ver «Reordenar» |
| `updateContact(db, input)` | `{ email, whatsapp, linkedinUrl?: string \| null, githubUrl?: string \| null }` | `void` | |
| `createExperience(db, input)` | `{ company, role, startMonth, endMonth?: YearMonth \| null, location, achievements: BilingualInput[], technologies: string[] }` | `{ id }` | Fechas (`invalid_date_range`, `future_date`), 1–5 logros |
| `updateExperience(db, id, input)` | igual | `void` | igual |
| `deleteExperience(db, id)` | — | `void` | |
| `reorderExperience(db, ids)` | `Id[]` | `void` | |
| `createSkillCategory(db, input)` | `{ name }` | `{ id }` | |
| `updateSkillCategory(db, id, input)` | igual | `void` | |
| `deleteSkillCategory(db, id)` | — | `void` | Sin habilidades (`not_empty`) |
| `reorderSkillCategories(db, ids)` | `Id[]` | `void` | |
| `createSkill(db, categoryId, input)` | `{ name: string }` | `{ id }` | Categoría existente; nombre único sin distinguir mayúsculas (`duplicate`) |
| `updateSkill(db, id, input)` | `{ name: string }` | `void` | igual |
| `deleteSkill(db, id)` | — | `void` | |
| `reorderSkills(db, categoryId, ids)` | `Id[]` | `void` | Solo las de esa categoría |
| `createProject(db, input)` | `{ title, description, technologies: string[], demoUrl?, codeUrl?, imageUrl?, imageAlt?: OptionalBilingualInput }` | `{ id }` | Nace `draft` y al final |
| `updateProject(db, id, input)` | igual | `void` | No cambia `status` |
| `setProjectStatus(db, id, status)` | `"draft" \| "published"` | `void` | |
| `deleteProject(db, id)` | — | `void` | |
| `reorderProjects(db, ids)` | `Id[]` | `void` | Incluye borradores |

**Reordenar**: `ids` debe contener exactamente los IDs existentes de esa lista, sin omitidos ni repetidos. Si no, se lanza `ContentValidationError` (`field: "ids"`, `code: "invalid_order"`) y el orden no cambia (FR-018).

## Semilla

### `seedContent(db): Promise<{ applied: boolean }>`

Inserta el contenido aprobado solo si el perfil no existe (`applied: true`). Si ya existe, no cambia nada (`applied: false`). Ver [data-model.md](../data-model.md#semilla-fr-025-fr-026).

## Errores

```ts
class ContentValidationError extends Error {
  issues: { field: string; code: IssueCode; message: string }[];
}
class ContentNotFoundError extends Error {
  entity: "value" | "experience" | "skillCategory" | "skill" | "project";
  id: Id;
}
type IssueCode =
  | "required" | "too_long" | "unknown_field"
  | "invalid_url" | "invalid_email" | "invalid_phone"
  | "invalid_date" | "invalid_date_range" | "future_date"
  | "too_few" | "too_many" | "duplicate" | "not_empty"
  | "invalid_order" | "unsupported_locale";
```

- `field` es la ruta del campo con puntos: `title.en`, `achievements.2.en`, `technologies`, `ids`, `locale`.
- `message` va en inglés y es para registros; la interfaz traduce a partir de `code`.
- Un texto más largo que el límite usa `too_long` e indica el límite en `message`.
