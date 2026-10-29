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
  /** @type {Object.<string, number>} count of wrong keystrokes per expected character */
  missedChars: {},
  startTime: null,        // ms timestamp of first keystroke
  timerId: null,          // setInterval id
  finished: false,
};

// ── DOM refs ─────────────────────────────────────────────────
const selectView       = document.getElementById('select-view');
const practiceView     = document.getElementById('practice-view');
const resultsPanel     = document.getElementById('results-panel');
const practiceHint     = document.getElementById('practice-hint');
const handGuide            = document.getElementById('hand-guide');
const guideKeyDisplay      = document.getElementById('guide-key-display');
const guideFingerDesc      = document.getElementById('guide-finger-desc');
const keyboardLayoutSelect = document.getElementById('keyboard-layout-select');
const guideToggle          = document.getElementById('guide-toggle');

const textList         = document.getElementById('text-list');
const practiceTitle    = document.getElementById('practice-title');
const practiceProgress = document.getElementById('practice-progress');
const practiceTimer    = document.getElementById('practice-timer');
const practiceArea     = document.getElementById('practice-area');
const typingInput      = document.getElementById('typing-input');
const charDisplay      = document.getElementById('char-display');

const btnBackPractice  = document.getElementById('btn-back-practice');
const btnRetry         = document.getElementById('btn-retry');
const btnRestart       = document.getElementById('btn-restart');
const btnBackResults   = document.getElementById('btn-back-results');
const resultsStats     = document.getElementById('results-stats');
const resultsHistory   = document.getElementById('results-history');
const globalStats      = document.getElementById('global-stats');

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

// ── Saved stats (localStorage) ───────────────────────────────
// Shape: { global: Bucket, texts: { [textId]: Bucket } }
// Bucket: { runs, bestWpm, totalWpm, bestAccuracy, totalAccuracy, totalTime }
// Only completed sessions are recorded.

const STATS_KEY = 'typingStats';
/** Maximum number of sessions kept per character in the sliding history. */
const CHAR_HISTORY_SESSIONS = 20;

function newBucket() {
  return { runs: 0, bestWpm: 0, totalWpm: 0, bestAccuracy: 0, totalAccuracy: 0, bestTime: 0 };
}

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.global && s.texts) return s;
  } catch (e) { /* missing or corrupt: start fresh */ }
  return { global: newBucket(), texts: {} };
}

function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { /* storage unavailable */ }
}

function addToBucket(b, m) {
  const improved = {
    wpm: b.runs === 0 || m.netWpm > b.bestWpm,
    accuracy: b.runs === 0 || m.accuracy > b.bestAccuracy,
    time: b.runs === 0 ||  m.accuracy > b.bestAccuracy || ( m.accuracy === b.bestAccuracy && m.elapsed < b.bestTime ),
  };

  b.runs++;
  b.bestWpm = Math.max(b.bestWpm, m.netWpm);
  b.totalWpm += m.netWpm;
  b.bestAccuracy = m.accuracy > b.bestAccuracy ? m.accuracy : b.bestAccuracy;
  // The best time is only updated by a run that matches or beats the bucket's best accuracy.
  b.bestTime = m.accuracy > b.bestAccuracy ? m.elapsed : Math.min(b.bestTime, m.elapsed);
  b.totalAccuracy += m.accuracy;

  return improved;
}

/**
 * Push one session's miss data into the sliding char history.
 * Every character that appeared in the practiced text gets an entry — 0 if no misses,
 * so good sessions actively pull the average down.
 * When the history exceeds CHAR_HISTORY_SESSIONS, the oldest entry is first collapsed
 * into an average of all entries up to that point, preserving the long-term signal.
 * @param {Object.<string, number[]>} charHistory  the stored history map (mutated in place)
 * @param {string} practicedText                   the full text that was typed
 * @param {Object.<string, number>} sessionMisses  misses recorded this session
 */
function pushCharHistory(charHistory, practicedText, sessionMisses) {
  // Collect unique chars that were part of this session's text
  const chars = {};
  for (let i = 0; i < practicedText.length; i++) chars[practicedText[i]] = true;

  Object.keys(chars).forEach(function (ch) {
    if (!charHistory[ch]) charHistory[ch] = [];
    const hist = charHistory[ch];
    hist.push(sessionMisses[ch] || 0);
    if (hist.length > CHAR_HISTORY_SESSIONS) {
      // Replace the two oldest entries with their average, keeping the window length at the limit.
      // This way very old data decays gracefully instead of being hard-dropped.
      const condensed = (hist[0] + hist[1]) / 2;
      hist.splice(0, 2, condensed);
    }
  });
}

