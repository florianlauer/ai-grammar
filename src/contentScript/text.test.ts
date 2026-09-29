import assert from "node:assert/strict";
import { test } from "node:test";
import {
  diffHunks,
  dictionaryCandidate,
  keepUserText,
  splitCheckable,
} from "./text.ts";

test("keeps dictionary words and still applies other fixes", () => {
  const from = "Sencrop cest top et jai testé";
  const to = "Sencrope c'est top et j'ai testé";
  assert.equal(keepUserText(from, to, ["Sencrop"]), "Sencrop c'est top et j'ai testé");
});

test("dictionary matches whole words with their exact case", () => {
  assert.equal(keepUserText("sencrop va bien", "Sencrop va bien", ["Sencrop"]), "Sencrop va bien");
  assert.equal(keepUserText("Sencropp va bien", "Sencrop va bien", ["Sencrop"]), "Sencrop va bien");
});

test("an insertion inside a dictionary word is refused", () => {
  assert.equal(keepUserText("le repo ai-grammar", "le repo ai-grammmar", ["ai-grammar"]), "le repo ai-grammar");
});

test("typographic variants are not suggestions", () => {
  const from = "c’est “super” pour l’équipe";
  const to = "c'est \"super\" pour l'équipe";
  assert.deepEqual(diffHunks(from, keepUserText(from, to)), []);
});

test("dropped blank lines are not suggestions", () => {
  const from = "salut\n\n\nmerci";
  assert.deepEqual(diffHunks(from, keepUserText(from, "salut\nmerci")), []);
});

test("the signature and surrounding blank lines stay out of the check", () => {
  const { before, core, after } = splitCheckable("\n\nsalut jai recu\n\n\n--\nFlorian\n");
  assert.equal(core, "salut jai recu");
  assert.equal(before + core + after, "\n\nsalut jai recu\n\n\n--\nFlorian\n");
});

test("only a single word can be added to the dictionary", () => {
  assert.equal(dictionaryCandidate(" Sencrop, "), "Sencrop");
  assert.equal(dictionaryCandidate("c'est"), "c'est");
  assert.equal(dictionaryCandidate("tu peut"), null);
  assert.equal(dictionaryCandidate(" "), null);
});
