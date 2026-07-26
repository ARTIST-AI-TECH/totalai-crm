'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { THEME_CONFIGS, DEFAULT_THEME, type ThemeConfig } from './theme-config';

interface ThemeContextType {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  themeConfig: ThemeConfig;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'color-theme';

// Theme tokens for each color theme
const THEME_TOKENS = {
  default: {
    light: {
      '--primary': '240 5.9% 10%',
      '--primary-foreground': '0 0% 98%',
    },
    dark: {
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
    }
  },
  blue: {
    light: {
      '--primary': '221.2 83.2% 53.3%',
      '--primary-foreground': '210 40% 98%',
    },
    dark: {
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '240 5.9% 10%',
    }
  },
  green: {
    light: {
      '--primary': '142.1 76.2% 36.3%',
      '--primary-foreground': '355.7 100% 97.3%',
    },
    dark: {
      '--primary': '142.1 70.6% 45.3%',
      '--primary-foreground': '144.9 100% 6.7%',
    }
  },
  orange: {
    light: {
      '--primary': '20.5 90.2% 48.2%',
      '--primary-foreground': '60 9.1% 97.8%',
    },
    dark: {
      '--primary': '20.5 90.2% 48.2%',
      '--primary-foreground': '60 9.1% 97.8%',
    }
  },
  red: {
    light: {
      '--primary': '0 72.2% 50.6%',
      '--primary-foreground': '0 85.7% 97.3%',
    },
    dark: {
      '--primary': '0 72.2% 50.6%',
      '--primary-foreground': '0 85.7% 97.3%',
    }
  },
  rose: {
    light: {
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '355.7 100% 97.3%',
    },
    dark: {
      '--primary': '346.8 77.2% 49.8%',
      '--primary-foreground': '355.7 100% 97.3%',
    }
  },
  violet: {
    light: {
      '--primary': '262.1 83.3% 57.8%',
      '--primary-foreground': '210 20% 98%',
      '--primary-hover': '271 81% 56%',
      '--primary-light': '270 100% 96%',
      '--accent': '47 100% 60%',
      '--accent-foreground': '222 47% 11%',
      '--accent-hover': '43 96% 56%',
      '--accent-light': '270 100% 98%',
      '--success': '160 84% 39%',
      '--success-light': '160 84% 95%',
      '--warning': '43 96% 56%',
      '--warning-light': '43 96% 95%',
      '--info': '217 91% 60%',
      '--info-light': '217 91% 95%'
    },
    dark: {
      '--primary': '263.4 70% 50.4%',
      '--primary-foreground': '210 20% 98%',
      '--primary-hover': '258 85% 70%',
      '--primary-light': '258 50% 20%',
      '--accent': '47 100% 60%',
      '--accent-foreground': '240 10% 15%',
      '--accent-hover': '47 100% 55%',
      '--accent-light': '47 50% 20%',
      '--success': '142 76% 36%',
      '--success-light': '142 50% 15%',
      '--warning': '38 92% 50%',
      '--warning-light': '38 50% 15%',
      '--info': '217 91% 60%',
      '--info-light': '217 50% 15%'
    }
  },
  yellow: {
    light: {
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '26 83.3% 14.1%',
    },
    dark: {
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '26 83.3% 14.1%',
    }
  }
} as const;

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState(() => {
    // Try to get saved theme on client-side only
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved && THEME_CONFIGS.find(t => t.name === saved) ? saved : DEFAULT_THEME;
      } catch {
        return DEFAULT_THEME;
      }
    }
    return DEFAULT_THEME;
  });

  const themeConfig = THEME_CONFIGS.find(t => t.name === colorTheme) || THEME_CONFIGS[0];

  const applyThemeTokens = (themeName: string) => {
    const tokens = THEME_TOKENS[themeName as keyof typeof THEME_TOKENS];
    if (!tokens) return;

    // Apply light tokens to :root
    Object.entries(tokens.light).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });

    // Set up CSS for dark mode
    const darkCSS = Object.entries(tokens.dark)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n    ');

    // Remove initial theme script and existing dark mode styles
    const initialTheme = document.getElementById('initial-theme');
    if (initialTheme) {
      initialTheme.remove();
    }
    
    let darkStyle = document.getElementById('dynamic-dark-theme');
    if (darkStyle) {
      darkStyle.remove();
    }

    // Add new dark mode styles
    darkStyle = document.createElement('style');
    darkStyle.id = 'dynamic-dark-theme';
    darkStyle.textContent = `
      .dark {
        ${darkCSS}
      }
    `;
    document.head.appendChild(darkStyle);
  };

  const setColorTheme = (theme: string) => {
    if (!THEME_CONFIGS.find(t => t.name === theme)) return;
    
    setColorThemeState(theme);
    
    // Store in localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save color theme to localStorage');
    }
    
    // Apply theme tokens immediately
    applyThemeTokens(theme);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemeTokens(colorTheme);
    }
  }, [colorTheme]);

  // Handle hydration mismatch by checking localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        if (savedTheme && THEME_CONFIGS.find(t => t.name === savedTheme) && savedTheme !== colorTheme) {
          setColorThemeState(savedTheme);
        }
      } catch (e) {
        console.warn('Failed to load color theme from localStorage');
      }
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        setColorTheme,
        themeConfig,
        availableThemes: THEME_CONFIGS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}