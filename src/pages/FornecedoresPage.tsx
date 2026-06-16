import { useEffect, useState } from "react";
import { RefreshCw, Building2, TrendingUp, FileText } from "lucide-react";
import { buscarTopFornecedores, buscarPagamentos } from "../services/dashboard";
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

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<FornecedorDetalhe[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [tops, todos] = await Promise.all([
          buscarTopFornecedores(),
          buscarPagamentos(),
        ]);

        // Enriquece com contagem de status
        const enriquecido = tops.map((f) => {
          const pgts = (todos as Pagamento[]).filter(
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

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fornecedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ranking por valor total contratado
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-5">
          {/* Lista de fornecedores */}
          <div className="col-span-2 space-y-2">
            {fornecedores.map((f, i) => (
              <button
                key={f.fornecedor}
                onClick={() => verDetalhe(f.fornecedor)}
                className={`w-full text-left card p-4 transition-all hover:shadow-md ${
                  selecionado === f.fornecedor ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {f.fornecedor}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-gray-900">
                        {fmtMoedaK(f.total_valor)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {f.percentual}% do total
                      </span>
                    </div>
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-brand-500"
                        style={{
                          width: `${(f.total_valor / maiorValor) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex gap-3 mt-2">
                      {f.vencidos > 0 && (
                        <span className="text-xs text-red-600">
                          {f.vencidos} vencido(s)
                        </span>
                      )}
                      {f.pagos > 0 && (
                        <span className="text-xs text-green-600">
                          {f.pagos} pago(s)
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {f.total_lancamentos} lançamentos
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Total geral */}
            <div className="card p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Total geral (top fornecedores)
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {fmtMoeda(totalGeral)}
              </p>
            </div>
          </div>

          {/* Detalhe do fornecedor */}
          <div className="col-span-3">
            {!selecionado ? (
              <div className="card p-12 text-center h-full flex flex-col items-center justify-center">
                <Building2 className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">
                  Selecione um fornecedor para ver os detalhes
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selecionado}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {
                          fornecedores.find((f) => f.fornecedor === selecionado)
                            ?.total_lancamentos
                        }{" "}
                        lançamentos •{" "}
                        {fmtMoeda(
                          fornecedores.find((f) => f.fornecedor === selecionado)
                            ?.total_valor ?? 0,
                        )}{" "}
                        total
                      </p>
                    </div>
                  </div>

                  {/* Mini KPIs do fornecedor */}
                  {(() => {
                    const f = fornecedores.find(
                      (x) => x.fornecedor === selecionado,
                    );
                    if (!f) return null;
                    return (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-red-50 rounded-lg p-2.5">
                          <p className="text-xs text-red-500">Vencidos</p>
                          <p className="text-lg font-semibold text-red-700">
                            {f.vencidos}
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2.5">
                          <p className="text-xs text-amber-500">A vencer</p>
                          <p className="text-lg font-semibold text-amber-700">
                            {f.a_vencer}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2.5">
                          <p className="text-xs text-green-500">Pagos</p>
                          <p className="text-lg font-semibold text-green-700">
                            {f.pagos}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {loadingDetalhe ? (
                  <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando lançamentos...</span>
                  </div>
                ) : pagamentos.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">
                      Nenhum lançamento encontrado
                    </span>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[480px]">
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
                      <tbody>
                        {pagamentos.map((p) => (
                          <tr
                            key={p.id}
                            className="border-t border-gray-50 hover:bg-gray-50"
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
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
