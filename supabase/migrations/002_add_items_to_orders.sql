-- Migration: Add items JSONB column to orders and automatic stock decrement trigger
-- Save this as 002_add_items_to_orders.sql in the migrations folder.

-- 1. Add items column to public.orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB;

-- 2. Create the PL/pgSQL function to decrement menu items stock
CREATE OR REPLACE FUNCTION public.decrement_menu_items_stock()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Check if the items JSONB column is populated and is an array
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR item_record IN 
      SELECT id, name FROM jsonb_to_recordset(NEW.items) AS x(id UUID, name TEXT)
    LOOP
      UPDATE public.menu_items
      SET stock = GREATEST(0, stock - 1)
      WHERE id = item_record.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on public.orders to execute the decrement function after insert
DROP TRIGGER IF EXISTS trigger_decrement_stock ON public.orders;
CREATE TRIGGER trigger_decrement_stock
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_menu_items_stock();
