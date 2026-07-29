import { createContext, useContext } from "react";

export interface ConfirmOptions {
  titulo: string;
  descricao: string;
  detalhe?: string;
  confirmarTexto?: string;
  onConfirm: () => void | Promise<void>;
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmDialogContext = createContext<ConfirmFunction | null>(null);

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error("useConfirmDialog deve ser usado dentro de ConfirmDialogProvider.");
  return context;
}
