-- Migration: Add item_ids JSONB column to flash_offers to support item-specific flash sales
ALTER TABLE public.flash_offers ADD COLUMN IF NOT EXISTS item_ids JSONB;
