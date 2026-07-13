-- ============================================================
-- 008: AI chat history with optional memory context
-- Run this in Supabase Dashboard -> SQL Editor.
-- This migration is idempotent and can run after 007 or by itself.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL DEFAULT 'food_advisor'
    CHECK (conversation_type IN ('food_advisor', 'support')),
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  message TEXT NOT NULL,
  food_item_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_history
  ADD COLUMN IF NOT EXISTS conversation_type TEXT NOT NULL DEFAULT 'food_advisor';

ALTER TABLE public.ai_chat_history
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_chat_history
  ADD COLUMN IF NOT EXISTS food_item_name TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_chat_history_conversation_type_check'
  ) THEN
    ALTER TABLE public.ai_chat_history
      ADD CONSTRAINT ai_chat_history_conversation_type_check
      CHECK (conversation_type IN ('food_advisor', 'support'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_type_created
  ON public.ai_chat_history(user_id, conversation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_created
  ON public.ai_chat_history(user_id, created_at DESC);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_chat_history'
      AND policyname = 'Users can read their own chat history'
  ) THEN
    CREATE POLICY "Users can read their own chat history"
      ON public.ai_chat_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_chat_history'
      AND policyname = 'Users can insert their own chat messages'
  ) THEN
    CREATE POLICY "Users can insert their own chat messages"
      ON public.ai_chat_history FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ai_chat_history'
      AND policyname = 'Users can delete their own chat history'
  ) THEN
    CREATE POLICY "Users can delete their own chat history"
      ON public.ai_chat_history FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
