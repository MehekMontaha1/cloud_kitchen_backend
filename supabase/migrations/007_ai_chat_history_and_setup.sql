-- ============================================================
-- 007: AI Chat History table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'ai')),   -- 'user' or 'ai'
  message         TEXT NOT NULL,
  food_item_name  TEXT,                                           -- optional: which food was active
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id, created_at DESC);

-- RLS: users can only see their own chat history
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat history"
  ON public.ai_chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON public.ai_chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
  ON public.ai_chat_history FOR DELETE
  USING (auth.uid() = user_id);
