'use client'
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface Email {
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  date: Date;
  folder: string;
  account: string;
  labels: string[];
}

export async function searchEmails(params: {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  folder?: string;
  account?: string;
  label?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Email[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/emails`, { params });
    console.log('Search response:', response.data.data);
    return response.data.data;
  } catch (err) {
    console.error('Error searching emails:', err);
    return [];
  }
}

export async function getSuggestedReply(messageId: string, context: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/emails/${messageId}/suggest-reply`, { context });
    return response.data.data;
  } catch (err) {
    console.error('Error getting suggested reply:', err);
    return '';
  }
}