/* Bash Your Horoscope — pitch deck. Celestial-almanac brand: ink + ivory + gold, serif voice.
   Run: node build_deck.js  then  python <skill>/scripts/rezip.py "Kundlibash — Pitch.pptx" */
const pptxgen = require("pptxgenjs");
const path = require("path");

const SHOTS = path.resolve(__dirname, "../docs/screenshots");
const img = (f) => path.join(SHOTS, f);
const DIMS = { "hero.png":[2880,1880], "reading.png":[2880,2960], "reckoning.png":[2880,2920], "almanac.png":[2880,2120], "mobile.png":[860,1840] };
function dims(f){ const d = DIMS[f]; return { w:d[0], h:d[1] }; }

// palette
const INK="0A0D15", PANEL="121A2B", PANEL2="0E1422",
      IVORY="ECE3D0", PARCH="A89E86", FAINT="6E6757",
      GOLD="C6A667", GOLDB="E6CD92", HOLLOW="828DAA", TRUE="D9BA79";
const SERIF="Cambria", SANS="Calibri";
const W=13.333, H=7.5, M=0.8;

const pres = new pptxgen();
pres.defineLayout({ name:"WIDE", width:W, height:H });
pres.layout = "WIDE";
pres.author = "Akhil Tripathi";
pres.title = "Kundlibash — Pitch";

const shadow = () => ({ type:"outer", color:"000000", blur:14, offset:5, angle:90, opacity:0.45 });

function bg(slide){ slide.background = { color: INK }; }
function star(slide, x, y, sz=14, color=GOLD){ slide.addText("✦", { x, y, w:0.5, h:0.4, fontFace:SERIF, fontSize:sz, color, align:"left", valign:"middle", margin:0 }); }
function eyebrow(slide, txt){ slide.addText(txt.toUpperCase(), { x:M+0.34, y:0.62, w:W-2*M-0.34, h:0.4, fontFace:SANS, fontSize:12, color:GOLD, charSpacing:5, align:"left", valign:"middle", margin:0 }); }
function pageNum(slide, n){ slide.addText(String(n).padStart(2,"0"), { x:W-1.3, y:H-0.62, w:0.7, h:0.35, fontFace:SANS, fontSize:10, color:FAINT, align:"right", charSpacing:2, margin:0 }); slide.addText("KUNDLIBASH", { x:M, y:H-0.62, w:4, h:0.35, fontFace:SANS, fontSize:9, color:FAINT, charSpacing:3, align:"left", valign:"middle", margin:0 }); }
function stars(slide, pts){ pts.forEach(([x,y,r,c,t])=> slide.addShape(pres.shapes.OVAL, { x, y, w:r, h:r, fill:{ color:c||IVORY, transparency: t==null?40:t }, line:{ type:"none" } })); }

// place an image fit inside a box, on a subtle raised panel
function shot(slide, file, boxX, boxY, boxW, boxH){
  const d = dims(file); const ar = d.w/d.h;
  let w = boxW, h = w/ar; if(h>boxH){ h=boxH; w=h*ar; }
  const x = boxX + (boxW-w)/2, y = boxY + (boxH-h)/2;
  const pad = 0.1;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:x-pad, y:y-pad, w:w+2*pad, h:h+2*pad, rectRadius:0.06, fill:{ color:PANEL2 }, line:{ color:GOLD, width:0.5, transparency:62 }, shadow:shadow() });
  slide.addImage({ path:img(file), x, y, w, h });
  return { x, y, w, h };
}

/* ───────────────────────── 1 · TITLE ───────────────────────── */
let s = pres.addSlide(); bg(s);
stars(s, [[1.4,1.5,0.07,GOLD,20],[2.2,3.6,0.05,IVORY,35],[3.0,5.6,0.06,GOLD,40],[11.6,1.4,0.08,IVORY,25],[12.1,4.2,0.06,GOLD,30],[10.8,6.0,0.05,IVORY,45],[6.8,0.9,0.05,GOLD,40],[1.0,6.4,0.06,IVORY,45],[12.4,6.6,0.05,GOLD,45]]);
s.addText("A HOROSCOPE YOU CAN ARGUE WITH", { x:0, y:1.95, w:W, h:0.4, fontFace:SANS, fontSize:14, color:GOLD, charSpacing:7, align:"center", margin:0 });
s.addText([{ text:"Kundli", options:{ color:IVORY } }, { text:"bash", options:{ color:GOLDB, italic:true } }],
  { x:0, y:2.45, w:W, h:1.2, fontFace:SERIF, fontSize:72, align:"center", margin:0 });
