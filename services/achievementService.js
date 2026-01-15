// server/services/achievementService.js

const { getCollection } = require("../config/db");

// Achievement definitions (same as frontend)
const ACHIEVEMENT_DEFINITIONS = {
  xpMilestones: [
    {
      id: "bronze_learner",
      name: "Bronze Learner",
      icon: "🥉",
      description: "Earn 1,000 XP",
      requirement: 1000,
      reward: 50,
      progressKey: "totalXp",
    },
    {
      id: "silver_learner",
      name: "Silver Learner",
      icon: "🥈",
      description: "Earn 5,000 XP",
      requirement: 5000,
      reward: 100,
      progressKey: "totalXp",
    },
    {
      id: "gold_learner",
      name: "Gold Learner",
      icon: "🥇",
      description: "Earn 10,000 XP",
      requirement: 10000,
      reward: 200,
      progressKey: "totalXp",
    },
    {
      id: "platinum_learner",
      name: "Platinum Learner",
      icon: "💎",
      description: "Earn 25,000 XP",
      requirement: 25000,
      reward: 500,
      progressKey: "totalXp",
    },
    {
      id: "legendary_learner",
      name: "Legendary Learner",
      icon: "👑",
      description: "Earn 50,000 XP",
      requirement: 50000,
      reward: 1000,
      progressKey: "totalXp",
    },
  ],
  streakMilestones: [
    {
      id: "week_warrior",
      name: "Week Warrior",
      icon: "🔥",
      description: "7-day streak",
      requirement: 7,
      reward: 50,
      progressKey: "longestStreak",
    },
    {
      id: "fortnight_fighter",
      name: "Fortnight Fighter",
      icon: "🌟",
      description: "14-day streak",
      requirement: 14,
      reward: 100,
      progressKey: "longestStreak",
    },
    {
      id: "monthly_master",
      name: "Monthly Master",
      icon: "⭐",
      description: "30-day streak",
      requirement: 30,
      reward: 200,
      progressKey: "longestStreak",
    },
    {
      id: "streak_legend",
      name: "Streak Legend",
      icon: "💫",
      description: "100-day streak",
      requirement: 100,
      reward: 1000,
      progressKey: "longestStreak",
    },
  ],
  lessonMilestones: [
    {
      id: "beginner",
      name: "Beginner",
      icon: "📚",
      description: "Complete 10 lessons",
      requirement: 10,
      reward: 50,
      progressKey: "lessonsCompleted",
    },
    {
      id: "student",
      name: "Student",
      icon: "📖",
      description: "Complete 50 lessons",
      requirement: 50,
      reward: 100,
      progressKey: "lessonsCompleted",
    },
    {
      id: "scholar",
      name: "Scholar",
      icon: "🎓",
      description: "Complete 100 lessons",
      requirement: 100,
      reward: 200,
      progressKey: "lessonsCompleted",
    },
    {
      id: "professor",
      name: "Professor",
      icon: "👨‍🏫",
      description: "Complete 250 lessons",
      requirement: 250,
      reward: 500,
      progressKey: "lessonsCompleted",
    },
  ],
  vocabularyMilestones: [
    {
      id: "word_collector",
      name: "Word Collector",
      icon: "📝",
      description: "Learn 100 words",
      requirement: 100,
      reward: 50,
      progressKey: "wordsLearned",
    },
    {
      id: "vocabulary_builder",
      name: "Vocabulary Builder",
      icon: "📚",
      description: "Learn 500 words",
      requirement: 500,
      reward: 100,
      progressKey: "wordsLearned",
    },
    {
      id: "word_master",
      name: "Word Master",
      icon: "🗣️",
      description: "Learn 1,000 words",
      requirement: 1000,
      reward: 200,
      progressKey: "wordsLearned",
    },
    {
      id: "polyglot",
      name: "Polyglot",
      icon: "🌍",
      description: "Learn 2,500 words",
      requirement: 2500,
      reward: 500,
      progressKey: "wordsLearned",
    },
  ],
  levelMilestones: [
    {
      id: "level_5",
      name: "Level 5",
      icon: "5️⃣",
      description: "Reach Level 5",
      requirement: 5,
      reward: 50,
      progressKey: "currentLevel",
    },
    {
      id: "level_10",
      name: "Level 10",
      icon: "🔟",
      description: "Reach Level 10",
      requirement: 10,
      reward: 100,
      progressKey: "currentLevel",
    },
    {
      id: "level_25",
      name: "Level 25",
      icon: "🌟",
      description: "Reach Level 25",
      requirement: 25,
      reward: 250,
      progressKey: "currentLevel",
    },
    {
      id: "level_50",
      name: "Level 50",
      icon: "👑",
      description: "Reach Level 50",
      requirement: 50,
      reward: 500,
      progressKey: "currentLevel",
    },
  ],
  perfectScores: [
    {
      id: "first_perfect",
      name: "First Perfect",
      icon: "✨",
      description: "Get 100% on a quiz",
      requirement: 1,
      reward: 25,
      progressKey: "perfectScores",
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      icon: "💯",
      description: "Get 100% on 10 quizzes",
      requirement: 10,
      reward: 100,
      progressKey: "perfectScores",
    },
    {
      id: "flawless",
      name: "Flawless",
      icon: "🏆",
      description: "Get 100% on 50 quizzes",
      requirement: 50,
      reward: 500,
      progressKey: "perfectScores",
    },
  ],
};

