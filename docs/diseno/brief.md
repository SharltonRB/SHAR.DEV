# Brief de diseño: SHAR.DEV, sitio público (entrega 1)

Estado: confirmado por Sharlton · Fecha: 2026-11-24 · Herramienta: Claude Design

Alcance: solo el sitio público de la entrega 1 (2026-11-27). Es una página única en EN (`/`) y ES (`/es/`), más la 404. Tiene modo claro y oscuro, no tiene formulario de contacto y los proyectos van sin imagen. El panel de administración queda fuera.

## Primera impresión

- **Debe transmitir:** creatividad, composición y profesionalidad.
- **No debe transmitir:** sobresaturación, algo infantil ni poco profesional.

## Referencias

- La página en construcción actual, https://shardev-portfolio.vercel.app/ (captura en `marca/referencias/pagina-en-construccion.png`): ventana de terminal, logo, eslogan y barra de progreso pixel.
- Los mockups de la tarea 2 del curso (`marca/referencias/mockup-proporciones.png` y `mockup-proporciones-oscuro.png`):
  - navbar con logo y «Start mission»;
  - hero naranja con etiqueta «JAVA BACKEND ENGINEER», «Hello, I'm Sharlton Romero» y los botones «Start mission» y «CV.pdf»;
  - tarjetas con cabecera naranja;
  - footer con «Game over? Not yet.».
- **De esas referencias no se toma:**
  - las barras de nivel del bloque «Stats», porque la marca prohíbe niveles, barras, porcentajes y números en las habilidades;
  - el cian en modo oscuro (aparece en la página actual), porque el modo oscuro va solo en naranja;
  - los badges con números («LVL 81»).
- Sharlton no tiene referencias externas claras: Claude Design puede proponer dentro de este marco.

## El mundo del producto

Ventana de terminal en pixel art, con toques de 16 y 32 bits. Nada de mundos de juego concretos ni personajes. Las secciones llevan **nombres normales** (Experience, Skills, Projects…), y el guiño de juego queda en detalles: el cursor `_`, la barra de la ventana, la frase del footer y los rombos pixel.

## Uso

- **Dispositivo:** se diseña primero para escritorio, que es donde suelen revisar los reclutadores, pero al entregar el sitio debe ser 100 % responsive y estar pensado también para el celular (el enlace de LinkedIn se abre mucho en el teléfono). Sin scroll horizontal a 320 px.
- **Modo:** sigue `prefers-color-scheme`, con un interruptor que recuerda la elección. El **claro es el principal** y se diseña primero; también hay que diseñar el oscuro.
- **Idioma:** el **inglés es el principal**, con selector a español.

## Densidad y movimiento

- **Densidad:** aire medio, para evitar la sobresaturación.
- **Movimiento:** nivel 3 a 4 de 5, con entradas al hacer scroll, cursor que parpadea, hovers con sombra dura y transiciones con carácter pixel. Todo se desactiva con `prefers-reduced-motion`, y el movimiento no puede competir con la lectura.

## Lo que ya existe (marca cerrada, no se rediseña)

Fuente de verdad: la carpeta `identidad-visual/`, fuera del repo y de solo lectura. Los archivos que necesita el encargo están copiados en `docs/diseno/marca/`.

| Elemento | Valor | Archivo |
| --- | --- | --- |
| Modo claro 60-30-10 | Naranja Pixel `#FF6B35`, Negro Tinta `#0A0A0A`, Cian Cursor `#22D3EE`, sobre lienzo `#FAFAFA` | `paleta/colors.css`, `paleta/paleta-60-30-10.png` |
| Modo oscuro 60-30-10, solo naranja | `#FF6B35`, Gris Niebla `#D4D4D8`, Naranja Brasa `#FF9A5C`, sobre `#0A0A0A` | `paleta/colors-dark.css`, `paleta/paleta-modo-oscuro.png` |
| Tipografía | Handjet 600 para títulos, botones y etiquetas (desde 20 px); Space Grotesk 400/500/700 para párrafos | `tipografia/fuentes.css`, `tipografia/tipografias.png` |
| Logo | Ventana de terminal con la «S», el cursor y un destello; versiones `-dark` en modo oscuro | `logo/*.svg` |
| Favicon | Monograma «S_» | `favicon/favicon.svg` |
| Fondo | Ventana de terminal con cuadrícula y rombos pixel, en versión clara y oscura | `fondos/*.png` |
| Estilo | Bordes gruesos, sombras duras sin desenfoque y rombos pixel | Láminas de `paleta/` |

