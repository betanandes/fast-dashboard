import { ChartNoAxesCombined, LayoutGrid, List } from "lucide-react";
import type { DataLayout } from "../../hooks/useDataLayout";

const OPCOES = [
  { valor: "dashboard" as const, label: "Dashboard", icon: ChartNoAxesCombined },
  { valor: "cards" as const, label: "Cards", icon: LayoutGrid },
  { valor: "list" as const, label: "Lista", icon: List },
];

export default function DataLayoutSwitcher({
  value,
  onChange,
}: {
  value: DataLayout;
  onChange: (layout: DataLayout) => void;
}) {
  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900" aria-label="Modo de visualização">
      {OPCOES.map(({ valor, label, icon: Icon }) => (
        <button
          key={valor}
          type="button"
          onClick={() => onChange(valor)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === valor
              ? "bg-brand-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
          title={`Visualizar como ${label.toLowerCase()}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
