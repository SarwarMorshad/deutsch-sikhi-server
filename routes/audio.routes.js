// server/routes/audio.routes.js

const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getCollection } = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");
const { getWiktionaryData } = require("../services/wiktionaryService");

/**
 * @route   POST /api/v1/audio/fetch/:wordId
 * @desc    Fetch audio and enriched data from Wiktionary and save to database
 * @access  Admin
 */
router.post("/fetch/:wordId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { wordId } = req.params;
    const wordsCollection = getCollection("words");

    if (!ObjectId.isValid(wordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const word = await wordsCollection.findOne({
      _id: new ObjectId(wordId),
    });

    if (!word) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    // Check if audio already exists
    if (word.audio?.url) {
      return res.json({
        success: true,
        message: "Audio already exists for this word.",
        data: {
          word: word.word_de,
          audio: word.audio,
          examples: word.examples || [],
          partOfSpeech: word.partOfSpeech,
          plural: word.plural,
        },
      });
    }

    // Fetch comprehensive data from Wiktionary
    console.log(`Fetching Wiktionary data for: ${word.word_de}`);
    const wiktionaryData = await getWiktionaryData(word.word_de);

    if (!wiktionaryData) {
      return res.status(404).json({
        success: false,
        message: "No data found on Wiktionary for this word.",
        word: word.word_de,
      });
    }

    // Build update object
    const updateData = {
      updatedAt: new Date(),
    };

    // Add audio if found
    if (wiktionaryData.audio) {
      updateData.audio = {
        url: wiktionaryData.audio.url,
        source: "wiktionary",
        filename: wiktionaryData.audio.filename,
        fetchedAt: new Date(),
      };
    }

    // Add examples if found (convert to new format)
    if (wiktionaryData.examples && wiktionaryData.examples.length > 0) {
      updateData.examples = wiktionaryData.examples.map((ex) => ({
        de: ex,
        en: "", // Admin can fill in English translation later
        bn: "", // Admin can fill in Bengali translation later
        source: "wiktionary",
      }));
    }

    // Add part of speech if found and not already set
    if (wiktionaryData.partOfSpeech && !word.partOfSpeech) {
      updateData.partOfSpeech = wiktionaryData.partOfSpeech;
    }

    // Add plural if found (for nouns)
    if (wiktionaryData.plural) {
      updateData.plural = wiktionaryData.plural;
    }

    // Add enrichment metadata
    updateData.wiktionaryData = {
      enriched: true,
      enrichedAt: new Date(),
      source: "en.wiktionary.org",
    };

    // Update word in database
    await wordsCollection.updateOne({ _id: new ObjectId(wordId) }, { $set: updateData });

    console.log(`✅ Saved enriched data for: ${word.word_de}`);

    // Get updated word
    const updatedWord = await wordsCollection.findOne({
      _id: new ObjectId(wordId),
    });

    res.json({
      success: true,
      message: "Word enriched successfully from Wiktionary.",
      data: {
        word: word.word_de,
        audio: updatedWord.audio || null,
        examples: updatedWord.examples || [],
        partOfSpeech: updatedWord.partOfSpeech || null,
        plural: updatedWord.plural || null,
        enriched: true,
      },
    });
  } catch (error) {
    console.error("Error fetching Wiktionary data:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching data from Wiktionary.",
    });
  }
});

/**
 * @route   POST /api/v1/audio/fetch-batch
 * @desc    Fetch audio and enriched data for multiple words at once
 * @access  Admin
 */