/** Add a finished session to the global stats, and to the per-text stats unless the text is random.
 * Returns { stats, records: { wpm: boolean, accuracy: boolean, time: boolean } }
 */
function recordRun(entry, metrics) {
  const stats = loadStats();
  const globalImproved = addToBucket(stats.global, metrics);
  // Update the sliding char history on the global bucket
  if (!stats.global.charHistory) stats.global.charHistory = {};
  pushCharHistory(stats.global.charHistory, metrics.practicedText, metrics.missedChars);

  let textImproved = { wpm: false, accuracy: false, time: false };
  if (!entry.random) {
    if (!stats.texts[entry.id]) stats.texts[entry.id] = newBucket();
    textImproved = addToBucket(stats.texts[entry.id], metrics);
  }
  saveStats(stats);

  const records = entry.random
    ? { wpm: globalImproved.wpm, accuracy: false, time: false }
    : textImproved;

  return { stats: stats, records: records };
}

/** Average of a bucket total, rounded; 0 when there are no runs. */
function bucketAvg(b, field) {
  return b.runs ? Math.round(b[field] / b.runs) : 0;
}

/**
 * Derive a flat { ch: avgMisses } map from the sliding char history, for use by the generators.
 * @param {Object.<string, number[]>} charHistory
 * @returns {Object.<string, number>}
 */
function charHistoryToWeights(charHistory) {
  const weights = {};
  Object.keys(charHistory).forEach(function (ch) {
    const hist = charHistory[ch];
    if (!hist.length) return;
    weights[ch] = hist.reduce(function (s, v) { return s + v; }, 0) / hist.length;
  });
  return weights;
}

/** One table row for a stats bucket. Best accuracy and total time are only meaningful per text, so global rows skip them. */
function statsRow(label, b, perText, tooltip) {
  return '<tr><th scope="row"' + (tooltip ? ' data-tooltip="' + escHtml(tooltip) + '"' : '') + '>' + escHtml(label) + '</th>' +
    '<td>' + b.runs + '</td>' +
    '<td>' + b.bestWpm + '</td>' +
    '<td>' + bucketAvg(b, 'totalWpm') + '</td>' +
    '<td>' + (perText ? b.bestAccuracy + '%' : '-') + '</td>' +
    '<td>' + bucketAvg(b, 'totalAccuracy') + '%</td>' +
    '<td>' + (perText ? (b.bestTime ? formatTime(b.bestTime) : '-') : '-') + '</td></tr>';
}

/** Table comparing this text's history with the global history (random texts only get the global row). */
function renderHistory(stats, entry) {
  resultsHistory.innerHTML =
    '<h3>History</h3>' +
    '<table class="stats-table"><thead><tr>' +
      '<th></th>' +
      '<th data-tooltip="Total number of completed practice runs.">Runs</th>' +
      '<th data-tooltip="Highest Net WPM achieved in a single run.">Best WPM</th>' +
      '<th data-tooltip="Average Net WPM across all completed runs.">Avg WPM</th>' +
      '<th data-tooltip="Highest accuracy achieved in a single run.">Best acc.</th>' +
      '<th data-tooltip="Average accuracy across all completed runs.">Avg acc.</th>' +
      '<th data-tooltip="Fastest completion time recorded for this text with the highest accuray.">Best time</th>' +
    '</tr></thead><tbody>' +
      (entry.random ? '' : statsRow('This text', stats.texts[entry.id] || newBucket(), true, 'Statistics for the current text snippet.')) +
      statsRow('All texts', stats.global, false, 'Aggregate statistics across all practice sessions.') +
    '</tbody></table>';
}

/** One-line global summary shown on the selection screen. */
function renderGlobalSummary() {
  const g = loadStats().global;
  globalStats.classList.toggle('hidden', g.runs === 0);
  globalStats.textContent = 'All texts: ' + g.runs + (g.runs === 1 ? ' run' : ' runs') +
    ' · best ' + g.bestWpm + ' WPM · avg ' + bucketAvg(g, 'totalWpm') + ' WPM · avg accuracy ' +
    bucketAvg(g, 'totalAccuracy') + '%';
}

// ── URL / history ────────────────────────────────────────────
// A text is stored in the URL as #text-id; a random text as ?random=<encoded text>.
// Opening a text pushes a history entry, so the browser's Back button returns to the list.

/** Build the practice entry for a random text. @param {string} text */
function randomEntry(text, title) {
  return { id: 'random', random: true, title: title || 'Random text', text: text };
}

/** URL of the list view: current filters, no open text. */
function listUrl() {
  const params = new URLSearchParams(location.search);
  params.delete('random');
  const query = params.toString();
  return location.pathname + (query ? '?' + query : '');
}

