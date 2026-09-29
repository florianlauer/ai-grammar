import { computePosition, flip, offset, Rect, shift } from "@floating-ui/dom";
import type {
  GenerateResponse,
  GenerateRequest,
  ListResponse,
} from "ollama/browser";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
// crxjs lists imported CSS in the manifest, so the browser injects it and page CSPs can't block it
import "./overlay.css";
import {
  addToDictionary,
  disableSite,
  loadSettings,
  ignoreChange,
  onSettingsChange,
  Settings,
  Style,
  defaultSettings,
} from "../settings";
import {
  changeOf,
  diffHunks,
  diffSegments,
  dictionaryCandidate,
  Hunk,
  keepUserText,
  splitCheckable,
} from "./text";

const outputSchema = z.object({
  correctedText: z.string(),
});

const outputSchemaJson = zodToJsonSchema(outputSchema);

// Kept current by main(); read at event time so changes in the options page apply at once.
let settings: Settings = defaultSettings;

// Only non-default choices add a line, so the default prompt stays the one the benchmark measured.
const styleRules = ({ address, english, informal }: Style) =>
  [
    address !== "any" &&
      `In French, address the reader as "${address}" and adjust the verbs and pronouns to match.`,
    english === "us" && "In English, use American spelling (color, organize).",
    english === "uk" && "In English, use British spelling (colour, organise).",
    // a softer "replace informal words" was ignored by gemma4; the examples make it stick
    informal === "fix" &&
      `Informal and spoken words are mistakes here: replace them with their standard written form, for example "du coup" → "donc", "gonna" → "going to", "ouais" → "oui".`,
  ].filter(Boolean);

const grammarPrompt = (text: string, { dictionary, style }: Settings) => {
  const rules = [
    ...styleRules(style),
    dictionary.length && `Leave these words exactly as written: ${dictionary.join(", ")}.`,
  ].filter(Boolean);
  return `Fix the spelling, grammar and punctuation of the text below. Typos may be missing letters, apostrophes or accents: use the surrounding context to recover the intended word. Keep the original language, meaning, tone and technical terms; change as little as possible. If the text is already correct, return it unchanged.${
    rules.length ? `\n\n${rules.join("\n")}` : ""
  }\n\nText:\n${text}`;
};

const buttonSize = 24;
const buttonPadding = 8;

// Lucide paths, stroked with currentColor so the trigger's state sets the colour.
const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>`;

const powerIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v4"/><path d="M7.998 9.003a5 5 0 1 0 8-.005"/><circle cx="12" cy="12" r="10"/></svg>`;

const spinnerIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8" opacity="0.2"/><path d="M20 12a8 8 0 0 0-8-8"/></svg>`;


type Result<T> = { ok: true; value: T } | { ok: false; error: unknown };

const resultFromPromise = <T>(promise: Promise<T>): Promise<Result<T>> => {
  return promise.then(
    (value) => ({ ok: true, value }),
    (error) => ({ ok: false, error }),
  );
};

const isVisible = (el: HTMLElement, parent: HTMLElement) => {
  const rect = el.getBoundingClientRect();

  // check coords on the left of the button to handle cases with little textarea (twitter)
  const coords = [
    [rect.left - buttonSize - 1, rect.top + 4],
    [rect.right - buttonSize - 1, rect.top + 4],
    [rect.right - buttonSize - 1, rect.bottom - 4],
    [rect.left - buttonSize - 1, rect.bottom - 4],
  ];

  for (let coord of coords) {
    const other = document.elementFromPoint(coord[0], coord[1]);
    if (!(other && (parent === other || parent.contains(other)))) {
      return false;
    }
  }

  return true;
};

// A clickable "removed → added" chunk, used in the tooltip and the suggestion card.
function renderChange(removed: string, added: string, onClick: () => void) {
  // a span, not a <button>, so the change keeps wrapping with the surrounding text
  const chunk = document.createElement("span");
  chunk.className = "aig-change";
  chunk.role = "button";
  chunk.tabIndex = 0;
  chunk.title = "Apply this change";
  chunk.addEventListener("click", onClick);
  chunk.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  });

  const del = document.createElement("del");
  del.className = "aig-del";
  del.textContent = removed;

  const ins = document.createElement("ins");
  ins.className = "aig-ins";
  ins.textContent = added;

  chunk.append(del, ins);
  return chunk;
}

function createDiff(
  str1: string,
  str2: string,
  onApply: (hunk: Hunk) => void,
) {
  const fragment = document.createDocumentFragment();

  for (const segment of diffSegments(str1, str2)) {
    if (!("hunk" in segment)) {
      fragment.appendChild(document.createTextNode(segment.text));
      continue;
    }

    fragment.appendChild(
      renderChange(segment.removed, segment.hunk.replacement, () =>
        onApply(segment.hunk),
      ),
    );
  }

  return fragment;
}

