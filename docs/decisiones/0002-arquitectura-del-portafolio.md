# 0002. Construir SHAR.DEV como un monolito modular en Astro desplegado en Vercel, con Neon y Vercel Blob

Estado: aceptada (2026-11-13, opción B) · Fecha: 2026-11-13

> Evaluación independiente hecha solo a partir de `docs/vision.md`. Una evaluación anterior (0001) se descartó por estar sesgada y se eliminó.

## Contexto y problema

SHAR.DEV es el portafolio profesional bilingüe (EN en `/`, ES en `/es/`) de un Java Backend Engineer. Tiene dos partes:

- **Sitio público:** una sola página con anclas, modo claro y oscuro, formulario de contacto con antispam, descarga del CV y metas de Lighthouse ≥ 95 y WCAG 2.2 AA.
- **Panel de administración:** un único usuario con login de GitHub. Permite editar todo el contenido en EN y ES, subir imágenes y el CV, revisar la bandeja de mensajes y ver el estado de la última publicación. Al guardar, el sitio público debe actualizarse en 1 a 3 minutos.

Hay que decidir la forma del sistema y el stack de las capas libres:

- La forma del sistema: estructura, repositorios, despliegue, flujo de publicación y módulos.
- Las capas libres: frontend, estilos, panel, backend, base de datos y almacenamiento.

**Datos extraídos de la visión**

| Dato | Valor |
| --- | --- |
| Usuarios al lanzar | Decenas a algunos cientos de visitas al mes, con picos al postularse. Un administrador. |
| Usuarios en un año | Supuesto: el mismo orden de magnitud. El escenario ×10 da unas 5.000 visitas al mes. |
| Datos | Menos de 50 registros, algunas imágenes, 1 PDF y pocos mensajes al mes. |
| Presupuesto | $0 al mes, sin excepción. Se acepta una tarjeta solo en planes Always Free. |
| Plazo | Unas 3 semanas, con fecha objetivo 2026-12-04 (21 días desde hoy). |
| Equipo | Una persona, Sharlton, con perfil Java backend. **Supuesto:** unas 20 h por semana, unas 60 h en total, y experiencia en TypeScript o frontend moderno de básica a intermedia. |
| Capas obligatorias | Hosting del frontend en Vercel Hobby, GitHub OAuth restringido a un usuario y repositorio en GitHub personal. |
| Capas preferidas | Resend, Cloudflare Turnstile y Vercel Web Analytics. Se mantienen las tres; no hay razones con fuentes para cambiarlas. |
| Restricción clave | El sitio público no puede depender de que un backend esté despierto. |

**Prioridades de calidad, en orden**

1. Costo $0 garantizado, sin posibilidad de cobro.
2. Llegar a tiempo al 2026-12-04.
3. Cubrir el alcance del panel tal como está escrito.
4. Rendimiento y accesibilidad del sitio público.
5. Que lo mantenga una sola persona sin esfuerzo.
6. Escalabilidad. Es la menos importante, porque el volumen es mínimo.

## Factores de decisión

Defino diez criterios y sus pesos a partir de las prioridades anteriores. Suman 100.

| Criterio | Peso | Por qué pesa eso |
| --- | --- | --- |
| Costo mensual y riesgo de cobro | 20 | Es la restricción dura del usuario. Puntúa que cada servicio tenga límites duros verificados, sin tarjeta y sin pago por uso. |
| Tiempo hasta lanzar | 20 | El plazo es corto y fijo, y trabaja una sola persona. |
| Ajuste al alcance de la v1 | 15 | La visión pide bandeja, estado de publicación, ordenar, aviso de acceso denegado y 1 a 3 minutos. Una opción que obligue a recortar alcance pierde aquí. |
| Rendimiento del sitio público | 10 | Lighthouse ≥ 95 y nada de arranques en frío para el reclutador. |
| Mantenibilidad para una persona | 10 | Cuántos lenguajes, despliegues y código propio hay que sostener. |
| Costo inicial | 5 | Todas las opciones parten de $0, así que diferencia poco. |
| Complejidad operativa | 5 | Número de proveedores, paneles y secretos que hay que gestionar. |
| Riesgo y dependencia de proveedor | 5 | Si un plan gratuito cambia o desaparece, cuánto cuesta moverse. |
| Curva de aprendizaje | 5 | Cuánto stack nuevo exige frente a lo que el autor ya domina. |
| Escalabilidad | 5 | Importa poco con este volumen, pero se revisa el escenario ×10. |

## Opciones consideradas

Las tres opciones comparten el sitio público. En las tres es HTML estático generado en build y servido por la CDN de Vercel, porque es la única forma de cumplir la restricción de no depender de un backend despierto y de llegar a Lighthouse ≥ 95 sin esfuerzo extra. **Lo que cambia entre ellas es dónde vive el contenido, qué es el panel y dónde corre el backend.**

