/* ============================================================
   app.js — Typing Practice
   Text list, view switching, typing engine, metrics and results.
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const state = {
  /** @type {{ id: string, title: string, text: string } | null} */
  currentText: null,
  /** Characters typed so far, in order (typed[i] is the char at position i). */
  typed: [],
  /** Per position: true once any wrong char has been typed there. */
  hadError: [],
  /** Per position: true once the first attempt at that position has been counted. */
  attempted: [],
  /** Per position: true once a corrected error at that position has been counted. */
  correctedCounted: [],
  keystrokes: 0,          // total character keystrokes (Backspace excluded)
  firstAttemptCorrect: 0, // positions correct on first attempt
  errors: 0,              // wrong characters typed
  corrected: 0,           // positions that were wrong and later typed correctly
  startTime: null,        // ms timestamp of first keystroke
  timerId: null,          // setInterval id
  finished: false,
};

// ── DOM refs ─────────────────────────────────────────────────
const selectView       = document.getElementById('select-view');
const practiceView     = document.getElementById('practice-view');
const resultsView      = document.getElementById('results-view');

const textList         = document.getElementById('text-list');
const practiceTitle    = document.getElementById('practice-title');
const practiceProgress = document.getElementById('practice-progress');
const practiceTimer    = document.getElementById('practice-timer');
const practiceArea     = document.getElementById('practice-area');
const typingInput      = document.getElementById('typing-input');
const charDisplay      = document.getElementById('char-display');

const btnBackPractice  = document.getElementById('btn-back-practice');
const btnRetry         = document.getElementById('btn-retry');
const btnBackResults   = document.getElementById('btn-back-results');
const resultsTextTitle = document.getElementById('results-text-title');
const resultsStats     = document.getElementById('results-stats');

// ── Theme (light / dark) ─────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');

function updateThemeToggleLabel() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggle.textContent = dark ? 'Light mode' : 'Dark mode';
}

themeToggle.addEventListener('click', function () {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  updateThemeToggleLabel();
  // Return focus to the practice area so typing can continue
  if (!practiceView.classList.contains('hidden') && !state.finished) typingInput.focus();
});

updateThemeToggleLabel();

// ── View helpers ─────────────────────────────────────────────

/**
 * Show exactly one view, hide the others.
 * @param {'select' | 'practice' | 'results'} name
 */
function showView(name) {
  if (name === 'select' && location.hash) location.hash = '';
  selectView.classList.toggle('hidden', name !== 'select');
  practiceView.classList.toggle('hidden', name !== 'practice');
  resultsView.classList.toggle('hidden', name !== 'results');
}

// ── Select view ──────────────────────────────────────────────

const filterCategory   = document.getElementById('filter-category');
const filterDifficulty = document.getElementById('filter-difficulty');
const textListEmpty    = document.getElementById('text-list-empty');

/** Fill the category filter with "All" plus every category found in TEXTS. */
function populateCategoryFilter() {
  filterCategory.innerHTML = '<option value="">All</option>';
  TEXTS.forEach(function (t) {
    const exists = Array.prototype.some.call(filterCategory.options, function (o) {
      return o.value === t.category;
    });
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = t.category;
      opt.textContent = t.category;
      filterCategory.appendChild(opt);
    }
  });
}

/** Render the TEXTS array (respecting the filters) as clickable cards into #text-list. */
function renderTextList() {
  textList.innerHTML = '';

  const levels = ['Easy', 'Medium', 'Hard'];
  const visible = TEXTS.filter(function (t) {
    return (!filterCategory.value || t.category === filterCategory.value)
      && (!filterDifficulty.value || t.difficulty === filterDifficulty.value);
  });
  textListEmpty.classList.toggle('hidden', visible.length > 0);

  const categories = [];
  visible.forEach(function (t) {
    if (categories.indexOf(t.category) === -1) categories.push(t.category);
  });

  categories.forEach(function (category) {
    const heading = document.createElement('li');
    heading.className = 'text-group-title';
    heading.textContent = category;
    textList.appendChild(heading);

    visible
      .filter(function (t) { return t.category === category; })
      .sort(function (a, b) { return levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty); })
      .forEach(renderTextCard);
  });
}

