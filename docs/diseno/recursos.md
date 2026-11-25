# Recursos de diseño: SHAR.DEV (sitio público, entrega 1)

Fecha: 2026-11-24 · Basado en: docs/diseno/brief.md

Investigación con 5 consultas web (de 6 permitidas), sin capturas ni descarga de HTML/CSS. Los recursos apoyan lo que Sharlton ya describió (terminal pixel, 16/32 bits, tono profesional y sobrio, aire medio, movimiento 3-4); no proponen una dirección visual. Todo lo no confirmado en la fuente oficial está en «Por verificar».

## Referencias

Sharlton no aportó referencias externas, así que estas son de apoyo, no de imitación. Casi todo lo que sale en búsquedas de «pixel portfolio» es de plantilla infantil o sobresaturado (Press Start 2P, barras de nivel, scanlines pesadas); eso queda fuera por el brief. Solo la primera y la cuarta sirven como tono.

| Sitio | Enlace | Qué tiene en común con el brief |
| --- | --- | --- |
| Fahim Arifen, Pixel Workspace | https://fahimarifen.com/ | Estética pixel con terminal CRT y posicionamiento de ingeniero senior, con alternativas accesibles y manejo responsive. Es el ejemplo que mejor une retro y profesional. Su elemento distintivo es una escena interactiva; en SHAR.DEV el distintivo va en la experiencia y en los proyectos, no en un mundo ilustrado. |
| 8-BitQuest (Astro + Tailwind 4) | https://8-bitquest.domidex01.workers.dev/ | Mismo stack (Astro y Tailwind 4) con proyectos descritos como trabajo de ingeniería real (WebSockets/Redis, migración AWS). Útil para ver cómo se redacta y distribuye un proyecto sin imagen. |
| xsrazy, dev-portfolio-pixel | https://github.com/xsrazy/dev-portfolio-pixel | Paneles con bordes pixel gruesos de 4 px y fuentes pixel; ejemplo de las sombras y bordes duros de la marca. Tiene scanlines y tono arcade que el brief no pide: tomar solo los paneles. |
| Portafolio de Yudnata | https://github.com/yudnata/portfolio-website | Diálogos tipo máquina de escribir en el intro y tarjetas de proyecto con detalle; referencia para el cursor que parpadea y la presentación de proyectos. Su tono es más de juego que el pedido. |
| Página actual de SHAR.DEV | https://shardev-portfolio.vercel.app/ | Ya es la referencia principal del brief (ventana de terminal, logo, barra pixel). Se lista como punto de comparación. |

Aviso: no pude verificar con capturas el aspecto real de estos sitios (sin capturas por presupuesto). Que la aprobación final la haga Sharlton viéndolos.

## Animación

Orden de preferencia para un sitio estático con cero JS innecesario: CSS nativo primero, JS solo cuando el CSS no llegue.

