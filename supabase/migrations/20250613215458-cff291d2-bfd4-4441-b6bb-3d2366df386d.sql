
-- First, let's make sure we have a statistics row to update
INSERT INTO public.statistics (total_reports, in_progress_reports, processed_reports) 
VALUES (0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Update the existing trigger function to properly handle the statistics updates
CREATE OR REPLACE FUNCTION public.increment_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the statistics table when a new bin report is inserted
  UPDATE public.statistics 
  SET 
    total_reports = total_reports + 1,
    in_progress_reports = in_progress_reports + 1,
    updated_at = now()
  WHERE id = 1;
  
  -- If no row exists, insert one
  IF NOT FOUND THEN
    INSERT INTO public.statistics (id, total_reports, in_progress_reports, processed_reports)
    VALUES (1, 1, 1, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls this function when a new bin report is inserted
DROP TRIGGER IF EXISTS on_bin_report_created ON public.bin_reports;
CREATE TRIGGER on_bin_report_created
  AFTER INSERT ON public.bin_reports
  FOR EACH ROW 
  EXECUTE FUNCTION public.increment_statistics();

-- Also create a function to handle status updates (when reports are processed)
CREATE OR REPLACE FUNCTION public.update_statistics_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes from 'in_progress' to 'processed'
  IF OLD.status = 'in_progress' AND NEW.status = 'processed' THEN
    UPDATE public.statistics 
    SET 
      in_progress_reports = in_progress_reports - 1,
      processed_reports = processed_reports + 1,
      updated_at = now()
    WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
DROP TRIGGER IF EXISTS on_bin_report_status_updated ON public.bin_reports;
CREATE TRIGGER on_bin_report_status_updated
  AFTER UPDATE ON public.bin_reports
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_statistics_on_status_change();
