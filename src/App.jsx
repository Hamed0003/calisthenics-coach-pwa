import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Dumbbell, Calendar, Info, Timer, ListChecks, HeartPulse, Sun, Moon } from "lucide-react";

/**
 * Calisthenics Coach – Single-file React app
 * TailwindCSS + framer-motion + lucide-react
 *
 * (App source taken from your canvas — simplified small edits for bundling.)
 */

// ---------------------- Plan Data ----------------------

const EXERCISES = {
  pushups: {
    name: "Push-ups",
    type: "reps",
    default: 12,
    cues: [
      "Hands slightly wider than shoulders.",
      "Brace core, straight line head→heels.",
      "Lower till chest is close to floor, drive up.",
    ],
    ascii: `Start   ─────────▶  Lower\n[ plank ]           [ chest near floor ]`,
  },
  pikePushups: {
    name: "Pike Push-ups",
    type: "reps",
    default: 8,
    cues: [
      "Hips high (inverted V).",
      "Elbows down/back, head between hands.",
      "Press through palms, keep core tight.",
    ],
  },
  chairDips: {
    name: "Chair Dips",
    type: "reps",
    default: 10,
    cues: ["Hands on edge, chest tall.", "Lower with elbows back.", "Press to lockout without shrugging."],
  },
  mountainClimbers: {
    name: "Mountain Climbers",
    type: "time",
    default: 30,
    cues: ["Wrists under shoulders.", "Drive knees fast, hips level."],
  },
  plank: {
    name: "Plank",
    type: "time",
    default: 30,
    cues: ["Elbows under shoulders.", "Squeeze glutes + abs, breathe."]
  },
  invertedRows: {
    name: "Inverted Rows",
    type: "reps",
    default: 8,
    cues: ["Pull chest to edge/bar.", "Squeeze shoulder blades.", "Slow lower."]
  },
  pullups: {
    name: "Pull-ups / Chin-ups",
    type: "reps",
    default: 5,
    cues: ["Full hang to chin over bar.", "Use negatives if needed."]
  },
  splitSquats: {
    name: "Split Squats (each)",
    type: "reps",
    default: 10,
    cues: ["Long stance, upright torso.", "Back knee toward floor."]
  },
  gluteBridge: {
    name: "Glute Bridges",
    type: "reps",
    default: 12,
    cues: ["Heels close to hips.", "Squeeze glutes at top."]
  },
  sidePlank: {
    name: "Side Plank (each)",
    type: "time",
    default: 20,
    cues: ["Elbow under shoulder.", "Body in one line."]
  },
  burpees: {
    name: "Burpees",
    type: "reps",
    default: 8,
    cues: ["Chest to floor optional.", "Explode upward, soft landing."]
  },
  jumpSquats: {
    name: "Jump Squats",
    type: "reps",
    default: 12,
    cues: ["Sit back then jump.", "Abs tight, quiet landing."]
  },
  plankTaps: {
    name: "Plank Shoulder Taps (total)",
    type: "reps",
    default: 20,
    cues: ["Wide feet, hips quiet."]
  },
  hollowHold: {
    name: "Hollow Body Hold",
    type: "time",
    default: 20,
    cues: ["Lower back pressed into floor.", "Arms/legs long."]
  },
  jumpLunges: {
    name: "Jump Lunges (each)",
    type: "reps",
    default: 12,
    cues: ["Knee tracks over toes.", "Switch in the air."]
  },
};

// Day templates (A/B/C)
const DAY_A = ["pushups", "pikePushups", "chairDips", "mountainClimbers", "plank"];
const DAY_B = ["invertedRows", "pullups", "splitSquats", "gluteBridge", "sidePlank"];
const DAY_C = ["burpees", "pushups", "jumpSquats", "plankTaps", "hollowHold"];

const WEEK_PHASES = [
  { weeks: [1, 2], rounds: 3, rest: 90, bump: 0 },
  { weeks: [3, 4], rounds: 4, rest: 60, bump: 0.25 },
  { weeks: [5, 6], rounds: 4, rest: 50, bump: 0.5 },
  { weeks: [7, 8], rounds: 5, rest: 40, bump: 0.75 },
];

// Rep/time scaling per phase: default * (1 + bump) and round to friendly numbers
function scaledValue(ex, week) {
  const phase = WEEK_PHASES.find(p => p.weeks.includes(week));
  const base = ex.default * (1 + phase.bump);
  if (ex.type === "reps") return Math.round(base);
  // time – round to nearest 5 sec
  return Math.round(base / 5) * 5;
}

