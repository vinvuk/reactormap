/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single
}

/**
 * Create a unique slug for a reactor using name and ID
 * @param name - Reactor name
 * @param id - Reactor ID (for uniqueness)
 * @returns Unique URL slug
 */
export function createReactorSlug(name: string, id: string | number): string {
  const baseSlug = slugify(name);
  return `${baseSlug}-${id}`;
}

/**
 * Extract reactor ID from a slug
 * @param slug - The full slug (e.g., "wolf-creek-740")
 * @returns The reactor ID or null if not found
 */
export function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/-(\d+)$/);
  return match ? match[1] : null;
}
