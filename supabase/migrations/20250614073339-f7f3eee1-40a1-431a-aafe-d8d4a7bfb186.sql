
-- Allow public read access to statistics table
CREATE POLICY "Allow public read access to statistics" 
  ON public.statistics 
  FOR SELECT 
  TO public 
  USING (true);

-- Allow the trigger functions to update statistics
CREATE POLICY "Allow system updates to statistics" 
  ON public.statistics 
  FOR UPDATE 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Allow the trigger functions to insert statistics if needed
CREATE POLICY "Allow system inserts to statistics" 
  ON public.statistics 
  FOR INSERT 
  TO public 
  WITH CHECK (true);