### Opción A: contenido en Git con CMS embebido (la más simple que funciona)

- **Estructura:** un repositorio y un proyecto de Vercel. No hay base de datos para el contenido, que vive como archivos JSON o YAML en el repositorio.
- **Stack:**
  - Astro 7 con salida estática y Tailwind CSS 4.
  - Keystatic en modo GitHub como panel en `/keystatic`. Edita los archivos y hace commit en el repositorio.
  - Imágenes y CV dentro del repositorio.
  - Formulario con una función de Vercel (endpoint de Astro), Turnstile y Resend.
  - Para la bandeja hace falta una base pequeña (Neon) y una página propia `/admin/mensajes` protegida con Better Auth y GitHub. Keystatic no ofrece bandeja.
- **Flujo de publicación:** guardar en Keystatic hace un commit en GitHub. Vercel compila por Git y el sitio estático queda actualizado en unos 1 a 2 minutos (estimación).
- **Acceso:** Keystatic deja entrar a cualquier usuario con permiso de escritura en el repositorio (fuente S18). Si solo Sharlton es colaborador, eso equivale a «restringido a su usuario».

### Opción B: monolito modular en Astro sobre Vercel, con base de datos gestionada (recomendada)

- **Estructura:** un repositorio y un proyecto de Vercel. Un solo código en TypeScript con módulos internos.
  - Las páginas públicas se prerenderizan en build.
  - `/admin/**` y `/api/**` se renderizan bajo demanda como funciones de Vercel.
- **Stack:**
  - Astro 7 con `@astrojs/vercel` y Tailwind CSS 4.
  - Panel en Astro SSR con Astro Actions, más islas pequeñas de Preact solo para ordenar listas y subir archivos.
  - Better Auth en modo sin base de datos, con proveedor GitHub y lista de permitidos por ID numérico de GitHub.
  - Neon Postgres Free con Drizzle ORM y Vercel Blob para imágenes y CV.
  - Resend, Turnstile, una regla de rate limit en el WAF de Vercel y Vercel Web Analytics.
- **Flujo de publicación:** guardar en el panel escribe en Neon y dispara un Deploy Hook de Vercel. El build lee Neon, genera `/` y `/es/`, descarga y optimiza las imágenes de Blob y copia el CV. El sitio queda estático en la CDN en unos 1 a 2 minutos (estimación).

### Opción C: frontend estático y API Java separada (monorepo de dos servicios)

- **Estructura:** un monorepo con `web/` (Astro en Vercel: sitio público y panel como páginas cliente) y `api/` (Spring Boot 4.1 con Java 25 y Maven, en contenedor Docker).
  - La API corre en Render Free, sin tarjeta, porque es el único host Java que verifiqué sin riesgo de cobro.
  - La base de datos es Neon.
  - Las imágenes y el CV se guardan en Postgres (`bytea`) y el build los copia al sitio estático. Así se evita un tercer servicio, porque Vercel Blob no tiene SDK para Java.
  - El panel llama a la API mediante un rewrite de Vercel `/api/* → onrender.com`, para mantener la cookie de sesión en el mismo origen.
- **Login:** Spring Security con OAuth2 Login de GitHub y lista de permitidos.
- **Formulario:** tiene que ir a una función de Vercel en TypeScript. Si fuera a Render, el visitante esperaría alrededor de 1 minuto de arranque en frío (S15), lo que incumple la restricción principal. Eso deja dos backends en dos lenguajes.
- **Flujo de publicación:** guardar llega a Spring Boot, que escribe en Neon y llama al Deploy Hook. El build lee Neon y el sitio estático queda actualizado en unos 1 a 3 minutos (estimación).

### Opciones descartadas antes de puntuar

