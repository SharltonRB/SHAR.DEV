import type {
  EditableContact,
  EditableProfile,
  EditableValue,
} from "./published";

// Approved texts, copied literally from the brand source
// `identidad-visual/contenido/perfil-mision-vision-valores.md` (FR-025).
// Each value splits its table cell into title and description at « — ».

export const SEED_PROFILE: EditableProfile = {
  name: "Sharlton Romero",
  title: { en: "Java Backend Engineer", es: null },
  slogan: { en: "One endpoint at a time.", es: "Un endpoint a la vez." },
  headline: { en: null, es: null },
  summary: {
    en: "Java Backend Engineer with 2+ years of experience building production-grade REST and GraphQL APIs with Java and Spring Boot in a Fortune 500 environment. I design secure, scalable microservices and third-party integrations, and I'm comfortable owning a solution from design through deployment. My focus is turning complex business needs into reliable, high-performance backend systems that teams can build on. My toolkit includes Spring Security, JWT/OAuth2, PostgreSQL, Oracle, Docker and CI/CD. Apollo-certified GraphQL developer who works daily in English with global teams. Based in San José, Costa Rica, open to remote opportunities.",
    es: "Ingeniero Backend Java con más de 2 años de experiencia construyendo APIs REST y GraphQL de nivel productivo con Java y Spring Boot en un entorno Fortune 500. Diseño microservicios e integraciones con terceros seguros y escalables, y me siento cómodo asumiendo una solución desde el diseño hasta el despliegue. Mi enfoque es convertir necesidades de negocio complejas en sistemas backend confiables y de alto rendimiento sobre los que los equipos puedan construir. Mi caja de herramientas incluye Spring Security, JWT/OAuth2, PostgreSQL, Oracle, Docker y CI/CD. Desarrollador GraphQL certificado por Apollo que trabaja a diario en inglés con equipos globales. Radicado en San José, Costa Rica, abierto a oportunidades remotas.",
  },
  mission: {
    en: "To build secure, reliable and well-documented backend systems that turn complex business logic into services teams and users can trust — one endpoint at a time.",
    es: "Construir sistemas backend seguros, confiables y bien documentados que conviertan la lógica de negocio compleja en servicios en los que equipos y usuarios puedan confiar, un endpoint a la vez.",
  },
  vision: {
    en: "To grow into a Senior Software Engineer and backend architect who leads scalable distributed systems and helps other developers grow, working on products with global impact.",
    es: "Crecer hasta convertirme en Ingeniero de Software Senior y arquitecto backend que lidera sistemas distribuidos escalables y ayuda a otros desarrolladores a crecer, trabajando en productos de alcance global.",
  },
};

/** The four values, in the order of the source table. */
export const SEED_VALUES: Pick<EditableValue, "title" | "description">[] = [
  {
    title: { en: "Autonomy", es: "Autonomía" },
    description: {
      en: "I take ownership from design to production.",
      es: "asumo la responsabilidad desde el diseño hasta producción.",
    },
  },
  {
    title: { en: "Technical rigor", es: "Rigor técnico" },
    description: {
      en: "quality is built in, not added later.",
      es: "la calidad se construye desde el inicio, no se agrega después.",
    },
  },
  {
    title: { en: "Clear communication", es: "Comunicación clara" },
    description: {
      en: "complex ideas, explained simply.",
      es: "ideas complejas, explicadas con sencillez.",
    },
  },
  {
    title: { en: "Continuous learning", es: "Aprendizaje constante" },
    description: {
      en: "I keep growing while I deliver.",
      es: "sigo creciendo mientras entrego resultados.",
    },
  },
];

export const SEED_CONTACT: EditableContact = {
  email: "sromerobpersonal@gmail.com",
  whatsapp: "+50670429481",
  linkedinUrl: "https://www.linkedin.com/in/sharlton-rb/",
  githubUrl: "https://github.com/SharltonRB",
};
