const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getProgressOverTime,
  getLeaderboard,
  getTopicAnalytics,
  getLearningCurve,
  getComparativeAnalytics,
  getRecommendations
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/user', getUserAnalytics);
router.get('/progress', getProgressOverTime);
router.get('/leaderboard', getLeaderboard);
router.get('/topics', getTopicAnalytics);
router.get('/learning-curve/:topic', getLearningCurve);
router.get('/comparative', getComparativeAnalytics);
router.get('/recommendations', getRecommendations);

module.exports = router;
