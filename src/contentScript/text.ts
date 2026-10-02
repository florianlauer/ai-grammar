// Text logic with no DOM access, so it runs under `node --test`.
import { diffWords } from "diff";
import { findFalseFriends } from "../falseFriends.ts";
import type { Tone } from "../prompts.ts";
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

// letters and digits only, so "review." and "review," are the same word as "review"
const inWord = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);

// Offsets widened to the whole words they cut into. A boundary on a space cuts nothing.
// An apostrophe or hyphen between letters is part of the word: "aujourd'hui", "peut-être".
export const wholeWords = (text: string, start: number, end: number) => {
  const joined = (c: string | undefined, next: string | undefined) =>
    inWord(c) || (!!c && /['’-]/.test(c) && inWord(next));
  let s = start;
  let e = end;
  if (joined(text[s], text[s + 1])) while (joined(text[s - 1], text[s - 2])) s--;
  if (joined(text[e - 1], text[e - 2])) while (joined(text[e], text[e + 1])) e++;
  return { start: s, end: e };
};

// A hunk widened to the whole word around it, so ignoring "add a comma after merci"
// doesn't ignore every comma.
export const changeOf = (text: string, { start, end, replacement }: Hunk): Change => {
  let s = start;
  let e = end;
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

const frenchWords =
  /(?<![\p{L}'’])(je|j|tu|il|nous|vous|on|le|la|les|des|du|un|une|est|et|que|qui|pour|pas|sur|avec|dans|mais|ça|ce|c|à)(?![\p{L}])/giu;
const englishWords =
  /(?<![\p{L}'’])(i|you|we|he|she|they|the|a|an|is|are|was|and|to|of|that|for|not|with|this|it|have|be|if|but|in)(?![\p{L}'’])/giu;

// Counts common function words. Good enough to tell French from English in a sentence or
// two, which is all the rewrite checks need. Unsure means null.
export const languageOf = (text: string) => {
  const fr = text.match(frenchWords)?.length ?? 0;
  const en = text.match(englishWords)?.length ?? 0;
  if (fr === en) {
    return null;
  }
  return fr > en ? "French" : "English";
};

const words = (text: string) => text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];

// Things a rewrite has to carry over untouched.
const essentials = (text: string, dictionary: string[]) => [
  ...(text.match(/https?:\/\/\S+[^\s.,;:!?)]|www\.\S+[^\s.,;:!?)]|\S+@\S+\.\w+/g) ?? []),
  ...(text.match(/\d+(?:[.,:]\d+)*/g) ?? []),
  ...dictionary.filter((w) => protectedRanges(text, [w]).length > 0),
  // a capital that doesn't start a sentence is a name, a product or an acronym ("I" aside)
  // not after a stop (and a closing quote), at the start, or after a list bullet
  ...[
    ...text.matchAll(
      /(?<![.!?:…\n]["'”»)\]]*\s*|^\s*|(?:^|\n)[ \t]*[-*•][ \t]+)(?<=\s)\p{Lu}[\p{L}\p{N}'’-]*/gu,
    ),
  ]
    .map((m) => m[0])
    .filter((w) => w !== "I" && !/^I['’]/.test(w)),
];

const brackets = /[[\]{}<>]/g;

// Small numbers spelled out, in English and French: gemma4 writes "two weeks" for "2 weeks",
// and qwen3.5 "dix" for "10", which keeps the number.
const spelled = [
  ["zero", "zéro"],
  ["one", "un", "une"],
  ["two", "deux"],
  ["three", "trois"],
  ["four", "quatre"],
  ["five", "cinq"],
  ["six"],
  ["seven", "sept"],
  ["eight", "huit"],
  ["nine", "neuf"],
  ["ten", "dix"],
  ["eleven", "onze"],
  ["twelve", "douze"],
];

const keeps = (variant: string, essential: string) =>
  variant.includes(essential) ||
  (/^\d+$/.test(essential) ? (spelled[Number(essential)] ?? []) : []).some((word) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`, "iu").test(variant),
  );

// Why a model's rewrite can't be shown, or null when it can. Small models drop numbers,
// translate the text, or leave "[optional: reason]" placeholders.
export const rejectVariant = (original: string, variant: string, dictionary: string[] = []) => {
  const v = variant.trim();
  if (!v || v === original.trim()) {
    return "unchanged";
  }
  const missing = essentials(original, dictionary).find((e) => !keeps(v, e));
  if (missing) {
    return `dropped “${missing}”`;
  }
  const added = (v.match(brackets) ?? []).find((b) => !original.includes(b));
  if (added || v.includes("**")) {
    return "added brackets or markup";
  }
  const from = languageOf(original);
  const to = languageOf(v);
  if (from && to && from !== to) {
    return `switched to ${to}`;
  }
  return null;
};

// Rewrites that pass the checks, without duplicates.
export const keepVariants = (original: string, variants: string[], dictionary: string[] = []) => [
  ...new Set(
    variants.map((v) => v.trim()).filter((v) => rejectVariant(original, v, dictionary) === null),
  ),
];

// Sentences over `limit` words, as offsets. Found by counting, with no model call.
export const longSentences = (text: string, limit = 30) =>
  // a stop only ends a sentence before a space, so "v2.3" and URLs don't split one
  [...text.matchAll(/\S[^\n]*?(?:[.!?…]+(?=\s|$)|$)/gmu)]
    .filter((m) => words(m[0]).length > limit)
    .map((m) => ({ start: m.index!, end: m.index! + m[0].trimEnd().length }));

export const wordCount = (text: string) => words(text).length;

// The rest of the sentence around [start, end): what a rewrite of part of it has to fit between.
export const sentenceAround = (text: string, start: number, end: number) => {
  const head = text.slice(0, start);
  let from = 0;
  for (const m of head.matchAll(/[.!?…]+\s+|\n/g)) {
    from = m.index! + m[0].length;
  }
  // a part that ends its sentence has nothing after it
  if (/[.!?…]\s*$/.test(text.slice(start, end))) {
    return { before: head.slice(from), after: "" };
  }
  const tail = text.slice(end);
  const stop = tail.match(/[.!?…]+(?=\s|$)|\n/);
  const to = stop ? stop.index! + (stop[0] === "\n" ? 0 : stop[0].length) : tail.length;
  return { before: head.slice(from), after: tail.slice(0, to) };
};

const hasWords = (text: string) => /[\p{L}\p{N}]/u.test(text);

const firstWord = (text: string) => words(text)[0] ?? "";
const lastWord = (text: string) => words(text).at(-1) ?? "";
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// Makes a rewrite of part of a sentence fit back in place. Small models repeat the word
// just before the part, capitalise it, or end it with a full stop.
export const fitFragment = (
  variant: string,
  { part, before, after }: { part: string; before: string; after: string },
) => {
  let v = variant.trim();
  const prev = lastWord(before);
  if (prev && same(firstWord(v), prev) && !same(firstWord(part), prev)) {
    v = v.slice(v.search(/\s/) + 1).trimStart();
  }
  const next = firstWord(after);
  if (next && same(lastWord(v), next) && !same(lastWord(part), next)) {
    v = v.replace(/\s*[\p{L}\p{N}][\p{L}\p{N}'’-]*[.!?…]*$/u, "");
  }
  const word = firstWord(v);
  if (
    hasWords(before) &&
    /^\p{Ll}/u.test(part) &&
    /^\p{Lu}\p{Ll}+$/u.test(word) &&
    !(before + part).includes(word)
  ) {
    v = v[0].toLowerCase() + v.slice(1);
  }
  // whatever follows ("." or ", then…") already carries the punctuation
  if (after.trim() && !/[.!?…]$/.test(part)) {
    v = v.replace(/[.!?…]+$/, "");
  }
  return v;
};

export const isFragment = ({ before, after }: { before: string; after: string }) =>
  hasWords(before) || hasWords(after);

// An insertion (e.g. a missing comma) has no text to underline: mark the word before it.
export const markedSpan = (text: string, { start, end }: Hunk) => {
  if (end > start) {
    return [start, end];
  }
  const word = /(\S+)\s*$/.exec(text.slice(0, start));
  if (word) {
    return [word.index, word.index + word[1].length];
  }
  return [start, Math.min(start + 1, text.length)];
};

// What a rewrite of `text`, found at `start` in the field's text `all`, asks the model, and how
// its answers fit back in place. The extension and the desktop app both go through it.
export const prepareRewrite = ({ all, start, text, tone }: { all: string; start: number; text: string; tone: Tone }) => {
  const part = text.trim();
  const lead = text.length - text.trimStart().length;
  const context = sentenceAround(all, start + lead, start + lead + part.length);
  // the whole field gives the writer's language away, even when the selection has no false friend
  const falseFriends = tone === "natural" ? findFalseFriends(part).notes : [];
  const writer = tone === "natural" ? { language: findFalseFriends(all).language, falseFriends } : null;
  // also for a whole sentence selected without its stop, which the text still has after it
  const fit = (variant: string) => fitFragment(variant, { part, ...context });
  const keep = (variants: string[], dictionary: string[]) => {
    const kept = keepVariants(part, variants.map(fit), dictionary);
    // versions that still use a flagged word go last
    const flagged = (v: string) => findFalseFriends(v).notes.length;
    return tone === "natural" ? kept.sort((a, b) => flagged(a) - flagged(b)) : kept;
  };
  return { request: { text: part, context: isFragment(context) ? context : null, tone, writer }, falseFriends, fit, keep };
};
