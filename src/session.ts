// One field's grammar check as the user types: waits for a typing pause, drops answers to a text
// that changed since, and keeps the fixes current when the settings or the field change. No DOM,
// so the extension and the desktop app both drive it, and tests run it with a fake model.
import { check, worthChecking, type Generate } from "./check.ts";
import { diffHunks, keepUserText, longSentences, splitCheckable, type Hunk } from "./contentScript/text.ts";
import type { Settings } from "./settings.ts";

export type CheckState =
  // too little text to check
  | { type: "empty" }
  | { type: "loading" }
  | { type: "error"; error: unknown }
  // no hunks: the text is correct
  | { type: "done"; result: string; hunks: Hunk[] };

type Span = { start: number; end: number };

type Options = {
  // null when no model is available: every text is an error at once
  generate: Generate | null;
  // read when a check starts, so a settings change applies to the next one
  settings: () => Settings;
  // ms of typing pause before asking the model
  pause: number;
  onChange: () => void;
};

export class CheckSession {
  text = "";
  state: CheckState = { type: "empty" };
  // sentences over 30 words, offered for a rewrite; none without a model
  long: Span[] = [];
  // bumped on every edit, so a slower, older check can tell it was superseded
  #run = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #options: Options;

  constructor(options: Options) {
    this.#options = options;
  }

  get result() {
    return this.state.type === "done" ? this.state.result : null;
  }

  get hunks() {
    return this.state.type === "done" ? this.state.hunks : [];
  }

  // New text in the field. `keep`: a fix of ours led to it, so the last result still holds.
  edit(text: string, { keep = false } = {}) {
    this.stop();
    this.text = text;
    const { generate, settings, pause } = this.#options;
    // same part of the text as the check: no underlines in an email signature
    const { before, core } = splitCheckable(text);
    this.long = generate
      ? longSentences(core).map((r) => ({ start: r.start + before.length, end: r.end + before.length }))
      : [];
    if (!generate) {
      this.#set({ type: "error", error: new Error("No model available") });
      return;
    }
    if (keep && this.result !== null) {
      this.#done(this.result);
      return;
    }
    if (!worthChecking(text)) {
      this.#set({ type: "empty" });
      return;
    }
    this.#set({ type: "loading" });
    const run = this.#run;
    this.#timer = setTimeout(async () => {
      try {
        const result = await check({ text, settings: settings(), generate });
        if (run === this.#run) {
          this.#done(result ?? text);
        }
      } catch (error) {
        if (run === this.#run) {
          this.#set({ type: "error", error });
        }
      }
    }, pause);
  }

  // Drops fixes on words just added to the dictionary or changes just ignored, without a new check.
  refresh() {
    const { dictionary, ignored } = this.#options.settings();
    const result = this.result;
    if (result !== null) {
      const kept = keepUserText(this.text, result, dictionary, ignored);
      if (kept !== result) {
        this.#done(kept);
      }
    }
  }

  // Cancels the check under way; its answer, if any, is ignored.
  stop() {
    this.#run++;
    clearTimeout(this.#timer);
  }

  #done(result: string) {
    this.#set({ type: "done", result, hunks: diffHunks(this.text, result) });
  }

  #set(state: CheckState) {
    this.state = state;
    this.#options.onChange();
  }
}
