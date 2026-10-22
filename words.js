// Word lists used by the "Random text" card.
// Each key is a character set name (it appears in the card's "Character set" dropdown).
// `wrappers` are optional extra symbol pairs that are common in that language.
const WORD_SETS = {
  Standard: {
    words: [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he',
      'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
      'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
      'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
      'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
      'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
      'day', 'most', 'keyboard', 'finger', 'practice', 'speed', 'accuracy', 'window', 'garden', 'river',
      'morning', 'coffee', 'simple', 'quick', 'steady', 'rhythm', 'letter', 'number', 'screen', 'pocket',
    ],
    wrappers: [],
  },
  Spanish: {
    words: [
      'el', 'la', 'de', 'que', 'y', 'en', 'un', 'una', 'los', 'las', 'por', 'con', 'para', 'como', 'pero',
      'más', 'muy', 'también', 'año', 'años', 'niño', 'niña', 'mañana', 'señor', 'pequeño', 'montaña',
      'español', 'cigüeña', 'pingüino', 'vergüenza', 'canción', 'corazón', 'razón', 'avión', 'lección',
      'atención', 'información', 'camión', 'limón', 'jamón', 'árbol', 'fácil', 'difícil', 'útil',
      'teléfono', 'música', 'médico', 'número', 'último', 'país', 'día', 'tía', 'río', 'frío', 'café',
      'sofá', 'después', 'adiós', 'según', 'aquí', 'allí', 'así', 'está', 'habló', 'comió', 'vivió',
      'escribió', 'aprendió', 'ayer', 'hoy', 'siempre', 'nunca', 'casa', 'calle', 'ciudad', 'pueblo',
      'escuela', 'trabajo', 'familia', 'amigo', 'amiga', 'libro', 'agua', 'tiempo', 'vida', 'mundo',
      'noche', 'tarde', 'lluvia', 'sol', 'luna', 'estrella', 'ventana', 'puerta', 'mesa', 'silla',
      'ordenador', 'teclado', 'pantalla', 'rápido', 'lento', 'bonito', 'grande', 'nuevo', 'viejo', 'bueno',
      'feliz', 'triste', 'cansado', 'contento', 'práctica', 'constancia', 'precisión', 'velocidad',
      'ejercicio', 'dedos',
    ],
    wrappers: [['¿', '?'], ['¡', '!']],
  },
};
