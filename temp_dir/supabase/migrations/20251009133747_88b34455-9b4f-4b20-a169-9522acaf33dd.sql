-- Create insights history table
CREATE TABLE IF NOT EXISTS public.insights_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_text TEXT NOT NULL,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.insights_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to insights history"
  ON public.insights_history
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to insights history"
  ON public.insights_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_insights_history_created_at ON public.insights_history(created_at DESC);