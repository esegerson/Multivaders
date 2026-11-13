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
        bpm: 109.992926, //beatsPerMeasure * measuresPerChord * 1000 * 60 / chordLengthMs
        beatsPerMeasure: 4, //"4/4" time
        measuresPerChord: 2,
        numChords: 48, //(lastChordMs - startMs) / chordLengthMs
        chordLengthMs: 4363.917, //(lastChordMs - startMs) / numChords
        loopGapMs: 6904.219, //durationMs - lastChordMs + startMs
        chordProgression: ["C", "G", "Am", "F"], //It's a "4 chord song"
        numChordProgressionLoops: 12, //numChords / chordProgression.length
        currentChord: function() {
            //Returns the current chord based on the elapsed time since music started.
            let ix = 0; //Root song chord
            if (this.currentTimeMs > this.startMs && this.currentTimeMs < this.lastChordMs)
                //this.startMs is more accurate, but in practice, it's good to register the 
                //next chord a hair early to allow time for tone to play after keypress,
                //hence the multiplication by zero part.
                ix = Math.floor((this.currentTimeMs - this.startMs * 0) / this.chordLengthMs) 
                    % this.chordProgression.length;
            return this.chordProgression[ix];
        }
    };
}

function getChord() {
    const songData = getSongData();
    return songData.currentChord();
}

