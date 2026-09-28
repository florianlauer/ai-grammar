// Benchmarks local Ollama models on the grammar-fix task used by the extension.
// Usage: node bench/grammar-bench.mjs model1 model2 ...
const OLLAMA = "http://127.0.0.1:11434";

const prompt = (text) =>
  `Fix the spelling, grammar and punctuation of the text below. Typos may be missing letters, apostrophes or accents: use the surrounding context to recover the intended word. Keep the original language, meaning, tone and technical terms; change as little as possible. If the text is already correct, return it unchanged.\n\nText:\n${text}`;

const schema = {
  type: "object",
  properties: { correctedText: { type: "string" } },
  required: ["correctedText"],
};

// must: every regex has to match; mustNot: none may match (meaning changes, translated jargon...)
const basicCases = [
  { text: "jecris un grand texte mais j'ai pas mal la flemme de fair des effort", must: [/^J['’]écris/, /pas mal la flemme/, /faire des efforts/], mustNot: [/vraiment/, /n['’]ai pas/] },
  { text: "je sais pas si tu a recu mon mail d'hier, je te le renvoi", must: [/tu as reçu/, /renvoie/] },
  { text: "on c'est vu hier soir et on a parler du projet", must: [/s['’]est vus?/, /a parlé/] },
  { text: "il faut que tu vien demain a la reunion", must: [/viennes/, /à la réunion/] },
  { text: "les resultats que j'ai obtenu sont meilleur que prevu", must: [/obtenus/, /meilleurs/, /prévu/] },
  { text: "Je pense quil faudrait deployer la nouvelle version avant vendredi", must: [/qu['’]il/, /déployer/, /vendredi/] },
  { text: "ces vrai que sa marche mieux maintenant", must: [/^C['’]est vrai/, /ça marche/] },
  { text: "Merci pour ton aide, sa ma vraiment aidé a avancé", must: [/ça m['’]a/, /à avancer/] },
  { text: "Le déploiement est prévu pour jeudi prochain.", exact: "Le déploiement est prévu pour jeudi prochain." },
  { text: "jai push la PR sur github, tu peut la review quand tu a le temps", must: [/^J['’]ai push/, /tu peux/, /tu as le temps/, /\bPR\b/, /review/], mustNot: [/pouss|examin|révis|relire/] },
  { text: "je vais au suppermarché achter du pain", must: [/supermarché/, /acheter/] },
  { text: "I has went to the store yesterday and buyed some apple", must: [/I went/, /bought/, /apples/] },
  { text: "Could you plese send me the reprot before tomorow?", must: [/please/, /report/, /tomorrow/] },
  { text: "The meeting is scheduled for next Thursday.", exact: "The meeting is scheduled for next Thursday." },
];

// Longer messages typed quickly: no accents, agreement errors, homophones, typos.
const handwrittenCases = [
  { text: "salut, jai bien recu ton messsage. je regarde sa demain matin et je te fait un retour dans la journee", must: [/[Jj]['’]ai bien reçu/, /\bmessage\b/, /regarde ça/, /je te fais un retour/, /journée/] },
  { text: "les fichiers que tu ma envoyer sont corrompu, tu peut me les renvoyer stp ?", must: [/tu m['’]as envoyés/, /corrompus/, /tu peux/, /stp|s['’]il te plaît/] },
  { text: "On a decider de repousser la mise en prod a jeudi, les test ne sont pas encore tout a fait fini.", must: [/On a décidé/, /mise en prod/, /à jeudi/, /les tests/, /tout à fait (finis|terminés)/] },
  { text: "je suis passer chez le medecin ce matin, il ma dit que ce netait rien de grave", must: [/suis passée?/, /médecin/, /il m['’]a dit/, /n['’]était rien/] },
  { text: "Est ce que quelqun a deja eu ce probleme avec le build ? sa plante a chaque fois que je lance les tests unitaire", must: [/Est-ce que/, /quelqu['’]un/, /déjà/, /problème/, /build/, /ça plante/, /à chaque fois/, /tests unitaires/] },
  { text: "Merci a tous pour vos retour, jai integrer la plupart des remarques et la nouvelle version est disponnible sur le drive", must: [/Merci à tous/, /vos retours/, /j['’]ai intégré/, /disponible/, /drive/i] },
  { text: "Je pense qu'il faudrais qu'on se voit la semaine prochaine pour en discutter, quesque tu en pense ?", must: [/faudrait/, /se voie/, /discuter/, /qu['’]est-ce que tu en penses|qu['’]en penses-tu/] },
  { text: "ma soeur et moi somme aller au cinema hier soir, le film etait vraimment bien mais un peu trop long", must: [/[Ss](œ|oe)ur/, /sommes allée?s/, /cinéma/, /était vraiment bien/, /trop long/] },
  { text: "Tu peut regarder la PR quand tu as 5 min ? j'ai refacto le composant et rajouter des test", must: [/Tu peux/, /\bPR\b/, /5 min/, /j['’]ai refacto/, /rajouté des tests/], mustNot: [/pull request|refactoris|examiner|poussé/i] },
  { text: "Les enfants on adorer la sortie au parc, ils etait tous tres contant de retrouver leur copains", must: [/Les enfants ont adoré/, /ils étaient tous très contents/, /leurs copains/] },
];

const cases = process.env.CASES === "handwritten" ? handwrittenCases : basicCases;

const generate = async (model, text, think) => {
  const body = { model, prompt: prompt(text), format: schema, stream: false, options: { temperature: 0 } };
  if (think !== undefined) body.think = think;
  const res = await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify(body) });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
};

// markdown would end up verbatim in the input
const globalMustNot = [/\*\*/];

const check = (c, out) => {
  const o = out.trim();
  if (c.exact) return { total: 1, errors: o === c.exact ? [] : ["changed a correct text"] };
  const mustNot = [...(c.mustNot ?? []), ...globalMustNot];
  // sentence-initial capitals are fine, so match case-insensitively
  const ci = (r) => new RegExp(r.source, r.flags.replace("i", "") + "i");
  return {
    total: c.must.length + mustNot.length,
    errors: [
      ...c.must.filter((r) => !ci(r).test(o)).map((r) => `missing ${r}`),
      ...mustNot.filter((r) => r.test(o)).map((r) => `forbidden ${r}`),
    ],
  };
};

const results = [];
for (const model of process.argv.slice(2)) {
  // thinking models are too slow for as-you-type checks; not every model accepts the flag
  let think = false;
  try {
    await generate(model, cases[0].text, think); // warm-up, loads the model
  } catch (e) {
    if (!/think/i.test(e.message)) throw e;
    think = undefined;
    await generate(model, cases[0].text, think);
  }

  let passed = 0;
  let checks = 0;
  let checksOk = 0;
  const times = [];
  const failures = [];
  for (const c of cases) {
    const t = performance.now();
    let out;
    try {
      out = JSON.parse((await generate(model, c.text, think)).response).correctedText;
    } catch (e) {
      out = `<error: ${e.message}>`;
    }
    const ms = performance.now() - t;
    times.push(ms);
    const { total, errors } = check(c, out);
    checks += total;
    checksOk += total - errors.length;
    (c.outputs ??= []).push({ model, out, errors, ms });
    if (errors.length === 0) passed++;
    else failures.push(`  ✗ ${c.text}\n    → ${out}\n    (${errors.join(", ")})`);
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)] / 1000;
  const fixRate = Math.round((100 * checksOk) / checks);
  results.push({ model, passed, fixRate, median });
  console.log(`\n## ${model}: ${passed}/${cases.length}, ${fixRate}% checks, median ${median.toFixed(2)}s`);
  console.log(failures.join("\n"));

  // free memory before the next model
  await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify({ model, keep_alive: 0 }) });
}

const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const summary = [
  "| Model | Fully fixed | Checks passed | Median latency |",
  "|---|---|---|---|",
  ...results
    .sort((a, b) => b.fixRate - a.fixRate || a.median - b.median)
    .map((r) => `| ${r.model} | ${r.passed}/${cases.length} | ${r.fixRate}% | ${r.median.toFixed(2)}s |`),
];
console.log("\n" + summary.join("\n"));

// full per-input detail: every model's output, not just failures
const set = process.env.CASES ?? "basic";
const detail = cases.map((c, i) => [
  `### ${i + 1}. \`${cell(c.text)}\``,
  "",
  "| Model | Output | Result |",
  "|---|---|---|",
  ...c.outputs.map(
    (o) => `| ${o.model} | ${cell(o.out)} | ${o.errors.length ? "✗ " + cell(o.errors.join(", ")) : "✓"} |`,
  ),
  "",
]);
const reportPath = new URL(`report-${set}.md`, import.meta.url);
const { writeFileSync } = await import("node:fs");
writeFileSync(reportPath, [`# Grammar benchmark: ${set}`, "", ...summary, "", ...detail.flat()].join("\n"));
console.log(`\nReport: ${reportPath.pathname}`);
