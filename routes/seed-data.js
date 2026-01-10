// Complete A1 Course Seed Data

const levels = [
  {
    code: "A1",
    title: { de: "Anfänger", en: "Beginner", bn: "শুরু" },
    description: {
      en: "Master German basics. Learn introductions, questions, and daily situations.",
      bn: "জার্মান ভাষার মূল বিষয় শিখুন।",
    },
    order: 1,
    isActive: true,
  },
  {
    code: "A2",
    title: { de: "Grundlegend", en: "Elementary", bn: "প্রাথমিক" },
    description: {
      en: "Build on basics with everyday topics.",
      bn: "দৈনন্দিন বিষয় দিয়ে ভিত্তি তৈরি করুন।",
    },
    order: 2,
    isActive: false,
  },
  {
    code: "B1",
    title: { de: "Mittelstufe", en: "Intermediate", bn: "মধ্যবর্তী" },
    description: { en: "Express yourself on familiar topics.", bn: "পরিচিত বিষয়ে নিজেকে প্রকাশ করুন।" },
    order: 3,
    isActive: false,
  },
];

const a1Lessons = [
  // Module 1
  {
    order: 1,
    levelCode: "A1",
    title: { de: "Grundlagen & Aussprache", en: "Basics & Pronunciation", bn: "মূল বিষয় ও উচ্চারণ" },
    description: {
      en: "Learn German alphabet, greetings, and numbers 1-20.",
      bn: "জার্মান বর্ণমালা, অভিবাদন এবং ১-২০ সংখ্যা শিখুন।",
    },
    objectives: [
      "Recognize German alphabet sounds",
      "Pronounce Umlauts (ä, ö, ü) and ß",
      "Use basic greetings",
      "Count from 1 to 20",
    ],
    warmup: {
      dialogue: [
        {
          speaker: "A",
          text: "Hallo! Guten Tag!",
          translation: { en: "Hello! Good day!", bn: "হ্যালো! শুভ দিন!" },
        },
        {
          speaker: "B",
          text: "Guten Tag! Wie geht es Ihnen?",
          translation: { en: "Good day! How are you?", bn: "শুভ দিন! আপনি কেমন আছেন?" },
        },
        {
          speaker: "A",
          text: "Gut, danke! Und Ihnen?",
          translation: { en: "Good, thanks! And you?", bn: "ভালো, ধন্যবাদ! আর আপনি?" },
        },
      ],
    },
    grammar: {
      title: { en: "German Alphabet & Special Characters", bn: "জার্মান বর্ণমালা" },
      explanation: {
        en: "German has 26 letters plus 4 special: ä, ö, ü (Umlauts) and ß.",
        bn: "জার্মানে ২৬টি অক্ষর এবং ৪টি বিশেষ অক্ষর আছে।",
      },
      rules: [
        { rule: "ä sounds like 'e' in 'bed'", example: "Mädchen" },
        { rule: "ö sounds like 'i' in 'bird'", example: "schön" },
        { rule: "ü sounds like 'ew' in 'few'", example: "grün" },
        { rule: "ß sounds like 'ss'", example: "Straße" },
      ],
    },
    conversation: {
      situation: { en: "Meeting someone", bn: "কারো সাথে দেখা" },
      dialogue: [
        {
          speaker: "A",
          text: "Hallo! Ich bin Max.",
          translation: { en: "Hello! I am Max.", bn: "হ্যালো! আমি ম্যাক্স।" },
        },
        {
          speaker: "B",
          text: "Hallo! Ich bin Anna. Freut mich!",
          translation: { en: "Hello! I am Anna. Nice to meet you!", bn: "হ্যালো! আমি আনা।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 30,
  },

  // Module 2
  {
    order: 2,
    levelCode: "A1",
    title: { de: "Persönliche Informationen", en: "Personal Information", bn: "ব্যক্তিগত তথ্য" },
    description: {
      en: "Learn to introduce yourself and ask basic questions.",
      bn: "নিজের পরিচয় দিতে এবং সহজ প্রশ্ন করতে শিখুন।",
    },
    objectives: [
      "Introduce yourself with Ich bin/heiße",
      "Talk about countries",
      "Use verbs: sein, kommen",
      "Ask Wer? Wo? Wie?",
    ],
    warmup: {
      dialogue: [
        {
          speaker: "A",
          text: "Wie heißen Sie?",
          translation: { en: "What is your name?", bn: "আপনার নাম কী?" },
        },
        {
          speaker: "B",
          text: "Ich heiße Maria. Woher kommen Sie?",
          translation: { en: "My name is Maria. Where are you from?", bn: "আমার নাম মারিয়া।" },
        },
        {
          speaker: "A",
          text: "Ich komme aus Bangladesh.",
          translation: { en: "I come from Bangladesh.", bn: "আমি বাংলাদেশ থেকে এসেছি।" },
        },
      ],
    },
    grammar: {
      title: { en: "Verbs: sein & kommen", bn: "ক্রিয়া: sein ও kommen" },
      explanation: {
        en: "German verbs change based on the subject.",
        bn: "জার্মান ক্রিয়া বিষয় অনুযায়ী পরিবর্তন হয়।",
      },
      rules: [
        { rule: "ich bin (I am)", example: "Ich bin Student." },
        { rule: "du bist (you are)", example: "Du bist nett." },
        { rule: "er/sie ist (he/she is)", example: "Sie ist Lehrerin." },
        { rule: "wir sind (we are)", example: "Wir sind hier." },
      ],
    },
    conversation: {
      situation: { en: "At registration", bn: "নিবন্ধনের সময়" },
      dialogue: [
        {
          speaker: "Staff",
          text: "Guten Tag! Wie heißen Sie?",
          translation: { en: "Good day! What's your name?", bn: "শুভ দিন! আপনার নাম কী?" },
        },
        {
          speaker: "You",
          text: "Ich bin 25 Jahre alt.",
          translation: { en: "I am 25 years old.", bn: "আমার বয়স ২৫ বছর।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 35,
  },

  // Module 3
  {
    order: 3,
    levelCode: "A1",
    title: { de: "Tägliche Aktivitäten", en: "Daily Activities", bn: "দৈনন্দিন কাজকর্ম" },
    description: { en: "Learn action verbs and sentence structure.", bn: "ক্রিয়াপদ এবং বাক্য গঠন শিখুন।" },
    objectives: [
      "Use verbs: gehen, arbeiten, lernen",
      "Understand verb position",
      "Tell time and days",
      "Describe routines",
    ],
    warmup: {
      dialogue: [
        {
          speaker: "A",
          text: "Was machst du heute?",
          translation: { en: "What are you doing today?", bn: "আজ তুমি কী করছ?" },
        },
        {
          speaker: "B",
          text: "Ich gehe zur Arbeit um acht Uhr.",
          translation: { en: "I go to work at eight.", bn: "আমি আটটায় কাজে যাই।" },
        },
      ],
    },
    grammar: {
      title: { en: "Sentence Structure (Verb Position 2)", bn: "বাক্য গঠন" },
      explanation: {
        en: "In German, the verb ALWAYS comes in position 2.",
        bn: "জার্মানে ক্রিয়া সবসময় ২য় স্থানে থাকে।",
      },
      rules: [
        { rule: "Subject + Verb + Object", example: "Ich lerne Deutsch." },
        { rule: "Time + Verb + Subject", example: "Heute gehe ich." },
        { rule: "Question: Verb first", example: "Lernst du Deutsch?" },
      ],
    },
    conversation: {
      situation: { en: "Daily routine", bn: "দৈনন্দিন রুটিন" },
      dialogue: [
        {
          speaker: "A",
          text: "Wann stehst du auf?",
          translation: { en: "When do you wake up?", bn: "তুমি কখন ওঠ?" },
        },
        {
          speaker: "B",
          text: "Ich stehe um 7 Uhr auf.",
          translation: { en: "I wake up at 7.", bn: "আমি ৭টায় উঠি।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 40,
  },

  // Module 4
  {
    order: 4,
    levelCode: "A1",
    title: { de: "Essen & Einkaufen", en: "Food & Shopping", bn: "খাবার ও কেনাকাটা" },
    description: {
      en: "Learn food vocabulary and German articles.",
      bn: "খাবারের শব্দ এবং জার্মান আর্টিকেল শিখুন।",
    },
    objectives: [
      "Know food vocabulary",
      "Understand prices",
      "Order politely with möchten",
      "Use der, die, das",
    ],
    warmup: {
      dialogue: [
        {
          speaker: "Waiter",
          text: "Was möchten Sie?",
          translation: { en: "What would you like?", bn: "আপনি কী চান?" },
        },
        {
          speaker: "Customer",
          text: "Ich möchte einen Kaffee, bitte.",
          translation: { en: "I'd like a coffee, please.", bn: "আমি কফি চাই।" },
        },
      ],
    },
    grammar: {
      title: { en: "Articles: der, die, das", bn: "আর্টিকেল" },
      explanation: {
        en: "Every German noun has a gender: masculine (der), feminine (die), neuter (das).",
        bn: "প্রতিটি জার্মান বিশেষ্যের লিঙ্গ আছে।",
      },
      rules: [
        { rule: "der (masculine)", example: "der Kaffee, der Tee" },
        { rule: "die (feminine)", example: "die Milch, die Suppe" },
        { rule: "das (neuter)", example: "das Brot, das Wasser" },
      ],
    },
    conversation: {
      situation: { en: "At a bakery", bn: "বেকারিতে" },
      dialogue: [
        {
          speaker: "You",
          text: "Was kostet das Brot?",
          translation: { en: "How much is the bread?", bn: "রুটির দাম কত?" },
        },
        { speaker: "Baker", text: "2 Euro 50.", translation: { en: "2 Euro 50.", bn: "২ ইউরো ৫০।" } },
      ],
    },
    status: "published",
    estimatedMinutes: 40,
  },

  // Module 5
  {
    order: 5,
    levelCode: "A1",
    title: { de: "Wegbeschreibung", en: "Directions & Places", bn: "দিকনির্দেশ ও স্থান" },
    description: { en: "Learn city vocabulary and directions.", bn: "শহরের শব্দ এবং দিকনির্দেশ শিখুন।" },
    objectives: [
      "Know place vocabulary",
      "Ask and give directions",
      "Use prepositions",
      "Talk about transport",
    ],
    warmup: {
      dialogue: [
        {
          speaker: "Tourist",
          text: "Wo ist der Bahnhof?",
          translation: { en: "Where is the train station?", bn: "রেল স্টেশন কোথায়?" },
        },
        {
          speaker: "Local",
          text: "Gehen Sie geradeaus und dann links.",
          translation: { en: "Go straight then left.", bn: "সোজা যান তারপর বামে।" },
        },
      ],
    },
    grammar: {
      title: { en: "Prepositions of Place", bn: "স্থানের অব্যয়" },
      explanation: { en: "Prepositions tell us where something is.", bn: "অব্যয় বলে কিছু কোথায় আছে।" },
      rules: [
        { rule: "in + place", example: "Ich bin in der Stadt." },
        { rule: "mit + transport", example: "Ich fahre mit dem Bus." },
        { rule: "nach + city", example: "Ich fahre nach Berlin." },
      ],
    },
    conversation: {
      situation: { en: "Taking transport", bn: "পরিবহন" },
      dialogue: [
        {
          speaker: "You",
          text: "Fährt dieser Bus zum Zentrum?",
          translation: { en: "Does this bus go to center?", bn: "এই বাস কেন্দ্রে যায়?" },
        },
        {
          speaker: "Driver",
          text: "Ja, 2 Euro 80.",
          translation: { en: "Yes, 2 Euro 80.", bn: "হ্যাঁ, ২.৮০ ইউরো।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 40,
  },

  // Module 6
  {
    order: 6,
    levelCode: "A1",
    title: { de: "Familie", en: "Family & Descriptions", bn: "পরিবার ও বর্ণনা" },
    description: {
      en: "Learn family vocabulary and possessives.",
      bn: "পরিবারের শব্দ এবং সম্বন্ধসূচক সর্বনাম শিখুন।",
    },
    objectives: ["Know family vocabulary", "Use adjectives", "Use mein, dein, sein, ihr"],
    warmup: {
      dialogue: [
        {
          speaker: "A",
          text: "Hast du Geschwister?",
          translation: { en: "Do you have siblings?", bn: "তোমার ভাইবোন আছে?" },
        },
        {
          speaker: "B",
          text: "Ja, einen Bruder und eine Schwester.",
          translation: { en: "Yes, a brother and sister.", bn: "হ্যাঁ, একজন ভাই ও বোন।" },
        },
      ],
    },
    grammar: {
      title: { en: "Possessive Pronouns", bn: "সম্বন্ধসূচক সর্বনাম" },
      explanation: { en: "Possessives show ownership.", bn: "সম্বন্ধসূচক সর্বনাম মালিকানা দেখায়।" },
      rules: [
        { rule: "mein (my)", example: "mein Vater" },
        { rule: "dein (your)", example: "dein Bruder" },
        { rule: "sein (his)", example: "sein Auto" },
        { rule: "ihr (her)", example: "ihr Kind" },
      ],
    },
    conversation: {
      situation: { en: "Showing photos", bn: "ছবি দেখানো" },
      dialogue: [
        { speaker: "A", text: "Wer ist das?", translation: { en: "Who is that?", bn: "এটা কে?" } },
        {
          speaker: "B",
          text: "Das ist meine Mutter.",
          translation: { en: "That's my mother.", bn: "এটা আমার মা।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 35,
  },

  // Module 7
  {
    order: 7,
    levelCode: "A1",
    title: { de: "Gesundheit", en: "Health & Appointments", bn: "স্বাস্থ্য" },
    description: { en: "Learn body parts and modal verbs.", bn: "শরীরের অঙ্গ এবং মোডাল ক্রিয়া শিখুন।" },
    objectives: ["Know body parts", "Express symptoms", "Make appointments", "Use müssen, können"],
    warmup: {
      dialogue: [
        {
          speaker: "Patient",
          text: "Ich habe Kopfschmerzen.",
          translation: { en: "I have a headache.", bn: "আমার মাথাব্যথা।" },
        },
        { speaker: "Doctor", text: "Seit wann?", translation: { en: "Since when?", bn: "কবে থেকে?" } },
      ],
    },
    grammar: {
      title: { en: "Modal Verbs", bn: "মোডাল ক্রিয়া" },
      explanation: {
        en: "Modal verbs express ability or necessity.",
        bn: "মোডাল ক্রিয়া সক্ষমতা বা প্রয়োজনীয়তা প্রকাশ করে।",
      },
      rules: [
        { rule: "können (can)", example: "Ich kann Deutsch." },
        { rule: "müssen (must)", example: "Ich muss gehen." },
        { rule: "dürfen (may)", example: "Darf ich?" },
      ],
    },
    conversation: {
      situation: { en: "At doctor", bn: "ডাক্তারের কাছে" },
      dialogue: [
        {
          speaker: "Doctor",
          text: "Was kann ich tun?",
          translation: { en: "What can I do?", bn: "আমি কী করতে পারি?" },
        },
        {
          speaker: "Patient",
          text: "Ich brauche einen Termin.",
          translation: { en: "I need an appointment.", bn: "আমার অ্যাপয়েন্টমেন্ট দরকার।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 45,
  },

  // Module 8
  {
    order: 8,
    levelCode: "A1",
    title: { de: "Wiederholung & Test", en: "Review & Final Test", bn: "পুনরালোচনা ও পরীক্ষা" },
    description: { en: "Review all A1 and take final test.", bn: "সমস্ত A1 পুনরালোচনা করুন।" },
    objectives: ["Review vocabulary", "Practice grammar", "Pass final test"],
    warmup: {
      dialogue: [
        {
          speaker: "Teacher",
          text: "Herzlichen Glückwunsch!",
          translation: { en: "Congratulations!", bn: "অভিনন্দন!" },
        },
        {
          speaker: "Student",
          text: "Danke! Ich habe viel gelernt.",
          translation: { en: "Thanks! I learned a lot.", bn: "ধন্যবাদ!" },
        },
      ],
    },
    grammar: {
      title: { en: "A1 Summary", bn: "A1 সারাংশ" },
      explanation: { en: "Review all A1 grammar.", bn: "সমস্ত A1 ব্যাকরণ পুনরালোচনা।" },
      rules: [
        { rule: "Verb position 2", example: "Ich lerne Deutsch." },
        { rule: "Articles", example: "der, die, das" },
        { rule: "Possessives", example: "mein, dein" },
        { rule: "Modal verbs", example: "kann, muss" },
      ],
    },
    conversation: {
      situation: { en: "Final practice", bn: "চূড়ান্ত অনুশীলন" },
      dialogue: [
        {
          speaker: "A",
          text: "Wie heißen Sie?",
          translation: { en: "What's your name?", bn: "আপনার নাম কী?" },
        },
        {
          speaker: "B",
          text: "Ich komme aus Bangladesh.",
          translation: { en: "I'm from Bangladesh.", bn: "আমি বাংলাদেশ থেকে।" },
        },
      ],
    },
    status: "published",
    estimatedMinutes: 60,
    isFinalTest: true,
  },
];

const vocabularyByModule = {
  1: [
    { german: "Hallo", english: "Hello", bengali: "হ্যালো", partOfSpeech: "interjection" },
    { german: "Guten Morgen", english: "Good morning", bengali: "সুপ্রভাত", partOfSpeech: "phrase" },
    { german: "Guten Tag", english: "Good day", bengali: "শুভ দিন", partOfSpeech: "phrase" },
    { german: "Guten Abend", english: "Good evening", bengali: "শুভ সন্ধ্যা", partOfSpeech: "phrase" },
    { german: "Auf Wiedersehen", english: "Goodbye", bengali: "বিদায়", partOfSpeech: "phrase" },
    { german: "Danke", english: "Thank you", bengali: "ধন্যবাদ", partOfSpeech: "interjection" },
    { german: "Bitte", english: "Please", bengali: "দয়া করে", partOfSpeech: "interjection" },
    { german: "Ja", english: "Yes", bengali: "হ্যাঁ", partOfSpeech: "adverb" },
    { german: "Nein", english: "No", bengali: "না", partOfSpeech: "adverb" },
    { german: "eins", english: "one", bengali: "এক", partOfSpeech: "number" },
    { german: "zwei", english: "two", bengali: "দুই", partOfSpeech: "number" },
    { german: "drei", english: "three", bengali: "তিন", partOfSpeech: "number" },
    { german: "vier", english: "four", bengali: "চার", partOfSpeech: "number" },
    { german: "fünf", english: "five", bengali: "পাঁচ", partOfSpeech: "number" },
    { german: "zehn", english: "ten", bengali: "দশ", partOfSpeech: "number" },
  ],
  2: [
    { german: "Name", english: "name", bengali: "নাম", article: "der", partOfSpeech: "noun" },
    { german: "Alter", english: "age", bengali: "বয়স", article: "das", partOfSpeech: "noun" },
    { german: "Land", english: "country", bengali: "দেশ", article: "das", partOfSpeech: "noun" },
    { german: "Stadt", english: "city", bengali: "শহর", article: "die", partOfSpeech: "noun" },
    { german: "Beruf", english: "profession", bengali: "পেশা", article: "der", partOfSpeech: "noun" },
    { german: "Student", english: "student", bengali: "ছাত্র", article: "der", partOfSpeech: "noun" },
    { german: "Lehrer", english: "teacher", bengali: "শিক্ষক", article: "der", partOfSpeech: "noun" },
    { german: "Deutschland", english: "Germany", bengali: "জার্মানি", partOfSpeech: "noun" },
    { german: "Bangladesch", english: "Bangladesh", bengali: "বাংলাদেশ", partOfSpeech: "noun" },
  ],
  3: [
    { german: "gehen", english: "to go", bengali: "যাওয়া", partOfSpeech: "verb" },
    { german: "kommen", english: "to come", bengali: "আসা", partOfSpeech: "verb" },
    { german: "arbeiten", english: "to work", bengali: "কাজ করা", partOfSpeech: "verb" },
    { german: "lernen", english: "to learn", bengali: "শেখা", partOfSpeech: "verb" },
    { german: "essen", english: "to eat", bengali: "খাওয়া", partOfSpeech: "verb" },
    { german: "trinken", english: "to drink", bengali: "পান করা", partOfSpeech: "verb" },
    { german: "schlafen", english: "to sleep", bengali: "ঘুমানো", partOfSpeech: "verb" },
    { german: "Montag", english: "Monday", bengali: "সোমবার", article: "der", partOfSpeech: "noun" },
    { german: "Freitag", english: "Friday", bengali: "শুক্রবার", article: "der", partOfSpeech: "noun" },
  ],
  4: [
    { german: "Brot", english: "bread", bengali: "রুটি", article: "das", partOfSpeech: "noun" },
    { german: "Wasser", english: "water", bengali: "পানি", article: "das", partOfSpeech: "noun" },
    { german: "Kaffee", english: "coffee", bengali: "কফি", article: "der", partOfSpeech: "noun" },
    { german: "Tee", english: "tea", bengali: "চা", article: "der", partOfSpeech: "noun" },
    { german: "Milch", english: "milk", bengali: "দুধ", article: "die", partOfSpeech: "noun" },
    { german: "Reis", english: "rice", bengali: "ভাত", article: "der", partOfSpeech: "noun" },
    { german: "Fleisch", english: "meat", bengali: "মাংস", article: "das", partOfSpeech: "noun" },
    { german: "Apfel", english: "apple", bengali: "আপেল", article: "der", partOfSpeech: "noun" },
  ],
  5: [
    { german: "Straße", english: "street", bengali: "রাস্তা", article: "die", partOfSpeech: "noun" },
    {
      german: "Bahnhof",
      english: "train station",
      bengali: "রেল স্টেশন",
      article: "der",
      partOfSpeech: "noun",
    },
    {
      german: "Supermarkt",
      english: "supermarket",
      bengali: "সুপারমার্কেট",
      article: "der",
      partOfSpeech: "noun",
    },
    {
      german: "Restaurant",
      english: "restaurant",
      bengali: "রেস্তোরাঁ",
      article: "das",
      partOfSpeech: "noun",
    },
    { german: "Krankenhaus", english: "hospital", bengali: "হাসপাতাল", article: "das", partOfSpeech: "noun" },
    { german: "links", english: "left", bengali: "বামে", partOfSpeech: "adverb" },
    { german: "rechts", english: "right", bengali: "ডানে", partOfSpeech: "adverb" },
    { german: "geradeaus", english: "straight", bengali: "সোজা", partOfSpeech: "adverb" },
  ],
  6: [
    { german: "Familie", english: "family", bengali: "পরিবার", article: "die", partOfSpeech: "noun" },
    { german: "Vater", english: "father", bengali: "বাবা", article: "der", partOfSpeech: "noun" },
    { german: "Mutter", english: "mother", bengali: "মা", article: "die", partOfSpeech: "noun" },
    { german: "Bruder", english: "brother", bengali: "ভাই", article: "der", partOfSpeech: "noun" },
    { german: "Schwester", english: "sister", bengali: "বোন", article: "die", partOfSpeech: "noun" },
    { german: "Sohn", english: "son", bengali: "ছেলে", article: "der", partOfSpeech: "noun" },
    { german: "Tochter", english: "daughter", bengali: "মেয়ে", article: "die", partOfSpeech: "noun" },
    { german: "groß", english: "tall/big", bengali: "লম্বা/বড়", partOfSpeech: "adjective" },
    { german: "klein", english: "small", bengali: "ছোট", partOfSpeech: "adjective" },
  ],
  7: [
    { german: "Kopf", english: "head", bengali: "মাথা", article: "der", partOfSpeech: "noun" },
    { german: "Auge", english: "eye", bengali: "চোখ", article: "das", partOfSpeech: "noun" },
    { german: "Hand", english: "hand", bengali: "হাত", article: "die", partOfSpeech: "noun" },
    {
      german: "Kopfschmerzen",
      english: "headache",
      bengali: "মাথাব্যথা",
      article: "die",
      partOfSpeech: "noun",
    },
    { german: "Fieber", english: "fever", bengali: "জ্বর", article: "das", partOfSpeech: "noun" },
    {
      german: "Termin",
      english: "appointment",
      bengali: "অ্যাপয়েন্টমেন্ট",
      article: "der",
      partOfSpeech: "noun",
    },
    { german: "Arzt", english: "doctor", bengali: "ডাক্তার", article: "der", partOfSpeech: "noun" },
  ],
  8: [],
};

const exercisesByModule = {
  1: [
    {
      type: "mcq",
      question: { en: "What does 'Hallo' mean?" },
      options: ["Goodbye", "Hello", "Thank you", "Please"],
      correctAnswer: "Hello",
    },
    {
      type: "mcq",
      question: { en: "How do you say 'Good morning'?" },
      options: ["Guten Abend", "Gute Nacht", "Guten Morgen", "Guten Tag"],
      correctAnswer: "Guten Morgen",
    },
    {
      type: "mcq",
      question: { en: "What is 'Danke' in English?" },
      options: ["Please", "Sorry", "Thank you", "Hello"],
      correctAnswer: "Thank you",
    },
    {
      type: "mcq",
      question: { en: "What does 'Auf Wiedersehen' mean?" },
      options: ["Hello", "Good night", "Goodbye", "Good morning"],
      correctAnswer: "Goodbye",
    },
    {
      type: "mcq",
      question: { en: "What number is 'fünf'?" },
      options: ["3", "4", "5", "6"],
      correctAnswer: "5",
    },
  ],
  2: [
    {
      type: "mcq",
      question: { en: "How do you say 'I am...'?" },
      options: ["Du bist", "Ich bin", "Er ist", "Wir sind"],
      correctAnswer: "Ich bin",
    },
    {
      type: "mcq",
      question: { en: "Complete: 'Wie ___ Sie?'" },
      options: ["bin", "ist", "heißen", "kommen"],
      correctAnswer: "heißen",
    },
    {
      type: "mcq",
      question: { en: "'Woher kommen Sie?' means:" },
      options: ["Where do you live?", "Where are you from?", "Where are you going?", "What's your name?"],
      correctAnswer: "Where are you from?",
    },
    {
      type: "mcq",
      question: { en: "'Ich komme aus Bangladesh' means:" },
      options: ["I live in Bangladesh", "I come from Bangladesh", "I go to Bangladesh", "I like Bangladesh"],
      correctAnswer: "I come from Bangladesh",
    },
    {
      type: "mcq",
      question: { en: "What is 'Beruf'?" },
      options: ["Name", "Age", "Profession", "Country"],
      correctAnswer: "Profession",
    },
  ],
  3: [
    {
      type: "mcq",
      question: { en: "What does 'gehen' mean?" },
      options: ["to come", "to go", "to eat", "to sleep"],
      correctAnswer: "to go",
    },
    {
      type: "mcq",
      question: { en: "Where does the verb go in German?" },
      options: ["Position 1", "Position 2", "Last", "Any"],
      correctAnswer: "Position 2",
    },
    {
      type: "mcq",
      question: { en: "What day is 'Montag'?" },
      options: ["Sunday", "Monday", "Tuesday", "Wednesday"],
      correctAnswer: "Monday",
    },
    {
      type: "mcq",
      question: { en: "'Ich lerne Deutsch' means:" },
      options: ["I speak German", "I learn German", "I like German", "I teach German"],
      correctAnswer: "I learn German",
    },
    {
      type: "mcq",
      question: { en: "What does 'arbeiten' mean?" },
      options: ["to work", "to play", "to rest", "to study"],
      correctAnswer: "to work",
    },
  ],
  4: [
    {
      type: "mcq",
      question: { en: "What article does 'Brot' take?" },
      options: ["der", "die", "das", "den"],
      correctAnswer: "das",
    },
    {
      type: "mcq",
      question: { en: "'Ich möchte einen Kaffee' means:" },
      options: ["I have coffee", "I like coffee", "I would like a coffee", "I make coffee"],
      correctAnswer: "I would like a coffee",
    },
    {
      type: "mcq",
      question: { en: "What is 'Wasser'?" },
      options: ["Wine", "Water", "Juice", "Milk"],
      correctAnswer: "Water",
    },
    {
      type: "mcq",
      question: { en: "What article does 'Milch' take?" },
      options: ["der", "die", "das", "den"],
      correctAnswer: "die",
    },
    {
      type: "mcq",
      question: { en: "'Was kostet das?' means:" },
      options: ["What is that?", "How much is that?", "Where is that?", "Who has that?"],
      correctAnswer: "How much is that?",
    },
  ],
  5: [
    {
      type: "mcq",
      question: { en: "What does 'Bahnhof' mean?" },
      options: ["Airport", "Bus stop", "Train station", "Subway"],
      correctAnswer: "Train station",
    },
    {
      type: "mcq",
      question: { en: "'Gehen Sie geradeaus' means:" },
      options: ["Go left", "Go right", "Go straight", "Go back"],
      correctAnswer: "Go straight",
    },
    {
      type: "mcq",
      question: { en: "What is 'links'?" },
      options: ["Right", "Left", "Straight", "Back"],
      correctAnswer: "Left",
    },
    {
      type: "mcq",
      question: { en: "'Ich fahre mit dem Bus' means:" },
      options: ["I drive the bus", "I go by bus", "I see the bus", "I wait for bus"],
      correctAnswer: "I go by bus",
    },
    {
      type: "mcq",
      question: { en: "What does 'Krankenhaus' mean?" },
      options: ["School", "Church", "Hospital", "Hotel"],
      correctAnswer: "Hospital",
    },
  ],
  6: [
    {
      type: "mcq",
      question: { en: "What is 'Mutter'?" },
      options: ["Father", "Mother", "Sister", "Brother"],
      correctAnswer: "Mother",
    },
    {
      type: "mcq",
      question: { en: "'Mein Bruder' means:" },
      options: ["My sister", "My brother", "His brother", "Her brother"],
      correctAnswer: "My brother",
    },
    {
      type: "mcq",
      question: { en: "What does 'Geschwister' mean?" },
      options: ["Parents", "Children", "Siblings", "Grandparents"],
      correctAnswer: "Siblings",
    },
    {
      type: "mcq",
      question: { en: "What is 'his' in German?" },
      options: ["mein", "dein", "sein", "ihr"],
      correctAnswer: "sein",
    },
    {
      type: "mcq",
      question: { en: "'Sie ist groß' means:" },
      options: ["She is small", "She is tall", "She is young", "She is old"],
      correctAnswer: "She is tall",
    },
  ],
  7: [
    {
      type: "mcq",
      question: { en: "What does 'Kopfschmerzen' mean?" },
      options: ["Stomachache", "Headache", "Backache", "Toothache"],
      correctAnswer: "Headache",
    },
    {
      type: "mcq",
      question: { en: "'Ich muss zum Arzt' means:" },
      options: ["I can go to doctor", "I must go to doctor", "I want to go", "I may go"],
      correctAnswer: "I must go to doctor",
    },
    {
      type: "mcq",
      question: { en: "What is 'Termin'?" },
      options: ["Terminal", "Appointment", "Time", "Doctor"],
      correctAnswer: "Appointment",
    },
    {
      type: "mcq",
      question: { en: "'Ich kann Deutsch' means:" },
      options: ["I must speak German", "I can speak German", "I want German", "I learn German"],
      correctAnswer: "I can speak German",
    },
    {
      type: "mcq",
      question: { en: "What body part is 'Auge'?" },
      options: ["Ear", "Nose", "Eye", "Mouth"],
      correctAnswer: "Eye",
    },
  ],
  8: [
    {
      type: "mcq",
      question: { en: "How do you introduce yourself?" },
      options: ["Du heißt...", "Ich heiße...", "Er heißt...", "Sie heißen..."],
      correctAnswer: "Ich heiße...",
    },
    {
      type: "mcq",
      question: { en: "What article does 'Kaffee' take?" },
      options: ["der", "die", "das", "den"],
      correctAnswer: "der",
    },
    {
      type: "mcq",
      question: { en: "Where does verb go in German?" },
      options: ["Position 1", "Position 2", "Position 3", "Last"],
      correctAnswer: "Position 2",
    },
    {
      type: "mcq",
      question: { en: "'Können Sie mir helfen?' means:" },
      options: ["Can you help me?", "Must you help?", "Will you help?", "Do you help?"],
      correctAnswer: "Can you help me?",
    },
    {
      type: "mcq",
      question: { en: "What is 'rechts'?" },
      options: ["Left", "Right", "Straight", "Back"],
      correctAnswer: "Right",
    },
    {
      type: "mcq",
      question: { en: "'Meine Familie' means:" },
      options: ["His family", "Her family", "My family", "Your family"],
      correctAnswer: "My family",
    },
    {
      type: "mcq",
      question: { en: "What number is 'sieben'?" },
      options: ["6", "7", "8", "9"],
      correctAnswer: "7",
    },
    {
      type: "mcq",
      question: { en: "What day is 'Freitag'?" },
      options: ["Thursday", "Friday", "Saturday", "Sunday"],
      correctAnswer: "Friday",
    },
  ],
};

module.exports = { levels, a1Lessons, vocabularyByModule, exercisesByModule };
