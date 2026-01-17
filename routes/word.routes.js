const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth, verifyToken } = require("../middlewares/auth");
const { trackWordLearned } = require("../services/achievementTracker");

/**
 * @route   GET /api/v1/words
 * @desc    Get all verified vocabulary words
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const wordsCollection = getCollection("words");
    const { lesson, level, limit = 50, page = 1, search } = req.query;

    // Build query
    const query = { verified: true };

    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }

    if (lesson && ObjectId.isValid(lesson)) {
      query.lessonId = new ObjectId(lesson);
    }

    // Search in German word or meanings
    if (search) {
      query.$or = [
        { word_de: { $regex: search, $options: "i" } },
        { meaning_en: { $regex: search, $options: "i" } },
        { meaning_bn: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const words = await wordsCollection.find(query).skip(skip).limit(parseInt(limit)).toArray();

    const total = await wordsCollection.countDocuments(query);

    res.json({
      success: true,
      count: words.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: words,
    });
  } catch (error) {
    console.error("Get words error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching vocabulary.",
    });
  }
});

/**
 * @route   GET /api/v1/words/:wordId
 * @desc    Get single word by ID
 * @access  Public
 */
router.get("/:wordId", optionalAuth, async function (req, res) {
  try {
    const { wordId } = req.params;
    const wordsCollection = getCollection("words");

    // Check if wordId is valid ObjectId
    if (!ObjectId.isValid(wordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const word = await wordsCollection.findOne({
      _id: new ObjectId(wordId),
      verified: true,
    });

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    res.json({
      success: true,
      data: word,
    });
  } catch (error) {
    console.error("Get word error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching word.",
    });
  }
});

/**
 * @route   GET /api/v1/words/random/:count
 * @desc    Get random words for practice
 * @access  Public
 */
router.get("/random/:count", optionalAuth, async function (req, res) {
  try {
    const { count } = req.params;
    const { level } = req.query;
    const wordsCollection = getCollection("words");

    const limit = Math.min(parseInt(count) || 10, 50); // Max 50 words

    // Build aggregation pipeline
    const pipeline = [{ $match: { verified: true } }];

    // Filter by level if provided
    if (level && ObjectId.isValid(level)) {
      pipeline.push({ $match: { levelId: new ObjectId(level) } });
    }

    // Random sample
    pipeline.push({ $sample: { size: limit } });

    const words = await wordsCollection.aggregate(pipeline).toArray();

    res.json({
      success: true,
      count: words.length,
      data: words,
    });
  } catch (error) {
    console.error("Get random words error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching random words.",
    });
  }
});

/**
 * @route   POST /api/v1/words/:wordId/learn
 * @desc    Mark word as learned and track achievement progress
 * @access  Private
 */
router.post("/:wordId/learn", verifyToken, async function (req, res) {
  try {
    const { wordId } = req.params;
    const wordsCollection = getCollection("words");
    const usersCollection = getCollection("users");

    if (!ObjectId.isValid(wordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const word = await wordsCollection.findOne({
      _id: new ObjectId(wordId),
      verified: true,
    });

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    // Get user
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Track achievement progress for 1 word
    const newAchievements = await trackWordLearned(req.user.uid, 1);

    res.json({
      success: true,
      message: "Word learned successfully",
      data: word,
      newAchievements, // Send to frontend
    });
  } catch (error) {
    console.error("Learn word error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error learning word.",
    });
  }
});

/**
 * @route   POST /api/v1/words/learn-batch
 * @desc    Mark multiple words as learned (bulk learning)
 * @access  Private
 */
router.post("/learn-batch", verifyToken, async function (req, res) {
  try {
    const { wordIds } = req.body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Word IDs array is required.",
      });
    }

    const validIds = wordIds.filter((id) => ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid word IDs provided.",
      });
    }

    // Track achievement progress for multiple words
    const newAchievements = await trackWordLearned(req.user.uid, validIds.length);

    res.json({
      success: true,
      message: `${validIds.length} words learned successfully`,
      data: {
        count: validIds.length,
      },
      newAchievements, // Send to frontend
    });
  } catch (error) {
    console.error("Learn words batch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error learning words.",
    });
  }
});

module.exports = router;
