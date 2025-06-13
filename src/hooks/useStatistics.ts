
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
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching statistics:', error);
        return;
      }

      if (data) {
        setStatistics(data);
      } else {
        // If no statistics row exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('statistics')
          .insert({ id: 1, total_reports: 0, in_progress_reports: 0, processed_reports: 0 })
          .select('total_reports, in_progress_reports, processed_reports')
          .single();

        if (insertError) {
          console.error('Error creating statistics:', insertError);
        } else if (newData) {
          setStatistics(newData);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    // Subscribe to real-time updates on both statistics and bin_reports tables
    const statisticsChannel = supabase
      .channel('statistics-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'statistics'
        },
        (payload) => {
          console.log('Statistics updated:', payload.new);
          if (payload.new) {
            setStatistics({
              total_reports: payload.new.total_reports,
              in_progress_reports: payload.new.in_progress_reports,
              processed_reports: payload.new.processed_reports
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bin_reports'
        },
        () => {
          console.log('New bin report inserted, refreshing statistics...');
          // Refresh statistics when a new bin report is inserted
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statisticsChannel);
    };
  }, []);

  return { statistics, loading, refetch: fetchStatistics };
};
