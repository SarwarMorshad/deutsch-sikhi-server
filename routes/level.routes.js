const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { optionalAuth } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/levels
 * @desc    Get all levels (A1, A2, etc.)
 * @access  Public
 */
router.get("/", optionalAuth, async function (req, res) {
  try {
    const levelsCollection = getCollection("levels");

    const levels = await levelsCollection.find({}).sort({ order: 1 }).toArray();

    res.json({
      success: true,
      count: levels.length,
      data: levels,
    });
  } catch (error) {
    console.error("Get levels error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching levels.",
    });
  }
});

/**
 * @route   GET /api/v1/levels/:levelId
 * @desc    Get single level by ID
 * @access  Public
 */
router.get("/:levelId", optionalAuth, async function (req, res) {
  try {
    const { levelId } = req.params;
    const levelsCollection = getCollection("levels");

    // Check if levelId is valid ObjectId
    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const level = await levelsCollection.findOne({
      _id: new ObjectId(levelId),
    });

    if (!level) {
      return res.status(404).json({
        success: false,
        message: "Level not found.",
      });
    }

    res.json({
      success: true,
      data: level,
    });
  } catch (error) {
    console.error("Get level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching level.",
    });
  }
});

/**
 * @route   GET /api/v1/levels/:levelId/lessons
 * @desc    Get all published lessons for a level
 * @access  Public
 */
router.get("/:levelId/lessons", optionalAuth, async function (req, res) {
  try {
    const { levelId } = req.params;
    const lessonsCollection = getCollection("lessons");

    // Check if levelId is valid ObjectId
    if (!ObjectId.isValid(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID.",
      });
    }

    const lessons = await lessonsCollection
      .find({
        levelId: new ObjectId(levelId),
        status: "published",
      })
      .sort({ order: 1 })
      .toArray();

    res.json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (error) {
    console.error("Get lessons by level error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching lessons.",
    });
  }
});

module.exports = router;
