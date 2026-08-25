// Closed list of job-posting areas (per Héctor, Discord 2026-08-25) — deliberately NOT
// KNOWLEDGE_AREAS (frontend/src/lib/constants/knowledgeAreas.ts): that list describes a
// profile's skills/topics, this one describes job categories. Kept short (13 values) so the
// frontend select can copy it as-is without needing a shared/ package (regla de las 3
// repeticiones — solo se usa acá y en el front, no amerita mover nada todavía).
const VACANCY_AREAS = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "data",
  "devops",
  "cloud",
  "ciberseguridad",
  "blockchain",
  "qa",
  "diseno",
  "producto",
  "soporte",
];

const VACANCY_MODALITIES = ["remoto", "presencial", "hibrido"];
const VACANCY_SALARY_PERIODS = ["mes", "hora", "proyecto"];

// §3.1: "USDC / HACK / USD / moneda local". Héctor (2026-08-25): fixed set for the first
// three, plus any ISO 4217 code for "moneda local" instead of enumerating countries.
const FIXED_CURRENCIES = ["USDC", "HACK", "USD"];
const ISO_4217_RE = /^[A-Z]{3}$/;

const MIN_CLOSING_DAYS = 7;
const MAX_CLOSING_DAYS = 90;
const DEFAULT_CLOSING_DAYS = 30;
const MAX_OPEN_VACANCIES_PER_RECRUITER = 5;

const MIN_POSITION_LENGTH = 5;
const MAX_POSITION_LENGTH = 80;
const MIN_COMPANY_LENGTH = 2;
const MAX_COMPANY_LENGTH = 80;
const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_REQUIREMENTS = 1;
const MAX_REQUIREMENTS = 10;
const MAX_APPLICATION_MESSAGE_LENGTH = 500;

const VACANCY_STATUSES = ["abierta", "cerrada"];
const APPLICATION_STATUSES = ["enviada", "vista", "contactado", "descartada", "cerrada_sin_respuesta"];

// RF-14 — exact wording from the PDF, must be shown verbatim on the vacancy and the
// recruiter's profile.
const UNVERIFIED_COMPANY_NOTICE =
  "HackChain no comprueba la identidad de las empresas. Nunca envíes dinero ni datos bancarios para postularte.";

module.exports = {
  VACANCY_AREAS,
  VACANCY_MODALITIES,
  VACANCY_SALARY_PERIODS,
  FIXED_CURRENCIES,
  ISO_4217_RE,
  MIN_CLOSING_DAYS,
  MAX_CLOSING_DAYS,
  DEFAULT_CLOSING_DAYS,
  MAX_OPEN_VACANCIES_PER_RECRUITER,
  MIN_POSITION_LENGTH,
  MAX_POSITION_LENGTH,
  MIN_COMPANY_LENGTH,
  MAX_COMPANY_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_REQUIREMENTS,
  MAX_REQUIREMENTS,
  MAX_APPLICATION_MESSAGE_LENGTH,
  VACANCY_STATUSES,
  APPLICATION_STATUSES,
  UNVERIFIED_COMPANY_NOTICE,
};
