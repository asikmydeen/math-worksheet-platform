const Worksheet = require('../models/Worksheet');
const User = require('../models/User');

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user stats
    const user = await User.findById(userId);
    
    // Get worksheet statistics
    const worksheetStats = await Worksheet.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalWorksheets: { $sum: 1 },
          completedWorksheets: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageScore: { $avg: '$score' },
          totalTimeSpent: { $sum: '$timeSpent' },
          totalProblems: { $sum: { $size: '$problems' } }
        }
      }
    ]);

    // Get performance by grade
    const performanceByGrade = await Worksheet.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get performance by topic
    const performanceByTopic = await Worksheet.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $unwind: '$topics' },
      {
        $group: {
          _id: '$topics',
          count: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity
    const recentActivity = await Worksheet.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title grade score status createdAt completedAt');

    res.json({
      success: true,
      analytics: {
        userStats: user.stats,
        worksheetStats: worksheetStats[0] || {
          totalWorksheets: 0,
          completedWorksheets: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          totalProblems: 0
        },
        performanceByGrade,
        performanceByTopic,
        recentActivity,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// Get progress over time
exports.getProgressOverTime = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const userId = req.user.id;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const progress = await Worksheet.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          worksheets: { $sum: 1 },
          averageScore: { $avg: '$score' },
          problems: { $sum: { $size: '$problems' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress data'
    });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'all') {
      startDate = new Date(0);
    }

    const leaderboard = await User.aggregate([
      {
        $match: {
          role: 'student',
          'stats.lastActivity': { $gte: startDate }
        }
      },
      {
        $project: {
          name: 1,
          grade: 1,
          score: '$stats.averageScore',
          worksheets: '$stats.totalWorksheets',
          streak: '$stats.streak.current'
        }
      },
      { $sort: { score: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
};
