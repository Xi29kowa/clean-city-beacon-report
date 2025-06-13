
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BinReportData {
  location: string;
  issue_type: string;
  comment?: string;
  photo?: File | null;
  partner_municipality?: string;
}

export const useBinReports = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = async (reportData: BinReportData): Promise<string | null> => {
    setIsSubmitting(true);
    
    try {
      let photoUrl = null;

      // Upload photo if provided
      if (reportData.photo) {
        const fileExt = reportData.photo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bin-photos')
          .upload(fileName, reportData.photo);

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('bin-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      // Insert the bin report
      const { data, error } = await supabase
        .from('bin_reports')
        .insert({
          location: reportData.location,
          issue_type: reportData.issue_type,
          comment: reportData.comment || null,
          photo_url: photoUrl,
          partner_municipality: reportData.partner_municipality || null,
          status: 'in_progress'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error submitting report:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error submitting report:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNotificationRequest = async (email: string, binReportId: string) => {
    try {
      const { error } = await supabase
        .from('notification_requests')
        .insert({
          email,
          bin_report_id: binReportId,
          notified: false
        });

      if (error) {
        console.error('Error submitting notification request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error submitting notification request:', error);
      return false;
    }
  };

  return { submitReport, submitNotificationRequest, isSubmitting };
};