/** Push a history entry for the open text (does nothing if the URL is already that one). */
function pushPracticeUrl(entry) {
  const params = new URLSearchParams(location.search);
  let hash = '';
  if (entry.random) {
    params.set('random', entry.text);
  } else {
    params.delete('random');
    hash = '#' + entry.id;
  }
  const query = params.toString();
  const url = location.pathname + (query ? '?' + query : '') + hash;
  if (url === location.pathname + location.search + location.hash) return;
  try {
    history.pushState({ practice: true }, '', url);
  } catch (e) { /* some browsers block this on file:// pages */ }
}

/** Return to the list: step back in history if the text was opened from it, otherwise just swap the URL. */
function goToList() {
  stopTimer();
  state.finished = true;
  if (history.state && history.state.practice) {
    history.back(); // the popstate handler shows the list
    return;
  }
  try { history.replaceState(null, '', listUrl()); } catch (e) { /* ignore */ }
  showView('select');
}

/** Show whatever the URL says: a random text, a saved text, or the list. */
function syncViewFromUrl() {
  const randomText = new URLSearchParams(location.search).get('random');
  const entry = randomText
    ? randomEntry(randomText)
    : TEXTS.find(function (t) { return t.id === location.hash.slice(1); });

  if (!entry) {
    stopTimer();
    state.finished = true;
    showView('select');
    return;
  }
  const alreadyOpen = !practiceView.classList.contains('hidden') && state.currentText
    && state.currentText.id === entry.id && state.currentText.text === entry.text;
  if (!alreadyOpen) startPractice(entry, true);
}

// ── View helpers ─────────────────────────────────────────────

/**
 * Show exactly one view, hide the others.
 * @param {'select' | 'practice'} name
 */
function showView(name) {
  if (name === 'select') {
    renderGlobalSummary();
    renderTextList(); // refresh per-text stats on the cards
  }
  selectView.classList.toggle('hidden', name !== 'select');
  practiceView.classList.toggle('hidden', name !== 'practice');
}

// ── Select view ──────────────────────────────────────────────

const filterCategory   = document.getElementById('filter-category');
const filterCharset    = document.getElementById('filter-charset');
const filterDifficulty = document.getElementById('filter-difficulty');
const filterSize       = document.getElementById('filter-size');
const filterTried      = document.getElementById('filter-tried');
const filterTop        = document.getElementById('filter-top');
const sortBy           = document.getElementById('sort-by');
const textListEmpty    = document.getElementById('text-list-empty');

/** @param {number} length @returns {'short' | 'medium' | 'long'} */
function sizeOf(length) {
  return length < 200 ? 'short' : length <= 600 ? 'medium' : 'long';
}

/** Character set of a text; texts without a `charset` use plain keyboard characters. */
function charsetOf(t) {
  return t.charset || 'Standard';
}

/** Fill a filter <select> with "All" plus every distinct value of `getValue` found in TEXTS. */
function populateFilter(select, getValue) {
  select.innerHTML = '<option value="">All</option>';
  TEXTS.forEach(function (t) {
    const value = getValue(t);
    const exists = Array.prototype.some.call(select.options, function (o) {
      return o.value === value;
    });
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    }
  });
}

function populateCategoryFilter() {
  populateFilter(filterCategory, function (t) { return t.category; });
  populateFilter(filterCharset, charsetOf);
}

/** Render the TEXTS array (respecting the filters) as clickable cards into #text-list. */
function renderTextList() {
  textList.innerHTML = '';

  const levels = ['Easy', 'Medium', 'Hard'];
  const savedTexts = loadStats().texts;
  const runsOf = function (t) { return (savedTexts[t.id] && savedTexts[t.id].runs) || 0; };
  const accuracyOf = function (t) { return (savedTexts[t.id] && savedTexts[t.id].runs) ? bucketAvg(savedTexts[t.id], 'totalAccuracy') : 0; };
  const visible = TEXTS.filter(function (t) {
    return (!filterCategory.value || t.category === filterCategory.value)
      && (!filterCharset.value || charsetOf(t) === filterCharset.value)
      && (!filterDifficulty.value || t.difficulty === filterDifficulty.value)
      && (!filterSize.value || sizeOf(t.text.length) === filterSize.value)
      && (!filterTried.value || (filterTried.value === 'yes') === (runsOf(t) > 0));
  });

  const byDifficulty = function (a, b) { return levels.indexOf(a.difficulty) - levels.indexOf(b.difficulty); };
  // Untried texts have no accuracy: they always go after the tried ones when sorting by success.
  const bySuccess = function (sign) {
    return function (a, b) {
      if (!runsOf(a) || !runsOf(b)) return (runsOf(b) > 0) - (runsOf(a) > 0);
      const diff = accuracyOf(a) - accuracyOf(b);
      return diff !== 0 ? sign * diff : (runsOf(b) - runsOf(a));
    };
  };
  const comparators = {
    '':              byDifficulty,
    'most-tried':    function (a, b) { return runsOf(b) - runsOf(a); },
    'least-tried':   function (a, b) { return runsOf(a) - runsOf(b); },
    'most-success':  bySuccess(-1),
    'least-success': bySuccess(1),
  };
  visible.sort(comparators[sortBy.value] || byDifficulty);

  const shown = filterTop.value ? visible.slice(0, Number(filterTop.value)) : visible;
  textListEmpty.classList.toggle('hidden', shown.length > 0);
  shown.forEach(renderTextCard);
}

