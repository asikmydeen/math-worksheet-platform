const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration object for easy model switching
const aiConfig = {
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.5,
  max_tokens: 2000,

  // Model-specific settings
  models: {
    'gpt-3.5-turbo': {
      maxTokens: 4096,
      costPer1kTokens: { input: 0.0015, output: 0.002 }
    },
    'gpt-4': {
      maxTokens: 8192,
      costPer1kTokens: { input: 0.03, output: 0.06 }
    },
    'gpt-4-turbo-preview': {
      maxTokens: 128000,
      costPer1kTokens: { input: 0.01, output: 0.03 }
    },
    'gpt-4-32k': {
      maxTokens: 32768,
      costPer1kTokens: { input: 0.06, output: 0.12 }
    }
  }
};

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ Warning: OPENAI_API_KEY is not set in environment variables');
}

module.exports = { openai, aiConfig };
