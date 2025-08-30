import { supabase } from '../config/supabase';

// SendGrid API configuration
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@deensacademy.com';

class EmailService {
  constructor() {
    this.apiKey = SENDGRID_API_KEY;
    this.fromEmail = SENDGRID_FROM_EMAIL;
  }

  // Send email using SendGrid API
  async sendEmail(toEmail, subject, htmlContent) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: toEmail }],
              subject: subject,
            },
          ],
          from: { email: this.fromEmail },
          content: [
            {
              type: 'text/html',
              value: htmlContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`SendGrid API error: ${errorData.errors?.[0]?.message || response.statusText}`);
      }

      return { success: true, messageId: response.headers.get('x-message-id') };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  // Send timetable change notification
  async sendTimetableChangeNotification(studentEmail, className, changeSummary, changeDetails) {
    const subject = `📅 Timetable Change Alert - ${className}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Timetable Change Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .change-details { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Timetable Change Alert</h1>
            <p>Deens Academy</p>
          </div>
          
          <div class="content">
            <h2>Hello!</h2>
            <p>There has been a change to your <strong>${className}</strong> timetable.</p>
            
            <div class="change-details">
              <h3>Change Summary:</h3>
              <p><strong>${changeSummary}</strong></p>
              ${changeDetails ? `<p><strong>Details:</strong> ${changeDetails}</p>` : ''}
            </div>
            
            <p>Click the button below to view the updated timetable:</p>
            <a href="${window.location.origin}/student-dashboard" class="button">View Updated Timetable</a>
            
            <p><em>This notification was sent automatically. Please log in to your student dashboard to see the changes.</em></p>
          </div>
          
          <div class="footer">
            <p>Deens Academy Timetable System</p>
            <p>If you have any questions, please contact your class teacher.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(studentEmail, subject, htmlContent);
  }

  // Process pending email notifications
  async processPendingNotifications() {
    try {
      // Get all pending notifications
      const { data: notifications, error } = await supabase
        .from('email_notifications')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // Group notifications by student to avoid duplicates
      const studentNotifications = new Map();
      
      for (const notification of notifications) {
        try {
          // Get student email from student_registrations table
          const { data: studentReg, error: studentError } = await supabase
            .from('student_registrations')
            .select('students(email)')
            .eq('class_section', notification.class_section)
            .single();

          if (studentError || !studentReg?.students?.email) {
            console.error('No student email found for class:', notification.class_section);
            continue;
          }

          const studentEmail = studentReg.students.email;
          
          // Only send one email per student per class
          if (!studentNotifications.has(studentEmail)) {
            studentNotifications.set(studentEmail, {
              email: studentEmail,
              class_section: notification.class_section,
              change_summary: 'Timetable has been updated',
              notification_link: 'View timetable in student dashboard'
            });
          }
        } catch (emailError) {
          console.error('Failed to process notification:', notification.id, emailError);
        }
      }

      // Send one email per student
      let emailsSent = 0;
      for (const [studentEmail, notification] of studentNotifications) {
        try {
          await this.sendTimetableChangeNotification(
            studentEmail,
            notification.class_section,
            notification.change_summary,
            notification.notification_link
          );

          console.log(`Email sent successfully to ${studentEmail}`);
          emailsSent++;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (emailError) {
          console.error('Failed to send email to:', studentEmail, emailError);
        }
      }

      // Clear processed notifications
      if (notifications.length > 0) {
        const { error: deleteError } = await supabase
          .from('email_notifications')
          .delete()
          .in('id', notifications.map(n => n.id));
        
        if (deleteError) {
          console.error('Failed to clear notifications:', deleteError);
        }
      }

      return { success: true, processed: emailsSent };
    } catch (error) {
      console.error('Error processing notifications:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
