const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");

// Default settings
const DEFAULT_SETTINGS = {
  minPassingScore: 70,
  allowRetakes: true,
  maxRetakes: 0, // 0 = unlimited
  showCorrectAnswers: true,
  requireSequentialLessons: true, // Must complete lessons in order
};

// Default XP settings
const DEFAULT_XP_SETTINGS = {
  activities: {
    completeLesson: 20,
    completeGrammar: 15,
    learnWord: 5,
    reviewWordCorrect: 2,
    reviewWordWrong: 1,
    completeQuiz: {
      high: 30, // 90-100%
      medium: 20, // 70-89%
      low: 10, // Below 70%
    },
  },
  quizThresholds: {
    high: 90,
    medium: 70,
  },
  streakBonuses: {
    week: { days: 7, multiplier: 1.1 },
    twoWeeks: { days: 14, multiplier: 1.25 },
    month: { days: 30, multiplier: 1.5 },
  },
  dailyGoal: {
    completionBonus: 10,
    defaultTarget: 50,
    options: [30, 50, 100, 150],
  },
  levelProgression: {
    baseXP: 100,
    incrementPerLevel: 50,
  },
};

/**
 * @route   GET /api/v1/settings
 * @desc    Get public settings (for frontend)
 * @access  Public
 */
router.get("/", async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    let settings = await settingsCollection.findOne({ type: "app" });

    if (!settings) {
      // Return defaults if no settings exist
      settings = { ...DEFAULT_SETTINGS };
    }

    // Only return public-facing settings
    res.json({
      success: true,
      data: {
        minPassingScore: settings.minPassingScore,
        allowRetakes: settings.allowRetakes,
        showCorrectAnswers: settings.showCorrectAnswers,
        requireSequentialLessons: settings.requireSequentialLessons,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching settings.",
    });
  }
});

/**
 * @route   GET /api/v1/settings/admin
 * @desc    Get all settings (for admin dashboard)
 * @access  Admin
 */
router.get("/admin", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    let settings = await settingsCollection.findOne({ type: "app" });

    if (!settings) {
      // Create default settings if not exist
      settings = {
        type: "app",
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await settingsCollection.insertOne(settings);
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get admin settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching settings.",
    });
  }
});

/**
 * @route   PATCH /api/v1/settings/admin
 * @desc    Update app settings
 * @access  Admin
 */
router.patch("/admin", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const { minPassingScore, allowRetakes, maxRetakes, showCorrectAnswers, requireSequentialLessons } =
      req.body;

    const settingsCollection = getCollection("settings");

    // Validate minPassingScore
    if (minPassingScore !== undefined) {
      if (minPassingScore < 0 || minPassingScore > 100) {
        return res.status(400).json({
          success: false,
          message: "Minimum passing score must be between 0 and 100.",
        });
      }
    }

    // Build update object
    const updateFields = { updatedAt: new Date() };

    if (minPassingScore !== undefined) updateFields.minPassingScore = minPassingScore;
    if (allowRetakes !== undefined) updateFields.allowRetakes = allowRetakes;
    if (maxRetakes !== undefined) updateFields.maxRetakes = maxRetakes;
    if (showCorrectAnswers !== undefined) updateFields.showCorrectAnswers = showCorrectAnswers;
    if (requireSequentialLessons !== undefined)
      updateFields.requireSequentialLessons = requireSequentialLessons;

    // Upsert settings
    const result = await settingsCollection.findOneAndUpdate(
      { type: "app" },
      {
        $set: updateFields,
        $setOnInsert: {
          type: "app",
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "Settings updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating settings.",
    });
  }
});

/**
 * @route   POST /api/v1/settings/admin/reset
 * @desc    Reset settings to defaults
 * @access  Admin
 */
router.post("/admin/reset", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    const result = await settingsCollection.findOneAndUpdate(
      { type: "app" },
      {
        $set: {
          ...DEFAULT_SETTINGS,
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "Settings reset to defaults.",
      data: result,
    });
  } catch (error) {
    console.error("Reset settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error resetting settings.",
    });
  }
});

