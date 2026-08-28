/**
 * Normalizes text into a URL-safe slug fragment: lowercase, no accents, only
 * [a-z0-9-], no repeated/leading/trailing dashes.
 */
function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/**
 * Builds a unique vacancy slug from position + company, appending an
 * incremental numeric suffix on collision (slug, slug-2, slug-3, ...).
 */
async function generateUniqueVacancySlug({ models, position, company }) {
  const base = slugify(`${position}-${company}`) || "vacante";

  let candidate = base;
  let suffix = 2;
  // Small table, sequential check is fine — no concurrent-create race handling
  // needed for this MVP (mirrors the rest of the module's simplicity).
  while (await models.Vacancy.findOne({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

module.exports = { slugify, generateUniqueVacancySlug };
