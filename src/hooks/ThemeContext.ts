import { createContext, useContext } from "react";

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggle: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}
