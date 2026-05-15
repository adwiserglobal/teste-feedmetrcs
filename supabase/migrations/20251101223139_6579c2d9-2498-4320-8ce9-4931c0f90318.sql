-- Criar tabela de feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  experience_rating integer not null check (experience_rating >= 1 and experience_rating <= 5),
  ease_rating integer not null check (ease_rating >= 1 and ease_rating <= 5),
  templates_rating integer check (templates_rating >= 1 and templates_rating <= 5),
  feedback_type text not null default 'general',
  improvement_suggestions text,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS na tabela feedback
alter table public.feedback enable row level security;

-- Política: Permitir leitura pública
create policy "Allow public read access"
  on public.feedback
  for select
  using (true);

-- Política: Permitir inserção pública
create policy "Allow public insert"
  on public.feedback
  for insert
  with check (true);

-- Índices para performance
create index idx_feedback_created_at on public.feedback(created_at desc);
create index idx_feedback_type on public.feedback(feedback_type);

-- Criar tabela de histórico de insights
create table public.insights_history (
  id uuid primary key default gen_random_uuid(),
  insight_text text not null,
  feedback_count integer not null default 0,
  created_at timestamp with time zone default now(),
  metadata jsonb
);

-- Habilitar RLS na tabela insights_history
alter table public.insights_history enable row level security;

-- Política: Permitir leitura pública
create policy "Allow public read access"
  on public.insights_history
  for select
  using (true);

-- Política: Permitir inserção pública
create policy "Allow public insert"
  on public.insights_history
  for insert
  with check (true);

-- Índice para ordenação por data
create index idx_insights_history_created_at on public.insights_history(created_at desc);

-- Criar tabela de cache de análises da IA
create table public.ai_analysis_cache (
  analysis_type text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS na tabela ai_analysis_cache
alter table public.ai_analysis_cache enable row level security;

-- Política: Permitir leitura pública
create policy "Allow public read access"
  on public.ai_analysis_cache
  for select
  using (true);

-- Política: Permitir upsert público
create policy "Allow public upsert"
  on public.ai_analysis_cache
  for all
  using (true)
  with check (true);

-- Habilitar Realtime para a tabela feedback
alter publication supabase_realtime add table public.feedback;