/** Inline SVG icons (24x24, stroke-based) shown in the top-right corner of each card, keyed by text category. */
const CATEGORY_ICONS = {
  Drills: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  Prose:  '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="13" y2="18"/>',
  Code:   '<polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/>',
};

/** Build the category icon markup for a card. @param {string} category */
function categoryIcon(category) {
  const shapes = CATEGORY_ICONS[category] || '<circle cx="12" cy="12" r="9"/>';
  return '<span class="category-icon" data-tooltip="' + escHtml(category) + '">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="' + escHtml(category) + '">' +
    shapes + '</svg></span>';
}

// Filters are mirrored in the URL query string: ?category=Code&charset=Spanish&difficulty=Hard&size=long&top=10&sort=most-tried
const FILTER_PARAMS = [
  ['category',   filterCategory],
  ['charset',    filterCharset],
  ['difficulty', filterDifficulty],
  ['size',       filterSize],
  ['tried',      filterTried],
  ['top',        filterTop],
  ['sort',       sortBy],
];

/** Select the filter values given in the URL; unknown values are ignored. */
function applyFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  FILTER_PARAMS.forEach(function (pair) {
    const value = params.get(pair[0]);
    if (value === null) return;
    pair[1].value = value;
    if (pair[1].value !== value) pair[1].value = ''; // not a valid option
  });
}

/** Write the active filters to the URL (replacing the current history entry), keeping other parameters. */
function updateUrlFromFilters() {
  const params = new URLSearchParams(location.search);
  FILTER_PARAMS.forEach(function (pair) {
    if (pair[1].value) params.set(pair[0], pair[1].value);
    else params.delete(pair[0]);
  });
  const query = params.toString();
  try {
    history.replaceState(history.state, '', location.pathname + (query ? '?' + query : '') + location.hash);
  } catch (e) { /* some browsers block this on file:// pages */ }
}

function onFilterChange() {
  updateUrlFromFilters();
  renderTextList();
}

FILTER_PARAMS.forEach(function (pair) {
  pair[1].addEventListener('change', onFilterChange);
});

// ── Random text card ─────────────────────────────────────────

const randomSize      = document.getElementById('random-size');
const randomCharset   = document.getElementById('random-charset');
const randomSymbols   = document.getElementById('random-symbols');
const randomNumbers   = document.getElementById('random-numbers');
const randomUpper     = document.getElementById('random-uppercase');
const randomWeakChars = document.getElementById('random-weak-chars');
const btnRandom       = document.getElementById('btn-random');

const RANDOM_LENGTHS = { short: 150, medium: 400, long: 800 };

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Weighted random pick: each item's weight is its score from `missedChars`.
 * Falls back to a uniform pick when all scores are 0.
 * @param {string[]} words
 * @param {Object.<string, number>} missedChars
 */
function pickWeighted(words, missedChars) {
  const weights = words.map(function (w) {
    return w.split('').reduce(function (sum, ch) {
      return sum + (missedChars[ch] || 0);
    }, 0);
  });
  const total = weights.reduce(function (a, b) { return a + b; }, 0);
  if (total === 0) return pick(words); // no miss data yet — uniform fallback
  let r = Math.random() * total;
  for (let i = 0; i < words.length; i++) {
    r -= weights[i];
    if (r <= 0) return words[i];
  }
  return words[words.length - 1];
}

/** Randomly capitalise a word: ~1 in 6 words, half of them only the first letter, half the whole word. */
function randomCase(word) {
  if (Math.random() >= 0.17) return word;
  return Math.random() < 0.5
    ? word.charAt(0).toUpperCase() + word.slice(1)
    : word.toUpperCase();
}

/**
 * Return a miss-based weight for a single character (1 = baseline, higher = more missed).
 * @param {string} ch
 * @param {Object.<string, number>} missedChars
 */
function missWeight(ch, missedChars) {
  return 1 + (missedChars[ch] || 0);
}

