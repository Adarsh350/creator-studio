# Before/after of a client website

The piece Iyara Labs uses most: a client's old site, a reveal, the new site, a voiceover, one CTA. Built in HyperFrames, delivered as one MP4 per section 3 of SKILL.md. This file is the whole recipe; load `hyperframes`, `hyperframes-cli` and `hyperframes-registry` for the composition mechanics.

## 1. Inputs

Each side (old and new) arrives as one of three things. Mixed is fine (old as Wayback, new as a link).

| Source | What to do |
|---|---|
| Link | `node <skill-dir>/scripts/capture-site.mjs <url> <work-dir>/composition/assets/shots --name before\|after` |
| Old site that is already gone | Same command plus `--wayback YYYYMMDD` (the date before the relaunch). It picks the closest archived snapshot and prints its timestamp; say that date in the reply. |
| Screenshots | Copy (never move) to `assets/shots/before-*.png` / `after-*.png`. Follow brag step 1 "Source: screenshots" for reading, palette and stand-ins. |
| Screen recording | Copy to `assets/video/before.mp4` / `after.mp4`. Trim with ffmpeg; use it as the scroll beat instead of a pan. Strip its audio (`-an`). |

`capture-site.mjs` writes four PNGs per side: `<name>-desktop.png` (1440x900 viewport), `<name>-desktop-full.png` (the whole page at 1440 wide), `<name>-mobile.png` and `<name>-mobile-full.png` (390x844 at 2x, so 780 wide). It scrolls first so lazy images load, hides cookie and chat widgets, and flattens sticky headers so they don't repeat down the tall shot. Run `--self-test` after any edit to it.

**View every capture before planning.** Look for: a cookie wall or popup that survived, blank sections (animation never fired), personal data, and broken layout. Re-shoot or fall back to screenshots from the user rather than ship a broken frame.

**Wayback limits.** Archived pages render with scripts off (archived React and Next.js pages crash on hydration otherwise), so carousels show their first slide and anything drawn by JavaScript is missing. Archived webfonts often fail, so the old site can show in a system font. Both make the old site look worse than it was: if the client can supply real screenshots of the old site, prefer those, and never use a Wayback rendering glitch as a "before" problem.

## 2. Consent and claims (gate before any render)

- **Written client consent** to show both versions of their site and name them: per video, naming the placements (website, LinkedIn, ads) and a line saying they can withdraw it. No consent → blur the logo and name, and use no URL. Ask Adarsh if consent isn't stated.
- **Never disparage the old site, its builder or a competitor** (UAE Media Law 55/2023; fines AED 5,000 to 1,000,000). Labels are neutral: "Before" and "After", or the two years. No "outdated", "ugly", "broken".
- **Every on-screen claim must be visible in the captures or supplied by Adarsh.** Fine: "Services now on one page", "Mobile layout", "FAQ answers on the page". Not fine: rankings, traffic, leads or conversion numbers unless Adarsh supplies the measured figure and its source. Never cite page speed or load time.
- **Personal data** on either site (team photos with names, staff emails, phone numbers, customer reviews with names) gets a stand-in patch or a crop, per brag step 1. A business's own public phone and address may stay if the client consented.
- These are client showcase videos for Iyara's site and outreach. They are not LinkedIn page-calendar posts unless Adarsh adds them there himself.

## 3. Script

**Default: Adarsh's standard script, verbatim.** About 90 words, about 38s at Kokoro speed 1. Split into these `narration.json` lines (one clip each, so the VO lands on the beats below):

1. `This is an updated website that showcases the best of what website building looks like now.`
2. `This has all the key elements for your SEO, GEO, and everything in place.`
3. `This is the best way to build a strong foundation for you to rank on all AI assistants as well as on Google,`
4. `but also not just build a foundation.`
5. `When someone actually visits your website after seeing your name pop up on AI,`
6. `they'll really like the work that they see and are more likely to work with you.`

Line 2 needs the acronyms spelled for the voice: set its `text` to `This has all the key elements for your S. E. O., G. E. O., and everything in place.` and its `caption` to the line as written above. Unspelled, Kokoro reads GEO as the word "geo" (checked with whisper on `am_michael`). Keep every caption to two lines of at most 42 characters.

**Compliant variant (offer it; use it for paid ads in the UAE).** The standard script uses superlatives ("the best of", "the best way"), which UAE Media Law treats as claims needing proof, and says "SEO, GEO", which `iyara-voice` bans in prospect-facing copy. Same beats, same length:

