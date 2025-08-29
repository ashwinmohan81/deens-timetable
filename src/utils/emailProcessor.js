import { emailService } from '../services/emailService';
import { supabase } from '../config/supabase';

// Function to process all pending email notifications
export const processAllPendingEmails = async () => {
  try {
    console.log('🔄 Starting email notification processing...');
    
    const result = await emailService.processPendingNotifications();
    
    if (result.success) {
      console.log(`✅ Successfully processed ${result.processed} email notifications`);
      return result;
    } else {
      console.error('❌ Failed to process email notifications');
      return { success: false, error: 'Processing failed' };
    }
  } catch (error) {
    console.error('❌ Error processing email notifications:', error);
    return { success: false, error: error.message };
  }
};

// Function to manually trigger email processing (for testing)
export const manualEmailProcessing = async () => {
  console.log('📧 Manual email processing triggered...');
  return await processAllPendingEmails();
};

// Function to check email notification status
export const checkEmailNotificationStatus = async () => {
  try {
    const { data: notifications, error } = await supabase
      .from('email_notifications')
      .select('*')
      .order('id', { ascending: false })
      .limit(10);

    if (error) throw error;

    const stats = {
      total: notifications.length,
      sent: 0, // Since we don't have is_sent column, assume all are pending
      pending: notifications.length,
      recent: notifications.slice(0, 5)
    };

    console.log('📊 Email notification status:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error checking email notification status:', error);
    return { error: error.message };
  }
};
