
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
    "chapter": "States of Matter · Gas behaviour",
    "title": "A piston can slide freely inside a syringe containing helium. The gas is heated while the external pressure stays constant. What happens to its volume and the spacing of its atoms?",
    "legend": "Apply the kinetic particle model",
    "context": "<p class=\"scenario\">A free-moving piston allows the helium to expand at constant pressure.</p>",
    "options": [
      "Smaller volume; atoms become closer",
      "Smaller volume; atoms spread out",
      "Larger volume; atoms become closer",
      "Larger volume; atoms spread out"
    ],
    "correct": "D",
    "answer": "D. Larger volume; atoms spread out",
    "explanation": "<p class=\"definition\"><strong>Charles’s law:</strong> at constant pressure, the volume of a fixed mass of gas rises as its absolute temperature increases.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Heating gives helium atoms greater average kinetic energy.</li><li>More energetic collisions push the freely moving piston outwards.</li><li>The volume increases while the number of atoms stays the same, so their average separation increases.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q01-fm26.svg\" alt=\"Before and after gas syringe heating at constant pressure with a movable piston\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Both volume and spacing go the wrong way.</li><li><strong>B.</strong> If the gas occupies less space, its average spacing cannot increase in this situation.</li><li><strong>C.</strong> Expansion does not make the average spacing smaller.</li><li><strong>D.</strong> Correct: expansion creates more space per gas atom.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> At constant pressure: higher temperature → greater gas volume → atoms farther apart.</p>",
    "paperNumber": 1
  },
  {
    "chapter": "States of Matter · Diffusion",
    "title": "Ammonia and hydrogen chloride diffuse from opposite ends of a tube. What is the first colour of the damp universal indicator, and which molecules move faster?",
    "legend": "Compare diffusion rates and indicator colours",
    "context": "<p class=\"scenario\">Hydrogen chloride forms an acid in water; ammonia forms an alkali. Compare the molecules reaching the paper first.</p>",
    "options": [
      "NH₃ arrives first; blue",
      "NH₃ arrives first; red",
      "HCl arrives first; blue",
      "HCl arrives first; red"
    ],
    "correct": "A",
    "answer": "A. NH₃ arrives first; blue",
    "explanation": "<p class=\"definition\"><strong>Diffusion:</strong> gas particles spread from regions of higher to lower concentration by random movement. At the same temperature, lighter gas molecules diffuse faster.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Calculate Mᵣ(NH₃) = 14 + 3(1) = <strong>17</strong>.</li><li>Calculate Mᵣ(HCl) = 1 + 35.5 = <strong>36.5</strong>.</li><li>Lighter ammonia molecules spread faster and reach the paper first.</li><li>Dissolved ammonia forms an alkaline solution, so damp universal indicator changes towards <strong>blue</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q02-fm26.svg\" alt=\"Diffusion tube with NH3, HCl, and universal indicator showing a blue first colour\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: the lighter alkaline gas reaches the indicator first.</li><li><strong>B.</strong> Ammonia is alkaline; a red indicator shows acidic conditions.</li><li><strong>C.</strong> Hydrogen chloride is heavier and slower than ammonia.</li><li><strong>D.</strong> HCl would produce an acidic colour but is not the first to arrive.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Lighter gas → faster diffusion. Ammonia is alkaline (blue); hydrogen chloride is acidic (red).</p>",
    "paperNumber": 2,
    "questionVisual": "<figure class=\"question-original-figure\"><a href=\"images/question-02-original.png\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open diagram full size\"><img src=\"images/question-02-original.png\" alt=\"Original diffusion-tube diagram: cotton soaked in hydrochloric acid on the left, damp universal indicator at centre and concentrated ammonia on right\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Original question diagram: © Cambridge University Press & Assessment 2026 (provided by user). <a href=\"https://www.papersdaddy.com/cambridge/igcse/chemistry-0620/2026-march/0620_m26_qp_22.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">Source paper</a> · <a href=\"images/question-02-original.png\" target=\"_blank\" rel=\"noopener noreferrer\">Open full size</a></figcaption></figure>",
    "tableHeaders": [
      "Colour of universal indicator paper",
      "Reason"
    ],
    "tableRows": [
      [
        "blue",
        "Ammonia molecules move more quickly than hydrogen chloride molecules."
      ],
      [
        "red",
        "Ammonia molecules move more quickly than hydrogen chloride molecules."
      ],
      [
        "blue",
        "Hydrogen chloride molecules move more quickly than ammonia molecules."
      ],
      [
        "red",
        "Hydrogen chloride molecules move more quickly than ammonia molecules."
      ]
    ]
  },
  {
    "chapter": "Atoms, Elements and Compounds · Ions",
    "title": "A Group II metal forms an X²⁺ ion. Which quantity must have the greatest numerical value?",
    "legend": "Compare subatomic particle counts",
    "context": "<p class=\"scenario\">X²⁺ means the neutral Group II atom has lost two electrons.</p>",
    "options": [
      "Nucleon (mass) number",
      "Number of electrons",
      "Number of neutrons",
      "Proton (atomic) number"
    ],
    "correct": "A",
    "answer": "A. Nucleon (mass) number",
    "explanation": "<p class=\"definition\"><strong>Nucleon number = protons + neutrons.</strong> A positive ion has fewer electrons than protons because it has lost electrons.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>For Group II element X, the ion has <strong>p</strong> protons and <strong>p − 2</strong> electrons.</li><li>The nucleon number is <strong>p + n</strong>, the sum of protons and neutrons.</li><li>The mass number exceeds either the proton count or the neutron count for a Group II atom, and it also exceeds the electron count.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q03-fm26.svg\" alt=\"Comparison of proton neutron electron counts for a generic Group II positive ion\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: it combines the numbers of protons and neutrons.</li><li><strong>B.</strong> X²⁺ has lost two electrons, reducing its electron count.</li><li><strong>C.</strong> Neutrons are only one part of the nucleon number.</li><li><strong>D.</strong> The proton number is less than the total nucleon number.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Mass number = protons + neutrons; a 2+ ion has lost two electrons.</p>",
    "paperNumber": 3
  },
  {
    "chapter": "Chemical Bonding · Formulae",
    "title": "Elements P and Q occupy the positions in the Periodic Table shown below. What formula will their ionic compound have?",
    "legend": "Choose the electrically neutral formula",
    "context": "",
    "options": [
      "QP",
      "Q₂P",
      "Q₇P",
      "QP₇"
    ],
    "correct": "A",
    "answer": "A. QP",
    "explanation": "<p class=\"definition\">Group I atoms normally form <strong>Q⁺</strong> ions and Group VII atoms normally form <strong>P⁻</strong> ions.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Q loses one electron to form Q⁺.</li><li>P gains one electron to form P⁻.</li><li>One positive charge balances one negative charge, giving a <strong>1:1</strong> ratio.</li><li>Write the positive ion first: <strong>QP</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q04-fm26.svg\" alt=\"Periodic Table Group I and Group VII forming Q+ and P− ions and neutral QP formula\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct; 1 positive and 1 negative charge cancel.</li><li><strong>B.</strong> Two Q⁺ ions would give a total charge of +1 alongside one P⁻.</li><li><strong>C.</strong> Seven Q⁺ ions cannot balance one P⁻.</li><li><strong>D.</strong> Seven P⁻ ions cannot balance a single Q⁺.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Group I (+1) + Group VII (−1) → formula QP, not Q₂P or QP₇.</p>",
    "paperNumber": 4,
    "questionVisual": "<figure class=\"question-original-figure\"><a href=\"images/question-04-exam-redraw.svg\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open diagram full size\"><img src=\"images/question-04-exam-redraw.svg\" alt=\"Periodic table positions of P in group VII and Q in group I\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Exam-style redraw based on the paper; not the original Cambridge illustration. <a href=\"https://www.papersdaddy.com/cambridge/igcse/chemistry-0620/2026-march/0620_m26_qp_22.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">Source paper</a> · <a href=\"images/question-04-exam-redraw.svg\" target=\"_blank\" rel=\"noopener noreferrer\">Open full size</a></figcaption></figure>"
  },
  {
    "chapter": "Chemical Bonding · Molecular properties",
    "title": "Which row is typical of a simple molecular substance?",
    "legend": "Recognise low melting/boiling points and low conductivity",
    "context": "<p class=\"scenario\">The listed numerical values are illustrative property sets corresponding to the February/March paper concept.</p>",
    "options": [
      "Melts at −39 °C, boils at 357 °C, conducts electricity well",
      "Melts at 3550 °C, boils at 4830 °C, poor conductor",
      "Melts at 11 °C, boils at 181 °C, poor conductor",
      "Melts at 97 °C, boils at 882 °C, conducts electricity well"
    ],
    "correct": "C",
    "answer": "C. Melts at 11 °C, boils at 181 °C, poor conductor",
    "explanation": "<p class=\"definition\">Simple molecular substances have <strong>weak intermolecular forces</strong>, giving comparatively low melting and boiling points, and normally lack mobile charge carriers.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Identify the expected combination: <strong>low melting point + low boiling point + poor conductivity</strong>.</li><li>A and D are conductors, so they do not fit a typical simple molecular compound.</li><li>B has extremely high melting and boiling points, suggesting a giant structure.</li><li>C has low phase-change temperatures and is a poor conductor.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q05-fm26.svg\" alt=\"Weak attractions between simple molecules versus a strong giant covalent structure\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Conductivity is inconsistent with ordinary simple molecular compounds.</li><li><strong>B.</strong> The very high temperatures suggest a giant structure.</li><li><strong>C.</strong> Correct: relatively low temperatures and poor conduction.</li><li><strong>D.</strong> It conducts well and has a high boiling point.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Simple molecular = low melting/boiling points + generally no electrical conduction.</p>",
    "paperNumber": 5,
    "tableHeaders": [
      "Melting point / °C",
      "Boiling point / °C",
      "Electrical conductivity at r.t.p."
    ],
    "tableRows": [
      [
        "−39",
        "357",
        "good"
      ],
      [
        "3550",
        "4830",
        "poor"
      ],
      [
        "11",
        "181",
        "poor"
      ],
      [
        "97",
        "882",
        "good"
      ]
    ]
  },
  {
    "chapter": "Chemical Bonding · Giant covalent",
    "title": "Diamond and silicon(IV) oxide have an important structural similarity. Which statement describes it?",
    "legend": "Identify the bonding arrangement in giant networks",
    "context": "<p class=\"scenario\">Diamond is a form of carbon. Silicon(IV) oxide is written as SiO₂.</p>",
    "options": [
      "Both consist of separate molecules linked by weak attractions",
      "Both consist of planes that slide across one another easily",
      "Both consist of freely mobile positive and negative ions",
      "Each carbon in diamond and each silicon in SiO₂ forms four covalent bonds"
    ],
    "correct": "D",
    "answer": "D. Each carbon in diamond and each silicon in SiO₂ forms four covalent bonds",
    "explanation": "<p class=\"definition\"><strong>Giant covalent structures</strong> are networks of atoms linked by strong covalent bonds throughout the solid.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Each carbon atom in diamond is covalently bonded to four other carbon atoms.</li><li>In silicon dioxide, each silicon atom is covalently bonded to four oxygen atoms; each oxygen bridges two silicon atoms.</li><li>This strong three-dimensional network explains their high melting points and hardness.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q06-fm26.svg\" alt=\"Giant covalent networks with a diamond carbon centre and silicon dioxide silicon centre both with four bonds\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> These substances are giant covalent structures, not separate small molecules.</li><li><strong>B.</strong> Sliding layers describe graphite, not diamond or SiO₂.</li><li><strong>C.</strong> They are not giant ionic lattices with mobile ions.</li><li><strong>D.</strong> Correct: carbon and silicon each have four covalent bonds in their respective networks.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Diamond: C bonded to 4 C; SiO₂: Si bonded to 4 O, O bonded to 2 Si.</p>",
    "paperNumber": 6
  },
  {
    "chapter": "Chemical Bonding · Ionic vs metallic",
    "title": "Solid X is an ionic compound that does not conduct electricity. Solid Y is a metal that does conduct. Which statements about the solids are correct?",
    "legend": "Select the correct combination of statements",
    "context": "<ol class=\"exam-statements\"><li>X is a compound; Y is an element.</li><li>Only X contains ions in a lattice.</li><li>X contains positive and negative ions; Y has positive metal ions and no negative ions.</li></ol>",
    "options": [
      "1, 2 and 3",
      "1 and 2 only",
      "1 and 3 only",
      "2 and 3 only"
    ],
    "correct": "C",
    "answer": "C. 1 and 3 only",
    "explanation": "<p class=\"definition\"><strong>Ionic solids:</strong> a lattice of fixed cations and anions. <strong>Metals:</strong> a lattice of positive metal ions with mobile delocalised electrons.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Statement <strong>1 is true</strong>: the ionic compound X contains different types of ion; the pure metallic element Y has one type of metal atom.</li><li>Statement <strong>2 is false</strong>: metals also contain a regular lattice of positive metal ions.</li><li>Statement <strong>3 is true</strong>: the mobile delocalised electrons allow Y to conduct electricity.</li><li>Choose <strong>1 and 3 only</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q07-fm26.svg\" alt=\"Fixed positive negative ions compared with metal lattice of positive ions and mobile electrons\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Includes false statement 2.</li><li><strong>B.</strong> Omits the true statement 3 and includes false 2.</li><li><strong>C.</strong> Correct: only statements 1 and 3.</li><li><strong>D.</strong> Includes false statement 2 and omits true statement 1.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Both ionic solids and metals have lattices; metals conduct through delocalised electrons.</p>",
    "paperNumber": 7
  },
  {
    "chapter": "Chemical Calculations · Percentage yield",
    "title": "A student burns magnesium and calculates a theoretical yield of 10 g of magnesium oxide. Which expression correctly calculates percentage yield?",
    "legend": "Identify actual yield compared with theoretical yield",
    "context": "<p class=\"scenario\">The theoretical mass expected is 10.0 g. The actual yield is determined experimentally.</p>",
    "options": [
      "(Mᵣ of Mg ÷ Mᵣ of MgO) × 100",
      "(Actual MgO mass ÷ original Mg mass) × 100",
      "(Actual MgO mass ÷ 10.0 g) × 100",
      "(Mass of pure MgO ÷ all products) × 100"
    ],
    "correct": "C",
    "answer": "C. (Actual MgO mass ÷ 10.0 g) × 100",
    "explanation": "<p class=\"definition\"><strong>Percentage yield = (actual yield ÷ theoretical yield) × 100%.</strong> Both masses must use the same units.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Theoretical yield is the maximum expected product mass for the given reaction calculation: <strong>10.0 g</strong>.</li><li>Actual yield is the measured product mass.</li><li>Divide actual by theoretical, then multiply by 100.</li><li>Example: actual 8.0 g would give (8.0 ÷ 10.0) × 100 = <strong>80%</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q08-fm26.svg\" alt=\"Two masses on a scale showing theoretical 10g and actual 8g, calculating 80 percent yield\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Relative masses are used in mole calculations, not directly as a yield ratio.</li><li><strong>B.</strong> Compares product mass with starting magnesium mass, not the expected product mass.</li><li><strong>C.</strong> Correct: measured product divided by theoretical product.</li><li><strong>D.</strong> This describes a purity comparison rather than percentage yield.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Percentage yield = actual ÷ theoretical × 100; percentage purity is a different formula.</p>",
    "paperNumber": 8
  },
  {
    "chapter": "Chemical Calculations · Limiting reactant",
    "title": "4.55 g of zinc is reacted with 50 cm³ of 2.25 mol/dm³ hydrochloric acid. Calculate the volume of hydrogen produced at r.t.p.",
    "legend": "Find the limiting reagent before calculating gas volume",
    "context": "<p class=\"exam-equation\">Zn + 2HCl → ZnCl₂ + H₂</p>",
    "options": [
      "1.35 dm³",
      "1.68 dm³",
      "2.70 dm³",
      "3.36 dm³"
    ],
    "correct": "A",
    "answer": "A. 1.35 dm³",
    "explanation": "<p class=\"definition\">A <strong>limiting reactant</strong> runs out first and determines the maximum product yield.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Zn: 4.55 ÷ 65 = <strong>0.0700 mol</strong>.</li><li>HCl: 50.0 ÷ 1000 × 2.25 = <strong>0.1125 mol</strong>.</li><li>0.0700 mol Zn would need 0.140 mol HCl, but only 0.1125 mol is available. Therefore <strong>HCl is limiting</strong>.</li><li>From 2HCl : 1H₂, n(H₂) = 0.1125 ÷ 2 = <strong>0.05625 mol</strong>.</li><li>Volume H₂ = 0.05625 × 24 = <strong>1.35 dm³</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q09-fm26.svg\" alt=\"Stoichiometric reaction bar of zinc versus hydrochloric acid showing HCl limiting and final hydrogen 1.35 cubic decimetres\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: use HCl as the limiting reactant.</li><li><strong>B.</strong> 1.68 dm³ is obtained by wrongly treating all zinc as the limiting reactant.</li><li><strong>C.</strong> Too large: it misses the 2:1 HCl:H₂ ratio.</li><li><strong>D.</strong> Too large: it assumes more hydrogen than either reactant can supply.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Check the limiting reactant before using gas volume = moles × 24 dm³.</p>",
    "paperNumber": 9
  },
  {
    "chapter": "Electrochemistry · Electrolysis",
    "title": "In the electrolytic apparatus shown, oxidation happens at electrode 1 and reduction at electrode 2. Which directions do electrons and positive ions move?",
    "legend": "Remember AN OX / RED CAT and cation migration",
    "context": "<p class=\"scenario\">Electrode 1 = anode (+ in electrolysis); electrode 2 = cathode (− in electrolysis). The battery drives electron movement in the external circuit.</p>",
    "options": [
      "Electrons: 1 → 2; positive ions: 1 → 2",
      "Electrons: 1 → 2; positive ions: 2 → 1",
      "Electrons: 2 → 1; positive ions: 1 → 2",
      "Electrons: 2 → 1; positive ions: 2 → 1"
    ],
    "correct": "A",
    "answer": "A. Electrons: 1 → 2; positive ions: 1 → 2",
    "explanation": "<p class=\"definition\"><strong>Oxidation at the anode produces electrons;</strong> reduction at the cathode uses electrons. <strong>Cations</strong> move towards the negatively charged cathode.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>At electrode 1, oxidation removes electrons from species and releases electrons into the external circuit.</li><li>The power source transfers electrons through the circuit to electrode 2, where reduction consumes them.</li><li>Positive ions in the electrolyte migrate towards electrode 2 (the negative cathode).</li><li>Both directions are <strong>1 → 2</strong> as shown in the schematic.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q10-fm26.svg\" alt=\"Electrolysis cell with powered external wire electron transfer from anode via power source to cathode and ion migration within liquid\" loading=\"lazy\"><figcaption>Original teaching diagram drawn for this practice edition; not the Cambridge exam illustration.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: electron transfer and cation migration are both towards electrode 2 in their respective paths.</li><li><strong>B.</strong> Cations move to the cathode, not to the anode.</li><li><strong>C.</strong> The overall electron-transfer direction is reversed.</li><li><strong>D.</strong> Both directions are reversed.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> AN OX = oxidation at anode; RED CAT = reduction at cathode; cations → cathode.</p>",
    "paperNumber": 10,
    "questionVisual": "<figure class=\"question-original-figure\"><a href=\"images/question-10-exam-redraw.svg\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Open diagram full size\"><img src=\"images/question-10-exam-redraw.svg\" alt=\"Electrolysis apparatus showing battery connected to electrode 1 and electrode 2 in electrolyte\" loading=\"lazy\" decoding=\"async\"></a><figcaption>Exam-style redraw based on the paper; not the original Cambridge illustration. <a href=\"https://www.papersdaddy.com/cambridge/igcse/chemistry-0620/2026-march/0620_m26_qp_22.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">Source paper</a> · <a href=\"images/question-10-exam-redraw.svg\" target=\"_blank\" rel=\"noopener noreferrer\">Open full size</a></figcaption></figure>",
    "tableHeaders": [
      "Direction of electrons in external circuit",
      "Direction of positive ions in electrolyte"
    ],
    "tableRows": [
      [
        "1 → 2",
        "1 → 2"
      ],
      [
        "1 → 2",
        "2 → 1"
      ],
      [
        "2 → 1",
        "1 → 2"
      ],
      [
        "2 → 1",
        "2 → 1"
      ]
    ]
  },
  {
    "chapter": "Electrochemistry · Fuel cells",
    "title": "Which row states one advantage of a hydrogen–oxygen fuel cell and one advantage of a petrol engine?",
    "legend": "Evaluate the advantages of each energy source",
    "context": "<p class=\"scenario\">The comparison concerns the gases released while the vehicle operates and the typical distance travelled before refuelling.</p>",
    "options": [
      "Fuel cell: longer range on one fill; petrol: no carbon dioxide in exhaust",
      "Fuel cell: widely available hydrogen stations; petrol: no risk of fuel fires",
      "Fuel cell: no CO₂ produced during its operation; petrol: typically greater range on a full tank",
      "Fuel cell: no fire or explosion hazard; petrol: fewer refuelling stations"
    ],
    "correct": "C",
    "answer": "C. Fuel cell: no CO₂ produced during its operation; petrol: typically greater range on a full tank",
    "explanation": "<p class=\"definition\">A hydrogen–oxygen fuel cell combines <strong>hydrogen and oxygen to produce water and electrical energy</strong>. Burning petrol releases carbon dioxide.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>The overall fuel-cell reaction is <strong>2H₂ + O₂ → 2H₂O</strong>; there is no carbon dioxide in the reaction products.</li><li>A petrol engine burns hydrocarbons, producing CO₂ during complete combustion.</li><li>Petrol cars commonly have a longer range for a full tank than many hydrogen fuel-cell vehicles.</li><li>Hydrogen is flammable and hydrogen filling stations are not as common as petrol stations.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q11-fm26.svg\" alt=\"Hydrogen fuel cell forming water and a petrol engine emitting carbon dioxide\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Both claims are incorrect: range does not favour the fuel cell here, and petrol emits CO₂.</li><li><strong>B.</strong> Hydrogen infrastructure is less widespread, and petrol is flammable.</li><li><strong>C.</strong> Correct: fuel-cell exhaust is water; the petrol vehicle can travel farther between fuel stops.</li><li><strong>D.</strong> Hydrogen has fire hazards; petrol has more widespread stations.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Distinguish tailpipe emissions from full life-cycle impacts: hydrogen production can still generate CO₂.</p>",
    "paperNumber": 11,
    "tableHeaders": [
      "Hydrogen–oxygen fuel cell",
      "Petrol engine"
    ],
    "tableRows": [
      [
        "longer driving range on a full tank",
        "no carbon dioxide produced"
      ],
      [
        "more filling stations available",
        "no risk of explosion"
      ],
      [
        "no CO₂ produced at the vehicle",
        "typically longer range between fuel stops"
      ],
      [
        "no fire or explosion hazard",
        "more filling stations available"
      ]
    ]
  },
  {
    "chapter": "Chemical Energetics · Activation energy",
    "title": "Which description best defines activation energy in a chemical reaction?",
    "legend": "Choose the definition of activation energy",
    "context": "<p class=\"scenario\">Imagine a reaction profile with an energy barrier between reactants and products.</p>",
    "options": [
      "The greatest amount of energy that can be released by a reaction",
      "The greatest amount of energy that a reaction can absorb",
      "The least energy colliding reacting particles require for a successful reaction",
      "The least energy released when new chemical bonds are formed"
    ],
    "correct": "C",
    "answer": "C. The least energy colliding reacting particles require for a successful reaction",
    "explanation": "<p class=\"definition\"><strong>Activation energy (Eₐ)</strong> is the minimum energy that colliding particles must possess for a reaction to occur.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>A collision must have energy at least equal to the activation energy.</li><li>On an energy profile, Eₐ is the vertical difference from the reactant energy level to the peak of the curve.</li><li>A catalyst increases the reaction rate by providing a different route with lower activation energy.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q12-fm26.svg\" alt=\"Energy profile graph showing activation-energy barrier and minimum collision energy\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Activation energy is a threshold, not the maximum heat released.</li><li><strong>B.</strong> It is not the maximum energy absorbed in an endothermic process.</li><li><strong>C.</strong> Correct: colliding particles need at least this minimum energy to react.</li><li><strong>D.</strong> Making bonds releases energy, but this is not what activation energy means.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Eₐ is measured from reactants up to the top of the energy barrier, not between reactants and products.</p>",
    "paperNumber": 12
  },
  {
    "chapter": "Chemical Energetics · Bond energies",
    "title": "For 2H₂O₂ → 2H₂O + O₂, what is the enthalpy change, calculated using these bond energies?",
    "legend": "Calculate ΔH from bonds broken and formed",
    "context": "<table class=\"paper-data-table\"><caption>Bond energies for the decomposition of hydrogen peroxide</caption><thead><tr><th>Bond</th><th>Bond energy / kJ mol⁻¹</th></tr></thead><tbody><tr><td>O–H</td><td>460</td></tr><tr><td>O–O</td><td>150</td></tr><tr><td>O=O</td><td>496</td></tr></tbody></table>",
    "options": [
      "−346 kJ",
      "−196 kJ",
      "+196 kJ",
      "+346 kJ"
    ],
    "correct": "B",
    "answer": "B. −196 kJ",
    "explanation": "<p class=\"definition\"><strong>ΔH ≈ total bond energy of bonds broken − total bond energy of bonds formed.</strong></p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li><strong>Broken:</strong> reactants contain four O–H bonds and two O–O bonds: 4(460) + 2(150) = <strong>2140 kJ</strong>.</li><li><strong>Formed:</strong> products contain four O–H bonds in two water molecules and one O=O bond: 4(460) + 496 = <strong>2336 kJ</strong>.</li><li><strong>ΔH = 2140 − 2336 = −196 kJ.</strong> The negative sign confirms an exothermic reaction.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q13-fm26.svg\" alt=\"Bond energy counting diagram two hydrogen peroxide molecules versus two water molecules and oxygen\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> −346 results from a bond-count or subtraction error.</li><li><strong>B.</strong> Correct: the same four O–H bonds cancel, leaving 2(150) − 496 = −196 kJ.</li><li><strong>C.</strong> The magnitude is right but the sign is wrong; more energy is released than supplied.</li><li><strong>D.</strong> Both magnitude and sign are wrong.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Bonds broken TAKE IN energy. Bonds made RELEASE energy. Negative ΔH means exothermic.</p>",
    "paperNumber": 13
  },
  {
    "chapter": "Reversible Reactions · Haber process",
    "title": "Which row identifies the conventional sources of nitrogen and hydrogen used in the Haber process?",
    "legend": "Identify the usual industrial feedstocks",
    "context": "<p class=\"scenario\">The Haber reaction is N₂ + 3H₂ ⇌ 2NH₃. Choose the sources normally used in conventional large-scale manufacture.</p>",
    "options": [
      "Nitrogen from nitrate compounds; hydrogen from water",
      "Nitrogen from nitrate compounds; hydrogen from methane",
      "Nitrogen from air; hydrogen mainly from water electrolysis",
      "Nitrogen from air; hydrogen mainly from natural gas (methane)"
    ],
    "correct": "D",
    "answer": "D. Nitrogen from air; hydrogen mainly from natural gas (methane)",
    "explanation": "<p class=\"definition\">In conventional ammonia production, <strong>nitrogen is separated from air</strong> and <strong>hydrogen is commonly made from natural gas</strong>, mainly by steam reforming methane.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Air is about <strong>78% nitrogen</strong>, making it an economical source of N₂.</li><li>Natural gas contains methane (CH₄), which reacts with steam to generate hydrogen-rich gas.</li><li>Hydrogen can also be produced by water electrolysis, but it is not the usual conventional source described here.</li><li>The product NH₃ is formed using an iron catalyst under suitable temperature and pressure.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q14-fm26.svg\" alt=\"Schematic air nitrogen and natural gas methane feeding ammonia Haber reactor\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Nitrogen is taken from air, not normally from nitrates.</li><li><strong>B.</strong> Hydrogen may come from methane but the nitrogen source is wrong.</li><li><strong>C.</strong> Air is correct, but electrolysis is not the usual feedstock route in this conventional process.</li><li><strong>D.</strong> Correct: air supplies nitrogen and methane supplies hydrogen.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Do not confuse the Haber reactant gases (N₂, H₂) with the industrial sources used to obtain them.</p>",
    "paperNumber": 14,
    "tableHeaders": [
      "Source of nitrogen",
      "Source of hydrogen"
    ],
    "tableRows": [
      [
        "nitrates",
        "water"
      ],
      [
        "nitrates",
        "methane"
      ],
      [
        "air",
        "water"
      ],
      [
        "air",
        "methane"
      ]
    ]
  },
  {
    "chapter": "Chemical Reactions · Hydrated salts",
    "title": "A white sample of anhydrous copper(II) sulfate is placed in contact with water. Which statement accurately describes the reaction?",
    "legend": "Distinguish anhydrous salts and hydrated salts",
    "context": "<p class=\"scenario\">Anhydrous means without water of crystallisation; hydrated crystals contain water as part of their structure.</p>",
    "options": [
      "Anhydrous cobalt(II) chloride becomes blue when water is added",
      "Anhydrous cobalt(II) chloride loses its water of crystallisation on heating",
      "Anhydrous copper(II) sulfate becomes hydrated copper(II) sulfate when water is added",
      "Blue anhydrous copper(II) sulfate turns white when water is added"
    ],
    "correct": "C",
    "answer": "C. Anhydrous copper(II) sulfate becomes hydrated copper(II) sulfate when water is added",
    "explanation": "<p class=\"definition\"><strong>White CuSO₄ (anhydrous) + water → blue CuSO₄·5H₂O (hydrated).</strong></p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Copper(II) sulfate is <strong>white when anhydrous</strong>, and commonly blue as the pentahydrate.</li><li>Anhydrous cobalt(II) chloride is <strong>blue</strong> and turns pink when hydrated.</li><li>A hydrated salt can lose its water of crystallisation on heating, becoming anhydrous.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q15-fm26.svg\" alt=\"White anhydrous copper sulfate becoming blue hydrated copper sulfate and cobalt chloride colours\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> This reverses the cobalt(II) chloride colour change.</li><li><strong>B.</strong> It is a hydrated salt, not an anhydrous one, that can lose water on heating.</li><li><strong>C.</strong> Correct: the anhydrous salt takes in water to form a hydrate.</li><li><strong>D.</strong> Anhydrous copper(II) sulfate starts white and becomes blue, not the reverse.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Hydration colours: CuSO₄ white → blue; CoCl₂ blue → pink.</p>",
    "paperNumber": 15
  },
  {
    "chapter": "Redox · Oxidising and reducing agents",
    "title": "Acidified manganate(VII) ions react with iron(II) ions. Which row identifies the ion reduced and the reducing agent?",
    "legend": "Follow oxidation numbers and electron transfer",
    "context": "<p class=\"exam-equation\">MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 4H₂O + 5Fe³⁺</p>",
    "options": [
      "Reduced: Fe²⁺; reducing agent: Fe²⁺",
      "Reduced: Fe²⁺; reducing agent: MnO₄⁻",
      "Reduced: MnO₄⁻; reducing agent: Fe²⁺",
      "Reduced: MnO₄⁻; reducing agent: MnO₄⁻"
    ],
    "correct": "C",
    "answer": "C. Reduced: MnO₄⁻; reducing agent: Fe²⁺",
    "explanation": "<p class=\"definition\"><strong>Reduction = gain of electrons.</strong> A reducing agent supplies electrons to another species and is itself oxidised.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Fe²⁺ → Fe³⁺ + e⁻: iron(II) <strong>loses</strong> an electron, so it is oxidised.</li><li>Mn in MnO₄⁻ changes from +7 to +2: it <strong>gains</strong> five electrons, so the manganate(VII) ion is reduced.</li><li>Fe²⁺ donates electrons, so it is the <strong>reducing agent</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q16-fm26.svg\" alt=\"Redox electron transfer from Fe2+ to MnO4 minus showing Fe3+ and Mn2+\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Fe²⁺ is oxidised, not reduced.</li><li><strong>B.</strong> Both assignments are incorrect: Fe²⁺ loses electrons and MnO₄⁻ gains them.</li><li><strong>C.</strong> Correct: MnO₄⁻ is reduced and Fe²⁺ is the reducing agent.</li><li><strong>D.</strong> MnO₄⁻ is the oxidising agent, not the reducing agent.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> OIL RIG: oxidation is loss, reduction is gain. The reducing agent is oxidised.</p>",
    "paperNumber": 16,
    "tableHeaders": [
      "Ion reduced",
      "Reducing agent"
    ],
    "tableRows": [
      [
        "Fe²⁺",
        "Fe²⁺"
      ],
      [
        "Fe²⁺",
        "MnO₄⁻"
      ],
      [
        "MnO₄⁻",
        "Fe²⁺"
      ],
      [
        "MnO₄⁻",
        "MnO₄⁻"
      ]
    ]
  },
  {
    "chapter": "Acids, Bases and Salts · Strong acids",
    "title": "Which pair of statements correctly describes aqueous hydrochloric acid?",
    "legend": "Identify statements about aqueous hydrochloric acid",
    "context": "<ol class=\"exam-statements\"><li>It is completely dissociated in aqueous solution.</li><li>It turns thymolphthalein blue.</li><li>It acts as a strong acid in water.</li><li>It produces hydroxide ions as characteristic ions.</li></ol>",
    "options": [
      "Statements 1 and 3",
      "Statements 1 and 4",
      "Statements 2 and 3",
      "Statements 2 and 4"
    ],
    "correct": "A",
    "answer": "A. Statements 1 and 3",
    "explanation": "<p class=\"definition\"><strong>Strong acid</strong> means the acid completely ionises in aqueous solution, producing hydrogen ions (more precisely hydrated hydrogen ions).</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Statement 1 is <strong>true</strong>: HCl(aq) ionises essentially completely to H⁺ and Cl⁻.</li><li>Statement 2 is <strong>false</strong>: thymolphthalein remains colourless in acid.</li><li>Statement 3 is <strong>true</strong>: HCl is classified as a strong acid.</li><li>Statement 4 is <strong>false</strong>: acids produce H⁺(aq), whereas alkalis produce OH⁻(aq).</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q17-fm26.svg\" alt=\"Strong hydrochloric acid ionisation and thymolphthalein indicator colours\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: 1 and 3 are both true.</li><li><strong>B.</strong> Statement 4 wrongly attributes hydroxide production to acid.</li><li><strong>C.</strong> Statement 2 is false because thymolphthalein is colourless in acidic solution.</li><li><strong>D.</strong> Both selected statements are false.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> A strong acid is fully ionised; strong does not mean concentrated.</p>",
    "paperNumber": 17
  },
  {
    "chapter": "Acids and Bases · Amphiprotic ions",
    "title": "Which statements about the two dissociation stages of sulfuric acid are correct?",
    "legend": "Apply the Brønsted–Lowry acid–base definition",
    "context": "<p class=\"exam-equation\">H₂SO₄ ⇌ H⁺ + HSO₄⁻<br>HSO₄⁻ ⇌ H⁺ + SO₄²⁻</p><ol class=\"exam-statements\"><li>HSO₄⁻ can donate and accept protons.</li><li>H₂SO₄ can donate protons.</li><li>SO₄²⁻ is the only base present.</li></ol>",
    "options": [
      "Statements 1 and 2",
      "Statement 1 only",
      "Statements 2 and 3",
      "Statement 3 only"
    ],
    "correct": "A",
    "answer": "A. Statements 1 and 2",
    "explanation": "<p class=\"definition\"><strong>HSO₄⁻ is amphiprotic:</strong> it can accept a proton to form H₂SO₄ or donate a proton to form SO₄²⁻.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>HSO₄⁻ can <strong>donate H⁺</strong> to give SO₄²⁻ and <strong>accept H⁺</strong> to give H₂SO₄. Statement 1 is true.</li><li>H₂SO₄ is a proton donor, so statement 2 is true.</li><li>SO₄²⁻ can accept a proton, but HSO₄⁻ can also accept one: statement 3 is false.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q18-fm26.svg\" alt=\"Two-stage sulfuric acid dissociation showing hydrogen sulfate ion proton donation and acceptance\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Correct: statements 1 and 2 describe proton transfer correctly.</li><li><strong>B.</strong> Statement 2 is also true, so statement 1 alone is incomplete.</li><li><strong>C.</strong> Statement 3 is false because HSO₄⁻ can also act as a base.</li><li><strong>D.</strong> Statement 3 is false.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> HSO₄⁻ is both an acid and a base depending on whether it donates or accepts H⁺.</p>",
    "paperNumber": 18
  },
  {
    "chapter": "Acids, Bases and Salts · Amphoteric oxides",
    "title": "A solid oxide such as zinc oxide is described as amphoteric. Which pair of reactions is possible?",
    "legend": "Use the definition of an amphoteric oxide",
    "context": "<p class=\"scenario\">Examples of amphoteric oxides in IGCSE Chemistry include aluminium oxide and zinc oxide.</p>",
    "options": [
      "It reacts with acids only, making salt and water",
      "It reacts with both acids and bases, giving salts and water",
      "It reacts with both acids and bases, making hydrogen gas in both reactions",
      "It reacts with bases only, making salt and water"
    ],
    "correct": "B",
    "answer": "B. It reacts with both acids and bases, giving salts and water",
    "explanation": "<p class=\"definition\">An <strong>amphoteric oxide</strong> reacts with both acids and alkalis/bases to form salts and water.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>With an acid: <strong>ZnO + 2HCl → ZnCl₂ + H₂O</strong>.</li><li>With an alkali, ZnO also reacts; zinc-containing salts or complexes are produced, together with water in suitable equations.</li><li>Releasing hydrogen from acid is characteristic of many <strong>metals</strong>, not a general feature of amphoteric <strong>metal oxides</strong>.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q19-fm26.svg\" alt=\"Zinc oxide in the centre reacting with hydrochloric acid and sodium hydroxide\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> This describes a basic oxide, not an amphoteric one.</li><li><strong>B.</strong> Correct: amphoteric oxides react with both types of reagent.</li><li><strong>C.</strong> Metal oxides do not produce hydrogen as the usual acid–base product.</li><li><strong>D.</strong> This describes an acidic oxide, not an amphoteric one.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Amphoteric = reacts with BOTH acids and bases; examples: Al₂O₃, ZnO.</p>",
    "paperNumber": 19
  },
  {
    "chapter": "The Periodic Table · Across a period",
    "title": "Going from left to right through the main-group elements of Period 3, which property generally increases?",
    "legend": "Recognise period and group patterns",
    "context": "<p class=\"scenario\">Period 3 runs from sodium to argon; every element has three occupied electron shells.</p>",
    "options": [
      "How metallic the elements are",
      "How many electron shells are occupied",
      "The number of electrons in the outermost occupied shell",
      "How easily atoms form positive ions"
    ],
    "correct": "C",
    "answer": "C. The number of electrons in the outermost occupied shell",
    "explanation": "<p class=\"definition\"><strong>Across a period, proton number and outer-shell electron count generally increase</strong> for the main-group elements.</p><h3>Step-by-step reasoning</h3><ol class=\"chem-steps\"><li>Sodium starts with electron configuration <strong>2,8,1</strong> (one valence electron).</li><li>Magnesium is <strong>2,8,2</strong>; chlorine is <strong>2,8,7</strong>; argon is <strong>2,8,8</strong>.</li><li>The shell count stays <strong>three</strong> across Period 3.</li><li>Metallic character tends to decrease and non-metallic character tends to increase.</li></ol><figure class=\"explanation-photo chemistry-visual\"><img src=\"images/q20-fm26.svg\" alt=\"Period 3 sodium magnesium aluminium silicon phosphorus sulfur chlorine argon increasing outer shell electrons\" loading=\"lazy\" decoding=\"async\"><figcaption>Original SVG teaching diagram created for this adapted practice quiz; not a reproduction of the Cambridge diagram.</figcaption></figure><h3>Check every answer</h3><ul class=\"option-explanations\"><li><strong>A.</strong> Metallic character falls rather than rises.</li><li><strong>B.</strong> The number of occupied shells stays constant within one period.</li><li><strong>C.</strong> Correct: valence electron count increases across the main-group sequence.</li><li><strong>D.</strong> The tendency to lose electrons and make positive ions generally decreases.</li></ul><p class=\"exam-tip\"><strong>Exam key idea:</strong> Period = number of occupied shells. For main-group elements, group position indicates outer electrons.</p>",
    "paperNumber": 20
  }
];
const questionStates = questions.map(() => ({ selected: null, checked: false }));
const chapterTag = document.querySelector('#chapter-tag');
const scoreSummary = document.querySelector('#score-summary');

