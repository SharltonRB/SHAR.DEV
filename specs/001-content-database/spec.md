# Feature Specification: Contenido y base de datos

Alcance: backend

**Feature Branch**: `001-content-database` (sin rama propia; carpeta de la funcionalidad)

**Created**: 2026-11-13

**Status**: Approved (2026-11-13)

**Input**: User description: "Funcionalidad 1 de docs/funcionalidades.md: Contenido y base de datos. Esqueleto del proyecto y CI. Modelo de perfil/About, experiencia, habilidades (por categoría, sin niveles), proyectos y contacto, con textos EN/ES y respaldo en EN si falta el ES. Crear, editar, borrar y ordenar; borrador o publicado en proyectos. Base de datos con migraciones y semilla con el contenido ya redactado (perfil, misión, visión, valores, contacto)."

## Clarifications

### Session 2026-11-13

- Q: La semilla no trae texto para el titular del perfil, ¿es obligatorio? → A: El titular es opcional hasta que Sharlton lo entregue; la semilla lo deja vacío (FR-007, FR-025).
- Q: (tras `/speckit-analyze`) ¿Qué límite tienen los textos cortos que FR-021 no listaba, y es obligatorio el texto alternativo de la imagen? → A: 80 caracteres, como los títulos (FR-021); el texto alternativo en inglés es obligatorio si hay imagen (FR-014). Un campo desconocido, como un nivel de habilidad, rechaza la escritura (US3-6).
- Q: (al implementar T009) ¿Se acepta un titular o un texto alternativo solo en español? → A: No. Un texto opcional puede quedar vacío en los dos idiomas, pero si tiene español, el inglés es obligatorio (FR-001, FR-007).

## User Scenarios & Testing *(mandatory)*

Actores:

- **Administrador**: Sharlton, único usuario que modifica el contenido. En esta funcionalidad se definen las operaciones de contenido; la protección con login llega en la funcionalidad 2 y las pantallas del panel en la 7.
- **Generación del sitio**: el proceso que construye el sitio público y pide el contenido publicado de cada idioma (lo construye la funcionalidad 6 y lo dispara la 4).

### User Story 1 - Contenido publicado por idioma (Priority: P1)

La generación del sitio pide el contenido publicado de un idioma (inglés o español) y recibe, en una sola respuesta, todo lo que el sitio público necesita: perfil y About, experiencia, habilidades por categoría, proyectos publicados y datos de contacto, cada lista en su orden. Si a un texto le falta la versión en español, recibe la inglesa.

**Why this priority**: Es lo que hace existir el sitio público. Sin esto no hay nada que mostrar a un reclutador.

**Independent Test**: Con la semilla cargada, pedir el contenido en `en` y en `es` y comprobar que llegan todos los bloques, en orden, en el idioma correcto y sin borradores.

**Acceptance Scenarios**:

1. **Given** la semilla cargada, **When** se pide el contenido publicado en `en`, **Then** se recibe el perfil, la misión, la visión y los 4 valores en inglés, y los datos de contacto.
2. **Given** la semilla cargada, **When** se pide el contenido publicado en `es`, **Then** los mismos bloques llegan en español.
3. **Given** un proyecto cuyo título y descripción solo tienen versión en inglés, **When** se pide el contenido en `es`, **Then** el proyecto aparece con el título y la descripción en inglés.
4. **Given** dos proyectos publicados y uno en borrador, **When** se pide el contenido en cualquier idioma, **Then** solo aparecen los dos publicados, en el orden definido.
5. **Given** un idioma distinto de `en` o `es`, **When** se pide el contenido, **Then** la petición se rechaza indicando los idiomas admitidos.
6. **Given** que aún no hay experiencia, habilidades ni proyectos, **When** se pide el contenido, **Then** esas listas llegan vacías y el resto del contenido llega completo.

---

### User Story 2 - Gestionar proyectos (Priority: P1)

El administrador crea un proyecto con título, tecnologías, descripción breve, enlace a la demo y enlace al código, lo deja en borrador mientras lo prepara, lo publica, lo edita, cambia su posición respecto a los demás y lo borra.

**Why this priority**: Los proyectos son lo que más cambia y lo primero que el usuario pidió poder agregar sin tocar código.

