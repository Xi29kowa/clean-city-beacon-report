
-- Remove all bin reports from the database
DELETE FROM public.bin_reports;

-- Reset the statistics table to zero
UPDATE public.statistics 
SET 
  total_reports = 0,
  in_progress_reports = 0,
  processed_reports = 0,
  updated_at = now()
WHERE id = 1;
