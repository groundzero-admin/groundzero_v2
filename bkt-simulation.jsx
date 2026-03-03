import { useState, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

// ── BKT Engine ──────────────────────────────────────────────────
function updateBKT(state, correct, responseTimeMs, aiInteraction = "none") {
  const params = state.params;
  let pL = state.pLearned;

  // Upgrade 5: Forgetting decay
  if (state.lastPracticeTime) {
    const hoursSince = (Date.now() - state.lastPracticeTime) / (1000 * 60 * 60);
    const daysSince = hoursSince / 24;
    if (daysSince > 0.01) {
      const decay = Math.exp(-daysSince / state.stability);
      pL = params.pL0 + (pL - params.pL0) * decay;
    }
  }

  // Upgrade 1: Response time weighting
  const baseline = state.avgResponseTime || 8000;
  const speedRatio = responseTimeMs / baseline;
  let weight = 1.0;
  if (correct) {
    if (speedRatio < 0.7) weight = 1.4;
    else if (speedRatio > 1.5) weight = 0.5;
  } else {
    if (speedRatio < 0.5) weight = 0.6;
    else if (speedRatio > 1.5) weight = 1.3;
  }

  // Bayesian posterior update
  let pLGivenObs;
  if (correct) {
    const pCorrectGivenL = (1 - params.pS);
    const pCorrectGivenNotL = params.pG;
    const pCorrect = pL * pCorrectGivenL + (1 - pL) * pCorrectGivenNotL;
    pLGivenObs = (pL * pCorrectGivenL) / pCorrect;
  } else {
    const pWrongGivenL = params.pS;
    const pWrongGivenNotL = (1 - params.pG);
    const pWrong = pL * pWrongGivenL + (1 - pL) * pWrongGivenNotL;
    pLGivenObs = (pL * pWrongGivenL) / pWrong;
  }

  // Apply weight (blend toward/away from observation-based update)
  pLGivenObs = pL + (pLGivenObs - pL) * weight;
  pLGivenObs = Math.max(0.001, Math.min(0.999, pLGivenObs));

  // Upgrade 2: Dynamic P(T)
  let pT = params.pT;
  if (aiInteraction === "hint") pT = Math.min(0.4, pT * 1.5);
  else if (aiInteraction === "conversation") pT = Math.min(0.5, pT * 2.2);

  // Learning transition
  const pLNew = pLGivenObs + (1 - pLGivenObs) * pT;

  // Upgrade 3: Stuck detection
  const newConsecutiveFailures = correct ? 0 : state.consecutiveFailures + 1;
  const isStuck = newConsecutiveFailures >= 4;

  // Update stability (Upgrade 5)
  let newStability = state.stability;
  if (correct && pLNew > 0.7) {
    newStability = Math.min(60, state.stability * 1.5);
  }

  // Rolling avg response time
  const newAvgRT = state.avgResponseTime
    ? state.avgResponseTime * 0.8 + responseTimeMs * 0.2
    : responseTimeMs;

  return {
    ...state,
    pLearned: Math.max(0.001, Math.min(0.999, pLNew)),
    attempts: state.attempts + 1,
    correct: state.correct + (correct ? 1 : 0),
    consecutiveFailures: newConsecutiveFailures,
    isStuck,
    lastPracticeTime: Date.now(),
    stability: newStability,
    avgResponseTime: newAvgRT,
    lastUpdate: {
      correct,
      responseTimeMs,
      aiInteraction,
      speedRatio: speedRatio.toFixed(2),
      weight: weight.toFixed(2),
      pLBefore: pL,
      pLAfterBayes: pLGivenObs,
      pLAfterLearn: pLNew,
    },
  };
}

// ── Skill Definitions ───────────────────────────────────────────
const SKILLS = [
  { id: "FD05", name: "Equivalent Fractions", params: { pL0: 0.10, pT: 0.20, pG: 0.25, pS: 0.10 } },
  { id: "FD07", name: "Adding Fractions", params: { pL0: 0.05, pT: 0.15, pG: 0.25, pS: 0.10 } },
  { id: "FD09", name: "Multiplying Fractions", params: { pL0: 0.03, pT: 0.12, pG: 0.25, pS: 0.12 } },
  { id: "AL04", name: "Algebraic Expressions", params: { pL0: 0.05, pT: 0.15, pG: 0.25, pS: 0.10 } },
  { id: "GE14", name: "Triangle Properties", params: { pL0: 0.08, pT: 0.18, pG: 0.25, pS: 0.10 } },
];

const STUDENT_PROFILES = {
  weak: { name: "Aarav (Weak)", description: "Struggles with fractions, guesses often, slow learner", modifier: { pL0Mult: 0.5, pTMult: 0.7 } },
  average: { name: "Priya (Average)", description: "Some foundation, steady learner, occasional gaps", modifier: { pL0Mult: 1.0, pTMult: 1.0 } },
  strong: { name: "Vikram (Strong)", description: "Good foundation, fast learner, minor gaps", modifier: { pL0Mult: 2.0, pTMult: 1.3 } },
};

function initSkillState(skill, profile) {
  const mod = STUDENT_PROFILES[profile].modifier;
  return {
    skillId: skill.id,
    skillName: skill.name,
    pLearned: Math.min(0.4, skill.params.pL0 * mod.pL0Mult),
    params: { ...skill.params, pT: skill.params.pT * mod.pTMult },
    attempts: 0,
    correct: 0,
    consecutiveFailures: 0,
    isStuck: false,
    lastPracticeTime: null,
    stability: 7,
    avgResponseTime: null,
    lastUpdate: null,
  };
}

// ── Simulation scenarios ────────────────────────────────────────
function generateAnswer(pL, scenario) {
  const rand = Math.random();
  let correct, responseTime, aiInteraction;

  switch (scenario) {
    case "realistic":
      correct = rand < (pL * 0.85 + 0.15);
      responseTime = correct
        ? 4000 + Math.random() * 8000
        : 6000 + Math.random() * 15000;
      aiInteraction = (!correct && Math.random() < 0.3) ? "hint" : "none";
      break;
    case "struggling":
      correct = rand < (pL * 0.5 + 0.1);
      responseTime = 8000 + Math.random() * 20000;
      aiInteraction = (!correct && Math.random() < 0.5) ? "hint"
        : (!correct && Math.random() < 0.3) ? "conversation" : "none";
      break;
    case "improving":
      correct = rand < Math.min(0.9, pL * 0.7 + 0.35);
      responseTime = Math.max(2000, 10000 - pL * 8000 + Math.random() * 3000);
      aiInteraction = (!correct && Math.random() < 0.4) ? "conversation" : "none";
      break;
    default:
      correct = rand < 0.5;
      responseTime = 8000;
      aiInteraction = "none";
  }

  return { correct, responseTime: Math.round(responseTime), aiInteraction };
}

// ── Colors ──────────────────────────────────────────────────────
const SKILL_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

// ── Component ───────────────────────────────────────────────────
export default function BKTSimulation() {
  const [profile, setProfile] = useState("weak");
  const [scenario, setScenario] = useState("improving");
  const [skills, setSkills] = useState(() => SKILLS.map(s => initSkillState(s, "weak")));
  const [history, setHistory] = useState([]);
  const [activeSkillIdx, setActiveSkillIdx] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(null);
  const questionNumRef = useRef(0);

  const resetSim = useCallback((p) => {
    const prof = p || profile;
    setSkills(SKILLS.map(s => initSkillState(s, prof)));
    setHistory([{
      q: 0,
      ...Object.fromEntries(SKILLS.map((s, i) =>
        [s.id, Math.min(0.4, s.params.pL0 * STUDENT_PROFILES[prof].modifier.pL0Mult)]
      ))
    }]);
    setEventLog([]);
    setActiveSkillIdx(0);
    questionNumRef.current = 0;
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    setIsAutoPlaying(false);
  }, [profile]);

  const simulateOne = useCallback(() => {
    setSkills(prev => {
      const newSkills = [...prev];

      // Pick skill: lowest P(L) that isn't mastered, with some randomness
      let idx = activeSkillIdx;
      const unmasteredIdxs = newSkills
        .map((s, i) => ({ i, pL: s.pLearned }))
        .filter(x => x.pL < 0.95)
        .sort((a, b) => a.pL - b.pL);

      if (unmasteredIdxs.length > 0) {
        // 70% chance weakest, 30% random unmastered
        idx = Math.random() < 0.7
          ? unmasteredIdxs[0].i
          : unmasteredIdxs[Math.floor(Math.random() * unmasteredIdxs.length)].i;
      }

      const skill = newSkills[idx];
      const { correct, responseTime, aiInteraction } = generateAnswer(skill.pLearned, scenario);
      const updated = updateBKT(skill, correct, responseTime, aiInteraction);
      newSkills[idx] = updated;

      questionNumRef.current += 1;
      const qNum = questionNumRef.current;

      // Update history
      setHistory(h => [...h, {
        q: qNum,
        ...Object.fromEntries(newSkills.map(s => [s.skillId, parseFloat(s.pLearned.toFixed(4))]))
      }]);

      // Update log
      const emoji = correct ? "✅" : "❌";
      const aiEmoji = aiInteraction === "conversation" ? " 🤖💬" : aiInteraction === "hint" ? " 💡" : "";
      const stuckEmoji = updated.isStuck ? " 🚨 STUCK" : "";
      const masteredEmoji = updated.pLearned >= 0.95 ? " 🎓 MASTERED!" : "";
      setEventLog(log => [{
        id: qNum,
        text: `Q${qNum}: ${emoji} ${skill.skillName} | P(L): ${(skill.pLearned * 100).toFixed(1)}% → ${(updated.pLearned * 100).toFixed(1)}% | ${(responseTime / 1000).toFixed(1)}s${aiEmoji}${stuckEmoji}${masteredEmoji}`,
        correct,
        aiInteraction,
        isStuck: updated.isStuck,
        mastered: updated.pLearned >= 0.95,
      }, ...log].slice(0, 50));

      setActiveSkillIdx(idx);
      return newSkills;
    });
  }, [scenario, activeSkillIdx]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
      setIsAutoPlaying(false);
    } else {
      autoPlayRef.current = setInterval(() => simulateOne(), 600);
      setIsAutoPlaying(true);
    }
  }, [isAutoPlaying, simulateOne]);

  const allMastered = skills.every(s => s.pLearned >= 0.95);

  if (allMastered && isAutoPlaying) {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = null;
    setIsAutoPlaying(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">BKT Simulation</h1>
            <p className="text-slate-400 text-sm">Watch a student learn in real-time with Bayesian Knowledge Tracing</p>
          </div>
          <div className="flex gap-2">
            {Object.entries(STUDENT_PROFILES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { setProfile(key); resetSim(key); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  profile === key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {val.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6 bg-slate-900 rounded-xl p-4">
          <div className="flex gap-2">
            <span className="text-sm text-slate-400 self-center mr-1">Scenario:</span>
            {[
              { key: "struggling", label: "Struggling", emoji: "😰" },
              { key: "realistic", label: "Realistic", emoji: "📚" },
              { key: "improving", label: "Improving", emoji: "🚀" },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setScenario(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  scenario === s.key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={simulateOne}
            disabled={allMastered}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            Next Question
          </button>
          <button
            onClick={toggleAutoPlay}
            disabled={allMastered}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isAutoPlaying
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white"
            }`}
          >
            {isAutoPlaying ? "⏸ Pause" : "▶ Auto Play"}
          </button>
          <button
            onClick={() => resetSim()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            Reset
          </button>
        </div>

        {allMastered && (
          <div className="mb-4 p-4 bg-emerald-900/50 border border-emerald-700 rounded-xl text-center">
            <span className="text-2xl">🎓</span>
            <span className="text-emerald-300 font-bold ml-2">All skills mastered!</span>
            <span className="text-emerald-400 ml-2">The student has reached 95%+ P(L) on every skill.</span>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Chart - 2 cols */}
          <div className="col-span-2 bg-slate-900 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Mastery Probability P(L) Over Time</h2>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="q" stroke="#64748b" label={{ value: "Questions Answered", position: "insideBottomRight", offset: -5, style: { fill: "#64748b", fontSize: 11 } }} />
                <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 0.95, 1]} stroke="#64748b" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, SKILLS.find(s => s.id === name)?.name || name]}
                  labelFormatter={v => `After Q${v}`}
                />
                <Legend formatter={v => SKILLS.find(s => s.id === v)?.name || v} wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0.95} stroke="#22c55e" strokeDasharray="6 3" label={{ value: "Mastery (95%)", position: "right", style: { fill: "#22c55e", fontSize: 11 } }} />
                {SKILLS.map((s, i) => (
                  <Line key={s.id} type="monotone" dataKey={s.id} stroke={SKILL_COLORS[i]} strokeWidth={2} dot={false} animationDuration={300} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Skill cards - 1 col */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">Skill States</h2>
            {skills.map((s, i) => {
              const pct = (s.pLearned * 100).toFixed(1);
              const mastered = s.pLearned >= 0.95;
              const barColor = mastered ? "bg-emerald-500" : s.isStuck ? "bg-red-500" : s.pLearned > 0.5 ? "bg-indigo-500" : "bg-amber-500";
              return (
                <div key={s.skillId} className={`bg-slate-800 rounded-lg p-3 border ${i === activeSkillIdx ? "border-indigo-500" : "border-slate-700"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: SKILL_COLORS[i] }}>{s.skillName}</span>
                    <span className="text-xs text-slate-400">
                      {s.attempts}Q | {s.correct}✓
                      {s.isStuck && <span className="text-red-400 ml-1">STUCK</span>}
                      {mastered && <span className="text-emerald-400 ml-1">MASTERED</span>}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">P(L) = {pct}%</span>
                    <span className="text-xs text-slate-500">
                      {s.consecutiveFailures > 0 && `${s.consecutiveFailures} fails`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event log */}
        <div className="mt-4 bg-slate-900 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Event Log</h2>
          <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
            {eventLog.length === 0 && (
              <div className="text-slate-500">Click "Next Question" or "Auto Play" to start the simulation...</div>
            )}
            {eventLog.map(e => (
              <div key={e.id} className={`py-1 px-2 rounded ${
                e.mastered ? "bg-emerald-900/30 text-emerald-300"
                : e.isStuck ? "bg-red-900/30 text-red-300"
                : e.correct ? "text-slate-300" : "text-slate-400"
              }`}>
                {e.text}
              </div>
            ))}
          </div>
        </div>

        {/* BKT Math explanation */}
        <div className="mt-4 bg-slate-900 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">What's Happening</h2>
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
            <div>
              <p className="mb-1"><span className="text-indigo-400 font-medium">Correct answer:</span> System asks "did they know it or guess?" Uses Bayes theorem to update P(L). Fast + correct = more credit. Slow + correct = might be guessing.</p>
              <p><span className="text-amber-400 font-medium">Wrong answer:</span> System asks "did they slip or truly not know?" P(L) drops. Slow + wrong = genuine gap. Fast + wrong = careless slip (less penalty).</p>
            </div>
            <div>
              <p className="mb-1"><span className="text-emerald-400 font-medium">Learning transition:</span> After each question, some students who didn't know may have just learned. P(T) determines this chance. AI hints increase P(T) significantly.</p>
              <p><span className="text-red-400 font-medium">Stuck detection:</span> 4+ consecutive failures = system detects practice isn't working. This is where the AI tutor would pop up with a conversation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
