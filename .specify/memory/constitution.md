# Constitución de SHAR.DEV

Principios que gobiernan todas las funcionalidades de este proyecto. Mandan sobre las plantillas de Spec Kit. Las especificaciones de cada funcionalidad viven en `specs/`, no aquí.

## Principios

### I. La spec es el contrato (Living spec)

- `spec.md` describe el comportamiento acordado de cada funcionalidad y se mantiene vigente después de entregarla.
- Cuando el comportamiento cambia, se edita primero `spec.md`; después se revisan o regeneran `plan.md` y `tasks.md` y se ejecuta `/speckit-analyze`.
- Si al implementar se descubre que la spec está mal o incompleta, se detiene la tarea y se propone el cambio en la spec; nunca se deja código que la contradiga.
- El código es evidencia para discutir un cambio, no un sustituto de la spec.
- Antes de cerrar una funcionalidad, `/speckit-converge` debe informar `Converged`.

### II. Idioma

- Specs, planes, tareas y documentación se escriben en español, conservando los títulos de las plantillas.
- El código, los nombres y los commits siguen el idioma que ya usa el repositorio.

### III. Fuentes del proyecto

- `AGENTS.md`: comandos, estructura y convenciones. Léelo antes de planificar.
- `docs/vision.md`: qué es el producto y para quién.
- `docs/funcionalidades.md`: lista ordenada de funcionalidades y su estado. Se especifica la siguiente `pendiente` cuyas dependencias estén `hecha`.
- `docs/decisiones/`: decisiones de arquitectura. Las aceptadas no se reabren sin una propuesta explícita.
- `docs/glosario.md`: términos del dominio. Specs, código, tablas y tests usan sus nombres y evitan los de `_Evitar_`.
- `docs/api.md` y `docs/api/openapi.yaml`: contrato de la API. El frontend la consume con el cliente generado desde él; cuando la API cambia, se cambia primero la spec del backend y después se regenera el contrato.
- `docs/diseno.md`: sistema de diseño, si el proyecto tiene interfaz. La interfaz usa solo sus tokens.

### IV. Calidad verificable

- Cada escenario de aceptación (Given/When/Then) y cada requisito funcional (FR) tiene al menos un test que fallaría si no se cumple.
- Una tarea solo se marca como hecha con sus tests, el lint y el build en verde.
- Los tests prueban comportamiento a través de la interfaz pública, no detalles internos.

### V. Simplicidad

- El cambio más pequeño que cumpla la spec. Nada de funcionalidades que la spec no pide.
- No se crea una interfaz o una capa con una sola implementación ni un módulo que solo pasa llamadas.

## Flujo de trabajo

- Orden en un proyecto con backend e interfaz: backend → contrato (`/contrato`) → diseño (`/definir-diseno`) → frontend. Cada spec declara `Alcance: backend | frontend | ambos`.
- Cambio de algo ya decidido: `/cambio`, que actualiza de arriba abajo solo lo afectado.
- Funcionalidad nueva o cambio de comportamiento: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/siguiente` (una tarea a la vez, con tests y revisión) → `/speckit-converge`.
- Bug que no cambia el comportamiento acordado: se corrige sin spec nueva (skill `depurar-error`); si revela un hueco en la spec, se actualiza la spec.
- Refactor sin cambio de comportamiento: no necesita spec; los tests existentes deben seguir en verde.

## Gobierno

- Esta constitución prevalece sobre cualquier otra práctica del proyecto.
- Se modifica con `/speckit-constitution` y con aprobación explícita; cada cambio sube la versión y actualiza la fecha.

**Versión**: 1.0.0 | **Ratificada**: 2026-11-13 | **Última modificación**: 2026-11-13
