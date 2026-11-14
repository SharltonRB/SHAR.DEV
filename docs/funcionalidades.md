# Funcionalidades: SHAR.DEV — portafolio profesional

Estado: aceptada · Fecha: 2026-11-13
Orden por dependencias. Cada una se especifica de una en una con `/speckit-specify`; `/estado` dice cuál sigue.
Arquitectura: [decisiones/0002](decisiones/0002-arquitectura-del-portafolio.md) (monolito modular en Astro sobre Vercel, con Neon y Vercel Blob).
Las funcionalidades de backend (1 a 5) van antes de `/contrato` y `/definir-diseno`; las de frontend (6 a 8), después.

| # | Funcionalidad | Qué hace | Alcance | Depende de | Spec | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Contenido y base de datos | Esqueleto del proyecto y CI. Modelo de perfil/About, experiencia, habilidades (por categoría, sin niveles), proyectos y contacto, con textos EN/ES y respaldo en EN si falta el ES. Crear, editar, borrar y ordenar; borrador o publicado en proyectos. Neon con migraciones y semilla con el contenido ya redactado (perfil, misión, visión, valores, contacto). | backend | — | | pendiente |
| 2 | Acceso al panel | Login con GitHub restringido a tu ID numérico, sesión, protección de `/admin` y de las acciones del panel, y pantalla de «acceso denegado». | backend | — | | pendiente |
| 3 | Archivos | Subida directa a Vercel Blob de imágenes de proyectos y del CV en PDF, reemplazo y limpieza de archivos huérfanos. | backend | 1, 2 | | pendiente |
| 4 | Publicación | El build lee Neon y genera el sitio estático. Al guardar, deploy hook con antirrebote; botón «Publicar ahora»; estado del último despliegue. | backend | 1, 2 | | pendiente |
| 5 | Formulario de contacto | Endpoint con honeypot, Turnstile, límite por IP, validación, guardado en Neon y correo a sromerobpersonal@gmail.com con Resend. | backend | 1 | | pendiente |
| 6 | Sitio público | Página única en `/` (EN) y `/es/` (ES): Inicio, About, Experiencia, Habilidades, Proyectos y Contacto. Tema claro/oscuro sin parpadeo, selector de idioma, «Start Mission» (mailto), descarga del CV, interfaz del formulario, SEO (Open Graph, sitemap, hreflang), 404 y analítica. | frontend | 1, 3, 4, 5 | | pendiente |
| 7 | Panel: editores de contenido | Pantallas para editar Inicio/About, experiencia, habilidades, proyectos (orden, borrador, imagen), datos de contacto y CV. | frontend | 1, 2, 3, 4 | | pendiente |
| 8 | Panel: inicio y bandeja | Resumen del panel con el estado de la última publicación y bandeja de mensajes del formulario. | frontend | 2, 4, 5 | | pendiente |
