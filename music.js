//Helper functions for audio
//This code is sectioned off because it's practically minor but takes up a lot of lines
//that was distracting from the core game loop.

function getSongData() {
    let a = document.getElementById("gameMusic");
    return {
        rateHz: 44100,
        bitRateKbps: 256,
        audioElement: a,
        currentTimeMs: a.currentTime * 1000, //Variable
        durationMs: a.duration * 1000, //216372.219; Audacity agrees; ~3:36
        startMs: 323, //Measured with Audacity
        lastChordMs: 209791, //Measured with Audacity
        bpm: 109.992926, //(1 / chordLengthMs) * beatsPerMeasure * measuresPerChord * 1000
        beatsPerMeasure: 4, //"4/4" time
        measuresPerChord: 2,
        numChords: 48, //(lastChordMs - startMs) / chordLengthMs
        chordLengthMs: 4363.917, //(lastChordMs - startMs) / numChords
        loopGapMs: 6904.219, //durationMs - lastChordMs + startMs
        chordProgression: ["C", "G", "Am", "F"], //It's a "4 chord song"
        numChordProgressionLoops: 12, //numChords / chordProgression.length
        currentChord: function() {
            const cur = this.audioElement.currentTime * 1000;
            let ix = 0;
            if (cur > this.startMs && cur < this.lastChordMs)
                //this.startMs is more accurate, but in practice, it's good to register the 
                //next chord a hair early to allow time for tone to play after keypress,
                //hence the multiplication by zero part.
                ix = Math.floor((cur - this.startMs * 0) / this.chordLengthMs) % this.chordProgression.length;
            return this.chordProgression[ix];
        }
    };
}

function getChord(adjustForBrowser = true) {
    // Returns the current chord based on the elapsed time since music started.
    // The song is 3:36.372 long and there is a gap in the pattern when the song loops (the song hangs a bit at the end).
    const songData = getSongData();
        
    return songData.currentChord();
}

function playKeyboardPress(harmonic = 0) {
    //Manages the tone played.
    //Background music plays chord progression {C G Am F} roughly every 17.5 seconds
    //Tones below: first 3 are chord components, 4th is a low base note for Enter key
    const toneHz = {
        C:  [getNoteFreq("C", 4), getNoteFreq("E", 4), getNoteFreq("G", 4), getNoteFreq("C", 3)],
        G:  [getNoteFreq("G", 3), getNoteFreq("B", 3), getNoteFreq("D", 4), getNoteFreq("G", 2)],
        Am: [getNoteFreq("A", 3), getNoteFreq("C", 4), getNoteFreq("E", 4), getNoteFreq("A", 2)],
        F:  [getNoteFreq("F", 4), getNoteFreq("A", 4), getNoteFreq("C", 5), getNoteFreq("F", 3)]
    }
    if (harmonic < 0) harmonic = 0;
    if (harmonic > toneHz.C.length - 1) harmonic = toneHz.C.length - 1;
    let chordSymbol = getChord();
    let chord = toneHz[chordSymbol];
    let tone = chord[harmonic] || chord[0]; // Default to first tone if harmonic is out of bounds
    playKeyboardPressSound(tone);
}

function getNoteFreq(note, octave) {
    const A4_FREQUENCY = 440; // Frequency of A4 in Hertz
    const SEMITONES_IN_OCTAVE = 12;
  
    // Define the semitone offset for each note relative to C
    const noteSemitones = {
      "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
      "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
    };
  
    // Calculate the semitone difference from A4
    // A4 is the reference, so we calculate semitones relative to A4.
    // C4 is 3 semitones below A4, so C4 is at index -9 relative to A4 (where A4 is 0).
    // The base octave for the `noteSemitones` map is assumed to be C0 for simplicity in calculation,
    // so we adjust for the octave difference from A4.
    const semitonesFromA4 = (octave - 4) * SEMITONES_IN_OCTAVE + noteSemitones[note] - noteSemitones["A"];
  
    // Calculate the frequency using the formula: f = f0 * 2^(n/12)
    // where f0 is the reference frequency (A4_FREQUENCY), and n is the number of semitones from f0.
    const frequency = A4_FREQUENCY * Math.pow(2, semitonesFromA4 / SEMITONES_IN_OCTAVE);
  
    return frequency;
}

/**
 * Calculates a loudness compensation multiplier for a given frequency (Hz)
 * on a 12-semitone-per-octave musical scale, based on a lookup table derived from ISO 226:2003 principles.
 * The lookup table provides pre-determined SPL adjustments for specific musical note frequencies
 * to achieve a more balanced perceived loudness at a target phon level at 10 phon.
 *
 * @param {number} frequencyHz The input frequency in Hertz (Hz).
 * @returns {number} The loudness compensation multiplier.
 */
function getLoudnessMultiplier(frequencyHz) {
    const loudnessCompensationTable = {
        // Crude measurements from a graph in
        // https://cdn.standards.iteh.ai/samples/34222/d93363dbdafa470aab734f04d091065b/ISO-226-2003.pdf
        // Targeted 10 phon (quiet).
        // Keys are Hz, values are dB
        63: 49, // Quiet, needs boosting
        125: 34,
        250: 21,
        500: 13, // Loud, doesn't need boosting
        1000: 10 //Graph levels out here
    };

    // Extract frequencies and dB values from the table
    const frequencies = Object.keys(loudnessCompensationTable).map(Number).sort((a, b) => a - b);
    const dbValues = frequencies.map(freq => loudnessCompensationTable[freq]);

    // Handle frequencies outside the table range (extrapolation)
    if (frequencyHz < frequencies[0]) {
        // Extrapolate using the first two points
        const x1 = frequencies[0];
        const y1 = dbValues[0];
        const x2 = frequencies[1];
        const y2 = dbValues[1];
        const slope = (y2 - y1) / (x2 - x1);
        const dbAdjustment = y1 + slope * (frequencyHz - x1);
        return Math.pow(10, dbAdjustment / 20);
    } else if (frequencyHz > frequencies[frequencies.length - 1]) {
        // Extrapolate using the last two points
        const x1 = frequencies[frequencies.length - 2];
        const y1 = dbValues[dbValues.length - 2];
        const x2 = frequencies[frequencies.length - 1];
        const y2 = dbValues[dbValues.length - 1];
        const slope = (y2 - y1 / (x2 - x1));
        const dbAdjustment = y2 + slope * (frequencyHz - x2);
        return Math.pow(10, dbAdjustment / 20);
    }

    // Handle frequencies within the table range (interpolation)
    for (let i = 0; i < frequencies.length - 1; i++) {
        if (frequencyHz >= frequencies[i] && frequencyHz <= frequencies[i + 1]) {
            const x1 = frequencies[i];
            const y1 = dbValues[i];
            const x2 = frequencies[i + 1];
            const y2 = dbValues[i + 1];

            // Linear interpolation formula:
            const dbAdjustment = y1 + ((frequencyHz - x1) / (x2 - x1)) * (y2 - y1);
            return Math.pow(10, dbAdjustment / 20);
        }
    }

    // This case should ideally not be reached if the frequency is handled by extrapolation or interpolation
    console.warn(`Frequency ${frequencyHz} Hz could not be processed. Returning default multiplier.`);
    return 1;
}

function playKeyboardPressSound(toneHz) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const initVolume = 0.006; //Quiet
    let vol = initVolume * getLoudnessMultiplier(toneHz);
    
    // Setup oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(toneHz, audioCtx.currentTime);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  
    // Fade out after 1 second
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime); //Max vol at start
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); //0 vol after 1 sec
  
    // Start and stop
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
}