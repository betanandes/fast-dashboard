import { useEffect, useState } from "react";
import type { FontSize, ContrastMode } from "./ThemeContext";

function getInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    if (!saved) return false;
    return saved === "dark";
  } catch {
    return false;
  }
}

function getInitialFontSize(): FontSize {
  try {
    return (localStorage.getItem("fontSize") as FontSize) || "normal";
  } catch {
    return "normal";
  }
}

function getInitialContrast(): ContrastMode {
  try {
    return (localStorage.getItem("contrast") as ContrastMode) || "normal";
  } catch {
    return "normal";
  }
}

const fontSizeMap: Record<FontSize, string> = {
  normal: "100%",
  large: "112.5%",
  xlarge: "125%",
};

// Aplica tema antes do React montar — evita flash
const initialDark = getInitialTheme();
document.documentElement.classList.toggle("dark", initialDark);

// Aplica fonte inicial
const initialFontSize = getInitialFontSize();
document.documentElement.style.fontSize = fontSizeMap[initialFontSize];

// Aplica contraste inicial
const initialContrast = getInitialContrast();
document.documentElement.classList.toggle(
  "high-contrast",
  initialContrast === "high",
);

export function useTheme() {
  const [dark, setDark] = useState(initialDark);
  const [fontSize, _setFontSize] = useState<FontSize>(initialFontSize);
  const [contrast, _setContrast] = useState<ContrastMode>(initialContrast);

  // Tema escuro/claro
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Tamanho de fonte
  const setFontSize = (size: FontSize) => {
    _setFontSize(size);
    document.documentElement.style.fontSize = fontSizeMap[size];
    localStorage.setItem("fontSize", size);
  };

  // Alto contraste
  const setContrast = (mode: ContrastMode) => {
    _setContrast(mode);
    document.documentElement.classList.toggle("high-contrast", mode === "high");
    localStorage.setItem("contrast", mode);
  };

  return {
    dark,
    toggle: () => setDark((v) => !v),
    fontSize,
    setFontSize,
    contrast,
    setContrast,
  };
}