const playSound = {
    //------------------------
    //Private helper functions
    //------------------------

    /**
     * Calculates a loudness compensation multiplier for a given frequency (Hz)
     * on a 12-semitone-per-octave musical scale, based on a lookup table derived from ISO 226:2003 principles.
     * The lookup table provides pre-determined SPL adjustments for specific musical note frequencies
     * to achieve a more balanced perceived loudness at a target phon level of 10 phon.
     *
     * @param {number} frequencyHz The input frequency in Hertz (Hz).
     * @returns {number} The loudness compensation multiplier.
     */
    _getLoudnessMultiplier(frequencyHz) {
        const loudnessCompensationTable = {
            //https://cdn.standards.iteh.ai/samples/34222/d93363dbdafa470aab734f04d091065b/ISO-226-2003.pdf
            //Targeted 10 phon (quiet). Only need Hz from 63 (C2) to 1000 (C6).
            //Keys are Hz, values are dB
            63:   49.0, //Quiet, needs boosting
            125:  33.5,
            250:  21.5,
            316:  18.0,
            398:  15.5,
            500:  13.0, //Loud, doesn't need boosting
            630:  11.5,
            794:  10.0, //Graph levels out here
            1000: 10.0
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
    },

    _getNoteFreq(note, octave) {
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
    },

    _playTone(toneHz) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const initVolume = 0.006; //Quiet
        let vol = initVolume * this._getLoudnessMultiplier(toneHz);
        
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
    },

    //--------------
    //Public methods
    //--------------

    //Plays a single mellow tone that matches the song at that moment.
    //harmonic: 0, 1, 2, or 3
    typeTone(harmonic = 0) {
        //Manages the tone played.
        //Background music plays chord progression {C G Am F} roughly every 17.5 seconds
        //Tones below: first 3 are chord triad, 4th is a low bass root for Enter key
        const getNoteFreq = this._getNoteFreq.bind(this);
        const toneHz = {
            C:  [getNoteFreq("C", 4), getNoteFreq("E", 4), getNoteFreq("G", 4), getNoteFreq("C", 3)],
            G:  [getNoteFreq("G", 3), getNoteFreq("B", 3), getNoteFreq("D", 4), getNoteFreq("G", 2)],
            Am: [getNoteFreq("A", 3), getNoteFreq("C", 4), getNoteFreq("E", 4), getNoteFreq("A", 2)],
            F:  [getNoteFreq("F", 4), getNoteFreq("A", 3), getNoteFreq("C", 4), getNoteFreq("F", 3)]
        }
        if (harmonic < 0) harmonic = 0;
        if (harmonic > toneHz.C.length - 1) harmonic = toneHz.C.length - 1;
        let chordSymbol = getChord();
        let chord = toneHz[chordSymbol];
        let tone = chord[harmonic] || chord[0]; //Default to first tone if harmonic is out of bounds
        this._playTone(tone);
    },

    //Play the bass tone of the chord
    bassTone() {
        this.typeTone(3); //3 is the bass harmonic
    },

    //Plays a single mellow tone that matches the song at that moment
    randomTypeTone() {
        this.typeTone(Math.floor(Math.random() * 3));
    },

    //The clear-screen sound, three-note arpeggio
    chime() {
        const getNoteFreq = this._getNoteFreq.bind(this); //Need this for technical reason
        const getLoudnessMultiplier = this._getLoudnessMultiplier.bind(this);
        const helper = function(chord) {
            const toneHz = { //Inverted triads with root on top
                C:  [getNoteFreq("E", 4), getNoteFreq("G", 4), getNoteFreq("C", 5)],
                G:  [getNoteFreq("B", 3), getNoteFreq("D", 4), getNoteFreq("G", 4)],
                Am: [getNoteFreq("C", 4), getNoteFreq("E", 4), getNoteFreq("A", 4)],
                F:  [getNoteFreq("A", 3), getNoteFreq("C", 4), getNoteFreq("F", 4)]
            };

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioCtx.createGain();
            const initVolume = 0.006;
            const chimeDuration = 2; // Chime fades out over 2 seconds
            const strumDelayMs = 80; // Delay between notes for strum effect

            const chordNotes = toneHz[chord];

            chordNotes.forEach((freq, index) => {
                setTimeout(() => {
                const vol = initVolume * getLoudnessMultiplier(freq);
            
                const oscillator = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                // Set oscillator properties
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

                // Set gain properties
                gain.gain.setValueAtTime(vol, audioCtx.currentTime); // Slightly quieter for lower notes
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + chimeDuration);

                // Connect and play
                oscillator.connect(gain);
                gain.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + chimeDuration);
                }, index * strumDelayMs);
            });
        }

        const chord = getChord();
        helper(chord);
    },

    //Correct answer laser zap
    zap() {
        //Do nothing for right now; not sure I like the sound
        return;

        const ctx = audioCtx; //Global
        const now = ctx.currentTime;
        const duration = 0.7;
        const combSweep = 500000;
        const toneHz = { //Power chords
            C:  [this._getNoteFreq("C", 6), this._getNoteFreq("G", 6), this._getNoteFreq("C", 7)],
            G:  [this._getNoteFreq("G", 5), this._getNoteFreq("D", 6), this._getNoteFreq("G", 6)],
            Am: [this._getNoteFreq("A", 5), this._getNoteFreq("E", 6), this._getNoteFreq("A", 6)],
            F:  [this._getNoteFreq("F", 5), this._getNoteFreq("C", 6), this._getNoteFreq("F", 6)]
        };
        const tones = toneHz[getSongData().currentChord()]; //Dynamic based on song

        function addVoice(startFreq, volume) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";

            osc.frequency.setValueAtTime(
                startFreq,
                now
            );

            osc.frequency.exponentialRampToValueAtTime(
                startFreq / 16,
                now + duration
            );

            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + duration
            );

            osc.connect(gain);
            gain.connect(amp);

            osc.start(now);
            osc.stop(now + duration);
        }

        function addCrackle() {
            const crackleDuration = 0.8;
            const samples = Math.floor(ctx.sampleRate * crackleDuration);
            const buffer =
                ctx.createBuffer(
                    1,
                    samples,
                    ctx.sampleRate
                );
            const data = buffer.getChannelData(0);

            // Generate individual spark bursts
            for (let burst = 0; burst < 12; burst++) {
                const start = Math.floor(Math.random() * samples);
                const length = 500 + Math.floor(Math.random() * 3000);
                const volume = 0.1 + Math.random() * 0.5;
                let filtered = 0;
                for (let i = 0; i < length && start + i < samples; i++) {
                    const env = Math.exp(-i / (length * 0.25));
                    const white = (Math.random() * 2 - 1) * volume * env;

                    // Slight smoothing gives each burst some width and texture.
                    filtered = filtered * 0.8 + white * 0.2;

                    data[start + i] += filtered;
                }
            }

            const src = ctx.createBufferSource();
            src.buffer = buffer;

            // Remove the harsh digital edge.
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.value = 5000;

            // Give it a bit of "body".
            const lowshelf = ctx.createBiquadFilter();

            lowshelf.type = "lowshelf";
            lowshelf.frequency.value = 250;
            lowshelf.gain.value = 5;

            const gain = ctx.createGain();
            gain.gain.value = 0.32;

            src.connect(lowpass);
            lowpass.connect(lowshelf);
            lowshelf.connect(gain);
            gain.connect(ctx.destination);

            // Begin just after the zap.
            src.start(now + duration);
        }

        //Noise source
        const samples = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < samples; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const delay = ctx.createDelay(0.05);
        const dry = ctx.createGain();
        const wet = ctx.createGain();

        dry.gain.value = 0.1; //Quieter noise
        wet.gain.value = -0.1; //Quieter noise

        src.connect(dry);
        src.connect(delay);
        delay.connect(wet);

        //Master output
        const amp = ctx.createGain();
        dry.connect(amp);
        wet.connect(amp);
        amp.connect(ctx.destination);
        amp.gain.setValueAtTime(1, now);
        amp.gain.exponentialRampToValueAtTime(0.001, now + duration);

        //Composite voices and crackle
        addVoice(tones[0], 0.06);
        addVoice(tones[1], 0.05);
        addVoice(tones[2], 0.04);
        addCrackle();

        //Start playback
        src.start(now);
        const start = performance.now();

        function update() {
            const t = performance.now() - start;
            const ms = Math.max(t, 10);
            delay.delayTime.value = Math.min(ms / combSweep, 0.05);
            if (t < duration * 1000) requestAnimationFrame(update);
        }

        update();
    },

    //Boom for multishot
    boom() {
        console.log("BOOM! Not implemented.");
        this.zap(); //Placeholder
    },
    
    //Wrong answer buzz
    buzz() {
        console.log("BUZZ! Not implemented.");
    },

    //Backspace erase click
    click() {
        console.log("CLICK! Not implemented.");
    },

    //Multishot earned
    powerup() {
        console.log("POWERUP! Not implemented.");
    },

    //Game over explosion or groan of doom
    gameOver() {
        console.log("Game Over Sound not implemented.");
    },

    toneTest() {
        //All tones should have the same loudness.  See loudnessCompensationTable above.
        const playTone = this._playTone.bind(this);
        const getLoudnessMultiplier = this._getLoudnessMultiplier.bind(this);
        let i = 0;
        for (let h = 60; h < 1000; h+=40) {
            setTimeout(function() {
                playTone(h);
                console.log(h.toFixed(0) + " : " + getLoudnessMultiplier(h).toFixed(3))
            }, i * 500);
            i++;
        }
    }
}