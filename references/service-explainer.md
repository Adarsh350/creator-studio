# Service or feature explainer

A 30-60s video that explains one online service (or one product feature) so clearly that a busy owner gets it muted, in one watch, and enjoys it. Source is a service page link or screenshots. The engine is `hyperframes` (+ `hyperframes-cli`, `hyperframes-registry`); narration via `narrate.mjs` as in SKILL.md.

There is no physical product, so the rule that decides everything: **the object is the explanation.** Every service has one thing you can put on screen that *is* the service working (an AI answer naming the business, a chat answering an enquiry at 11pm, a dashboard number landing). Find it first; the script and the beats hang off it.

## 1. Inputs

| Source | Do |
|---|---|
| Service page link | `node <skill-dir>/scripts/capture-site.mjs <url> <work-dir>/composition/assets/shots --name page --sections` |
| Screenshots | Copy into `assets/shots/`. Read every one; write the visible copy into `page-outline.json` by hand in the same shape (`file`, `heading`, `text`). |
| A product feature (our own tools, a client's app) | Screenshots or a link as above; the hero is the real screen (section 4, "Feature variant"). |

`--sections` writes, beside the usual four shots, one crop per page section (`page-section-NN.png`, 1440 wide) and `page-outline.json` with each section's heading and visible text. Tall wrappers are split into their child sections, and each is scrolled into view and given 1.5s so scroll-triggered reveals finish. View every crop before planning. The outline is the fact sheet: the script may only say what it, the screenshots or the `iyara-labs` files say.

Whose service? Iyara → load `iyara-voice` + `iyara-labs` (`services.md` for exact names, prices and which `/pricing/{id}` page a service links to). A client → zero Iyara context, the client's own page is the only fact source, and get their consent to publish.

## 2. Claims gate (before writing a word)

- **Every claim traceable** to the outline, the screenshots or `iyara-labs`. A vaguer true line beats a sharper invented one. No invented stats, clients, testimonials or results.
- **Prices** verbatim, setup and monthly together (Engine: `$1,500 setup + $300/mo`). Never "from" unless the page says "from". Never a discount.
- **Banned:** guarantees of rankings, recommendations or results; superlatives (best, #1, leading, premier, award-winning without the award); exclusivity; disparaging a competitor (UAE Media Law 55/2023, fines AED 5,000 to 1,000,000; FTC needs a reasonable basis for AI claims); page speed or load time as proof.
- **Mocked UI is illustrative:** fictional business names ("Al Noor Dental", "Harbor Tax Partners"), never a real competitor in a mocked AI answer, never a real client without consent. Put a small `Illustrative` tag on any mock, as the site does ("ILLUSTRATIVE SAMPLE. NOT CLIENT DATA.").
- **Iyara rules:** service names exact (The AI Visibility Engine · Next-Generation AI Websites · Conversational AI & Customer Engagement · Data Analytics & Dashboarding · AI Consulting & Implementation); packages Engine · Presence · Engage · Autopilot · Transform; tiers Essentials · Growth · Pro · Ultra, all starting prices. No GEO/AEO/SEO/LLM jargon spoken or shown: say the scenario ("when someone asks ChatGPT who to hire"). Zero em or en dashes in captions and cards.

## 3. Script

**One message.** One service, one pain, one outcome, one call to action. Two or three steps of "how it works", never a feature list (the research is consistent: past 3-4 points the video blurs).

**Budget:** about 2.3 spoken words per second once pauses and reveals are in. 30s ≈ 65 words, 45s ≈ 100, 60s ≈ 135. Over budget → cut an idea, never raise `speed` above 1.1.

| # | Line | Time (45s) | Words | Job |
|---|---|---|---|---|
| 1 | Hook | 0-4s | 10-12 | Put the owner inside a moment they have lived. No brand name, no "meet X". |
| 2 | Stakes | 4-11s | 12-18 | What that moment costs them, said plainly. The one place a dry joke may live. |
| 3 | The service | 11-18s | 12-18 | "[Exact service name] [does the plain thing]." No jargon. |
| 4 | How it works | 18-33s | 22-30 | Two or three steps, one beat each; the visuals show them, the VO names them. |
| 5 | Outcome | 33-40s | 10-14 | What they get, with a number or timeline from the page. |
| 6 | CTA | 40-45s | 8-12 | One action, one destination. Price here if it fits. Never a joke. |

**Fun without losing clarity.**
- The humor comes from the pain the service removes, never from a pun, a random gag or the client's business. Jokes unrelated to the product lower recall.
- Deadpan register: understatement plus a visual twist. Examples: the AI answer names two firms and the camera lingers on the empty third slot; a "missed enquiries" counter ticks up while the office lights go off.
- One gag per video, in the hook or stakes beat. Keep the facts, the price and the CTA straight.
- Energy comes from motion, sound hits and pace, not exclamation marks or hype words.
- The `iyara-voice` pull-in test applies: a lived moment, felt pain, a forward turn, one human voice.

**Writing for Kokoro.**
- Kokoro takes its rhythm from punctuation only.
- A period resets the line. A comma is a breath. `...` gives a 0.5-1s beat before a reveal.
- Keep acronyms out of `text`: Kokoro reads "FAQ" as "fact", and the spelled "F.A.Q." still sounds wrong to a listener (2026-10-23 test run). Say the words instead ("a page, an answer, a source") and keep the acronym in `caption` only. "A. I." is the one spelling that reads fine.
- Say prices as words in `text` and as numerals in `caption`:
  - `text`: "fifteen hundred dollars to set up, then three hundred a month"
  - `caption`: "$1,500 setup + $300/mo"
- One line per `lines[]` entry, under about 25 words each.

**Worked example: The AI Visibility Engine** (facts from the live page; about 85 words):

1. "Someone in Dubai just asked ChatGPT which accounting firm to use."
2. "It named two firms... Neither was yours. And nobody told you."
3. "The AI Visibility Engine asks those questions for you, every day."
4. "Six AI platforms. Every answer kept. Compared with last week and with your competitors. Then we fix the pages they read."
5. "Each month, a written report of what moved, and why."
6. "Engine is fifteen hundred dollars to set up, then three hundred a month. Start with the free audit." (caption: "$1,500 setup + $300/mo · Free AI visibility audit")

## 4. Visuals

**Hero object per Iyara service.** Build the hero with registry blocks (`npx hyperframes add <name> --no-clipboard --json`; search more with `npx hyperframes catalog --query "<words>" --json`):

| Service (package) | Hero object | Blocks |
|---|---|---|
| The AI Visibility Engine (Engine) | A buyer question types into an AI chat. The answer streams in and the business name gets a highlight sweep. Then the six-platform table flips "Not named" to "Named". | `chatgpt-exchange`, `ai-answer-rank`, `marker-highlight`, `state-chip-rail` |
| Next-Generation AI Websites (Presence) | The page sections assemble into the finished site. Then a phone shows the same page. | `browser-device-stage`, `grid-card-assemble`, `multi-device-splay` |
| Conversational AI & Customer Engagement (Engage) | A WhatsApp-style enquiry arrives at 11:40pm and is answered and booked while the office is dark. | `message-thread-reveal`, `typing-indicator`, `native-notification-pop` |
| Data Analytics & Dashboarding (Autopilot) | Scattered sources (sheet, CRM, ads) fly into one dashboard. Then the key number counts up. | `constellation-hub`, `chart-story`, `count-up` |
| AI Consulting & Implementation (Transform) | A manual task chain collapses into an automated flow, with the hours saved shown only if the page states them. | `flowchart`, `hw-pipeline`, `onboarding-stepper-flow` |

**Real over rebuilt.**
- Use the real page crops as the backdrop and for proof: the hero section, the scope list, the steps section.
- Rebuild in HTML only the parts that must move or be read: chat bubbles, numbers, the platform table, the price card.
- Pull colours, fonts and radii from the page, and from Iyara `brand.md` gold-authority tokens for our own pages.
- Never zoom into screenshot text to make it legible. If it must be read, rebuild it.

**Package card (no registry block; build it).**
- One HTML card: package name, the price line verbatim, one line of scope ("One website, one market, 3-month initial term"), and the URL `iyaralabs.com/pricing/<id>`.
- It springs in at 0.5-0.7s with `power3.out` and a small `pop` sound.
- Hold it for at least 2.5s.

**Technique menu** (all GSAP inside the composition; timings are starting points):

| Technique | Use | Timing |
|---|---|---|
| Click-anchored push-in | The camera moves to the element the VO names. Cap the zoom at 1.5x pixel width. | Start 0.3s before the click, settle 0.6-0.8s, hold 1.2-2s |
| Hold and return | Ease back to full frame for context | 0.6-0.9s |
| Long-page pan | `translateY` down a tall section crop | 3-5s `power1.inOut` |
| Whip pan | The camera acts as the cut between scenes, with blur during the move | 0.4-0.5s |
| Spotlight dim | Dim everything except a rounded rect around the target | 0.3s in, hold 1.5s |
| Synthetic cursor | A curved glide with a pause, then a click that squashes to 0.85 and ripples. Use `cursor-zoom-follow` or `agent-cursor`. | Glide 0.6-1.0s, pause 0.2s |
| Typewriter prompt | Prompt text with a caret | 40-70ms per character, uneven |
| Streaming answer | Line-by-line reveal, then a marker sweep on the name | Sweep 0.4-0.6s |
| Count-up and bar grow | Numbers land on the exact page value | 0.8-1.2s `power2.out` |
| Card stack | Steps such as "Ask, Record, Compare, Act" snap in | 0.3s stagger |
| Pull-back reveal | Opener or closer, from tight on a detail out to the full page | 1.5-2.5s |

**Scene grammar.**
- One idea per scene, at 3-6s each, so about 9-12 scenes in 45s.
- On-screen text is a 2-5 word label for the beat. The VO carries the sentence, and burned-in captions carry the VO. Never put the full sentence twice.
- No intro card, logo sting or "presenting".
- No neon AI orbs, floating 3D shapes or stock footage.
- Light, warm UI reads as current.

**Feature variant** (a product feature rather than a service):
- The hero is the real screen.
- Use one cursor journey: open, the click, the payoff. Each step gets a push-in and a hold.
- The arc is the same, with steps 4-5 shown on the real UI.

## 5. Beat sheet (default 45s)

| Time | On screen | Audio |
|---|---|---|
| 0-1.2s | Poster frame: the pain as a picture (an AI answer without the name, an unanswered chat). It must read with the sound off. | Music in |
| 1.2-4s | Hook: the prompt types, or the enquiry pings | Line 1, `typing` SFX |
| 4-11s | Stakes: the answer lands without them, with the camera lingering on the gap (the gag) | Line 2, a soft hit on the gap |
| 11-18s | The service: its name as kinetic type over the real hero crop, then a push into the page | Line 3, `whoosh` on the cut |
| 18-33s | How it works: 2-3 steps, each a scene with a rebuilt UI beat | Line 4, `pop` or `click` per step |
| 33-40s | Outcome: the hero object fully working. The name is highlighted, the table flips, the number lands. | Line 5, `chime` on the payoff (music reveal cue) |
| 40-45s | The package card, then the CTA lockup (`logo-outro` or `cta-lockup`) with the URL | Line 6, music resolves |

- **30s:** merge the hook and stakes and use two steps. Suits LinkedIn and Reels feeds, where the recommendation is 15-30s for awareness.
- **60s:** add a "what is included" beat (a scope-list crop) before the outcome. Suits service-page embeds and sales emails.

## 6. Format, audio, finish

- **Formats and safe zones:** follow `before-after.md` section 5. Vertical 9:16 is the default for social, 16:9 for page embeds.
- **Vertical layout:** crop the UI to the one relevant element and scale it to the full width. Put labels above it, and keep captions out of the bottom 670px.
- **Music:** use a brag track that fits the energy, from `~/.claude/skills/brag/assets/music/`. Choose a reveal candidate C from `cues/<track>.music-cues.md` and start the track at `musicStart = C - T`, where T is the payoff time (about 34s at 45s). That way the music lifts as the outcome lands. No riser and no impact; that bed belongs to the before/after.
- **SFX:**
  - Sources: media-use `audio/assets/sfx/` (`typing`, `click`, `pop`, `whoosh-short`, `chime`, `notification`) and brag `assets/sfx/ui/`.
  - Use them only on scene changes and the 2-3 key reveals, landing on the visual hit. They never run under every motion.
  - Mix them into the bed with `adelay` the same way `before-after.md` section 7 does, or place them as audio clips.
- **Narration:** `narration.json` with `musicVolume` 0.30-0.36, then `narrate.mjs`. The first line starts at about 1.2s. Captions are burned in and hold 1-8s.
- **Master:** loudnorm `I=-15:TP=-2.5`, bake the poster, and deliver per SKILL.md section 3.

## 7. Check before delivering

- `npx hyperframes check` passes.
- Run `snapshot --describe false` at 0.5s, at the middle of each beat, at the payoff and on the card. View every snapshot and check:
  - the poster reads with the sound off;
  - labels are 2-5 words;
  - no text is zoomed past legibility;
  - the `Illustrative` tag is on every mock;
  - captions sit inside the safe zone.
- Listen to the whole video once. Check that:
  - acronyms, prices and the service name are pronounced right;
  - the music lifts on the payoff;
  - no SFX lands on a word.
- Grep the script, captions and cards against the section 2 bans. Also grep for em and en dashes.
- The reply carries the share caption, the facts used with their source section, and the work-dir path.
