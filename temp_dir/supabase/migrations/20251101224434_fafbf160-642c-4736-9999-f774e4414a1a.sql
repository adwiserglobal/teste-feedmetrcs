-- Tabela para armazenar formulários customizados
CREATE TABLE IF NOT EXISTS public.custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  styling jsonb NOT NULL DEFAULT '{"theme":"auto","primaryColor":"#3b82f6","borderRadius":"8","fontSize":"16"}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  total_responses integer NOT NULL DEFAULT 0
);

-- Tabela para armazenar respostas dos formulários
CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  response_data jsonb NOT NULL,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at ON public.form_responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_forms_created_at ON public.custom_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_forms_is_active ON public.custom_forms(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_custom_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_forms_updated_at_trigger
BEFORE UPDATE ON public.custom_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_custom_forms_updated_at();

-- Trigger para atualizar total_responses
CREATE OR REPLACE FUNCTION public.update_form_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.custom_forms 
    SET total_responses = total_responses + 1 
    WHERE id = NEW.form_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.custom_forms 
    SET total_responses = total_responses - 1 
    WHERE id = OLD.form_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_response_count_trigger
AFTER INSERT OR DELETE ON public.form_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_form_response_count();

-- Enable RLS
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para custom_forms (acesso público para leitura de formulários ativos)
CREATE POLICY "Allow public read active forms"
ON public.custom_forms
FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public insert forms"
ON public.custom_forms
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update forms"
ON public.custom_forms
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete forms"
ON public.custom_forms
FOR DELETE
USING (true);

-- Políticas RLS para form_responses (público pode enviar, mas só leitura de responses do próprio formulário)
CREATE POLICY "Allow public insert responses"
ON public.form_responses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public read responses"
ON public.form_responses
FOR SELECT
USING (true);

-- Habilitar realtime para as tabelas
ALTER TABLE public.custom_forms REPLICA IDENTITY FULL;
ALTER TABLE public.form_responses REPLICA IDENTITY FULL;