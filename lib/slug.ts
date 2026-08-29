export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Build a unique property slug: `title-slug-<shortId>` */
export function makePropertySlug(title: string, id: string): string {
  const base = slugify(title) || "property";
  return `${base}-${id.slice(0, 6)}`;
}
