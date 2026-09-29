// Text logic with no DOM access, so it runs under `node --test`.
import { diffWords } from "diff";

// A single change, as offsets into the original text.
export type Hunk = { start: number; end: number; replacement: string };

type Segment = { text: string } | { hunk: Hunk; removed: string };

// Groups adjacent removed/added words into hunks so each can be applied on its own.
export function diffSegments(from: string, to: string) {
  const segments: Segment[] = [];
  let pos = 0;
  let current: { hunk: Hunk; removed: string } | null = null;

  for (const part of diffWords(from, to)) {
    if (!part.added && !part.removed) {
      current = null;
      segments.push({ text: part.value });
      pos += part.value.length;
      continue;
    }

    if (!current) {
      current = { hunk: { start: pos, end: pos, replacement: "" }, removed: "" };
      segments.push(current);
    }

    if (part.removed) {
      current.removed += part.value;
      pos += part.value.length;
      current.hunk.end = pos;
    } else {
      current.hunk.replacement += part.value;
    }
  }

  return segments;
}

export const diffHunks = (from: string, to: string) =>
  diffSegments(from, to).flatMap((s) => ("hunk" in s ? [s.hunk] : []));

// Typographic variants of the same character. Editors like Notion turn ' into ’ as you
// type, so suggesting one over the other would loop forever.
const typography = (text: string) =>
  text
    .replace(/[‘’ʼ´`]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[  ]/g, " ")
    .replace(/\s*"\s*/g, '"');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Where dictionary words appear in the text, as whole words and with their exact case.
export const protectedRanges = (text: string, words: string[]) =>
  words.flatMap((word) =>
    [
      ...text.matchAll(
        new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, "gu"),
      ),
    ].map((m) => ({ start: m.index!, end: m.index! + word.length })),
  );

const touches = (hunk: Hunk, ranges: { start: number; end: number }[]) =>
  ranges.some((r) =>
    hunk.start === hunk.end
      ? r.start < hunk.start && hunk.start < r.end
      : hunk.start < r.end && r.start < hunk.end,
  );

// Keeps the user's version where the model changed something it shouldn't have:
// dropped blank lines, which a rich text editor would show as full-width "fixes",
// typographic variants, and words from the user's dictionary.
export const keepUserText = (from: string, to: string, dictionary: string[] = []) => {
  const ranges = protectedRanges(from, dictionary);
  return diffSegments(from, to)
    .map((s) => {
      if ("text" in s) {
        return s.text;
      }
      const changed = s.removed + s.hunk.replacement;
      const onlyLineBreaks = !changed.trim() && changed.includes("\n");
      return onlyLineBreaks ||
        typography(s.removed) === typography(s.hunk.replacement) ||
        touches(s.hunk, ranges)
        ? s.removed
        : s.hunk.replacement;
    })
    .join("");
};

// What the model gets to see: no surrounding blank lines, and nothing from the
// standard "-- " signature delimiter line on (Gmail and most mail clients use it).
export const splitCheckable = (text: string) => {
  const signature = text.search(/^-- ?$/m);
  const end = signature === -1 ? text.length : signature;
  const start = text.length - text.trimStart().length;
  const stop = Math.max(start, text.slice(0, end).trimEnd().length);
  return {
    before: text.slice(0, start),
    core: text.slice(start, stop),
    after: text.slice(stop),
  };
};

// The single word a suggestion is about, if it's about one: that word can go in the dictionary.
export const dictionaryCandidate = (removed: string) => {
  const word = removed.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  return word && !/\s/.test(word) ? word : null;
};