const isSpace = (c: string) => /\s/.test(c);

// innerText adds line breaks for blocks/<br> and collapses whitespace, so walk it
// alongside the DOM text nodes to map its offsets back to DOM positions.
const rangeFromOffsets = (root: HTMLElement, start: number, end: number) => {
  const text = root.innerText;
  const positions: ([Text, number] | undefined)[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let i = 0;

  for (let node; (node = walker.nextNode() as Text | null); ) {
    for (let j = 0; j < node.data.length; j++) {
      const c = node.data[j];
      while (i < text.length && text[i] === "\n" && c !== "\n") i++;
      if (i < text.length && (text[i] === c || (isSpace(text[i]) && isSpace(c)))) {
        positions[i++] = [node, j];
      }
    }
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);

  // prefer "right after the previous char" so insertions stay in the current block
  const prev = positions[start - 1];
  const next = positions.findIndex((p, k) => k >= start && p !== undefined);
  if (prev) {
    range.setStart(prev[0], prev[1] + 1);
  } else if (next !== -1) {
    range.setStart(...positions[next]!);
  }
  range.collapse(true);

  for (let k = end - 1; k >= start; k--) {
    const p = positions[k];
    if (p) {
      range.setEnd(p[0], p[1] + 1);
      break;
    }
  }

  return range;
};

const replaceText = (
  el: HTMLTextAreaElement | HTMLElement,
  { start, end, replacement }: Hunk,
) => {
  el.focus();

  let range: Range | null = null;
  if (el instanceof HTMLTextAreaElement) {
    el.setSelectionRange(start, end);
  } else {
    range = rangeFromOffsets(el, start, end);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // execCommand keeps native undo and goes through the editor's own input handling (React, Lexical, ProseMirror...)
  const ok = replacement
    ? document.execCommand("insertText", false, replacement)
    : document.execCommand("delete");
  if (ok) {
    return;
  }

  if (el instanceof HTMLTextAreaElement) {
    el.setRangeText(replacement, start, end, "end");
  } else if (range) {
    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

interface Provider {
  isSupported: () => Promise<boolean>;
  fixGrammar: (text: string, settings: Settings) => Promise<string>;
}

class GeminiProvider implements Provider {
  async isSupported() {
    try {
      const result: boolean = await chrome.runtime.sendMessage({
        type: "gemini.supported",
      });

      return result;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  async fixGrammar(text: string, settings: Settings) {
    const response: string | null = await chrome.runtime.sendMessage({
      type: "gemini.generate",
      data: {
        text: grammarPrompt(text, settings),
        responseConstraint: outputSchemaJson,
      } satisfies LanguageModelPromptOptions & { text: LanguageModelPrompt },
    });

    if (!response) {
      throw new Error("Make sure that Gemini is working");
    }

    const json = outputSchema.parse(JSON.parse(response));

    return json.correctedText;
  }
}

class OllamaProvider implements Provider {
  async isSupported() {
    try {
      const result: ListResponse | null = await chrome.runtime.sendMessage({
        type: "ollama.list",
      });

      if (!result) {
        return false;
      }

      return result.models.length > 0;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  async fixGrammar(text: string, settings: Settings) {
    const response: GenerateResponse | { error: string } | null =
      await chrome.runtime.sendMessage({
      type: "ollama.generate",
      data: {
        model: settings.model,
        prompt: grammarPrompt(text, settings),
        format: outputSchemaJson,
        options: { temperature: 0 },
        // keep the model loaded so the first check after a pause isn't slow
        keep_alive: -1,
        // thinking would add seconds per check; not in this ollama-js version's types yet
        think: false,
      } satisfies GenerateRequest & { think: boolean },
    });

    if (!response) {
      throw new Error("Make sure that Ollama is installed and running.");
    }
    if ("error" in response) {
      throw new Error(response.error);
    }

    const json = outputSchema.parse(JSON.parse(response.response));

    return json.correctedText;
  }
}

// These sites turn native spell checking off because they ship their own checker,
// so spellcheck="false" there doesn't mean "not prose".
const spellcheckOffAllowed = ["mail.google.com"];

const isTextArea = (
  node: Node | EventTarget,
): node is HTMLTextAreaElement | HTMLElement => {
  return (
    ((node instanceof HTMLElement && node.contentEditable === "true") ||
      node instanceof HTMLTextAreaElement) &&
    (node.spellcheck || spellcheckOffAllowed.includes(location.hostname))
  );
};

// Set localStorage["ai-grammar:debug"] = "1" on a site to trace why a field is or isn't checked.
const debug = (...args: unknown[]) => {
  if (localStorage.getItem("ai-grammar:debug")) {
    console.log("[ai-grammar]", ...args);
  }
};

const describe = (el: Element | null | undefined) =>
  el
    ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].slice(0, 3).join(".")}`
    : String(el);

// Some editors (Notion) make the whole page one editing host, page UI included,
// with each block as a nested contenteditable. Check the block around the caret.
const checkUnit = (target: HTMLTextAreaElement | HTMLElement) => {
  if (target instanceof HTMLTextAreaElement) {
    return target;
  }
  const anchor = getSelection()?.anchorNode;
  const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement;
  const block = anchorEl?.closest<HTMLElement>('[contenteditable="true"]');
  if (block && block !== target && target.contains(block) && isTextArea(block)) {
    return block;
  }
  // page UI inside the host means the host is a whole page: wait until the caret is in a block
  if (target.querySelector('[contenteditable="false"]')) {
    debug("skip: page-level editor and caret not in a block", describe(anchorEl));
    return null;
  }
  return target;
};

const recursivelyFindAllTextAreas = (node: Node) => {
  const inputs: (HTMLTextAreaElement | HTMLElement)[] = [];
  if (isTextArea(node)) {
    inputs.push(node);
  } else {
    for (let child of node.childNodes) {
      inputs.push(...recursivelyFindAllTextAreas(child));
    }
  }
  return inputs;
};

type PanelContent = {
  title: string;
  body: string | DocumentFragment;
  muted?: boolean;
  action?: { label: string; onClick: () => void };
};

// The panel listing every suggestion, opened from the trigger.
class Tooltip {
  #tooltip: HTMLDivElement;
  #button: HTMLButtonElement;
  #title: HTMLSpanElement;
  #action: HTMLButtonElement;
  #body: HTMLDivElement;
  #onAction: (() => void) | null = null;

  constructor(button: HTMLButtonElement) {
    this.#button = button;
    this.#tooltip = document.createElement("div");
    this.#tooltip.className = "aig-root aig-pop aig-panel";
    this.#tooltip.role = "dialog";
    this.#tooltip.ariaLabel = "Grammar suggestions";

    const head = document.createElement("div");
    head.className = "aig-panel__head";
    this.#title = document.createElement("span");
    this.#title.className = "aig-panel__title";
    this.#action = document.createElement("button");
    this.#action.type = "button";
    this.#action.className = "aig-action";
    this.#action.hidden = true;
    this.#action.addEventListener("click", () => this.#onAction?.());
    head.append(this.#title, this.#action);

    this.#body = document.createElement("div");
    this.#body.className = "aig-panel__body";

    const foot = document.createElement("div");
    foot.className = "aig-panel__foot";
    const settingsLink = document.createElement("button");
    settingsLink.type = "button";
    settingsLink.className = "aig-link";
    settingsLink.textContent = "Settings";
    settingsLink.addEventListener("click", () =>
      chrome.runtime.sendMessage({ type: "options.open" }),
    );
    const siteOff = document.createElement("button");
    siteOff.type = "button";
    siteOff.className = "aig-link";
    siteOff.textContent = `Turn off on ${location.hostname}`;
    siteOff.addEventListener("click", () => void disableSite(location.hostname));
    foot.append(settingsLink, siteOff);

    this.#tooltip.append(head, this.#body, foot);
    document.body.appendChild(this.#tooltip);
  }

  get element() {
    return this.#tooltip;
  }

  show() {
    this.#tooltip.dataset.open = "";
    this.#updateTooltipPosition();
  }

  hide() {
    delete this.#tooltip.dataset.open;
  }

  set content({ title, body, muted, action }: PanelContent) {
    this.#title.textContent = title;
    this.#body.replaceChildren(...(body ? [body] : []));
    this.#tooltip.toggleAttribute("data-muted", !!muted);
    this.#action.hidden = !action;
    this.#action.textContent = action?.label ?? "";
    this.#onAction = action?.onClick ?? null;
    this.#updateTooltipPosition();
  }

  #updateTooltipPosition() {
    computePosition(this.#button, this.#tooltip, {
      placement: "bottom-end",
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y, placement }) => {
      Object.assign(this.#tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
      this.#tooltip.dataset.side = placement;
    });
  }

  destroy() {
    this.#tooltip.remove();
  }
}

// Light text means a dark surface. Follows the host input rather than the OS, since a dark
// overlay on a light page (or the reverse) looks foreign.
const themeFor = (el: HTMLElement) => {
  const color = getComputedStyle(el).color;
  const [a = 0, b = 0, c = 0] = color.match(/[\d.]+/g)?.map(Number) ?? [];
  let lightness: number;
  if (color.startsWith("rgb")) {
    lightness = (0.2126 * a + 0.7152 * b + 0.0722 * c) / 255;
  } else if (/^(ok)?l(ch|ab)\(/.test(color)) {
    lightness = a > 1 ? a / 100 : a;
  } else {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return lightness > 0.5 ? "dark" : "light";
};

// Layout properties a mirror div needs to wrap text exactly like its textarea.
const mirroredProps = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "textAlign",
  "wordSpacing",
  "tabSize",
  "direction",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
] as const;

// An insertion (e.g. a missing comma) has no text to underline: mark the word before it.
const markedSpan = (text: string, { start, end }: Hunk) => {
  if (end > start) {
    return [start, end];
  }
  const word = /(\S+)\s*$/.exec(text.slice(0, start));
  if (word) {
    return [word.index, word.index + word[1].length];
  }
  return [start, Math.min(start + 1, text.length)];
};

type Underline = { hunk: Hunk; range: Range; rects: DOMRect[] };

// Draws suggestion underlines over the input. Textareas can't style their own text, so a
// hidden mirror div with the same layout gives the text positions; contenteditables use
// ranges on their own DOM. Lines are overlay divs so the editor's DOM is never touched.
class Underlines {
  #el: HTMLTextAreaElement | HTMLElement;
  #mirror: HTMLDivElement | null = null;
  #layer: HTMLDivElement;
  #items: Underline[] = [];
  #active: Hunk | null = null;

  constructor(el: HTMLTextAreaElement | HTMLElement) {
    this.#el = el;
    this.#layer = document.createElement("div");
    this.#layer.className = "aig-root aig-layer";
    document.body.appendChild(this.#layer);
  }

  set(text: string, hunks: Hunk[]) {
    let textNode: Text | null = null;
    if (this.#el instanceof HTMLTextAreaElement) {
      this.#mirror ??= this.#createMirror();
      this.#copyTextareaStyle(this.#el, this.#mirror);
      // trailing space keeps a final empty line, so the max scroll matches the textarea
      this.#mirror.textContent = text + " ";
      textNode = this.#mirror.firstChild as Text;
    }

    this.#items = hunks.map((hunk) => {
      const [start, end] = markedSpan(text, hunk);
      let range: Range;
      if (textNode) {
        range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
      } else {
        range = rangeFromOffsets(this.#el, start, end);
      }
      return { hunk, range, rects: [] };
    });

    // hide then reflow, so reused marks replay their draw-in animation for the new result
    this.#active = null;
    for (const mark of this.#layer.children as HTMLCollectionOf<HTMLElement>) {
      mark.style.display = "none";
    }
    void this.#layer.offsetWidth;
    this.draw();
  }

  clear() {
    this.#items = [];
    this.#active = null;
    this.draw();
  }

  get element() {
    return this.#layer;
  }

  setActive(hunk: Hunk | null) {
    this.#active = hunk;
    this.draw();
  }

  draw() {
    const lines = this.#layer.children as HTMLCollectionOf<HTMLDivElement>;
    let count = 0;

    if (this.#items.length > 0) {
      if (this.#el instanceof HTMLTextAreaElement && this.#mirror) {
        this.#syncMirror(this.#el, this.#mirror);
      }
      const box = this.#el.getBoundingClientRect();

      for (const [index, item] of this.#items.entries()) {
        // skip text scrolled out of the input
        item.rects = [...item.range.getClientRects()].filter(
          (r) =>
            r.width > 0 &&
            r.bottom > box.top &&
            r.top < box.bottom &&
            r.right > box.left &&
            r.left < box.right,
        );
        for (const r of item.rects) {
          const mark = lines[count++] ?? this.#layer.appendChild(this.#createMark());
          Object.assign(mark.style, {
            display: "block",
            left: `${r.left}px`,
            top: `${r.top}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
          });
          // staggers the draw-in, capped so long texts don't take seconds
          mark.style.setProperty("--aig-i", `${Math.min(index, 8)}`);
          mark.toggleAttribute("data-active", item.hunk === this.#active);
        }
      }
    }

    for (let i = count; i < lines.length; i++) {
      lines[i].style.display = "none";
    }
  }

  // Suggestion under the pointer, with the rect it was found in.
  at(x: number, y: number) {
    for (const item of this.#items) {
      for (const rect of item.rects) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom + 3) {
          return { hunk: item.hunk, rect };
        }
      }
    }
    return null;
  }

  destroy() {
    this.#layer.remove();
    this.#mirror?.remove();
  }

  #createMark() {
    const mark = document.createElement("div");
    mark.className = "aig-root aig-mark";
    return mark;
  }

  #createMirror() {
    const mirror = document.createElement("div");
    Object.assign(mirror.style, {
      position: "fixed",
      visibility: "hidden",
      overflow: "hidden",
      pointerEvents: "none",
      margin: "0",
      borderColor: "transparent",
      boxSizing: "border-box",
    });
    document.body.appendChild(mirror);
    return mirror;
  }

  #copyTextareaStyle(textarea: HTMLTextAreaElement, mirror: HTMLDivElement) {
    const style = getComputedStyle(textarea);
    for (const prop of mirroredProps) {
      mirror.style[prop] = style[prop];
    }
    // a visible scrollbar narrows the textarea's text area; the mirror has none
    const scrollbar =
      textarea.offsetWidth -
      textarea.clientWidth -
      parseFloat(style.borderLeftWidth) -
      parseFloat(style.borderRightWidth);
    mirror.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar}px`;
  }

  #syncMirror(textarea: HTMLTextAreaElement, mirror: HTMLDivElement) {
    const rect = textarea.getBoundingClientRect();
    Object.assign(mirror.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;
  }
}

// Small popup shown when hovering an underlined word.
class SuggestionCard {
  #card: HTMLDivElement;
  #hunk: Hunk | null = null;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private onApply: (hunk: Hunk) => void,
    private onActiveChange: (hunk: Hunk | null) => void,
    private onAddWord: (word: string) => void,
    private onIgnore: (hunk: Hunk) => void,
  ) {
    this.#card = document.createElement("div");
    this.#card.className = "aig-root aig-pop aig-card";
    this.#card.role = "dialog";
    this.#card.ariaLabel = "Suggestion";
    // keep focus and selection in the input while clicking the suggestion
    this.#card.addEventListener("mousedown", (e) => e.preventDefault());
    document.body.appendChild(this.#card);
  }

  get element() {
    return this.#card;
  }

  show(hunk: Hunk, removed: string, anchor: DOMRect) {
    clearTimeout(this.#hideTimer);
    if (this.#hunk === hunk) {
      return;
    }
    this.#hunk = hunk;
    this.onActiveChange(hunk);

    // whitespace-only changes would otherwise render as an empty label
    const quoted = (s: string) => `“${s.trim() || "space"}”`;
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "aig-card__apply";
    apply.addEventListener("click", () => {
      this.hide();
      this.onApply(hunk);
    });

    const children: HTMLElement[] = [];
    if (removed && hunk.replacement) {
      const was = document.createElement("div");
      was.className = "aig-card__was";
      was.textContent = removed;
      children.push(was);
      apply.textContent = hunk.replacement;
    } else if (removed) {
      apply.textContent = `Remove ${quoted(removed)}`;
    } else {
      apply.textContent = `Add ${quoted(hunk.replacement)}`;
    }
    children.push(apply);

    const secondary = (label: string, onClick: () => void) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "aig-card__secondary";
      button.textContent = label;
      button.addEventListener("click", () => {
        this.hide();
        onClick();
      });
      return button;
    };
    const word = dictionaryCandidate(removed);
    if (word) {
      children.push(secondary(`Add ${quoted(word)} to dictionary`, () => this.onAddWord(word)));
    }
    children.push(secondary("Ignore", () => this.onIgnore(hunk)));
    this.#card.replaceChildren(...children);
    this.#card.dataset.open = "";

    computePosition({ getBoundingClientRect: () => anchor }, this.#card, {
      placement: "bottom-start",
      strategy: "fixed",
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y, placement }) => {
      Object.assign(this.#card.style, { left: `${x}px`, top: `${y}px` });
      this.#card.dataset.side = placement;
    });
  }

  // delayed so the pointer can travel from the word to the card
  scheduleHide() {
    if (!this.#hunk) {
      return;
    }
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => this.hide(), 200);
  }

  keep() {
    clearTimeout(this.#hideTimer);
  }

  hide() {
    clearTimeout(this.#hideTimer);
    if (this.#hunk) {
      this.#hunk = null;
      this.onActiveChange(null);
    }
    delete this.#card.dataset.open;
  }

  contains(target: EventTarget | null) {
    return target instanceof Node && this.#card.contains(target);
  }

  destroy() {
    clearTimeout(this.#hideTimer);
    this.#card.remove();
  }
}

const getButtonVerticalPadding = (rect: Rect) => {
  if (rect.height < buttonSize + buttonPadding * 2) {
    return Math.max(0, rect.height - buttonSize) / 2;
  }

  return buttonPadding;
};

type State =
  | { type: "empty" }
  | { type: "loading" }
  | { type: "correct" }
  | { type: "wrong"; text: DocumentFragment; count: number }
  | { type: "error"; text: string };

class Control {
  #button: HTMLButtonElement;
  #tooltip: Tooltip;

  #text: string = "";
  #result: string = "";
  #provider: Provider | null;
  #updateInterval: ReturnType<typeof setInterval> | null = null;
  #isVisible: boolean = false;
  #showButton: boolean = false;
  #applying: boolean = false;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #underlines: Underlines;
  #card: SuggestionCard;
  #glyph: string = "";
  #textObserver: MutationObserver | null = null;
  // bumped on every update, so a slower, older check can tell it was superseded
  #run = 0;

  constructor(
    public textArea: HTMLTextAreaElement | HTMLElement,
    provider: Provider | null,
  ) {
    this.#provider = provider;
    this.#underlines = new Underlines(textArea);
    this.#card = new SuggestionCard(
      (hunk) => this.#applyHunks([hunk]),
      (hunk) => this.#underlines.setActive(hunk),
      (word) => void addToDictionary(word),
      (hunk) => void ignoreChange(changeOf(this.#text, hunk)),
    );
    document.addEventListener("mousemove", this.#handleMouseMove, { passive: true });
    // capture: scrolls inside any container move the text too
    window.addEventListener("scroll", this.#handleScroll, { capture: true, passive: true });
    this.#button = document.createElement("button");
    this.#button.type = "button";
    this.#button.className = "aig-root aig-trigger";
    this.#button.style.zIndex = "2147483647";
    this.#setGlyph(spinnerIcon, "Checking grammar");
    document.body.appendChild(this.#button);
    this.#tooltip = new Tooltip(this.#button);

    const theme = themeFor(textArea);
    for (const el of [
      this.#button,
      this.#tooltip.element,
      this.#card.element,
      this.#underlines.element,
    ]) {
      el.dataset.theme = theme;
    }

    this.updatePosition();

    this.#button.addEventListener("mouseenter", () => this.#showTooltip());
    this.#button.addEventListener("mouseleave", () => this.#hideTooltip());
    this.#button.addEventListener("focus", () => this.#showTooltip());
    this.#button.addEventListener("blur", () => this.#hideTooltip());

    const tooltip = this.#tooltip.element;
    tooltip.addEventListener("mouseenter", () => this.#showTooltip());
    tooltip.addEventListener("mouseleave", () => this.#hideTooltip());
    // keep focus and selection in the input while clicking suggestions
    tooltip.addEventListener("mousedown", (e) => e.preventDefault());

    this.#updateInterval = setInterval(() => {
      control?.updatePosition();
    }, 60);

    // some editors (Notion) apply deletions themselves without firing "input"
    if (!(textArea instanceof HTMLTextAreaElement)) {
      this.#textObserver = new MutationObserver(() => {
        if (!this.#applying && this.#readText() !== this.#text) {
          this.update();
        }
      });
      this.#textObserver.observe(textArea, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    }
  }

  #showTooltip() {
    clearTimeout(this.#hideTimer);
    if (this.#isCorrect) {
      return;
    }
    this.#tooltip.show();
  }

  // delayed so the pointer can travel from the button to the tooltip
  #hideTooltip() {
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => this.#tooltip.hide(), 200);
  }

  #handleMouseMove = (e: MouseEvent) => {
    if (this.#card.contains(e.target)) {
      this.#card.keep();
      return;
    }
    const hit = this.#underlines.at(e.clientX, e.clientY);
    if (hit) {
      const removed = this.#text.slice(hit.hunk.start, hit.hunk.end);
      this.#card.show(hit.hunk, removed, hit.rect);
    } else {
      this.#card.scheduleHide();
    }
  };

  #handleScroll = () => {
    this.#underlines.draw();
    this.#card.hide();
  };

  #setState(state: State) {
    debug("state", state.type, state.type === "error" ? state.text : "");
    // offsets are only valid for the text they were computed on
    if (state.type !== "wrong") {
      this.#underlines.clear();
      this.#card.hide();
    }

    this.#button.dataset.state = state.type;
    this.#button.removeEventListener("click", this.#handleWrongClick);
    this.#button.removeEventListener("click", this.#handleErrorClick);

    switch (state.type) {
      case "empty":
        this.#hide();
        clearTimeout(this.#hideTimer);
        this.#tooltip.hide();
        return;
      case "loading":
        this.#show();
        this.#setGlyph(spinnerIcon, "Checking grammar");
        this.#tooltip.content = { title: "Checking…", body: "" };
        return;
      case "correct":
        this.#show();
        this.#setGlyph(checkIcon, "No suggestions");
        clearTimeout(this.#hideTimer);
        this.#tooltip.hide();
        return;
      case "wrong": {
        const title = `${state.count} ${state.count === 1 ? "suggestion" : "suggestions"}`;
        this.#show();
        this.#setGlyph(
          `<span class="aig-count">${state.count}</span>`,
          `${title}, click to accept all`,
        );
        this.#tooltip.content = {
          title,
          body: state.text,
          action: { label: "Accept all", onClick: this.#handleWrongClick },
        };
        this.#button.addEventListener("click", this.#handleWrongClick);
        return;
      }
      case "error":
        this.#show();
        this.#setGlyph(powerIcon, "Grammar check unavailable");
        this.#tooltip.content = {
          title: "Grammar check unavailable",
          body: state.text,
          muted: true,
          action: { label: "Open docs", onClick: this.#handleErrorClick },
        };
        this.#button.addEventListener("click", this.#handleErrorClick);
        return;
    }
  }

  // skipped when unchanged, so the glyph's entrance doesn't replay on every keystroke
  #setGlyph(html: string, label: string) {
    this.#button.ariaLabel = label;
    if (this.#glyph === html) {
      return;
    }
    this.#glyph = html;
    this.#button.innerHTML = `<span class="aig-glyph">${html}</span>`;
  }

  #readText() {
    return this.textArea instanceof HTMLTextAreaElement
      ? this.textArea.value
      : this.textArea.innerText;
  }

  public async update() {
    // our own edits fire input events; the result is still valid, no need to re-query
    if (this.#applying) {
      return;
    }

    const text = this.#readText();
    const run = ++this.#run;

    this.#text = text;

    this.updatePosition();

    if (!this.#provider) {
      this.#setState({
        type: "error",
        text: "AI is not supported. Please enable it in your browser settings.",
      });
      return;
    }

    const { before, core, after } = splitCheckable(text);

    // rarely works with single words
    if (core.split(/\s+/).length < 2) {
      this.#setState({ type: "empty" });
      return;
    }

    this.#setState({ type: "loading" });

    // wait for a typing pause instead of querying the model on every keystroke
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (run !== this.#run || this.#text !== text) {
      return;
    }

    const result = await resultFromPromise(this.#provider.fixGrammar(core, settings));

    if (run !== this.#run || this.#text !== text) {
      return;
    }

    if (!result.ok) {
      const error = result.error as any;
      console.warn(error);
      // the extension was reloaded or updated after this tab loaded; this script is orphaned
      if (!chrome.runtime?.id) {
        this.#setState({
          type: "error",
          text: "The extension was updated. Reload this page to check your text again.",
        });
        return;
      }
      const message = error?.message ?? error?.toString();
      this.#setState({
        type: "error",
        text:
          "Something went wrong. Please try again." +
          (message ? ` (${message})` : ""),
      });
      return;
    }

    this.#result =
      before + keepUserText(core, result.value.trim(), settings.dictionary, settings.ignored) + after;
    this.#showResult();
  }

  #showResult() {
    if (this.#isCorrect) {
      this.#setState({ type: "correct" });
    } else {
      const hunks = diffHunks(this.#text, this.#result);
      this.#setState({
        type: "wrong",
        text: createDiff(this.#text, this.#result, (hunk) =>
          this.#applyHunks([hunk]),
        ),
        count: hunks.length,
      });
      this.#card.hide();
      this.#underlines.set(this.#text, hunks);
    }
  }

  // Drops suggestions on words just added to the dictionary or on changes just ignored,
  // without a new model call.
  public refresh() {
    if (this.#button.dataset.state === "wrong") {
      this.#result = keepUserText(this.#text, this.#result, settings.dictionary, settings.ignored);
      this.#showResult();
    }
  }

  #applyHunks(hunks: Hunk[]) {
    this.#applying = true;
    try {
      // from the end, so earlier offsets stay valid
      for (const hunk of [...hunks].sort((a, b) => b.start - a.start)) {
        replaceText(this.textArea, hunk);
      }
    } finally {
      this.#applying = false;
    }
    this.#text = this.#readText();
    this.#showResult();
  }

  public updatePosition() {
    computePosition(this.textArea, this.#button, {
      placement: "bottom-end",
      middleware: [
        offset((state) => ({
          mainAxis:
            -getButtonVerticalPadding(state.rects.reference) - buttonSize,
          crossAxis: -buttonPadding,
        })),
      ],
    }).then(({ x, y }) => {
      Object.assign(this.#button.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    this.#isVisible = isVisible(this.#button, this.textArea);
    this.#updateButtonVisibility();
    this.#underlines.draw();
  }

  #handleErrorClick = () => {
    window
      .open(
        "https://github.com/florianlauer/ai-grammar#troubleshooting",
        "_blank",
      )
      ?.focus();
  };

  #handleWrongClick = () => {
    if (!this.#result || this.#isCorrect) {
      return;
    }
    this.#applyHunks(diffHunks(this.#text, this.#result));
  };

  #updateButtonVisibility() {
    if (this.#isVisible && this.#showButton) {
      this.#button.style.opacity = "1";
      this.#button.style.pointerEvents = "auto";
    } else {
      this.#button.style.opacity = "0";
      this.#button.style.pointerEvents = "none";
    }
  }

  #show() {
    this.#showButton = true;
    this.#updateButtonVisibility();
  }

  #hide() {
    this.#showButton = false;
    this.#updateButtonVisibility();
  }

  get #isCorrect() {
    return this.#text === this.#result;
  }

  destroy() {
    this.#textObserver?.disconnect();
    this.#button.remove();
    this.#tooltip.destroy();
    this.#underlines.destroy();
    this.#card.destroy();
    document.removeEventListener("mousemove", this.#handleMouseMove);
    window.removeEventListener("scroll", this.#handleScroll, { capture: true });
    clearTimeout(this.#hideTimer);
    if (this.#updateInterval) {
      clearInterval(this.#updateInterval);
    }
  }

  isSameElement(el: EventTarget | null) {
    return this.textArea === el || this.#button == el;
  }
}

let control: Control | null = null;

const logSkipped = (target: EventTarget, event: string) => {
  if (target instanceof HTMLElement) {
    debug(`${event}: not a checked field`, describe(target), {
      contentEditable: target.contentEditable,
      spellcheck: target.spellcheck,
    });
  }
};

const siteDisabled = () => settings.disabledSites.includes(location.hostname);

const inputListener = (provider: Provider | null) => async (e: Event) => {
  const target = e.target;
  if (siteDisabled()) {
    return;
  }

  if (!target || !isTextArea(target)) {
    if (target) logSkipped(target, "input");
    return;
  }

  const unit = checkUnit(target);
  if (!unit) {
    return;
  }

  if (unit === control?.textArea) {
    control.update();
    return;
  }

  control?.destroy();

  debug("input: checking", describe(unit));
  control = new Control(unit, provider);
  control.update();
};

const focusListener = (provider: Provider | null) => async (e: Event) => {
  const target = e.target;
  if (siteDisabled()) {
    return;
  }

  if (!target || !isTextArea(target)) {
    if (target) logSkipped(target, "focus");
    return;
  }

  // the caret may not be placed yet on focus; the next input picks the block then
  const unit = checkUnit(target);
  if (!unit || control?.isSameElement(unit)) {
    return;
  }

  control?.destroy();

  debug("focus: checking", describe(unit));
  control = new Control(unit, provider);
  control.update();
};

const targets = new Set<HTMLTextAreaElement | HTMLElement>();

const updateTargets = (provider: Provider | null) => {
  for (const target of targets) {
    if (!document.body.contains(target)) {
      targets.delete(target);
    }
  }

  document
    .querySelectorAll("textarea, [contenteditable=true]")
    .forEach((el) => {
      if (targets.has(el as HTMLTextAreaElement | HTMLElement)) {
        return;
      }

      targets.add(el as HTMLTextAreaElement | HTMLElement);
      debug("watching", describe(el));

      el.addEventListener("input", inputListener(provider), true);
      el.addEventListener("focus", focusListener(provider), true);
    });
};

const main = async () => {
  settings = await loadSettings();
  onSettingsChange((next) => {
    const filtersChanged =
      JSON.stringify([next.dictionary, next.ignored]) !==
      JSON.stringify([settings.dictionary, settings.ignored]);
    settings = next;
    if (siteDisabled()) {
      control?.destroy();
      control = null;
    } else if (filtersChanged) {
      control?.refresh();
    }
  });

  const providers = [new OllamaProvider(), new GeminiProvider()];

  let provider: Provider | null = null;

  for (let p of providers) {
    if (await p.isSupported()) {
      provider = p;
      break;
    }
  }
  debug(
    "provider",
    provider instanceof OllamaProvider ? "ollama" : provider ? "chrome built-in" : "none",
  );

  const observer = new MutationObserver(() => {
    if (control?.textArea && !document.body.contains(control?.textArea)) {
      debug("checked field left the page", describe(control.textArea));
      control?.destroy();
      control = null;
    }

    updateTargets(provider);
  });
  observer.observe(document, { childList: true, subtree: true });

  updateTargets(provider);
};

main();
