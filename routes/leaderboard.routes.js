// server/routes/leaderboard.routes.js

const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");
const { verifyToken, optionalAuth } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/leaderboard
 * @desc    Get leaderboard with time filters
 * @access  Public (but returns current user rank if authenticated)
 * @query   period: 'all' | 'weekly' | 'monthly' (default: 'all')
 * @query   limit: number (default: 50, max: 100)
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { period = "all", limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 50, 100);

    const usersCollection = getCollection("users");

    // Calculate date range for filtering
    let dateFilter = {};
    const now = new Date();

    if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { $gte: weekAgo } };
    } else if (period === "monthly") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { $gte: monthAgo } };
    }

    // Get top users
    const topUsers = await usersCollection
      .find(dateFilter)
      .sort({ "xp.total": -1 })
      .limit(limitNum)
      .project({
        firebaseUid: 1,
        name: 1,
        photoURL: 1,
        "xp.total": 1,
        "xp.level": 1,
        "streak.current": 1,
        "streak.longest": 1,
      })
      .toArray();

    // Add rank to each user
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      firebaseUid: user.firebaseUid,
      name: user.name,
      photoURL: user.photoURL,
      xp: user.xp?.total || 0,
      level: user.xp?.level || 1,
      currentStreak: user.streak?.current || 0,
      longestStreak: user.streak?.longest || 0,
    }));

    // If user is authenticated, get their rank
    let currentUserRank = null;
    if (req.user) {
      const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

      if (user) {
        // Count how many users have more XP
        const rank = await usersCollection.countDocuments({
          ...dateFilter,
          "xp.total": { $gt: user.xp?.total || 0 },
        });

        currentUserRank = {
          rank: rank + 1,
          firebaseUid: user.firebaseUid,
          name: user.name,
          photoURL: user.photoURL,
          xp: user.xp?.total || 0,
          level: user.xp?.level || 1,
          currentStreak: user.streak?.current || 0,
          longestStreak: user.streak?.longest || 0,
        };
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        currentUser: currentUserRank,
        period,
        total: leaderboard.length,
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
 * @route   GET /api/v1/leaderboard/me
 * @desc    Get current user's rank and nearby users
 * @access  Private
 * @query   period: 'all' | 'weekly' | 'monthly' (default: 'all')
 * @query   range: number (default: 5) - how many users above/below to show
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { period = "all", range = 5 } = req.query;
    const rangeNum = Math.min(parseInt(range) || 5, 20);

    const usersCollection = getCollection("users");

    // Calculate date range for filtering
    let dateFilter = {};
    const now = new Date();

    if (period === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { $gte: weekAgo } };
    } else if (period === "monthly") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { updatedAt: { $gte: monthAgo } };
    }

    // Get current user
    const currentUser = await usersCollection.findOne({ firebaseUid: req.user.uid });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const currentUserXp = currentUser.xp?.total || 0;

    // Count users with more XP (to get rank)
    const rank = await usersCollection.countDocuments({
      ...dateFilter,
      "xp.total": { $gt: currentUserXp },
    });

    const currentUserRank = rank + 1;

    // Get users above current user
    const usersAbove = await usersCollection
      .find({
        ...dateFilter,
        "xp.total": { $gt: currentUserXp },
      })
      .sort({ "xp.total": 1 }) // Ascending to get closest
      .limit(rangeNum)
      .project({
        firebaseUid: 1,
        name: 1,
        photoURL: 1,
        "xp.total": 1,
        "xp.level": 1,
        "streak.current": 1,
      })
      .toArray();

    // Get users below current user
    const usersBelow = await usersCollection
      .find({
        ...dateFilter,
        "xp.total": { $lt: currentUserXp },
      })
      .sort({ "xp.total": -1 }) // Descending to get closest
      .limit(rangeNum)
      .project({
        firebaseUid: 1,
        name: 1,
        photoURL: 1,
        "xp.total": 1,
        "xp.level": 1,
        "streak.current": 1,
      })
      .toArray();

    // Reverse usersAbove to show in correct order (higher XP first)
    usersAbove.reverse();

    // Build nearby users array with ranks
    const nearbyUsers = [
      ...usersAbove.map((user, index) => ({
        rank: currentUserRank - usersAbove.length + index,
        firebaseUid: user.firebaseUid,
        name: user.name,
        photoURL: user.photoURL,
        xp: user.xp?.total || 0,
        level: user.xp?.level || 1,
        currentStreak: user.streak?.current || 0,
      })),
      {
        rank: currentUserRank,
        firebaseUid: currentUser.firebaseUid,
        name: currentUser.name,
        photoURL: currentUser.photoURL,
        xp: currentUserXp,
        level: currentUser.xp?.level || 1,
        currentStreak: currentUser.streak?.current || 0,
        isCurrentUser: true,
      },
      ...usersBelow.map((user, index) => ({
        rank: currentUserRank + index + 1,
        firebaseUid: user.firebaseUid,
        name: user.name,
        photoURL: user.photoURL,
        xp: user.xp?.total || 0,
        level: user.xp?.level || 1,
        currentStreak: user.streak?.current || 0,
      })),
    ];

    res.json({
      success: true,
      data: {
        currentUser: {
          rank: currentUserRank,
          firebaseUid: currentUser.firebaseUid,
          name: currentUser.name,
          photoURL: currentUser.photoURL,
          xp: currentUserXp,
          level: currentUser.xp?.level || 1,
          currentStreak: currentUser.streak?.current || 0,
        },
        nearbyUsers,
        period,
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

/**
 * @route   GET /api/v1/leaderboard/stats
 * @desc    Get leaderboard statistics
 * @access  Public
 */
router.get("/stats", async (req, res) => {
  try {
    const usersCollection = getCollection("users");

    const stats = await usersCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalXp: { $sum: "$xp.total" },
            averageXp: { $avg: "$xp.total" },
            highestXp: { $max: "$xp.total" },
            highestStreak: { $max: "$streak.longest" },
          },
        },
      ])
      .toArray();

    const result = stats[0] || {
      totalUsers: 0,
      totalXp: 0,
      averageXp: 0,
      highestXp: 0,
      highestStreak: 0,
    };

    res.json({
      success: true,
      data: {
        totalUsers: result.totalUsers,
        totalXp: result.totalXp,
        averageXp: Math.round(result.averageXp || 0),
        highestXp: result.highestXp,
        highestStreak: result.highestStreak,
      },
    });
  } catch (error) {
    console.error("Get leaderboard stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard statistics.",
    });
  }
});

module.exports = router;
