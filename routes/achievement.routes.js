// server/routes/achievement.routes.js

const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const {
  checkAndUnlockAchievements,
  updateProgress,
  claimReward,
  getUserAchievements,
  getAllAchievements,
} = require("../services/achievementService");

/**
 * @route   GET /api/v1/achievements
 * @desc    Get all achievement definitions
 * @access  Public
 */
router.get("/", (req, res) => {
  try {
    const achievements = getAllAchievements();
    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching achievements",
    });
  }
});

/**
 * @route   GET /api/v1/achievements/me
 * @desc    Get user's achievements with progress
 * @access  Private
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const achievements = await getUserAchievements(req.user.uid);
    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user achievements",
    });
  }
});

/**
 * @route   POST /api/v1/achievements/check
 * @desc    Check and unlock achievements for user
 * @access  Private
 */
router.post("/check", verifyToken, async (req, res) => {
  try {
    const newlyUnlocked = await checkAndUnlockAchievements(req.user.uid);
    res.json({
      success: true,
      data: {
        newlyUnlocked,
        count: newlyUnlocked.length,
      },
    });
  } catch (error) {
    console.error("Error checking achievements:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error checking achievements",
    });
  }
});

/**
 * @route   POST /api/v1/achievements/claim/:achievementId
 * @desc    Claim achievement reward
 * @access  Private
 */
router.post("/claim/:achievementId", verifyToken, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const updatedUser = await claimReward(req.user.uid, achievementId);

    // Get the claimed achievement details
    const claimedAchievement = updatedUser.achievements.unlocked.find((a) => a.id === achievementId);

    res.json({
      success: true,
      message: "Reward claimed successfully",
      data: {
        achievement: claimedAchievement,
        xp: updatedUser.xp,
      },
    });
  } catch (error) {
    console.error("Error claiming reward:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error claiming reward",
    });
  }
});

/**
 * @route   POST /api/v1/achievements/update-progress
 * @desc    Update achievement progress (used internally after lesson/quiz completion)
 * @access  Private
 */
router.post("/update-progress", verifyToken, async (req, res) => {
  try {
    const progressUpdates = req.body;
    const newlyUnlocked = await updateProgress(req.user.uid, progressUpdates);

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: {
        newlyUnlocked,
        count: newlyUnlocked.length,
      },
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating progress",
    });
  }
});

module.exports = router;
