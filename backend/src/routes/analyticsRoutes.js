const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getProgressOverTime,
  getLeaderboard
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/user', getUserAnalytics);
router.get('/progress', getProgressOverTime);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
