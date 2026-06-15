// Tipos gerados manualmente — depois você pode substituir pelo
// output do comando: supabase gen types typescript --project-id <id>

export type PagamentoStatus = 'vencido' | 'a_vencer' | 'pago'

export interface Pagamento {
  id: string
  data_lancamento: string | null   // ISO date string
  data_vencimento: string | null
  data_documento: string | null
  mes_referencia: string
  categoria: string
  fornecedor: string
  numero_nf: string | null
  valor: number
  filial: string | null
  status: PagamentoStatus
  importacao_id: string | null
  created_at: string
}

export interface Importacao {
  id: string
  arquivo: string
  mes_referencia: string
  total_linhas: number
  total_valor: number
  importado_por: string
  created_at: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  role: 'admin' | 'gestor' | 'visualizador'
}

// Tipo que o Supabase client usa para inferência
export interface Database {
  public: {
    Tables: {
      pagamentos: {
        Row: Pagamento
        Insert: Omit<Pagamento, 'id' | 'created_at'>
        Update: Partial<Omit<Pagamento, 'id' | 'created_at'>>
      }
      importacoes: {
        Row: Importacao
        Insert: Omit<Importacao, 'id' | 'created_at'>
        Update: Partial<Omit<Importacao, 'id' | 'created_at'>>
      }
      usuarios: {
        Row: Usuario
        Insert: Omit<Usuario, 'id'>
        Update: Partial<Omit<Usuario, 'id'>>
      }
    }
  }
}
