# Roadmap

The next features, in order. Each one has to work with a small model on the user's machine, which rules some ideas out and shapes the rest. The grammar check stays automatic and fast. Everything heavier runs when the user asks for it.

Measured on an M2 Pro with `gemma4:e2b-it-qat`, the model the extension uses today:

| Task | Time | Result |
|---|---|---|
| Grammar check of a message (today) | 0.4 to 0.6 s | 24/24 in the [benchmark](./bench) |
| Rewrite one sentence, 3 variants (French) | 1.7 s | Clearer and shorter, meaning kept |
| Rewrite in a friendlier tone, 2 variants (English) | 1.2 s | Good, but one variant added a `[optional: brief reason]` placeholder |
| Rewrite in a more formal tone, 2 variants (French) | 1.3 s | Good |
| Make non-native English sound natural, 2 variants | 1.4 s | Good, one variant shifted the meaning slightly |
| Name the tone of a text | 0.6 s | Unreliable: "friendly, curt, curt" for a neutral message |

`qwen3.5:4b` gave similar rewrites but took 2 to 12 s, so it isn't worth the switch.

## 0. Groundwork (done)

**Options page.** Pick the Ollama model, manage the dictionary, turn the extension off per site. Settings live in `chrome.storage.sync`, so they follow the user's browser account without a server. Every item below needs a place for its settings, which is why this comes first.

## 1. Personal dictionary (done)

Words the user wants left alone: product names, jargon, "PR", "review".

- The suggestion card gets a second action, "Add to dictionary". Clicking it removes the suggestion and every other suggestion on that word.
- The options page lists the words, with add and delete.
- Two layers of protection. The prompt tells the model never to change these words. Then the extension drops any suggestion that touches one of them before showing it, because a small model doesn't follow instructions every time. The filter is what guarantees the behavior.
- Matching is case sensitive by default ("Sencrop" is protected, "sencrop" is still a typo).

## 2. Dismiss and remember (done)

- The card gets "Ignore". The extension remembers the exact change the user refused ("review" → "révision") and never suggests it again, on any site. It stores the whole word around the change, so refusing one inserted comma doesn't refuse every comma.
- Ignored changes show up in the options page, where the user can bring one back.
- A few style preferences the model can't guess from one message: French "tu" or "vous", US or UK English, and whether informal words like "du coup" count as mistakes. They go into the prompt. gemma4 ignored a plain "replace informal words" rule and only followed it once the prompt gave examples ("du coup" → "donc").

Unlimited suggestions come for free: there is no server, no account and no quota.

## 3. Rewrite a sentence (done)

On demand, never while typing: 1.7 s per sentence is fine after a click and too slow to run on every pause.

- Rewrites are a new kind of suggestion: optional, and a matter of taste. They get their own color and their own label in the panel ("Fixes" and "Rewrites"), so the user can tell "this is wrong" from "this could be better" at a glance. This was planned as groundwork, and moved here because a second kind has nothing to tell apart until rewrites exist.
- Selecting text shows a small "Rewrite" button next to the selection. Clicking it opens a card with 3 variants. Clicking a variant replaces the selection, and the edit stays undoable like the fixes are.
- Sentences longer than about 30 words get a light underline in the rewrite color, found by counting words, with no model call. Hovering it offers the same card.
- Before a variant is shown, the extension checks it. It must keep the numbers, names, URLs and dictionary words of the original, stay in the same language, and contain no brackets the original didn't have. Variants that fail are dropped. If none pass, the card says so.
- The benchmark gets a rewrite set that grades exactly these rules.

What shipping it taught:

- The prompt has to name the language. "Keep the original language" still got a French sentence translated to English, and "a French text gets French versions" turned an English one into French. The extension now counts common French and English words and writes "The text is in French" into the prompt.
- A selection is often part of a sentence. The model gets the words before and after it, and the extension trims what small models add anyway: the word just before repeated, a capital, a final full stop. A selection that cuts a word is widened to the whole word.
- Hovering a long sentence only offers a rewrite. Running the model on hover would start it every time the pointer crosses the text.
- `bench/rewrite-bench.mjs`: gemma4 kept 30 of 30 variants on 10 texts with a 1.5 s median. qwen3.5:4b kept 28, losing two to "dix" for "10", and took 2.7 s.

## 4. Change the tone

The same selection card, with presets instead of free rewrites: "More formal", "Friendlier", "More confident", "Shorter". The presets also apply to the whole field from the panel.

- On the Chrome built-in path, Chrome's Rewriter API covers "More formal", "More casual", "Shorter" and "Longer". It is still an origin trial (Chrome 137 to 148), so it only helps once it ships.
- The tone meter, a label saying how the text sounds, waits for a benchmark. The measured result above is not good enough to show to anyone. If a single scale from casual to formal turns out reliable, that ships instead of a list of tones.

## 5. Natural English

For people writing in English as a second language. It is the tone card with one more preset, "More natural", and a prompt that says the writer isn't a native speaker and should keep their meaning.

- The prompt also asks for false friends, words that look like the writer's language but mean something else in English, such as "actually" for "actuellement". The browser's language tells the extension which language to watch for.
- On demand only, like the other rewrites. A passive mode that flags unnatural sentences while typing would cost a model call per sentence per pause. It stays out until the model is fast enough.

## Not planned

**Plagiarism check.** Finding copied text means comparing it with the web and with publication databases. That requires sending the text to a server, which breaks the extension's main promise: nothing leaves the machine.

**Detecting AI-written text.** The reliable methods score how predictable the text is under one or two language models, token by token (for example [Binoculars](https://arxiv.org/abs/2401.12070)). That needs the model's probabilities for a text you give it. Ollama only returns probabilities for the text it generates, so this can't be built on it today. Asking the model to judge instead gives confident, wrong answers, and a wrong "this was written by AI" can hurt the person who wrote it. This gets another look if a local runtime starts exposing probabilities for input text.
