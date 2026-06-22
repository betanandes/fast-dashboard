//Processa um arquivo Excel de pagamentos, extrai os dados relevantes e os insere no banco de dados do Supabase. Suporta modo de pré-visualização para validar o conteúdo antes da importação definitiva.

// Suprime warnings de tipo implícito neste arquivo

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LinhaBruta {
  dataLancamento: unknown;
  dataVencimento: unknown;
  dataDocumento: unknown;
  mes: unknown;
  categoria: unknown;
  detalhes: unknown;
  saldo: unknown;
  filial: unknown;
}

interface PagamentoETL {
  data_lancamento: string | null;
  data_vencimento: string | null;
  data_documento: string | null;
  mes_referencia: string;
  categoria: string;
  fornecedor: string;
  numero_nf: string | null;
  valor: number;
  filial: string | null;
  status: "vencido" | "a_vencer";
}

interface ResultadoETL {
  pagamentos: PagamentoETL[];
  erros: string[];
  total_lido: number;
}

function excelDateToISO(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    if (d.getFullYear() < 2000 || d.getFullYear() > 2050) return null;
    return d.toISOString().split("T")[0];
  }
  return null;
}

function extrairFornecedor(detalhes: unknown): {
  fornecedor: string;
  nf: string | null;
} {
  if (!detalhes) return { fornecedor: "Não informado", nf: null };
  const txt = String(detalhes).trim();
  const nfMatch = txt.match(/NF[-\s]?(\d+)/i);
  const nf = nfMatch ? nfMatch[0].toUpperCase() : null;
  const semCodigo = txt.replace(/^\d[\d.]+\s*-\s*/, "");
  const semNF = semCodigo.replace(/\s*-?\s*NF[-\s]?\d+.*/i, "").trim();
  const partes = semNF.split(" - ");
  const fornecedor =
    partes[partes.length - 1].trim() || semNF || "Não informado";
  return { fornecedor: fornecedor.substring(0, 200), nf };
}

function classificarStatus(
  dataVencimento: string | null,
): "vencido" | "a_vencer" {
  if (!dataVencimento) return "a_vencer";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vcto = new Date(dataVencimento);
  return vcto < hoje ? "vencido" : "a_vencer";
}

