// Benchmarks local Ollama models on the rewrite task, graded by the same checks the
// extension runs before it shows a variant (src/contentScript/text.ts).
// Usage: node bench/rewrite-bench.mjs model1 model2 ...
import { writeFileSync } from "node:fs";
import { fitFragment, isFragment, rejectVariant, sentenceAround } from "../src/contentScript/text.ts";
import { rewritePrompt, rewriteSchema } from "../src/prompts.ts";
import { defaultSettings } from "../src/settings.ts";

const OLLAMA = "http://127.0.0.1:11434";

// text: the whole field. part: what gets rewritten, the whole text when absent.
const cases = [
  { text: "Je pense qu'il faudrait qu'on se voie la semaine prochaine pour en discuter parce que sinon on va encore perdre du temps sur des sujets qui ont déjà été tranchés la dernière fois et ça commence à faire beaucoup de réunions pour pas grand chose au final." },
  { text: "Could you please let me know if you have had the chance to look at the document I sent you last Tuesday because we need to send it to the client before the 15th." },
  { text: "On a déployé la v2.3 sur https://app.sencrop.com hier soir et depuis Paul a remarqué que les alertes arrivent avec 10 minutes de retard." },
  { text: "I wanted to ask you if maybe it would be possible for you to send me the report when you have some time." },
  { text: "Suite à notre échange de ce matin, je vous confirme que la livraison des 250 capteurs est prévue le 3 octobre à Lyon, sous réserve de validation du bon de commande par Marie." },
  { text: "Thanks for the update, I will have a look at it tomorrow morning and get back to you with my comments before the end of the day." },
  { text: "Merci pour ton retour. Je voulais te demander si jamais tu avais le temps de regarder le document que je t'ai envoyé mardi.", part: "voulais te demander si jamais tu avais le temps de regarder" },
  { text: "I think it would be really good if we could maybe try to ship the release on Friday.", part: "it would be really good if we could maybe try to" },
  { text: "Le build plante à chaque fois que je lance les tests unitaires sur la branche feature/login, du coup je ne peux pas merger la PR.", part: "Le build plante à chaque fois que je lance les tests unitaires sur la branche feature/login" },
  { text: "We should probably schedule a call with Anna and the team next week to go over the Q3 numbers.", part: "schedule a call with Anna and the team next week" },
];

const generate = async (model, prompt) => {
  const body = { model, prompt, format: rewriteSchema, stream: false, think: false, options: { temperature: 0 } };
  const res = await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify(body) });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return JSON.parse(json.response).variants;
};

// Same path as the extension: the sentence around a part, the fragment fixes, then the checks.
const rewrite = async (model, { text, part = text }) => {
  const start = text.indexOf(part);
  const context = sentenceAround(text, start, start + part.length);
  const fragment = isFragment(context);
  const raw = await generate(model, rewritePrompt(part, defaultSettings, fragment ? context : null));
  return raw.map((v) => {
    const out = fragment ? fitFragment(v, { part, ...context }) : v.trim();
    return { out, rejected: rejectVariant(part, out) };
  });
};

const results = [];
for (const model of process.argv.slice(2)) {
  await rewrite(model, cases[0]); // warm-up, loads the model

  let usable = 0;
  let kept = 0;
  let total = 0;
  const times = [];
  for (const c of cases) {
    const t = performance.now();
    let variants;
    try {
      variants = await rewrite(model, c);
    } catch (e) {
      variants = [{ out: `<error: ${e.message}>`, rejected: "error" }];
    }
    times.push(performance.now() - t);
    const ok = variants.filter((v) => !v.rejected).length;
    total += variants.length;
    kept += ok;
    if (ok > 0) usable++;
    (c.outputs ??= []).push({ model, variants, ms: times.at(-1) });
  }

  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)] / 1000;
  results.push({ model, usable, kept, total, median });
  console.log(`## ${model}: ${usable}/${cases.length} usable, ${kept}/${total} variants kept, median ${median.toFixed(2)}s`);

  // free memory before the next model
  await fetch(`${OLLAMA}/api/generate`, { method: "POST", body: JSON.stringify({ model, keep_alive: 0 }) });
}

const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const summary = [
  "| Model | Cases with a variant shown | Variants kept | Median latency |",
  "|---|---|---|---|",
  ...results
    .sort((a, b) => b.usable - a.usable || b.kept - a.kept || a.median - b.median)
    .map((r) => `| ${r.model} | ${r.usable}/${cases.length} | ${r.kept}/${r.total} | ${r.median.toFixed(2)}s |`),
];
console.log("\n" + summary.join("\n"));

const detail = cases.map((c, i) => [
  `### ${i + 1}. \`${cell(c.part ?? c.text)}\``,
  ...(c.part ? ["", `In: ${cell(c.text)}`] : []),
  "",
  "| Model | Variant | Result |",
  "|---|---|---|",
  ...c.outputs.flatMap((o) =>
    o.variants.map((v) => `| ${o.model} | ${cell(v.out)} | ${v.rejected ? "✗ " + cell(v.rejected) : "✓"} |`),
  ),
  "",
]);
const reportPath = new URL("report-rewrite.md", import.meta.url);
writeFileSync(reportPath, ["# Rewrite benchmark", "", ...summary, "", ...detail.flat()].join("\n"));
console.log(`\nReport: ${reportPath.pathname}`);
