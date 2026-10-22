# Typing Practice

A small touch-typing practice app. Plain HTML, CSS and JavaScript: no libraries, no build step, no server.

## Run

Double-click `index.html` (or open it in any modern browser). It works from `file://`.

## How it works

1. Pick a text from the list.
2. Click the text area if it isn't focused, then start typing. The timer starts on your first key.
3. Character colours:
   - green: correct on the first attempt
   - red: currently wrong
   - yellow: was wrong, erased with Backspace, then typed correctly
4. Wrong characters do not block you. Backspace deletes the last typed character.
5. The session ends when you have typed as many characters as the text contains. `Esc` or "Back to list" abandons it.
6. The results show net WPM, raw WPM, accuracy, time, errors and corrected errors.
   - 1 word = 5 characters
   - Net WPM counts only characters that are correct at the end
   - Raw WPM counts every character keystroke
   - Accuracy = characters correct on the first attempt ÷ total characters

## Add a text

Edit `texts.js` and add an object to the `TEXTS` array:

```js
{
  id: 'my-text',          // unique, no spaces
  category: 'Prose',      // group heading in the list (any name; new names create a new group)
  difficulty: 'Easy',     // 'Easy', 'Medium' or 'Hard'
  title: 'My Custom Text', // shown in the list
  text: 'The text you want to practise.',
},
```

Notes:
- Reload `index.html` to see the change.
- Use plain characters you can type on your keyboard. Characters you can't type will block completion.
- Use `\n` inside the string for a line break; the user presses Enter to type it.
- Use `\t` for a tab character; the user presses Tab to type it. Indentation with spaces is typed as ordinary spaces.
- Stick to characters on a standard keyboard (plain `-` rather than long dashes, straight quotes rather than curly ones).
- Quote the string with `'...'` and escape any apostrophe as `\'`, or use `"..."` or backticks instead.

## Files

- `index.html`: markup for the list, practice and results views
- `style.css`: layout and theme
- `texts.js`: the available texts (`const TEXTS`)
- `app.js`: view switching, typing engine, metrics
