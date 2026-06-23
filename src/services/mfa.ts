import { supabase } from "../lib/supabase";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  return `Bearer ${session.access_token}`;
}

// Envia código de verificação para o e-mail do usuário
export async function enviarCodigoEmail(): Promise<{ email: string }> {
  const res = await fetch(`${BASE_URL}/functions/v1/mfa-email-send`, {
    method: "POST",
    headers: {
      Authorization: await getAuthHeader(),
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Erro ao enviar código");
  return data;
}

// Verifica o código digitado pelo usuário
export async function verificarCodigoEmail(codigo: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/functions/v1/mfa-email-verify`, {
    method: "POST",
    headers: {
      Authorization: await getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codigo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Código inválido");
  return data.sucesso === true;
}