// Get all achievement definitions as flat array
const getAllAchievements = () => {
  return Object.values(ACHIEVEMENT_DEFINITIONS).flat();
};

/**
 * Check and unlock achievements for a user
 * @param {string} firebaseUid - User's Firebase UID
 * @returns {Promise<Array>} - Array of newly unlocked achievements
 */
const checkAndUnlockAchievements = async (firebaseUid) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    // Initialize achievements if not exists
    if (!user.achievements) {
      user.achievements = {
        unlocked: [],
        progress: {
          totalXp: user.xp?.total || 0,
          longestStreak: user.streak?.longest || 0,
          lessonsCompleted: 0,
          wordsLearned: 0,
          quizzesCompleted: 0,
          perfectScores: 0,
          currentLevel: user.xp?.level || 1,
          grammarCompleted: 0,
        },
      };
    }

    const progress = user.achievements.progress;
    const unlockedIds = user.achievements.unlocked.map((a) => a.id);
    const allAchievements = getAllAchievements();
    const newlyUnlocked = [];

    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedIds.includes(achievement.id)) {
        continue;
      }

      // Check if requirement is met
      const currentProgress = progress[achievement.progressKey] || 0;
      if (currentProgress >= achievement.requirement) {
        // Unlock achievement
        const unlockedAchievement = {
          id: achievement.id,
          name: achievement.name,
          icon: achievement.icon,
          unlockedAt: new Date(),
          claimed: false, // Not claimed yet
          reward: achievement.reward,
        };

        user.achievements.unlocked.push(unlockedAchievement);
        newlyUnlocked.push(unlockedAchievement);
      }
    }

    // Update user if new achievements unlocked
    if (newlyUnlocked.length > 0) {
      await usersCollection.updateOne(
        { firebaseUid },
        {
          $set: {
            achievements: user.achievements,
            updatedAt: new Date(),
          },
        }
      );
    }

    return newlyUnlocked;
  } catch (error) {
    console.error("Error checking achievements:", error);
    throw error;
  }
};

/**
 * Update achievement progress
 * @param {string} firebaseUid - User's Firebase UID
 * @param {Object} progressUpdates - Progress updates { totalXp: 100, lessonsCompleted: 5, etc }
 * @returns {Promise<Array>} - Array of newly unlocked achievements
 */
