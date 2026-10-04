# Inquisitive Bytes: faceless behaviour science reels

Script data and a renderer for faceless Instagram reels on [@inquisitive_bytes](https://www.instagram.com/inquisitive_bytes).

- `scripts/*.json` holds one reel per file: on-screen text, voiceover, caption, hashtags and the source study.
- `SCRIPTS.md` is a readable version of every script. You can read it on your phone while you record the voiceover.
- `render.mjs` turns each script into a 1080×1920, 30fps MP4 with animated captions, a progress bar and your branding.

## Channel theme

`theme.json` sets the look for every reel, matching the @inquisitive_bytes grid. That means a light sky-blue background, a royal-blue rounded card, a pale header tab with the lightbulb logo and "Inquisitive Bytes", an underlined series title, and the handle and #GetWiseWithInquisitiveBytes under the card. Change it once and re-render, and all reels update.

- **Logo:** `brand/logo-from-screenshot.png` was cut from a phone screenshot, so it's a little soft. Drop the original logo file into `brand/` and point `logo` at it.
- **Fonts:** `fonts/` holds Kalam (handwritten body text) and Bree Serif (header). Both are free Google Fonts under the SIL Open Font License. To use a different font, add its `.ttf` file and update `fonts` in `theme.json`.
- **Rendering:** the card background is drawn with Playwright (Chromium), and ffmpeg then animates the captions on top.

## Tone

The scripts are written for a curious 15-year-old. That means short sentences, everyday examples (school, snacks, phones, games, friends) and no jargon. Every technical term is explained in plain words the first time it appears ("A default is what's already chosen for you").

## Series: "Brain Glitch"

| # | Topic | Hook |
|---|---|---|
| 01 | The Decoy Effect | Why do you always buy the medium popcorn? |
| 02 | Anchoring | A random number can change your answer |
| 03 | Loss Aversion | Losing ₹100 feels worse than finding ₹100 feels good |
| 04 | The IKEA Effect | Why does stuff you made feel more special? |
| 05 | The Spotlight Effect | That embarrassing moment? Nobody noticed. |
| 06 | The Pratfall Effect | Making a mistake can make people like you more |
| 07 | The Default Effect | One checkbox changed millions of decisions |
| 08 | The Peak-End Rule | People chose more pain. Here's why. |
| 09 | Social Proof | One sentence got more people to reuse towels |
| 10 | The Fresh Start Effect | Why do you always say “I'll start on Monday”? |

Every reel follows the same structure: a **hook** (the first 2–3 seconds, pattern interrupt), then the **study** (who, what, the surprising number), the **name** of the effect, **where you see it** in daily life, a **TRY THIS** tip, and a **follow** call to action.

## Render

Requires Node 18+, ffmpeg built with libass (the default on most installs) and Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`).

```bash
node reels/render.mjs                      # all reels -> reels/out/*.mp4
node reels/render.mjs 03 07                # only ids starting with 03 / 07
node reels/render.mjs --music lofi.mp3     # add a background track
node reels/render.mjs --markdown           # regenerate SCRIPTS.md after editing JSON
```

Each render also writes `<id>.srt`, with the voiceover as timed captions, and the `.ass` caption file it used.

### Adding a voiceover

1. Record or generate the `vo` lines from `SCRIPTS.md`. You can use your own voice, or a TTS tool such as ElevenLabs or CapCut's text-to-speech.
2. Save the recording as `reels/voiceover/<id>.mp3`, for example `reels/voiceover/01-decoy-effect.mp3`.
3. Re-render. The voiceover is mixed in, and the scenes stretch so the video is never shorter than the audio. Any `--music` track is turned down underneath the voice.

Scene timing assumes about 2.8 words per second. To control one scene exactly, add `"dur": 3.5` to it.

### Silent / trending-audio version

If you render without a voiceover or music, the video gets a silent audio track. Upload it and add a trending sound inside Instagram, which often helps reach. The on-screen text tells the whole story on its own.

## Writing a new reel

Copy any file in `scripts/`, then change the `id`, `number` and `title`, and write the scenes. Formatting in `text`:

- `*word*` shows that word in the accent colour.
- `~~₹2,999~~` shows a struck-through old price.
- `\n` starts a new line.
- `"style": "hook" | "tip" | "cta"` changes the size and layout (leave it out for normal body scenes).

Keep on-screen text to about 12 words or fewer per scene, and quote a real study for every claim. Each script lists its source so viewers who ask can check it.

### More topic ideas

Sunk cost fallacy · Endowment effect · Mere exposure effect · Bystander effect · Halo effect · Hyperbolic discounting · Scarcity heuristic · Choice overload (jam study, use with care because replications are mixed) · Framing effect · Reciprocity · Commitment & consistency · Dunning–Kruger (explain the nuance) · Hot-cold empathy gap · Planning fallacy · Status quo bias · Licensing effect · Hedonic adaptation.

Avoid findings that failed to replicate, or present them as myths. Examples are power posing, ego depletion and the marshmallow test's "destiny" framing. Myth-busting reels often perform well too.
