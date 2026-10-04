#!/usr/bin/env node
// Renders faceless 1080x1920 reels from reels/scripts/*.json using ffmpeg + ASS captions.
//
//   node reels/render.mjs                    # render every script
//   node reels/render.mjs 01 07              # render scripts whose id starts with 01 or 07
//   node reels/render.mjs --music bed.mp3    # add a background track (looped, ducked to 18%)
//   node reels/render.mjs --markdown         # regenerate reels/SCRIPTS.md only
//
// If reels/voiceover/<id>.mp3 exists it is mixed in, and each scene's length is
// stretched so the video is never shorter than the recording.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = join(ROOT, "scripts");
const VO_DIR = join(ROOT, "voiceover");
const W = 1080;
const H = 1920;
const FPS = 30;
const WORDS_PER_SEC = 2.8; // natural voiceover pace
const THEME = JSON.parse(readFileSync(join(ROOT, "theme.json"), "utf8"));

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const markdownOnly = args.includes("--markdown");
if (markdownOnly) args.splice(args.indexOf("--markdown"), 1);
const music = flag("--music");
const font = flag("--font") ?? THEME.font;
const outDir = flag("--out") ?? join(ROOT, "out");
const filters = args;

const scripts = readdirSync(SCRIPTS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(SCRIPTS_DIR, f), "utf8")))
  .filter((s) => filters.length === 0 || filters.some((p) => s.id.startsWith(p)));

writeMarkdown();
if (markdownOnly) process.exit(0);

mkdirSync(outDir, { recursive: true });
for (const script of scripts) render(script);

function seriesLabel(script) {
  return `${THEME.series} #${String(script.number).padStart(2, "0")}`;
}

function sceneDurations(script, minTotal = 0) {
  const durs = script.scenes.map((s) => {
    if (s.dur) return s.dur;
    const words = s.vo.split(/\s+/).filter(Boolean).length;
    return Math.max(s.style === "hook" ? 2.4 : 2.8, words / WORDS_PER_SEC + 0.3);
  });
  const total = durs.reduce((a, b) => a + b, 0);
  const scale = minTotal > total ? minTotal / total : 1;
  return durs.map((d) => d * scale);
}

function probeDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return parseFloat(out.toString());
}

// "#rrggbb" -> ASS "&HBBGGRR&"
function assColor(hex) {
  const h = hex.replace("#", "");
  return `&H${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}&`.toUpperCase();
}

