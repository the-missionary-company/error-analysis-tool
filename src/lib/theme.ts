export type Theme = 'light' | 'dark';

export const THEME_KEY = 'ea.theme';

export function parseTheme(raw: string | null | undefined): Theme | null {
  return raw === 'light' || raw === 'dark' ? raw : null;
}

export function resolveTheme(stored: string | null | undefined, prefersDark = false): Theme {
  return parseTheme(stored) ?? (prefersDark ? 'dark' : 'light');
}

export function prefersDarkScheme(
  media: Pick<MediaQueryList, 'matches'> | null | undefined = typeof matchMedia === 'function'
    ? matchMedia('(prefers-color-scheme: dark)')
    : null,
): boolean {
  return Boolean(media?.matches);
}

export function loadTheme(
  store: { getItem(key: string): string | null } = localStorage,
  prefersDark = prefersDarkScheme(),
): Theme {
  return resolveTheme(store.getItem(THEME_KEY), prefersDark);
}

export function saveTheme(theme: Theme, store: { setItem(key: string, value: string): void } = localStorage) {
  store.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function readAppliedTheme(root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement): Theme {
  if (root?.classList.contains('dark')) return 'dark';
  return 'light';
}
