import assert from "node:assert/strict";
import { test } from "node:test";
import { findFalseFriends } from "./falseFriends.ts";

const notes = (text: string) => findFalseFriends(text).notes;

test("finds French false friends in English", () => {
  const found = notes(
    "Actually I am working on it since 2 weeks. I assisted to the meeting, can you precise the date?",
  );
  assert.equal(found.length, 4);
  assert.equal(notes("I will send you the planning for next week.").length, 1);
  assert.equal(notes("I will send you the planning eventually.").length, 2);
  assert.match(found[0], /currently/);
  assert.match(found.join(" "), /attend/);
  assert.match(found.join(" "), /for 2 weeks/);
  assert.match(found.join(" "), /specify/);
});

test("leaves correct English alone", () => {
  const text =
    "I have worked here since 2019. Please prevent them from leaving. The planning phase starts Monday. Thanks for the information and your feedback.";
  assert.deepEqual(notes(text), []);
  assert.deepEqual(notes("I've been here since 2 weeks ago."), []);
});

test("catches the common variants", () => {
  assert.equal(notes("I work on it since a week").length, 1);
  assert.equal(notes("I'm here since four months").length, 1);
  assert.equal(notes("I’m agree with you").length, 1);
  assert.equal(notes("He sent their planning").length, 1);
  assert.equal(notes("Thanks for the informations and the advices").length, 2);
});

test("plural-only words get their singular", () => {
  assert.deepEqual(notes("Thanks for the informations"), [
    `"informations" has no plural in English: write "information".`,
  ]);
});

test("the false friends give the writer's language away", () => {
  assert.equal(findFalseFriends("I am agree").language, "French");
  assert.deepEqual(findFalseFriends("Thanks, I agree with you."), { language: null, notes: [] });
});
