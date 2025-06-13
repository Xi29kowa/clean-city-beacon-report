
-- Add partner_municipality column to bin_reports table
ALTER TABLE public.bin_reports 
ADD COLUMN partner_municipality TEXT;
