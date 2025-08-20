const express = require('express');
const router = express.Router();
const {
  getKidProfiles,
  createKidProfile,
  updateKidProfile,
  deleteKidProfile,
  switchActiveProfile,
  getActiveProfile,
  bulkCreateKidProfiles,
  getProfileStats
} = require('../controllers/kidProfileController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get all kid profiles for current user
router.get('/', getKidProfiles);

// Get currently active profile
router.get('/active', getActiveProfile);

// Create new kid profile
router.post('/', createKidProfile);

// Bulk create kid profiles (for initial setup)
router.post('/bulk', bulkCreateKidProfiles);

// Switch active profile
router.put('/switch/:profileId', switchActiveProfile);

// Get profile statistics
router.get('/:profileId/stats', getProfileStats);

// Update kid profile
router.put('/:profileId', updateKidProfile);

// Delete/deactivate kid profile
router.delete('/:profileId', deleteKidProfile);

module.exports = router;