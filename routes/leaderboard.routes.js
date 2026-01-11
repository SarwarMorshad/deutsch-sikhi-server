const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");

/**
 * @route   GET /api/v1/leaderboard
 * @desc    Get top learners by lessons completed and average score
 * @access  Public
 */
router.get("/", async function (req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Aggregate progress by user
    const leaderboard = await progressCollection
      .aggregate([
        // Group by userId
        {
          $group: {
            _id: "$userId",
            lessonsCompleted: { $sum: 1 },
            totalScore: { $sum: "$score" },
            lastActivity: { $max: "$completedAt" },
          },
        },
        // Calculate average score
        {
          $addFields: {
            averageScore: {
              $round: [{ $divide: ["$totalScore", "$lessonsCompleted"] }, 0],
            },
          },
        },
        // Sort by lessons completed, then by average score
        {
          $sort: {
            lessonsCompleted: -1,
            averageScore: -1,
            lastActivity: -1,
          },
        },
        // Limit results
        { $limit: limit },
        // Lookup user details
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        // Project only needed fields
        {
          $project: {
            _id: 1,
            lessonsCompleted: 1,
            averageScore: 1,
            totalScore: 1,
            lastActivity: 1,
            "user.name": 1,
            "user.photoURL": 1,
            "user.createdAt": 1,
          },
        },
      ])
      .toArray();

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry._id,
      name: entry.user.name || "Anonymous Learner",
      photoURL: entry.user.photoURL || null,
      lessonsCompleted: entry.lessonsCompleted,
      averageScore: entry.averageScore,
      totalScore: entry.totalScore,
      lastActivity: entry.lastActivity,
      memberSince: entry.user.createdAt,
    }));

    res.json({
      success: true,
      count: rankedLeaderboard.length,
      data: rankedLeaderboard,
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
 * @route   GET /api/v1/leaderboard/me
 * @desc    Get current user's rank in leaderboard
 * @access  Private (requires verifyToken middleware)
 */
router.get("/me", async function (req, res) {
  try {
    // This route needs verifyToken middleware when used
    // For now, we'll accept firebaseUid as query param for flexibility
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "Firebase UID required.",
      });
    }

    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    // Get user
    const user = await usersCollection.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Get all users' progress for ranking
    const allProgress = await progressCollection
      .aggregate([
        {
          $group: {
            _id: "$userId",
            lessonsCompleted: { $sum: 1 },
            totalScore: { $sum: "$score" },
          },
        },
        {
          $addFields: {
            averageScore: {
              $round: [{ $divide: ["$totalScore", "$lessonsCompleted"] }, 0],
            },
          },
        },
        {
          $sort: {
            lessonsCompleted: -1,
            averageScore: -1,
          },
        },
      ])
      .toArray();

    // Find user's rank
    const userRankIndex = allProgress.findIndex((p) => p._id.toString() === user._id.toString());

    if (userRankIndex === -1) {
      // User has no progress yet
      return res.json({
        success: true,
        data: {
          rank: null,
          totalParticipants: allProgress.length,
          lessonsCompleted: 0,
          averageScore: 0,
          message: "Complete a lesson to join the leaderboard!",
        },
      });
    }

    const userProgress = allProgress[userRankIndex];

    res.json({
      success: true,
      data: {
        rank: userRankIndex + 1,
        totalParticipants: allProgress.length,
        lessonsCompleted: userProgress.lessonsCompleted,
        averageScore: userProgress.averageScore,
        totalScore: userProgress.totalScore,
        percentile:
          allProgress.length > 1
            ? Math.round(((allProgress.length - userRankIndex) / allProgress.length) * 100)
            : 100,
      },
    });
  } catch (error) {
    console.error("Get user rank error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching user rank.",
    });
  }
});

module.exports = router;
