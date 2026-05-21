-- Function to create notification for new feedback
CREATE OR REPLACE FUNCTION public.create_feedback_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    'eduardocamposmachadoalv@gmail.com'::text,
    'new_feedback',
    'Novo Feedback Recebido',
    'Um novo feedback foi enviado sobre a experiência do usuário.',
    jsonb_build_object(
      'feedback_id', NEW.id,
      'experience_rating', NEW.experience_rating,
      'ease_rating', NEW.ease_rating
    )
  );
  
  RETURN NEW;
END;
$$;

-- Function to create notification for new form response
CREATE OR REPLACE FUNCTION public.create_form_response_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  form_title text;
BEGIN
  -- Get form title
  SELECT title INTO form_title FROM public.custom_forms WHERE id = NEW.form_id;
  
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    metadata
  ) VALUES (
    'eduardocamposmachadoalv@gmail.com'::text,
    'form_response',
    'Nova Resposta de Formulário',
    'Uma nova resposta foi enviada no formulário "' || COALESCE(form_title, 'Sem título') || '".',
    jsonb_build_object(
      'form_id', NEW.form_id,
      'response_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for feedback table
DROP TRIGGER IF EXISTS trigger_feedback_notification ON public.feedback;
CREATE TRIGGER trigger_feedback_notification
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feedback_notification();

-- Trigger for form_responses table
DROP TRIGGER IF EXISTS trigger_form_response_notification ON public.form_responses;
CREATE TRIGGER trigger_form_response_notification
  AFTER INSERT ON public.form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_form_response_notification();