| Opción | Motivo |
| --- | --- |
| Supabase como backend y base de datos | Pausa los proyectos gratuitos tras 1 semana de inactividad (S11). Un portafolio que se edita poco se pausaría. |
| Base de datos gratuita de Render | Caduca a los 30 días y se borra tras 14 días de gracia (S15). |
| Oracle Cloud Always Free para la API Java | Pide tarjeta, que es aceptable porque es Always Free. Pero reclama instancias con CPU, red y memoria por debajo del 20 % durante 7 días (S16), y una API de portafolio está casi siempre ociosa. |
| Koyeb | Desde febrero de 2026 pide tarjeta y empieza en un plan de pago que hay que bajar a mano, según fuentes secundarias de agosto a octubre de 2026 (S17). Lo descarto por el riesgo de cobro. |
| Spring Boot dentro de Vercel (Container Runtime) | Está en beta en todos los planes (S9). La página de Vercel Container Registry lista $0,10 por GB de almacenamiento de imágenes sin indicar una cantidad incluida en Hobby (S9). **No pude verificar que no genere cobros**, así que hoy no cumple el requisito de $0. Conviene revisarlo cuando salga de beta. |
| Next.js 16 en lugar de Astro (variante de B) | Es viable y su `revalidateTag` actualiza en segundos sin consumir despliegues. Pero, en mi juicio, Astro envía menos JavaScript por defecto, lo que facilita Lighthouse ≥ 95 en una página casi sin interactividad, y con Deploy Hook deja el sitio 100 % estático. Si el usuario prefiere React o ya lo domina, es un cambio razonable. |
| CMS SaaS headless (Sanity o similar) | Saca el contenido del repositorio y aun así necesita una base de datos y una página propia para la bandeja. No aporta nada sobre A o B. No verifiqué sus límites porque lo descarté por estructura. |

## Comparación

Puntuación de 1 (peor) a 5 (mejor). El total ponderado se calcula como Σ(puntuación × peso) / 100.

| Criterio (peso) | A: Git + Keystatic | B: Monolito Astro + Neon | C: Astro + API Spring Boot |
| --- | --- | --- | --- |
| Costo mensual y riesgo de cobro (20) | 5 | 5 | 4 |
| Tiempo hasta lanzar (20) | 4 | 3 | 2 |
| Ajuste al alcance de la v1 (15) | 3 | 5 | 4 |
| Rendimiento del sitio público (10) | 5 | 5 | 4 |
| Mantenibilidad para una persona (10) | 4 | 4 | 3 |
| Costo inicial (5) | 5 | 5 | 5 |
| Complejidad operativa (5) | 4 | 4 | 2 |
| Riesgo y dependencia de proveedor (5) | 3 | 3 | 3 |
| Curva de aprendizaje (5) | 4 | 3 | 4 |
| Escalabilidad (5) | 3 | 4 | 4 |
| **Total ponderado** | **4,10** | **4,20** | **3,40** |

**Lectura de la tabla:** A y B están en empate técnico. B gana solo por el ajuste al alcance, y A gana en tiempo. C queda claramente detrás por tiempo y por operación.

### Esfuerzo estimado frente al plazo

Son estimaciones mías, no datos medidos. El sitio público cuesta lo mismo en las tres opciones: unas 20 h para seis secciones, i18n, tema, SEO, accesibilidad y marca.

| | A | B | C |
| --- | --- | --- | --- |
| Sitio público | 20 h | 20 h | 20 h |
| Panel | 6 h de esquemas de Keystatic | 30 h para 9 pantallas con un patrón de formulario común, ordenar, subidas, panel de inicio con estado de deploy y bandeja | 22 h de interfaz |
| Backend y datos | 6 h de bandeja propia con Better Auth y Neon, más 4 h del formulario | 6 h de esquema, seed y flujo de publicación, más 4 h del formulario | 24 h de API Spring, 4 h de proxy y cookies, 3 h de Docker y Render, y 4 h de la función del formulario |
| Tests y despliegue | 6 h | 8 h | 11 h |
| **Total** | **≈ 42 h** | **≈ 68 h** | **≈ 88 h** |
| Frente a las 60 h supuestas | Holgura | Justo; requiere el orden de entrega descrito en Consecuencias | Excede en un 45 % |

### Costo mensual estimado

**Supuestos del cálculo:**

- Lanzamiento: 500 visitas al mes, unos 400 KB por visita sin caché, 10 mensajes al mes y 30 guardados en el panel al mes.
- Escenario ×10: 5.000 visitas, 100 mensajes y 30 guardados.

| Recurso (límite Hobby/Free) | Lanzamiento | ×10 | Fuente del límite |
| --- | --- | --- | --- |
| Vercel Fast Data Transfer (100 GB) | ≈ 0,2 GB | ≈ 2 GB | S1 |
| Vercel CDN Requests (1 M) | ≈ 10 k | ≈ 100 k | S1 |
| Vercel Function Invocations (1 M) | < 1 k | < 5 k | S1 |
| Vercel Active CPU (4 h) | < 5 min | < 30 min | S1 |
| Despliegues (100 al día; Deploy Hook 60 por hora) | ≈ 1 al día | ≈ 1 al día | S1, S3 |
| Web Analytics (50.000 eventos al mes) | ≈ 500 a 1.000 | ≈ 5.000 a 10.000 | S5 |
| Vercel Blob (1 GB; 2.000 operaciones avanzadas; 10 GB de transferencia) | < 20 MB; < 50 operaciones | Igual, porque el público no lee Blob | S4 |
| Neon (100 CU-h por proyecto; 1 GB) | ≈ 1 a 3 CU-h; < 20 MB | ≈ 5 a 10 CU-h | S10 |
| Resend (3.000 al mes; 100 al día) | 10 | 100 | S13 |
| Turnstile | Ilimitado en Free | Ilimitado | S14 |
| WAF rate limit (1 regla; 1 M solicitudes) | < 1 k | < 5 k | S8 |
| **Costo** | **$0** | **$0** | |

