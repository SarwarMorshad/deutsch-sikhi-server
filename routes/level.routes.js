const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth } = require("../middlewares/auth");

// Helper: Get app settings
async function getSettings() {
  const settingsCollection = getCollection("settings");
  const settings = await settingsCollection.findOne({ type: "app" });
  return (
    settings || {
      minPassingScore: 70,
      requireSequentialLessons: true,
    }
  );
}

/**
 * @route   GET /api/v1/levels
 * @desc    Get all levels (A1, A2, etc.)
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    const levels = await levelsCollection.find({}).sort({ order: 1 }).toArray();

    // Add lesson count and progress for each level
    let levelsWithInfo = await Promise.all(
      levels.map(async (level) => {
        const lessonCount = await lessonsCollection.countDocuments({
          levelId: level._id,
          status: "published",
        });

        return {
          ...level,
          totalLessons: lessonCount,
        };
      })
    );

    // If user is logged in, add their progress
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        levelsWithInfo = await Promise.all(
          levelsWithInfo.map(async (level) => {
            // Get lessons in this level
            const lessons = await lessonsCollection
              .find({ levelId: level._id, status: "published" })
              .project({ _id: 1 })
              .toArray();

            const lessonIds = lessons.map((l) => l._id);

            // Get completed lessons (passed)
            const completedCount = await progressCollection.countDocuments({
              userId: user._id,
              lessonId: { $in: lessonIds },
              passed: true,
            });

            return {
              ...level,
              completedLessons: completedCount,
              progressPercentage:
                level.totalLessons > 0 ? Math.round((completedCount / level.totalLessons) * 100) : 0,
            };
          })
        );
      }
    }

    res.json({
      success: true,
      count: levelsWithInfo.length,
      data: levelsWithInfo,
    });
  } catch (error) {
    console.error("Get levels error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching levels.",
    });
  }
});

/**
 * @route   GET /api/v1/levels/:levelId
 * @desc    Get single level by ID
 * @access  Public
 */
router.get("/:levelId", optionalAuth, async function (req, res) {
  try {
    const { levelId } = req.params;
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Check if levelId is valid ObjectId
    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const level = await levelsCollection.findOne({
      _id: new ObjectId(levelId),
    });

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found.",
      });
    }

    // Get lesson count
    const totalLessons = await lessonsCollection.countDocuments({
      levelId: level._id,
      status: "published",
    });

    let responseData = {
      ...level,
      totalLessons,
    };

    // If user is logged in, add their progress
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        const lessons = await lessonsCollection
          .find({ levelId: level._id, status: "published" })
          .project({ _id: 1 })
          .toArray();

        const lessonIds = lessons.map((l) => l._id);

        const completedCount = await progressCollection.countDocuments({
          userId: user._id,
          lessonId: { $in: lessonIds },
          passed: true,
        });

        responseData.completedLessons = completedCount;
        responseData.progressPercentage =
          totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      }
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Get level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching level.",
    });
  }
});

/**
 * @route   GET /api/v1/levels/:levelId/lessons
 * @desc    Get all published lessons for a level with unlock status
 * @access  Public
 */
