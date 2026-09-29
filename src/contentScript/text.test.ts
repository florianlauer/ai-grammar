import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changeOf,
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

test("an ignored change is kept out, everywhere it appears", () => {
  const from = "la review est faite, merci pour la review.";
  const to = "la révision est faite, merci pour la révision.";
  const ignored = [{ from: "review", to: "révision" }];
  assert.equal(keepUserText(from, to, [], ignored), from);
});

test("ignoring a change leaves the other fixes", () => {
  const from = "tu peut faire la review";
  const to = "tu peux faire la révision";
  assert.equal(keepUserText(from, to, [], [{ from: "review", to: "révision" }]), "tu peux faire la review");
});

test("an ignored insertion is tied to the word it follows", () => {
  const from = "merci bonne journée et merci encore";
  const [hunk] = diffHunks(from, "merci, bonne journée et merci encore");
  const change = changeOf(from, hunk);
  assert.deepEqual(change, { from: "merci", to: "merci," });
  // the same word elsewhere is ignored too, a comma after another word is not
  assert.equal(
    keepUserText("merci bonne journée, oui bien", "merci, bonne journée, oui, bien", [], [change]),
    "merci bonne journée, oui, bien",
  );
});
