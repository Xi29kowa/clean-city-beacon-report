
-- Delete all bin reports to clear the data
DELETE FROM public.bin_reports;

-- Reset the statistics counters to 0
UPDATE public.statistics 
SET 
  total_reports = 0,
  in_progress_reports = 0,
  processed_reports = 0,
  updated_at = now()
WHERE id = 1;
