const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth } = require("../middlewares/auth");

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

module.exports = router;
