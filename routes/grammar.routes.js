const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");

// Helper: Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Helper: Generate unique block ID
const generateBlockId = () => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * @route   GET /api/v1/grammar
 * @desc    Get all grammar topics (with filters)
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { level, status, lesson, limit, page } = req.query;
    const grammarCollection = getCollection("grammar");

    // Build query
    const query = {};

    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }

    // Default to published for public access
    if (status) {
      query.status = status;
    } else {
      query.status = "published";
    }

    if (lesson && ObjectId.isValid(lesson)) {
      query.linkedLessons = new ObjectId(lesson);
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Get grammar topics with level info
    const grammar = await grammarCollection
      .aggregate([
        { $match: query },
        { $sort: { order: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "levels",
            localField: "levelId",
            foreignField: "_id",
            as: "level",
          },
        },
        { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1,
            slug: 1,
            description: 1,
            levelId: 1,
            "level.code": 1,
            "level.title": 1,
            blocksCount: { $size: "$blocks" },
            linkedLessons: 1,
            status: 1,
            order: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    // Get total count
    const total = await grammarCollection.countDocuments(query);

    res.json({
      success: true,
      count: grammar.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: grammar,
    });
  } catch (error) {
    console.error("Get grammar error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching grammar topics.",
    });
  }
});

/**
 * @route   GET /api/v1/grammar/:idOrSlug
 * @desc    Get single grammar topic by ID or slug
 * @access  Public
 */
router.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const grammarCollection = getCollection("grammar");

    // Build query - check if it's ObjectId or slug
    let query;
    if (ObjectId.isValid(idOrSlug)) {
      query = { _id: new ObjectId(idOrSlug) };
    } else {
      query = { slug: idOrSlug };
    }

    // Get grammar with level and linked lessons info
    const grammar = await grammarCollection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "levels",
            localField: "levelId",
            foreignField: "_id",
            as: "level",
          },
        },
        { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "lessons",
            localField: "linkedLessons",
            foreignField: "_id",
            as: "lessons",
          },
        },
        {
          $project: {
            title: 1,
            slug: 1,
            description: 1,
            levelId: 1,
            level: {
              _id: "$level._id",
              code: "$level.code",
              title: "$level.title",
            },
            blocks: 1,
            linkedLessons: 1,
            lessons: {
              _id: 1,
              title: 1,
              slug: 1,
              order: 1,
            },
            status: 1,
            order: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    if (!grammar.length) {
      return res.status(404).json({
        success: false,
        message: "Grammar topic not found.",
      });
    }

    res.json({
      success: true,
      data: grammar[0],
    });
  } catch (error) {
    console.error("Get grammar error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching grammar topic.",
    });
  }
});

/**
 * @route   POST /api/v1/grammar
 * @desc    Create new grammar topic
 * @access  Admin
 */
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, description, levelId, blocks, linkedLessons, status, order } = req.body;
    const grammarCollection = getCollection("grammar");

    // Validate required fields
    if (!title?.en || !title?.de) {
      return res.status(400).json({
        success: false,
        message: "Title in English and German is required.",
      });
    }

    if (!levelId || !ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Valid level ID is required.",
      });
    }

    // Generate slug from German title
    let slug = generateSlug(title.de);

    // Check if slug exists, append number if needed
    const existingSlug = await grammarCollection.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Process blocks - ensure each has an ID
    const processedBlocks = (blocks || []).map((block, index) => ({
      id: block.id || generateBlockId(),
      type: block.type || "text",
      order: block.order ?? index + 1,
      data: block.data || {},
    }));

    // Process linked lessons
    const processedLessons = (linkedLessons || [])
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const newGrammar = {
      title: {
        de: title.de,
        en: title.en,
        bn: title.bn || "",
      },
      slug,
      description: {
        en: description?.en || "",
        bn: description?.bn || "",
      },
      levelId: new ObjectId(levelId),
      blocks: processedBlocks,
      linkedLessons: processedLessons,
      status: status || "draft",
      order: order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await grammarCollection.insertOne(newGrammar);

    res.status(201).json({
      success: true,
      message: "Grammar topic created successfully.",
      data: { ...newGrammar, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create grammar error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating grammar topic.",
    });
  }
});

