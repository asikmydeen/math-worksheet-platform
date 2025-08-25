const Worksheet = require('../models/Worksheet');
const User = require('../models/User');

class AnalyticsService {
  // Get detailed performance analytics per topic
  static async getTopicAnalytics(userId, options = {}) {
    const { timeRange = 'all', grade = null } = options;
    
    // Build date filter
    const dateFilter = {};
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        dateFilter.completedAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter.completedAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case 'year':
        dateFilter.completedAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }
    
    // Build match criteria
    const matchCriteria = {
      user: userId,
      status: 'completed',
      ...dateFilter
    };
    
    if (grade) {
      matchCriteria.grade = grade;
    }
    
    // Aggregate topic performance with detailed metrics
    const topicAnalytics = await Worksheet.aggregate([
      { $match: matchCriteria },
      { $unwind: '$problems' },
      {
        $group: {
          _id: '$problems.topic',
          totalProblems: { $sum: 1 },
          correctProblems: {
            $sum: { $cond: [{ $eq: ['$problems.isCorrect', true] }, 1, 0] }
          },
          totalTimeSpent: { $sum: '$problems.timeSpent' },
          worksheetCount: { $addToSet: '$_id' },
          difficulties: { $push: '$problems.difficulty' },
          scores: { $push: { $cond: [{ $eq: ['$problems.isCorrect', true] }, 100, 0] } }
        }
      },
      {
        $project: {
          topic: '$_id',
          _id: 0,
          totalProblems: 1,
          correctProblems: 1,
          accuracy: { 
            $multiply: [
              { $divide: ['$correctProblems', '$totalProblems'] }, 
              100
            ] 
          },
          averageTimePerProblem: {
            $divide: ['$totalTimeSpent', '$totalProblems']
          },
          worksheetCount: { $size: '$worksheetCount' },
          difficultyBreakdown: {
            easy: {
              $size: {
                $filter: {
                  input: '$difficulties',
                  as: 'diff',
                  cond: { $eq: ['$$diff', 'easy'] }
                }
              }
            },
            medium: {
              $size: {
                $filter: {
                  input: '$difficulties',
                  as: 'diff',
                  cond: { $eq: ['$$diff', 'medium'] }
                }
              }
            },
            hard: {
              $size: {
                $filter: {
                  input: '$difficulties',
                  as: 'diff',
                  cond: { $eq: ['$$diff', 'hard'] }
                }
              }
            }
          },
          performanceTrend: '$scores'
        }
      },
      { $sort: { totalProblems: -1 } }
    ]);
    
    // Calculate performance trends
    for (let topic of topicAnalytics) {
      topic.performanceTrend = this.calculateTrend(topic.performanceTrend);
      topic.mastery = this.calculateMastery(topic);
    }
    
