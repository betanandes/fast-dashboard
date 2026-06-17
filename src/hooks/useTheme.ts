import { useEffect, useState } from "react";

function getInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    if (!saved) return false; // padrão: claro
    return saved === "dark";
  } catch {
    return false;
  }
}

// Aplica imediatamente antes do React montar — evita flash
const initialDark = getInitialTheme();
document.documentElement.classList.toggle("dark", initialDark);

export function useTheme() {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}
