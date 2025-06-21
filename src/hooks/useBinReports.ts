
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BinReportData {
  location: string;
  issue_type: string;
  comment?: string | null;
  photo?: File | null;
  partner_municipality?: string | null;
  waste_bin_id?: string;
}

export const useBinReports = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const submitReport = async (reportData: BinReportData): Promise<string | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🚀 Starting report submission with data:', reportData);
      console.log('🗑️ WASTE BIN ID TO SAVE:', reportData.waste_bin_id);
      
      let photoUrl = null;

      // Upload photo if provided
      if (reportData.photo) {
        console.log('📸 Uploading photo:', reportData.photo.name);
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
          console.log('📸 Photo uploaded successfully:', photoUrl);
        }
      }

      // Prepare data for insertion - KRITISCH: waste_bin_id richtig übertragen
      const insertData = {
        location: reportData.location.trim(),
        issue_type: reportData.issue_type,
        comment: reportData.comment?.trim() || null,
        photo_url: photoUrl,
        partner_municipality: reportData.partner_municipality || null,
        user_id: user.id,
        status: 'in_progress',
        waste_bin_id: reportData.waste_bin_id || null // HIER IST DAS WICHTIGE FELD!
      };

      console.log('💾 FINAL INSERT DATA WITH WASTE_BIN_ID:', insertData);
      console.log('🗑️ WASTE_BIN_ID VALUE:', insertData.waste_bin_id);

      // Insert the bin report
      const { data, error } = await supabase
        .from('bin_reports')
        .insert(insertData)
        .select('id, waste_bin_id')
        .single();

      if (error) {
        console.error('❌ Error submitting report:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('✅ Report submitted successfully with data:', data);
      console.log('✅ CONFIRMED WASTE_BIN_ID SAVED:', data.waste_bin_id);
      return data.id;
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNotificationRequest = async (email: string, binReportId: string) => {
    try {
      console.log('Submitting notification request for:', { email, binReportId });
      
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

      console.log('Notification request submitted successfully');
      return true;
    } catch (error) {
      console.error('Error submitting notification request:', error);
      return false;
    }
  };

  return { submitReport, submitNotificationRequest, isSubmitting };
};
