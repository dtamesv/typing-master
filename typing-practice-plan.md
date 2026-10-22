# Typing Practice Web App — Plan

## Overview
A front-end-only touch-typing practice app using vanilla HTML, CSS and JS (no libraries, no build step, no server).
The user picks a predefined text from a list, types it in a "document" area where the target text is shown faded behind
the typed characters, gets live per-character colour feedback, and sees a results summary when finished.

Workspace is empty (greenfield). Planned files:
- `index.html` — markup for the three views (text selection, practice, results)
- `style.css` — layout, theme, character state colours
- `texts.js` — `const TEXTS = [{ id, title, text }, ...]`, loaded via `<script>` so it works with `file://` (double-click to open)
- `app.js` — view switching, typing engine, metrics

## Confirmed design decisions
- Texts live in `texts.js` (JS array, not fetched JSON) so the app runs by opening `index.html` directly.
- Target text is displayed faded with a caret; typed characters overlay and are coloured:
  - green = correct on first attempt
  - red = currently wrong
  - yellow = was wrong, erased with backspace, then typed correctly
- Typing is NOT blocked by wrong characters; Backspace deletes the last typed character.
- Session timer starts on first keystroke; session ends when the number of typed characters equals the text length.
- Results: net WPM, raw WPM, accuracy, elapsed time, error count, corrected-error count; buttons Retry and Back to list.
- Accuracy = characters correct on first attempt ÷ total characters.
- WPM convention: 1 word = 5 characters. Net WPM = (correct final characters / 5) / minutes; raw WPM = (total typed keystrokes for characters / 5) / minutes.

## Sub-Tasks

### 1. Project scaffold, text data and selection view
- **Intent**: Create the static skeleton and the entry screen where the user chooses a text.
- **Expected Outcomes**: Opening `index.html` shows a list/cards of the predefined texts (title + short preview/length); clicking one switches to the practice view (placeholder is fine at this stage).
- **Todo List**:
  1. Create `texts.js` with ~4–6 varied texts (short sentence, home-row drills, paragraph, punctuation/numbers).
  2. Create `index.html` with three sections (`#select-view`, `#practice-view`, `#results-view`) and script tags for `texts.js` then `app.js`.
  3. Create `style.css` with base layout/typography (monospace font for the practice area) and view show/hide helper.
  4. Create `app.js` that renders the list from `TEXTS` and handles view switching.
- **Relevant Context**: New files only; `texts.js` must be loaded before `app.js`.
- **Status**: [x] done

#### Context notes for Sub-task 2
- **Element IDs in `index.html`**:
  - `#practice-area` — the focusable `div` (has `tabindex="0"`); attach `keydown` listener here.
  - `#char-display` — contains all `<span class="ch …">` character nodes; query with `charDisplay.children`.
  - `#practice-progress` — update text to `"n / total"` as the user types.
  - `#practice-timer` — update text with `formatTime(elapsed)` every tick.
- **Functions already in `app.js`**:
  - `showView(name)` — switches between `'select'`, `'practice'`, `'results'`.
  - `renderCharSpans(text)` — builds `<span class="ch pending" data-index="i">` nodes; first span has `.current`.
  - `startPractice(entry)` — calls `renderCharSpans`, updates header, focuses `#practice-area`.
  - `showResults(metrics)` — expects `{ netWpm, rawWpm, accuracy, elapsed, errors, corrected }`.
  - `formatTime(ms)` — formats milliseconds as `m:ss`.
  - `escHtml(str)` — HTML-escape helper.
  - `state.currentText` — holds the active `{ id, title, text }` object.
- **CSS classes for character spans** (already defined in `style.css`):
  - `.ch.pending`, `.ch.correct`, `.ch.wrong`, `.ch.corrected`, `.ch.current` (caret).
- **Input strategy**: listen for `keydown` on `#practice-area`; intercept `Backspace` and printable characters; ignore modifier combos.

### 2. Practice view and typing engine
- **Intent**: Implement the core typing experience with live per-character feedback.
- **Expected Outcomes**: Selected text renders as per-character spans (faded). Typing colours characters green/red/yellow as specified; Backspace works; caret shows current position; timer starts on first key; session ends automatically at text end.
- **Todo List**:
  1. Render target text as one `<span>` per character (preserve spaces/newlines visibly, e.g. wrapping with `white-space: pre-wrap`).
  2. Capture input via a hidden/focused `textarea` (or keydown on the document area) so the whole area is click-to-focus; ignore modifier combos; handle Backspace, printable characters and Enter if texts contain newlines.
  3. Maintain state per character: `typed` char, `status` (pending / correct / wrong / corrected) and a `hadError` flag that is set when a position is typed wrong, so a later correct entry at that position becomes yellow.
  4. Track counters: total keystrokes, first-attempt correct, errors made, errors corrected; record start time on first key and end time on completion.
  5. Show caret on the next character; show a live header (elapsed time / progress) and an Esc / "Back" control to abandon the session.
  6. Add CSS classes for `.pending`, `.correct`, `.wrong`, `.corrected`, `.current` (caret).
- **Relevant Context**: `app.js` (engine), `style.css` (state colours), `index.html` (`#practice-view`).
- **Status**: [x] done

