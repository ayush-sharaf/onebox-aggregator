import { Request, Response } from 'express';
import { elasticsearchClient } from '../config/elasticsearch';
import { EmailSearchParams } from '../models/email.model';
import { generateSuggestedReply } from '../services/ai.service';



export async function searchEmails(req: Request, res: Response): Promise<void> {
  try {
    const {
      query,
      from,
      to,
      subject,
      folder,
      account,
      label,
      startDate,
      endDate
    } = req.query;

    const must: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query: query as string,
          fields: ['subject', 'text', 'from', 'to']
        }
      });
    }

    if (from) must.push({ term: { from: from as string } });
    if (to) must.push({ term: { to: to as string } });
    if (subject) must.push({ match: { subject: subject as string } });
    if (folder) must.push({ term: { folder: folder as string } });
    if (account) must.push({ term: { account: account as string } });
    if (label) must.push({ term: { labels: label as string } });

    if (startDate || endDate) {
      const range: any = {};
      if (startDate) range.gte = new Date(startDate as string);
      if (endDate) range.lte = new Date(endDate as string);
      must.push({ range: { date: range } });
    }

    const body = must.length > 0 ? { query: { bool: { must } } } : { query: { match_all: {} } };

    const result = await elasticsearchClient.search({
      index: 'emails',
      body,
      size: 50
    });

    res.json({
      success: true,
      data: result.hits.hits.map((hit: any) => hit._source)
    });
  } catch (err) {
    console.error('Error searching emails:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to search emails'
    });
  }
}

export async function getSuggestedReply(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const { context } = req.body;

    // First get the email
    const emailResult = await elasticsearchClient.search({
      index: 'emails',
      body: {
        query: {
          term: {
            messageId: messageId
          }
        }
      }
    });

    if (emailResult.hits.hits.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Email not found'
      });
      return;
    }

    const email = emailResult.hits.hits[0]._source as import('../models/email.model').Email;
    const suggestedReply = await generateSuggestedReply(email, context);

    res.json({
      success: true,
      data: suggestedReply
    });
  } catch (err) {
    console.error('Error generating suggested reply:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggested reply'
    });
  }
}

