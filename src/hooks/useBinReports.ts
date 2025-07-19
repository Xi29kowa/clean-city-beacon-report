
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
    setIsSubmitting(true);
    
    try {
      console.log('🚀 CRITICAL - Starting report submission with data:', reportData);
      console.log('🗑️ CRITICAL - WASTE BIN ID TO SAVE:', reportData.waste_bin_id);
      console.log('🗑️ CRITICAL - WASTE BIN ID TYPE:', typeof reportData.waste_bin_id);
      console.log('🗑️ CRITICAL - WASTE BIN ID LENGTH:', reportData.waste_bin_id?.length);
      console.log('🗑️ CRITICAL - IS EMPTY STRING?:', reportData.waste_bin_id === '');
      console.log('🗑️ CRITICAL - IS UNDEFINED?:', reportData.waste_bin_id === undefined);
      console.log('🗑️ CRITICAL - IS NULL?:', reportData.waste_bin_id === null);
      
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
          console.error('❌ Error uploading photo:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('bin-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
          console.log('✅ Photo uploaded successfully:', photoUrl);
        }
      }

      // CRITICAL: Prepare data for insertion - waste_bin_id MUST be correctly transferred
      const wasteBinIdToSave = reportData.waste_bin_id && reportData.waste_bin_id.trim() !== '' 
        ? reportData.waste_bin_id.trim() 
        : null;

      console.log('🔧 CRITICAL - PROCESSED WASTE_BIN_ID FOR SAVE:', wasteBinIdToSave);
      console.log('🔧 CRITICAL - PROCESSED WASTE_BIN_ID TYPE:', typeof wasteBinIdToSave);

      const insertData = {
        location: reportData.location.trim(),
        issue_type: reportData.issue_type,
        comment: reportData.comment?.trim() || null,
        photo_url: photoUrl,
        partner_municipality: reportData.partner_municipality || null,
        user_id: user?.id || null,
        status: 'in_progress',
        waste_bin_id: wasteBinIdToSave // CRITICAL FIELD - cleaned and processed
      };

      console.log('💾 CRITICAL - FINAL INSERT DATA:', insertData);
      console.log('💾 CRITICAL - FINAL WASTE_BIN_ID VALUE:', insertData.waste_bin_id);
      console.log('💾 CRITICAL - FINAL WASTE_BIN_ID TYPE:', typeof insertData.waste_bin_id);

      // CRITICAL: Insert the bin report with waste_bin_id
      const { data, error } = await supabase
        .from('bin_reports')
        .insert(insertData)
        .select('id, waste_bin_id')
        .single();

      if (error) {
        console.error('❌ CRITICAL ERROR submitting report:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('✅ CRITICAL SUCCESS - Report submitted with data:', data);
      console.log('✅ CRITICAL SUCCESS - CONFIRMED WASTE_BIN_ID SAVED AS:', data.waste_bin_id);
      console.log('✅ CRITICAL SUCCESS - CONFIRMED WASTE_BIN_ID TYPE:', typeof data.waste_bin_id);
      console.log('✅ CRITICAL SUCCESS - CONFIRMED WASTE_BIN_ID IS NULL?:', data.waste_bin_id === null);
      
      return data.id;
    } catch (error) {
      console.error('❌ CRITICAL ERROR submitting report:', error);
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
