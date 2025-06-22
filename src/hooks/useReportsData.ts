
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useReportsData = () => {
  return useQuery({
    queryKey: ['bin_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bin_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }

      return data || [];
    },
  });
};
