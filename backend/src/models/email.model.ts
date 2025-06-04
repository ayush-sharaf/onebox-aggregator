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

export interface EmailSearchParams {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  folder?: string;
  account?: string;
  label?: string;
  startDate?: Date;
  endDate?: Date;
}