// English words that native speakers of another language often use in that language's sense.
// A curated list, because gemma4 asked to find them missed "eventually" and "assisted to",
// and returned pairs like "actually" → "actually". Only French for now.
// ponytail: one language; add a list per language when someone needs it.

type FalseFriend = { pattern: RegExp; note: (word: string) => string };

const french: FalseFriend[] = [
  {
    pattern: /\bactually\b/i,
    note: () => `"actually" means "in fact". For "actuellement", write "currently".`,
  },
  {
    pattern: /\beventually\b/i,
    note: () => `"eventually" means "in the end". For "éventuellement", write "possibly" or "if needed".`,
  },
  {
    pattern: /\bassist(?:s|ed|ing)? (?:to|at)\b/i,
    note: () => `"assist" means "help". For "assister à", write "attend".`,
  },
  {
    pattern: /\bprecise (?:the|me|it|your|my|our|this|that|if|whether|when)\b/i,
    note: () => `"precise" is an adjective. For "préciser", write "specify" or "clarify".`,
  },
  {
    // on its own, not "the planning phase"
    pattern:
      /\b(?:the|a|my|your|his|her|their|our|this) planning\b(?!\s+(?:phase|stage|process|meeting|session|team|tools?|permission|application|committee|department|period|board|cycle)\b)/i,
    note: () => `"planning" is the activity. For "le planning", write "the schedule".`,
  },
  {
    pattern: /\bsympat?h?ic\b/i,
    note: () => `"sympathic" isn't English. For "sympathique", write "nice" or "friendly".`,
  },
  {
    pattern: /\bdiscuss(?:ed|es|ing)? about\b/i,
    note: () => `"discuss" takes no "about": write "discuss it" or "talk about it".`,
  },
  {
    // not "since 2 weeks ago", which is right
    pattern:
      /\bsince (?:\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|a few|several) (?:minutes?|hours?|days?|weeks?|months?|years?)\b(?!\s+ago)/i,
    note: () => `For a length of time, English uses "for": "for 2 weeks", not "since 2 weeks".`,
  },
  {
    pattern: /\b(?:a|the|this|my|our) formation\b/i,
    note: () => `"formation" means a shape or a group. For "une formation", write "a training course".`,
  },
  {
    pattern: /\bdeceptions?\b/i,
    note: () => `"deception" means lying. For "déception", write "disappointment".`,
  },
  {
    pattern: /\bprevent(?:s|ed|ing)? (?:you|him|her|them|me|us)\b(?!\s+from)/i,
    note: () => `"prevent" means "stop". For "prévenir quelqu'un", write "let you know" or "warn you".`,
  },
  {
    pattern: /\bdemand(?:s|ed|ing)? (?:you|him|her|them|if|whether)\b/i,
    note: () => `"demand" sounds like an order. For "demander", write "ask".`,
  },
  {
    pattern: /\b(?:the|an) occasion to\b/i,
    note: () => `For "l'occasion de", write "the chance to" or "the opportunity to".`,
  },
  {
    pattern: /\b(?:my|your|his|her|their|our) coordinates\b/i,
    note: () => `"coordinates" are for maps. For "coordonnées", write "contact details".`,
  },
  {
    pattern: /\b(?:informations|advices|feedbacks)\b/gi,
    note: (word) => `"${word}" has no plural in English: write "${word.slice(0, -1)}".`,
  },
  {
    pattern: /\bsensible\b/i,
    note: () => `"sensible" means "reasonable". For "sensible" in French, write "sensitive".`,
  },
  {
    pattern: /\bpass(?:ed|ing)? (?:an?|the|my|your) (?:exam|test)\b/i,
    note: () => `"pass an exam" means succeeding. For "passer un examen", write "take an exam".`,
  },
  {
    pattern: /\bI(?:['’]m| am) agree\b/i,
    note: () => `"agree" is a verb: write "I agree", not "I am agree".`,
  },
];

const lists = [{ language: "French", entries: french }];

// The false friends in an English text, and the language they give away. The text is the only
// clue to the writer's language: a French speaker may well run their browser in English.
export const findFalseFriends = (text: string) => {
  for (const { language, entries } of lists) {
    const notes = [
      // a /g pattern returns every match, so "informations and advices" gets a note each
      ...new Set(entries.flatMap(({ pattern, note }) => (text.match(pattern) ?? []).map(note))),
    ];
    if (notes.length) {
      return { language, notes };
    }
  }
  return { language: null, notes: [] };
};