/**
 * Weighted pick from a list of single characters using the miss map.
 * @param {string[]} chars
 * @param {Object.<string, number>} missedChars
 */
function pickWeightedSymbol(chars, missedChars) {
  const weights = chars.map(function (ch) { return missWeight(ch, missedChars); });
  const total = weights.reduce(function (a, b) { return a + b; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < chars.length; i++) {
    r -= weights[i];
    if (r <= 0) return chars[i];
  }
  return chars[chars.length - 1];
}

/**
 * Build one random sentence from a word set (see words.js).
 * @param {{ symbols: boolean, numbers: boolean, uppercase: boolean, missedChars?: Object.<string,number> }} opts
 */
function randomSentence(set, opts) {
  const withSymbols = opts.symbols;
  const missedChars = opts.missedChars || {};
  const hasMissData = Object.keys(missedChars).length > 0;

  // Boost number probability (base 15%) up to 40% when digits are heavily missed
  const digitMisses = '0123456789'.split('').reduce(function (s, d) { return s + (missedChars[d] || 0); }, 0);
  const totalMisses = Object.keys(missedChars).reduce(function (s, k) { return s + missedChars[k]; }, 0);
  const numberChance = opts.numbers
    ? 0.15 + 0.25 * (totalMisses ? digitMisses / totalMisses : 0)
    : 0;

  const count = randomInt(5, 12);
  const tokens = [];

  for (let i = 0; i < count; i++) {
    let token = numberChance && Math.random() < numberChance
      ? String(randomInt(1, 9999))
      : (hasMissData ? pickWeighted(set.words, missedChars) : pick(set.words));
    const isNumber = /^\d+$/.test(token);
    if (opts.uppercase && !isNumber) token = randomCase(token);

    if (withSymbols) {
      if (i === 0) token = token.charAt(0).toUpperCase() + token.slice(1);
      const r = Math.random();
      // Boost each symbol branch probability by its miss weight relative to baseline
      const w = function (ch) { return missWeight(ch, missedChars); };
      const parenW  = w('(') + w(')');
      const quoteW  = w('"');
      const dashW   = w('-');
      const dollarW = w('$');
      const pctW    = w('%');
      const base = parenW + quoteW + dashW + dollarW + pctW;
      // Normalise thresholds so they sum to the same 0.17 range but are weighted by miss counts
      const t1 = 0.17 * (parenW / base);
      const t2 = t1 + 0.17 * (quoteW / base);
      const t3 = t2 + 0.17 * (dashW / base);
      const t4 = t3 + 0.17 * ((dollarW + pctW) / base);
      if (r < t1) token = '(' + token + ')';
      else if (r < t2) token = '"' + token + '"';
      else if (r < t3 && i < count - 1 && !isNumber) token = token + '-' + pick(set.words);
      else if (r < t4 && isNumber) token = dollarW >= pctW ? '$' + token : token + '%';
      if (i < count - 1 && Math.random() < 0.12)
        token += pickWeightedSymbol([',', ';', ':'], missedChars);
    }
    tokens.push(token);
  }

  let sentence = tokens.join(' ');
  if (withSymbols) {
    const ending = pickWeightedSymbol(['.', '.', '.', '!', '?'], missedChars);
    const wrapper = set.wrappers.find(function (w) { return w[1] === ending; });
    sentence = wrapper ? wrapper[0] + sentence + ending : sentence + ending;
  }
  return sentence;
}

/** Generate a random text of roughly the requested size. With every option off it is plain lowercase words. */
function generateRandomText(size, charset, opts, missedChars) {
  const set = WORD_SETS[charset] || WORD_SETS.Standard;
  const target = RANDOM_LENGTHS[size];
  const sentences = [];
  let length = 0;
  while (length < target) {
    const sentence = randomSentence(set, Object.assign({}, opts, { missedChars: missedChars || {} }));
    sentences.push(sentence);
    length += sentence.length + 1;
  }
  return sentences.join(' ');
}

Object.keys(WORD_SETS).forEach(function (name) {
  const opt = document.createElement('option');
  opt.value = name;
  opt.textContent = name;
  randomCharset.appendChild(opt);
});

btnRandom.addEventListener('click', function () {
  const charHistory = loadStats().global.charHistory || {};
  const missedChars = randomWeakChars.checked
    ? charHistoryToWeights(charHistory)
    : {};
  const text = generateRandomText(randomSize.value, randomCharset.value, {
    symbols: randomSymbols.checked,
    numbers: randomNumbers.checked,
    uppercase: randomUpper.checked,
  }, missedChars);
  startPractice(randomEntry(text, 'Random text (' + randomSize.value + ', ' + randomCharset.value + ')'));
});

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

  const saved = loadStats().texts[entry.id];
  const cardStats = saved && saved.runs
    ? '<span class="text-card-stats">Best ' + saved.bestWpm + ' WPM · avg accuracy ' +
        bucketAvg(saved, 'totalAccuracy') + '%' +
        (saved.bestTime ? ' · ' + formatTime(saved.bestTime) : '') +
        ' · ' + saved.runs + (saved.runs === 1 ? ' run' : ' runs') + '</span>'
    : '';

  const size = sizeOf(entry.text.length);
  const sizeLabel = size.charAt(0).toUpperCase() + size.slice(1);

  btn.innerHTML =
    categoryIcon(entry.category) +
    '<span class="text-card-title">' + escHtml(entry.title) +
      ' <span class="badge badge-' + escHtml(entry.difficulty.toLowerCase()) + '">' + escHtml(entry.difficulty) + '</span>' +
      ' <span class="badge badge-charset">' + escHtml(charsetOf(entry)) + '</span>' +
      ' <span class="badge badge-size-' + size + '">' + escHtml(sizeLabel) + '</span></span>' +
    '<span class="text-card-meta">' + wordCount + ' words · ' + entry.text.length + ' characters</span>' +
    cardStats +
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
 * @param {boolean} [fromUrl] true when the URL already describes this text (page load, Back/Forward): no history entry is added
 */
function startPractice(entry, fromUrl) {
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
  state.missedChars         = {};
  state.startTime           = null;
  state.finished            = false;
  btnRestart.classList.add('hidden');

  practiceTitle.textContent    = entry.title;
  practiceProgress.textContent = '0 / ' + entry.text.length;
  practiceTimer.textContent    = '0:00';

  renderCharSpans(entry.text);
  resultsPanel.classList.add('hidden');
  practiceHint.classList.remove('hidden');
  if (keyboardLayoutSelect) {
    keyboardLayoutSelect.value = getSavedLayout();
  }
  applyGuideVisibility();
  if (getSavedGuideEnabled()) {
    updateHandGuide();
  }

  showView('practice');
  if (!fromUrl) pushPracticeUrl(entry); // remembered across reloads

  // Reset scroll now that the view is visible (hidden elements ignore scrollTop)
  charDisplay.scrollTop = 0;
  window.scrollTo(0, 0);

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
  charDisplay.scrollTop = 0;

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'ch pending' + (i === 0 ? ' current' : '');
    span.dataset.index = String(i);
    // Newlines get the ↵ symbol so they are always visible; the real \n follows to preserve layout.
    // Regular spaces are preserved by `white-space: pre-wrap` and allow line wrapping.
    span.textContent = text[i] === '\n' ? '\u21B5\n' : text[i];
    charDisplay.appendChild(span);
  }
}

