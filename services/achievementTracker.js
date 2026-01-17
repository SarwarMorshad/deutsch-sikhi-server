// server/services/achievementTracker.js

const { updateProgress } = require("./achievementService");
const { getCollection } = require("../config/db");

/**
 * Track lesson completion
 * @param {string} firebaseUid - User's Firebase UID
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackLessonCompletion = async (firebaseUid) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    const currentLessons = user.achievements?.progress?.lessonsCompleted || 0;

    // Update progress
    const newlyUnlocked = await updateProgress(firebaseUid, {
      lessonsCompleted: currentLessons + 1,
      totalXp: user.xp?.total || 0,
      currentLevel: user.xp?.level || 1,
      longestStreak: user.streak?.longest || 0,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking lesson completion:", error);
    return [];
  }
};

/**
 * Track grammar completion
 * @param {string} firebaseUid - User's Firebase UID
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackGrammarCompletion = async (firebaseUid) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    const currentGrammar = user.achievements?.progress?.grammarCompleted || 0;

    const newlyUnlocked = await updateProgress(firebaseUid, {
      grammarCompleted: currentGrammar + 1,
      totalXp: user.xp?.total || 0,
      currentLevel: user.xp?.level || 1,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking grammar completion:", error);
    return [];
  }
};

/**
 * Track word learned
 * @param {string} firebaseUid - User's Firebase UID
 * @param {number} count - Number of words learned (default: 1)
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackWordLearned = async (firebaseUid, count = 1) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    const currentWords = user.achievements?.progress?.wordsLearned || 0;

    const newlyUnlocked = await updateProgress(firebaseUid, {
      wordsLearned: currentWords + count,
      totalXp: user.xp?.total || 0,
      currentLevel: user.xp?.level || 1,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking word learned:", error);
    return [];
  }
};

/**
 * Track quiz completion
 * @param {string} firebaseUid - User's Firebase UID
 * @param {number} score - Quiz score percentage (0-100)
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackQuizCompletion = async (firebaseUid, score) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    const currentQuizzes = user.achievements?.progress?.quizzesCompleted || 0;
    const currentPerfect = user.achievements?.progress?.perfectScores || 0;

    const progressUpdates = {
      quizzesCompleted: currentQuizzes + 1,
      totalXp: user.xp?.total || 0,
      currentLevel: user.xp?.level || 1,
    };

    // If perfect score (100%), increment perfect scores
    if (score === 100) {
      progressUpdates.perfectScores = currentPerfect + 1;
    }

    const newlyUnlocked = await updateProgress(firebaseUid, progressUpdates);

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking quiz completion:", error);
    return [];
  }
};

/**
 * Track XP update (called when XP is awarded)
 * @param {string} firebaseUid - User's Firebase UID
 * @param {number} totalXp - New total XP
 * @param {number} level - New level
 * @param {number} longestStreak - Longest streak
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackXpUpdate = async (firebaseUid, totalXp, level, longestStreak) => {
  try {
    const newlyUnlocked = await updateProgress(firebaseUid, {
      totalXp,
      currentLevel: level,
      longestStreak,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking XP update:", error);
    return [];
  }
};

/**
 * Track streak update
 * @param {string} firebaseUid - User's Firebase UID
 * @param {number} longestStreak - Longest streak
 * @returns {Promise<Array>} - Newly unlocked achievements
 */
const trackStreakUpdate = async (firebaseUid, longestStreak) => {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid });

    if (!user) {
      throw new Error("User not found");
    }

    const newlyUnlocked = await updateProgress(firebaseUid, {
      longestStreak,
      totalXp: user.xp?.total || 0,
      currentLevel: user.xp?.level || 1,
    });

    return newlyUnlocked;
  } catch (error) {
    console.error("Error tracking streak update:", error);
    return [];
  }
};

module.exports = {
  trackLessonCompletion,
  trackGrammarCompletion,
  trackWordLearned,
  trackQuizCompletion,
  trackXpUpdate,
  trackStreakUpdate,
};
