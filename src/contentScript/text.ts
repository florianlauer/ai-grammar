// Text logic with no DOM access, so it runs under `node --test`.
import { diffWords } from "diff";
import type { Change } from "../settings";

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

// A hunk widened to the whole word around it, so ignoring "add a comma after merci"
// doesn't ignore every comma.
export const changeOf = (text: string, { start, end, replacement }: Hunk): Change => {
  let s = start;
  let e = end;
  // letters and digits only, so "review." and "review," are the same change as "review"
  const inWord = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);
  // an insertion takes the word it touches; a change only grows into a word it cuts, so
  // deleting "the " before "cat" isn't stored as a change of "cat"
  const insertion = start === end;
  if (insertion || inWord(text[s])) while (inWord(text[s - 1])) s--;
  if (insertion || inWord(text[e - 1])) while (inWord(text[e])) e++;
  return {
    from: text.slice(s, e),
    to: text.slice(s, start) + replacement + text.slice(end, e),
  };
};

// Keeps the user's version where the model changed something it shouldn't have:
// dropped blank lines, which a rich text editor would show as full-width "fixes",
// typographic variants, words from the user's dictionary, and changes they ignored.
export const keepUserText = (
  from: string,
  to: string,
  dictionary: string[] = [],
  ignored: Change[] = [],
) => {
  const ranges = protectedRanges(from, dictionary);
  const isIgnored = (hunk: Hunk) => {
    const change = changeOf(from, hunk);
    return ignored.some((c) => c.from === change.from && c.to === change.to);
  };
  return diffSegments(from, to)
    .map((s) => {
      if ("text" in s) {
        return s.text;
      }
      const changed = s.removed + s.hunk.replacement;
      const onlyLineBreaks = !changed.trim() && changed.includes("\n");
      return onlyLineBreaks ||
        typography(s.removed) === typography(s.hunk.replacement) ||
        touches(s.hunk, ranges) ||
        isIgnored(s.hunk)
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
