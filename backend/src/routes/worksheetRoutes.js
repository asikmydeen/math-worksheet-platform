const express = require('express');
const router = express.Router();
const {
  generateWorksheet,
  generateWorksheetPreview,
  createWorksheetFromPreview,
  getWorksheets,
  getWorksheet,
  submitWorksheet,
  deleteWorksheet
} = require('../controllers/worksheetController');
const {
  generateWorksheetStream,
  getGenerationProgress
} = require('../controllers/worksheetStreamController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/generate', generateWorksheet);
router.post('/generate-preview', generateWorksheetPreview);
router.post('/create-from-preview', createWorksheetFromPreview);
router.post('/generate-stream', generateWorksheetStream);
router.get('/generation-stats', getGenerationProgress);
router.get('/', getWorksheets);
router.get('/:id', getWorksheet);
router.post('/:id/submit', submitWorksheet);
router.delete('/:id', deleteWorksheet);

module.exports = router;
