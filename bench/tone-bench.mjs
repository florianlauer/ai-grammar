// Benchmarks local Ollama models on the tone features: the formality meter against labelled
// texts, and each tone preset against what it should change, after the extension's checks.
// Usage: node bench/tone-bench.mjs model1 model2 ...
import { writeFileSync } from "node:fs";
import { formality as meter, rewrite } from "../src/check.ts";
import { wordCount } from "../src/contentScript/text.ts";
import { findFalseFriends } from "../src/falseFriends.ts";
import { defaultSettings } from "../src/settings.ts";

const OLLAMA = "http://127.0.0.1:11434";

// [expected formality from 1 to 5, text]
const labelled = [
  [1, "yo t'es chaud pour un kebab ce soir ou quoi"],
  [1, "lol ok np, ttyl"],
  [2, "salut, tu peux me renvoyer le doc stp ?"],
  [2, "hey, can you send me the file when you get a sec?"],
  [3, "Bonjour, pouvez-vous me renvoyer le document ? Merci."],
  [3, "Hi Paul, could you send me the report before Friday? Thanks."],
  [3, "The meeting is scheduled for next Thursday."],
  [3, "Le déploiement est prévu pour jeudi prochain."],
  [4, "Bonjour Madame, pourriez-vous me transmettre le document avant vendredi ? Je vous remercie par avance."],
  [4, "Dear Mr. Smith, could you please send me the signed contract at your earliest convenience?"],
  [5, "Madame la Directrice, je vous prie d'agréer l'expression de mes salutations distinguées."],
  [5, "We hereby acknowledge receipt of your correspondence dated 3 October and shall respond in due course."],
];

const texts = [
  "salut, je voulais juste savoir si par hasard tu aurais peut-être le temps de regarder mon doc avant jeudi, pas de souci sinon",
  "hey, I just wanted to maybe check if you think it could be possible to move our call to Friday at 3pm?",
  "Je pense qu'on pourrait peut-être essayer de livrer la version 2.4 vendredi, si Paul est d'accord.",
  "I think we should probably just go with the second option, it seems a bit cheaper maybe.",
];

// English written by French speakers, for "More natural"
const naturalTexts = [
  "Actually I am working on this project since 2 weeks, I will send you the planning eventually.",
  "Can you precise the deadline? I have an appointment with the client to discuss about the contract.",
  "I assisted to the conference last week and it was very interesting, the speakers were very sympathic.",
  "Thanks for all the informations, I will prevent you when the formation is ready.",
];
const falseFriends = (t) => findFalseFriends(t).notes.length;

// Correct English that the list flags anyway: [text, the word a French sense would bring in]
const correctTexts = [
  ["Actually, I disagree with the proposal, the old design was faster.", /\bcurrently\b/i],
  ["That is a sensible approach, let's go with it.", /\bsensitive\b/i],
  ["I passed the exam last year, so I can start the job in June.", /\btook\b/i],
  ["The fix worked eventually, after months of testing.", /\b(?:possibly|if needed)\b/i],
];

const hedges = /\b(I think|maybe|probably|just|perhaps|seems?|peut-être|je pense|juste|par hasard|il me semble)\b/gi;
const hedgeCount = (t) => t.match(hedges)?.length ?? 0;

// src/check.ts's Generate, over HTTP
const generate = async ({ model, prompt, schema }) => {
  const body = { model, prompt, format: schema, stream: false, think: false, options: { temperature: 0 } };
  const res = await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify(body) });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return JSON.parse(json.response);
};

const settingsFor = (model) => ({ ...defaultSettings, model });
const formality = (model, text) => meter({ text, settings: settingsFor(model), generate });

// What each preset has to change for a kept variant to count, beyond the extension's checks.
const goals = {
  formal: { what: "sounds more formal", test: async (model, v, t) => (await formality(model, v)) > (await formality(model, t)) },
  friendly: { what: "passes the checks", test: async () => true },
  confident: { what: "fewer hedges", test: async (_, v, t) => hedgeCount(v) < hedgeCount(t) },
  shorter: { what: "fewer words", test: async (_, v, t) => wordCount(v) < wordCount(t) },
  natural: { what: "fewer false friends", test: async (_, v, t) => falseFriends(v) < falseFriends(t) },
  // same preset on correct English: the hints must not change the meaning
  "natural, correct": {
    tone: "natural",
    texts: correctTexts.map(([text]) => text),
    what: "keeps the English sense",
    test: async (_, v, t) => !correctTexts.find(([text]) => text === t)[1].test(v),
  },
};

const results = [];
const detail = [];
for (const model of process.argv.slice(2)) {
  await formality(model, texts[0]); // warm-up, loads the model

  let exact = 0;
  let near = 0;
  const meterTimes = [];
  for (const [want, text] of labelled) {
    const t = performance.now();
    const got = await formality(model, text);
    meterTimes.push(performance.now() - t);
    if (got === want) exact++;
    if (Math.abs(got - want) <= 1) near++;
    detail.push([model, "meter", text, want, got]);
  }

  const presets = {};
  for (const [name, goal] of Object.entries(goals)) {
    const tone = goal.tone ?? name;
    let kept = 0;
    let reached = 0;
    for (const text of goal.texts ?? (tone === "natural" ? naturalTexts : texts)) {
      // the variants the card would show
      const { variants } = await rewrite({ text, tone, settings: settingsFor(model), generate });
      for (const v of variants) {
        kept++;
        const ok = await goal.test(model, v, text);
        if (ok) reached++;
        detail.push([model, name, v, goal.what, ok ? "✓" : "✗"]);
      }
    }
    presets[name] = { kept, reached };
  }

  meterTimes.sort((a, b) => a - b);
  const median = meterTimes[Math.floor(meterTimes.length / 2)] / 1000;
  results.push({ model, exact, near, median, presets });
  console.log(`## ${model}: meter ${exact}/${labelled.length} exact, ${near}/${labelled.length} within one, median ${median.toFixed(2)}s`);
  for (const [tone, p] of Object.entries(presets)) console.log(`  ${tone}: ${p.reached}/${p.kept} kept variants ${goals[tone].what}`);

  // free memory before the next model
  await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify({ model, keep_alive: 0 }) });
}

const tones = Object.keys(goals);
const summary = [
  `| Model | Meter exact | Meter within one | Meter latency | ${tones.join(" | ")} |`,
  `|---|---|---|---|${tones.map(() => "---").join("|")}|`,
  ...results.map(
    (r) =>
      `| ${r.model} | ${r.exact}/${labelled.length} | ${r.near}/${labelled.length} | ${r.median.toFixed(2)}s | ${tones
        .map((t) => `${r.presets[t].reached}/${r.presets[t].kept}`)
        .join(" | ")} |`,
  ),
];
console.log("\n" + summary.join("\n"));

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const reportPath = new URL("report-tone.md", import.meta.url);
writeFileSync(
  reportPath,
  [
    "# Tone benchmark",
    "",
    "Presets: kept variants that reach the preset's goal, out of the variants that passed the extension's checks.",
    "",
    ...summary,
    "",
    "| Model | Set | Text or variant | Expected | Result |",
    "|---|---|---|---|---|",
    ...detail.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n"),
);
console.log(`\nReport: ${reportPath.pathname}`);
