-- Criar tabela para cache de análises de IA
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type TEXT NOT NULL UNIQUE, -- 'insights' ou 'word_cloud'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por tipo
CREATE INDEX idx_ai_analysis_cache_type ON public.ai_analysis_cache(analysis_type);

-- RLS: permitir leitura pública (dados são agregados e anônimos)
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to AI analysis cache"
  ON public.ai_analysis_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to AI analysis cache"
  ON public.ai_analysis_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to AI analysis cache"
  ON public.ai_analysis_cache
  FOR UPDATE
  USING (true);

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_ai_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_ai_analysis_cache_timestamp
  BEFORE UPDATE ON public.ai_analysis_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_cache_timestamp();

-- Inserir registros iniciais vazios
INSERT INTO public.ai_analysis_cache (analysis_type, data)
VALUES
  ('insights', '{"insight": "Aguardando primeira análise..."}'),
  ('word_cloud', '{"words": []}')
ON CONFLICT (analysis_type) DO NOTHING;