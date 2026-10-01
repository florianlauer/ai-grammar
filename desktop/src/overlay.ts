// Level 2: checks the focused field of any app as the user types, and draws the extension's
// marks and badge over it. The card window shows what the pointer rests on.
import "./chrome.ts";
import "../../src/contentScript/overlay.css";
import "./overlay.css";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { checkIcon, powerIcon, spinnerIcon } from "../../src/contentScript/render.ts";
import {
  changeOf,
  diffHunks,
  keepUserText,
  longSentences,
  markedSpan,
  splitCheckable,
  type Hunk,
} from "../../src/contentScript/text.ts";
import { addToDictionary, ignoreChange, loadSettings, onSettingsChange } from "../../src/settings.ts";
import { followTheme, type App, type Rect } from "./api.ts";
import { check } from "./check.ts";

type Tick = {
  app: App | null;
  text: string | null;
  field: Rect;
  // the rects of each range, one per line: the fixes, then the long sentences
  marks: Rect[][];
  cursor: [number, number];
  overCard: boolean;
};
type Span = { start: number; end: number };

const layers = { fix: document.getElementById("fixes")!, rewrite: document.getElementById("long")! };
const badge = document.getElementById("badge") as HTMLButtonElement;
followTheme();

let settings = await loadSettings();

let text: string | null = null;
// the corrected text from the last check, and the fixes still left in `text`
let result: string | null = null;
let hunks: Hunk[] = [];
// sentences over 30 words, underlined for a rewrite as in the extension
let long: Span[] = [];
// the text an applied fix leads to, so it doesn't start a new check
let expected: string | null = null;
let error = "";
let run = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let app: App | null = null;
let field: Rect = { x: 0, y: 0, width: 0, height: 0 };
let marks: Rect[][] = [];
// what the pointer rests on and what the card shows: a range's index, PANEL for the badge, or NONE
const NONE = -1;
const PANEL = -2;
let hovered = NONE;
let shown = NONE;
let hoverTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
let clickable = false;
let glyph = "";

const inside = (r: Rect, x: number, y: number, below = 0) =>
  x >= r.x - 1 && x <= r.x + r.width + 1 && y >= r.y && y <= r.y + r.height + below;

const union = (rects: Rect[]): Rect => {
  if (!rects.length) {
    return field;
  }
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
};

const setBadge = (state: "hidden" | "loading" | "wrong" | "correct" | "error", html = "") => {
  badge.hidden = state === "hidden";
  badge.dataset.state = state;
  // skipped when unchanged, so the glyph's entrance doesn't replay on every keystroke
  if (html !== glyph) {
    glyph = html;
    badge.innerHTML = `<span class="aig-glyph">${html}</span>`;
  }
};

// The bottom right corner of the field, where the extension puts its trigger.
const placeBadge = ({ x, y, width, height }: Rect) => {
  const padding = height < 24 + 16 ? Math.max(0, height - 24) / 2 : 8;
  badge.style.left = `${x + width - 8 - 24}px`;
  badge.style.top = `${y + height - padding - 24}px`;
};

// Only the badge takes clicks, and only while the pointer is on it.
const setClickable = (on: boolean) => {
  if (on !== clickable) {
    clickable = on;
    invoke("set_overlay_clickable", { clickable: on });
  }
};

const sendMarks = () => {
  if (text !== null) {
    const ranges = [...hunks.map((hunk) => markedSpan(text!, hunk)), ...long.map(({ start, end }) => [start, end])];
    invoke("set_marks", { text, ranges });
  }
};

const showHunks = () => {
  if (text === null) {
    return;
  }
  hunks = result === null ? [] : diffHunks(text, result);
  sendMarks();
  // hidden until the next tick draws them, so they replay their draw-in for the new result
  for (const mark of layers.fix.children as HTMLCollectionOf<HTMLElement>) {
    mark.style.display = "none";
  }
  if (result !== null) {
    setBadge(hunks.length ? "wrong" : "correct", hunks.length ? `<span class="aig-count">${hunks.length}</span>` : checkIcon);
  }
};

