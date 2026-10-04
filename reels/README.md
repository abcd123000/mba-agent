# Inquisitive Bytes: faceless behaviour science reels

Script data and a renderer for faceless Instagram reels on [@inquisitive_bytes](https://www.instagram.com/inquisitive_bytes).

- `scripts/*.json` holds one reel per file: on-screen text, voiceover, caption, hashtags and the source study.
- `SCRIPTS.md` is a readable version of every script. You can read it on your phone while you record the voiceover.
- `render.mjs` turns each script into a 1080×1920, 30fps MP4 with animated captions, a progress bar and your branding.

## Series: "Brain Glitch"

| # | Topic | Hook |
|---|---|---|
| 01 | Decoy effect | Why does the medium popcorn always win? |
| 02 | Anchoring | A random wheel changed what people believed. |
| 03 | Loss aversion | Losing ₹500 hurts more than finding ₹500 feels good. |
| 04 | IKEA effect | Why do you love the wobbly shelf you built? |
| 05 | Spotlight effect | Nobody noticed. Seriously. |
| 06 | Pratfall effect | Spilling coffee might make you more likeable. |
| 07 | Default effect | Austria: 99% organ donors. Germany: 12%. Why? |
| 08 | Peak-end rule | People chose more pain. Here's why. |
| 09 | Social proof | One sentence got more hotel guests to reuse towels. |
| 10 | Fresh start effect | Why does your diet always start on a Monday? |

Every reel follows the same structure: a **hook** (the first 2–3 seconds, pattern interrupt), then the **study** (who, what, the surprising number), the **name** of the effect, **where you see it** in daily life, a **TRY THIS** tip, and a **follow** call to action.

## Render

Requires Node 18+ and ffmpeg built with libass (the default on most installs).

```bash
node reels/render.mjs                      # all reels -> reels/out/*.mp4
node reels/render.mjs 03 07                # only ids starting with 03 / 07
node reels/render.mjs --music lofi.mp3     # add a background track
node reels/render.mjs --font "Montserrat"  # any font installed on your system (default: DejaVu Sans)
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

Copy any file in `scripts/`, then change the `id`, `title`, `series` and `palette`, and write the scenes. Formatting in `text`:

- `*word*` shows that word in the accent colour.
- `\n` starts a new line.
- `"style": "hook" | "tip" | "cta"` changes the size and layout (leave it out for normal body scenes).

Keep on-screen text to about 12 words or fewer per scene, and quote a real study for every claim. Each script lists its source so viewers who ask can check it.

### More topic ideas

Sunk cost fallacy · Endowment effect · Mere exposure effect · Bystander effect · Halo effect · Hyperbolic discounting · Scarcity heuristic · Choice overload (jam study, use with care because replications are mixed) · Framing effect · Reciprocity · Commitment & consistency · Dunning–Kruger (explain the nuance) · Hot-cold empathy gap · Planning fallacy · Status quo bias · Licensing effect · Hedonic adaptation.

Avoid findings that failed to replicate, or present them as myths. Examples are power posing, ego depletion and the marshmallow test's "destiny" framing. Myth-busting reels often perform well too.
