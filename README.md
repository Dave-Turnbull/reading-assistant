# Word Focus Reader

A dyslexia-friendly reading aid that highlights one word at a time in an editable text area.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Features

- **Word focus bar** — shows the current word in a large serif font with a progress bar
- **← → navigation** — click the chevron buttons or press arrow keys to move between words
- **Live highlight** — the active word is highlighted in the textarea as you type
- **Fully editable** — the textarea stays editable at all times; index adjusts as text changes
- **Hide punctuation toggle** — the ⚙ settings gear (top-left) lets you strip non-alphanumeric characters from the focused word display
- **Keyboard shortcut** — arrow keys anywhere on the page (except inside the textarea) navigate words

## How it works

- `tokenize()` splits text on whitespace — each token keeps its surrounding punctuation
- A hidden mirror div (matching the textarea's exact font/size/padding) is used to measure the pixel position of each word, so the highlight overlay can be positioned precisely
- Word index is clamped whenever text changes to avoid out-of-bounds errors