Neon se calcula así: cada despertar dura al menos unos 5 minutos a 0,25 CU antes de volver a cero (S10). Con unas 50 activaciones al mes eso son unas 1 a 3 CU-h. En el escenario ×10, la actividad del panel no crece; crecen los mensajes.

En C hay que sumar Render: 750 horas por espacio de trabajo y arranque de alrededor de 1 minuto tras 15 minutos de inactividad (S15). Sigue costando $0 si no se registra tarjeta.

## Pros, contras y trade-offs de cada opción

### Opción A: Git + Keystatic

**Pros**

- Es la opción con menos código propio.
- No hay base de datos para el contenido, y el contenido es texto versionado: cada cambio queda en el historial de Git.
- El contenido es portable porque son archivos.

**Contras**

- La bandeja y el panel de inicio con el estado de la publicación quedan fuera de Keystatic. Hacen falta una página propia y un segundo login (Better Auth), lo que deja dos paneles y dos apps de GitHub (la GitHub App de Keystatic y la OAuth App).
- Keystatic sigue en 0.x: la última versión es la 0.6.9, de 2026-08-26, con 218 issues abiertos al 2026-11-13 (S18, S21). Su ritmo es más lento que el de las alternativas.
- El aviso de «acceso denegado» lo controla Keystatic y no se puede personalizar sin tocar su código.
- Cada guardado es un commit, lo que ensucia el historial.

**Trade-off:** ganas unas 25 h de plazo a cambio de un panel genérico partido en dos y de depender de un CMS pre-1.0.

**Escenarios**

- **Crece ×10:** sin cambios. El contenido sigue siendo pequeño.
- **Cambia el requisito principal** (por ejemplo, la v2 con páginas de detalle por proyecto): sencillo, son más colecciones en Keystatic.
- **Lo mantiene una sola persona:** es la opción más liviana.

**Riesgos y mitigación**

- Keystatic se abandona. Mitigación: el contenido es JSON, así que se puede migrar a otro CMS basado en Git (Sveltia o Decap, ambos activos en noviembre de 2026, S18) sin tocar el sitio.
- Mensajes privados en un repositorio público. Mitigación: los mensajes nunca van al repositorio, solo a Neon.

### Opción B: monolito modular en Astro con Neon y Vercel Blob

**Pros**

- Cubre el alcance completo en un solo panel con diseño propio: bandeja, estado del último deploy mediante la API de Vercel, aviso de acceso denegado con la marca, y ordenar con teclado (WCAG).
- Un lenguaje, un repositorio, un despliegue y un dashboard de hosting.
- El sitio público es 100 % estático y no lee ni Neon ni Blob en tiempo de ejecución, porque todo se copia en el build.
- Todos los servicios están verificados como gratuitos sin tarjeta y con límites duros (S1, S4, S5, S10, S13, S14).

**Contras**

- Hay más código propio: unas 9 pantallas de CRUD.
- El plazo queda justo.
- Hay dependencia de servicios de Vercel (Blob, Deploy Hooks, WAF).
- Si el autor viene solo de Java, TypeScript y Astro son terreno nuevo.

**Trade-off:** ganas un panel que cumple la visión al pie de la letra y una arquitectura con una sola pieza móvil, a cambio de unas 25 h más que A y de menos margen ante imprevistos.

**Escenarios**

- **Crece ×10:** sin cambios. Todos los indicadores quedan por debajo del 10 % de los límites.
- **Cambia el requisito principal** (por ejemplo, páginas de detalle o un blog): se agregan rutas prerenderizadas y tablas. Si se necesitara publicar en segundos, se activa ISR del adaptador de Vercel o se migra a Next.js.
- **Lo mantiene una sola persona:** es razonable. Un solo `pnpm build` y una sola base de datos Postgres estándar.

**Riesgos y mitigación**

- El plazo. Mitigación: entregar en el orden descrito en Consecuencias. El sitio público se lanza con contenido sembrado por script aunque el panel no esté terminado.
- Neon cambia su plan gratuito. Mitigación: es Postgres estándar con Drizzle; `pg_dump` y cambiar de proveedor toma minutos.
- Vercel Blob. Mitigación: son 1 PDF y pocas imágenes; se pueden mover al repositorio si hiciera falta.

