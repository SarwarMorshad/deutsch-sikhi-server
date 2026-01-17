const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth, verifyToken } = require("../middlewares/auth");
const { trackQuizCompletion } = require("../services/achievementTracker");

/**
 * @route   GET /api/v1/exercises
 * @desc    Get all exercises
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const exercisesCollection = getCollection("exercises");
    const { lesson, type, limit = 20, page = 1 } = req.query;

    // Build query
    const query = {};

    if (lesson && ObjectId.isValid(lesson)) {
      query.lessonId = new ObjectId(lesson);
    }

    if (type && ["mcq", "fill", "match"].includes(type)) {
      query.type = type;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const exercises = await exercisesCollection.find(query).skip(skip).limit(parseInt(limit)).toArray();

    const total = await exercisesCollection.countDocuments(query);

    res.json({
      success: true,
      count: exercises.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
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
 * @route   GET /api/v1/exercises/:exerciseId
 * @desc    Get single exercise by ID
 * @access  Public
 */
router.get("/:exerciseId", optionalAuth, async function (req, res) {
  try {
    const { exerciseId } = req.params;
    const exercisesCollection = getCollection("exercises");

    // Check if exerciseId is valid ObjectId
    if (!ObjectId.isValid(exerciseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exercise ID.",
      });
    }

    const exercise = await exercisesCollection.findOne({
      _id: new ObjectId(exerciseId),
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found.",
      });
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error("Get exercise error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching exercise.",
    });
  }
});

/**
 * @route   POST /api/v1/exercises/:exerciseId/check
 * @desc    Check answer for an exercise
 * @access  Public
 */
router.post("/:exerciseId/check", optionalAuth, async function (req, res) {
  try {
    const { exerciseId } = req.params;
    const { answer } = req.body;
    const exercisesCollection = getCollection("exercises");

    // Check if exerciseId is valid ObjectId
    if (!ObjectId.isValid(exerciseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exercise ID.",
      });
    }

    if (answer === undefined) {
      return res.status(400).json({
        success: false,
        message: "Answer is required.",
      });
    }

    const exercise = await exercisesCollection.findOne({
      _id: new ObjectId(exerciseId),
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found.",
      });
    }

    // Check answer
    let isCorrect = false;

    if (exercise.type === "mcq") {
      isCorrect = answer === exercise.answerKey;
    } else if (exercise.type === "fill") {
      // Case-insensitive comparison for fill-in-the-blank
      isCorrect = answer.toLowerCase().trim() === exercise.answerKey.toLowerCase().trim();
    } else if (exercise.type === "match") {
      // For matching, answer should be an object/array
      isCorrect = JSON.stringify(answer) === JSON.stringify(exercise.answerKey);
    }

    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: isCorrect ? null : exercise.answerKey,
      },
    });
  } catch (error) {
    console.error("Check answer error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error checking answer.",
    });
  }
});

/**
 * @route   POST /api/v1/exercises/:exerciseId/complete
 * @desc    Complete exercise and track achievement progress
 * @access  Private
 */
router.post("/:exerciseId/complete", verifyToken, async function (req, res) {
  try {
    const { exerciseId } = req.params;
    const { score } = req.body; // score should be 0-100
    const exercisesCollection = getCollection("exercises");

    if (!ObjectId.isValid(exerciseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exercise ID.",
      });
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: "Score must be a number between 0 and 100.",
      });
    }

    const exercise = await exercisesCollection.findOne({
      _id: new ObjectId(exerciseId),
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found.",
      });
    }

    // Track achievement progress with score
    const newAchievements = await trackQuizCompletion(req.user.uid, score);

    res.json({
      success: true,
      message: "Exercise completed successfully",
      data: {
        score,
        passed: score >= 70, // Assuming 70% is passing
      },
      newAchievements, // Send to frontend
    });
  } catch (error) {
    console.error("Complete exercise error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error completing exercise.",
    });
  }
});

module.exports = router;
