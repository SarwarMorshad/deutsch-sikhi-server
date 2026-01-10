const express = require("express");
const router = express.Router();
const { getCollection } = require("../config/db");

// Import seed data
const { levels, a1Lessons, vocabularyByModule, exercisesByModule } = require("./seed-data");

router.post("/init", async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const wordsCollection = getCollection("words");
    const exercisesCollection = getCollection("exercises");

    // 1. Create Settings
    const existingSettings = await settingsCollection.findOne({ type: "app" });
    if (!existingSettings) {
      await settingsCollection.insertOne({
        type: "app",
        minPassingScore: 70,
        allowRetakes: true,
        showCorrectAnswers: true,
        requireSequentialLessons: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Create/Update Levels
    const levelIds = {};
    for (const level of levels) {
      const existing = await levelsCollection.findOne({ code: level.code });
      if (existing) {
        await levelsCollection.updateOne({ code: level.code }, { $set: { ...level, updatedAt: new Date() } });
        levelIds[level.code] = existing._id;
      } else {
        const result = await levelsCollection.insertOne({
          ...level,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        levelIds[level.code] = result.insertedId;
      }
    }

    // 3. Create/Update A1 Lessons
    const lessonIds = {};
    for (const lesson of a1Lessons) {
      const levelId = levelIds[lesson.levelCode];
      const existing = await lessonsCollection.findOne({ levelId, order: lesson.order });
      const lessonData = { ...lesson, levelId, updatedAt: new Date() };
      delete lessonData.levelCode;

      if (existing) {
        await lessonsCollection.updateOne({ _id: existing._id }, { $set: lessonData });
        lessonIds[lesson.order] = existing._id;
      } else {
        lessonData.createdAt = new Date();
        const result = await lessonsCollection.insertOne(lessonData);
        lessonIds[lesson.order] = result.insertedId;
      }
    }

    // 4. Create Words
    for (const [moduleNum, words] of Object.entries(vocabularyByModule)) {
      const lessonId = lessonIds[parseInt(moduleNum)];
      if (!lessonId || !words.length) continue;
      await wordsCollection.deleteMany({ lessonId });
      const wordDocs = words.map((w) => ({
        lessonId,
        german: w.german,
        english: w.english,
        bengali: w.bengali,
        article: w.article || null,
        partOfSpeech: w.partOfSpeech || "word",
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await wordsCollection.insertMany(wordDocs);
    }

    // 5. Create Exercises
    for (const [moduleNum, exercises] of Object.entries(exercisesByModule)) {
      const lessonId = lessonIds[parseInt(moduleNum)];
      if (!lessonId || !exercises.length) continue;
      await exercisesCollection.deleteMany({ lessonId });
      const exDocs = exercises.map((ex) => ({
        lessonId,
        type: ex.type,
        question: ex.question,
        options: ex.options,
        correctAnswer: ex.correctAnswer,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await exercisesCollection.insertMany(exDocs);
    }

    const counts = {
      levels: await levelsCollection.countDocuments(),
      lessons: await lessonsCollection.countDocuments(),
      words: await wordsCollection.countDocuments(),
      exercises: await exercisesCollection.countDocuments(),
    };

    res
      .status(201)
      .json({ success: true, message: "Database seeded with complete A1 course!", data: counts });
  } catch (error) {
    console.error("Seed error:", error.message);
    res.status(500).json({ success: false, message: "Error seeding database.", error: error.message });
  }
});

router.delete("/reset", async function (req, res) {
  try {
    await getCollection("settings").deleteMany({});
    await getCollection("levels").deleteMany({});
    await getCollection("lessons").deleteMany({});
    await getCollection("words").deleteMany({});
    await getCollection("exercises").deleteMany({});
    await getCollection("progress").deleteMany({});
    res.json({ success: true, message: "Database reset! (Users preserved)" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resetting database." });
  }
});

router.post("/make-admin", async function (req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required." });
    const result = await getCollection("users").findOneAndUpdate(
      { email },
      { $set: { role: "admin", updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: `${email} is now admin!`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error making admin." });
  }
});

module.exports = router;
