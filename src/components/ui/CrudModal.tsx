import type { ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export default function CrudModal({
  titulo,
  descricao,
  children,
  salvando,
  erro,
  onClose,
  onSave,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
  salvando: boolean;
  erro?: string;
  onClose: () => void;
  onSave: () => void;
}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5 dark:bg-gray-900"><div><h2 className="font-semibold text-gray-900">{titulo}</h2>{descricao && <p className="mt-1 text-xs text-gray-500">{descricao}</p>}</div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button></div><div className="p-6">{children}{erro && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p>}</div><div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4"><button type="button" onClick={onClose} className="btn-secondary">Cancelar</button><button type="button" onClick={onSave} disabled={salvando} className="btn-primary flex items-center gap-2">{salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button></div></div></div>;
}
