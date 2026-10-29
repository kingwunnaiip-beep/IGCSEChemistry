# Biology quiz — 72 questions, with your explanation SVGs

Open `index.html` in your browser. Keep `index.html`, `styles.css`, `script.js` and the `images/` folder together. No installation or build tools are required.

- `index.html`: page structure.
- `styles.css`: layout, typography, colours, animations and responsive styles.
- `script.js`: all 72 questions, answers, explanations, past-paper tags and quiz controls.
- `images/`: the existing downloaded JPG/PNG images plus 42 explanation SVGs matching your filenames.
- `IMAGE-CREDITS.md`: image sources, authors and licences.

## Explanation images

Every one of the 72 answer explanations contains a relevant downloaded JPG/PNG image, descriptive alternative text, a caption and source credits. The images display without an internet connection. Existing interactive graphs and teaching models are preserved alongside them. Original source/licence links open online when clicked.

## Your SVG explanation diagrams

The 42 matching diagrams are already included and display in the answer feedback after **Check answer**, alongside the existing written explanations, photographs and interactive models. Click a diagram or **Open full size** to read it in a new tab.

To use your own copies, place them in the **`images/` folder beside the source files**, keeping these exact filenames (including the leading zero for 7–9):

```text
quiz-folder/
  index.html
  styles.css
  script.js
  images/
    q07-explanation.svg
    q08-explanation.svg
    ...
    q59-explanation.svg
```

Supported filenames: **q07–q11**, **q13–q29**, **q39**, and **q41–q59**, each ending in `-explanation.svg`. These numbers refer to the **quiz question numbers**, rather than the numbers printed on the original papers. No code edit is needed to replace any of these files. The other 30 questions retain their current explanation images.

To connect an additional diagram, find `explanationDiagramTitles` in `script.js` and add the quiz number and a short descriptive title; save its file as `images/qNN-explanation.svg`. If a diagram is missing or cannot load, the existing explanation still displays without a broken-image placeholder. Reload the page after changing a file; a hard refresh clears any older browser-cached copy.

## Your question photos and logo

The uploaded exam-question photos and your logo remain separate from the explanation images. Move these files from beside `index.html` into the **`images/` folder**, keeping their filenames:

- `dr-king-wunna-logo.png`
- `question-11.png`
- `question-15.png`
- `question-17.png`
- `question-18.png`
- `question-19.png`
- `question-20.png`
- `question-21.png`
- `question-23.png`
- `question-24.png`
- `question-26.png`
- `question-27.png`
- `question-28.png`
- `question-40.png`
- `question-5.png`
- `question-59.png`

Question 59 loads your diagram from `images/question-59.png`. Save that image inside `images/`. To change its filename, search for `src="images/question-59.png"` in `script.js`.

The logo also loads from `images/dr-king-wunna-logo.png`. The folder structure is:

```text
quiz-folder/
  index.html
  styles.css
  script.js
  images/
    dr-king-wunna-logo.png
    question-5.png
    question-11.png
    ...
    question-40.png
    question-59.png
    q07-explanation.svg
    ...
```

If you are updating your existing quiz, replace **both `index.html` and `script.js`**, then move the question PNGs and logo into `images/`. Your stylesheet, explanation SVGs and downloaded images stay in their existing locations. The original uploaded question photos and logo are supplied by you; they are not fabricated in this package.

## Editing questions

In `script.js`, find `const questions = [`. Each question stores its title, choices, correct answer, explanation and past-paper tags. All previous 70 questions are preserved, including the qualified urea answer, numbered cat pedigree, restored allele notation, user-upload path for question 59 and blank source tag for question 51.

The latest additions are both from **0610/22/F/M/25 — Feb/March 2025**:

- **71 — Photosynthesis and respiration over 24 hours:** A, photosynthesis in light and respiration throughout day and night. Original question 10. Four original downloaded PNG graph choices preserve the solid/dashed key, time ticks and arbitrary rate units. Feedback includes the correct graph and a day/night comparison. Scroll within a graph if enlarged text makes it wider than its card.
- **72 — DNA mass during cell division:** D, two daughter cells form at the downward step in DNA mass per cell. Original question 31. Includes the original graph, a labelled illustrative 2 → 4 → 2 + 2 DNA model and the downloaded mitosis illustration. The explanation distinguishes replication, mitosis and cytokinesis, and preserves the combined DNA amount across the daughter cells.

The quiz keeps its correct/incorrect highlights, 0.8-second cues, generated sound effects, fixed logo, text-size controls and progress navigation.

## Scrolling the side panel

The question navigator has its own scrollbar. Scroll the question numbers with the mouse wheel or touch; keyboard users can focus the list and press Page Down or the arrow keys. The text-size and sound controls remain above the list on normal-height screens. On short screens, the whole panel scrolls to keep every control reachable. Scrolling the panel does not scroll the question, and its position is retained when an answer is checked or a question is selected. All 72 questions and image files are preserved.

## Compact question header

The live question counter, past-paper source and side-panel button now share one compact row. “Choose one answer” has been removed. The counter uses the actual question total, currently 72. The panel button remains visible beside the metadata; at enlarged text sizes, the metadata can scroll sideways without moving the button. The mobile session text remains available through the source’s title/accessibility information. This reduces the default header spacing by approximately 42 pixels. All question content, images, answer behaviour and independent sidebar scrolling are preserved.
