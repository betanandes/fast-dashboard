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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

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
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Importar Excel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envie a planilha DRE_TI.xlsx para atualizar os dados do dashboard.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-8 text-sm">
        {(["upload", "preview", "sucesso"] as const).map((e, i) => {
          const labels = {
            upload: "1. Arquivo",
            preview: "2. Conferir",
            sucesso: "3. Concluído",
          };
          const ativo =
            etapa === e || (etapa === "salvando" && e === "preview");
          const concluido =
            (e === "upload" &&
              ["preview", "salvando", "sucesso"].includes(etapa)) ||
            (e === "preview" && etapa === "sucesso");
          return (
            <div key={e} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              <span
                className={`font-medium ${
                  concluido
                    ? "text-green-600"
                    : ativo
                      ? "text-brand-600"
                      : "text-gray-400"
                }`}
              >
                {concluido ? "✓ " : ""}
                {labels[e]}
              </span>
            </div>
          );
        })}
      </div>

      {etapa === "upload" && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-brand-400 bg-brand-50"
              : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-brand-50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Arraste o arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Suporte para .xlsx e .xls — aba BASE CONSOLIDADA
              </p>
            </div>
            <button
              className="btn-primary mt-2 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Upload className="w-4 h-4" />
              Selecionar arquivo
            </button>
          </div>
        </div>
      )}

      {etapa === "preview" && !preview && (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="font-medium text-gray-900">
            Processando {arquivo?.name}...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Lendo e validando os dados da planilha
          </p>
        </div>
      )}

      {etapa === "preview" && preview && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Linhas lidas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {preview.total_lido}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Válidos</p>
              <p className="text-2xl font-semibold text-green-600">
                {preview.total_valido}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Total em R$</p>
              <p className="text-xl font-semibold text-gray-900">
                {fmtMoeda(preview.resumo.total_valor)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Vencidos</p>
              <p
                className={`text-2xl font-semibold ${preview.resumo.vencidos > 0 ? "text-red-600" : "text-gray-900"}`}
              >
                {preview.resumo.vencidos}
              </p>
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Meses detectados
            </p>
            <div className="flex flex-wrap gap-2">
              {preview.resumo.meses.map((m) => (
                <span key={m} className="badge badge-info">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {preview.erros.length > 0 && (
            <div className="card p-4 border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-medium text-amber-800">
                  {preview.total_erros} linha(s) com problemas — serão ignoradas
                </p>
              </div>
              <ul className="space-y-1">
                {preview.erros.slice(0, 5).map((e, i) => (
                  <li
                    key={i}
                    className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1"
                  >
                    {e}
                  </li>
                ))}
                {preview.erros.length > 5 && (
                  <li className="text-xs text-gray-500">
                    + {preview.erros.length - 5} outros erros...
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
                    <th className="text-left px-4 py-2 font-medium text-gray-500">
                      Vencimento
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">
                      Fornecedor
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">
                      Mês
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">
                      Valor
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.amostra.map((p, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 text-gray-600">
                        {fmtData(p.data_vencimento)}
                      </td>
                      <td
                        className="px-4 py-2 text-gray-900 max-w-[200px] truncate"
                        title={p.fornecedor}
                      >
                        {p.fornecedor}
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {p.mes_referencia}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {fmtMoeda(p.valor)}
                      </td>
                      <td className="px-4 py-2">
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
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {etapa === "salvando" && (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="font-medium text-gray-900">
            Salvando no banco de dados...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Isso pode levar alguns segundos
          </p>
        </div>
      )}

      {etapa === "sucesso" && resultado && (
        <div className="card p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Importação concluída!
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Os dados já estão disponíveis no dashboard.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Inseridos</span>
                  </div>
                  <p className="text-xl font-semibold text-green-600">
                    {resultado.total_inserido}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Com erros</span>
                  </div>
                  <p className="text-xl font-semibold text-amber-600">
                    {resultado.total_erros}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">ID</span>
                  </div>
                  <p className="text-xs font-mono text-gray-600 truncate">
                    {resultado.importacao_id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={reiniciar} className="btn-secondary">
                  Nova importação
                </button>
                <a href="/dashboard" className="btn-primary">
                  Ver dashboard →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {etapa === "erro" && (
        <div className="card p-8 border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Erro na importação
              </h2>
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mt-2">
                {erro}
              </p>
              <button onClick={reiniciar} className="btn-secondary mt-4">
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
