import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  variant?: "default" | "danger" | "warning" | "success";
  // Para leitores de tela — descrição completa opcional
  // Ex: "Total acumulado: R$ 493k — 141 lançamentos"
  ariaLabel?: string;
}

const valueColor = {
  default: "text-gray-900",
  danger: "text-red-600",
  warning: "text-amber-600",
  success: "text-green-600",
};
const iconBg = {
  default: "bg-brand-50",
  danger: "bg-red-50",
  warning: "bg-amber-50",
  success: "bg-green-50",
};
const iconColor = {
  default: "text-brand-600",
  danger: "text-red-500",
  warning: "text-amber-500",
  success: "text-green-500",
};

export default function KPICard({
  label,
  value,
  sub,
  icon,
  variant = "default",
  ariaLabel,
}: KPICardProps) {
  // Se não passar ariaLabel, monta automaticamente com label + value + sub
  const descricao = ariaLabel ?? [label, value, sub].filter(Boolean).join(": ");

  return (
    // article — semanticamente um item de informação independente
    // aria-label — leitores de tela leem a descrição completa de uma vez
    <article
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200"
      aria-label={descricao}
    >
      {/* Ícone decorativo — aria-hidden pois o aria-label do article já descreve tudo */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg[variant]}`}
        aria-hidden="true"
      >
        <span className={iconColor[variant]}>{icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        {/* Label visível — aria-hidden porque o article já tem aria-label */}
        <p className="text-xs text-gray-500 mb-1" aria-hidden="true">
          {label}
        </p>

        {/* Valor principal */}
        <p
          className={`text-xl font-semibold truncate ${valueColor[variant]}`}
          aria-hidden="true"
        >
          {value}
        </p>

        {/* Subtítulo */}
        {sub && (
          <p className="text-xs text-gray-400 mt-0.5" aria-hidden="true">
            {sub}
          </p>
        )}
      </div>
    </article>
  );
}
