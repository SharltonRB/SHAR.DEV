# Visión: SHAR.DEV — portafolio profesional

Tipo: fullstack · Plataforma: web (escritorio y móvil, navegadores modernos)
Fecha: 2026-11-13

## Qué es y para quién

Portafolio profesional de Sharlton Romero, Java Backend Engineer en San José, Costa Rica, abierto a roles remotos. Es su carta de presentación ante reclutadores y equipos técnicos, y la base de la Tarea #2 del curso de portafolio profesional.

Resuelve dos problemas:

- Que un reclutador entienda en segundos quién es, qué ha hecho y cómo contactarlo, en inglés o en español.
- Que Sharlton pueda mantener el contenido al día desde un panel de administración, sin tocar código.

Aplica la identidad visual SHAR.DEV, ya definida: estética pixel art / retro gaming, paleta 60-30-10 en modo claro y oscuro, Handjet y Space Grotesk. La fuente de verdad de la marca es la carpeta externa `SharDev - portafolio/identidad-visual/` (solo lectura; los archivos necesarios se copian al proyecto).

## Alcance de la primera versión

**Sitio público (una sola página con anclas)**

- Secciones: Inicio (con bloque About: perfil, misión, visión y valores), Experiencia, Habilidades, Proyectos y Contacto.
- Bilingüe: inglés en `/` (principal) y español en `/es/`. Selector de idioma que recuerda la elección, sin redirección automática por idioma del navegador. Si a un texto le falta la versión en español, se muestra la inglesa.
- Modo claro y oscuro: por defecto sigue `prefers-color-scheme`, con un interruptor que recuerda la elección y sin parpadeo al cargar.
- Botón «Start Mission» (o similar) que abre el cliente de correo del visitante con `mailto:` hacia sromerobpersonal@gmail.com y el asunto ya puesto.
- Botón para descargar el CV en PDF (solo inglés; el archivo lo entrega Sharlton más adelante).
- Formulario de contacto en el footer: nombre, correo, empresa (opcional) y mensaje. Antispam con honeypot, límite por IP y Cloudflare Turnstile. Cada envío llega por correo a sromerobpersonal@gmail.com y queda guardado en la bandeja del panel. Sin respuesta automática al visitante.
- Habilidades agrupadas por categoría, **sin niveles, barras, porcentajes ni números**.
- Experiencia: empresa, puesto, fechas (o «Presente»), ubicación o modalidad, de 3 a 5 logros y tecnologías.
- Proyectos en tarjetas: título, tecnologías, descripción breve, enlace a la demo (opcional), enlace al código en GitHub (opcional), imagen o captura (opcional). Solo se muestran los publicados, en el orden definido en el panel.

**Panel de administración (solo Sharlton)**

- Acceso con «Login con GitHub», restringido a su usuario.
- Edición de Inicio y About: titular, perfil, misión, visión y valores.
- Experiencia, habilidades y proyectos: crear, editar, borrar y ordenar. Los proyectos además tienen estado borrador o publicado.
- Datos de contacto: correo, WhatsApp, LinkedIn y GitHub.
- Subida y reemplazo del CV en PDF.
- Bandeja de mensajes del formulario de contacto.
- Todos los textos tienen dos campos, EN y ES, escritos a mano (sin traducción automática).
- Al guardar, el sitio público se actualiza en un plazo de 1 a 3 minutos.

## Fuera de alcance

- Blog.
- Casos de estudio o página de detalle por proyecto (posible v2).
- Rutas separadas por sección (la v1 es una sola página).
- Traducción automática.
- Dominio propio (se mantiene `*.vercel.app`).
- Respuesta automática por correo al visitante.
- Edición desde el panel del SEO y la imagen Open Graph (quedan en el código).
- Easter eggs interactivos (código Konami, minijuego) y sonido.
- CV en español.
- Varios administradores o roles.

## Usuarios y volumen

- Un único administrador: Sharlton.
- Visitantes: reclutadores y equipos técnicos. Entre decenas y algunos cientos de visitas al mes, con picos al postularse o publicar en LinkedIn.
- Datos: menos de 50 registros de contenido, algunas imágenes de proyectos, un PDF y los mensajes del formulario (pocos al mes).

