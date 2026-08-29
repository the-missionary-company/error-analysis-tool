import { describe, expect, it } from 'vitest';
import {
  THEME_KEY,
  applyTheme,
  loadTheme,
  parseTheme,
  prefersDarkScheme,
  readAppliedTheme,
  resolveTheme,
  saveTheme,
} from './theme';

describe('theme', () => {
  it('parses only light and dark', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('system')).toBeNull();
    expect(parseTheme(null)).toBeNull();
  });

  it('uses a stored choice, otherwise the system preference', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(undefined, false)).toBe('light');
  });

  it('reads and writes ea.theme', () => {
    const store = new Map<string, string>();
    const kv = {
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
    };
    expect(loadTheme(kv, true)).toBe('dark');
    saveTheme('light', kv);
    expect(store.get(THEME_KEY)).toBe('light');
    expect(loadTheme(kv, true)).toBe('light');
  });

  it('toggles the dark class and color-scheme', () => {
    const classList = new Set<string>();
    const root = {
      classList: {
        contains: (name: string) => classList.has(name),
        toggle: (name: string, force?: boolean) => {
          if (force) classList.add(name);
          else classList.delete(name);
        },
      },
      style: { colorScheme: '' },
    } as unknown as HTMLElement;
    applyTheme('dark', root);
    expect(readAppliedTheme(root)).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
    applyTheme('light', root);
    expect(readAppliedTheme(root)).toBe('light');
    expect(root.style.colorScheme).toBe('light');
  });

  it('reads prefers-color-scheme from the media query', () => {
    expect(prefersDarkScheme({ matches: true })).toBe(true);
    expect(prefersDarkScheme({ matches: false })).toBe(false);
    expect(prefersDarkScheme(null)).toBe(false);
  });
});
