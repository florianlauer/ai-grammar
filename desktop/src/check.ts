// The extension's grammar check and rewrites, without the DOM.
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  formalityPrompt,
  formalitySchema,
  grammarPrompt,
  rewritePrompt,
  rewriteSchema,
  tones,
  type Tone,
} from "../../src/prompts.ts";
import type { Settings } from "../../src/settings.ts";
import { keepUserText, languageOf, prepareRewrite, splitCheckable } from "../../src/contentScript/text.ts";
import { generate } from "./api.ts";

const corrected = z.object({ correctedText: z.string() });
const correctedSchema = zodToJsonSchema(corrected);
const rewriteOutput = z.object({ variants: z.array(z.string()) });
const formalityOutput = z.object({ formality: z.number().int().min(1).max(5) });

// The corrected text, or null when there's too little to check.
export const check = async ({ text, settings, channel }: { text: string; settings: Settings; channel: string }) => {
  const { before, core, after } = splitCheckable(text);
  // rarely works with single words
  if (core.split(/\s+/).length < 2) {
    return null;
  }
  const json = await generate({ channel, model: settings.model, prompt: grammarPrompt(core, settings), format: correctedSchema });
  const fixed = corrected.parse(json).correctedText.trim();
  return before + keepUserText(core, fixed, settings.dictionary, settings.ignored) + after;
};

// "More natural" is for English written as a second language.
export const tonesFor = (text: string) =>
  (Object.keys(tones) as Tone[]).filter((t) => t !== "natural" || languageOf(text) === "English");

type Field = { text: string; start: number };

// `field` is the text around the selection, when the app gives it, as the extension has it.
const prepare = ({ text, tone, field }: { text: string; tone: Tone; field?: Field | null }) =>
  prepareRewrite({ all: field?.text ?? text, start: field?.start ?? 0, text, tone });

// Makes a fixed or rewritten selection fit back in its sentence, without its spaces around.
export const fitSelection = ({ text, field }: { text: string; field?: Field | null }) =>
  prepare({ text, tone: "clearer", field }).fit;

export const rewrite = async ({
  text,
  tone,
  settings,
  field,
}: {
  text: string;
  tone: Tone;
  settings: Settings;
  field?: Field | null;
}) => {
  const { request, falseFriends, keep } = prepare({ text, tone, field });
  const json = await generate({
    channel: "rewrite",
    model: settings.model,
    prompt: rewritePrompt({ ...request, settings }),
    format: rewriteSchema,
  });
  return { variants: keep(rewriteOutput.parse(json).variants, settings.dictionary), notes: falseFriends };
};

// How formal the text sounds, 1 to 5, on its own channel so it doesn't cancel the rewrite.
export const formality = async ({ text, settings }: { text: string; settings: Settings }) => {
  const json = await generate({ channel: "meter", model: settings.model, prompt: formalityPrompt(text.trim()), format: formalitySchema });
  return formalityOutput.parse(json).formality;
};
