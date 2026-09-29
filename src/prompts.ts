// Prompts, kept free of DOM and extension APIs so the benchmark sends exactly these.
import { languageOf } from "./contentScript/text.ts";
import type { Settings, Style } from "./settings.ts";

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

// Extra instructions from the settings, as a paragraph, or nothing.
const settingsRules = ({ dictionary, style }: Settings) => {
  const rules = [
    ...styleRules(style),
    dictionary.length && `Leave these words exactly as written: ${dictionary.join(", ")}.`,
  ].filter(Boolean);
  return rules.length ? `\n\n${rules.join("\n")}` : "";
};

export const grammarPrompt = (text: string, settings: Settings) =>
  `Fix the spelling, grammar and punctuation of the text below. Typos may be missing letters, apostrophes or accents: use the surrounding context to recover the intended word. Keep the original language, meaning, tone and technical terms; change as little as possible. If the text is already correct, return it unchanged.${settingsRules(settings)}\n\nText:\n${text}`;

export const rewriteSchema = {
  type: "object",
  properties: { variants: { type: "array", items: { type: "string" } } },
  required: ["variants"],
};

// The words around a part of a sentence, when only part of it is rewritten.
export type RewriteContext = { before: string; after: string };

// Naming the language matters: with "keep the original language" gemma4 translated a French
// sentence to English, and with "a French text gets French versions" it turned English into French.
export const rewritePrompt = (text: string, settings: Settings, context: RewriteContext | null = null) => {
  const language = languageOf((context?.before ?? "") + text + (context?.after ?? ""));
  const what = context ? "the part of a sentence below" : "the text below";
  return `Rewrite ${what} so it reads more clearly. Give 3 different versions.${
    language
      ? ` The text is in ${language}: write every version in ${language}.`
      : " Write every version in the language of the text."
  }${
    context
      ? " Each version replaces only this part, so it must fit between the words before and after it: don't repeat them, and don't start a new sentence."
      : ""
  } Keep the meaning, and every name, number and link. Don't add placeholders, brackets or notes. Fix any mistakes along the way.${settingsRules(settings)}\n\n${
    context ? `Before: ${context.before}\nAfter: ${context.after}\n\nPart to rewrite:` : "Text:"
  }\n${text}`;
};
