const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { verifyToken } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/progress/me
 * @desc    Get current user's progress summary
 * @access  Private
 */
router.get("/me", verifyToken, async function (req, res) {
  try {
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");
    const lessonsCollection = getCollection("lessons");
    const levelsCollection = getCollection("levels");

    // Get user from DB
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get all progress for user
    const progress = await progressCollection.find({ userId: user._id }).toArray();

    // Get total lessons count
    const totalLessons = await lessonsCollection.countDocuments({
      status: "published",
    });

    // Get completed lessons with details
    const completedLessonIds = progress.map((p) => p.lessonId);
    const completedLessons = await lessonsCollection.find({ _id: { $in: completedLessonIds } }).toArray();

    // Get all levels
    const levels = await levelsCollection.find({}).sort({ order: 1 }).toArray();

    // Calculate progress per level
    const levelProgress = await Promise.all(
      levels.map(async (level) => {
        const levelLessons = await lessonsCollection.countDocuments({
          levelId: level._id,
          status: "published",
        });

        const completedInLevel = completedLessons.filter(
          (l) => l.levelId.toString() === level._id.toString()
        ).length;

        return {
          levelId: level._id,
          levelCode: level.code,
          levelTitle: level.title,
          totalLessons: levelLessons,
          completedLessons: completedInLevel,
          percentage: levelLessons > 0 ? Math.round((completedInLevel / levelLessons) * 100) : 0,
        };
      })
    );

    // Calculate average score
    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
    const averageScore = progress.length > 0 ? Math.round(totalScore / progress.length) : 0;

    res.json({
      success: true,
      data: {
        totalLessons,
        completedLessons: progress.length,
        overallPercentage: totalLessons > 0 ? Math.round((progress.length / totalLessons) * 100) : 0,
        averageScore,
        levelProgress,
        recentProgress: progress
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Get progress error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching progress.",
    });
  }
});

/**
 * @route   GET /api/v1/progress/me/lessons
 * @desc    Get all completed lessons for current user
 * @access  Private
 */
router.get("/me/lessons", verifyToken, async function (req, res) {
  try {
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");
    const lessonsCollection = getCollection("lessons");

    // Get user from DB
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get all progress with lesson details
    const progress = await progressCollection
      .aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "lessons",
            localField: "lessonId",
            foreignField: "_id",
            as: "lesson",
          },
        },
        { $unwind: "$lesson" },
        { $sort: { completedAt: -1 } },
      ])
      .toArray();

    res.json({
      success: true,
      count: progress.length,
      data: progress,
    });
  } catch (error) {
    console.error("Get completed lessons error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching completed lessons.",
    });
  }
});

/**
 * @route   POST /api/v1/progress
 * @desc    Save progress for a lesson
 * @access  Private
 */
router.post("/", verifyToken, async function (req, res) {
  try {
    const { lessonId, score } = req.body;
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Validate lessonId
    if (!lessonId || !ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Valid lesson ID is required.",
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
      const newScore = Math.max(score || 0, existingProgress.score);
      await progressCollection.updateOne(
        { _id: existingProgress._id },
        {
          $set: {
            score: newScore,
            completedAt: new Date(),
          },
        }
      );

      return res.json({
        success: true,
        message: "Progress updated.",
        data: { ...existingProgress, score: newScore },
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
      message: "Progress saved.",
      data: { ...newProgress, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Save progress error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error saving progress.",
    });
  }
});

module.exports = router;
