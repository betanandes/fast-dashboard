import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { buscarPagamentos, marcarComoPago } from "../services/dashboard";
import type { Pagamento } from "../types/database";

function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function diasParaVencer(data: string | null): number | null {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vcto = new Date(data);
  return Math.ceil((vcto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function TagDias({ dias, status }: { dias: number | null; status: string }) {
  if (status === "pago") return <span className="badge badge-ok">Pago</span>;
  if (status === "vencido" || (dias !== null && dias < 0)) {
    const d = Math.abs(dias ?? 0);
    return <span className="badge badge-danger">{d}d em atraso</span>;
  }
  if (dias === 0) return <span className="badge badge-danger">Vence hoje</span>;
  if (dias !== null && dias <= 3)
    return <span className="badge badge-danger">Vence em {dias}d</span>;
  if (dias !== null && dias <= 7)
    return <span className="badge badge-warn">Vence em {dias}d</span>;
  return <span className="badge badge-info">Vence em {dias}d</span>;
}

export default function VencimentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<
    "todos" | "vencidos" | "proximos" | "pago"
  >("todos");

  async function carregar() {
    setLoading(true);
    try {
      const data = await buscarPagamentos();
      // Ordena: vencidos primeiro, depois por data de vencimento
      const ordenado = [...(data as Pagamento[])].sort((a, b) => {
        if (a.status === "vencido" && b.status !== "vencido") return -1;
        if (b.status === "vencido" && a.status !== "vencido") return 1;
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return a.data_vencimento.localeCompare(b.data_vencimento);
      });
      setPagamentos(ordenado);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handlePagar(id: string) {
    setPagando(id);
    try {
      await marcarComoPago(id);
      setPagamentos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "pago" } : p)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPagando(null);
    }
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7dias = new Date(hoje);
  em7dias.setDate(hoje.getDate() + 7);

  const filtrados = pagamentos.filter((p) => {
    if (filtro === "vencidos") return p.status === "vencido";
    if (filtro === "pago") return p.status === "pago";
    if (filtro === "proximos") {
      if (!p.data_vencimento || p.status !== "a_vencer") return false;
      const d = new Date(p.data_vencimento);
      return d >= hoje && d <= em7dias;
    }
    return true;
  });

  const totalVencidos = pagamentos.filter((p) => p.status === "vencido").length;
  const totalProximos = pagamentos.filter((p) => {
    if (!p.data_vencimento || p.status !== "a_vencer") return false;
    const d = new Date(p.data_vencimento);
    return d >= hoje && d <= em7dias;
  }).length;
  const totalPagos = pagamentos.filter((p) => p.status === "pago").length;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Vencimentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Acompanhe e confirme pagamentos
          </p>
        </div>
        <button
          onClick={carregar}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          {
            key: "todos",
            label: "Todos",
            count: pagamentos.length,
            icon: <CalendarDays className="w-3.5 h-3.5" />,
          },
          {
            key: "vencidos",
            label: "Em atraso",
            count: totalVencidos,
            icon: <AlertCircle className="w-3.5 h-3.5" />,
          },
          {
            key: "proximos",
            label: "Próximos 7 dias",
            count: totalProximos,
            icon: <Clock className="w-3.5 h-3.5" />,
          },
          {
            key: "pago",
            label: "Pagos",
            count: totalPagos,
            icon: <CheckCircle className="w-3.5 h-3.5" />,
          },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key as typeof filtro)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.key
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.icon}
            {f.label}
            <span
              className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                filtro === f.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                  Vencimento
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                  Fornecedor
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                  Prazo
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">
                  Valor
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-400 text-sm"
                  >
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => {
                  const dias = diasParaVencer(p.data_vencimento);
                  const isPago = p.status === "pago";
                  return (
                    <tr
                      key={p.id}
                      className={`border-t border-gray-50 ${
                        p.status === "vencido"
                          ? "bg-red-50/30"
                          : dias !== null && dias <= 7 && !isPago
                            ? "bg-amber-50/30"
                            : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {fmtData(p.data_vencimento)}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p
                          className="text-gray-900 truncate"
                          title={p.fornecedor}
                        >
                          {p.fornecedor}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {p.categoria.replace(/^\d[\d.]+\s*-\s*/, "")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <TagDias dias={dias} status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {fmtMoeda(p.valor)}
                      </td>
                      <td className="px-4 py-3">
                        {!isPago ? (
                          <button
                            onClick={() => handlePagar(p.id)}
                            disabled={pagando === p.id}
                            className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {pagando === p.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Marcar pago
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />{" "}
                            Pago
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
