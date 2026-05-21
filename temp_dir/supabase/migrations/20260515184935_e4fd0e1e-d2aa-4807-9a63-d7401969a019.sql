-- ============================================
-- FEEDMETRICS - FULL DATABASE RESTRUCTURE
-- ============================================

-- Drop existing objects (clean slate)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.insights_history CASCADE;
DROP TABLE IF EXISTS public.ai_analysis_cache CASCADE;
DROP TABLE IF EXISTS public.form_responses CASCADE;
DROP TABLE IF EXISTS public.custom_forms CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;

DROP FUNCTION IF EXISTS public.generate_user_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_account_code() CASCADE;
DROP FUNCTION IF EXISTS public.set_user_code() CASCADE;
DROP FUNCTION IF EXISTS public.set_account_code() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.generate_account_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_code TEXT; exists_check BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM()*1000000000)::TEXT, 9, '0');
    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE account_code = new_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_code;
END; $$;

CREATE OR REPLACE FUNCTION public.set_account_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.account_code IS NULL OR NEW.account_code = '' THEN
    NEW.account_code := public.generate_account_code();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_account_code_trigger
  BEFORE INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_account_code();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Public insert accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update accounts" ON public.accounts FOR UPDATE USING (true);

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_code TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_code TEXT; exists_check BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM()*10000000)::TEXT, 7, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_code;
END; $$;

CREATE OR REPLACE FUNCTION public.set_user_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_code IS NULL OR NEW.user_code = '' THEN
    NEW.user_code := public.generate_user_code();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_user_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_user_code();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

-- ============================================
-- FEEDBACK
-- ============================================
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  experience_rating INTEGER NOT NULL CHECK (experience_rating BETWEEN 1 AND 5),
  ease_rating INTEGER NOT NULL CHECK (ease_rating BETWEEN 1 AND 5),
  templates_rating INTEGER CHECK (templates_rating BETWEEN 1 AND 5),
  feedback_type TEXT NOT NULL DEFAULT 'general',
  improvement_suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_account ON public.feedback(account_id);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Public insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- ============================================
-- CUSTOM FORMS
-- ============================================
CREATE TABLE public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_forms_account ON public.custom_forms(account_id);

CREATE TRIGGER update_custom_forms_updated_at
  BEFORE UPDATE ON public.custom_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read forms" ON public.custom_forms FOR SELECT USING (true);
CREATE POLICY "Public insert forms" ON public.custom_forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update forms" ON public.custom_forms FOR UPDATE USING (true);
CREATE POLICY "Public delete forms" ON public.custom_forms FOR DELETE USING (true);

-- ============================================
-- FORM RESPONSES
-- ============================================
CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_responses_form ON public.form_responses(form_id);
CREATE INDEX idx_form_responses_account ON public.form_responses(account_id);
CREATE INDEX idx_form_responses_submitted ON public.form_responses(submitted_at DESC);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read responses" ON public.form_responses FOR SELECT USING (true);
CREATE POLICY "Public insert responses" ON public.form_responses FOR INSERT WITH CHECK (true);

-- ============================================
-- AI ANALYSIS CACHE
-- ============================================
CREATE TABLE public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_cache_lookup ON public.ai_analysis_cache(analysis_type, cache_key, expires_at);

ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cache" ON public.ai_analysis_cache FOR SELECT USING (true);
CREATE POLICY "Public insert cache" ON public.ai_analysis_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete cache" ON public.ai_analysis_cache FOR DELETE USING (true);

-- ============================================
-- INSIGHTS HISTORY
-- ============================================
CREATE TABLE public.insights_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insights_account ON public.insights_history(account_id);
CREATE INDEX idx_insights_created ON public.insights_history(created_at DESC);

ALTER TABLE public.insights_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read insights" ON public.insights_history FOR SELECT USING (true);
CREATE POLICY "Public insert insights" ON public.insights_history FOR INSERT WITH CHECK (true);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_account ON public.notifications(account_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON public.notifications FOR UPDATE USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;
ALTER TABLE public.form_responses REPLICA IDENTITY FULL;