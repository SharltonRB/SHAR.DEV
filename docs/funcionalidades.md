# Funcionalidades: SHAR.DEV — portafolio profesional

Estado: aceptada · Fecha: 2026-11-13 · Actualizada: 2026-11-23 (entrega por etapas)
Las filas van en orden de ejecución. Cada una se especifica de una en una con `/speckit-specify`; `/estado` dice cuál sigue.
Arquitectura: [decisiones/0002](decisiones/0002-arquitectura-del-portafolio.md) (monolito modular en Astro sobre Vercel, con Neon y Vercel Blob).
Entrega 1 (2026-11-27, solo sitio público estático): la 1, luego `/contrato` y `/definir-diseno`, y la 6. Entrega 2 (sin fecha): de la 2 a la 5 (backend), `/contrato` actualizado, y la 7, la 8 y la 9 (frontend).

| # | Funcionalidad | Qué hace | Alcance | Entrega | Depende de | Spec | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Contenido y base de datos | Esqueleto del proyecto y CI. Modelo de perfil/About, experiencia, habilidades (por categoría, sin niveles), proyectos y contacto, con textos EN/ES y respaldo en EN si falta el ES. Crear, editar, borrar y ordenar; borrador o publicado en proyectos. Neon con migraciones y semilla con el contenido ya redactado (perfil, misión, visión, valores, contacto). Script que carga experiencia, habilidades y proyectos desde un archivo que entrega Sharlton. | backend | 1 | — | [specs/001-content-database](../specs/001-content-database/spec.md) | en curso |
| 6 | Sitio público | Página única en `/` (EN) y `/es/` (ES): Inicio, About, Experiencia, Habilidades, Proyectos y Contacto. El build lee Neon y genera el sitio estático. Tema claro/oscuro sin parpadeo, selector de idioma, «Start Mission» (mailto), descarga del CV desde un archivo fijo en `public/`, SEO (Open Graph, sitemap, hreflang), 404 y analítica. Imagen de proyecto solo si existe. Sin formulario (lo añade la 9). | frontend | 1 | 1 | | pendiente |
| 2 | Acceso al panel | Login con GitHub restringido a tu ID numérico, sesión, protección de `/admin` y de las acciones del panel, y pantalla de «acceso denegado». | backend | 2 | — | | pendiente |
| 3 | Archivos | Subida directa a Vercel Blob de imágenes de proyectos y del CV en PDF, reemplazo y limpieza de archivos huérfanos. El CV pasa de `public/` a Blob. | backend | 2 | 1, 2 | | pendiente |
| 4 | Publicación | Al guardar, deploy hook con antirrebote; botón «Publicar ahora»; estado del último despliegue. El build copia y optimiza las imágenes y el CV de Blob. | backend | 2 | 1, 2, 3, 6 | | pendiente |
| 5 | Formulario de contacto | Endpoint con honeypot, Turnstile, límite por IP, validación, guardado en Neon y correo a sromerobpersonal@gmail.com con Resend. | backend | 2 | 1 | | pendiente |
| 7 | Panel: editores de contenido | Pantallas para editar Inicio/About, experiencia, habilidades, proyectos (orden, borrador, imagen), datos de contacto y CV. | frontend | 2 | 1, 2, 3, 4 | | pendiente |
| 8 | Panel: inicio y bandeja | Resumen del panel con el estado de la última publicación y bandeja de mensajes del formulario. | frontend | 2 | 2, 4, 5 | | pendiente |
| 9 | Formulario en el sitio | Interfaz del formulario de contacto en el footer (EN/ES), con Turnstile y mensajes de envío y de error. | frontend | 2 | 5, 6 | | pendiente |