// ============================================
// XP SETTINGS ROUTES
// ============================================

/**
 * @route   GET /api/v1/settings/xp
 * @desc    Get XP settings (public - needed for XP calculations)
 * @access  Public
 */
router.get("/xp", async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    let settings = await settingsCollection.findOne({ type: "xp" });

    if (!settings) {
      // Return defaults if no settings exist
      settings = { ...DEFAULT_XP_SETTINGS };
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get XP settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching XP settings.",
    });
  }
});

/**
 * @route   GET /api/v1/settings/xp/admin
 * @desc    Get all XP settings (for admin dashboard)
 * @access  Admin
 */
router.get("/xp/admin", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    let settings = await settingsCollection.findOne({ type: "xp" });

    if (!settings) {
      // Create default XP settings if not exist
      settings = {
        type: "xp",
        ...DEFAULT_XP_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await settingsCollection.insertOne(settings);
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get admin XP settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching XP settings.",
    });
  }
});

/**
 * @route   PATCH /api/v1/settings/xp/admin
 * @desc    Update XP settings
 * @access  Admin
 */
router.patch("/xp/admin", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const { activities, quizThresholds, streakBonuses, dailyGoal, levelProgression } = req.body;

    const settingsCollection = getCollection("settings");

    // Build update object
    const updateFields = { updatedAt: new Date() };

    if (activities !== undefined) updateFields.activities = activities;
    if (quizThresholds !== undefined) updateFields.quizThresholds = quizThresholds;
    if (streakBonuses !== undefined) updateFields.streakBonuses = streakBonuses;
    if (dailyGoal !== undefined) updateFields.dailyGoal = dailyGoal;
    if (levelProgression !== undefined) updateFields.levelProgression = levelProgression;

    // Upsert settings
    const result = await settingsCollection.findOneAndUpdate(
      { type: "xp" },
      {
        $set: updateFields,
        $setOnInsert: {
          type: "xp",
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "XP settings updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update XP settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating XP settings.",
    });
  }
});

/**
 * @route   POST /api/v1/settings/xp/admin/reset
 * @desc    Reset XP settings to defaults
 * @access  Admin
 */
router.post("/xp/admin/reset", verifyToken, verifyAdmin, async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");

    const result = await settingsCollection.findOneAndUpdate(
      { type: "xp" },
      {
        $set: {
          ...DEFAULT_XP_SETTINGS,
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "XP settings reset to defaults.",
      data: result,
    });
  } catch (error) {
    console.error("Reset XP settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error resetting XP settings.",
    });
  }
});

// Add to existing DEFAULT_XP_SETTINGS in settings.routes.js