router.get("/:levelId/lessons", optionalAuth, async function (req, res) {
  try {
    const { levelId } = req.params;
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Check if levelId is valid ObjectId
    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const settings = await getSettings();

    const lessons = await lessonsCollection
      .find({
        levelId: new ObjectId(levelId),
        status: "published",
      })
      .sort({ order: 1 })
      .toArray();

    // If user is logged in, add unlock status
    let lessonsWithStatus = lessons.map((lesson) => ({
      ...lesson,
      unlocked: !settings.requireSequentialLessons || lesson.order === 1,
      progress: null,
    }));

    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        // Get all progress for this user in this level
        const lessonIds = lessons.map((l) => l._id);
        const progressList = await progressCollection
          .find({
            userId: user._id,
            lessonId: { $in: lessonIds },
          })
          .toArray();

        // Create a map of lessonId -> progress
        const progressMap = {};
        progressList.forEach((p) => {
          progressMap[p.lessonId.toString()] = p;
        });

        // Determine unlock status for each lesson
        lessonsWithStatus = lessons.map((lesson, index) => {
          const progress = progressMap[lesson._id.toString()] || null;
          let unlocked = false;
          let unlockReason = null;

          if (!settings.requireSequentialLessons) {
            // All lessons unlocked if sequential not required
            unlocked = true;
          } else if (lesson.order === 1) {
            // First lesson always unlocked
            unlocked = true;
          } else {
            // Check if previous lesson was passed
            const prevLesson = lessons[index - 1];
            if (prevLesson) {
              const prevProgress = progressMap[prevLesson._id.toString()];
              if (prevProgress && prevProgress.passed) {
                unlocked = true;
              } else {
                unlocked = false;
                unlockReason = prevProgress
                  ? `Score at least ${settings.minPassingScore}% on "${
                      prevLesson.title.en || prevLesson.title.de
                    }" to unlock.`
                  : `Complete "${prevLesson.title.en || prevLesson.title.de}" first.`;
              }
            } else {
              unlocked = true;
            }
          }

          return {
            ...lesson,
            unlocked,
            unlockReason,
            progress: progress
              ? {
                  score: progress.score,
                  passed: progress.passed,
                  attempts: progress.attempts,
                  completedAt: progress.completedAt,
                }
              : null,
          };
        });
      }
    }

    res.json({
      success: true,
      count: lessonsWithStatus.length,
      minPassingScore: settings.minPassingScore,
      data: lessonsWithStatus,
    });
  } catch (error) {
    console.error("Get lessons by level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching lessons.",
    });
  }
});

/**
 * @route   GET /api/v1/levels/:levelId/progress
 * @desc    Get user's detailed progress for a level
 * @access  Public (with optional auth for personalized data)
 */
router.get("/:levelId/progress", optionalAuth, async function (req, res) {
  try {
    const { levelId } = req.params;
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const level = await levelsCollection.findOne({
      _id: new ObjectId(levelId),
    });

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found.",
      });
    }

    const settings = await getSettings();

    // Get all lessons in this level
    const lessons = await lessonsCollection
      .find({ levelId: level._id, status: "published" })
      .sort({ order: 1 })
      .toArray();

    let progressData = {
      level: {
        _id: level._id,
        code: level.code,
        title: level.title,
      },
      totalLessons: lessons.length,
      minPassingScore: settings.minPassingScore,
      lessons: lessons.map((l) => ({
        _id: l._id,
        title: l.title,
        order: l.order,
        unlocked: !settings.requireSequentialLessons || l.order === 1,
        progress: null,
      })),
    };

    // If user is logged in, add their progress
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        const lessonIds = lessons.map((l) => l._id);
        const progressList = await progressCollection
          .find({
            userId: user._id,
            lessonId: { $in: lessonIds },
          })
          .toArray();

        const progressMap = {};
        progressList.forEach((p) => {
          progressMap[p.lessonId.toString()] = p;
        });

        let completedCount = 0;
        let totalScore = 0;

        progressData.lessons = lessons.map((lesson, index) => {
          const progress = progressMap[lesson._id.toString()];
          let unlocked = false;

          if (!settings.requireSequentialLessons || lesson.order === 1) {
            unlocked = true;
          } else {
            const prevLesson = lessons[index - 1];
            if (prevLesson) {
              const prevProgress = progressMap[prevLesson._id.toString()];
              unlocked = prevProgress && prevProgress.passed;
            }
          }

          if (progress && progress.passed) {
            completedCount++;
            totalScore += progress.score;
          }

          return {
            _id: lesson._id,
            title: lesson.title,
            order: lesson.order,
            unlocked,
            progress: progress
              ? {
                  score: progress.score,
                  passed: progress.passed,
                  attempts: progress.attempts,
                  completedAt: progress.completedAt,
                }
              : null,
          };
        });

        progressData.completedLessons = completedCount;
        progressData.progressPercentage =
          lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
        progressData.averageScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
      }
    }

    res.json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    console.error("Get level progress error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching progress.",
    });
  }
});

module.exports = router;