### Opción C: Astro más API Spring Boot

**Pros**

- La API está en el terreno de experiencia del autor y es en sí misma una muestra de su perfil (Java 25 y Spring Boot 4) ante reclutadores.
- La API es portable a cualquier host de contenedores.

**Contras**

- Hay dos backends: Spring para el panel y una función TypeScript para el formulario. Son dos lenguajes, dos despliegues y tres proveedores (Vercel, Render y Neon).
- El panel sufre un arranque en frío de alrededor de 1 minuto más el arranque de Spring (S15).
- El panel y la API viven en dominios distintos, lo que obliga a hacer de proxy con rewrites para no pelear con cookies entre sitios.
- Es la opción que más se aleja del plazo.

**Trade-off:** ganas una vitrina Java y familiaridad con el backend, a cambio de unas 28 h por encima del presupuesto de tiempo y de más piezas que operar.

**Escenarios**

- **Crece ×10:** el sitio público no cambia, y la API sigue lejos de las 750 horas de Render.
- **Cambia el requisito principal:** es la más flexible si el backend crece, por ejemplo con más integraciones.
- **Lo mantiene una sola persona:** es la más costosa de sostener (dependencias de Maven y npm, dos pipelines).

**Riesgos y mitigación**

- Render elimina o cambia su plan gratuito, como ya hizo Koyeb en 2026 (S17). Mitigación: la imagen Docker es portable, aunque no hay hoy otro host Java verificado a $0 sin riesgo de cobro.
- Que se registre una tarjeta en Render por error. Render factura por exceso de ancho de banda o de minutos de build cuando hay método de pago (S15). Mitigación: no registrar tarjeta nunca.

## Recomendación

**Recomiendo la opción B: un monolito modular en Astro desplegado en Vercel, con Neon y Vercel Blob.**

Gana con estas prioridades por tres razones:

1. **Empata con A en costo:** todo a $0 verificado, sin tarjeta.
2. **Es la única que cumple el panel tal como lo describe la visión sin recortes ni dos paneles:** bandeja, estado de la última publicación, ordenar, acceso denegado y 1 a 3 minutos.
3. **Mantiene una sola pieza desplegable y un solo lenguaje.** C cumple el alcance, pero cuesta unas 20 h más que B y añade un proveedor y un arranque en frío.

La ventaja sobre A es pequeña (4,20 frente a 4,10). Depende sobre todo de que el usuario quiera la bandeja y el estado de publicación dentro del mismo panel.

### Arquitectura propuesta

**Estructura:** monolito modular, un repositorio en GitHub personal y un proyecto en Vercel Hobby.

**Stack**

| Capa | Elección | Versión al 2026-11-13 (S21) |
| --- | --- | --- |
| Frontend público | Astro, páginas prerenderizadas, i18n con `en` por defecto sin prefijo y `es` en `/es/` | 7.4.x |
| Estilos | Tailwind CSS 4 con `@theme` generado desde los tokens de marca y **la paleta por defecto desactivada**, para que ningún color fuera de la marca compile. Fuentes con `@font-face` local y `font-display: swap`. | 4.3.x |
| Panel | Astro con render bajo demanda, Astro Actions y formularios que funcionan sin JS. Islas Preact solo para ordenar y subir archivos. | `@astrojs/preact` 6.1.x |
| Backend / API | Funciones de Vercel generadas por `@astrojs/vercel`, en la región `iad1` | 11.0.x |
| Autenticación | Better Auth sin base de datos (sesión en cookie cifrada, S19), proveedor GitHub y comparación del ID numérico de GitHub con `ADMIN_GITHUB_ID` en el middleware | 1.7.x |
| Base de datos | Neon Postgres Free, en una región de AWS us-east cercana a `iad1`, con Drizzle ORM y driver HTTP serverless | Drizzle 0.45.x |
| Archivos | Vercel Blob en un store público, con subida directa desde el navegador para no chocar con el límite de 4,5 MB por petición a funciones (S7) | `@vercel/blob` 2.9.x |
| Correo | Resend Free | `resend` 6.x |
| Antispam | Honeypot, Cloudflare Turnstile (verificación en servidor) y 1 regla de rate limit por IP en el WAF de Vercel (S8) | |
| Analítica | Vercel Web Analytics | |
| Calidad | Vitest, Playwright y Lighthouse CI en GitHub Actions (gratis en repositorio público; en privado, unos $12 al mes de cómputo incluido y bloqueo, sin cobro, si no hay tarjeta; S22) | |

Fijar versiones exactas que tengan al menos dos semanas de antigüedad al instalar. Varias de las listadas salieron esta misma semana.

**Módulos y reglas de dependencia**

