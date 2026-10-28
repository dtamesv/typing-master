/**
 * Keyboard Layout Configurations and Finger Mapping for Touch Typing Guide.
 * 
 * Finger IDs:
 *   lp = Left Pinky,  lr = Left Ring,  lm = Left Middle,  li = Left Index,  lt = Left Thumb
 *   rt = Right Thumb, ri = Right Index, rm = Right Middle, rr = Right Ring, rp = Right Pinky
 */

const FINGER_NAMES = {
  lp: 'Left Pinky',
  lr: 'Left Ring',
  lm: 'Left Middle',
  li: 'Left Index',
  lt: 'Left Thumb',
  rt: 'Right Thumb',
  ri: 'Right Index',
  rm: 'Right Middle',
  rr: 'Right Ring',
  rp: 'Right Pinky',
};

const IS_LEFT_HAND = {
  lp: true,
  lr: true,
  lm: true,
  li: true,
  lt: true,
  rt: false,
  ri: false,
  rm: false,
  rr: false,
  rp: false,
};

/**
 * Helper to build character mapping table from key definitions.
 * keys: Array of [baseChar, shiftChar, finger, altChar]
 */
function buildLayoutMap(keyDefs) {
  const map = {};

  keyDefs.forEach(function (def) {
    const base = def[0];
    const shift = def[1];
    const finger = def[2];
    const alt = def[3];
    const isLeft = IS_LEFT_HAND[finger];
    const shiftFinger = isLeft ? 'rp' : 'lp';

    if (base !== null && base !== undefined) {
      map[base] = {
        finger: finger,
        label: base === ' ' ? 'Space' : base,
        shift: false,
        modifierFinger: null,
        modifierLabel: null,
      };
    }

    if (shift !== null && shift !== undefined) {
      map[shift] = {
        finger: finger,
        label: shift,
        shift: true,
        modifierFinger: shiftFinger,
        modifierLabel: 'Shift',
      };
    }

    if (alt !== null && alt !== undefined) {
      map[alt] = {
        finger: finger,
        label: alt,
        shift: false,
        modifierFinger: 'rt',
        modifierLabel: 'AltGr',
      };
    }
  });

  // Whitespace & standard controls
  map[' '] = { finger: 'rt', label: 'Space', shift: false, modifierFinger: null, modifierLabel: null };
  map['\n'] = { finger: 'rp', label: '↵ Enter', shift: false, modifierFinger: null, modifierLabel: null };
  map['\t'] = { finger: 'lp', label: '⇥ Tab', shift: false, modifierFinger: null, modifierLabel: null };

  return map;
}

const QWERTY_KEYS = [
  // Number row
  ['`', '~', 'lp'], ['1', '!', 'lp'], ['2', '@', 'lr'], ['3', '#', 'lm'], ['4', '$', 'li'], ['5', '%', 'li'],
  ['6', '^', 'ri'], ['7', '&', 'ri'], ['8', '*', 'rm'], ['9', '(', 'rr'], ['0', ')', 'rp'], ['-', '_', 'rp'], ['=', '+', 'rp'],
  // Top row
  ['q', 'Q', 'lp'], ['w', 'W', 'lr'], ['e', 'E', 'lm'], ['r', 'R', 'li'], ['t', 'T', 'li'],
  ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
  ['[', '{', 'rp'], [']', '}', 'rp'], ['\\', '|', 'rp'],
  // Home row
  ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
  ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], [';', ':', 'rp'], ["'", '"', 'rp'],
  // Bottom row
  ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['n', 'N', 'ri'], ['m', 'M', 'ri'], [',', '<', 'rm'], ['.', '>', 'rr'], ['/', '?', 'rp'],
];

