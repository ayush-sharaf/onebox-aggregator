import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { setupElasticsearchIndex } from './config/elasticsearch';
import { searchEmails, getSuggestedReply } from './controllers/email.controller';
import IMAPService from './services/imap.service';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/api/emails', searchEmails);
app.post('/api/emails/:messageId/suggest-reply', getSuggestedReply);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize services
async function initializeServices() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'IMAP1_HOST', 'IMAP1_PORT', 'IMAP1_USER', 'IMAP1_PASSWORD', 'IMAP1_TLS',
      'IMAP2_HOST', 'IMAP2_PORT', 'IMAP2_USER', 'IMAP2_PASSWORD', 'IMAP2_TLS'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Setup Elasticsearch index
    await setupElasticsearchIndex();
    
    // Setup IMAP connections
    const accounts = [
      {
        host: process.env.IMAP1_HOST!,
        port: parseInt(process.env.IMAP1_PORT!, 10),
        user: process.env.IMAP1_USER!,
        password: process.env.IMAP1_PASSWORD!,
        tls: process.env.IMAP1_TLS === 'true'
      },
      {
        host: process.env.IMAP2_HOST!,
        port: parseInt(process.env.IMAP2_PORT!, 10),
        user: process.env.IMAP2_USER!,
        password: process.env.IMAP2_PASSWORD!,
        tls: process.env.IMAP2_TLS === 'true'
      }
    ];

    console.log('Attempting to connect to IMAP accounts:', accounts.map(acc => ({
      host: acc.host,
      port: acc.port,
      user: acc.user,
      tls: acc.tls
    })));

    const imapService = new IMAPService(accounts);
    await imapService.connectAll();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down gracefully...');
      imapService.disconnectAll();
      process.exit();
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Test the API at: http://localhost:${PORT}/api/health`);
    });

  } catch (err) {
    console.error('Failed to initialize services:', err);
    process.exit(1);
  }
}

initializeServices();