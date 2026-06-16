import { supabase } from "../lib/supabase";

export async function buscarKPIs() {
  const { data, error } = (await supabase
    .from("pagamentos")
    .select("valor, status, data_vencimento")) as {
    data:
      | { valor: number; status: string; data_vencimento: string | null }[]
      | null;
    error: unknown;
  };

  if (error || !data) throw error;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7dias = new Date(hoje);
  em7dias.setDate(hoje.getDate() + 7);

  const total = data.reduce((s, p) => s + p.valor, 0);
  const vencidos = data.filter((p) => p.status === "vencido");
  const proximos7 = data.filter((p) => {
    if (p.status !== "a_vencer" || !p.data_vencimento) return false;
    const d = new Date(p.data_vencimento);
    return d >= hoje && d <= em7dias;
  });

  return {
    total_geral: total,
    total_vencido: vencidos.reduce((s, p) => s + p.valor, 0),
    count_vencidos: vencidos.length,
    total_proximos7: proximos7.reduce((s, p) => s + p.valor, 0),
    count_proximos7: proximos7.length,
    total_lancamentos: data.length,
  };
}

export async function buscarResumoPorMes() {
  const { data, error } = (await supabase
    .from("resumo_por_mes")
    .select("*")) as {
    data:
      | {
          mes_referencia: string;
          total_valor: number;
          total_lancamentos: number;
        }[]
      | null;
    error: unknown;
  };

  if (error || !data) throw error;

  const ORDEM = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO",
  ];
  return [...data].sort((a, b) => {
    const ia = ORDEM.findIndex((m) =>
      a.mes_referencia?.toUpperCase().includes(m),
    );
    const ib = ORDEM.findIndex((m) =>
      b.mes_referencia?.toUpperCase().includes(m),
    );
    return ia - ib;
  });
}

export async function buscarPorCategoria() {
  const { data, error } = (await supabase
    .from("pagamentos")
    .select("categoria, valor")) as {
    data: { categoria: string; valor: number }[] | null;
    error: unknown;
  };

  if (error || !data) throw error;

  const mapa: Record<string, number> = {};
  data.forEach((p) => {
    const nome = p.categoria.replace(/^\d[\d.]+\s*-\s*/, "").trim();
    mapa[nome] = (mapa[nome] ?? 0) + p.valor;
  });

  return Object.entries(mapa)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

export async function buscarTopFornecedores() {
  const { data, error } = (await supabase
    .from("top_fornecedores")
    .select("*")
    .limit(8)) as {
    data:
      | {
          fornecedor: string;
          total_valor: number;
          percentual: number;
          total_lancamentos: number;
        }[]
      | null;
    error: unknown;
  };

  if (error || !data) throw error;
  return data;
}

export interface FiltrosPagamentos {
  mes?: string;
  status?: string;
  categoria?: string;
  busca?: string;
}

export async function buscarPagamentos(filtros: FiltrosPagamentos = {}) {
  let query = supabase
    .from("pagamentos")
    .select("*")
    .order("data_vencimento", { ascending: true })
    .limit(200);

  if (filtros.mes && filtros.mes !== "todos")
    query = query.eq("mes_referencia", filtros.mes);
  if (filtros.status && filtros.status !== "todos")
    query = query.eq("status", filtros.status);
  if (filtros.categoria && filtros.categoria !== "todos")
    query = query.ilike("categoria", `%${filtros.categoria}%`);
  if (filtros.busca) query = query.ilike("fornecedor", `%${filtros.busca}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function buscarMesesDisponiveis() {
  const { data, error } = (await supabase
    .from("pagamentos")
    .select("mes_referencia")) as {
    data: { mes_referencia: string }[] | null;
    error: unknown;
  };

  if (error || !data) throw error;

  const unicos = [...new Set(data.map((p) => p.mes_referencia))].filter(
    Boolean,
  );
  const ORDEM = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO",
  ];
  return unicos.sort((a, b) => {
    const ia = ORDEM.findIndex((m) => a?.toUpperCase().includes(m));
    const ib = ORDEM.findIndex((m) => b?.toUpperCase().includes(m));
    return ia - ib;
  });
}

export async function buscarVencimentosProximos() {
  const { data, error } = await supabase
    .from("vencimentos_proximos")
    .select("*")
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

// ----------------------------------------------------------------
// Marcar pagamento como pago
// ----------------------------------------------------------------
export async function marcarComoPago(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("pagamentos") as any)
    .update({ status: "pago" })
    .eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------
// Marcar pagamento como a_vencer (desfazer pagamento)
// ----------------------------------------------------------------
export async function desfazerPagamento(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("pagamentos") as any)
    .update({ status: "a_vencer" })
    .eq("id", id);
  if (error) throw error;
}

// fix: força tipo any para contornar inferência estrita do supabase-js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
