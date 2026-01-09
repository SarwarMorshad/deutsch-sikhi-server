const admin = require("../config/firebase-admin");
const { getCollection } = require("../config/db");

/**
 * Verify Firebase ID Token
 * Extracts user info and attaches to req.user
 */
const verifyToken = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided. Authorization denied.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Authorization denied.",
    });
  }
};

/**
 * Verify Admin Role
 * Must be used AFTER verifyToken middleware
 */
const verifyAdmin = async function (req, res, next) {
  try {
    const usersCollection = getCollection("users");
    const user = await usersCollection.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Attach full user data to request
    req.dbUser = user;
    next();
  } catch (error) {
    console.error("Admin verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying admin status.",
    });
  }
};

/**
 * Optional Auth - doesn't fail if no token
 * Useful for public routes that behave differently for logged-in users
 */
const optionalAuth = async function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      emailVerified: decodedToken.email_verified || false,
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  optionalAuth,
};
