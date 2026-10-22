// Word lists used by the "Random text" card.
// Each key is a character set name (it appears in the card's "Character set" dropdown).
// `wrappers` are optional extra symbol pairs that are common in that language.
// Add words to any group (or add a new group) freely; duplicates are removed when the page loads.
const WORD_SETS = {
  Standard: {
    words: [].concat(
      // Common function words
      ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he',
       'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
       'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
       'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
       'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
       'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
       'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
       'day', 'most', 'while', 'where', 'every', 'both', 'between', 'under', 'again', 'never', 'always',
       'often', 'still', 'before', 'during', 'without', 'within', 'around', 'through', 'against', 'across',
       'along', 'among', 'since', 'until', 'although', 'however', 'whether', 'either', 'another', 'each',
       'many', 'much', 'more', 'less', 'few', 'several', 'enough', 'such', 'same', 'different', 'next',
       'last', 'early', 'late', 'soon', 'already', 'almost', 'maybe', 'perhaps', 'really', 'quite', 'rather'],
      // Everyday verbs
      ['walk', 'run', 'jump', 'sit', 'stand', 'open', 'close', 'start', 'stop', 'begin', 'finish', 'build',
       'break', 'carry', 'catch', 'choose', 'climb', 'collect', 'cook', 'count', 'cross', 'dance', 'decide',
       'draw', 'drink', 'drive', 'eat', 'enjoy', 'explain', 'fall', 'feel', 'find', 'fix', 'fly', 'follow',
       'forget', 'grow', 'guess', 'hear', 'help', 'hold', 'hope', 'imagine', 'join', 'keep', 'kick', 'laugh',
       'learn', 'leave', 'lift', 'listen', 'live', 'love', 'meet', 'move', 'need', 'notice', 'offer', 'order',
       'paint', 'pass', 'pick', 'plan', 'play', 'press', 'pull', 'push', 'read', 'remember', 'repeat', 'reply',
       'rest', 'ride', 'ring', 'rise', 'roll', 'save', 'search', 'send', 'share', 'show', 'sing', 'sleep',
       'smile', 'speak', 'spend', 'stay', 'study', 'swim', 'talk', 'teach', 'tell', 'throw', 'touch', 'travel',
       'try', 'turn', 'visit', 'wait', 'wake', 'watch', 'wear', 'wish', 'write'],
      // Everyday nouns
      ['house', 'door', 'table', 'chair', 'kitchen', 'bedroom', 'bridge', 'street', 'city', 'village',
       'country', 'island', 'mountain', 'valley', 'forest', 'field', 'lake', 'ocean', 'beach', 'desert',
       'cloud', 'storm', 'wind', 'rain', 'snow', 'sun', 'moon', 'star', 'light', 'shadow', 'fire', 'stone',
       'metal', 'paper', 'glass', 'wood', 'cotton', 'silver', 'bread', 'butter', 'cheese', 'apple', 'orange',
       'lemon', 'tomato', 'potato', 'carrot', 'soup', 'salad', 'sugar', 'honey', 'tea', 'milk', 'water',
       'dinner', 'breakfast', 'lunch', 'market', 'store', 'bank', 'office', 'school', 'library', 'museum',
       'hospital', 'station', 'airport', 'train', 'bus', 'car', 'bicycle', 'boat', 'ticket', 'road', 'map',
       'letter', 'message', 'story', 'song', 'picture', 'movie', 'game', 'team', 'friend', 'family', 'neighbor',
       'teacher', 'student', 'doctor', 'farmer', 'artist', 'writer', 'driver', 'player', 'child', 'mother',
       'father', 'sister', 'brother', 'dog', 'cat', 'bird', 'horse', 'fish', 'rabbit', 'tiger', 'flower',
       'tree', 'grass', 'seed', 'leaf', 'garden', 'river', 'morning', 'evening', 'night', 'week', 'month'],
      // Descriptive words
      ['small', 'large', 'tiny', 'huge', 'tall', 'short', 'long', 'wide', 'narrow', 'heavy', 'light', 'soft',
       'hard', 'smooth', 'rough', 'warm', 'cold', 'hot', 'cool', 'dry', 'wet', 'clean', 'dirty', 'quiet',
       'loud', 'bright', 'dark', 'sweet', 'sour', 'fresh', 'old', 'young', 'happy', 'sad', 'angry', 'calm',
       'brave', 'kind', 'honest', 'clever', 'gentle', 'proud', 'careful', 'curious', 'lucky', 'busy', 'ready',
       'safe', 'strong', 'weak', 'rich', 'poor', 'empty', 'full', 'simple', 'quick', 'slow', 'steady',
       'sharp', 'round', 'flat', 'straight', 'broken', 'perfect', 'special', 'common', 'strange', 'famous'],
      // Typing and technology
      ['keyboard', 'finger', 'practice', 'speed', 'accuracy', 'window', 'rhythm', 'number', 'screen', 'pocket',
       'computer', 'laptop', 'mouse', 'cable', 'battery', 'network', 'server', 'program', 'software',
       'website', 'browser', 'button', 'folder', 'document', 'password', 'camera', 'phone', 'signal', 'update',
       'download', 'upload', 'search', 'memory', 'storage', 'device', 'display', 'cursor', 'command', 'function',
       'variable', 'system', 'design', 'pattern', 'method', 'result', 'error', 'review', 'project', 'report',
       'budget', 'meeting', 'schedule', 'deadline', 'customer', 'product', 'service', 'quality', 'package'],
      // Abstract nouns
      ['idea', 'thought', 'reason', 'answer', 'question', 'problem', 'solution', 'chance', 'change', 'choice',
       'danger', 'dream', 'effort', 'energy', 'example', 'fact', 'future', 'history', 'hope', 'journey',
       'knowledge', 'language', 'lesson', 'luck', 'moment', 'music', 'nature', 'order', 'peace', 'power',
       'price', 'progress', 'promise', 'purpose', 'respect', 'secret', 'silence', 'skill', 'society', 'spirit',
       'success', 'trust', 'truth', 'value', 'victory', 'wisdom', 'wonder', 'coffee']
    ),
    wrappers: [],
  },
  Spanish: {
    words: [].concat(
      // Palabras comunes
      ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'una', 'los', 'las', 'por', 'con', 'para', 'como', 'pero',
       'más', 'muy', 'también', 'año', 'años', 'niño', 'niña', 'mañana', 'señor', 'pequeño', 'montaña',
       'español', 'su', 'al', 'lo', 'le', 'se', 'no', 'sí', 'mi', 'tu', 'nos', 'les', 'sus', 'este', 'esta',
       'ese', 'esa', 'todo', 'todos', 'toda', 'todas', 'otro', 'otra', 'otros', 'mismo', 'cada', 'algo',
       'nada', 'alguien', 'nadie', 'mucho', 'poco', 'tanto', 'menos', 'bien', 'mal', 'ya', 'aún', 'todavía',
       'entonces', 'luego', 'antes', 'mientras', 'durante', 'sobre', 'entre', 'desde', 'hasta', 'hacia',
       'sin', 'tras', 'cuando', 'donde', 'quien', 'cual', 'porque', 'aunque', 'sino', 'además', 'incluso',
       'quizás', 'tal', 'vez', 'ahora', 'ayer', 'hoy', 'siempre', 'nunca', 'casi', 'solo', 'cerca', 'lejos'],
      // Palabras con tilde y eñe
      ['cigüeña', 'pingüino', 'vergüenza', 'canción', 'corazón', 'razón', 'avión', 'lección', 'atención',
       'información', 'camión', 'limón', 'jamón', 'árbol', 'fácil', 'difícil', 'útil', 'teléfono', 'música',
       'médico', 'número', 'último', 'país', 'día', 'tía', 'río', 'frío', 'café', 'sofá', 'después', 'adiós',
       'según', 'aquí', 'allí', 'así', 'está', 'habló', 'comió', 'vivió', 'escribió', 'aprendió', 'sueño',
       'bañera', 'cariño', 'campaña', 'compañía', 'dueño', 'enseñanza', 'extraño', 'montañas', 'otoño',
       'pañuelo', 'piñata', 'riñón', 'sabía', 'tenía', 'quería', 'podía', 'hacía', 'había', 'sería', 'iría',
       'estación', 'habitación', 'educación', 'emoción', 'nación', 'opinión', 'pasión', 'población', 'relación',
       'situación', 'tradición', 'versión', 'decisión', 'televisión', 'conversación', 'imaginación', 'lámpara',
       'pájaro', 'pétalo', 'plátano', 'tómbola', 'cámara', 'página', 'máquina', 'física', 'química', 'lógica',
       'público', 'práctica', 'crítica', 'histórico', 'económico', 'eléctrico', 'automático', 'simpático',
       'también', 'además', 'inglés', 'francés', 'japonés', 'portugués', 'revés', 'interés', 'compás',
       'detrás', 'quizás', 'jamás', 'demás', 'ningún', 'algún', 'común', 'según', 'sofá', 'papá', 'mamá'],
      // Vida diaria
      ['casa', 'calle', 'ciudad', 'pueblo', 'escuela', 'trabajo', 'familia', 'amigo', 'amiga', 'libro', 'agua',
       'tiempo', 'vida', 'mundo', 'noche', 'tarde', 'lluvia', 'sol', 'luna', 'estrella', 'ventana', 'puerta',
       'mesa', 'silla', 'cama', 'cocina', 'baño', 'jardín', 'parque', 'plaza', 'mercado', 'tienda', 'banco',
       'oficina', 'biblioteca', 'museo', 'hospital', 'tren', 'autobús', 'coche', 'bicicleta', 'barco', 'camino',
       'puente', 'playa', 'isla', 'bosque', 'campo', 'río', 'lago', 'mar', 'cielo', 'nube', 'viento', 'nieve',
       'fuego', 'piedra', 'papel', 'madera', 'vidrio', 'pan', 'queso', 'leche', 'huevo', 'manzana', 'naranja',
       'tomate', 'patata', 'zanahoria', 'sopa', 'ensalada', 'azúcar', 'miel', 'té', 'desayuno', 'comida',
       'cena', 'madre', 'padre', 'hermano', 'hermana', 'abuelo', 'abuela', 'primo', 'prima', 'vecino', 'maestro',
       'alumno', 'médica', 'cantante', 'pintor', 'escritor', 'perro', 'gato', 'pájaro', 'caballo', 'pez',
       'conejo', 'tigre', 'flor', 'hierba', 'semilla', 'hoja', 'semana', 'mes', 'lunes', 'martes', 'viernes'],
      // Verbos
      ['ordenador', 'teclado', 'pantalla', 'caminar', 'correr', 'saltar', 'sentarse', 'abrir', 'cerrar',
       'empezar', 'terminar', 'construir', 'romper', 'llevar', 'coger', 'elegir', 'subir', 'bajar', 'cocinar',
       'contar', 'cruzar', 'bailar', 'decidir', 'dibujar', 'beber', 'conducir', 'comer', 'disfrutar',
       'explicar', 'caer', 'sentir', 'encontrar', 'arreglar', 'volar', 'seguir', 'olvidar', 'crecer',
       'adivinar', 'oír', 'ayudar', 'sostener', 'esperar', 'imaginar', 'unir', 'guardar', 'reír', 'aprender',
       'dejar', 'escuchar', 'vivir', 'amar', 'conocer', 'mover', 'necesitar', 'notar', 'ofrecer', 'pedir',
       'pintar', 'pasar', 'planear', 'jugar', 'apretar', 'tirar', 'leer', 'recordar', 'repetir', 'responder',
       'descansar', 'montar', 'sonar', 'buscar', 'enviar', 'compartir', 'mostrar', 'cantar', 'dormir',
       'sonreír', 'hablar', 'gastar', 'quedarse', 'estudiar', 'nadar', 'enseñar', 'decir', 'tocar', 'viajar',
       'probar', 'girar', 'visitar', 'despertar', 'mirar', 'vestir', 'desear', 'escribir', 'pensar', 'poder'],
      // Adjetivos y cualidades
      ['rápido', 'lento', 'bonito', 'grande', 'nuevo', 'viejo', 'bueno', 'feliz', 'triste', 'cansado',
       'contento', 'constancia', 'precisión', 'velocidad', 'ejercicio', 'dedos', 'pequeño', 'enorme', 'alto',
       'bajo', 'largo', 'corto', 'ancho', 'estrecho', 'pesado', 'ligero', 'suave', 'duro', 'liso', 'áspero',
       'cálido', 'frío', 'caliente', 'seco', 'mojado', 'limpio', 'sucio', 'tranquilo', 'ruidoso', 'brillante',
       'oscuro', 'dulce', 'amargo', 'fresco', 'joven', 'enfadado', 'valiente', 'amable', 'honesto', 'listo',
       'tímido', 'orgulloso', 'cuidadoso', 'curioso', 'afortunado', 'ocupado', 'preparado', 'seguro', 'fuerte',
       'débil', 'rico', 'pobre', 'vacío', 'lleno', 'sencillo', 'afilado', 'redondo', 'plano', 'recto', 'roto',
       'perfecto', 'especial', 'común', 'extraño', 'famoso', 'antiguo', 'moderno', 'tranquilidad', 'alegría'],
      // Conceptos
      ['idea', 'pensamiento', 'motivo', 'respuesta', 'pregunta', 'problema', 'solución', 'oportunidad',
       'cambio', 'elección', 'peligro', 'esfuerzo', 'energía', 'ejemplo', 'hecho', 'futuro', 'historia',
       'esperanza', 'viaje', 'conocimiento', 'idioma', 'lengua', 'suerte', 'momento', 'naturaleza', 'orden',
       'paz', 'poder', 'precio', 'progreso', 'promesa', 'propósito', 'respeto', 'secreto', 'silencio',
       'habilidad', 'sociedad', 'espíritu', 'éxito', 'confianza', 'verdad', 'valor', 'victoria', 'sabiduría',
       'maravilla', 'programa', 'servidor', 'red', 'archivo', 'carpeta', 'contraseña', 'botón', 'sistema',
       'proyecto', 'informe', 'reunión', 'calendario', 'cliente', 'producto', 'servicio', 'calidad']
    ),
    wrappers: [['¿', '?'], ['¡', '!']],
  },
};

// Remove duplicate words inside each set so every word is equally likely.
Object.keys(WORD_SETS).forEach(function (name) {
  WORD_SETS[name].words = WORD_SETS[name].words.filter(function (w, i, all) {
    return all.indexOf(w) === i;
  });
});
