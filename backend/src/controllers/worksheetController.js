const Worksheet = require('../models/Worksheet');
const User = require('../models/User');
const AIService = require('../services/aiService');

// Generate new worksheet
exports.generateWorksheet = async (req, res) => {
  try {
    const { 
      subject = 'Math',
      grade, 
      problemCount = 10, 
      topics, 
      difficulty = 'medium',
      naturalLanguageRequest,
      title
    } = req.body;

    // Check user's AI request limit
    const user = await User.findById(req.user.id);
    
    if (user.subscription.plan !== 'premium' && 
        user.subscription.aiRequestsUsed >= user.subscription.aiRequestsLimit) {
      return res.status(403).json({
        success: false,
        message: 'AI request limit reached. Please upgrade your plan or wait for the monthly reset.'
      });
    }

    // Generate problems using AI
    const aiResponse = await AIService.generateProblems({
      subject,
      grade,
      count: problemCount,
      topics,
      difficulty,
      customRequest: naturalLanguageRequest
    });

    // Create worksheet
    const worksheet = new Worksheet({
      user: req.user.id,
      title: title || aiResponse.title,
      description: aiResponse.description,
      subject,
      grade,
      topics: topics || aiResponse.problems.map(p => p.topic).filter((v, i, a) => a.indexOf(v) === i),
      problems: aiResponse.problems,
      generationType: naturalLanguageRequest ? 'natural-language' : 'standard',
      naturalLanguageRequest,
      aiModel: aiResponse.metadata.model,
      difficulty,
      status: 'in-progress'
    });

    await worksheet.save();

    // Update user's AI request count
    user.subscription.aiRequestsUsed += 1;
    await user.save();

    res.status(201).json({
      success: true,
      worksheet,
      aiRequestsRemaining: user.subscription.plan === 'premium' 
        ? 'unlimited' 
        : user.subscription.aiRequestsLimit - user.subscription.aiRequestsUsed
    });

  } catch (error) {
    console.error('Generate worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating worksheet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all worksheets for a user
exports.getWorksheets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      grade, 
      status, 
      sortBy = 'createdAt',
      order = 'desc' 
    } = req.query;

    const query = { user: req.user.id };
    
    if (grade) query.grade = grade;
    if (status) query.status = status;

    const worksheets = await Worksheet.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-problems');

    const total = await Worksheet.countDocuments(query);

    res.json({
      success: true,
      worksheets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get worksheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worksheets'
    });
  }
};

// Get single worksheet
exports.getWorksheet = async (req, res) => {
  try {
    const worksheet = await Worksheet.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      worksheet
    });

  } catch (error) {
    console.error('Get worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worksheet'
    });
  }
};

// Submit worksheet answers
exports.submitWorksheet = async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    const worksheet = await Worksheet.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Update answers
    answers.forEach((answer, index) => {
      if (worksheet.problems[index]) {
        worksheet.problems[index].userAnswer = answer.userAnswer;
        worksheet.problems[index].timeSpent = answer.timeSpent || 0;
      }
    });

    // Grade the worksheet
    const score = worksheet.gradeProblems();
    
    // Update worksheet metadata
    worksheet.timeSpent = timeSpent || 0;
    worksheet.completedAt = new Date();
    worksheet.status = 'completed';
    worksheet.attempts += 1;

    await worksheet.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    if (user) {
      user.stats.totalWorksheets += 1;
      user.stats.totalProblems += worksheet.problems.length;
      user.stats.correctAnswers += Math.round(score * worksheet.problems.length / 100);
      
      const totalScore = user.stats.averageScore * (user.stats.totalWorksheets - 1) + score;
      user.stats.averageScore = Math.round(totalScore / user.stats.totalWorksheets);
      
      await user.save();
    }

    res.json({
      success: true,
      score,
      worksheet
    });

  } catch (error) {
    console.error('Submit worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting worksheet'
    });
  }
};

// Delete worksheet
exports.deleteWorksheet = async (req, res) => {
  try {
    const worksheet = await Worksheet.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      message: 'Worksheet deleted successfully'
    });

  } catch (error) {
    console.error('Delete worksheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting worksheet'
    });
  }
};