**Independent Test**: Crear, editar, reordenar, publicar y borrar proyectos mediante las operaciones de contenido y verificar el resultado en el contenido publicado.

**Acceptance Scenarios**:

1. **Given** ningún proyecto, **When** el administrador crea uno con título en inglés, descripción en inglés y al menos una tecnología, **Then** queda guardado como borrador y al final del orden.
2. **Given** un proyecto en borrador, **When** el administrador lo marca como publicado, **Then** aparece en el contenido publicado de ambos idiomas.
3. **Given** tres proyectos, **When** el administrador envía un nuevo orden con los tres, **Then** el contenido publicado los devuelve en ese orden.
4. **Given** un nuevo orden que omite o repite un proyecto, o incluye uno inexistente, **When** se envía, **Then** se rechaza y el orden anterior no cambia.
5. **Given** un enlace de demo o de código que no es una URL `https` válida, **When** el administrador guarda, **Then** se rechaza indicando el campo.
6. **Given** un proyecto, **When** el administrador lo borra, **Then** deja de existir y los demás conservan su orden relativo.
7. **Given** un proyecto sin título en inglés, sin descripción en inglés o sin tecnologías, **When** se guarda, **Then** se rechaza indicando los campos que faltan.

---

### User Story 3 - Gestionar experiencia y habilidades (Priority: P2)

El administrador registra sus puestos de trabajo y agrupa sus habilidades por categoría, sin niveles ni números, y puede editarlos, ordenarlos y borrarlos.

**Why this priority**: Es contenido central del portafolio, pero cambia poco una vez cargado.

**Independent Test**: Crear puestos y categorías con habilidades, reordenarlos y verificarlos en el contenido publicado.

**Acceptance Scenarios**:

1. **Given** ningún puesto, **When** el administrador crea uno con empresa, cargo, fecha de inicio, sin fecha de fin, modalidad o ubicación, logros y tecnologías, **Then** queda guardado como puesto actual y el contenido lo muestra como «Present» / «Presente».
2. **Given** un puesto con fecha de fin anterior a la de inicio, **When** se guarda, **Then** se rechaza indicando el error en las fechas.
3. **Given** un puesto con más de 5 logros o sin ninguno, **When** se guarda, **Then** se rechaza.
4. **Given** una categoría con habilidades, **When** el administrador cambia el orden de las habilidades dentro de ella, **Then** el contenido publicado las devuelve en ese orden.
5. **Given** una categoría que todavía tiene habilidades, **When** el administrador intenta borrarla, **Then** se rechaza indicando que primero debe vaciarla.
6. **Given** una habilidad, **When** se intenta guardar con un nivel, porcentaje o número de experiencia, **Then** la escritura se rechaza indicando el campo desconocido; ese dato no existe en el modelo y nada se guarda ni se publica.
7. **Given** una habilidad duplicada (mismo nombre, sin distinguir mayúsculas) dentro de la misma categoría, **When** se guarda, **Then** se rechaza.

---

### User Story 4 - Editar perfil, About y contacto (Priority: P2)

El administrador cambia el titular, el perfil, la misión, la visión, los valores y los datos de contacto, en inglés y en español.

**Why this priority**: Hoy ya están redactados y llegan con la semilla; editarlos es necesario pero menos frecuente.

**Independent Test**: Editar cada campo y verificar el cambio en el contenido publicado del idioma correspondiente.

**Acceptance Scenarios**:

1. **Given** el perfil sembrado, **When** el administrador cambia solo el texto en español del perfil, **Then** el contenido en `es` muestra el nuevo texto y el de `en` no cambia.
2. **Given** el perfil, **When** el administrador deja vacío un texto obligatorio en inglés, **Then** se rechaza indicando el campo.
3. **Given** los 4 valores, **When** el administrador cambia su orden, añade uno o borra uno, **Then** el contenido refleja el cambio, siempre con entre 1 y 6 valores.
4. **Given** los datos de contacto, **When** el correo no es válido, el WhatsApp no está en formato internacional (`+` y dígitos) o un enlace no es `https`, **Then** se rechaza indicando el campo.

---

### User Story 5 - Base de datos lista desde cero (Priority: P1)

