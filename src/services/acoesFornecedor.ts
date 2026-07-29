import { supabase } from "../lib/supabase";

async function token() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado.");
  return session.access_token;
}

async function chamar(url: string, corpo: unknown) {
  const resposta = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const data = await resposta.json().catch(() => null) as { erro?: string } | null;
  if (!resposta.ok) throw new Error(data?.erro ?? `Erro HTTP ${resposta.status}`);
  return data;
}

export async function enviarEmailFornecedor(corpo: { para: string; assunto: string; mensagem: string; anexos: Array<{ filename: string; content: string }> }) {
  return chamar("/api/email/send", corpo);
}

export async function abrirChamadoFornecedor(corpo: Record<string, unknown>) {
  return chamar("/api/sults/create", corpo) as Promise<{ id?: number } | null>;
}

export async function carregarCatalogosSults<T>() {
  const resposta = await fetch("/api/sults/catalogs", { headers: { Authorization: `Bearer ${await token()}` } });
  const data = await resposta.json().catch(() => null) as (T & { erro?: string }) | null;
  if (!resposta.ok) throw new Error(data?.erro ?? `Erro HTTP ${resposta.status}`);
  return data as T;
}
