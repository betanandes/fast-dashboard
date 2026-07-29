import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import {
  ConfirmDialogContext,
  type ConfirmFunction,
  type ConfirmOptions,
} from "../../hooks/useConfirmDialog";

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const resolver = useRef<((resultado: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmFunction>((novasOptions) => {
    resolver.current?.(false);
    setErro("");
    setProcessando(false);
    setOptions(novasOptions);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const fechar = useCallback((resultado: boolean) => {
    if (processando) return;
    resolver.current?.(resultado);
    resolver.current = null;
    setOptions(null);
    setErro("");
  }, [processando]);

  useEffect(() => {
    if (!options) return;
    const aoPressionar = (event: KeyboardEvent) => {
      if (event.key === "Escape") fechar(false);
    };
    document.addEventListener("keydown", aoPressionar);
    return () => document.removeEventListener("keydown", aoPressionar);
  }, [fechar, options]);

  const executar = async () => {
    if (!options || processando) return;
    setProcessando(true);
    setErro("");
    try {
      await options.onConfirm();
      resolver.current?.(true);
      resolver.current = null;
      setOptions(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível concluir a exclusão.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <ConfirmDialogContext.Provider value={confirmar}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fechar(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start gap-4 px-6 pb-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">
                  {options.titulo}
                </h2>
                <p id="confirm-dialog-description" className="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {options.descricao}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fechar(false)}
                disabled={processando}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {options.detalhe && (
              <div className="mx-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {options.detalhe}
              </div>
            )}

            {erro && (
              <p className="mx-6 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {erro}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => fechar(false)}
                disabled={processando}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void executar()}
                disabled={processando}
                autoFocus
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {processando ? "Excluindo..." : options.confirmarTexto ?? "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
