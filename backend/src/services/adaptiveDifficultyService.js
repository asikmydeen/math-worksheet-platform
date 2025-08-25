const Worksheet = require('../models/Worksheet');

class AdaptiveDifficultyService {
  /**
   * Calculate the recommended difficulty based on user's performance history
   * @param {String} userId - User ID
   * @param {String} subject - Subject for which to calculate difficulty
   * @param {String} grade - Grade level
   * @param {Array} topics - Topics to consider
   * @returns {Object} - Recommended difficulty and confidence level
   */
  static async calculateAdaptiveDifficulty(userId, subject, grade, topics = []) {
    try {
      // Get user's recent performance data
      const recentWorksheets = await Worksheet.find({
        user: userId,
        subject: subject,
        grade: grade,
        status: 'completed',
        score: { $ne: null }
      })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('score difficulty problems completedAt timeSpent');

      if (recentWorksheets.length === 0) {
        // No history, start with medium difficulty
        return {
          difficulty: 'medium',
          confidence: 'low',
          reason: 'No performance history available'
        };
      }

      // Calculate weighted average score (more recent = higher weight)
      let weightedScoreSum = 0;
      let weightSum = 0;
      const difficultyScores = {
        easy: [],
        medium: [],
        hard: []
      };

      recentWorksheets.forEach((worksheet, index) => {
        const weight = 1 / (index + 1); // More recent worksheets have higher weight
        weightedScoreSum += worksheet.score * weight;
        weightSum += weight;

        // Track scores by difficulty
        if (worksheet.difficulty && difficultyScores[worksheet.difficulty]) {
          difficultyScores[worksheet.difficulty].push(worksheet.score);
        }
      });

      const weightedAverageScore = weightedScoreSum / weightSum;

      // Calculate average time per problem
      const avgTimePerProblem = recentWorksheets.reduce((sum, ws) => {
        if (ws.timeSpent && ws.problems.length > 0) {
          return sum + (ws.timeSpent / ws.problems.length);
        }
        return sum;
      }, 0) / recentWorksheets.filter(ws => ws.timeSpent > 0).length;

      // Determine recommended difficulty based on performance
      let recommendedDifficulty;
      let confidence = 'medium';
      let reason = '';

      if (weightedAverageScore >= 85) {
        // Excellent performance - increase difficulty
        const currentDifficulty = recentWorksheets[0].difficulty || 'medium';
        if (currentDifficulty === 'easy') {
          recommendedDifficulty = 'medium';
          reason = 'Excellent performance on easy problems';
        } else if (currentDifficulty === 'medium') {
          recommendedDifficulty = 'hard';
          reason = 'Excellent performance on medium problems';
        } else {
          recommendedDifficulty = 'hard';
          reason = 'Maintaining excellent performance on hard problems';
        }
        confidence = 'high';
      } else if (weightedAverageScore >= 70) {
        // Good performance - maintain or slightly increase
        recommendedDifficulty = 'medium';
        reason = 'Good performance level';
        
        // Check if ready for harder problems
        const mediumScores = difficultyScores.medium;
        if (mediumScores.length > 3 && 
            mediumScores.slice(-3).every(score => score >= 80)) {
          recommendedDifficulty = 'hard';
          reason = 'Consistent good performance on medium problems';
        }
        confidence = 'high';
      } else if (weightedAverageScore >= 50) {
        // Moderate performance - may need easier problems
        recommendedDifficulty = 'medium';
        const recentScores = recentWorksheets.slice(0, 3).map(ws => ws.score);
        if (recentScores.every(score => score < 60)) {
          recommendedDifficulty = 'easy';
          reason = 'Recent struggles suggest easier problems needed';
        } else {
          reason = 'Moderate performance, continuing with medium difficulty';
        }
        confidence = 'medium';
      } else {
        // Low performance - definitely easier problems
        recommendedDifficulty = 'easy';
        reason = 'Low performance suggests need for easier problems';
        confidence = 'high';
      }

      // Adjust based on time spent
      if (avgTimePerProblem > 180) { // More than 3 minutes per problem
        if (recommendedDifficulty === 'hard') {
          recommendedDifficulty = 'medium';
          reason += ' (adjusted due to high time per problem)';
        } else if (recommendedDifficulty === 'medium') {
          recommendedDifficulty = 'easy';
          reason += ' (adjusted due to high time per problem)';
        }
      }

      // Topic-specific adjustment
      if (topics && topics.length > 0) {
        const topicPerformance = await this.getTopicSpecificPerformance(userId, subject, topics);
        if (topicPerformance.avgScore < 50 && recommendedDifficulty !== 'easy') {
          recommendedDifficulty = 'easy';
          reason = `Struggling with specific topics: ${topics.join(', ')}`;
          confidence = 'high';
        }
      }

      return {
        difficulty: recommendedDifficulty,
        confidence,
        reason,
        metrics: {
          weightedAverageScore: Math.round(weightedAverageScore),
          recentWorksheetsAnalyzed: recentWorksheets.length,
          avgTimePerProblem: Math.round(avgTimePerProblem),
          difficultyBreakdown: Object.entries(difficultyScores).reduce((acc, [diff, scores]) => {
            if (scores.length > 0) {
              acc[diff] = {
                count: scores.length,
                avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              };
            }
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error calculating adaptive difficulty:', error);
      return {
        difficulty: 'medium',
        confidence: 'low',
        reason: 'Error calculating difficulty, defaulting to medium'
      };
    }
  }

  /**
   * Get performance data for specific topics
   */
  static async getTopicSpecificPerformance(userId, subject, topics) {
    const worksheets = await Worksheet.aggregate([
      {
        $match: {
          user: userId,
          subject: subject,
          status: 'completed',
          topics: { $in: topics }
        }
      },
      {
        $unwind: '$problems'
      },
      {
        $match: {
          'problems.topic': { $in: topics }
        }
      },
      {
        $group: {
          _id: null,
          totalCorrect: {
            $sum: { $cond: ['$problems.isCorrect', 1, 0] }
          },
          totalProblems: { $sum: 1 }
        }
      }
    ]);

    if (worksheets.length === 0) {
      return { avgScore: 0, totalProblems: 0 };
    }

    const result = worksheets[0];
    const avgScore = (result.totalCorrect / result.totalProblems) * 100;

    return {
      avgScore: Math.round(avgScore),
      totalProblems: result.totalProblems
    };
  }

  /**
   * Get personalized problem mix based on performance
   */
  static async getAdaptiveProblemMix(userId, subject, grade, requestedCount) {
    const performance = await this.calculateAdaptiveDifficulty(userId, subject, grade);
    
    let problemMix = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    // Based on recommended difficulty, create a mix
    switch (performance.difficulty) {
      case 'easy':
        problemMix.easy = Math.ceil(requestedCount * 0.6);
        problemMix.medium = Math.floor(requestedCount * 0.3);
        problemMix.hard = requestedCount - problemMix.easy - problemMix.medium;
        break;
      case 'medium':
        problemMix.easy = Math.ceil(requestedCount * 0.2);
        problemMix.medium = Math.ceil(requestedCount * 0.5);
        problemMix.hard = requestedCount - problemMix.easy - problemMix.medium;
        break;
      case 'hard':
        problemMix.easy = Math.floor(requestedCount * 0.1);
        problemMix.medium = Math.ceil(requestedCount * 0.3);
        problemMix.hard = requestedCount - problemMix.easy - problemMix.medium;
        break;
    }

    return {
      mix: problemMix,
      recommendedDifficulty: performance.difficulty,
      confidence: performance.confidence,
      reason: performance.reason
    };
  }
}

module.exports = AdaptiveDifficultyService;