function assTime(t) {
  const cs = Math.round(t * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}

// *word* -> accent colour, ~~old price~~ -> struck through, \n -> ASS line break
function assText(text, accent, base) {
  return text
    .replace(/[{}]/g, "")
    .replace(/\*([^*]+)\*/g, `{\\c${accent}}$1{\\c${base}}`)
    .replace(/~~([^~]+)~~/g, "{\\s1\\alpha&H60&}$1{\\s0\\alpha&H00&}")
    .replace(/\n/g, "\\N");
}

function buildAss(script, durs) {
  const accent = assColor(THEME.accent);
  const text = assColor(THEME.text);
  const muted = assColor(THEME.muted);
  const total = durs.reduce((a, b) => a + b, 0);
  const lines = [];
  const ev = (start, end, style, text) =>
    lines.push(`Dialogue: 0,${assTime(start)},${assTime(end)},${style},,0,0,0,,${text}`);

  // Persistent chrome: brand, series tag, handle, progress bar.
  ev(0, total, "Brand", `{\\pos(${W / 2},230)\\c${accent}}${THEME.brand}`);
  ev(0, total, "Tag", `{\\pos(${W / 2},290)\\c${muted}}${seriesLabel(script)} · ${script.title.toUpperCase()}`);
  ev(0, total, "Tag", `{\\pos(${W / 2},1500)\\c${muted}\\alpha&H60&}${THEME.handle}`);
  const barY = 140;
  const track = `m 90 ${barY} l ${W - 90} ${barY} l ${W - 90} ${barY + 8} l 90 ${barY + 8}`;
  ev(0, total, "Bar", `{\\an7\\pos(0,0)\\alpha&HB0&\\p1}${track}{\\p0}`);
  ev(0, total, "Bar",
    `{\\an7\\pos(0,0)\\c${accent}\\clip(90,${barY},90,${barY + 8})\\t(0,${Math.round(total * 1000)},\\clip(90,${barY},${W - 90},${barY + 8}))\\p1}${track}{\\p0}`);

  let t = 0;
  script.scenes.forEach((scene, i) => {
    const d = durs[i];
    const style = scene.style === "hook" ? "Hook" : scene.style === "cta" ? "Cta" : scene.style === "tip" ? "Tip" : "Body";
    const cy = 860;
    const anim = `\\move(${W / 2},${cy + 40},${W / 2},${cy},0,280)\\fad(220,160)\\fscx88\\fscy88\\t(0,260,\\fscx100\\fscy100)`;
    const body = assText(scene.text, accent, text);
    if (style === "Tip") {
      ev(t, t + d, "Label", `{\\pos(${W / 2},${cy - 330})\\fad(220,160)\\c${accent}}TRY THIS`);
    }
    ev(t, t + d, style, `{${anim}\\c${text}}${body}`);
    // Accent underline under the hook for a bit of motion.
    if (style === "Hook") {
      const y = cy + 300;
      ev(t, t + d, "Bar",
        `{\\an7\\pos(0,0)\\c${accent}\\clip(${W / 2},${y},${W / 2},${y + 10})\\t(150,600,\\clip(${W / 2 - 160},${y},${W / 2 + 160},${y + 10}))\\p1}m 0 ${y} l ${W} ${y} l ${W} ${y + 10} l 0 ${y + 10}{\\p0}`);
    }
    t += d;
  });

  const style = (name, size, bold, outline, extra = "") =>
    `Style: ${name},${font},${size},&H00FFFFFF,&H00FFFFFF,&H90000000,&H70000000,${bold ? -1 : 0},0,0,0,100,100,${extra || 0},0,1,${outline},3,5,110,110,0,1`;

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${style("Hook", 98, true, 4)}
${style("Body", 80, true, 3)}
${style("Tip", 76, true, 3)}
${style("Cta", 70, true, 3)}
${style("Brand", 40, true, 0, 8)}
${style("Tag", 32, false, 0, 2)}
${style("Label", 40, true, 0, 6)}
${style("Bar", 20, false, 0)}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join("\n")}
`;
}

function render(script) {
  const vo = join(VO_DIR, `${script.id}.mp3`);
  const hasVo = existsSync(vo);
  const durs = sceneDurations(script, hasVo ? probeDuration(vo) + 0.8 : 0);
  const total = durs.reduce((a, b) => a + b, 0);
  const assPath = join(outDir, `${script.id}.ass`);
  writeFileSync(assPath, buildAss(script, durs));

  const [bg1, bg2] = THEME.background;
  const inputs = [
    "-f", "lavfi", "-i",
    `gradients=s=${W}x${H}:r=${FPS}:d=${total.toFixed(2)}:c0=${bg1}:c1=${bg2}:c2=${bg1}:n=3:speed=0.004:type=linear`,
  ];
  const audio = [];
  if (hasVo) {
    inputs.push("-i", vo);
    audio.push(`[${audio.length + 1}:a]volume=1.0[a${audio.length}]`);
  }
  if (music) {
    inputs.push("-stream_loop", "-1", "-i", music);
    const idx = audio.length + 1;
    audio.push(`[${idx}:a]volume=${hasVo ? 0.18 : 0.6},afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5[a${audio.length}]`);
  }
  if (audio.length === 0) {
    inputs.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo");
    audio.push("[1:a]anull[a0]");
  }
  const mix = audio.length > 1
    ? `${audio.join(";")};${audio.map((_, i) => `[a${i}]`).join("")}amix=inputs=${audio.length}:duration=longest:normalize=0[aout]`
    : `${audio[0].replace("[a0]", "[aout]")}`;
  const esc = assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
  const video = `[0:v]vignette=PI/6,subtitles='${esc}',format=yuv420p[vout]`;

  const out = join(outDir, `${script.id}.mp4`);
  console.log(`▶ ${script.id} (${total.toFixed(1)}s${hasVo ? ", voiceover" : ""}${music ? ", music" : ""})`);
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    ...inputs,
    "-filter_complex", `${video};${mix}`,
    "-map", "[vout]", "-map", "[aout]",
    "-t", total.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100",
    "-movflags", "+faststart",
    out,
  ], { stdio: "inherit" });
  writeFileSync(join(outDir, `${script.id}.srt`), buildSrt(script, durs));
}

function buildSrt(script, durs) {
  const ts = (t) => assTime(t).replace(/^(\d):/, "0$1:").replace(".", ",") + "0";
  let t = 0;
  return script.scenes
    .map((s, i) => {
      const block = `${i + 1}\n${ts(t)} --> ${ts(t + durs[i])}\n${s.vo}\n`;
      t += durs[i];
      return block;
    })
    .join("\n");
}

function writeMarkdown() {
  const all = readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith(".json")).sort()
    .map((f) => JSON.parse(readFileSync(join(SCRIPTS_DIR, f), "utf8")));
  const md = [
    "# Inquisitive Bytes: Behaviour Science Reel Scripts",
    "",
    "Generated from `reels/scripts/*.json` by `node reels/render.mjs --markdown`. Edit the JSON, not this file.",
    "",
  ];
  for (const s of all) {
    const durs = sceneDurations(s);
    const total = durs.reduce((a, b) => a + b, 0);
    md.push(`## ${seriesLabel(s)}: ${s.title}`, "", `**Length:** ~${Math.round(total)}s · **File:** \`reels/scripts/${s.id}.json\``, "");
    md.push("| # | On-screen text | Voiceover |", "|---|---|---|");
    s.scenes.forEach((sc, i) => {
      const cell = (x) => x.replace(/\n/g, " / ").replace(/\|/g, "\\|");
      md.push(`| ${i + 1}${sc.style ? ` (${sc.style})` : ""} | ${cell(sc.text).replace(/\*([^*]+)\*/g, "**$1**")} | ${cell(sc.vo)} |`);
    });
    md.push("", "**Caption**", "", "```", s.caption, "", s.hashtags.join(" "), "```", "", `**Source:** ${s.source}`, "");
  }
  writeFileSync(join(ROOT, "SCRIPTS.md"), md.join("\n"));
}