s.addText("A horoscope you're allowed to argue with.", { x:0, y:3.95, w:W, h:0.6, fontFace:SERIF, italic:true, fontSize:24, color:IVORY, align:"center", margin:0 });
star(s, W/2-0.18, 4.85, 16, GOLD);
s.addText("Take your horoscope with a pinch of celestial salt", { x:0, y:5.35, w:W, h:0.4, fontFace:SANS, fontSize:12.5, color:PARCH, charSpacing:3, align:"center", margin:0 });
s.addText("Cloudflare Pages · Functions · KV   —   built with Claude Code", { x:0, y:H-0.7, w:W, h:0.35, fontFace:SANS, fontSize:10, color:FAINT, charSpacing:2, align:"center", margin:0 });

/* ───────────────────────── 2 · PROBLEM ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"The problem"); star(s,M,0.585,11);
s.addText([{ text:"Everyone reads it.", options:{ color:IVORY, breakLine:true } }, { text:"No one checks it.", options:{ color:GOLDB } }],
  { x:M, y:1.5, w:7.4, h:1.9, fontFace:SERIF, fontSize:46, align:"left", lineSpacingMultiple:1.02, margin:0 });
s.addText("The horoscope is written in the morning and forgotten by night. It never has to be right — just vague enough to feel right, and gone before you can call its bluff.",
  { x:M, y:3.7, w:7.0, h:1.6, fontFace:SERIF, fontSize:18, color:PARCH, align:"left", lineSpacingMultiple:1.2, margin:0 });
// three quiet callouts
const probs = [["Read","every morning"],["Checked","almost never"],["Graded","never"]];
probs.forEach(([a,b],i)=>{ const x=M+i*2.35; const y=5.55;
  s.addText(a, { x, y, w:2.2, h:0.5, fontFace:SERIF, fontSize:23, color:GOLDB, align:"left", margin:0 });
  s.addText(b.toUpperCase(), { x, y:y+0.55, w:2.2, h:0.35, fontFace:SANS, fontSize:10.5, color:FAINT, charSpacing:2, align:"left", margin:0 });
});
stars(s, [[10.6,1.6,0.07,GOLD,25],[11.7,2.6,0.05,IVORY,35],[10.9,3.7,0.06,GOLD,35],[12.1,4.6,0.05,IVORY,40],[10.4,5.2,0.05,GOLD,45]]);
s.addText("“my horoscope is\ncomplete bs.”", { x:9.6, y:2.7, w:3.3, h:1.6, fontFace:SERIF, italic:true, fontSize:26, color:IVORY, align:"center", valign:"middle", lineSpacingMultiple:1.05, margin:0 });
s.addText("— the instinct we build on", { x:9.6, y:4.25, w:3.3, h:0.4, fontFace:SANS, fontSize:11, color:GOLD, charSpacing:1, align:"center", margin:0 });
pageNum(s,2);

/* ───────────────────────── 3 · THE IDEA ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"The idea"); star(s,M,0.585,11);
s.addText("Make it falsifiable. Make it fun.", { x:M, y:1.35, w:W-2*M, h:0.9, fontFace:SERIF, fontSize:38, color:IVORY, align:"left", margin:0 });
const steps = [
  ["I","Predict","Pull each sign's real daily horoscope and split it into discrete, testable lines."],
  ["II","Bash","At day's end, mark each line rang true or rang hollow — and note what actually happened."],
  ["III","Reckon","Verdicts roll up into your private record and a public scoreboard of the whole zodiac."]];
steps.forEach(([rn,t,b],i)=>{ const x=M+i*4.05; const y=2.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w:3.7, h:3.4, rectRadius:0.08, fill:{ color:PANEL }, line:{ type:"none" }, shadow:shadow() });
  s.addText(rn, { x:x+0.35, y:y+0.3, w:1.5, h:0.8, fontFace:SERIF, italic:true, fontSize:40, color:GOLD, align:"left", margin:0 });
  s.addText(t, { x:x+0.35, y:y+1.25, w:3.0, h:0.55, fontFace:SERIF, fontSize:24, color:GOLDB, align:"left", margin:0 });
  s.addText(b, { x:x+0.35, y:y+1.95, w:3.05, h:1.3, fontFace:SERIF, fontSize:15, color:PARCH, align:"left", lineSpacingMultiple:1.18, margin:0 });
});
pageNum(s,3);

/* ───────────────────────── 4 · HOW IT WORKS (reading) ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"The reading"); star(s,M,0.585,11);
s.addText("Bash the stars, line by line.", { x:M, y:1.3, w:6.2, h:1.4, fontFace:SERIF, fontSize:36, color:IVORY, align:"left", lineSpacingMultiple:1.0, margin:0 });
const flow = [
  "Choose your sign.",
  "Read today's lines — the same for everyone with your sign.",
  "Mark each true or hollow; note what really happened.",
  "Watch the crowd's verdict appear beneath each line."];
flow.forEach((t,i)=>{ const y=3.0+i*0.92;
  s.addText("✦", { x:M, y, w:0.4, h:0.4, fontFace:SERIF, fontSize:13, color:GOLD, align:"left", valign:"top", margin:0 });
  s.addText(t, { x:M+0.45, y:y-0.04, w:5.6, h:0.85, fontFace:SERIF, fontSize:17, color:PARCH, align:"left", lineSpacingMultiple:1.1, valign:"top", margin:0 });
});
shot(s, "reading.png", 7.1, 1.15, 5.5, 5.7);
pageNum(s,4);

/* ───────────────────────── 5 · THE RECKONING (data) ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"The reckoning"); star(s,M,0.585,11);
s.addText("A scoreboard for the stars.", { x:M, y:1.3, w:6.2, h:1.3, fontFace:SERIF, fontSize:36, color:IVORY, align:"left", margin:0 });
s.addText("Because everyone with your sign reads the same daily lines, the verdicts add up to something real — a live, crowd-sourced measure of which signs ring true, and which are mostly hot air.",
  { x:M, y:2.75, w:5.9, h:2.0, fontFace:SERIF, fontSize:17, color:PARCH, align:"left", lineSpacingMultiple:1.22, margin:0 });
s.addText([{ text:"Gemini ", options:{ color:GOLDB } }, { text:"rings 71% true.  ", options:{ color:PARCH, italic:true } }, { text:"Scorpio, ", options:{ color:HOLLOW } }, { text:"just 44%.", options:{ color:PARCH, italic:true } }],
  { x:M, y:5.0, w:5.9, h:0.6, fontFace:SERIF, fontSize:18, align:"left", margin:0 });
s.addText("THE STARS' OVERALL CANDOUR — 59%", { x:M, y:5.7, w:5.9, h:0.4, fontFace:SANS, fontSize:11, color:GOLD, charSpacing:2, align:"left", margin:0 });
shot(s, "reckoning.png", 7.0, 1.15, 5.6, 5.75);
pageNum(s,5);

/* ───────────────────────── 6 · WHAT IT COLLECTS (ledgers) ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"The almanac"); star(s,M,0.585,11);
s.addText("Three quiet ledgers.", { x:M, y:1.3, w:6.5, h:0.9, fontFace:SERIF, fontSize:36, color:IVORY, align:"left", margin:0 });
const ledgers = [
  ["Accuracy notes","Per line: the verdict, the original prediction, and what actually happened."],
  ["Other notes","Free-form notes for the day — the mood, the omen, what the reading missed."],
  ["Stats","Your accuracy and streak; the whole zodiac ranked by candour."]];
ledgers.forEach(([t,b],i)=>{ const y=2.55+i*1.35;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:M, y, w:5.9, h:1.18, rectRadius:0.07, fill:{ color:PANEL }, line:{ type:"none" }, shadow:shadow() });
  s.addText(t, { x:M+0.35, y:y+0.16, w:5.2, h:0.45, fontFace:SERIF, fontSize:20, color:GOLDB, align:"left", margin:0 });
  s.addText(b, { x:M+0.35, y:y+0.6, w:5.3, h:0.5, fontFace:SERIF, fontSize:13.5, color:PARCH, align:"left", lineSpacingMultiple:1.08, margin:0 });
});
shot(s, "almanac.png", 7.1, 1.35, 5.5, 5.3);
pageNum(s,6);

/* ───────────────────────── 7 · WHY IT WORKS (mobile) ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"Why it works"); star(s,M,0.585,11);
s.addText("Habit, truth, and almost no upkeep.", { x:M, y:1.3, w:7.6, h:0.9, fontFace:SERIF, fontSize:34, color:IVORY, align:"left", margin:0 });
const why = [
  ["A daily loop","A fresh reading every day is a reason to return — and to bash yesterday's."],
  ["Shared truth","One reading per sign per day makes the community scoreboard a fair contest."],
  ["Light to run","Static front end, serverless functions, one key-value store. Scales to zero."]];
why.forEach(([t,b],i)=>{ const y=2.7+i*1.35;
  s.addText("✦", { x:M, y:y+0.05, w:0.4, h:0.4, fontFace:SERIF, fontSize:15, color:GOLD, margin:0 });
  s.addText(t, { x:M+0.5, y, w:6.7, h:0.5, fontFace:SERIF, fontSize:22, color:GOLDB, align:"left", margin:0 });
  s.addText(b, { x:M+0.5, y:y+0.52, w:6.7, h:0.7, fontFace:SERIF, fontSize:15, color:PARCH, align:"left", lineSpacingMultiple:1.15, margin:0 });
});
shot(s, "mobile.png", 9.4, 1.0, 3.2, 6.0);
pageNum(s,7);

/* ───────────────────────── 8 · UNDER THE HOOD ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"Under the hood"); star(s,M,0.585,11);
s.addText("Already built. Ready to ship.", { x:M, y:1.3, w:7.5, h:0.9, fontFace:SERIF, fontSize:36, color:IVORY, align:"left", margin:0 });
const stack = [
  ["Front end","One static HTML page — a vanilla-JS single-page app, no framework."],
  ["Back end","Cloudflare Pages Functions — a handful of serverless endpoints."],
  ["Storage","One KV namespace holds predictions, verdicts and tallies."],
  ["Identity","An anonymous cookie. No accounts, no email, no PII."],
  ["Predictions","Live astrology APIs with fallback, cached once per sign per day."]];
stack.forEach(([k,v],i)=>{ const y=2.55+i*0.82;
  s.addText(k.toUpperCase(), { x:M, y, w:2.5, h:0.5, fontFace:SANS, fontSize:12, color:GOLD, charSpacing:2, align:"left", valign:"top", margin:0 });
  s.addText(v, { x:M+2.7, y:y-0.03, w:6.4, h:0.6, fontFace:SERIF, fontSize:15.5, color:IVORY, align:"left", valign:"top", lineSpacingMultiple:1.05, margin:0 });
});
shot(s, "hero.png", 9.9, 2.5, 2.9, 2.6);
s.addText("Runs on Cloudflare for ~nothing, and scales to zero at rest.", { x:M, y:6.35, w:8.5, h:0.4, fontFace:SERIF, italic:true, fontSize:14, color:PARCH, align:"left", margin:0 });
pageNum(s,8);

/* ───────────────────────── 9 · ROADMAP ───────────────────────── */
s = pres.addSlide(); bg(s); eyebrow(s,"What's next"); star(s,M,0.585,11);
s.addText("Where it goes.", { x:M, y:1.3, w:7, h:0.9, fontFace:SERIF, fontSize:36, color:IVORY, align:"left", margin:0 });
const road = [
  ["Weekly & monthly reckonings","Accuracy trends over time, per sign."],
  ["Share cards","A beautiful auto-made image of today's verdict or your streak."],
  ["Sign rivalries","“Virgo vs Scorpio — who's more full of it this week?”"],
  ["Claimable accounts","Carry your anonymous almanac across devices."],
  ["An editorial layer","A short written reading of the readings, in Akhil's voice."]];
