const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");
const { verifyToken } = require("../middlewares/auth");

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 */
router.get("/me", verifyToken, async function (req, res) {
  try {
    const usersCollection = getCollection("users");

    // Find user by Firebase UID
    let user = await usersCollection.findOne({ firebaseUid: req.user.uid });

    // If user doesn't exist in DB, create one
    if (!user) {
      const newUser = {
        firebaseUid: req.user.uid,
        email: req.user.email,
        name: req.user.name || "",
        photoURL: req.user.picture || "",
        role: "user",
        preferences: {
          language: "bn", // Default to Bengali
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
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
 * @route   POST /api/v1/auth/register
 * @desc    Sync new user to database after Firebase registration
 * @access  Private
 */
router.post("/register", verifyToken, async function (req, res) {
  try {
    const { name, photoURL } = req.body;
    const usersCollection = getCollection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      firebaseUid: req.user.uid,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered.",
      });
    }

    // Create new user
    const newUser = {
      firebaseUid: req.user.uid,
      email: req.user.email,
      name: name || req.user.name || "",
      photoURL: photoURL || req.user.picture || "",
      role: "user",
      preferences: {
        language: "bn",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { ...newUser, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error registering user.",
    });
  }
});

module.exports = router;