```
src/
  contenido/     dominio: esquemas Zod (perfil, experiencia, habilidades, proyectos, contacto),
                 repositorio Drizzle, lectura publicada por idioma con respaldo EN si falta ES
  mensajes/      formulario: validación, honeypot, Turnstile, guardado y envío por Resend
  publicacion/   disparo del Deploy Hook con antirrebote y estado del último deploy (API REST de Vercel)
  archivos/      tokens de subida a Blob, reemplazo del CV, limpieza de huérfanos
  auth/          Better Auth, lista de permitidos y middleware de /admin
  ui/            componentes públicos (.astro, sin JS salvo tema, idioma y formulario)
  pages/
    index.astro, es/index.astro, 404.astro     prerender = true
    admin/**                                   prerender = false
    api/contacto.ts, api/auth/[...all].ts      prerender = false
```

> Nota (2026-11-13, aprobada por Sharlton): el acceso a Neon usa el driver WebSocket de `@neondatabase/serverless` (`drizzle-orm/neon-serverless`) en lugar del HTTP, porque las escrituras del contenido necesitan transacciones interactivas. Los tests de integración usan PGlite. Detalle en `specs/001-content-database/research.md`.

> Nota (2026-11-13): el código del repo va en inglés, así que los módulos se llaman `content/`, `messages/`, `publishing/`, `files/`, `auth/` y `ui/` (equivalentes a `contenido/`, `mensajes/`, `publicacion/`, `archivos/`, `auth/` y `ui/`).

Reglas de dependencia:

- Las páginas públicas solo dependen de `contenido/` y solo en tiempo de build.
- `admin/` usa los módulos a través de sus funciones públicas.
- Ningún módulo importa a otro por dentro.

**Cómo fluye cada caso**

1. **Visitante.**
   - La CDN de Vercel sirve el HTML estático de `/` o de `/es/`.
   - Un script en línea dentro de `<head>` aplica el tema antes de pintar, sin parpadeo.
   - Las imágenes ya están optimizadas desde el build y no hay llamadas a funciones.
2. **Formulario.**
   - El navegador envía `POST /api/contacto`, que pasa por la regla del WAF (429 si se excede).
   - Después se revisa el honeypot, se verifica Turnstile y se valida con Zod.
   - Luego se hace `INSERT` en Neon y se envía con Resend.
   - Si uno de los dos destinos falla, el otro conserva el mensaje y se registra el error.
3. **Admin.**
   - `/admin` redirige al login de GitHub.
   - Si el ID de GitHub no coincide, se muestra la página «Acceso denegado» y se cierra la sesión.
   - Al editar, una Astro Action escribe en Neon, marca la publicación como «pendiente» y dispara el Deploy Hook. El antirrebote permite como máximo un disparo cada unos 30 segundos, y hay además un botón «Publicar ahora».
4. **Build.**
   - Astro lee Neon, genera las dos páginas, el `sitemap.xml` con `hreflang` y las metas de Open Graph.
   - Descarga las imágenes de Blob y las optimiza, y copia el CV.
   - Vercel publica el resultado. El panel muestra el estado consultando la API de despliegues.

## Consecuencias

- **Se gana:** un solo artefacto que desplegar. El sitio público es inmune a caídas de Neon, Blob o funciones. Hay un panel a medida con la identidad SHAR.DEV y $0 sin tarjeta en ningún servicio.
- **Se asume:**
  - Dependencia de Vercel para hosting, Blob, Deploy Hooks y WAF.
  - Unas 9 pantallas de panel hechas a mano.
  - Que una publicación tarde lo que tarda un build, en lugar de segundos.
- **Orden de entrega para proteger el plazo:**
  1. Esquema, seed por script y sitio público completo leyendo Neon en el build. Con esto ya se puede lanzar.
  2. Formulario y bandeja.
  3. Login y panel de Inicio/About y Proyectos.
  4. Experiencia, Habilidades, Contacto y CV.
  5. Estado de publicación.

  Si al día 14 el paso 4 no está, se lanza con lo hecho y el resto del contenido se edita por seed. Eso es una decisión del usuario.