| Librería | Para qué | Licencia | Versión |
| --- | --- | --- | --- |
| CSS nativo: `animation-timeline: view()` / `scroll()` (scroll-driven animations) | Entradas al hacer scroll sin JS, con `@supports` y respaldo a estado final visible | Nativa | n/a (soporte por verificar en caniuse) |
| CSS `@keyframes` + `steps()` | Cursor `_` que parpadea y transiciones con carácter pixel (movimiento «a saltos» con `steps(4)`) | Nativa | n/a |
| CSS `transition` en `box-shadow` / `translate` | Hover con sombra dura (la sombra se acorta y el elemento se desplaza) | Nativa | n/a |
| Astro View Transitions (`<ClientRouter />`) | Cambio entre `/` y `/es/` y a la 404 sin recarga. Desactiva sus animaciones con `prefers-reduced-motion`; las animaciones personalizadas deben protegerse a mano. Añade JS: valorar si compensa para una página única | Parte de Astro (MIT) | La de Astro instalado |
| IntersectionObserver (JS nativo, unas pocas líneas) | Respaldo de las entradas por scroll si `animation-timeline` no llega al soporte deseado | Nativa | n/a |
| [Motion](https://motion.dev) (`animate`, `scroll` en JS vanilla) | Solo si hace falta algo que el CSS no da: secuencias (typewriter con orden), resortes. Con la versión mini de `animate` el peso sería de unos 2-3 KB; la híbrida con `scroll` ronda los 17 KB (cifras de terceros) | MIT | Por verificar (el npm consultado marcaba 14.x) |

Recomendación de peso: empezar con cero librerías. Motion queda como opción si una interacción concreta lo justifica; los 17 KB tocan el objetivo de Lighthouse ≥ 95 solo marginalmente, pero sin necesidad no se añade. No se recomienda GSAP (más peso y licencia propia) ni Lenis (scroll suave, molesta y choca con el aire sobrio).

Criterio de movimiento (duraciones, curvas): skills `animate` y `animation-vocabulary` de Emil Kowalski.

## Componentes

La página es estática y casi sin interacción: el menú móvil, el interruptor de tema y el selector EN/ES se resuelven con HTML, CSS y poco JS propio. Solo si hace falta un patrón complejo, usar una base sin estilo.

| Librería | Para qué | Licencia | Advertencia |
| --- | --- | --- | --- |
| Zag.js (`@zag-js/vanilla` o `@zag-js/preact`) | Lógica accesible sin estilo (menús, diálogos, tabs) con foco y ARIA, funciona sin framework o con Preact; es la base más compatible con Astro + Preact | MIT (según fuente de terceros) | Sin estilo propio, por lo que no hay aspecto «visto». No tiene adaptador oficial para Astro: se usa por vanilla o por Preact. Añade JS; usar solo si el elemento lo exige |
| HTML nativo: `<dialog>`, `<details>`, atributo `popover` | Alternativa sin JS para menú, acordeón y overlays | Nativa | Menos control de animación de salida; suficiente para esta página |
| 8bitcn/ui | Componentes con look 8 bits sobre shadcn/Radix | MIT | Está hecho para React, no para Preact ni Astro puro. Su aspecto de «juego 8 bits» es el más visto en portafolios pixel y tiende a lo infantil y a Press Start 2P: no recomendado como base visual |
| Pixelact UI | Biblioteca pixel sobre shadcn | Por verificar | Mismo problema: React y aspecto muy reconocible |
| NES.css / nes-ui-react | Estilo NES de bordes pixel | MIT (nes-ui-react); NES.css por verificar | Aspecto retro NES muy visto y demasiado juguetón para el tono profesional; usa su propia paleta, que choca con la marca |

Conclusión de apoyo al brief: ninguna colección pixel lista para usar encaja con «sobrio y profesional» ni con una paleta cerrada. Conviene estilizar a mano con los tokens de la marca (bordes gruesos, sombras sin desenfoque) sobre HTML semántico.

## Fuentes

Ya definidas por la marca: Handjet 600 (títulos, botones y etiquetas desde 20 px) y Space Grotesk 400/500/700 (párrafos), ambas OFL, autoalojadas con `font-display: swap`. No se buscaron alternativas.

| Fuente | Por qué encaja | Licencia | Dónde se descarga |
| --- | --- | --- | --- |
| Handjet 600 | Marca cerrada | OFL | Google Fonts; se autoalojan en la funcionalidad 6 (en `docs/diseno/marca/tipografia/` solo están el CSS de referencia y la ficha) |
| Space Grotesk 400/500/700 | Marca cerrada | OFL | Igual que Handjet |

## Por verificar

- Versión actual y peso real de Motion (`animate` mini frente a híbrida con `scroll`), en motion.dev, solo si se decide usarla.
- Soporte de `animation-timeline` (scroll-driven animations) en caniuse/MDN para decidir el respaldo (IntersectionObserver o estado visible por defecto).
- Licencia exacta de Zag.js (README de GitHub sin sección visible; el MIT viene de una fuente de terceros), de Pixelact UI y de NES.css, antes de usarlos.
- Si `<ClientRouter />` de Astro compensa en una página única con dos idiomas; mide el peso de JS frente a la ganancia.
- Revisión visual de las referencias por Sharlton: no se hicieron capturas, así que la descripción sale de los resultados de búsqueda.
- Para los proyectos sin imagen no se encontró un patrón concreto de «tarjeta de proyecto sin captura» en fuentes; queda a la propuesta de Claude Design dentro del encargo.
