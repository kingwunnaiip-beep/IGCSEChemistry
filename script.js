
		const form = document.querySelector("#quiz-form");
		const checkButton = document.querySelector("#check-button");
		const selectionHint = document.querySelector("#selection-hint");
		const feedback = document.querySelector("#feedback");
		const answerAnnouncement = document.querySelector("#answer-announcement");
		const quiz = document.querySelector(".quiz");
		const questionCount = document.querySelector("#question-count");
		const questionPaper = document.querySelector("#question-paper");
		const paperCode = document.querySelector("#paper-code");
		const paperSession = document.querySelector("#paper-session");
		const quizLayout = document.querySelector("#quiz-layout");
		const questionNavList = document.querySelector("#question-nav-list");
		const navigatorToggle = document.querySelector("#toggle-navigator");
		const progressTrack = document.querySelector("#progress-track");
		const progressValue = document.querySelector("#progress-value");
		const questionTitle = document.querySelector("#question-title");
		const questionContext = document.querySelector("#question-context");
		const questionLegend = document.querySelector("#question-legend");
		const answerOptions = document.querySelector("#answer-options");
		const nextQuestionButton = document.querySelector("#next-question-button");
		const graphMeasurements = [
			{ intensity: 1, oxygen: 2.5, x: 135, y: 234 },
			{ intensity: 4, oxygen: 7, x: 277, y: 126 },
			{ intensity: 8, oxygen: 9, x: 466, y: 78 },
			{ intensity: 11, oxygen: 9, x: 608, y: 78 }
		];
		const decreaseTextButton = document.querySelector("#decrease-text");
		const increaseTextButton = document.querySelector("#increase-text");
		const resetTextButton = document.querySelector("#reset-text");
		const textSizeValue = document.querySelector("#text-size-value");
		const defaultTextScale = 1;
		let textScale = defaultTextScale;
		let currentQuestionIndex = 0;

// Call only on an explicit answer check. Navigation and answer changes call clearAnswerCue().
(() => {
    const cue = document.getElementById("answer-cue");
    const icon = document.getElementById("answer-cue-icon");
    const label = document.getElementById("answer-cue-label");
    const soundToggle = document.getElementById("sound-toggle");
    const activeNotes = new Set();
    let soundEnabled = true;
    let context = null;
    let cueTimer = 0;
    let sequence = 0;

    function releaseNote(note, stop) {
        note.oscillator.onended = null;
        if (stop) {
            try { note.oscillator.stop(); } catch (_) { /* Already stopped or not started. */ }
        }
        try { note.oscillator.disconnect(); } catch (_) { /* A disconnected node is harmless. */ }
        try { note.gain.disconnect(); } catch (_) { /* A disconnected node is harmless. */ }
        activeNotes.delete(note);
    }

    function stopAudio() {
        activeNotes.forEach((note) => releaseNote(note, true));
    }

    function clearAnswerCue() {
        sequence += 1;
        clearTimeout(cueTimer);
        cueTimer = 0;
        if (cue) {
            cue.hidden = true;
            cue.classList.remove("is-correct", "is-incorrect");
        }
        stopAudio();
    }

    function scheduleTone(audio, tone, deadline) {
        const remaining = (deadline - performance.now()) / 1000;
        const duration = Math.min(tone.duration, remaining - tone.offset - .01);
        if (duration < .04) return;
        let oscillator;
        let gain;
        let note;
        try {
            oscillator = audio.createOscillator();
            gain = audio.createGain();
            note = { oscillator, gain };
            activeNotes.add(note);
            const start = audio.currentTime + .01 + tone.offset;
            const end = start + duration;
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(tone.frequency, start);
            if (tone.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(tone.volume, start + Math.min(.012, duration / 4));
            gain.gain.exponentialRampToValueAtTime(.0001, end);
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.onended = () => releaseNote(note, false);
            oscillator.start(start);
            oscillator.stop(end);
        } catch (_) {
            if (note) releaseNote(note, true);
            else {
                try { oscillator?.disconnect(); } catch (_) { /* Unsupported audio stays silent. */ }
                try { gain?.disconnect(); } catch (_) { /* Unsupported audio stays silent. */ }
            }
        }
    }

    function playSound(isCorrect, ticket, deadline) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!soundEnabled || !Audio) return;
        try {
            if (!context || context.state === "closed") context = new Audio();
            const audio = context;
            // Invoke resume synchronously within the user's Check answer gesture.
            const ready = audio.state === "running" ? Promise.resolve() : audio.resume();
            Promise.resolve(ready).then(() => {
                if (ticket !== sequence || !soundEnabled || performance.now() >= deadline || audio.state !== "running") return;
                const tones = isCorrect
                    ? [
                        { frequency: 523.25, offset: 0, duration: .18, volume: .035 },
                        { frequency: 659.25, offset: .10, duration: .20, volume: .035 },
                        { frequency: 783.99, offset: .20, duration: .27, volume: .035 }
                    ]
                    : [{ frequency: 220, endFrequency: 146.83, offset: 0, duration: .34, volume: .05 }];
                tones.forEach((tone) => scheduleTone(audio, tone, deadline));
            }).catch(() => { /* Browser audio restrictions must not interrupt the quiz. */ });
        } catch (_) { /* Unsupported or blocked Web Audio leaves the visual cue available. */ }
    }

    function showAnswerCue(isCorrect) {
        clearAnswerCue();
        if (!cue) return;
        const ticket = sequence;
        const deadline = performance.now() + 800;
        // Cold audio setup can block briefly; finish it before starting the visual cue.
        playSound(Boolean(isCorrect), ticket, deadline);
        if (icon) icon.textContent = isCorrect ? "✓" : "✕";
        if (label) label.textContent = isCorrect ? "Correct!" : "Incorrect";
        cue.hidden = false;
        void cue.offsetWidth;
        cue.classList.add(isCorrect ? "is-correct" : "is-incorrect");
        cueTimer = setTimeout(clearAnswerCue, 800);
    }

    function updateSoundToggle() {
        if (!soundToggle) return;
        soundToggle.setAttribute("aria-pressed", String(soundEnabled));
        soundToggle.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
        soundToggle.setAttribute("aria-label", soundEnabled ? "Sound effects on. Turn sound off." : "Sound effects off. Turn sound on.");
    }

    soundToggle?.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        if (!soundEnabled) {
            sequence += 1;
            stopAudio();
        }
        updateSoundToggle();
    });

    window.showAnswerCue = showAnswerCue;
    window.clearAnswerCue = clearAnswerCue;
    updateSoundToggle();
})();

		const questions = [
			{
				title: "Earthworms come to the soil surface after heavy rain. Which characteristic of living organisms does this show?",
				paperCode: "0610/23/M/J/26",
				paperSession: "May/June 2026",
				legend: "Choose the characteristic shown by the earthworms",
				options: ["Reproduction", "Sensitivity", "Nutrition", "Growth"],
				correct: "B",
				answer: "B. Sensitivity",
				explanation: `
					<p class="definition">Sensitivity is the ability of an organism to detect a stimulus (a change in its internal or external environment) and make an appropriate response.</p>
					<p><strong>In this example:</strong></p>
					<ul class="option-explanations">
						<li><strong>Stimulus:</strong> Heavy rainfall can waterlog the soil and reduce the oxygen available to earthworms.</li>
						<li><strong>Response:</strong> The earthworms move towards the soil surface.</li>
					</ul>
					<figure class="explanation-photo">
						<img src="images/earthworm.jpg" alt="An earthworm on damp soil" loading="lazy" decoding="async">
						<figcaption>Earthworm on damp soil. Photo by Jochem Kühnen via <a href="https://commons.wikimedia.org/wiki/File:Aporrectodea_rosea_(Gelderland,_Netherlands).jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, licensed under CC BY 4.0.</figcaption>
					</figure>
					<p class="relationship">Stimulus &rarr; Detection &rarr; Response</p>
					<h3>Why the other options do not fit</h3>
					<ul class="option-explanations">
						<li><strong>A. Reproduction:</strong> Producing offspring of the same kind.</li>
						<li><strong>B. Sensitivity:</strong> Detecting and responding to a stimulus. <strong>That is what happens here.</strong></li>
						<li><strong>C. Nutrition:</strong> Taking in materials for energy, growth and development.</li>
						<li><strong>D. Growth:</strong> A permanent increase in size and dry mass.</li>
					</ul>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> When a question describes an organism responding to an environmental change, look for sensitivity rather than simply movement.</p>
				`
			},
			{
				title: "Which species can breed with <i>Prunella vulgaris</i> to produce fertile offspring?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the option showing which species can breed with Prunella vulgaris to produce fertile offspring",
				context: `
					<table class="comparison-table answer-selection-table">
						<caption>For each option, decide whether the named species can produce fertile offspring with <i>Prunella vulgaris</i>.</caption>
						<thead>
							<tr><th scope="col">Option</th><th scope="col"><i>Prunella modularis</i></th><th scope="col"><i>Vespula vulgaris</i></th></tr>
						</thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td></tr>
						</tbody>
					</table>
					<p class="table-key"><strong>Key:</strong> ✓ = yes; ✗ = no</p>
				`,
				options: ["Option A", "Option B", "Option C", "Option D"],
				hideAnswerOptions: true,
				correct: "D",
				answer: "D. Neither species",
				explanation: `
					<p class="definition">According to the biological species concept, a species is a group of organisms that can reproduce with each other to produce fertile offspring.</p>
					<h3>Compare the scientific names</h3>
					<ul class="option-explanations">
						<li><strong>First word:</strong> The genus.</li>
						<li><strong>Second word:</strong> The specific name (species epithet).</li>
						<li><strong><i>Prunella modularis</i>:</strong> It shares the genus <i>Prunella</i> with <i>Prunella vulgaris</i>, but the species epithet is different. They are different species.</li>
						<li><strong><i>Vespula vulgaris</i>:</strong> It shares the epithet <i>vulgaris</i>, but its genus is <i>Vespula</i>, not <i>Prunella</i>. They are different species.</li>
					</ul>
					<p>Neither candidate is the same species as <i>Prunella vulgaris</i>, so neither can produce fertile offspring with it. The correct combination is <strong>no, no</strong>.</p>
					<div class="species-photo-grid" aria-label="Photographs of the three named organisms">
						<figure class="species-photo">
							<img src="images/prunella-vulgaris.jpg" alt="Flowering Prunella vulgaris plant" loading="lazy" decoding="async">
							<figcaption><i>Prunella vulgaris</i>. Photo by H. Zell via <a href="https://commons.wikimedia.org/wiki/File:Prunella_vulgaris_003.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, CC BY-SA 3.0.</figcaption>
						</figure>
						<figure class="species-photo">
							<img src="images/dunnock.jpg" alt="Dunnock, Prunella modularis" loading="lazy" decoding="async">
							<figcaption><i>Prunella modularis</i>. Photo by Hobbyfotowiki via <a href="https://commons.wikimedia.org/wiki/File:The_dunnock_(Prunella_modularis).jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, CC0.</figcaption>
						</figure>
						<figure class="species-photo">
							<img src="images/vespula-vulgaris.jpg" alt="Common wasp, Vespula vulgaris" loading="lazy" decoding="async">
							<figcaption><i>Vespula vulgaris</i>. Photo by Soebe via <a href="https://commons.wikimedia.org/wiki/File:Vespula_vulgaris.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, CC BY-SA 3.0.</figcaption>
						</figure>
					</div>
					<p class="relationship">Same genus &ne; same species<br>Same species epithet &ne; same species</p>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> To identify the same species from binomial names, both words must match. A shared genus or a shared species epithet alone is not enough.</p>
				`
			},
			{
				title: "What is the correct order of arthropod groups, from those with the most legs to those with the fewest legs?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the order of arthropod groups from the most legs to the fewest legs",
				options: [
					"Arachnids → Crustaceans → Insects → Myriapods",
					"Arachnids → Insects → Myriapods → Crustaceans",
					"Myriapods → Crustaceans → Arachnids → Insects",
					"Myriapods → Insects → Arachnids → Crustaceans"
				],
				correct: "C",
				answer: "C. Myriapods → Crustaceans → Arachnids → Insects",
				explanation: `
					<p class="definition">Arrange the four arthropod groups from the greatest number of legs to the fewest.</p>
					<figure class="explanation-photo">
						<img src="images/myriapod.jpg" alt="A myriapod with many pairs of legs on soil" loading="lazy" decoding="async">
						<figcaption>A myriapod with many pairs of legs. Photo by Medsile via <a href="https://commons.wikimedia.org/wiki/File:Close-up_photo_of_a_centipede_-_02.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, licensed under CC BY-SA 4.0.</figcaption>
					</figure>
					<table class="comparison-table leg-count-table">
						<caption>Typical leg counts, ordered from most to fewest</caption>
						<thead><tr><th scope="col">Arthropod group</th><th scope="col">Number of legs</th><th scope="col">Example</th></tr></thead>
						<tbody>
							<tr><th scope="row">Myriapods</th><td>Many pairs</td><td>Centipede, millipede</td></tr>
							<tr><th scope="row">Crustaceans</th><td>Usually 5 or more pairs</td><td>Crab, lobster</td></tr>
							<tr><th scope="row">Arachnids</th><td>4 pairs (8 legs)</td><td>Spider, scorpion</td></tr>
							<tr><th scope="row">Insects</th><td>3 pairs (6 legs)</td><td>Ant, butterfly</td></tr>
						</tbody>
					</table>
					<h3>IGCSE exam tip</h3>
					<ul class="option-explanations">
						<li><strong>Insects:</strong> 3 pairs of legs and 1 pair of antennae.</li>
						<li><strong>Arachnids:</strong> 4 pairs of legs and no antennae.</li>
						<li><strong>Crustaceans:</strong> More than 4 pairs of legs and 2 pairs of antennae.</li>
						<li><strong>Myriapods:</strong> Many body segments and many pairs of legs.</li>
					</ul>
					<p class="relationship">Myriapods → Crustaceans → Arachnids → Insects</p>
				`
			},
			{
				title: "Which statements describe features of osmosis?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the pair of statements that describe features of osmosis",
				context: `
					<ol class="statement-list">
						<li>A partially permeable membrane</li>
						<li>The movement of any liquid</li>
						<li>Using energy from respiration</li>
						<li>Water molecules moving by diffusion</li>
					</ol>
				`,
				options: ["1 and 2", "1 and 4", "2 and 3", "3 and 4"],
				correct: "B",
				answer: "B. Statements 1 and 4",
				explanation: `
					<table class="comparison-table statement-table">
						<caption>Check each statement against the definition of osmosis</caption>
						<thead><tr><th scope="col">Statement</th><th scope="col">Correct?</th><th scope="col">Explanation</th></tr></thead>
						<tbody>
							<tr><th scope="row">1. Partially permeable membrane</th><td>Yes</td><td>Osmosis requires a partially permeable membrane.</td></tr>
							<tr><th scope="row">2. Movement of any liquid</th><td>No</td><td>Osmosis involves water molecules, not any liquid.</td></tr>
							<tr><th scope="row">3. Energy from respiration</th><td>No</td><td>Osmosis is passive and does not require energy from respiration.</td></tr>
							<tr><th scope="row">4. Water moving by diffusion</th><td>Yes</td><td>Osmosis is the net movement of water molecules by diffusion through a partially permeable membrane.</td></tr>
						</tbody>
					</table>
					<h3>Cambridge IGCSE definition</h3>
					<p class="definition">Osmosis is the net movement of water molecules from a region of higher water potential to a region of lower water potential, through a partially permeable membrane.</p>
					<figure class="explanation-photo">
						<img src="images/onion-plasmolysis.jpg" alt="Microscope view of red onion cells showing plasmolysis" loading="lazy" decoding="async">
						<figcaption>Plasmolysed red onion cells after water leaves by osmosis. Photo by Trương Minh Khải via <a href="https://commons.wikimedia.org/wiki/File:Plasmolysis_of_red_onion_(Allium_cepa)_cells.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, licensed under CC BY 4.0.</figcaption>
					</figure>
					<h3>IGCSE exam tip</h3>
					<p>Remember the three essential ideas: <strong>water molecules</strong>, a <strong>water potential gradient</strong>, and a <strong>partially permeable membrane</strong>.</p>
					<p class="exam-tip"><strong>Do not confuse osmosis with active transport:</strong> active transport requires energy from respiration, but osmosis is passive.</p>
				`
			},
			{
				title: "The diagram shows an animal. Using the key, what is the identity of the animal?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Use the dichotomous key to identify the animal",
				context: `
					<figure class="explanation-photo">
						<!-- Add question-5.png to the images folder beside index.html. -->
						<img class="diagram-photo" src="images/question-5.png" alt="Animal to identify using the dichotomous key" loading="lazy" decoding="async">
					</figure>
					<table class="comparison-table key-table answer-selection-table">
						<caption>Dichotomous key</caption>
						<thead><tr><th scope="col">Step</th><th scope="col">Feature</th><th scope="col">Follow</th></tr></thead>
						<tbody>
							<tr><th rowspan="2" scope="rowgroup">1</th><td>Has six jointed legs</td><td>Go to 2</td></tr>
							<tr><td>Has eight jointed legs</td><td>Go to 3</td></tr>
							<tr data-answer-choice="A"><th rowspan="2" scope="rowgroup">2</th><td>Antennae longer than its body</td><td><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select A, Gryllus" aria-pressed="false">A. <i>Gryllus</i></button></td></tr>
							<tr data-answer-choice="B"><td>Antennae shorter than its body</td><td><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select B, Musca" aria-pressed="false">B. <i>Musca</i></button></td></tr>
							<tr data-answer-choice="C"><th rowspan="2" scope="rowgroup">3</th><td>Has stripes on its legs</td><td><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select C, Araneus" aria-pressed="false">C. <i>Araneus</i></button></td></tr>
							<tr data-answer-choice="D"><td>Has no stripes on its legs</td><td><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select D, Pisaurina" aria-pressed="false">D. <i>Pisaurina</i></button></td></tr>
						</tbody>
					</table>
				`,
				options: ["A. Gryllus (cricket)", "B. Musca (fly)", "C. Araneus (spider)", "D. Pisaurina (spider)"],
				hideAnswerOptions: true,
				correct: "A",
				answer: "A. Gryllus (cricket)",
				explanation: `
					<p class="definition">Follow the dichotomous key one choice at a time:</p>
					<ol class="statement-list">
						<li><strong>Count the jointed legs:</strong> The animal has six (three pairs), so follow the key to step 2.</li>
						<li><strong>Compare the antennae with the body:</strong> They are longer than the body, identifying the animal as <i>Gryllus</i>.</li>
					</ol>
					<figure class="explanation-photo">
						<img src="images/cricket.jpg" alt="Field cricket with long antennae" loading="lazy" decoding="async">
						<figcaption>The long antennae are visible on this field cricket. Photo by Roberto Zanon via <a href="https://commons.wikimedia.org/wiki/File:Gryllus_campestris_3.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, licensed under CC BY-SA 3.0.</figcaption>
					</figure>
					<p class="relationship">6 jointed legs &rarr; antennae longer than body &rarr; <i>Gryllus</i></p>
					<h3>IGCSE exam tip</h3>
					<p>A dichotomous key identifies organisms through a series of two contrasting choices. Insects have three pairs of jointed legs; arachnids have four pairs. Antennae length can help distinguish insect groups.</p>
				`
			},
			{
				title: "A drawing of a plant cell was measured as 7 cm. The magnification of the drawing was ×500. What was the actual size of the plant cell in micrometres?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Calculate the actual size of the plant cell in micrometres",
				options: ["140 µm", "0.14 µm", "3,500,000 µm", "35,000,000 µm"],
				correct: "A",
				answer: "A. 140 µm",
				explanation: `
					<p class="definition">Use the magnification formula, making sure the image size and actual size are in the same units.</p>
					<p class="relationship">Magnification = Image size ÷ Actual size</p>
					<p>Rearrange the formula:</p>
					<p class="relationship">Actual size = Image size ÷ Magnification</p>
					<h3>1. Convert centimetres to micrometres</h3>
					<p>1 cm = 10 mm, and 1 mm = 1000 µm, so 1 cm = 10,000 µm.</p>
					<p><strong>7 cm × 10,000 = 70,000 µm</strong></p>
					<h3>2. Calculate the actual size</h3>
					<p><strong>70,000 µm ÷ 500 = 140 µm</strong></p>
					<p class="relationship">Actual plant cell size = 140 µm</p>
					<figure class="explanation-photo">
						<img src="images/plant-cells.jpg" alt="Microscope view of plant leaf epidermis and stomata" loading="lazy" decoding="async">
						<figcaption>Plant leaf epidermis seen under a microscope. Photo by Emilio Ermini via <a href="https://commons.wikimedia.org/wiki/File:Leaf_epithelium,_stomata.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, licensed under CC BY 4.0.</figcaption>
					</figure>
					<h3>IGCSE exam tip</h3>
					<p>Useful conversions: 1 cm = 10 mm; 1 mm = 1000 µm; 1 cm = 10,000 µm; and 1 µm = 1000 nm.</p>
					<p class="exam-tip"><strong>Common mistake:</strong> Convert the image size and actual size to the same units before using the magnification formula.</p>
				`
			},
			{
				title: "The diagram shows a potato plant. Which statement describes the movement of substances produced in photosynthesis?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the statement that correctly describes transport from X to storage organ Y",
				context: `
					<figure class="plant-diagram">
						<svg viewBox="0 0 700 300" role="img" aria-labelledby="potato-diagram-title potato-diagram-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="potato-diagram-title">Potato plant with leaf X and storage organ Y</title>
							<desc id="potato-diagram-desc">A leafy potato plant above the soil and roots with potato tubers below. X points to a leaf and Y points to a tuber.</desc>
							<g fill="none" stroke="#386b50" stroke-linecap="round" stroke-linejoin="round">
								<path d="M355 214 C353 180 359 147 355 110 C352 87 357 59 357 35" stroke-width="5"/>
								<path d="M355 146 C333 126 310 118 291 116 M356 122 C376 101 395 89 420 82 M354 93 C333 74 324 61 315 46 M357 69 C378 55 390 42 401 25" stroke-width="2.5"/>
								<path d="M355 214 C338 238 327 260 322 282 M356 215 C376 243 392 267 396 290 M356 224 C347 251 350 269 354 292 M354 230 C337 244 307 252 291 268 M360 225 C383 237 414 244 438 261" stroke="#897e61" stroke-width="1.7"/>
								<path d="M293 116 C271 96 250 96 234 107 C248 126 272 129 293 116Z M296 116 C273 117 257 112 242 105 M420 82 C438 61 461 59 479 69 C466 88 443 92 420 82Z M422 81 C443 80 459 75 474 68 M315 46 C295 29 280 31 269 41 C282 56 298 57 315 46Z M316 46 C299 45 287 41 276 38 M401 25 C414 7 431 7 445 15 C435 31 418 34 401 25Z M402 25 C418 24 431 20 442 15" stroke-width="1.8"/>
								<path d="M228 220 H488" stroke="#a6a087" stroke-width="1.5"/>
							</g>
							<g fill="#dce2d5" stroke="#7d816b" stroke-width="2">
								<ellipse cx="309" cy="247" rx="24" ry="15" transform="rotate(-20 309 247)"/>
								<ellipse cx="390" cy="253" rx="27" ry="17" transform="rotate(14 390 253)"/>
								<ellipse cx="354" cy="273" rx="22" ry="14" transform="rotate(-7 354 273)"/>
								<ellipse cx="425" cy="279" rx="17" ry="12" transform="rotate(19 425 279)"/>
							</g>
							<g fill="none" stroke="#65736a" stroke-width="1.5">
								<path d="M64 95 L237 108 M492 275 L415 258"/>
							</g>
							<g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="22" font-weight="700">
								<text x="39" y="101">X</text>
								<text x="500" y="282">Storage organ Y</text>
							</g>
						</svg>
						<figcaption>X marks a leaf; Y marks a potato tuber.</figcaption>
					</figure>
				`,
				options: [
					"Glucose is converted to starch and then transported from X to Y. X is the source and Y is the sink.",
					"Glucose is converted to starch and then transported from X to Y. X is the sink and Y is the source.",
					"Glucose is converted to sucrose and then transported from X to Y. X is the source and Y is the sink.",
					"Glucose is converted to sucrose and then transported from X to Y. X is the sink and Y is the source."
				],
				correct: "C",
				answer: "C. Sucrose moves from source X to sink Y",
				explanation: `
					<p class="definition"><strong>Glucose is converted into sucrose</strong> for transport from X to Y in the phloem. X is the source and Y is the sink.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="7">
            <a href="images/online-phloem-source-sink.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-phloem-source-sink.png" width="960" height="599" alt="Published educational diagram of sucrose translocation from source to sink through phloem" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting diagram: sucrose moves from a source to a sink in phloem. Its labels are separate from those in the question. <span class="image-credit">Image: Alyssa Pham, via <a href="https://commons.wikimedia.org/wiki/File:Translocation_from_the_source_to_the_sink_within_the_phloem.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</span></figcaption>
        </figure>

					<h3>Follow the translocation pathway</h3>
					<div class="translocation-flow" role="img" aria-label="Leaf source produces glucose, converts it to sucrose, and translocates it through phloem to the potato tuber sink, where it is stored as starch">
						<div class="flow-step"><strong>X · Leaf</strong><span>Source: photosynthesis produces glucose</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Sucrose in phloem</strong><span>Glucose is converted to sucrose and transported by translocation</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Y · Potato tuber</strong><span>Sink: sucrose can be converted to starch for storage</span></div>
					</div>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A:</strong> Starch is not the main substance transported in phloem.</li>
						<li><strong>B:</strong> It uses the wrong transported substance and reverses source and sink.</li>
						<li><strong>C:</strong> Correct: sucrose moves from the source leaf X to the sink tuber Y.</li>
						<li><strong>D:</strong> Sucrose is correct, but source and sink are reversed.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<p><strong>Phloem</strong> transports sucrose and amino acids by translocation. A <strong>source</strong> supplies sucrose, such as a photosynthesising leaf; a <strong>sink</strong> uses or stores it, such as a growing tuber. Starch is an insoluble storage carbohydrate, not the usual transport form.</p>
				`
			},
			{
				title: "The table shows the results of an experiment to investigate the effect of light intensity on the rate of photosynthesis. At which light intensity does a factor other than light begin to limit the rate?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the light intensity at which another factor begins to limit photosynthesis",
				context: `
					<table class="comparison-table light-intensity-table answer-selection-table">
						<caption>Oxygen produced at different light intensities</caption>
						<thead><tr><th scope="col">Option</th><th scope="col">Light intensity<br>(arbitrary units)</th><th scope="col">Oxygen produced<br>(mm³/hour)</th></tr></thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>1.0</td><td>2.5</td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>4.0</td><td>7.0</td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>8.0</td><td>9.0</td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>11.0</td><td>9.0</td></tr>
						</tbody>
					</table>
				`,
				options: ["1.0 arbitrary units", "4.0 arbitrary units", "8.0 arbitrary units", "11.0 arbitrary units"],
				hideAnswerOptions: true,
				correct: "C",
				answer: "C. 8.0 arbitrary units",
				explanation: `
					<p class="definition">Oxygen production shows the rate of photosynthesis. The rate rises with light intensity until the graph levels off.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="8">
            <a href="images/question-36-oxygen-bubbles.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/question-36-oxygen-bubbles.jpg" alt="Trails of small oxygen bubbles rising from submerged vegetation during photosynthesis" loading="lazy" decoding="async">
            </a>
            <figcaption>Oxygen bubbles from an illuminated aquatic plant provide a visible measure of photosynthesis. Use the question’s table to identify where oxygen production levels off. <span class="image-credit">Image: Rcaravit, via <a href="https://commons.wikimedia.org/wiki/File:Photosynthesis_in_action.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>

					<div class="interactive-graph">
						<svg class="rate-chart" viewBox="0 0 720 360" role="img" aria-labelledby="rate-chart-title rate-chart-description">
							<title id="rate-chart-title">Light intensity and oxygen production graph</title>
							<desc id="rate-chart-description">Oxygen production rises from 2.5 at light intensity 1, to 7 at 4, then 9 at 8. It remains at 9 at intensity 11, forming a plateau.</desc>
							<rect class="plateau-zone" x="468" y="48" width="150" height="246" rx="4"/>
							<g class="gridline">
								<line x1="88" y1="294" x2="656" y2="294"/><line x1="88" y1="246" x2="656" y2="246"/>
								<line x1="88" y1="198" x2="656" y2="198"/><line x1="88" y1="150" x2="656" y2="150"/>
								<line x1="88" y1="102" x2="656" y2="102"/><line x1="88" y1="54" x2="656" y2="54"/>
							</g>
							<g class="axis">
								<line x1="88" y1="54" x2="88" y2="294"/><line x1="88" y1="294" x2="656" y2="294"/>
							</g>
							<g text-anchor="end">
								<text x="76" y="299">0</text><text x="76" y="251">2</text><text x="76" y="203">4</text>
								<text x="76" y="155">6</text><text x="76" y="107">8</text><text x="76" y="59">10</text>
							</g>
							<g text-anchor="middle">
								<text x="135" y="316">1.0</text><text x="277" y="316">4.0</text><text x="466" y="316">8.0</text><text x="608" y="316">11.0</text>
								<text class="axis-label" x="370" y="349">Light intensity (arbitrary units)</text>
							</g>
							<text class="axis-label" x="19" y="175" transform="rotate(-90 19 175)" text-anchor="middle">Oxygen produced (mm³/hour)</text>
							<text class="plateau-label" x="543" y="73" text-anchor="middle">Plateau</text>
							<path class="curve" d="M135 234 L277 126 L466 78 L608 78"/>
							<line id="graph-active-line" class="active-line" x1="135" y1="54" x2="135" y2="294"/>
							<g class="data-point">
								<circle cx="135" cy="234" r="6"/><circle cx="277" cy="126" r="6"/>
								<circle cx="466" cy="78" r="6"/><circle cx="608" cy="78" r="6"/>
							</g>
							<circle id="graph-active-point" class="active-point" cx="135" cy="234" r="9"/>
						</svg>
						<div class="graph-controls">
							<label for="light-intensity-slider">Light intensity</label>
							<input id="light-intensity-slider" type="range" min="0" max="3" step="1" value="0" aria-valuetext="1.0 arbitrary units; oxygen production 2.5 cubic millimetres per hour">
							<output class="graph-output" id="graph-output" aria-live="polite">1.0 units · 2.5 mm³/hour</output>
						</div>
					</div>
					<p>From 1.0 to 8.0 units, oxygen production rises from 2.5 to 9.0 mm³/hour. From 8.0 to 11.0 units, it stays at 9.0 mm³/hour.</p>
					<p>At <strong>8.0 arbitrary units</strong>, the rate first reaches its plateau. Increasing light no longer increases photosynthesis, so another factor, such as carbon dioxide concentration or temperature, is limiting.</p>
					<h3>IGCSE exam tip</h3>
					<p>A <strong>limiting factor</strong> is the factor in shortest supply that restricts a process. A rising graph means the factor is increasing the rate; a plateau means another factor is limiting.</p>
				`
			},
			{
				title: "The diagram shows the effect of temperature on the rate of an enzyme reaction. Which statement is correct?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the correct statement about temperature and enzyme activity",
				context: `
					<figure class="enzyme-chart">
						<svg viewBox="0 0 700 380" role="img" aria-labelledby="enzyme-chart-title enzyme-chart-description" xmlns="http://www.w3.org/2000/svg">
							<title id="enzyme-chart-title">Effect of temperature on enzyme reaction rate</title>
							<desc id="enzyme-chart-description">A curve rises from low rate at P to its maximum at R, then falls steeply to zero at S as the enzyme denatures. Temperature increases from P through Q and R to S.</desc>
							<defs>
								<marker id="enzyme-axis-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="#193b34"/></marker>
							</defs>
							<g class="axis" fill="none" marker-end="url(#enzyme-axis-arrow)">
								<line x1="105" y1="300" x2="635" y2="300"/><line x1="105" y1="300" x2="105" y2="45"/>
							</g>
							<g class="tick">
								<line x1="105" y1="300" x2="105" y2="312"/><line x1="245" y1="300" x2="245" y2="312"/>
								<line x1="345" y1="300" x2="345" y2="312"/><line x1="505" y1="300" x2="505" y2="312"/>
							</g>
							<path class="curve" d="M105 282 C150 258 197 206 245 172 C281 133 304 66 345 66 C397 66 397 218 505 300"/>
							<g class="point-label" text-anchor="middle">
								<text x="105" y="338">P</text><text x="245" y="338">Q</text><text x="345" y="338">R</text><text x="505" y="338">S</text>
							</g>
							<g text-anchor="middle">
								<text x="375" y="372">Temperature</text>
							</g>
							<text x="35" y="175" transform="rotate(-90 35 175)" text-anchor="middle">Rate of reaction</text>
						</svg>
					</figure>
				`,
				options: [
					"The enzyme molecules are denatured at P.",
					"The greatest amount of kinetic energy is available at R.",
					"The greatest number of collisions between enzyme and substrate molecules occur at S.",
					"The optimum rate of reaction occurs at Q."
				],
				correct: "C",
				answer: "C. The greatest number of collisions occur at S",
				explanation: `
					<p class="definition">Temperature increases molecular kinetic energy, so molecules move faster and collide more frequently. At very high temperature, however, the enzyme is denatured and the reaction rate falls.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="9">
            <a href="images/online-enzyme-active-site.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-active-site.png" width="1088" height="713" alt="A folded polypeptide chain forms an enzyme with a substrate bound at its active site" loading="lazy" decoding="async">
            </a>
            <figcaption>A folded protein forms an enzyme active site that binds a complementary substrate. <span class="image-credit">Image: User:Mcy_jerry on EN WP as en:File:Enzymeactivesite.png, via <a href="https://commons.wikimedia.org/wiki/File:Enzyme_active_site.png" target="_blank" rel="noreferrer">source</a>, <a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Interpreting each point on the graph</caption>
						<thead><tr><th scope="col">Point</th><th scope="col">Temperature</th><th scope="col">What happens</th></tr></thead>
						<tbody>
							<tr><th scope="row">P</th><td>Low</td><td>Low kinetic energy means fewer collisions and a low reaction rate; the enzyme is not denatured.</td></tr>
							<tr><th scope="row">Q</th><td>Increasing</td><td>Kinetic energy and successful collision frequency increase, so the rate rises.</td></tr>
							<tr><th scope="row">R</th><td>Optimum</td><td>The reaction rate and enzyme activity reach their maximum.</td></tr>
							<tr><th scope="row">S</th><td>Highest</td><td>Kinetic energy and collision frequency are greatest, but the enzyme is denatured, so collisions are not productive and the reaction stops.</td></tr>
						</tbody>
					</table>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A:</strong> Low temperature at P reduces activity but does not denature the enzyme.</li>
						<li><strong>B:</strong> Kinetic energy is greatest at S, the highest temperature.</li>
						<li><strong>C:</strong> Correct. Molecules move fastest and collide most frequently at S, even though denaturation prevents successful enzyme-substrate reactions.</li>
						<li><strong>D:</strong> The optimum rate occurs at R, where the curve reaches its peak.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<p><strong>Collision frequency is not the same as successful collisions.</strong> Above the optimum, heat changes the enzyme’s active site. Substrates no longer fit effectively, so the rate falls rapidly even as molecular kinetic energy increases.</p>
					<p class="relationship">R = optimum activity · S = highest temperature and kinetic energy</p>
				`
			},
			{
				title: "Starch in food is digested in two stages. In which parts of the alimentary canal do the two stages occur?",
				paperCode: "0610/23/M/J/19",
				paperSession: "May/June 2019",
				legend: "Choose the locations of starch digestion to maltose and maltose digestion to glucose",
				context: `
					<table class="comparison-table statement-table answer-selection-table">
						<caption>Choose where each digestion stage occurs</caption>
						<thead><tr><th scope="col">Option</th><th scope="col">Starch into maltose</th><th scope="col">Maltose into glucose</th></tr></thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>Duodenum</td><td>Stomach</td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>Lining of small intestine</td><td>Mouth</td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>Mouth</td><td>Lining of small intestine</td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>Stomach</td><td>Duodenum</td></tr>
						</tbody>
					</table>
				`,
				options: [
					"Duodenum → Stomach",
					"Lining of small intestine → Mouth",
					"Mouth → Lining of small intestine",
					"Stomach → Duodenum"
				],
				hideAnswerOptions: true,
				correct: "C",
				answer: "C. Mouth → Lining of small intestine",
				explanation: `
					<p class="definition">Starch digestion occurs in two stages, using two different enzymes.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="10">
            <a href="images/online-digestive-enzymes.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-digestive-enzymes.png" width="960" height="768" alt="A reference table lists digestive enzymes including salivary amylase, pancreatic amylase, maltase, pepsin, and trypsin, with their production and release sites" loading="lazy" decoding="async">
            </a>
            <figcaption>A reference table locates amylase release in the mouth and small intestine, and maltase in the small intestine. <span class="image-credit">Image: Stephaniegrenwood (attributed by Wikimedia Commons), via <a href="https://commons.wikimedia.org/wiki/File:Major_digestive_enzymes.png" target="_blank" rel="noreferrer">source</a>, <a href="https://commons.wikimedia.org/wiki/Commons:Public_domain" target="_blank" rel="noreferrer">Public domain</a>.</span></figcaption>
        </figure>

					<div class="translocation-flow" role="img" aria-label="Starch is broken down by amylase in the mouth and duodenum into maltose. Maltase in the lining of the small intestine breaks maltose into glucose, which is absorbed into the blood">
						<div class="flow-step"><strong>Starch</strong><span>Amylase in the mouth begins digestion; pancreatic amylase continues it in the duodenum.</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Maltose</strong><span>Maltase in the lining of the small intestine digests maltose.</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Glucose</strong><span>Glucose is absorbed into the blood through the villi.</span></div>
					</div>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A:</strong> Maltose is not normally digested into glucose in the stomach.</li>
						<li><strong>B:</strong> The locations are reversed; maltase acts in the small intestine, not the mouth.</li>
						<li><strong>C:</strong> Correct: amylase starts starch digestion in the mouth, and maltase completes digestion in the small intestine lining.</li>
						<li><strong>D:</strong> Starch digestion does not begin in the stomach.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<table class="comparison-table">
						<caption>Enzyme–substrate relationships</caption>
						<thead><tr><th scope="col">Enzyme</th><th scope="col">Substrate</th><th scope="col">Product</th></tr></thead>
						<tbody>
							<tr><th scope="row">Amylase</th><td>Starch</td><td>Maltose</td></tr>
							<tr><th scope="row">Maltase</th><td>Maltose</td><td>Glucose</td></tr>
						</tbody>
					</table>
					<p>Amylase is secreted by the salivary glands and pancreas. Maltase is associated with the lining of the small intestine.</p>
				`
			},
			{
				title: "The diagram shows part of the alimentary canal. Which structure produces lipase?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the structure that produces lipase",
				context: `
					<figure class="digestive-diagram">
						<img src="images/question-11.png" alt="Digestive-system diagram: A labels the liver, B the gall bladder, C the pancreas, and D the large intestine" loading="lazy" decoding="async">
					</figure>
				`,
				options: ["A. Liver", "B. Gall bladder", "C. Pancreas", "D. Large intestine"],
				correct: "C",
				answer: "C. Pancreas",
				explanation: `
					<p class="definition">Structure <strong>C is the pancreas</strong>, which produces digestive enzymes, including lipase.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="11">
            <a href="images/online-pancreas-digestive-organs.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-pancreas-digestive-organs.jpg" width="805" height="1002" alt="Labelled human digestive organs showing the pancreas, pancreatic duct, liver and gallbladder" loading="lazy" decoding="async">
            </a>
            <figcaption>The pancreas and pancreatic duct are shown alongside the liver and gallbladder. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2422_Accessory_Organs.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Identify each labelled structure</caption>
						<thead><tr><th scope="col">Label</th><th scope="col">Structure</th><th scope="col">Function</th></tr></thead>
						<tbody>
							<tr><th scope="row">A</th><td>Liver</td><td>Produces bile to emulsify fats.</td></tr>
							<tr><th scope="row">B</th><td>Gall bladder</td><td>Stores and releases bile.</td></tr>
							<tr><th scope="row">C</th><td>Pancreas</td><td>Produces lipase, amylase and proteases.</td></tr>
							<tr><th scope="row">D</th><td>Large intestine</td><td>Absorbs water and mineral ions.</td></tr>
						</tbody>
					</table>
					<h3>How lipase works</h3>
					<div class="translocation-flow" role="img" aria-label="Lipase digests lipids into fatty acids and glycerol">
						<div class="flow-step"><strong>Lipids (fats)</strong><span>Substrate</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Lipase</strong><span>Enzyme produced by the pancreas</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Fatty acids + glycerol</strong><span>Products</span></div>
					</div>
					<h3>IGCSE exam tip: bile and lipase</h3>
					<ul class="option-explanations">
						<li><strong>Bile:</strong> Made by the liver; emulsifies fats into smaller droplets. It is not an enzyme.</li>
						<li><strong>Lipase:</strong> Made by the pancreas and small intestine; digests fats into fatty acids and glycerol.</li>
						<li><strong>Pancreatic lipase:</strong> Released into the duodenum, where it acts on fats.</li>
					</ul>
				`
			},
			{
				title: "Which statements about root hairs are correct?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the correct statements about root hairs",
				context: `
					<ol class="statement-list">
						<li>Root hairs allow water to be absorbed by active transport.</li>
						<li>Root hairs increase the surface area available for absorption.</li>
						<li>The rate of absorption of water and ions is increased by root hairs.</li>
					</ol>
				`,
				options: ["1, 2 and 3", "1 and 2 only", "2 and 3 only", "3 only"],
				correct: "C",
				answer: "C. Statements 2 and 3 only",
				explanation: `
					<table class="comparison-table statement-table">
						<caption>Evaluate each statement</caption>
						<thead><tr><th scope="col">Statement</th><th scope="col">Correct?</th><th scope="col">Explanation</th></tr></thead>
						<tbody>
							<tr><th scope="row">1</th><td>No</td><td>Water enters root-hair cells by osmosis, not active transport.</td></tr>
							<tr><th scope="row">2</th><td>Yes</td><td>The long, thin extensions provide a large surface area for absorption.</td></tr>
							<tr><th scope="row">3</th><td>Yes</td><td>The increased surface area allows water and mineral ions to be absorbed more rapidly.</td></tr>
						</tbody>
					</table>
					<figure class="explanation-photo">
						<img src="images/root-hairs.jpg" alt="Confocal fluorescence image of an Arabidopsis root with many root-hair extensions" loading="lazy" decoding="async">
						<figcaption>Root hairs are extensions of root epidermal cells that increase the absorbing surface area. Photo: G Lens Microscopist, Megan Gerber, via <a href="https://commons.wikimedia.org/wiki/File:Arabidopsis_root_hairs.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Image unchanged.</figcaption>
					</figure>
					<h3>How root hair cells absorb substances</h3>
					<figure class="root-hair-diagram">
						<svg viewBox="0 0 700 270" role="img" aria-labelledby="root-uptake-title root-uptake-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="root-uptake-title">Water and mineral-ion uptake by a root hair cell</title>
							<desc id="root-uptake-desc">Water moves from the soil into a root hair cell by osmosis. Mineral ions enter by active transport, which can use energy from respiration.</desc>
							<defs>
								<marker id="water-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#4389ad"/></marker>
								<marker id="ion-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#b86b39"/></marker>
							</defs>
							<text x="38" y="42">Soil solution</text>
							<path class="cell" d="M288 90 H632 V205 H288 C246 205 202 191 146 171 C202 151 246 90 288 90Z"/>
							<path class="wall" d="M288 90 C246 90 202 151 146 171 C202 191 246 205 288 205" fill="none"/>
							<text x="405" y="151">Root-hair cell</text>
							<path class="water" d="M66 118 C106 118 137 130 170 150" fill="none" marker-end="url(#water-arrow)"/>
							<path class="ions" d="M66 220 C111 220 141 205 174 190" fill="none" marker-end="url(#ion-arrow)"/>
							<text x="70" y="101" fill="#4389ad">Water: osmosis</text>
							<text x="70" y="252" fill="#b86b39">Mineral ions: active transport</text>
							<path class="leader" d="M191 57 L232 119" fill="none"/>
							<text x="244" y="50">Long extension increases surface area</text>
						</svg>
						<figcaption>Water enters by osmosis; mineral ions may be taken up by active transport.</figcaption>
					</figure>
					<table class="comparison-table root-uptake-table">
						<caption>Osmosis and active transport</caption>
						<thead><tr><th scope="col">Feature</th><th scope="col">Osmosis</th><th scope="col">Active transport</th></tr></thead>
						<tbody>
							<tr><th scope="row">Substance</th><td>Water</td><td>Mineral ions</td></tr>
							<tr><th scope="row">Direction</th><td>Down a water-potential gradient</td><td>Against a concentration gradient</td></tr>
							<tr><th scope="row">Energy</th><td>Not required</td><td>Required from respiration</td></tr>
							<tr><th scope="row">Membrane proteins</th><td>May use aquaporins</td><td>Uses carrier proteins or pumps</td></tr>
						</tbody>
					</table>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> Root hairs are long extensions of root epidermal cells. Their large surface area makes absorption of water and mineral ions more efficient.</p>
				`
			},
			{
				title: "The diagram shows the water potential of three plant cells. The more negative the value, the higher the solute concentration. What is the immediate movement of water between the cells?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the directions of net water movement between cells P, Q and R",
				context: `
					<figure class="water-potential-diagram">
						<svg viewBox="0 0 720 310" role="img" aria-labelledby="water-potential-prompt-title water-potential-prompt-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="water-potential-prompt-title">Water potentials in plant cells P, Q and R</title>
							<desc id="water-potential-prompt-desc">Cell P has a water potential of minus 360 kilopascals, Q has minus 400 kilopascals, and R has minus 340 kilopascals.</desc>
							<g text-anchor="middle">
								<rect class="cell-box" x="90" y="34" width="210" height="100" rx="18"/>
								<text class="cell-name" x="195" y="64">P</text><text class="cell-value" x="195" y="105">−360 kPa</text>
								<rect class="cell-box" x="420" y="34" width="210" height="100" rx="18"/>
								<text class="cell-name" x="525" y="64">Q</text><text class="cell-value" x="525" y="105">−400 kPa</text>
								<rect class="cell-box" x="255" y="174" width="210" height="100" rx="18"/>
								<text class="cell-name" x="360" y="204">R</text><text class="cell-value" x="360" y="245">−340 kPa</text>
							</g>
						</svg>
						<figcaption>The more negative the value, the higher the solute concentration.</figcaption>
					</figure>
				`,
				options: [
					"From P to Q, and from R to P and Q",
					"From Q to P and R only",
					"From Q to P and R, and from P to R",
					"From R to Q only"
				],
				correct: "A",
				answer: "A. From P to Q, and from R to P and Q",
				explanation: `
					<p class="definition">Water moves by osmosis from a region of higher water potential (less negative) to a region of lower water potential (more negative).</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="13">
            <a href="images/online-osmosis.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-osmosis.png" width="500" height="682" alt="Osmosis apparatus with a semipermeable membrane separating more concentrated and less concentrated solutions, and different liquid heights" loading="lazy" decoding="async">
            </a>
            <figcaption>General osmosis apparatus: water moves through a partially permeable membrane toward the more concentrated solution. This illustrates the principle, rather than the exact potato or cell setup. <span class="image-credit">Image: Yassine Mrabet, via <a href="https://commons.wikimedia.org/wiki/File:Osmosis.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

					<p class="relationship">−340 kPa (R) &gt; −360 kPa (P) &gt; −400 kPa (Q)</p>
					<figure class="water-potential-diagram">
						<svg viewBox="0 0 720 410" role="img" aria-labelledby="water-potential-title water-potential-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="water-potential-title">Animated net water movement between cells P, Q and R</title>
							<desc id="water-potential-desc">Water moves from R at minus 340 kilopascals to P at minus 360 and to Q at minus 400. It also moves from P to Q.</desc>
							<defs><marker id="water-potential-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#4389ad"/></marker></defs>
							<path class="water-flow-arrow" d="M258 97 C316 72 402 72 460 97"/>
							<path class="water-flow-arrow" d="M298 282 C260 237 224 198 198 157"/>
							<path class="water-flow-arrow" d="M422 282 C460 237 496 198 522 157"/>
							<g text-anchor="middle">
								<rect class="cell-box" x="70" y="48" width="190" height="100" rx="18"/>
								<text class="cell-name" x="165" y="78">P</text><text class="cell-value" x="165" y="119">−360 kPa</text>
								<rect class="cell-box" x="460" y="48" width="190" height="100" rx="18"/>
								<text class="cell-name" x="555" y="78">Q</text><text class="cell-value" x="555" y="119">−400 kPa</text>
								<rect class="cell-box" x="265" y="282" width="190" height="100" rx="18"/>
								<text class="cell-name" x="360" y="312">R</text><text class="cell-value" x="360" y="353">−340 kPa</text>
							</g>
						</svg>
						<figcaption>Animated arrows show net water movement toward the more negative water potential.</figcaption>
					</figure>
					<h3>Check the options</h3>
					<ul class="option-explanations">
						<li><strong>A:</strong> Correct. P → Q, R → P and R → Q all move from higher to lower water potential.</li>
						<li><strong>B:</strong> Reverses the movement between Q and the other cells.</li>
						<li><strong>C:</strong> Reverses all three directions.</li>
						<li><strong>D:</strong> Includes R → Q but misses R → P and P → Q.</li>
					</ul>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> More negative water potential means lower water potential. Net water moves toward the more negative value.</p>
				`
			},
			{
				title: "Which conditions lead to the lowest rate of transpiration in a plant?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the conditions that produce the lowest rate of transpiration",
				options: ["Cool and high humidity", "Cool and windy", "Warm and low humidity", "Warm and windy"],
				correct: "A",
				answer: "A. Cool and high humidity",
				explanation: `
					<p class="definition">Transpiration is the loss of water vapour from a plant, mainly through the stomata.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="14">
            <a href="images/online-transpiration-overview.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-transpiration-overview.png" width="960" height="808" alt="Published plant diagram showing water uptake by roots, movement in xylem and water loss from leaves" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting overview of water movement through a plant and water loss from leaves. The numbered labels belong to this source illustration. <span class="image-credit">Image: Laurel Jules, via <a href="https://commons.wikimedia.org/wiki/File:Transpiration_Overview.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

					<p>The lowest rate occurs in <strong>cool, humid conditions</strong> because both conditions slow water loss from leaves.</p>
					<table class="comparison-table transpiration-table">
						<caption>How environmental conditions affect transpiration</caption>
						<thead><tr><th scope="col">Condition</th><th scope="col">Effect on transpiration</th><th scope="col">Why</th></tr></thead>
						<tbody>
							<tr><th scope="row">Cool</th><td>Decreases</td><td>Water molecules have less kinetic energy, so evaporation from mesophyll surfaces is slower.</td></tr>
							<tr><th scope="row">High humidity</th><td>Decreases</td><td>The air already contains water vapour, reducing the concentration gradient from leaf to air.</td></tr>
							<tr><th scope="row">Windy</th><td>Usually increases</td><td>Moving air removes the moist layer around the leaf.</td></tr>
							<tr><th scope="row">Warm and dry</th><td>Increases</td><td>Faster evaporation and a steeper water-vapour gradient promote water loss.</td></tr>
						</tbody>
					</table>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A:</strong> Correct. Cool temperatures slow evaporation, while high humidity reduces the water-vapour gradient.</li>
						<li><strong>B:</strong> Wind removes humid air around the leaf and tends to increase transpiration.</li>
						<li><strong>C:</strong> Warm, low-humidity air promotes evaporation and diffusion of water vapour.</li>
						<li><strong>D:</strong> Warmth and wind both generally increase transpiration.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<p>Rising temperature and wind speed generally increase transpiration. Rising humidity decreases it by reducing the water-vapour concentration gradient between the leaf and the air.</p>
				`
			},
			{
				title: "The diagram shows the steps in an enzyme-controlled reaction. What describes the part labelled X?",
				paperCode: "0610/22/O/N/24",
				paperSession: "Oct/Nov 2024",
				legend: "Choose the name for the enzyme and substrate joined at X",
				context: `
					<figure class="explanation-photo">
						<img src="images/question-15.png" alt="Diagram showing a substrate binding to an enzyme, the enzyme–substrate complex labelled X, and products leaving the enzyme" loading="lazy" decoding="async">
					</figure>
				`,
				options: ["Active site", "Substrate", "Product", "Enzyme–substrate complex"],
				correct: "D",
				answer: "D. Enzyme–substrate complex",
				explanation: `
					<p class="definition">X is the temporary complex formed when the substrate binds to the enzyme’s active site.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="15">
            <a href="images/online-enzyme-reaction.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-reaction.png" width="500" height="1186" alt="Four stages show a substrate binding an enzyme, reacting, and releasing two products" loading="lazy" decoding="async">
            </a>
            <figcaption>General enzyme reaction: a substrate binds at the active site, reacts, then products leave the enzyme. <span class="image-credit">Image: domdomegg, via <a href="https://commons.wikimedia.org/wiki/File:Lock_and_key_enzyme_mechanism.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>

					<h3>Reaction pathway</h3>
					<div class="enzyme-stage-flow" role="img" aria-label="The substrate binds at the enzyme active site, forms the enzyme-substrate complex, and is converted into products that leave the unchanged enzyme.">
						<figure class="enzyme-stage">
							<svg viewBox="0 0 210 145" aria-hidden="true"><path class="enzyme-shape" d="M20 45 C20 28 29 20 44 20 L68 20 C74 20 78 25 82 34 L91 55 C96 67 114 67 119 55 L128 34 C132 25 136 20 144 20 L168 20 C183 20 192 29 192 45 L192 88 C192 115 158 130 106 130 C54 130 20 115 20 88Z"/><polygon class="substrate-shape" points="60,3 77,-7 94,3 94,23 77,33 60,23"/><polygon class="substrate-shape" points="94,3 111,-7 128,3 128,23 111,33 94,23"/></svg>
							<figcaption>1. Substrate binds at the active site</figcaption>
						</figure>
						<span class="enzyme-stage-arrow" aria-hidden="true">→</span>
						<figure class="enzyme-stage">
							<svg viewBox="0 0 230 145" aria-hidden="true"><path class="enzyme-shape" d="M20 45 C20 28 29 20 44 20 L68 20 C74 20 78 25 82 34 L91 55 C96 67 114 67 119 55 L128 34 C132 25 136 20 144 20 L168 20 C183 20 192 29 192 45 L192 88 C192 115 158 130 106 130 C54 130 20 115 20 88Z"/><polygon class="substrate-shape" points="60,3 77,-7 94,3 94,23 77,33 60,23"/><polygon class="substrate-shape" points="94,3 111,-7 128,3 128,23 111,33 94,23"/><path d="M202 14 V52 M194 14 H202 M194 52 H202" fill="none" stroke="#193b34" stroke-width="2"/><text x="205" y="37" font-size="16" font-weight="700">X</text></svg>
							<figcaption>2. Enzyme–substrate complex forms</figcaption>
						</figure>
						<span class="enzyme-stage-arrow" aria-hidden="true">→</span>
						<figure class="enzyme-stage">
							<svg viewBox="0 0 210 145" aria-hidden="true"><path class="enzyme-shape" d="M20 45 C20 28 29 20 44 20 L68 20 C74 20 78 25 82 34 L91 55 C96 67 114 67 119 55 L128 34 C132 25 136 20 144 20 L168 20 C183 20 192 29 192 45 L192 88 C192 115 158 130 106 130 C54 130 20 115 20 88Z"/><polygon class="substrate-shape" points="35,3 52,-7 69,3 69,23 52,33 35,23"/><polygon class="substrate-shape" points="143,3 160,-7 177,3 177,23 160,33 143,23"/></svg>
							<figcaption>3. Products leave; enzyme can be reused</figcaption>
						</figure>
					</div>
					<table class="comparison-table">
						<caption>Key enzyme definitions</caption>
						<thead><tr><th scope="col">Term</th><th scope="col">Meaning</th></tr></thead>
						<tbody>
							<tr><th scope="row">Active site</th><td>Region where a substrate binds and the reaction is catalysed.</td></tr>
							<tr><th scope="row">Substrate</th><td>Molecule on which the enzyme acts.</td></tr>
							<tr><th scope="row">Enzyme–substrate complex</th><td>Temporary structure formed when the substrate binds to the enzyme.</td></tr>
							<tr><th scope="row">Product</th><td>Substance formed by the enzyme-controlled reaction.</td></tr>
						</tbody>
					</table>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A. Active site:</strong> This is only the specific region of the enzyme where the substrate binds, not the whole joined structure.</li>
						<li><strong>B. Substrate:</strong> The substrate is the molecule approaching the enzyme before binding.</li>
						<li><strong>C. Product:</strong> Products are released after the reaction, shown leaving on the right.</li>
						<li><strong>D. Enzyme–substrate complex:</strong> Correct. The substrate is temporarily bound to the enzyme at X.</li>
					</ul>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> Enzymes are not used up. After products leave, the enzyme can bind another substrate.</p>
				`
			},
			{
				title: "Which components of a balanced diet are needed to make haemoglobin and to prevent scurvy and rickets?",
				paperCode: "0610/22/O/N/24",
				paperSession: "Oct/Nov 2024",
				legend: "Choose the pair of nutrient groups needed to make haemoglobin and prevent scurvy and rickets",
				options: [
					"Carbohydrates and mineral ions",
					"Carbohydrates and proteins",
					"Mineral ions and vitamins",
					"Vitamins and fibre"
				],
				correct: "C",
				answer: "C. Mineral ions and vitamins",
				explanation: `
					<p class="definition">The question combines nutrients needed for making haemoglobin and preventing two deficiency diseases.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="16">
            <a href="images/online-balanced-diet.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-balanced-diet.jpg" width="960" height="640" alt="Display of varied healthy foods including salmon, lean meat, beans, grains, fruit and vegetables" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting photograph of varied foods: iron supports haemoglobin production, vitamin C prevents scurvy, and vitamin D helps prevent rickets. It is not a measured meal plan or nutrient-content chart. <span class="image-credit">Image: National Cancer Institute, National Institutes of Health (photographer uncredited), via <a href="https://commons.wikimedia.org/wiki/File:Good_Food_Display_-_NCI_Visuals_Online.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/publicdomain/mark/1.0/" target="_blank" rel="noreferrer">Public domain</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Nutrients and their roles</caption>
						<thead><tr><th scope="col">Function or deficiency</th><th scope="col">Required nutrient</th><th scope="col">Importance</th></tr></thead>
						<tbody>
							<tr><th scope="row">Make haemoglobin</th><td>Iron (mineral ion)</td><td>Needed to make haemoglobin in red blood cells for oxygen transport.</td></tr>
							<tr><th scope="row">Prevent scurvy</th><td>Vitamin C</td><td>Needed for collagen formation and healthy connective tissue.</td></tr>
							<tr><th scope="row">Prevent rickets</th><td>Vitamin D and calcium</td><td>Needed for strong, properly mineralised bones.</td></tr>
						</tbody>
					</table>
					<p>These nutrients belong to two groups: <strong>mineral ions and vitamins</strong>.</p>
					<h3>Why the other options are incorrect</h3>
					<ul class="option-explanations">
						<li><strong>A. Carbohydrates and mineral ions:</strong> Does not include vitamins C and D.</li>
						<li><strong>B. Carbohydrates and proteins:</strong> Does not include the necessary mineral ions and vitamins.</li>
						<li><strong>C. Mineral ions and vitamins:</strong> Correct. This includes iron, calcium, vitamins C and D.</li>
						<li><strong>D. Vitamins and fibre:</strong> Does not include the mineral ions iron and calcium.</li>
					</ul>
					<h3>IGCSE exam tip: common deficiency diseases</h3>
					<table class="comparison-table">
						<thead><tr><th scope="col">Nutrient deficiency</th><th scope="col">Possible result</th></tr></thead>
						<tbody>
							<tr><th scope="row">Iron</th><td>Anaemia</td></tr>
							<tr><th scope="row">Vitamin C</th><td>Scurvy</td></tr>
							<tr><th scope="row">Vitamin D</th><td>Rickets in children</td></tr>
							<tr><th scope="row">Calcium</th><td>Weak bones and teeth</td></tr>
						</tbody>
					</table>
					<p>Vitamin D helps the body absorb calcium, which is essential for healthy bone development.</p>
				`
			},
			{
				title: "The diagram shows a villus. Which parts transport glucose and fatty acids away from the villus?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the labels for the structures that transport glucose and fatty acids away from the villus",
				context: `
					<figure class="digestive-diagram">
						<img src="images/question-17.png" alt="Villus diagram labelled 1 to 4, showing blood capillaries, a central lacteal and vessels at the base" loading="lazy" decoding="async">
					</figure>
					<table class="comparison-table answer-selection-table villus-choice-table">
						<caption>Choose the labelled structures that transport each nutrient away from the villus</caption>
						<thead><tr><th scope="col">Option</th><th scope="col">Glucose</th><th scope="col">Fatty acids</th></tr></thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>3</td><td>1</td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>3</td><td>2</td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>4</td><td>3</td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>4</td><td>4</td></tr>
						</tbody>
					</table>
				`,
				options: ["Glucose 3, fatty acids 1", "Glucose 3, fatty acids 2", "Glucose 4, fatty acids 3", "Glucose 4, fatty acids 4"],
				hideAnswerOptions: true,
				correct: "C",
				answer: "C. Glucose (4), fatty acids (3)",
				explanation: `
					<p class="definition">Glucose enters the blood capillaries and is carried away in the bloodstream. Fatty acids and glycerol enter the lacteal and travel through the lymphatic system.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="17">
            <a href="images/question-40-intestine-villi.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/question-40-intestine-villi.jpg" alt="Small-intestine lining showing folds, villi and microvilli that increase the surface area for absorption" loading="lazy" decoding="async">
            </a>
            <figcaption>Folds, villi and microvilli increase the small intestine’s absorbing surface area. The numbered blood-vessel and lacteal routes are identified in the question diagram. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2418_Histology_Small_IntestinesN.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Identify the transport structures</caption>
						<thead><tr><th scope="col">Label</th><th scope="col">Structure</th><th scope="col">What it transports</th></tr></thead>
						<tbody>
							<tr><th scope="row">3</th><td>Lacteal</td><td>Absorbed fats, including fatty acids and glycerol</td></tr>
							<tr><th scope="row">4</th><td>Blood vessel</td><td>Glucose and other water-soluble nutrients</td></tr>
						</tbody>
					</table>
					<p><strong>Therefore:</strong> glucose is transported by 4, and fatty acids by 3.</p>
					<h3>IGCSE exam tip</h3>
					<ul class="option-explanations">
						<li><strong>Blood capillaries:</strong> Carry glucose and amino acids into the blood circulation.</li>
						<li><strong>Lacteals:</strong> Absorb and transport fats through the lymphatic system.</li>
						<li><strong>Villi and microvilli:</strong> Increase the surface area for absorption; the thin epithelium gives a short diffusion distance.</li>
					</ul>
				`
			},
			{
				title: "The diagram shows part of the circulatory system. Which row identifies S and T?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the correct identities of blood vessels S and T",
				context: `
					<figure class="digestive-diagram">
						<img src="images/question-18.png" alt="Diagram showing blood flow between the intestine, liver and heart, labelled S and T" loading="lazy" decoding="async">
					</figure>
					<table class="comparison-table answer-selection-table statement-table">
						<caption>Identify blood vessels S and T</caption>
						<thead><tr><th scope="col">Option</th><th scope="col">S</th><th scope="col">T</th></tr></thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>Hepatic artery</td><td>Hepatic portal vein</td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>Hepatic artery</td><td>Hepatic vein</td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>Hepatic portal vein</td><td>Hepatic artery</td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>Hepatic portal vein</td><td>Hepatic vein</td></tr>
						</tbody>
					</table>
				`,
				options: [
					"S: hepatic artery; T: hepatic portal vein",
					"S: hepatic artery; T: hepatic vein",
					"S: hepatic portal vein; T: hepatic artery",
					"S: hepatic portal vein; T: hepatic vein"
				],
				hideAnswerOptions: true,
				correct: "D",
				answer: "D. S: hepatic portal vein; T: hepatic vein",
				explanation: `
					<p class="definition">Blood flows from the intestine to the liver through S, then leaves the liver toward the heart through T.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="18">
            <a href="images/online-hepatic-portal-vein.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-hepatic-portal-vein.jpg" width="960" height="619" alt="Labelled hepatic portal vein system connecting veins around the intestines with the liver" loading="lazy" decoding="async">
            </a>
            <figcaption>The hepatic portal system carries blood from the digestive organs to the liver. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2138_Hepatic_Portal_Vein_System.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Trace the blood vessels</caption>
						<thead><tr><th scope="col">Label</th><th scope="col">Vessel</th><th scope="col">Direction and role</th></tr></thead>
						<tbody>
							<tr><th scope="row">S</th><td>Hepatic portal vein</td><td>Intestine → liver; carries absorbed nutrients, including glucose and amino acids.</td></tr>
							<tr><th scope="row">T</th><td>Hepatic vein</td><td>Liver → vena cava → heart.</td></tr>
						</tbody>
					</table>
					<h3>Why option D is correct</h3>
					<p>The hepatic portal vein carries nutrient-rich blood from the intestine to the liver. The hepatic vein carries blood away from the liver and toward the heart.</p>
					<h3>IGCSE exam tip: liver blood vessels</h3>
					<ul class="option-explanations">
						<li><strong>Hepatic artery:</strong> Heart → liver.</li>
						<li><strong>Hepatic portal vein:</strong> Intestine → liver.</li>
						<li><strong>Hepatic vein:</strong> Liver → heart.</li>
					</ul>
					<p>The hepatic portal vein is unusual because it carries blood between capillary networks in the digestive organs and the liver.</p>
				`
			},
			{
				title: "The diagrams show the single circulation of a fish and the double circulation of a mammal. Which letters represent areas of oxygenated blood?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the pair of labels that contain oxygenated blood",
				context: `
					<figure class="circulation-diagram">
						<img src="images/question-19.png" alt="Fish single-circulation diagram labelled R, S and T, and mammal double-circulation diagram labelled X, Y and Z" loading="lazy" decoding="async">
					</figure>
					<table class="comparison-table answer-selection-table statement-table">
						<caption>Choose the oxygenated-blood labels</caption>
						<thead><tr><th scope="col">Option</th><th scope="col">Fish</th><th scope="col">Mammal</th></tr></thead>
						<tbody>
							<tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>R</td><td>X</td></tr>
							<tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>S</td><td>Y</td></tr>
							<tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>T</td><td>Y</td></tr>
							<tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>T</td><td>Z</td></tr>
						</tbody>
					</table>
				`,
				options: ["R and X", "S and Y", "T and Y", "T and Z"],
				hideAnswerOptions: true,
				correct: "B",
				answer: "B. S and Y",
				explanation: `
					<p class="definition">Oxygenated blood has a high oxygen concentration. It is carried away from the gas-exchange surface toward the body or heart.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="19">
            <a href="images/online-fish-single-circulation.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-fish-single-circulation.png" width="512" height="384" alt="Single circulation in a fish with an atrium, ventricle, gill capillaries and body capillaries" loading="lazy" decoding="async">
            </a>
            <figcaption>Fish blood flows through the heart, gill capillaries and body capillaries in a single circuit. <span class="image-credit">Image: Lennert B, via <a href="https://commons.wikimedia.org/wiki/File:Fish_circulation.PNG" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Follow the blood flow at each label</caption>
						<thead><tr><th scope="col">Label</th><th scope="col">Blood flow</th><th scope="col">Oxygen status</th></tr></thead>
						<tbody>
							<tr><th scope="row">R</th><td>Fish: heart → gills</td><td>Deoxygenated</td></tr>
							<tr><th scope="row">S</th><td>Fish: gills → body</td><td>Oxygenated</td></tr>
							<tr><th scope="row">T</th><td>Fish: body → heart</td><td>Deoxygenated</td></tr>
							<tr><th scope="row">X</th><td>Mammal: heart → lungs</td><td>Deoxygenated</td></tr>
							<tr><th scope="row">Y</th><td>Mammal: lungs → heart</td><td>Oxygenated</td></tr>
							<tr><th scope="row">Z</th><td>Mammal: body → heart</td><td>Deoxygenated</td></tr>
						</tbody>
					</table>
					<p><strong>Therefore, S and Y contain oxygenated blood.</strong> In fish, blood gains oxygen at the gills before flowing to the body. In mammals, blood gains oxygen at the lungs before returning to the heart.</p>
					<h3>Check the options</h3>
					<ul class="option-explanations">
						<li><strong>A. R and X:</strong> Both labels carry deoxygenated blood toward the gills or lungs.</li>
						<li><strong>B. S and Y:</strong> Correct. S carries blood from the fish gills to the body; Y returns blood from the mammal lungs to the heart.</li>
						<li><strong>C. T and Y:</strong> T carries deoxygenated blood from the fish body to the heart.</li>
						<li><strong>D. T and Z:</strong> Both carry deoxygenated blood from the body toward the heart.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<p>Fish have single circulation: blood passes through the heart once per circuit. Mammals have double circulation: blood passes through the heart twice per circuit. Pulmonary arteries carry deoxygenated blood, while pulmonary veins carry oxygenated blood. Arteries carry blood away from the heart; veins carry it toward the heart.</p>
				`
			},
			{
				title: "The photomicrograph shows human blood. Which blood component can carry out the process of phagocytosis?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the blood component that carries out phagocytosis",
				context: `
					<figure class="explanation-photo">
						<img src="images/question-20.png" alt="Photomicrograph of human blood labelled A to D" loading="lazy" decoding="async">
					</figure>
				`,
				options: ["A. Phagocyte (neutrophil)", "B. Lymphocyte", "C. Red blood cell", "D. Plasma"],
				letterOnlyOptions: true,
				correct: "A",
				answer: "A. Phagocyte (neutrophil)",
				explanation: `
					<p class="definition">Phagocytosis is the process by which certain white blood cells engulf and digest pathogens such as bacteria.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="20">
            <a href="images/online-phagocytosis.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-phagocytosis.png" width="375" height="485" alt="Phagocytosis diagram showing a cell membrane surrounding a large particle and enclosing it in a vacuole" loading="lazy" decoding="async">
            </a>
            <figcaption>In phagocytosis, a cell surrounds a large particle and encloses it in a vacuole. <span class="image-credit">Image: OpenStax, via <a href="https://commons.wikimedia.org/wiki/File:0309_Phagocytosis.png" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

					<h3>Identify the labelled blood components</h3>
					<figure class="blood-components-figure">
						<svg viewBox="0 0 800 225" role="img" aria-labelledby="blood-components-title blood-components-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="blood-components-title">Blood components and their functions</title>
							<desc id="blood-components-desc">A is a neutrophil phagocyte with a multi-lobed nucleus; B is a lymphocyte with a large round nucleus; C is a red blood cell; D is plasma.</desc>
							<g class="blood-cell-outline">
								<circle cx="100" cy="85" r="42" fill="#f4f6ef"/>
								<path d="M76 77 C68 60 91 55 100 70 C111 52 132 66 118 80 C133 98 111 109 101 94 C86 111 69 96 82 84Z" fill="#72787c"/>
								<circle cx="300" cy="85" r="42" fill="#f4f6ef"/><circle cx="300" cy="85" r="29" fill="#72787c"/>
								<ellipse cx="500" cy="85" rx="48" ry="34" fill="#d9827b"/><ellipse cx="500" cy="85" rx="23" ry="13" fill="#efb5ac" stroke="none"/>
								<path d="M700 42 C689 63 667 84 667 102 A33 33 0 0 0 733 102 C733 84 711 63 700 42Z" fill="#e8d7a5"/>
							</g>
							<g text-anchor="middle" font-size="16">
								<text x="100" y="155" font-weight="700">A · Neutrophil</text><text x="100" y="178">Phagocytosis</text>
								<text x="300" y="155" font-weight="700">B · Lymphocyte</text><text x="300" y="178">Antibodies</text>
								<text x="500" y="155" font-weight="700">C · Red blood cell</text><text x="500" y="178">Oxygen transport</text>
								<text x="700" y="155" font-weight="700">D · Plasma</text><text x="700" y="178">Dissolved substances</text>
							</g>
						</svg>
						<figcaption>The multilobed nucleus is characteristic of a neutrophil, a type of phagocyte.</figcaption>
					</figure>
					<table class="comparison-table">
						<caption>Blood components and their roles</caption>
						<thead><tr><th scope="col">Label</th><th scope="col">Component</th><th scope="col">Function</th></tr></thead>
						<tbody>
							<tr><th scope="row">A</th><td>Phagocyte (neutrophil)</td><td>Engulfs and digests pathogens by phagocytosis.</td></tr>
							<tr><th scope="row">B</th><td>Lymphocyte</td><td>Produces antibodies as part of the immune response.</td></tr>
							<tr><th scope="row">C</th><td>Red blood cell</td><td>Transports oxygen using haemoglobin.</td></tr>
							<tr><th scope="row">D</th><td>Plasma</td><td>Transports dissolved substances, including nutrients, hormones and urea.</td></tr>
						</tbody>
					</table>
					<h3>Stages of phagocytosis</h3>
					<figure class="phagocytosis-figure">
						<svg viewBox="0 0 760 230" role="img" aria-labelledby="phagocytosis-title phagocytosis-desc" xmlns="http://www.w3.org/2000/svg">
							<title id="phagocytosis-title">Three stages of phagocytosis</title>
							<desc id="phagocytosis-desc">A phagocyte recognizes a pathogen, engulfs it, and digests it with enzymes.</desc>
							<defs><marker id="phagocytosis-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#1e654f"/></marker></defs>
							<g class="blood-cell-outline">
								<circle cx="105" cy="88" r="50" fill="#eaf2e7"/><circle cx="143" cy="54" r="13" fill="#a63d38"/>
								<circle cx="380" cy="88" r="50" fill="#eaf2e7"/><circle cx="380" cy="75" r="16" fill="#a63d38"/>
								<circle cx="655" cy="88" r="50" fill="#eaf2e7"/><circle cx="655" cy="88" r="12" fill="#a63d38"/><circle cx="639" cy="103" r="4" fill="#a63d38"/><circle cx="668" cy="104" r="4" fill="#a63d38"/>
							</g>
							<path d="M190 88 H280 M465 88 H555" fill="none" stroke="#1e654f" stroke-width="3" marker-end="url(#phagocytosis-arrow)"/>
							<g text-anchor="middle" fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="16" font-weight="700">
								<text x="120" y="175">1. Recognize pathogen</text><text x="380" y="175">2. Engulf pathogen</text><text x="640" y="175">3. Digest with enzymes</text>
							</g>
						</svg>
						<figcaption>Engulf → digest → destroy the pathogen.</figcaption>
					</figure>
					<p class="exam-tip"><strong>IGCSE exam tip:</strong> Phagocytes often have a lobed nucleus and carry out a non-specific defence. Lymphocytes have a large, round nucleus and produce specific antibodies.</p>
				`
			},
			{
				title: "The diagrams show four different stages in one heartbeat. What is the correct order for the stages after stage P?",
				paperCode: "0610/22/F/M/21",
				paperSession: "Feb/March 2021",
				legend: "Choose the correct order of the heart-cycle stages after P",
				context: `
					<figure class="circulation-diagram">
						<img src="images/question-21.png" alt="Four heart diagrams labelled P, Q, R and S showing blood-flow directions during one heartbeat" loading="lazy" decoding="async">
					</figure>
				`,
				options: ["Q → R → S", "R → Q → S", "R → S → Q", "S → R → Q"],
				correct: "B",
				answer: "B. R → Q → S",
				explanation: `
					<p class="definition">The cardiac cycle is the sequence of events during one heartbeat.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="21">
            <a href="images/online-cardiac-cycle.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-cardiac-cycle.jpg" width="960" height="1045" alt="Circular diagram of atrial contraction, ventricular contraction, relaxation and filling during the cardiac cycle" loading="lazy" decoding="async">
            </a>
            <figcaption>The cardiac cycle alternates contraction and relaxation; the diagram also shows when the valves open and close. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2027_Phases_of_the_Cardiac_Cycle.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

					<table class="comparison-table">
						<caption>Identify each stage</caption>
						<thead><tr><th scope="col">Stage</th><th scope="col">What happens?</th></tr></thead>
						<tbody>
							<tr><th scope="row">P</th><td>Blood returns through the veins and enters the atria.</td></tr>
							<tr><th scope="row">R</th><td>The atria contract and push blood into the ventricles (atrial systole).</td></tr>
							<tr><th scope="row">Q</th><td>The ventricles contract and pump blood into the pulmonary artery and aorta (ventricular systole).</td></tr>
							<tr><th scope="row">S</th><td>Blood continues through the arteries while the atria receive blood from the veins.</td></tr>
						</tbody>
					</table>
					<div class="translocation-flow" role="img" aria-label="After P, the atria contract at R, then ventricles contract at Q, then blood continues flowing at S">
						<div class="flow-step"><strong>R · Atrial systole</strong><span>Atria push blood into ventricles</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>Q · Ventricular systole</strong><span>Ventricles pump blood into arteries</span></div>
						<span class="flow-arrow" aria-hidden="true">→</span>
						<div class="flow-step"><strong>S · Continuing flow</strong><span>Blood moves through arteries as atria refill</span></div>
					</div>
					<h3>Check the options</h3>
					<ul class="option-explanations">
						<li><strong>A. Q → R → S:</strong> Places ventricular contraction before atrial contraction.</li>
						<li><strong>B. R → Q → S:</strong> Correct. The atria contract first, then the ventricles, followed by continuing blood flow.</li>
						<li><strong>C. R → S → Q:</strong> Places continuing flow before ventricular contraction.</li>
						<li><strong>D. S → R → Q:</strong> Starts with continuing flow instead of the atria contracting after P.</li>
					</ul>
					<h3>IGCSE exam tip</h3>
					<p><strong>Systole</strong> means contraction, which raises pressure and pushes blood out of a chamber. The atria contract before the ventricles, so the ventricles fill before pumping blood away from the heart.</p>
				`
			},
			{
    			title: "Which heart valves are open and which are closed when blood passes out of the right ventricle towards the lungs?",
    			paperCode: "0610/22/M/J/14",
    			paperSession: "May/June 2014",
    			legend: "Choose the valve positions when blood leaves the right ventricle",
    			options: ["bicuspid (mitral) valve closed, tricuspid valve open",
        				"bicuspid (mitral) valve open, semi-lunar valve closed",
        				"tricuspid valve closed, semi-lunar valve open",
       					 "tricuspid valve open, bicuspid (mitral) valve open"],
    			correct: "C",
    			answer: "C. Tricuspid valve closed, semi-lunar valve open",
    			explanation: `			
        <p class="definition">
            When the right ventricle ejects blood towards the lungs,
            the <strong>tricuspid valve is closed</strong> and the
            <strong>pulmonary semi-lunar valve is open</strong>.
        </p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="22">
            <a href="images/online-cardiac-cycle.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-cardiac-cycle.jpg" width="960" height="1045" alt="Circular diagram of atrial contraction, ventricular contraction, relaxation and filling during the cardiac cycle" loading="lazy" decoding="async">
            </a>
            <figcaption>The cardiac cycle alternates contraction and relaxation; the diagram also shows when the valves open and close. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2027_Phases_of_the_Cardiac_Cycle.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>


        <ul class="option-explanations">
            <li>
                <strong>Tricuspid valve — closed:</strong>
                Prevents blood flowing back into the right atrium.
            </li>
            <li>
                <strong>Pulmonary semi-lunar valve — open:</strong>
                Allows blood to enter the pulmonary artery towards the lungs.
            </li>
        </ul>

        <p class="relationship">
            Right ventricle &rarr; pulmonary artery &rarr; lungs
        </p>

        <p class="exam-tip">
            <strong>IGCSE exam tip:</strong>
            During ventricular ejection, atrioventricular valves are
            closed and semi-lunar valves are open. The bicuspid
            (mitral) valve is on the left side of the heart.
        </p>
    `
}
,
            {
                title: "Which conclusions can be made from the experiment?",
                paperCode: "0610/22/F/M/21",
                paperSession: "Feb/March 2021",
                legend: "Choose the correct conclusions about sucrose translocation",
                context: `
                    <p>Scientists investigated the movement of sucrose through a plant. They used carbon dioxide containing radioactive carbon, <sup>14</sup>C.</p>
                    <p>They covered one leaf on a plant with a clear plastic bag containing <sup>14</sup>CO<sub>2</sub>. After 24 hours, the plant was placed onto photographic film. The photographic film went black where the radioactive carbon was present.</p>
                    <p>Diagram 1 shows the plant at the end of the experiment and diagram 2 shows the photographic film at the end of the experiment.</p>
                    <figure class="circulation-diagram">
                        <img src="images/question-23.png" alt="Diagram 1 shows a plant with a leaf enclosed in a clear plastic bag containing carbon dioxide labelled with carbon-14. Diagram 2 shows dark regions in the treated leaf, stem above and below the leaf, growing shoot tip, flower and roots." loading="lazy" decoding="async">
                    </figure>
                    <ol class="statement-list">
                        <li>Translocation occurs in upwards and downwards directions.</li>
                        <li>The leaf and shoot tip are sources.</li>
                        <li>The roots and flowers are sinks.</li>
                    </ol>
                `,
                options: ["1, 2 and 3", "1 and 2 only", "1 and 3 only", "2 and 3 only"],
                correct: "C",
                answer: "C. 1 and 3 only",
                explanation: `
    <h3>Step-by-step explanation</h3>
    <p class="definition">The experiment uses radioactive carbon-14 (<sup>14</sup>C) to trace the movement of sugars through the plant.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="23">
            <a href="images/online-phloem-source-sink.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-phloem-source-sink.png" width="960" height="599" alt="Published educational diagram of sucrose translocation from source to sink through phloem" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting diagram: sucrose moves from a source to a sink in phloem. Its labels are separate from those in the question. <span class="image-credit">Image: Alyssa Pham, via <a href="https://commons.wikimedia.org/wiki/File:Translocation_from_the_source_to_the_sink_within_the_phloem.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</span></figcaption>
        </figure>


    <h3>Step 1: Understand the experiment</h3>
    <ul class="option-explanations">
        <li>The leaf absorbs radioactive carbon dioxide, <sup>14</sup>CO<sub>2</sub>.</li>
        <li>During photosynthesis, radioactive carbon is incorporated into sugars.</li>
        <li>Glucose can be converted into sucrose.</li>
        <li>The labelled sucrose is transported through the phloem by translocation.</li>
        <li>The photographic film turns black where radioactive carbon is present.</li>
    </ul>

    <h3>Step 2: Evaluate the statements</h3>
    <table class="comparison-table statement-table">
        <caption>Conclusions from the radioactive tracer experiment</caption>
        <thead>
            <tr><th scope="col">Statement</th><th scope="col">Correct?</th><th scope="col">Explanation</th></tr>
        </thead>
        <tbody>
            <tr><th scope="row">1. Translocation occurs in upwards and downwards directions.</th><td>Correct</td><td>Radioactive carbon is detected both above and below the labelled leaf.</td></tr>
            <tr><th scope="row">2. The leaf and shoot tip are sources.</th><td>Incorrect</td><td>The mature photosynthesising leaf is a source, but the growing shoot tip is a sink because it requires sugars for growth.</td></tr>
            <tr><th scope="row">3. The roots and flowers are sinks.</th><td>Correct</td><td>Roots and flowers receive sugars for respiration, growth or storage.</td></tr>
        </tbody>
    </table>

    <h3>Step 3: Understand source and sink</h3>
    <div class="translocation-flow" role="img" aria-label="The mature leaf is a source that produces sugars by photosynthesis. Sucrose moves through the phloem to sinks including the growing shoot tip, flower and roots.">
        <div class="flow-step"><strong>Leaf — SOURCE</strong><span>Produces sugars by photosynthesis</span></div>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <div class="flow-step"><strong>Phloem translocation</strong><span>Carries sucrose from source to sinks</span></div>
        <span class="flow-arrow" aria-hidden="true">&rarr;</span>
        <div class="flow-step"><strong>SINKS</strong><span>Growing shoot tip</span><span>Flower</span><span>Roots</span></div>
    </div>

    <h3>IGCSE exam tip</h3>
    <ul class="option-explanations">
        <li><strong>Source:</strong> A region that releases sucrose into the phloem, such as a mature photosynthesising leaf.</li>
        <li><strong>Sink:</strong> A region that uses or stores sucrose, such as roots, flowers, developing fruits and growing shoot tips.</li>
    </ul>
    <p class="exam-tip">Remember that phloem translocation can occur <strong>both upwards and downwards</strong>, depending on the positions of sources and sinks.</p>
    <p class="relationship">Final answer: C — 1 and 3 only.</p>
`
            }
,
{
    title: "What can be concluded from this graph?",
    paperCode: "0610/23/M/J/21",
    paperSession: "May/June 2021",
    legend: "Choose the conclusion supported by the Agave americana graph",
    context: `
        <p>The graph shows daily carbon dioxide uptake and transpiration by the plant <i>Agave americana</i>. The plant is adapted to live in very dry conditions.</p>
        <figure class="circulation-diagram">
            <img src="images/question-24.png" alt="Daily carbon dioxide uptake and transpiration in Agave americana. Carbon dioxide uptake is high around midnight, falls sharply near 06:00, stays low for most of the day and rises again during the evening. Transpiration remains above zero throughout the day." loading="lazy" decoding="async">
        </figure>
    `,
    options: [
        "More stomata are closed during dark periods.",
        "More stomata are closed during light periods.",
        "There is no carbon dioxide uptake during dark periods.",
        "There is no water uptake during light periods."
    ],
    correct: "B",
    answer: "B. More stomata are closed during light periods",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The graph shows how <i>Agave americana</i>, a plant adapted to very dry conditions, changes its carbon dioxide uptake and transpiration throughout the day.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="24">
            <a href="images/online-agave-americana.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-agave-americana.jpg" width="960" height="638" alt="Agave americana with a rosette of thick, pointed leaves" loading="lazy" decoding="async">
            </a>
            <figcaption>Agave americana, a CAM plant adapted to dry conditions. This photograph shows the plant; it does not measure stomatal opening or gas exchange. <span class="image-credit">Image: Marc Ryckaert (MJJR), via <a href="https://commons.wikimedia.org/wiki/File:Agave_americana_R01.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Analyse the graph</h3>
        <table class="comparison-table">
            <caption>Compare carbon dioxide uptake during night and day</caption>
            <thead><tr><th scope="col">Time period</th><th scope="col">CO<sub>2</sub> uptake</th><th scope="col">Stomatal behaviour</th></tr></thead>
            <tbody>
                <tr><th scope="row">Night (approximately 18:00–06:00)</th><td>Generally high, rising during the evening</td><td>More stomata are open</td></tr>
                <tr><th scope="row">Day (approximately 06:00–18:00)</th><td>Very low for most of this period</td><td>More stomata are closed</td></tr>
            </tbody>
        </table>
        <p>During the day, CO<sub>2</sub> uptake decreases sharply, indicating that most stomata are closed. At night, CO<sub>2</sub> uptake increases because more stomata open.</p>

        <h3>Step 2: Explain the adaptation</h3>
        <p><i>Agave americana</i> is a <strong>xerophyte</strong> (a plant adapted to dry environments) that uses <strong>Crassulacean Acid Metabolism (CAM)</strong>.</p>
        <ul class="option-explanations">
            <li><strong>During the day:</strong> Stomata are mostly closed to reduce water loss by transpiration.</li>
            <li><strong>During the night:</strong> Stomata open to absorb carbon dioxide when temperatures are cooler and humidity is often higher.</li>
            <li><strong>Stored carbon dioxide:</strong> The absorbed CO<sub>2</sub> is stored temporarily in organic acids, then released for use in photosynthesis during the following day.</li>
        </ul>
        <p>This adaptation helps the plant <strong>conserve water</strong>.</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table statement-table">
            <caption>Evaluate each conclusion</caption>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — more stomata are open during dark periods, allowing CO<sub>2</sub> uptake.</td></tr>
                <tr><th scope="row">B</th><td><strong>Correct — more stomata are closed during light periods, reducing water loss.</strong></td></tr>
                <tr><th scope="row">C</th><td>Incorrect — the graph shows substantial CO<sub>2</sub> uptake during dark periods.</td></tr>
                <tr><th scope="row">D</th><td>Incorrect — the graph measures transpiration (water loss), not water uptake. Transpiration continues during the day.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table">
            <caption>Compare most plants with CAM plants</caption>
            <thead><tr><th scope="col">Feature</th><th scope="col">Most plants</th><th scope="col">CAM plants</th></tr></thead>
            <tbody>
                <tr><th scope="row">Stomata open mainly</th><td>During daytime</td><td>During nighttime</td></tr>
                <tr><th scope="row">CO<sub>2</sub> uptake</th><td>Mainly daytime</td><td>Mainly nighttime</td></tr>
                <tr><th scope="row">Main advantage of CAM</th><td>&mdash;</td><td>Conserves water in dry conditions</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key exam concept:</strong> CAM plants open their stomata mainly at night and close them during the day to reduce transpiration. Closed stomata reduce water loss; they do not necessarily stop it completely.</p>
        <p class="relationship">Final answer: B — More stomata are closed during light periods.</p>
    `
}
,
            {
                title: "The results suggest the optimum temperature for the enzyme is between which two values?",
                paperCode: "0610/23/O/N/24",
                paperSession: "Oct/Nov 2024",
                legend: "Choose the temperature range containing the enzyme's optimum temperature",
                context: `
                    <p>An enzyme in potato cells causes oxygen to be produced when hydrogen peroxide is broken down. Cubes of potato tissue were placed in hydrogen peroxide solution at different temperatures, and the number of oxygen bubbles released per minute was counted.</p>
                    <table class="comparison-table catalase-data-table">
                        <caption>Oxygen production at different temperatures</caption>
                        <thead><tr><th scope="col">Temperature (°C)</th><th scope="col">Number of oxygen bubbles released per minute</th></tr></thead>
                        <tbody>
                            <tr><th scope="row">15</th><td>96</td></tr>
                            <tr><th scope="row">25</th><td>98</td></tr>
                            <tr><th scope="row">35</th><td>82</td></tr>
                            <tr><th scope="row">45</th><td>36</td></tr>
                            <tr><th scope="row">55</th><td>1</td></tr>
                        </tbody>
                    </table>
                `,
                options: ["15°C and 35°C", "35°C and 45°C", "35°C and 55°C", "45°C and 55°C"],
                correct: "A",
                answer: "A. 15°C and 35°C",
                explanation: `
                    <p class="definition">Potato cells contain the enzyme <strong>catalase</strong>, which catalyses the breakdown of hydrogen peroxide into water and oxygen. The number of oxygen bubbles released per minute provides an indication of the reaction rate.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="25">
            <a href="images/online-enzyme-active-site.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-active-site.png" width="1088" height="713" alt="A folded polypeptide chain forms an enzyme with a substrate bound at its active site" loading="lazy" decoding="async">
            </a>
            <figcaption>Enzymes are folded proteins with active sites. The potato catalase experiment measures how temperature affects enzyme activity; its measured results are given in the question and interactive chart. <span class="image-credit">Image: User:Mcy_jerry on EN WP as en:File:Enzymeactivesite.png, via <a href="https://commons.wikimedia.org/wiki/File:Enzyme_active_site.png" target="_blank" rel="noreferrer">source</a>, <a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

                    <p class="relationship">2H<sub>2</sub>O<sub>2</sub> &rarr; 2H<sub>2</sub>O + O<sub>2</sub></p>
                    <h3>Step 1: Find the highest recorded reaction rate</h3>
                    <table class="comparison-table catalase-data-table">
                        <caption>Compare the measured rates of oxygen production</caption>
                        <thead><tr><th scope="col">Temperature (°C)</th><th scope="col">Oxygen bubbles per minute</th></tr></thead>
                        <tbody>
                            <tr><th scope="row">15</th><td>96</td></tr>
                            <tr><th scope="row"><strong>25</strong></th><td><strong>98 — highest measured rate</strong></td></tr>
                            <tr><th scope="row">35</th><td>82</td></tr>
                            <tr><th scope="row">45</th><td>36</td></tr>
                            <tr><th scope="row">55</th><td>1</td></tr>
                        </tbody>
                    </table>
                    <p>The highest measured rate is <strong>98 bubbles per minute at 25°C</strong>.</p>
                    <div class="catalase-lab" id="catalase-infographic" role="group" aria-labelledby="catalase-lab-title" aria-live="off">
    <h3 id="catalase-lab-title">Explore the measured results</h3>
    <p class="catalase-intro">Select a bar or move the slider to compare the five tested temperatures.</p>
    <p class="catalase-axis-title">Oxygen bubbles per minute</p>
    <div class="catalase-chart" role="group" aria-label="Measured oxygen production from 0 to 100 bubbles per minute. Each bar selects one tested temperature.">
        <div class="catalase-y-axis" aria-hidden="true"><span>100</span><span>50</span><span>0</span></div>
        <div class="catalase-columns">
            <button class="catalase-column within-range" type="button" data-catalase-index="0" aria-pressed="false" aria-label="15°C: 96 oxygen bubbles per minute" style="--bubbles:96"><span class="catalase-bar-space" aria-hidden="true"><span class="catalase-bar"></span><span class="catalase-bar-value">96</span></span><span class="catalase-temperature-label" aria-hidden="true">15°C</span></button>
            <button class="catalase-column within-range" type="button" data-catalase-index="1" aria-pressed="true" aria-label="25°C: 98 oxygen bubbles per minute; highest measured rate" style="--bubbles:98"><span class="catalase-bar-space" aria-hidden="true"><span class="catalase-bar"></span><span class="catalase-bar-value">98</span></span><span class="catalase-temperature-label" aria-hidden="true">25°C</span></button>
            <button class="catalase-column within-range" type="button" data-catalase-index="2" aria-pressed="false" aria-label="35°C: 82 oxygen bubbles per minute" style="--bubbles:82"><span class="catalase-bar-space" aria-hidden="true"><span class="catalase-bar"></span><span class="catalase-bar-value">82</span></span><span class="catalase-temperature-label" aria-hidden="true">35°C</span></button>
            <button class="catalase-column" type="button" data-catalase-index="3" aria-pressed="false" aria-label="45°C: 36 oxygen bubbles per minute" style="--bubbles:36"><span class="catalase-bar-space" aria-hidden="true"><span class="catalase-bar"></span><span class="catalase-bar-value">36</span></span><span class="catalase-temperature-label" aria-hidden="true">45°C</span></button>
            <button class="catalase-column" type="button" data-catalase-index="4" aria-pressed="false" aria-label="55°C: 1 oxygen bubble per minute" style="--bubbles:1"><span class="catalase-bar-space" aria-hidden="true"><span class="catalase-bar"></span><span class="catalase-bar-value">1</span></span><span class="catalase-temperature-label" aria-hidden="true">55°C</span></button>
        </div>
    </div>
    <p class="catalase-x-title">Temperature (°C)</p>
    <div class="catalase-badges"><span><strong>Highest measured:</strong> 25°C · 98 bubbles/min</span><span><strong>Suggested range:</strong> 15–35°C (pale green)</span></div>
    <div class="catalase-control">
        <label for="catalase-temperature-slider">Choose a tested temperature</label>
        <input id="catalase-temperature-slider" type="range" min="0" max="4" step="1" value="1" aria-valuetext="25°C; 98 oxygen bubbles per minute">
    </div>
    <output class="catalase-reading" id="catalase-reading" for="catalase-temperature-slider" aria-live="polite" aria-atomic="true"><strong id="catalase-selected-temperature">25°C</strong><span id="catalase-selected-rate">98 oxygen bubbles per minute</span></output>
    <div class="catalase-rate-caption"><span>Relative to the highest measured rate</span><strong id="catalase-rate-percent">100.0%</strong></div>
    <div class="catalase-rate-track" id="catalase-rate-meter" role="meter" aria-label="Measured oxygen production" aria-valuemin="0" aria-valuemax="98" aria-valuenow="98" aria-valuetext="98 oxygen bubbles per minute; 100% of the highest measured rate"><div id="catalase-rate-fill" style="width:100%"></div></div>
    <p class="catalase-stage" id="catalase-stage">This is the highest measured rate: 98 bubbles per minute. The exact optimum is not established by these five widely spaced temperatures.</p>
    <p class="catalase-limit">Only tested temperatures are selectable. The exact optimum needs further measurements around 25°C.</p>
</div>
                    <h3>Step 2: Choose the range containing that temperature</h3>
                    <p><strong>25°C lies between 15°C and 35°C</strong>, so the results suggest <strong>option A</strong>. The exact optimum temperature is not established by these measurements; more temperatures around 25°C would need to be tested.</p>
                    <h3>Step 3: Explain the temperature pattern</h3>
                    <ul class="option-explanations">
                        <li><strong>15°C to 25°C:</strong> The measured rate increases slightly, from 96 to 98 bubbles per minute. Increasing temperature increases molecular kinetic energy and collision frequency, which can increase the reaction rate.</li>
                        <li><strong>Above 25°C:</strong> The measured rate declines. This is consistent with higher temperatures reducing enzyme activity.</li>
                        <li><strong>35°C to 55°C:</strong> The rate falls sharply, from 82 to 1 bubble per minute. Heat can denature catalase, changing the shape of its active site so that the substrate no longer fits effectively and fewer enzyme–substrate complexes form.</li>
                    </ul>
                    <p class="exam-tip"><strong>IGCSE exam tip:</strong> The <strong>optimum temperature</strong> is the temperature at which an enzyme-controlled reaction has its highest rate under the conditions used. <strong>Denaturation</strong> is a change in an enzyme's structure that alters its active site and prevents normal function. Find the highest recorded reaction rate before choosing the temperature range; the temperature with the highest recorded rate is not necessarily the exact optimum.</p>
                `
            }
,
{
    title: "The student was asked to predict and explain the result on a hot and humid day. Which row is correct?",
    paperCode: "0610/23/O/N/24",
    paperSession: "Oct/Nov 2024",
    legend: "Choose the predicted bubble distance and explanation for a hot and humid day",
    context: `
        <p>A student set up the experiment shown in the diagram on a hot and dry day. The air bubble moved towards the leafy shoot by <strong>30 mm in 1 hour</strong>.</p>
        <figure class="circulation-diagram">
            <img src="images/question-26.png" alt="A potometer attached to a leafy shoot, with a reservoir of water, a scale and an air bubble in a horizontal capillary tube. The air bubble moves towards the leafy shoot as water is taken up." loading="lazy" decoding="async">
        </figure>
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Predict the distance moved in 1 hour on a hot and humid day</caption>
            <colgroup><col style="width:58px"><col style="width:22%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Distance moved / mm</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>15</td><td>Water evaporates more quickly in humid air.</td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>15</td><td>Water evaporates more slowly in humid air.</td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>45</td><td>Water evaporates more quickly in humid air.</td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>45</td><td>Water evaporates more slowly in humid air.</td></tr>
            </tbody>
        </table>
    `,
    options: [
        "15 mm — water evaporates more quickly in humid air",
        "15 mm — water evaporates more slowly in humid air",
        "45 mm — water evaporates more quickly in humid air",
        "45 mm — water evaporates more slowly in humid air"
    ],
    hideAnswerOptions: true,
    correct: "B",
    answer: "B. 15 mm — water evaporates more slowly in humid air",
    explanation: `
        <p class="definition">The diagram shows a <strong>potometer</strong>, which measures the rate of water uptake by a leafy shoot as an estimate of its transpiration rate.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="26">
            <a href="images/online-potometer.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-potometer.png" width="960" height="1594" alt="Published diagram of a leafy shoot connected to a graduated potometer with a reservoir" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting potometer diagram. A potometer estimates transpiration from water uptake; this graduated apparatus differs from the bubble potometer in the question. <span class="image-credit">Image: Benedikt.Seidl, via <a href="https://commons.wikimedia.org/wiki/File:Potetometer.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Understand the original conditions</h3>
        <p>On a <strong>hot and dry day</strong>:</p>
        <ul class="option-explanations">
            <li>Water evaporates rapidly from the surfaces of mesophyll cells.</li>
            <li>The air outside the leaf has a low water vapour concentration.</li>
            <li>A steep water vapour concentration gradient causes rapid diffusion of water vapour out through the stomata.</li>
            <li>The air bubble moves <strong>30 mm in 1 hour</strong>.</li>
        </ul>

        <h3>Step 2: Predict what happens on a hot and humid day</h3>
        <ul class="option-explanations">
            <li>The surrounding air already contains more water vapour.</li>
            <li>The water vapour concentration gradient between the leaf and the air is smaller.</li>
            <li>Water evaporates and diffuses out of the leaf more slowly.</li>
            <li>Transpiration decreases, so less water is taken up by the shoot.</li>
        </ul>
        <p>Therefore, the air bubble should move <strong>less than 30 mm in 1 hour</strong>. Of the two distances provided, <strong>15 mm</strong> is correct.</p>
        <p><strong>This is a prediction, not an exact value calculated from the data.</strong> The information supports a shorter distance, but does not establish the exact distance.</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare the predicted distance and explanation</caption>
            <colgroup><col style="width:15%"><col style="width:20%"><col style="width:43%"><col style="width:22%"></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Distance</th><th scope="col">Explanation</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>15 mm</td><td>Faster evaporation in humid air</td><td>Incorrect</td></tr>
                <tr><th scope="row">B</th><td>15 mm</td><td>Slower evaporation in humid air</td><td><strong>Correct</strong></td></tr>
                <tr><th scope="row">C</th><td>45 mm</td><td>Faster evaporation in humid air</td><td>Incorrect</td></tr>
                <tr><th scope="row">D</th><td>45 mm</td><td>Slower evaporation in humid air</td><td>Incorrect</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <div class="translocation-flow" role="img" aria-label="Increasing humidity reduces the leaf-to-air water vapour concentration gradient and decreases transpiration. Water uptake decreases, so the air bubble moves a shorter distance.">
            <div class="flow-step"><strong>Humidity increases</strong><span>The air contains more water vapour</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Water vapour gradient decreases</strong><span>Diffusion out of the leaf slows</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Transpiration decreases</strong><span>Less water is taken up; the bubble moves a shorter distance</span></div>
        </div>
        <p class="exam-tip"><strong>Important:</strong> A potometer measures <strong>water uptake</strong>, not transpiration directly. Water uptake usually provides a good estimate of transpiration because most of the water taken up is lost through transpiration.</p>
        <p class="relationship">Final answer: B — 15 mm, slower evaporation in humid air.</p>
    `
}
,
{
    title: "Which statement explains the shape of the graph at section X?",
    paperCode: "0610/23/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the explanation for section X of the enzyme reaction graph",
    context: `
        <p>The graph shows the effect of temperature on the rate of a reaction catalysed by an enzyme.</p>
        <figure class="explanation-photo">
            <img src="images/question-27.png" alt="A graph of enzyme reaction rate against temperature. The curve rises to a peak and then falls steeply. Section X marks part of the rising curve before the peak." loading="lazy" decoding="async">
        </figure>
    `,
    options: [
        "The enzyme is not the correct one to act on this substrate.",
        "The enzyme is starting to denature.",
        "The number of active sites is increasing.",
        "The frequency of enzyme–substrate collisions is increasing."
    ],
    correct: "D",
    answer: "D. The frequency of enzyme–substrate collisions is increasing",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The graph shows the effect of temperature on the rate of an enzyme-controlled reaction. <strong>Section X is on the rising part of the curve, before the optimum temperature.</strong></p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="27">
            <a href="images/online-enzyme-active-site.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-active-site.png" width="1088" height="713" alt="A folded polypeptide chain forms an enzyme with a substrate bound at its active site" loading="lazy" decoding="async">
            </a>
            <figcaption>A folded protein forms an enzyme active site that binds a complementary substrate. <span class="image-credit">Image: User:Mcy_jerry on EN WP as en:File:Enzymeactivesite.png, via <a href="https://commons.wikimedia.org/wiki/File:Enzyme_active_site.png" target="_blank" rel="noreferrer">source</a>, <a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Explain why the reaction rate increases</h3>
        <p>As temperature increases:</p>
        <ol class="statement-list">
            <li>Enzyme and substrate molecules gain <strong>kinetic energy</strong>.</li>
            <li>The molecules move faster.</li>
            <li>The frequency of collisions between enzyme and substrate molecules increases.</li>
            <li>More successful collisions occur, forming more <strong>enzyme–substrate complexes per second</strong>.</li>
            <li>Therefore, the <strong>rate of reaction increases</strong>.</li>
        </ol>

        <h3>Step 2: Check the options</h3>
        <table class="comparison-table statement-table" style="table-layout:fixed">
            <caption>Evaluate the explanations for section X</caption>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Incorrect enzyme</th><td>Incorrect — if the enzyme were unsuitable for the substrate, it would not catalyse the reaction.</td></tr>
                <tr><th scope="row">B. Enzyme starts to denature</th><td>Incorrect — significant denaturation explains the falling section after the optimum temperature, rather than the rise at X.</td></tr>
                <tr><th scope="row">C. Number of active sites increases</th><td>Incorrect — increasing temperature does not create more active sites.</td></tr>
                <tr><th scope="row">D. Collision frequency increases</th><td><strong>Correct — more frequent successful collisions increase the reaction rate.</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table statement-table" style="table-layout:fixed">
            <caption>Three regions of a typical temperature–enzyme activity graph</caption>
            <thead><tr><th scope="col">Region</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">Rising curve</th><td>Increasing kinetic energy and collision frequency</td></tr>
                <tr><th scope="row">Peak</th><td>Optimum temperature — maximum reaction rate under the conditions used</td></tr>
                <tr><th scope="row">Falling curve</th><td>Denaturation changes the shape of active sites, reducing enzyme activity</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Important exam keywords:</strong> Kinetic energy &rarr; increased collision frequency &rarr; more enzyme–substrate complexes per second &rarr; faster reaction.</p>
        <p class="relationship">Final answer: D — The frequency of enzyme–substrate collisions is increasing.</p>
    `
}
,
{
    title: "What is the most likely number of bubbles produced in one minute in test-tube Q?",
    paperCode: "0610/23/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the predicted oxygen bubble count for test-tube Q",
    context: `
        <p>The diagram shows an experiment investigating the effect of light intensity on an aquatic plant.</p>
        <figure class="circulation-diagram">
            <img src="images/question-28.png" alt="Two test-tubes contain aquatic plants. Test-tube P is 20 cm from its light source and test-tube Q is 10 cm from its light source." loading="lazy" decoding="async">
        </figure>
        <p>Photosynthesis occurred in both test-tube P and test-tube Q. Both test-tubes were kept at the <strong>same temperature</strong>. The number of bubbles produced in test-tube P was <strong>12 bubbles per minute</strong>.</p>
    `,
    options: ["0 bubbles per minute", "3 bubbles per minute", "12 bubbles per minute", "48 bubbles per minute"],
    correct: "D",
    answer: "D. 48 bubbles per minute",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The experiment investigates how light intensity affects the rate of photosynthesis in an aquatic plant. Oxygen bubbles provide an indication of the rate.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="28">
            <a href="images/question-36-oxygen-bubbles.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/question-36-oxygen-bubbles.jpg" alt="Trails of small oxygen bubbles rising from submerged vegetation during photosynthesis" loading="lazy" decoding="async">
            </a>
            <figcaption>An aquatic plant releases oxygen bubbles during photosynthesis. The bubble-rate prediction in this question uses the lamp distances and the inverse-square approximation. <span class="image-credit">Image: Rcaravit, via <a href="https://commons.wikimedia.org/wiki/File:Photosynthesis_in_action.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Compare the distances</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare test-tubes P and Q</caption>
            <thead><tr><th scope="col">Test-tube</th><th scope="col">Distance from light</th><th scope="col">Oxygen bubbles per minute</th></tr></thead>
            <tbody>
                <tr><th scope="row">P</th><td>20 cm</td><td>12</td></tr>
                <tr><th scope="row">Q</th><td>10 cm</td><td><strong>48 (predicted)</strong></td></tr>
            </tbody>
        </table>
        <p>Test-tube Q is at <strong>half the distance</strong> from the light source compared with test-tube P.</p>

        <h3>Step 2: Apply the inverse square law</h3>
        <p>For a point light source, light intensity is inversely proportional to the square of the distance:</p>
        <p class="relationship">Light intensity &prop; 1 / d<sup>2</sup></p>
        <p>When the distance is halved:</p>
        <p class="relationship">I<sub>Q</sub> / I<sub>P</sub> = (20 / 10)<sup>2</sup> = 2<sup>2</sup> = 4</p>
        <p>Therefore, the light intensity at Q is approximately <strong>four times greater</strong>.</p>

        <h3>Step 3: Predict oxygen bubble production</h3>
        <p>Assuming <strong>light is the limiting factor</strong> and the rate of photosynthesis is proportional to light intensity:</p>
        <p class="relationship">12 &times; 4 = <strong>48 bubbles per minute</strong></p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare the predicted bubble counts</caption>
            <thead><tr><th scope="col">Option</th><th scope="col">Bubbles/min</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>0</td><td>Incorrect</td></tr>
                <tr><th scope="row">B</th><td>3</td><td>Incorrect</td></tr>
                <tr><th scope="row">C</th><td>12</td><td>Incorrect</td></tr>
                <tr><th scope="row">D</th><td>48</td><td><strong>Correct</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Light intensity and distance from a point source</caption>
            <thead><tr><th scope="col">Change in distance</th><th scope="col">Change in light intensity</th></tr></thead>
            <tbody>
                <tr><th scope="row">Distance halved</th><td>4&times; the original</td></tr>
                <tr><th scope="row">Distance doubled</th><td>&frac14; of the original</td></tr>
                <tr><th scope="row">Distance tripled</th><td>1/9 of the original</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Important:</strong> The inverse square law predicts <strong>light intensity</strong>, not necessarily photosynthesis directly. Photosynthesis increases proportionally only while light remains the limiting factor. At higher intensities, other factors, such as carbon dioxide concentration, may limit the reaction.</p>
        <p class="relationship">Final answer: D — 48 bubbles per minute.</p>
    `
}
,
{
    title: "Which row shows correct features of the circulatory system of a fish?",
    paperCode: "0610/23/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the correct heart chambers and circulation pattern for a fish",
    context: `
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Choose the correct features of a fish's circulatory system</caption>
            <colgroup><col style="width:52px"><col style="width:20%"><col style="width:22%"><col></colgroup>
            <thead>
                <tr><th scope="col">Option</th><th scope="col">Number of atria</th><th scope="col">Number of ventricles</th><th scope="col">Number of times blood flows through the heart during one circuit of the body</th></tr>
            </thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>One</td><td>One</td><td>Once</td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>One</td><td>Two</td><td>Twice</td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>Two</td><td>One</td><td>Twice</td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>Two</td><td>Two</td><td>Twice</td></tr>
            </tbody>
        </table>
    `,
    options: [
        "One atrium, one ventricle, once through the heart per circuit",
        "One atrium, two ventricles, twice through the heart per circuit",
        "Two atria, one ventricle, twice through the heart per circuit",
        "Two atria, two ventricles, twice through the heart per circuit"
    ],
    hideAnswerOptions: true,
    correct: "A",
    answer: "A. One atrium, one ventricle, one circulation",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Fish have a <strong>two-chambered heart</strong> and a <strong>single circulatory system</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="29">
            <a href="images/online-fish-single-circulation.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-fish-single-circulation.png" width="512" height="384" alt="Single circulation in a fish with an atrium, ventricle, gill capillaries and body capillaries" loading="lazy" decoding="async">
            </a>
            <figcaption>Fish blood flows through the heart, gill capillaries and body capillaries in a single circuit. <span class="image-credit">Image: Lennert B, via <a href="https://commons.wikimedia.org/wiki/File:Fish_circulation.PNG" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the heart chambers</h3>
        <ul class="option-explanations">
            <li><strong>One atrium:</strong> Receives deoxygenated blood returning from the body.</li>
            <li><strong>One ventricle:</strong> Pumps deoxygenated blood towards the gills.</li>
        </ul>
        <p>Therefore, the fish heart has <strong>one atrium and one ventricle</strong>.</p>

        <h3>Step 2: Understand single circulation</h3>
        <div class="translocation-flow" role="img" aria-label="Heart pumps deoxygenated blood to the gills, where it absorbs oxygen. Blood flows to body tissues, delivers oxygen, and returns to the heart, passing through the heart once per complete circuit.">
            <div class="flow-step"><strong>Heart</strong><span>Pumps deoxygenated blood towards the gills</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Gills</strong><span>Blood absorbs oxygen</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Body tissues</strong><span>Blood delivers oxygen to cells</span></div>
        </div>
        <p>Deoxygenated blood then <strong>returns to the heart</strong>, completing the circuit.</p>
        <p class="relationship">Heart &rarr; gills &rarr; body tissues &rarr; heart</p>
        <p>In single circulation, blood passes through the heart <strong>once during one complete circuit of the body</strong>.</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare each row with the features of a fish</caption>
            <colgroup><col style="width:14%"><col style="width:16%"><col style="width:22%"><col style="width:25%"><col style="width:23%"></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Atria</th><th scope="col">Ventricles</th><th scope="col">Passes through heart per circuit</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>1</td><td>1</td><td>Once</td><td><strong>Correct</strong></td></tr>
                <tr><th scope="row">B</th><td>1</td><td>2</td><td>Twice</td><td>Incorrect</td></tr>
                <tr><th scope="row">C</th><td>2</td><td>1</td><td>Twice</td><td>Incorrect</td></tr>
                <tr><th scope="row">D</th><td>2</td><td>2</td><td>Twice</td><td>Incorrect</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Fish and mammalian circulation</caption>
            <thead><tr><th scope="col">Feature</th><th scope="col">Fish</th><th scope="col">Mammals</th></tr></thead>
            <tbody>
                <tr><th scope="row">Number of atria</th><td>1</td><td>2</td></tr>
                <tr><th scope="row">Number of ventricles</th><td>1</td><td>2</td></tr>
                <tr><th scope="row">Circulation</th><td>Single</td><td>Double</td></tr>
                <tr><th scope="row">Passes through heart per complete circuit</th><td>Once</td><td>Twice</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key exam concept:</strong> Fish have a two-chambered heart with single circulation, while mammals have a four-chambered heart with double circulation.</p>
        <p class="relationship">Final answer: A — One atrium, one ventricle, one circulation.</p>
    `
}
,
{
    title: "Which structures contain a cell nucleus?",
    paperCode: "0610/11/M/J/14",
    paperSession: "May/June 2014",
    legend: "Choose which of the red blood cell, root hair cell and xylem vessel contain a nucleus",
    context: `
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Choose the correct pattern of nucleus presence</caption>
            <colgroup><col style="width:58px"><col><col><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Red blood cell</th><th scope="col">Root hair cell</th><th scope="col">Xylem vessel</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No nucleus</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Contains nucleus</span></td></tr>
            </tbody>
        </table>
        <p class="table-key"><strong>Key:</strong> ✓ = contains nucleus; ✗ = no nucleus.</p>
        <p class="hint">Consider a mature human red blood cell and mature xylem vessel elements.</p>
    `,
    options: [
        "Nucleus present in all three structures",
        "Nucleus present in the red blood cell only",
        "Nucleus present in the root hair cell only",
        "Nucleus present in the xylem vessel only"
    ],
    hideAnswerOptions: true,
    correct: "C",
    answer: "C. ✗ ✓ ✗ — Only the root hair cell contains a nucleus",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Of these three structures, <strong>only the root hair cell contains a nucleus</strong>. Mature human red blood cells and mature xylem vessel elements have no nucleus.</p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare the specialised structures</caption>
            <colgroup><col style="width:29%"><col style="width:21%"><col style="width:50%"></colgroup>
            <thead><tr><th scope="col">Structure</th><th scope="col">Contains nucleus?</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">Red blood cell</th><td>No</td><td>Mature human red blood cells lose their nucleus, leaving more space for haemoglobin.</td></tr>
                <tr><th scope="row">Root hair cell</th><td>Yes</td><td>A living plant cell with a nucleus that controls cellular activities.</td></tr>
                <tr><th scope="row">Xylem vessel</th><td>No</td><td>Mature vessel elements are dead and have lost their nucleus and cytoplasm.</td></tr>
            </tbody>
        </table>

        <h3>1. Red blood cell — no nucleus</h3>
        <p>Mature mammalian red blood cells are specialised for <strong>oxygen transport</strong>. Losing the nucleus leaves more space for haemoglobin, the protein that binds oxygen.</p>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:1903_Shape_of_Red_Blood_Cells.jpg" target="_blank" rel="noreferrer">
                <img src="images/question-30-red-blood-cells.jpg" width="614" height="706" style="max-width:480px;background:var(--white)" alt="Red blood cells with biconcave, disc-shaped surfaces" loading="lazy" decoding="async">
            </a>
            <figcaption>Red blood cells have a central depression, which is not a nucleus. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:1903_Shape_of_Red_Blood_Cells.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>. Image unchanged.</figcaption>
        </figure>

        <h3>2. Root hair cell — contains a nucleus</h3>
        <p>Root hair cells are <strong>living cells</strong> that absorb water by osmosis and mineral ions, often by active transport. The nucleus controls the cell's activities. Mitochondria release energy through aerobic respiration for processes such as active transport.</p>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Arabidopsis_root_hairs.jpg" target="_blank" rel="noreferrer">
                <img src="images/question-30-root-hairs.jpg" width="2752" height="2208" alt="Confocal fluorescence image of an Arabidopsis root with many thin root-hair extensions" loading="lazy" decoding="async">
            </a>
            <figcaption>Root hairs extend from root epidermal cells; nuclei are not labelled in this image. Photo: G Lens Microscopist, Megan Gerber, via <a href="https://commons.wikimedia.org/wiki/File:Arabidopsis_root_hairs.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Image unchanged.</figcaption>
        </figure>

        <h3>3. Xylem vessel — no nucleus</h3>
        <p>Mature xylem vessel elements are <strong>dead and hollow</strong>, with lignified walls. They have lost their nucleus and cytoplasm, forming tubes through which water and mineral ions flow through the plant.</p>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Xylem_cells.svg" target="_blank" rel="noreferrer">
                <img src="images/question-30-xylem.png" width="500" height="588" style="max-width:500px;background:var(--white)" alt="Diagram of xylem vessel elements showing their hollow interiors, thickened walls and pits, with a microscope inset" loading="lazy" decoding="async">
            </a>
            <figcaption>Xylem vessel elements form hollow conducting tubes. Diagram: Kelvinsong; microscope inset: Micropix, via <a href="https://commons.wikimedia.org/wiki/File:Xylem_cells.svg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Unmodified PNG preview.</figcaption>
        </figure>

        <h3>Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Only option C matches all three structures</caption>
            <colgroup><col style="width:20%"><col><col><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Red blood cell</th><th scope="col">Root hair cell</th><th scope="col">Xylem vessel</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Yes</td><td>Yes</td><td>Yes</td></tr>
                <tr><th scope="row">B</th><td>Yes</td><td>No</td><td>No</td></tr>
                <tr><th scope="row">C — correct</th><td><strong>No</strong></td><td><strong>Yes</strong></td><td><strong>No</strong></td></tr>
                <tr><th scope="row">D</th><td>No</td><td>No</td><td>Yes</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Mature mammalian red blood cells:</strong> No nucleus.</li>
            <li><strong>Root hair cells:</strong> Have a nucleus and mitochondria.</li>
            <li><strong>Mature xylem vessel elements:</strong> Dead, hollow and without a nucleus.</li>
            <li><strong>Mature phloem sieve tube elements:</strong> Living, but without a nucleus; supported by companion cells.</li>
        </ul>
        <p class="exam-tip"><strong>Remember:</strong> Having no nucleus does not always mean a cell is dead. Mature red blood cells and phloem sieve tube elements are living; mature xylem vessel elements are dead.</p>
        <p class="relationship">Final answer: C — ✗ ✓ ✗ (no, yes, no).</p>
    `
}
,
{
    title: "Which statement about biological molecules is correct?",
    paperCode: "0610/21/O/N/24",
    paperSession: "Oct/Nov 2024",
    legend: "Choose the correct statement about the building blocks of biological molecules",
    options: [
        "DNA molecules contain pairs of bases: A pairs with G and C pairs with T.",
        "Fatty acids and glycerol molecules can be joined together to form proteins.",
        "Glucose molecules can be joined together to make cellulose and glycogen.",
        "Starch molecules are made of maltase."
    ],
    correct: "C",
    answer: "C. Glucose molecules can be joined together to make cellulose and glycogen",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Glucose is a <strong>monosaccharide</strong>, or simple sugar. Many glucose molecules can join together to form large carbohydrate molecules called <strong>polysaccharides</strong>.</p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Two polysaccharides made from glucose</caption>
            <thead><tr><th scope="col">Polysaccharide</th><th scope="col">Building blocks</th><th scope="col">Function</th></tr></thead>
            <tbody>
                <tr><th scope="row">Cellulose</th><td>&beta;-glucose</td><td>Forms plant cell walls and provides structural support.</td></tr>
                <tr><th scope="row">Glycogen</th><td>&alpha;-glucose</td><td>Stores carbohydrate in animals, especially in the liver and muscles, as an energy reserve.</td></tr>
            </tbody>
        </table>

        <h3>How glucose forms polysaccharides</h3>
        <div class="translocation-flow" role="img" aria-label="Many glucose monosaccharides join by condensation reactions, releasing water and forming polysaccharides. Beta-glucose forms cellulose for plant cell walls; alpha-glucose forms glycogen for energy storage in animals.">
            <div class="flow-step"><strong>Many glucose molecules</strong><span>Monosaccharide building blocks</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Condensation reactions</strong><span>Glucose units join; water is released as bonds form</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Polysaccharides</strong><span>Cellulose: plant cell walls<br>Glycogen: energy storage in animals</span></div>
        </div>
        <p>The type of glucose and the way the units are joined determine the structure and properties of the polysaccharide: <strong>cellulose contains &beta;-glucose</strong>, while <strong>glycogen contains &alpha;-glucose</strong>.</p>
        <figure class="explanation-photo">
            <a href="https://upload.wikimedia.org/wikipedia/commons/5/52/219_Three_Important_Polysaccharides-01.jpg" target="_blank" rel="noreferrer" aria-label="Open the polysaccharide comparison diagram at full size in a new tab">
                <img src="images/question-31-polysaccharides.jpg" width="1582" height="547" style="width:100%;max-width:100%;background:var(--white)" alt="Comparison of glucose polymers: unbranched amylose, branched amylopectin, highly branched glycogen, and straight cellulose chains" loading="lazy" decoding="async">
            </a>
            <figcaption>Different glucose polymers have different structures. Amylose and amylopectin are components of starch. <a href="https://upload.wikimedia.org/wikipedia/commons/5/52/219_Three_Important_Polysaccharides-01.jpg" target="_blank" rel="noreferrer">Open the full-size diagram</a>. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:219_Three_Important_Polysaccharides-01.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>. Image unchanged.</figcaption>
        </figure>

        <h3>Why are the other options incorrect?</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Check each statement</caption>
            <colgroup><col style="width:18%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — DNA base pairing is <strong>A–T and C–G</strong>, not A–G and C–T.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — fatty acids and glycerol form <strong>fats and oils</strong>, which are lipids. Proteins are made from <strong>amino acids</strong>.</td></tr>
                <tr><th scope="row">C</th><td><strong>Correct — cellulose and glycogen are both polysaccharides made from glucose.</strong></td></tr>
                <tr><th scope="row">D</th><td>Incorrect — starch is made from <strong>&alpha;-glucose</strong> molecules. <strong>Maltase is an enzyme</strong> that breaks down maltose into two glucose molecules.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Building blocks of biological molecules</caption>
            <thead><tr><th scope="col">Biological molecule</th><th scope="col">Building blocks</th></tr></thead>
            <tbody>
                <tr><th scope="row">Starch</th><td>&alpha;-glucose</td></tr>
                <tr><th scope="row">Glycogen</th><td>&alpha;-glucose</td></tr>
                <tr><th scope="row">Cellulose</th><td>&beta;-glucose</td></tr>
                <tr><th scope="row">Proteins</th><td>Amino acids</td></tr>
                <tr><th scope="row">Fats and oils</th><td>Fatty acids and glycerol</td></tr>
                <tr><th scope="row">DNA</th><td>Nucleotides</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key exam concept:</strong> Starch, glycogen and cellulose are all polysaccharides composed of glucose, but their different structures give them different functions.</p>
        <p class="relationship">Final answer: C — Glucose molecules can be joined together to make cellulose and glycogen.</p>
    `
}
,
{
    title: "From these reactions, what deduction can be made about enzymes?",
    paperCode: "0610/12/O/N/13",
    paperSession: "Oct/Nov 2013",
    legend: "Choose the correct deduction from the two enzyme-controlled reactions",
    context: `
        <p>Two enzyme-controlled reactions are shown.</p>
        <figure class="plant-diagram" role="img" aria-label="Reaction 1: amino acids are converted into proteins, catalysed by enzyme 1. Reaction 2: proteins are converted into amino acids, catalysed by enzyme 2." style="padding:18px;border:1px solid var(--line);border-radius:7px;background:var(--white);font-size:.9375em">
            <div style="display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:24px 12px;align-items:center;text-align:center;overflow-wrap:anywhere">
                <span>Amino acids</span>
                <span>Enzyme 1<span aria-hidden="true" style="display:block;font-size:1.75em;line-height:1.1">&rarr;</span></span>
                <span>Proteins</span>
                <span>Proteins</span>
                <span>Enzyme 2<span aria-hidden="true" style="display:block;font-size:1.75em;line-height:1.1">&rarr;</span></span>
                <span>Amino acids</span>
            </div>
        </figure>
    `,
    options: [
        "Enzyme 1 has been changed to enzyme 2.",
        "Enzyme 2 slows down the production of amino acids.",
        "Enzymes can build up large molecules.",
        "Enzymes only break down large molecules."
    ],
    correct: "C",
    answer: "C. Enzymes can build up large molecules",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The diagram shows that enzymes can catalyse <strong>both the building up and the breaking down of molecules</strong>.</p>

        <h3>Step 1: Understand enzyme 1</h3>
        <div class="translocation-flow" role="img" aria-label="Enzyme 1 catalyses the joining of small amino acid molecules to form larger protein molecules: an anabolic synthesis reaction.">
            <div class="flow-step"><strong>Amino acids</strong><span>Small building-block molecules</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Catalysed by enzyme 1</strong><span>Joins amino acids during synthesis</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Proteins</strong><span>Larger molecules are built up</span></div>
        </div>
        <ul class="option-explanations">
            <li>Enzyme 1 catalyses the joining of <strong>amino acids to form proteins</strong>.</li>
            <li>Small molecules combine to form larger molecules.</li>
            <li>This is an <strong>anabolic reaction</strong>, involving synthesis.</li>
        </ul>

        <h3>Step 2: Understand enzyme 2</h3>
        <div class="translocation-flow" role="img" aria-label="Enzyme 2 catalyses protein breakdown into amino acids: a catabolic hydrolysis reaction.">
            <div class="flow-step"><strong>Proteins</strong><span>Large molecules</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Catalysed by enzyme 2</strong><span>Speeds up protein breakdown</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Amino acids</strong><span>Smaller molecules are released</span></div>
        </div>
        <ul class="option-explanations">
            <li>Enzyme 2 catalyses the breakdown of <strong>proteins into amino acids</strong>.</li>
            <li>Large molecules are broken down into smaller molecules.</li>
            <li>This is a <strong>catabolic reaction</strong>, involving hydrolysis. Water is used to break bonds.</li>
        </ul>
        <figure class="explanation-photo">
            <a href="https://upload.wikimedia.org/wikipedia/commons/b/bb/Anabolism_and_Catabolism.png" target="_blank" rel="noreferrer" aria-label="Open the anabolism and catabolism diagram at full size in a new tab">
                <img src="images/question-32-metabolism.png" width="1416" height="672" style="width:100%;max-width:100%;background:var(--white)" alt="Catabolism breaks larger molecules into smaller monomers; anabolism builds larger macromolecules from monomers" loading="lazy" decoding="async">
            </a>
            <figcaption>General comparison of breakdown and synthesis. <a href="https://upload.wikimedia.org/wikipedia/commons/b/bb/Anabolism_and_Catabolism.png" target="_blank" rel="noreferrer">Open the full-size diagram</a>. Image: Christinelmiller, via <a href="https://commons.wikimedia.org/wiki/File:Anabolism_and_Catabolism.png" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Image unchanged.</figcaption>
        </figure>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Evaluate the deductions about enzymes</caption>
            <colgroup><col style="width:30%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Enzyme 1 changes into enzyme 2</th><td>Incorrect — enzymes are not converted into one another during these reactions.</td></tr>
                <tr><th scope="row">B. Enzyme 2 slows amino acid production</th><td>Incorrect — enzyme 2 catalyses protein breakdown, increasing the reaction rate.</td></tr>
                <tr><th scope="row">C. Enzymes can build up large molecules</th><td><strong>Correct — enzyme 1 catalyses protein synthesis.</strong></td></tr>
                <tr><th scope="row">D. Enzymes only break down large molecules</th><td>Incorrect — enzymes can catalyse both synthesis and breakdown reactions.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Anabolic and catabolic reactions</caption>
            <colgroup><col style="width:26%"><col style="width:37%"><col style="width:37%"></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Anabolic</th><th scope="col">Catabolic</th></tr></thead>
            <tbody>
                <tr><th scope="row">Main function</th><td>Builds larger molecules</td><td>Breaks down larger molecules</td></tr>
                <tr><th scope="row">Example</th><td>Amino acids &rarr; proteins</td><td>Proteins &rarr; amino acids</td></tr>
                <tr><th scope="row">Type of reaction</th><td>Synthesis</td><td>Breakdown</td></tr>
                <tr><th scope="row">Energy</th><td>Generally requires energy</td><td>Often releases energy in metabolic pathways</td></tr>
            </tbody>
        </table>
        <p>Energy changes cannot be deduced from these arrows alone. Enzymes lower activation energy; they do not supply energy for synthesis.</p>
        <p class="exam-tip"><strong>Key principle:</strong> Enzymes are biological catalysts that speed up chemical reactions without being used up. They can catalyse reactions that build up or break down molecules.</p>
        <p class="relationship">Final answer: C — Enzymes can build up large molecules.</p>
    `
}
,
{
    title: "What happens to the volumes of water and sugar solution after 12 hours?",
    paperCode: "0610/22/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the predicted changes in the cavity water and external sugar solution",
    context: `
        <p>The diagram shows an experiment to investigate osmosis in living cells.</p>
        <figure class="plant-diagram">
            <svg viewBox="0 0 760 330" role="img" aria-labelledby="potato-osmosis-question-title potato-osmosis-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="potato-osmosis-question-title">Living potato cup containing water in a concentrated sugar solution</title>
                <desc id="potato-osmosis-question-desc">Water fills a cavity cut into the top of a living potato. The potato's base stands in concentrated sugar solution in a glass dish. The liquids are separated by potato tissue.</desc>
                <path d="M220 245 H610 V292 H220Z" fill="#dceaf0"/>
                <path d="M315 80 H385 V137 Q385 178 425 178 Q465 178 465 137 V80 H535 C555 135 555 207 535 242 Q515 262 515 292 H335 Q335 262 315 242 C295 207 295 135 315 80Z" fill="#e6e5cf" stroke="#526c62" stroke-width="3"/>
                <path d="M385 118 Q425 125 465 118 V137 Q465 178 425 178 Q385 178 385 137Z" fill="#b6dcec" stroke="#4389ad" stroke-width="2"/>
                <path d="M220 200 V292 H610 V200" fill="none" stroke="#526c62" stroke-width="3"/>
                <g fill="none" stroke="#61766c" stroke-width="1.7">
                    <path d="M203 66 L419 145"/>
                    <path d="M614 94 L510 155"/>
                    <path d="M190 179 L220 214"/>
                    <path d="M611 246 L566 265"/>
                </g>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="22">
                    <text x="132" y="66">Water</text>
                    <text x="620" y="94">Potato</text>
                    <text x="66" y="179">Glass dish</text>
                    <text x="614" y="224">Concentrated</text>
                    <text x="614" y="250">sugar solution</text>
                </g>
            </svg>
            <figcaption>Water fills the cavity of a living potato. The base stands in concentrated sugar solution in a glass dish.</figcaption>
        </figure>
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Predict the volume changes after 12 hours</caption>
            <colgroup><col style="width:58px"><col><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Volume of water in the cavity</th><th scope="col">Volume of sugar solution outside</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td>Decreases</td><td>Increases</td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td>Increases</td><td>Increases</td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td>Increases</td><td>Remains the same</td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td>Remains the same</td><td>Decreases</td></tr>
            </tbody>
        </table>
    `,
    options: [
        "Water decreases; sugar solution increases",
        "Water increases; sugar solution increases",
        "Water increases; sugar solution remains the same",
        "Water remains the same; sugar solution decreases"
    ],
    hideAnswerOptions: true,
    correct: "A",
    answer: "A. Volume of water decreases; volume of sugar solution increases",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The experiment demonstrates <strong>osmosis through living potato cells</strong>.</p>

        <h3>Step 1: Identify the water potential differences</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare the liquids on either side of the potato tissue</caption>
            <thead><tr><th scope="col">Location</th><th scope="col">Solute concentration</th><th scope="col">Water potential</th></tr></thead>
            <tbody>
                <tr><th scope="row">Water inside potato cavity</th><td>Low</td><td>Higher</td></tr>
                <tr><th scope="row">Concentrated sugar solution outside</th><td>High</td><td>Lower</td></tr>
            </tbody>
        </table>
        <p>Water moves from a region of <strong>higher water potential to lower water potential</strong> through partially permeable cell membranes.</p>

        <h3>Step 2: Predict the movement of water</h3>
        <div class="translocation-flow" role="img" aria-label="Net water movement is from the water in the potato cavity, at higher water potential, through the partially permeable membranes of living potato cells, to the concentrated sugar solution outside, at lower water potential.">
            <div class="flow-step"><strong>Water inside the cavity</strong><span>Higher water potential</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Osmosis through potato tissue</strong><span>Water crosses partially permeable cell membranes</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Concentrated sugar solution</strong><span>Lower water potential</span></div>
        </div>
        <p>Net movement of water is <strong>out of the cavity, through the living potato tissue, and into the concentrated sugar solution</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="33">
            <a href="images/online-osmosis.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-osmosis.png" width="500" height="682" alt="Osmosis apparatus with a semipermeable membrane separating more concentrated and less concentrated solutions, and different liquid heights" loading="lazy" decoding="async">
            </a>
            <figcaption>General osmosis apparatus: water moves through a partially permeable membrane toward the more concentrated solution. This illustrates the principle, rather than the exact potato or cell setup. <span class="image-credit">Image: Yassine Mrabet, via <a href="https://commons.wikimedia.org/wiki/File:Osmosis.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>

        <h3>Step 3: Predict the volume changes after 12 hours</h3>
        <ul class="option-explanations">
            <li><strong>Water inside the cavity decreases:</strong> Water moves out by osmosis.</li>
            <li><strong>Sugar solution outside increases in volume:</strong> It gains water.</li>
        </ul>

        <h3>Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Only option A matches the net movement of water</caption>
            <colgroup><col style="width:17%"><col style="width:28%"><col style="width:31%"><col style="width:24%"></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Volume of water</th><th scope="col">Volume of sugar solution</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Decreases</td><td>Increases</td><td><strong>Correct</strong></td></tr>
                <tr><th scope="row">B</th><td>Increases</td><td>Increases</td><td>Incorrect</td></tr>
                <tr><th scope="row">C</th><td>Increases</td><td>Remains the same</td><td>Incorrect</td></tr>
                <tr><th scope="row">D</th><td>Remains the same</td><td>Decreases</td><td>Incorrect</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <p class="definition"><strong>Osmosis:</strong> The net movement of water molecules from a region of higher water potential to a region of lower water potential, through a partially permeable membrane.</p>
        <p>Water movement is determined by <strong>water potential</strong>, not simply by the amount of water present.</p>
        <p class="relationship">Higher water potential &rarr; lower water potential</p>
        <p class="exam-tip"><strong>Apply the definition:</strong> The living potato cells provide partially permeable membranes. The concentrated sugar solution has lower water potential, so it gains water from the cavity.</p>
        <p class="relationship">Final answer: A — Water decreases; sugar solution increases.</p>
    `
}
,
{
    title: "Which process in the cell causes the bacteria to form these groups?",
    paperCode: "0610/22/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the process that causes oxygen-seeking bacteria to gather around the cell",
    context: `
        <p>The diagram shows a cell with groups of bacteria around its edge.</p>
        <figure class="plant-diagram">
            <svg viewBox="0 0 760 400" role="img" aria-labelledby="spiral-cell-question-title spiral-cell-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="spiral-cell-question-title">Cell with a spiral-shaped chloroplast and groups of bacteria</title>
                <desc id="spiral-cell-question-desc">An elongated cell contains a spiral-shaped chloroplast surrounded by cell cytoplasm. Groups of bacteria lie around the outside edge of the cell.</desc>
                <defs>
                    <g id="q34-bacteria-dots" fill="#193b34">
                        <circle cx="0" cy="0" r="2.6"/><circle cx="7" cy="-5" r="2.6"/><circle cx="8" cy="4" r="2.6"/>
                        <circle cx="-6" cy="6" r="2.6"/><circle cx="0" cy="11" r="2.6"/><circle cx="-5" cy="-6" r="2.6"/>
                        <circle cx="6" cy="13" r="2.6"/><circle cx="-1" cy="-12" r="2.6"/>
                    </g>
                </defs>
                <rect x="320" y="35" width="160" height="322" rx="36" fill="#fffefa" stroke="#526c62" stroke-width="3"/>
                <rect x="330" y="45" width="140" height="302" rx="28" fill="#f0f5ec" stroke="#61766c" stroke-width="1.6"/>
                <path d="M342 68 C342 86 458 94 458 113 C458 131 342 137 342 156 C342 174 458 181 458 200 C458 218 342 224 342 243 C342 261 458 268 458 287 C458 305 342 311 342 330" fill="none" stroke="#568347" stroke-width="12" stroke-linecap="round"/>
                <g>
                    <use href="#q34-bacteria-dots" x="306" y="80"/><use href="#q34-bacteria-dots" x="494" y="115"/>
                    <use href="#q34-bacteria-dots" x="306" y="180"/><use href="#q34-bacteria-dots" x="494" y="230"/>
                    <use href="#q34-bacteria-dots" x="306" y="290"/><use href="#q34-bacteria-dots" x="494" y="340"/>
                </g>
                <g fill="none" stroke="#61766c" stroke-width="1.7">
                    <path d="M560 88 L450 75"/>
                    <path d="M249 190 L395 181"/>
                    <path d="M560 322 L505 336 M560 322 L497 345"/>
                </g>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="22">
                    <text x="570" y="85">Cell cytoplasm</text>
                    <text x="35" y="181">Spiral-shaped</text><text x="35" y="208">chloroplast</text>
                    <text x="570" y="327">Bacteria</text>
                </g>
            </svg>
            <figcaption>The cell contains a spiral-shaped chloroplast; bacteria are grouped around its edge.</figcaption>
        </figure>
        <p>The bacteria have moved to areas of <strong>high oxygen concentration</strong>.</p>
    `,
    options: ["Digestion", "Photosynthesis", "Reproduction", "Respiration"],
    correct: "B",
    answer: "B. Photosynthesis",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The bacteria gather where the oxygen concentration is highest. <strong>Photosynthesis produces the oxygen</strong> that explains their distribution around the cell.</p>

        <h3>Step 1: Identify the structure</h3>
        <p>A <strong>spiral-shaped chloroplast</strong> is typical of <i>Spirogyra</i>, a filamentous green alga. Chloroplasts contain <strong>chlorophyll</strong>, which absorbs light energy for photosynthesis.</p>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:The_freshwater_alga_Spirogyra.jpg" target="_blank" rel="noreferrer" aria-label="Open the Spirogyra microscopy photograph and its source details in a new tab">
                <img src="images/question-34-spirogyra.jpg" width="960" height="638" alt="Microscope photograph of Spirogyra filaments with green chloroplasts coiled spirally inside their cells" loading="lazy" decoding="async">
            </a>
            <figcaption>The spiral chloroplasts are visible inside these <i>Spirogyra</i> cells. Photo: Wiedehopf20, via <a href="https://commons.wikimedia.org/wiki/File:The_freshwater_alga_Spirogyra.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Unmodified resized preview.</figcaption>
        </figure>

        <h3>Step 2: Explain why bacteria gather around the cell</h3>
        <ol class="statement-list">
            <li>Chlorophyll in the chloroplast absorbs <strong>light energy</strong>.</li>
            <li>Photosynthesis occurs, using <strong>carbon dioxide and water</strong>.</li>
            <li><strong>Oxygen is produced</strong> during photosynthesis.</li>
            <li>Oxygen diffuses out of the cell into the surrounding water.</li>
            <li>The bacteria move towards regions with <strong>higher oxygen concentrations</strong> and gather there.</li>
        </ol>
        <div class="translocation-flow" role="img" aria-label="Photosynthesis in the chloroplast releases oxygen. Oxygen diffuses into the surrounding water. Bacteria gather where oxygen concentration is high.">
            <div class="flow-step"><strong>Photosynthesis</strong><span>Oxygen is released in the chloroplast</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Oxygen diffuses out</strong><span>Oxygen enters the surrounding water</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Bacteria gather</strong><span>They move towards higher oxygen concentrations</span></div>
        </div>

        <h3>Step 3: Photosynthesis equation</h3>
        <p>Light energy absorbed by chlorophyll drives this reaction:</p>
        <p class="relationship" role="img" aria-label="Six carbon dioxide molecules plus six water molecules produce one glucose molecule and six oxygen molecules, using light energy absorbed by chlorophyll." style="line-height:1.8">6CO<sub>2</sub> + 6H<sub>2</sub>O &rarr; C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub></p>
        <p><strong>Reactants:</strong> Carbon dioxide and water.<br><strong>Products:</strong> Glucose and oxygen.</p>
        <p>The <strong>oxygen produced</strong> explains why the bacteria form groups around the cell.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Which process explains oxygen production?</caption>
            <colgroup><col style="width:30%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Digestion</th><td>Breaks down food molecules; does not explain oxygen production.</td></tr>
                <tr><th scope="row">B. Photosynthesis</th><td><strong>Correct — produces oxygen, attracting the bacteria.</strong></td></tr>
                <tr><th scope="row">C. Reproduction</th><td>Produces new organisms, not the oxygen attracting bacteria.</td></tr>
                <tr><th scope="row">D. Respiration</th><td>Aerobic respiration uses oxygen rather than producing it.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Photosynthesis and aerobic respiration</caption>
            <colgroup><col style="width:26%"><col style="width:37%"><col style="width:37%"></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Photosynthesis</th><th scope="col">Aerobic respiration</th></tr></thead>
            <tbody>
                <tr><th scope="row">Oxygen</th><td>Produced</td><td>Used</td></tr>
                <tr><th scope="row">Carbon dioxide</th><td>Used</td><td>Produced</td></tr>
                <tr><th scope="row">Main energy change</th><td>Light energy converted to chemical energy</td><td>Energy released from glucose</td></tr>
                <tr><th scope="row">Main site</th><td>Chloroplasts</td><td>Mainly mitochondria in eukaryotic cells</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key exam principle:</strong> A high oxygen concentration around an illuminated chloroplast provides evidence that photosynthesis is occurring.</p>
        <p class="relationship">Final answer: B — Photosynthesis.</p>
    `
}
,
{
    title: "What limits the rate of photosynthesis at point P?",
    paperCode: "0610/22/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the factors limiting the rate of photosynthesis at point P",
    context: `
        <p>The diagram shows how the rate of photosynthesis varies with light intensity. The four curves show different conditions of temperature and carbon dioxide concentration.</p>
        <figure class="plant-diagram" style="max-width:900px">
            <svg viewBox="0 0 900 460" role="img" aria-labelledby="limiting-factors-question-title limiting-factors-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="limiting-factors-question-title">Light intensity and photosynthesis under four conditions</title>
                <desc id="limiting-factors-question-desc">All four curves rise and then reach plateaus. From highest to lowest plateau, the conditions are 30 degrees Celsius and 0.2 percent carbon dioxide; 20 degrees Celsius and 0.2 percent; 30 degrees Celsius and 0.1 percent; and 20 degrees Celsius and 0.1 percent. Point P lies on the lowest plateau at high light intensity. The axes have no numerical scale.</desc>
                <defs><marker id="q35-axis-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L0 6 L6 3Z" fill="#193b34"/></marker></defs>
                <g fill="none" stroke="#193b34" stroke-width="2" marker-end="url(#q35-axis-arrow)">
                    <path d="M90 390 H630"/><path d="M90 390 V35"/>
                </g>
                <g fill="none" stroke="#1e654f" stroke-width="3.5" stroke-linecap="round">
                    <path d="M90 390 L205 263 C285 175 310 80 450 80 H610"/>
                    <path d="M90 390 L205 263 C250 215 300 190 390 190 H610"/>
                    <path d="M90 390 L175 293 C240 260 290 250 390 250 H610"/>
                    <path d="M90 390 C160 330 230 320 390 320 H610"/>
                </g>
                <circle cx="480" cy="320" r="5" fill="#193b34"/>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="23">
                    <text x="625" y="87">30°C, 0.2% CO<tspan baseline-shift="sub" font-size="16">2</tspan></text>
                    <text x="625" y="197">20°C, 0.2% CO<tspan baseline-shift="sub" font-size="16">2</tspan></text>
                    <text x="625" y="257">30°C, 0.1% CO<tspan baseline-shift="sub" font-size="16">2</tspan></text>
                    <text x="625" y="327">20°C, 0.1% CO<tspan baseline-shift="sub" font-size="16">2</tspan></text>
                    <text x="471" y="303" font-weight="800">P</text>
                    <text x="360" y="437" text-anchor="middle">Light intensity</text>
                    <text x="28" y="215" text-anchor="middle" transform="rotate(-90 28 215)">Rate of photosynthesis</text>
                </g>
            </svg>
            <figcaption>Plateaus from highest to lowest: 30°C, 0.2% CO<sub>2</sub>; 20°C, 0.2% CO<sub>2</sub>; 30°C, 0.1% CO<sub>2</sub>; 20°C, 0.1% CO<sub>2</sub>. P lies on the lowest curve.</figcaption>
        </figure>
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Which factors limit the rate at P?</caption>
            <colgroup><col style="width:58px"><col><col><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Light intensity</th><th scope="col">Carbon dioxide concentration</th><th scope="col">Temperature</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A" aria-pressed="false">A</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B" aria-pressed="false">B</button></th><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C" aria-pressed="false">C</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D" aria-pressed="false">D</button></th><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✗</span><span class="visually-hidden">No</span></td><td><span aria-hidden="true">✓</span><span class="visually-hidden">Yes</span></td></tr>
            </tbody>
        </table>
        <p class="table-key"><strong>Key:</strong> ✓ = yes; ✗ = no.</p>
    `,
    options: [
        "Light intensity and carbon dioxide concentration",
        "Light intensity only",
        "Carbon dioxide concentration and temperature",
        "Temperature only"
    ],
    hideAnswerOptions: true,
    correct: "C",
    answer: "C. Carbon dioxide concentration and temperature are limiting factors",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The graph shows how <strong>light intensity, carbon dioxide concentration and temperature</strong> affect the rate of photosynthesis.</p>

        <h3>Step 1: Identify the conditions at P</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Conditions on the lowest curve at point P</caption>
            <thead><tr><th scope="col">Factor</th><th scope="col">Condition at P</th></tr></thead>
            <tbody>
                <tr><th scope="row">Temperature</th><td>20°C</td></tr>
                <tr><th scope="row">Carbon dioxide concentration</th><td>0.1%</td></tr>
                <tr><th scope="row">Light intensity</th><td>High; the curve has reached a plateau</td></tr>
            </tbody>
        </table>
        <p>At the plateau, increasing light intensity alone <strong>no longer increases the rate of photosynthesis</strong>. Therefore, light intensity is <strong>not limiting at P</strong>.</p>

        <h3>Step 2: Determine the limiting factors</h3>
        <p>Compare the curves at the <strong>same high light intensity as P</strong>, changing one other condition at a time.</p>
        <p><strong>Carbon dioxide concentration</strong></p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Hold temperature constant at 20°C</caption>
            <thead><tr><th scope="col">Conditions</th><th scope="col">Rate at the same light intensity</th></tr></thead>
            <tbody>
                <tr><th scope="row">20°C, 0.1% CO<sub>2</sub></th><td>Lower rate at P</td></tr>
                <tr><th scope="row">20°C, 0.2% CO<sub>2</sub></th><td>Higher rate</td></tr>
            </tbody>
        </table>
        <p>Increasing CO<sub>2</sub> concentration increases the rate while temperature stays constant. Therefore, <strong>CO<sub>2</sub> concentration is limiting</strong>.</p>

        <p><strong>Temperature</strong></p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Hold carbon dioxide concentration constant at 0.1%</caption>
            <thead><tr><th scope="col">Conditions</th><th scope="col">Rate at the same light intensity</th></tr></thead>
            <tbody>
                <tr><th scope="row">20°C, 0.1% CO<sub>2</sub></th><td>Lower rate at P</td></tr>
                <tr><th scope="row">30°C, 0.1% CO<sub>2</sub></th><td>Higher rate</td></tr>
            </tbody>
        </table>
        <p>Increasing temperature increases the rate while CO<sub>2</sub> concentration stays constant. Therefore, <strong>temperature also limits the rate under the conditions at P</strong>.</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>The correct combination is no, yes, yes</caption>
            <colgroup><col style="width:14%"><col style="width:21%"><col style="width:23%"><col style="width:22%"><col style="width:20%"></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Light intensity</th><th scope="col">CO<sub>2</sub> concentration</th><th scope="col">Temperature</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Yes</td><td>Yes</td><td>No</td><td>Incorrect</td></tr>
                <tr><th scope="row">B</th><td>Yes</td><td>No</td><td>No</td><td>Incorrect</td></tr>
                <tr><th scope="row">C</th><td><strong>No</strong></td><td><strong>Yes</strong></td><td><strong>Yes</strong></td><td><strong>Correct</strong></td></tr>
                <tr><th scope="row">D</th><td>No</td><td>No</td><td>Yes</td><td>Incorrect</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Rising light-response curve:</strong> Increasing light intensity increases the rate, so light is limiting.</li>
            <li><strong>Plateau:</strong> Increasing light intensity alone no longer increases the rate.</li>
            <li><strong>Higher plateau after increasing CO<sub>2</sub>:</strong> CO<sub>2</sub> concentration was limiting.</li>
            <li><strong>Higher plateau after increasing temperature:</strong> Temperature was limiting under those conditions.</li>
        </ul>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Carbon_assimilation_vs_irradiance.png" target="_blank" rel="noreferrer" aria-label="Open the general light-response illustration and source details in a new tab">
                <img src="images/question-35-light-response.png" width="500" height="425" style="max-width:500px;background:var(--white)" alt="General graph of carbon assimilation at constant temperature, with a curved response levelling off at high light intensity" loading="lazy" decoding="async">
            </a>
            <figcaption>General light-response illustration: the curved carbon-assimilation response levels off at high light intensity. The comparisons at P use the four conditions in the question. Image: Obsidian Soul, via <a href="https://commons.wikimedia.org/wiki/File:Carbon_assimilation_vs_irradiance.png" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>. Image unchanged.</figcaption>
        </figure>
        <p class="exam-tip"><strong>Key exam principle:</strong> A limiting factor restricts the rate of a process. Increasing it can increase the rate, provided another factor does not become limiting.</p>
        <p class="relationship">Final answer: C — Light intensity ✗, CO<sub>2</sub> concentration ✓, temperature ✓.</p>
    `
}
,
{
    title: "Which two factors must be kept constant during this investigation?",
    paperCode: "0610/13/M/J/13",
    paperSession: "May/June 2013",
    legend: "Choose the two controlled variables for measuring oxygen production during photosynthesis",
    context: `
        <p>The diagram shows the apparatus used in an investigation to measure the rate of oxygen production during photosynthesis.</p>
        <figure class="plant-diagram" style="max-width:800px">
            <svg viewBox="0 0 800 560" role="img" aria-labelledby="oxygen-apparatus-question-title oxygen-apparatus-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="oxygen-apparatus-question-title">Collecting gas from an aquatic plant in bright light</title>
                <desc id="oxygen-apparatus-question-desc">An aquatic plant is submerged in water under an inverted glass funnel in a beaker. The funnel stem leads into an inverted, water-filled measuring cylinder. Bubbles rise and gas collects at the top of the cylinder. Bright light shines on the plant.</desc>
                <defs><marker id="q36-light-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L0 6 L6 3Z" fill="#a17727"/></marker></defs>
                <path d="M240 240 H560 V482 Q560 500 542 500 H258 Q240 500 240 482Z" fill="#dceef5"/>
                <path d="M240 180 V482 Q240 500 258 500 H542 Q560 500 560 482 V180" fill="none" stroke="#526c62" stroke-width="3"/>
                <path d="M240 240 H368 M428 240 H560" fill="none" stroke="#4389ad" stroke-width="2"/>
                <path d="M290 480 L385 330 V272 H415 V330 L510 480Z" fill="#fffefa" fill-opacity=".55" stroke="#526c62" stroke-width="3"/>
                <path d="M368 360 V76 Q368 64 380 64 H416 Q428 64 428 76 V360" fill="#eef7fb" fill-opacity=".65" stroke="#526c62" stroke-width="3"/>
                <path d="M371 135 V76 Q371 67 380 67 H416 Q425 67 425 76 V135Z" fill="#fffefa"/>
                <path d="M369 135 Q398 141 427 135" fill="none" stroke="#4389ad" stroke-width="2"/>
                <g stroke="#61766c" stroke-width="1.5">
                    <path d="M368 88 H383 M368 110 H378 M368 132 H383 M368 154 H378 M368 176 H383 M368 198 H378 M368 220 H383 M368 242 H378 M368 264 H383 M368 286 H378 M368 308 H383 M368 330 H378"/>
                </g>
                <g fill="#fffefa" stroke="#4389ad" stroke-width="2">
                    <circle cx="398" cy="157" r="5"/><circle cx="390" cy="190" r="4"/><circle cx="406" cy="221" r="5"/>
                    <circle cx="397" cy="254" r="5"/><circle cx="392" cy="289" r="4"/><circle cx="404" cy="323" r="5"/>
                    <circle cx="398" cy="355" r="4"/><circle cx="404" cy="380" r="4"/>
                </g>
                <g stroke="#1e654f" stroke-width="3" fill="none" stroke-linecap="round">
                    <path d="M400 481 V397 M334 477 C361 466 381 447 400 416 M450 479 C431 466 415 442 400 421"/>
                </g>
                <g fill="#96bc7b" stroke="#1e654f" stroke-width="1.5">
                    <ellipse cx="390" cy="414" rx="5" ry="14" transform="rotate(-35 390 414)"/><ellipse cx="410" cy="427" rx="5" ry="14" transform="rotate(35 410 427)"/>
                    <ellipse cx="390" cy="443" rx="5" ry="14" transform="rotate(-35 390 443)"/><ellipse cx="410" cy="457" rx="5" ry="14" transform="rotate(35 410 457)"/>
                    <ellipse cx="366" cy="449" rx="5" ry="14" transform="rotate(-45 366 449)"/><ellipse cx="351" cy="465" rx="5" ry="14" transform="rotate(-45 351 465)"/>
                    <ellipse cx="427" cy="452" rx="5" ry="14" transform="rotate(40 427 452)"/><ellipse cx="440" cy="468" rx="5" ry="14" transform="rotate(40 440 468)"/>
                </g>
                <g fill="#e7e8df" stroke="#526c62" stroke-width="2"><rect x="283" y="480" width="30" height="20"/><rect x="487" y="480" width="30" height="20"/></g>
                <g fill="none" stroke="#a17727" stroke-width="3" marker-end="url(#q36-light-arrow)">
                    <path d="M120 255 L207 330 M110 290 L198 365 M100 325 L186 400"/>
                </g>
                <g fill="none" stroke="#61766c" stroke-width="1.7">
                    <path d="M229 90 L397 110 M571 89 L428 104 M580 247 L560 270 M580 350 L480 420 M580 451 L418 451 M173 465 L260 435"/>
                </g>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="22">
                    <text x="178" y="90">Gas</text>
                    <text x="580" y="78">Measuring</text><text x="580" y="104">cylinder</text>
                    <text x="590" y="247">Beaker</text>
                    <text x="590" y="350">Glass funnel</text>
                    <text x="590" y="451">Aquatic plant</text>
                    <text x="95" y="470">Water</text>
                    <text x="55" y="221">Bright</text><text x="55" y="247">light</text>
                </g>
            </svg>
            <figcaption>An aquatic plant receives bright light under a glass funnel in water. Gas collects in an inverted measuring cylinder.</figcaption>
        </figure>
        <p>The investigation was repeated several times and the <strong>average amount of gas collected</strong> was calculated.</p>
    `,
    options: [
        "The amount of water in the beaker and the height of the measuring cylinder",
        "The size of the aquatic plant and the amount of gas in the measuring cylinder",
        "The size of the aquatic plant and the duration of exposure to light",
        "The size of the beaker and the funnel"
    ],
    correct: "C",
    answer: "C. The size of the aquatic plant and the duration of exposure to light",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The experiment measures the rate of photosynthesis by collecting the <strong>oxygen produced by an aquatic plant</strong>. Important variables must stay constant to make comparisons fair.</p>

        <h3>Step 1: Identify the controlled variables</h3>
        <p><strong>1. Size of the aquatic plant</strong></p>
        <ul class="option-explanations">
            <li>Larger plants generally have more photosynthesising tissue.</li>
            <li>They may contain more chloroplasts and produce more oxygen.</li>
            <li>Keeping plant size constant ensures a fair comparison.</li>
        </ul>
        <p><strong>2. Duration of exposure to light</strong></p>
        <ul class="option-explanations">
            <li>The longer photosynthesis occurs, the more oxygen can be collected.</li>
            <li>Each trial must use the same exposure and collection time, for example <strong>5 minutes</strong>.</li>
            <li>Equal collection times allow the oxygen volumes to be compared fairly.</li>
        </ul>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Photosynthesis_in_action.jpg" target="_blank" rel="noreferrer" aria-label="Open the photograph of oxygen bubbles from submerged vegetation and its source details in a new tab">
                <img src="images/question-36-oxygen-bubbles.jpg" width="960" height="720" alt="Trails of small oxygen bubbles rising from submerged vegetation during photosynthesis" loading="lazy" decoding="async">
            </a>
            <figcaption>Oxygen bubbles rising from submerged vegetation during photosynthesis. The apparatus in the question collects gas so its volume can be measured. Photo: Rcaravit, via <a href="https://commons.wikimedia.org/wiki/File:Photosynthesis_in_action.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Unmodified resized preview.</figcaption>
        </figure>

        <h3>Step 2: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Which pair contains the key controlled variables?</caption>
            <colgroup><col style="width:18%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — water volume and measuring-cylinder height are not the best pair listed. A consistent apparatus setup is still good practice.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — plant size should be controlled, but the <strong>amount of gas collected is the dependent variable</strong>, which is measured rather than kept constant.</td></tr>
                <tr><th scope="row">C</th><td><strong>Correct — plant size and exposure time must remain constant.</strong></td></tr>
                <tr><th scope="row">D</th><td>Incorrect — beaker and funnel size are not the key pair controlling the amount of oxygen produced. Keep the collection apparatus consistent between trials.</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Understand the experimental variables</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Changing, measuring and controlling variables</caption>
            <colgroup><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Variable type</th><th scope="col">Example</th></tr></thead>
            <tbody>
                <tr><th scope="row">Independent variable</th><td>The factor deliberately changed, such as light intensity <strong>if its effect is being investigated</strong>.</td></tr>
                <tr><th scope="row">Dependent variable</th><td>Volume of oxygen collected during a fixed time; this can be used to calculate the rate.</td></tr>
                <tr><th scope="row">Controlled variables</th><td>Plant size, duration of measurement, temperature and CO<sub>2</sub> availability.</td></tr>
            </tbody>
        </table>
        <p>The rate of oxygen production can be calculated using:</p>
        <p class="relationship">Rate of oxygen production = volume of oxygen collected ÷ time taken</p>
        <p>For example, dividing a volume measured in cm<sup>3</sup> by a time measured in minutes gives a rate in <strong>cm<sup>3</sup>/min</strong>.</p>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Independent:</strong> What you deliberately change.</li>
            <li><strong>Dependent:</strong> What you measure.</li>
            <li><strong>Controlled:</strong> What you keep constant.</li>
        </ul>
        <p class="exam-tip"><strong>Reliability and a fair test:</strong> Repeating the experiment and calculating a mean reduces the effect of random variation and improves reliability. Keeping controlled variables constant ensures a fair comparison.</p>
        <p class="relationship">Final answer: C — Size of the aquatic plant and duration of exposure to light.</p>
    `
}
,
{
    title: "Which type of cell does the diagram show?",
    paperCode: "0610/11/M/J/14",
    paperSession: "May/June 2014",
    legend: "Choose the cell type and the surrounding solution",
    context: `
        <p>The diagram shows a cell.</p>
        <figure class="plant-diagram" style="max-width:320px">
            <svg viewBox="0 0 360 420" role="img" aria-labelledby="contracted-cell-question-title contracted-cell-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="contracted-cell-question-title">Cell diagram</title>
                <desc id="contracted-cell-question-desc">An elongated cell has a thick outer boundary. The inner boundary surrounds contracted cell contents and has pulled inward from the outer boundary at several points. An oval nucleus is visible within the contracted contents.</desc>
                <defs>
                    <pattern id="q37-cytoplasm-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#61766c"/><circle cx="9" cy="9" r="1" fill="#61766c"/></pattern>
                    <path id="q37-cell-contents" d="M145 60 C167 110 151 155 113 184 C143 202 156 225 142 260 C130 293 131 322 147 350 C174 309 194 310 220 348 C202 304 203 258 216 230 C227 204 240 174 246 152 C207 133 173 100 167 60Z"/>
                </defs>
                <rect x="100" y="35" width="160" height="340" rx="40" fill="#fffefa" stroke="#526c62" stroke-width="6"/>
                <rect x="110" y="45" width="140" height="320" rx="31" fill="none" stroke="#61766c" stroke-width="1.5"/>
                <use href="#q37-cell-contents" fill="#e3eddc"/>
                <use href="#q37-cell-contents" fill="url(#q37-cytoplasm-dots)" stroke="#526c62" stroke-width="2.5"/>
                <ellipse cx="185" cy="213" rx="13" ry="20" fill="#193b34"/>
            </svg>
            <figcaption>A thick outer boundary surrounds contracted cell contents.</figcaption>
        </figure>
    `,
    options: [
        "An animal cell in a concentrated solution of salts",
        "An animal cell in pure water",
        "A plant cell in a concentrated solution of salts",
        "A plant cell in pure water"
    ],
    correct: "C",
    answer: "C. A plant cell in a concentrated solution of salts",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">The diagram shows a <strong>plasmolysed plant cell</strong>. Plasmolysis occurs when a plant cell loses water by osmosis in a concentrated solution, causing the cell membrane to pull away from the cell wall.</p>

        <h3>Step 1: Identify the type of cell</h3>
        <p>The diagram shows:</p>
        <ul class="option-explanations">
            <li>A <strong>thick, rigid cell wall</strong>.</li>
            <li>A cell membrane and cytoplasm that have <strong>pulled away from the cell wall</strong>.</li>
            <li>A nucleus within the shrunken cell contents.</li>
        </ul>
        <p>Therefore, it is a <strong>plant cell</strong>.</p>

        <h3>Step 2: Identify the surrounding solution</h3>
        <p>The membrane has pulled away from the cell wall, indicating that <strong>water has moved out of the cell</strong>.</p>
        <ol class="statement-list">
            <li>The concentrated salt solution has a <strong>lower water potential</strong> than the cell contents.</li>
            <li>Water moves out by <strong>osmosis</strong> through the partially permeable cell membrane.</li>
            <li>The vacuole and cytoplasm shrink.</li>
            <li>The cell membrane pulls away from the rigid cell wall.</li>
        </ol>
        <p>This process is called <strong>plasmolysis</strong>.</p>
        <div class="translocation-flow" role="img" aria-label="A concentrated salt solution has lower water potential than the cell contents. Water leaves the plant cell by osmosis. The vacuole and cytoplasm shrink, and the membrane pulls away from the wall: plasmolysis.">
            <div class="flow-step"><strong>Concentrated salt solution</strong><span>Lower water potential outside the cell</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Water leaves by osmosis</strong><span>The vacuole and cytoplasm shrink</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Plasmolysis</strong><span>The membrane pulls away from the cell wall</span></div>
        </div>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Plasmolysis_of_red_onion_(Allium_cepa)_cells.jpg" target="_blank" rel="noreferrer" aria-label="Open the microscope photograph of plasmolysed red-onion cells and its source details in a new tab">
                <img src="images/question-37-plasmolysis.jpg" width="500" height="501" style="max-width:500px;background:var(--white)" alt="Microscope image of plasmolysed red-onion cells with shrunken purple cell contents" loading="lazy" decoding="async">
            </a>
            <figcaption>Plasmolysis in red-onion cells: purple cell contents shrink after water is lost. Photo: Trương Minh Khải, via <a href="https://commons.wikimedia.org/wiki/File:Plasmolysis_of_red_onion_(Allium_cepa)_cells.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Unmodified resized preview.</figcaption>
        </figure>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Identify the cell and the solution</caption>
            <colgroup><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Animal cell in concentrated salt solution</th><td>Incorrect — the diagram shows a <strong>cell wall</strong>, which animal cells lack.</td></tr>
                <tr><th scope="row">B. Animal cell in pure water</th><td>Incorrect — animal cells lack cell walls and would swell in pure water; they may burst.</td></tr>
                <tr><th scope="row">C. Plant cell in concentrated salt solution</th><td><strong>Correct — water leaves the cell, causing plasmolysis.</strong></td></tr>
                <tr><th scope="row">D. Plant cell in pure water</th><td>Incorrect — water would enter the plant cell, making it <strong>turgid</strong>.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Turgid and plasmolysed plant cells</caption>
            <colgroup><col style="width:28%"><col style="width:36%"><col style="width:36%"></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Turgid plant cell</th><th scope="col">Plasmolysed plant cell</th></tr></thead>
            <tbody>
                <tr><th scope="row">Surrounding solution</th><td>Dilute solution / pure water</td><td>Concentrated solution</td></tr>
                <tr><th scope="row">Initial net water movement</th><td>Into the cell</td><td>Out of the cell</td></tr>
                <tr><th scope="row">Vacuole</th><td>Enlarged</td><td>Shrunken</td></tr>
                <tr><th scope="row">Cell membrane</th><td>Pressed against the cell wall</td><td>Pulled away from the cell wall</td></tr>
                <tr><th scope="row">Turgor pressure</th><td>High</td><td>Lost</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key exam keywords:</strong> Lower water potential outside &rarr; water leaves by osmosis &rarr; vacuole shrinks &rarr; membrane pulls away from the cell wall &rarr; plasmolysis.</p>
        <p class="relationship">Final answer: C — A plant cell in a concentrated solution of salts.</p>
    `
}
,
{
    title: "Which vessels carry oxygenated blood?",
    paperCode: "0610/01/O/N/08",
    paperSession: "Oct/Nov 2008",
    legend: "Choose the pair of vessels carrying oxygenated blood in the double circulatory system",
    context: `
        <p>The diagram shows a double circulatory system.</p>
        <figure class="circulation-diagram" style="max-width:1000px">
            <svg viewBox="0 0 1000 360" role="img" aria-labelledby="double-circulation-question-title double-circulation-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="double-circulation-question-title">Numbered vessels in a double circulatory system</title>
                <desc id="double-circulation-question-desc">The heart is in the centre, lung capillaries on the left and body capillaries on the right. Arrows show vessel 1 carrying blood from heart to lungs, vessel 2 from lungs to heart, vessel 3 from body to heart, and vessel 4 from heart to body.</desc>
                <defs><marker id="q38-flow-arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0 0 L0 5 L5 2.5Z" fill="#193b34"/></marker></defs>
                <g fill="none" stroke="#526c62" stroke-width="18" stroke-linejoin="round">
                    <path d="M270 110 V85 Q270 60 294 68 L433 150"/>
                    <path d="M433 210 L294 292 Q270 300 270 275 V250"/>
                    <path d="M567 150 L706 68 Q730 60 730 85 V110"/>
                    <path d="M567 210 L706 292 Q730 300 730 275 V250"/>
                </g>
                <g fill="none" stroke="#fffefa" stroke-width="12" stroke-linejoin="round">
                    <path d="M270 110 V85 Q270 60 294 68 L433 150"/>
                    <path d="M433 210 L294 292 Q270 300 270 275 V250"/>
                    <path d="M567 150 L706 68 Q730 60 730 85 V110"/>
                    <path d="M567 210 L706 292 Q730 300 730 275 V250"/>
                </g>
                <g fill="#fffefa" stroke="#526c62" stroke-width="2.5">
                    <rect x="210" y="110" width="120" height="140" rx="25"/>
                    <rect x="670" y="110" width="120" height="140" rx="25"/>
                    <circle cx="500" cy="180" r="70" stroke-dasharray="6 6"/>
                </g>
                <g fill="none" stroke="#193b34" stroke-width="2.5" marker-end="url(#q38-flow-arrow)">
                    <path data-vessel="1" d="M406 226 L317 279"/>
                    <path data-vessel="2" d="M316 81 L405 133"/>
                    <path data-vessel="3" d="M685 81 L596 133"/>
                    <path data-vessel="4" d="M595 227 L684 279"/>
                </g>
                <g fill="none" stroke="#61766c" stroke-width="1.7"><path d="M175 180 H235 M765 180 H815"/></g>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="21">
                    <text x="18" y="168">Capillaries of</text><text x="18" y="194">the lungs</text>
                    <text x="825" y="155">Capillaries of</text><text x="825" y="181">the rest of</text><text x="825" y="207">the body</text>
                    <text x="500" y="188" text-anchor="middle" font-size="24">Heart</text>
                </g>
                <g fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="26" font-weight="700" text-anchor="middle">
                    <text x="355" y="321">1</text><text x="355" y="72">2</text><text x="645" y="72">3</text><text x="645" y="321">4</text>
                </g>
            </svg>
            <figcaption>Flow directions: 1, heart &rarr; lungs; 2, lungs &rarr; heart; 3, body &rarr; heart; 4, heart &rarr; body.</figcaption>
        </figure>
    `,
    options: ["1 and 2", "1 and 4", "2 and 3", "2 and 4"],
    correct: "D",
    answer: "D. Vessels 2 and 4",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">In <strong>double circulation</strong>, blood passes through the heart <strong>twice during one complete circuit</strong>: once through the right side and once through the left side.</p>

        <h3>Step 1: Identify the blood vessels</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Follow the arrows to identify each numbered vessel</caption>
            <colgroup><col style="width:37%"><col style="width:30%"><col style="width:33%"></colgroup>
            <thead><tr><th scope="col">Vessel</th><th scope="col">Direction of blood flow</th><th scope="col">Blood type</th></tr></thead>
            <tbody>
                <tr><th scope="row">1 — Pulmonary artery</th><td>Heart &rarr; lungs</td><td>Deoxygenated</td></tr>
                <tr><th scope="row">2 — Pulmonary vein</th><td>Lungs &rarr; heart</td><td><strong>Oxygenated</strong> <span aria-hidden="true">✓</span></td></tr>
                <tr><th scope="row">3 — Vena cava</th><td>Body &rarr; heart</td><td>Deoxygenated</td></tr>
                <tr><th scope="row">4 — Aorta</th><td>Heart &rarr; body</td><td><strong>Oxygenated</strong> <span aria-hidden="true">✓</span></td></tr>
            </tbody>
        </table>

        <h3>Step 2: Understand double circulation</h3>
        <p><strong>Pulmonary circulation: heart &rarr; lungs &rarr; heart</strong></p>
        <div class="translocation-flow" role="img" aria-label="The right side of the heart pumps deoxygenated blood through vessel 1, the pulmonary artery, to the lungs. Blood absorbs oxygen at the lungs and returns through vessel 2, the pulmonary vein, to the left side of the heart.">
            <div class="flow-step"><strong>Right side of the heart</strong><span>Pumps deoxygenated blood</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>1 — Pulmonary artery</strong><span>Carries blood from the heart to the lungs</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Lungs</strong><span>Blood absorbs oxygen</span></div>
        </div>
        <p><strong>2 — Pulmonary vein:</strong> Returns oxygenated blood from the lungs to the <strong>left side of the heart</strong>.</p>

        <p><strong>Systemic circulation: heart &rarr; body &rarr; heart</strong></p>
        <div class="translocation-flow" role="img" aria-label="The left side of the heart pumps oxygenated blood through vessel 4, the aorta, to the body tissues. Oxygen is delivered to cells. Deoxygenated blood returns through vessel 3, the vena cava, to the right side of the heart.">
            <div class="flow-step"><strong>Left side of the heart</strong><span>Pumps oxygenated blood</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>4 — Aorta</strong><span>Carries oxygenated blood to the body</span></div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-step"><strong>Body tissues</strong><span>Oxygen is delivered to cells</span></div>
        </div>
        <p><strong>3 — Vena cava:</strong> Returns deoxygenated blood from the body to the <strong>right side of the heart</strong>.</p>
        <figure class="explanation-photo">
            <a href="https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/2101_Blood_Flow_Through_the_Heart.jpg/960px-2101_Blood_Flow_Through_the_Heart.jpg" target="_blank" rel="noreferrer" aria-label="Open the pulmonary and systemic circulation illustration at full size in a new tab">
                <img src="images/question-38-double-circulation.jpg" width="960" height="651" style="width:100%;max-width:900px;background:var(--white)" alt="Pulmonary and systemic circulation linking the heart, lungs and body tissues, with oxygenated blood shown red and deoxygenated blood blue" loading="lazy" decoding="async">
            </a>
            <figcaption>Double circulation links the heart, lungs and body. <a href="https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/2101_Blood_Flow_Through_the_Heart.jpg/960px-2101_Blood_Flow_Through_the_Heart.jpg" target="_blank" rel="noreferrer">Open the larger illustration</a>. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2101_Blood_Flow_Through_the_Heart.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>. Unmodified resized preview.</figcaption>
        </figure>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Only vessels 2 and 4 both carry oxygenated blood</caption>
            <colgroup><col style="width:18%"><col style="width:24%"><col style="width:58%"></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Vessels</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>1 and 2</td><td>Incorrect — vessel 1 carries deoxygenated blood.</td></tr>
                <tr><th scope="row">B</th><td>1 and 4</td><td>Incorrect — vessel 1 carries deoxygenated blood.</td></tr>
                <tr><th scope="row">C</th><td>2 and 3</td><td>Incorrect — vessel 3 carries deoxygenated blood.</td></tr>
                <tr><th scope="row">D</th><td>2 and 4</td><td><strong>Correct — both carry oxygenated blood.</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Pulmonary artery:</strong> Carries deoxygenated blood from the heart to the lungs.</li>
            <li><strong>Pulmonary vein:</strong> Carries oxygenated blood from the lungs to the heart.</li>
        </ul>
        <p class="exam-tip"><strong>Arteries carry blood away from the heart; veins carry blood towards it.</strong> Their names are determined by blood-flow direction, not oxygen content.</p>
        <p class="relationship">Final answer: D — Vessels 2 and 4.</p>
    `
}
,
{
    title: "What is the actual diameter of the cell?",
    paperCode: "0610/13/O/N/20",
    paperSession: "Oct/Nov 2020",
    legend: "Choose the expression that correctly calculates the actual cell diameter",
    context: `
        <p>The cell shown in the diagram is magnified <strong>3000 times</strong>. The diagram is <strong>21 mm wide</strong>.</p>
        <figure class="plant-diagram" style="max-width:300px">
            <svg viewBox="0 0 400 330" role="img" aria-labelledby="magnified-cell-question-title magnified-cell-question-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="magnified-cell-question-title">Magnified cell diagram</title>
                <desc id="magnified-cell-question-desc">A rounded cell contains a lobed nucleus. The given drawing diameter is 21 millimetres and its magnification is 3000 times.</desc>
                <defs>
                    <pattern id="q39-cell-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".9" fill="#8b9d90"/></pattern>
                    <path id="q39-cell-outline" d="M285 138 C290 183 258 222 210 228 C163 235 113 208 110 159 C102 112 133 66 190 56 C235 50 280 78 285 138Z"/>
                </defs>
                <use href="#q39-cell-outline" fill="#fffefa"/>
                <use href="#q39-cell-outline" fill="url(#q39-cell-dots)" stroke="#526c62" stroke-width="2.5"/>
                <g fill="none" stroke="#193b34" stroke-width="3"><path d="M183 104 C200 94 200 99 214 88 M151 148 C154 173 159 184 174 184"/></g>
                <g fill="#193b34">
                    <path d="M147 129 C139 108 147 90 163 91 C177 82 193 87 193 95 C196 106 184 115 173 114 C164 116 159 129 162 142 C163 155 149 163 142 154 C136 148 140 137 147 129Z"/>
                    <path d="M212 88 C216 79 233 78 236 89 C249 99 259 110 255 119 C252 129 240 128 231 117 C220 112 211 105 212 88Z"/>
                    <path d="M172 180 C183 170 191 177 201 178 C213 180 220 163 234 168 C248 174 239 190 227 198 C212 207 188 207 179 195 C168 191 163 185 172 180Z"/>
                </g>
                <g fill="none" stroke="#61766c" stroke-width="1.5"><path d="M110 245 V266 M285 245 V266 M110 256 H285"/></g>
                <text x="200" y="296" text-anchor="middle" fill="#193b34" font-family="Avenir Next, Avenir, Segoe UI, sans-serif" font-size="17">Given drawing diameter: 21 mm</text>
            </svg>
            <figcaption>Use the given drawing diameter of 21 mm and magnification of ×3000.</figcaption>
        </figure>
    `,
    options: [
        "21 mm",
        '<span role="img" aria-label="21 millimetres divided by 3000" style="display:inline-grid;grid-template-rows:auto auto;justify-items:center;line-height:1.2;vertical-align:middle"><span style="padding:0 .25em .15em;border-bottom:1px solid currentColor">21 mm</span><span style="padding-top:.15em">3000</span></span>',
        "21 mm × 3000",
        '<span role="img" aria-label="3000 divided by 21 millimetres" style="display:inline-grid;grid-template-rows:auto auto;justify-items:center;line-height:1.2;vertical-align:middle"><span style="padding:0 .25em .15em;border-bottom:1px solid currentColor">3000</span><span style="padding-top:.15em">21 mm</span></span>'
    ],
    correct: "B",
    answer: "B. 21 mm ÷ 3000 = 0.007 mm (7 µm)",
    explanation: `
        <h3>Step-by-step calculation</h3>
        <ul class="option-explanations">
            <li><strong>Image size (diameter of the drawing):</strong> 21 mm</li>
            <li><strong>Magnification:</strong> ×3000</li>
            <li><strong>Actual diameter:</strong> To be calculated</li>
        </ul>

        <h3>Step 1: Write the magnification formula</h3>
        <p class="relationship">Magnification = image size ÷ actual size</p>
        

        <p>Rearrange to find actual size:</p>
        <p class="relationship"><strong>Actual size = image size ÷ magnification</strong></p>

        <h3>Step 2: Substitute the values</h3>
        <p class="relationship">Actual diameter = 21 mm ÷ 3000 = <strong>0.007 mm</strong></p>

        <h3>Step 3: Convert millimetres to micrometres</h3>
        <p class="relationship">1 mm = 1000 µm</p>
        <p class="relationship">0.007 × 1000 = <strong>7 µm</strong></p>
        <p>Therefore, the actual diameter of the cell is <strong>0.007 mm, or 7 µm</strong>.</p>

        <h3>Why are the other options incorrect?</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Choose the expression for actual size</caption>
            <colgroup><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. 21 mm</th><td>This is the drawing's diameter, not the actual cell diameter.</td></tr>
                <tr><th scope="row">B. 21 mm ÷ 3000</th><td><strong>Correct — divide image size by magnification to calculate actual size.</strong></td></tr>
                <tr><th scope="row">C. 21 mm × 3000</th><td>Multiplication is used to calculate image size from actual size.</td></tr>
                <tr><th scope="row">D. 3000 ÷ 21 mm</th><td>This reverses the formula and gives incorrect units.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>The three magnification equations</caption>
            <thead><tr><th scope="col">To calculate</th><th scope="col">Equation</th></tr></thead>
            <tbody>
                <tr><th scope="row">Magnification</th><td><strong>M = I ÷ A</strong></td></tr>
                <tr><th scope="row">Image size</th><td><strong>I = M × A</strong></td></tr>
                <tr><th scope="row">Actual size</th><td><strong>A = I ÷ M</strong></td></tr>
            </tbody>
        </table>
        <ul class="option-explanations">
            <li><strong>M:</strong> Magnification, which has no units.</li>
            <li><strong>I:</strong> Image size.</li>
            <li><strong>A:</strong> Actual size.</li>
        </ul>
        <figure class="explanation-photo">
            <a href="https://commons.wikimedia.org/wiki/File:Optical_microscope_nikon_alphaphot.jpg" target="_blank" rel="noreferrer" aria-label="Open the light-microscope photograph and source details in a new tab">
                <img src="images/question-39-microscope.jpg" width="500" height="757" style="max-width:260px;background:var(--white)" alt="Nikon Alphaphot compound light microscope" loading="lazy" decoding="async">
            </a>
            <figcaption>Example of a light microscope. This calculation uses the question's stated 21 mm and ×3000. Photo: GcG(jawp), via <a href="https://commons.wikimedia.org/wiki/File:Optical_microscope_nikon_alphaphot.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, public domain. Unmodified resized preview.</figcaption>
        </figure>
        <p class="exam-tip"><strong>Important:</strong> Image size and actual size must use the <strong>same units</strong> when calculating magnification.</p>
        <p class="relationship">Final answer: B — 0.007 mm (7 µm).</p>
    `
}
,
{
    title: "Which part absorbs the most water?",
    paperCode: "0610/21/O/N/23",
    paperSession: "Oct/Nov 2023",
    legend: "Choose the labelled part of the digestive system that absorbs the most water",
    context: `
        <p>The diagram shows the digestive system.</p>
        <figure class="digestive-diagram" style="max-width:440px">
            <!-- Add question-40.png to the images folder beside index.html. -->
            <img class="diagram-photo" src="images/question-40.png" alt="Digestive system diagram labelled A to D" loading="lazy" decoding="async">
            <figcaption>Labels A–D identify four parts of the alimentary canal.</figcaption>
        </figure>
    `,
    options: ["Stomach", "Large intestine", "Rectum", "Small intestine"],
    correct: "D",
    answer: "D. Small intestine",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Both the small intestine and large intestine absorb water, but the <strong>small intestine absorbs the greatest amount overall</strong>. The word <strong>MOST</strong> is the key to this question.</p>

        <h3>Step 1: Identify the labelled structures</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Digestive structures and their main functions</caption>
            <colgroup><col style="width:15%"><col style="width:31%"><col style="width:54%"></colgroup>
            <thead><tr><th scope="col">Label</th><th scope="col">Structure</th><th scope="col">Main function</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Stomach</td><td>Digests proteins and churns food.</td></tr>
                <tr><th scope="row">B</th><td>Large intestine</td><td>Absorbs much of the remaining water and some mineral ions.</td></tr>
                <tr><th scope="row">C</th><td>Rectum</td><td>Temporarily stores faeces.</td></tr>
                <tr><th scope="row">D</th><td><strong>Small intestine</strong></td><td><strong>Absorbs most water and digested nutrients.</strong> <span aria-hidden="true">✓</span></td></tr>
            </tbody>
        </table>

        <h3>Step 2: Understand water absorption</h3>
        <p><strong>Small intestine (D)</strong></p>
        <ul class="option-explanations">
            <li>Absorbs <strong>most of the water</strong> entering the alimentary canal.</li>
            <li>Absorbs digested nutrients such as <strong>glucose and amino acids</strong>.</li>
            <li>Contains <strong>villi and microvilli</strong> that increase the surface area for absorption.</li>
        </ul>
        <p><strong>Large intestine (B)</strong></p>
        <ul class="option-explanations">
            <li>Absorbs much of the <strong>remaining water</strong>.</li>
            <li>Helps form solid faeces.</li>
            <li>Helps prevent excessive water loss from the body.</li>
        </ul>
        <figure class="explanation-photo">
            <a href="https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/2418_Histology_Small_IntestinesN.jpg/960px-2418_Histology_Small_IntestinesN.jpg" target="_blank" rel="noreferrer" aria-label="Open the small-intestine folds, villi and microvilli illustration at full size in a new tab">
                <img src="images/question-40-intestine-villi.jpg" width="960" height="733" style="width:100%;max-width:900px;background:var(--white)" alt="Small-intestine lining showing folds, villi and microvilli that increase the surface area for absorption" loading="lazy" decoding="async">
            </a>
            <figcaption>Folds, villi and microvilli give the small intestine a large surface area for absorption. <a href="https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/2418_Histology_Small_IntestinesN.jpg/960px-2418_Histology_Small_IntestinesN.jpg" target="_blank" rel="noreferrer">Open the larger illustration</a>. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2418_Histology_Small_IntestinesN.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>. Unmodified resized preview.</figcaption>
        </figure>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Which organ absorbs the most water?</caption>
            <colgroup><col style="width:31%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Stomach</th><td>Only a relatively small amount of water is absorbed here.</td></tr>
                <tr><th scope="row">B. Large intestine</th><td>Absorbs remaining water, but not the greatest amount overall.</td></tr>
                <tr><th scope="row">C. Rectum</th><td>Mainly stores faeces before egestion.</td></tr>
                <tr><th scope="row">D. Small intestine</th><td><strong>Correct — absorbs most water.</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Which organ absorbs most water?</strong> &rarr; Small intestine.</li>
            <li><strong>Which organ absorbs much of the remaining water and helps form faeces?</strong> &rarr; Large intestine.</li>
        </ul>
        <p class="exam-tip"><strong>Focus on MOST:</strong> Both intestines absorb water. The small intestine absorbs most overall; the large intestine absorbs much of what remains.</p>
        <p class="relationship">Final answer: D — Small intestine.</p>
    `
},
{
    title: "Which characteristic of living things requires carbon dioxide to diffuse into a leaf?",
    paperCode: "0610/21/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the characteristic shown when carbon dioxide enters a leaf for photosynthesis",
    options: ["Excretion", "Movement", "Nutrition", "Respiration"],
    correct: "C",
    answer: "C. Nutrition",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Carbon dioxide is a raw material for <strong>photosynthesis</strong>, the process by which green plants manufacture glucose. Photosynthesis is an example of <strong>nutrition</strong>, one of the seven characteristics of living organisms.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="41">
            <a href="images/plant-cells.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/plant-cells.jpg" width="960" height="699" alt="Microscope view of plant leaf epidermis and stomata" loading="lazy" decoding="async">
            </a>
            <figcaption>Stomata in the leaf epidermis allow carbon dioxide to enter. Photosynthesising cells use carbon dioxide to make food, demonstrating nutrition. <span class="image-credit">Image: Emilio Ermini, via <a href="https://commons.wikimedia.org/wiki/File:Leaf_epithelium,_stomata.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Understand why CO<sub>2</sub> enters the leaf</h3>
        <ol class="statement-list">
            <li>Carbon dioxide enters the leaf mainly through the stomata by <strong>diffusion</strong>.</li>
            <li>It diffuses towards photosynthesising cells containing chloroplasts.</li>
            <li>Chlorophyll absorbs light energy.</li>
            <li>The plant uses carbon dioxide and water to produce glucose.</li>
            <li>Glucose provides chemical energy and materials for growth.</li>
        </ol>

        <h3>Step 2: Photosynthesis equation</h3>
        <p>In the presence of light and chlorophyll:</p>
        <p class="relationship">6CO<sub>2</sub> + 6H<sub>2</sub>O &rarr; C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub></p>
        <p>Carbon dioxide + water &rarr; glucose + oxygen</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Which characteristic explains the need for carbon dioxide?</caption>
            <colgroup><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Excretion</th><td>Incorrect — removal of toxic materials, metabolic waste products and substances in excess of requirements.</td></tr>
                <tr><th scope="row">B. Movement</th><td>Incorrect — movement of an organism or part of an organism does not explain why carbon dioxide is needed.</td></tr>
                <tr><th scope="row">C. Nutrition</th><td><strong>Correct — carbon dioxide is used in photosynthesis to manufacture glucose.</strong></td></tr>
                <tr><th scope="row">D. Respiration</th><td>Incorrect — aerobic respiration uses glucose and oxygen and releases carbon dioxide.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Carbon dioxide in photosynthesis and aerobic respiration</caption>
            <thead><tr><th scope="col">Process</th><th scope="col">Carbon dioxide</th></tr></thead>
            <tbody>
                <tr><th scope="row">Photosynthesis</th><td>Taken in and used</td></tr>
                <tr><th scope="row">Aerobic respiration</th><td>Produced and released</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Focus on the purpose:</strong> Carbon dioxide moves into the leaf by diffusion, but the characteristic demonstrated is <strong>nutrition</strong> because the gas is used to manufacture food.</p>
        <p class="relationship">Final answer: C — Nutrition.</p>
    `
},
{
    title: "Which two species are the least closely related?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Compare the DNA base sequences and choose the least closely related pair of species",
    context: `
        <p>Part of the base sequence of DNA from four species was determined.</p>
        <table class="comparison-table dna-sequence-table">
            <caption>DNA bases at the same eight positions in each species</caption>
            <thead><tr><th scope="col">Species</th><th scope="col">1</th><th scope="col">2</th><th scope="col">3</th><th scope="col">4</th><th scope="col">5</th><th scope="col">6</th><th scope="col">7</th><th scope="col">8</th></tr></thead>
            <tbody>
                <tr><th scope="row">Species 1</th><td>T</td><td>C</td><td>A</td><td>G</td><td>G</td><td>A</td><td>T</td><td>T</td></tr>
                <tr><th scope="row">Species 2</th><td>T</td><td>G</td><td>A</td><td>G</td><td>C</td><td>A</td><td>A</td><td>T</td></tr>
                <tr><th scope="row">Species 3</th><td>T</td><td>G</td><td>A</td><td>G</td><td>C</td><td>A</td><td>A</td><td>G</td></tr>
                <tr><th scope="row">Species 4</th><td>T</td><td>G</td><td>A</td><td>G</td><td>G</td><td>A</td><td>T</td><td>T</td></tr>
            </tbody>
        </table>
    `,
    options: ["1 and 2", "1 and 3", "2 and 4", "3 and 4"],
    correct: "B",
    answer: "B. Species 1 and 3",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Species with more similar DNA base sequences are generally more closely related. The pair with the <strong>greatest number of differences</strong> in the sequence shown is inferred to be the <strong>least closely related</strong> of the pairs given.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="42">
            <a href="images/online-dna-sequence-comparison.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-dna-sequence-comparison.jpg" width="960" height="155" alt="A published alignment compares matching DNA nucleotide positions in seven human gyrovirus sequences, using marks for matching bases" loading="lazy" decoding="async">
            </a>
            <figcaption>A published DNA alignment illustrates comparison at matching nucleotide positions. These viral sequences are a general example, separate from the four species in the question. <span class="image-credit">Image: Maggi F, Macera L, Focosi D, Vatteroni ML, Boggi U, Antonelli G, et al., via <a href="https://commons.wikimedia.org/wiki/File:Alignment_of_the_nucleotide_sequences_-Human_Gyrovirus_DNA_genome.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://commons.wikimedia.org/wiki/Commons:Public_domain" target="_blank" rel="noreferrer">Public domain</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Compare the aligned bases</h3>
        <section class="dna-lab" id="dna-comparison" role="group" aria-labelledby="dna-lab-title">
            <h3 id="dna-lab-title">Explore the DNA differences</h3>
            <p>Select a species pair. Compare the bases at each numbered position.</p>
            <div class="dna-pair-controls" role="group" aria-label="Species pairs to compare">
                <button type="button" data-dna-pair="A" aria-pressed="false" aria-controls="dna-comparison-rows dna-comparison-summary dna-difference-positions">A · 1 and 2</button>
                <button type="button" data-dna-pair="B" aria-pressed="true" aria-controls="dna-comparison-rows dna-comparison-summary dna-difference-positions">B · 1 and 3</button>
                <button type="button" data-dna-pair="C" aria-pressed="false" aria-controls="dna-comparison-rows dna-comparison-summary dna-difference-positions">C · 2 and 4</button>
                <button type="button" data-dna-pair="D" aria-pressed="false" aria-controls="dna-comparison-rows dna-comparison-summary dna-difference-positions">D · 3 and 4</button>
            </div>
            <table class="comparison-table dna-alignment">
                <caption>DNA bases compared position by position</caption>
                <thead><tr><th scope="col">Species</th><th scope="col">1</th><th scope="col">2</th><th scope="col">3</th><th scope="col">4</th><th scope="col">5</th><th scope="col">6</th><th scope="col">7</th><th scope="col">8</th></tr></thead>
                <tbody id="dna-comparison-rows">
                    <tr><th scope="row">Species 1</th><td class="dna-base is-match" aria-label="Position 1: T; matches">T</td><td class="dna-base is-different" aria-label="Position 2: C; differs">C</td><td class="dna-base is-match" aria-label="Position 3: A; matches">A</td><td class="dna-base is-match" aria-label="Position 4: G; matches">G</td><td class="dna-base is-different" aria-label="Position 5: G; differs">G</td><td class="dna-base is-match" aria-label="Position 6: A; matches">A</td><td class="dna-base is-different" aria-label="Position 7: T; differs">T</td><td class="dna-base is-different" aria-label="Position 8: T; differs">T</td></tr>
                    <tr><th scope="row">Species 3</th><td class="dna-base is-match" aria-label="Position 1: T; matches">T</td><td class="dna-base is-different" aria-label="Position 2: G; differs">G</td><td class="dna-base is-match" aria-label="Position 3: A; matches">A</td><td class="dna-base is-match" aria-label="Position 4: G; matches">G</td><td class="dna-base is-different" aria-label="Position 5: C; differs">C</td><td class="dna-base is-match" aria-label="Position 6: A; matches">A</td><td class="dna-base is-different" aria-label="Position 7: A; differs">A</td><td class="dna-base is-different" aria-label="Position 8: G; differs">G</td></tr>
                </tbody>
            </table>
            <p class="dna-key">Underlined bases differ at that position.</p>
            <output class="dna-summary" id="dna-comparison-summary" aria-live="polite" aria-atomic="true">Species 1 and 3: 4 differences out of 8 bases</output>
            <p id="dna-difference-positions">Different positions: 2, 5, 7 and 8.</p>
            <h3>Number of DNA differences</h3>
            <div class="dna-pair-chart" role="group" aria-label="Number of DNA base differences, out of 8">
                <div class="dna-pair-bar" data-dna-bar="A"><span class="dna-pair-label">A · 1 and 2</span><span class="dna-pair-track" aria-hidden="true"><span class="dna-pair-fill" style="width:37.5%"></span></span><strong class="dna-pair-value">3 / 8</strong></div>
                <div class="dna-pair-bar is-active" data-dna-bar="B"><span class="dna-pair-label">B · 1 and 3</span><span class="dna-pair-track" aria-hidden="true"><span class="dna-pair-fill" style="width:50%"></span></span><strong class="dna-pair-value">4 / 8</strong></div>
                <div class="dna-pair-bar" data-dna-bar="C"><span class="dna-pair-label">C · 2 and 4</span><span class="dna-pair-track" aria-hidden="true"><span class="dna-pair-fill" style="width:25%"></span></span><strong class="dna-pair-value">2 / 8</strong></div>
                <div class="dna-pair-bar" data-dna-bar="D"><span class="dna-pair-label">D · 3 and 4</span><span class="dna-pair-track" aria-hidden="true"><span class="dna-pair-fill" style="width:37.5%"></span></span><strong class="dna-pair-value">3 / 8</strong></div>
            </div>
            <p>Each bar uses the same scale: 0 to 8 differing bases. More differences suggest a less close relationship.</p>
        </section>

        <h3>Step 2: Compare all the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Count the positions at which the bases differ</caption>
            <thead><tr><th scope="col">Option</th><th scope="col">Species compared</th><th scope="col">Differences</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>1 and 2</td><td>3</td></tr>
                <tr><th scope="row">B</th><td>1 and 3</td><td><strong>4 — most differences</strong></td></tr>
                <tr><th scope="row">C</th><td>2 and 4</td><td>2</td></tr>
                <tr><th scope="row">D</th><td>3 and 4</td><td>3</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Draw a conclusion</h3>
        <p>Species 1 and 3 differ at positions <strong>2, 5, 7 and 8</strong>. Their four differences are the greatest number among the pairs offered, so they are inferred to be the <strong>least closely related</strong> based on this DNA fragment.</p>
        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>More similarities in DNA sequences:</strong> Generally a closer relationship.</li>
            <li><strong>More differences in DNA sequences:</strong> Generally a less close relationship.</li>
            <li><strong>Common ancestry:</strong> Closely related species generally share a more recent common ancestor.</li>
        </ul>
        <p class="exam-tip"><strong>Compare positions:</strong> Count the positions at which the bases differ, not just the different types of bases present.</p>
        <p class="relationship">Final answer: B — Species 1 and 3.</p>
    `
},
{
    title: "What is the correct definition of enzymes?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the correct definition of enzymes",
    options: [
        "Carbohydrates that act as biological catalysts",
        "Carbohydrates that act as substrates",
        "Proteins that act as biological catalysts",
        "Proteins that act as substrates"
    ],
    correct: "C",
    answer: "C. Proteins that act as biological catalysts",
    explanation: `
        <h3>Enzyme definition</h3>
        <p class="definition">Enzymes are <strong>proteins that act as biological catalysts</strong>, speeding up chemical reactions without being used up or chemically changed.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="43">
            <a href="images/online-enzyme-active-site.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-active-site.png" width="1088" height="713" alt="A folded polypeptide chain forms an enzyme with a substrate bound at its active site" loading="lazy" decoding="async">
            </a>
            <figcaption>A folded protein forms an enzyme active site that binds a complementary substrate. <span class="image-credit">Image: User:Mcy_jerry on EN WP as en:File:Enzymeactivesite.png, via <a href="https://commons.wikimedia.org/wiki/File:Enzyme_active_site.png" target="_blank" rel="noreferrer">source</a>, <a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Enzymes are proteins</h3>
        <ul class="option-explanations">
            <li>Enzymes are made of <strong>amino acids</strong> joined together.</li>
            <li>Each enzyme has a specific <strong>three-dimensional shape</strong>.</li>
            <li>The <strong>active site</strong> binds to the enzyme's substrate.</li>
        </ul>

        <h3>Step 2: Enzymes are biological catalysts</h3>
        <ul class="option-explanations">
            <li>They <strong>speed up chemical reactions</strong> in living organisms.</li>
            <li>They lower the <strong>activation energy</strong> required for a reaction.</li>
            <li>They remain unchanged after the reaction and <strong>can be reused</strong>.</li>
        </ul>

        <h3>Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Identify both the type of molecule and its role</caption>
            <colgroup><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Carbohydrates acting as biological catalysts</th><td>Incorrect — enzymes are proteins, not carbohydrates, at IGCSE level.</td></tr>
                <tr><th scope="row">B. Carbohydrates acting as substrates</th><td>Incorrect — carbohydrates may be substrates, but enzymes are defined as biological catalysts.</td></tr>
                <tr><th scope="row">C. Proteins acting as biological catalysts</th><td><strong>Correct — this identifies both the molecule and its catalytic role.</strong></td></tr>
                <tr><th scope="row">D. Proteins acting as substrates</th><td>Incorrect — although proteins can be substrates, this does not define enzymes.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <p>Remember these three essential phrases:</p>
        <ul class="option-explanations">
            <li><strong>Proteins</strong></li>
            <li><strong>Biological catalysts</strong></li>
            <li><strong>Not used up during reactions</strong></li>
        </ul>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Enzyme and substrate: different roles in a reaction</caption>
            <thead><tr><th scope="col">Enzyme</th><th scope="col">Substrate</th></tr></thead>
            <tbody>
                <tr><td>Biological catalyst</td><td>Substance on which an enzyme acts</td></tr>
                <tr><td>Speeds up a reaction</td><td>Undergoes a chemical change</td></tr>
                <tr><td>Can be reused</td><td>Converted into product(s)</td></tr>
            </tbody>
        </table>
        <p class="relationship">Final answer: C — Proteins that act as biological catalysts.</p>
    `
},
{
    title: "Which DNA molecule would require the lowest temperature to break into single strands?",
    paperCode: "0610/23/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the DNA molecule and the reason it requires a lower temperature to separate its strands",
    context: `
        <p>In a DNA molecule, bonds between pairs of bases hold two strands together. High temperatures can break these bonds to form two single strands of DNA.</p>
        <p>The base pair C and G is held together more strongly than the base pair A and T.</p>
        <p>Two DNA molecules containing the same number of bases were studied.</p>
        <ul class="statement-list">
            <li>In DNA molecule 1, <strong>20% of bases are T</strong>.</li>
            <li>In DNA molecule 2, <strong>20% of bases are C</strong>.</li>
        </ul>
    `,
    options: [
        "DNA molecule 1, because there are more A bases present.",
        "DNA molecule 1, because there are more G bases present.",
        "DNA molecule 2, because there are more A bases present.",
        "DNA molecule 2, because there are more G bases present."
    ],
    correct: "C",
    answer: "C. DNA molecule 2, because there are more A bases present",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">Hydrogen bonds between complementary bases hold the two DNA strands together. <strong>A pairs with T</strong> through two hydrogen bonds; <strong>C pairs with G</strong> through three. As stated in the question, C–G pairs are held together more strongly than A–T pairs.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="44">
            <a href="images/online-dna-base-pairing.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-dna-base-pairing.png" width="500" height="781" alt="Molecular diagram of four DNA base pairs, labelled A, T, G, and C, linked by hydrogen bonds between two sugar phosphate backbones" loading="lazy" decoding="async">
            </a>
            <figcaption>Complementary DNA bases pair across the strands: A with T, and G with C. Hydrogen bonds connect the paired bases. <span class="image-credit">Image: Geometry guy, via <a href="https://commons.wikimedia.org/wiki/File:Four_nucleobase_pairs_of_DNA.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Calculate the percentages of bases</h3>
        <p>In double-stranded DNA:</p>
        <p class="relationship">%A = %T &nbsp; and &nbsp; %C = %G</p>
        <p><strong>DNA molecule 1:</strong> T = 20%, so A = 20%. The remaining percentage is 100 − (20 + 20) = 60%, split equally between C and G.</p>
        <p class="relationship">Molecule 1: A = 20%, T = 20%, C = 30%, G = 30%</p>
        <p><strong>DNA molecule 2:</strong> C = 20%, so G = 20%. The remaining percentage is 100 − (20 + 20) = 60%, split equally between A and T.</p>
        <p class="relationship">Molecule 2: A = 30%, T = 30%, C = 20%, G = 20%</p>

        <h3>Step 2: Compare the two DNA molecules</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Percentages of all bases in each double-stranded DNA molecule</caption>
            <thead><tr><th scope="col">Base or combination</th><th scope="col">DNA molecule 1</th><th scope="col">DNA molecule 2</th></tr></thead>
            <tbody>
                <tr><th scope="row">Adenine (A)</th><td>20%</td><td>30%</td></tr>
                <tr><th scope="row">Thymine (T)</th><td>20%</td><td>30%</td></tr>
                <tr><th scope="row">Cytosine (C)</th><td>30%</td><td>20%</td></tr>
                <tr><th scope="row">Guanine (G)</th><td>30%</td><td>20%</td></tr>
                <tr><th scope="row">A + T combined</th><td>40%</td><td>60%</td></tr>
                <tr><th scope="row">C + G combined (GC content)</th><td>60%</td><td>40%</td></tr>
            </tbody>
        </table>

        <section class="dna44-lab" id="dna44-lab" role="group" aria-labelledby="dna44-title">
            <h3 id="dna44-title">Explore the base composition</h3>
            <p>Choose a DNA molecule to update the graph. Each bar shows one base as a percentage of all bases.</p>
            <div class="dna44-controls" role="group" aria-label="DNA molecule to display">
                <button type="button" data-dna44-molecule="1" aria-pressed="false" aria-controls="dna44-chart dna44-reading dna44-calculation dna44-reason">DNA molecule 1</button>
                <button type="button" data-dna44-molecule="2" aria-pressed="true" aria-controls="dna44-chart dna44-reading dna44-calculation dna44-reason">DNA molecule 2</button>
            </div>
            <p class="dna44-axis-caption">Base composition (% of all bases; scale 0–50%)</p>
            <div class="dna44-chart" id="dna44-chart" role="group" aria-label="Base percentages in the selected DNA molecule; axis from 0 to 50 percent">
                <div class="dna44-y-axis" aria-hidden="true"><span>50%</span><span>25%</span><span>0</span></div>
                <div class="dna44-columns">
                    <div class="dna44-base-column" data-dna44-base="A" role="img" aria-label="Adenine (A): 30% of all bases"><span class="dna44-bar-space"><span class="dna44-bar dna44-at" style="height:60%"></span><strong class="dna44-value">30%</strong></span><span class="dna44-base-label">A</span></div>
                    <div class="dna44-base-column" data-dna44-base="T" role="img" aria-label="Thymine (T): 30% of all bases"><span class="dna44-bar-space"><span class="dna44-bar dna44-at" style="height:60%"></span><strong class="dna44-value">30%</strong></span><span class="dna44-base-label">T</span></div>
                    <div class="dna44-base-column" data-dna44-base="C" role="img" aria-label="Cytosine (C): 20% of all bases"><span class="dna44-bar-space"><span class="dna44-bar dna44-gc" style="height:40%"></span><strong class="dna44-value">20%</strong></span><span class="dna44-base-label">C</span></div>
                    <div class="dna44-base-column" data-dna44-base="G" role="img" aria-label="Guanine (G): 20% of all bases"><span class="dna44-bar-space"><span class="dna44-bar dna44-gc" style="height:40%"></span><strong class="dna44-value">20%</strong></span><span class="dna44-base-label">G</span></div>
                </div>
            </div>
            <div class="dna44-legend"><span><span class="dna44-at-key" aria-hidden="true"></span>A–T: 2 hydrogen bonds</span><span><span class="dna44-gc-key" aria-hidden="true"></span>C–G: 3 hydrogen bonds</span></div>
            <output class="dna44-reading" id="dna44-reading" aria-live="polite" aria-atomic="true"><strong id="dna44-molecule-name">DNA molecule 2</strong><span id="dna44-content">40% GC · 60% AT</span></output>
            <p id="dna44-calculation">Given C = 20%, so G = 20%. The remaining 60% is split equally: A = T = 30%.</p>
            <h3>Compare GC content</h3>
            <p class="dna44-axis-caption">C + G as a percentage of all bases; scale 0–100%</p>
            <div class="dna44-gc-chart" role="group" aria-label="GC content: DNA molecule 1 is 60 percent; DNA molecule 2 is 40 percent">
                <div class="dna44-gc-row" data-dna44-gc-row="1"><span class="dna44-gc-label">DNA 1</span><span class="dna44-gc-track" aria-hidden="true"><span class="dna44-gc-fill" style="width:60%"></span></span><strong>60% GC</strong></div>
                <div class="dna44-gc-row is-active" data-dna44-gc-row="2"><span class="dna44-gc-label">DNA 2</span><span class="dna44-gc-track" aria-hidden="true"><span class="dna44-gc-fill" style="width:40%"></span></span><strong>40% GC</strong></div>
            </div>
            <p id="dna44-reason">DNA molecule 2 has more A–T pairs and fewer C–G pairs, so it is expected to separate at a lower temperature than molecule 1.</p>
        </section>

        <h3>Step 3: Determine which requires the lowest temperature</h3>
        <p><strong>DNA molecule 1:</strong> 60% GC content means a greater proportion of the more strongly held C–G pairs and a higher expected melting temperature.</p>
        <p><strong>DNA molecule 2:</strong> 40% GC content means a greater proportion of A–T pairs, which have fewer hydrogen bonds, and a lower expected melting temperature.</p>
        <p>For the equal-length molecules compared under the same conditions, <strong>DNA molecule 2 requires the lower temperature</strong> to separate its two strands.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Match the molecule with the correct reason</caption>
            <colgroup><col style="width:16%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — molecule 1 has fewer A bases: 20%, compared with 30% in molecule 2.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — molecule 1 has more G bases and more C–G pairs, contributing to stronger bonding and a higher expected melting temperature.</td></tr>
                <tr><th scope="row">C</th><td><strong>Correct — molecule 2 has more A bases, more A–T pairs and a lower expected melting temperature.</strong></td></tr>
                <tr><th scope="row">D</th><td>Incorrect — molecule 2 has fewer G bases: 20%, compared with 30% in molecule 1.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Hydrogen bonds between complementary bases</caption>
            <thead><tr><th scope="col">Base pair</th><th scope="col">Hydrogen bonds</th><th scope="col">Relative strength</th></tr></thead>
            <tbody>
                <tr><th scope="row">A–T</th><td>2</td><td>Weaker</td></tr>
                <tr><th scope="row">C–G</th><td>3</td><td>Stronger</td></tr>
            </tbody>
        </table>
        <p class="relationship">More A–T pairs &rarr; lower melting temperature.<br>More C–G pairs &rarr; higher melting temperature.</p>
        <p class="exam-tip"><strong>Remember complementary pairing:</strong> %A = %T and %C = %G. Calculate all four base percentages before comparing the two molecules.</p>
        <p class="relationship">Final answer: C — DNA molecule 2, because there are more A bases present.</p>
    `
},
{
    title: "What is a correct statement for these results?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Use the three photosynthesis graphs to choose the correct statement",
    context: `
        <p>A student investigated how the rate of photosynthesis is affected by carbon dioxide concentration, temperature and light intensity. The graphs show the results.</p>
        <div class="photo45-context">
            <p class="photo45-y-label">Vertical axis on each graph: rate of photosynthesis</p>
            <div class="photo45-context-grid">
                <figure class="photo45-context-figure">
                    <svg class="photo45-context-plot" viewBox="0 -20 600 280" role="img" aria-labelledby="photo45-question-co2-title photo45-question-co2-desc" xmlns="http://www.w3.org/2000/svg">
                        <title id="photo45-question-co2-title">Photosynthesis and carbon dioxide concentration</title>
                        <desc id="photo45-question-co2-desc">The curve rises and then levels off. Point 1 lies on the rising section.</desc>
                        <path d="M50 20 V230 H550" fill="none" stroke="#61766c" stroke-width="2.5"/>
                        <path d="M43 31 L50 15 L57 31 M539 223 L555 230 L539 237" fill="#61766c"/>
                        <path class="photo45-curve" d="M50 230 C70 190 90 155 110 130 C165 60 240 60 520 60"/>
                        <g class="photo45-point"><circle cx="110" cy="130" r="9"/><text x="126" y="116">1</text></g>
                    </svg>
                    <figcaption>Carbon dioxide concentration</figcaption>
                </figure>
                <figure class="photo45-context-figure">
                    <svg class="photo45-context-plot" viewBox="0 -20 600 280" role="img" aria-labelledby="photo45-question-temperature-title photo45-question-temperature-desc" xmlns="http://www.w3.org/2000/svg">
                        <title id="photo45-question-temperature-title">Photosynthesis and temperature</title>
                        <desc id="photo45-question-temperature-desc">The curve rises to a peak and then falls sharply. Point 2 is at the peak; point 3 is on the falling section.</desc>
                        <path d="M50 20 V230 H550" fill="none" stroke="#61766c" stroke-width="2.5"/>
                        <path d="M43 31 L50 15 L57 31 M539 223 L555 230 L539 237" fill="#61766c"/>
                        <path class="photo45-curve" d="M50 230 C160 228 240 190 290 95 C310 55 326 40 350 40 C380 40 392 100 410 150 C425 200 430 220 435 230"/>
                        <g class="photo45-point"><circle cx="350" cy="40" r="9"/><text x="366" y="26">2</text></g>
                        <g class="photo45-point"><circle cx="410" cy="150" r="9"/><text x="426" y="136">3</text></g>
                    </svg>
                    <figcaption>Temperature</figcaption>
                </figure>
                <figure class="photo45-context-figure">
                    <svg class="photo45-context-plot" viewBox="0 -20 600 280" role="img" aria-labelledby="photo45-question-light-title photo45-question-light-desc" xmlns="http://www.w3.org/2000/svg">
                        <title id="photo45-question-light-title">Photosynthesis and light intensity</title>
                        <desc id="photo45-question-light-desc">The curve rises and then levels off. Point 4 lies on the horizontal plateau.</desc>
                        <path d="M50 20 V230 H550" fill="none" stroke="#61766c" stroke-width="2.5"/>
                        <path d="M43 31 L50 15 L57 31 M539 223 L555 230 L539 237" fill="#61766c"/>
                        <path class="photo45-curve" d="M50 230 C100 90 160 60 235 60 L520 60"/>
                        <g class="photo45-point"><circle cx="350" cy="60" r="9"/><text x="366" y="46">4</text></g>
                    </svg>
                    <figcaption>Light intensity</figcaption>
                </figure>
            </div>
        </div>
    `,
    options: [
        "Carbon dioxide concentration is a limiting factor at 1.",
        "No enzymes are denatured at 3.",
        "Light intensity is a limiting factor at 4.",
        "Temperature is a limiting factor at 2."
    ],
    correct: "A",
    answer: "A. Carbon dioxide concentration is a limiting factor at point 1",
    explanation: `
        <h3>Step-by-step explanation</h3>
        <p class="definition">A <strong>limiting factor</strong> restricts the rate of a process because it is in short supply or at an unfavourable level. At point 1, increasing carbon dioxide concentration increases photosynthesis, so <strong>carbon dioxide is limiting</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="45">
            <a href="images/question-35-light-response.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/question-35-light-response.png" alt="General graph of carbon assimilation at constant temperature, with a curved response levelling off at high light intensity" loading="lazy" decoding="async">
            </a>
            <figcaption>A general light-response curve levels off when another factor limits photosynthesis. Use the question’s own carbon dioxide, temperature and light graphs to evaluate points 1–4. <span class="image-credit">Image: Obsidian Soul, via <a href="https://commons.wikimedia.org/wiki/File:Carbon_assimilation_vs_irradiance.png" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Analyse each labelled point</h3>
        <section class="photo45-lab" id="photo45-lab" role="group" aria-labelledby="photo45-title">
            <h3 id="photo45-title">Explore the labelled points</h3>
            <p>Select a point to see its graph and interpret what happens there.</p>
            <div class="photo45-controls" role="group" aria-label="Graph point to explore">
                <button type="button" data-photo45-point="1" aria-pressed="true" aria-controls="photo45-chart photo45-reading photo45-explanation photo45-next" aria-label="Explore point 1 on the carbon dioxide graph">Point 1</button>
                <button type="button" data-photo45-point="2" aria-pressed="false" aria-controls="photo45-chart photo45-reading photo45-explanation photo45-next" aria-label="Explore point 2 on the temperature graph">Point 2</button>
                <button type="button" data-photo45-point="3" aria-pressed="false" aria-controls="photo45-chart photo45-reading photo45-explanation photo45-next" aria-label="Explore point 3 on the temperature graph">Point 3</button>
                <button type="button" data-photo45-point="4" aria-pressed="false" aria-controls="photo45-chart photo45-reading photo45-explanation photo45-next" aria-label="Explore point 4 on the light intensity graph">Point 4</button>
            </div>
            <p class="photo45-y-label">Rate of photosynthesis</p>
            <svg class="photo45-plot" id="photo45-chart" viewBox="0 -20 600 280" role="img" aria-labelledby="photo45-svg-title photo45-svg-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="photo45-svg-title">Photosynthesis and carbon dioxide concentration, point 1 selected</title>
                <desc id="photo45-svg-desc">The curve rises and then levels off. Point 1 lies on the rising section, where carbon dioxide concentration is limiting.</desc>
                <path d="M50 20 V230 H550" fill="none" stroke="#61766c" stroke-width="2.5"/>
                <path d="M43 31 L50 15 L57 31 M539 223 L555 230 L539 237" fill="#61766c"/>
                <path class="photo45-curve" id="photo45-curve" d="M50 230 C70 190 90 155 110 130 C165 60 240 60 520 60"/>
                <g id="photo45-points"><g class="photo45-point is-active"><circle cx="110" cy="130" r="9"/><text x="126" y="116">1</text></g></g>
            </svg>
            <p class="photo45-x-label" id="photo45-x-label">Carbon dioxide concentration</p>
            <output class="photo45-reading" id="photo45-reading" aria-live="polite" aria-atomic="true">Point 1 · CO₂ concentration is limiting</output>
            <p id="photo45-explanation">Point 1 is on the rising curve. More carbon dioxide allows a higher rate of photosynthesis under these conditions.</p>
            <p id="photo45-next">Increasing CO₂ would increase the rate while other conditions remain unchanged.</p>
        </section>

        <table class="comparison-table" style="table-layout:fixed">
            <caption>Interpret each point on its own graph</caption>
            <colgroup><col style="width:14%"><col style="width:29%"><col></colgroup>
            <thead><tr><th scope="col">Point</th><th scope="col">Factor</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">1</th><td>CO₂ concentration</td><td>On the rising curve. Increasing CO₂ increases the rate, so CO₂ is limiting.</td></tr>
                <tr><th scope="row">2</th><td>Temperature</td><td>At the optimum shown: the maximum rate on this temperature curve.</td></tr>
                <tr><th scope="row">3</th><td>Temperature</td><td>Above the optimum. Enzyme denaturation reduces enzyme activity and the rate of photosynthesis.</td></tr>
                <tr><th scope="row">4</th><td>Light intensity</td><td>On the plateau. More light no longer increases the rate; another factor is limiting.</td></tr>
            </tbody>
        </table>

        <h3>Step 2: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Only option A matches the labelled points</caption>
            <colgroup><col style="width:16%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td><strong>Correct — CO₂ concentration is limiting at point 1 because increasing it increases photosynthesis.</strong></td></tr>
                <tr><th scope="row">B</th><td>Incorrect — the falling rate above the optimum at point 3 is explained by enzyme denaturation.</td></tr>
                <tr><th scope="row">C</th><td>Incorrect — at point 4 the curve is flat, so increasing light does not raise the rate.</td></tr>
                <tr><th scope="row">D</th><td>Incorrect — point 2 is at the optimum temperature shown; increasing temperature further will not increase the rate.</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Understand limiting factors</h3>
        <p class="relationship">Rising curve &rarr; the factor on the horizontal axis is limiting.<br>Plateau &rarr; another factor is limiting.</p>
        <p>The plateau alone does not identify which other factor is limiting. For example, carbon dioxide concentration or temperature could restrict the rate when light is no longer limiting.</p>
        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>CO₂ concentration:</strong> Rate rises, then levels off when another factor becomes limiting.</li>
            <li><strong>Light intensity:</strong> Rate rises, then levels off when another factor becomes limiting.</li>
            <li><strong>Temperature:</strong> Rate rises towards the optimum, then falls at higher temperatures as enzyme denaturation reduces activity.</li>
        </ul>
        <p class="exam-tip"><strong>At the optimum:</strong> Raising temperature beyond point 2 will not increase the rate. Temperature still influences photosynthesis: above the optimum shown, the rate falls.</p>
        <p class="relationship">Final answer: A — Carbon dioxide concentration is a limiting factor at point 1.</p>
    `
},
{
    title: "The diagram shows the effect of vaccination on the human body. Three components are represented by numbers. Which components are memory cells?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the component or components that are memory cells",
    context: `
        <figure class="vaccine46-diagram" role="img" aria-label="Component 1 triggers an immune response, producing components 2 and 3. Component 2 can provide passive immunity to others. Component 3 provides long-term immunity.">
            <div aria-hidden="true">
                <span class="vaccine46-number">1</span>
                <span class="vaccine46-arrow">↓</span>
                <strong class="vaccine46-response">immune response</strong>
                <div class="vaccine46-branches">
                    <div class="vaccine46-branch">
                        <svg class="vaccine46-arrow vaccine46-diagonal" viewBox="0 0 32 32" aria-hidden="true"><path d="M26 6 L6 26 M6 14 V26 H18"/></svg>
                        <span class="vaccine46-number">2</span>
                        <span class="vaccine46-arrow">↓</span>
                        <span class="vaccine46-outcome">can provide passive immunity to others</span>
                    </div>
                    <div class="vaccine46-branch">
                        <svg class="vaccine46-arrow vaccine46-diagonal" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 6 L26 26 M14 26 H26 V14"/></svg>
                        <span class="vaccine46-number">3</span>
                        <span class="vaccine46-arrow">↓</span>
                        <span class="vaccine46-outcome">provide long-term immunity</span>
                    </div>
                </div>
            </div>
        </figure>
    `,
    options: ["1 only", "2 and 3", "2 only", "3 only"],
    correct: "D",
    answer: "D. 3 only (memory cells)",
    explanation: `
        <p class="definition">Vaccination stimulates an immune response that produces specific antibodies and memory cells. <strong>Component 3 represents memory cells, which provide long-term immunity.</strong></p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="46">
            <a href="images/online-primary-secondary-antibody-response.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-primary-secondary-antibody-response.jpg" width="548" height="381" alt="Graph comparing a smaller primary antibody response with a faster and larger secondary response after re-exposure" loading="lazy" decoding="async">
            </a>
            <figcaption>A second exposure to the same antigen produces a faster, larger antibody response. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2223_Primary_and_Secondary_Antibody_Respons_new.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the three components</h3>
        <table class="comparison-table vaccine46-table">
            <caption>Identify each numbered component from its role</caption>
            <colgroup><col style="width:16%"><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Number</th><th scope="col">Component</th><th scope="col">Function</th></tr></thead>
            <tbody>
                <tr><th scope="row">1</th><td>Antigen</td><td>Stimulates an immune response following vaccination.</td></tr>
                <tr><th scope="row">2</th><td>Antibodies</td><td>Bind specifically to antigens. If transferred to another person, they can provide temporary passive immunity.</td></tr>
                <tr><th scope="row">3</th><td>Memory cells</td><td>Remain after the initial immune response and enable a faster response to the same antigen.</td></tr>
            </tbody>
        </table>

        <h3>Step 2: Understand how vaccination works</h3>
        <div class="vaccine46-diagram vaccine46-explained" role="group" aria-label="Vaccination produces antibodies and memory cells">
            <strong class="vaccine46-number">1 · Vaccine antigens</strong>
            <span class="vaccine46-arrow" aria-hidden="true">↓</span>
            <strong class="vaccine46-response">Lymphocytes respond</strong>
            <div class="vaccine46-branches">
                <div class="vaccine46-branch">
                    <svg class="vaccine46-arrow vaccine46-diagonal" viewBox="0 0 32 32" aria-hidden="true"><path d="M26 6 L6 26 M6 14 V26 H18"/></svg>
                    <strong class="vaccine46-number">2 · Antibodies</strong>
                    <span class="vaccine46-outcome">Bind to specific antigens<small>Can provide passive immunity if transferred to another individual</small></span>
                </div>
                <div class="vaccine46-branch">
                    <svg class="vaccine46-arrow vaccine46-diagonal" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 6 L26 26 M14 26 H26 V14"/></svg>
                    <strong class="vaccine46-number">3 · Memory cells</strong>
                    <span class="vaccine46-outcome">Remain after the initial response<small>Provide long-term immunity</small></span>
                </div>
            </div>
        </div>

        <h3>Step 3: Why are memory cells important?</h3>
        <p>If the same pathogen enters the body again:</p>
        <ol class="statement-list">
            <li>Memory lymphocytes recognise its specific antigens.</li>
            <li>They respond more rapidly than during the first exposure.</li>
            <li>Memory B cells divide and give rise to antibody-producing cells, so large quantities of specific antibodies are produced quickly.</li>
            <li>The pathogen can be destroyed before symptoms develop.</li>
        </ol>
        <p>This faster, larger response is called a <strong>secondary immune response</strong>.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table vaccine46-table">
            <caption>Only component 3 represents memory cells</caption>
            <colgroup><col style="width:25%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. 1 only</th><td>Incorrect — component 1 is the antigen that triggers the response.</td></tr>
                <tr><th scope="row">B. 2 and 3</th><td>Incorrect — component 2 represents antibodies, not memory cells.</td></tr>
                <tr><th scope="row">C. 2 only</th><td>Incorrect — antibodies are not memory cells.</td></tr>
                <tr><th scope="row">D. 3 only</th><td><strong>Correct — memory cells enable long-term immunity.</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: active and passive immunity</h3>
        <table class="comparison-table vaccine46-table">
            <caption>Compare how protection is acquired</caption>
            <colgroup><col style="width:26%"><col><col></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Active immunity</th><th scope="col">Passive immunity</th></tr></thead>
            <tbody>
                <tr><th scope="row">Antibodies</th><td>Produced by the person's own immune system</td><td>Received from another individual</td></tr>
                <tr><th scope="row">Memory cells</th><td>Produced in response to the antigen</td><td>Not generated in the recipient by the transferred antibodies</td></tr>
                <tr><th scope="row">Protection</th><td>Usually long-lasting</td><td>Temporary</td></tr>
                <tr><th scope="row">Example</th><td>Vaccination</td><td>Antibodies transferred through the placenta</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key principle:</strong> Vaccination stimulates the production of specific antibodies and memory cells, providing active immunity. Transferred antibodies provide passive immunity without generating memory cells in the recipient.</p>
        <p class="relationship">Final answer: D — 3 only (memory cells).</p>
    `
},
{
    title: "A student investigated the effect of humidity on transpiration using identical-sized plants of the same species. Which statement describes and explains the results?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the correct comparison of transpiration in tubes X and Y and its explanation",
    context: `
        <figure class="humidity47-apparatus">
            <div class="humidity47-apparatus-grid">
                <div class="humidity47-tube">
                    <h3>Tube X<span>Without a plastic bag</span></h3>
                    <svg viewBox="0 0 220 330" role="img" aria-labelledby="humidity47-x-title humidity47-x-desc" xmlns="http://www.w3.org/2000/svg">
                        <title id="humidity47-x-title">Tube X, uncovered plant</title>
                        <desc id="humidity47-x-desc">A leafy plant stands in a tube of water. An oil layer covers the water surface. The leaves are exposed to the surrounding air.</desc>
                        <path d="M84 210 H136 V289 C136 324 84 324 84 289Z" fill="#d0e7f0"/>
                        <path d="M84 202 H136 V210 H84Z" fill="#d7b16c" stroke="#61766c" stroke-width="1.5"/>
                        <path d="M84 178 V289 C84 324 136 324 136 289 V178" fill="none" stroke="#526c62" stroke-width="3"/>
                        <g fill="#e1ecd6" stroke="#1e654f" stroke-width="2.5" stroke-linejoin="round">
                            <path d="M110 72 C89 52 105 29 110 18 C128 43 126 63 110 72Z"/>
                            <path d="M110 110 C77 113 58 86 62 68 C85 76 105 80 110 110Z"/>
                            <path d="M110 133 C145 129 161 107 158 83 C131 90 111 101 110 133Z"/>
                            <path d="M110 156 C78 160 56 139 56 119 C80 122 104 132 110 156Z"/>
                            <path d="M110 176 C141 176 165 154 164 135 C138 141 118 150 110 176Z"/>
                            <path d="M110 286 C104 247 105 222 110 190 V65" fill="none"/>
                        </g>
                    </svg>
                </div>
                <div class="humidity47-tube">
                    <h3>Tube Y<span>Leaves covered by a plastic bag</span></h3>
                    <svg viewBox="0 0 220 330" role="img" aria-labelledby="humidity47-y-title humidity47-y-desc" xmlns="http://www.w3.org/2000/svg">
                        <title id="humidity47-y-title">Tube Y, plant covered by a bag</title>
                        <desc id="humidity47-y-desc">An identical-sized leafy plant stands in a tube of water with an oil layer covering the water surface. A plastic bag surrounds its leaves.</desc>
                        <path d="M84 210 H136 V289 C136 324 84 324 84 289Z" fill="#d0e7f0"/>
                        <path d="M84 202 H136 V210 H84Z" fill="#d7b16c" stroke="#61766c" stroke-width="1.5"/>
                        <path d="M84 178 V289 C84 324 136 324 136 289 V178" fill="none" stroke="#526c62" stroke-width="3"/>
                        <path d="M82 224 C93 201 72 181 56 151 C20 88 34 7 107 7 C176 7 195 77 170 140 C151 183 127 199 139 224" fill="#eff4f2" fill-opacity=".3" stroke="#61766c" stroke-width="2.5" stroke-dasharray="6 4"/>
                        <g fill="#e1ecd6" stroke="#1e654f" stroke-width="2.5" stroke-linejoin="round">
                            <path d="M110 72 C89 52 105 29 110 18 C128 43 126 63 110 72Z"/>
                            <path d="M110 110 C77 113 58 86 62 68 C85 76 105 80 110 110Z"/>
                            <path d="M110 133 C145 129 161 107 158 83 C131 90 111 101 110 133Z"/>
                            <path d="M110 156 C78 160 56 139 56 119 C80 122 104 132 110 156Z"/>
                            <path d="M110 176 C141 176 165 154 164 135 C138 141 118 150 110 176Z"/>
                            <path d="M110 286 C104 247 105 222 110 190 V65" fill="none"/>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="humidity47-legend" aria-label="Diagram key">
                <span><i class="humidity47-oil" aria-hidden="true"></i>Oil layer</span>
                <span><i class="humidity47-water" aria-hidden="true"></i>Water</span>
            </div>
            <figcaption>Oil covers the water surface in both tubes. The masses of water were measured at the start and after five days.</figcaption>
        </figure>
        <table class="comparison-table humidity47-table">
            <caption>Mass of water in each tube</caption>
            <colgroup><col style="width:18%"><col><col></colgroup>
            <thead><tr><th scope="col">Tube</th><th scope="col">At the start / g</th><th scope="col">After five days / g</th></tr></thead>
            <tbody>
                <tr><th scope="row">X</th><td>40.3</td><td>34.6</td></tr>
                <tr><th scope="row">Y</th><td>41.0</td><td>39.4</td></tr>
            </tbody>
        </table>
    `,
    options: [
        "Transpiration in tube Y was higher than in tube X because the plastic bag decreased the humidity.",
        "Transpiration in tube Y was higher than in tube X because the plastic bag increased the humidity.",
        "Transpiration in tube Y was lower than in tube X because the plastic bag decreased the humidity.",
        "Transpiration in tube Y was lower than in tube X because the plastic bag increased the humidity."
    ],
    correct: "D",
    answer: "D. Transpiration in tube Y was lower than in tube X because the plastic bag increased the humidity",
    explanation: `
        <p class="definition">Tube Y lost less water than tube X. The plastic bag increased the humidity around the leaves, reducing the rate of transpiration.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="47">
            <a href="images/online-transpiration-overview.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-transpiration-overview.png" width="960" height="808" alt="Published plant diagram showing water uptake by roots, movement in xylem and water loss from leaves" loading="lazy" decoding="async">
            </a>
            <figcaption>Water moves through the plant and leaves as vapour. A plastic bag raises humidity around the leaves, reducing the vapour gradient and water loss in tube Y. <span class="image-credit">Image: Laurel Jules, via <a href="https://commons.wikimedia.org/wiki/File:Transpiration_Overview.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Calculate the water lost</h3>
        <p class="humidity47-equation">Water lost = initial mass − final mass</p>
        <table class="comparison-table humidity47-table">
            <caption>Water loss over the five-day investigation</caption>
            <colgroup><col style="width:48%"><col><col></colgroup>
            <thead><tr><th scope="col">Measurement</th><th scope="col">Tube X</th><th scope="col">Tube Y</th></tr></thead>
            <tbody>
                <tr><th scope="row">Initial mass</th><td>40.3 g</td><td>41.0 g</td></tr>
                <tr><th scope="row">Final mass</th><td>34.6 g</td><td>39.4 g</td></tr>
                <tr><th scope="row">Water lost in five days</th><td><strong>5.7 g</strong></td><td><strong>1.6 g</strong></td></tr>
                <tr><th scope="row">Average loss per day</th><td>1.14 g/day</td><td>0.32 g/day</td></tr>
            </tbody>
        </table>
        <p><strong>Tube X:</strong> 40.3 − 34.6 = 5.7 g.<br><strong>Tube Y:</strong> 41.0 − 39.4 = 1.6 g.</p>
        <p>Tube Y lost <strong>4.1 g less water</strong> than tube X over five days: 5.7 − 1.6 = 4.1 g.</p>

        <section class="humidity47-lab" id="humidity47-lab" role="group" aria-labelledby="humidity47-title">
    <h3 id="humidity47-title">Explore water loss in tubes X and Y</h3>
    <p class="humidity47-intro">Switch between the measured loss over five days and the calculated average per day. Both tubes use the same scale in each view.</p>
    <div class="humidity47-controls" role="group" aria-label="Choose how to compare water loss">
        <button type="button" data-humidity47-view="total" aria-pressed="true">Total over 5 days</button>
        <button type="button" data-humidity47-view="daily" aria-pressed="false">Average per day</button>
    </div>
    <div class="humidity47-graph" id="humidity47-graph" role="group" aria-labelledby="humidity47-axis-title">
        <p class="humidity47-axis-title" id="humidity47-axis-title">Water lost over 5 days (g)</p>
        <div class="humidity47-axis" aria-hidden="true"><span data-humidity47-tick="0">0</span><span data-humidity47-tick="1">3</span><span data-humidity47-tick="2">6</span></div>
        <div class="humidity47-rows">
            <div class="humidity47-row" data-humidity47-tube="X" aria-label="Tube X, no bag: 5.7 grams of water lost over five days; scale 0 to 6 grams">
                <p class="humidity47-row-label"><span><strong>Tube X</strong><span class="humidity47-condition">No bag · lower humidity</span></span><strong class="humidity47-value" id="humidity47-x-value">5.7 g</strong></p>
                <span class="humidity47-track" aria-hidden="true"><span class="humidity47-fill humidity47-fill-x" id="humidity47-x-bar" style="width:95%"></span></span>
            </div>
            <div class="humidity47-row" data-humidity47-tube="Y" aria-label="Tube Y, plastic bag: 1.6 grams of water lost over five days; scale 0 to 6 grams">
                <p class="humidity47-row-label"><span><strong>Tube Y</strong><span class="humidity47-condition">Plastic bag · higher humidity</span></span><strong class="humidity47-value" id="humidity47-y-value">1.6 g</strong></p>
                <span class="humidity47-track" aria-hidden="true"><span class="humidity47-fill humidity47-fill-y" id="humidity47-y-bar" style="width:26.6666666667%"></span></span>
            </div>
        </div>
    </div>
    <output class="humidity47-reading" id="humidity47-reading" aria-live="polite" aria-atomic="true">Tube Y lost 4.1 g less water than tube X over 5 days.</output>
    <p class="humidity47-calculation" id="humidity47-calculation">Tube X: 40.3 − 34.6 = 5.7 g. Tube Y: 41.0 − 39.4 = 1.6 g. Difference: 5.7 − 1.6 = 4.1 g.</p>
    <p class="humidity47-note">Only the start and end masses were measured. Daily values are averages, not measurements for each day. Dividing both totals by five keeps the relative lengths of the bars the same.</p>
    <p class="humidity47-cause"><strong>Why was Y lower?</strong> The bag traps water vapour, increasing humidity. The smaller water vapour concentration gradient slows diffusion out of the stomata and reduces transpiration.</p>
</section>

        <h3>Step 2: Explain the effect of the plastic bag</h3>
        <ul class="option-explanations">
            <li><strong>Tube X — lower humidity:</strong> The leaves are exposed to the surrounding air. A larger water vapour concentration gradient allows water vapour to diffuse out through the stomata more rapidly, so more water is lost by transpiration.</li>
            <li><strong>Tube Y — higher humidity:</strong> The bag traps water vapour released by the leaves. Humidity increases, the water vapour concentration gradient becomes smaller, and water vapour diffuses out more slowly. Transpiration decreases.</li>
        </ul>

        <h3>Step 3: Compare the results</h3>
        <p>The lower water loss in tube Y supports the conclusion that <strong>higher humidity decreases transpiration</strong>.</p>
        <p>The oil layer prevents direct evaporation from the water surface, so the decrease in the mass of water in each tube mainly represents water taken up by the plant. Most water taken up is lost through transpiration, so this provides an estimate of transpiration.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table humidity47-table">
            <caption>Both the comparison and its explanation must be correct</caption>
            <colgroup><col style="width:16%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — transpiration in Y was lower, and the bag increased humidity.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — the bag increased humidity, but transpiration in Y was lower.</td></tr>
                <tr><th scope="row">C</th><td>Incorrect — transpiration was lower in Y, but the bag increased humidity.</td></tr>
                <tr><th scope="row">D</th><td><strong>Correct — transpiration in Y was lower because humidity increased.</strong></td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip</h3>
        <p class="relationship">Higher humidity → smaller water vapour concentration gradient → slower diffusion of water vapour → lower transpiration rate.</p>
        <p class="exam-tip"><strong>Use the change in mass:</strong> The tubes started with different masses of water, so compare the amount lost over the same five days. Dividing by five gives an average daily loss; it does not show how the rate varied from day to day.</p>
        <p class="relationship">Final answer: D — Lower transpiration in Y because the plastic bag increased the humidity.</p>
    `
},
{
    title: "The graph shows changes in the thickness of the lining of the uterus wall during a menstrual cycle. Which day is the last day of menstruation?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the day that best represents the end of menstruation",
    context: `
        <figure class="cycle48-context">
            <p class="cycle48-axis-label">Thickness of uterus wall lining</p>
            <svg viewBox="0 0 640 300" role="img" aria-labelledby="cycle48-context-title cycle48-context-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="cycle48-context-title">Uterus lining thickness during a 28-day menstrual cycle</title>
                <desc id="cycle48-context-desc">The lining becomes thinner during the first few days, reaches its minimum shortly before day 7, then thickens. It reaches a high plateau by around day 14 and remains thick through day 28. The vertical axis has no numerical scale.</desc>
                <path class="cycle48-axis" d="M60 30 V260 H600 M60 30 L54 44 M60 30 L66 44 M60 260 V268 M180 260 V268 M320 260 V268 M460 260 V268 M600 260 V268"/>
                <path class="cycle48-curve" d="M60 75 C90 75 98 225 140 235 C190 252 202 170 250 105 C300 42 345 58 600 55"/>
                <g text-anchor="middle"><text x="60" y="295">1</text><text x="180" y="295">7</text><text x="320" y="295">14</text><text x="460" y="295">21</text><text x="600" y="295">28</text></g>
            </svg>
            <p class="cycle48-axis-label">Day of the menstrual cycle</p>
        </figure>
    `,
    options: ["Day 4", "Day 8", "Day 16", "Day 20"],
    correct: "A",
    answer: "A. Day 4",
    explanation: `
        <p class="definition">During <strong>menstruation</strong>, the uterus lining (endometrium) breaks down and is shed. Its thickness decreases. <strong>Day 4 is the best answer among the options given</strong>, near the end of this shedding phase.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="48">
            <a href="images/online-menstrual-cycle.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-menstrual-cycle.png" width="500" height="500" alt="General menstrual cycle chart shows FSH, LH, oestrogen, progesterone, ovarian changes, and changes to the uterus lining" loading="lazy" decoding="async">
            </a>
            <figcaption>General menstrual-cycle changes in four hormones, the ovaries and the uterus lining. Timing varies between cycles; use the question’s own graph for its labelled days or curves. <span class="image-credit">Image: Isometrik, Kaldari; Begoon; Marnanel, via <a href="https://commons.wikimedia.org/wiki/File:Menstrual_cycle.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify menstruation on the graph</h3>
        <ul class="option-explanations">
            <li>The uterus lining breaks down and is shed.</li>
            <li>Blood and tissue leave the body through the vagina.</li>
            <li>The lining becomes thinner, shown by the falling part of the curve early in the cycle.</li>
        </ul>
        <p>In a typical 28-day cycle, menstruation occurs approximately during <strong>days 1–5</strong>. These timings vary between people and cycles.</p>

        <section class="cycle48-lab" id="cycle48-lab" role="group" aria-labelledby="cycle48-title">
    <h3 id="cycle48-title">Explore the four answer days</h3>
    <p class="cycle48-intro">Select a day to locate it on the curve and see what is happening to the lining of the uterus.</p>
    <div class="cycle48-controls" role="group" aria-label="Choose a day of the menstrual cycle">
        <button type="button" data-cycle48-day="4" aria-pressed="true">Day 4</button>
        <button type="button" data-cycle48-day="8" aria-pressed="false">Day 8</button>
        <button type="button" data-cycle48-day="16" aria-pressed="false">Day 16</button>
        <button type="button" data-cycle48-day="20" aria-pressed="false">Day 20</button>
    </div>
    <p class="cycle48-y-label">Schematic lining thickness</p>
    <svg class="cycle48-graph" viewBox="0 0 640 300" role="img" aria-labelledby="cycle48-svg-title cycle48-svg-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="cycle48-svg-title">Day 4 on a schematic menstrual-cycle graph</title>
        <desc id="cycle48-svg-desc">Lining thickness decreases at the start of the cycle, then increases and levels off. Day 4 is on the decreasing section during menstruation. Thickness has no numerical scale.</desc>
        <path class="cycle48-axis" d="M60 28 V260 H608 M60 260 V268 M180 260 V268 M320 260 V268 M460 260 V268 M600 260 V268"/>
        <path class="cycle48-curve" id="cycle48-curve" d="M60 75 C90 75 98 225 140 235 C190 252 202 170 250 105 C300 42 345 58 600 55"/>
        <line class="cycle48-active-line" id="cycle48-active-line" x1="120" x2="120" y1="217.198" y2="260"/>
        <circle class="cycle48-active-point" id="cycle48-active-point" cx="120" cy="217.198" r="9"/>
        <g class="cycle48-tick" aria-hidden="true"><text x="60" y="294">1</text><text x="180" y="294">7</text><text x="320" y="294">14</text><text x="460" y="294">21</text><text x="600" y="294">28</text></g>
    </svg>
    <p class="cycle48-x-label">Day of the menstrual cycle</p>
    <output class="cycle48-reading" id="cycle48-reading" aria-live="polite" aria-atomic="true">Day 4 · Menstruation — the best answer among the choices</output>
    <p class="cycle48-explanation" id="cycle48-explanation">The lining is becoming thinner as it is shed. Day 4 is near the end of the usual menstruation phase, approximately days 1–5, and is the best of the four days offered.</p>
    <p class="cycle48-note">This is a schematic 28-day cycle, not a measurement of thickness in millimetres. Menstruation and ovulation timing vary between people and cycles. The curve reaches its minimum around day 6; it does not establish day 4 as the exact final day for every cycle.</p>
</section>

        <h3>Step 2: Identify when menstruation ends</h3>
        <p>Look for the end of the early shedding phase, before the lining starts rebuilding. Of the four choices, <strong>day 4</strong> best fits this stage. By day 8 the lining is rebuilding, while days 16 and 20 are on the thick, maintained part of the curve.</p>
        <p>The graph is schematic. Its low point is around the end of the first week, so the answer should be read as the <strong>best available choice</strong>, rather than an exact day that applies to every menstrual cycle.</p>

        <h3>Step 3: Check the options</h3>
        <table class="comparison-table cycle48-table">
            <caption>Compare the four days with the shape of the curve</caption>
            <colgroup><col style="width:25%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A. Day 4</th><td><strong>Correct — near the end of menstruation; the best of the choices given.</strong></td></tr>
                <tr><th scope="row">B. Day 8</th><td>The uterus lining is already rebuilding.</td></tr>
                <tr><th scope="row">C. Day 16</th><td>The lining is thick following ovulation around day 14.</td></tr>
                <tr><th scope="row">D. Day 20</th><td>The lining remains thick in preparation for possible implantation.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: a typical 28-day cycle</h3>
        <table class="comparison-table cycle48-table">
            <caption>Approximate timings, which can vary</caption>
            <colgroup><col style="width:30%"><col></colgroup>
            <thead><tr><th scope="col">Days</th><th scope="col">Main event</th></tr></thead>
            <tbody>
                <tr><th scope="row">1–5</th><td>Menstruation — the uterus lining is shed.</td></tr>
                <tr><th scope="row">6–13</th><td>The lining repairs and thickens.</td></tr>
                <tr><th scope="row">Around 14</th><td>Ovulation — an egg is released from an ovary.</td></tr>
                <tr><th scope="row">15–28</th><td>The lining is maintained for possible implantation.</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Read the direction of the curve:</strong> Decreasing thickness indicates shedding during menstruation. Increasing thickness indicates repair and rebuilding. A high, level curve indicates that the lining is being maintained.</p>
        <p class="relationship">Final answer: A — Day 4.</p>
    `
},
{
    title: "The diagrams show a reaction involving an enzyme in the human stomach and another process, R. Which row identifies the substrate and the cause of process R?",
    paperCode: "0610/23/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the substrate label and the conditions that cause process R",
    context: `
        <div class="stomach49-diagrams">
    <div class="stomach49-reaction" role="group" aria-label="Three stages of the enzyme-controlled reaction">
        <figure class="stomach49-stage">
            <svg viewBox="0 0 240 150" role="img" aria-labelledby="stomach49-before-title stomach49-before-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="stomach49-before-title">Before the reaction</title>
                <desc id="stomach49-before-desc">A grey rounded shape with a triangular notch faces a separate large triangle labelled 1. A plus sign separates them.</desc>
                <path class="stomach49-enzyme" d="M94 44 A38 38 0 1 0 94 96 L66 70 Z"/>
                <text class="stomach49-label" x="119" y="80">+</text>
                <path class="stomach49-triangle" d="M146 70 L206 14 V126 Z"/>
                <text class="stomach49-label" x="184" y="80">1</text>
            </svg>
            <figcaption>Before the reaction</figcaption>
        </figure>
        <svg class="stomach49-flow-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16 H28 M19 7 L28 16 L19 25"/></svg>
        <figure class="stomach49-stage">
            <svg viewBox="0 0 240 150" role="img" aria-labelledby="stomach49-during-title stomach49-during-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="stomach49-during-title">During the reaction</title>
                <desc id="stomach49-during-desc">The large triangle fits into the triangular notch of the grey rounded shape.</desc>
                <g transform="translate(42 0)">
                    <path class="stomach49-enzyme" d="M94 44 A38 38 0 1 0 94 96 L66 70 Z"/>
                    <path class="stomach49-triangle" d="M66 70 L126 14 V126 Z"/>
                </g>
            </svg>
            <figcaption>During the reaction</figcaption>
        </figure>
        <svg class="stomach49-flow-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 16 H28 M19 7 L28 16 L19 25"/></svg>
        <figure class="stomach49-stage">
            <svg viewBox="0 0 240 150" role="img" aria-labelledby="stomach49-after-title stomach49-after-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="stomach49-after-title">After the reaction</title>
                <desc id="stomach49-after-desc">The grey rounded shape is unchanged. Two smaller triangular pieces, together labelled 2, are separate from it.</desc>
                <path class="stomach49-enzyme" d="M94 44 A38 38 0 1 0 94 96 L66 70 Z"/>
                <text class="stomach49-label" x="119" y="80">+</text>
                <path class="stomach49-triangle" d="M145 47 L192 17 L192 77 Z M145 96 L192 88 L192 137 Z"/>
                <path d="M196 47 L211 64 M196 110 L211 92" fill="none" stroke="#61766c" stroke-width="1.5"/>
                <text class="stomach49-label" x="218" y="88">2</text>
            </svg>
            <figcaption>After the reaction</figcaption>
        </figure>
    </div>
    <p class="stomach49-process-intro">The diagram shows another process, <strong>R</strong>, that affects this enzyme.</p>
    <figure class="stomach49-process">
        <svg viewBox="0 0 400 150" role="img" aria-labelledby="stomach49-r-title stomach49-r-desc" xmlns="http://www.w3.org/2000/svg">
            <title id="stomach49-r-title">Process R affects the grey shape</title>
            <desc id="stomach49-r-desc">An arrow labelled R leads from the original grey rounded shape with a triangular notch to a similar grey shape with a smaller, rounded notch of a different shape.</desc>
            <path class="stomach49-enzyme" d="M94 44 A38 38 0 1 0 94 96 L66 70 Z"/>
            <path class="stomach49-r-arrow" d="M140 75 H254 M241 65 L254 75 L241 85"/>
            <text class="stomach49-label" x="196" y="53">R</text>
            <path class="stomach49-enzyme" d="M354 44 A38 38 0 1 0 354 96 L345 88 Q356 70 345 52 Z"/>
        </svg>
    </figure>
</div>
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Choose the substrate and the cause of process R</caption>
            <colgroup><col style="width:70px"><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Substrate</th><th scope="col">Cause of process R</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A: substrate 1, acidic conditions" aria-pressed="false">A</button></th><td>1</td><td>Acidic conditions</td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B: substrate 1, alkaline conditions" aria-pressed="false">B</button></th><td>1</td><td>Alkaline conditions</td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C: substrate 2, acidic conditions" aria-pressed="false">C</button></th><td>2</td><td>Acidic conditions</td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D: substrate 2, alkaline conditions" aria-pressed="false">D</button></th><td>2</td><td>Alkaline conditions</td></tr>
            </tbody>
        </table>
    `,
    options: ["1; acidic conditions", "1; alkaline conditions", "2; acidic conditions", "2; alkaline conditions"],
    hideAnswerOptions: true,
    correct: "B",
    answer: "B. Substrate 1, alkaline conditions",
    explanation: `
        <p class="definition"><strong>Component 1 is the substrate.</strong> Process R changes the enzyme's active-site shape: this is <strong>denaturation</strong>. For an enzyme adapted to the acidic stomach, alkaline conditions can cause this change.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="49">
            <a href="images/online-enzyme-reaction.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-enzyme-reaction.png" width="500" height="1186" alt="Four stages show a substrate binding an enzyme, reacting, and releasing two products" loading="lazy" decoding="async">
            </a>
            <figcaption>General enzyme reaction: a substrate binds at the active site, reacts, then products leave the enzyme. <span class="image-credit">Image: domdomegg, via <a href="https://commons.wikimedia.org/wiki/File:Lock_and_key_enzyme_mechanism.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the substrate</h3>
        <ul class="option-explanations">
            <li>The grey shape represents the enzyme.</li>
            <li>The large triangular shape labelled <strong>1</strong> fits into the active site, so it is the <strong>substrate</strong>.</li>
            <li>The enzyme breaks the substrate into the smaller pieces labelled <strong>2</strong>, which are the <strong>products</strong>.</li>
            <li>The enzyme is unchanged after the normal reaction and can be reused.</li>
        </ul>
        <p class="relationship">1 = substrate · 2 = products</p>

        <h3>Step 2: Identify process R</h3>
        <p>In the second diagram, the enzyme's active site changes shape. This process is called <strong>denaturation</strong>.</p>
        <ol class="statement-list">
            <li>The enzyme's three-dimensional structure changes.</li>
            <li>The shape of its active site changes.</li>
            <li>The substrate can no longer fit into the active site effectively.</li>
            <li>The enzyme loses its catalytic activity.</li>
        </ol>

        <h3>Step 3: Explain why alkaline conditions cause R</h3>
        <p>The human stomach is acidic because it contains <strong>hydrochloric acid</strong>. An important stomach enzyme is <strong>pepsin</strong>, a protease that digests proteins and works best at approximately <strong>pH 2</strong>.</p>
        <p>Alkaline conditions are far from pepsin's optimum pH. They can alter its structure and denature it, changing the active site. Therefore, <strong>alkaline conditions</strong> are the cause of R in this question.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Both the substrate label and the cause must be correct</caption>
            <colgroup><col style="width:15%"><col style="width:20%"><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Substrate</th><th scope="col">Cause of R</th><th scope="col">Result</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>1</td><td>Acidic conditions</td><td>Incorrect — the enzyme normally works in the acidic stomach.</td></tr>
                <tr><th scope="row">B</th><td>1</td><td>Alkaline conditions</td><td><strong>Correct — 1 binds to the active site, and alkaline conditions can denature this stomach enzyme.</strong></td></tr>
                <tr><th scope="row">C</th><td>2</td><td>Acidic conditions</td><td>Incorrect — 2 represents products; acidic conditions suit this enzyme.</td></tr>
                <tr><th scope="row">D</th><td>2</td><td>Alkaline conditions</td><td>Incorrect — the condition is correct, but 2 represents products.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: optimum pH depends on the enzyme</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Examples of digestive enzymes and their approximate optimum pH</caption>
            <thead><tr><th scope="col">Enzyme</th><th scope="col">Location</th><th scope="col">Approximate optimum pH</th></tr></thead>
            <tbody>
                <tr><th scope="row">Pepsin</th><td>Stomach</td><td>2 — acidic</td></tr>
                <tr><th scope="row">Salivary amylase</th><td>Mouth</td><td>7 — neutral</td></tr>
                <tr><th scope="row">Trypsin</th><td>Small intestine</td><td>8 — alkaline</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key principle:</strong> A pH far from an enzyme's optimum can alter its active-site shape and cause denaturation. Acidic conditions suit pepsin, while alkaline conditions suit enzymes such as trypsin.</p>
        <p class="relationship">Final answer: B — Substrate 1, alkaline conditions.</p>
    `
},
{
    title: "The graph shows the changing concentrations of hormones involved in the menstrual cycle. Which option correctly identifies W and Y?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the correct identities of hormones W and Y",
    context: `
        <figure class="hormone50-context">
    <p class="hormone50-axis-label">Hormone concentration</p>
    <svg class="hormone50-graph" viewBox="0 0 680 340" role="img" aria-labelledby="hormone50-context-title hormone50-context-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="hormone50-context-title">Hormone concentration during a 28-day menstrual cycle</title>
        <desc id="hormone50-context-desc">Four curves are shown. The solid curve W has a tall, narrow peak around day 14. The dashed curve Y peaks before day 14 and rises again later. A dotted curve rises after day 14. A dash-dot curve has a smaller rise around day 14. Numerical concentrations are not given.</desc>
        <path class="hormone50-axis" d="M60 25 V280 H620 M60 25 L54 39 M60 25 L66 39 M60 280 V288 M200 280 V288 M340 280 V288 M480 280 V288 M620 280 V288"/>
        <path class="hormone50-curve hormone50-lh" d="M60 215 C140 210 215 205 280 180 C310 165 326 120 335 75 C339 25 343 20 347 75 C353 165 375 205 420 218 C470 227 555 230 620 230"/>
        <path class="hormone50-curve hormone50-y" d="M60 244 C150 244 205 230 255 190 C280 165 295 140 310 132 C322 128 332 148 344 168 C365 200 390 201 420 191 C460 176 490 153 520 145 C570 127 592 162 608 205 C614 220 617 229 620 232"/>
        <path class="hormone50-curve hormone50-progesterone" d="M60 250 C160 250 230 250 280 250 C320 250 342 238 360 215 C385 175 410 149 445 135 C480 122 515 118 550 122 C590 127 600 164 609 205 C613 220 617 230 620 232"/>
        <path class="hormone50-curve hormone50-fsh" d="M60 197 C145 200 210 225 270 238 C295 246 308 232 325 197 C335 177 342 180 350 199 C360 224 400 229 470 235 C535 238 578 240 620 230"/>
        <path class="hormone50-leader" d="M345 40 L383 20 M500 156 L545 183"/>
        <text class="hormone50-letter" x="403" y="31">W</text>
        <text class="hormone50-letter" x="566" y="198">Y</text>
        <g class="hormone50-ticks" aria-hidden="true"><text x="60" y="324">0</text><text x="200" y="324">7</text><text x="340" y="324">14</text><text x="480" y="324">21</text><text x="620" y="324">28</text></g>
    </svg>
    <p class="hormone50-axis-label hormone50-x-label">Day of the menstrual cycle</p>
    <figcaption>The curves show changing hormone concentrations. No numerical concentration scale is given.</figcaption>
</figure>
    `,
    options: [
        "W is FSH and Y is oestrogen.",
        "W is LH and Y is oestrogen.",
        "W is progesterone and Y is FSH.",
        "W is progesterone and Y is LH."
    ],
    correct: "B",
    answer: "B. W is LH and Y is oestrogen",
    explanation: `
        <p class="definition"><strong>W is luteinising hormone (LH)</strong>, recognised by its sharp surge around day 14. <strong>Y is oestrogen</strong>, which peaks before ovulation and rises again during the second half of the cycle.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="50">
            <a href="images/online-menstrual-cycle.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-menstrual-cycle.png" width="500" height="500" alt="General menstrual cycle chart shows FSH, LH, oestrogen, progesterone, ovarian changes, and changes to the uterus lining" loading="lazy" decoding="async">
            </a>
            <figcaption>General menstrual-cycle changes in four hormones, the ovaries and the uterus lining. Timing varies between cycles; use the question’s own graph for its labelled days or curves. <span class="image-credit">Image: Isometrik, Kaldari; Begoon; Marnanel, via <a href="https://commons.wikimedia.org/wiki/File:Menstrual_cycle.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <section class="hormone50-lab" id="hormone50-lab" role="group" aria-labelledby="hormone50-title">
    <h3 id="hormone50-title">Recognise the four hormone patterns</h3>
    <p class="hormone50-intro">Select a hormone to highlight its curve and review its function. The line patterns also identify the curves.</p>
    <div class="hormone50-controls" role="group" aria-label="Highlight a hormone">
        <button type="button" data-hormone50="lh" aria-pressed="true"><svg viewBox="0 0 52 10" aria-hidden="true"><path d="M2 5 H50"/></svg><span>LH · W</span></button>
        <button type="button" data-hormone50="oestrogen" aria-pressed="false"><svg viewBox="0 0 52 10" aria-hidden="true"><path d="M2 5 H50" stroke-dasharray="10 7"/></svg><span>Oestrogen · Y</span></button>
        <button type="button" data-hormone50="progesterone" aria-pressed="false"><svg viewBox="0 0 52 10" aria-hidden="true"><path d="M2 5 H50" stroke-dasharray="1 7"/></svg><span>Progesterone</span></button>
        <button type="button" data-hormone50="fsh" aria-pressed="false"><svg viewBox="0 0 52 10" aria-hidden="true"><path d="M2 5 H50" stroke-dasharray="14 6 2 6"/></svg><span>FSH</span></button>
    </div>
    <p class="hormone50-axis-label">Schematic hormone concentration</p>
    <svg class="hormone50-graph" viewBox="0 0 680 340" role="img" aria-labelledby="hormone50-svg-title hormone50-svg-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="hormone50-svg-title">LH · W highlighted on a menstrual-cycle hormone graph</title>
        <desc id="hormone50-svg-desc">The solid LH curve labelled W is highlighted: a tall narrow surge around day 14 triggers ovulation. The dashed oestrogen curve Y has a peak before day 14 and another later in the cycle. The dotted progesterone curve rises after day 14, and the dash-dot FSH curve has a smaller rise around day 14. Numerical concentrations are not given.</desc>
        <path class="hormone50-axis" d="M60 25 V280 H620 M60 25 L54 39 M60 25 L66 39 M60 280 V288 M200 280 V288 M340 280 V288 M480 280 V288 M620 280 V288"/>
        <path class="hormone50-curve hormone50-lh is-active" data-hormone50-curve="lh" d="M60 215 C140 210 215 205 280 180 C310 165 326 120 335 75 C339 25 343 20 347 75 C353 165 375 205 420 218 C470 227 555 230 620 230"/>
        <path class="hormone50-curve hormone50-y" data-hormone50-curve="oestrogen" d="M60 244 C150 244 205 230 255 190 C280 165 295 140 310 132 C322 128 332 148 344 168 C365 200 390 201 420 191 C460 176 490 153 520 145 C570 127 592 162 608 205 C614 220 617 229 620 232"/>
        <path class="hormone50-curve hormone50-progesterone" data-hormone50-curve="progesterone" d="M60 250 C160 250 230 250 280 250 C320 250 342 238 360 215 C385 175 410 149 445 135 C480 122 515 118 550 122 C590 127 600 164 609 205 C613 220 617 230 620 232"/>
        <path class="hormone50-curve hormone50-fsh" data-hormone50-curve="fsh" d="M60 197 C145 200 210 225 270 238 C295 246 308 232 325 197 C335 177 342 180 350 199 C360 224 400 229 470 235 C535 238 578 240 620 230"/>
        <path class="hormone50-leader" d="M345 40 L383 20 M500 156 L545 183"/>
        <text class="hormone50-letter" x="403" y="31">W</text>
        <text class="hormone50-letter" x="566" y="198">Y</text>
        <g class="hormone50-ticks" aria-hidden="true"><text x="60" y="324">0</text><text x="200" y="324">7</text><text x="340" y="324">14</text><text x="480" y="324">21</text><text x="620" y="324">28</text></g>
    </svg>
    <p class="hormone50-axis-label hormone50-x-label">Day of the menstrual cycle</p>
    <output class="hormone50-reading" id="hormone50-reading" aria-live="polite" aria-atomic="true">LH · W — Triggers ovulation</output>
    <p class="hormone50-pattern" id="hormone50-pattern">The solid curve W has a tall, narrow surge around day 14. This LH surge triggers release of an egg from a mature ovarian follicle.</p>
    <p class="hormone50-note">These curves are schematic, with no numerical concentration scale. A typical 28-day cycle is shown; hormone patterns and timing can vary.</p>
</section>

        <h3>Step 1: Identify W — luteinising hormone (LH)</h3>
        <p>The solid curve labelled <strong>W</strong> has a very tall, narrow peak around <strong>day 14</strong>. This is the <strong>LH surge</strong>, which triggers <strong>ovulation</strong>: the release of an egg from a mature ovarian follicle.</p>
        <p class="relationship">W = LH → triggers ovulation</p>

        <h3>Step 2: Identify Y — oestrogen</h3>
        <p>The dashed curve labelled <strong>Y</strong>:</p>
        <ul class="option-explanations">
            <li>Increases during the first half of the cycle.</li>
            <li>Reaches a peak shortly before ovulation.</li>
            <li>Decreases after this first peak.</li>
            <li>Rises again during the second half of the cycle.</li>
        </ul>
        <p>This pattern is characteristic of <strong>oestrogen</strong>, which helps repair and thicken the uterus lining.</p>
        <p class="relationship">Y = oestrogen → repairs and thickens the lining</p>

        <h3>Step 3: Identify all four hormone curves</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Recognise each hormone by its pattern and function</caption>
            <colgroup><col style="width:28%"><col style="width:36%"><col></colgroup>
            <thead><tr><th scope="col">Hormone</th><th scope="col">Pattern in the graph</th><th scope="col">Main function</th></tr></thead>
            <tbody>
                <tr><th scope="row">LH (W)</th><td>Sharp surge around day 14</td><td>Triggers ovulation</td></tr>
                <tr><th scope="row">Oestrogen (Y)</th><td>Peaks before ovulation, then rises again later</td><td>Repairs and thickens the uterus lining</td></tr>
                <tr><th scope="row">Progesterone</th><td>Rises after ovulation; peaks around days 21–24 in this example</td><td>Maintains the uterus lining</td></tr>
                <tr><th scope="row">FSH</th><td>Smaller rise around ovulation</td><td>Stimulates development of ovarian follicles</td></tr>
            </tbody>
        </table>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Both hormone identities must be correct</caption>
            <colgroup><col style="width:20%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — Y is oestrogen, but W is LH, not FSH.</td></tr>
                <tr><th scope="row">B</th><td><strong>Correct — W is LH and Y is oestrogen.</strong></td></tr>
                <tr><th scope="row">C</th><td>Incorrect — W is not progesterone, which rises mainly after ovulation. Y is not FSH.</td></tr>
                <tr><th scope="row">D</th><td>Incorrect — W is LH, not progesterone, and Y is oestrogen, not LH.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: remember the four functions</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Essential hormone keywords</caption>
            <colgroup><col style="width:38%"><col></colgroup>
            <thead><tr><th scope="col">Hormone</th><th scope="col">Essential exam keyword</th></tr></thead>
            <tbody>
                <tr><th scope="row">FSH</th><td>Follicle development</td></tr>
                <tr><th scope="row">LH</th><td>Ovulation</td></tr>
                <tr><th scope="row">Oestrogen</th><td>Thickens uterus lining</td></tr>
                <tr><th scope="row">Progesterone</th><td>Maintains uterus lining</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Graph recognition shortcut:</strong> In a standard menstrual-cycle diagram, a very tall, narrow peak around day 14 indicates the LH surge. Recognise oestrogen by its pre-ovulation peak and its later second rise. These are typical patterns; the exact timing can vary.</p>
        <p class="relationship">Final answer: B — W is LH and Y is oestrogen.</p>
    `
},
{
    title: "What is the synthetic plant hormone 2,4-D used for?",
    paperCode: "",
    paperSession: "",
    legend: "Choose the use of the synthetic plant hormone 2,4-D",
    options: ["Genetic engineering", "Inhibiting phototropism", "Killing weeds", "Promoting germination"],
    correct: "C",
    answer: "C. Killing weeds",
    explanation: `
        <p class="definition"><strong style="overflow-wrap:anywhere">2,4-D (2,4-dichlorophenoxyacetic acid)</strong> is a synthetic auxin. It mimics the action of a natural plant growth hormone and is used as a <strong>selective weedkiller (herbicide)</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="51">
            <a href="images/online-dandelion-broadleaf.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-dandelion-broadleaf.jpg" width="960" height="832" alt="Dandelion rosette showing broad, toothed leaves" loading="lazy" decoding="async">
            </a>
            <figcaption>Dandelion is an example of a broadleaf weed targeted by selective auxin herbicides such as 2,4-D. The photograph does not show a treated plant. <span class="image-credit">Image: SriMesh, via <a href="https://commons.wikimedia.org/wiki/File:DandelionLeaf.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Understand how 2,4-D works</h3>
        <ul class="option-explanations">
            <li>2,4-D acts like the natural plant hormone <strong>auxin</strong>.</li>
            <li>It disrupts normal growth in susceptible weeds, causing abnormal growth and eventually death.</li>
            <li>It is commonly used against <strong>broad-leaved weeds</strong>.</li>
            <li>Many grasses and cereal crops are less sensitive to 2,4-D than these weeds, allowing selective weed control when it is used appropriately.</li>
        </ul>
        <p class="relationship">Synthetic auxin → disrupted, abnormal growth → susceptible weeds die</p>

        <h3>Step 2: Check the options</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Identify the agricultural use of 2,4-D</caption>
            <colgroup><col style="width:20%"><col></colgroup>
            <thead><tr><th scope="col">Option</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — 2,4-D is not used to modify DNA directly.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — its main agricultural use is not preventing growth towards light.</td></tr>
                <tr><th scope="row">C</th><td><strong>Correct — 2,4-D is a selective herbicide used to kill weeds.</strong></td></tr>
                <tr><th scope="row">D</th><td>Incorrect — promoting seed germination is more commonly associated with gibberellins.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: plant hormones and their uses</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Remember the main functions and uses</caption>
            <colgroup><col style="width:38%"><col></colgroup>
            <thead><tr><th scope="col">Plant hormone</th><th scope="col">Main function or use</th></tr></thead>
            <tbody>
                <tr><th scope="row">Auxin</th><td>Cell elongation in shoots; phototropism and gravitropism</td></tr>
                <tr><th scope="row">Synthetic auxin (2,4-D)</th><td>Selective weedkiller</td></tr>
                <tr><th scope="row">Gibberellin</th><td>Promotes seed germination</td></tr>
                <tr><th scope="row">Ethene</th><td>Promotes fruit ripening</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key principle:</strong> 2,4-D mimics auxin and disrupts normal growth in susceptible weeds, causing them to die.</p>
        <p class="relationship">Final answer: C — Killing weeds.</p>
    `
},
{
    title: "The diagram shows the flow of energy through a food chain. Which row correctly labels this energy-flow diagram?",
    paperCode: "0610/23/O/N/22",
    paperSession: "Oct/Nov 2022",
    legend: "Choose the row that correctly identifies all five numbered energy labels",
    context: `
        <figure class="energy52-diagram">
    <svg viewBox="0 0 820 355" role="img" aria-labelledby="energy52-title energy52-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="energy52-title">Numbered energy-flow diagram</title>
        <desc id="energy52-desc">Box 1 points to circle 2. The horizontal chain is 2 to 4 to 6 to 7. An upward-right arrow leaves each circle; the arrow from 4 is labelled 5. Downward arrows from all four circles lead to box 8. One downward arrow from 4 is labelled 3.</desc>
        <defs>
            <marker id="energy52-arrow" markerWidth="8" markerHeight="8" refX="7.5" refY="4" orient="auto">
                <path d="M0 0 L8 4 L0 8Z"/>
            </marker>
        </defs>
        <g class="energy52-arrows" marker-end="url(#energy52-arrow)">
            <path d="M113 68 L140 123"/>
            <path d="M190 150 H325"/>
            <path d="M385 150 H520"/>
            <path d="M580 150 H715"/>
            <path d="M181 128 L230 80"/>
            <path d="M376 128 L425 80"/>
            <path d="M571 128 L620 80"/>
            <path d="M766 128 L805 80"/>
            <path d="M160 180 V282"/>
            <path d="M177 175 L221 282"/>
            <path d="M190 150 C245 150 263 202 275 282"/>
            <path d="M365 178 L400 282"/>
            <path d="M385 150 C438 150 463 205 470 282"/>
            <path d="M560 178 L601 282"/>
            <path d="M580 150 C633 150 652 205 660 282"/>
            <path d="M755 178 L790 282"/>
        </g>
        <g class="energy52-boxes">
            <rect x="35" y="18" width="105" height="50" rx="3"/>
            <circle cx="160" cy="150" r="30"/>
            <circle cx="355" cy="150" r="30"/>
            <circle cx="550" cy="150" r="30"/>
            <circle cx="745" cy="150" r="30"/>
            <rect x="105" y="282" width="690" height="50" rx="3"/>
        </g>
        <g class="energy52-number">
            <text x="87.5" y="56">1</text>
            <text x="160" y="164">2</text>
            <text x="355" y="164">4</text>
            <text x="550" y="164">6</text>
            <text x="745" y="164">7</text>
            <text x="450" y="321">8</text>
        </g>
        <g class="energy52-arrow-number">
            <text x="410" y="232">3</text>
            <text x="385" y="95">5</text>
        </g>
    </svg>
    <figcaption>Use the numbered boxes, circles and arrows to identify the parts of the energy-flow diagram.</figcaption>
</figure>
        <p class="energy52-scroll-hint">Scroll across the table if needed to compare all five labels. The option buttons stay on the left.</p>
        <div class="energy52-options-scroll" tabindex="0" role="group" aria-label="Energy-flow answer table; scroll horizontally to read all columns">
            <table class="comparison-table answer-selection-table energy52-answer-table">
                <caption>Choose the correct row</caption>
                <colgroup><col style="width:70px"><col><col><col><col><col></colgroup>
                <thead><tr><th scope="col">Row</th><th scope="col">Chemical energy in producers</th><th scope="col">Chemical energy in decomposers</th><th scope="col">Energy loss by respiration</th><th scope="col">Energy loss by excretion</th><th scope="col">Chemical energy in tertiary consumers</th></tr></thead>
                <tbody>
                    <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A: producers 2, decomposers 8, respiration 5, excretion 3, tertiary consumers 7" aria-pressed="false">A</button></th><td>2</td><td>8</td><td>5</td><td>3</td><td>7</td></tr>
                    <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B: producers 1, decomposers 7, respiration 5, excretion 3, tertiary consumers 6" aria-pressed="false">B</button></th><td>1</td><td>7</td><td>5</td><td>3</td><td>6</td></tr>
                    <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C: producers 2, decomposers 8, respiration 3, excretion 5, tertiary consumers 7" aria-pressed="false">C</button></th><td>2</td><td>8</td><td>3</td><td>5</td><td>7</td></tr>
                    <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D: producers 1, decomposers 7, respiration 3, excretion 5, tertiary consumers 6" aria-pressed="false">D</button></th><td>1</td><td>7</td><td>3</td><td>5</td><td>6</td></tr>
                </tbody>
            </table>
        </div>
    `,
    options: ["2, 8, 5, 3, 7", "1, 7, 5, 3, 6", "2, 8, 3, 5, 7", "1, 7, 3, 5, 6"],
    hideAnswerOptions: true,
    correct: "A",
    answer: "A. 2, 8, 5, 3, 7",
    explanation: `
        <p class="definition">Energy enters the food chain as light, is stored as chemical energy in organisms, and is transferred by feeding. Energy also passes to decomposers in dead material and organic waste, while respiration ultimately transfers energy to the surroundings as heat.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="52">
            <a href="images/online-ecological-energy-pyramid.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-ecological-energy-pyramid.png" width="960" height="724" alt="Published ecological pyramid showing producers below primary, secondary and tertiary consumers" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting ecological pyramid showing trophic levels and decreasing available energy. It is separate from the numbered energy-flow diagram in the question. <span class="image-credit">Image: Saric, via <a href="https://commons.wikimedia.org/wiki/File:Ecological_pyramid.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the numbered components</h3>
        <table class="comparison-table energy52-explanation-table">
            <caption>Follow the arrows to identify each label</caption>
            <colgroup><col style="width:22%"><col></colgroup>
            <thead><tr><th scope="col">No.</th><th scope="col">Component and explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">1</th><td><strong>Light energy:</strong> Energy entering the food chain from the Sun.</td></tr>
                <tr><th scope="row">2</th><td><strong>Producers:</strong> Convert light energy into chemical energy by photosynthesis.</td></tr>
                <tr><th scope="row">3</th><td><strong>Energy loss by excretion:</strong> Chemical energy carried away in organic waste materials.</td></tr>
                <tr><th scope="row">4</th><td><strong>Primary consumers:</strong> Obtain chemical energy by feeding on producers.</td></tr>
                <tr><th scope="row">5</th><td><strong>Energy loss by respiration:</strong> Energy released from chemical stores is eventually transferred to the surroundings as heat.</td></tr>
                <tr><th scope="row">6</th><td><strong>Secondary consumers:</strong> Feed on primary consumers.</td></tr>
                <tr><th scope="row">7</th><td><strong>Tertiary consumers:</strong> Feed on secondary consumers.</td></tr>
                <tr><th scope="row">8</th><td><strong>Decomposers:</strong> Obtain chemical energy from dead organisms and organic waste.</td></tr>
            </tbody>
        </table>

        <h3>Step 2: Understand the energy flow</h3>
        <p class="relationship">Light energy (1) → producers (2) → primary consumers (4) → secondary consumers (6) → tertiary consumers (7)</p>
        <p>Dead material and organic waste from these trophic levels can transfer chemical energy to <strong>decomposers (8)</strong>.</p>
        <p>The upward arrows show energy transferred away by <strong>respiration (5)</strong>. This energy eventually dissipates as heat; it is not transferred to decomposers as food.</p>
        <p>In this diagram, arrow <strong>3</strong> represents energy carried away by <strong>excretion</strong>. Egestion also transfers chemical energy in undigested material, but it is a different process from the excretion of metabolic waste.</p>

        <h3>Step 3: Check the five labels in order</h3>
        <table class="comparison-table energy52-explanation-table">
            <caption>All five numbers match option A</caption>
            <colgroup><col><col style="width:22%"></colgroup>
            <thead><tr><th scope="col">Component</th><th scope="col">No.</th></tr></thead>
            <tbody>
                <tr><th scope="row">Chemical energy in producers</th><td><strong>2</strong></td></tr>
                <tr><th scope="row">Chemical energy in decomposers</th><td><strong>8</strong></td></tr>
                <tr><th scope="row">Energy loss by respiration</th><td><strong>5</strong></td></tr>
                <tr><th scope="row">Energy loss by excretion</th><td><strong>3</strong></td></tr>
                <tr><th scope="row">Chemical energy in tertiary consumers</th><td><strong>7</strong></td></tr>
            </tbody>
        </table>
        <ul class="option-explanations">
            <li><strong>A. 2, 8, 5, 3, 7:</strong> Correct — all five labels match.</li>
            <li><strong>B. 1, 7, 5, 3, 6:</strong> Incorrect — 1 is light energy, 7 is tertiary consumers and 6 is secondary consumers.</li>
            <li><strong>C. 2, 8, 3, 5, 7:</strong> Incorrect — the labels for respiration and excretion are reversed.</li>
            <li><strong>D. 1, 7, 3, 5, 6:</strong> Incorrect — both the trophic-level labels and the respiration/excretion labels are wrong.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li><strong>Producers:</strong> Convert light energy into chemical energy.</li>
            <li><strong>Consumers:</strong> Obtain chemical energy by feeding on other organisms.</li>
            <li><strong>Respiration:</strong> Transfers energy from chemical stores; energy eventually dissipates as heat.</li>
            <li><strong>Waste and dead material:</strong> Can carry chemical energy to decomposers.</li>
            <li><strong>Decomposers:</strong> Break down dead organisms and organic waste to obtain energy.</li>
        </ul>
        <p class="exam-tip"><strong>Key principle:</strong> Energy flows through a food chain. Not all the energy at one trophic level is transferred to the next, and energy dissipated as heat is not recycled through the food chain.</p>
        <p class="relationship">Final answer: A — 2, 8, 5, 3, 7.</p>
    `
},
{
    title: "Which of these is digested by protease?",
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the molecule that can be digested by protease",
    context: `
        <div class="q53-question">
            <div class="q53-key" role="group" aria-label="Molecular diagram key">
                <strong>Key</strong>
                <span><svg viewBox="0 0 32 26" aria-hidden="true"><rect class="q53-unit" x="6" y="3" width="20" height="20"/></svg>Amino acid</span>
                <span><svg viewBox="0 0 32 26" aria-hidden="true"><circle class="q53-unit" cx="16" cy="13" r="10"/></svg>Glucose</span>
                <span><svg viewBox="0 0 32 26" aria-hidden="true"><path class="q53-bond" d="M2 13 H30"/></svg>Chemical bond</span>
            </div>
            <table class="comparison-table answer-selection-table q53-answer-table">
                <caption>Select the molecule that protease can digest</caption>
                <colgroup><col style="width:70px"><col></colgroup>
                <thead><tr><th scope="col">Row</th><th scope="col">Molecule</th></tr></thead>
                <tbody>
                    <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A: one square" aria-pressed="false">A</button></th><td>
                        <svg class="q53-option-svg" viewBox="0 0 260 70" role="img" aria-labelledby="q53-a-title"><title id="q53-a-title">Option A: one square</title><rect class="q53-unit" x="30" y="25" width="20" height="20"/></svg>
                    </td></tr>
                    <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B: one circle" aria-pressed="false">B</button></th><td>
                        <svg class="q53-option-svg" viewBox="0 0 260 70" role="img" aria-labelledby="q53-b-title"><title id="q53-b-title">Option B: one circle</title><circle class="q53-unit" cx="40" cy="35" r="10"/></svg>
                    </td></tr>
                    <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C: four squares joined by three bonds" aria-pressed="false">C</button></th><td>
                        <svg class="q53-option-svg" viewBox="0 0 260 70" role="img" aria-labelledby="q53-c-title"><title id="q53-c-title">Option C: four squares joined by three bonds</title><path class="q53-bond" d="M40 35 H220"/><rect class="q53-unit" x="30" y="25" width="20" height="20"/><rect class="q53-unit" x="90" y="25" width="20" height="20"/><rect class="q53-unit" x="150" y="25" width="20" height="20"/><rect class="q53-unit" x="210" y="25" width="20" height="20"/></svg>
                    </td></tr>
                    <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D: four circles joined by three bonds" aria-pressed="false">D</button></th><td>
                        <svg class="q53-option-svg" viewBox="0 0 260 70" role="img" aria-labelledby="q53-d-title"><title id="q53-d-title">Option D: four circles joined by three bonds</title><path class="q53-bond" d="M40 35 H220"/><circle class="q53-unit" cx="40" cy="35" r="10"/><circle class="q53-unit" cx="100" cy="35" r="10"/><circle class="q53-unit" cx="160" cy="35" r="10"/><circle class="q53-unit" cx="220" cy="35" r="10"/></svg>
                    </td></tr>
                </tbody>
            </table>
        </div>
    `,
    options: ["A single amino acid", "A single glucose molecule", "A chain of amino acids (protein)", "A chain of glucose molecules"],
    hideAnswerOptions: true,
    correct: "C",
    answer: "C. A chain of amino acids (protein)",
    explanation: `
        <p class="definition"><strong>Protease digests proteins by hydrolysing peptide bonds between amino acids.</strong> Smaller peptides are formed, and further digestion produces amino acids. The chain of amino acids in <strong>option C</strong> is the correct substrate.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="53">
            <a href="images/online-protein-digestion.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-protein-digestion.jpg" width="641" height="803" alt="OpenStax human digestive tract diagram shows protein digestion in the stomach and small intestine" loading="lazy" decoding="async">
            </a>
            <figcaption>Protein digestion begins in the stomach and continues in the small intestine, where amino acids are absorbed. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2429_Digestion_of_Proteins_(Physiology).jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>


        <section class="protease53-lab" id="protease53-lab" role="group" aria-labelledby="protease53-title" data-protease53-selected="C" data-protease53-stage="0">
    <h3 id="protease53-title">Explore what protease can digest</h3>
    <p class="protease53-intro">Choose a molecule, then apply protease. Watch which bonds can be broken.</p>
    <div class="protease53-choices" role="group" aria-label="Choose a molecule for the digestion diagram">
        <button type="button" data-protease53-choice="A" aria-pressed="false">A · Amino acid</button>
        <button type="button" data-protease53-choice="B" aria-pressed="false">B · Glucose</button>
        <button type="button" data-protease53-choice="C" aria-pressed="true">C · Amino-acid chain</button>
        <button type="button" data-protease53-choice="D" aria-pressed="false">D · Glucose chain</button>
    </div>
    <div class="protease53-key" aria-label="Diagram key">
        <span><i class="protease53-key-amino" aria-hidden="true"></i>Amino acid</span>
        <span><i class="protease53-key-glucose" aria-hidden="true"></i>Glucose</span>
        <span><i class="protease53-key-bond" aria-hidden="true"></i>Chemical bond</span>
    </div>
    <p class="protease53-stage" id="protease53-stage">Intact amino-acid chain</p>
    <svg class="protease53-graph" viewBox="0 0 520 180" role="img" aria-labelledby="protease53-svg-title protease53-svg-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="protease53-svg-title">C: intact chain of four amino acids</title>
        <desc id="protease53-svg-desc">Four squares, representing amino acids, are joined by three peptide bonds. No bonds have been broken yet.</desc>
        <g id="protease53-molecule">
            <line class="protease53-bond" data-protease53-bond="0" x1="103" y1="90" x2="177" y2="90"/>
            <line class="protease53-bond" data-protease53-bond="1" x1="223" y1="90" x2="297" y2="90"/>
            <line class="protease53-bond" data-protease53-bond="2" x1="343" y1="90" x2="417" y2="90"/>
            <rect class="protease53-amino" data-protease53-node="amino" x="57" y="67" width="46" height="46" rx="3"/>
            <rect class="protease53-amino" data-protease53-node="amino" x="177" y="67" width="46" height="46" rx="3"/>
            <rect class="protease53-amino" data-protease53-node="amino" x="297" y="67" width="46" height="46" rx="3"/>
            <rect class="protease53-amino" data-protease53-node="amino" x="417" y="67" width="46" height="46" rx="3"/>
        </g>
    </svg>
    <p class="protease53-bond-summary" id="protease53-bond-summary">Four amino acids are joined by three peptide bonds.</p>
    <div class="protease53-actions" role="group" aria-label="Control the digestion diagram">
        <button type="button" data-protease53-action>Apply protease</button>
        <button type="button" class="protease53-reset" data-protease53-reset>Reset diagram</button>
    </div>
    <output class="protease53-reading" id="protease53-reading" aria-live="polite" aria-atomic="true">C selected: apply protease to the amino-acid chain.</output>
    <p class="protease53-note">This short chain represents part of a protein. Proteases hydrolyse peptide bonds to form smaller peptides; further peptide digestion produces amino acids. The final stage is a simplified view of complete protein digestion.</p>
</section>

        <h3>Step 1: Identify the symbols</h3>
        <p>In the diagram's key, a <strong>square represents an amino acid</strong>, a <strong>circle represents glucose</strong>, and a <strong>line represents a chemical bond</strong>.</p>

        <h3>Step 2: Identify the molecules</h3>
        <table class="comparison-table q53-explanation-table">
            <caption>Only the amino-acid chain can be digested by protease</caption>
            <colgroup><col style="width:22%"><col style="width:50%"><col></colgroup>
            <thead><tr><th scope="col">Row</th><th scope="col">Molecule</th><th scope="col">Digested?</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Single amino acid</td><td>No</td></tr>
                <tr><th scope="row">B</th><td>Single glucose molecule</td><td>No</td></tr>
                <tr><th scope="row">C</th><td><strong>Chain of amino acids — a protein model</strong></td><td><strong>Yes</strong></td></tr>
                <tr><th scope="row">D</th><td>Chain of glucose molecules</td><td>No</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Understand how protease works</h3>
        <ul class="option-explanations">
            <li><strong>Proteins:</strong> Amino acids are joined by peptide bonds, which proteases can hydrolyse.</li>
            <li><strong>Single amino acids:</strong> There is no peptide bond to break, so they are already small digestion products.</li>
            <li><strong>Glucose and glucose chains:</strong> These are not protease substrates. The bonds between glucose units are not peptide bonds.</li>
        </ul>
        <p class="relationship">Protein → smaller peptides → amino acids</p>
        <p>The four-square diagram is a simplified model. Real proteins usually contain many more amino acids, and complete digestion involves breaking their peptide bonds into progressively smaller products.</p>

        <h3>IGCSE exam tip: digestive enzymes</h3>
        <table class="comparison-table q53-explanation-table">
            <caption>Match each enzyme with its substrate and products</caption>
            <thead><tr><th scope="col">Enzyme</th><th scope="col">Substrate</th><th scope="col">Products</th></tr></thead>
            <tbody>
                <tr><th scope="row">Protease</th><td>Proteins</td><td>Amino acids, via smaller peptides</td></tr>
                <tr><th scope="row">Amylase</th><td>Starch</td><td>Maltose</td></tr>
                <tr><th scope="row">Maltase</th><td>Maltose</td><td>Glucose</td></tr>
                <tr><th scope="row">Lipase</th><td>Fats</td><td>Fatty acids and glycerol</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key principle:</strong> Proteases hydrolyse peptide bonds between amino acids. They do not digest individual amino acids or glucose molecules.</p>
        <p class="relationship">Final answer: C — A chain of amino acids.</p>
    `
},
{
    title: "A shoot tip was placed on an agar block and lit from one side. Which set of shoots shows the results after one week?",
    paperCode: "0610/23/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the pair of shoot-growth results for agar blocks X and Y",
    context: `
        <div class="auxin54-question">
            <p>Substances can diffuse through agar. Light was shone on the shoot tip from one direction, as shown.</p>
            <figure class="auxin54-setup">
    <div class="auxin54-setup-key" role="group" aria-label="Setup diagram labels">
        <span><i class="auxin54-tip-key" aria-hidden="true"></i>Shoot tip</span>
        <span><i class="auxin54-agar-key" aria-hidden="true"></i>Agar block</span>
    </div>
    <svg viewBox="0 0 480 230" role="img" aria-labelledby="auxin54-setup-title auxin54-setup-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="auxin54-setup-title">Shoot tip on agar with light from the right</title>
        <desc id="auxin54-setup-desc">A shoot tip rests across two halves of an agar block. X is the left half and Y is the right half. A light arrow points leftwards from the right-hand side towards the shoot tip.</desc>
        <path class="auxin54-shoot" d="M204 150 C203 115 211 66 230 66 C249 66 257 115 256 150Z"/>
        <rect class="auxin54-agar" x="180" y="150" width="50" height="44"/>
        <rect class="auxin54-agar" x="230" y="150" width="50" height="44"/>
        <text class="auxin54-setup-letter" x="205" y="173">X</text>
        <text class="auxin54-setup-letter" x="255" y="173">Y</text>
        <path class="auxin54-light-arrow" d="M428 120 H310 M323 109 L310 120 L323 131"/>
        <text class="auxin54-light-label" x="401" y="96">Light</text>
    </svg>
    <figcaption>Light shines from the right towards the shoot tip. Block X is on the left and block Y is on the right.</figcaption>
</figure>
            <p>After three days, the agar was cut in half to form blocks X and Y. Each block was placed on one side of a shoot stem whose tip had been cut off, as shown in the answer diagrams. The blocks were kept on the stems for one week.</p>
        </div>
    `,
    options: [
        `<svg class="auxin54-option-svg" viewBox="0 0 300 210" role="img" aria-labelledby="auxin54-opt-a-title auxin54-opt-a-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="auxin54-opt-a-title">Option A: X bends to the left; Y bends to the left</title>
        <desc id="auxin54-opt-a-desc">The shoot with block X bends to the left. The shoot with block Y bends to the left. Both shoots have had their tips removed, and each agar block rests to the left of the cut stem centre.</desc>
        <path class="auxin54-baseline" d="M28 180 H286"/>
        <g transform="translate(100 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 140 -20 110 -42 81 L-22 69 C2 101 12 139 12 180Z"/>
            <g transform="translate(-32 75) rotate(-30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">X</text>
            </g>
        </g>
        <g transform="translate(230 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 140 -20 110 -42 81 L-22 69 C2 101 12 139 12 180Z"/>
            <g transform="translate(-32 75) rotate(-30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">Y</text>
            </g>
        </g>
    </svg>`,
        `<svg class="auxin54-option-svg" viewBox="0 0 300 210" role="img" aria-labelledby="auxin54-opt-b-title auxin54-opt-b-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="auxin54-opt-b-title">Option B: X bends to the left; Y remains straight</title>
        <desc id="auxin54-opt-b-desc">The shoot with block X bends to the left. The shoot with block Y remains straight. Both shoots have had their tips removed, and each agar block rests to the left of the cut stem centre.</desc>
        <path class="auxin54-baseline" d="M28 180 H286"/>
        <g transform="translate(100 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 140 -20 110 -42 81 L-22 69 C2 101 12 139 12 180Z"/>
            <g transform="translate(-32 75) rotate(-30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">X</text>
            </g>
        </g>
        <g transform="translate(230 0)">
            <path class="auxin54-stem" d="M-12 180 V75 H12 V180Z"/>
            <g transform="translate(0 75) rotate(0)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">Y</text>
            </g>
        </g>
    </svg>`,
        `<svg class="auxin54-option-svg" viewBox="0 0 300 210" role="img" aria-labelledby="auxin54-opt-c-title auxin54-opt-c-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="auxin54-opt-c-title">Option C: X bends to the right; Y remains straight</title>
        <desc id="auxin54-opt-c-desc">The shoot with block X bends to the right. The shoot with block Y remains straight. Both shoots have had their tips removed, and each agar block rests to the left of the cut stem centre.</desc>
        <path class="auxin54-baseline" d="M28 180 H286"/>
        <g transform="translate(100 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 139 -2 101 22 69 L42 81 C20 110 12 140 12 180Z"/>
            <g transform="translate(32 75) rotate(30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">X</text>
            </g>
        </g>
        <g transform="translate(230 0)">
            <path class="auxin54-stem" d="M-12 180 V75 H12 V180Z"/>
            <g transform="translate(0 75) rotate(0)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">Y</text>
            </g>
        </g>
    </svg>`,
        `<svg class="auxin54-option-svg" viewBox="0 0 300 210" role="img" aria-labelledby="auxin54-opt-d-title auxin54-opt-d-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="auxin54-opt-d-title">Option D: X bends to the left; Y bends to the right</title>
        <desc id="auxin54-opt-d-desc">The shoot with block X bends to the left. The shoot with block Y bends to the right. Both shoots have had their tips removed, and each agar block rests to the left of the cut stem centre.</desc>
        <path class="auxin54-baseline" d="M28 180 H286"/>
        <g transform="translate(100 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 140 -20 110 -42 81 L-22 69 C2 101 12 139 12 180Z"/>
            <g transform="translate(-32 75) rotate(-30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">X</text>
            </g>
        </g>
        <g transform="translate(230 0)">
            <path class="auxin54-stem" d="M-12 180 C-12 139 -2 101 22 69 L42 81 C20 110 12 140 12 180Z"/>
            <g transform="translate(32 75) rotate(30)">
                <rect class="auxin54-agar" x="-45" y="-42" width="50" height="42"/>
                <text class="auxin54-block-letter" x="-20" y="-20">Y</text>
            </g>
        </g>
    </svg>`
    ],
    correct: "C",
    answer: "C. Shoot X bends to the right; shoot Y remains straight",
    explanation: `
        <p class="definition"><strong>Block X receives more auxin from the shaded side of the original shoot tip.</strong> When transferred to one side of the cut shoot, it causes unequal cell elongation and a rightward bend. The shoot with block Y remains straight in the results shown.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="54">
            <a href="images/online-phototropism-auxin.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-phototropism-auxin.png" width="960" height="505" alt="Published schematic showing auxin redistribution and a shoot bending towards light" loading="lazy" decoding="async">
            </a>
            <figcaption>General supporting diagram of positive phototropism: greater elongation on the shaded side bends the shoot towards light. The stages and labels are separate from the question. <span class="image-credit">Image: MacKhayman, via <a href="https://commons.wikimedia.org/wiki/File:Phototropism_Diagram.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the direction of light</h3>
        <ul class="option-explanations">
            <li>Light shines on the original shoot tip from the <strong>right</strong>.</li>
            <li>Auxin produced in the tip becomes more concentrated on the <strong>shaded left side</strong>.</li>
            <li>More auxin diffuses into <strong>agar block X</strong> on the left than into block Y on the right.</li>
        </ul>

        <h3>Step 2: Compare the agar blocks</h3>
        <table class="comparison-table auxin54-explanation-table">
            <caption>The blocks carry different amounts of auxin to the cut shoots</caption>
            <colgroup><col style="width:30%"><col></colgroup>
            <thead><tr><th scope="col">Block</th><th scope="col">Auxin and effect</th></tr></thead>
            <tbody>
                <tr><th scope="row">X</th><td><strong>Higher auxin:</strong> Stimulates greater cell elongation in this shoot experiment.</td></tr>
                <tr><th scope="row">Y</th><td><strong>Lower auxin:</strong> Produces much less stimulation of cell elongation.</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Predict the shoot growth</h3>
        <ul class="option-explanations">
            <li><strong>Shoot with block X:</strong> The block supplies more auxin to the side where it is placed. In the diagram this is the left side of the stem, which elongates faster than the opposite side. The shoot bends <strong>to the right</strong>; the faster-growing left side forms the outside of the bend.</li>
            <li><strong>Shoot with block Y:</strong> The block contains less auxin. Under the conditions shown, it does not produce enough unequal elongation for noticeable bending, so the shoot <strong>remains straight</strong>.</li>
        </ul>
        <p>In the second stage, the bend follows the unequal auxin supply from the transferred block. The original lighting stage created the difference between blocks X and Y.</p>

        <h3>Step 4: Check the options</h3>
        <table class="comparison-table auxin54-explanation-table">
            <caption>Compare the directions of both shoots</caption>
            <colgroup><col style="width:22%"><col></colgroup>
            <thead><tr><th scope="col">Row</th><th scope="col">Explanation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect — both shoots bend left. X should bend right and Y should remain straight.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect — Y is straight, but X bends in the wrong direction.</td></tr>
                <tr><th scope="row">C</th><td><strong>Correct — X bends right and Y remains straight.</strong></td></tr>
                <tr><th scope="row">D</th><td>Incorrect — X bends left and Y bends right; neither matches the expected result.</td></tr>
            </tbody>
        </table>

        <h3>IGCSE exam tip: positive phototropism in shoots</h3>
        <p class="relationship">Light from one side → more auxin on the shaded side → greater cell elongation there → shoot bends towards the light.</p>
        <p class="exam-tip"><strong>Key principle:</strong> Auxin stimulates cell elongation in shoots at the concentrations relevant to this experiment. The faster-growing side becomes the outside of the bend. The agar-block test demonstrates the effect of supplying auxin unequally after the tip has been removed.</p>
        <p class="relationship">Final answer: C — Shoot X bends to the right; shoot Y remains straight.</p>
    `
},
{
    title: "Which sequence of statements explains the build-up and removal of an oxygen debt?",
    paperCode: "0610/23/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the correct order of the five statements",
    context: `
        <ol class="statement-list">
            <li>Anaerobic respiration occurs in muscles during vigorous exercise.</li>
            <li>Faster and deeper breathing continues after exercise.</li>
            <li>Glucose is converted to lactic acid.</li>
            <li>Lactic acid builds up in muscles causing an oxygen debt.</li>
            <li>Oxygen enables the continued aerobic respiration of lactic acid.</li>
        </ol>
    `,
    options: ["1 → 3 → 4 → 2 → 5", "1 → 3 → 2 → 4 → 5", "3 → 4 → 5 → 1 → 2", "3 → 4 → 1 → 5 → 2"],
    correct: "A",
    answer: "A. 1 → 3 → 4 → 2 → 5",
    explanation: `
        <p class="definition"><strong>Oxygen debt</strong> is the extra oxygen required after vigorous exercise to process accumulated lactic acid and support recovery. The correct sequence is <strong>1 → 3 → 4 → 2 → 5</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="55">
            <a href="images/online-exercise-oxygen-debt.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-exercise-oxygen-debt.jpg" width="960" height="565" alt="Graph showing oxygen consumption at rest, during exercise and during recovery, with oxygen deficit and oxygen debt marked" loading="lazy" decoding="async">
            </a>
            <figcaption>Oxygen consumption rises during exercise and stays above resting levels during recovery. <span class="image-credit">Image: Henoktade; crop by Belbury, via <a href="https://commons.wikimedia.org/wiki/File:Excess_post-oxygen_consumption_%282%29.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Arrange the events in the correct order</h3>
        <ol class="statement-list">
            <li value="1"><strong>Anaerobic respiration occurs.</strong> During vigorous exercise, oxygen delivery to the muscles cannot meet their energy demand entirely through aerobic respiration.</li>
            <li value="3"><strong>Glucose is converted into lactic acid.</strong> Glucose is broken down incompletely, releasing a small amount of energy.</li>
            <li value="4"><strong>Lactic acid builds up.</strong> Its accumulation is associated with the additional oxygen needed during recovery.</li>
            <li value="2"><strong>Faster and deeper breathing continues after exercise.</strong> Extra oxygen enters the lungs and is carried by the blood.</li>
            <li value="5"><strong>Oxygen debt is repaid.</strong> Oxygen supports the aerobic processing of lactic acid and recovery.</li>
        </ol>

        <h3>Step 2: Understand anaerobic respiration</h3>
        <p>During vigorous exercise, muscles may not receive enough oxygen to meet their energy requirements entirely by aerobic respiration. Anaerobic respiration in human muscles can be represented as:</p>
        <p class="relationship">Glucose → lactic acid</p>
        <p>A small amount of energy is released because glucose is broken down incompletely.</p>
        <p>After exercise, extra oxygen is needed during recovery. Some accumulated lactate is oxidised, while some is transported to the liver and converted back into glucose. These processes help explain the need for continued oxygen uptake after exercise.</p>

        <h3>Step 3: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 1 → 3 → 4 → 2 → 5:</strong> Correct — anaerobic respiration, lactic acid production, accumulation, continued recovery breathing, then repayment of oxygen debt.</li>
            <li><strong>B. 1 → 3 → 2 → 4 → 5:</strong> Incorrect — puts the continued breathing after exercise before lactic acid build-up. Statement 2 specifically describes recovery breathing, even though breathing also increases during exercise.</li>
            <li><strong>C. 3 → 4 → 5 → 1 → 2:</strong> Incorrect — places lactic acid production before anaerobic respiration and repayment before the events that create the debt.</li>
            <li><strong>D. 3 → 4 → 1 → 5 → 2:</strong> Incorrect — places lactic acid production and build-up before anaerobic respiration, and repayment before continued recovery breathing.</li>
        </ul>

        <h3>IGCSE exam tip: aerobic and anaerobic respiration</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare respiration in human muscles</caption>
            <colgroup><col style="width:38%"><col style="width:31%"><col></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Aerobic</th><th scope="col">Anaerobic in muscles</th></tr></thead>
            <tbody>
                <tr><th scope="row">Oxygen required</th><td>Yes</td><td>No</td></tr>
                <tr><th scope="row">Glucose breakdown</th><td>Complete</td><td>Not complete</td></tr>
                <tr><th scope="row">Products</th><td>Carbon dioxide and water</td><td>Lactic acid</td></tr>
                <tr><th scope="row">Energy per glucose</th><td>More</td><td>Less</td></tr>
                <tr><th scope="row">Causes oxygen debt</th><td>No</td><td>Yes, when lactic acid accumulates</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Remember the order:</strong> Anaerobic respiration → lactic acid production → lactic acid accumulation → continued faster and deeper breathing → repayment of oxygen debt.</p>
        <p class="relationship">Final answer: A — 1 → 3 → 4 → 2 → 5.</p>
    `
},
{
    title: "Points 1 and 2 represent two types of structure in the human breathing system. Which row identifies a structure attached to alveoli and a structure containing cartilage?",
    paperCode: "0610/23/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the structure attached to alveoli and the structure containing cartilage",
    context: `
        <figure class="airway56-context">
    <p class="airway56-axis-label">Relative diameter of lumen</p>
    <svg viewBox="0 0 600 360" role="img" aria-labelledby="airway56-title airway56-desc" xmlns="http://www.w3.org/2000/svg">
        <title id="airway56-title">Two breathing-system structures on a relative lumen-diameter graph</title>
        <desc id="airway56-desc">Point 1 is higher and farther left than point 2. Point 1 has a larger relative lumen diameter and a shorter distance from the larynx. Point 2 has a smaller relative lumen diameter and is farther from the larynx. Neither axis has a numerical scale.</desc>
        <path class="airway56-axis" d="M60 30 V310 H560 M54 43 L60 30 L66 43 M547 304 L560 310 L547 316"/>
        <path class="airway56-point" d="M225 105 L245 125 M225 125 L245 105"/>
        <path class="airway56-point" d="M435 235 L455 255 M435 255 L455 235"/>
        <text class="airway56-number" x="235" y="166">1</text>
        <text class="airway56-number" x="445" y="296">2</text>
    </svg>
    <p class="airway56-axis-label airway56-x-label">Distance from the larynx</p>
</figure>
        <table class="comparison-table answer-selection-table" style="table-layout:fixed">
            <caption>Identify the two airway features</caption>
            <colgroup><col style="width:70px"><col><col></colgroup>
            <thead><tr><th scope="col">Row</th><th scope="col">Attached to alveoli</th><th scope="col">Contains cartilage</th></tr></thead>
            <tbody>
                <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select option A: attached to alveoli 1, contains cartilage 1" aria-pressed="false">A</button></th><td>1</td><td>1</td></tr>
                <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select option B: attached to alveoli 1, contains cartilage 2" aria-pressed="false">B</button></th><td>1</td><td>2</td></tr>
                <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select option C: attached to alveoli 2, contains cartilage 1" aria-pressed="false">C</button></th><td>2</td><td>1</td></tr>
                <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select option D: attached to alveoli 2, contains cartilage 2" aria-pressed="false">D</button></th><td>2</td><td>2</td></tr>
            </tbody>
        </table>
    `,
    options: ["Attached to alveoli: 1; contains cartilage: 1", "Attached to alveoli: 1; contains cartilage: 2", "Attached to alveoli: 2; contains cartilage: 1", "Attached to alveoli: 2; contains cartilage: 2"],
    hideAnswerOptions: true,
    correct: "C",
    answer: "C. Structure 2 is attached to alveoli; structure 1 contains cartilage",
    explanation: `
        <p class="definition">The <strong>lumen</strong> is the space inside an airway. Structure <strong>2</strong> is the smaller airway leading to the alveoli, while structure <strong>1</strong> is a larger, cartilage-supported airway.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="56">
            <a href="images/online-trachea-bronchi-cartilage.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-trachea-bronchi-cartilage.jpg" width="960" height="703" alt="Labelled trachea and bronchi next to a microscopic airway section showing hyaline cartilage and cilia" loading="lazy" decoding="async">
            </a>
            <figcaption>The trachea branches into the bronchi; the accompanying tissue image labels hyaline cartilage. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2308_The_Trachea.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="56">
            <a href="images/online-bronchioles-alveoli.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-bronchioles-alveoli.jpg" width="960" height="733" alt="Labelled terminal and respiratory bronchioles leading to alveolar ducts and sacs, surrounded by capillaries" loading="lazy" decoding="async">
            </a>
            <figcaption>Small bronchioles lead to alveolar ducts and sacs where gas exchange occurs. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2309_The_Respiratory_Zone.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify structure 1</h3>
        <ul class="option-explanations">
            <li>Point 1 has a <strong>relatively large lumen</strong>.</li>
            <li>It is a <strong>shorter distance from the larynx</strong>.</li>
        </ul>
        <p>These features are consistent with a larger conducting airway such as a <strong>bronchus</strong>. Bronchi contain <strong>cartilage</strong>, which supports their walls and helps prevent collapse.</p>

        <h3>Step 2: Identify structure 2 — bronchiole</h3>
        <ul class="option-explanations">
            <li>Point 2 has a <strong>smaller lumen</strong>.</li>
            <li>It is a <strong>greater distance from the larynx</strong>.</li>
        </ul>
        <p>This indicates a <strong>bronchiole</strong>. Bronchioles are smaller airways that branch from the bronchi and lead to the alveoli. They <strong>do not contain cartilage</strong>.</p>

        <h3>Step 3: Understand the airway pathway</h3>
        <p class="relationship">Larynx → trachea → bronchus (1) → bronchiole (2) → alveoli</p>
        <p>The <strong>trachea and bronchi</strong> contain cartilage. The <strong>bronchioles</strong> lack cartilage and conduct air towards the alveoli, which are the site of gas exchange.</p>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 1 and 1:</strong> Incorrect — 1 contains cartilage, but 2 is the structure attached to alveoli.</li>
            <li><strong>B. 1 and 2:</strong> Incorrect — the two labels are reversed.</li>
            <li><strong>C. 2 and 1:</strong> Correct — 2 is attached to alveoli, and 1 contains cartilage.</li>
            <li><strong>D. 2 and 2:</strong> Incorrect — 2 leads to alveoli but does not contain cartilage.</li>
        </ul>

        <h3>IGCSE exam tip: bronchus and bronchiole</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Compare the larger and smaller airways</caption>
            <colgroup><col style="width:32%"><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Feature</th><th scope="col">Bronchus</th><th scope="col">Bronchiole</th></tr></thead>
            <tbody>
                <tr><th scope="row">Lumen</th><td>Larger</td><td>Smaller</td></tr>
                <tr><th scope="row">Cartilage</th><td>Present</td><td>Absent</td></tr>
                <tr><th scope="row">Smooth muscle</th><td>Present</td><td>Present</td></tr>
                <tr><th scope="row">Position</th><td>Closer to larynx</td><td>Closer to alveoli</td></tr>
                <tr><th scope="row">Main role</th><td>Conducts air into and within the lungs</td><td>Conducts air towards alveoli</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key principle:</strong> As airways branch towards the alveoli, their individual lumen diameters generally decrease. Cartilage is present in bronchi and absent from bronchioles.</p>
        <p class="relationship">Final answer: C — 2 and 1.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A toxin that is the same shape as a neurotransmitter prevents muscle contraction. Which statement explains why the toxin prevents muscle contraction?</span>',
    paperCode: "0610/22/F/M/24",
    paperSession: "Feb/March 2024",
    legend: "Choose the statement that explains the toxin's effect",
    options: [
        "The toxin blocks the binding of neurotransmitters to receptors on motor neurones.",
        "The toxin increases the release of neurotransmitters from relay neurones.",
        "The toxin increases the release of neurotransmitters from sensory neurones.",
        "The toxin stimulates impulses in motor neurones."
    ],
    correct: "A",
    answer: "A. The toxin blocks the binding of neurotransmitters to receptors on motor neurones",
    explanation: `
        <p class="definition">The toxin has a shape similar to the neurotransmitter, allowing it to occupy the same <strong>receptor binding sites</strong>. In this question, it blocks the normal response, preventing the signal needed for muscle contraction.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="57">
            <a href="images/online-chemical-synapse.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-chemical-synapse.jpg" width="1005" height="930" alt="Chemical synapse showing neurotransmitters released from vesicles and binding to receptors on the postsynaptic membrane" loading="lazy" decoding="async">
            </a>
            <figcaption>Neurotransmitters cross the synaptic cleft and bind to receptors on the postsynaptic membrane. <span class="image-credit">Image: Young, KA.; Wise, JA.; DeSaix, P.; Kruse, DH.; Poe, B.; Johnson, E.; Johnson, JE.; Korol, O.; Betts, JG.; Womble, M. (OpenStax Anatomy and Physiology), via <a href="https://commons.wikimedia.org/wiki/File:1225_Chemical_Synapse.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Understand normal synaptic transmission</h3>
        <ol class="statement-list">
            <li>An electrical impulse reaches the end of a neurone.</li>
            <li>Neurotransmitters are released into the <strong>synaptic cleft</strong>.</li>
            <li>They diffuse across the gap and bind to specific receptors on the next cell.</li>
            <li>This can trigger an electrical impulse in another neurone or a response in a muscle fibre.</li>
        </ol>

        <h3>Step 2: Explain how the toxin works</h3>
        <ul class="option-explanations">
            <li>The toxin's similar shape allows it to <strong>bind to the neurotransmitter's receptors</strong>.</li>
            <li>It occupies the binding sites without triggering the normal response.</li>
            <li>The normal neurotransmitter cannot bind effectively.</li>
            <li>Signal transmission is blocked, so the muscle does not contract.</li>
        </ul>
        <p>This is an example of <strong>competitive receptor blocking</strong>: the toxin acts as a competitive antagonist.</p>
        <p class="relationship">Toxin occupies receptors → neurotransmitter binding is blocked → signal is blocked → muscle does not contract</p>

        <h3>Step 3: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Correct — blocking neurotransmitter binding prevents the normal signal from being transmitted.</li>
            <li><strong>B:</strong> Incorrect — increased release from relay neurones does not explain how the toxin blocks the receptors.</li>
            <li><strong>C:</strong> Incorrect — increased release from sensory neurones does not explain the receptor-blocking effect.</li>
            <li><strong>D:</strong> Incorrect — stimulating impulses in motor neurones would generally promote muscle contraction, provided the signal can reach the muscle.</li>
        </ul>

        <h3>IGCSE exam tip: key synapse terms</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Understand the mechanism of receptor blocking</caption>
            <colgroup><col style="width:34%"><col></colgroup>
            <thead><tr><th scope="col">Term</th><th scope="col">Meaning</th></tr></thead>
            <tbody>
                <tr><th scope="row">Neurotransmitter</th><td>A chemical that transmits a signal across a synapse.</td></tr>
                <tr><th scope="row">Receptor</th><td>A protein with a specific binding site for a signalling molecule.</td></tr>
                <tr><th scope="row">Synaptic cleft</th><td>The small gap between communicating cells at a synapse.</td></tr>
                <tr><th scope="row">Competitive antagonist</th><td>A substance that occupies a receptor and blocks the normal signalling molecule's action.</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Receptor location matters:</strong> At a synapse from another neurone onto a motor neurone, receptors are on the motor neurone. Blocking them can prevent the impulses needed to activate a muscle. At the <strong>neuromuscular junction</strong> itself, neurotransmitter receptors are on the <strong>muscle fibre membrane</strong>, not on the motor neurone. The question does not specify that the toxin acts directly at this junction; A identifies the receptor-blocking mechanism.</p>
        <p class="relationship">Final answer: A — blocking neurotransmitter binding.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A patient is injected with adrenaline. Which graph shows the expected changes to pulse rate and blood glucose concentration?</span>',
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the graph showing the expected effects of adrenaline",
    context: `
        <div class="adrenaline58-question">
            <div class="adrenaline58-key" role="group" aria-label="Graph key">
                <span><svg viewBox="0 0 44 12" aria-hidden="true"><path d="M1 6 H43" stroke-dasharray="7 6"/></svg>Dashed: pulse rate</span>
                <span><svg viewBox="0 0 44 12" aria-hidden="true"><path d="M1 6 H43"/></svg>Solid: blood glucose concentration</span>
            </div>
        </div>
    `,
    options: [
        `<span class="adrenaline58-option">
        <span class="adrenaline58-axis-labels" aria-hidden="true"><span>Pulse rate</span><span>Blood glucose concentration</span></span>
        <svg class="adrenaline58-option-svg" viewBox="0 0 360 230" role="img" aria-labelledby="adrenaline58-opt-a-title adrenaline58-opt-a-desc" xmlns="http://www.w3.org/2000/svg">
            <title id="adrenaline58-opt-a-title">Option A: pulse rate increases; blood glucose concentration decreases</title>
            <desc id="adrenaline58-opt-a-desc">A graph from 0 to 2 minutes after injection, marked every 0.5 minutes. The dashed pulse rate line rises while the solid blood glucose concentration line falls. The left and right vertical axes point upwards and have no numerical scale.</desc>
            <path class="adrenaline58-axis" d="M40 185 V25 M34 32 L40 25 L46 32 M320 185 V25 M314 32 L320 25 L326 32 M40 185 H335 M328 179 L335 185 L328 191"/>
            <path class="adrenaline58-ticks" d="M40 185 V192 M110 185 V192 M180 185 V192 M250 185 V192 M320 185 V192"/>
            <g class="adrenaline58-tick-labels"><text x="40" y="210">0</text><text x="110" y="210">0.5</text><text x="180" y="210">1</text><text x="250" y="210">1.5</text><text x="320" y="210">2</text></g>
            <path class="adrenaline58-glucose" d="M40 35 L110 60 L180 115 L250 145 L320 185"/>
            <path class="adrenaline58-pulse" d="M40 135 L110 125 L180 90 L250 60 L320 35"/>
        </svg>
        <span class="adrenaline58-time-label" aria-hidden="true">Time after injection / minutes</span>
    </span>`,
        `<span class="adrenaline58-option">
        <span class="adrenaline58-axis-labels" aria-hidden="true"><span>Pulse rate</span><span>Blood glucose concentration</span></span>
        <svg class="adrenaline58-option-svg" viewBox="0 0 360 230" role="img" aria-labelledby="adrenaline58-opt-b-title adrenaline58-opt-b-desc" xmlns="http://www.w3.org/2000/svg">
            <title id="adrenaline58-opt-b-title">Option B: pulse rate decreases; blood glucose concentration decreases</title>
            <desc id="adrenaline58-opt-b-desc">A graph from 0 to 2 minutes after injection, marked every 0.5 minutes. The dashed pulse rate line and the solid blood glucose concentration line both fall. The left and right vertical axes point upwards and have no numerical scale.</desc>
            <path class="adrenaline58-axis" d="M40 185 V25 M34 32 L40 25 L46 32 M320 185 V25 M314 32 L320 25 L326 32 M40 185 H335 M328 179 L335 185 L328 191"/>
            <path class="adrenaline58-ticks" d="M40 185 V192 M110 185 V192 M180 185 V192 M250 185 V192 M320 185 V192"/>
            <g class="adrenaline58-tick-labels"><text x="40" y="210">0</text><text x="110" y="210">0.5</text><text x="180" y="210">1</text><text x="250" y="210">1.5</text><text x="320" y="210">2</text></g>
            <path class="adrenaline58-glucose" d="M40 35 L110 60 L180 115 L250 145 L320 185"/>
            <path class="adrenaline58-pulse" d="M40 35 L110 90 L180 135 L250 160 L320 185"/>
        </svg>
        <span class="adrenaline58-time-label" aria-hidden="true">Time after injection / minutes</span>
    </span>`,
        `<span class="adrenaline58-option">
        <span class="adrenaline58-axis-labels" aria-hidden="true"><span>Pulse rate</span><span>Blood glucose concentration</span></span>
        <svg class="adrenaline58-option-svg" viewBox="0 0 360 230" role="img" aria-labelledby="adrenaline58-opt-c-title adrenaline58-opt-c-desc" xmlns="http://www.w3.org/2000/svg">
            <title id="adrenaline58-opt-c-title">Option C: pulse rate increases; blood glucose concentration increases</title>
            <desc id="adrenaline58-opt-c-desc">A graph from 0 to 2 minutes after injection, marked every 0.5 minutes. The dashed pulse rate line and the solid blood glucose concentration line both rise. The left and right vertical axes point upwards and have no numerical scale.</desc>
            <path class="adrenaline58-axis" d="M40 185 V25 M34 32 L40 25 L46 32 M320 185 V25 M314 32 L320 25 L326 32 M40 185 H335 M328 179 L335 185 L328 191"/>
            <path class="adrenaline58-ticks" d="M40 185 V192 M110 185 V192 M180 185 V192 M250 185 V192 M320 185 V192"/>
            <g class="adrenaline58-tick-labels"><text x="40" y="210">0</text><text x="110" y="210">0.5</text><text x="180" y="210">1</text><text x="250" y="210">1.5</text><text x="320" y="210">2</text></g>
            <path class="adrenaline58-glucose" d="M40 160 L110 135 L180 110 L250 85 L320 35"/>
            <path class="adrenaline58-pulse" d="M40 135 L110 125 L180 90 L250 60 L320 35"/>
        </svg>
        <span class="adrenaline58-time-label" aria-hidden="true">Time after injection / minutes</span>
    </span>`,
        `<span class="adrenaline58-option">
        <span class="adrenaline58-axis-labels" aria-hidden="true"><span>Pulse rate</span><span>Blood glucose concentration</span></span>
        <svg class="adrenaline58-option-svg" viewBox="0 0 360 230" role="img" aria-labelledby="adrenaline58-opt-d-title adrenaline58-opt-d-desc" xmlns="http://www.w3.org/2000/svg">
            <title id="adrenaline58-opt-d-title">Option D: pulse rate decreases; blood glucose concentration increases</title>
            <desc id="adrenaline58-opt-d-desc">A graph from 0 to 2 minutes after injection, marked every 0.5 minutes. The dashed pulse rate line falls while the solid blood glucose concentration line rises. The left and right vertical axes point upwards and have no numerical scale.</desc>
            <path class="adrenaline58-axis" d="M40 185 V25 M34 32 L40 25 L46 32 M320 185 V25 M314 32 L320 25 L326 32 M40 185 H335 M328 179 L335 185 L328 191"/>
            <path class="adrenaline58-ticks" d="M40 185 V192 M110 185 V192 M180 185 V192 M250 185 V192 M320 185 V192"/>
            <g class="adrenaline58-tick-labels"><text x="40" y="210">0</text><text x="110" y="210">0.5</text><text x="180" y="210">1</text><text x="250" y="210">1.5</text><text x="320" y="210">2</text></g>
            <path class="adrenaline58-glucose" d="M40 160 L110 135 L180 110 L250 85 L320 35"/>
            <path class="adrenaline58-pulse" d="M40 35 L110 90 L180 135 L250 160 L320 185"/>
        </svg>
        <span class="adrenaline58-time-label" aria-hidden="true">Time after injection / minutes</span>
    </span>`
    ],
    correct: "C",
    answer: "C. Both pulse rate and blood glucose concentration increase",
    explanation: `
        <p class="definition"><strong>Adrenaline</strong> prepares the body for emergencies through the <strong>fight-or-flight response</strong>. It increases both pulse rate and blood glucose concentration, so <strong>graph C</strong> is correct.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="58">
            <a href="images/online-adrenal-gland-hormones.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-adrenal-gland-hormones.jpg" width="1102" height="316" alt="Adrenal gland diagram showing cortex, medulla and the hormones released, including epinephrine from the medulla" loading="lazy" decoding="async">
            </a>
            <figcaption>The adrenal medulla releases epinephrine (adrenaline) and norepinephrine during the stress response. <span class="image-credit">Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:1818_The_Adrenal_Glands.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</span></figcaption>
        </figure>

        <p>Adrenaline is normally released by the <strong>adrenal glands</strong>. In this question, it is supplied directly by an injection.</p>

        <h3>Step 1: Explain the increase in pulse rate</h3>
        <ul class="option-explanations">
            <li>Adrenaline causes the heart to <strong>beat faster</strong>.</li>
            <li>More blood can be pumped around the body per minute.</li>
            <li>This helps deliver more <strong>oxygen and glucose</strong> to the muscles for respiration.</li>
        </ul>
        <p>Therefore, the <strong>dashed pulse-rate line rises</strong>.</p>

        <h3>Step 2: Explain the increase in blood glucose</h3>
        <p>Adrenaline stimulates the breakdown of stored <strong>glycogen in the liver</strong> into glucose.</p>
        <p class="relationship">Liver glycogen → glucose → release into the blood</p>
        <ul class="option-explanations">
            <li>Glucose is released into the bloodstream.</li>
            <li><strong>Blood glucose concentration increases.</strong></li>
            <li>More glucose becomes available as a fuel for respiration in muscle cells.</li>
        </ul>
        <p>Therefore, the <strong>solid blood-glucose line rises</strong>.</p>

        <h3>Step 3: Check the graphs</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Follow the dashed and solid lines separately</caption>
            <colgroup><col style="width:70px"><col><col></colgroup>
            <thead><tr><th scope="col">Row</th><th scope="col">Pulse rate (dashed)</th><th scope="col">Blood glucose (solid)</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Increases</td><td>Decreases</td></tr>
                <tr><th scope="row">B</th><td>Decreases</td><td>Decreases</td></tr>
                <tr><th scope="row">C</th><td><strong>Increases</strong></td><td><strong>Increases</strong></td></tr>
                <tr><th scope="row">D</th><td>Decreases</td><td>Increases</td></tr>
            </tbody>
        </table>
        <p><strong>Only C shows both increasing.</strong> A shows blood glucose falling, B shows both falling, and D shows pulse rate falling.</p>
        <p>The two vertical axes represent different quantities and have no numerical values. Compare the <strong>direction of change</strong> of each line; their heights do not mean pulse rate and blood glucose have the same value or units.</p>

        <h3>IGCSE exam tip: effects of adrenaline</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Prepare the body for rapid physical activity</caption>
            <colgroup><col style="width:64%"><col></colgroup>
            <thead><tr><th scope="col">Body response</th><th scope="col">Effect</th></tr></thead>
            <tbody>
                <tr><th scope="row">Heart rate</th><td>Increases</td></tr>
                <tr><th scope="row">Breathing rate</th><td>Increases</td></tr>
                <tr><th scope="row">Blood glucose concentration</th><td>Increases</td></tr>
                <tr><th scope="row">Blood flow to skeletal muscles</th><td>Increases</td></tr>
                <tr><th scope="row">Pupil diameter</th><td>Increases</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Key concept:</strong> Adrenaline prepares the body for rapid activity by increasing the supply of oxygen and glucose to muscles. Remember the graph key: <strong>dashed = pulse rate; solid = blood glucose concentration</strong>.</p>
        <p class="relationship">Final answer: C — pulse rate increases and blood glucose concentration increases.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The diagram shows the positions of two endocrine glands in the human body. What is a response of the body to the hormone released from these glands?</span>',
    paperCode: "0610/22/M/J/25",
    paperSession: "May/June 2025",
    legend: "Choose the response to the hormone released from the glands shown",
    context: `
        <figure class="explanation-photo">
            <img src="images/question-59.png" alt="Positions of two endocrine glands above the kidneys">
        </figure>
    `,
    options: [
        "a decrease in heart rate",
        "a decrease in blood glucose concentration",
        "an increase in pupil diameter",
        "the development of secondary sexual characteristics"
    ],
    correct: "C",
    answer: "C. An increase in pupil diameter",
    explanation: `
        <p class="definition">The glands above the kidneys are the <strong>adrenal glands</strong>. They release <strong>adrenaline</strong>, which prepares the body for the <strong>fight-or-flight response</strong>. One effect is an <strong>increase in pupil diameter</strong>.</p>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="59">
            <a href="images/online-pupil-constriction-dilation.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded explanation image at full size">
                <img src="images/online-pupil-constriction-dilation.jpg" width="960" height="320" alt="Two photographs of the same human eye, with a smaller pupil in bright light on the left and a larger pupil in dim light on the right" loading="lazy" decoding="async">
            </a>
            <figcaption>Pupil constriction and dilation: this photo comparison shows the light response, with a larger pupil on the right. <span class="image-credit">Image: Rapidreflex, via <a href="https://commons.wikimedia.org/wiki/File:Pupillary_light_reflex.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</span></figcaption>
        </figure>


        <h3>Step 1: Identify the endocrine glands</h3>
        <ul class="option-explanations">
            <li>One adrenal gland is located <strong>above each kidney</strong>.</li>
            <li>The glands release adrenaline into the bloodstream during stressful, frightening or dangerous situations.</li>
            <li>Adrenaline helps prepare the body for rapid physical activity.</li>
        </ul>

        <h3>Step 2: Understand the effects of adrenaline</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Changes during the fight-or-flight response</caption>
            <colgroup><col style="width:64%"><col></colgroup>
            <thead><tr><th scope="col">Body response</th><th scope="col">Effect of adrenaline</th></tr></thead>
            <tbody>
                <tr><th scope="row">Heart rate</th><td>Increases</td></tr>
                <tr><th scope="row">Breathing rate</th><td>Increases</td></tr>
                <tr><th scope="row">Blood glucose concentration</th><td>Increases</td></tr>
                <tr><th scope="row">Pupil diameter</th><td><strong>Increases</strong></td></tr>
                <tr><th scope="row">Blood flow to skeletal muscles</th><td>Increases</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Explain the increase in pupil diameter</h3>
        <ul class="option-explanations">
            <li>Adrenaline is released into the bloodstream as part of the fight-or-flight response.</li>
            <li>The pupils <strong>dilate</strong>: their diameter becomes larger.</li>
            <li>A wider pupil allows <strong>more light to enter the eye</strong>.</li>
        </ul>
        <figure class="adrenal59-pupil-comparison" aria-labelledby="adrenal59-pupil-caption">
    <figcaption id="adrenal59-pupil-caption">Effect of adrenaline on the pupil</figcaption>
    <div class="adrenal59-eye-grid">
        <div class="adrenal59-eye-panel">
            <p class="adrenal59-eye-label">Normal pupil</p>
            <svg class="adrenal59-eye-svg" viewBox="0 0 280 150" role="img" aria-labelledby="adrenal59-normal-eye-title adrenal59-normal-eye-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="adrenal59-normal-eye-title">Eye with a normal pupil</title>
                <desc id="adrenal59-normal-eye-desc">The black pupil is smaller than in the dilated eye. Both drawings have an iris of the same size.</desc>
                <path class="adrenal59-eye-white" d="M15 75 Q68 14 140 16 Q212 14 265 75 Q212 136 140 134 Q68 136 15 75Z"/>
                <circle class="adrenal59-iris" cx="140" cy="75" r="53"/>
                <circle class="adrenal59-pupil" cx="140" cy="75" r="21"/>
            </svg>
            <p class="adrenal59-eye-note">Smaller diameter</p>
        </div>
        <div class="adrenal59-eye-panel">
            <p class="adrenal59-eye-label">Dilated pupil</p>
            <svg class="adrenal59-eye-svg" viewBox="0 0 280 150" role="img" aria-labelledby="adrenal59-dilated-eye-title adrenal59-dilated-eye-desc" xmlns="http://www.w3.org/2000/svg">
                <title id="adrenal59-dilated-eye-title">Eye with a dilated pupil</title>
                <desc id="adrenal59-dilated-eye-desc">After adrenaline, the black pupil has a larger diameter. The iris is the same size as in the normal-eye drawing.</desc>
                <path class="adrenal59-eye-white" d="M15 75 Q68 14 140 16 Q212 14 265 75 Q212 136 140 134 Q68 136 15 75Z"/>
                <circle class="adrenal59-iris" cx="140" cy="75" r="53"/>
                <circle class="adrenal59-pupil" cx="140" cy="75" r="38"/>
            </svg>
            <p class="adrenal59-eye-note">Larger diameter after adrenaline</p>
        </div>
    </div>
</figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. A decrease in heart rate:</strong> Incorrect — adrenaline increases heart rate.</li>
            <li><strong>B. A decrease in blood glucose concentration:</strong> Incorrect — adrenaline stimulates liver glycogen breakdown and increases blood glucose concentration.</li>
            <li><strong>C. An increase in pupil diameter:</strong> Correct — the pupils dilate during the fight-or-flight response.</li>
            <li><strong>D. The development of secondary sexual characteristics:</strong> Incorrect — this is mainly controlled by sex hormones such as testosterone and oestrogen.</li>
        </ul>

        <h3>IGCSE exam tip: distinguish endocrine glands</h3>
        <dl class="adrenal59-hormone-guide">
            <div><dt>Adrenal glands</dt><dd><strong>Adrenaline:</strong> Prepares the body for the fight-or-flight response.</dd></div>
            <div><dt>Pancreas</dt><dd><strong>Insulin:</strong> Decreases blood glucose concentration.</dd></div>
            <div><dt>Testes</dt><dd><strong>Testosterone:</strong> Promotes the development of male secondary sexual characteristics.</dd></div>
            <div><dt>Ovaries</dt><dd><strong>Oestrogen:</strong> Promotes the development of female secondary sexual characteristics.</dd></div>
        </dl>
        <p class="exam-tip"><strong>Key sequence:</strong> Adrenal glands → adrenaline released → fight-or-flight response → pupils dilate. Remember that adrenaline <strong>increases</strong> heart rate, blood glucose concentration and pupil diameter.</p>
        <p class="relationship">Final answer: C — an increase in pupil diameter.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A sex-linked condition is caused by a recessive allele. A healthy male and female are both unaffected, but the female has one copy of the recessive allele. What is the chance of their offspring being affected by the condition?</span>',
    paperCode: "0610/22/O/N/22",
    paperSession: "Oct/Nov 2022",
    legend: "Choose the chance of an offspring being affected",
    options: [
        "50% of all their offspring",
        "100% of male offspring and 0% of female offspring",
        "25% of all their offspring",
        "50% of male offspring and 25% of female offspring"
    ],
    correct: "C",
    answer: "C. 25% of all their offspring",
    explanation: `
        <p class="definition">This is an <strong>X-linked recessive</strong> condition. The father is unaffected and the mother is an unaffected carrier. <strong>One of the four equally likely outcomes is affected</strong>, so the chance is <strong>25% of all offspring</strong>.</p>

        <h3>Step 1: Identify the parents’ genotypes</h3>
        <ul class="option-explanations">
            <li><strong>X<sup>N</sup>:</strong> An X chromosome carrying the normal dominant allele.</li>
            <li><strong>X<sup>n</sup>:</strong> An X chromosome carrying the recessive allele for the condition.</li>
            <li><strong>Y:</strong> The Y chromosome does not carry this X-linked allele.</li>
        </ul>
        <p>The healthy father is <strong>X<sup>N</sup>Y</strong>. The unaffected carrier mother is <strong>X<sup>N</sup>X<sup>n</sup></strong>. Her dominant normal allele masks the recessive allele.</p>

        <h3>Step 2: Draw the Punnett square</h3>
        <figure class="punnett60" aria-labelledby="punnett60-title">
    <figcaption id="punnett60-title">Punnett square: an unaffected father and a carrier mother</figcaption>
    <p class="punnett60-parents"><span>Father: <strong class="punnett60-genotype">X<sup>N</sup>Y</strong></span><span aria-hidden="true">×</span><span>Mother: <strong class="punnett60-genotype">X<sup>N</sup>X<sup>n</sup></strong></span></p>
    <p class="punnett60-key"><strong>Allele key:</strong> X<sup>N</sup> carries the normal allele; X<sup>n</sup> carries the recessive condition allele.</p>
    <p class="punnett60-axes" id="punnett60-axes"><strong>Columns:</strong> father’s sperm (male gametes).<br><strong>Rows:</strong> mother’s eggs (female gametes).<span class="punnett60-scroll-hint">Scroll the grid sideways if needed.</span></p>
    <div class="punnett60-scroll" tabindex="0" role="region" aria-label="Punnett square; scroll horizontally if needed" aria-describedby="punnett60-axes">
        <table class="punnett60-table">
            <caption class="punnett60-sr-only">Four equally likely offspring outcomes from X superscript N Y crossed with X superscript N X superscript n</caption>
            <colgroup><col class="punnett60-gamete-col"><col><col></colgroup>
            <thead>
                <tr>
                    <th scope="col" class="punnett60-corner">Eggs ↓</th>
                    <th scope="col"><span class="punnett60-genotype">X<sup>N</sup></span></th>
                    <th scope="col"><span class="punnett60-genotype">Y</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row"><span class="punnett60-genotype">X<sup>N</sup></span></th>
                    <td><strong class="punnett60-genotype">X<sup>N</sup>X<sup>N</sup></strong><span class="punnett60-outcome">Healthy daughter</span><span class="punnett60-probability">25%</span></td>
                    <td><strong class="punnett60-genotype">X<sup>N</sup>Y</strong><span class="punnett60-outcome">Healthy son</span><span class="punnett60-probability">25%</span></td>
                </tr>
                <tr>
                    <th scope="row"><span class="punnett60-genotype">X<sup>n</sup></span></th>
                    <td class="punnett60-carrier"><strong class="punnett60-genotype">X<sup>N</sup>X<sup>n</sup></strong><span class="punnett60-outcome">Carrier daughter</span><span class="punnett60-cell-note">Unaffected</span><span class="punnett60-probability">25%</span></td>
                    <td class="punnett60-affected"><strong class="punnett60-genotype">X<sup>n</sup>Y</strong><span class="punnett60-outcome">Affected son</span><span class="punnett60-probability">25%</span></td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="punnett60-all"><strong>Each cell = 25% of all children.</strong> Each child has one of these four equally likely outcomes.</p>
    <p class="punnett60-sons"><strong>Among sons: 1 in 2 = 50% affected.</strong> Count only the two son cells: one healthy and one affected. Across all children, the chance of an affected son is 1 in 4 = 25%.</p>
</figure>
        <p>The father produces X<sup>N</sup> or Y sperm, each with a probability of <strong>1/2</strong>. The mother produces X<sup>N</sup> or X<sup>n</sup> eggs, also each with a probability of <strong>1/2</strong>. Each combination therefore has probability <strong>1/2 × 1/2 = 1/4</strong>.</p>

        <h3>Step 3: Calculate the probability</h3>
        <p>Only <strong>X<sup>n</sup>Y</strong>, the affected son, expresses the recessive condition. The other son and both daughters are unaffected.</p>
        <p class="relationship">Chance of an affected offspring = 1/4 × 100 = 25%</p>
        <p>The father gives his normal X<sup>N</sup> chromosome to every daughter, so <strong>no daughters are expected to be affected</strong>. An affected son inherits X<sup>n</sup> from his mother and Y from his father.</p>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 50% of all offspring:</strong> Incorrect — 50% of sons are affected, but sons represent only half of all offspring in the model.</li>
            <li><strong>B. 100% of males and 0% of females:</strong> Incorrect — only 50% of sons are expected to be affected.</li>
            <li><strong>C. 25% of all offspring:</strong> Correct — one affected outcome out of four equally likely outcomes.</li>
            <li><strong>D. 50% of males and 25% of females:</strong> Incorrect — the percentage for sons is correct, but the percentage for affected daughters is 0%.</li>
        </ul>

        <h3>IGCSE exam tip: compare the correct group</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Probability for this healthy-father × carrier-mother cross</caption>
            <colgroup><col style="width:64%"><col></colgroup>
            <thead><tr><th scope="col">Group</th><th scope="col">Chance</th></tr></thead>
            <tbody>
                <tr><th scope="row">Affected among all offspring</th><td><strong>25%</strong></td></tr>
                <tr><th scope="row">Affected among sons</th><td>50%</td></tr>
                <tr><th scope="row">Healthy among sons</th><td>50%</td></tr>
                <tr><th scope="row">Carriers among daughters</th><td>50%</td></tr>
                <tr><th scope="row">Affected among daughters</th><td>0%</td></tr>
            </tbody>
        </table>
        <p class="exam-tip"><strong>Use the right denominator:</strong> 50% of sons is 25% of all offspring when sons and daughters are equally likely. Each pregnancy has these probabilities independently; four children do not guarantee exactly one affected child.</p>

        <h3>Published inheritance illustration</h3>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="60">
            <a href="images/online-x-linked-recessive.jpg" target="_blank" rel="noreferrer" aria-label="Open the X-linked inheritance illustration at full size">
                <img src="images/online-x-linked-recessive.jpg" width="960" height="727" alt="Published X-linked recessive inheritance diagram showing an unaffected father and carrier mother, with an unaffected son, unaffected daughter, carrier daughter and affected son as the four possible offspring." loading="lazy" decoding="async">
            </a>
            <figcaption>An unaffected father and a carrier mother have four equally likely offspring outcomes: an unaffected son, unaffected daughter, carrier daughter or affected son. This gives a 25% chance of an affected child, 50% of sons affected and 0% of daughters affected. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2928_X-linked_Recessive_Inheritance-new.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</figcaption>
        </figure>
        <p class="relationship">Final answer: C — 25% of all their offspring.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The enzyme-catalysed reaction of substrate S occurs as shown. Which graph shows this enzyme-catalysed reaction?</span>',
    paperCode: "0610/21/M/J/26",
    paperSession: "May/June 2026",
    legend: "Choose the graph that is consistent with S being converted into T and U",
    context: `
        <div class="reaction61-question">
            <p class="relationship" aria-label="Substrate S is converted into products T and U">S → T + U</p>
            <p class="reaction61-instruction">Compare the quantities and scales on both axes. Each card shows one graph. Scroll sideways inside a graph if needed, or focus it and use the arrow keys.</p>
        </div>
    `,
    options: [
        `<span class="reaction61-option"><span class="reaction61-scroll" tabindex="0" role="region" aria-label="Graph A; scroll horizontally if needed"><img src="images/question-61-graph-a.png" width="999" height="474" alt="Graph A. Horizontal axis: time, 0 to 8 minutes. Vertical axis: total mass of substrate S at start, 0 to 35 grams. The curve rises from zero and levels off near 29 grams." decoding="async"></span></span>`,
        `<span class="reaction61-option"><span class="reaction61-scroll" tabindex="0" role="region" aria-label="Graph B; scroll horizontally if needed"><img src="images/question-61-graph-b.png" width="999" height="474" alt="Graph B. Horizontal axis: total mass of substrate S at start, 0 to 8 grams. Vertical axis: total mass of product T at end, 0 to 16 grams. A straight line rises from zero to about 14 grams of T at 8 grams of S." decoding="async"></span></span>`,
        `<span class="reaction61-option"><span class="reaction61-scroll" tabindex="0" role="region" aria-label="Graph C; scroll horizontally if needed"><img src="images/question-61-graph-c.png" width="999" height="474" alt="Graph C. Horizontal axis: total mass of substrate S at start, 0 to 8 grams. Vertical axis: total mass of product T at end, 0 to 4 grams. A straight line rises from zero to approximately 3.5 grams of T at 8 grams of S." decoding="async"></span></span>`,
        `<span class="reaction61-option"><span class="reaction61-scroll" tabindex="0" role="region" aria-label="Graph D; scroll horizontally if needed"><img src="images/question-61-graph-d.png" width="999" height="474" alt="Graph D. Horizontal axis: time, 0 to 8 minutes. Vertical axis: rate of reaction, 0 to 35 grams per minute. The rate rises from zero then levels off near 29 grams per minute." decoding="async"></span></span>`
    ],
    correct: "C",
    answer: "C. The final mass of T is proportional to, and less than, the starting mass of S",
    explanation: `
        <p class="definition"><strong>C is correct.</strong> The reaction splits substrate S into two products, T and U. With complete conversion and a fixed product ratio, more starting S produces proportionally more T. Some of the starting mass also becomes U.</p>
        <p class="relationship">S → T + U</p>

        <h3>Step 1: Apply conservation of mass</h3>
        <p>For the simplified reaction shown, with no other reactants added and no material lost:</p>
        <p class="relationship">Starting mass of S = final mass of T + final mass of U</p>
        <p>Since both T and U are formed, <strong>the mass of T alone must be less than the starting mass of S</strong>. The enzyme speeds up the reaction and is not used up.</p>

        <h3>Step 2: Compare the four graphs</h3>
        <table class="comparison-table reaction61-analysis" style="table-layout:fixed">
            <caption>Read the axis labels and numerical scales</caption>
            <colgroup><col style="width:18%"><col></colgroup>
            <thead><tr><th scope="col">Graph</th><th scope="col">Interpretation</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td>Incorrect. The <em>starting</em> mass of S is a set initial value for a trial; it does not rise as that reaction proceeds.</td></tr>
                <tr><th scope="row">B</th><td>Incorrect. About 8 g of S would produce about 14 g of T alone, exceeding the starting mass before U is even included.</td></tr>
                <tr class="reaction61-correct-row"><th scope="row">C ✓</th><td>Correct. T increases in direct proportion to starting S and remains smaller than it. The remaining mass can form U.</td></tr>
                <tr><th scope="row">D</th><td>Incorrect. The rate rises and then levels off over time. In a normal closed batch reaction under stable conditions, the rate generally falls as substrate is depleted.</td></tr>
            </tbody>
        </table>

        <h3>Step 3: Read an example from graph C</h3>
        <p>When the starting mass of S is <strong>8 g</strong>, graph C shows approximately <strong>3.5 g of T</strong>. The remaining mass forms U:</p>
        <div class="reaction61-balance" role="group" aria-label="Approximate mass balance for 8 grams of substrate">
            <p><strong>8 g</strong><span>Starting substrate S</span></p>
            <span class="reaction61-symbol" aria-hidden="true">=</span>
            <p><strong>≈3.5 g</strong><span>Product T</span></p>
            <span class="reaction61-symbol" aria-hidden="true">+</span>
            <p><strong>≈4.5 g</strong><span>Product U</span></p>
        </div>
        <p class="reaction61-reading-note">The graph reading is approximate: 8 − 3.5 ≈ 4.5 g. This example assumes complete conversion with no loss of material.</p>
        <p><strong>Why a straight line?</strong> Complete conversion with the same fixed product ratio gives the same fraction of the starting mass as T each time. Conservation of mass alone does not establish proportionality; the fixed product ratio does.</p>

        <h3>Visual guide: one substrate, two products</h3>
        <figure class="explanation-photo explanation-visual reaction61-enzyme-photo" data-explanation-visual="61">
            <a href="images/online-enzyme-reaction.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded enzyme reaction illustration at full size">
                <img src="images/online-enzyme-reaction.png" width="500" height="1186" alt="Four stages show one substrate binding to an enzyme, splitting into two products, and leaving the enzyme available for reuse." loading="lazy" decoding="async">
            </a>
            <figcaption>One substrate binds to an enzyme and splits into two products. The enzyme can be reused. This published illustration is a schematic, not the question’s mass data. Image: domdomegg, via <a href="https://commons.wikimedia.org/wiki/File:Lock_and_key_enzyme_mechanism.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0" target="_blank" rel="noreferrer">CC BY 4.0</a>.</figcaption>
        </figure>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li>Read both axis labels: <strong>mass of product</strong> and <strong>rate of reaction</strong> describe different quantities.</li>
            <li>Check the scales. B and C both have rising straight lines, but only C has a final mass of T smaller than the starting mass of S.</li>
            <li>In a normal batch reaction, substrate is used up, product accumulates and the reaction rate generally decreases.</li>
            <li>An enzyme changes the reaction rate; <strong>mass is still conserved</strong>.</li>
        </ul>
        <p class="relationship">Final answer: C.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A man and a woman have four children. The diagram shows the blood groups of the children. What are the possible genotypes of the father and mother?</span>',
    paperCode: "0610/23/O/N/22",
    paperSession: "Oct/Nov 2022",
    legend: "Choose the parental genotypes that can produce these children",
    context: `
        <figure class="abo62-family">
            <img src="images/question-62-family.png" width="1100" height="336" alt="A father and mother have four children: child 1 has blood group A, child 2 has AB, and children 3 and 4 each have O." decoding="async">
            <figcaption>Children’s blood groups: A, AB, O and O.</figcaption>
        </figure>
    `,
    options: [
        `<span class="abo62-genotype">I<sup>A</sup>I<sup>A</sup></span> and <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span>`,
        `<span class="abo62-genotype">I<sup>A</sup>I<sup>B</sup></span> and <span class="abo62-genotype">I<sup>o</sup>I<sup>o</sup></span>`,
        `<span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> and <span class="abo62-genotype">I<sup>B</sup>I<sup>B</sup></span>`,
        `<span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> and <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span>`
    ],
    correct: "D",
    answer: "D. IᴬIᵒ and IᴮIᵒ",
    explanation: `
        <p class="definition"><strong>D is correct:</strong> one parent is <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> and the other is <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span>. An AB child needs an A allele from one parent and a B allele from the other. An O child needs an O allele from <strong>both</strong> parents.</p>

        <h3>Step 1: Understand the ABO alleles</h3>
        <p>The paper writes the recessive O allele as <span class="abo62-genotype">I<sup>o</sup></span>.</p>
        <ul class="option-explanations">
            <li><span class="abo62-genotype">I<sup>A</sup></span> leads to A antigen on red blood cells.</li>
            <li><span class="abo62-genotype">I<sup>B</sup></span> leads to B antigen on red blood cells.</li>
            <li><span class="abo62-genotype">I<sup>o</sup></span> is recessive and leads to neither A nor B antigen.</li>
        </ul>
        <p><span class="abo62-genotype">I<sup>A</sup></span> and <span class="abo62-genotype">I<sup>B</sup></span> are <strong>codominant</strong>: both are expressed in group AB. Each is dominant to <span class="abo62-genotype">I<sup>o</sup></span>.</p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>ABO blood groups and their possible genotypes</caption>
            <colgroup><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Blood group</th><th scope="col">Possible genotypes</th></tr></thead>
            <tbody>
                <tr><th scope="row">A</th><td><span class="abo62-genotype">I<sup>A</sup>I<sup>A</sup></span> or <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span></td></tr>
                <tr><th scope="row">B</th><td><span class="abo62-genotype">I<sup>B</sup>I<sup>B</sup></span> or <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span></td></tr>
                <tr><th scope="row">AB</th><td><span class="abo62-genotype">I<sup>A</sup>I<sup>B</sup></span></td></tr>
                <tr><th scope="row">O</th><td><span class="abo62-genotype">I<sup>o</sup>I<sup>o</sup></span></td></tr>
            </tbody>
        </table>

        <h3>Step 2: Use the children’s blood groups</h3>
        <p>The <strong>AB child</strong> has genotype <span class="abo62-genotype">I<sup>A</sup>I<sup>B</sup></span>. Therefore, one parent must supply <span class="abo62-genotype">I<sup>A</sup></span> and the other must supply <span class="abo62-genotype">I<sup>B</sup></span>.</p>
        <p>The <strong>O children</strong> have genotype <span class="abo62-genotype">I<sup>o</sup>I<sup>o</sup></span>. Therefore, <strong>each parent must carry <span class="abo62-genotype">I<sup>o</sup></span></strong>.</p>
        <p>Combining these clues gives <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> × <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span>. Either parent could be the group-A parent or the group-B parent.</p>

        <h3>Step 3: Draw the Punnett square</h3>
        <figure class="abo62-square" aria-labelledby="abo62-square-title">
            <figcaption id="abo62-square-title">A group-A parent and a group-B parent, both carrying O</figcaption>
            <p class="abo62-parents"><span>Parent 1: <strong class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></strong></span><span aria-hidden="true">×</span><span>Parent 2: <strong class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></strong></span></p>
            <p id="abo62-square-axes" class="abo62-axes"><strong>Rows:</strong> parent 1’s gametes, <span class="abo62-genotype">I<sup>A</sup></span> or <span class="abo62-genotype">I<sup>o</sup></span>.<br><strong>Columns:</strong> parent 2’s gametes, <span class="abo62-genotype">I<sup>B</sup></span> or <span class="abo62-genotype">I<sup>o</sup></span>.<span class="abo62-scroll-hint">Scroll the square sideways if needed.</span></p>
            <div class="abo62-scroll" tabindex="0" role="region" aria-label="ABO Punnett square; scroll horizontally if needed" aria-describedby="abo62-square-axes">
                <table class="abo62-table">
                    <caption class="visually-hidden">Four equally likely blood-group outcomes from I superscript A I superscript o crossed with I superscript B I superscript o</caption>
                    <colgroup><col style="width:20%"><col><col></colgroup>
                    <thead><tr><th scope="col" class="abo62-corner">Gametes ↓</th><th scope="col"><span class="abo62-genotype">I<sup>B</sup></span></th><th scope="col"><span class="abo62-genotype">I<sup>o</sup></span></th></tr></thead>
                    <tbody>
                        <tr><th scope="row"><span class="abo62-genotype">I<sup>A</sup></span></th>
                            <td class="abo62-ab"><strong class="abo62-genotype">I<sup>A</sup>I<sup>B</sup></strong><span class="abo62-outcome">Group AB</span><span class="abo62-probability">25%</span></td>
                            <td class="abo62-a"><strong class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></strong><span class="abo62-outcome">Group A</span><span class="abo62-probability">25%</span></td>
                        </tr>
                        <tr><th scope="row"><span class="abo62-genotype">I<sup>o</sup></span></th>
                            <td class="abo62-b"><strong class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></strong><span class="abo62-outcome">Group B</span><span class="abo62-probability">25%</span></td>
                            <td class="abo62-o"><strong class="abo62-genotype">I<sup>o</sup>I<sup>o</sup></strong><span class="abo62-outcome">Group O</span><span class="abo62-probability">25%</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="abo62-per-child"><strong>Each blood group has a 1 in 4 = 25% chance for each child.</strong> All four groups are possible, even though no group-B child is shown in this family.</p>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> <span class="abo62-genotype">I<sup>A</sup>I<sup>A</sup></span> × <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span> produces A or AB. It <strong>cannot produce O</strong>.</li>
            <li><strong>B:</strong> <span class="abo62-genotype">I<sup>A</sup>I<sup>B</sup></span> × <span class="abo62-genotype">I<sup>o</sup>I<sup>o</sup></span> produces A or B. It <strong>cannot produce AB or O</strong>.</li>
            <li><strong>C:</strong> <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> × <span class="abo62-genotype">I<sup>B</sup>I<sup>B</sup></span> produces AB or B. It <strong>cannot produce O</strong> or A.</li>
            <li><strong>D:</strong> <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> × <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span> can produce <strong>A, B, AB and O</strong>, matching the family.</li>
        </ul>

        <h3>Published visual guide to ABO inheritance</h3>
        <figure class="explanation-photo explanation-visual" data-explanation-visual="62">
            <a href="images/online-abo-codominance.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded ABO inheritance image at full size">
                <img src="images/online-abo-codominance.png" width="960" height="956" alt="Published ABO inheritance diagram: a group-A parent carrying A and O alleles and a group-B parent carrying B and O alleles can have children with blood groups A, AB, B or O." loading="lazy" decoding="async">
            </a>
            <figcaption>A parent carrying A and O crossed with a parent carrying B and O can produce all four ABO groups. The four figures are possible offspring outcomes, not a guaranteed set of four children. This illustration uses the allele labels A, B and O; the square above uses the paper’s I-superscript notation. Image: YassineMrabet, based on an NIH illustration, via <a href="https://commons.wikimedia.org/wiki/File:ABO_system_codominance.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/publicdomain/mark/1.0/" target="_blank" rel="noreferrer">public domain</a>.</figcaption>
        </figure>

        <h3>IGCSE exam tip</h3>
        <p class="relationship">AB child → an A allele from one parent and a B allele from the other.<br>O child → an O allele from both parents.</p>
        <p class="exam-tip"><strong>Observed numbers are not guaranteed ratios.</strong> Two O children in this family do not make the chance of O 50%. Each pregnancy is independent, and this cross gives a <strong>25% chance of group O for each child</strong>. Four children do not have to include one child of each blood group.</p>
        <p class="relationship">Final answer: D — <span class="abo62-genotype">I<sup>A</sup>I<sup>o</sup></span> and <span class="abo62-genotype">I<sup>B</sup>I<sup>o</sup></span>.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A scientist investigates the action of a drug that affects the production of proteins by cells. Which statements could explain the results?</span>',
    paperCode: "0610/21/M/J/26",
    paperSession: "May/June 2026",
    legend: "Choose the statements that could explain the reduced protein production",
    context: `
        <div class="protein63-question">
            <p>The scientist grows two groups of cells and adds the drug to one group. After one day, the scientist determines the mass of proteins produced per million cells in each group.</p>
            <table class="comparison-table" style="table-layout:fixed">
                <caption>Protein production after one day</caption>
                <colgroup><col style="width:44%"><col></colgroup>
                <thead><tr><th scope="col">Group of cells</th><th scope="col">Mass of proteins produced per million cells / µg</th></tr></thead>
                <tbody><tr><th scope="row">With no drug</th><td>25</td></tr><tr><th scope="row">With drug</th><td>5</td></tr></tbody>
            </table>
            <ol class="statement-list protein63-statements">
                <li>The drug stops messenger RNA passing through ribosomes.</li>
                <li>The drug stops production of messenger RNA.</li>
                <li>The drug stops the copying of DNA before mitosis.</li>
            </ol>
        </div>
    `,
    options: ["1, 2 and 3", "1 and 2 only", "1 and 3 only", "2 and 3 only"],
    correct: "B",
    answer: "B. Statements 1 and 2 only",
    explanation: `
        <p class="definition"><strong>B is correct.</strong> Statements <strong>1 and 2</strong> could explain reduced protein production because they interfere with <strong>translation</strong> or <strong>transcription</strong>. DNA replication, in statement 3, copies DNA before cell division and is not directly required for a cell to use its existing DNA to make proteins.</p>

        <h3>Step 1: Analyse the results</h3>
        <figure class="protein63-results" aria-labelledby="protein63-results-title">
            <figcaption id="protein63-results-title">Protein produced per million cells after one day</figcaption>
            <div class="protein63-result-row"><p><strong>No drug</strong><span>25 µg</span></p><div class="protein63-track" aria-hidden="true"><span class="protein63-bar protein63-no-drug"></span></div></div>
            <div class="protein63-result-row"><p><strong>With drug</strong><span>5 µg</span></p><div class="protein63-track" aria-hidden="true"><span class="protein63-bar protein63-with-drug"></span></div></div>
            <p class="protein63-scale-note">Both bars start at zero and use the same scale; the full track represents 25 µg per million cells.</p>
        </figure>
        <p>The decrease is <strong>25 − 5 = 20 µg per million cells</strong>.</p>
        <p class="relationship">Percentage reduction = (20 ÷ 25) × 100 = 80%</p>
        <p>Protein production with the drug is <strong>20% of the no-drug value</strong>, an <strong>80% reduction</strong>.</p>

        <h3>Step 2: Evaluate the statements</h3>
        <ol class="protein63-reasons">
            <li><strong>Stops mRNA passing through ribosomes — could explain the result.</strong><p>During <strong>translation</strong>, ribosomes read the codons on mRNA and assemble amino acids in the specified order. Preventing mRNA from being read and moving through ribosomes inhibits protein synthesis.</p></li>
            <li><strong>Stops mRNA production — could explain the result.</strong><p>During <strong>transcription</strong>, DNA acts as a template for making mRNA. Inhibiting this step reduces the supply of mRNA carrying instructions to ribosomes, so protein production can decrease.</p></li>
            <li><strong>Stops DNA copying before mitosis — not the direct explanation in this question.</strong><p><strong>DNA replication</strong> prepares a cell for division. Existing DNA can still act as a template for mRNA without being replicated first, so protein synthesis does not require the cell to undergo mitosis.</p></li>
        </ol>
        <p class="exam-tip"><strong>Read “could explain”.</strong> The results show reduced protein production. They do not identify the exact target of the drug or prove that it blocks both transcription and translation.</p>

        <h3>Step 3: Follow the protein-synthesis pathway</h3>
        <div class="protein63-pathway" role="group" aria-label="DNA is transcribed into messenger RNA, which is translated at ribosomes into protein">
            <p class="protein63-molecule"><strong>DNA</strong><span>Contains the genetic instructions</span></p>
            <p class="protein63-process"><span aria-hidden="true">↓ </span><strong>Transcription</strong><span>Statement 2 could block this step</span></p>
            <p class="protein63-molecule"><strong>Messenger RNA</strong><span>Carries the code to a ribosome</span></p>
            <p class="protein63-process"><span aria-hidden="true">↓ </span><strong>Translation at ribosomes</strong><span>Statement 1 could block this step</span></p>
            <p class="protein63-molecule"><strong>Protein</strong><span>Amino acids joined in a specific sequence</span></p>
        </div>

        <figure class="explanation-photo explanation-visual protein63-photo" data-explanation-visual="63">
            <a href="images/online-protein-synthesis.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded protein synthesis image at full size">
                <img src="images/online-protein-synthesis.jpg" width="548" height="525" alt="Published cell diagram shows DNA being transcribed into mRNA inside the nucleus and mRNA being translated at a ribosome in the cytoplasm to form an amino-acid chain." loading="lazy" decoding="async">
            </a>
            <figcaption>Transcription makes mRNA using DNA as a template; translation at a ribosome uses mRNA to assemble an amino-acid chain. This schematic illustrates the normal protein-synthesis pathway. The experimental results do not identify which step the drug targets. Image: OpenStax, via <a href="https://commons.wikimedia.org/wiki/File:0328_Transcription-translation_Summary.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</figcaption>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 1, 2 and 3:</strong> Incorrect — includes DNA replication, statement 3.</li>
            <li><strong>B. 1 and 2 only:</strong> Correct — both concern steps directly involved in protein synthesis.</li>
            <li><strong>C. 1 and 3 only:</strong> Incorrect — includes 3 and omits mRNA production, statement 2.</li>
            <li><strong>D. 2 and 3 only:</strong> Incorrect — includes 3 and omits the ribosome step, statement 1.</li>
        </ul>

        <h3>IGCSE exam tip: distinguish the three processes</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Replication, transcription and translation</caption>
            <colgroup><col style="width:35%"><col></colgroup>
            <thead><tr><th scope="col">Process</th><th scope="col">Main function</th></tr></thead>
            <tbody>
                <tr><th scope="row">DNA replication</th><td>Copies DNA before cell division.</td></tr>
                <tr><th scope="row">Transcription</th><td>Produces mRNA using DNA as a template.</td></tr>
                <tr><th scope="row">Translation</th><td>Uses mRNA to assemble amino acids into a protein at ribosomes.</td></tr>
            </tbody>
        </table>
        <p class="relationship">Final answer: B — statements 1 and 2 only.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">When amylase is added to a starch suspension, reducing sugars are produced. What is the correct order of reaction rate for the different types of amylase, from fastest to slowest?</span>',
    paperCode: "0610/22/M/J/26",
    paperSession: "May/June 2026",
    legend: "Choose the order from fastest to slowest",
    context: `
        <div class="amylase64-question">
            <p>The graph shows the mass of reducing sugar produced over time using three different types of amylase, P, Q and R. All other conditions are kept the same.</p>
            <figure class="amylase64-graph">
                <a href="images/question-64-amylase-graph.png" target="_blank" rel="noreferrer" aria-label="Open the original amylase graph at full size">
                    <img src="images/question-64-amylase-graph.png" width="1218" height="750" alt="Mass of reducing sugar, 0 to 35 grams, against time, 0 to 90 seconds. P is a solid line, Q dashed and R dotted. P rises through 20 grams at 20 seconds then curves to 30 grams. Q rises through approximately 22 grams at 30 seconds then curves to 30 grams. R is straight from the origin to 30 grams at 80 seconds." decoding="async">
                </a>
                <figcaption>Solid line: P; dashed line: Q; dotted line: R. Open the graph to view it at full size.</figcaption>
            </figure>
            <p>When the reaction is repeated using a different type of amylase, <strong>S</strong>, the rate of reaction is <strong>0.75 g/s</strong>.</p>
        </div>
    `,
    options: ["S → P → Q → R", "P → S → Q → R", "P → Q → S → R", "P → Q → R → S"],
    correct: "B",
    answer: "B. P → S → Q → R",
    explanation: `
        <p class="definition"><strong>B is correct:</strong> compare the <strong>initial gradients</strong> of the product–time graph with the given rate of S. The rates decrease in the order <strong>P → S → Q → R</strong>.</p>

        <h3>Step 1: Use the gradient to find the rate</h3>
        <p class="relationship">Rate = change in mass of product ÷ change in time</p>
        <p>On this graph, mass is measured in grams and time in seconds, so the rate is in <strong>g/s</strong>. For an initial straight section starting at the origin, divide the mass produced by the time taken.</p>
        <ul class="option-explanations">
            <li><strong>Steeper gradient:</strong> a faster reaction.</li>
            <li><strong>Shallower gradient:</strong> a slower reaction.</li>
            <li><strong>Horizontal section:</strong> no further increase in the mass of reducing sugar.</li>
        </ul>

        <h3>Step 2: Calculate and compare the rates</h3>
        <table class="comparison-table amylase64-rates" style="table-layout:fixed">
            <caption>Rates in descending order; graph readings are approximate</caption>
            <colgroup><col style="width:18%"><col style="width:48%"><col></colgroup>
            <thead><tr><th scope="col">Amylase</th><th scope="col">Calculation or given value</th><th scope="col">Rate / g/s</th></tr></thead>
            <tbody>
                <tr><th scope="row">P</th><td>20 g ÷ 20 s, from the initial straight section.</td><td>1.00</td></tr>
                <tr><th scope="row">S</th><td>Given in the question.</td><td>0.75</td></tr>
                <tr><th scope="row">Q</th><td>Approximately 22 g ÷ 30 s, from the initial straight section.</td><td>≈0.73</td></tr>
                <tr><th scope="row">R</th><td>30 g ÷ 80 s; this plotted line is straight.</td><td>0.375</td></tr>
            </tbody>
        </table>
        <p><strong>Q is a graph estimate.</strong> A representative reading is about 22 g in 30 s, giving approximately 0.73 g/s, slightly below the given 0.75 g/s for S. A gradient of 0.75 g/s corresponds to 15 g per 20 s; Q’s initial line lies just below 15 g at 20 s. This confirms that S is slightly faster than Q.</p>

        <figure class="amylase64-comparison" aria-labelledby="amylase64-comparison-title">
            <figcaption id="amylase64-comparison-title">Initial-rate comparison: fastest to slowest</figcaption>
            <div class="amylase64-rate-row"><p><strong>P</strong><span>1.00 g/s</span></p><div class="amylase64-track" aria-hidden="true"><span class="amylase64-bar amylase64-p"></span></div></div>
            <div class="amylase64-rate-row"><p><strong>S</strong><span>0.75 g/s — given</span></p><div class="amylase64-track" aria-hidden="true"><span class="amylase64-bar amylase64-s"></span></div></div>
            <div class="amylase64-rate-row"><p><strong>Q</strong><span>≈0.73 g/s</span></p><div class="amylase64-track" aria-hidden="true"><span class="amylase64-bar amylase64-q"></span></div></div>
            <div class="amylase64-rate-row"><p><strong>R</strong><span>0.375 g/s</span></p><div class="amylase64-track" aria-hidden="true"><span class="amylase64-bar amylase64-r"></span></div></div>
            <p class="amylase64-scale-note">All bars start at zero and share a scale whose full width is 1.00 g/s. P, Q and R are calculated from the plot; S is supplied. Q is approximate.</p>
        </figure>

        <h3>Step 3: Read the original graph</h3>
        <figure class="amylase64-graph explanation-photo explanation-visual" data-explanation-visual="64">
                <a href="images/question-64-amylase-graph.png" target="_blank" rel="noreferrer" aria-label="Open the original amylase graph at full size">
                    <img src="images/question-64-amylase-graph.png" width="1218" height="750" alt="Mass of reducing sugar, 0 to 35 grams, against time, 0 to 90 seconds. P is a solid line, Q dashed and R dotted. P rises through 20 grams at 20 seconds then curves to 30 grams. Q rises through approximately 22 grams at 30 seconds then curves to 30 grams. R is straight from the origin to 30 grams at 80 seconds." loading="lazy" decoding="async">
                </a>
                <figcaption>Original question graph: compare the initial straight sections. Open the graph to view it at full size. Image: Cambridge University Press &amp; Assessment, © 2026, from <a href="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s26_qp_22.pdf" target="_blank" rel="noreferrer">0610/22/M/J/26, question 8</a>.</figcaption>
            </figure>
        <p>P has the steepest initial line. R has the shallowest. Q lies between them, and its gradient is slightly lower than S’s given rate.</p>
        <p>The plot shows each of P, Q and R reaching <strong>30 g</strong>, at different times. P and Q level off; R reaches 30 g at the end of its plotted line. The rate is determined by the <strong>slope</strong>, rather than by the mass reached alone.</p>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. S → P → Q → R:</strong> Incorrect — P is faster than S.</li>
            <li><strong>B. P → S → Q → R:</strong> Correct — 1.00 &gt; 0.75 &gt; approximately 0.73 &gt; 0.375 g/s.</li>
            <li><strong>C. P → Q → S → R:</strong> Incorrect — S is faster than Q.</li>
            <li><strong>D. P → Q → R → S:</strong> Incorrect — S should be second, ahead of Q and R.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <p class="exam-tip"><strong>Compare initial gradients.</strong> Use the initial straight part where possible. Dividing 30 g by the time when a curved line reaches 30 g gives an average over that interval, which may be lower than its initial rate. A plateau shows no further product accumulation; the graph alone does not establish why it occurs.</p>
        <p class="relationship">Final answer: B — P → S → Q → R.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The graph shows changes in the volume of the thorax when a human is inspiring and expiring. Which row shows the regions when the internal and external intercostal muscles are contracting?</span>',
    paperCode: "0610/22/M/J/26",
    paperSession: "May/June 2026",
    legend: "Choose the row giving the internal and external intercostal contraction intervals",
    context: `
        <div class="breath65-question">
            <figure class="breath65-graph">
                <a href="images/question-65-thorax-volume.png" target="_blank" rel="noreferrer" aria-label="Open the original thorax-volume graph at full size">
                    <img src="images/question-65-thorax-volume.png" width="1168" height="808" alt="Thorax volume in cubic centimetres against time, with no numerical time scale. P is at 3000, Q at 2500, R at 6000, S at 1200 and T at 3000. The curve falls from P to Q, rises from Q to R, falls from R to S and rises from S to T." decoding="async">
                </a>
                <figcaption>Original thorax-volume graph. Open the image to view it at full size.</figcaption>
            </figure>
            <div class="breath65-table-scroll" tabindex="0" role="region" aria-label="Answer rows; scroll horizontally if needed">
                <table class="comparison-table answer-selection-table breath65-options">
                    <caption>Choose one row</caption>
                    <colgroup><col style="width:70px"><col><col></colgroup>
                    <thead><tr><th scope="col">Row</th><th scope="col">Internal intercostal muscles contract</th><th scope="col">External intercostal muscles contract</th></tr></thead>
                    <tbody>
                        <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select A: internal P to Q; external R to S" aria-pressed="false">A</button></th><td>P to Q</td><td>R to S</td></tr>
                        <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select B: internal Q to R; external S to T" aria-pressed="false">B</button></th><td>Q to R</td><td>S to T</td></tr>
                        <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select C: internal R to S; external Q to R" aria-pressed="false">C</button></th><td>R to S</td><td>Q to R</td></tr>
                        <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select D: internal S to T; external P to Q" aria-pressed="false">D</button></th><td>S to T</td><td>P to Q</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    options: ["Internal: P to Q; external: R to S", "Internal: Q to R; external: S to T", "Internal: R to S; external: Q to R", "Internal: S to T; external: P to Q"],
    hideAnswerOptions: true,
    correct: "C",
    answer: "C. Internal: R → S; external: Q → R",
    explanation: `
        <p class="definition"><strong>C is correct.</strong> From <strong>R to S</strong>, thorax volume falls sharply during forced expiration and the internal intercostal muscles contract. From <strong>Q to R</strong>, volume rises during deep inspiration and the external intercostal muscles contract.</p>

        <h3>Step 1: Identify inspiration and expiration</h3>
        <p>An <strong>increase</strong> in thorax volume indicates inspiration. A <strong>decrease</strong> indicates expiration.</p>
        <div class="breath65-table-scroll" tabindex="0" role="region" aria-label="Graph regions and thorax volumes; scroll horizontally if needed">
            <table class="comparison-table breath65-regions">
                <caption>Read the labelled volume levels from the graph</caption>
                <colgroup><col style="width:22%"><col style="width:40%"><col></colgroup>
                <thead><tr><th scope="col">Region</th><th scope="col">Thorax volume / cm³</th><th scope="col">Process</th></tr></thead>
                <tbody>
                    <tr><th scope="row">P → Q</th><td>3000 → 2500</td><td>Quiet expiration</td></tr>
                    <tr><th scope="row">Q → R</th><td>2500 → 6000</td><td>Deep inspiration</td></tr>
                    <tr><th scope="row">R → S</th><td>6000 → 1200</td><td>Forced expiration</td></tr>
                    <tr><th scope="row">S → T</th><td>1200 → 3000</td><td>Inspiration</td></tr>
                </tbody>
            </table>
        </div>

        <h3>Step 2: External intercostals — Q to R</h3>
        <ul class="option-explanations">
            <li>The <strong>external intercostal muscles contract</strong>, moving the ribs upwards and outwards.</li>
            <li>The internal intercostal muscles relax.</li>
            <li>The <strong>diaphragm contracts and flattens</strong>.</li>
            <li>Thorax volume increases and the lungs expand.</li>
            <li>Pressure inside the lungs falls <strong>below atmospheric pressure</strong>, so air enters.</li>
        </ul>
        <p><strong>S to T is also inspiration.</strong> The external intercostals can also contract during this interval. Q to R is the external-intercostal interval in the <strong>correct pairing among the options</strong>.</p>

        <h3>Step 3: Internal intercostals — R to S</h3>
        <ul class="option-explanations">
            <li>During this <strong>forced expiration</strong>, the internal intercostal muscles contract, moving the ribs downwards and inwards.</li>
            <li>The external intercostal muscles relax.</li>
            <li>The <strong>diaphragm relaxes</strong> and returns towards its dome shape.</li>
            <li>Thorax volume decreases and the lungs become smaller.</li>
            <li>Pressure inside the lungs rises <strong>above atmospheric pressure</strong>, so air flows out.</li>
        </ul>
        <p class="exam-tip"><strong>Quiet and forced expiration differ.</strong> P to Q represents a normal, quiet expiration, which is mainly passive: inspiratory muscles relax and elastic recoil reduces volume. Internal intercostal contraction is particularly important in <strong>forced expiration</strong>, as shown by R to S.</p>

        <h3>Visual comparison: the two correct intervals</h3>
        <div class="breath65-mechanics" role="group" aria-label="Compare inspiration Q to R with forced expiration R to S">
            <section class="breath65-inspiration" aria-labelledby="breath65-inspiration-title">
                <h4 id="breath65-inspiration-title">Q → R: inspiration</h4>
                <p><strong>External intercostals contract</strong><br>Diaphragm contracts and flattens</p>
                <p>Ribs move <strong>up and out</strong></p>
                <p class="breath65-volume">Thorax volume ↑</p>
                <p>Lung pressure falls below atmospheric pressure</p>
                <p class="breath65-air">Air moves in</p>
            </section>
            <section class="breath65-expiration" aria-labelledby="breath65-expiration-title">
                <h4 id="breath65-expiration-title">R → S: forced expiration</h4>
                <p><strong>Internal intercostals contract</strong><br>Diaphragm relaxes towards its dome shape</p>
                <p>Ribs move <strong>down and in</strong></p>
                <p class="breath65-volume">Thorax volume ↓</p>
                <p>Lung pressure rises above atmospheric pressure</p>
                <p class="breath65-air">Air moves out</p>
            </section>
        </div>
        <figure class="breath65-graph explanation-photo explanation-visual" data-explanation-visual="65">
                <a href="images/question-65-thorax-volume.png" target="_blank" rel="noreferrer" aria-label="Open the original thorax-volume graph at full size">
                    <img src="images/question-65-thorax-volume.png" width="1168" height="808" alt="Thorax volume in cubic centimetres against time, with no numerical time scale. P is at 3000, Q at 2500, R at 6000, S at 1200 and T at 3000. The curve falls from P to Q, rises from Q to R, falls from R to S and rises from S to T." loading="lazy" decoding="async">
                </a>
                <figcaption>Original thorax-volume graph. Open the image to view it at full size. Image: Cambridge University Press &amp; Assessment, © 2026, from <a href="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s26_qp_22.pdf" target="_blank" rel="noreferrer">0610/22/M/J/26, question 19</a>.</figcaption>
            </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Incorrect — R to S is forced expiration, when the external intercostals relax. Quiet expiration P to Q does not require strong internal intercostal contraction.</li>
            <li><strong>B:</strong> Incorrect — Q to R is inspiration, when the internal intercostals relax. S to T is a valid inspiration interval, but the internal-muscle entry makes this row wrong.</li>
            <li><strong>C:</strong> Correct — internal intercostals contract during R to S, and external intercostals contract during Q to R.</li>
            <li><strong>D:</strong> Incorrect — the roles are reversed: S to T is inspiration, while P to Q is expiration.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <p class="relationship">Thorax volume ↑ → lung pressure falls below atmospheric pressure → inspiration.<br>Thorax volume ↓ → lung pressure rises above atmospheric pressure → expiration.</p>
        <p>Follow the direction of the curve between the letters. The time axis has no numerical scale, so the graph supports identifying breathing phases rather than calculating a numerical airflow rate.</p>
        <p class="relationship">Final answer: C — R to S (internal), Q to R (external).</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The table shows the composition of blood entering and leaving the kidneys and liver. Which row is correct?</span>',
    paperCode: "0610/22/F/M/26",
    paperSession: "Feb/March 2026",
    legend: "Choose the row showing the highest and lowest urea concentrations",
    context: `
        <div class="urea66-question">
            <div class="urea66-table-scroll" tabindex="0" role="region" aria-label="Urea concentration answer rows; scroll horizontally if needed">
                <table class="comparison-table answer-selection-table urea66-options">
                    <caption>Choose one row</caption>
                    <colgroup><col style="width:70px"><col><col></colgroup>
                    <thead><tr><th scope="col">Row</th><th scope="col">Highest concentration of urea in the blood</th><th scope="col">Lowest concentration of urea in the blood</th></tr></thead>
                    <tbody>
                        <tr data-answer-choice="A"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="A" aria-label="Select A: highest entering kidneys; lowest leaving liver" aria-pressed="false">A</button></th><td>Entering kidneys</td><td>Leaving liver</td></tr>
                        <tr data-answer-choice="B"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="B" aria-label="Select B: highest entering kidneys; lowest entering liver" aria-pressed="false">B</button></th><td>Entering kidneys</td><td>Entering liver</td></tr>
                        <tr data-answer-choice="C"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="C" aria-label="Select C: highest leaving kidneys; lowest entering liver" aria-pressed="false">C</button></th><td>Leaving kidneys</td><td>Entering liver</td></tr>
                        <tr data-answer-choice="D"><th scope="row"><button class="answer-table-choice" type="button" data-answer-choice="D" aria-label="Select D: highest leaving kidneys; lowest leaving liver" aria-pressed="false">D</button></th><td>Leaving kidneys</td><td>Leaving liver</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,
    options: ["Highest: entering kidneys; lowest: leaving liver", "Highest: entering kidneys; lowest: entering liver", "Highest: leaving kidneys; lowest: entering liver", "Highest: leaving kidneys; lowest: leaving liver"],
    hideAnswerOptions: true,
    correct: "B",
    answer: "B. Intended answer: highest entering kidneys; lowest entering liver",
    explanation: `
        <p class="definition"><strong>B is the intended answer among the listed rows.</strong> The key organ functions are that the <strong>liver produces urea</strong> and the <strong>kidneys remove urea from the blood</strong>. These functions establish changes across each organ; they do not, by themselves, establish an absolute ranking of all four blood samples.</p>

        <h3>Step 1: The liver produces urea</h3>
        <ul class="option-explanations">
            <li>Excess amino acids cannot be stored as a reserve of amino acids.</li>
            <li>They undergo <strong>deamination in the liver</strong>.</li>
            <li>The nitrogen-containing part forms toxic <strong>ammonia</strong>, which is converted into <strong>urea</strong>.</li>
            <li>Urea enters the bloodstream and is carried to the kidneys.</li>
        </ul>
        <p class="relationship">Excess amino acids → deamination → ammonia → urea</p>
        <p>The liver adds urea to the blood. In the simplified comparison used in this question, blood leaving the liver gains urea compared with blood entering it.</p>

        <h3>Step 2: The kidneys remove urea</h3>
        <ul class="option-explanations">
            <li>Blood reaches each kidney through a <strong>renal artery</strong>.</li>
            <li>The kidneys remove urea from the blood and excrete it in <strong>urine</strong>.</li>
            <li>Blood leaves each kidney through a <strong>renal vein</strong>, with a lower urea concentration than the incoming blood in the exam model.</li>
        </ul>
        <div class="urea66-organs" role="group" aria-label="Changes in urea across each organ">
            <section aria-labelledby="urea66-liver-title">
                <h4 id="urea66-liver-title">Liver: produces urea</h4>
                <p>Incoming blood → <strong>urea is added</strong> → outgoing blood</p>
                <p>The liver converts nitrogen from excess amino acids into urea.</p>
            </section>
            <section class="urea66-kidney" aria-labelledby="urea66-kidney-title">
                <h4 id="urea66-kidney-title">Kidneys: remove urea</h4>
                <p>Renal artery → <strong>urea is removed</strong> → renal vein</p>
                <p>Removed urea is excreted in urine.</p>
            </section>
        </div>

        <h3>Step 3: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Not the intended answer — labelling blood leaving the liver as lowest conflicts with the liver’s role in adding urea.</li>
            <li><strong>B:</strong> Intended answer — its entries fit the expected within-organ directions: entering kidneys has more urea than leaving kidneys, and entering liver has less than leaving liver.</li>
            <li><strong>C:</strong> Not the intended answer — blood leaving the kidneys has had urea removed, so it is not the expected “highest” entry.</li>
            <li><strong>D:</strong> Not the intended answer — it labels kidney outflow highest and liver outflow lowest, opposing the expected organ effects.</li>
        </ul>
        <aside class="urea66-qualification" aria-label="Scientific qualification about the question">
            <p><strong>Scientific qualification:</strong> The table is not perfectly precise. The question gives no measurements or other information sufficient to rank all four samples absolutely. In particular, it does not establish that blood entering the liver has less urea than blood leaving the kidneys. <strong>B is the intended choice from the options</strong>; the strongest biological conclusions are the changes across each organ.</p>
        </aside>

        <h3>Reference image: the liver and its blood supply</h3>
        <figure class="explanation-photo explanation-visual urea66-liver-photo" data-explanation-visual="66">
            <a href="images/online-hepatic-portal-vein.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded liver blood-supply illustration at full size">
                <img src="images/online-hepatic-portal-vein.jpg" width="960" height="619" alt="Published anatomical illustration locates the liver and shows the hepatic portal vein bringing blood from the digestive organs to it." loading="lazy" decoding="async">
            </a>
            <figcaption>This illustration locates the liver and its portal blood supply. It provides anatomical context; it does not measure urea concentrations or rank the question’s blood samples. Image: OpenStax College, via <a href="https://commons.wikimedia.org/wiki/File:2138_Hepatic_Portal_Vein_System.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.</figcaption>
        </figure>

        <h3>IGCSE exam tip</h3>
        <p class="relationship">Liver → produces urea.<br>Kidneys → remove urea and excrete it in urine.</p>
        <p>Distinguish <strong>urea production by the liver</strong> from <strong>urea excretion by the kidneys</strong>. When a question compares blood samples, check the direction of change across each organ before making a wider comparison.</p>
        <p class="relationship">Intended final answer: B — highest entering kidneys; lowest entering liver.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">A cell divides by mitosis once every 3 hours and 24 minutes. How long will it take to produce 8 new cells from this original cell?</span>',
    paperCode: "0610/22/F/M/26",
    paperSession: "Feb/March 2026",
    legend: "Choose the time needed, in minutes",
    options: ["583 minutes", "612 minutes", "1555 minutes", "1632 minutes"],
    correct: "B",
    answer: "B. 612 minutes",
    explanation: `
        <p class="definition"><strong>B is correct:</strong> one division interval is <strong>204 minutes</strong>. The population doubles in each completed round: <strong>1 → 2 → 4 → 8</strong>. Three rounds take <strong>3 × 204 = 612 minutes</strong>.</p>

        <h3>Step 1: Convert the interval into minutes</h3>
        <p class="relationship">3 hours and 24 minutes = (3 × 60) + 24 = 204 minutes</p>
        <p>Each completed division produces two daughter cells from one cell. This calculation assumes that the daughter cells continue dividing at the same interval and that each division includes cytokinesis.</p>

        <h3>Step 2: Count the rounds of division</h3>
        <figure class="mitosis67-growth" aria-labelledby="mitosis67-growth-title">
            <figcaption id="mitosis67-growth-title">One cell becomes eight cells in three rounds</figcaption>
            <div class="mitosis67-stages">
                <section class="mitosis67-stage" aria-label="Start: 1 cell at 0 minutes">
                    <h4>Start</h4><p class="mitosis67-time">0 minutes</p>
                    <div class="mitosis67-cells" aria-hidden="true"><span class="mitosis67-cell"></span></div>
                    <p class="mitosis67-count">1 cell</p>
                </section>
                <section class="mitosis67-stage" aria-label="Round 1: 2 cells at 204 minutes">
                    <h4>Round 1</h4><p class="mitosis67-time">204 minutes</p>
                    <div class="mitosis67-cells" aria-hidden="true"><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span></div>
                    <p class="mitosis67-count">2 cells</p>
                </section>
                <section class="mitosis67-stage" aria-label="Round 2: 4 cells at 408 minutes">
                    <h4>Round 2</h4><p class="mitosis67-time">408 minutes</p>
                    <div class="mitosis67-cells" aria-hidden="true"><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span></div>
                    <p class="mitosis67-count">4 cells</p>
                </section>
                <section class="mitosis67-stage mitosis67-final" aria-label="Round 3: 8 cells at 612 minutes">
                    <h4>Round 3</h4><p class="mitosis67-time">612 minutes</p>
                    <div class="mitosis67-cells" aria-hidden="true"><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span><span class="mitosis67-cell"></span></div>
                    <p class="mitosis67-count">8 cells</p>
                </section>
            </div>
            <p class="mitosis67-interval">Each round adds 204 minutes and doubles the population.</p>
        </figure>
        <p>The count of eight is the <strong>final population of cells descended from the original cell</strong>. The original cell divides into daughter cells rather than remaining as an additional cell.</p>
        <p>The model assumes that all cells in each round divide in parallel, with no cell loss. Later rounds involve several cells dividing during the same interval.</p>
        <p class="relationship">Number of cells = 1 × 2<sup>n</sup><br>8 = 2<sup>3</sup>, so n = 3 completed rounds</p>

        <h3>Step 3: Calculate the total time</h3>
        <p class="relationship">3 rounds × 204 minutes per round = 612 minutes</p>
        <p>This is <strong>10 hours and 12 minutes</strong>, consistent with three intervals of 3 hours and 24 minutes.</p>

        <h3>Published visual guide: one cell divides into two</h3>
        <figure class="explanation-photo explanation-visual mitosis67-photo" data-explanation-visual="67">
            <a href="images/online-mitosis-cytokinesis.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded mitosis and cytokinesis image at full size">
                <img src="images/online-mitosis-cytokinesis.jpg" width="1118" height="861" alt="Published sequence shows stages of mitosis and cytokinesis, ending with two daughter cells from one parent cell." loading="lazy" decoding="async">
            </a>
            <figcaption>Mitosis separates copied chromosomes and cytokinesis divides the cell into two daughter cells. The timing values in the worked example come from the question, rather than from this general illustration. Image: OpenStax, Anatomy and Physiology (2016 edition), via <a href="https://commons.wikimedia.org/wiki/File:0331_Stages_of_Mitosis_and_Cytokinesis.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</figcaption>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 583 minutes:</strong> Incorrect — this is not three complete 204-minute intervals.</li>
            <li><strong>B. 612 minutes:</strong> Correct — three rounds produce a final population of eight cells.</li>
            <li><strong>C. 1555 minutes:</strong> Incorrect — this does not match the three required intervals.</li>
            <li><strong>D. 1632 minutes:</strong> Incorrect — 8 × 204 counts eight intervals, but only three population-doubling intervals are needed.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <p class="exam-tip"><strong>Count rounds, then multiply by the interval.</strong> The sequence is 1 → 2 → 4 → 8 → 16. Reaching eight cells takes three rounds. Cells in the same round divide in parallel; they do not wait for every other cell to finish first.</p>
        <p class="relationship">Final answer: B — 612 minutes.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The allele for short hair in cats is recessive and the allele for long hair is dominant. The pedigree shows inheritance of hair length in a family of cats. How many cats must be heterozygous for hair length?</span>',
    paperCode: "0610/22/F/M/26",
    paperSession: "Feb/March 2026",
    legend: "Count only the cats that must be heterozygous",
    context: `
        <div class="cat68-question">
            <figure class="cat68-pedigree">
            <div class="cat68-image-scroll" tabindex="0" role="region" aria-label="Original cat pedigree; scroll horizontally to see the complete diagram and key">
                <div class="cat68-image-wrap">
                    <a href="images/question-68-cat-pedigree.png" target="_blank" rel="noreferrer" aria-label="Open the original cat pedigree at full size">
                        <img src="images/question-68-cat-pedigree.png" width="1191" height="525" alt="Unshaded cats have long hair and shaded cats short hair. A short-haired male and long-haired female have a short-haired son. He and a long-haired female have a short-haired daughter, long-haired son and long-haired daughter. The short-haired daughter and her long-haired male partner have a long-haired daughter. The other long-haired daughter and her long-haired male partner have a short-haired daughter." decoding="async">
                    </a>
                    
                </div>
            </div>
            <figcaption>Unshaded symbols: long hair; shaded: short hair. Squares: males; circles: females. Scroll sideways to see the full diagram and key.</figcaption>
        </figure>
            <p>Use the question’s allele relationship: <strong>long hair is dominant</strong> and <strong>short hair is recessive</strong>.</p>
        </div>
    `,
    options: ["4 cats", "5 cats", "6 cats", "7 cats"],
    correct: "C",
    answer: "C. 6 cats must be heterozygous",
    explanation: `
        <p class="definition"><strong>C is correct: six cats must be heterozygous, Ll.</strong> A long-haired cat must carry the recessive allele if it has a short-haired offspring, or if one of its parents is short-haired.</p>

        <h3>Step 1: Restore the allele and genotype notation</h3>
        <p>Let <strong>L</strong> represent the dominant allele for long hair and <strong>l</strong> the recessive allele for short hair.</p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Use the dominance relationship given in this question</caption>
            <colgroup><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Genotype</th><th scope="col">Hair length</th></tr></thead>
            <tbody><tr><th scope="row">LL</th><td>Long hair; homozygous dominant.</td></tr><tr><th scope="row">Ll</th><td>Long hair; heterozygous.</td></tr><tr><th scope="row">ll</th><td>Short hair; homozygous recessive.</td></tr></tbody>
        </table>
        <p>Every shaded, short-haired cat must be <strong>ll</strong>. An unshaded, long-haired cat may be <strong>LL or Ll</strong>; family relationships identify which ones must be Ll.</p>

        <h3>Step 2: Identify the six cats</h3>
        <figure class="cat68-pedigree" data-explanation-visual="68">
            <div class="cat68-image-scroll" tabindex="0" role="region" aria-label="Numbered pedigree: six cats that must be Ll">
                <div class="cat68-image-wrap">
                    <a href="images/question-68-cat-pedigree.png" target="_blank" rel="noreferrer" aria-label="Open the original cat pedigree at full size">
                        <img src="images/question-68-cat-pedigree.png" width="1191" height="525" alt="Unshaded cats have long hair and shaded cats short hair. A short-haired male and long-haired female have a short-haired son. He and a long-haired female have a short-haired daughter, long-haired son and long-haired daughter. The short-haired daughter and her long-haired male partner have a long-haired daughter. The other long-haired daughter and her long-haired male partner have a short-haired daughter." loading="lazy" decoding="async">
                    </a>
                    <span class="cat68-highlight" style="left:25.02%;top:8.447%" aria-hidden="true"><span class="cat68-marker" title="1. I-2: must be Ll">1</span></span><span class="cat68-highlight" style="left:30.595%;top:36.752%" aria-hidden="true"><span class="cat68-marker" title="2. II-2: must be Ll">2</span></span><span class="cat68-highlight cat68-male" style="left:25.329%;top:65.057%" aria-hidden="true"><span class="cat68-marker" title="3. III-3: must be Ll">3</span></span><span class="cat68-highlight" style="left:36.288%;top:65.057%" aria-hidden="true"><span class="cat68-marker cat68-marker4" title="4. III-4: must be Ll">4</span></span><span class="cat68-highlight cat68-male" style="left:47.247%;top:65.057%" aria-hidden="true"><span class="cat68-marker" title="5. III-5: must be Ll">5</span></span><span class="cat68-highlight" style="left:9.003%;top:93.362%" aria-hidden="true"><span class="cat68-marker" title="6. IV-1: must be Ll">6</span></span>
                </div>
            </div>
            <figcaption>Green outlines and numbers 1–6 identify the cats that must be Ll. The list below explains each one. Unshaded symbols: long hair; shaded: short hair. Squares: males; circles: females. Scroll sideways to see the full diagram and key. Original image: Cambridge University Press &amp; Assessment, © 2026, from <a href="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_m26_qp_22.pdf" target="_blank" rel="noreferrer">0610/22/F/M/26, question 30</a>. The green annotations are HTML overlays; the downloaded PNG is unchanged.</figcaption>
        </figure>
        <p>Generations are I to IV from top to bottom. Within each generation, individuals are numbered left to right, <strong>including partners</strong>.</p>
        <ol class="cat68-reasons">
            <li><strong>I-2: first-generation female.</strong> Her short-haired son is ll, so she must have supplied l. Since she is long-haired, she is <strong>Ll</strong>.</li>
            <li><strong>II-2: second-generation female.</strong> She has a short-haired daughter, so she carries l. Her long-haired phenotype means she is <strong>Ll</strong>.</li>
            <li><strong>III-3: third-generation long-haired son in the centre.</strong> His short-haired father is ll and can only pass on l. He is long-haired, so he is <strong>Ll</strong>.</li>
            <li><strong>III-4: third-generation long-haired daughter on the right.</strong> She also has the short-haired father, so she must be <strong>Ll</strong>.</li>
            <li><strong>III-5: long-haired male on the far right.</strong> His short-haired daughter is ll, so he must carry l. He is therefore <strong>Ll</strong>.</li>
            <li><strong>IV-1: fourth-generation long-haired female on the left.</strong> Her short-haired mother is ll, so she inherits l from her mother. Long hair means she also has L, making her <strong>Ll</strong>.</li>
        </ol>
        <p class="cat68-count"><strong>Six certain heterozygotes: I-2, II-2, III-3, III-4, III-5 and IV-1.</strong></p>
        <p><strong>Do not count III-1</strong>, the long-haired male on the far left of generation III. His long-haired daughter could receive L from either an LL or an Ll father. The pedigree does not establish his second allele.</p>

        <h3>Step 3: Understand the crosses</h3>
        <p>Two long-haired heterozygotes can have a short-haired kitten:</p>
        <figure class="cat68-square" aria-labelledby="cat68-square-title">
            <figcaption id="cat68-square-title">Punnett square: Ll × Ll</figcaption>
            <p>Each parent produces L or l gametes. Scroll the square sideways if needed.</p>
            <div class="cat68-scroll" tabindex="0" role="region" aria-label="Ll crossed with Ll Punnett square; scroll horizontally if needed">
                <table>
                    <caption class="visually-hidden">L and l gametes combine to produce LL, Ll, Ll and ll</caption>
                    <colgroup><col style="width:20%"><col><col></colgroup>
                    <thead><tr><th scope="col">Gametes ↓</th><th scope="col">L</th><th scope="col">l</th></tr></thead>
                    <tbody>
                        <tr><th scope="row">L</th><td><strong>LL</strong><span>Long hair</span></td><td><strong>Ll</strong><span>Long hair</span></td></tr>
                        <tr><th scope="row">l</th><td><strong>Ll</strong><span>Long hair</span></td><td class="cat68-recessive"><strong>ll</strong><span>Short hair</span></td></tr>
                    </tbody>
                </table>
            </div>
        </figure>
        <p>For a short-haired parent crossed with a long-haired parent, the cross could be <strong>ll × LL</strong> or <strong>ll × Ll</strong>. Any <strong>long-haired offspring</strong> must be <strong>Ll</strong>: its short-haired parent always supplies l, and its long-haired phenotype requires L.</p>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. 4:</strong> Incorrect — fewer than the six certain Ll cats.</li>
            <li><strong>B. 5:</strong> Incorrect — one certain heterozygote has been missed.</li>
            <li><strong>C. 6:</strong> Correct — all six are established by the pedigree.</li>
            <li><strong>D. 7:</strong> Incorrect — this would include a cat whose genotype is not established, such as III-1.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <ul class="option-explanations">
            <li>Recessive phenotype → <strong>ll</strong>.</li>
            <li>Dominant phenotype alone → <strong>LL or Ll</strong>.</li>
            <li>Dominant parent with a recessive offspring → must be <strong>Ll</strong>.</li>
            <li>Dominant offspring with an ll parent → must be <strong>Ll</strong>.</li>
        </ul>
        <p class="exam-tip">Count only individuals that <strong>must</strong> be heterozygous, rather than everyone who <strong>could</strong> be heterozygous.</p>
        <p class="relationship">Final answer: C — 6 cats.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">Some fruit flies have orange eyes and others have red eyes. What can be concluded from the breeding observations?</span>',
    paperCode: "0610/23/M/J/22",
    paperSession: "May/June 2022",
    legend: "Choose the conclusion supported by the offspring eye colours",
    context: `
        <div class="fruit69-question">
            <ul class="option-explanations">
                <li>If two orange-eyed fruit flies are crossed, their offspring always have orange eyes.</li>
                <li>If two red-eyed fruit flies are crossed, their offspring can have orange eyes or red eyes.</li>
            </ul>
        </div>
    `,
    options: [
        "The allele for orange eyes is dominant.",
        "The allele for orange eyes is recessive.",
        "The alleles for orange and red eyes are codominant.",
        "This is an example of sex linkage."
    ],
    correct: "B",
    answer: "B. The allele for orange eyes is recessive",
    explanation: `
        <p class="definition"><strong>B is correct.</strong> Two red-eyed parents can produce orange-eyed offspring if both carry a recessive orange-eye allele. Under the simple inheritance model, <strong>red eyes are dominant</strong> and <strong>orange eyes are recessive</strong>.</p>

        <h3>Step 1: Restore the allele notation</h3>
        <p>Let <strong class="fruit69-genotype">R</strong> represent the dominant allele for red eyes and <strong class="fruit69-genotype">r</strong> the recessive allele for orange eyes.</p>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Genotype and phenotype in this question</caption>
            <colgroup><col style="width:28%"><col></colgroup>
            <thead><tr><th scope="col">Genotype</th><th scope="col">Eye colour</th></tr></thead>
            <tbody><tr><th scope="row"><span class="fruit69-genotype">RR</span></th><td>Red; homozygous dominant.</td></tr><tr><th scope="row"><span class="fruit69-genotype">Rr</span></th><td>Red; heterozygous.</td></tr><tr><th scope="row"><span class="fruit69-genotype">rr</span></th><td>Orange; homozygous recessive.</td></tr></tbody>
        </table>

        <h3>Step 2: Explain the orange-eyed cross</h3>
        <p>Both orange-eyed parents must be <strong class="fruit69-genotype">rr</strong>. Each produces gametes carrying only <strong class="fruit69-genotype">r</strong>.</p>
        <figure class="fruit69-square" aria-labelledby="fruit69-orange-title">
            <figcaption id="fruit69-orange-title">Orange-eyed parents: rr × rr</figcaption>
            <p>Both rows and columns represent gametes carrying r. Scroll the square sideways if needed.</p>
            <div class="fruit69-scroll" tabindex="0" role="region" aria-label="Orange-eyed rr crossed with rr Punnett square; scroll horizontally if needed">
                <table class="fruit69-orange-table">
                    <caption class="visually-hidden">Every gamete combination gives rr and orange eyes</caption>
                    <colgroup><col style="width:20%"><col><col></colgroup>
                    <thead><tr><th scope="col">Gametes ↓</th><th scope="col">r</th><th scope="col">r</th></tr></thead>
                    <tbody>
                        <tr><th scope="row">r</th><td class="fruit69-orange"><strong class="fruit69-genotype">rr</strong><span>Orange eyes</span></td><td class="fruit69-orange"><strong class="fruit69-genotype">rr</strong><span>Orange eyes</span></td></tr>
                        <tr><th scope="row">r</th><td class="fruit69-orange"><strong class="fruit69-genotype">rr</strong><span>Orange eyes</span></td><td class="fruit69-orange"><strong class="fruit69-genotype">rr</strong><span>Orange eyes</span></td></tr>
                    </tbody>
                </table>
            </div>
            <p class="fruit69-summary"><strong>100% rr: orange eyes.</strong> Every offspring receives r from each parent.</p>
        </figure>

        <h3>Step 3: Explain how red-eyed parents can have orange-eyed offspring</h3>
        <p>Both red-eyed parents can be <strong class="fruit69-genotype">Rr</strong>. Their dominant R allele gives red eyes, while each carries the recessive r allele. Each parent produces R or r gametes.</p>
        <figure class="fruit69-square" aria-labelledby="fruit69-red-title">
            <figcaption id="fruit69-red-title">Heterozygous red-eyed parents: Rr × Rr</figcaption>
            <p>Combine one allele from each parent. Each cell represents an equally likely gamete combination. Scroll sideways if needed.</p>
            <div class="fruit69-scroll" tabindex="0" role="region" aria-label="Red-eyed Rr crossed with Rr Punnett square; scroll horizontally if needed">
                <table class="fruit69-red-table">
                    <caption class="visually-hidden">RR, Rr and Rr give red eyes; rr gives orange eyes</caption>
                    <colgroup><col style="width:20%"><col><col></colgroup>
                    <thead><tr><th scope="col">Gametes ↓</th><th scope="col">R</th><th scope="col">r</th></tr></thead>
                    <tbody>
                        <tr><th scope="row">R</th><td class="fruit69-red"><strong class="fruit69-genotype">RR</strong><span>Red eyes</span><span class="fruit69-probability">25%</span></td><td class="fruit69-red"><strong class="fruit69-genotype">Rr</strong><span>Red eyes</span><span class="fruit69-probability">25%</span></td></tr>
                        <tr><th scope="row">r</th><td class="fruit69-red"><strong class="fruit69-genotype">Rr</strong><span>Red eyes</span><span class="fruit69-probability">25%</span></td><td class="fruit69-orange"><strong class="fruit69-genotype">rr</strong><span>Orange eyes</span><span class="fruit69-probability">25%</span></td></tr>
                    </tbody>
                </table>
            </div>
            <p class="fruit69-summary"><strong>Expected: 75% red eyes and 25% orange eyes.</strong> The phenotypic ratio is 3 red : 1 orange.</p>
        </figure>
        <p>These are probabilities for each offspring. Each fertilisation is independent; four offspring are <strong>not guaranteed</strong> to include exactly three red-eyed flies and one orange-eyed fly.</p>

        <h3>Reference photograph: a red-eyed fruit fly</h3>
        <figure class="explanation-photo explanation-visual fruit69-photo" data-explanation-visual="69">
            <a href="images/online-red-eyed-fruit-fly.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded fruit-fly photograph at full size">
                <img src="images/online-red-eyed-fruit-fly.jpg" width="546" height="424" alt="Side-view photograph of a fruit fly, Drosophila melanogaster, with a visibly red compound eye." loading="lazy" decoding="async">
            </a>
            <figcaption>A fruit fly with a visibly red compound eye illustrates the organism in the question. Its genotype is not established by the photograph. Image: André Karwath, via <a href="https://commons.wikimedia.org/wiki/File:Drosophila_melanogaster_-_side_(aka).jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by-sa/2.5/" target="_blank" rel="noreferrer">CC BY-SA 2.5</a>. Downloaded unchanged.</figcaption>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A. Orange is dominant:</strong> Incorrect — under that simple model, both red-eyed parents would be homozygous recessive and could not produce orange-eyed offspring.</li>
            <li><strong>B. Orange is recessive:</strong> Correct — rr × rr gives orange-eyed offspring, while Rr × Rr can give either eye colour.</li>
            <li><strong>C. Codominance:</strong> Incorrect — the observations give no evidence of both eye colours being expressed together in heterozygotes.</li>
            <li><strong>D. Sex linkage:</strong> Unsupported — no comparison of male and female offspring is given, so sex linkage cannot be concluded from these observations.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <p class="exam-tip">Two parents with a <strong>dominant phenotype</strong> can have offspring with the <strong>recessive phenotype</strong> when both parents are heterozygous. For Rr × Rr, the genotype ratio is <strong>1 RR : 2 Rr : 1 rr</strong> and the expected phenotype ratio is <strong>3 red : 1 orange</strong>.</p>
        <p class="relationship">Final answer: B — the allele for orange eyes is recessive.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">Which statement is correct?</span>',
    paperCode: "0610/21/O/N/21",
    paperSession: "Oct/Nov 2021",
    legend: "Choose the correct statement about genetic and phenotypic variation",
    options: [
        "Genetic variation can be caused by phenotypic variation.",
        "Mutations can be caused by phenotypic variation.",
        "Phenotypic variation can be caused by genetic variation.",
        "Phenotypic variation cannot be caused by mutations."
    ],
    correct: "C",
    answer: "C. Phenotypic variation can be caused by genetic variation",
    explanation: `
        <p class="definition"><strong>C is correct.</strong> Differences in alleles or other DNA sequences can produce differences in observable characteristics. Phenotypic variation can result from <strong>genetic factors, environmental factors, or both</strong>.</p>

        <h3>Step 1: Distinguish the two types of variation</h3>
        <ul class="option-explanations">
            <li><strong>Genetic variation:</strong> differences in alleles or DNA sequences between individuals of the same species.</li>
            <li><strong>Phenotypic variation:</strong> differences in observable characteristics between individuals of the same species.</li>
        </ul>
        <p>Different alleles can affect the proteins made by cells and therefore an organism’s characteristics. The environment can also affect how characteristics develop.</p>

        <h3>Step 2: Follow the relationship</h3>
        <figure class="variation70-flow" aria-labelledby="variation70-flow-title">
            <figcaption id="variation70-flow-title">Genes and the environment can influence phenotype</figcaption>
            <div class="variation70-inputs">
                <section class="variation70-genetic" aria-labelledby="variation70-genetic-title">
                    <h4 id="variation70-genetic-title">Genetic factors</h4>
                    <p>Different alleles or combinations of alleles.</p>
                    <p>Mutations can create new alleles; some affect the phenotype.</p>
                </section>
                <section class="variation70-environment" aria-labelledby="variation70-environment-title">
                    <h4 id="variation70-environment-title">Environmental factors</h4>
                    <p>Nutrition, temperature, light and other conditions.</p>
                    <p>These can influence a characteristic without changing the organism’s DNA.</p>
                </section>
            </div>
            <p class="variation70-arrow" aria-hidden="true">↓</p>
            <section class="variation70-output" aria-labelledby="variation70-output-title">
                <h4 id="variation70-output-title">Phenotypic variation</h4>
                <p>Differences in observable characteristics.</p>
                <p>The relative contributions of genes and environment depend on the characteristic.</p>
            </section>
        </figure>

        <h3>Step 3: Compare examples</h3>
        <table class="comparison-table variation70-examples" style="table-layout:fixed">
            <caption>Different characteristics have different influences</caption>
            <colgroup><col style="width:38%"><col></colgroup>
            <thead><tr><th scope="col">Characteristic</th><th scope="col">Cause of variation</th></tr></thead>
            <tbody>
                <tr><th scope="row">ABO blood group</th><td>Genetic: inherited ABO alleles determine the blood group.</td></tr>
                <tr><th scope="row">Natural eye colour</th><td>Mainly genetic.</td></tr>
                <tr><th scope="row">Height</th><td>Genetic and environmental, including nutrition during growth.</td></tr>
                <tr><th scope="row">Body mass</th><td>Genetic and environmental, including nutrition and activity.</td></tr>
                <tr><th scope="row">Scars from an injury</th><td>Mainly environmental: the injury produces the scar.</td></tr>
            </tbody>
        </table>

        <h3>Published example: inherited blood groups</h3>
        <figure class="explanation-photo explanation-visual variation70-photo" data-explanation-visual="70">
            <a href="images/online-abo-codominance.png" target="_blank" rel="noreferrer" aria-label="Open the downloaded ABO inheritance illustration at full size">
                <img src="images/online-abo-codominance.png" width="960" height="956" alt="Published ABO inheritance diagram shows a parent carrying A and O alleles and a parent carrying B and O alleles, with possible offspring carrying AO, AB, BO or OO and having blood groups A, AB, B or O." loading="lazy" decoding="async">
            </a>
            <figcaption>Different inherited allele combinations can produce different ABO blood groups: an example of genetic variation causing phenotypic variation. The four offspring are possible outcomes, rather than a guaranteed set of four children. Image: YassineMrabet, based on an NIH illustration, via <a href="https://commons.wikimedia.org/wiki/File:ABO_system_codominance.svg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/publicdomain/mark/1.0/" target="_blank" rel="noreferrer">public domain</a>.</figcaption>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Incorrect — this reverses the intended relationship. Observable differences are outcomes; they do not themselves explain differences in alleles.</li>
            <li><strong>B:</strong> Incorrect — mutations are changes in genetic material. Phenotypic variation itself does not explain how the DNA changed.</li>
            <li><strong>C:</strong> Correct — differences in alleles can produce observable differences between individuals.</li>
            <li><strong>D:</strong> Incorrect — mutations can produce new alleles that affect the phenotype. Some mutations have no detectable effect, so a mutation does not always cause a visible change.</li>
        </ul>
        <p><strong>Keep two environmental effects distinct.</strong> Many environmental influences change the phenotype without altering DNA. Some environmental agents, such as ionising radiation, can instead cause mutations in genetic material.</p>

        <h3>IGCSE exam tip: key terms</h3>
        <table class="comparison-table" style="table-layout:fixed">
            <caption>Genotype, phenotype, mutation and genetic variation</caption>
            <colgroup><col style="width:38%"><col></colgroup>
            <thead><tr><th scope="col">Term</th><th scope="col">Meaning</th></tr></thead>
            <tbody>
                <tr><th scope="row">Genotype</th><td>The alleles an organism has; its genetic makeup.</td></tr>
                <tr><th scope="row">Phenotype</th><td>An organism’s observable characteristics.</td></tr>
                <tr><th scope="row">Mutation</th><td>A change in genetic material.</td></tr>
                <tr><th scope="row">Genetic variation</th><td>Differences in genetic makeup between individuals of the same species.</td></tr>
            </tbody>
        </table>
        <p class="relationship">Phenotype is influenced by genotype and the environment.</p>
        <p class="exam-tip">“Phenotype = genotype + environmental influences” is a useful memory aid. It expresses the contributions of genes and environment, rather than a literal numerical equation.</p>
        <p class="relationship">Final answer: C — phenotypic variation can be caused by genetic variation.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The graphs show how the rates of photosynthesis and respiration in a plant change over a 24-hour period. Which graph shows the correct pattern?</span>',
    paperCode: "0610/22/F/M/25",
    paperSession: "Feb/March 2025",
    legend: "Choose the correct graph for photosynthesis and respiration",
    context: `
        <div class="daynight71-question">
            <div class="daynight71-key" role="group" aria-label="Graph key">
                <span><span class="daynight71-key-line" aria-hidden="true"></span>Solid: photosynthesis</span>
                <span><span class="daynight71-key-line daynight71-key-dashed" aria-hidden="true"></span>Dashed: respiration</span>
            </div>
            <p class="daynight71-instruction">Compare both curves across the full 24 hours. Scroll inside a graph if needed.</p>
        </div>
    `,
    options: [
        `<span class="daynight71-option"><span class="daynight71-option-scroll" tabindex="0" role="region" aria-label="Graph A; scroll horizontally if needed"><img src="images/question-71-graph-a.png" width="860" height="724" alt="Graph A. Rate in arbitrary units against time of day, 0 to 24 hours. The solid curve is zero in darkness, peaks in the middle of the day and returns to zero. The dashed curve stays above zero throughout the 24 hours, varying gently." decoding="async"></span></span>`,
        `<span class="daynight71-option"><span class="daynight71-option-scroll" tabindex="0" role="region" aria-label="Graph B; scroll horizontally if needed"><img src="images/question-71-graph-b.png" width="860" height="724" alt="Graph B. Rate in arbitrary units against time of day, 0 to 24 hours. Both solid and dashed curves are bell shaped during daylight and zero at night. The solid peak is above the dashed peak." decoding="async"></span></span>`,
        `<span class="daynight71-option"><span class="daynight71-option-scroll" tabindex="0" role="region" aria-label="Graph C; scroll horizontally if needed"><img src="images/question-71-graph-c.png" width="860" height="784" alt="Graph C. Rate in arbitrary units against time of day, 0 to 24 hours. The solid curve stays above zero all day and night. The dashed curve is bell shaped during daylight and zero at night." decoding="async"></span></span>`,
        `<span class="daynight71-option"><span class="daynight71-option-scroll" tabindex="0" role="region" aria-label="Graph D; scroll horizontally if needed"><img src="images/question-71-graph-d.png" width="860" height="784" alt="Graph D. Rate in arbitrary units against time of day, 0 to 24 hours. Both solid and dashed curves are bell shaped during daylight and zero at night. The dashed peak is above the solid peak." decoding="async"></span></span>`
    ],
    correct: "A",
    answer: "A. Photosynthesis in light; respiration continues day and night",
    explanation: `
        <p class="definition"><strong>A is correct.</strong> In the natural day–night pattern shown, photosynthesis occurs during the light period and stops in darkness. <strong>Respiration continues throughout all 24 hours</strong>.</p>

        <h3>Step 1: Follow the photosynthesis curve</h3>
        <ul class="option-explanations">
            <li>Photosynthesis requires <strong>light energy</strong>.</li>
            <li>During the dark part of the day–night cycle, its rate is <strong>zero</strong>.</li>
            <li>As daylight increases, photosynthesis can increase.</li>
            <li>The plotted curve reaches a peak around the middle of the day, then falls as the light decreases.</li>
            <li>It returns to zero in darkness.</li>
        </ul>
        <p>The peak near midday is the pattern drawn in this question. The precise rate and timing of a real plant’s maximum also depend on temperature, carbon dioxide availability and other limiting factors.</p>

        <h3>Step 2: Follow the respiration curve</h3>
        <ul class="option-explanations">
            <li>Living plant cells need energy for their metabolic processes during both day and night.</li>
            <li>Respiration releases energy from chemical stores such as glucose.</li>
            <li>Respiration <strong>does not require light</strong>, so its rate stays above zero during the dark period.</li>
            <li>Its rate can vary with temperature and other conditions; continuous respiration does not mean a perfectly constant rate.</li>
        </ul>

        <h3>Visual guide: what happens in light and darkness?</h3>
        <figure class="daynight71-cycle" aria-labelledby="daynight71-cycle-title">
            <figcaption id="daynight71-cycle-title">The two processes over a day–night cycle</figcaption>
            <div class="daynight71-periods">
                <section class="daynight71-day" aria-labelledby="daynight71-day-title">
                    <h4 id="daynight71-day-title">Daylight: light available</h4>
                    <p><strong>Photosynthesis occurs</strong></p>
                    <p><strong>Respiration occurs</strong></p>
                    <p>Both processes can happen at the same time.</p>
                </section>
                <section class="daynight71-night" aria-labelledby="daynight71-night-title">
                    <h4 id="daynight71-night-title">Night: darkness</h4>
                    <p><strong>Photosynthesis stops</strong></p>
                    <p><strong>Respiration continues</strong></p>
                    <p>Cells still require energy for metabolic processes.</p>
                </section>
            </div>
        </figure>

        <h3>Step 3: Check the four graphs</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Correct — the solid photosynthesis curve is restricted to the light period, while the dashed respiration curve stays above zero throughout the 24 hours.</li>
            <li><strong>B:</strong> Incorrect — both curves fall to zero at night, incorrectly showing respiration stopping in darkness.</li>
            <li><strong>C:</strong> Incorrect — the solid photosynthesis curve remains above zero at night, while the dashed respiration curve stops at night. The patterns are assigned to the wrong processes.</li>
            <li><strong>D:</strong> Incorrect — its dashed respiration curve also returns to zero at night.</li>
        </ul>
        <figure class="explanation-photo explanation-visual daynight71-feedback-graph" data-explanation-visual="71">
            <a href="images/question-71-graph-a.png" target="_blank" rel="noreferrer" aria-label="Open the original correct graph A at full size"><img src="images/question-71-graph-a.png" width="860" height="724" alt="Correct graph A: solid photosynthesis curve is restricted to daylight; dashed respiration curve remains above zero throughout the 24-hour cycle." loading="lazy" decoding="async"></a>
            <figcaption>Original graph A. Solid: photosynthesis; dashed: respiration. Rates use arbitrary units. Image: Cambridge University Press &amp; Assessment, © UCLES 2025, from <a href="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_m25_qp_22.pdf" target="_blank" rel="noreferrer">0610/22/F/M/25, question 10</a>.</figcaption>
        </figure>

        <h3>Step 4: Compare photosynthesis and aerobic respiration</h3>
        <div class="daynight71-table-scroll" tabindex="0" role="region" aria-label="Photosynthesis and aerobic respiration comparison; scroll horizontally if needed">
            <table class="comparison-table daynight71-comparison">
                <caption>Compare the processes themselves</caption>
                <colgroup><col style="width:30%"><col style="width:35%"><col></colgroup>
                <thead><tr><th scope="col">Feature</th><th scope="col">Photosynthesis</th><th scope="col">Aerobic respiration</th></tr></thead>
                <tbody>
                    <tr><th scope="row">Light required</th><td>Yes</td><td>No</td></tr>
                    <tr><th scope="row">During daylight</th><td>Yes, when conditions allow</td><td>Yes</td></tr>
                    <tr><th scope="row">In darkness</th><td>No</td><td>Yes</td></tr>
                    <tr><th scope="row">Carbon dioxide</th><td>Used</td><td>Released</td></tr>
                    <tr><th scope="row">Oxygen</th><td>Released</td><td>Used</td></tr>
                    <tr><th scope="row">Energy</th><td>Light energy is transferred into chemical stores.</td><td>Energy is released from chemical stores such as glucose for cell activities.</td></tr>
                </tbody>
            </table>
        </div>
        <p>The graph shows the rates of the individual processes. A plant’s <strong>net gas exchange</strong> depends on their relative rates, because photosynthesis and respiration can occur simultaneously.</p>

        <h3>IGCSE exam tip</h3>
        <p class="exam-tip"><strong>Plants photosynthesise in the light and respire all the time.</strong> Check that the respiration line stays above zero during the dark part of the graph. Light is the condition for photosynthesis; darkness itself is not a requirement for respiration.</p>
        <p class="relationship">Final answer: A.</p>
    `
},
{
    title: '<span style="overflow-wrap:anywhere">The graph shows how the mass of DNA changes during a mitotic cell division. Where on the graph are two cells formed?</span>',
    paperCode: "0610/22/F/M/25",
    paperSession: "Feb/March 2025",
    legend: "Choose the point where two daughter cells are formed",
    context: `
        <div class="dna72-question">
            <figure class="dna72-graph">
                <a href="images/question-72-dna-mass.png" target="_blank" rel="noreferrer" aria-label="Open the original DNA mass graph at full size"><img src="images/question-72-dna-mass.png" width="1076" height="528" alt="DNA mass per cell in arbitrary units against time in hours, with no numerical tick values. A marks the start of the rise, B lies on the rising line, C marks the upper plateau’s beginning and D marks the drop to the original lower level." decoding="async"></a>
                <figcaption>Original DNA mass-per-cell graph. Open the image to view it at full size.</figcaption>
            </figure>
        </div>
    `,
    options: ["Point A", "Point B", "Point C", "Point D"],
    correct: "D",
    answer: "D. Two daughter cells are formed at point D",
    explanation: `
        <p class="definition"><strong>D is correct.</strong> The graph shows <strong>DNA mass per cell</strong>. DNA is copied before mitosis, so the amount in one cell doubles. When division produces two daughter cells at D, each receives half of that replicated DNA, returning the amount <strong>per cell</strong> to its original level.</p>

        <h3>Step 1: DNA replication happens before mitosis</h3>
        <p>During the <strong>S phase of interphase</strong>, DNA is replicated. The mass of DNA doubles, while the number of cells remains <strong>one</strong>.</p>
        <p>For an illustrative example, a cell with <strong>2 DNA units</strong> has <strong>4 units</strong> after copying. These numbers help explain the pattern; the original graph uses <strong>unnumbered arbitrary DNA units</strong>.</p>

        <h3>Step 2: Interpret the labelled points</h3>
        <div class="dna72-table-scroll" tabindex="0" role="region" aria-label="Points A to D and DNA mass; scroll horizontally if needed">
            <table class="comparison-table dna72-points">
                <caption>Read DNA mass per cell, rather than total DNA in the population</caption>
                <colgroup><col style="width:18%"><col style="width:34%"><col></colgroup>
                <thead><tr><th scope="col">Point</th><th scope="col">DNA mass per cell</th><th scope="col">Explanation</th></tr></thead>
                <tbody>
                    <tr><th scope="row">A</th><td>Original level; starts rising.</td><td>DNA replication begins. There is still one cell.</td></tr>
                    <tr><th scope="row">B</th><td>Increasing.</td><td>DNA is being copied; two daughter cells have not yet formed.</td></tr>
                    <tr><th scope="row">C</th><td>Doubled level.</td><td>DNA replication is complete. The cell has not yet separated into two.</td></tr>
                    <tr class="dna72-correct-row"><th scope="row">D ✓</th><td>Returns to the original level in each cell.</td><td>Division forms two daughter cells, each with a complete copy of the genetic information.</td></tr>
                </tbody>
            </table>
        </div>

        <h3>Step 3: Follow the DNA into the daughter cells</h3>
        <p>During mitosis, the copied chromosomes are separated into two genetically identical sets and the nucleus divides. <strong>Cytokinesis divides the cytoplasm</strong>, producing two daughter cells. D marks the formation of those two cells in this graph.</p>
        <figure class="dna72-distribution" aria-labelledby="dna72-distribution-title">
            <figcaption id="dna72-distribution-title">Illustrative DNA distribution: 2 → 4 → 2 + 2</figcaption>
            <div class="dna72-stages">
                <section class="dna72-stage" aria-label="Before DNA replication: one cell with two illustrative DNA units">
                    <h4>Before replication</h4>
                    <div class="dna72-cells" aria-hidden="true"><div class="dna72-cell"><span class="dna72-unit"></span><span class="dna72-unit"></span></div></div>
                    <p><strong>1 cell</strong><br>2 DNA units in that cell</p>
                </section>
                <section class="dna72-stage" aria-label="After DNA replication: one cell with four illustrative DNA units">
                    <h4>After replication</h4>
                    <div class="dna72-cells" aria-hidden="true"><div class="dna72-cell"><span class="dna72-unit"></span><span class="dna72-unit"></span><span class="dna72-unit"></span><span class="dna72-unit"></span></div></div>
                    <p><strong>1 cell</strong><br>4 DNA units in that cell</p>
                </section>
                <section class="dna72-stage dna72-daughters" aria-label="After division at D: two daughter cells, each with two illustrative DNA units">
                    <h4>After division at D</h4>
                    <div class="dna72-cells" aria-hidden="true"><div class="dna72-cell"><span class="dna72-unit"></span><span class="dna72-unit"></span></div><div class="dna72-cell"><span class="dna72-unit"></span><span class="dna72-unit"></span></div></div>
                    <p><strong>2 daughter cells</strong><br>2 DNA units in each cell</p>
                </section>
            </div>
            <p class="dna72-marker-key">Each bar represents one illustrative DNA unit, <strong>not an individual chromosome</strong>. The chosen 2/4/2 values and cell drawings are a teaching model, rather than measurements from the graph.</p>
        </figure>
        <p class="relationship">Replicated parent cell: 4 illustrative DNA units.<br>Each daughter cell: 4 ÷ 2 = 2 units.</p>
        <p>The fall at D is a change in the amount <strong>per cell</strong>. The two daughter cells together still contain the same total DNA as the replicated cell just before it divided: <strong>2 + 2 = 4 units</strong>. The graph does not show DNA being destroyed.</p>

        <h3>Published visual guide: mitosis and cytokinesis</h3>
        <figure class="explanation-photo explanation-visual dna72-photo" data-explanation-visual="72">
            <a href="images/online-mitosis-cytokinesis.jpg" target="_blank" rel="noreferrer" aria-label="Open the downloaded mitosis and cytokinesis image at full size">
                <img src="images/online-mitosis-cytokinesis.jpg" width="1118" height="861" alt="Published sequence shows copied chromosomes separating during mitosis and cytokinesis producing two daughter cells." loading="lazy" decoding="async">
            </a>
            <figcaption>Mitosis separates copied chromosomes, while cytokinesis separates the cell into two daughters. This general illustration does not assign times or measured DNA masses to the question’s graph. Image: OpenStax, Anatomy and Physiology (2016 edition), via <a href="https://commons.wikimedia.org/wiki/File:0331_Stages_of_Mitosis_and_Cytokinesis.jpg" target="_blank" rel="noreferrer">source</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</figcaption>
        </figure>

        <h3>Step 4: Check the options</h3>
        <ul class="option-explanations">
            <li><strong>A:</strong> Incorrect — DNA replication is beginning, with one cell present.</li>
            <li><strong>B:</strong> Incorrect — DNA is being copied, rather than the cell separating into two.</li>
            <li><strong>C:</strong> Incorrect — DNA has reached its doubled level, but two daughter cells have not yet formed.</li>
            <li><strong>D:</strong> Correct — the DNA amount per cell returns to its original level when two daughter cells form.</li>
        </ul>

        <h3>IGCSE exam tip</h3>
        <p class="exam-tip"><strong>DNA replication happens before mitosis.</strong> Mitosis divides the nucleus; cytokinesis completes cell separation. Each daughter receives a complete, genetically identical chromosome set and the same DNA amount as the original unreplicated cell.</p>
        <p>The horizontal axis is time in hours, but no numerical times are supplied. Identify the stages from the <strong>rise, plateau and drop</strong> rather than calculating a duration.</p>
        <p class="relationship">Final answer: D — two daughter cells are formed.</p>
    `
},
{
    "title": "A Hydra grows and releases an offspring from the side of its body. Which statement correctly describes the parent and offspring?",
    "legend": "Select an answer.",
    "context": "<p>The diagram shows one parent <i>Hydra</i> growing and releasing an offspring.</p><figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-73-hydra-budding.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-73-hydra-budding.png\" alt=\"Three stages show a Hydra forming and releasing offspring from the side of its body.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-73-hydra-budding.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure>",
    "options": [
        "Genetically identical: yes; asexual reproduction: yes.",
        "Genetically identical: yes; asexual reproduction: no.",
        "Genetically identical: no; asexual reproduction: yes.",
        "Genetically identical: no; asexual reproduction: no."
    ],
    "correct": "A",
    "answer": "A. Genetically identical: yes; asexual reproduction: yes",
    "explanation": "<h3>1. Identify budding</h3><p>The new <i>Hydra</i> develops as an outgrowth on the parent. This process is <strong>budding</strong>, a form of asexual reproduction.</p><h3>2. Follow the process</h3><p>Cells divide by <strong>mitosis</strong> → a bud grows → it develops tentacles → the offspring detaches. Only one parent is involved, with <strong>no fusion of gametes</strong>.</p><h3>3. Compare the genetic information</h3><p>Mitosis produces genetically identical cells. The offspring is therefore a <strong>clone</strong> of the parent, except for mutations that may occur.</p><figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-73-hydra-budding.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-73-hydra-budding.png\" alt=\"Three stages show a Hydra forming and releasing offspring from the side of its body.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-73-hydra-budding.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure><h3>4. Check the options</h3><ul class=\"option-explanations\"><li><strong>A — correct:</strong> both statements are true.</li><li><strong>B:</strong> budding is asexual.</li><li><strong>C:</strong> the offspring is genetically identical, apart from possible mutations.</li><li><strong>D:</strong> both statements are incorrect.</li></ul><h3>IGCSE exam tip</h3><p class=\"exam-tip\"><strong>One parent + mitosis + no gamete fusion → genetically identical offspring.</strong> Hydra and yeast can reproduce by budding; potatoes can reproduce vegetatively using tubers. Bacteria divide by binary fission, rather than mitosis.</p><p class=\"relationship\">Final answer: A — yes, yes.</p>",
    "paperCode": "0610/21/M/J/25",
    "paperSession": "May/June 2025"
},
{
    "title": "What is a role of the glomerulus?",
    "legend": "Select an answer.",
    "options": [
        "Assembling amino acids into proteins.",
        "Filtration of water, glucose, urea and ions from the blood.",
        "Reabsorption of glucose, ions and water back into the blood.",
        "Removal of the nitrogen-containing part of amino acids to form urea."
    ],
    "correct": "B",
    "answer": "B. Filtration of water, glucose, urea and ions from the blood",
    "explanation": "<h3>1. Locate the glomerulus</h3><p>The <strong>glomerulus</strong> is a network of capillaries inside <strong>Bowman’s capsule</strong>, at the start of a kidney nephron.</p><h3>2. Explain ultrafiltration</h3><p>Blood enters through the afferent arteriole. <strong>High hydrostatic pressure</strong> forces water and small dissolved molecules across the filtration barrier into Bowman’s capsule.</p><ul class=\"option-explanations\"><li><strong>Pass into the filtrate:</strong> water, glucose, urea and mineral ions.</li><li><strong>Remain in the blood:</strong> blood cells and most plasma proteins.</li></ul><p>The fluid entering the capsule is the <strong>glomerular filtrate</strong>. It then flows into the kidney tubule.</p><figure class=\"explanation-photo explanation-visual\"><a href=\"images/online-glomerulus.jpg\" target=\"_blank\" rel=\"noopener\"><img src=\"images/online-glomerulus.jpg\" alt=\"Labelled light micrograph of a glomerulus and nearby kidney tubules.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Glomerulus anatomy. Image: OpenStax Anatomy and Physiology, <a href=\"https://commons.wikimedia.org/wiki/File:2616_Glomerulus.jpg\" target=\"_blank\" rel=\"noopener\">source</a>, <a href=\"https://creativecommons.org/licenses/by/4.0/\" target=\"_blank\" rel=\"noopener\">CC BY 4.0</a>. Image unchanged. <a href=\"images/online-glomerulus.jpg\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure><h3>3. Check the options</h3><ul class=\"option-explanations\"><li><strong>A:</strong> protein synthesis occurs at ribosomes.</li><li><strong>B — correct:</strong> the glomerulus filters small molecules from blood.</li><li><strong>C:</strong> selective reabsorption returns useful substances from the kidney tubule to blood; it is a different process.</li><li><strong>D:</strong> deamination occurs in the liver.</li></ul><h3>IGCSE exam tip</h3><p class=\"exam-tip\"><strong>Filtration:</strong> blood → Bowman’s capsule. <strong>Reabsorption:</strong> kidney tubule → blood. Glucose enters the filtrate and is normally reabsorbed later.</p><p class=\"relationship\">Final answer: B — filtration.</p>",
    "paperCode": "0610/21/M/J/25",
    "paperSession": "May/June 2025"
},
{
    "title": "The diagram shows a synapse. What are the labelled parts P, Q, R and S?",
    "legend": "Select an answer.",
    "context": "<figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-75-synapse.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-75-synapse.png\" alt=\"A synapse between neurones 1 and 2, with structures labelled P, Q, R and S.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-75-synapse.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure>",
    "options": [
        "P: synaptic gap; Q: neurotransmitter; R: vesicle; S: receptor.",
        "P: synaptic gap; Q: receptor; R: vesicle; S: neurotransmitter.",
        "P: vesicle; Q: neurotransmitter; R: synaptic gap; S: receptor.",
        "P: vesicle; Q: receptor; R: synaptic gap; S: neurotransmitter."
    ],
    "correct": "C",
    "answer": "C. P vesicle; Q neurotransmitter; R synaptic gap; S receptor",
    "explanation": "<h3>1. Identify the structures</h3><ul class=\"option-explanations\"><li><strong>P — vesicle:</strong> a membrane-bound sac that stores neurotransmitter.</li><li><strong>Q — neurotransmitter:</strong> the chemical signalling molecules being released.</li><li><strong>R — synaptic gap (cleft):</strong> the small space between the neurones.</li><li><strong>S — receptor:</strong> a specific binding protein on the membrane of neurone 2.</li></ul><h3>2. Follow the signal</h3><p>Electrical impulse arrives at neurone 1 → vesicles release neurotransmitter → it <strong>diffuses</strong> across the cleft → it binds to receptors on neurone 2 → a new electrical impulse <strong>may</strong> be generated.</p><figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-75-synapse.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-75-synapse.png\" alt=\"A synapse between neurones 1 and 2, with structures labelled P, Q, R and S.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-75-synapse.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure><h3>3. Check the options</h3><p><strong>C</strong> matches all four labels. A and B incorrectly identify P as the gap and R as a vesicle. D swaps the neurotransmitter and receptor.</p><h3>IGCSE exam tip</h3><p class=\"exam-tip\">Transmission across this chemical synapse is <strong>one-way</strong>: neurotransmitter is released from the presynaptic neurone and receptors are on the postsynaptic membrane. The impulse is electrical within a neurone; transmission across the cleft is chemical.</p><p class=\"relationship\">Final answer: C.</p>",
    "paperCode": "0610/21/M/J/25",
    "paperSession": "May/June 2025"
},
{
    "title": "The graph shows lung volume during breathing at rest. Which processes are occurring at X?",
    "legend": "Select an answer.",
    "context": "<figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-76-lung-volume.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-76-lung-volume.png\" alt=\"Lung volume varies with time during breathing at rest; X marks a point on a falling section.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-76-lung-volume.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure>",
    "options": [
        "The diaphragm is relaxing and the external intercostal muscles are relaxing.",
        "The diaphragm is contracting and the internal intercostal muscles are contracting.",
        "The diaphragm is contracting and the internal intercostal muscles are relaxing.",
        "The diaphragm is relaxing and the external intercostal muscles are contracting."
    ],
    "correct": "A",
    "answer": "A. The diaphragm and external intercostal muscles are relaxing",
    "explanation": "<h3>1. Read the direction of the curve</h3><p>X is on a <strong>falling</strong> section: lung volume is decreasing. Air is leaving the lungs, so the person is <strong>breathing out (expiration)</strong>.</p><h3>2. Explain quiet expiration</h3><p>The diaphragm <strong>relaxes</strong> and returns towards its dome shape. The external intercostal muscles <strong>relax</strong>; the ribs move downwards and inwards. Elastic recoil helps reduce thorax and lung volume.</p><p>Pressure inside the lungs rises <strong>above atmospheric pressure</strong>, so air moves out.</p><figure class=\"explanation-photo explanation-visual\"><a href=\"images/question-76-lung-volume.png\" target=\"_blank\" rel=\"noopener\"><img src=\"images/question-76-lung-volume.png\" alt=\"Lung volume varies with time during breathing at rest; X marks a point on a falling section.\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © UCLES 2025, <a href=\"https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/0610_s25_qp_21.pdf\" target=\"_blank\" rel=\"noopener\">0610/21/M/J/25</a>. <a href=\"images/question-76-lung-volume.png\" target=\"_blank\" rel=\"noopener\">Open full size (new tab)</a>.</figcaption></figure><h3>3. Check the options</h3><ul class=\"option-explanations\"><li><strong>A — correct:</strong> both the diaphragm and external intercostal muscles relax.</li><li><strong>B and C:</strong> diaphragm contraction is associated with inspiration.</li><li><strong>D:</strong> external intercostal contraction raises the ribs during inspiration.</li></ul><h3>IGCSE exam tip</h3><p class=\"exam-tip\"><strong>Rising lung volume → inspiration; falling lung volume → expiration.</strong> This is breathing at rest: quiet expiration is mainly passive. Active contraction of the internal intercostal muscles is associated with forced expiration.</p><p class=\"relationship\">Final answer: A — both muscles relax.</p>",
    "paperCode": "0610/21/M/J/25",
    "paperSession": "May/June 2025"
}
		];
		const questionStates = questions.map(() => ({ selected: null, checked: false }));

		function renderQuestionNavigator() {
			questionNavList.innerHTML = questions.map((question, index) => {
				const state = questionStates[index];
				const status = state.checked
					? state.selected === question.correct ? "Correct" : "Incorrect"
					: state.selected ? "Selected" : "Not started";
				const resultClass = state.checked ? state.selected === question.correct ? " is-correct" : " is-wrong" : "";
				return `<button class="question-nav-item${resultClass}" type="button" data-question-index="${index}" aria-label="Question ${index + 1}: ${status}" title="Question ${index + 1}: ${status}"${index === currentQuestionIndex ? ' aria-current="step"' : ""}>
					<span class="question-nav-number" aria-hidden="true">${index + 1}</span>
					${state.checked ? `<span class="question-nav-status" aria-hidden="true">${state.selected === question.correct ? "✓" : "✕"}</span>` : ""}
				</button>`;
			}).join("");
		}


        // Your explanation SVGs belong in images/, named q07-explanation.svg, etc.
        // These are quiz question numbers, separate from printed past-paper numbers.
        const explanationDiagramTitles = {
            "1": "Sensitivity: detect and respond",
            "2": "Both words identify the species",
            "3": "Order the groups by leg number",
            "4": "Osmosis is the net movement of water",
            "5": "Follow the key to Gryllus",
            "6": "Magnification: use the same units",
            "7": "Phloem translocation from a leaf to a potato tuber",
            "8": "Photosynthesis rate reaches a plateau at light intensity 8",
            "9": "High temperature increases collisions but can denature an enzyme",
            "10": "Two stages of starch digestion",
            "11": "Pancreatic lipase digests fats in the small intestine",
            "12": "Root hairs increase absorbing surface area",
            "13": "Immediate osmosis between cells P, Q and R",
            "14": "Cool and humid conditions reduce transpiration",
            "15": "Substrate binding forms the enzyme–substrate complex",
            "16": "Iron and vitamins support blood and healthy tissues",
            "17": "Glucose leaves a villus in blood; fats leave in lymph",
            "18": "Hepatic portal vein S and hepatic vein T",
            "19": "Oxygenated blood in fish and mammal circulation",
            "20": "A phagocyte engulfs and digests a bacterium",
            "21": "One heartbeat: P, R, Q, S",
            "22": "Right ventricle pumps to lungs",
            "23": "Labelled sugars travel in phloem",
            "24": "Agave conserves water",
            "25": "Potato catalase: measured rates",
            "26": "Humidity slows transpiration",
            "27": "Warming increases enzyme collisions",
            "28": "Light distance and photosynthesis",
            "29": "Fish: one complete circuit",
            "30": "Which structure has a nucleus?",
            "31": "Glucose units build polysaccharides",
            "32": "Enzymes can build up and break down",
            "33": "Osmosis through potato cells",
            "34": "Photosynthesis attracts bacteria",
            "35": "Limiting factors at point P",
            "36": "Keep plant size and time constant",
            "37": "Plasmolysis in a plant cell",
            "38": "Oxygenated blood in double circulation",
            "39": "Calculate the actual cell diameter",
            "40": "Where is most water absorbed?",
            "41": "Photosynthesis is nutrition",
            "42": "Four DNA differences",
            "43": "A protein catalyst is reused",
            "44": "More A–T → lower melting",
            "45": "Photosynthesis: four points",
            "46": "Vaccination forms memory",
            "47": "Humidity reduces water loss",
            "48": "Day 4 best fits menstruation",
            "49": "Alkaline pH denatures pepsin",
            "50": "W = LH · Y = oestrogen",
            "51": "Synthetic auxin kills susceptible broadleaf weeds",
            "52": "Energy flows through the food chain and leaves as heat",
            "53": "Protease acts on amino-acid chains",
            "54": "Light treatment determines the auxin carried by agar blocks",
            "55": "Recovery follows the sequence 1 → 3 → 4 → 2 → 5",
            "56": "Bronchi contain cartilage; bronchioles lead to alveoli",
            "57": "A competing toxin occupies receptors on the motor neurone",
            "58": "Adrenaline increases pulse rate and blood glucose",
            "59": "Adrenal glands release adrenaline, which widens pupils",
            "60": "X-linked recessive inheritance",
            "61": "One substrate, two products",
            "62": "ABO blood-group inheritance",
            "63": "How could the drug reduce protein production?",
            "64": "Compare the initial reaction rates",
            "65": "Breathing muscles change thorax volume",
            "66": "Urea: made in the liver, removed by kidneys",
            "67": "Three parallel rounds produce eight cells",
            "68": "Six cats must be heterozygous",
            "69": "Orange eyes are recessive",
            "70": "Genes and environment influence phenotype",
            "71": "Plants respire by day and night",
            "72": "DNA doubles, then is shared at D",
            "73": "Hydra budding: asexual reproduction",
            "74": "The glomerulus filters small molecules",
            "75": "Chemical transmission across a synapse",
            "76": "At X, the person is breathing out"
};

        function addExplanationDiagram(questionNumber) {
            const title = explanationDiagramTitles[questionNumber];
            if (!title) return;
            const src = `images/q${String(questionNumber).padStart(2, "0")}-explanation.svg`;
            const figure = document.createElement("figure");
            figure.className = "explanation-photo explanation-visual custom-explanation-diagram";
            figure.dataset.explanationDiagram = String(questionNumber);
            const link = document.createElement("a");
            link.href = src;
            link.target = "_blank";
            link.rel = "noopener";
            link.setAttribute("aria-label", `Open full-size explanation diagram: ${title} (new tab)`);
            const image = document.createElement("img");
            image.alt = title;
            image.loading = "lazy";
            image.decoding = "async";
            // Keep the written explanation usable if a replacement image is missing.
            image.addEventListener("error", () => figure.remove(), { once: true });
            image.src = src;
            link.append(image);
            const caption = document.createElement("figcaption");
            caption.append(`Explanation diagram for question ${questionNumber}. `);
            const fullSize = document.createElement("a");
            fullSize.href = src;
            fullSize.target = "_blank";
            fullSize.rel = "noopener";
            fullSize.textContent = "Open full size (new tab)";
            caption.append(fullSize);
            figure.append(link, caption);
            feedback.querySelector(".feedback-summary").after(figure);
        }

		function showQuestionFeedback(question, state) {
			const isCorrect = state.selected === question.correct;
			feedback.className = `feedback visible ${isCorrect ? "correct" : "incorrect"}`;
			const answerLine = isCorrect ? `Correct answer: ${question.answer}` : `Your answer: ${state.selected}. Correct answer: ${question.answer}`;
			feedback.innerHTML = `<div class="feedback-summary"><span class="feedback-result-icon" aria-hidden="true">${isCorrect ? "✓" : "✕"}</span><div class="feedback-summary-copy"><strong class="feedback-title">${isCorrect ? "Correct!" : "Incorrect"}</strong><p class="feedback-answer-line">${answerLine}</p></div></div>${question.explanation}`;
			addExplanationDiagram(currentQuestionIndex + 1);
			selectionHint.className = `hint ${isCorrect ? "is-correct" : "is-incorrect"}`;
			selectionHint.textContent = isCorrect ? "✓ Correct" : "✕ Incorrect";
			syncAnswerResultHighlights();
		}

		function syncAnswerTableSelection() {
			const selected = questionStates[currentQuestionIndex].selected;
			questionContext.querySelectorAll("tr[data-answer-choice]").forEach((row) => {
				const isSelected = row.dataset.answerChoice === selected;
				row.classList.toggle("is-selected", isSelected);
				row.querySelector("button[data-answer-choice]")?.setAttribute("aria-pressed", String(isSelected));
			});
		}

		function syncAnswerResultHighlights() {
			const question = questions[currentQuestionIndex];
			const state = questionStates[currentQuestionIndex];
			answerOptions.querySelectorAll(".answer").forEach((label) => {
				const radio = label.querySelector('input[name="answer"]');
				const status = label.querySelector(".answer-status");
				const correct = state.checked && radio.value === question.correct;
				const incorrect = state.checked && radio.value === state.selected && !correct;
				label.classList.toggle("answer-correct", correct);
				label.classList.toggle("answer-incorrect", incorrect);
				status.hidden = !correct && !incorrect;
				status.textContent = correct ? (radio.value === state.selected ? "✓ Your answer is correct" : "✓ Correct answer") : incorrect ? "✕ Your answer is incorrect" : "";
			});
			questionContext.querySelectorAll("tr[data-answer-choice]").forEach((row) => {
				const choice = row.dataset.answerChoice;
				const correct = state.checked && choice === question.correct;
				const incorrect = state.checked && choice === state.selected && !correct;
				row.classList.toggle("answer-row-correct", correct);
				row.classList.toggle("answer-row-incorrect", incorrect);
				const button = row.querySelector("button[data-answer-choice]");
				if (!button) return;
				button.dataset.baseLabel ||= button.getAttribute("aria-label") || `Select option ${choice}`;
				button.setAttribute("aria-label", button.dataset.baseLabel + (correct ? ": Correct answer" : incorrect ? ": Your answer is incorrect" : ""));
				let mark = button.querySelector(".choice-result-mark");
				if (!mark && (correct || incorrect)) {
					mark = document.createElement("span");
					mark.setAttribute("aria-hidden", "true");
					button.append(mark);
				}
				if (mark) {
					mark.className = `choice-result-mark ${correct ? "is-correct" : "is-incorrect"}`;
					mark.hidden = !correct && !incorrect;
					mark.textContent = correct ? "✓" : "✕";
				}
			});
		}

		function renderQuestion() {
			clearAnswerCue();
			answerAnnouncement.textContent = "";
			const question = questions[currentQuestionIndex];
			const state = questionStates[currentQuestionIndex];
			questionCount.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
			questionPaper.hidden = !question.paperCode;
			paperCode.textContent = question.paperCode || "";
			paperSession.textContent = question.paperSession || "";
			questionPaper.title = question.paperCode ? `Past paper ${question.paperCode}${question.paperSession ? ` — ${question.paperSession}` : ""}` : "";
			if (question.paperCode) {
				questionTitle.setAttribute("aria-describedby", "question-paper");
			} else {
				questionTitle.removeAttribute("aria-describedby");
			}
			progressTrack.setAttribute("aria-valuemax", questions.length);
			progressTrack.setAttribute("aria-valuenow", currentQuestionIndex + 1);
			progressValue.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
			questionTitle.innerHTML = question.title;
			questionContext.innerHTML = question.context || "";
			syncAnswerTableSelection();
			questionLegend.textContent = question.legend;
			answerOptions.hidden = Boolean(question.hideAnswerOptions);
			answerOptions.innerHTML = question.options.map((option, index) => {
				const letter = String.fromCharCode(65 + index);
				return `<label class="answer">
					<input type="radio" name="answer" value="${letter}"${state.selected === letter ? " checked" : ""}>
					<span class="letter" aria-hidden="true">${letter}</span>
					<span class="answer-body"><span class="answer-text${question.letterOnlyOptions ? " visually-hidden" : ""}">${option}</span><span class="answer-status" hidden></span></span>
				</label>`;
			}).join("");
			checkButton.disabled = !state.selected || state.checked;
			selectionHint.className = "hint";
			selectionHint.textContent = state.checked ? "Answer checked" : state.selected ? "Ready to check" : "Select an option to continue";
			if (state.checked) {
				showQuestionFeedback(question, state);
			} else {
				feedback.className = "feedback";
				feedback.textContent = "";
			}
			nextQuestionButton.hidden = !state.checked;
			nextQuestionButton.textContent = currentQuestionIndex === questions.length - 1
				? (questionStates.every((item) => item.checked) ? "Restart quiz" : "Review unanswered")
				: "Next question";
			renderQuestionNavigator();
		}

		function updateTextSize() {
			quiz.style.setProperty("--quiz-scale", textScale);
			textSizeValue.value = `${Math.round(textScale * 100)}%`;
			decreaseTextButton.disabled = textScale <= 0.8;
			increaseTextButton.disabled = textScale >= 2;
		}

		decreaseTextButton.addEventListener("click", () => {
			textScale = Math.max(0.8, Math.round((textScale - 0.1) * 10) / 10);
			updateTextSize();
		});

		increaseTextButton.addEventListener("click", () => {
			textScale = Math.min(2, Math.round((textScale + 0.1) * 10) / 10);
			updateTextSize();
		});

		resetTextButton.addEventListener("click", () => {
			textScale = defaultTextScale;
			updateTextSize();
		});

		updateTextSize();
		renderQuestion();

		navigatorToggle.addEventListener("click", () => {
			const isExpanded = navigatorToggle.getAttribute("aria-expanded") === "true";
			quizLayout.classList.toggle("navigator-hidden", isExpanded);
			navigatorToggle.setAttribute("aria-expanded", String(!isExpanded));
			navigatorToggle.setAttribute("aria-label", isExpanded ? "Show questions" : "Hide questions");
			navigatorToggle.title = isExpanded ? "Show questions" : "Hide questions";
		});

		questionNavList.addEventListener("click", (event) => {
			const button = event.target.closest("[data-question-index]");
			if (!button) return;
			currentQuestionIndex = Number(button.dataset.questionIndex);
			renderQuestion();
			questionTitle.focus();
		});

		questionContext.addEventListener("click", (event) => {
			const row = event.target.closest("tr[data-answer-choice]");
			if (!row) return;
			if (questionStates[currentQuestionIndex].selected === row.dataset.answerChoice) return;
			const radio = form.querySelector(`input[name="answer"][value="${row.dataset.answerChoice}"]`);
			if (!radio) return;
			radio.checked = true;
			radio.dispatchEvent(new Event("change", { bubbles: true }));
		});

		form.addEventListener("change", (event) => {
			if (!event.target.matches('input[name="answer"]')) return;
			clearAnswerCue();
			answerAnnouncement.textContent = "";
			questionStates[currentQuestionIndex].selected = new FormData(form).get("answer");
			questionStates[currentQuestionIndex].checked = false;
			checkButton.disabled = false;
			selectionHint.className = "hint";
			selectionHint.textContent = "Ready to check";
			feedback.className = "feedback";
			feedback.textContent = "";
			nextQuestionButton.hidden = true;
			syncAnswerTableSelection();
			syncAnswerResultHighlights();
			renderQuestionNavigator();
		});

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const selected = new FormData(form).get("answer");
			if (!selected) return;

			const question = questions[currentQuestionIndex];
			const state = questionStates[currentQuestionIndex];
			if (state.checked) return;
			state.selected = selected;
			state.checked = true;
			showQuestionFeedback(question, state);
			const isCorrect = selected === question.correct;
			answerAnnouncement.textContent = `${isCorrect ? "Correct." : "Incorrect."} ${feedback.querySelector(".feedback-answer-line").textContent}`;
			if (questionStates.every((item) => item.checked)) selectionHint.textContent = `Quiz complete · ${isCorrect ? "✓ Correct" : "✕ Incorrect"}`;
			showAnswerCue(isCorrect);
			checkButton.disabled = true;
			nextQuestionButton.hidden = false;
			nextQuestionButton.textContent = currentQuestionIndex === questions.length - 1
				? (questionStates.every((item) => item.checked) ? "Restart quiz" : "Review unanswered")
				: "Next question";
			renderQuestionNavigator();
		});

		feedback.addEventListener("input", (event) => {
			if (event.target.id !== "light-intensity-slider") return;
			const measurement = graphMeasurements[Number(event.target.value)];
			const activeLine = feedback.querySelector("#graph-active-line");
			const activePoint = feedback.querySelector("#graph-active-point");
			const graphOutput = feedback.querySelector("#graph-output");
			if (!activeLine || !activePoint || !graphOutput) return;

			activeLine.setAttribute("x1", measurement.x);
			activeLine.setAttribute("x2", measurement.x);
			activePoint.setAttribute("cx", measurement.x);
			activePoint.setAttribute("cy", measurement.y);
			graphOutput.textContent = `${measurement.intensity.toFixed(1)} units · ${measurement.oxygen.toFixed(1)} mm³/hour`;
			event.target.setAttribute("aria-valuetext", `${measurement.intensity.toFixed(1)} arbitrary units; oxygen production ${measurement.oxygen.toFixed(1)} cubic millimetres per hour`);
		});

		nextQuestionButton.addEventListener("click", () => {
			if (currentQuestionIndex === questions.length - 1 && questionStates.every((state) => state.checked)) {
				questionStates.forEach((state) => {
					state.selected = null;
					state.checked = false;
				});
				currentQuestionIndex = 0;
			} else if (currentQuestionIndex === questions.length - 1) {
				currentQuestionIndex = questionStates.findIndex((state) => !state.checked);
			} else {
				currentQuestionIndex += 1;
			}
			renderQuestion();
			questionTitle.focus();
		});
// Question 25: delegated controls keep working when feedback is recreated.
const catalaseMeasurements = [
    { temperature: 15, bubbles: 96, note: "At 15°C, 96 bubbles per minute were recorded, only two fewer than at 25°C. The difference is small; further measurements would help locate the optimum." },
    { temperature: 25, bubbles: 98, note: "This is the highest measured rate: 98 bubbles per minute. The exact optimum is not established by these five widely spaced temperatures." },
    { temperature: 35, bubbles: 82, note: "At 35°C, the measured rate was 82 bubbles per minute, below the rate at 25°C. Higher temperatures can reduce enzyme activity." },
    { temperature: 45, bubbles: 36, note: "At 45°C, the measured rate fell to 36 bubbles per minute. Heat can denature catalase and change the shape of its active site." },
    { temperature: 55, bubbles: 1, note: "At 55°C, only one bubble per minute was recorded. This very low activity is consistent with heat denaturation." }
];

function updateCatalaseInfographic(index) {
    const lab = feedback.querySelector("#catalase-infographic");
    if (!lab || !Number.isInteger(index) || !catalaseMeasurements[index]) return;
    const measurement = catalaseMeasurements[index];
    const percent = measurement.bubbles / 98 * 100;
    const rateText = `${measurement.bubbles} oxygen ${measurement.bubbles === 1 ? "bubble" : "bubbles"} per minute`;
    lab.querySelectorAll("button[data-catalase-index]").forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.catalaseIndex) === index));
    });
    const slider = lab.querySelector("#catalase-temperature-slider");
    slider.value = String(index);
    slider.setAttribute("aria-valuetext", `${measurement.temperature}°C; ${rateText}`);
    lab.querySelector("#catalase-selected-temperature").textContent = `${measurement.temperature}°C`;
    lab.querySelector("#catalase-selected-rate").textContent = rateText;
    lab.querySelector("#catalase-rate-fill").style.width = `${percent}%`;
    lab.querySelector("#catalase-rate-percent").textContent = `${percent.toFixed(1)}%`;
    const meter = lab.querySelector("#catalase-rate-meter");
    meter.setAttribute("aria-valuenow", String(measurement.bubbles));
    meter.setAttribute("aria-valuetext", `${rateText}; ${percent.toFixed(1)}% of the highest measured rate`);
    lab.querySelector("#catalase-stage").textContent = measurement.note;
}

feedback.addEventListener("input", (event) => {
    if (event.target.id !== "catalase-temperature-slider") return;
    updateCatalaseInfographic(Number(event.target.value));
});

feedback.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-catalase-index]");
    if (!button || !feedback.contains(button)) return;
    updateCatalaseInfographic(Number(button.dataset.catalaseIndex));
});

// Question 42: delegation survives feedback replacement and resets to static B.
(() => {
    const sequences = { 1: "TCAGGATT", 2: "TGAGCAAT", 3: "TGAGCAAG", 4: "TGAGGATT" };
    const pairs = { A: [1, 2], B: [1, 3], C: [2, 4], D: [3, 4] };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-dna-pair]");
        const lab = button?.closest("#dna-comparison");
        const selected = button?.dataset.dnaPair;
        if (!lab || !feedback.contains(lab) || !pairs[selected]) return;

        const pair = pairs[selected];
        const first = sequences[pair[0]];
        const second = sequences[pair[1]];
        const positions = Array.from(first, (base, index) => base !== second[index] ? index + 1 : null)
            .filter((position) => position !== null);
        const rows = document.createDocumentFragment();

        pair.forEach((species) => {
            const row = document.createElement("tr");
            const heading = document.createElement("th");
            heading.scope = "row";
            heading.textContent = `Species ${species}`;
            row.append(heading);
            Array.from(sequences[species]).forEach((base, index) => {
                const differs = first[index] !== second[index];
                const cell = document.createElement("td");
                cell.className = `dna-base ${differs ? "is-different" : "is-match"}`;
                cell.textContent = base;
                cell.setAttribute("aria-label", `Position ${index + 1}: ${base}; ${differs ? "differs" : "matches"}`);
                row.append(cell);
            });
            rows.append(row);
        });
        lab.querySelector("#dna-comparison-rows").replaceChildren(rows);
        lab.querySelectorAll("button[data-dna-pair]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.dnaPair === selected));
        });
        lab.querySelector("#dna-comparison-summary").textContent = `Species ${pair[0]} and ${pair[1]}: ${positions.length} differences out of 8 bases`;
        const positionList = positions.length > 1
            ? `${positions.slice(0, -1).join(", ")} and ${positions[positions.length - 1]}`
            : String(positions[0]);
        lab.querySelector("#dna-difference-positions").textContent = `Different positions: ${positionList}.`;
        lab.querySelectorAll("[data-dna-bar]").forEach((bar) => {
            bar.classList.toggle("is-active", bar.dataset.dnaBar === selected);
        });
    });
})();

// Question 44: one delegated listener survives feedback replacement; static default is molecule 2.
(() => {
    const molecules = {
        1: { A: 20, T: 20, C: 30, G: 30 },
        2: { A: 30, T: 30, C: 20, G: 20 }
    };
    const baseNames = { A: "Adenine", T: "Thymine", C: "Cytosine", G: "Guanine" };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-dna44-molecule]");
        const lab = button?.closest("#dna44-lab");
        const selected = button?.dataset.dna44Molecule;
        if (!lab || !feedback.contains(lab) || !molecules[selected]) return;

        const bases = molecules[selected];
        const gc = bases.C + bases.G;
        const at = bases.A + bases.T;
        lab.querySelectorAll("button[data-dna44-molecule]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.dna44Molecule === selected));
        });
        lab.querySelectorAll(".dna44-base-column[data-dna44-base]").forEach((column) => {
            const base = column.dataset.dna44Base;
            const percent = bases[base];
            if (percent === undefined) return;
            column.querySelector(".dna44-bar").style.height = `${percent / 50 * 100}%`;
            column.querySelector(".dna44-value").textContent = `${percent}%`;
            column.setAttribute("aria-label", `${baseNames[base]} (${base}): ${percent}% of all bases`);
        });
        lab.querySelector("#dna44-molecule-name").textContent = `DNA molecule ${selected}`;
        lab.querySelector("#dna44-content").textContent = `${gc}% GC · ${at}% AT`;
        lab.querySelector("#dna44-calculation").textContent = selected === "1"
            ? "Given T = 20%, A = 20%. A + T = 40%, leaving C + G = 60%, so C = G = 30%."
            : "Given C = 20%, G = 20%. C + G = 40%, leaving A + T = 60%, so A = T = 30%.";
        lab.querySelector("#dna44-reason").textContent = selected === "1"
            ? "DNA molecule 1 has more GC (60%) and less AT than DNA molecule 2. G–C pairs have three hydrogen bonds, while A–T pairs have two. With other conditions comparable, DNA 1 is expected to have the higher melting temperature."
            : "DNA molecule 2 has more AT (60%) and less GC than DNA molecule 1. A–T pairs have two hydrogen bonds, while G–C pairs have three. With other conditions comparable, DNA 2 is expected to have the lower melting temperature.";
        lab.querySelectorAll("[data-dna44-gc-row]").forEach((row) => {
            row.classList.toggle("is-active", row.dataset.dna44GcRow === selected);
        });
    });
})();

// Question 45: factor and point exploration never changes the selected quiz answer.
(() => {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const graphs = {
        co2: {
            label: "Carbon dioxide concentration",
            title: "Carbon dioxide concentration and rate of photosynthesis",
            description: "A qualitative curve rises as carbon dioxide concentration increases, then levels off. Point 1 is on the rising part of the curve.",
            curve: "M50 230 C70 190 90 155 110 130 C165 60 240 60 520 60",
            points: [{ number: 1, x: 110, y: 130 }]
        },
        temperature: {
            label: "Temperature",
            title: "Temperature and rate of photosynthesis",
            description: "A qualitative curve rises to an optimum temperature at point 2, then falls. Point 3 is on the falling part, above the optimum temperature.",
            curve: "M50 230 C160 228 240 190 290 95 C310 55 326 40 350 40 C380 40 392 100 410 150 C425 200 430 220 435 230",
            points: [{ number: 2, x: 350, y: 40 }, { number: 3, x: 410, y: 150 }]
        },
        light: {
            label: "Light intensity",
            title: "Light intensity and rate of photosynthesis",
            description: "A qualitative curve rises as light intensity increases, then levels off. Point 4 is on the plateau, where increasing light no longer increases the rate.",
            curve: "M50 230 C100 90 160 60 235 60 L520 60",
            points: [{ number: 4, x: 350, y: 60 }]
        }
    };
    const interpretations = {
        1: {
            factor: "co2",
            reading: "Point 1 · CO₂ concentration is limiting",
            explanation: "Point 1 is on the rising part of the carbon dioxide curve. The available carbon dioxide restricts photosynthesis, so increasing its concentration can increase the rate.",
            next: "Increasing CO₂ would increase the rate while other conditions remain unchanged."
        },
        2: {
            factor: "temperature",
            reading: "Point 2 · Temperature is at the optimum",
            explanation: "Point 2 is at the peak of the temperature curve. Photosynthesis has reached its highest rate across the temperatures shown; a higher temperature would move beyond the optimum.",
            next: "Increasing temperature beyond point 2 would reduce the rate rather than increase it."
        },
        3: {
            factor: "temperature",
            reading: "Point 3 · Temperature is above the optimum",
            explanation: "Point 3 is on the falling part of the temperature curve. High temperature denatures enzymes involved in photosynthesis, changing their active sites and reducing the rate.",
            next: "Increasing temperature further would reduce the rate rather than increase it."
        },
        4: {
            factor: "light",
            reading: "Point 4 · Light is not limiting",
            explanation: "Point 4 is on the plateau of the light-intensity curve. Extra light no longer increases photosynthesis because another factor, such as carbon dioxide concentration or temperature, is limiting.",
            next: "Increasing light further would not increase the rate under the same conditions. Changing the other limiting factor may increase it."
        }
    };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-photo45-point]");
        const lab = button?.closest("#photo45-lab");
        const selected = button?.dataset.photo45Point;
        const interpretation = interpretations[selected];
        if (!lab || !feedback.contains(lab) || !interpretation) return;

        const graph = graphs[interpretation.factor];
        lab.querySelectorAll("button[data-photo45-point]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.photo45Point === selected));
        });
        lab.querySelector("#photo45-curve").setAttribute("d", graph.curve);
        lab.querySelector("#photo45-svg-title").textContent = graph.title;
        lab.querySelector("#photo45-svg-desc").textContent = graph.description;
        lab.querySelector("#photo45-x-label").textContent = graph.label;

        const markers = document.createDocumentFragment();
        graph.points.forEach((point) => {
            const group = document.createElementNS(svgNamespace, "g");
            group.setAttribute("class", `photo45-point${String(point.number) === selected ? " is-active" : ""}`);
            const circle = document.createElementNS(svgNamespace, "circle");
            circle.setAttribute("cx", point.x);
            circle.setAttribute("cy", point.y);
            circle.setAttribute("r", "9");
            const label = document.createElementNS(svgNamespace, "text");
            label.setAttribute("x", point.x + 16);
            label.setAttribute("y", point.y - 14);
            label.textContent = String(point.number);
            group.append(circle, label);
            markers.append(group);
        });
        lab.querySelector("#photo45-points").replaceChildren(markers);
        lab.querySelector("#photo45-reading").textContent = interpretation.reading;
        lab.querySelector("#photo45-explanation").textContent = interpretation.explanation;
        lab.querySelector("#photo45-next").textContent = interpretation.next;
    });
})();

// Question 47: delegated controls survive feedback replacement without changing quiz answers.
(() => {
    const views = {
        total: {
            axis: "Water lost over 5 days (g)",
            ticks: ["0", "3", "6"],
            maximum: 6,
            x: 5.7,
            y: 1.6,
            xText: "5.7 g",
            yText: "1.6 g",
            xDescription: "Tube X, no bag: 5.7 grams of water lost over five days; scale 0 to 6 grams",
            yDescription: "Tube Y, plastic bag: 1.6 grams of water lost over five days; scale 0 to 6 grams",
            summary: "Tube Y lost 4.1 g less water than tube X over 5 days.",
            calculation: "Tube X: 40.3 − 34.6 = 5.7 g. Tube Y: 41.0 − 39.4 = 1.6 g. Difference: 5.7 − 1.6 = 4.1 g."
        },
        daily: {
            axis: "Average water loss per day (g/day)",
            ticks: ["0", "0.6", "1.2"],
            maximum: 1.2,
            x: 1.14,
            y: 0.32,
            xText: "1.14 g/day",
            yText: "0.32 g/day",
            xDescription: "Tube X, no bag: average water loss 1.14 grams per day; scale 0 to 1.2 grams per day",
            yDescription: "Tube Y, plastic bag: average water loss 0.32 grams per day; scale 0 to 1.2 grams per day",
            summary: "Tube Y lost an average of 0.82 g less water per day than tube X.",
            calculation: "Tube X: 5.7 ÷ 5 = 1.14 g/day. Tube Y: 1.6 ÷ 5 = 0.32 g/day. Difference: 1.14 − 0.32 = 0.82 g/day."
        }
    };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-humidity47-view]");
        const lab = button?.closest("#humidity47-lab");
        const selected = button?.dataset.humidity47View;
        const view = views[selected];
        if (!lab || !feedback.contains(lab) || !view) return;

        lab.querySelectorAll("button[data-humidity47-view]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.humidity47View === selected));
        });
        lab.querySelector("#humidity47-axis-title").textContent = view.axis;
        lab.querySelectorAll("[data-humidity47-tick]").forEach((tick) => {
            tick.textContent = view.ticks[Number(tick.dataset.humidity47Tick)];
        });
        lab.querySelector("#humidity47-x-value").textContent = view.xText;
        lab.querySelector("#humidity47-y-value").textContent = view.yText;
        lab.querySelector("#humidity47-x-bar").style.width = `${view.x / view.maximum * 100}%`;
        lab.querySelector("#humidity47-y-bar").style.width = `${view.y / view.maximum * 100}%`;
        lab.querySelector('[data-humidity47-tube="X"]').setAttribute("aria-label", view.xDescription);
        lab.querySelector('[data-humidity47-tube="Y"]').setAttribute("aria-label", view.yDescription);
        lab.querySelector("#humidity47-reading").textContent = view.summary;
        lab.querySelector("#humidity47-calculation").textContent = view.calculation;
    });
})();

// Question 48: delegated graph controls leave the selected quiz answer unchanged.
(() => {
    const days = {
        4: {
            phase: "Menstruation — the best answer among the choices",
            explanation: "The lining is becoming thinner as it is shed. Day 4 is near the end of the usual menstruation phase, approximately days 1–5, and is the best of the four days offered.",
            description: "Day 4 is on the decreasing section during menstruation."
        },
        8: {
            phase: "The lining is rebuilding",
            explanation: "The lining is becoming thicker again after menstruation. Day 8 is in the repair and rebuilding phase, so it is later than the end of menstruation in this example.",
            description: "Day 8 is on the rising section as the lining repairs and rebuilds."
        },
        16: {
            phase: "The thick lining is maintained",
            explanation: "Day 16 is after ovulation, which occurs around day 14 in this schematic cycle. The lining is thick and is maintained in preparation for possible implantation; it is not being shed.",
            description: "Day 16 is near the plateau where the thick lining is maintained."
        },
        20: {
            phase: "The thick lining is maintained",
            explanation: "The lining remains thick in preparation for possible implantation. Day 20 is well after menstruation in this example, so it cannot be the last day of the shedding phase.",
            description: "Day 20 is on the plateau where the lining remains thick."
        }
    };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-cycle48-day]");
        const lab = button?.closest("#cycle48-lab");
        const day = Number(button?.dataset.cycle48Day);
        const details = days[day];
        if (!lab || !feedback.contains(lab) || !details) return;

        const curve = lab.querySelector("#cycle48-curve");
        const x = 60 + (day - 1) * 20;
        let lower = 0;
        let upper = curve.getTotalLength();
        // The curve moves steadily left to right, so find the actual point at this day.
        for (let iteration = 0; iteration < 32; iteration += 1) {
            const middle = (lower + upper) / 2;
            if (curve.getPointAtLength(middle).x < x) lower = middle;
            else upper = middle;
        }
        const point = curve.getPointAtLength((lower + upper) / 2);
        const marker = lab.querySelector("#cycle48-active-point");
        const line = lab.querySelector("#cycle48-active-line");
        marker.setAttribute("cx", x);
        marker.setAttribute("cy", point.y);
        line.setAttribute("x1", x);
        line.setAttribute("x2", x);
        line.setAttribute("y1", point.y);
        lab.querySelectorAll("button[data-cycle48-day]").forEach((control) => {
            control.setAttribute("aria-pressed", String(Number(control.dataset.cycle48Day) === day));
        });
        lab.querySelector("#cycle48-reading").textContent = `Day ${day} · ${details.phase}`;
        lab.querySelector("#cycle48-explanation").textContent = details.explanation;
        lab.querySelector("#cycle48-svg-title").textContent = `Day ${day} on a schematic menstrual-cycle graph`;
        lab.querySelector("#cycle48-svg-desc").textContent = `Lining thickness decreases at the start of the cycle, then increases and levels off. ${details.description} Thickness has no numerical scale.`;
    });
})();

// Question 50: highlight a hormone without changing the selected quiz answer.
(() => {
    const hormones = {
        lh: {
            name: "LH · W",
            function: "Triggers ovulation",
            pattern: "The solid curve W has a tall, narrow surge around day 14. This LH surge triggers release of an egg from a mature ovarian follicle.",
            description: "The solid LH curve, labelled W, is highlighted. It has a tall, narrow surge around day 14 and triggers ovulation."
        },
        oestrogen: {
            name: "Oestrogen · Y",
            function: "Repairs and thickens the uterus lining",
            pattern: "The dashed curve Y rises before ovulation, falls, then rises again later in the cycle. This pattern identifies oestrogen.",
            description: "The dashed oestrogen curve, labelled Y, is highlighted. It peaks before ovulation and rises again later; oestrogen repairs and thickens the uterus lining."
        },
        progesterone: {
            name: "Progesterone",
            function: "Maintains the uterus lining",
            pattern: "The dotted curve is low before ovulation, then rises during the second half of the cycle and peaks around days 21–24. This is progesterone.",
            description: "The dotted progesterone curve is highlighted. It rises after ovulation, peaks around days 21 to 24 and maintains the uterus lining."
        },
        fsh: {
            name: "FSH",
            function: "Stimulates ovarian follicle development",
            pattern: "The dash-dot curve shows a much smaller rise around ovulation than the LH surge. FSH stimulates development of ovarian follicles.",
            description: "The dash-dot FSH curve is highlighted. It has a smaller rise around ovulation and stimulates development of ovarian follicles."
        }
    };

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button[data-hormone50]");
        const lab = button?.closest("#hormone50-lab");
        const selected = button?.dataset.hormone50;
        const details = hormones[selected];
        if (!lab || !feedback.contains(lab) || !details) return;

        lab.querySelectorAll("button[data-hormone50]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.hormone50 === selected));
        });
        lab.querySelectorAll("[data-hormone50-curve]").forEach((curve) => {
            curve.classList.toggle("is-active", curve.dataset.hormone50Curve === selected);
        });
        lab.querySelector("#hormone50-reading").textContent = `${details.name} — ${details.function}`;
        lab.querySelector("#hormone50-pattern").textContent = details.pattern;
        lab.querySelector("#hormone50-svg-title").textContent = `${details.name} highlighted on a menstrual-cycle hormone graph`;
        lab.querySelector("#hormone50-svg-desc").textContent = `${details.description} All four curves remain visible. The graph is schematic and has no numerical concentration scale.`;
    });
})();

// Question 53: delegated molecule controls preserve the selected quiz answer.
(() => {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const choices = {
        A: {
            name: "Single amino acid", type: "amino", count: 1,
            summary: "One amino acid, with no peptide bonds to hydrolyse.",
            result: "Not digested: a single amino acid is already a protein-digestion product."
        },
        B: {
            name: "Single glucose molecule", type: "glucose", count: 1,
            summary: "One glucose molecule; it contains no peptide bonds.",
            result: "Not digested: glucose is not a substrate for protease."
        },
        C: {
            name: "Intact amino-acid chain", type: "amino", count: 4,
            summary: "Four amino acids are joined by three peptide bonds."
        },
        D: {
            name: "Glucose chain", type: "glucose", count: 4,
            summary: "Four glucose molecules are linked by three bonds. These are not peptide bonds.",
            result: "Not digested: protease does not hydrolyse the bonds in a glucose chain."
        }
    };

    function renderMolecule(lab, selected, stage, tested) {
        const choice = choices[selected];
        if (!choice) return;
        const isProtein = selected === "C";
        const positions = choice.count === 1 ? [260]
            : isProtein && stage === 1 ? [65, 155, 365, 455]
            : isProtein && stage === 2 ? [65, 195, 325, 455]
            : [80, 200, 320, 440];
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < positions.length - 1; index += 1) {
            if (isProtein && (stage === 2 || (stage === 1 && index === 1))) continue;
            const bond = document.createElementNS(svgNamespace, "line");
            bond.setAttribute("class", "protease53-bond");
            bond.setAttribute("data-protease53-bond", String(index));
            bond.setAttribute("x1", positions[index] + 23);
            bond.setAttribute("x2", positions[index + 1] - 23);
            bond.setAttribute("y1", "90");
            bond.setAttribute("y2", "90");
            fragment.append(bond);
        }
        positions.forEach((x) => {
            const node = document.createElementNS(svgNamespace, choice.type === "amino" ? "rect" : "circle");
            node.setAttribute("class", `protease53-${choice.type}`);
            node.setAttribute("data-protease53-node", choice.type);
            if (choice.type === "amino") {
                node.setAttribute("x", x - 23);
                node.setAttribute("y", "67");
                node.setAttribute("width", "46");
                node.setAttribute("height", "46");
                node.setAttribute("rx", "3");
            } else {
                node.setAttribute("cx", x);
                node.setAttribute("cy", "90");
                node.setAttribute("r", "23");
            }
            fragment.append(node);
        });
        lab.querySelector("#protease53-molecule").replaceChildren(fragment);

        const name = isProtein && stage === 1 ? "Two smaller peptides"
            : isProtein && stage === 2 ? "Separate amino acids" : choice.name;
        const summary = isProtein && stage === 1 ? "Two smaller peptides remain, each containing two amino acids."
            : isProtein && stage === 2 ? "Four separate amino acids remain; no peptide bonds link them." : choice.summary;
        const reading = isProtein && stage === 1 ? "Peptide bond hydrolysed: the chain is now two smaller peptides."
            : isProtein && stage === 2 ? "Further peptide digestion: four separate amino acids."
            : tested ? choice.result
            : `${selected} selected: apply protease to ${selected === "C" ? "the amino-acid chain" : "this molecule"}.`;
        const description = choice.type === "amino" ? "Squares represent amino acids. " : "Circles represent glucose molecules. ";

        lab.dataset.protease53Selected = selected;
        lab.dataset.protease53Stage = String(stage);
        lab.querySelectorAll("button[data-protease53-choice]").forEach((control) => {
            control.setAttribute("aria-pressed", String(control.dataset.protease53Choice === selected));
        });
        lab.querySelector("#protease53-stage").textContent = name;
        lab.querySelector("#protease53-bond-summary").textContent = summary;
        lab.querySelector("#protease53-reading").textContent = reading;
        lab.querySelector("#protease53-svg-title").textContent = `${selected}: ${name}`;
        lab.querySelector("#protease53-svg-desc").textContent = description + summary;
        const action = lab.querySelector("button[data-protease53-action]");
        action.disabled = isProtein && stage === 2;
        action.textContent = isProtein && stage === 2 ? "Digestion complete"
            : isProtein && stage === 1 ? "Continue digestion" : "Apply protease";
    }

    feedback.addEventListener("click", (event) => {
        const button = event.target.closest?.("button");
        const lab = button?.closest("#protease53-lab");
        if (!lab || !feedback.contains(lab)) return;
        const selected = lab.dataset.protease53Selected || "C";
        if (button.hasAttribute("data-protease53-choice")) {
            renderMolecule(lab, button.dataset.protease53Choice, 0, false);
        } else if (button.hasAttribute("data-protease53-reset")) {
            renderMolecule(lab, selected, 0, false);
        } else if (button.hasAttribute("data-protease53-action")) {
            const stage = selected === "C" ? Math.min(2, Number(lab.dataset.protease53Stage || 0) + 1) : 0;
            renderMolecule(lab, selected, stage, true);
        }
    });
})();

	