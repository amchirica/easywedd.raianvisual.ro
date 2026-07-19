export function slugifyCoupleNames(name1: string, name2: string) {
  const raw = [name1, name2]
    .filter(Boolean)
    .join("-si-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return raw || `nunta-${Date.now().toString(36)}`;
}

export function isValidSiteSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 80;
}
