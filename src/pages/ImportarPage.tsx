import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  Clock,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import {
  previewExcel,
  confirmarImportacao,
  type ResultadoPreview,
  type ResultadoImportacao,
} from "../services/importacao";

type Etapa = "upload" | "preview" | "salvando" | "sucesso" | "erro";

function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtData(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const ETAPAS = [
  { key: "upload", label: "1. Arquivo" },
  { key: "preview", label: "2. Conferir" },
  { key: "sucesso", label: "3. Concluído" },
] as const;

export default function ImportarPage() {
  const [etapa, setEtapa] = useState<Etapa>("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ResultadoPreview | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processarArquivo = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setErro("Formato inválido. Envie um arquivo .xlsx ou .xls");
      setEtapa("erro");
      return;
    }
    setArquivo(file);
    setErro(null);
    setEtapa("preview");
    try {
      const result = await previewExcel(file);
      setPreview(result);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao processar arquivo");
      setEtapa("erro");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processarArquivo(file);
    },
    [processarArquivo],
  );

  const confirmar = async () => {
    if (!arquivo) return;
    setEtapa("salvando");
    try {
      const res = await confirmarImportacao(arquivo);
      setResultado(res);
      setEtapa("sucesso");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
      setEtapa("erro");
    }
  };

  const reiniciar = () => {
    setEtapa("upload");
    setArquivo(null);
    setPreview(null);
    setResultado(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 rounded-2xl mb-4">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
          </div>
          <h1 className="page-title">Importar planilha</h1>
          <p className="page-subtitle mt-1">
            Envie a planilha DRE_TI.xlsx para atualizar os dados do dashboard
          </p>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
          {ETAPAS.map((e, i) => {
            const ativo =
              etapa === e.key || (etapa === "salvando" && e.key === "preview");
            const concluido =
              (e.key === "upload" &&
                ["preview", "salvando", "sucesso"].includes(etapa)) ||
              (e.key === "preview" && etapa === "sucesso");
            return (
              <div key={e.key} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                <span
                  className={`font-medium transition-colors ${
                    concluido
                      ? "text-green-600"
                      : ativo
                        ? "text-brand-600"
                        : "text-gray-400"
                  }`}
                >
                  {concluido ? "✓ " : ""}
                  {e.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* UPLOAD */}
        {etapa === "upload" && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
              ${
                dragOver
                  ? "border-brand-400 bg-brand-50 scale-[1.01]"
                  : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processarArquivo(f);
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? "bg-brand-100" : "bg-gray-100"}`}
              >
                <Upload
                  className={`w-7 h-7 ${dragOver ? "text-brand-600" : "text-gray-400"}`}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {dragOver
                    ? "Solte o arquivo aqui"
                    : "Arraste o arquivo ou clique para selecionar"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Suporte para .xlsx e .xls • Aba BASE CONSOLIDADA
                </p>
              </div>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Selecionar arquivo
              </button>
            </div>
          </div>
        )}

        {/* CARREGANDO PREVIEW */}
        {etapa === "preview" && !preview && (
          <div className="card p-16 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-900">
              Processando {arquivo?.name}...
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Lendo e validando os dados da planilha
            </p>
          </div>
        )}

        {/* PREVIEW */}
        {etapa === "preview" && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Linhas lidas",
                  value: preview.total_lido,
                  color: "text-gray-900",
                },
                {
                  label: "Válidos",
                  value: preview.total_valido,
                  color: "text-green-600",
                },
                {
                  label: "Total em R$",
                  value: fmtMoeda(preview.resumo.total_valor),
                  color: "text-gray-900",
                  small: true,
                },
                {
                  label: "Vencidos",
                  value: preview.resumo.vencidos,
                  color:
                    preview.resumo.vencidos > 0
                      ? "text-red-600"
                      : "text-gray-900",
                },
              ].map((k, i) => (
                <div key={i} className="card p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                  <p
                    className={`font-semibold ${k.small ? "text-base" : "text-2xl"} ${k.color}`}
                  >
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Meses detectados
              </p>
              <div className="flex flex-wrap gap-2">
                {preview.resumo.meses.map((m: string) => (
                  <span key={m} className="badge badge-info">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {preview.erros.length > 0 && (
              <div className="card p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-medium text-amber-800">
                    {preview.total_erros} linha(s) com problemas — serão
                    ignoradas
                  </p>
                </div>
                <ul className="space-y-1">
                  {preview.erros.slice(0, 5).map((e: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1"
                    >
                      {e}
                    </li>
                  ))}
                  {preview.erros.length > 5 && (
                    <li className="text-xs text-gray-400">
                      + {preview.erros.length - 5} outros
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  Amostra — primeiros {preview.amostra.length} registros
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                        Vencimento
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                        Fornecedor
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                        Mês
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
                    {preview.amostra.map((p, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">
                          {fmtData(p.data_vencimento)}
                        </td>
                        <td
                          className="px-4 py-2.5 text-gray-900 max-w-[160px] truncate"
                          title={p.fornecedor}
                        >
                          {p.fornecedor}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {p.mes_referencia}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                          {fmtMoeda(p.valor)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`badge ${p.status === "vencido" ? "badge-danger" : "badge-ok"}`}
                          >
                            {p.status === "vencido" ? "Vencido" : "A vencer"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={confirmar}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar importação ({preview.total_valido} registros)
              </button>
              <button
                onClick={reiniciar}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* SALVANDO */}
        {etapa === "salvando" && (
          <div className="card p-16 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
            <p className="font-medium text-gray-900">
              Salvando no banco de dados...
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Isso pode levar alguns segundos
            </p>
          </div>
        )}

        {/* SUCESSO */}
        {etapa === "sucesso" && resultado && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Importação concluída!
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Os dados já estão disponíveis no dashboard
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-semibold text-green-600">
                  {resultado.total_inserido}
                </p>
                <p className="text-xs text-gray-400">Inseridos</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-semibold text-amber-600">
                  {resultado.total_erros}
                </p>
                <p className="text-xs text-gray-400">Com erros</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-mono text-gray-600 mt-1">
                  {resultado.importacao_id.slice(0, 8)}...
                </p>
                <p className="text-xs text-gray-400">ID</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={reiniciar} className="btn-secondary">
                Nova importação
              </button>
              <a href="/dashboard" className="btn-primary">
                Ver dashboard →
              </a>
            </div>
          </div>
        )}

        {/* ERRO */}
        {etapa === "erro" && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Erro na importação
            </h2>
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6">
              {erro}
            </p>
            <button onClick={reiniciar} className="btn-secondary">
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
