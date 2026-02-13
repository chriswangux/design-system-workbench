import { useEffect } from 'react';
import { useUIStore, type Theme } from '@/core/store/uiStore';

function getResolvedTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function useTheme() {
  const theme = useUIStore((s) => s.theme);
  const resolved = getResolvedTheme(theme);

  useEffect(() => {
    const root = document.documentElement;

    if (resolved === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
    }
  }, [resolved]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      if (mq.matches) {
        root.classList.remove('theme-light');
        root.classList.add('theme-dark');
      } else {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, resolved };
}
