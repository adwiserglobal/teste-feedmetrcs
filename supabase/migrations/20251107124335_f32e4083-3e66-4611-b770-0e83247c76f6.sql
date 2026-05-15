-- Add user_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);