Al preparar un entorno nuevo (desarrollo, pruebas o producción), la estructura de datos se crea con migraciones versionadas y la semilla carga el contenido ya redactado, sin duplicar nada si se ejecuta otra vez.

**Why this priority**: Sin esto no hay contenido inicial ni forma reproducible de crear entornos.

**Independent Test**: Sobre una base vacía, aplicar migraciones y semilla dos veces seguidas y comprobar el contenido resultante.

**Acceptance Scenarios**:

1. **Given** una base vacía, **When** se aplican las migraciones y la semilla, **Then** existen el perfil, la misión, la visión y los 4 valores en EN y ES con los textos aprobados, y los datos de contacto (correo y WhatsApp).
2. **Given** la semilla ya aplicada y el perfil editado por el administrador, **When** se vuelve a ejecutar la semilla, **Then** no se duplica nada ni se pisa la edición.
3. **Given** la semilla, **When** termina, **Then** experiencia, habilidades y proyectos quedan vacíos (ese contenido lo carga la historia 6).

---

### User Story 6 - Cargar contenido desde un archivo (Priority: P1)

Mientras no exista el panel (entrega 1, 2026-11-27), Sharlton escribe su experiencia, sus habilidades y sus proyectos en un archivo local y los carga con un comando. Para cambiar algo, edita el archivo y lo vuelve a cargar.

**Why this priority**: Sin esto, las secciones Experiencia, Habilidades y Proyectos del sitio de la entrega 1 salen vacías.

**Independent Test**: Sobre una base con la semilla, cargar un archivo de ejemplo, editarlo, volver a cargarlo y comprobar el contenido resultante.

**Acceptance Scenarios**:

1. **Given** la semilla aplicada y un archivo válido con 2 puestos, 2 categorías con habilidades y 3 proyectos, **When** se carga, **Then** el contenido contiene exactamente esos elementos, en el orden del archivo y con el estado de cada proyecto indicado en él.
2. **Given** un archivo ya cargado, **When** se quita un proyecto del archivo, se cambia un logro y se vuelve a cargar, **Then** el contenido refleja el archivo nuevo, sin duplicados ni restos del anterior.
3. **Given** un archivo con un puesto sin tecnologías y un proyecto con un enlace que no es `https`, **When** se carga, **Then** se rechaza indicando cada elemento y campo inválido, y el contenido no cambia.
4. **Given** contenido ya cargado, **When** se carga un archivo, **Then** el perfil, los valores y el contacto no cambian.
5. **Given** un archivo que no existe o no se puede leer, **When** se intenta cargar, **Then** se informa el motivo y el contenido no cambia.

---

### Edge Cases

- Un texto en español que solo contiene espacios se trata como vacío y se usa el inglés.
- Textos que superan la longitud máxima se rechazan con el límite indicado.
- Se edita o borra un elemento que ya no existe: se responde «no encontrado» sin efectos.
- Dos cambios casi simultáneos sobre el mismo elemento: gana el último guardado (un único administrador).
- Un proyecto sin demo ni código: es válido; esos enlaces simplemente no se muestran.
- Un proyecto sin imagen: es válido. La imagen se gestiona en la funcionalidad 3.
- Un puesto actual y otros pasados: el orden lo decide el administrador, no la fecha.
- Contenido con caracteres especiales (tildes, ñ, comillas, `<`, emoji): se guarda y se devuelve íntegro, sin interpretarse como marcado.

## Requirements *(mandatory)*

### Functional Requirements

**Idiomas**

- **FR-001**: Todo texto visible del contenido MUST tener una versión en inglés, obligatoria, y otra en español, opcional. Los nombres de tecnologías y habilidades, el correo, el WhatsApp y las URL no se traducen.
- **FR-002**: Al pedir el contenido en `es`, cada texto sin versión en español (vacío o solo espacios) MUST devolverse en inglés, campo por campo.
- **FR-003**: El sistema MUST admitir solo los idiomas `en` y `es`, y rechazar cualquier otro.

**Contenido publicado**

