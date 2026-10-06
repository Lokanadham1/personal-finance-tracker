/**
 * Utility to manage recent searches and common category/keyword filters in localStorage.
 * Persists user search history and provides quick-filter presets.
 */

const STORAGE_KEY = 'money_mitra_recent_searches';

export const COMMON_CATEGORY_KEYWORDS = [
  'Food',
  'Salary',
  'Rent',
  'Shopping',
  'Bills',
  'Transport',
  'Groceries',
  'Fuel',
] as const;

export const DEFAULT_RECENT_SEARCHES: string[] = [
  'Food',
  'Salary',
  'Rent',
  'Shopping',
  'Bills',
];

export function getStoredRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_RECENT_SEARCHES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
    return [...DEFAULT_RECENT_SEARCHES];
  } catch (err) {
    console.warn('Failed to load recent searches from localStorage:', err);
    return [...DEFAULT_RECENT_SEARCHES];
  }
}

export function saveRecentSearchTerm(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed || trimmed.length < 2) {
    return getStoredRecentSearches();
  }

  try {
    const current = getStoredRecentSearches();
    // Remove if already exists (case-insensitive deduplication)
    const filtered = current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    // Add to front and limit to 10 items
    const updated = [trimmed, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save recent search to localStorage:', err);
    return getStoredRecentSearches();
  }
}

export function removeRecentSearchTerm(term: string): string[] {
  try {
    const current = getStoredRecentSearches();
    const updated = current.filter(
      (item) => item.toLowerCase() !== term.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to remove recent search from localStorage:', err);
    return getStoredRecentSearches();
  }
}

export function clearAllRecentSearches(): string[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    console.warn('Failed to clear recent searches:', err);
    return [];
  }
}
