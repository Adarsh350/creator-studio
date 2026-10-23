# Narration (Kokoro, timed per line)

The voice is the clock: every line is its own WAV, placed at the moment its scene's key visual lands. One long WAV can't stay in sync with the picture, so don't generate one. Narration is on only when the intake said "Narrated" (or a voice id).

1. Write `<work-dir>/narration.json` next to `composition/` (paths inside are relative to `composition/`):

   ```json
   {
     "voice": "am_michael", "speed": 1, "lang": "en-us", "duration": 45,
     "music": "assets/music/bed.wav", "musicVolume": 0.36,
     "lines": [
       { "id": "hook", "at": 0.35, "text": "One question. One short list of names." },
       { "id": "fix", "at": 9.95, "text": "So Ee-yah-ra fixes what AI reads about the clinic.",
         "caption": "So Iyara fixes what AI reads about the clinic." }
     ]
   }
   ```

2. Generate and time the lines (local Kokoro, free, about 8s per line; unchanged lines are cached):

   ```bash
   node <skill-dir>/scripts/narrate.mjs <work-dir>/narration.json
   ```

   It writes `composition/assets/vo/<id>.wav`, `narration-timing.json` and `brag.srt` (the captions, whatever the engine), then prints the `<audio>` tags and a `data-automation` ducking lane for the music. It exits 1 when a line overlaps the next one or runs into the last 0.6s. Fix that by moving `at`, cutting words, or raising `speed` (1.1 at most), then re-run. Don't stretch the video past the length agreed at intake.

3. Paste the `<audio>` tags into the composition as printed. They all share track 60, clear of music and SFX. On the music element, replace `data-volume` with the printed `data-automation` lane. The lane is absolute volume: the bed plays at `musicVolume` and dips about 10 LU under the voice while a line plays (around 0.13 in practice). Keep `data-fade-in` and `data-fade-out`.

4. Re-time the picture to the voice, not the voice to the picture. If a line's key word lands after its visual, move the visual (or the line's `at`) so they coincide.

## Pronunciation

- Kokoro guesses brand names. Respell them phonetically in `text` ("Ee-yah-ra" for Iyara, "dot com" for ".com") and put the real spelling in `caption`, which the SRT uses.
- No acronyms in `text`. Kokoro reads "FAQ" as "fact", and the spelled "F.A.Q." still sounds wrong to a listener. Say the words instead ("a page, an answer, a source") and keep the acronym in `caption` only. "A. I." is the one spelling that reads fine.
- Tell the user which names were respelled and what to check by ear: you can measure the audio but not hear it.

## Writing the lines

Narration says what the picture can't: why this moment matters and what changed. It never reads the on-screen text aloud word for word, except for one deliberate landing such as the product name. Short declarative sentences. Present tense. Product-specific nouns over adjectives. The copy owner's voice rules (for example `iyara-voice`) apply to narration exactly as they apply to on-screen copy.