## Requisitos no funcionales

- **Costo $0 al mes, sin excepción.** Solo planes gratuitos permanentes (Always Free / Hobby). Registrar una tarjeta se acepta si el plan es Always Free, pero en cada servicio hay que verificar que no pueda generar cobros (límites duros, sin pago por uso automático).
- El sitio público no debe depender de que el backend esté despierto: un reclutador no puede esperar el arranque en frío de un servicio gratuito.
- Accesibilidad WCAG 2.2 AA: navegación por teclado, foco visible, contraste según las reglas de la marca y respeto a `prefers-reduced-motion`.
- Lighthouse ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO.
- SEO: título y descripción por idioma, Open Graph con imagen para LinkedIn, `sitemap.xml` y `hreflang`.
- Seguridad: panel accesible solo para el usuario de GitHub autorizado; validación y antispam en el formulario; secretos solo en variables de entorno.
- Fuentes autoalojadas (Handjet 600, Space Grotesk 400/500/700) con `font-display: swap`.
- Reglas de marca: texto sobre naranja siempre negro; naranja como texto solo sobre fondo oscuro; ningún color fuera de la paleta; logo y favicon tal cual, sin variantes de color.

## Integraciones

- **GitHub OAuth**: login del panel.
- **Servicio de correo gratuito** (por ejemplo Resend): envío de los mensajes del formulario a sromerobpersonal@gmail.com.
- **Cloudflare Turnstile**: antispam del formulario.
- **Vercel Web Analytics**: analítica sin cookies.
- **Almacenamiento de archivos**: imágenes de proyectos y CV (servicio por definir).
- No hay una API previa que consumir: el backend se construye en este proyecto.

## Plazo, presupuesto y despliegue

- Plazo: unas 3 semanas, con fecha objetivo **2026-12-04**.
- Presupuesto: $0 al mes.
- Repositorio **público** en la cuenta personal de GitHub de Sharlton.
- Frontend en Vercel, en un proyecto nuevo. Mientras tanto se usa la URL de preview; al lanzar, `shardev-portfolio.vercel.app` (la URL entregada en la tarea) pasa a este proyecto y la página en construcción queda archivada.
- Backend en el hosting gratuito que defina el arquitecto.

## Stack tentativo

| Capa | Tecnología | Obligatoria · preferida · libre |
| --- | --- | --- |
| Frontend público | Por decidir | libre |
| Estilos | Por decidir | libre |
| Panel de administración | Por decidir | libre |
| Backend / API | Por decidir | libre |
| Base de datos | Por decidir | libre |
| Almacenamiento de archivos | Por decidir | libre |
| Autenticación del panel | GitHub OAuth restringido a un usuario | obligatoria |
| Correo del formulario | Resend u otro servicio gratuito | preferida |
| Antispam | Cloudflare Turnstile | preferida |
| Hosting del frontend | Vercel (plan Hobby) | obligatoria |
| Hosting del backend | Cualquiera con plan Always Free | libre |
| Analítica | Vercel Web Analytics | preferida |
| Repositorio | GitHub, cuenta personal | obligatoria |

## Pantallas y flujos (solo nombres)

**Sitio público** (`/` en inglés, `/es/` en español)

- Página única: Inicio (presentación, eslogan, «Start Mission», descarga del CV) → About (perfil, misión, visión, valores) → Experiencia → Habilidades → Proyectos → Contacto, con el formulario en el footer.
- Página 404.

**Panel de administración**

- Login con GitHub (y aviso de acceso denegado para otros usuarios).
- Inicio del panel: resumen y estado de la última publicación.
- Editor de Inicio y About.
- Experiencia: lista ordenable y formulario.
- Habilidades: categorías y tecnologías.
- Proyectos: lista ordenable y formulario (imagen, borrador o publicado).
- Datos de contacto.
- CV: subir o reemplazar el PDF.
- Mensajes: bandeja del formulario.

**Flujos**

- Visitante: cambiar idioma · cambiar tema · descargar el CV · «Start Mission» (mailto) · enviar el formulario (validación → antispam → correo y bandeja).
- Admin: iniciar sesión → editar contenido → guardar → el sitio público se regenera en 1 a 3 minutos · revisar mensajes.
