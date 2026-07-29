-- Gamificação do setor de TI: níveis, missões, conquistas e pontuação auditável.
create table if not exists public.gamificacao_niveis (
  id smallint primary key,
  nome text not null unique,
  frase text not null,
  pontos_minimos integer not null unique check (pontos_minimos >= 0),
  cor text not null default '#c41e23'
);

create table if not exists public.gamificacao_missoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null,
  gatilho text not null,
  periodicidade text not null check (periodicidade in ('unica','diaria','semanal','mensal')),
  meta integer not null default 1 check (meta > 0),
  pontos integer not null check (pontos > 0),
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gamificacao_conquistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text not null,
  categoria text not null,
  icone text not null default 'trophy',
  gatilho text not null,
  meta integer not null default 1 check (meta > 0),
  pontos_bonus integer not null default 0 check (pontos_bonus >= 0),
  ativa boolean not null default true
);

create table if not exists public.gamificacao_perfis (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  pontos integer not null default 0 check (pontos >= 0),
  sequencia_dias integer not null default 0 check (sequencia_dias >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.gamificacao_eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  origem text not null,
  origem_id text,
  descricao text not null,
  pontos integer not null,
  aprovado_por uuid references public.usuarios(id),
  created_at timestamptz not null default now(),
  unique (usuario_id, origem, origem_id)
);

create table if not exists public.gamificacao_conquistas_usuario (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  conquista_id uuid not null references public.gamificacao_conquistas(id) on delete cascade,
  conquistada_em timestamptz not null default now(),
  primary key (usuario_id, conquista_id)
);

insert into public.gamificacao_niveis (id, nome, frase, pontos_minimos, cor) values
  (1, 'Inicializador', 'Toda grande solução começa com um primeiro diagnóstico.', 0, '#64748b'),
  (2, 'Operador de Suporte', 'Atender bem também é construir confiança.', 150, '#16a34a'),
  (3, 'Analista de Sistemas', 'Você transforma sintomas em soluções.', 400, '#0284c7'),
  (4, 'Guardião da Infraestrutura', 'Disponibilidade e segurança caminham juntas.', 750, '#7c3aed'),
  (5, 'Especialista em Automação', 'Processos melhores deixam tempo para inovar.', 1200, '#c2410c'),
  (6, 'Arquiteto de Soluções', 'Você conecta pessoas, processos e tecnologia.', 1800, '#ca8a04'),
  (7, 'Mestre da Tecnologia', 'Seu conhecimento eleva todo o time.', 2600, '#c41e23')
on conflict (id) do update set nome=excluded.nome, frase=excluded.frase, pontos_minimos=excluded.pontos_minimos, cor=excluded.cor;

insert into public.gamificacao_missoes (titulo, descricao, gatilho, periodicidade, meta, pontos) values
  ('Primeira resposta ágil', 'Registrar a primeira interação em até 30 minutos.', 'primeira_resposta_30m', 'diaria', 1, 20),
  ('Fila sob controle', 'Concluir chamados atribuídos sem reabertura.', 'chamado_concluido_sem_reabertura', 'semanal', 5, 80),
  ('Documentação é solução', 'Publicar ou atualizar artigos úteis da base de conhecimento.', 'artigo_documentacao', 'mensal', 2, 100),
  ('Prevenção em primeiro lugar', 'Concluir uma manutenção preventiva planejada.', 'manutencao_preventiva', 'mensal', 1, 120),
  ('Parceiro do time', 'Apoiar chamados de outro analista com registro de interação.', 'apoio_chamado', 'semanal', 3, 60)
on conflict do nothing;

insert into public.gamificacao_conquistas (nome, descricao, categoria, icone, gatilho, meta, pontos_bonus) values
  ('Primeiro Atendimento', 'Concluiu o primeiro chamado.', 'Atendimento', 'headphones', 'chamado_concluido', 1, 25),
  ('Resolvedor Bronze', 'Concluiu 25 chamados.', 'Atendimento', 'badge-check', 'chamado_concluido', 25, 100),
  ('Velocidade com Qualidade', 'Dez primeiras respostas dentro do SLA.', 'SLA', 'timer', 'primeira_resposta_sla', 10, 120),
  ('Guardião do Conhecimento', 'Publicou cinco artigos de documentação.', 'Conhecimento', 'book-open', 'artigo_documentacao', 5, 150),
  ('Sentinela da Infraestrutura', 'Concluiu dez ações preventivas.', 'Infraestrutura', 'shield-check', 'manutencao_preventiva', 10, 200),
  ('Espírito de Equipe', 'Apoiou vinte atendimentos de colegas.', 'Colaboração', 'users', 'apoio_chamado', 20, 180)
on conflict (nome) do nothing;

alter table public.gamificacao_niveis enable row level security;
alter table public.gamificacao_missoes enable row level security;
alter table public.gamificacao_conquistas enable row level security;
alter table public.gamificacao_perfis enable row level security;
alter table public.gamificacao_eventos enable row level security;
alter table public.gamificacao_conquistas_usuario enable row level security;

create policy "gamificacao_catalogos_leitura" on public.gamificacao_niveis for select using (auth.role()='authenticated');
create policy "gamificacao_missoes_leitura" on public.gamificacao_missoes for select using (auth.role()='authenticated');
create policy "gamificacao_conquistas_leitura" on public.gamificacao_conquistas for select using (auth.role()='authenticated');
create policy "gamificacao_perfil_proprio" on public.gamificacao_perfis for select using (usuario_id=auth.uid());
create policy "gamificacao_eventos_proprios" on public.gamificacao_eventos for select using (usuario_id=auth.uid());
create policy "gamificacao_insignias_proprias" on public.gamificacao_conquistas_usuario for select using (usuario_id=auth.uid());

-- Pontos nunca são gravados diretamente pelo navegador; somente admin/gestor
-- ou futuras rotinas servidoras/service_role devem registrar eventos.
create policy "gamificacao_eventos_gestao" on public.gamificacao_eventos for insert
with check (exists (select 1 from public.usuarios where id=auth.uid() and role in ('admin','gestor')));

