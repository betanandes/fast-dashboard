import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
    return (
      <span className="badge badge-danger">{Math.abs(dias ?? 0)}d atraso</span>
    );
  }
  if (dias === 0) return <span className="badge badge-danger">Hoje</span>;
  if (dias !== null && dias <= 3)
    return <span className="badge badge-danger">{dias}d</span>;
  if (dias !== null && dias <= 7)
    return <span className="badge badge-warn">{dias}d</span>;
  return <span className="badge badge-info">{dias}d</span>;
}

const POR_PAGINA = 10;

export default function VencimentosPage() {
  const [todos, setTodos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<
    "todos" | "vencidos" | "proximos" | "pago"
  >("todos");
  const [pagina, setPagina] = useState(1);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7dias = new Date(hoje);
  em7dias.setDate(hoje.getDate() + 7);

  async function carregar() {
    setLoading(true);
    try {
      const data = await buscarPagamentos();
      const ordenado = [...(data as Pagamento[])].sort((a, b) => {
        if (a.status === "vencido" && b.status !== "vencido") return -1;
        if (b.status === "vencido" && a.status !== "vencido") return 1;
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return a.data_vencimento.localeCompare(b.data_vencimento);
      });
      setTodos(ordenado);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Reseta paginação ao trocar filtro
  useEffect(() => {
    setPagina(1);
  }, [filtro]);

  async function handlePagar(id: string) {
    setPagando(id);
    try {
      await marcarComoPago(id);
      setTodos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "pago" } : p)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setPagando(null);
    }
  }

  const filtrados = todos.filter((p) => {
    if (filtro === "vencidos") return p.status === "vencido";
    if (filtro === "pago") return p.status === "pago";
    if (filtro === "proximos") {
      if (!p.data_vencimento || p.status !== "a_vencer") return false;
      const d = new Date(p.data_vencimento);
      return d >= hoje && d <= em7dias;
    }
    return true;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = filtrados.slice(inicio, inicio + POR_PAGINA);

  const contagens = {
    todos: todos.length,
    vencidos: todos.filter((p) => p.status === "vencido").length,
    proximos: todos.filter((p) => {
      if (!p.data_vencimento || p.status !== "a_vencer") return false;
      const d = new Date(p.data_vencimento);
      return d >= hoje && d <= em7dias;
    }).length,
    pago: todos.filter((p) => p.status === "pago").length,
  };

  const FILTROS = [
    {
      key: "todos",
      label: "Todos",
      icon: <CalendarDays className="w-3.5 h-3.5" />,
    },
    {
      key: "vencidos",
      label: "Em atraso",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    {
      key: "proximos",
      label: "Próximos 7 dias",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      key: "pago",
      label: "Pagos",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
    },
  ] as const;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vencimentos</h1>
          <p className="page-subtitle">Acompanhe e confirme pagamentos</p>
        </div>
        <button
          onClick={carregar}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              filtro === f.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.icon}
            {f.label}
            <span
              className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filtro === f.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {contagens[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                      Vencimento
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      Fornecedor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                      Prazo
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      Categoria
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                      Valor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginaAtual.map((p) => {
                    const dias = diasParaVencer(p.data_vencimento);
                    const isPago = p.status === "pago";
                    const isAtrasado = p.status === "vencido";
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-gray-50 ${
                          isAtrasado
                            ? "bg-red-50/30"
                            : dias !== null && dias <= 7 && !isPago
                              ? "bg-amber-50/30"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">
                          {fmtData(p.data_vencimento)}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p
                            className="text-gray-900 font-medium truncate text-sm"
                            title={p.fornecedor}
                          >
                            {p.fornecedor}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {p.categoria.replace(/^\d[\d.]+\s*-\s*/, "")}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <TagDias dias={dias} status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                          {p.mes_referencia}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {fmtMoeda(p.valor)}
                        </td>
                        <td className="px-4 py-3">
                          {!isPago ? (
                            <button
                              onClick={() => handlePagar(p.id)}
                              disabled={pagando === p.id}
                              className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {pagando === p.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Marcar pago
                            </button>
                          ) : (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Pago
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Mostrando {inicio + 1}–
                  {Math.min(inicio + POR_PAGINA, filtrados.length)} de{" "}
                  {filtrados.length} registros
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 ||
                        n === totalPaginas ||
                        Math.abs(n - pagina) <= 1,
                    )
                    .reduce<(number | "...")[]>((acc, n, i, arr) => {
                      if (i > 0 && (n as number) - (arr[i - 1] as number) > 1)
                        acc.push("...");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "..." ? (
                        <span
                          key={`e${i}`}
                          className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPagina(n as number)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                            pagina === n
                              ? "bg-brand-600 text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {n}
                        </button>
                      ),
                    )}

                  <button
                    onClick={() =>
                      setPagina((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={pagina === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