function renderQuestionNavigator() {
  questionNavList.innerHTML = questions.map((q,i) => {
    const s=questionStates[i];
    const status=s.checked ? (s.selected===q.correct ? 'Correct':'Incorrect') : s.selected ? 'Selected':'Not started';
    const cls=s.checked ? (s.selected===q.correct?' is-correct':' is-wrong') : '';
    return `<button class="question-nav-item${cls}" type="button" data-question-index="${i}" aria-label="Question ${i+1}: ${status}" title="${q.chapter}: ${status}" ${i===currentQuestionIndex?'aria-current="step"':''}><span class="question-nav-number">${i+1}</span>${s.checked?`<span class="question-nav-status" aria-hidden="true">${s.selected===q.correct?'✓':'✕'}</span>`:''}</button>`;
  }).join('');
}
function score() {return questionStates.filter((s,i)=>s.checked&&s.selected===questions[i].correct).length;}
function showScore() {
  const completed=questionStates.filter(s=>s.checked).length;
  scoreSummary.hidden = completed!==questions.length;
  if (completed===questions.length) {
    scoreSummary.innerHTML=`<strong>Quiz complete! Score: ${score()} / ${questions.length}</strong><span> You can review any question using the navigator or restart the quiz.</span>`;
  }
}
function showQuestionFeedback(q,state) {
  const correct=state.selected===q.correct;
  const answerLine=correct?`Correct answer: ${q.answer}`:`Your answer: ${state.selected}. Correct answer: ${q.answer}`;
  feedback.className=`feedback visible ${correct?'correct':'incorrect'}`;
  feedback.innerHTML=`<div class="feedback-summary"><span class="feedback-result-icon" aria-hidden="true">${correct?'✓':'✕'}</span><div class="feedback-summary-copy"><strong class="feedback-title">${correct?'Correct!':'Incorrect'}</strong><p class="feedback-answer-line">${answerLine}</p></div></div>${q.explanation}`;
  selectionHint.className=`hint ${correct?'is-correct':'is-incorrect'}`;
  selectionHint.textContent=correct?'✓ Correct':'✕ Incorrect';
  answerOptions.querySelectorAll('.answer').forEach((label)=>{
    const radio=label.querySelector('input[name="answer"]');
    const status=label.querySelector('.answer-status');
    const isRight=radio.value===q.correct;
    const isWrong=radio.value===state.selected&&!isRight;
    label.classList.toggle('answer-correct',isRight);
    label.classList.toggle('answer-incorrect',isWrong);
    status.hidden=!isRight&&!isWrong;
    status.textContent=isRight?'✓ Correct answer':'✕ Your answer';
  });
  answerOptions.querySelectorAll('.paper-opt-row').forEach(row=>{
    const v=row.querySelector('input[name="answer"]').value;
    row.classList.toggle('answer-correct',v===q.correct);
    row.classList.toggle('answer-incorrect',v===state.selected&&v!==q.correct);
  });
}
function renderQuestion() {
  window.clearAnswerCue?.();
  answerAnnouncement.textContent='';
  const q=questions[currentQuestionIndex],s=questionStates[currentQuestionIndex];
  questionCount.textContent=`Question ${currentQuestionIndex+1} of ${questions.length}`;
  chapterTag.textContent=q.chapter;
  questionPaper.hidden=false;
  paperCode.textContent=`0620/22/F/M/26 · Q${currentQuestionIndex+1}`;
  paperCode.href='https://www.papersdaddy.com/cambridge/igcse/chemistry-0620/2026-march/0620_m26_qp_22.pdf';
  paperSession.textContent='Adapted question · 2026';
  progressTrack.setAttribute('aria-valuemax',questions.length);
  progressTrack.setAttribute('aria-valuenow',currentQuestionIndex+1);
  progressValue.style.width=`${100*(currentQuestionIndex+1)/questions.length}%`;
  questionTitle.textContent=q.title;
  questionContext.innerHTML=(q.questionVisual||'')+(q.context||'');
  questionLegend.textContent=q.legend;
  if(q.tableRows){
    const heads=q.tableHeaders.map(h=>`<th scope="col">${h}</th>`).join('');
    const rows=q.tableRows.map((cols,i)=>{
      const letter='ABCD'[i];
      return `<tr class="paper-opt-row" data-answer-choice="${letter}"><th scope="row"><label class="answer paper-table-choice"><input type="radio" name="answer" value="${letter}" ${s.selected===letter?'checked':''} aria-label="Select option ${letter}"><span class="letter" aria-hidden="true">${letter}</span><span class="answer-status" hidden></span></label></th>${cols.map(v=>`<td>${v}</td>`).join('')}</tr>`;
    }).join('');
    answerOptions.innerHTML=`<div class="paper-table-scroll"><table class="paper-answer-table"><thead><tr><th scope="col">Option</th>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`;
  } else {
    answerOptions.innerHTML=q.options.map((option,i)=>{
      const letter='ABCD'[i];
      return `<label class="answer"><input type="radio" name="answer" value="${letter}" ${s.selected===letter?'checked':''}><span class="letter" aria-hidden="true">${letter}</span><span class="answer-body"><span class="answer-text">${option}</span><span class="answer-status" hidden></span></span></label>`;
    }).join('');
  }
  checkButton.disabled=!s.selected||s.checked;
  selectionHint.className='hint';
  selectionHint.textContent=s.checked?'Answer checked':s.selected?'Ready to check':'Select an option to continue';
  if(s.checked)showQuestionFeedback(q,s); else {feedback.className='feedback';feedback.textContent='';}
  nextQuestionButton.hidden=!s.checked;
  nextQuestionButton.textContent=currentQuestionIndex===questions.length-1 ? (questionStates.every(s=>s.checked)?'Restart quiz':'Review unanswered') : 'Next question';
  renderQuestionNavigator();
  showScore();
}
function updateTextSize(){
 quiz.style.setProperty('--quiz-scale',textScale);
 textSizeValue.textContent=`${Math.round(textScale*100)}%`;
 decreaseTextButton.disabled=textScale<=0.8;
 increaseTextButton.disabled=textScale>=2;
}
decreaseTextButton.addEventListener('click',()=>{textScale=Math.max(0.8,Math.round((textScale-0.1)*10)/10);updateTextSize();});
increaseTextButton.addEventListener('click',()=>{textScale=Math.min(2,Math.round((textScale+0.1)*10)/10);updateTextSize();});
resetTextButton.addEventListener('click',()=>{textScale=defaultTextScale;updateTextSize();});
navigatorToggle.addEventListener('click',()=>{
  const expanded=navigatorToggle.getAttribute('aria-expanded')==='true';
  quizLayout.classList.toggle('navigator-hidden',expanded);
  navigatorToggle.setAttribute('aria-expanded',String(!expanded));
  navigatorToggle.setAttribute('aria-label',expanded?'Show questions':'Hide questions');
  navigatorToggle.title=expanded?'Show questions':'Hide questions';
});
questionNavList.addEventListener('click',e=>{
  const button=e.target.closest('[data-question-index]');if(!button)return;
  currentQuestionIndex=Number(button.dataset.questionIndex);renderQuestion();questionTitle.focus();
});
answerOptions.addEventListener('click',e=>{
  const row=e.target.closest('.paper-opt-row');
  if(!row || e.target.closest('label'))return;
  const radio=row.querySelector('input[name="answer"]');
  if(radio && !radio.checked){radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));}
});
form.addEventListener('change',e=>{
  if(!e.target.matches('input[name="answer"]'))return;
  window.clearAnswerCue?.();
  answerAnnouncement.textContent='';
  questionStates[currentQuestionIndex].selected=e.target.value;
  questionStates[currentQuestionIndex].checked=false;
  checkButton.disabled=false;
  selectionHint.className='hint';selectionHint.textContent='Ready to check';
  feedback.className='feedback';feedback.textContent='';nextQuestionButton.hidden=true;
  renderQuestionNavigator();showScore();
});
form.addEventListener('submit',e=>{
  e.preventDefault();
  const selected=form.querySelector('input[name="answer"]:checked')?.value;
  if(!selected)return;
  const s=questionStates[currentQuestionIndex],q=questions[currentQuestionIndex];
  if(s.checked)return;
  s.selected=selected;s.checked=true;showQuestionFeedback(q,s);
  const correct=selected===q.correct;
  answerAnnouncement.textContent=`${correct?'Correct.':'Incorrect.'} ${feedback.querySelector('.feedback-answer-line').textContent}`;
  window.showAnswerCue?.(correct);
  checkButton.disabled=true;nextQuestionButton.hidden=false;
  nextQuestionButton.textContent=currentQuestionIndex===questions.length-1 ? (questionStates.every(s=>s.checked)?'Restart quiz':'Review unanswered'):'Next question';
  renderQuestionNavigator();showScore();
});
nextQuestionButton.addEventListener('click',()=>{
 if(currentQuestionIndex===questions.length-1&&questionStates.every(s=>s.checked)){
  questionStates.forEach(s=>{s.selected=null;s.checked=false;});currentQuestionIndex=0;
 }else if(currentQuestionIndex===questions.length-1){
  currentQuestionIndex=questionStates.findIndex(s=>!s.checked);
 }else currentQuestionIndex++;
 renderQuestion();questionTitle.focus();
});
updateTextSize();renderQuestion();
