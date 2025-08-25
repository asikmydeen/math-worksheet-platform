const Worksheet = require('../models/Worksheet');
const User = require('../models/User');
const AIService = require('../services/aiService');
const CacheService = require('../services/cacheService');

// Generate worksheet with real-time progress updates
exports.generateWorksheetStream = async (req, res) => {
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    message: 'Starting worksheet generation...' 
  })}\n\n`);
  
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

    // Send progress: Checking user permissions
    res.write(`data: ${JSON.stringify({ 
      type: 'progress', 
      step: 1,
      total: 5,
      message: 'Checking user permissions...' 
    })}\n\n`);

    // Get user and active kid profile
    const user = await User.findById(req.user.id).populate('activeKidProfile');
    
    // Check if user can generate worksheets
    if (!user.canGenerateWorksheets()) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        message: 'Please purchase a subscription to generate worksheets.',
        requiresSubscription: true
      })}\n\n`);
      res.end();
      return;
    }

    const worksheetGrade = grade || (user.activeKidProfile ? user.activeKidProfile.grade : user.grade || '5');

    // Send progress: Checking cache
    res.write(`data: ${JSON.stringify({ 
      type: 'progress', 
      step: 2,
      total: 5,
      message: 'Checking for existing worksheets...' 
    })}\n\n`);

    // Check cache
    let aiResponse;
    const cacheParams = { subject, grade: worksheetGrade, count: problemCount, topics, difficulty };
    
    if (!naturalLanguageRequest) {
      const cached = CacheService.getCachedWorksheet(cacheParams);
      if (cached) {
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          step: 3,
          total: 5,
          message: 'Found cached worksheet!' 
        })}\n\n`);
        aiResponse = cached;
      }
    }

    // If not cached, generate new
    if (!aiResponse) {
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        step: 3,
        total: 5,
        message: 'Generating problems with AI...' 
      })}\n\n`);

      // Create a wrapper that sends progress updates
      const originalLog = console.log;
      console.log = (message) => {
        originalLog(message);
        if (message.includes('Attempt') || message.includes('fallback model')) {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress', 
            step: 3,
            total: 5,
            message: message 
          })}\n\n`);
        }
      };

      aiResponse = await AIService.generateProblemsWithRetry({
        subject,
        grade: worksheetGrade,
        count: problemCount,
        topics,
        difficulty,
        customRequest: naturalLanguageRequest
      });

      // Restore console.log
      console.log = originalLog;

      // Cache if successful
      if (!naturalLanguageRequest) {
        CacheService.cacheWorksheet(cacheParams, aiResponse);
        CacheService.addToProblemaBank(subject, worksheetGrade, aiResponse.problems);
      }
    }

    // Send progress: Creating worksheet
    res.write(`data: ${JSON.stringify({ 
      type: 'progress', 
      step: 4,
      total: 5,
      message: 'Creating worksheet...' 
    })}\n\n`);

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
      aiModel: aiResponse.metadata?.model,
      difficulty,
      status: 'in-progress'
    });

    await worksheet.save();

    // Update user's AI request count
    user.subscription.aiRequestsUsed += 1;
    await user.save();

    // Send final success
    res.write(`data: ${JSON.stringify({ 
      type: 'complete',
      step: 5,
      total: 5,
      message: 'Worksheet generated successfully!',
      worksheet: worksheet,
      aiRequestsRemaining: user.subscription.plan === 'premium' 
        ? 'unlimited' 
        : user.subscription.aiRequestsLimit - user.subscription.aiRequestsUsed,
      fromCache: aiResponse.fromCache || false,
      fromBank: aiResponse.fromBank || false
    })}\n\n`);

  } catch (error) {
    console.error('Generate worksheet stream error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      message: error.message || 'Error generating worksheet'
    })}\n\n`);
  } finally {
    res.end();
  }
};

// Get generation progress
exports.getGenerationProgress = async (req, res) => {
  try {
    const stats = CacheService.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting generation stats'
    });
  }
};