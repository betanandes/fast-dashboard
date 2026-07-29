import { supabase } from "../lib/supabase";

export type PerfilUsuario = "admin" | "gestor" | "visualizador";

export interface UsuarioEquipe {
  id: string;
  nome: string;
  email: string;
  role: PerfilUsuario;
  primeiro_acesso: boolean;
  created_at: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  role: PerfilUsuario;
}

export async function listarUsuarios(): Promise<UsuarioEquipe[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id,nome,email,role,primeiro_acesso,created_at")
    .order("nome");

  if (error) throw new Error(error.message);
  return (data ?? []) as UsuarioEquipe[];
}

export async function cadastrarUsuario(payload: NovoUsuario) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sua sessão expirou. Entre novamente.");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/usuarios-admin`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.erro ?? "Não foi possível cadastrar o colaborador.");

  return data as {
    sucesso: true;
    usuario: UsuarioEquipe;
    senha_temporaria: string;
  };
}