/**
 * @route   PUT /api/v1/grammar/:id
 * @desc    Update grammar topic
 * @access  Admin
 */
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, levelId, blocks, linkedLessons, status, order } = req.body;
    const grammarCollection = getCollection("grammar");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grammar ID.",
      });
    }

    // Check if exists
    const existing = await grammarCollection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Grammar topic not found.",
      });
    }

    // Build update object
    const updateData = {
      updatedAt: new Date(),
    };

    if (title) {
      updateData.title = {
        de: title.de || existing.title.de,
        en: title.en || existing.title.en,
        bn: title.bn ?? existing.title.bn,
      };

      // Update slug if German title changed
      if (title.de && title.de !== existing.title.de) {
        let newSlug = generateSlug(title.de);
        const existingSlug = await grammarCollection.findOne({
          slug: newSlug,
          _id: { $ne: new ObjectId(id) },
        });
        if (existingSlug) {
          newSlug = `${newSlug}-${Date.now()}`;
        }
        updateData.slug = newSlug;
      }
    }

    if (description) {
      updateData.description = {
        en: description.en ?? existing.description?.en ?? "",
        bn: description.bn ?? existing.description?.bn ?? "",
      };
    }

    if (levelId && ObjectId.isValid(levelId)) {
      updateData.levelId = new ObjectId(levelId);
    }

    if (blocks !== undefined) {
      updateData.blocks = blocks.map((block, index) => ({
        id: block.id || generateBlockId(),
        type: block.type || "text",
        order: block.order ?? index + 1,
        data: block.data || {},
      }));
    }

    if (linkedLessons !== undefined) {
      updateData.linkedLessons = linkedLessons
        .filter((lid) => ObjectId.isValid(lid))
        .map((lid) => new ObjectId(lid));
    }

    if (status) {
      updateData.status = status;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    await grammarCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updated = await grammarCollection.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: "Grammar topic updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Update grammar error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating grammar topic.",
    });
  }
});

/**
 * @route   DELETE /api/v1/grammar/:id
 * @desc    Delete grammar topic
 * @access  Admin
 */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const grammarCollection = getCollection("grammar");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grammar ID.",
      });
    }

    const result = await grammarCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Grammar topic not found.",
      });
    }

    res.json({
      success: true,
      message: "Grammar topic deleted successfully.",
    });
  } catch (error) {
    console.error("Delete grammar error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting grammar topic.",
    });
  }
});

/**
 * @route   PATCH /api/v1/grammar/:id/blocks
 * @desc    Update only blocks of a grammar topic (for block editor)
 * @access  Admin
 */
router.patch("/:id/blocks", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { blocks } = req.body;
    const grammarCollection = getCollection("grammar");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grammar ID.",
      });
    }

    if (!Array.isArray(blocks)) {
      return res.status(400).json({
        success: false,
        message: "Blocks must be an array.",
      });
    }

    // Process blocks
    const processedBlocks = blocks.map((block, index) => ({
      id: block.id || generateBlockId(),
      type: block.type || "text",
      order: block.order ?? index + 1,
      data: block.data || {},
    }));

    await grammarCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          blocks: processedBlocks,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Blocks updated successfully.",
    });
  } catch (error) {
    console.error("Update blocks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating blocks.",
    });
  }
});

/**
 * @route   PATCH /api/v1/grammar/:id/link-lessons
 * @desc    Link/unlink lessons to grammar topic
 * @access  Admin
 */
router.patch("/:id/link-lessons", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { lessonIds, action } = req.body; // action: "add" or "remove"
    const grammarCollection = getCollection("grammar");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grammar ID.",
      });
    }

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lesson IDs array is required.",
      });
    }

    const validLessonIds = lessonIds.filter((lid) => ObjectId.isValid(lid)).map((lid) => new ObjectId(lid));

    let updateOp;
    if (action === "remove") {
      updateOp = { $pull: { linkedLessons: { $in: validLessonIds } } };
    } else {
      updateOp = { $addToSet: { linkedLessons: { $each: validLessonIds } } };
    }

    await grammarCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        ...updateOp,
        $set: { updatedAt: new Date() },
      }
    );

    const updated = await grammarCollection.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: `Lessons ${action === "remove" ? "unlinked" : "linked"} successfully.`,
      data: updated,
    });
  } catch (error) {
    console.error("Link lessons error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error linking lessons.",
    });
  }
});

/**
 * @route   GET /api/v1/grammar/by-lesson/:lessonId
 * @desc    Get all grammar topics linked to a lesson
 * @access  Public
 */
router.get("/by-lesson/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const grammarCollection = getCollection("grammar");

    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson ID.",
      });
    }

    const grammar = await grammarCollection
      .find({
        linkedLessons: new ObjectId(lessonId),
        status: "published",
      })
      .sort({ order: 1 })
      .toArray();

    res.json({
      success: true,
      count: grammar.length,
      data: grammar,
    });
  } catch (error) {
    console.error("Get grammar by lesson error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching grammar topics.",
    });
  }
});

module.exports = router;