// ---------------------- Utilities ----------------------
const key = (w,d) => `cc_v1_week${w}_day${d}`;

function useLocalStorage(keyName, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(keyName);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(keyName, JSON.stringify(state)); } catch(e){} }, [keyName, state]);
  return [state, setState];
}

// ---------------------- UI ----------------------
export default function CalisthenicsCoach() {
  const [dark, setDark] = useLocalStorage("cc_theme_dark", true);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!dark);
  }, [dark]);

  const [week, setWeek] = useLocalStorage("cc_week", 1);
  const [day, setDay] = useLocalStorage("cc_day", "A");
  const phase = WEEK_PHASES.find(p => p.weeks.includes(week)) || WEEK_PHASES[0];

  const plan = useMemo(() => {
    const list = day === "A" ? DAY_A : day === "B" ? DAY_B : DAY_C;
    return list.map(k => ({ key: k, ...EXERCISES[k], target: scaledValue(EXERCISES[k], week) }));
  }, [day, week]);

  const [rounds, setRounds] = useLocalStorage("cc_rounds", phase.rounds);
  useEffect(() => setRounds(phase.rounds), [phase.rounds, week]);

  const [workSec, setWorkSec] = useLocalStorage("cc_work", 40);
  const [restSec, setRestSec] = useLocalStorage("cc_rest", phase.rest);
  useEffect(() => setRestSec(phase.rest), [phase.rest, week]);

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0); // exercise index within circuit
  const [round, setRound] = useState(1);
  const [mode, setMode] = useState("work");
  const [seconds, setSeconds] = useState(workSec);

  // Auto timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (seconds > 0) return;

    if (mode === "work") {
      setMode("rest");
      setSeconds(restSec);
    } else {
      // advance step or round
      if (step < plan.length - 1) {
        setStep(step + 1);
        setMode("work");
        setSeconds(workSec);
      } else if (round < rounds) {
        setRound(round + 1);
        setStep(0);
        setMode("work");
        setSeconds(workSec);
      } else {
        setRunning(false);
      }
    }
  }, [seconds, mode, step, round, running, plan.length, restSec, workSec, rounds]);

  // progress checkbox per exercise/round
  const [checks, setChecks] = useLocalStorage(key(week, day), {});
  const toggleCheck = (exIndex, r) => {
    const id = `${exIndex}_${r}`;
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8" />
            <h1 className="text-2xl md:text-4xl font-bold">Calisthenics Coach</h1>
          </div>
          <button
            className="px-3 py-2 rounded-2xl border border-neutral-500/30 hover:shadow"
            onClick={() => setDark(!dark)}
            title="Toggle theme"
          >
            {dark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
          </button>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow flex flex-col gap-2">
            <label className="text-sm opacity-80">Week</label>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setWeek(Math.max(1, week - 1))}><ChevronLeft/></button>
              <span className="font-semibold text-xl">{week}</span>
              <button className="btn" onClick={() => setWeek(Math.min(8, week + 1))}><ChevronRight/></button>
            </div>
            <p className="text-xs opacity-70 flex items-center gap-1"><Calendar className="w-4 h-4"/>Phase rounds: {phase.rounds}, rest: {phase.rest}s</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow flex flex-col gap-2">
            <label className="text-sm opacity-80">Day</label>
            <div className="flex gap-2">
              {(["A","B","C"]).map(d => (
                <button key={d} className={`px-4 py-2 rounded-xl border ${day===d?"bg-neutral-900 text-white dark:bg-white dark:text-neutral-900":"bg-transparent"}`} onClick={()=>setDay(d)}>
                  {d}
                </button>
              ))}
            </div>
            <p className="text-xs opacity-70">A: Push & Core · B: Pull & Lower · C: Full Body</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow flex flex-col gap-2">
            <label className="text-sm opacity-80">Rounds</label>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setRounds(Math.max(1, rounds - 1))}><ChevronLeft/></button>
              <span className="font-semibold text-xl">{rounds}</span>
              <button className="btn" onClick={() => setRounds(rounds + 1)}><ChevronRight/></button>
            </div>
            <p className="text-xs opacity-70">Default from phase; adjust if needed.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow flex flex-col gap-2">
            <label className="text-sm opacity-80">Timer (guided circuit)</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center justify-between gap-2">Work
                <input type="number" className="input" value={workSec} onChange={e=>setWorkSec(Math.max(10, Number(e.target.value)||40))}/>
              </label>
              <label className="flex items-center justify-between gap-2">Rest
                <input type="number" className="input" value={restSec} onChange={e=>setRestSec(Math.max(10, Number(e.target.value)||phase.rest))}/>
              </label>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={()=>{setRunning(!running); if(!running){setMode("work"); setSeconds(workSec);} }}>
                {running? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                {running? "Pause" : "Start"}
              </button>
              <button className="btn" onClick={()=>{setRunning(false); setSeconds(workSec); setMode("work"); setStep(0); setRound(1);}}><RotateCcw className="w-4 h-4"/>Reset</button>
            </div>
          </div>
        </div>

        {/* Active Step / Timer */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5"/>
              <span className="uppercase tracking-wide text-xs opacity-70">{mode.toUpperCase()}</span>
            </div>
            <span className="text-sm opacity-70">Round {round}/{rounds}</span>
          </div>
          <div className="mt-2 grid md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <h2 className="text-xl md:text-2xl font-semibold">{plan[step]?.name || "Ready"}</h2>
              <p className="text-sm opacity-70">Up next: {plan[(step+1)%plan.length]?.name}</p>
            </div>
            <div className="flex items-center justify-end">
              <div className="text-5xl md:text-6xl font-bold tabular-nums">{String(Math.max(0, seconds)).padStart(2, "0")}</div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="grid md:grid-cols-2 gap-4">
          {plan.map((ex, i) => (
            <motion.div key={ex.key}
              initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}
              className={`p-5 rounded-2xl shadow bg-white/80 dark:bg-neutral-800 border ${i===step && running ? "border-emerald-500" : "border-transparent"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{i+1}. {ex.name}</h3>
                  <p className="text-sm opacity-70">Target: {ex.type === 'reps' ? `${ex.target} reps` : `${ex.target}s`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn" onClick={()=>setStep(i)} title="Jump to exercise"><Timer className="w-4 h-4"/></button>
                </div>
              </div>

              {/* ASCII diagram / cues */}
              {ex.ascii && (
                <pre className="mt-3 text-xs bg-neutral-900/80 text-neutral-100 rounded-xl p-3 overflow-auto">{ex.ascii}</pre>
              )}
              <ul className="mt-3 grid gap-1 text-sm list-disc pl-5">
                {ex.cues.map((c, idx) => <li key={idx} className="opacity-90">{c}</li>)}
              </ul>

              {/* Check grid */}
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide opacity-70 mb-1 flex items-center gap-1"><ListChecks className="w-4 h-4"/>Mark rounds complete</div>
                <div className="flex gap-2">
                  {Array.from({length: rounds}).map((_, r) => {
                    const id = `${i}_${r+1}`;
                    const done = !!checks[id];
                    return (
                      <button key={id} onClick={()=>toggleCheck(i, r+1)}
                        className={`px-3 py-1 rounded-2xl border ${done?"bg-emerald-500 text-white border-emerald-600":"bg-transparent"}`}
                      >R{r+1}</button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info card */}
        <div className="mt-6 p-5 rounded-2xl bg-white/70 dark:bg-neutral-800 shadow text-sm leading-relaxed">
          <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4"/><span className="font-semibold">How to use</span></div>
          <ol className="list-decimal pl-5 grid gap-1">
            <li>Select <b>Week</b> and <b>Day</b>. Targets auto-scale.</li>
            <li>Set <b>Work/Rest</b> times or keep defaults.</li>
            <li>Press <b>Start</b>. The timer cycles exercises and rounds.</li>
            <li>Check off rounds as you finish. Progress saves locally.</li>
          </ol>
          <div className="flex items-center gap-2 mt-3 opacity-80"><HeartPulse className="w-4 h-4"/>Aim for protein 120–150g/day, sleep 7–8h, hydrate.</div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs opacity-70 mt-6">v1 • Built for your 8-week calisthenics plan</div>
      </div>

      {/* Tailwind helper styles for buttons/inputs */}
      <style>{`
        .btn{ padding: 0.5rem 0.75rem; border-radius: 9999px; border: 1px solid rgba(107,114,128,0.3); display:inline-flex; gap:0.5rem; align-items:center; }
        .btn-primary{ padding: 0.5rem 0.75rem; border-radius: 9999px; background: #111827; color: #fff; display:inline-flex; gap:0.5rem; align-items:center; }
        .input{ width: 5rem; padding: 0.25rem 0.5rem; border-radius: 0.5rem; border: 1px solid rgba(107,114,128,0.3); }
      `}</style>
    </div>
  );
}
