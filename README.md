# Multivaders!

This is a quick little game to help students memorize multiplication facts, like `3 × 2 = 6`.  Multiplication problems (called "vaders" in code, like little space invaders) float down the screen. 

## Title Screen

On the title screen, players can select what individual problems they want to work on or they can choose five presets.

## Basic rules and Gameplay

The player must solve the problems by typing in the correct answer. Solving a problem makes the problem vanish and the player is onto another problem. As the problems approach the bottom of the screen, the screen starts to turn red. If a problem hits the bottom of the screen, the game is over. If the player enters the wrong answer, the speed of the problem is doubled (cumulative), making it rush toward the bottom of the screen. Spacebar pauses the game. Escape ends the game. Backspace erases what was written.

## Play it now!

This is a browser-based game. You can play it here:
https://esegerson.github.io/Multivaders/

## Technicals

### Music

A song is played while playing. Tones are played when the player types a number. There is some code to play a tone that harmonizes with the song, but it's a little off and needs work.

### Difficulty Progression

I want the game to get harder as the player progresses, to keep it "fun" and to try to achieve a higher score.  There are two ways to make the game harder over time:  how often a new problem appears (delay) and how fast the problem drops down the screen (speed). The current iteration is okay but may need tweaking.  My goal is to make a score of 100 fairly difficult with a game-over soon after that. In the future, I'd like to build in a mechanism that will grant the player occasional reprieves. Maybe a periodic explosive problem that destroys all the problems around it.

The game is built entirely in HTML, JavaScript, and CSS.

## TODO / Wishlist

- Maybe more presets on the title screen
- Add a laser and turret to blast problems
- More visual effects/decorations, such as clouds, or subtle "dancing" multiplication signs floating upward (instead of the one that's fixed in the middle)
- Add a progressive saw-like difficulty ladder
- Remove the stats in the bottom-left when fine-tuning is complete
- Improve the inevitable game-over experience; the game-over screen is basic, and currently the problems on-screen turn black when I feel like they should continue to bombard the bottom of the screen for 5 seconds
- Use local storage so players can make their own presets
- Use local storage to save high scores (with old-school initials?)

## Known Bugs

- Problems continue to wiggle when the game is paused and the music continues to play
- Test on mobile

## Assets

One asset is used, a royalty-free MP3 file ["Calm Soft Background Music"](https://pixabay.com/music/upbeat-calm-soft-background-music-357212/) by [original_soundtrack](https://pixabay.com/users/original_soundtrack-50153119/), found on [Pixabay.com](https://pixabay.com). Direct download of file is [here](https://cdn.pixabay.com/download/audio/2025/06/09/audio_2feeb02bcd.mp3?filename=calm-soft-background-music-357212.mp3).

All other files were hand-written by myself.