1. `This is the new site, built the way websites are built now.`
2. `Every page is set up so Google and AI assistants can read it, understand it and name it.`
3. `That is the foundation for showing up when someone asks ChatGPT who to hire.`
4. `But showing up is only half of it.`
5. `When someone sees your name in an AI answer and clicks through,`
6. `this is what they land on. A site that makes them want to get in touch.`

Never mix the two. Any custom script goes through `iyara-voice`.

## 4. Beat sheet (default 48s)

`R` is the reveal time, default 8.0s. Everything else hangs off it.

| Time | Beat | Picture | Sound |
|---|---|---|---|
| 0 to 1.2s | Hook | The poster: old and new hero side by side (or a half-wiped split), "Before" and "After" chips, the client name if consented | Muffled bed starts |
| 1.2s to R | Old site | `before-desktop-full` in a browser frame, slow pan down (half speed: about 120px/s of source). One neutral fact card if it helps ("Nine menu items"). | Muffled bed, riser from R-3.6s, a short dip just before R |
| R to R+1.1s | Reveal | Wipe from old to new on the same framing. Same browser frame, same scroll position for the first frame | Whoosh at R-0.25s, bass hit at R, bed opens to full |
| R+0.8 to about 20s | New site, desktop | `after-desktop-full` pan, lines 1 and 2 | VO |
| about 20 to 32s | New site, phone | `after-mobile-full` in a phone frame, pan, lines 3 and 4 | VO |
| about 32 to 44s | Details | 2 or 3 push-ins on real sections of the new site (hero, services, FAQ) with 4 to 5 word cards, lines 5 and 6 | VO |
| 44 to 48s | CTA | Iyara Labs wordmark, `iyaralabs.com`, "Website for <Client>" if consented | Bed resolves, fades out over the last 2s |

Rules from the research:
- **Same subject, same angle.** Before and after use the same frame, the same viewport width and the same starting scroll position, so the eye sees only what changed. Before always sits on the left (split) or underneath (wipe).
- **The reveal lands on the beat**, never mid-sentence. The VO starts 0.5 to 1.0s after the hit, never before it.
- **Show the old site only for as long as it takes to register**: 5 to 8s. The new site gets the remaining 80%.
- **Text is short and held.** Cards of 4 or 5 words, in the upper third, held at least 1.5s. Captions burned in for vertical (most feeds play muted).
- **One CTA, one URL.**

