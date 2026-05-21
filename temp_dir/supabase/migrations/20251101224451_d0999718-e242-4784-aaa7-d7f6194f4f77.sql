-- Corrigir função update_custom_forms_updated_at com search_path seguro
CREATE OR REPLACE FUNCTION public.update_custom_forms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função update_form_response_count com search_path seguro
CREATE OR REPLACE FUNCTION public.update_form_response_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;