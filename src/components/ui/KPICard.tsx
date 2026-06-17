import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  variant?: "default" | "danger" | "warning" | "success";
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
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg[variant]}`}
      >
        <span className={iconColor[variant]}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-xl font-semibold truncate ${valueColor[variant]}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