filterCategory.addEventListener('change', renderTextList);
filterDifficulty.addEventListener('change', renderTextList);

/** Append one text card (button) to #text-list. @param {object} entry */
function renderTextCard(entry) {
  const li = document.createElement('li');

  const btn = document.createElement('button');
  btn.className = 'text-card';
  btn.type = 'button';

  const preview = entry.text.length > 80
    ? entry.text.slice(0, 80) + '…'
    : entry.text;

  const wordCount = entry.text.trim().split(/\s+/).length;

  btn.innerHTML =
    '<span class="text-card-title">' + escHtml(entry.title) +
      ' <span class="badge badge-' + escHtml(entry.difficulty.toLowerCase()) + '">' + escHtml(entry.difficulty) + '</span></span>' +
    '<span class="text-card-meta">' + wordCount + ' words · ' + entry.text.length + ' characters</span>' +
    '<span class="text-card-preview">' + escHtml(preview) + '</span>';

  btn.addEventListener('click', function () {
    startPractice(entry);
  });

  li.appendChild(btn);
  textList.appendChild(li);
}

// ── Practice view ─────────────────────────────────────────────

/**
 * Enter the practice view for the given text entry and reset all session state.
 * @param {{ id: string, title: string, text: string }} entry
 */
function startPractice(entry) {
  stopTimer();

  state.currentText         = entry;
  state.typed               = [];
  state.hadError            = new Array(entry.text.length).fill(false);
  state.attempted           = new Array(entry.text.length).fill(false);
  state.correctedCounted    = new Array(entry.text.length).fill(false);
  state.keystrokes          = 0;
  state.firstAttemptCorrect = 0;
  state.errors              = 0;
  state.corrected           = 0;
  state.startTime           = null;
  state.finished            = false;

  practiceTitle.textContent    = entry.title;
  practiceProgress.textContent = '0 / ' + entry.text.length;
  practiceTimer.textContent    = '0:00';

  renderCharSpans(entry.text);

  showView('practice');
  location.hash = entry.id; // remembered across reloads

  // Focus the practice area so keydown events fire immediately
  typingInput.value = '';
  typingInput.focus();
}

/**
 * Render each character in `text` as a <span class="ch pending">.
 * The first span also gets the `.current` class (caret position).
 * @param {string} text
 */
function renderCharSpans(text) {
  charDisplay.innerHTML = '';

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'ch pending' + (i === 0 ? ' current' : '');
    span.dataset.index = String(i);
    // Regular spaces are preserved by `white-space: pre-wrap` and allow line wrapping
    span.textContent = text[i];
    charDisplay.appendChild(span);
  }
}

// ── Typing engine ─────────────────────────────────────────────

/** Start the elapsed-time ticker (called on first keystroke). */
function startTimer() {
  state.startTime = Date.now();
  state.timerId = setInterval(function () {
    practiceTimer.textContent = formatTime(Date.now() - state.startTime);
  }, 250);
}

/** Stop the elapsed-time ticker if running. */
function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

/** Abandon the current session and return to the selection view. */
function abandonPractice() {
  stopTimer();
  state.finished = true;
  showView('select');
}

/**
 * Move the caret class to the span at `index` (if it exists).
 * @param {number} index
 */
function updateCaret(index) {
  const old = charDisplay.querySelector('.ch.current');
  if (old) old.classList.remove('current');
  const next = charDisplay.children[index];
  if (next) next.classList.add('current');
}

/** Make whitespace characters visible when shown as a mistake marker. */
function visibleChar(ch) {
  if (ch === ' ') return '\u2423';   // ␣
  if (ch === '\n') return '\u21B5';  // ↵
  if (ch === '\t') return '\u21E5';  // ⇥
  return ch;
}

/**
 * Set the colour-state class of the span at `index`, keeping other classes intact.
 * For 'wrong', the span shows the typed character with the expected one (smaller) above it.
 * @param {number} index
 * @param {'pending' | 'correct' | 'wrong' | 'corrected'} status
 * @param {string} [typedCh] typed character (only used for 'wrong')
 */
