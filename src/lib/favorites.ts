const FAVORITES_KEY = "genesis_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function isFavorite(slug: string) {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string) {
  const current = getFavorites();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}
