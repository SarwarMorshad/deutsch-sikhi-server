/**
 * XP & Streak System Service
 * Handles all XP calculations, level progression, and streak management
 */

// XP rewards configuration
const XP_REWARDS = {
  COMPLETE_LESSON: 20,
  QUIZ_PERFECT: 30, // 100% score
  QUIZ_GOOD: 20, // 70-99% score
  QUIZ_PASS: 10, // <70% score
  LEARN_WORD: 5,
  REVIEW_WORD_CORRECT: 2,
  REVIEW_WORD_WRONG: 1,
  DAILY_GOAL_BONUS: 10,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
  STREAK_100_DAYS: 500,
  STREAK_365_DAYS: 1000,
};

// Level calculation
const calculateLevelRequirement = (level) => {
  // Level 1 → 2: 100 XP
  // Level 2 → 3: 150 XP
  // Level 3 → 4: 200 XP
  // Formula: 100 + (level - 1) * 50
  return 100 + (level - 1) * 50;
};

// Get level from total XP
const getLevelFromXP = (totalXP) => {
  let level = 1;
  let xpRequired = 0;
  let xpForCurrentLevel = 0;

  while (true) {
    const requirement = calculateLevelRequirement(level);
    if (xpRequired + requirement > totalXP) {
      xpForCurrentLevel = totalXP - xpRequired;
      break;
    }
    xpRequired += requirement;
    level++;
  }

  return {
    level,
    currentLevelXp: xpForCurrentLevel,
    nextLevelXp: calculateLevelRequirement(level),
    totalXpForNextLevel: xpRequired + calculateLevelRequirement(level),
  };
};

// Check if dates are consecutive days
const areConsecutiveDays = (date1, date2) => {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Reset time to midnight for comparison
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays === 1;
};

// Check if same day
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
  );
};

// Calculate streak bonuses
const getStreakBonus = (streakDays) => {
  const bonuses = [];

  if (streakDays === 7) {
    bonuses.push({ type: "STREAK_7_DAYS", xp: XP_REWARDS.STREAK_7_DAYS, message: "🔥 7-Day Streak!" });
  }
  if (streakDays === 30) {
    bonuses.push({ type: "STREAK_30_DAYS", xp: XP_REWARDS.STREAK_30_DAYS, message: "🔥 30-Day Streak!" });
  }
  if (streakDays === 100) {
    bonuses.push({ type: "STREAK_100_DAYS", xp: XP_REWARDS.STREAK_100_DAYS, message: "🔥 100-Day Streak!" });
  }
  if (streakDays === 365) {
    bonuses.push({ type: "STREAK_365_DAYS", xp: XP_REWARDS.STREAK_365_DAYS, message: "🔥 365-Day Streak!" });
  }

  return bonuses;
};

/**
 * Main function to award XP and update streak
 * @param {Object} user - User document from database
 * @param {string} activityType - Type of activity (COMPLETE_LESSON, QUIZ_PERFECT, etc.)
 * @param {Object} options - Additional options (quizScore, etc.)
 * @returns {Object} - Updated XP data and any bonuses earned
 */
