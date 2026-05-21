-- Ensure profiles table has proper structure with unique IDs
-- Add user_code and account_id if not exists
DO $$ 
BEGIN
  -- Check if user_code column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='user_code') THEN
    ALTER TABLE public.profiles ADD COLUMN user_code TEXT UNIQUE;
  END IF;
  
  -- Check if account_id column exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='account_id') THEN
    ALTER TABLE public.profiles ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
END $$;

-- Create function to generate unique 7-digit user code
CREATE OR REPLACE FUNCTION public.generate_user_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 7-digit code
    new_code := LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create function to generate unique 9-digit account code
CREATE OR REPLACE FUNCTION public.generate_account_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 9-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE account_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Add default values for new accounts if account_code is null
UPDATE public.accounts 
SET account_code = public.generate_account_code() 
WHERE account_code IS NULL OR account_code = '';

-- Add default values for existing profiles if user_code is null
UPDATE public.profiles 
SET user_code = public.generate_user_code() 
WHERE user_code IS NULL OR user_code = '';

-- Create trigger to auto-generate user_code on profile creation
CREATE OR REPLACE FUNCTION public.set_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_code IS NULL OR NEW.user_code = '' THEN
    NEW.user_code := public.generate_user_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_code_trigger ON public.profiles;
CREATE TRIGGER set_user_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_code();

-- Create trigger to auto-generate account_code on account creation
CREATE OR REPLACE FUNCTION public.set_account_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_code IS NULL OR NEW.account_code = '' THEN
    NEW.account_code := public.generate_account_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_account_code_trigger ON public.accounts;
CREATE TRIGGER set_account_code_trigger
  BEFORE INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_account_code();

-- Add account_id to other tables for data isolation
DO $$ 
BEGIN
  -- Add account_id to feedback table if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='feedback' AND column_name='account_id') THEN
    ALTER TABLE public.feedback ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
  
  -- Add account_id to form_responses if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='form_responses' AND column_name='account_id') THEN
    ALTER TABLE public.form_responses ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
  
  -- Add account_id to insights_history if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='insights_history' AND column_name='account_id') THEN
    ALTER TABLE public.insights_history ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
  
  -- Add account_id to notifications if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='account_id') THEN
    ALTER TABLE public.notifications ADD COLUMN account_id UUID REFERENCES public.accounts(id);
  END IF;
END $$;