const updateProgress = async (firebaseUid, progressUpdates) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    // Initialize achievements if not exists
    if (!user.achievements) {
      user.achievements = {
        unlocked: [],
        progress: {
          totalXp: 0,
          longestStreak: 0,
          lessonsCompleted: 0,
          wordsLearned: 0,
          quizzesCompleted: 0,
          perfectScores: 0,
          currentLevel: 1,
          grammarCompleted: 0,
        },
      };
    }

    // Update progress
    Object.keys(progressUpdates).forEach((key) => {
      user.achievements.progress[key] = progressUpdates[key];
    });

    // Save progress
    await usersCollection.updateOne(
      { firebaseUid },
      {
        $set: {
          "achievements.progress": user.achievements.progress,
          updatedAt: new Date(),
        },
      }
    );

    // Check for newly unlocked achievements
    const newlyUnlocked = await checkAndUnlockAchievements(firebaseUid);

    return newlyUnlocked;
  } catch (error) {
    console.error("Error updating achievement progress:", error);
    throw error;
  }
};

/**
 * Claim achievement reward
 * @param {string} firebaseUid - User's Firebase UID
 * @param {string} achievementId - Achievement ID to claim
 * @returns {Promise<Object>} - Updated user data with new XP
 */
const claimReward = async (firebaseUid, achievementId) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    // Find achievement
    const achievement = user.achievements?.unlocked?.find((a) => a.id === achievementId);

    if (!achievement) {
      throw new Error("Achievement not found or not unlocked");
    }

    if (achievement.claimed) {
      throw new Error("Reward already claimed");
    }

    // Mark as claimed
    const achievementIndex = user.achievements.unlocked.findIndex((a) => a.id === achievementId);
    user.achievements.unlocked[achievementIndex].claimed = true;
    user.achievements.unlocked[achievementIndex].claimedAt = new Date();

    // Award XP reward
    const currentXP = user.xp?.total || 0;
    const newTotalXP = currentXP + achievement.reward;

    // Calculate new level
    const calculateLevel = (totalXP) => {
      let level = 1;
      let xpNeeded = 100;
      let xpSoFar = 0;

      while (xpSoFar + xpNeeded <= totalXP) {
        xpSoFar += xpNeeded;
        level++;
        xpNeeded = 100 + (level - 1) * 50;
      }

      const currentLevelXp = totalXP - xpSoFar;
      const nextLevelXp = xpNeeded;
      const levelProgress = Math.round((currentLevelXp / nextLevelXp) * 100);

      return { level, currentLevelXp, nextLevelXp, levelProgress };
    };

    const { level, currentLevelXp, nextLevelXp, levelProgress } = calculateLevel(newTotalXP);

    // Update user
    await usersCollection.updateOne(
      { firebaseUid },
      {
        $set: {
          "xp.total": newTotalXP,
          "xp.level": level,
          "xp.currentLevelXp": currentLevelXp,
          "xp.nextLevelXp": nextLevelXp,
          "xp.levelProgress": levelProgress,
          "achievements.unlocked": user.achievements.unlocked,
          "achievements.progress.totalXp": newTotalXP,
          "achievements.progress.currentLevel": level,
          updatedAt: new Date(),
        },
      }
    );

    // Return updated user
    const updatedUser = await usersCollection.findOne({ firebaseUid });
    return updatedUser;
  } catch (error) {
    console.error("Error claiming reward:", error);
    throw error;
  }
};

/**
 * Get user's achievements with progress
 * @param {string} firebaseUid - User's Firebase UID
 * @returns {Promise<Object>} - User's achievements data
 */
const getUserAchievements = async (firebaseUid) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    // Initialize achievements if not exists
    if (!user.achievements) {
      return {
        unlocked: [],
        progress: {
          totalXp: user.xp?.total || 0,
          longestStreak: user.streak?.longest || 0,
          lessonsCompleted: 0,
          wordsLearned: 0,
          quizzesCompleted: 0,
          perfectScores: 0,
          currentLevel: user.xp?.level || 1,
          grammarCompleted: 0,
        },
      };
    }

    return user.achievements;
  } catch (error) {
    console.error("Error getting user achievements:", error);
    throw error;
  }
};

module.exports = {
  checkAndUnlockAchievements,
  updateProgress,
  claimReward,
  getUserAchievements,
  getAllAchievements,
  ACHIEVEMENT_DEFINITIONS,
};
