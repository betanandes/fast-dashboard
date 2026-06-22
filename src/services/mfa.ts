import { supabase } from "../lib/supabase";

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  return `Bearer ${session.access_token}`;
}

// Gera o segredo e retorna a URI do QR code
export async function setupMfa(): Promise<{
  secret: string;
  otpauth_uri: string;
}> {
  const res = await fetch(`${BASE_URL}/functions/v1/mfa-setup`, {
    method: "POST",
    headers: {
      Authorization: await getAuthHeader(),
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Erro ao configurar MFA");
  return data;
}

// Verifica o código TOTP
export async function verifyMfa(
  codigo: string,
  ativar = false,
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/functions/v1/mfa-verify`, {
    method: "POST",
    headers: {
      Authorization: await getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ codigo, ativar }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro ?? "Código inválido");
  return data.sucesso === true;
}

// Verifica se o usuário tem MFA ativo
export async function verificarMfaAtivo(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await (supabase.from("usuarios") as any)
    .select("mfa_ativo")
    .eq("id", user.id)
    .single();

  return data?.mfa_ativo === true;
}
