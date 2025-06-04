
# Email Onebox Aggregator

A feature-rich email management system with AI-powered categorization and response suggestions.

## Features

- 📨 **Real-time Email Sync** - IMAP IDLE mode for instant updates
- 🔍 **Advanced Search** - Elasticsearch-powered email search
- 🤖 **AI Categorization** - Automatic email labeling
- 💬 **Smart Replies** - RAG-powered response suggestions
- 🔔 **Notifications** - Slack/webhook integrations
- 🖥️ **Dashboard** - Clean UI for email management

## Architecture

```mermaid
graph TD
    A[IMAP Servers] --> B[Node.js Backend]
    B --> C[Elasticsearch]
    B --> D[ChromaDB]
    B --> E[Slack/Webhooks]
    C --> F[React Frontend]
    D --> B
    E --> G[External Systems]
    F --> B
```

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: Elasticsearch (email storage), ChromaDB (vector store)
- **AI**: Google Gemini 1.5 Flash
- **Frontend**: React, Material-UI
- **Infra**: Docker, Docker Compose

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker Engine
- Google Cloud API key
- IMAP-enabled email accounts

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run build
npm start
```

### 2. Database Services

```bash
docker-compose up -d elasticsearch chromadb
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Initial Configuration

1. Access Elasticsearch at `http://localhost:9200`
2. ChromaDB dashboard at `http://localhost:8000`
3. Frontend at `http://localhost:5173`

## Environment Variables

### Backend (.env)

```ini
# IMAP Configuration
IMAP1_HOST=imap.example.com
IMAP1_USER=your@email.com
IMAP1_PASSWORD=yourpassword

# Elasticsearch
ELASTICSEARCH_HOST=http://elasticsearch:9200

# AI Services
GEMINI_API_KEY=your-google-api-key

# ChromaDB
CHROMA_DB_URL=http://chromadb:8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/emails` | GET | Get all emails |
| `/api/emails/search` | GET | Search emails |
| `/api/emails/:id/suggest-reply` | POST | Get AI reply suggestion |

## Deployment

Production deployment with Docker:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Troubleshooting

**Q: IMAP connection fails**
```bash
# Test IMAP connection manually
openssl s_client -connect imap.example.com:993 -crlf
```

**Q: ChromaDB won't start**
```bash
# Alternative local ChromaDB
pip install chromadb
python -m chromadb run --path /db_data
```

