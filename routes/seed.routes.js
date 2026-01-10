const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");

/**
 * @route   POST /api/v1/seed/init
 * @desc    Initialize database with sample data (DEV ONLY)
 * @access  Public (remove in production!)
 */
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
        maxRetakes: 0,
        showCorrectAnswers: true,
        requireSequentialLessons: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Create Levels
    const existingLevels = await levelsCollection.countDocuments();
    let levelA1, levelA2;

    if (existingLevels === 0) {
      const levelsResult = await levelsCollection.insertMany([
        {
          code: "A1",
          title: {
            de: "Anfänger",
            en: "Beginner",
            bn: "প্রাথমিক",
          },
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          code: "A2",
          title: {
            de: "Grundlegende Kenntnisse",
            en: "Elementary",
            bn: "মৌলিক",
          },
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      levelA1 = levelsResult.insertedIds[0];
      levelA2 = levelsResult.insertedIds[1];
    } else {
      const levels = await levelsCollection.find({}).toArray();
      levelA1 = levels.find((l) => l.code === "A1")?._id;
      levelA2 = levels.find((l) => l.code === "A2")?._id;
    }

    // 3. Create Lessons for A1
    const existingLessons = await lessonsCollection.countDocuments();
    let lesson1, lesson2, lesson3;

    if (existingLessons === 0 && levelA1) {
      const lessonsResult = await lessonsCollection.insertMany([
        {
          levelId: levelA1,
          order: 1,
          status: "published",
          title: {
            de: "Begrüßung und Vorstellung",
            en: "Greetings and Introduction",
            bn: "অভিবাদন এবং পরিচয়",
          },
          contentBlocks: [
            {
              type: "text",
              content: {
                de: "Lernen Sie, wie man sich auf Deutsch vorstellt.",
                en: "Learn how to introduce yourself in German.",
                bn: "জার্মান ভাষায় নিজেকে পরিচয় দিতে শিখুন।",
              },
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          levelId: levelA1,
          order: 2,
          status: "published",
          title: {
            de: "Zahlen 1-20",
            en: "Numbers 1-20",
            bn: "সংখ্যা ১-২০",
          },
          contentBlocks: [
            {
              type: "text",
              content: {
                de: "Lernen Sie die Zahlen von 1 bis 20.",
                en: "Learn numbers from 1 to 20.",
                bn: "১ থেকে ২০ পর্যন্ত সংখ্যা শিখুন।",
              },
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          levelId: levelA1,
          order: 3,
          status: "published",
          title: {
            de: "Farben",
            en: "Colors",
            bn: "রং",
          },
          contentBlocks: [
            {
              type: "text",
              content: {
                de: "Lernen Sie die Farben auf Deutsch.",
                en: "Learn colors in German.",
                bn: "জার্মান ভাষায় রং শিখুন।",
              },
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      lesson1 = lessonsResult.insertedIds[0];
      lesson2 = lessonsResult.insertedIds[1];
      lesson3 = lessonsResult.insertedIds[2];
    } else {
      const lessons = await lessonsCollection.find({}).sort({ order: 1 }).toArray();
      lesson1 = lessons[0]?._id;
      lesson2 = lessons[1]?._id;
      lesson3 = lessons[2]?._id;
    }

    // 4. Create Words for Lesson 1 (Greetings)
    const existingWords = await wordsCollection.countDocuments();

    if (existingWords === 0 && lesson1) {
      await wordsCollection.insertMany([
        {
          lessonId: lesson1,
          word_de: "Hallo",
          meaning_en: "Hello",
          meaning_bn: "হ্যালো",
          ipa: "/ˈhalo/",
          audio: { url: "" },
          example: {
            de: "Hallo, wie geht es dir?",
            en: "Hello, how are you?",
            bn: "হ্যালো, তুমি কেমন আছো?",
          },
          source: { meaning: "manual", audio: "manual" },
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          word_de: "Guten Morgen",
          meaning_en: "Good morning",
          meaning_bn: "সুপ্রভাত",
          ipa: "/ˌɡuːtn̩ ˈmɔʁɡn̩/",
          audio: { url: "" },
          example: {
            de: "Guten Morgen! Haben Sie gut geschlafen?",
            en: "Good morning! Did you sleep well?",
            bn: "সুপ্রভাত! আপনি কি ভালো ঘুমিয়েছেন?",
          },
          source: { meaning: "manual", audio: "manual" },
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          word_de: "Auf Wiedersehen",
          meaning_en: "Goodbye",
          meaning_bn: "বিদায়",
          ipa: "/aʊ̯f ˈviːdɐˌzeːən/",
          audio: { url: "" },
          example: {
            de: "Auf Wiedersehen! Bis morgen!",
            en: "Goodbye! See you tomorrow!",
            bn: "বিদায়! আগামীকাল দেখা হবে!",
          },
          source: { meaning: "manual", audio: "manual" },
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          word_de: "Danke",
          meaning_en: "Thank you",
          meaning_bn: "ধন্যবাদ",
          ipa: "/ˈdaŋkə/",
          audio: { url: "" },
          example: {
            de: "Danke für Ihre Hilfe!",
            en: "Thank you for your help!",
            bn: "আপনার সাহায্যের জন্য ধন্যবাদ!",
          },
          source: { meaning: "manual", audio: "manual" },
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          word_de: "Bitte",
          meaning_en: "Please / You're welcome",
          meaning_bn: "দয়া করে / স্বাগতম",
          ipa: "/ˈbɪtə/",
          audio: { url: "" },
          example: {
            de: "Bitte schön!",
            en: "You're welcome!",
            bn: "স্বাগতম!",
          },
          source: { meaning: "manual", audio: "manual" },
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    // 5. Create Exercises for Lesson 1
    const existingExercises = await exercisesCollection.countDocuments();

    if (existingExercises === 0 && lesson1) {
      await exercisesCollection.insertMany([
        {
          lessonId: lesson1,
          type: "mcq",
          question: {
            de: "Was bedeutet 'Hallo'?",
            en: "What does 'Hallo' mean?",
            bn: "'Hallo' এর অর্থ কী?",
          },
          options: [
            { id: "a", text: { de: "Tschüss", en: "Goodbye", bn: "বিদায়" } },
            { id: "b", text: { de: "Hallo", en: "Hello", bn: "হ্যালো" } },
            { id: "c", text: { de: "Danke", en: "Thank you", bn: "ধন্যবাদ" } },
            { id: "d", text: { de: "Bitte", en: "Please", bn: "দয়া করে" } },
          ],
          answerKey: "b",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          type: "mcq",
          question: {
            de: "Wie sagt man 'Thank you' auf Deutsch?",
            en: "How do you say 'Thank you' in German?",
            bn: "জার্মান ভাষায় 'Thank you' কীভাবে বলে?",
          },
          options: [
            { id: "a", text: { de: "Bitte", en: "Bitte", bn: "Bitte" } },
            { id: "b", text: { de: "Hallo", en: "Hallo", bn: "Hallo" } },
            { id: "c", text: { de: "Danke", en: "Danke", bn: "Danke" } },
            { id: "d", text: { de: "Tschüss", en: "Tschüss", bn: "Tschüss" } },
          ],
          answerKey: "c",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          type: "fill",
          question: {
            de: "Guten _____ (Morgen)",
            en: "Good _____ (Morning)",
            bn: "সু_____ (প্রভাত)",
          },
          options: [],
          answerKey: "Morgen",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          lessonId: lesson1,
          type: "mcq",
          question: {
            de: "Was sagt man zum Abschied?",
            en: "What do you say when leaving?",
            bn: "বিদায়ের সময় কী বলেন?",
          },
          options: [
            { id: "a", text: { de: "Guten Morgen", en: "Good morning", bn: "সুপ্রভাত" } },
            { id: "b", text: { de: "Auf Wiedersehen", en: "Goodbye", bn: "বিদায়" } },
            { id: "c", text: { de: "Hallo", en: "Hello", bn: "হ্যালো" } },
            { id: "d", text: { de: "Danke", en: "Thank you", bn: "ধন্যবাদ" } },
          ],
          answerKey: "b",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }

    // Get counts
    const counts = {
      settings: await settingsCollection.countDocuments(),
      levels: await levelsCollection.countDocuments(),
      lessons: await lessonsCollection.countDocuments(),
      words: await wordsCollection.countDocuments(),
      exercises: await exercisesCollection.countDocuments(),
    };

    res.status(201).json({
      success: true,
      message: "Database seeded successfully!",
      data: counts,
    });
  } catch (error) {
    console.error("Seed error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error seeding database.",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/v1/seed/reset
 * @desc    Clear all data (DEV ONLY)
 * @access  Public (remove in production!)
 */
router.delete("/reset", async function (req, res) {
  try {
    const settingsCollection = getCollection("settings");
    const levelsCollection = getCollection("levels");
    const lessonsCollection = getCollection("lessons");
    const wordsCollection = getCollection("words");
    const exercisesCollection = getCollection("exercises");
    const progressCollection = getCollection("progress");
    const usersCollection = getCollection("users");

    await settingsCollection.deleteMany({});
    await levelsCollection.deleteMany({});
    await lessonsCollection.deleteMany({});
    await wordsCollection.deleteMany({});
    await exercisesCollection.deleteMany({});
    await progressCollection.deleteMany({});
    // Don't delete users for safety
    // await usersCollection.deleteMany({});

    res.json({
      success: true,
      message: "Database reset successfully! (Users preserved)",
    });
  } catch (error) {
    console.error("Reset error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error resetting database.",
    });
  }
});

/**
 * @route   POST /api/v1/seed/make-admin
 * @desc    Make a user admin by email (DEV ONLY)
 * @access  Public (remove in production!)
 */
router.post("/make-admin", async function (req, res) {
  try {
    const { email } = req.body;
    const usersCollection = getCollection("users");

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const result = await usersCollection.findOneAndUpdate(
      { email },
      { $set: { role: "admin", updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found. Login first to create user.",
      });
    }

    res.json({
      success: true,
      message: `User ${email} is now an admin!`,
      data: result,
    });
  } catch (error) {
    console.error("Make admin error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error making user admin.",
    });
  }
});

module.exports = router;
