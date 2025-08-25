const Worksheet = require('../models/Worksheet');
const User = require('../models/User');
const KidProfile = require('../models/KidProfile');
const AIService = require('../services/aiService');
const CacheService = require('../services/cacheService');
const AdaptiveDifficultyService = require('../services/adaptiveDifficultyService');

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
      title,
      problemTypes,
      timerEnabled = false,
      timeLimit
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

    // Calculate adaptive difficulty if not specified or if set to 'adaptive'
    let effectiveDifficulty = difficulty;
    let adaptiveInfo = null;
    
    if (!difficulty || difficulty === 'adaptive') {
      adaptiveInfo = await AdaptiveDifficultyService.calculateAdaptiveDifficulty(
        req.user.id,
        subject,
        worksheetGrade,
        topics
      );
      effectiveDifficulty = adaptiveInfo.difficulty;
      console.log('Using adaptive difficulty:', adaptiveInfo);
    }

    // Check cache first (only for standard requests, not custom)
    let aiResponse;
    const cacheParams = {
      subject,
      grade: worksheetGrade,
      count: problemCount,
      topics,
      difficulty: effectiveDifficulty
    };
    
    if (!naturalLanguageRequest) {
      const cached = CacheService.getCachedWorksheet(cacheParams);
      if (cached) {
        console.log('Using cached worksheet');
        aiResponse = cached;
      }
    }
    
    // If not cached, check problem bank
    if (!aiResponse && !naturalLanguageRequest) {
      const bankProblems = CacheService.getFromProblemBank(subject, worksheetGrade, problemCount, topics);
      if (bankProblems) {
        console.log('Using problems from bank');
        aiResponse = {
          problems: bankProblems,
          title: title || `${subject} Worksheet - Grade ${worksheetGrade}`,
          fromBank: true
        };
      }
    }
    
    // If still no response, generate new problems
    if (!aiResponse) {
      aiResponse = await AIService.generateProblemsWithRetry({
        subject,
        grade: worksheetGrade,
        count: problemCount,
        topics,
        difficulty: effectiveDifficulty,
        customRequest: naturalLanguageRequest,
        problemTypes
      });
      
      // Cache the response and add to problem bank
      if (!naturalLanguageRequest) {
        CacheService.cacheWorksheet(cacheParams, aiResponse);
        CacheService.addToProblemaBank(subject, worksheetGrade, aiResponse.problems);
      }
    }

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
      difficulty: effectiveDifficulty,
      timerEnabled,
      timeLimit: timerEnabled ? timeLimit : undefined,
      status: 'in-progress'
    });

    await worksheet.save();

    // Update user's AI request count
    user.subscription.aiRequestsUsed += 1;
    await user.save();

    res.status(201).json({
      success: true,
      worksheet,
      adaptiveInfo: adaptiveInfo,
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
      kidProfileId,
      cursor, // For cursor-based pagination
      useCursor = false
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

    // Add cursor condition for cursor-based pagination
    if (useCursor && cursor) {
      const sortDirection = order === 'desc' ? '$lt' : '$gt';
      if (sortBy === '_id') {
        query._id = { [sortDirection]: cursor };
      } else {
        // For non-_id fields, we need to handle ties
        const cursorDoc = await Worksheet.findById(cursor).select(sortBy);
        if (cursorDoc) {
          query.$or = [
            { [sortBy]: { [sortDirection]: cursorDoc[sortBy] } },
            { [sortBy]: cursorDoc[sortBy], _id: { [sortDirection]: cursor } }
          ];
        }
      }
    }

    const worksheetsQuery = Worksheet.find(query)
      .sort({ [sortBy]: order === 'desc' ? -1 : 1, _id: -1 }) // Secondary sort by _id for consistency
      .limit(parseInt(limit) + 1) // Fetch one extra to check if there are more
      .select('-problems');

    if (!useCursor) {
      // Traditional pagination
      worksheetsQuery.skip((page - 1) * limit);
    }

    const worksheets = await worksheetsQuery;
    
    // Check if there are more results
    const hasMore = worksheets.length > limit;
    if (hasMore) {
      worksheets.pop(); // Remove the extra document
    }

    // Get the cursor for the last item
    const nextCursor = worksheets.length > 0 ? worksheets[worksheets.length - 1]._id : null;

    // Count total only for traditional pagination
    let total = null;
    if (!useCursor) {
      total = await Worksheet.countDocuments(query);
    }

    res.json({
      success: true,
      worksheets,
      pagination: {
        ...(total !== null && {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }),
        hasMore,
        nextCursor,
        limit: parseInt(limit)
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

// Generate worksheet preview (without saving)
exports.generateWorksheetPreview = async (req, res) => {
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

    // Generate problems using AI service
    const aiResponse = await AIService.generateProblemsWithRetry({
      subject,
      grade: worksheetGrade,
      count: problemCount,
      topics,
      difficulty,
      customRequest: naturalLanguageRequest
    });

    // Return preview data without saving
    res.status(200).json({
      success: true,
      preview: {
        title: title || aiResponse.title,
        description: aiResponse.description,
        subject,
        grade: worksheetGrade,
        topics: topics || aiResponse.problems.map(p => p.topic).filter((v, i, a) => a.indexOf(v) === i),
        problems: aiResponse.problems,
        generationType: naturalLanguageRequest ? 'natural-language' : 'standard',
        naturalLanguageRequest,
        aiModel: aiResponse.metadata?.model,
        difficulty
      }
    });

  } catch (error) {
    console.error('Generate worksheet preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating worksheet preview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create worksheet from preview data
exports.createWorksheetFromPreview = async (req, res) => {
  try {
    const worksheetData = req.body;

    // Get user and active kid profile
    const user = await User.findById(req.user.id).populate('activeKidProfile');
    
    // Check if user can generate worksheets
    if (!user.canGenerateWorksheets()) {
      return res.status(403).json({
        success: false,
        message: 'Please purchase a subscription to generate worksheets.',
        requiresSubscription: true
      });
    }

    // Create worksheet from preview data
    const worksheet = new Worksheet({
      user: req.user.id,
      kidProfile: user.activeKidProfile ? user.activeKidProfile._id : null,
      title: worksheetData.title,
      description: worksheetData.description,
      subject: worksheetData.subject,
      grade: worksheetData.grade,
      topics: worksheetData.topics,
      problems: worksheetData.problems,
      generationType: worksheetData.generationType,
      naturalLanguageRequest: worksheetData.naturalLanguageRequest,
      aiModel: worksheetData.aiModel,
      difficulty: worksheetData.difficulty,
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
    console.error('Create worksheet from preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating worksheet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get adaptive difficulty recommendation
exports.getAdaptiveDifficulty = async (req, res) => {
  try {
    const { subject, grade, topics } = req.query;
    
    const adaptiveInfo = await AdaptiveDifficultyService.calculateAdaptiveDifficulty(
      req.user.id,
      subject || 'Math',
      grade || '5',
      topics ? topics.split(',') : []
    );

    res.json({
      success: true,
      ...adaptiveInfo
    });

  } catch (error) {
    console.error('Get adaptive difficulty error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating adaptive difficulty'
    });
  }
};

// Get AI queue status
exports.getQueueStatus = async (req, res) => {
  try {
    const aiQueueService = require('../services/aiQueueService');
    const { aiCircuitBreaker } = require('../services/circuitBreakerService');
    
    const queueStatus = aiQueueService.getStatus();
    const circuitStatus = aiCircuitBreaker.getStatus();
    
    res.json({
      success: true,
      queue: queueStatus,
      circuitBreaker: circuitStatus
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting queue status'
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
