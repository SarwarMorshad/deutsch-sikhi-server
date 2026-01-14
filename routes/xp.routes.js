const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");
const { verifyToken } = require("../middlewares/auth");
const { awardXP, getXPStatus, XP_REWARDS } = require("../services/xpService");

/**
 * @route   GET /api/v1/xp/status
 * @desc    Get current user's XP, level, streak status
 * @access  Private
 */
router.get("/status", verifyToken, async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const status = getXPStatus(user);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get XP status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching XP status.",
    });
  }
});

/**
 * @route   POST /api/v1/xp/award
 * @desc    Award XP for an activity
 * @access  Private
 */
router.post("/award", verifyToken, async (req, res) => {
  try {
    const { activityType, options = {} } = req.body;
    const usersCollection = getCollection("users");

    // Validate activity type
    const validActivities = ["COMPLETE_LESSON", "COMPLETE_QUIZ", "LEARN_WORD", "REVIEW_WORD"];

    if (!validActivities.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type.",
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

    // Award XP
    const result = awardXP(user, activityType, options);

    // Update user in database
    await usersCollection.updateOne(
      { firebaseUid: req.user.uid },
      {
        $set: {
          xp: result.updatedData.xp,
          streak: result.updatedData.streak,
          dailyGoal: result.updatedData.dailyGoal,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "XP awarded successfully!",
      data: {
        xpEarned: result.xpEarned,
        rewards: result.rewards,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        streakUpdated: result.streakUpdated,
        streakBroken: result.streakBroken,
        currentStatus: getXPStatus({ ...user, ...result.updatedData }),
      },
    });
  } catch (error) {
    console.error("Award XP error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error awarding XP.",
    });
  }
});

/**
 * @route   PATCH /api/v1/xp/daily-goal
 * @desc    Update user's daily XP goal
 * @access  Private
 */
router.patch("/daily-goal", verifyToken, async (req, res) => {
  try {
    const { target } = req.body;
    const usersCollection = getCollection("users");

    // Validate target
    const validTargets = [10, 20, 30, 50, 100];
    if (!validTargets.includes(target)) {
      return res.status(400).json({
        success: false,
        message: "Invalid daily goal. Must be 10, 20, 30, 50, or 100.",
      });
    }

    // Update user
    const result = await usersCollection.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      {
        $set: {
          "dailyGoal.target": target,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "Daily goal updated!",
      data: {
        target,
      },
    });
  } catch (error) {
    console.error("Update daily goal error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating daily goal.",
    });
  }
});

/**
 * @route   GET /api/v1/xp/leaderboard
 * @desc    Get XP leaderboard
 * @access  Private
 */
router.get("/leaderboard", verifyToken, async (req, res) => {
  try {
    const usersCollection = getCollection("users");
    const { type = "total", limit = 20 } = req.query;

    let sortField = "xp.total";
    if (type === "streak") {
      sortField = "streak.current";
    } else if (type === "level") {
      sortField = "xp.level";
    }

    // Get top users
    const topUsers = await usersCollection
      .find({ role: { $ne: "admin" } })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .project({
        _id: 1,
        name: 1,
        displayName: 1,
        photoURL: 1,
        xp: 1,
        streak: 1,
      })
      .toArray();

    // Get current user's rank
    const currentUser = await usersCollection.findOne({
      firebaseUid: req.user.uid,
    });

    let userRank = null;
    if (currentUser) {
      const usersAbove = await usersCollection.countDocuments({
        role: { $ne: "admin" },
        [sortField]: { $gt: currentUser[sortField.split(".")[0]]?.[sortField.split(".")[1]] || 0 },
      });
      userRank = usersAbove + 1;
    }

    res.json({
      success: true,
      data: {
        leaderboard: topUsers.map((user, index) => ({
          rank: index + 1,
          id: user._id,
          name: user.name || user.displayName || "Anonymous",
          photoURL: user.photoURL,
          xp: user.xp?.total || 0,
          level: user.xp?.level || 1,
          streak: user.streak?.current || 0,
        })),
        currentUser: currentUser
          ? {
              rank: userRank,
              xp: currentUser.xp?.total || 0,
              level: currentUser.xp?.level || 1,
              streak: currentUser.streak?.current || 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get leaderboard error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard.",
    });
  }
});

/**
 * @route   GET /api/v1/xp/rewards
 * @desc    Get XP rewards configuration
 * @access  Public
 */
router.get("/rewards", (req, res) => {
  res.json({
    success: true,
    data: XP_REWARDS,
  });
});

module.exports = router;
