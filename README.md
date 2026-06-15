# Fast Dashboard TI — Guia de instalação

## Pré-requisitos
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita no [Vercel](https://vercel.com)

---

## 1. Configurar o Supabase

**1.1 Criar o projeto**
1. supabase.com → New project → Nome: `fast-dashboard` → Região: South America (São Paulo)
2. Aguarde ~2 min inicializar

**1.2 Criar as tabelas**
1. SQL Editor → New query
2. Cole o conteúdo de `supabase/schema.sql` → Run
3. Deve aparecer "Success"

**1.3 Criar o primeiro usuário (admin)**
1. Authentication → Users → Add user → seu e-mail corporativo
2. Depois rode no SQL Editor:
```sql
update public.usuarios set role = 'admin' where email = 'seuemail@fast.com.br';
```

**1.4 Pegar as chaves**
Settings → API → copie Project URL e anon public key

---

## 2. Configurar localmente

```bash
npm install
cp .env.example .env
# Preencha .env com URL e chave do Supabase
npm run dev
```

Acesse http://localhost:5173

---

## 3. Deploy no Vercel

```bash
npm install -g vercel
vercel
```

No painel Vercel: Settings → Environment Variables → adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

---

## Estrutura

```
src/
  components/layout/   AppLayout, ProtectedRoute
  hooks/               useAuth, AuthContext
  lib/                 supabase.ts
  pages/               LoginPage, DashboardPage
  types/               database.ts
supabase/
  schema.sql           Schema completo do banco
```

## Sprints

| Sprint | Status | Entrega |
|--------|--------|---------|
| 1 | ✅ Pronto | Projeto, banco, auth, login |
| 2 | 🔜 | Upload Excel + ETL |
| 3 | 🔜 | Dashboard completo |
| 4 | 🔜 | E-mails + relatórios |