// ── Typing engine ─────────────────────────────────────────────

/** Start the elapsed-time ticker (called on first keystroke). */
function startTimer() {
  state.startTime = Date.now();
  btnRestart.classList.remove('hidden');
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
  goToList();
}

/**
 * Move the caret class to the span at `index` (if it exists).
 * @param {number} index
 */
function updateCaret(index) {
  const old = charDisplay.querySelector('.ch.current');
  if (old) old.classList.remove('current');
  const next = charDisplay.children[index];
  if (next) {
    next.classList.add('current');
    // Keep the current line about a third of the way down the visible box
    charDisplay.scrollTop = Math.max(0, next.offsetTop - charDisplay.clientHeight / 3);
  }
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
  span.classList.remove('pending', 'correct', 'wrong', 'corrected', 'wrong-tab', 'corrected-tab');
  span.classList.add(status);
  delete span.dataset.typed;
  if (status === 'corrected' && /\s/.test(expected)) {
    // A fixed whitespace character would be invisible, so draw its marker (yellow)
    if (expected === '\t') {
      span.textContent = expected; // keep the tab's width
      span.classList.add('corrected-tab');
      span.dataset.typed = visibleChar(expected);
    } else {
      span.textContent = visibleChar(expected) + (expected === '\n' ? '\n' : '');
    }
    delete span.dataset.expected;
  } else if (status === 'wrong' && expected === '\t') {
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
    // Newlines always show the ↵ marker so they remain visible when correct/pending
    span.textContent = expected === '\n' ? '\u21B5\n' : expected;
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
    // Track which expected character was missed (keyed by the expected char)
    const expected = text[i];
    state.missedChars[expected] = (state.missedChars[expected] || 0) + 1;
    setCharStatus(i, 'wrong', ch);
  }
  state.attempted[i] = true;

  updateCaret(i + 1);
  practiceProgress.textContent = state.typed.length + ' / ' + text.length;

  if (state.typed.length === text.length) {
    finishPractice();
  } else {
    updateHandGuide();
  }
}

