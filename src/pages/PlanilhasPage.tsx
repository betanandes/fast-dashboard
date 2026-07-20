import { useRef, useState } from "react";
import {
  CheckCircle2,
  FileSpreadsheet,
  HardDriveUpload,
  Laptop,
  RefreshCw,
  Upload,
  UsersRound,
} from "lucide-react";

type Base = "licencas" | "softwares" | "maquinas";

const BASES = {
  licencas: {
    nome: "Licenças e acessos",
    descricao: "Usuários, códigos internos e módulos contratados",
    icon: UsersRound,
    total: 73,
    atualizado: "Hoje, 15:42",
    colunas: ["Colaborador", "Cód. SAP", "AppControl", "Perfil", "Status"],
    linhas: [
      ["Adriano Santana", "AUD001", "DCS065", "Profissional", "Ativo"],
      ["Andrey Lima", "FAT005", "DCS076", "Financeiro", "Ativo"],
      ["Arthur Villarde", "AUD011", "DCS086", "CRM", "Ativo"],
      ["Beatriz Carvalho", "FAT019", "DCS079", "Financeiro", "Pendente"],
      ["Breno Gomes", "FIN033", "DCS023", "Profissional", "Ativo"],
    ],
  },
  softwares: {
    nome: "Softwares e contratos",
    descricao: "Acessos, valores e satisfação das soluções",
    icon: Laptop,
    total: 28,
    atualizado: "Ontem, 17:10",
    colunas: ["Software", "Aplicação", "Valor mensal", "Valor anual", "Satisfaz?"],
    linhas: [
      ["ClickSign", "Assinatura eletrônica", "R$ 250,00", "R$ 3.000,00", "Sim"],
      ["Convex", "E-mail corporativo", "R$ 4.600,00", "R$ 55.200,00", "Sim"],
      ["Economapas Pro", "Inteligência de mercado", "R$ 1.750,00", "R$ 21.000,00", "Sim"],
      ["Focus", "Emissão de cupom fiscal", "R$ 548,00", "R$ 6.576,00", "Sim"],
      ["Fone Talk", "Atendimento 0800", "R$ 99,00", "R$ 1.188,00", "Em análise"],
    ],
  },
  maquinas: {
    nome: "Máquinas e unidades",
    descricao: "Parque de impressoras, contatos e endereços",
    icon: Laptop,
    total: 24,
    atualizado: "18/07/2026, 09:25",
    colunas: ["Máquina", "Nº de série", "Modelo", "Unidade", "IP"],
    linhas: [
      ["MAQ 1 - Porto", "XBIJ033474", "Epson WF C5890", "CSC", "10.0.59.48"],
      ["Mato Grosso do Sul", "T597H100196", "Ricoh SP 4510 SF", "Renovação", "—"],
      ["MAQ 9 - Nova Iguaçu", "T597H700337", "Ricoh SP 4510 SF", "Iniciativa", "—"],
      ["MAQ 8 - Ramos", "T597H100223", "Ricoh SP 4510 SF", "Diversidade", "10.0.58.200"],
      ["BonSucesso - DP", "BRBS12J0RW", "HP Color LaserJet", "CSC", "10.0.59.29"],
    ],
  },
} as const;

export default function PlanilhasPage() {
  const [baseAtiva, setBaseAtiva] = useState<Base>("licencas");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importado, setImportado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = BASES[baseAtiva];

  const selecionarBase = (novaBase: Base) => {
    setBaseAtiva(novaBase);
    setArquivo(null);
    setImportado(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="page">
      <div className="page-header items-start">
        <div>
          <h1 className="page-title">Central de planilhas</h1>
          <p className="page-subtitle">Reúna os controles de TI em uma visão única e pronta para consulta.</p>
        </div>
        <a href="/importar" className="btn-secondary flex items-center gap-2 text-sm">
          <HardDriveUpload className="h-4 w-4" /> Importar DRE financeiro
        </a>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {(Object.entries(BASES) as [Base, (typeof BASES)[Base]][]).map(([chave, item]) => {
          const Icon = item.icon;
          const ativa = baseAtiva === chave;
          return (
            <button
              key={chave}
              type="button"
              onClick={() => selecionarBase(chave)}
              className={`card p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${ativa ? "border-brand-300 ring-2 ring-brand-100" : ""}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ativa ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-500"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-semibold text-gray-900">{item.total}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
              <p className="mt-1 text-xs text-gray-500">{item.descricao}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                <RefreshCw className="h-3 w-3" /> Atualizado {item.atualizado}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Prévia — {base.nome}</h2>
              <p className="mt-0.5 text-xs text-gray-400">Dados demonstrativos baseados no formato das planilhas atuais</p>
            </div>
            <span className="badge badge-info">5 de {base.total} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {base.colunas.map((coluna) => (
                    <th key={coluna} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{coluna}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {base.linhas.map((linha, indice) => (
                  <tr key={`${baseAtiva}-${indice}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                    {linha.map((valor, coluna) => (
                      <td key={`${indice}-${coluna}`} className={`px-5 py-3 text-xs ${coluna === 0 ? "font-medium text-gray-900" : "text-gray-600"}`}>
                        {coluna === linha.length - 1 && (valor === "Ativo" || valor === "Sim") ? (
                          <span className="badge badge-ok">{valor}</span>
                        ) : coluna === linha.length - 1 && (valor === "Pendente" || valor === "Em análise") ? (
                          <span className="badge badge-warn">{valor}</span>
                        ) : valor}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card self-start p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
            <FileSpreadsheet className="h-5 w-5 text-brand-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Atualizar {base.nome.toLowerCase()}</h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">Selecione o arquivo que substituirá esta base. Nesta primeira versão, a confirmação usa a prévia demonstrativa.</p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              setArquivo(event.target.files?.[0] ?? null);
              setImportado(false);
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-gray-200 px-4 py-7 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <Upload className="mb-2 h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-gray-700">{arquivo ? arquivo.name : "Escolher planilha"}</span>
            <span className="mt-1 text-[10px] text-gray-400">XLSX, XLS ou CSV</span>
          </button>

          {arquivo && !importado && (
            <button type="button" onClick={() => setImportado(true)} className="btn-primary mt-3 w-full text-sm">Usar dados demonstrativos</button>
          )}

          {importado && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Prévia atualizada. Nenhum dado real foi substituído nesta etapa demonstrativa.
            </div>
          )}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-[10px] leading-4 text-gray-400">A importação definitiva será ligada ao banco após validar os nomes das colunas nos três arquivos originais.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
