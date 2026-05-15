-- Atualizar política RLS para permitir leitura de todos os formulários
-- (a verificação de is_active será feita na aplicação)
DROP POLICY IF EXISTS "Allow public read active forms" ON public.custom_forms;

CREATE POLICY "Allow public read all forms"
ON public.custom_forms
FOR SELECT
USING (true);

-- Garantir que a tabela form_responses pode ser lida publicamente
DROP POLICY IF EXISTS "Allow public read responses" ON public.form_responses;

CREATE POLICY "Allow public read responses"
ON public.form_responses
FOR SELECT
USING (true);