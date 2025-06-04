import { Client } from '@elastic/elasticsearch';

const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200'
});

async function setupElasticsearchIndex(): Promise<void> {
  try {
    const indexExists = await elasticsearchClient.indices.exists({ index: 'emails' });
    
    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: 'emails',
        body: {
          mappings: {
            properties: {
              messageId: { type: 'keyword' },
              from: { type: 'keyword' },
              to: { type: 'keyword' },
              subject: { type: 'text' },
              text: { type: 'text' },
              html: { type: 'text' },
              date: { type: 'date' },
              folder: { type: 'keyword' },
              account: { type: 'keyword' },
              labels: { type: 'keyword' }
            }
          }
        }
      });
      console.log('Created emails index');
    }
  } catch (err) {
    console.error('Error setting up Elasticsearch index:', err);
  }
}

export { elasticsearchClient , setupElasticsearchIndex};