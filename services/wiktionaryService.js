// server/services/wiktionaryService.js
// BALANCED VERSION - Audio + Examples + Part of Speech + Plural

const axios = require("axios");

// Create axios instance with User-Agent header
const axiosInstance = axios.create({
  headers: {
    "User-Agent": "DeutschShikhi/1.0 (Language Learning App; https://deutschshikhi.com) Node.js/axios",
  },
});

/**
 * Fetch audio and enriched data for a German word from Wiktionary
 * @param {string} word - German word to search
 * @returns {Promise<Object|null>} - Audio, examples, part of speech, plural
 */
const getWiktionaryData = async (word) => {
  try {
    console.log(`Fetching Wiktionary data for: ${word}`);

    // Step 1: Get page wikitext
    const pageUrl = `https://en.wiktionary.org/w/api.php`;
    const params = {
      action: "parse",
      page: word,
      format: "json",
      prop: "wikitext",
    };

    const response = await axiosInstance.get(pageUrl, { params });

    if (response.data.error) {
      console.log(`Wiktionary: Word "${word}" not found`);
      return null;
    }

    const wikitext = response.data.parse.wikitext["*"];

    // Step 2: Extract German section
    const germanSection = extractGermanSection(wikitext);
    if (!germanSection) {
      console.log(`No German section found for: ${word}`);
      return null;
    }

    // Step 3: Extract required information
    const data = {
      word: word,
      audio: await extractAudio(germanSection),
      examples: extractExamples(germanSection),
      partOfSpeech: extractPartOfSpeech(germanSection),
      plural: extractPlural(germanSection),
    };

    console.log(`✅ Extracted data for: ${word}`, {
      hasAudio: !!data.audio,
      exampleCount: data.examples?.length || 0,
      partOfSpeech: data.partOfSpeech,
      plural: data.plural,
    });

    return data;
  } catch (error) {
    console.error(`Error fetching Wiktionary data for "${word}":`, error.message);
    return null;
  }
};

/**
 * Get just audio (backwards compatible with existing code)
 */
const getWiktionaryAudio = async (word) => {
  const data = await getWiktionaryData(word);
  return data?.audio || null;
};

/**
 * Extract German language section from wikitext
 */
const extractGermanSection = (wikitext) => {
  // Find text between ==German== and next language heading
  const germanMatch = wikitext.match(/==German==([\s\S]*?)(?:^==(?!=)|$)/m);
  return germanMatch ? germanMatch[1] : null;
};

/**
 * Extract audio information
 */
const extractAudio = async (germanSection) => {
  const audioPatterns = [
    /\{\{audio\|de\|([^}|]+\.(?:ogg|wav|mp3))/i,
    /\{\{audio-IPA\|de\|([^}|]+\.(?:ogg|wav|mp3))/i,
  ];

  for (const pattern of audioPatterns) {
    const match = germanSection.match(pattern);
    if (match) {
      const filename = match[1].trim();
      const url = await getWikimediaAudioUrl(filename);
      if (url) {
        console.log(`Found audio: ${filename}`);
        return { filename, url, source: "wiktionary" };
      }
    }
  }

  return null;
};

/**
 * Extract example sentences
 */
const extractExamples = (germanSection) => {
  const examples = [];

  // Pattern 1: #: Example sentence
  const pattern1 = /^#:\s*(.+?)$/gm;
  let match;

  while ((match = pattern1.exec(germanSection)) !== null) {
    let example = match[1].trim();
    example = cleanWikiText(example);

    if (example.length > 5 && !example.startsWith("{{")) {
      examples.push(example);
    }
  }

  // Pattern 2: #* Example (alternative format)
  const pattern2 = /^#\*\s*(.+?)$/gm;
  while ((match = pattern2.exec(germanSection)) !== null) {
    let example = match[1].trim();
    example = cleanWikiText(example);

    if (example.length > 5 && !example.startsWith("{{") && !examples.includes(example)) {
      examples.push(example);
    }
  }

  console.log(`Found ${examples.length} example sentences`);
  return examples.length > 0 ? examples : null;
};

/**
 * Extract part of speech
 */
const extractPartOfSpeech = (germanSection) => {
  const posPatterns = [
    { pattern: /===Noun===/i, pos: "noun" },
    { pattern: /===Verb===/i, pos: "verb" },
    { pattern: /===Adjective===/i, pos: "adjective" },
    { pattern: /===Adverb===/i, pos: "adverb" },
    { pattern: /===Pronoun===/i, pos: "pronoun" },
    { pattern: /===Preposition===/i, pos: "preposition" },
    { pattern: /===Conjunction===/i, pos: "conjunction" },
    { pattern: /===Interjection===/i, pos: "interjection" },
  ];

  for (const { pattern, pos } of posPatterns) {
    if (pattern.test(germanSection)) {
      console.log(`Part of speech: ${pos}`);
      return pos;
    }
  }

  return null;
};

/**
 * Extract plural form (for nouns)
 */
const extractPlural = (germanSection) => {
  // Pattern 1: {{de-noun|m|Äpfel}}
  let match = germanSection.match(/\{\{de-noun\|[mfn]\|([^}|]+)\}\}/i);
  if (match) {
    console.log(`Plural form: ${match[1]}`);
    return match[1].trim();
  }

  // Pattern 2: {{de-noun|m|Äpfel|dim=Äpfelchen}}
  match = germanSection.match(/\{\{de-noun\|[mfn]\|([^}|]+)\|/i);
  if (match) {
    console.log(`Plural form: ${match[1]}`);
    return match[1].trim();
  }

  // Pattern 3: plural=Äpfel
  match = germanSection.match(/\|plural=([^}|]+)/i);
  if (match) {
    console.log(`Plural form: ${match[1]}`);
    return match[1].trim();
  }

  return null;
};

/**
 * Clean wiki markup from text
 */
const cleanWikiText = (text) => {
  return text
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2") // [[link|text]] -> text
    .replace(/\[\[([^\]]+)\]\]/g, "$1") // [[link]] -> link
    .replace(/'{2,}/g, "") // Remove bold/italic markers
    .replace(/\{\{[^}]+\}\}/g, "") // Remove templates
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .trim();
};

/**
 * Get audio URL from Wikimedia Commons
 */
const getWikimediaAudioUrl = async (filename) => {
  try {
    const apiUrl = "https://commons.wikimedia.org/w/api.php";
    const params = {
      action: "query",
      titles: `File:${filename}`,
      prop: "imageinfo",
      iiprop: "url",
      format: "json",
    };

    const response = await axiosInstance.get(apiUrl, { params });
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") return null;

    const imageInfo = pages[pageId].imageinfo;
    if (!imageInfo || imageInfo.length === 0) return null;

    return imageInfo[0].url;
  } catch (error) {
    return null;
  }
};

module.exports = {
  getWiktionaryAudio, // Backwards compatible - just audio
  getWiktionaryData, // New - audio + examples + part of speech + plural
};
