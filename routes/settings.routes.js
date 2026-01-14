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

module.exports = router;
