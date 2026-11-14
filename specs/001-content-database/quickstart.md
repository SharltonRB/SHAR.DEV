# Quickstart: Contenido y base de datos

Guía para comprobar que la funcionalidad 1 funciona de principio a fin. Las firmas están en [contracts/content-module.md](contracts/content-module.md) y las tablas en [data-model.md](data-model.md).

## Requisitos previos

- Node.js 24.
- pnpm 11.28.10. En esta máquina aún no está instalado: `npm install -g pnpm@11.28.10`. La versión queda fijada en `packageManager` de `package.json`.
- Para los tests: nada más. Usan PGlite en memoria, sin Docker ni red.
- Para una base real: un proyecto de Neon en el plan **Free**, en una región AWS us-east, cercana a `iad1`. Se crea a mano en el panel de Neon, sin tarjeta. Copia la cadena de conexión a `.env.local` como `DATABASE_URL=...`. Ese archivo no se sube al repositorio; `.env.example` muestra el nombre de la variable.

## Comandos

```bash
pnpm install
```

```bash
pnpm lint        # Biome
```

```bash
pnpm typecheck   # astro check
```

```bash
pnpm test        # Vitest + PGlite
```

```bash
pnpm build       # astro build con @astrojs/vercel
```

```bash
pnpm db:generate # genera SQL en drizzle/ tras cambiar src/content/schema.ts
```

```bash
pnpm db:setup    # migraciones + semilla contra DATABASE_URL (SC-007)
```

Al terminar la funcionalidad, estos comandos se copian a la sección «Comandos» de `AGENTS.md`.

## Escenarios de validación

### A. Todo en verde (CI local)

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` termina sin errores. Además, `pnpm db:generate` seguido de `git diff --exit-code drizzle/` no muestra cambios, es decir, el esquema y las migraciones coinciden. GitHub Actions ejecuta lo mismo en cada push.

### B. Entorno nuevo desde cero (US5, SC-005, SC-007)

1. Con `DATABASE_URL` apuntando a una base vacía (una rama nueva de Neon), ejecuta `pnpm db:setup`. **Esperado:** aplica las migraciones e informa que la semilla se aplicó.
2. Ejecútalo otra vez. **Esperado:** no hay migraciones pendientes y la semilla informa que no se aplicó. El contenido no cambia.

### C. Contenido publicado por idioma (US1, SC-001, SC-002, SC-003)

Lo cubren los tests de integración en `tests/content/`, que aplican la semilla y piden el contenido en `en` y `es`. Para revisar a mano las tablas sembradas en Neon, usa `pnpm exec drizzle-kit studio`, que lee `DATABASE_URL`.

**Esperado:**

- El perfil, la misión, la visión y los 4 valores llegan en español, idénticos a la fuente.
- `profile.title` llega en inglés («Java Backend Engineer»), porque no tiene versión en español.
- `headline` es `null`.
- `experience`, `skillCategories` y `projects` llegan como `[]`.
- Con `'fr'` se rechaza con `unsupported_locale`.

### D. Operaciones de contenido (US2, US3, US4)

Los tests de integración recorren cada escenario de aceptación de la spec. Cada test nombra su escenario, por ejemplo `US2-4 rejects an order that omits a project`. Para comprobarlo:

```bash
pnpm test -- --reporter=verbose
```

**Esperado:** hay un test por escenario de aceptación y por FR, y todos pasan (principio IV).

### E. Rendimiento (SC-006)

Un test siembra 50 elementos de contenido en PGlite y comprueba que `getPublishedContent` responde en menos de 2 segundos.