function processarExcel(buffer: ArrayBuffer): ResultadoETL {
  const workbook = XLSX.read(buffer, { type: "array" });
  const nomeAba =
    workbook.SheetNames.find(
      (n) =>
        n.toUpperCase().includes("BASE") &&
        n.toUpperCase().includes("CONSOLID"),
    ) ?? workbook.SheetNames[0];

  const sheet = workbook.Sheets[nomeAba];
  const linhas: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: true,
  });

  const pagamentos: PagamentoETL[] = [];
  const erros: string[] = [];

  linhas.forEach((linha, idx) => {
    const num = idx + 2;
    const bruta: LinhaBruta = {
      dataLancamento: linha["Data de lançamento"],
      dataVencimento: linha["Data de vencimento"],
      dataDocumento: linha["Data do documento"],
      mes: linha["MÊS DE REFERÊNCIA"],
      categoria: linha["TIPO 4"],
      detalhes: linha["Detalhes"],
      saldo: linha["Saldo (MC)"],
      filial: linha["Filial"],
    };

    if (!bruta.saldo && bruta.saldo !== 0) {
      erros.push(`Linha ${num}: valor/saldo não encontrado — linha ignorada`);
      return;
    }

    const valor = Math.abs(Number(bruta.saldo));
    if (isNaN(valor) || valor === 0) {
      erros.push(
        `Linha ${num}: valor inválido (${bruta.saldo}) — linha ignorada`,
      );
      return;
    }

    const mes = bruta.mes
      ? String(bruta.mes).trim().toUpperCase()
      : "NÃO INFORMADO";
    const categoria = bruta.categoria
      ? String(bruta.categoria).trim()
      : "NÃO CLASSIFICADO";
    const { fornecedor, nf } = extrairFornecedor(bruta.detalhes);
    const dataVencimento = excelDateToISO(bruta.dataVencimento);

    pagamentos.push({
      data_lancamento: excelDateToISO(bruta.dataLancamento),
      data_vencimento: dataVencimento,
      data_documento: excelDateToISO(bruta.dataDocumento),
      mes_referencia: mes,
      categoria,
      fornecedor,
      numero_nf: nf,
      valor,
      filial: bruta.filial ? String(bruta.filial).trim() : null,
      status: classificarStatus(dataVencimento),
    });
  });

  return { pagamentos, erros, total_lido: linhas.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ erro: "Token de autenticação obrigatório" }),
        {
          status: 401,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ erro: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!perfil || !["admin", "gestor"].includes(perfil.role)) {
      return new Response(
        JSON.stringify({
          erro: "Permissão negada. Apenas gestor ou admin pode importar.",
        }),
        {
          status: 403,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const formData = await req.formData();
    const arquivo = formData.get("arquivo") as File | null;
    const modoPreview = formData.get("preview") === "true";

    if (!arquivo) {
      return new Response(JSON.stringify({ erro: "Nenhum arquivo enviado." }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!arquivo.name.endsWith(".xlsx") && !arquivo.name.endsWith(".xls")) {
      return new Response(
        JSON.stringify({
          erro: "Formato inválido. Envie um arquivo .xlsx ou .xls",
        }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const buffer = await arquivo.arrayBuffer();
    const { pagamentos, erros, total_lido } = processarExcel(buffer);

    if (modoPreview) {
      return new Response(
        JSON.stringify({
          preview: true,
          total_lido,
          total_valido: pagamentos.length,
          total_erros: erros.length,
          erros: erros.slice(0, 20),
          amostra: pagamentos.slice(0, 10),
          resumo: {
            meses: [...new Set(pagamentos.map((p) => p.mes_referencia))].sort(),
            total_valor: pagamentos.reduce((s, p) => s + p.valor, 0),
            vencidos: pagamentos.filter((p) => p.status === "vencido").length,
            a_vencer: pagamentos.filter((p) => p.status === "a_vencer").length,
          },
        }),
        {
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    if (pagamentos.length === 0) {
      return new Response(
        JSON.stringify({
          erro: "Nenhum lançamento válido encontrado no arquivo.",
          erros,
          total_lido,
        }),
        {
          status: 422,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    const { data: importacao, error: errImport } = await supabase
      .from("importacoes")
      .insert({
        arquivo: arquivo.name,
        mes_referencia: [
          ...new Set(pagamentos.map((p) => p.mes_referencia)),
        ].join(", "),
        total_linhas: pagamentos.length,
        total_valor: pagamentos.reduce((s, p) => s + p.valor, 0),
        importado_por: user.id,
      })
      .select("id")
      .single();

    if (errImport || !importacao) {
      throw new Error(`Erro ao registrar importação: ${errImport?.message}`);
    }

    const CHUNK = 500;
    let inseridos = 0;
    for (let i = 0; i < pagamentos.length; i += CHUNK) {
      const chunk = pagamentos.slice(i, i + CHUNK).map((p) => ({
        ...p,
        importacao_id: importacao.id,
      }));
      const { error: errInsert } = await supabase
        .from("pagamentos")
        .insert(chunk);
      if (errInsert)
        throw new Error(`Erro ao inserir lote ${i}: ${errInsert.message}`);
      inseridos += chunk.length;
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        importacao_id: importacao.id,
        total_lido,
        total_inserido: inseridos,
        total_erros: erros.length,
        erros: erros.slice(0, 20),
      }),
      {
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Erro na Edge Function:", err);
    return new Response(
      JSON.stringify({
        erro: "Erro interno ao processar o arquivo.",
        detalhe: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  }
});