function setCharStatus(index, status, typedCh) {
  const span = charDisplay.children[index];
  const expected = state.currentText.text[index];
  span.classList.remove('pending', 'correct', 'wrong', 'corrected', 'wrong-tab');
  span.classList.add(status);
  delete span.dataset.typed;
  if (status === 'wrong' && expected === '\t') {
    // Keep the real tab in the span (so its width is preserved) and draw the typed char over it via CSS
    span.textContent = expected;
    span.classList.add('wrong-tab');
    span.dataset.typed = visibleChar(typedCh);
    span.dataset.expected = visibleChar(expected);
  } else if (status === 'wrong') {
    // Keep the line break when a newline was expected, so the layout doesn't shift
    span.textContent = visibleChar(typedCh) + (expected === '\n' ? '\n' : '');
    span.dataset.expected = visibleChar(expected);
  } else {
    span.textContent = expected;
    delete span.dataset.expected;
  }
}

/** Handle a printable character keystroke. @param {string} ch */
function typeChar(ch) {
  const text = state.currentText.text;
  const i = state.typed.length;
  if (i >= text.length) return;

  if (state.startTime === null) startTimer();

  state.typed.push(ch);
  state.keystrokes++;

  if (ch === text[i]) {
    if (state.hadError[i]) {
      setCharStatus(i, 'corrected');
      if (!state.correctedCounted[i]) {
        state.correctedCounted[i] = true;
        state.corrected++;
      }
    } else {
      setCharStatus(i, 'correct');
      if (!state.attempted[i]) state.firstAttemptCorrect++;
    }
  } else {
    state.hadError[i] = true;
    state.errors++;
    setCharStatus(i, 'wrong', ch);
  }
  state.attempted[i] = true;

  updateCaret(i + 1);
  practiceProgress.textContent = state.typed.length + ' / ' + text.length;

  if (state.typed.length === text.length) finishPractice();
}

/** Handle Backspace: delete the last typed character (no-op at position 0). */
function deleteChar() {
  if (state.typed.length === 0) return;
  state.typed.pop();
  const i = state.typed.length;
  setCharStatus(i, 'pending');
  updateCaret(i);
  practiceProgress.textContent = i + ' / ' + state.currentText.text.length;
}

// ── Metrics (pure functions: no DOM / state access) ───────────

/**
 * Count positions where the typed character matches the target.
 * @param {string[]} typed
 * @param {string} target
 * @returns {number}
 */
function countCorrectFinal(typed, target) {
  let n = 0;
  for (let i = 0; i < target.length; i++) {
    if (typed[i] === target[i]) n++;
  }
  return n;
}

/**
 * Net WPM = (correct final characters / 5) / minutes. Returns 0 if elapsed <= 0.
 * @param {number} correctChars
 * @param {number} elapsedMs
 * @returns {number}
 */
function calcNetWpm(correctChars, elapsedMs) {
  if (!(elapsedMs > 0)) return 0;
  return Math.round((correctChars / 5) / (elapsedMs / 60000));
}

/**
 * Raw WPM = (typed character keystrokes / 5) / minutes. Returns 0 if elapsed <= 0.
 * @param {number} keystrokes
 * @param {number} elapsedMs
 * @returns {number}
 */
function calcRawWpm(keystrokes, elapsedMs) {
  if (!(elapsedMs > 0)) return 0;
  return Math.round((keystrokes / 5) / (elapsedMs / 60000));
}

/**
 * Accuracy % = characters correct on first attempt / total characters. Returns 0 if total <= 0.
 * @param {number} firstAttemptCorrect
 * @param {number} totalChars
 * @returns {number}
 */
function calcAccuracy(firstAttemptCorrect, totalChars) {
  if (!(totalChars > 0)) return 0;
  return Math.round((firstAttemptCorrect / totalChars) * 100);
}

