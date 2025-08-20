const User = require('../models/User');
const KidProfile = require('../models/KidProfile');

// Get all kid profiles for the current user
exports.getKidProfiles = async (req, res) => {
  try {
    const profiles = await KidProfile.getProfilesForParent(req.user.id);
    
    res.json({
      success: true,
      profiles,
      activeProfileId: req.user.activeKidProfile,
      hasSetupProfiles: req.user.hasSetupKidProfiles
    });
  } catch (error) {
    console.error('Get kid profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching kid profiles'
    });
  }
};

// Create a new kid profile
exports.createKidProfile = async (req, res) => {
  try {
    const { name, grade, avatar } = req.body;
    
    // Check if user already has 4 profiles (max limit)
    const existingProfiles = await KidProfile.getProfilesForParent(req.user.id);
    if (existingProfiles.length >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 4 kid profiles allowed'
      });
    }

    // Create new kid profile
    const kidProfile = new KidProfile({
      name,
      grade,
      avatar,
      parentUserId: req.user.id
    });
    
    await kidProfile.save();

    // Update user's setup status and set as active profile if it's the first one
    const user = await User.findById(req.user.id);
    if (!user.hasSetupKidProfiles) {
      user.hasSetupKidProfiles = true;
      user.activeKidProfile = kidProfile._id;
      await user.save();
    }

    res.json({
      success: true,
      profile: kidProfile,
      message: 'Kid profile created successfully'
    });
  } catch (error) {
    console.error('Create kid profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating kid profile'
    });
  }
};

// Update a kid profile
exports.updateKidProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;
    
    // Fields that cannot be updated directly
    delete updates.parentUserId;
    delete updates.stats;
    delete updates.createdAt;

    const profile = await KidProfile.findOneAndUpdate(
      { _id: profileId, parentUserId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Kid profile not found'
      });
    }

    res.json({
      success: true,
      profile,
      message: 'Kid profile updated successfully'
    });
  } catch (error) {
    console.error('Update kid profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating kid profile'
    });
  }
};

// Delete/deactivate a kid profile
exports.deleteKidProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const profile = await KidProfile.findOneAndUpdate(
      { _id: profileId, parentUserId: req.user.id },
      { isActive: false },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Kid profile not found'
      });
    }

    // If this was the active profile, switch to another one
    const user = await User.findById(req.user.id);
    if (user.activeKidProfile && user.activeKidProfile.toString() === profileId) {
      const activeProfiles = await KidProfile.getProfilesForParent(req.user.id);
      const otherProfile = activeProfiles.find(p => p._id.toString() !== profileId);
      
      user.activeKidProfile = otherProfile ? otherProfile._id : null;
      if (!otherProfile) {
        user.hasSetupKidProfiles = false;
      }
      await user.save();
    }

    res.json({
      success: true,
      message: 'Kid profile deactivated successfully'
    });
  } catch (error) {
    console.error('Delete kid profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting kid profile'
    });
  }
};

// Switch active kid profile
exports.switchActiveProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    // Verify profile belongs to user
    const profile = await KidProfile.findOne({
      _id: profileId,
      parentUserId: req.user.id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Kid profile not found or inactive'
      });
    }

    // Update user's active profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { activeKidProfile: profileId },
      { new: true }
    );

    // Update last active time for the profile
    profile.lastActiveAt = new Date();
    await profile.save();

    res.json({
      success: true,
      activeProfile: profile,
      message: `Switched to ${profile.name}'s profile`
    });
  } catch (error) {
    console.error('Switch active profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error switching profile'
    });
  }
};

// Get current active kid profile details
exports.getActiveProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('activeKidProfile');
    
    if (!user.activeKidProfile) {
      return res.json({
        success: true,
        activeProfile: null,
        hasSetupProfiles: user.hasSetupKidProfiles
      });
    }

    res.json({
      success: true,
      activeProfile: user.activeKidProfile,
      hasSetupProfiles: user.hasSetupKidProfiles
    });
  } catch (error) {
    console.error('Get active profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active profile'
    });
  }
};

// Bulk create kid profiles (for first-time setup)
exports.bulkCreateKidProfiles = async (req, res) => {
  try {
    const { profiles } = req.body; // Array of { name, grade, avatar? }
    
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of profiles'
      });
    }

    if (profiles.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 4 kid profiles allowed'
      });
    }

    // Check if user already has profiles
    const existingProfiles = await KidProfile.getProfilesForParent(req.user.id);
    if (existingProfiles.length + profiles.length > 4) {
      return res.status(400).json({
        success: false,
        message: `Can only add ${4 - existingProfiles.length} more profiles`
      });
    }

    const createdProfiles = [];
    const errors = [];

    for (const profileData of profiles) {
      try {
        const kidProfile = new KidProfile({
          ...profileData,
          parentUserId: req.user.id
        });
        
        await kidProfile.save();
        createdProfiles.push(kidProfile);
      } catch (error) {
        errors.push({ 
          profileData, 
          error: error.message 
        });
      }
    }

    // Update user's setup status and set first profile as active
    if (createdProfiles.length > 0) {
      const user = await User.findById(req.user.id);
      user.hasSetupKidProfiles = true;
      
      // Set first created profile as active if no active profile exists
      if (!user.activeKidProfile) {
        user.activeKidProfile = createdProfiles[0]._id;
      }
      
      await user.save();
    }

    res.json({
      success: true,
      createdProfiles,
      errors,
      message: `Created ${createdProfiles.length} kid profiles successfully`
    });
  } catch (error) {
    console.error('Bulk create profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating kid profiles'
    });
  }
};

// Get kid profile statistics
exports.getProfileStats = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const profile = await KidProfile.findOne({
      _id: profileId,
      parentUserId: req.user.id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Kid profile not found'
      });
    }

    // You could also fetch worksheet statistics here
    const stats = {
      basic: {
        totalWorksheets: profile.stats.totalWorksheets,
        totalProblems: profile.stats.totalProblems,
        averageScore: profile.stats.averageScore,
        timeSpent: profile.stats.timeSpent,
        currentStreak: profile.stats.streak.current,
        bestStreak: profile.stats.streak.best
      },
      subjects: profile.stats.subjectProgress,
      dailyLimits: profile.checkDailyLimits(),
      estimatedAge: profile.estimatedAge
    };

    res.json({
      success: true,
      profile: {
        id: profile._id,
        name: profile.name,
        grade: profile.grade,
        avatar: profile.avatar
      },
      stats
    });
  } catch (error) {
    console.error('Get profile stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile statistics'
    });
  }
};