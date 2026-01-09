const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth, verifyToken } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/lessons
 * @desc    Get all published lessons
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const lessonsCollection = getCollection("lessons");
    const { level, limit = 20, page = 1 } = req.query;

    // Build query
    const query = { status: "published" };
    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lessons = await lessonsCollection
      .find(query)
      .sort({ order: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await lessonsCollection.countDocuments(query);

    res.json({
      success: true,
      count: lessons.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: lessons,
    });
  } catch (error) {
    console.error("Get lessons error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching lessons.",
    });
  }
});

/**
 * @route   GET /api/v1/lessons/:lessonId
 * @desc    Get single lesson by ID
 * @access  Public
 */
router.get("/:lessonId", optionalAuth, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const lessonsCollection = getCollection("lessons");
    const levelsCollection = getCollection("levels");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const lesson = await lessonsCollection.findOne({
      _id: new ObjectId(lessonId),
      status: "published",
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    // Get level info
    const level = await levelsCollection.findOne({
      _id: lesson.levelId,
    });

    res.json({
      success: true,
      data: {
        ...lesson,
        level: level || null,
      },
    });
  } catch (error) {
    console.error("Get lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching lesson.",
    });
  }
});

/**
 * @route   GET /api/v1/lessons/:lessonId/words
 * @desc    Get all vocabulary words for a lesson
 * @access  Public
 */
router.get("/:lessonId/words", optionalAuth, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const wordsCollection = getCollection("words");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const words = await wordsCollection
      .find({
        lessonId: new ObjectId(lessonId),
        verified: true,
      })
      .toArray();

    res.json({
      success: true,
      count: words.length,
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
 * @route   GET /api/v1/lessons/:lessonId/exercises
 * @desc    Get all exercises for a lesson
 * @access  Public
 */
router.get("/:lessonId/exercises", optionalAuth, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const exercisesCollection = getCollection("exercises");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const exercises = await exercisesCollection
      .find({
        lessonId: new ObjectId(lessonId),
      })
      .toArray();

    res.json({
      success: true,
      count: exercises.length,
      data: exercises,
    });
  } catch (error) {
    console.error("Get exercises error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching exercises.",
    });
  }
});

/**
 * @route   POST /api/v1/lessons/:lessonId/complete
 * @desc    Mark lesson as complete and save progress
 * @access  Private
 */
router.post("/:lessonId/complete", verifyToken, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const { score } = req.body;
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    // Get user from DB
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if progress already exists
    const existingProgress = await progressCollection.findOne({
      userId: user._id,
      lessonId: new ObjectId(lessonId),
    });

    if (existingProgress) {
      // Update if new score is higher
      if (score > existingProgress.score) {
        await progressCollection.updateOne(
          { _id: existingProgress._id },
          {
            $set: {
              score: score || 0,
              completedAt: new Date(),
            },
          }
        );
      }

      return res.json({
        success: true,
        message: "Progress updated.",
        data: {
          ...existingProgress,
          score: Math.max(score || 0, existingProgress.score),
        },
      });
    }

    // Create new progress
    const newProgress = {
      userId: user._id,
      lessonId: new ObjectId(lessonId),
      score: score || 0,
      completedAt: new Date(),
    };

    const result = await progressCollection.insertOne(newProgress);

    res.status(201).json({
      success: true,
      message: "Lesson completed!",
      data: { ...newProgress, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Complete lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error saving progress.",
    });
  }
});

module.exports = router;
