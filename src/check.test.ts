import assert from "node:assert/strict";
import { test } from "node:test";
import { check, formality, rewrite, type Generate } from "./check.ts";
import { defaultSettings } from "./settings.ts";

// Answers every request with `answer`, and records what was asked.
const fake = (answer: unknown) => {
  const requests: Parameters<Generate>[0][] = [];
  const generate: Generate = async (request) => {
    requests.push(request);
    return answer;
  };
  return { generate, requests };
};

test("check doesn't ask the model about a single word", async () => {
  const { generate, requests } = fake({ correctedText: "Bonjour" });
  assert.equal(await check({ text: "  bonjor\n", settings: defaultSettings, generate }), null);
  assert.equal(requests.length, 0);
});

test("check sends only the core and puts the blank lines and signature back", async () => {
  const { generate, requests } = fake({ correctedText: "Je vais bien, merci. " });
  const text = "\nje vais bien merci\n\n-- \nFlorian";
  assert.equal(await check({ text, settings: defaultSettings, generate }), "\nJe vais bien, merci.\n\n-- \nFlorian");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].channel, "check");
  assert.equal(requests[0].model, defaultSettings.model);
  assert.ok(!requests[0].prompt.includes("Florian"));
});

test("check keeps dictionary words the model changed", async () => {
  const { generate } = fake({ correctedText: "Sencrope c'est top" });
  const settings = { ...defaultSettings, dictionary: ["Sencrop"] };
  assert.equal(await check({ text: "Sencrop cest top", settings, generate }), "Sencrop c'est top");
});

test("check fails on an answer without the corrected text", async () => {
  const { generate } = fake({ text: "oops" });
  await assert.rejects(check({ text: "je vais bien", settings: defaultSettings, generate }));
});

test("rewrite drops variants that lose a number, and duplicates", async () => {
  const { generate, requests } = fake({
    variants: ["Send it before the 15th.", "Send it soon.", "Send it before the 15th."],
  });
  const result = await rewrite({ text: "Please send it before the 15th.", tone: "clearer", settings: defaultSettings, generate });
  assert.deepEqual(result, { variants: ["Send it before the 15th."], notes: [] });
  assert.equal(requests[0].channel, "rewrite");
});

test("rewrite of part of a sentence fits the variants back in it", async () => {
  const { generate, requests } = fake({ variants: ["Would you look at it."] });
  const field = { text: "Thanks, could you maybe have a look at it, then send it back?", start: 8 };
  const result = await rewrite({ text: "could you maybe have a look at it", tone: "clearer", settings: defaultSettings, field, generate });
  // the words after it carry the punctuation
  assert.deepEqual(result.variants, ["would you look at it"]);
  assert.match(requests[0].prompt, /After: , then send it back\?/);
});

test("formality reads the level on the meter channel", async () => {
  const { generate, requests } = fake({ formality: 4 });
  assert.equal(await formality({ text: "  Dear Sir,  ", settings: defaultSettings, generate }), 4);
  assert.equal(requests[0].channel, "meter");
  await assert.rejects(formality({ text: "hey", settings: defaultSettings, generate: fake({ formality: 9 }).generate }));
});
