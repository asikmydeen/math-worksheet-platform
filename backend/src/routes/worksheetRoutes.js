const express = require('express');
const router = express.Router();
const {
  generateWorksheet,
  getWorksheets,
  getWorksheet,
  submitWorksheet,
  deleteWorksheet
} = require('../controllers/worksheetController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/generate', generateWorksheet);
router.get('/', getWorksheets);
router.get('/:id', getWorksheet);
router.post('/:id/submit', submitWorksheet);
router.delete('/:id', deleteWorksheet);

module.exports = router;