/** Handle Backspace: delete the last typed character (no-op at position 0). */
function deleteChar() {
  if (state.typed.length === 0) return;
  state.typed.pop();
  const i = state.typed.length;
  setCharStatus(i, 'pending');
  updateCaret(i);
  practiceProgress.textContent = i + ' / ' + state.currentText.text.length;
  updateHandGuide();
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
  btnRestart.classList.add('hidden');
  handGuide.classList.add('hidden');
  clearHandGuideHighlights();

  const text = state.currentText.text;
  const elapsed = Date.now() - state.startTime;

  showResults({
    netWpm: calcNetWpm(countCorrectFinal(state.typed, text), elapsed),
    rawWpm: calcRawWpm(state.keystrokes, elapsed),
    accuracy: calcAccuracy(state.firstAttemptCorrect, text.length),
    elapsed: elapsed,
    errors: state.errors,
    corrected: state.corrected,
    missedChars: state.missedChars,
    practicedText: text,
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
 * Populate and show the results panel below the text box (typing is already blocked).
 * @param {{ netWpm: number, rawWpm: number, accuracy: number,
 *            elapsed: number, errors: number, corrected: number }} metrics
 */
function showResults(metrics) {
  const result = recordRun(state.currentText, metrics);
  const records = result.records;

  resultsStats.innerHTML = buildStatCard('Net WPM',          metrics.netWpm,        'Words per minute after subtracting uncorrected errors. The standard measure of typing speed.', records.wpm)
    + buildStatCard('Raw WPM',         metrics.rawWpm,       'Total keystrokes per minute with no error penalty. Shows your raw speed before accounting for mistakes.')
    + buildStatCard('Accuracy',        metrics.accuracy + '%', 'Percentage of characters typed correctly on the first attempt.', records.accuracy)
    + buildStatCard('Time',            formatTime(metrics.elapsed), 'Total time from your first keystroke to the last character.', records.time)
    + buildStatCard('Errors',          metrics.errors,       'Number of characters typed incorrectly (each wrong keystroke counts, even if later corrected).')
    + buildStatCard('Corrected errors', metrics.corrected,   'Errors you went back and fixed with Backspace before finishing.');

  renderHistory(result.stats, state.currentText);

  resultsPanel.classList.remove('hidden');
  practiceHint.classList.add('hidden');
  handGuide.classList.add('hidden');
  resultsPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/**
 * Build the HTML for a single result stat card.
 * @param {string} label
 * @param {string | number} value
 * @param {string} [tooltip]
 * @param {boolean} [isRecord]
 * @returns {string}
 */
function buildStatCard(label, value, tooltip, isRecord) {
  return '<div class="results-stat-card' + (isRecord ? ' is-record' : '') + '"' +
           (tooltip ? ' data-tooltip="' + escHtml(tooltip) + '"' : '') + '>' +
           (isRecord ? '<span class="stat-badge" title="New record!"><img src="assets/ribbon.svg" alt="New record" /></span>' : '') +
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

btnRestart.addEventListener('click', function () {
  if (state.currentText) {
    startPractice(state.currentText, true); // same text, URL already points to it
  }
});

btnBackResults.addEventListener('click', goToList);

// ── Hand Guide Logic ──────────────────────────────────────────
const LAYOUT_KEY = 'typingLayout';
const GUIDE_ENABLED_KEY = 'typingGuideEnabled';

function getSavedGuideEnabled() {
  try {
    const saved = localStorage.getItem(GUIDE_ENABLED_KEY);
    if (saved !== null) return saved === 'true';
  } catch (e) { /* storage unavailable */ }
  return true;
}

function saveGuideEnabled(enabled) {
  try {
    localStorage.setItem(GUIDE_ENABLED_KEY, String(enabled));
  } catch (e) { /* storage unavailable */ }
}

function updateGuideToggleLabel() {
  if (!guideToggle) return;
  const enabled = getSavedGuideEnabled();
  guideToggle.innerHTML = 'Guide: ' + (enabled
    ? '<span class="status-on">ON</span>'
    : '<span class="status-off">OFF</span>');
}

function applyGuideVisibility() {
  updateGuideToggleLabel();
  const enabled = getSavedGuideEnabled();
  if (handGuide) {
    if (!enabled || state.finished || !state.currentText) {
      handGuide.classList.add('hidden');
    } else {
      handGuide.classList.remove('hidden');
    }
  }
}

function getSavedLayout() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved && KEYBOARD_LAYOUTS && KEYBOARD_LAYOUTS[saved]) return saved;
  } catch (e) { /* storage unavailable */ }
  return 'qwerty';
}

function saveLayout(id) {
  try { localStorage.setItem(LAYOUT_KEY, id); } catch (e) { /* storage unavailable */ }
}

function populateLayoutSelect() {
  if (!keyboardLayoutSelect || typeof KEYBOARD_LAYOUTS === 'undefined') return;
  keyboardLayoutSelect.innerHTML = '';
  Object.keys(KEYBOARD_LAYOUTS).forEach(function (id) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = KEYBOARD_LAYOUTS[id].name;
    keyboardLayoutSelect.appendChild(opt);
  });
  keyboardLayoutSelect.value = getSavedLayout();
}

function clearHandGuideHighlights() {
  const allFingers = document.querySelectorAll('.finger-group');
  allFingers.forEach(function (el) {
    el.classList.remove('active', 'active-modifier');
    const badgeText = el.querySelector('.badge-text');
    if (badgeText) badgeText.textContent = '';
  });
}

function setFingerBadge(fingerEl, label) {
  const badgeText = fingerEl.querySelector('.badge-text');
  const badgeBg = fingerEl.querySelector('.badge-bg');
  if (badgeText) {
    badgeText.textContent = label;
  }
  if (badgeBg) {
    const textLen = (label || '').length;
    const width = Math.max(28, textLen * 7.5 + 12);
    badgeBg.setAttribute('width', String(width));
    badgeBg.setAttribute('x', String(-width / 2));
  }
}

function updateHandGuide() {
  if (!handGuide || !state.currentText || state.finished || state.typed.length >= state.currentText.text.length) {
    clearHandGuideHighlights();
    if (guideKeyDisplay) guideKeyDisplay.textContent = '—';
    if (guideFingerDesc) guideFingerDesc.textContent = '';
    return;
  }

  if (!getSavedGuideEnabled()) {
    clearHandGuideHighlights();
    return;
  }

  const targetChar = state.currentText.text[state.typed.length];
  const layoutId = (keyboardLayoutSelect && keyboardLayoutSelect.value) ? keyboardLayoutSelect.value : getSavedLayout();
  const guide = typeof getKeyGuide === 'function' ? getKeyGuide(targetChar, layoutId) : null;

  clearHandGuideHighlights();

  if (!guide) {
    if (guideKeyDisplay) guideKeyDisplay.textContent = visibleChar(targetChar);
    if (guideFingerDesc) guideFingerDesc.textContent = '';
    return;
  }

  if (guideKeyDisplay) guideKeyDisplay.textContent = visibleChar(targetChar);
  if (guideFingerDesc) guideFingerDesc.textContent = guide.description;

  // Highlight primary finger
  const fingerEl = document.getElementById('finger-' + guide.finger);
  if (fingerEl) {
    fingerEl.classList.add('active');
    setFingerBadge(fingerEl, guide.label);
  }

  // Highlight modifier finger (e.g. Shift)
  if (guide.modifierFinger) {
    const modFingerEl = document.getElementById('finger-' + guide.modifierFinger);
    if (modFingerEl) {
      modFingerEl.classList.add('active-modifier');
      setFingerBadge(modFingerEl, guide.modifierLabel || 'Shift');
    }
  }
}

if (keyboardLayoutSelect) {
  keyboardLayoutSelect.addEventListener('change', function () {
    saveLayout(keyboardLayoutSelect.value);
    updateHandGuide();
    typingInput.focus();
  });
}

if (guideToggle) {
  guideToggle.addEventListener('click', function () {
    const next = !getSavedGuideEnabled();
    saveGuideEnabled(next);
    applyGuideVisibility();
    if (next && state.currentText && !state.finished) {
      updateHandGuide();
    } else {
      clearHandGuideHighlights();
    }
    if (!practiceView.classList.contains('hidden') && !state.finished) {
      typingInput.focus();
    }
  });
}

// Sync layout and toggle changes across tabs / windows
window.addEventListener('storage', function (e) {
  if (e.key === LAYOUT_KEY) {
    if (keyboardLayoutSelect) keyboardLayoutSelect.value = getSavedLayout();
    updateHandGuide();
  } else if (e.key === GUIDE_ENABLED_KEY) {
    applyGuideVisibility();
    updateHandGuide();
  }
});

// Keep the view in sync with the URL on browser Back/Forward (also fires for manual #hash edits)
window.addEventListener('popstate', syncViewFromUrl);

// ── Init ──────────────────────────────────────────────────────
populateCategoryFilter();
populateLayoutSelect();
applyGuideVisibility();
applyFiltersFromUrl();
renderTextList();
syncViewFromUrl();
