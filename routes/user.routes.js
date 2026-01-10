const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { verifyToken } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/me", verifyToken, async function (req, res) {
  try {
    const usersCollection = getCollection("users");

    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile.",
    });
  }
});

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch("/me", verifyToken, async function (req, res) {
  try {
    const { name, photoURL, preferences } = req.body;
    const usersCollection = getCollection("users");

    // Build update object (only include provided fields)
    const updateFields = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (photoURL !== undefined) updateFields.photoURL = photoURL;
    if (preferences !== undefined) {
      // Validate language preference
      if (preferences.language && !["bn", "en"].includes(preferences.language)) {
        return res.status(400).json({
          success: false,
          message: "Invalid language. Must be 'bn' or 'en'.",
        });
      }
      updateFields["preferences.language"] = preferences.language;
    }

    const result = await usersCollection.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updateFields },
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
      message: "Profile updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating profile.",
    });
  }
});

/**
 * @route   PATCH /api/v1/users/me/language
 * @desc    Update user's language preference
 * @access  Private
 */
router.patch("/me/language", verifyToken, async function (req, res) {
  try {
    const { language } = req.body;
    const usersCollection = getCollection("users");

    // Validate language
    if (!language || !["bn", "en"].includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Must be 'bn' or 'en'.",
      });
    }

    const result = await usersCollection.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      {
        $set: {
          "preferences.language": language,
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
      message: `Language updated to ${language === "bn" ? "Bengali" : "English"}.`,
      data: {
        language: result.preferences.language,
      },
    });
  } catch (error) {
    console.error("Update language error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating language preference.",
    });
  }
});

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete current user's account
 * @access  Private
 */
router.delete("/me", verifyToken, async function (req, res) {
  try {
    const usersCollection = getCollection("users");
    const progressCollection = getCollection("progress");

    // Delete user's progress data
    await progressCollection.deleteMany({ firebaseUid: req.user.uid });

    // Delete user
    const result = await usersCollection.deleteOne({
      firebaseUid: req.user.uid,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting account.",
    });
  }
});

module.exports = router;
