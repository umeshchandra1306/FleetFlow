export type Theme = 'system' | 'light' | 'dark';

export function getSavedTheme(): Theme {
  const saved = localStorage.getItem('fleetflow_theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

/**
 * Resolves the given theme preference ('system', 'light', 'dark') to an effective mode ('light' | 'dark').
 */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  // System mode: inspect window.matchMedia('(prefers-color-scheme: dark)')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Applies the resolved theme ('light' or 'dark') globally to document.documentElement.
 */
export function applyTheme(theme?: Theme) {
  const targetTheme = theme || getSavedTheme();
  const effectiveMode = resolveTheme(targetTheme);
  const root = document.documentElement;

  if (effectiveMode === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

/**
 * Initializes global theme handling and attaches OS prefers-color-scheme change listener.
 */
export function initTheme() {
  applyTheme();

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (getSavedTheme() === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if ('addListener' in mediaQuery) {
      (mediaQuery as any).addListener(handleSystemChange);
    }
  }
}