router.post("/fetch-batch", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { wordIds } = req.body;

    if (!Array.isArray(wordIds) || wordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "wordIds array is required.",
      });
    }

    const wordsCollection = getCollection("words");
    const results = {
      total: wordIds.length,
      success: 0,
      failed: 0,
      alreadyExists: 0,
      details: [],
    };

    for (const wordId of wordIds) {
      if (!ObjectId.isValid(wordId)) {
        results.failed++;
        results.details.push({
          wordId,
          status: "failed",
          message: "Invalid word ID",
        });
        continue;
      }

      const word = await wordsCollection.findOne({
        _id: new ObjectId(wordId),
      });

      if (!word) {
        results.failed++;
        results.details.push({
          wordId,
          status: "failed",
          message: "Word not found",
        });
        continue;
      }

      if (word.audio?.url) {
        results.alreadyExists++;
        results.details.push({
          wordId,
          word: word.word_de,
          status: "skipped",
          message: "Audio already exists",
        });
        continue;
      }

      console.log(`Batch: Fetching data for ${word.word_de}`);
      const wiktionaryData = await getWiktionaryData(word.word_de);

      if (!wiktionaryData || !wiktionaryData.audio) {
        results.failed++;
        results.details.push({
          wordId,
          word: word.word_de,
          status: "failed",
          message: "No audio found on Wiktionary",
        });
        continue;
      }

      // Build update object
      const updateData = {
        updatedAt: new Date(),
      };

      if (wiktionaryData.audio) {
        updateData.audio = {
          url: wiktionaryData.audio.url,
          source: "wiktionary",
          filename: wiktionaryData.audio.filename,
          fetchedAt: new Date(),
        };
      }

      if (wiktionaryData.examples && wiktionaryData.examples.length > 0) {
        updateData.examples = wiktionaryData.examples.map((ex) => ({
          de: ex,
          en: "",
          bn: "",
          source: "wiktionary",
        }));
      }

      if (wiktionaryData.partOfSpeech && !word.partOfSpeech) {
        updateData.partOfSpeech = wiktionaryData.partOfSpeech;
      }

      if (wiktionaryData.plural) {
        updateData.plural = wiktionaryData.plural;
      }

      updateData.wiktionaryData = {
        enriched: true,
        enrichedAt: new Date(),
        source: "en.wiktionary.org",
      };

      await wordsCollection.updateOne({ _id: new ObjectId(wordId) }, { $set: updateData });

      results.success++;
      results.details.push({
        wordId,
        word: word.word_de,
        status: "success",
        hasAudio: !!wiktionaryData.audio,
        examplesCount: wiktionaryData.examples?.length || 0,
        partOfSpeech: wiktionaryData.partOfSpeech,
        plural: wiktionaryData.plural,
      });

      // Delay to be nice to Wiktionary
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    res.json({
      success: true,
      message: `Batch complete. Success: ${results.success}, Failed: ${results.failed}, Already exists: ${results.alreadyExists}`,
      data: results,
    });
  } catch (error) {
    console.error("Error in batch fetch:", error.message);
    res.status(500).json({
      success: false,
      message: "Error processing batch audio fetch.",
    });
  }
});

/**
 * @route   DELETE /api/v1/audio/:wordId
 * @desc    Delete audio from a word
 * @access  Admin
 */
router.delete("/:wordId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { wordId } = req.params;
    const wordsCollection = getCollection("words");

    if (!ObjectId.isValid(wordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid word ID.",
      });
    }

    const result = await wordsCollection.updateOne(
      { _id: new ObjectId(wordId) },
      {
        $unset: { audio: "" },
        $set: { updatedAt: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Word not found.",
      });
    }

    res.json({
      success: true,
      message: "Audio deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting audio:", error.message);
    res.status(500).json({
      success: false,
      message: "Error deleting audio.",
    });
  }
});

/**
 * @route   GET /api/v1/audio/stats
 * @desc    Get audio coverage statistics (with optional level filter)
 * @access  Admin
 */
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { level } = req.query;
    const wordsCollection = getCollection("words");

    // Build query with optional level filter
    const query = { verified: true };
    if (level && ObjectId.isValid(level)) {
      query.levelId = new ObjectId(level);
    }

    const totalWords = await wordsCollection.countDocuments(query);
    const wordsWithAudio = await wordsCollection.countDocuments({
      ...query,
      "audio.url": { $exists: true },
    });
    const wordsWithoutAudio = totalWords - wordsWithAudio;
    const coveragePercentage = totalWords > 0 ? ((wordsWithAudio / totalWords) * 100).toFixed(2) : 0;

    const wiktionaryCount = await wordsCollection.countDocuments({
      ...query,
      "audio.source": "wiktionary",
    });

    res.json({
      success: true,
      data: {
        total: totalWords,
        withAudio: wordsWithAudio,
        withoutAudio: wordsWithoutAudio,
        coveragePercentage: parseFloat(coveragePercentage),
        bySource: {
          wiktionary: wiktionaryCount,
        },
      },
    });
  } catch (error) {
    console.error("Error getting audio stats:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting audio statistics.",
    });
  }
});

module.exports = router;
