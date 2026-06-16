interface SemaforoProps {
  vencidos: number;
  proximos7: number;
  emDia: number;
  valorVencido: number;
  valorProximos7: number;
}

function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Semaforo({
  vencidos,
  proximos7,
  emDia,
  valorVencido,
  valorProximos7,
}: SemaforoProps) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        Semáforo de vencimentos
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">Vencidos</p>
            <p className="text-xs text-gray-400">{fmtMoeda(valorVencido)}</p>
          </div>
          <span className="text-sm font-semibold text-red-600">{vencidos}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">Vencem em 7 dias</p>
            <p className="text-xs text-gray-400">{fmtMoeda(valorProximos7)}</p>
          </div>
          <span className="text-sm font-semibold text-amber-600">
            {proximos7}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">Em dia</p>
            <p className="text-xs text-gray-400">Vencimento {">"} 7 dias</p>
          </div>
          <span className="text-sm font-semibold text-green-600">{emDia}</span>
        </div>
      </div>
    </div>
  );
}
