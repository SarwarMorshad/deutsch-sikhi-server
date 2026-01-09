const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database reference
let db;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);

    // Ping to confirm connection
    await db.command({ ping: 1 });
    console.log("✅ Connected to MongoDB successfully!");

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Get database instance
const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

// Get specific collection
const getCollection = (collectionName) => {
  return getDB().collection(collectionName);
};

// Close connection (for graceful shutdown)
const closeDB = async () => {
  try {
    await client.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error.message);
  }
};

module.exports = {
  connectDB,
  getDB,
  getCollection,
  closeDB,
  client,
};
