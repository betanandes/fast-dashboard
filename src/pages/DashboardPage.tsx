import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  FileText,
  Search,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import KPICard from "../components/ui/KPICard";
import Semaforo from "../components/ui/Semaforo";
import {
  buscarKPIs,
  buscarResumoPorMes,
  buscarPorCategoria,
  buscarTopFornecedores,
  buscarPagamentos,
  buscarMesesDisponiveis,
  marcarComoPago,
  type FiltrosPagamentos,
} from "../services/dashboard";
import type { Pagamento } from "../types/database";

function fmtMoeda(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtCompleto(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtData(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function statusBadge(status: string) {
  if (status === "vencido")
    return <span className="badge badge-danger">Vencido</span>;
  if (status === "pago") return <span className="badge badge-ok">Pago</span>;
  return <span className="badge badge-info">A vencer</span>;
}

const CORES = [
  "#2563eb",
  "#64748b",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#94a3b8",
];
const POR_PAGINA = 10;

// Agrupa categorias pequenas em "Outros"

// Tooltip customizado para o gráfico de rosca
const TooltipCategoria = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { total: number } }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const totalGeral = Number(item.payload?.total ?? 0);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-900 mb-1">{item.name}</p>
      <p className="text-gray-600">{fmtCompleto(item.value)}</p>
      <p className="text-gray-400">
        {totalGeral > 0 ? ((item.value / totalGeral) * 100).toFixed(1) : 0}% do
        total
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const tickColor = "#9ca3af";
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    color: "#111827",
  };

  const [kpis, setKpis] = useState<Awaited<
    ReturnType<typeof buscarKPIs>
  > | null>(null);
  const [porMes, setPorMes] = useState<
    Awaited<ReturnType<typeof buscarResumoPorMes>>
  >([]);
  const [porCategoria, setPorCategoria] = useState<
    { categoria: string; total: number }[]
  >([]);
  const [totalCategoria, setTotalCategoria] = useState(0);
  const [fornecedores, setFornecedores] = useState<
    Awaited<ReturnType<typeof buscarTopFornecedores>>
  >([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<FiltrosPagamentos>({});
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTabela, setLoadingTabela] = useState(false);
  const [pagando, setPagando] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [k, m, c, f, p, ms] = await Promise.all([
          buscarKPIs(),
          buscarResumoPorMes(),
          buscarPorCategoria(),
          buscarTopFornecedores(),
          buscarPagamentos(),
          buscarMesesDisponiveis(),
        ]);
        setKpis(k);
        setPorMes(m);
        setPorCategoria(c);
        setTotalCategoria(c.reduce((s, d) => s + d.total, 0));
        setFornecedores(f);
        setPagamentos(p as Pagamento[]);
        setMeses(ms as string[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const filtrarTabela = useCallback(async (f: FiltrosPagamentos, b: string) => {
    setLoadingTabela(true);
    setPagina(1); // reseta paginação ao filtrar
    try {
      const p = await buscarPagamentos({ ...f, busca: b });
      setPagamentos(p as Pagamento[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTabela(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => filtrarTabela(filtros, busca), 300);
    return () => clearTimeout(t);
  }, [filtros, busca, filtrarTabela]);

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

  const emDia = kpis
    ? kpis.total_lancamentos - kpis.count_vencidos - kpis.count_proximos7
    : 0;

  // Paginação da tabela
  const totalPaginas = Math.ceil(pagamentos.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = pagamentos.slice(inicio, inicio + POR_PAGINA);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando dados...</span>
        </div>
      </div>
    );

  return (
    <div className="page space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Visão geral</h1>
          <p className="page-subtitle">Controle de pagamentos TI</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Alertas */}
      {kpis && kpis.count_vencidos > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{kpis.count_vencidos} pagamento(s) em atraso</strong> —
            total de {fmtCompleto(kpis.total_vencido)}.
          </p>
        </div>
      )}
      {kpis && kpis.count_proximos7 > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>
              {kpis.count_proximos7} vencimento(s) nos próximos 7 dias
            </strong>{" "}
            — {fmtCompleto(kpis.total_proximos7)} a pagar.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total acumulado"
          value={fmtMoeda(kpis?.total_geral ?? 0)}
          sub={`${kpis?.total_lancamentos ?? 0} lançamentos`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          label="Em atraso"
          value={fmtMoeda(kpis?.total_vencido ?? 0)}
          sub={`${kpis?.count_vencidos ?? 0} pagamento(s)`}
          icon={<AlertCircle className="w-5 h-5" />}
          variant={kpis && kpis.count_vencidos > 0 ? "danger" : "default"}
        />
        <KPICard
          label="Vence em 7 dias"
          value={fmtMoeda(kpis?.total_proximos7 ?? 0)}
          sub={`${kpis?.count_proximos7 ?? 0} pagamento(s)`}
          icon={<Clock className="w-5 h-5" />}
          variant={kpis && kpis.count_proximos7 > 0 ? "warning" : "default"}
        />
        <KPICard
          label="Total de lançamentos"
          value={String(kpis?.total_lancamentos ?? 0)}
          sub="registros importados"
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Gráficos linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Despesa por mês
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={porMes}
              barSize={28}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="mes_referencia"
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v) => v?.substring(0, 3) ?? ""}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [fmtCompleto(Number(v ?? 0)), "Total"]}
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="total_valor" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Semaforo
          vencidos={kpis?.count_vencidos ?? 0}
          proximos7={kpis?.count_proximos7 ?? 0}
          emDia={emDia}
          valorVencido={kpis?.total_vencido ?? 0}
          valorProximos7={kpis?.total_proximos7 ?? 0}
        />
      </div>

      {/* Gráficos linha 2 — categorias ocupa col-span-2, fornecedores col-span-1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Categorias — lista completa para o gestor */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Por categoria</h3>
            <span className="text-xs text-gray-400">
              {porCategoria.length} categorias
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            {/* Coluna esquerda — rosca */}
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={porCategoria}
                    dataKey="total"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {porCategoria.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CORES[i % CORES.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipCategoria />} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-1">
                Passe o mouse nas fatias
              </p>
            </div>
            {/* Coluna direita — lista com barras, scroll se necessário */}
            <div className="overflow-y-auto max-h-52 space-y-2 pr-1">
              {porCategoria.map((d, i) => {
                const pct =
                  totalCategoria > 0 ? (d.total / totalCategoria) * 100 : 0;
                const nome = d.categoria.replace(/^\d[\d.]+\s*-\s*/, "").trim();
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        className="w-2 h-2 rounded-sm shrink-0"
                        style={{ backgroundColor: CORES[i % CORES.length] }}
                      />
                      <span
                        className="text-xs text-gray-700 flex-1 truncate"
                        title={d.categoria}
                      >
                        {nome}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="ml-4 bg-gray-100 rounded-full h-1 mb-1">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CORES[i % CORES.length],
                        }}
                      />
                    </div>
                    <p className="ml-4 text-[10px] text-gray-400">
                      {fmtCompleto(d.total)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top fornecedores */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Top fornecedores
          </h3>
          <div className="space-y-3">
            {fornecedores.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 shrink-0 text-right">
                  {i + 1}
                </span>
                <span
                  className="text-sm text-gray-700 flex-1 truncate min-w-0"
                  title={f.fornecedor}
                >
                  {f.fornecedor}
                </span>
                <div className="w-20 bg-gray-100 rounded-full h-1.5 shrink-0">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{
                      width: `${Math.min(Number(f.percentual ?? 0), 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-900 w-14 text-right shrink-0">
                  {fmtMoeda(Number(f.total_valor))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela com paginação */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-medium text-gray-900 flex-1">
            Pagamentos
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar fornecedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input pl-8 w-44 text-xs py-1.5"
            />
          </div>
          <select
            className="input w-36 text-xs py-1.5"
            value={filtros.mes ?? "todos"}
            onChange={(e) => setFiltros((f) => ({ ...f, mes: e.target.value }))}
          >
            <option value="todos">Todos os meses</option>
            {meses.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="input w-28 text-xs py-1.5"
            value={filtros.status ?? "todos"}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="todos">Todos</option>
            <option value="vencido">Vencido</option>
            <option value="a_vencer">A vencer</option>
            <option value="pago">Pago</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loadingTabela ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Filtrando...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                    Vencimento
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                    Fornecedor
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                    Mês
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                    Categoria
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">
                    Valor
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginaAtual.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                ) : (
                  paginaAtual.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {fmtData(p.data_vencimento)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-gray-900 max-w-[200px] truncate font-medium"
                        title={p.fornecedor}
                      >
                        {p.fornecedor}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                        {p.mes_referencia}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[140px] truncate">
                        {p.categoria.replace(/^\d[\d.]+\s*-\s*/, "")}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {fmtCompleto(p.valor)}
                      </td>
                      <td className="px-4 py-2.5">{statusBadge(p.status)}</td>
                      <td className="px-4 py-2.5">
                        {p.status !== "pago" ? (
                          <button
                            onClick={() => handlePagar(p.id)}
                            disabled={pagando === p.id}
                            className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {pagando === p.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            Pago
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Pago
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {!loadingTabela && totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 flex-wrap gap-3">
            <p className="text-xs text-gray-500">
              Mostrando {inicio + 1}–
              {Math.min(inicio + POR_PAGINA, pagamentos.length)} de{" "}
              {pagamentos.length} registros
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
                    n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1,
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
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
