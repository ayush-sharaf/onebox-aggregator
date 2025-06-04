import { GoogleGenerativeAI } from "@google/generative-ai";
import { Email } from "../models/email.model";
import dotenv from "dotenv";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function categorizeEmail(text: string): Promise<string> {
  const categories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
  
  try {
    const prompt = `Categorize this email into one of these categories: ${categories.join(', ')}. Respond with just the category name.\n\nEmail: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();

    return categories.includes(category) ? category : 'Not Interested';
  } catch (err) {
    console.error('Error categorizing email:', err);
    return 'Not Interested';
  }
}

export async function generateSuggestedReply(email: Email, context: string): Promise<string> {
  try {
    const prompt = `You are an email response assistant. Given this email and context, generate a professional reply.\n\nContext: ${context}\n\nEmail from ${email.from} (Subject: "${email.subject}"):\n\n${email.text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim() || 'I will get back to you soon with more details.';
  } catch (err) {
    console.error('Error generating suggested reply:', err);
    return 'I will get back to you soon with more details.';
  }
}