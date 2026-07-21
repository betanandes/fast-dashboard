import { useState } from "react";

export type DataLayout = "dashboard" | "cards" | "list";

const LAYOUTS: DataLayout[] = ["dashboard", "cards", "list"];

export function useDataLayout(chave: string, padrao: DataLayout = "dashboard") {
  const [layout, setLayoutState] = useState<DataLayout>(() => {
    const salvo = localStorage.getItem(`layout:${chave}`);
    return LAYOUTS.includes(salvo as DataLayout) ? (salvo as DataLayout) : padrao;
  });

  const setLayout = (novoLayout: DataLayout) => {
    setLayoutState(novoLayout);
    localStorage.setItem(`layout:${chave}`, novoLayout);
  };

  return [layout, setLayout] as const;
}