const hideCard = () => {
  if (shown !== NONE) {
    shown = NONE;
    invoke("hide_card");
  }
};

// The panel, as in the extension: the fixes in the text, the long sentences, and the tones
// for the whole text. The card window builds it.
const openPanel = (current: string) => {
  const { before, core } = splitCheckable(current);
  invoke("show_card", {
    anchor: badge.getBoundingClientRect(),
    end: true,
    payload: {
      kind: "panel",
      state: badge.dataset.state,
      error,
      text: current,
      result,
      long: long.map(({ start, end }, i) => ({
        start,
        end,
        text: current.slice(start, end),
        anchor: union(marks[hunks.length + i] ?? []),
      })),
      whole: core.trim() ? { text: core, start: before.length, end: before.length + core.length, anchor: field } : null,
      app,
    },
  });
};

const open = (index: number, rect: Rect) => {
  if (text === null || index === shown) {
    return;
  }
  shown = index;
  if (index === PANEL) {
    openPanel(text);
  } else if (index < hunks.length) {
    const hunk = hunks[index];
    // under the line the pointer is on
    invoke("show_card", {
      anchor: rect,
      end: false,
      payload: { kind: "fix", index, removed: text.slice(hunk.start, hunk.end), added: hunk.replacement },
    });
  } else {
    const { start, end } = long[index - hunks.length];
    invoke("show_card", {
      anchor: union(marks[index] ?? []),
      end: false,
      payload: { kind: "offer", sentence: { start, end, text: text.slice(start, end) } },
    });
  }
};

const onText = (next: string) => {
  text = next;
  run++;
  clearTimeout(timer);
  hideCard();
  // same part of the text as the check: no underlines in an email signature
  const { before, core } = splitCheckable(next);
  long = longSentences(core).map((r) => ({ start: r.start + before.length, end: r.end + before.length }));
  if (next === expected && result !== null) {
    // a fix was just applied: the other fixes still hold, no new call
    expected = null;
    showHunks();
    return;
  }
  expected = null;
  result = null;
  hunks = [];
  sendMarks();
  // rarely works with single words
  if (core.split(/\s+/).length < 2) {
    setBadge("hidden");
    return;
  }
  setBadge("loading", spinnerIcon);
  const current = run;
  // wait for a typing pause instead of querying the model on every keystroke
  timer = setTimeout(async () => {
    try {
      const fixed = await check({ text: next, settings, channel: "check" });
      if (current !== run) {
        return;
      }
      if (fixed === null) {
        setBadge("hidden");
        return;
      }
      result = fixed;
      showHunks();
    } catch (e) {
      if (current === run && String(e) !== "aborted") {
        console.warn(e);
        error = String(e);
        setBadge("error", powerIcon);
      }
    }
  }, 800);
};

// Reuses the mark elements from tick to tick, so they only draw in when they're new.
const drawLayer = (layer: HTMLElement, groups: Rect[][], offset: number) => {
  const pool = layer.children as HTMLCollectionOf<HTMLElement>;
  let count = 0;
  groups.forEach((rects, i) => {
    for (const r of rects) {
      const mark = pool[count++] ?? layer.appendChild(Object.assign(document.createElement("div"), { className: "aig-root aig-mark" }));
      Object.assign(mark.style, { display: "block", left: `${r.x}px`, top: `${r.y}px`, width: `${r.width}px`, height: `${r.height}px` });
      // staggers the draw-in, capped so long texts don't take seconds
      mark.style.setProperty("--aig-i", `${Math.min(i, 8)}`);
      mark.toggleAttribute("data-active", offset + i === shown);
    }
  });
  for (let i = count; i < pool.length; i++) {
    pool[i].style.display = "none";
  }
};

const draw = () => {
  drawLayer(layers.fix, marks.slice(0, hunks.length), 0);
  drawLayer(layers.rewrite, marks.slice(hunks.length), hunks.length);
  badge.toggleAttribute("data-hover", hovered === PANEL);
};

