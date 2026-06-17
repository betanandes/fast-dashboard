import { useEffect, useState } from "react";
import {
  RefreshCw,
  Building2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  buscarTodosFornecedores,
  buscarPagamentos,
} from "../services/dashboard";
import type { Pagamento } from "../types/database";

function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtMoedaK(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return fmtMoeda(v);
}

interface FornecedorDetalhe {
  fornecedor: string;
  total_valor: number;
  percentual: number;
  total_lancamentos: number;
  vencidos: number;
  pagos: number;
  a_vencer: number;
}

const POR_PAGINA = 10;

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<FornecedorDetalhe[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [todos, todosP] = await Promise.all([
          buscarTodosFornecedores(),
          buscarPagamentos(),
        ]);
        const enriquecido = todos.map((f) => {
          const pgts = (todosP as Pagamento[]).filter(
            (p) => p.fornecedor === f.fornecedor,
          );
          return {
            fornecedor: f.fornecedor,
            total_valor: Number(f.total_valor),
            percentual: Number(f.percentual),
            total_lancamentos: Number(f.total_lancamentos),
            vencidos: pgts.filter((p) => p.status === "vencido").length,
            pagos: pgts.filter((p) => p.status === "pago").length,
            a_vencer: pgts.filter((p) => p.status === "a_vencer").length,
          };
        });
        setFornecedores(enriquecido);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  async function verDetalhe(fornecedor: string) {
    setSelecionado(fornecedor);
    setLoadingDetalhe(true);
    try {
      const data = await buscarPagamentos({ busca: fornecedor });
      const exatos = (data as Pagamento[]).filter(
        (p) => p.fornecedor === fornecedor,
      );
      setPagamentos(exatos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetalhe(false);
    }
  }

  const totalGeral = fornecedores.reduce((s, f) => s + f.total_valor, 0);
  const maiorValor = fornecedores[0]?.total_valor ?? 1;
  const fSelecionado = fornecedores.find((f) => f.fornecedor === selecionado);

  // Paginação do ranking
  const totalPaginas = Math.ceil(fornecedores.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginaAtual = fornecedores.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="page space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fornecedores</h1>
          <p className="page-subtitle">
            Ranking por valor total contratado • {fornecedores.length}{" "}
            fornecedores
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : (
        <>
          {/* Ranking com paginação */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Ranking de fornecedores
              </h3>
              <span className="text-xs text-gray-400">
                {inicio + 1}–
                {Math.min(inicio + POR_PAGINA, fornecedores.length)} de{" "}
                {fornecedores.length}
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {paginaAtual.map((f, idx) => {
                const posicao = inicio + idx + 1;
                return (
                  <button
                    key={f.fornecedor}
                    onClick={() => verDetalhe(f.fornecedor)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      selecionado === f.fornecedor ? "bg-brand-50" : ""
                    }`}
                  >
                    {/* Posição */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                        posicao === 1
                          ? "bg-amber-100 text-amber-700"
                          : posicao === 2
                            ? "bg-gray-100 text-gray-600"
                            : posicao === 3
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {posicao}
                    </div>

                    {/* Nome e barra */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {f.fornecedor}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-brand-500"
                            style={{
                              width: `${(f.total_valor / maiorValor) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {f.percentual}%
                        </span>
                      </div>
                    </div>

                    {/* Valor e status */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {fmtMoedaK(f.total_valor)}
                      </p>
                      <div className="flex gap-2 mt-0.5 justify-end">
                        {f.vencidos > 0 && (
                          <span className="text-xs text-red-500">
                            {f.vencidos} venc.
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {f.total_lancamentos} lanç.
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Mostrando {inicio + 1}–
                  {Math.min(inicio + POR_PAGINA, fornecedores.length)} de{" "}
                  {fornecedores.length} fornecedores
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setPagina((p) => Math.max(1, p - 1));
                      setSelecionado(null);
                    }}
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
                          onClick={() => {
                            setPagina(n as number);
                            setSelecionado(null);
                          }}
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
                    onClick={() => {
                      setPagina((p) => Math.min(totalPaginas, p + 1));
                      setSelecionado(null);
                    }}
                    disabled={pagina === totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Parte inferior — detalhe + indicadores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Detalhe do fornecedor selecionado */}
            <div className="lg:col-span-2 card overflow-hidden">
              {!selecionado ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Building2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">
                    Selecione um fornecedor acima para ver os detalhes
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-4">
                      <Building2 className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {selecionado}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fSelecionado?.total_lancamentos} lançamentos •{" "}
                          {fmtMoeda(fSelecionado?.total_valor ?? 0)} total
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-lg p-2.5">
                        <p className="text-xs text-red-500">Vencidos</p>
                        <p className="text-lg font-semibold text-red-700">
                          {fSelecionado?.vencidos}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2.5">
                        <p className="text-xs text-amber-500">A vencer</p>
                        <p className="text-lg font-semibold text-amber-700">
                          {fSelecionado?.a_vencer}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2.5">
                        <p className="text-xs text-green-500">Pagos</p>
                        <p className="text-lg font-semibold text-green-700">
                          {fSelecionado?.pagos}
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingDetalhe ? (
                    <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Carregando...</span>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                              Vencimento
                            </th>
                            <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                              Mês
                            </th>
                            <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                              NF
                            </th>
                            <th className="text-right px-4 py-2.5 font-medium text-gray-500">
                              Valor
                            </th>
                            <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {pagamentos.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-2.5 text-gray-600">
                                {p.data_vencimento
                                  ? p.data_vencimento
                                      .split("-")
                                      .reverse()
                                      .join("/")
                                  : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">
                                {p.mes_referencia}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">
                                {p.numero_nf ?? "—"}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                {fmtMoeda(p.valor)}
                              </td>
                              <td className="px-4 py-2.5">
                                {p.status === "vencido" && (
                                  <span className="badge badge-danger">
                                    Vencido
                                  </span>
                                )}
                                {p.status === "pago" && (
                                  <span className="badge badge-ok">Pago</span>
                                )}
                                {p.status === "a_vencer" && (
                                  <span className="badge badge-info">
                                    A vencer
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cards — indicadores complementares */}
            <div className="space-y-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-medium text-gray-500">
                    Total contratado
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {fmtMoedaK(totalGeral)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fornecedores.length} fornecedores analisados
                </p>
              </div>

              <div className="card p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Maior concentração
                </p>
                {fornecedores[0] && (
                  <>
                    <p
                      className="text-sm font-semibold text-gray-900 truncate"
                      title={fornecedores[0].fornecedor}
                    >
                      {fornecedores[0].fornecedor}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Representa{" "}
                      <span className="font-semibold text-amber-600">
                        {fornecedores[0].percentual}%
                      </span>{" "}
                      do total
                    </p>
                    {fornecedores[0].percentual > 20 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠ Risco de dependência elevado
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="card p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Fornecedores em atraso
                </p>
                <p className="text-2xl font-semibold text-red-600">
                  {fornecedores.filter((f) => f.vencidos > 0).length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  de {fornecedores.length} têm pagamentos vencidos
                </p>
                <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-red-500"
                    style={{
                      width: `${(fornecedores.filter((f) => f.vencidos > 0).length / fornecedores.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="card p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Total vencido (todos forn.)
                </p>
                <p className="text-xl font-semibold text-red-600">
                  {fmtMoedaK(
                    fornecedores.reduce(
                      (s, f) => s + (f.vencidos > 0 ? f.total_valor : 0),
                      0,
                    ),
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  em pagamentos em atraso
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
