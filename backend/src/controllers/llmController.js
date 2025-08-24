const LLMSettings = require('../models/LLMSettings');
const AIService = require('../services/aiService');

// Get current LLM settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await LLMSettings.getActiveSettings();
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        settings: {
          provider: 'openrouter',
          selectedModel: 'openai/gpt-4o-mini',
          modelConfig: {
            temperature: 0.7,
            maxTokens: 2000,
            topP: 1
          },
          apiKey: '***hidden***'
        }
      });
    }

    // Hide API key for security
    const safeSettings = {
      ...settings.toObject(),
      apiKey: settings.apiKey ? '***hidden***' : ''
    };

    res.json({
      success: true,
      settings: safeSettings
    });
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch LLM settings'
    });
  }
};

// Update LLM settings
exports.updateSettings = async (req, res) => {
  try {
    const {
      provider,
      apiKey,
      baseUrl,
      selectedModel,
      modelConfig
    } = req.body;

    // Find existing settings or create new
    let settings = await LLMSettings.getActiveSettings();
    
    if (!settings) {
      settings = new LLMSettings();
    }

    // Update fields
    if (provider) settings.provider = provider;
    if (baseUrl) settings.baseUrl = baseUrl;
    if (selectedModel) settings.selectedModel = selectedModel;
    if (modelConfig) settings.modelConfig = modelConfig;
    
    // Update API key only if provided and not the hidden placeholder
    if (apiKey && apiKey !== '***hidden***') {
      settings.setApiKey(apiKey);
    }

    settings.updatedBy = req.user._id;
    settings.lastUpdated = Date.now();

    await settings.save();

    // Clear AI service cache to use new settings
    AIService.openRouterClient = null;
    AIService.currentSettings = null;

    res.json({
      success: true,
      message: 'LLM settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating LLM settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update LLM settings'
    });
  }
};

// Get available models
exports.getModels = async (req, res) => {
  try {
    const settings = await LLMSettings.getActiveSettings();
    
    if (!settings || !settings.availableModels || settings.availableModels.length === 0) {
      // Return some default models if none are cached
      return res.json({
        success: true,
        models: [
          {
            id: 'openai/gpt-4o-mini',
            name: 'GPT-4o Mini',
            pricing: { prompt: 0.00015, completion: 0.0006 },
            contextLength: 128000
          },
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            pricing: { prompt: 0.005, completion: 0.015 },
            contextLength: 128000
          },
          {
            id: 'anthropic/claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            pricing: { prompt: 0.003, completion: 0.015 },
            contextLength: 200000
          }
        ]
      });
    }

    res.json({
      success: true,
      models: settings.availableModels
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch models'
    });
  }
};

// Refresh models from OpenRouter
exports.refreshModels = async (req, res) => {
  try {
    const models = await AIService.getAvailableModels();
    
    // Update the settings with new models
    const settings = await LLMSettings.getActiveSettings();
    if (settings) {
      settings.availableModels = models;
      await settings.save();
    }

    res.json({
      success: true,
      count: models.length,
      models
    });
  } catch (error) {
    console.error('Error refreshing models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh models from OpenRouter'
    });
  }
};

// Test LLM configuration
exports.testConfiguration = async (req, res) => {
  try {
    // Test by generating a simple problem
    const testProblems = await AIService.generateProblems({
      subject: 'Math',
      grade: '5',
      count: 1,
      topics: 'basic arithmetic',
      difficulty: 'easy'
    });

    if (testProblems && testProblems.problems && testProblems.problems.length > 0) {
      res.json({
        success: true,
        message: 'LLM configuration test successful',
        sample: testProblems.problems[0],
        model: testProblems.metadata?.model,
        tokensUsed: testProblems.metadata?.tokensUsed
      });
    } else {
      throw new Error('No problems generated');
    }
  } catch (error) {
    console.error('LLM test failed:', error);
    res.status(500).json({
      success: false,
      message: `LLM test failed: ${error.message}`
    });
  }
};