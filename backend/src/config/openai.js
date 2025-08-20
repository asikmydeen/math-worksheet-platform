const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration object for easy model switching
const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// Some models only support default temperature
const supportsCustomTemperature = !modelName.includes('gpt-5-nano');

const aiConfig = {
  model: modelName,
  temperature: supportsCustomTemperature ? 0.5 : 1.0,
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
    },
    'gpt-4o': {
      maxTokens: 128000,
      costPer1kTokens: { input: 0.005, output: 0.015 }
    },
    'gpt-4o-mini': {
      maxTokens: 128000,
      costPer1kTokens: { input: 0.00015, output: 0.0006 }
    }
  }
};

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ Warning: OPENAI_API_KEY is not set in environment variables');
}

module.exports = { openai, aiConfig };
