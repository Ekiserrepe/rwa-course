# Adding a Module

## 1. Write the scripts first

If the module teaches code, put runnable scripts in `examples/` (CommonJS, using
`examples/lib/xahau.js`) and run them against testnet. Lessons show these files
verbatim, so the code a reader copies is the code that was tested.

## 2. Create the module file

`src/data/modules/mXX-your-slug.js`:

```js
import { example } from '../example-code.js'

export default {
  id: "m12",                 // unique; also the key for its icon and quiz
  icon: "🔮",                // fallback only, see step 4
  title: { en: "Module Title" },
  lessons: [
    {
      id: "m12l1",           // unique; progress is stored under this id
      title: { en: "Lesson Title" },
      theory: { en: `Markdown-ish text…` },
      codeBlocks: [
        {
          title: { en: "examples/80-my-script.js" },
          language: "javascript",          // javascript | bash | c | json | html | text
          code: example("80-my-script.js"), // a path under /examples
        },
        // Inline code is fine for snippets that are not standalone scripts:
        { title: { en: "Snippet" }, language: "bash", code: `npm install xahau` },
      ],
      slides: [
        { title: { en: "Slide" }, content: { en: "Line 1\n• Point" }, visual: "🔮" },
      ],
    },
  ],
}
```

`example(path)` throws at build time if the file does not exist.

### Theory formatting

Supported: `### headings`, `**bold**`, `` `code` ``, `[links](url)`, `- bullets`,
indented `  - sub-bullets`, `1. numbered`, `> callouts`, tables and fenced code.
Single-asterisk italics are **not** supported; use bold.

## 3. Register it

Add the filename to `src/data/module-list.js` in running order.

## 4. Give it an icon

Add an entry for its `id` to `ICON_PATHS` in `src/components/Brand.jsx`.
The tests fail if one is missing.

## 5. Optional: a module check

`src/data/quizzes/<id>.js` exporting an array of
`{ id, question: {en}, options: [{en}…], answer, explain: {en} }`.
Questions must be answerable from that module's own lessons.

## 6. Check

```sh
npm test && npm run lint && npm run dev
```