- **FR-004**: El sistema MUST entregar, por idioma, en una sola llamada: perfil y About, valores, experiencia, categorías con sus habilidades, proyectos publicados y datos de contacto.
- **FR-005**: Cada lista MUST devolverse en el orden definido por el administrador.
- **FR-006**: Los proyectos en borrador MUST NOT aparecer en el contenido publicado.

**Perfil y About**

- **FR-007**: El perfil MUST existir siempre como registro único, con: nombre, título profesional, eslogan, titular, perfil profesional, misión y visión. El titular es opcional (puede quedar vacío en ambos idiomas) hasta que Sharlton entregue su texto, pero si tiene texto en español también MUST tenerlo en inglés (FR-001); los demás textos son obligatorios en inglés.
- **FR-008**: Los valores MUST ser entre 1 y 6, cada uno con título y descripción, y con orden editable.

**Experiencia**

- **FR-009**: Cada puesto MUST tener empresa, cargo, mes y año de inicio, mes y año de fin opcional (vacío significa puesto actual), modalidad o ubicación, entre 1 y 5 logros y al menos una tecnología.
- **FR-010**: El sistema MUST rechazar un puesto cuya fecha de fin sea anterior a la de inicio o cuyas fechas sean futuras.

**Habilidades**

- **FR-011**: Las habilidades MUST pertenecer a una categoría. Categorías y habilidades tienen orden editable.
- **FR-012**: Las habilidades MUST NOT tener nivel, porcentaje, años ni ningún otro dato numérico de dominio.
- **FR-013**: El sistema MUST rechazar el borrado de una categoría que tenga habilidades, y una habilidad con nombre repetido (sin distinguir mayúsculas) dentro de la misma categoría.

**Proyectos**

- **FR-014**: Cada proyecto MUST tener título, descripción breve y al menos una tecnología. Puede tener enlace a la demo, enlace al código y una imagen con texto alternativo, todos opcionales. Si tiene imagen, su texto alternativo en inglés es obligatorio.
- **FR-015**: Cada proyecto MUST estar en estado borrador o publicado; los proyectos nuevos nacen en borrador.

**Contacto**

- **FR-016**: Los datos de contacto MUST existir como registro único con correo y WhatsApp, obligatorios, y enlaces a LinkedIn y GitHub, opcionales.

**Operaciones y validación**

- **FR-017**: El administrador MUST poder crear, editar y borrar experiencia, categorías, habilidades, proyectos y valores, y editar el perfil y el contacto.
- **FR-018**: El reordenamiento MUST recibir la lista completa de elementos y rechazarla, sin aplicar cambios, si omite, repite o incluye elementos inexistentes. Los elementos nuevos se añaden al final.
- **FR-019**: Toda escritura MUST validarse antes de guardarse. Un rechazo MUST indicar cada campo inválido y el motivo, sin guardar nada parcialmente.
- **FR-020**: Los enlaces MUST ser URL `https` válidas; el correo, una dirección válida; el WhatsApp, `+` seguido de 8 a 15 dígitos.
- **FR-021**: Los textos MUST respetar estas longitudes máximas: titular 120, eslogan 80, títulos 80 (también nombre, título profesional, empresa, cargo, modalidad o ubicación, nombre de categoría, de habilidad y de tecnología), descripción de proyecto 300, logro 200, perfil, misión y visión 1200, descripción de valor 200, texto alternativo 150 caracteres.
- **FR-022**: El contenido MUST guardarse y devolverse como texto plano, sin interpretar marcado.
- **FR-023**: Cada operación de escritura correcta MUST dejar constancia de la fecha de la última modificación del contenido, para que la publicación (funcionalidad 4) sepa que hay cambios.

**Datos y entornos**

- **FR-024**: La estructura de datos MUST crearse y evolucionar con migraciones versionadas, aplicables sobre una base vacía.
- **FR-025**: La semilla MUST cargar los textos aprobados de perfil, misión, visión y valores en EN y ES (fuente: `identidad-visual/contenido/perfil-mision-vision-valores.md`), el nombre «Sharlton Romero», el título «Java Backend Engineer», el eslogan «One endpoint at a time.» / «Un endpoint a la vez.» y el contacto sromerobpersonal@gmail.com y +50670429481. El titular queda vacío.
- **FR-026**: La semilla MUST ser idempotente: si el contenido ya existe, no duplica ni sobrescribe nada.

