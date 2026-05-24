export function slugify(input: string, maxLength = 80) {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const truncated = normalized.slice(0, maxLength).replace(/-+$/g, "");

  return truncated || "marketspec";
}

export function getSpecUrlPath(hash: string, slug?: string | null) {
  return slug ? `/spec/${hash}/${slug}` : `/spec/${hash}`;
}
