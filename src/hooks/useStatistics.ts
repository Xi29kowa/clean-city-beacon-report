
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Statistics {
  total_reports: number;
  in_progress_reports: number;
  processed_reports: number;
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    total_reports: 0,
    in_progress_reports: 0,
    processed_reports: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('statistics')
        .select('total_reports, in_progress_reports, processed_reports')
        .single();

      if (error) {
        console.error('Error fetching statistics:', error);
        return;
      }

      if (data) {
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('statistics-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'statistics'
        },
        () => {
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { statistics, loading, refetch: fetchStatistics };
};
