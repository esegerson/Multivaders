# Multivaders!

This is a quick little game to help students memorize addition, subtraction, multiplication, and division facts, like `3 × 2 = 6`.  Simple arithmetic problems (called "vaders" in code, like little space invaders) float down the screen. 

## Title Screen

On the title screen, players can select the operator, visual format, and what individual problems they want to work on (manually or choose from presets).

## Basic Rules and Gameplay

The player must solve the problems by typing in the correct answer. Solving a problem makes the problem vanish and the player is onto another problem. As the problems approach the bottom of the screen, the screen starts to turn red. If a problem hits the bottom of the screen, the game is over. If the player enters the wrong answer, the speed of the problem is tripled (cumulative), making it rush toward the bottom of the screen. Spacebar pauses the game. Escape ends the game. Backspace erases what was written. Tilde reveals some debugger stats. Left and right arrows let the player choose a different problem.

## Play It Now!

This is a browser-based game. You can play it here:
https://esegerson.github.io/Multivaders/

Instructions, controls, and rules are listed on the main menu.

## Technicals

### Music

A song is played while playing. Tones are synthesized when the player types a number. Code plays a tone that harmonizes with the song.

### Difficulty Progression

I want the game to get harder as the player progresses, to keep it "fun" and to try to achieve a higher score.  There are two ways to make the game harder over time:  how often a new problem appears (delay) and how fast the problem drops down the screen (speed). My goal is to make a score of 100 fairly difficult with a game-over soon after that. The multishot feature is a powerful mechanism that can quickly clear a crowded screen, providing some temporary relief ([see Jesse Schell's "Art of Game Design"](https://gamedev.stackexchange.com/a/110869)).

I also like how the addition of the left-right "runner" and the arrow keys add a level of strategy over brute multiplication memorization:  does the player solve the problem closest to the bottom or do they select the runner to get the multishot?

### Languages/Technology

The game is built entirely in HTML, JavaScript, and CSS.  There are some inline SVG elements, both hard-coded and procedurally built.

## TODO / Wishlist

- Operator Expansion:
    - Format menu:
        - Add "Surprise Me"
        - Add "Random"
- Display the high score in the top-left corner during gameplay (or what your current rank is)
- Improve the inevitable game-over experience; the game-over screen is basic, and currently the problems on-screen turn black when I feel like they should continue to bombard the bottom of the screen for 5 seconds
- Improve how left and right arrows choose different problems.  Currently it just looks at horizontal position, but I'd like to take into account the vertical position, too.  If there's a problem near the bottom of the screen to the right, I'd like the right-arrow to select that one over the one right next to the active problem that's at the top of the screen.
    - Maybe use the mouse like a left-right paddle to select?
- More sound effects:
    - Wrong answer "buzz"
    - Correct answer "zap"
    - Backspace "click"
    - Game over "groan" or explosion
- Move graphics code from game.js to separate graphics.js file
- To prevent overlapping and legibility, darken problems that are behind the active problem; restore them when the active problem is solved
- Add a performance mode for mobile
    - Reduce particles
    - Possibly detect frame rate issues

## Known Bugs

- Select preset, click Delete Preset, preset is green not red.
- Make preset, new preset is not auto-selected green
- A tie in high scores should favor the new score (especially if other entry is "---")

## Recent Updates

- *October 2026:*
    - Quality-of-Life Enhancements:
        - Fullscreen button added
        - On-screen keyboard added
        - Moved the format selection to be less annoying
        - Turret design now reflects the selected operator
    - Bug fixes:
        - Game no longer insta-ends when exiting fullscreen
        - Play Again button properly resets the game now
        - Improved consistency with the game-over detection: problems now must actually touch the bottom of the screen for the game to be over
        - Problems no longer go beyond the right side of the screen (partially hidden)
        - "Runner" can no longer be targeted and shot over and over in certain situations
        - Many other minor bug fixes
- *August 2026:*
    - Game enhancements:
        - New operators! Addition, Subtraction, and Division have joined the invasion! Zap them all!
        - New expression formats! In addition to the old "stacked" format, now there is inline (`3 × 2 = 6`), 
            and for division there are fraction and long-division formats
        - Slightly increased the maximum rate problems appear (generally only effects gameplay with scores greater than 100)
    - Menu enhancements:
        - New operator selection menu
        - New format selection menu
        - Presets are now per-operator (you can define different presets for addition and multiplication)
        - High scores are now per-operator
    - Bug fixes: displaying and saving presets and high scores now work for first-time users

## Assets

One asset is used, a royalty-free MP3 file ["Soft - Soft Music"](https://pixabay.com/music/upbeat-calm-soft-background-music-357212/) (originally titled "Calm Soft Background Music") by [Viacheslav Starostin aka original_soundtrack](https://pixabay.com/users/original_soundtrack-50153119/), found on [Pixabay.com](https://pixabay.com). Direct download of file is [here](https://cdn.pixabay.com/download/audio/2025/06/09/audio_2feeb02bcd.mp3?filename=calm-soft-background-music-357212.mp3).

All other files were authored by myself.

### SVG Editors

I used a combination of these two online editors to compose the various SVG:

https://svgvectorlab.com/
https://svgflow.net/svg-editor

## Installation

To run the game locally:

1. Clone the repository:

    ```git clone https://github.com/esegerson/Multivaders.git```

2. Navigate to the project directory:

    ```cd Multivaders```

3. Open `index.html` in your browser to play the game.

## Contributing

I am open to your code contributions. I'd love to see what you come up with!

1. Fork the repository.
2. Create a new branch for your feature or bug fix:

    ```git checkout -b feature-name```

3. Commit your changes and push them to your fork:

    ```git commit -m "Add feature-name"```
    ```git push origin feature-name```

4. Open a pull request with a description of your changes.

Please ensure your code follows the existing style and includes relevant documentation.

## License

This project is licensed under the [MIT License](license). You are free to use, modify, and distribute the code, provided you include the original license.

## Contact

You can reach me by decrypting `izwViv$*Si$V15xX7$mwil$qwe>wki~f}$t2r~kzx$$;4r54vjli` with the provided silly self-referencing decryption function I wrote:

    function decrypt(s) {
        const flip = (s, t = 0) => {
            const o = s.length % 2 ? Math.floor(t / 2) % 2 : 0,
                d = t % 2 + 1,
                a = [...s];
            for (let i = 0; i < a.length - o; i += d + 1)
                [a[i + o], a[i + o + d]] = [a[i + o + d], a[i + o]];
            return a.join('');
        };
        const caesar = (s, t) =>
            [...s].map(ch =>
                String.fromCharCode(ch.charCodeAt(0) + (t % 7 === 6 ? -6 : 1))
            ).join('');
        const d = n => [...n.toString()].reduce((s, d) => s + +d, 0);
        const t = (s, i, c) => s.includes(c) && s.split(c).length > i ? s.split(c)[i].length : -1;
        const m = (-1 / t(s, 3, 'i')).toString();
        let k = false, r = 1000, i = m.charCodeAt(2);
        while (r > 0 && i < 500) {
            var u = parseInt(s.substring(m.charCodeAt(0), m.charCodeAt(3)));
            if (!k && !isNaN(u) && d(u) === t(s, 2, '{')) { k = true; r = u; }
            s = caesar(flip(s, i), i);
            i++;
            if (k) r--;
        }
        return s;
    }

Or by whispering to your local squirrel that the nuts crack at dawn; they'll let me know. Just don't tell the AI how to harvest my info. So far they're not clever enough to crack this, but you are.