road.forEach(([t,b],i)=>{ const y=2.5+i*0.92;
  s.addText("✦", { x:M, y:y+0.02, w:0.4, h:0.4, fontFace:SERIF, fontSize:13, color:GOLD, margin:0 });
  s.addText([{ text:t+"   ", options:{ color:GOLDB } }, { text:b, options:{ color:PARCH, italic:true } }],
    { x:M+0.45, y, w:11.2, h:0.6, fontFace:SERIF, fontSize:18, align:"left", valign:"top", margin:0 });
});
pageNum(s,9);

/* ───────────────────────── 10 · CLOSING ───────────────────────── */
s = pres.addSlide(); bg(s);
stars(s, [[1.6,1.4,0.07,GOLD,20],[2.6,5.8,0.05,IVORY,35],[11.4,1.6,0.06,GOLD,30],[12.0,5.4,0.07,IVORY,30],[6.7,1.0,0.05,GOLD,40],[10.9,6.4,0.05,IVORY,45],[1.2,4.6,0.05,GOLD,45]]);
star(s, W/2-0.18, 2.1, 18, GOLD);
s.addText("Take your horoscope with a\npinch of celestial salt.", { x:1, y:2.7, w:W-2, h:1.8, fontFace:SERIF, fontSize:42, color:IVORY, align:"center", lineSpacingMultiple:1.05, margin:0 });
s.addText("kundlibash.pages.dev", { x:0, y:4.85, w:W, h:0.5, fontFace:SANS, fontSize:16, color:GOLDB, charSpacing:2, align:"center", margin:0 });
s.addText("For diversion, not counsel.   ·   Built with Claude Code.", { x:0, y:H-0.8, w:W, h:0.4, fontFace:SANS, fontSize:10.5, color:FAINT, charSpacing:2, align:"center", margin:0 });

pres.writeFile({ fileName: "Kundlibash — Pitch.pptx" }).then(f=>console.log("wrote", f));
