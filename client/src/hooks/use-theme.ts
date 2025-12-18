import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "matters-theme";

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(THEME_KEY) as Theme | null) : null;
    return stored ?? "system";
  });

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  useEffect(() => {
    const next = resolvedTheme;
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [resolvedTheme, theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (resolveTheme(prev) === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