#### Context notes for Sub-task 3
- **Only `app.js` changed** in Sub-task 2 (no HTML/CSS changes were needed). Span text now uses regular spaces (not `\u00a0`); `white-space: pre-wrap` keeps them visible and wrappable.
- **`state` fields** (all reset in `startPractice`): `typed[]` (chars typed so far), `hadError[]`, `attempted[]`, `correctedCounted[]` (per-position booleans), `keystrokes` (char keystrokes, Backspace excluded), `firstAttemptCorrect`, `errors` (wrong chars typed), `corrected` (positions wrong → backspaced → typed correctly, counted once per position), `startTime`, `timerId`, `finished`.
- **Engine functions in `app.js`**: `typeChar(ch)`, `deleteChar()`, `startTimer()`, `stopTimer()`, `abandonPractice()` (Esc / Back button; stops timer, returns to select view), `updateCaret(i)`, `setCharStatus(i, status)`, `finishPractice()`.
- **Keydown handler** on `#practice-area`: Esc abandons; ctrl/meta combos ignored; Backspace → `deleteChar`; Enter → `typeChar('\n')`; single-char keys → `typeChar`. Ignored once `state.finished`.
- **`finishPractice()` currently computes metrics inline** (basic version) and calls `showResults({ netWpm, rawWpm, accuracy, elapsed, errors, corrected })`. Sub-task 3 should extract these into pure functions (e.g. `calcNetWpm`, `calcRawWpm`, `calcAccuracy`) and have `finishPractice` call them. Current formulas: net = round((final correct chars/5)/minutes); raw = round((state.keystrokes/5)/minutes); accuracy = round(firstAttemptCorrect/length*100). Zero-time is guarded via `minutes > 0`.
- **Reset**: `startPractice(entry)` fully resets state and stops any running timer, so Retry (`btnRetry` → `startPractice(state.currentText)`) already works; verify only.
- **Verified** via a Node DOM-stub simulation: green/red/yellow transitions, Backspace, counters (errors, corrected, firstAttemptCorrect) and completion → `showResults`. Not yet checked in a real browser.

### 3. Results view and metrics
- **Intent**: Show performance summary after completion and allow repeating or choosing another text.
- **Expected Outcomes**: On completion, results view shows net WPM, raw WPM, accuracy %, time, errors, corrected errors; Retry restarts the same text; Back to list returns to selection.
- **Todo List**:
  1. Implement metric calculations as pure functions (net WPM, raw WPM, accuracy) using the definitions above; guard against zero time.
  2. Render results in `#results-view` with Retry and Back buttons.
  3. Ensure state is fully reset between sessions.
- **Relevant Context**: `app.js` metrics functions, `#results-view` in `index.html`.
- **Status**: [x] done

#### Context notes for Sub-task 4
- **Only `app.js` changed** in Sub-task 3 (no HTML/CSS changes; existing `#results-view`, `.results-stats`, `.results-stat-card`, `.results-actions` markup/styles were reused).
- **Pure metric functions** (no DOM/state access) in `app.js`: `countCorrectFinal(typed, target)`, `calcNetWpm(correctChars, elapsedMs)`, `calcRawWpm(keystrokes, elapsedMs)`, `calcAccuracy(firstAttemptCorrect, totalChars)`. Each returns `0` when elapsed time / total chars is not > 0 (zero-time guard); results are rounded integers. `finishPractice()` now just calls these and passes `{ netWpm, rawWpm, accuracy, elapsed, errors, corrected }` to `showResults`.
- **Results view**: `showResults(metrics)` fills `#results-text-title` and `#results-stats` with six stat cards: Net WPM, Raw WPM, Accuracy (%), Time (`m:ss`), Errors, Corrected errors. `#btn-retry` → `startPractice(state.currentText)`; `#btn-back-results` → `showView('select')`.
- **State reset**: `startPractice` stops the timer and resets every `state` field and the DOM spans/header, so Retry and re-selecting a text start clean. `abandonPractice` stops the timer and sets `finished = true`.
- **Verified** via a Node DOM-stub simulation (two consecutive sessions, Retry, Back to list, abandon): state fully resets, views switch correctly, accuracy/errors/corrected values correct, metric functions return 0 for zero time. Not yet checked in a real browser.
- **Known quirks to check in Sub-task 4**: if the whole text is typed in an extremely short time (e.g. scripted), elapsed ≈ 0 → WPM shows 0 (by design); a very short but non-zero time can yield very large WPM. Results stat card labels are long-ish ("Corrected errors") — check layout on narrow screens. `README.md` still doesn't exist; `style.css` has not been polished (caret blink, contrast, responsive).

### 4. Polish and manual verification
- **Intent**: Make the app pleasant and verify behaviour across edge cases.
- **Expected Outcomes**: Responsive, clean styling; no console errors; behaviours verified manually.
- **Todo List**:
  1. Style refinements (colours with sufficient contrast, readable font size, caret blink, responsive width).
  2. Manually verify: correct typing; wrong then backspace then correct (yellow); wrong left uncorrected (red, counts against net WPM); backspace at position 0 is a no-op; retry/back reset state; opening via `file://` works.
  3. Add a short `README.md` explaining how to run and how to add new texts to `texts.js`.
- **Relevant Context**: All files.
- **Status**: [x] done
- **Notes**: `style.css` polished (darker pending/correct/corrected colours for contrast, `--accent-dark` for the primary button, larger practice font, focus-visible outlines, ≤520px responsive rules, caret blink disabled under `prefers-reduced-motion`). `app.js` header already described the final scope (no stale text found). `README.md` added. `node --check` passes on `app.js`/`texts.js`; no fetch/modules/external URLs. Behaviours verified via a Node DOM-stub simulation (not a real browser).
