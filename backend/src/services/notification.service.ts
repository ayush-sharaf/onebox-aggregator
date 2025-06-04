import axios from 'axios';
import { Email } from '../models/email.model';

export async function sendSlackNotification(email: Email): Promise<void> {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured');
    return;
  }

  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `New Interested Email\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.text.substring(0, 200)}...`
    });
    console.log('Slack notification sent');
  } catch (err) {
    console.error('Error sending Slack notification:', err);
  }
}

export async function triggerWebhook(email: Email): Promise<void> {
  if (!process.env.WEBHOOK_SITE_URL) {
    console.warn('Webhook.site URL not configured');
    return;
  }

  try {
    await axios.post(process.env.WEBHOOK_SITE_URL, {
      event: 'interested_email',
      data: {
        from: email.from,
        subject: email.subject,
        date: email.date,
        messageId: email.messageId
      }
    });
    console.log('Webhook triggered');
  } catch (err) {
    console.error('Error triggering webhook:', err);
  }
}