- **Variables de entorno:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_ID`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `VERCEL_DEPLOY_HOOK_URL` y `VERCEL_API_TOKEN`. Nunca van en el repositorio. La URL del Deploy Hook equivale a una contraseña (S3).

### Riesgos del costo $0, con fuentes

| Riesgo | Detalle | Mitigación |
| --- | --- | --- |
| Uso comercial en Vercel Hobby | Hobby es solo para uso personal y no comercial. Vercel puede pausar cuentas que lo incumplan y puede cambiar o retirar Hobby en cualquier momento (S6). Un portafolio personal encaja. | No vender servicios ni poner publicidad en el sitio. |
| Exceder un límite de Hobby | No se cobra: la función afectada se pausa hasta 30 días (Blob, funciones). Web Analytics se pausa 7 días tras 3 días de gracia (S1, S4, S5). | Uso estimado por debajo del 10 % de cada límite. Hacer que el público no lea Blob. Revisar Usage una vez al mes. |
| Prueba de Pro | Al terminar la prueba, Vercel cobra los eventos de analítica recogidos durante ella (S5). | **No iniciar nunca la prueba de Pro** ni pulsar «Upgrade». |
| Neon sin CU-h o sin espacio | Suspende el cómputo hasta el mes siguiente o bloquea escrituras, sin borrar datos ni cobrar. No pausa proyectos por inactividad y no pide tarjeta (S10). | El sitio público no se ve afectado. Bajo consumo estimado. |
| Resend sin dominio propio | `onboarding@resend.dev` solo envía al correo dueño de la cuenta (S13). El límite es de 100 al día y 3.000 al mes, sin excedente en Free. | Crear la cuenta de Resend con sromerobpersonal@gmail.com. Si falla el envío, el mensaje igual queda en la bandeja. |
| Datos no verificables | No encontré si los despliegues cancelados por un Deploy Hook repetido cuentan dentro de los 100 al día. Turnstile no publica un tope numérico de siteverify (dice «ilimitado»). Resend no aclara si pide tarjeta en Free (yo no la registraría). | Antirrebote en los disparos. Revisar el contador de despliegues en la primera semana. |
| GitHub Actions en repositorio privado | Con la cuota agotada, se bloquea y no cobra si no hay tarjeta (S22). | Repositorio público, o Lighthouse CI solo en `main`. |
| Opción C (si se elige) | Render cobra excedentes solo si hay método de pago. Sin él, suspende (S15). | No registrar tarjeta en Render. |

## Cuándo revisar esta decisión

- **Si las horas reales disponibles hasta el 2026-12-04 son menos de unas 60:** elegir A, y aceptar la bandeja como página aparte o solo en Gmail.
- **Si el curso o el usuario valoran que el propio portafolio muestre un backend Java:** elegir C, aceptando un panel con arranque en frío y un plazo más largo. Es lo único que la haría ganar.
- **Si el Container Runtime de Vercel sale de beta con un almacenamiento de imágenes incluido en Hobby:** reevaluar C con Spring Boot dentro de Vercel, sin Render.
- **Si se necesita publicar en segundos, o si los despliegues por día se vuelven un límite:** pasar B a ISR o a Next.js con `revalidateTag`.
- **Si Vercel, Neon o Resend cambian sus planes gratuitos.** Revisar las páginas fuente cada 6 meses.
- **Si llega la v2** (casos de estudio o dominio propio): un dominio propio permitiría verificar un dominio en Resend y enviar respuestas automáticas.

## Supuestos y fuentes

### Supuestos

- Unas 20 h por semana de dedicación, unas 60 h hasta la fecha objetivo.
- Experiencia en TypeScript de básica a intermedia.
- 500 visitas al mes al lanzar, de unos 400 KB cada una.
- Las horas de esfuerzo, los tiempos de build (1 a 2 minutos) y el consumo de Neon son **estimaciones**, no mediciones.
- Las puntuaciones son juicio del arquitecto a partir de las fuentes.

### Fuentes (consultadas el 2026-11-13)

| Id | Fuente | Fecha de la página | Dato usado |
| --- | --- | --- | --- |
| S1 | Vercel, Hobby Plan: https://vercel.com/docs/plans/hobby | Actualizada 2026-11-12 | Cuotas Hobby (100 GB de FDT, 1 M de invocaciones, 4 h de CPU, 360 GB-h, 50.000 eventos), 100 despliegues al día, pausa de 30 días al exceder |
| S2 | Vercel, Limits: https://vercel.com/docs/limits | Actualizada 2026-09-16 | Build de 45 minutos como máximo; 5 Deploy Hooks por proyecto; 60 disparos por hora |
| S3 | Vercel, Deploy Hooks: https://vercel.com/docs/deploy-hooks | Actualizada 2026-09-16 | GET o POST sin autenticación; la URL es secreta; los despliegues repetidos de la misma versión se cancelan |
| S4 | Vercel Blob, Pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing | Actualizada 2026-09-23 | Hobby: 1 GB, 10.000 operaciones simples, 2.000 avanzadas, 10 GB; «will not pay for any additional usage» |
| S5 | Vercel Web Analytics, Pricing: https://vercel.com/docs/analytics/limits-and-pricing | Actualizada 2026-08-25 | 50.000 eventos al mes; gracia de 3 días y pausa de 7; cobro de lo recogido durante la prueba de Pro |
| S6 | Vercel, Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines y Terms: https://vercel.com/legal/terms | Actualizada 2026-11-12 | Hobby solo para uso personal y no comercial; Vercel puede cambiar o retirar Hobby |
| S7 | Vercel Functions, Limits: https://vercel.com/docs/functions/limitations y Pricing: https://vercel.com/docs/functions/usage-and-pricing | Actualizadas 2026-08-24 y 2026-06-16 | 2 GB / 1 vCPU, 300 s, 4,5 MB por cuerpo de petición |
| S8 | Vercel WAF Rate Limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting | Actualizada 2026-08-28 | Disponible en Hobby: 1 regla, clave IP, 1 M de solicitudes permitidas |
| S9 | Vercel Container Runtime: https://vercel.com/docs/functions/runtimes/container y VCR: https://vercel.com/docs/container-registry/limits-and-pricing | Actualizadas 2026-07-07 y 2026-09-22 | Beta en todos los planes; VCR a $0,10 por GB sin cuota Hobby indicada |
| S10 | Neon, Plans: https://neon.com/docs/introduction/plans y Pricing: https://neon.com/pricing | Actualizada 2026-11-12 | 1 GB por proyecto, 100 CU-h por proyecto, escala a cero a los 5 minutos, suspensión sin borrado al exceder, «no credit card required», no pausa proyectos por inactividad |
| S11 | Supabase, Pricing: https://supabase.com/pricing | Sin fecha | «Free projects are paused after 1 week of inactivity» |
| S12 | Turso, Pricing: https://turso.tech/pricing | Sin fecha | Free sin tarjeta; no indica qué pasa al exceder (no usado) |
| S13 | Resend, Pricing: https://resend.com/pricing y KB: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain | Sin fecha | 3.000 al mes y 100 al día; sin excedentes en Free; `resend.dev` solo envía al correo de la cuenta |
| S14 | Cloudflare Turnstile, Plans: https://developers.cloudflare.com/turnstile/plans/ | Actualizada 2026-08-14 | Free: 20 widgets, desafíos ilimitados |
| S15 | Render, Deploy for Free: https://render.com/docs/free | Sin fecha | Duerme a los 15 minutos, arranque de unos 60 s, 750 h; Postgres caduca a 30 días más 14 de gracia; sin tarjeta suspende, con tarjeta factura excedentes |
| S16 | Oracle, Always Free Resources: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | Sin fecha (© 2026) | Reclamo de instancias ociosas (menos del 20 % durante 7 días) |
| S17 | Koyeb (fuentes **secundarias**): https://www.srvrlss.io/provider/koyeb/ y https://snapdeploy.dev/blog/free-cloud-deployment-platforms-2026-comparison | Agosto a octubre de 2026 | Tarjeta obligatoria desde febrero de 2026 y alta en plan de pago. No lo verifiqué en una fuente oficial. |
| S18 | Keystatic GitHub mode: https://keystatic.com/docs/github-mode; API de GitHub de Thinkmill/keystatic, sveltia/sveltia-cms y decaporg/decap-cms | Consultada 2026-11-13 | Acceso por permiso de escritura en el repositorio; necesita rutas de servidor; actividad: Keystatic con último push 2026-10-01 y 218 issues; Sveltia y Decap con releases en noviembre y octubre de 2026 |
| S19 | Better Auth, Session Management: https://better-auth.com/docs/concepts/session-management; anuncio https://better-auth.com/blog/authjs-joins-better-auth | Anuncio del 2025-09-22 | Modo sin base de datos con proveedores sociales; Auth.js ahora mantenido por Better Auth |
| S20 | Astro, adaptador Vercel: https://docs.astro.build/en/guides/integrations-guide/vercel/; adquisición por Cloudflare (2026-01-16, fuente secundaria): https://alternativeto.net/news/2026/1/cloudflare-acquires-astro-team-keeps-it-open-source-with-multiple-deployment-targets | Consultada 2026-11-13 | Coexistencia de páginas prerenderizadas y bajo demanda; ISR opcional; Astro sigue soportando Vercel |
| S21 | Registro de npm y releases de Spring Boot en GitHub | Consultado 2026-11-13 | Astro 7.4.12, `@astrojs/vercel` 11.0.22, Next 16.4.6, Tailwind 4.3.5, Better Auth 1.7.23, `@vercel/blob` 2.9.0, Drizzle 0.45.4, `@keystatic/core` 0.6.9 (2026-08-26), Spring Boot 4.1.2 |
| S22 | GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions | Consultada 2026-11-13 | Gratis en repositorios públicos; en privados, $12 al mes incluidos y bloqueo sin cobro si no hay método de pago |