const awardXP = (user, activityType, options = {}) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Initialize user XP data if not exists
  const currentXP = user.xp || {
    total: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 100,
  };

  const currentStreak = user.streak || {
    current: 0,
    longest: 0,
    lastActivityDate: null,
  };

  const dailyGoal = user.dailyGoal || {
    target: 50,
    todayXp: 0,
    lastResetDate: null,
  };

  // Reset daily XP if it's a new day
  if (!isSameDay(dailyGoal.lastResetDate, today)) {
    dailyGoal.todayXp = 0;
    dailyGoal.lastResetDate = today;
  }

  // Calculate base XP reward
  let xpEarned = 0;
  const rewards = [];

  switch (activityType) {
    case "COMPLETE_LESSON":
      xpEarned = XP_REWARDS.COMPLETE_LESSON;
      rewards.push({ type: "COMPLETE_LESSON", xp: xpEarned, message: "Lesson completed!" });
      break;

    case "COMPLETE_QUIZ":
      const score = options.score || 0;
      if (score === 100) {
        xpEarned = XP_REWARDS.QUIZ_PERFECT;
        rewards.push({ type: "QUIZ_PERFECT", xp: xpEarned, message: "Perfect quiz score!" });
      } else if (score >= 70) {
        xpEarned = XP_REWARDS.QUIZ_GOOD;
        rewards.push({ type: "QUIZ_GOOD", xp: xpEarned, message: "Great quiz score!" });
      } else {
        xpEarned = XP_REWARDS.QUIZ_PASS;
        rewards.push({ type: "QUIZ_PASS", xp: xpEarned, message: "Quiz completed!" });
      }
      break;

    case "LEARN_WORD":
      xpEarned = XP_REWARDS.LEARN_WORD;
      rewards.push({ type: "LEARN_WORD", xp: xpEarned, message: "New word learned!" });
      break;

    case "REVIEW_WORD":
      const correct = options.correct || false;
      xpEarned = correct ? XP_REWARDS.REVIEW_WORD_CORRECT : XP_REWARDS.REVIEW_WORD_WRONG;
      rewards.push({
        type: correct ? "REVIEW_WORD_CORRECT" : "REVIEW_WORD_WRONG",
        xp: xpEarned,
        message: correct ? "Correct answer!" : "Keep practicing!",
      });
      break;

    default:
      xpEarned = 0;
  }

  // Update streak
  let streakUpdated = false;
  let streakBroken = false;

  if (!isSameDay(currentStreak.lastActivityDate, today)) {
    if (areConsecutiveDays(currentStreak.lastActivityDate, today)) {
      // Continue streak
      currentStreak.current += 1;
      streakUpdated = true;
    } else if (currentStreak.lastActivityDate === null) {
      // First activity ever
      currentStreak.current = 1;
      streakUpdated = true;
    } else {
      // Streak broken - check if it was just yesterday or earlier
      const lastActivity = new Date(currentStreak.lastActivityDate);
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak broken
        streakBroken = currentStreak.current > 0;
        currentStreak.current = 1;
        streakUpdated = true;
      }
    }

    // Update longest streak
    if (currentStreak.current > currentStreak.longest) {
      currentStreak.longest = currentStreak.current;
    }

    currentStreak.lastActivityDate = today;
  }

  // Check for streak bonuses
  if (streakUpdated) {
    const streakBonuses = getStreakBonus(currentStreak.current);
    streakBonuses.forEach((bonus) => {
      xpEarned += bonus.xp;
      rewards.push(bonus);
    });
  }

  // Update daily XP
  const previousTodayXp = dailyGoal.todayXp;
  dailyGoal.todayXp += xpEarned;

  // Check for daily goal completion bonus
  if (previousTodayXp < dailyGoal.target && dailyGoal.todayXp >= dailyGoal.target) {
    xpEarned += XP_REWARDS.DAILY_GOAL_BONUS;
    rewards.push({
      type: "DAILY_GOAL_BONUS",
      xp: XP_REWARDS.DAILY_GOAL_BONUS,
      message: "🎯 Daily goal achieved!",
    });
  }

  // Update total XP and level
  const newTotalXP = currentXP.total + xpEarned;
  const levelInfo = getLevelFromXP(newTotalXP);
  const leveledUp = levelInfo.level > currentXP.level;

  // Prepare updated data
  const updatedXP = {
    total: newTotalXP,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
  };

  return {
    xpEarned,
    rewards,
    leveledUp,
    newLevel: leveledUp ? levelInfo.level : null,
    streakUpdated,
    streakBroken,
    updatedData: {
      xp: updatedXP,
      streak: currentStreak,
      dailyGoal,
    },
  };
};

/**
 * Get user's current XP status
 */
const getXPStatus = (user) => {
  const xp = user.xp || {
    total: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 100,
  };

  const streak = user.streak || {
    current: 0,
    longest: 0,
    lastActivityDate: null,
  };

  const dailyGoal = user.dailyGoal || {
    target: 50,
    todayXp: 0,
    lastResetDate: null,
  };

  // Check if streak is still active (activity within last 24 hours)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streakActive = false;
  if (streak.lastActivityDate) {
    const lastActivity = new Date(streak.lastActivityDate);
    streakActive = isSameDay(lastActivity, today) || isSameDay(lastActivity, yesterday);
  }

  // Reset daily XP display if it's a new day
  let todayXp = dailyGoal.todayXp;
  if (!isSameDay(dailyGoal.lastResetDate, today)) {
    todayXp = 0;
  }

  const levelProgress = (xp.currentLevelXp / xp.nextLevelXp) * 100;
  const dailyProgress = Math.min((todayXp / dailyGoal.target) * 100, 100);

  return {
    xp: {
      ...xp,
      levelProgress: Math.round(levelProgress * 10) / 10,
    },
    streak: {
      ...streak,
      isActive: streakActive,
      willExpireToday: streakActive && !isSameDay(streak.lastActivityDate, today),
    },
    dailyGoal: {
      target: dailyGoal.target,
      todayXp,
      progress: Math.round(dailyProgress * 10) / 10,
      completed: todayXp >= dailyGoal.target,
    },
  };
};

module.exports = {
  XP_REWARDS,
  awardXP,
  getXPStatus,
  getLevelFromXP,
  calculateLevelRequirement,
};