Length scales: 30s cuts the details beat and lines 3 and 4 (use the variant's lines 1, 2, 5, 6); 60s adds a third push-in and a 4s split-screen hold before the CTA. Keep R between 5 and 8s.

## 5. Format and safe zones

Ask the format at intake. One MP4 per run; another format is a re-roll.

| Format | Size | Use | Layout |
|---|---|---|---|
| Vertical 9:16 (default) | 1080x1920 | Reels, Shorts, TikTok, Stories | Browser frame across the width, top third free for cards. Keep text out of the top 270px and the bottom 670px, and 65px in from each side. Captions in the centre third. |
| Feed 4:5 | 1080x1350 | LinkedIn and Instagram feed | Browser frame centred; cards above it. Keep everything inside the central 80%. |
| Landscape 16:9 | 1920x1080 | Iyara website, YouTube, decks | Browser frame left two-thirds, phone frame right, cards on the right. Title-safe 80%. |

30fps, H.264 `yuv420p`, AAC, 20 to 60s.

## 6. Composition

- **Frames:** `npx hyperframes add browser-device-stage --no-clipboard --json` gives a browser, window or phone chrome with screen slots and an address pill (`title` variable: put the client's domain there only with consent). Use the same chrome for before and after.
- **Pans:** a tall shot inside the frame's screen, animated with GSAP `y` from 0 to `-(shotHeight * scale - screenHeight)`, ease `none` or `power1.inOut`. Displayed width stays at or below 1.5x the shot's pixel width (the captures are 1440 and 780 wide, so any frame up to 1080 wide is fine). Stop the pan short of the footer unless the footer is the point.
- **Reveal (default):** a custom wipe in the composition. Stack the after layer over the before layer inside the same screen and animate `clip-path: inset(0 100% 0 0)` to `inset(0 0% 0 0)` over 1.0 to 1.1s, `power2.inOut`, starting at R minus the travel so it completes on R. A 4px light divider rides the edge. Animate `clip-path`, never `width` (width reflows the page).
- **Comparison hold (60s cut or a hook):** `npx hyperframes add before-after-wipe` with the two hero shots in the `before` and `after` slots, `rest_split` 50 for a split or 100 for a full reveal, `wipe_at` set so the wipe lands on a beat. It fires an `hf:sfx` event named `wipe-land-soft`; the bed below already carries the hit, so don't map that event to a second sound.
- **Other transitions** for variety between the after beats: `circle(0% at 50% 50%)` to `circle(150%)` iris, or a straight cut on a beat. Avoid frosted-glass and blur wipes (they smear the very detail being shown), and never transition between before and after with a crossfade (it reads as the same page).
- **Brand:** Iyara gold-authority tokens from `iyara-labs` `brand.md` for cards and the end card. The client's site carries its own look; don't recolour it.

## 7. Audio

One bed file carries the music, the muffle-to-open, the riser, the whoosh and the hit. Build it with ffmpeg before narrating, then let `narrate.mjs` duck it under the VO.

1. **Pick the track and line up the reveal.** Read `~/.claude/skills/brag/assets/music/cues/<track>.music-cues.md`, take a "Reveal Candidate" `C`, and start the track at `S = C - R` so that hit lands on the reveal. Example: vol-1, C = 17.02, R = 8 → S = 9.02.
2. **Build the bed** (bash; `M` = track, `X` = `~/.claude/skills/media-use/audio/assets/sfx`, `D` = duration):

```bash
calc() { awk "BEGIN{print $1}"; }   # Git Bash has no bc
OPEN=$(calc "$R-2"); END=$(calc "$D-2"); RIS=$(calc "int(($R-3.6)*1000)"); WH=$(calc "int(($R-0.25)*1000)"); HIT=$(calc "int($R*1000)")
ffmpeg -y -ss $S -t $D -i "$M" -i $X/riser.mp3 -i $X/whoosh.mp3 -i $X/impact-bass-1.mp3 -filter_complex "
[0]asplit[a][b];
[a]lowpass=f=750,afade=t=out:st=$OPEN:d=2[lo];
[b]afade=t=in:st=$OPEN:d=2[hi];
[lo][hi]amix=inputs=2:normalize=0,volume=0.2:enable='between(t,$R-0.4,$R)',afade=t=out:st=$END:d=2[mus];
[1]adelay=$RIS:all=1,volume=0.7[ris];
[2]adelay=$WH:all=1[wh];
[3]adelay=$HIT:all=1,volume=0.9[imp];
[mus][ris][wh][imp]amix=inputs=4:normalize=0:duration=first[out]" \
  -map "[out]" -ar 48000 <work-dir>/composition/assets/music/bed.wav
```

   The old site plays under a 750Hz low-pass that opens over the 2s before the reveal, so the music itself "upgrades". The riser peaks about 3.6s into its file, so it starts at R-3.6. The 0.4s dip before R makes the hit land. Measured on vol-1 from 9.02s: the muffled section sits about 2 LU under the open section, which is the intended lift.
3. **Narrate** with `narration.json` pointing at the bed: `"music": "assets/music/bed.wav", "musicStart": 0, "musicVolume": 0.36`, voice `am_michael` (calm) unless asked otherwise, first line `at` R+0.8. Then run `narrate.mjs` per SKILL.md. It ducks the bed under each line and flags overlaps or a VO that runs past the end; fix timing, never speed the voice past 1.1.
4. **Master** in the poster bake (brag step 4): loudnorm `I=-15:TP=-2.5:LRA=11`, so the delivered file lands near -14 LUFS with true peak under -1 dBTP.

## 8. Check before delivering

- `npx hyperframes check` passes; `snapshot --describe false` at 0.5s, R-1, R+0.5, the middle of each beat and the CTA. View them.
- The reveal frame shows old and new at the same framing; no blank sections or cookie banners; no personal data; every card's claim is visible in the captures.
- Captions stay inside the safe zone for the format; nothing important under the platform UI zones.
- Listen at the reveal: hit on the wipe, VO starts after it, music audible but under the voice.
- Deliver one MP4 per SKILL.md section 3. In the reply: the share caption, the Wayback date if used, which script ran, and the consent status as stated by Adarsh.
