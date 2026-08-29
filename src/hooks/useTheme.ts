import { useCallback, useState } from 'react';
import { applyTheme, loadTheme, readAppliedTheme, saveTheme, type Theme } from '../lib/theme';

function initialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return readAppliedTheme(document.documentElement);
  }
  if (typeof window === 'undefined') return 'light';
  return loadTheme();
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
}