const QWERTZ_KEYS = [
  ['^', '°', 'lp'], ['1', '!', 'lp'], ['2', '"', 'lr', '²'], ['3', '§', 'lm', '³'], ['4', '$', 'li'], ['5', '%', 'li'],
  ['6', '&', 'ri'], ['7', '/', 'ri', '{'], ['8', '(', 'rm', '['], ['9', ')', 'rr', ']'], ['0', '=', 'rp', '}'], ['ß', '?', 'rp', '\\'], ['´', '`', 'rp'],
  ['q', 'Q', 'lp', '@'], ['w', 'W', 'lr'], ['e', 'E', 'lm', '€'], ['r', 'R', 'li'], ['t', 'T', 'li'],
  ['z', 'Z', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
  ['ü', 'Ü', 'rp'], ['+', '*', 'rp', '~'],
  ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
  ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], ['ö', 'Ö', 'rp'], ['ä', 'Ä', 'rp'], ['#', "'", 'rp'],
  ['y', 'Y', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['n', 'N', 'ri'], ['m', 'M', 'ri', 'µ'], [',', ';', 'rm'], ['.', ':', 'rr'], ['-', '_', 'rp'],
];

const AZERTY_KEYS = [
  ['²', null, 'lp'], ['&', '1', 'lp'], ['é', '2', 'lr', '~'], ['"', '3', 'lm', '#'], ["'", '4', 'li', '{'], ['(', '5', 'li', '['],
  ['-', '6', 'ri', '|'], ['è', '7', 'ri', '`'], ['_', '8', 'rm', '\\'], ['ç', '9', 'rr', '^'], ['à', '0', 'rp', '@'], [')', '°', 'rp', ']'], ['=', '+', 'rp', '}'],
  ['a', 'A', 'lp'], ['z', 'Z', 'lr'], ['e', 'E', 'lm', '€'], ['r', 'R', 'li'], ['t', 'T', 'li'],
  ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
  ['^', '¨', 'rp'], ['$', '£', 'rp', '¤'],
  ['q', 'Q', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
  ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], ['m', 'M', 'rp'], ['ù', '%', 'rp'], ['*', 'µ', 'rp'],
  ['w', 'W', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['n', 'N', 'ri'], [',', '?', 'rm'], [';', '.', 'rr'], [':', '/', 'rp'], ['!', '§', 'rp'],
];

const DVORAK_KEYS = [
  ['`', '~', 'lp'], ['1', '!', 'lp'], ['2', '@', 'lr'], ['3', '#', 'lm'], ['4', '$', 'li'], ['5', '%', 'li'],
  ['6', '^', 'ri'], ['7', '&', 'ri'], ['8', '*', 'rm'], ['9', '(', 'rr'], ['0', ')', 'rp'], ['[', '{', 'rp'], [']', '}', 'rp'],
  ["'", '"', 'lp'], [',', '<', 'lr'], ['.', '>', 'lm'], ['p', 'P', 'li'], ['y', 'Y', 'li'],
  ['f', 'F', 'ri'], ['g', 'G', 'ri'], ['c', 'C', 'rm'], ['r', 'R', 'rr'], ['l', 'L', 'rp'],
  ['/', '?', 'rp'], ['=', '+', 'rp'], ['\\', '|', 'rp'],
  ['a', 'A', 'lp'], ['o', 'O', 'lr'], ['e', 'E', 'lm'], ['u', 'U', 'li'], ['i', 'I', 'li'],
  ['d', 'D', 'ri'], ['h', 'H', 'ri'], ['t', 'T', 'rm'], ['n', 'N', 'rr'], ['s', 'S', 'rp'], ['-', '_', 'rp'],
  [';', ':', 'lp'], ['q', 'Q', 'lr'], ['j', 'J', 'lm'], ['k', 'K', 'li'], ['x', 'X', 'li'],
  ['b', 'B', 'ri'], ['m', 'M', 'ri'], ['w', 'W', 'rm'], ['v', 'V', 'rr'], ['z', 'Z', 'rp'],
];

const COLEMAK_KEYS = [
  ['`', '~', 'lp'], ['1', '!', 'lp'], ['2', '@', 'lr'], ['3', '#', 'lm'], ['4', '$', 'li'], ['5', '%', 'li'],
  ['6', '^', 'ri'], ['7', '&', 'ri'], ['8', '*', 'rm'], ['9', '(', 'rr'], ['0', ')', 'rp'], ['-', '_', 'rp'], ['=', '+', 'rp'],
  ['q', 'Q', 'lp'], ['w', 'W', 'lr'], ['f', 'F', 'lm'], ['p', 'P', 'li'], ['g', 'G', 'li'],
  ['j', 'J', 'ri'], ['l', 'L', 'ri'], ['u', 'U', 'rm'], ['y', 'Y', 'rr'], [';', ':', 'rp'],
  ['[', '{', 'rp'], [']', '}', 'rp'], ['\\', '|', 'rp'],
  ['a', 'A', 'lp'], ['r', 'R', 'lr'], ['s', 'S', 'lm'], ['t', 'T', 'li'], ['d', 'D', 'li'],
  ['h', 'H', 'ri'], ['n', 'N', 'ri'], ['e', 'E', 'rm'], ['i', 'I', 'rr'], ['o', 'O', 'rp'], ["'", '"', 'rp'],
  ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['k', 'K', 'ri'], ['m', 'M', 'ri'], [',', '<', 'rm'], ['.', '>', 'rr'], ['/', '?', 'rp'],
];

const SPANISH_KEYS = [
  // Number row
  ['º', 'ª', 'lp', '\\'], ['1', '!', 'lp', '|'], ['2', '"', 'lr', '@'], ['3', '·', 'lm', '#'], ['4', '$', 'li', '~'], ['5', '%', 'li', '€'],
  ['6', '&', 'ri', '¬'], ['7', '/', 'ri'], ['8', '(', 'rm'], ['9', ')', 'rr'], ['0', '=', 'rp'], ["'", '?', 'rp'], ['¡', '¿', 'rp'],
  // Top row
  ['q', 'Q', 'lp'], ['w', 'W', 'lr'], ['e', 'E', 'lm', '€'], ['r', 'R', 'li'], ['t', 'T', 'li'],
  ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
  ['`', '^', 'rp', '['], ['+', '*', 'rp', ']'],
  // Home row
  ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
  ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], ['ñ', 'Ñ', 'rp'], ['´', '¨', 'rp', '{'], ['ç', 'Ç', 'rp', '}'],
  // Bottom row
  ['<', '>', 'lp'], ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['n', 'N', 'ri'], ['m', 'M', 'ri'], [',', ';', 'rm'], ['.', ':', 'rr'], ['-', '_', 'rp'],
];

function buildSpanishLayoutMap() {
  const map = buildLayoutMap(SPANISH_KEYS);
  const accented = [
    ['á', 'Á', 'lp'],
    ['é', 'É', 'lm'],
    ['í', 'Í', 'rm'],
    ['ó', 'Ó', 'rr'],
    ['ú', 'Ú', 'ri'],
    ['ü', 'Ü', 'ri'],
  ];
  accented.forEach(function (pair) {
    const lower = pair[0];
    const upper = pair[1];
    const finger = pair[2];
    const isLeft = IS_LEFT_HAND[finger];
    map[lower] = { finger: finger, label: lower, shift: false, modifierFinger: null, modifierLabel: null };
    map[upper] = { finger: finger, label: upper, shift: true, modifierFinger: isLeft ? 'rp' : 'lp', modifierLabel: 'Shift' };
  });
  return map;
}

const SPANISH_LATAM_KEYS = [
  // Number row
  ['|', '°', 'lp', '¬'], ['1', '!', 'lp'], ['2', '"', 'lr'], ['3', '#', 'lm'], ['4', '$', 'li'], ['5', '%', 'li'],
  ['6', '&', 'ri'], ['7', '/', 'ri'], ['8', '(', 'rm'], ['9', ')', 'rr'], ['0', '=', 'rp'], ["'", '?', 'rp', '\\'], ['¿', '¡', 'rp'],
  // Top row
  ['q', 'Q', 'lp', '@'], ['w', 'W', 'lr'], ['e', 'E', 'lm', '€'], ['r', 'R', 'li'], ['t', 'T', 'li'],
  ['y', 'Y', 'ri'], ['u', 'U', 'ri'], ['i', 'I', 'rm'], ['o', 'O', 'rr'], ['p', 'P', 'rp'],
  ['´', '¨', 'rp'], ['+', '*', 'rp', '~'],
  // Home row
  ['a', 'A', 'lp'], ['s', 'S', 'lr'], ['d', 'D', 'lm'], ['f', 'F', 'li'], ['g', 'G', 'li'],
  ['h', 'H', 'ri'], ['j', 'J', 'ri'], ['k', 'K', 'rm'], ['l', 'L', 'rr'], ['ñ', 'Ñ', 'rp'],
  ['{', '[', 'rp', '^'], ['}', ']', 'rp', '`'],
  // Bottom row
  ['<', '>', 'lp'], ['z', 'Z', 'lp'], ['x', 'X', 'lr'], ['c', 'C', 'lm'], ['v', 'V', 'li'], ['b', 'B', 'li'],
  ['n', 'N', 'ri'], ['m', 'M', 'ri'], [',', ';', 'rm'], ['.', ':', 'rr'], ['-', '_', 'rp'],
];

function buildSpanishLatamLayoutMap() {
  const map = buildLayoutMap(SPANISH_LATAM_KEYS);
  const accented = [
    ['á', 'Á', 'lp'],
    ['é', 'É', 'lm'],
    ['í', 'Í', 'rm'],
    ['ó', 'Ó', 'rr'],
    ['ú', 'Ú', 'ri'],
    ['ü', 'Ü', 'ri'],
  ];
  accented.forEach(function (pair) {
    const lower = pair[0];
    const upper = pair[1];
    const finger = pair[2];
    const isLeft = IS_LEFT_HAND[finger];
    map[lower] = { finger: finger, label: lower, shift: false, modifierFinger: null, modifierLabel: null };
    map[upper] = { finger: finger, label: upper, shift: true, modifierFinger: isLeft ? 'rp' : 'lp', modifierLabel: 'Shift' };
  });
  return map;
}

const KEYBOARD_LAYOUTS = {
  qwerty: {
    id: 'qwerty',
    name: 'QWERTY (US)',
    map: buildLayoutMap(QWERTY_KEYS),
  },
  spanish: {
    id: 'spanish',
    name: 'Spanish (ES)',
    map: buildSpanishLayoutMap(),
  },
  spanish_latam: {
    id: 'spanish_latam',
    name: 'Spanish (Latin America)',
    map: buildSpanishLatamLayoutMap(),
  },
  qwertz: {
    id: 'qwertz',
    name: 'QWERTZ (German)',
    map: buildLayoutMap(QWERTZ_KEYS),
  },
  azerty: {
    id: 'azerty',
    name: 'AZERTY (French)',
    map: buildLayoutMap(AZERTY_KEYS),
  },
  dvorak: {
    id: 'dvorak',
    name: 'Dvorak',
    map: buildLayoutMap(DVORAK_KEYS),
  },
  colemak: {
    id: 'colemak',
    name: 'Colemak',
    map: buildLayoutMap(COLEMAK_KEYS),
  },
};

/**
 * Lookup guide information for a character on a chosen layout.
 * @param {string} ch
 * @param {string} [layoutId='qwerty']
 * @returns {{ finger: string, fingerName: string, label: string, modifierFinger: string | null, modifierLabel: string | null, description: string } | null}
 */
function getKeyGuide(ch, layoutId) {
  const layout = KEYBOARD_LAYOUTS[layoutId] || KEYBOARD_LAYOUTS.qwerty;
  let info = layout.map[ch];

  // Fallback for case variation if not directly mapped
  if (!info && ch) {
    const lower = ch.toLowerCase();
    const upper = ch.toUpperCase();
    if (ch === upper && layout.map[lower]) {
      const baseInfo = layout.map[lower];
      const isLeft = IS_LEFT_HAND[baseInfo.finger];
      info = {
        finger: baseInfo.finger,
        label: ch,
        shift: true,
        modifierFinger: isLeft ? 'rp' : 'lp',
        modifierLabel: 'Shift',
      };
    } else if (layout.map[lower]) {
      info = layout.map[lower];
    }
  }

  if (!info) return null;

  const fingerName = FINGER_NAMES[info.finger] || info.finger;
  let desc = fingerName;
  if (info.modifierFinger && info.modifierLabel) {
    const modFingerName = FINGER_NAMES[info.modifierFinger] || info.modifierFinger;
    desc += ' + ' + info.modifierLabel + ' (' + modFingerName + ')';
  }

  let displayLabel = info.label;
  if (ch === ' ') displayLabel = 'Space';
  else if (ch === '\n') displayLabel = 'Enter';
  else if (ch === '\t') displayLabel = 'Tab';

  return {
    finger: info.finger,
    fingerName: fingerName,
    label: displayLabel,
    modifierFinger: info.modifierFinger,
    modifierLabel: info.modifierLabel,
    description: desc,
  };
}