// The pointer is tracked by Rust, since this window lets the mouse through.
const hover = ({ cursor: [x, y], overCard }: Tick) => {
  // fixes come first, so they win over the long sentence around them
  let index = NONE;
  let rect = field;
  marks.some((rects, i) => {
    const hit = rects.find((r) => inside(r, x, y, 3));
    if (hit) {
      [index, rect] = [i, hit];
    }
    return hit;
  });
  if (index === NONE && !badge.hidden && inside(badge.getBoundingClientRect(), x, y)) {
    index = PANEL;
  }
  setClickable(index === PANEL);
  if (index !== NONE || overCard) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  } else if (shown !== NONE && hideTimer === undefined) {
    // delayed so the pointer can travel from the text to the card
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      hideCard();
    }, 300);
  }
  if (index === hovered) {
    return;
  }
  hovered = index;
  clearTimeout(hoverTimer);
  if (index !== NONE) {
    // the panel opens at once, as in the extension; a mark after a short rest, so sweeping
    // across the text doesn't flash cards
    hoverTimer = setTimeout(() => open(index, rect), index === PANEL ? 0 : 250);
  }
};

const acceptAll = async () => {
  if (text === null || result === null || result === text) {
    return;
  }
  // the whole text is replaced by the corrected one
  const before = text;
  expected = result;
  const done = await invoke<boolean>("apply_fix", { start: 0, end: before.length, replacement: result, expected: before });
  if (!done) {
    expected = null;
  }
};

const accept = async (hunk: Hunk) => {
  if (text === null) {
    return;
  }
  // set before the call: the tick with the new text can arrive before its reply
  const before = text;
  expected = before.slice(0, hunk.start) + hunk.replacement + before.slice(hunk.end);
  const done = await invoke<boolean>("apply_fix", {
    start: hunk.start,
    end: hunk.end,
    replacement: hunk.replacement,
    expected: before.slice(hunk.start, hunk.end),
  });
  if (!done) {
    expected = null;
  }
};

listen<Tick>("tick", ({ payload }) => {
  app = payload.app;
  if (payload.text === null) {
    text = null;
    run++;
    clearTimeout(timer);
    clearTimeout(hoverTimer);
    clearTimeout(hideTimer);
    hideTimer = undefined;
    hovered = NONE;
    shown = NONE;
    marks = [];
    layers.fix.replaceChildren();
    layers.rewrite.replaceChildren();
    setBadge("hidden");
    setClickable(false);
    return;
  }
  field = payload.field;
  // before the hover test, which reads where the badge is
  placeBadge(field);
  if (payload.text !== text) {
    onText(payload.text);
  }
  // a tick measured before the new ranges reached Rust keeps the marks drawn
  if (payload.marks.length === hunks.length + long.length) {
    marks = payload.marks;
  }
  hover(payload);
  draw();
});

// the extension accepts every fix from its trigger
badge.addEventListener("click", () => {
  if (badge.dataset.state === "wrong") {
    acceptAll();
  }
});

// also sent by the card when it turns into a rewrite, which stays until it's used or closed
listen("card-hidden", () => (shown = NONE));

listen<{ index: number; action: "accept" | "ignore" | "word" | "accept-all"; word?: string }>(
  "fix-action",
  ({ payload: { index, action, word } }) => {
    shown = NONE;
    const hunk = hunks[index];
    if (action === "accept-all") {
      acceptAll();
    } else if (action === "word" && word) {
      // the settings change takes the fix out
      addToDictionary(word);
    } else if (hunk && text !== null) {
      if (action === "accept") {
        accept(hunk);
      } else {
        // "Ignore" refuses this change in every app, as in the extension
        ignoreChange(changeOf(text, hunk));
      }
    }
  },
);

// Drops fixes on words just added to the dictionary or changes just ignored, without a new check.
onSettingsChange((next) => {
  settings = next;
  if (text !== null && result !== null) {
    const kept = keepUserText(text, result, settings.dictionary, settings.ignored);
    if (kept !== result) {
      result = kept;
      showHunks();
    }
  }
});