/** End the session, compute metrics and show results. */
function finishPractice() {
  stopTimer();
  state.finished = true;

  const text = state.currentText.text;
  const elapsed = Date.now() - state.startTime;

  showResults({
    netWpm: calcNetWpm(countCorrectFinal(state.typed, text), elapsed),
    rawWpm: calcRawWpm(state.keystrokes, elapsed),
    accuracy: calcAccuracy(state.firstAttemptCorrect, text.length),
    elapsed: elapsed,
    errors: state.errors,
    corrected: state.corrected,
  });
}

// Click anywhere in the practice area to (re)focus the hidden input
practiceArea.addEventListener('click', function () {
  typingInput.focus();
});

// Special keys are handled here; regular and dead-key characters arrive via the input events below
typingInput.addEventListener('keydown', function (e) {
  if (state.finished || !state.currentText) return;
  if (e.isComposing || e.keyCode === 229) return; // mid-composition (e.g. after a dead key)

  if (e.key === 'Escape') {
    e.preventDefault();
    abandonPractice();
    return;
  }
  if (e.ctrlKey || e.metaKey) return; // leave browser/OS shortcuts alone

  if (e.key === 'Backspace') {
    e.preventDefault();
    deleteChar();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    typeChar('\n');
  } else if (e.key === 'Tab') {
    e.preventDefault(); // keep focus in the practice area
    typeChar('\t');
  }
});

/** Type every character currently in the hidden input, then clear it. */
function flushTypingInput() {
  const chars = Array.from(typingInput.value);
  typingInput.value = '';
  if (state.finished || !state.currentText) return;
  chars.forEach(function (ch) {
    if (!state.finished) typeChar(ch);
  });
}

typingInput.addEventListener('input', function (e) {
  if (e.isComposing) return; // wait for compositionend
  flushTypingInput();
});

typingInput.addEventListener('compositionend', flushTypingInput);

// ── Results view ──────────────────────────────────────────────

/**
 * Populate and show the results view.
 * @param {{ netWpm: number, rawWpm: number, accuracy: number,
 *            elapsed: number, errors: number, corrected: number }} metrics
 */
function showResults(metrics) {
  resultsTextTitle.textContent = state.currentText
    ? state.currentText.title
    : '';

  resultsStats.innerHTML = buildStatCard('Net WPM',         metrics.netWpm)
    + buildStatCard('Raw WPM',         metrics.rawWpm)
    + buildStatCard('Accuracy',        metrics.accuracy + '%')
    + buildStatCard('Time',            formatTime(metrics.elapsed))
    + buildStatCard('Errors',          metrics.errors)
    + buildStatCard('Corrected errors', metrics.corrected);

  showView('results');
}

/**
 * Build the HTML for a single result stat card.
 * @param {string} label
 * @param {string | number} value
 * @returns {string}
 */
function buildStatCard(label, value) {
  return '<div class="results-stat-card">' +
           '<dt>' + escHtml(label) + '</dt>' +
           '<dd>' + escHtml(String(value)) + '</dd>' +
         '</div>';
}

// ── Utility ───────────────────────────────────────────────────

/**
 * Escape a string for safe insertion as HTML text.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a duration in milliseconds as m:ss.
 * @param {number} ms
 * @returns {string}
 */
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ── Button wiring ─────────────────────────────────────────────

btnBackPractice.addEventListener('click', abandonPractice);

btnRetry.addEventListener('click', function () {
  if (state.currentText) {
    startPractice(state.currentText);
  }
});

btnBackResults.addEventListener('click', function () {
  showView('select');
});

// Keep the view in sync when the hash changes (browser Back/Forward, manual edit)
window.addEventListener('hashchange', function () {
  const entry = TEXTS.find(function (t) { return t.id === location.hash.slice(1); });
  if (!entry) {
    stopTimer();
    state.finished = true;
    showView('select');
  } else if (!(state.currentText === entry && selectView.classList.contains('hidden'))) {
    startPractice(entry);
  }
});

// ── Init ──────────────────────────────────────────────────────
populateCategoryFilter();
renderTextList();
const savedEntry = TEXTS.find(function (t) { return t.id === location.hash.slice(1); });
if (savedEntry) {
  startPractice(savedEntry);
} else {
  showView('select');
}