const DEFAULT_ACHIEVEMENTS = {
  xpMilestones: [
    {
      id: "bronze_learner",
      name: "Bronze Learner",
      icon: "🥉",
      description: "Earn 1,000 XP",
      requirement: 1000,
      reward: 50,
    },
    {
      id: "silver_learner",
      name: "Silver Learner",
      icon: "🥈",
      description: "Earn 5,000 XP",
      requirement: 5000,
      reward: 100,
    },
    {
      id: "gold_learner",
      name: "Gold Learner",
      icon: "🥇",
      description: "Earn 10,000 XP",
      requirement: 10000,
      reward: 200,
    },
    {
      id: "platinum_learner",
      name: "Platinum Learner",
      icon: "💎",
      description: "Earn 25,000 XP",
      requirement: 25000,
      reward: 500,
    },
    {
      id: "legendary_learner",
      name: "Legendary Learner",
      icon: "👑",
      description: "Earn 50,000 XP",
      requirement: 50000,
      reward: 1000,
    },
  ],
  streakMilestones: [
    {
      id: "week_warrior",
      name: "Week Warrior",
      icon: "🔥",
      description: "7-day streak",
      requirement: 7,
      reward: 50,
    },
    {
      id: "fortnight_fighter",
      name: "Fortnight Fighter",
      icon: "🌟",
      description: "14-day streak",
      requirement: 14,
      reward: 100,
    },
    {
      id: "monthly_master",
      name: "Monthly Master",
      icon: "⭐",
      description: "30-day streak",
      requirement: 30,
      reward: 200,
    },
    {
      id: "streak_legend",
      name: "Streak Legend",
      icon: "💫",
      description: "100-day streak",
      requirement: 100,
      reward: 1000,
    },
  ],
  lessonMilestones: [
    {
      id: "beginner",
      name: "Beginner",
      icon: "📚",
      description: "Complete 10 lessons",
      requirement: 10,
      reward: 50,
    },
    {
      id: "student",
      name: "Student",
      icon: "📖",
      description: "Complete 50 lessons",
      requirement: 50,
      reward: 100,
    },
    {
      id: "scholar",
      name: "Scholar",
      icon: "🎓",
      description: "Complete 100 lessons",
      requirement: 100,
      reward: 200,
    },
    {
      id: "professor",
      name: "Professor",
      icon: "👨‍🏫",
      description: "Complete 250 lessons",
      requirement: 250,
      reward: 500,
    },
  ],
  vocabularyMilestones: [
    {
      id: "word_collector",
      name: "Word Collector",
      icon: "📝",
      description: "Learn 100 words",
      requirement: 100,
      reward: 50,
    },
    {
      id: "vocabulary_builder",
      name: "Vocabulary Builder",
      icon: "📚",
      description: "Learn 500 words",
      requirement: 500,
      reward: 100,
    },
    {
      id: "word_master",
      name: "Word Master",
      icon: "🗣️",
      description: "Learn 1,000 words",
      requirement: 1000,
      reward: 200,
    },
    {
      id: "polyglot",
      name: "Polyglot",
      icon: "🌍",
      description: "Learn 2,500 words",
      requirement: 2500,
      reward: 500,
    },
  ],
  perfectScores: [
    {
      id: "first_perfect",
      name: "First Perfect",
      icon: "✨",
      description: "Get 100% on a quiz",
      requirement: 1,
      reward: 25,
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      icon: "💯",
      description: "Get 100% on 10 quizzes",
      requirement: 10,
      reward: 100,
    },
    {
      id: "flawless",
      name: "Flawless",
      icon: "🏆",
      description: "Get 100% on 50 quizzes",
      requirement: 50,
      reward: 500,
    },
  ],
  levelMilestones: [
    { id: "level_5", name: "Level 5", icon: "5️⃣", description: "Reach Level 5", requirement: 5, reward: 50 },
    {
      id: "level_10",
      name: "Level 10",
      icon: "🔟",
      description: "Reach Level 10",
      requirement: 10,
      reward: 100,
    },
    {
      id: "level_25",
      name: "Level 25",
      icon: "🌟",
      description: "Reach Level 25",
      requirement: 25,
      reward: 250,
    },
    {
      id: "level_50",
      name: "Level 50",
      icon: "👑",
      description: "Reach Level 50",
      requirement: 50,
      reward: 500,
    },
  ],
  special: [
    {
      id: "early_bird",
      name: "Early Bird",
      icon: "🌅",
      description: "Complete lesson before 8 AM",
      requirement: 1,
      reward: 25,
    },
    {
      id: "night_owl",
      name: "Night Owl",
      icon: "🦉",
      description: "Complete lesson after 10 PM",
      requirement: 1,
      reward: 25,
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      icon: "⚡",
      description: "Complete 5 lessons in one day",
      requirement: 5,
      reward: 100,
    },
    {
      id: "consistent",
      name: "Consistent",
      icon: "📅",
      description: "Complete daily goal 7 days in a row",
      requirement: 7,
      reward: 150,
    },
  ],
};

// User Achievement Schema (add to user document)
// achievements: {
//   unlocked: [
//     { id: "bronze_learner", unlockedAt: Date, claimed: Boolean }
//   ],
//   progress: {
//     xp: 1000,
//     longestStreak: 7,
//     lessonsCompleted: 10,
//     wordsLearned: 100,
//     perfectScores: 1,
//     currentLevel: 5
//   }
// }

module.exports = router;