Reglas de color:

- El texto sobre naranja siempre es negro (6.98:1); el blanco no cumple (2.84:1).
- El naranja como texto solo va sobre fondo oscuro.
- Ningún color fuera de la paleta (ni verde ni rosa).
- Logo y favicon tal cual, sin variantes de color.

## Elemento distintivo

En la **experiencia** y en la **forma de presentar los proyectos**. Claude Design propone cómo, dentro del tono profesional.

## Pantallas

Datos según `docs/api.md`. El contenido llega ya resuelto al idioma, con respaldo al inglés.

### Página única

| Bloque | Qué muestra | Datos |
| --- | --- | --- |
| Navbar | Logo navbar, anclas a las secciones, selector EN/ES, interruptor de tema y «Start Mission» | — |
| Inicio (hero) | Etiqueta con el título profesional, «Hello, I'm Sharlton Romero» / «Hola, soy Sharlton Romero», eslogan, titular (si existe) y los botones «Start Mission» y «Download CV» / «Descargar CV» | `profile.name`, `title`, `slogan`, `headline` (hoy `null`) |
| About | Perfil profesional, misión, visión y 4 valores (título y descripción) | `profile.summary`, `mission`, `vision`, `values` |
| Experiencia | Puestos en el orden del administrador: empresa, cargo, fechas «MMM YYYY – Present», ubicación, de 1 a 5 logros y tecnologías | `experience` |
| Habilidades | Categorías con sus habilidades, **sin niveles, barras ni números**; la forma queda abierta | `skillCategories` |
| Proyectos | Tarjetas con título, descripción, tecnologías, enlace al código y a la demo (cada uno solo si existe), sin imagen | `projects` |
| Contacto | Correo, WhatsApp, LinkedIn y GitHub (los dos últimos solo si existen), «Start Mission» y la frase de cierre | `contact` |
| Footer | Frase de juego, por ejemplo «Game over? Not yet.», y © 2026 Sharlton Romero | — |

### 404

Página de error con el tono de terminal y un enlace de vuelta al inicio, en EN y ES.

### Estados que el diseño debe resolver

El sitio es estático, así que no hay «cargando» ni errores de API. Lo que debe aguantar el diseño:

- **Puesto actual:** «Present» / «Presente» en lugar de la fecha de fin.
- **Proyecto sin demo o sin código:** ese enlace no se muestra. Tucán solo tiene enlace al código.
- **Un solo proyecto publicado**, que es el caso de la entrega 1, y también varios.
- **Listas vacías:** si no hay proyectos o habilidades, la sección se oculta o muestra un mensaje.
- **Peor caso de longitud** (`docs/api.md`): títulos de 80 caracteres, logros de 200 y descripciones de proyecto de 300.
- **Un puesto con un solo logro, y otro con 5.**
- **Textos en español**, que son entre un 15 y un 25 % más largos.

### Contenido real para el diseño

- **Perfil, misión, visión, valores y contacto:** la semilla, con los textos aprobados.
- **Experiencia, habilidades y proyectos:** salen del CV de Sharlton, en el borrador de contenido pendiente de aprobación:
  - **Experiencia:** Emerson (Automation Developer Intern, Oct 2026 – Present) y World Kinect Corporation (Backend Software Engineer, Aug 2022 – Feb 2025).
  - **Habilidades:** 6 categorías con 38 habilidades.
  - **Proyectos:** 1, Tucán · Personal Finance API.

### Textos fijos de la interfaz

- **Hero:** «Hello, I'm Sharlton Romero» / «Hola, soy Sharlton Romero».
- **Botones:** «Start Mission» (abre el correo con `mailto:`) y «Download CV» / «Descargar CV» (PDF solo en inglés).
- **Secciones:** About, Experience, Skills, Projects y Contact / Sobre mí, Experiencia, Habilidades, Proyectos y Contacto.
- **Footer:** «Game over? Not yet.»; la versión en español queda por definir en el encargo.
