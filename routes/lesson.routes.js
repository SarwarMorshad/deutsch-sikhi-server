const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth, verifyToken } = require("../middlewares/auth");
const { trackLessonCompletion } = require("../services/achievementTracker");

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

// Helper: Check if lesson is unlocked for user
async function isLessonUnlocked(userId, lessonId, levelId) {
  const settings = await getSettings();

  // If sequential lessons not required, all lessons are unlocked
  if (!settings.requireSequentialLessons) {
    return { unlocked: true, reason: null };
  }

  const lessonsCollection = getCollection("lessons");
  const progressCollection = getCollection("progress");

  // Get current lesson
  const currentLesson = await lessonsCollection.findOne({
    _id: new ObjectId(lessonId),
  });

  if (!currentLesson) {
    return { unlocked: false, reason: "Lesson not found." };
  }

  // First lesson of the level is always unlocked
  if (currentLesson.order === 1) {
    return { unlocked: true, reason: null };
  }

  // Get previous lesson in the same level
  const previousLesson = await lessonsCollection.findOne({
    levelId: currentLesson.levelId,
    order: currentLesson.order - 1,
    status: "published",
  });

  if (!previousLesson) {
    // No previous lesson, so this is unlocked
    return { unlocked: true, reason: null };
  }

  // Check if user passed the previous lesson
  const previousProgress = await progressCollection.findOne({
    userId: new ObjectId(userId),
    lessonId: previousLesson._id,
  });

  if (!previousProgress) {
    return {
      unlocked: false,
      reason: `Complete "${previousLesson.title.en || previousLesson.title.de}" first.`,
      requiredLesson: {
        _id: previousLesson._id,
        title: previousLesson.title,
        order: previousLesson.order,
      },
    };
  }

  if (!previousProgress.passed) {
    return {
      unlocked: false,
      reason: `Score at least ${settings.minPassingScore}% on "${
        previousLesson.title.en || previousLesson.title.de
      }" to unlock.`,
      requiredLesson: {
        _id: previousLesson._id,
        title: previousLesson.title,
        order: previousLesson.order,
      },
      currentScore: previousProgress.score,
      requiredScore: settings.minPassingScore,
    };
  }

  return { unlocked: true, reason: null };
}

/**
 * @route   GET /api/v1/lessons
 * @desc    Get all published lessons
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");
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
      .sort({ levelId: 1, order: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await lessonsCollection.countDocuments(query);

    // If user is logged in, add unlock status to each lesson
    let lessonsWithStatus = lessons;

    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        lessonsWithStatus = await Promise.all(
          lessons.map(async (lesson) => {
            const unlockStatus = await isLessonUnlocked(user._id, lesson._id, lesson.levelId);

            // Get user's progress for this lesson
            const progress = await progressCollection.findOne({
              userId: user._id,
              lessonId: lesson._id,
            });

            return {
              ...lesson,
              unlocked: unlockStatus.unlocked,
              unlockReason: unlockStatus.reason,
              progress: progress
                ? {
                    score: progress.score,
                    passed: progress.passed,
                    completedAt: progress.completedAt,
                  }
                : null,
            };
          })
        );
      }
    }

    res.json({
      success: true,
      count: lessonsWithStatus.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: lessonsWithStatus,
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
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

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

    // Check unlock status if user is logged in
    let unlockStatus = { unlocked: true, reason: null };
    let progress = null;

    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        unlockStatus = await isLessonUnlocked(user._id, lessonId, lesson.levelId);

        progress = await progressCollection.findOne({
          userId: user._id,
          lessonId: new ObjectId(lessonId),
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...lesson,
        level: level || null,
        unlocked: unlockStatus.unlocked,
        unlockReason: unlockStatus.reason,
        requiredLesson: unlockStatus.requiredLesson || null,
        currentScore: unlockStatus.currentScore,
        requiredScore: unlockStatus.requiredScore,
        progress: progress
          ? {
              score: progress.score,
              passed: progress.passed,
              attempts: progress.attempts,
              completedAt: progress.completedAt,
            }
          : null,
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
 * @route   GET /api/v1/lessons/:lessonId/status
 * @desc    Check if lesson is unlocked for current user
 * @access  Private
 */