    return topicAnalytics;
  }
  
  // Calculate performance trend (improving, declining, stable)
  static calculateTrend(scores) {
    if (scores.length < 5) return 'insufficient_data';
    
    // Take last 10 scores for trend analysis
    const recentScores = scores.slice(-10);
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }
  
  // Calculate mastery level
  static calculateMastery(topicData) {
    const { accuracy, totalProblems, difficultyBreakdown } = topicData;
    
    // Weighted mastery calculation
    const difficultyWeight = 
      (difficultyBreakdown.easy * 1 + 
       difficultyBreakdown.medium * 2 + 
       difficultyBreakdown.hard * 3) / 
      (difficultyBreakdown.easy + difficultyBreakdown.medium + difficultyBreakdown.hard);
    
    const masteryScore = (accuracy * 0.6) + (difficultyWeight * 10 * 0.4);
    
    if (masteryScore >= 90 && totalProblems >= 20) return 'mastered';
    if (masteryScore >= 75 && totalProblems >= 10) return 'proficient';
    if (masteryScore >= 60) return 'developing';
    return 'needs_practice';
  }
  
  // Get learning curve data
  static async getLearningCurve(userId, topic, options = {}) {
    const { limit = 50 } = options;
    
    const learningData = await Worksheet.aggregate([
      { 
        $match: { 
          user: userId, 
          status: 'completed',
          topics: topic 
        } 
      },
      { $unwind: '$problems' },
      { 
        $match: { 
          'problems.topic': topic 
        } 
      },
      {
        $group: {
          _id: '$_id',
          completedAt: { $first: '$completedAt' },
          accuracy: {
            $avg: { $cond: [{ $eq: ['$problems.isCorrect', true] }, 100, 0] }
          },
          avgTime: { $avg: '$problems.timeSpent' },
          difficulty: { $first: '$difficulty' }
        }
      },
      { $sort: { completedAt: 1 } },
      { $limit: limit },
      {
        $project: {
          date: '$completedAt',
          accuracy: 1,
          avgTime: 1,
          difficulty: 1,
          cumulativeProblems: { $literal: 0 } // Will be calculated in post-processing
        }
      }
    ]);
    
    // Add cumulative problem count
    let cumulative = 0;
    learningData.forEach((point, index) => {
      cumulative += 1;
      point.cumulativeProblems = cumulative;
      point.index = index + 1;
    });
    
    return {
      data: learningData,
      summary: {
        totalSessions: learningData.length,
        improvementRate: this.calculateImprovementRate(learningData),
        currentAccuracy: learningData[learningData.length - 1]?.accuracy || 0,
        timeEfficiency: this.calculateTimeEfficiency(learningData)
      }
    };
  }
  
  // Calculate improvement rate
  static calculateImprovementRate(learningData) {
    if (learningData.length < 2) return 0;
    
    const firstThird = learningData.slice(0, Math.floor(learningData.length / 3));
    const lastThird = learningData.slice(-Math.floor(learningData.length / 3));
    
    const firstAvg = firstThird.reduce((sum, d) => sum + d.accuracy, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, d) => sum + d.accuracy, 0) / lastThird.length;
    
    return lastAvg - firstAvg;
  }
  
  // Calculate time efficiency improvement
  static calculateTimeEfficiency(learningData) {
    if (learningData.length < 2) return 0;
    
    const firstHalf = learningData.slice(0, Math.floor(learningData.length / 2));
    const secondHalf = learningData.slice(Math.floor(learningData.length / 2));
    
    const firstAvgTime = firstHalf.reduce((sum, d) => sum + d.avgTime, 0) / firstHalf.length;
    const secondAvgTime = secondHalf.reduce((sum, d) => sum + d.avgTime, 0) / secondHalf.length;
    
    // Positive value means getting faster
    return ((firstAvgTime - secondAvgTime) / firstAvgTime) * 100;
  }
  
  // Get comparative analytics (vs class average)
  static async getComparativeAnalytics(userId, options = {}) {
    const user = await User.findById(userId);
    const { grade = user.grade } = options;
    
    // Get user's performance
    const userPerformance = await this.getUserPerformanceSummary(userId);
    
    // Get class average (all users in same grade)
    const classPerformance = await Worksheet.aggregate([
      { 
        $match: { 
          grade, 
          status: 'completed',
          user: { $ne: userId }
        } 
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgTimePerProblem: { $avg: { $divide: ['$timeSpent', { $size: '$problems' }] } },
          totalWorksheets: { $sum: 1 }
        }
      }
    ]);
    
    // Get performance by topic for comparison
    const userTopics = await this.getTopicAnalytics(userId, { grade });
    const classTopics = await Worksheet.aggregate([
      { 
        $match: { 
          grade, 
          status: 'completed',
          user: { $ne: userId }
        } 
      },
      { $unwind: '$problems' },
      {
        $group: {
          _id: '$problems.topic',
          accuracy: {
            $avg: { $cond: [{ $eq: ['$problems.isCorrect', true] }, 100, 0] }
          }
        }
      }
    ]);
    
    // Create comparison data
    const topicComparison = userTopics.map(userTopic => {
      const classTopic = classTopics.find(ct => ct._id === userTopic.topic);
      return {
        topic: userTopic.topic,
        userAccuracy: userTopic.accuracy,
        classAccuracy: classTopic?.accuracy || 0,
        difference: userTopic.accuracy - (classTopic?.accuracy || 0),
        percentile: this.calculatePercentile(userTopic.accuracy, grade, userTopic.topic)
      };
    });
    
    return {
      overall: {
        user: userPerformance,
        class: classPerformance[0] || { avgScore: 0, avgTimePerProblem: 0 },
        ranking: await this.getUserRanking(userId, grade)
      },
      byTopic: topicComparison,
      strengths: topicComparison.filter(t => t.difference > 10).map(t => t.topic),
      improvements: topicComparison.filter(t => t.difference < -10).map(t => t.topic)
    };
  }
  
  // Get user performance summary
  static async getUserPerformanceSummary(userId) {
    const summary = await Worksheet.aggregate([
      { 
        $match: { 
          user: userId, 
          status: 'completed' 
        } 
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalWorksheets: { $sum: 1 },
          avgTimePerProblem: { 
            $avg: { 
              $divide: ['$timeSpent', { $size: '$problems' }] 
            } 
          }
        }
      }
    ]);
    
    return summary[0] || { avgScore: 0, totalWorksheets: 0, avgTimePerProblem: 0 };
  }
  
  // Calculate percentile (simplified - in production, this would query all users)
  static calculatePercentile(score, grade, topic) {
    // Simplified percentile calculation
    if (score >= 95) return 95;
    if (score >= 85) return 80;
    if (score >= 75) return 65;
    if (score >= 65) return 50;
    if (score >= 55) return 35;
    return 20;
  }
  
  // Get user ranking
  static async getUserRanking(userId, grade) {
    const ranking = await User.aggregate([
      { 
        $match: { 
          grade, 
          'stats.averageScore': { $exists: true } 
        } 
      },
      {
        $sort: { 'stats.averageScore': -1 }
      },
      {
        $group: {
          _id: null,
          users: { $push: { _id: '$_id', score: '$stats.averageScore' } }
        }
      },
      {
        $project: {
          ranking: {
            $add: [
              { $indexOfArray: ['$users._id', userId] },
              1
            ]
          },
          total: { $size: '$users' }
        }
      }
    ]);
    
    return ranking[0] || { ranking: 0, total: 0 };
  }
  
  // Generate personalized study recommendations
  static async generateRecommendations(userId, options = {}) {
    const topicAnalytics = await this.getTopicAnalytics(userId, options);
    const learningPatterns = await this.analyzeLearningPatterns(userId);
    
    const recommendations = [];
    
    // Recommend topics that need practice
    const needsPractice = topicAnalytics
      .filter(t => t.mastery === 'needs_practice' || t.mastery === 'developing')
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
    
    needsPractice.forEach(topic => {
      recommendations.push({
        type: 'practice',
        topic: topic.topic,
        reason: `Your accuracy in ${topic.topic} is ${Math.round(topic.accuracy)}%. Practice more to improve!`,
        suggestedDifficulty: topic.accuracy < 60 ? 'easy' : 'medium',
        estimatedProblems: 10
      });
    });
    
    // Recommend advancing in mastered topics
    const mastered = topicAnalytics
      .filter(t => t.mastery === 'mastered')
      .slice(0, 2);
    
    mastered.forEach(topic => {
      if (topic.difficultyBreakdown.hard < topic.totalProblems * 0.3) {
        recommendations.push({
          type: 'challenge',
          topic: topic.topic,
          reason: `You've mastered ${topic.topic}! Try harder problems to further improve.`,
          suggestedDifficulty: 'hard',
          estimatedProblems: 5
        });
      }
    });
    
    // Time-based recommendations
    if (learningPatterns.bestTimeOfDay) {
      recommendations.push({
        type: 'schedule',
        reason: `You perform best during ${learningPatterns.bestTimeOfDay}. Schedule your practice then!`,
        suggestedTime: learningPatterns.bestTimeOfDay
      });
    }
    
    // Streak recommendations
    if (learningPatterns.currentStreak === 0) {
      recommendations.push({
        type: 'motivation',
        reason: 'Start a new streak today! Consistent practice leads to better results.',
        target: 'Complete 1 worksheet today'
      });
    }
    
    return {
      recommendations,
      summary: {
        strongTopics: topicAnalytics.filter(t => t.mastery === 'mastered').map(t => t.topic),
        needsWork: needsPractice.map(t => t.topic),
        suggestedFocus: needsPractice[0]?.topic || null
      }
    };
  }
  
  // Analyze learning patterns
  static async analyzeLearningPatterns(userId) {
    const recentWorksheets = await Worksheet.find({
      user: userId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ completedAt: -1 });
    
    // Analyze time of day performance
    const timePerformance = {};
    recentWorksheets.forEach(worksheet => {
      const hour = new Date(worksheet.completedAt).getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      if (!timePerformance[timeOfDay]) {
        timePerformance[timeOfDay] = { total: 0, count: 0 };
      }
      
      timePerformance[timeOfDay].total += worksheet.score || 0;
      timePerformance[timeOfDay].count += 1;
    });
    
    // Find best time of day
    let bestTime = null;
    let bestScore = 0;
    
    Object.entries(timePerformance).forEach(([time, data]) => {
      const avg = data.total / data.count;
      if (avg > bestScore) {
        bestScore = avg;
        bestTime = time;
      }
    });
    
    // Calculate current streak
    const user = await User.findById(userId);
    
    return {
      bestTimeOfDay: bestTime,
      averageSessionsPerWeek: recentWorksheets.length / 4,
      currentStreak: user.stats?.streak?.current || 0,
      preferredDifficulty: this.getPreferredDifficulty(recentWorksheets)
    };
  }
  
  // Get preferred difficulty
  static getPreferredDifficulty(worksheets) {
    const difficulties = worksheets.map(w => w.difficulty).filter(Boolean);
    const counts = difficulties.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';
  }
}

module.exports = AnalyticsService;