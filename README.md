# ai-grammar

A free, open source grammar checker for Chromium browsers. It runs a language model on your own machine, so the text you type never leaves it.

This is a fork of [nucleartux/ai-grammar](https://github.com/nucleartux/ai-grammar). It works more like Grammarly: mistakes are underlined in place, one click fixes one word, and the default model is small enough to leave running all day. The [Chrome Web Store version](https://chromewebstore.google.com/detail/free-ai-grammar-checker/jnkjkpapplndagboidnhphaciphgjeca) is the upstream one and has none of these changes, so you install this fork [from a release zip or from source](#install-the-extension).

| Fix one word | Review every suggestion |
| :---: | :---: |
| ![Hover card with the fix for an underlined word](./assets/1.png) | ![Suggestions panel listing all changes](./assets/2.png) |
| Hover an underlined word, then click the green fix. | Hover the badge to see every change. Click one, or "Accept all". |

## Contents

- [What it does](#what-it-does)
- [What this fork changes](#what-this-fork-changes)
- [Requirements](#requirements)
- [Install the extension](#install-the-extension)
  - [One line agent install](#one-line-agent-install)
- [Set up a model](#set-up-a-model)
- [Using it](#using-it)
- [Troubleshooting](#troubleshooting)
- [Changing the model](#changing-the-model)
- [Benchmark](#benchmark)
- [Developing](#developing)
- [Privacy](#privacy)
- [Credits and license](#credits-and-license)

## What it does

You type in a text field. When you stop for 800 ms, the extension sends the text to a local model and asks for the smallest set of fixes: spelling, grammar, punctuation, missing accents. It keeps your language, tone and technical terms. A French Slack message about a "PR" stays French and keeps "PR".

- Free, no account, no ads.
- The model runs on your machine: [Ollama](https://ollama.com) or Chrome's built-in Gemini Nano.
- It reads whole sentences, so it catches agreement errors and homophones ("sa" / "ça", "on" / "ont") that a word-by-word spell checker misses.

## What this fork changes

- Mistakes are underlined inside the field, in both `<textarea>` and `contenteditable` elements.
- Hovering an underlined word opens a card with its fix. Clicking the fix replaces that word and nothing else.
- Hovering the badge in the corner of the field lists every suggestion. You can apply them one by one or all at once.
- Edits go through the browser's editing commands, so Cmd+Z / Ctrl+Z undoes them and frameworks like React see the change.
- The check waits until you stop typing for 800 ms instead of running on every keystroke.
- Ollama uses `gemma4:e2b-it-qat` by default. It fixed every case in the [benchmark](#benchmark), in about half a second.
- The extension asks Ollama to keep the model loaded, so checks don't pay a loading delay after a pause.
- The overlays pick a light or dark look from the text color of the field, and respect `prefers-reduced-motion`.
- The Ollama request passes a real JSON schema. Upstream passed a zod object, which recent Ollama servers reject with a 500.

## Requirements

You need one of the two model setups below. If both are available, the extension uses Ollama.

| | Ollama (recommended) | Chrome built-in AI |
| --- | --- | --- |
| Browser | Any Chromium browser that loads unpacked extensions: Chrome, Arc, Edge, Brave | Google Chrome 138 or newer. Other Chromium browsers don't ship the model |
| OS | macOS, Windows, Linux | Windows 10/11, macOS 13+, Linux, ChromeOS on Chromebook Plus |
| Memory | 8 GB of RAM at minimum, 16 GB to stop thinking about it. The model takes 3.8 GB once loaded | 16 GB of RAM and 4 CPU cores, or a GPU with more than 4 GB of VRAM |
| Disk | 4.3 GB for the model, plus Ollama itself | 22 GB free on the drive that holds your Chrome profile |
| Other | Ollama 0.34 or newer | An unmetered connection for the first model download |

The Chrome figures come from [Google's Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api#hardware-requirements). The Ollama memory figure is what `ollama ps` reports with the model loaded. The 8 GB minimum is an estimate, not a measurement.

The Ollama path is tested on a MacBook Pro M2 Pro with 32 GB of RAM, in Arc. The Chrome built-in path uses the same prompt but hasn't been tested since the fork.

## Install the extension

There are three ways. An agent can do it for you. The zip needs nothing but the browser. Building from source needs [git](https://git-scm.com) and [Node.js](https://nodejs.org) 18 or newer (the build is tested with Node 26), and is the way to go if you want to change the model or the code.

### One line agent install

If you use a coding agent with shell access (Claude Code, Codex, Cursor and the like), paste this into it:

```text
Install the ai-grammar browser extension on this machine by following https://raw.githubusercontent.com/florianlauer/ai-grammar/main/AGENT_INSTALL.md
```

The agent checks or installs Ollama, downloads the model, sets `OLLAMA_ORIGINS`, checks that Ollama accepts the extension, and unzips the latest release into `~/Extensions/ai-grammar`. It asks before installing software, using `sudo` or changing how Ollama starts. You still load the extension in the browser yourself, and the agent tells you what to click. [AGENT_INSTALL.md](./AGENT_INSTALL.md) lists every step it follows.

### From a release zip

1. Download `AI-Grammar-Checker-<version>.zip` from the [latest release](https://github.com/florianlauer/ai-grammar/releases/latest).
2. Unzip it into a folder you'll keep, for example `~/Extensions/ai-grammar`. The browser loads the extension from that folder every time it starts, so don't unzip it in Downloads and then clean Downloads up.
3. Open the extensions page of your browser: `chrome://extensions`, `arc://extensions`, `edge://extensions` or `brave://extensions`.
4. Turn on "Developer mode".
5. Click "Load unpacked" and pick the unzipped folder. It is the one that contains `manifest.json`.
6. Reload any tab that was already open. The extension only attaches to pages loaded after it.

Browsers can't install the zip itself, and an unpacked extension doesn't update on its own. To update, unzip the new release over the same folder, then click the reload icon on the extension's card.

### From source

1. Get the code and build it:

```shell
git clone https://github.com/florianlauer/ai-grammar.git
cd ai-grammar
npm install
npm run build
```

`npm install` ends with `Failed to apply patch for package @types/dom-chromium-ai`. You can ignore it. That patch only touches type definitions and the build works without it.

2. Open the extensions page of your browser and turn on "Developer mode", as in the zip steps above.
3. Click "Load unpacked" and pick the `build` folder inside the repository.
4. Reload any tab that was already open.

To update later, run `git pull && npm run build`, then click the reload icon on the extension's card.

## Set up a model

### Option A: Ollama

**1. Install Ollama.**

- macOS: download the app from [ollama.com/download](https://ollama.com/download), or `brew install ollama`.
- Windows: run the installer from [ollama.com/download](https://ollama.com/download).
- Linux:

```shell
curl -fsSL https://ollama.com/install.sh | sh
```

Check the version. You need 0.34 or newer, because older servers don't know the `gemma4` models:

```shell
ollama --version
```

**2. Download the model.**

```shell
ollama pull gemma4:e2b-it-qat
```

**3. Let the extension talk to Ollama.**

Ollama refuses requests coming from browser extensions unless their origin is listed in `OLLAMA_ORIGINS`. Without it every check fails with a 403. The variable has to be set on the process that runs the server, and how you do that depends on how you start Ollama.

<details>
<summary>macOS, with the menu bar app</summary>

```shell
launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"
```

Then quit Ollama from the menu bar and open it again. Two catches. `launchctl setenv` only reaches apps that launchd starts, so it does nothing for an `ollama serve` typed in a terminal. And it is forgotten when the Mac restarts. For a setup that survives reboots, use the LaunchAgent in step 5.

</details>

<details>
<summary>Linux, with the systemd service from the install script</summary>

```shell
sudo systemctl edit ollama.service
```

Add these lines, save, then restart the service:

```ini
[Service]
Environment="OLLAMA_ORIGINS=chrome-extension://*"
```

```shell
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

</details>

<details>
<summary>Windows</summary>

Quit Ollama from the taskbar. Open the settings, search for "environment variables", and choose "Edit environment variables for your account". Add a variable named `OLLAMA_ORIGINS` with the value `chrome-extension://*`, then start Ollama again from the Start menu.

</details>

<details>
<summary>Any OS, running <code>ollama serve</code> yourself</summary>

```shell
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

</details>

`chrome-extension://*` lets every installed extension call your local Ollama. If you'd rather allow only this one, copy its ID from the extensions page and use `chrome-extension://<id>`. The ID changes if you load the `build` folder from another path.

**4. Check that it works.**

```shell
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: chrome-extension://test" http://127.0.0.1:11434/api/tags
```

`200` means the extension will get through. `403` means `OLLAMA_ORIGINS` didn't reach the server. No answer means the server isn't running.

**5. Optional: start Ollama at login (macOS).**

The Windows app and the Linux service already start at boot.

<details>
<summary>LaunchAgent for macOS</summary>

On macOS, if you don't use the menu bar app, save this as `~/Library/LaunchAgents/com.ollama.serve.plist`. Adjust the path to `ollama` with the output of `which ollama`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ollama.serve</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/ollama</string>
    <string>serve</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_ORIGINS</key>
    <string>chrome-extension://*</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

Load it once. It will then start at every login and restart if it crashes:

```shell
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ollama.serve.plist
```

Don't run it alongside the menu bar app. Both try to use port 11434.

</details>

**About memory.** The extension asks Ollama to keep the model loaded forever (`keep_alive: -1`), which avoids a few seconds of loading after each pause. The cost is 3.8 GB of memory held while Ollama runs. To free it without stopping Ollama:

```shell
ollama stop gemma4:e2b-it-qat
```

The next check loads it again.

### Option B: Chrome built-in AI

Use Google Chrome 138 or newer on a machine that meets the [requirements](#requirements). There is nothing to install. The first check downloads Gemini Nano in the background, which can take a while. `chrome://on-device-internals` shows the model status.

### Which one the extension uses

When a page loads, the extension asks Ollama for its model list. If Ollama answers with at least one model, it uses Ollama. Otherwise it falls back to Chrome's built-in model. The choice holds until you reload the page. So if you start Ollama after opening a tab, reload that tab.

## Using it

Click into a text field and type. The badge in the bottom right corner of the field shows where things stand:

- A spinner while the model reads your text.
- A check mark when it found nothing to fix. It fades after a second or so.
- A red number when it has suggestions. The same words are underlined in the field.
- An orange icon when the check failed. Hover it to read the error.

Hover an underlined word to see its fix, and click the fix to apply it. Hover the badge to see all the changes in context. Click any change in that panel to apply only that one, or click "Accept all". Cmd+Z / Ctrl+Z undoes an applied fix.

The extension checks `<textarea>` elements and rich text editors built on `contenteditable`. It skips single-line `<input>` fields, and fields where the page turned spell checking off (`spellcheck="false"`).

## Troubleshooting

<details>
<summary>No badge appears</summary>

Reload the tab, since the extension doesn't attach to pages opened before it was installed. Then check that the field is a textarea or a rich text editor, not a single-line input, and that the site doesn't disable spell checking on it.

</details>

<details>
<summary>The badge turns orange with a 403</summary>

Ollama doesn't allow the extension's origin. Go back to [step 3](#option-a-ollama) and run the `curl` check from step 4. On macOS, a restart erases what `launchctl setenv` set.

</details>

<details>
<summary>Orange badge, "model not found"</summary>

The model isn't downloaded, or has another name. Run `ollama pull gemma4:e2b-it-qat`, or set `ollamaModel` to a model you have (see [Changing the model](#changing-the-model)).

</details>

<details>
<summary><code>ollama pull</code> fails, or Ollama doesn't know the model</summary>

Your Ollama server is older than 0.34. Update it, then quit and restart it. After a Homebrew upgrade, the old server keeps running until you restart it, and `ollama --version` warns that client and server versions differ.

</details>

<details>
<summary>Ollama is running but nothing happens</summary>

The tab was opened before Ollama started, so the extension picked Chrome's built-in model or nothing. Reload the tab.

</details>

<details>
<summary>The first check is slow</summary>

Ollama is loading the model into memory, usually a few seconds. Later checks take about half a second.

</details>

<details>
<summary>Chrome built-in AI never answers</summary>

Open `chrome://on-device-internals` and check that the model is downloaded and your device is marked eligible.

</details>

<details>
<summary>The extension wants to change a word you wrote on purpose</summary>

Small models sometimes do. Don't click that suggestion, or undo it with Cmd+Z / Ctrl+Z. If it happens often in your language, try another model with the [benchmark](#benchmark).

</details>

## Changing the model

The Ollama model name is a constant at the top of `src/contentScript/index.ts`:

```ts
const ollamaModel = "gemma4:e2b-it-qat";
```

Change it, run `npm run build`, and reload the extension. Pull the model with `ollama pull <name>` first. Run the benchmark before switching: some models rewrite whole sentences, translate jargon, or add markdown around their answer.

## Benchmark

`bench/grammar-bench.mjs` sends the extension's prompt to local Ollama models and checks each answer against the fixes it should contain, and the changes it must not make. It has two sets of French and English texts. `basic` has 14 short sentences with one or two mistakes each. `handwritten` has 10 longer messages typed fast, with missing accents, agreement errors and typos.

```shell
node bench/grammar-bench.mjs gemma4:e2b-it-qat qwen3.5:4b
CASES=handwritten node bench/grammar-bench.mjs gemma4:e2b-it-qat qwen3.5:4b
```

Each run writes `bench/report-<set>.md` with every input and every model's output, so you can judge the failures yourself. The grader accepts known valid variants, but it can still mark a correct answer as wrong.

Results on an M2 Pro with Ollama 0.34.4:

| Model | basic | handwritten | Median latency (basic / handwritten) |
|---|---|---|---|
| gemma4:e2b-it-qat | 14/14 | 10/10 | 0.40s / 0.58s |
| gemma3:4b | 11/14 | 8/10 | 0.68s / 0.97s |
| qwen3.5:4b | 11/14 | 7/10 | 0.82s / 1.14s |
| llama3.1 | 11/14 | 7/10 | 0.87s / 1.44s |
| qwen3:4b-instruct | 8/14 | 4/10 | 0.51s / 0.77s |
| ministral-3:3b | 8/14 | 4/10 | 0.45s / 0.68s |

## Developing

```shell
npm install
npm run build   # type check and build into build/
npm run fmt     # format with prettier
npm run zip     # build, then zip build/ into package/ for a release
```

- `src/contentScript/index.ts` finds text fields, calls the model, and draws the badge, the underlines and the popovers.
- `src/contentScript/overlay.css` holds the overlay styles. They are scoped under `.aig-root` so the page's CSS can't reach them.
- `src/background/index.ts` is the service worker that talks to Ollama and to Chrome's `LanguageModel` API.
- `src/manifest.ts` generates `manifest.json` through [CRXJS](https://crxjs.dev).

There is no watch mode. After each change, run `npm run build`, click the reload icon on the extension's card, and reload the test page.

To publish a release, bump `version` in `package.json`, add an entry to `CHANGELOG.md`, then:

```shell
npm run zip
gh release create v<version> package/AI-Grammar-Checker-<version>.zip --notes-file <notes>
```

## Privacy

The extension sends the text of the field you're typing in to `http://127.0.0.1:11434` (your Ollama server) or to Chrome's on-device model. Nothing else, nowhere else. It collects no data and has no analytics. See [PRIVACY.md](./PRIVACY.md).

## Credits and license

The original extension is by Igor Adrov ([nucleartux](https://github.com/nucleartux)). If you find it useful, consider [sponsoring the upstream project](https://github.com/sponsors/nucleartux). This fork keeps its MIT [license](./LICENSE).

Issues about this fork's changes go [here](https://github.com/florianlauer/ai-grammar/issues).
