# CHANGELOG

## 0.7.1 [2026.09.29]

- fix: recheck when an editor changes the text without an input event (deleting in Notion), so old suggestions don't linger
- fix: a check superseded by a newer one no longer shows an "Aborted" error
- feat: check after a 500 ms typing pause instead of 800 ms
- fix: ignore typographic variants (’ vs ', « » vs "", non-breaking spaces), which looped in editors that curl quotes as you type

## 0.7.0 [2026.09.29]

- fix: check Gmail's compose window, which turns native spell checking off
- fix: in editors where the whole page is editable (Notion), check the block around the caret instead of the page
- fix: say "reload this page" when the extension was updated after the tab loaded
- fix: leave email signatures (after a `-- ` line) and blank lines out of the check
- feat: debug traces in the console with `localStorage["ai-grammar:debug"] = "1"`
- fix: the error panel's docs link points to this fork's troubleshooting section

## 0.6.0 [2026.09.28]

- feat: underline suggestions in textarea and contenteditable fields
- feat: apply one suggestion at a time from a hover card or the suggestions panel
- feat: undoable edits through the browser's editing commands
- feat: wait 800 ms after typing before checking
- feat: switch the Ollama model to gemma4:e2b-it-qat and keep it loaded
- feat: new overlay styles with light and dark themes
- feat: add an Ollama grammar benchmark in `bench/`
- fix: pass a JSON schema to Ollama's `format` (the server returned 500)

## 0.3.1 [2024.10.17]

- fix: support latest chrome version

## 0.3.0 [2024.09.24]

- feat: add Ollama support

## 0.2.5 [2024.09.13]

- fix: fix z-index

## 0.2.4 [2024.09.04]

- fix: finally fix csp

## 0.2.3 [2024.09.03]

- fix: set minimum_chrome_version

## 0.2.2 [2024.09.03]

- fix: fix csp

## 0.2.1 [2024.08.22]

- fix: change title

## 0.2.0 [2024.08.21]

- feat: update to latest version of api
- fix: adjust prompt

## 0.1.0 [2024.08.19]

- feat: add contenteditable support
- fix: adjust position of the button

## 0.0.1 [2024.08.17]

- feat: initial
- feat: generator by ![create-chrome-ext](https://github.com/guocaoyi/create-chrome-ext)
