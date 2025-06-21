
-- Add missing columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN address TEXT,
ADD COLUMN phone TEXT;

-- Add missing columns to the bin_reports table  
ALTER TABLE public.bin_reports
ADD COLUMN user_id UUID REFERENCES auth.users(id),
ADD COLUMN waste_bin_id TEXT;
