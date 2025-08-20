const Worksheet = require('../models/Worksheet');
const User = require('../models/User');
const KidProfile = require('../models/KidProfile');
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

    // Get user and active kid profile
    const user = await User.findById(req.user.id).populate('activeKidProfile');
    
    // Check if user can generate worksheets
    if (!user.canGenerateWorksheets()) {
      return res.status(403).json({
        success: false,
        message: 'Please purchase a subscription to generate worksheets.',
        requiresSubscription: true,
        subscription: user.subscription
      });
    }

    // Use active kid profile's grade if not specified and profile exists
    const worksheetGrade = grade || (user.activeKidProfile ? user.activeKidProfile.grade : user.grade || '5');

    // Generate problems using AI
    const aiResponse = await AIService.generateProblems({
      subject,
      grade: worksheetGrade,
      count: problemCount,
      topics,
      difficulty,
      customRequest: naturalLanguageRequest
    });

    // Create worksheet
    const worksheet = new Worksheet({
      user: req.user.id,
      kidProfile: user.activeKidProfile ? user.activeKidProfile._id : null,
      title: title || aiResponse.title,
      description: aiResponse.description,
      subject,
      grade: worksheetGrade,
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
      order = 'desc',
      kidProfileId
    } = req.query;

    // Get user with active profile
    const user = await User.findById(req.user.id).populate('activeKidProfile');
    const query = { user: req.user.id };
    
    // Filter by kid profile if specified or use active profile
    const profileId = kidProfileId || (user.activeKidProfile ? user.activeKidProfile._id : null);
    if (profileId) {
      query.kidProfile = profileId;
    }
    
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
    }).populate('kidProfile', 'name grade avatar');

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

    // Update kid profile or user stats
    if (worksheet.kidProfile) {
      const kidProfile = await KidProfile.findById(worksheet.kidProfile);
      if (kidProfile) {
        await kidProfile.updateStats(score, worksheet.problems.length, timeSpent, worksheet.subject);
      }
    } else {
      // Fallback to user stats for backward compatibility
      const user = await User.findById(req.user.id);
      if (user) {
        await user.updateStats(score, worksheet.problems.length);
      }
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
