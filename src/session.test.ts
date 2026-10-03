import assert from "node:assert/strict";
import { test } from "node:test";
import type { Generate } from "./check.ts";
import { CheckSession } from "./session.ts";
import { defaultSettings, type Settings } from "./settings.ts";

// A model whose answers the test releases one by one, in any order.
const model = () => {
  const pending: { prompt: string; answer: (correctedText: string) => void; fail: (e: Error) => void }[] = [];
  const generate: Generate = ({ prompt }) =>
    new Promise((resolve, reject) =>
      pending.push({ prompt, answer: (correctedText) => resolve({ correctedText }), fail: reject }),
    );
  return { generate, pending };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

const session = (generate: Generate | null, settings: Settings = defaultSettings) => {
  const states: string[] = [];
  const s = new CheckSession({ generate, settings: () => settings, pause: 0, onChange: () => states.push(s.state.type) });
  return { s, states };
};

test("a single word isn't checked", async () => {
  const { generate, pending } = model();
  const { s } = session(generate);
  s.edit("bonjor");
  await settle();
  assert.equal(s.state.type, "empty");
  assert.equal(pending.length, 0);
});

test("a check goes from loading to its fixes", async () => {
  const { generate, pending } = model();
  const { s, states } = session(generate);
  s.edit("je vais bien merci");
  await settle();
  pending[0].answer("Je vais bien, merci.");
  await settle();
  assert.deepEqual(states, ["loading", "done"]);
  assert.equal(s.result, "Je vais bien, merci.");
  assert.ok(s.hunks.length > 0);
});

test("an answer to an older text is dropped", async () => {
  const { generate, pending } = model();
  const { s } = session(generate);
  s.edit("je vais bien");
  await settle();
  s.edit("je vais bien merci");
  await settle();
  // the newer answer arrives first, the older one after
  pending[1].answer("Je vais bien, merci.");
  await settle();
  pending[0].answer("Je vais bien.");
  await settle();
  assert.equal(s.result, "Je vais bien, merci.");
});

test("an edit during the typing pause doesn't ask the model about the old text", async () => {
  const { generate, pending } = model();
  const s = new CheckSession({ generate, settings: () => defaultSettings, pause: 20, onChange: () => {} });
  s.edit("je vais bien");
  s.edit("je vais bien merci");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(pending.length, 1);
  assert.match(pending[0].prompt, /je vais bien merci$/);
});

test("a fix of ours keeps the other fixes without a new check", async () => {
  const { generate, pending } = model();
  const { s } = session(generate);
  s.edit("jai vu sa hier");
  await settle();
  pending[0].answer("J'ai vu ça hier");
  await settle();
  assert.equal(s.hunks.length, 2);
  const [first] = s.hunks;
  s.edit(s.text.slice(0, first.start) + first.replacement + s.text.slice(first.end), { keep: true });
  await settle();
  assert.equal(pending.length, 1);
  assert.equal(s.hunks.length, 1);
});

test("a word added to the dictionary drops its fix without a new check", async () => {
  const { generate, pending } = model();
  const settings = { ...defaultSettings };
  const { s } = session(generate, settings);
  s.edit("Sencrop cest top");
  await settle();
  pending[0].answer("Sencrope c'est top");
  await settle();
  assert.equal(s.hunks.length, 2);
  settings.dictionary = ["Sencrop"];
  s.refresh();
  assert.equal(s.hunks.length, 1);
  assert.equal(pending.length, 1);
});

test("a failed check is an error, unless a newer text superseded it", async () => {
  const { generate, pending } = model();
  const { s } = session(generate);
  s.edit("je vais bien");
  await settle();
  s.edit("je vais bien merci");
  await settle();
  pending[0].fail(new Error("aborted"));
  await settle();
  assert.equal(s.state.type, "loading");
  pending[1].fail(new Error("model not found"));
  await settle();
  assert.equal(s.state.type, "error");
});

test("without a model, every text is an error at once and nothing is offered for rewrite", () => {
  const { s } = session(null);
  s.edit("word ".repeat(40));
  assert.equal(s.state.type, "error");
  assert.deepEqual(s.long, []);
});

test("long sentences are offsets into the whole text, signature left out", () => {
  const { s } = session(model().generate);
  const sentence = "word ".repeat(31).trim() + ".";
  s.edit(`\n\n${sentence}\n-- \n${sentence}`);
  assert.deepEqual(s.long, [{ start: 2, end: 2 + sentence.length }]);
  s.stop();
});
