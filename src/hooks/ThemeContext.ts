import { createContext, useContext } from "react";

export type FontSize = "normal" | "large" | "xlarge";
export type ContrastMode = "normal" | "high";
export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  contrast: ContrastMode;
  setContrast: (mode: ContrastMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggle: () => {},
  fontSize: "normal",
  setFontSize: () => {},
  contrast: "normal",
  setContrast: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
