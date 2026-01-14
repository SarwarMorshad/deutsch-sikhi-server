const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");

// All admin routes require authentication and admin role
router.use(verifyToken, verifyAdmin);

// ============================================
// MASTER ADMIN PROTECTION
// ============================================

// Master Admin Email from environment
const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;

/**
 * Check if user is Master Admin
 */
const isMasterAdmin = (email) => {
  return email === MASTER_ADMIN_EMAIL;
};

// ============================================
// LEVELS MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/levels
 * @desc    Get all levels (including drafts)
 * @access  Admin
 */
router.get("/levels", async function (req, res) {
  try {
    const levelsCollection = getCollection("levels");
    const levels = await levelsCollection.find({}).sort({ order: 1 }).toArray();

    res.json({
      success: true,
      count: levels.length,
      data: levels,
    });
  } catch (error) {
    console.error("Admin get levels error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching levels.",
    });
  }
});

/**
 * @route   POST /api/v1/admin/levels
 * @desc    Create new level
 * @access  Admin
 */
router.post("/levels", async function (req, res) {
  try {
    const { code, title, order } = req.body;
    const levelsCollection = getCollection("levels");

    // Validation
    if (!code || !title) {
      return res.status(400).json({
        success: false,
        message: "Code and title are required.",
      });
    }

    // Check if code already exists
    const existing = await levelsCollection.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Level code already exists.",
      });
    }

    const newLevel = {
      code,
      title: {
        de: title.de || "",
        bn: title.bn || "",
        en: title.en || "",
      },
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await levelsCollection.insertOne(newLevel);

    res.status(201).json({
      success: true,
      message: "Level created successfully.",
      data: { ...newLevel, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating level.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/levels/:id
 * @desc    Update level
 * @access  Admin
 */
router.patch("/levels/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const { code, title, order } = req.body;
    const levelsCollection = getCollection("levels");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (code) updateFields.code = code;
    if (title) updateFields.title = title;
    if (order !== undefined) updateFields.order = order;

    const result = await levelsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Level not found.",
      });
    }

    res.json({
      success: true,
      message: "Level updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating level.",
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/levels/:id
 * @desc    Delete level
 * @access  Admin
 */
router.delete("/levels/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    // Check if level has lessons
    const lessonsCount = await lessonsCollection.countDocuments({
      levelId: new ObjectId(id),
    });

    if (lessonsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete level. It has ${lessonsCount} lesson(s).`,
      });
    }

    const result = await levelsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Level not found.",
      });
    }

    res.json({
      success: true,
      message: "Level deleted successfully.",
    });
  } catch (error) {
    console.error("Delete level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting level.",
    });
  }
});

// ============================================
// LESSONS MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/lessons
 * @desc    Get all lessons (including drafts)
 * @access  Admin
 */
router.get("/lessons", async function (req, res) {
  try {
    const lessonsCollection = getCollection("lessons");
    const { level, status } = req.query;

    const query = {};
    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }
    if (status) {
      query.status = status;
    }

    const lessons = await lessonsCollection.find(query).sort({ order: 1 }).toArray();

    res.json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (error) {
    console.error("Admin get lessons error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching lessons.",
    });
  }
});

/**
 * @route   POST /api/v1/admin/lessons
 * @desc    Create new lesson
 * @access  Admin
 */
router.post("/lessons", async function (req, res) {
  try {
    const { levelId, title, contentBlocks, order, status } = req.body;
    const lessonsCollection = getCollection("lessons");

    // Validation
    if (!levelId || !title) {
      return res.status(400).json({
        success: false,
        message: "Level ID and title are required.",
      });
    }

    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const newLesson = {
      levelId: new ObjectId(levelId),
      title: {
        de: title.de || "",
        bn: title.bn || "",
        en: title.en || "",
      },
      contentBlocks: contentBlocks || [],
      order: order || 0,
      status: status || "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await lessonsCollection.insertOne(newLesson);

    res.status(201).json({
      success: true,
      message: "Lesson created successfully.",
      data: { ...newLesson, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating lesson.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/lessons/:id
 * @desc    Update lesson
 * @access  Admin
 */
router.patch("/lessons/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const { levelId, title, contentBlocks, order, status } = req.body;
    const lessonsCollection = getCollection("lessons");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (levelId && ObjectId.isValid(levelId)) {
      updateFields.levelId = new ObjectId(levelId);
    }
    if (title) updateFields.title = title;
    if (contentBlocks) updateFields.contentBlocks = contentBlocks;
    if (order !== undefined) updateFields.order = order;
    if (status) updateFields.status = status;

    const result = await lessonsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    res.json({
      success: true,
      message: "Lesson updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating lesson.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/lessons/:id/status
 * @desc    Update lesson status (publish/unpublish)
 * @access  Admin
 */
router.patch("/lessons/:id/status", async function (req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const lessonsCollection = getCollection("lessons");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'draft' or 'published'.",
      });
    }

    const result = await lessonsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    res.json({
      success: true,
      message: `Lesson ${status === "published" ? "published" : "unpublished"} successfully.`,
      data: result,
    });
  } catch (error) {
    console.error("Update lesson status error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating lesson status.",
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/lessons/:id
 * @desc    Delete lesson
 * @access  Admin
 */
router.delete("/lessons/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const lessonsCollection = getCollection("lessons");
    const wordsCollection = getCollection("words");
    const exercisesCollection = getCollection("exercises");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    // Delete associated words and exercises
    await wordsCollection.deleteMany({ lessonId: new ObjectId(id) });
    await exercisesCollection.deleteMany({ lessonId: new ObjectId(id) });

    const result = await lessonsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found.",
      });
    }

    res.json({
      success: true,
      message: "Lesson and associated content deleted successfully.",
    });
  } catch (error) {
    console.error("Delete lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting lesson.",
    });
  }
});

// ============================================
// WORDS MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/words
 * @desc    Get all words (including unverified)
 * @access  Admin
 */
router.get("/words", async function (req, res) {
  try {
    const wordsCollection = getCollection("words");
    const { lesson, level, verified } = req.query;

    const query = {};
    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }
    if (lesson && ObjectId.isValid(lesson)) {
      query.lessonId = new ObjectId(lesson);
    }
    if (verified !== undefined) {
      query.verified = verified === "true";
    }

    const words = await wordsCollection.find(query).toArray();

    res.json({
      success: true,
      count: words.length,
      data: words,
    });
  } catch (error) {
    console.error("Admin get words error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching words.",
    });
  }
});

/**
 * @route   POST /api/v1/admin/words
 * @desc    Create new word
 * @access  Admin
 */
router.post("/words", async function (req, res) {
  try {
    const {
      levelId,
      lessonId,
      word_de,
      article,
      partOfSpeech,
      meaning_en,
      meaning_bn,
      ipa,
      audio,
      example,
      verified,
    } = req.body;
    const wordsCollection = getCollection("words");

    // Validation - levelId is required, lessonId is optional
    if (!levelId || !word_de) {
      return res.status(400).json({
        success: false,
        message: "Level ID and German word are required.",
      });
    }

    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const newWord = {
      levelId: new ObjectId(levelId),
      lessonId: lessonId && ObjectId.isValid(lessonId) ? new ObjectId(lessonId) : null,
      word_de,
      article: article || "",
      partOfSpeech: partOfSpeech || "noun",
      meaning_en: meaning_en || "",
      meaning_bn: meaning_bn || "",
      ipa: ipa || "",
      audio: audio || { url: "" },
      example: example || { de: "", bn: "", en: "" },
      source: {
        meaning: "manual",
        audio: "manual",
      },
      verified: verified !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await wordsCollection.insertOne(newWord);

    res.status(201).json({
      success: true,
      message: "Word created successfully.",
      data: { ...newWord, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create word error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating word.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/words/:id
 * @desc    Update word
 * @access  Admin
 */
router.patch("/words/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const {
      levelId,
      lessonId,
      word_de,
      article,
      partOfSpeech,
      meaning_en,
      meaning_bn,
      ipa,
      audio,
      example,
      verified,
    } = req.body;
    const wordsCollection = getCollection("words");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (levelId && ObjectId.isValid(levelId)) {
      updateFields.levelId = new ObjectId(levelId);
    }
    if (lessonId === null) {
      updateFields.lessonId = null;
    } else if (lessonId && ObjectId.isValid(lessonId)) {
      updateFields.lessonId = new ObjectId(lessonId);
    }
    if (word_de) updateFields.word_de = word_de;
    if (article !== undefined) updateFields.article = article;
    if (partOfSpeech) updateFields.partOfSpeech = partOfSpeech;
    if (meaning_en !== undefined) updateFields.meaning_en = meaning_en;
    if (meaning_bn !== undefined) updateFields.meaning_bn = meaning_bn;
    if (ipa !== undefined) updateFields.ipa = ipa;
    if (audio) updateFields.audio = audio;
    if (example) updateFields.example = example;
    if (verified !== undefined) updateFields.verified = verified;

    const result = await wordsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    res.json({
      success: true,
      message: "Word updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update word error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating word.",
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/words/:id
 * @desc    Delete word
 * @access  Admin
 */
router.delete("/words/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const wordsCollection = getCollection("words");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const result = await wordsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    res.json({
      success: true,
      message: "Word deleted successfully.",
    });
  } catch (error) {
    console.error("Delete word error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting word.",
    });
  }
});

// ============================================
// EXERCISES MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/exercises
 * @desc    Get all exercises
 * @access  Admin
 */
router.get("/exercises", async function (req, res) {
  try {
    const exercisesCollection = getCollection("exercises");
    const { lesson, type } = req.query;

    const query = {};
    if (lesson && ObjectId.isValid(lesson)) {
      query.lessonId = new ObjectId(lesson);
    }
    if (type) {
      query.type = type;
    }

    const exercises = await exercisesCollection.find(query).toArray();

    res.json({
      success: true,
      count: exercises.length,
      data: exercises,
    });
  } catch (error) {
    console.error("Admin get exercises error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching exercises.",
    });
  }
});

/**
 * @route   POST /api/v1/admin/exercises
 * @desc    Create new exercise
 * @access  Admin
 */
router.post("/exercises", async function (req, res) {
  try {
    const { lessonId, type, question, options, answerKey } = req.body;
    const exercisesCollection = getCollection("exercises");

    // Validation
    if (!lessonId || !type || !question || !answerKey) {
      return res.status(400).json({
        success: false,
        message: "Lesson ID, type, question, and answerKey are required.",
      });
    }

    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    if (!["mcq", "fill", "match"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'mcq', 'fill', or 'match'.",
      });
    }

    const newExercise = {
      lessonId: new ObjectId(lessonId),
      type,
      question: {
        de: question.de || "",
        bn: question.bn || "",
        en: question.en || "",
      },
      options: options || [],
      answerKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await exercisesCollection.insertOne(newExercise);

    res.status(201).json({
      success: true,
      message: "Exercise created successfully.",
      data: { ...newExercise, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create exercise error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating exercise.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/exercises/:id
 * @desc    Update exercise
 * @access  Admin
 */
router.patch("/exercises/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const { lessonId, type, question, options, answerKey } = req.body;
    const exercisesCollection = getCollection("exercises");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exercise ID.",
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (lessonId && ObjectId.isValid(lessonId)) {
      updateFields.lessonId = new ObjectId(lessonId);
    }
    if (type) updateFields.type = type;
    if (question) updateFields.question = question;
    if (options) updateFields.options = options;
    if (answerKey !== undefined) updateFields.answerKey = answerKey;

    const result = await exercisesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found.",
      });
    }

    res.json({
      success: true,
      message: "Exercise updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update exercise error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating exercise.",
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/exercises/:id
 * @desc    Delete exercise
 * @access  Admin
 */
router.delete("/exercises/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const exercisesCollection = getCollection("exercises");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exercise ID.",
      });
    }

    const result = await exercisesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Exercise not found.",
      });
    }

    res.json({
      success: true,
      message: "Exercise deleted successfully.",
    });
  } catch (error) {
    console.error("Delete exercise error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting exercise.",
    });
  }
});

// ============================================
// USERS MANAGEMENT (With Master Admin Protection)
// ============================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get("/users", async function (req, res) {
  try {
    const usersCollection = getCollection("users");
    const { role, limit = 50, page = 1 } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await usersCollection.find(query).skip(skip).limit(parseInt(limit)).toArray();

    const total = await usersCollection.countDocuments(query);

    // Add isMasterAdmin flag to each user for frontend
    const usersWithMasterFlag = users.map((user) => ({
      ...user,
      isMasterAdmin: isMasterAdmin(user.email),
    }));

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: usersWithMasterFlag,
    });
  } catch (error) {
    console.error("Admin get users error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching users.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role (Protected: Cannot change Master Admin)
 * @access  Admin
 */
router.patch("/users/:id/role", async function (req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const usersCollection = getCollection("users");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'user' or 'admin'.",
      });
    }

    // Get target user first
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ⚠️ MASTER ADMIN PROTECTION
    if (isMasterAdmin(targetUser.email)) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify Master Admin's role.",
      });
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      message: `User role updated to ${role}.`,
      data: result,
    });
  } catch (error) {
    console.error("Update user role error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating user role.",
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/users/:id/block
 * @desc    Block/unblock user (Protected: Cannot block Master Admin)
 * @access  Admin
 */
router.patch("/users/:id/block", async function (req, res) {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    const usersCollection = getCollection("users");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Get target user first
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ⚠️ MASTER ADMIN PROTECTION
    if (isMasterAdmin(targetUser.email)) {
      return res.status(403).json({
        success: false,
        message: "Cannot block Master Admin.",
      });
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { blocked: !!blocked, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      message: `User ${blocked ? "blocked" : "unblocked"} successfully.`,
      data: result,
    });
  } catch (error) {
    console.error("Block user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating user status.",
    });
  }
});

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user (Protected: Cannot delete Master Admin)
 * @access  Admin
 */
router.delete("/users/:id", async function (req, res) {
  try {
    const { id } = req.params;
    const usersCollection = getCollection("users");
    const progressCollection = getCollection("progress");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Get target user first
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ⚠️ MASTER ADMIN PROTECTION
    if (isMasterAdmin(targetUser.email)) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete Master Admin.",
      });
    }

    // Delete user's progress
    await progressCollection.deleteMany({ firebaseUid: targetUser.firebaseUid });

    // Delete user
    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting user.",
    });
  }
});

// ============================================
// STATS
// ============================================

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get admin dashboard stats
 * @access  Admin
 */
router.get("/stats", async function (req, res) {
  try {
    const usersCollection = getCollection("users");
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const wordsCollection = getCollection("words");
    const exercisesCollection = getCollection("exercises");
    const progressCollection = getCollection("progress");

    const [
      totalUsers,
      totalLevels,
      totalLessons,
      publishedLessons,
      totalWords,
      verifiedWords,
      totalExercises,
      totalProgress,
    ] = await Promise.all([
      usersCollection.countDocuments({}),
      levelsCollection.countDocuments({}),
      lessonsCollection.countDocuments({}),
      lessonsCollection.countDocuments({ status: "published" }),
      wordsCollection.countDocuments({}),
      wordsCollection.countDocuments({ verified: true }),
      exercisesCollection.countDocuments({}),
      progressCollection.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        levels: totalLevels,
        lessons: {
          total: totalLessons,
          published: publishedLessons,
          draft: totalLessons - publishedLessons,
        },
        words: {
          total: totalWords,
          verified: verifiedWords,
          unverified: totalWords - verifiedWords,
        },
        exercises: totalExercises,
        completedLessons: totalProgress,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching stats.",
    });
  }
});

module.exports = router;
