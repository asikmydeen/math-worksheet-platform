const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const llmController = require('../controllers/llmController');

// All LLM routes require admin authentication
router.use(protect, adminOnly);

// Get current LLM settings
router.get('/settings', llmController.getSettings);

// Update LLM settings
router.put('/settings', llmController.updateSettings);

// Get available models
router.get('/models', llmController.getModels);

// Refresh models from OpenRouter
router.post('/models/refresh', llmController.refreshModels);

// Test LLM configuration
router.post('/test', llmController.testConfiguration);

module.exports = router;