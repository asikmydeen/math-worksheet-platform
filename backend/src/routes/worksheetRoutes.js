const express = require('express');
const router = express.Router();
const {
  generateWorksheet,
  generateWorksheetPreview,
  createWorksheetFromPreview,
  getWorksheets,
  getWorksheet,
  submitWorksheet,
  deleteWorksheet,
  getAdaptiveDifficulty,
  getQueueStatus
} = require('../controllers/worksheetController');
const {
  generateWorksheetStream,
  getGenerationProgress
} = require('../controllers/worksheetStreamController');
const { protect } = require('../middleware/authMiddleware');
const { 
  aiGenerationLimiter,
  worksheetSubmissionLimiter 
} = require('../middleware/rateLimitMiddleware');

// All routes require authentication
router.use(protect);

// Apply AI generation rate limiting to generation endpoints
router.post('/generate', aiGenerationLimiter, generateWorksheet);
router.post('/generate-preview', aiGenerationLimiter, generateWorksheetPreview);
router.post('/create-from-preview', createWorksheetFromPreview);
router.post('/generate-stream', aiGenerationLimiter, generateWorksheetStream);
router.get('/generation-stats', getGenerationProgress);
router.get('/adaptive-difficulty', getAdaptiveDifficulty);
router.get('/queue-status', getQueueStatus);
router.get('/', getWorksheets);
router.get('/:id', getWorksheet);
router.post('/:id/submit', worksheetSubmissionLimiter, submitWorksheet);
router.delete('/:id', deleteWorksheet);

module.exports = router;
