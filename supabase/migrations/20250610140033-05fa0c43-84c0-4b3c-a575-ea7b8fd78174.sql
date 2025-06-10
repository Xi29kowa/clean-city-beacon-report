
-- Create a table to store global statistics/counters
CREATE TABLE public.statistics (
  id SERIAL PRIMARY KEY,
  total_reports INTEGER NOT NULL DEFAULT 0,
  in_progress_reports INTEGER NOT NULL DEFAULT 0,
  processed_reports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial row with counters starting at 0
INSERT INTO public.statistics (total_reports, in_progress_reports, processed_reports) 
VALUES (0, 0, 0);

-- Create a table to store bin reports
CREATE TABLE public.bin_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  comment TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table to store notification requests
CREATE TABLE public.notification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  bin_report_id UUID REFERENCES public.bin_reports(id) ON DELETE CASCADE,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for statistics (allow read access to everyone, no update needed from frontend)
CREATE POLICY "Everyone can view statistics" 
  ON public.statistics 
  FOR SELECT 
  USING (true);

-- Create policies for bin_reports (allow everyone to insert and read)
CREATE POLICY "Everyone can view bin reports" 
  ON public.bin_reports 
  FOR SELECT 
  USING (true);

CREATE POLICY "Everyone can create bin reports" 
  ON public.bin_reports 
  FOR INSERT 
  WITH CHECK (true);

-- Create policies for notification_requests (allow everyone to insert and read)
CREATE POLICY "Everyone can view notification requests" 
  ON public.notification_requests 
  FOR SELECT 
  USING (true);

CREATE POLICY "Everyone can create notification requests" 
  ON public.notification_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Create a function to increment counters when a new bin report is created
CREATE OR REPLACE FUNCTION increment_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.statistics 
  SET 
    total_reports = total_reports + 1,
    in_progress_reports = in_progress_reports + 1,
    updated_at = now()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment counters when a bin report is inserted
CREATE TRIGGER on_bin_report_created
  AFTER INSERT ON public.bin_reports
  FOR EACH ROW EXECUTE FUNCTION increment_statistics();
