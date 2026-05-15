-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_feedback', 'form_response', 'new_insight', 'account')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read notifications"
ON public.notifications
FOR SELECT
USING (true);

-- Allow public insert notifications
CREATE POLICY "Allow public insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Allow public update notifications
CREATE POLICY "Allow public update notifications"
ON public.notifications
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);