router.get("/:lessonId/status", verifyToken, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const usersCollection = getCollection("users");
    const lessonsCollection = getCollection("lessons");
    const progressCollection = getCollection("progress");

    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const lesson = await lessonsCollection.findOne({
      _id: new ObjectId(lessonId),
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    const unlockStatus = await isLessonUnlocked(user._id, lessonId, lesson.levelId);

    // Get user's progress for this lesson
    const progress = await progressCollection.findOne({
      userId: user._id,
      lessonId: new ObjectId(lessonId),
    });

    const settings = await getSettings();

    res.json({
      success: true,
      data: {
        lessonId,
        unlocked: unlockStatus.unlocked,
        reason: unlockStatus.reason,
        requiredLesson: unlockStatus.requiredLesson || null,
        currentScore: unlockStatus.currentScore,
        requiredScore: settings.minPassingScore,
        progress: progress
          ? {
              score: progress.score,
              passed: progress.passed,
              attempts: progress.attempts,
              completedAt: progress.completedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get lesson status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error checking lesson status.",
    });
  }
});

/**
 * @route   GET /api/v1/lessons/:lessonId/words
 * @desc    Get all vocabulary words for a lesson
 * @access  Public (but checks unlock status)
 */
router.get("/:lessonId/words", optionalAuth, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const wordsCollection = getCollection("words");
    const usersCollection = getCollection("users");
    const lessonsCollection = getCollection("lessons");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    // Check unlock status if user is logged in
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
      const lesson = await lessonsCollection.findOne({ _id: new ObjectId(lessonId) });

      if (user && lesson) {
        const unlockStatus = await isLessonUnlocked(user._id, lessonId, lesson.levelId);

        if (!unlockStatus.unlocked) {
          return res.status(403).json({
            success: false,
            message: "Lesson is locked.",
            reason: unlockStatus.reason,
            requiredLesson: unlockStatus.requiredLesson,
          });
        }
      }
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
 * @access  Public (but checks unlock status)
 */
router.get("/:lessonId/exercises", optionalAuth, async function (req, res) {
  try {
    const { lessonId } = req.params;
    const exercisesCollection = getCollection("exercises");
    const usersCollection = getCollection("users");
    const lessonsCollection = getCollection("lessons");

    // Check if lessonId is valid ObjectId
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    // Check unlock status if user is logged in
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });
      const lesson = await lessonsCollection.findOne({ _id: new ObjectId(lessonId) });

      if (user && lesson) {
        const unlockStatus = await isLessonUnlocked(user._id, lessonId, lesson.levelId);

        if (!unlockStatus.unlocked) {
          return res.status(403).json({
            success: false,
            message: "Lesson is locked.",
            reason: unlockStatus.reason,
            requiredLesson: unlockStatus.requiredLesson,
          });
        }
      }
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
    const lessonsCollection = getCollection("lessons");

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

    // Get lesson
    const lesson = await lessonsCollection.findOne({
      _id: new ObjectId(lessonId),
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    // Check if lesson is unlocked
    const unlockStatus = await isLessonUnlocked(user._id, lessonId, lesson.levelId);

    if (!unlockStatus.unlocked) {
      return res.status(403).json({
        success: false,
        message: "Lesson is locked.",
        reason: unlockStatus.reason,
        requiredLesson: unlockStatus.requiredLesson,
      });
    }

    // Get settings for passing score
    const settings = await getSettings();
    const passed = score >= settings.minPassingScore;

    // Check if progress already exists
    const existingProgress = await progressCollection.findOne({
      userId: user._id,
      lessonId: new ObjectId(lessonId),
    });

    if (existingProgress) {
      // Update progress - keep highest score
      const newScore = Math.max(score || 0, existingProgress.score);
      const newPassed = newScore >= settings.minPassingScore;

      await progressCollection.updateOne(
        { _id: existingProgress._id },
        {
          $set: {
            score: newScore,
            passed: newPassed,
            completedAt: new Date(),
          },
          $inc: { attempts: 1 },
        }
      );

      // Track achievement progress (only if this is first time passing)
      let newAchievements = [];
      if (!existingProgress.passed && newPassed) {
        newAchievements = await trackLessonCompletion(req.user.uid);
      }

      // Check if next lesson is now unlocked
      const nextLesson = await lessonsCollection.findOne({
        levelId: lesson.levelId,
        order: lesson.order + 1,
        status: "published",
      });

      return res.json({
        success: true,
        message: newPassed
          ? "Lesson completed! Next lesson unlocked."
          : `Score: ${newScore}%. Need ${settings.minPassingScore}% to unlock next lesson.`,
        data: {
          score: newScore,
          passed: newPassed,
          attempts: existingProgress.attempts + 1,
          minPassingScore: settings.minPassingScore,
          nextLessonUnlocked: newPassed && nextLesson ? true : false,
          nextLesson:
            newPassed && nextLesson
              ? {
                  _id: nextLesson._id,
                  title: nextLesson.title,
                }
              : null,
        },
        newAchievements, // Send to frontend
      });
    }

    // Create new progress
    const newProgress = {
      userId: user._id,
      lessonId: new ObjectId(lessonId),
      score: score || 0,
      passed,
      attempts: 1,
      completedAt: new Date(),
    };

    const result = await progressCollection.insertOne(newProgress);

    // Track achievement progress (only if passed)
    let newAchievements = [];
    if (passed) {
      newAchievements = await trackLessonCompletion(req.user.uid);
    }

    // Check if next lesson is now unlocked
    const nextLesson = await lessonsCollection.findOne({
      levelId: lesson.levelId,
      order: lesson.order + 1,
      status: "published",
    });

    res.status(201).json({
      success: true,
      message: passed
        ? "Lesson completed! Next lesson unlocked."
        : `Score: ${score}%. Need ${settings.minPassingScore}% to unlock next lesson.`,
      data: {
        _id: result.insertedId,
        score: score || 0,
        passed,
        attempts: 1,
        minPassingScore: settings.minPassingScore,
        nextLessonUnlocked: passed && nextLesson ? true : false,
        nextLesson:
          passed && nextLesson
            ? {
                _id: nextLesson._id,
                title: nextLesson.title,
              }
            : null,
      },
      newAchievements, // Send to frontend
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