**Carga desde archivo**

- **FR-027**: Un comando MUST cargar experiencia, categorías con sus habilidades y proyectos desde un archivo local, sustituyendo por completo esas tres listas por las del archivo y en su orden. Un proyecto sin estado en el archivo queda en borrador (FR-015). El perfil, los valores y el contacto no se tocan. El archivo MUST traer las tres listas; una lista vacía deja esa sección vacía.
- **FR-028**: La carga MUST aplicar las mismas validaciones que las operaciones de escritura (FR-009 a FR-015 y FR-019 a FR-022) y ser atómica: si algún elemento es inválido, se rechaza todo indicando cada elemento y campo, y no se guarda nada. Una carga correcta deja constancia de la última modificación (FR-023).

### Key Entities *(include if feature involves data)*

- **Texto bilingüe**: par inglés (obligatorio) y español (opcional) que usan todos los textos visibles.
- **Perfil**: registro único. Nombre, título profesional, eslogan, titular, perfil profesional, misión y visión.
- **Valor**: título y descripción bilingües, con posición. Pertenece al About.
- **Puesto (experiencia)**: empresa, cargo, inicio, fin opcional, modalidad o ubicación, logros (1–5, bilingües), tecnologías y posición.
- **Categoría de habilidades**: nombre bilingüe y posición; agrupa habilidades.
- **Habilidad**: nombre (sin traducción) y posición dentro de su categoría. Sin nivel.
- **Proyecto**: título y descripción bilingües, tecnologías, enlace a la demo, enlace al código, imagen con texto alternativo, estado (borrador o publicado) y posición.
- **Contacto**: registro único con correo, WhatsApp, LinkedIn y GitHub.
- **Estado del contenido**: fecha de la última modificación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con la semilla recién aplicada, el contenido en `en` y en `es` reproduce el 100 % de los textos aprobados (perfil, misión, visión y 4 valores) sin diferencias.
- **SC-002**: En el 100 % de los casos probados, un texto sin versión en español se entrega en inglés y nunca vacío.
- **SC-003**: Ningún proyecto en borrador aparece en el contenido publicado (0 apariciones en todas las pruebas).
- **SC-004**: El 100 % de las escrituras inválidas se rechazan, indican cada campo con problema y dejan el contenido sin cambios.
- **SC-005**: Ejecutar la semilla dos veces seguidas deja exactamente el mismo contenido que ejecutarla una vez.
- **SC-006**: Con 50 elementos de contenido, obtener todo el contenido publicado de un idioma tarda menos de 2 segundos.
- **SC-007**: Crear un entorno nuevo con la estructura de datos y el contenido inicial requiere un solo comando documentado.
- **SC-008**: Cargar el mismo archivo dos veces seguidas deja exactamente el mismo contenido que cargarlo una vez, salvo los identificadores internos, que cambian en cada carga.

## Assumptions

- Un único administrador; no hay control de concurrencia más allá de «gana el último guardado».
- Las operaciones de escritura no se exponen en internet hasta que la funcionalidad 2 las proteja con login. Mientras tanto solo se usan desde los tests, la semilla y la carga desde archivo.
- La subida de imágenes y del CV es de la funcionalidad 3. Aquí el proyecto solo guarda la referencia a su imagen y el texto alternativo.
- El esqueleto del proyecto (estructura de módulos, comandos de desarrollo, tests y lint) y la integración continua se montan en esta funcionalidad, según `AGENTS.md` y `docs/decisiones/0002`.
- La experiencia no tiene estado borrador o publicado: todo puesto guardado se publica. Solo los proyectos tienen borrador.
- Los enlaces a LinkedIn y GitHub se dejan vacíos en la semilla salvo que Sharlton los entregue antes de implementar.
- Las fechas de experiencia se guardan con precisión de mes; el formato visible por idioma es cosa del sitio público (funcionalidad 6).
- El contenido de experiencia, habilidades y proyectos no se inventa: lo carga Sharlton, con la carga desde archivo (historia 6) hasta que exista el panel.
- En la entrega 1 los proyectos van sin imagen: no hay subida de archivos hasta la funcionalidad 3.
