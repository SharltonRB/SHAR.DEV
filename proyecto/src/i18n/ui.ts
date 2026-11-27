import type { Locale } from "../content";

/** Fixed interface texts; the content itself comes from the database. */
export const ui = {
  en: {
    metaTitle: "Sharlton Romero · Java Backend Engineer | SHAR.DEV",
    metaDescription:
      "Portfolio of Sharlton Romero, Java Backend Engineer in San José, Costa Rica: Spring Boot, REST and GraphQL APIs, open to remote roles.",
    skipToContent: "Skip to content",
    nav: {
      about: "About",
      experience: "Experience",
      skills: "Skills",
      projects: "Projects",
      contact: "Contact",
      menu: "Menu",
      close: "Close menu",
    },
    langLabel: "Language",
    themeToggle: "Switch light or dark theme",
    startMission: "Start Mission",
    mailSubject: "Mission request from SHAR.DEV",
    downloadCv: "Download CV",
    viewProjects: "View projects",
    hello: "Hello, I'm",
    windowTitle: "~/shar.dev — home",
    status: "status: building APIs",
    about: {
      title: "About",
      mission: "Mission",
      vision: "Vision",
      values: "Values",
    },
    experience: {
      title: "Experience",
      current: "Current role",
      achievements: "Highlights",
      stack: "Stack",
      cvNote:
        "This is the short version. Achievements, education and certifications are in my CV.",
    },
    skills: {
      title: "Skills",
      intro:
        "Tools I use in production and in my own projects, grouped by area.",
    },
    projects: {
      title: "Projects",
      intro:
        "Things I've built. Filter by technology and open a card for details.",
      filterLabel: "Filter projects by technology",
      all: "All",
      details: "View details",
      featured: "Featured project",
      code: "View code",
      demo: "Live demo",
      close: "Close",
      empty: "No projects use this technology yet.",
    },
    contact: {
      title: "Contact",
      intro:
        "Have a backend mission in mind? Send me a message, write on WhatsApp or start a mission by email.",
      email: "Email",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn",
      github: "GitHub",
      form: {
        title: "Send a message",
        name: "Name",
        email: "Email",
        company: "Company (optional)",
        message: "Message",
        send: "Send message",
        sending: "Sending…",
        sent: "Message sent. I'll reply to your email soon.",
        error:
          "The message couldn't be sent. Try again or write to me by email.",
        invalid: "Check the highlighted fields.",
        required: "This field is required.",
        invalidEmail: "Enter a valid email address.",
        unavailable:
          "The form is not available right now. Please write to me by email.",
      },
    },
    whatsappChat: "Chat on WhatsApp",
    whatsappText: "Hi Sharlton, I saw your portfolio and I'd like to talk.",
    scrollTop: "Back to top",
    footer: {
      tagline: "Game over? Not yet.",
    },
    notFound: {
      metaTitle: "404 · Endpoint not found | SHAR.DEV",
      title: "404 — Endpoint not found",
      text: "This page doesn't exist or was moved.",
      back: "Back to home",
    },
  },
  es: {
    metaTitle: "Sharlton Romero · Java Backend Engineer | SHAR.DEV",
    metaDescription:
      "Portafolio de Sharlton Romero, Java Backend Engineer en San José, Costa Rica: Spring Boot, APIs REST y GraphQL, abierto a roles remotos.",
    skipToContent: "Saltar al contenido",
    nav: {
      about: "Sobre mí",
      experience: "Experiencia",
      skills: "Habilidades",
      projects: "Proyectos",
      contact: "Contacto",
      menu: "Menú",
      close: "Cerrar menú",
    },
    langLabel: "Idioma",
    themeToggle: "Cambiar a tema claro u oscuro",
    startMission: "Start Mission",
    mailSubject: "Propuesta de misión desde SHAR.DEV",
    downloadCv: "Descargar CV",
    viewProjects: "Ver proyectos",
    hello: "Hola, soy",
    windowTitle: "~/shar.dev — inicio",
    status: "estado: construyendo APIs",
    about: {
      title: "Sobre mí",
      mission: "Misión",
      vision: "Visión",
      values: "Valores",
    },
    experience: {
      title: "Experiencia",
      current: "Puesto actual",
      achievements: "Logros",
      stack: "Tecnologías",
      cvNote:
        "Esta es la versión corta. Logros, formación y certificaciones están en mi CV.",
    },
    skills: {
      title: "Habilidades",
      intro:
        "Herramientas que uso en producción y en mis proyectos, agrupadas por área.",
    },
    projects: {
      title: "Proyectos",
      intro:
        "Lo que he construido. Filtra por tecnología y abre una tarjeta para ver el detalle.",
      filterLabel: "Filtrar proyectos por tecnología",
      all: "Todos",
      details: "Ver detalle",
      featured: "Proyecto destacado",
      code: "Ver código",
      demo: "Ver demo",
      close: "Cerrar",
      empty: "Todavía no hay proyectos con esta tecnología.",
    },
    contact: {
      title: "Contacto",
      intro:
        "¿Tienes una misión backend en mente? Envíame un mensaje, escríbeme por WhatsApp o inicia una misión por correo.",
      email: "Correo",
      whatsapp: "WhatsApp",
      linkedin: "LinkedIn",
      github: "GitHub",
      form: {
        title: "Envía un mensaje",
        name: "Nombre",
        email: "Correo",
        company: "Empresa (opcional)",
        message: "Mensaje",
        send: "Enviar mensaje",
        sending: "Enviando…",
        sent: "Mensaje enviado. Te responderé pronto a tu correo.",
        error:
          "No se pudo enviar el mensaje. Inténtalo de nuevo o escríbeme por correo.",
        invalid: "Revisa los campos marcados.",
        required: "Este campo es obligatorio.",
        invalidEmail: "Escribe un correo válido.",
        unavailable:
          "El formulario no está disponible ahora. Escríbeme por correo.",
      },
    },
    whatsappChat: "Chatear por WhatsApp",
    whatsappText: "Hola Sharlton, vi tu portafolio y me gustaría conversar.",
    scrollTop: "Volver arriba",
    footer: {
      tagline: "¿Game over? Todavía no.",
    },
    notFound: {
      metaTitle: "404 · Endpoint no encontrado | SHAR.DEV",
      title: "404 — Endpoint no encontrado",
      text: "Esta página no existe o se movió.",
      back: "Volver al inicio",
    },
  },
} as const;

export type UiStrings = (typeof ui)[Locale];

/** Home path of each locale: English without prefix, Spanish under /es/. */
export const homePath: Record<Locale, string> = { en: "/", es: "/es/" };

/** "2026-10" → "Oct 2026" / "oct 2026". */
export function formatMonth(value: string, locale: Locale): string {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(".", "");
}
