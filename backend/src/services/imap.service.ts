import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Email } from '../models/email.model';
import { elasticsearchClient } from '../config/elasticsearch';
import { categorizeEmail } from './ai.service';
import { sendSlackNotification, triggerWebhook } from './notification.service';

interface IMAPAccount {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

class IMAPService {
  private accounts: IMAPAccount[];
  private connections: Imap[] = [];

  constructor(accounts: IMAPAccount[]) {
    this.accounts = accounts;
  }

  public async connectAll(): Promise<void> {
    for (const account of this.accounts) {
      await this.connect(account);
    }
  }

  private async connect(account: IMAPAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: account.user,
        password: account.password,
        host: account.host,
        port: account.port,
        tls: account.tls,
        tlsOptions: { rejectUnauthorized: false },
        // for persistent connections
        keepalive: true
      });

      imap.once('ready', () => {
        console.log(`Connected to ${account.user}`);
        this.setupMailboxListeners(imap, account.user);
        this.connections.push(imap);
        resolve();
      });

      imap.once('error', (err: Error) => {
        console.error(`IMAP error for ${account.user}:`, err);
        reject(err);
      });

      imap.once('end', () => {
        console.log(`Connection ended for ${account.user}`);
      });

      imap.connect();
    });
  }

  private setupMailboxListeners(imap: Imap, email: string): void {
    imap.openBox('INBOX', true, (err: Error) => {
      if (err) throw err;

      // Fetch last 30 days of emails
      this.fetchHistoricalEmails(imap, email);

      // Set up IDLE for real-time updates
      imap.on('mail', () => {
        this.fetchNewEmails(imap, email);
      });

      // imap.idle(); // Not needed, IMAP enters IDLE automatically after opening the mailbox
      
    });
  }
//fetch mails from last 30 days and new mails
  private fetchHistoricalEmails(imap: Imap, email: string): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    imap.search([
      ['SINCE', thirtyDaysAgo.toISOString().split('T')[0]]
    ], (err, results) => {
      if (err) throw err;

      if (results.length === 0) return;

      const fetch = imap.fetch(results, { bodies: '' });
      
      fetch.on('message', (msg) => {
        this.processEmail(msg, email);
      });

      fetch.once('error', (err: Error) => {
        console.error('Fetch error:', err);
      });

      fetch.once('end', () => {
        console.log(`Done fetching historical emails for ${email}`);
      });
    });
  }

  private fetchNewEmails(imap: Imap, email: string): void {
    imap.search(['UNSEEN'], (err, results) => {
      if (err) throw err;

      if (results.length === 0) return;

      const fetch = imap.fetch(results, { bodies: '' });
      
      fetch.on('message', (msg) => {
        this.processEmail(msg, email);
      });

      fetch.once('error', (err: Error) => {
        console.error('Fetch error:', err);
      });
    });
  }

  private async processEmail(msg: Imap.ImapMessage, accountEmail: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let emailBuffer: Buffer[] = [];
      msg.on('body', (stream) => {
        stream.on('data', (chunk) => {
          emailBuffer.push(chunk);
        });
        stream.once('end', async () => {
          try {
            const parsed = await simpleParser(Buffer.concat(emailBuffer));
            const emailDoc: Email = {
              messageId: parsed.messageId || '',
              from: parsed.from?.value[0]?.address || '',
              to: Array.isArray((parsed.to as any)?.value)
                ? (parsed.to as any).value.map((addr: any) => addr.address)
                : [],
              subject: parsed.subject || '',
              text: parsed.text || '',
              html: parsed.html || '',
              date: parsed.date || new Date(),
              folder: 'INBOX',
              account: accountEmail,
              labels: []
            };

            // Categorize email using AI
            const category = await categorizeEmail(emailDoc.text);
            emailDoc.labels = [category];

            // Store in Elasticsearch
            await this.indexEmail(emailDoc);

            // Send notifications if interested
            if (category === 'Interested') {
              await sendSlackNotification(emailDoc);
              await triggerWebhook(emailDoc);
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
      msg.once('error', (err) => {
        reject(err);
      });
    });
  }

  private async indexEmail(email: Email): Promise<void> {
    try {
      await elasticsearchClient.index({
        index: 'emails',
        body: email
      });
      console.log(`Email indexed: ${email.messageId}`);
    } catch (err) {
      console.error('Error indexing email:', err);
    }
  }

  public disconnectAll(): void {
    this.connections.forEach(imap => {
      imap.end();
    });
    this.connections = [];
  }
}

export default IMAPService;