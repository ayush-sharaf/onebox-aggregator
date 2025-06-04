import { GoogleGenerativeAI } from "@google/generative-ai";
import { Email } from "../models/email.model";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Interface for context templates stored in vector DB
interface ContextTemplate {
  id: string;
  scenario: string;
  keywords: string[];
  responseTemplate: string;
  metadata: {
    category: string;
    priority: number;
    context: string;
  };
  embedding?: number[]; // Vector representation
}

// In-memory vector store (replace with actual vector DB like Pinecone, Weaviate, etc.)
class SimpleVectorStore {
  private templates: ContextTemplate[] = [];

  async addTemplate(template: ContextTemplate): Promise<void> {
    // Generate embedding for the template
    template.embedding = await this.generateEmbedding(
      `${template.scenario} ${template.keywords.join(' ')} ${template.metadata.context}`
    );
    this.templates.push(template);
  }

  async findSimilarTemplates(query: string, topK: number = 3): Promise<ContextTemplate[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate cosine similarity and sort
    const similarities = this.templates.map(template => ({
      template,
      similarity: this.cosineSimilarity(queryEmbedding, template.embedding!)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => item.template);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Using Gemini's text embedding (you might want to use a dedicated embedding model)
      const result = await model.generateContent(
        `Generate a numerical vector representation for: "${text}". Return only comma-separated numbers.`
      );
      const response = await result.response;
      const embedding = response.text()
        .split(',')
        .map(n => parseFloat(n.trim()))
        .filter(n => !isNaN(n));
      
      // Fallback: simple hash-based embedding if AI embedding fails
      if (embedding.length === 0) {
        return this.simpleHashEmbedding(text);
      }
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.simpleHashEmbedding(text);
    }
  }

  private simpleHashEmbedding(text: string): number[] {
    // Simple hash-based embedding as fallback
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(100).fill(0);
    
    words.forEach(word => {
      const hash = this.simpleHash(word);
      embedding[hash % 100] += 1;
    });
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }
}

// Initialize vector store and populate with context templates
const vectorStore = new SimpleVectorStore();

// Populate vector store with context templates
async function initializeContextTemplates() {
  const templates: ContextTemplate[] = [
    {
      id: "job_interview_invitation",
      scenario: "Received invitation for technical interview or final interview",
      keywords: ["interview", "shortlisted", "resume", "technical", "final", "schedule", "available"],
      responseTemplate: "Thank you for shortlisting my profile! I'm available for the {interview_type}. You can book a slot here: {booking_link}",
      metadata: {
        category: "job_application",
        priority: 1,
        context: "Job application process - interview scheduling"
      }
    },
    {
      id: "meeting_request",
      scenario: "General meeting request or scheduling",
      keywords: ["meeting", "discuss", "call", "schedule", "available", "time", "appointment"],
      responseTemplate: "Thank you for reaching out! I'd be happy to discuss this further. Please book a convenient time slot: {booking_link}",
      metadata: {
        category: "meeting",
        priority: 2,
        context: "General meeting scheduling"
      }
    },
    {
      id: "product_demo_interest",
      scenario: "Interest in product demo or presentation",
      keywords: ["demo", "presentation", "product", "interested", "show", "demonstrate"],
      responseTemplate: "I'm interested in seeing a demo of your product. Please schedule a convenient time: {booking_link}",
      metadata: {
        category: "sales",
        priority: 2,
        context: "Product demonstration request"
      }
    },
    {
      id: "collaboration_proposal",
      scenario: "Business collaboration or partnership inquiry",
      keywords: ["collaboration", "partnership", "work together", "opportunity", "business"],
      responseTemplate: "Thank you for the collaboration opportunity! I'd love to discuss this further. Let's schedule a call: {booking_link}",
      metadata: {
        category: "business",
        priority: 2,
        context: "Business collaboration"
      }
    },
    {
      id: "follow_up_response",
      scenario: "Follow-up on previous conversation",
      keywords: ["follow up", "following up", "checking in", "update", "status"],
      responseTemplate: "Thank you for following up! I appreciate your continued interest. Here's an update: {update_info}",
      metadata: {
        category: "follow_up",
        priority: 3,
        context: "Follow-up communication"
      }
    }
  ];

  for (const template of templates) {
    await vectorStore.addTemplate(template);
  }
}

// Enhanced configuration for user context
interface UserContext {
  name?: string;
  role?: string;
  company?: string;
  bookingLink?: string;
  currentStatus?: string;
  customTemplates?: ContextTemplate[];
}

// Enhanced email categorization
export async function categorizeEmail(text: string): Promise<string> {
  const categories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
  
  try {
    const prompt = `Categorize this email into one of these categories: ${categories.join(', ')}. 
    Consider the context and intent of the email. Respond with just the category name.
    
    Email: ${text}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();
    
    return categories.includes(category) ? category : 'Not Interested';
  } catch (err) {
    console.error('Error categorizing email:', err);
    return 'Not Interested';
  }
}

// RAG-powered suggested reply generation
export async function generateSuggestedReply(
  email: Email, 
  userContext: UserContext = {}
): Promise<string> {
  try {
    // Initialize context templates if not already done
    if (!vectorStore) {
      await initializeContextTemplates();
    }

    // Extract key information from email
    const emailContent = `${email.subject} ${email.text}`;
    
    // Find similar context templates using RAG
    const similarTemplates = await vectorStore.findSimilarTemplates(emailContent, 3);
    
    // Prepare context for LLM
    let contextPrompt = "You are an intelligent email response assistant. ";
    
    if (similarTemplates.length > 0) {
      contextPrompt += "Based on similar scenarios, here are some relevant response patterns:\n\n";
      similarTemplates.forEach((template, index) => {
        contextPrompt += `Pattern ${index + 1}: ${template.scenario}\n`;
        contextPrompt += `Template: ${template.responseTemplate}\n`;
        contextPrompt += `Context: ${template.metadata.context}\n\n`;
      });
    }

    // Add user context
    if (userContext.name) contextPrompt += `Your name: ${userContext.name}\n`;
    if (userContext.role) contextPrompt += `Your role: ${userContext.role}\n`;
    if (userContext.company) contextPrompt += `Your company: ${userContext.company}\n`;
    if (userContext.bookingLink) contextPrompt += `Your booking link: ${userContext.bookingLink}\n`;
    if (userContext.currentStatus) contextPrompt += `Current status: ${userContext.currentStatus}\n`;
    
    const prompt = `${contextPrompt}

Generate a professional, contextually appropriate reply to this email:

From: ${email.from}
Subject: ${email.subject}
Content: ${email.text}

Requirements:
1. Be professional and courteous
2. Address the sender's intent appropriately
3. Include relevant links (especially booking links) when appropriate
4. Keep the response concise but complete
5. Match the tone and urgency of the original email

Generate only the email response content:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let suggestedReply = response.text().trim();

    // Post-process the reply to insert actual values
    if (userContext.bookingLink && suggestedReply.includes('{booking_link}')) {
      suggestedReply = suggestedReply.replace(/{booking_link}/g, userContext.bookingLink);
    }
    
    // Replace other placeholders
    suggestedReply = suggestedReply.replace(/{interview_type}/g, 
      emailContent.toLowerCase().includes('technical') ? 'technical interview' : 'interview');
    
    return suggestedReply || 'Thank you for your email. I will get back to you soon with more details.';
    
  } catch (err) {
    console.error('Error generating suggested reply:', err);
    return 'Thank you for your email. I will get back to you soon with more details.';
  }
}

// Function to add custom context templates
export async function addCustomTemplate(template: ContextTemplate): Promise<void> {
  await vectorStore.addTemplate(template);
}

// Function to update user context
export function createUserContext(options: UserContext): UserContext {
  return {
    name: options.name || "John Doe",
    role: options.role || "Software Developer",
    company: options.company,
    bookingLink: options.bookingLink || "https://cal.com/example",
    currentStatus: options.currentStatus || "Available for opportunities",
    customTemplates: options.customTemplates || []
  };
}

// Usage example function
export async function exampleUsage() {
  // Initialize context templates
  await initializeContextTemplates();
  
  // Create user context
  const userContext = createUserContext({
    name: "John Smith",
    role: "Full Stack Developer",
    bookingLink: "https://cal.com/johnsmith",
    currentStatus: "Actively looking for opportunities"
  });
  
  // Example email
  const email: Email = {
    from: "hr@techcompany.com",
    subject: "Technical Interview Invitation",
    text: "Hi John, Your resume has been shortlisted for the Senior Developer position. When will be a good time for you to attend the technical interview?",
    // Add other required Email properties as needed
  } as Email;
  
  // Generate suggested reply
  const reply = await generateSuggestedReply(email, userContext);
  console.log("Suggested Reply:", reply);
}

// Initialize the system
initializeContextTemplates().catch(console.error);