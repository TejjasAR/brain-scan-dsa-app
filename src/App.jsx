import { useState, useEffect } from 'react'
import Scan from './components/Scan.jsx'
import ChunkPlayer from './components/ChunkPlayer.jsx'
import { scanQuestions, rescanQuestions } from './data/scanQuestions.js'
import { thinkingWorkouts } from './data/thinkingWorkouts.js'
import { dsaChunks, TOPICS } from './data/dsaChunks.js'
import { scoreScan, generateRoadmap, updateMastery, nextChunk } from './lib/adaptive.js'
import { loadState, saveState, resetState, syncToSupabase, saveAttemptsToSupabase, supabaseConfigured } from './lib/store.js'

function Nav({ page, setPage, state }) {
  const items = [['home', 'Home'], ['dashboard', 'Dashboard'], ['roadmap', 'Roadmap'], ['workouts', 'Think'], ['learn', 'Learn DSA'], ['rescan', 'Re-scan']]
  return (
    <header className="bg-white shadow sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <button onClick={() => setPage('home')} className="font-black text-lg text-blue-900">🧠 Brain-Scan DSA</button>
        <nav className="flex gap-1 overflow-x-auto text-sm">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} className={`px-3 py-2 rounded-full whitespace-nowrap ${page === id ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{label}</button>
          ))}
        </nav>
      </div>
      <div className="max-w-4xl mx-auto px-4 pb-2 text-xs text-slate-500">
        {state.scanDone ? `Level ${state.level} • ${state.xp} XP • Streak ${state.streak} days` : 'Free • Text only • No videos'} {supabaseConfigured ? '• Supabase on' : '• Offline mode (localStorage)'}
      </div>
    </header>
  )
}
function MasteryBar({ label, value }) {
  return (<div className="mb-2"><div className="flex justify-between text-sm"><span>{label}</span><span>{value}%</span></div><div className="h-2 bg-slate-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${value}%` }} /></div></div>)
}

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [page, setPage] = useState('home')
  const [learnTopic, setLearnTopic] = useState('Arrays')
  const [learnIndex, setLearnIndex] = useState(0)
  const [workoutIndex, setWorkoutIndex] = useState(0)
  const [rescanIndex, setRescanIndex] = useState(0)
  const [rescanAttempts, setRescanAttempts] = useState([])
  const [rescanSel, setRescanSel] = useState(null)
  const [rescanTyped, setRescanTyped] = useState('')
  const [rescanDone, setRescanDone] = useState(null)

  useEffect(() => { saveState(state) }, [state])
  function update(patch) { setState((s) => ({ ...s, ...patch })) }
  function todayStr() { return new Date().toISOString().slice(0, 10) }
  function bumpStreak(s) {
    if (s.lastVisitDate === todayStr()) return s.streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    return s.lastVisitDate === yesterday ? s.streak + 1 : 1
  }

  async function handleScanFinish(attempts) {
    const { profile, brainType, startingLevel, chunkSize } = scoreScan(attempts)
    const targetAttempt = attempts.find((a) => a.questionId === 'r3-3')
    const styleAttempt = attempts.find((a) => a.questionId === 'r3-1')
    const target = targetAttempt?.profileValue || 'master'
    const roadmap = generateRoadmap(profile, target, dsaChunks.map((c) => c.id))
    const next = { ...state, scanAttempts: attempts, scanDone: true, scanProfile: profile, brainType, startingLevel, target, learningStyle: styleAttempt?.profileValue || '', level: startingLevel, streak: bumpStreak(state), lastVisitDate: todayStr() }
    setState(next); saveState(next)
    saveAttemptsToSupabase(attempts); syncToSupabase(next)
    setPage('result')
  }

  function handleChunkComplete(chunk, result) {
    const topicMastery = state.mastery[chunk.topic] || 0
    const avgTime = 20000
    const upd = updateMastery(topicMastery, result.correct, result.timeMs, avgTime)
    const newMastery = { ...state.mastery, [chunk.topic]: upd.mastery }
    const completed = state.completedChunkIds.includes(chunk.id) ? state.completedChunkIds : [...state.completedChunkIds, chunk.id]
    const levelUp = result.correct && state.level < 5 && completed.length % 3 === 0
    const next = { ...state, mastery: newMastery, completedChunkIds: completed, xp: state.xp + (result.correct ? 10 : 5), level: levelUp ? state.level + 1 : state.level, streak: bumpStreak(state), lastVisitDate: todayStr(), lastFeedback: upd.message }
    setState(next); saveState(next)
  }

  const roadmap = state.scanDone ? generateRoadmap(state.scanProfile || {}, state.target, dsaChunks.map((c) => c.id)) : null
  const nextId = roadmap ? nextChunk(roadmap, state) : null
  const nextChunkObj = dsaChunks.find((c) => c.id === nextId) || dsaChunks[0]
  const topicChunks = dsaChunks.filter((c) => c.topic === learnTopic)
  const currentChunk = topicChunks[learnIndex % topicChunks.length]
  const workout = thinkingWorkouts[workoutIndex % thinkingWorkouts.length]

  return (
    <div className="min-h-screen">
      <Nav page={page} setPage={setPage} state={state} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {page === 'home' && (
          <div>
            <div className="bg-blue-900 text-white rounded-3xl p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Students don&apos;t quit DSA — they quit because they can&apos;t think, yet.</h1>
              <p className="mt-3 text-blue-100 text-lg">First we scan how your brain works. Then we teach you how to think, chunk by chunk. DSA comes after — in small, simple English, no videos.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => setPage(state.scanDone ? 'roadmap' : 'scan')} className="bg-amber-400 text-slate-900 px-6 py-3 rounded-xl font-bold">{state.scanDone ? 'Continue your roadmap →' : 'Start Brain Scan — 50 questions, 15 mins →'}</button>
                <button onClick={() => setPage('learn')} className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold">See a sample chunk</button>
              </div>
              <p className="mt-3 text-sm text-blue-200">Free in V1 • Text only • Answers typed or MCQ • 10 mins a day</p>
            </div>
            <div className="grid md:grid-cols-4 gap-3 mt-5">
              {[
                ['1. Scan', '50 questions in 3 rounds. We learn how you think, not just what you know.'],
                ['2. Your Type', 'Fast Guesser, Deep Thinker, Pattern Spotter, Memorizer or Panic Freezer.'],
                ['3. Think', 'Daily 10-min workouts: Why Chain, Reverse It, Teach-Back.'],
                ['4. Master DSA', 'Arrays → Strings → Two Pointers → Hashing → Stack/Queue → Linked List. Chunk by chunk.'],
              ].map(([t, d]) => (<div key={t} className="bg-white rounded-2xl shadow p-4"><h3 className="font-bold">{t}</h3><p className="text-sm text-slate-600 mt-1">{d}</p></div>))}
            </div>
            <div className="bg-white rounded-2xl shadow p-5 mt-5">
              <h2 className="font-bold text-xl">Free vs Pro (later — not in V1)</h2>
              <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
                <div className="border rounded-xl p-4"><b>Free</b><ul className="list-disc ml-5 mt-2"><li>Brain Scan + Roadmap</li><li>1 thinking workout / day</li><li>1 DSA chunk / day</li><li>Ads later</li></ul></div>
                <div className="border rounded-xl p-4"><b>Pro — ₹99/month (later)</b><ul className="list-disc ml-5 mt-2"><li>Unlimited workouts + chunks</li><li>Full Brain Report</li><li>Weak-area drills + mock tests</li><li>No ads</li></ul></div>
              </div>
              <p className="text-xs text-slate-500 mt-3">V1 has no payments and no ads. Everything here is free to try.</p>
              <button onClick={() => { if (confirm('Reset all progress?')) { const s = resetState(); setState(s); setPage('home') } }} className="mt-4 text-sm text-red-600 underline">Reset my progress</button>
            </div>
          </div>
        )}

        {page === 'scan' && <Scan onFinish={handleScanFinish} onExit={() => setPage('home')} />}

        {page === 'result' && state.brainType && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow p-6 text-center">
              <p className="text-sm text-slate-500">Your Brain Type is</p>
              <h2 className="text-3xl font-black text-blue-900 mt-1">{state.brainType.name}</h2>
              <p className="mt-2 text-lg">{state.brainType.tagline}</p>
              <div className="mt-4 text-left">
                <p className="font-bold">Your scores</p>
                {state.scanProfile && Object.entries({ Logic: state.scanProfile.logic, Pattern: state.scanProfile.pattern, Memory: state.scanProfile.memory, Focus: state.scanProfile.focus, Speed: state.scanProfile.speed }).map(([k, v]) => <MasteryBar key={k} label={k} value={v} />)}
                <p className="text-sm text-slate-600 mt-2">Accuracy {state.scanProfile?.accuracy}% • Avg time {state.scanProfile?.avgSec}s per question • Starting Level {state.startingLevel}</p>
              </div>
              <div className="mt-4 text-left bg-amber-50 rounded-xl p-4">
                <p className="font-bold">Strengths</p><ul className="list-disc ml-5">{state.brainType.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                <p className="font-bold mt-3">Weak spot</p><p>{state.brainType.weakSpot}</p>
                <p className="font-bold mt-3">What your roadmap will do differently</p><p>{state.brainType.fix}</p>
              </div>
              <button onClick={() => setPage('roadmap')} className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">See my personal roadmap →</button>
              <button onClick={() => setPage('workouts')} className="mt-2 w-full bg-white border py-3 rounded-xl font-bold">Start first Thinking Workout</button>
            </div>
          </div>
        )}

        {page === 'roadmap' && (
          <div>
            <h2 className="text-2xl font-bold">Your Roadmap</h2>
            {!state.scanDone ? <div className="bg-white rounded-2xl shadow p-5 mt-4"><p>Do the Brain Scan first — your roadmap is different for everyone.</p><button onClick={() => setPage('scan')} className="mt-3 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold">Start Scan →</button></div> : (
              <div>
                <p className="text-slate-600 mt-1">Type: <b>{state.brainType?.name}</b> • Level {state.level} • Pace: {roadmap.pace} • Target: {state.target} • Daily goal: {roadmap.dailyGoalMin} mins</p>
                <div className="mt-4 space-y-3">
                  {roadmap.stages.map((s, i) => (
                    <div key={s.id} className="bg-white rounded-2xl shadow p-5">
                      <div className="flex justify-between"><h3 className="font-bold">Stage {i + 1}: {s.name}</h3><span className="text-sm bg-blue-100 px-3 py-1 rounded-full">{i === 0 ? 'You are here' : i === 1 ? 'Next' : 'Later'}</span></div>
                      <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl shadow p-5 mt-4">
                  <h3 className="font-bold">Next chunk for you</h3>
                  <p className="mt-1">{nextChunkObj.topic} — {nextChunkObj.title} (Level {nextChunkObj.level}, ~{nextChunkObj.minutes} mins)</p>
                  <button onClick={() => { setLearnTopic(nextChunkObj.topic); setLearnIndex(dsaChunks.filter((c) => c.topic === nextChunkObj.topic).findIndex((c) => c.id === nextChunkObj.id)); setPage('learn') }} className="mt-3 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold">Start next chunk →</button>
                  {state.lastFeedback && <p className="text-sm text-slate-600 mt-2">Last feedback: {state.lastFeedback}</p>}
                </div>
                <div className="bg-white rounded-2xl shadow p-5 mt-4">
                  <h3 className="font-bold mb-3">Mastery per topic</h3>
                  {TOPICS.map((t) => <MasteryBar key={t} label={`${t} ${state.completedChunkIds.filter((id) => dsaChunks.find((c) => c.id === id)?.topic === t).length}/3 done`} value={state.mastery[t] || 0} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {page === 'workouts' && (
          <div>
            <h2 className="text-2xl font-bold">Thinking Workouts — 10 mins a day</h2>
            <p className="text-slate-600 mt-1">Text only. No video. One workout, one idea, one question.</p>
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2">{thinkingWorkouts.map((w, i) => <button key={w.id} onClick={() => setWorkoutIndex(i)} className={`px-3 py-2 rounded-full whitespace-nowrap text-sm ${i === workoutIndex ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{i + 1}. {w.method}</button>)}</div>
            <div className="mt-4">
              <ChunkPlayer key={workout.id} title={`${workout.title} • ${workout.minutes} mins • Level ${workout.level}`} text={workout.text} question={workout.question}
                onComplete={(r) => { if (!state.workoutDoneIds.includes(workout.id)) update({ workoutDoneIds: [...state.workoutDoneIds, workout.id], xp: state.xp + (r.correct ? 10 : 5) }) }} />
              <div className="flex justify-between mt-3">
                <button onClick={() => setWorkoutIndex((workoutIndex + thinkingWorkouts.length - 1) % thinkingWorkouts.length)} className="bg-white border px-4 py-2 rounded-xl">← Prev</button>
                <button onClick={() => setWorkoutIndex((workoutIndex + 1) % thinkingWorkouts.length)} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Next workout →</button>
              </div>
            </div>
          </div>
        )}

        {page === 'learn' && (
          <div>
            <h2 className="text-2xl font-bold">Learn DSA — Chunk by Chunk</h2>
            <p className="text-slate-600 mt-1">One chunk = one small idea + one example + one question. 5–10 mins. No videos.</p>
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2">{TOPICS.map((t) => <button key={t} onClick={() => { setLearnTopic(t); setLearnIndex(0) }} className={`px-3 py-2 rounded-full whitespace-nowrap text-sm ${t === learnTopic ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{t}</button>)}</div>
            <div className="mt-4">
              <ChunkPlayer key={currentChunk.id} title={`${currentChunk.topic} — ${currentChunk.title} • Level ${currentChunk.level} • ~${currentChunk.minutes} mins`} text={currentChunk.text} example={currentChunk.example} question={currentChunk.question} onComplete={(r) => handleChunkComplete(currentChunk, r)} />
              <div className="flex justify-between mt-3">
                <button onClick={() => setLearnIndex((learnIndex + topicChunks.length - 1) % topicChunks.length)} className="bg-white border px-4 py-2 rounded-xl">← Prev chunk</button>
                <button onClick={() => setLearnIndex((learnIndex + 1) % topicChunks.length)} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Next chunk →</button>
              </div>
              <p className="text-sm text-slate-600 mt-3">Completed: {state.completedChunkIds.length} / {dsaChunks.length} chunks • Mastery {learnTopic}: {state.mastery[learnTopic] || 0}%</p>
            </div>
          </div>
        )}

        {page === 'rescan' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold">Weekly Re-scan — 10 questions</h2>
            <p className="text-slate-600 mt-1">Same kind of questions, new numbers. We compare with your first scan.</p>
            {!rescanDone ? (
              <div className="bg-white rounded-2xl shadow p-5 mt-4">
                <p className="font-semibold">{rescanQuestions[rescanIndex].question}</p>
                {rescanQuestions[rescanIndex].type === 'mcq' ? (
                  <div className="space-y-2 mt-3">{rescanQuestions[rescanIndex].options.map((o, i) => <button key={i} onClick={() => setRescanSel(i)} className={`w-full text-left px-4 py-3 rounded-xl border ${rescanSel === i ? 'bg-blue-600 text-white' : ''}`}>{o}</button>)}</div>
                ) : <input value={rescanTyped} onChange={(e) => setRescanTyped(e.target.value)} placeholder="Type your answer…" className="w-full mt-3 px-4 py-3 rounded-xl border" />}
                <button onClick={() => {
                  const q = rescanQuestions[rescanIndex]
                  const correct = q.type === 'mcq' ? rescanSel === q.answer : rescanTyped.trim() === q.answerText
                  const all = [...rescanAttempts, { questionId: q.id, bucket: q.bucket, correct, timeMs: 15000 }]
                  setRescanAttempts(all); setRescanSel(null); setRescanTyped('')
                  if (rescanIndex + 1 >= rescanQuestions.length) {
                    const acc = Math.round((all.filter((a) => a.correct).length / all.length) * 100)
                    const firstAcc = state.scanProfile?.accuracy || 0
                    setRescanDone({ acc, firstAcc, diff: acc - firstAcc })
                    update({ rescanAttempts: all, rescanDone: true })
                  } else setRescanIndex(rescanIndex + 1)
                }} disabled={rescanQuestions[rescanIndex].type === 'mcq' ? rescanSel === null : !rescanTyped.trim()} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-40">{rescanIndex + 1 === 10 ? 'Finish re-scan' : 'Next →'}</button>
                <p className="text-sm text-slate-500 mt-2">{rescanIndex + 1} / 10</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6 mt-4 text-center">
                <h3 className="text-xl font-bold">Re-scan done!</h3>
                <p className="mt-2 text-lg">This week: {rescanDone.acc}% • First scan: {rescanDone.firstAcc}%</p>
                <p className="mt-2">{rescanDone.diff >= 0 ? `+${rescanDone.diff}% better. Your thinking is getting faster and cleaner.` : `${rescanDone.diff}% — no worry. Go back to Thinking Workouts for 10 mins a day, it will come back bit by bit.`}</p>
                <button onClick={() => { setRescanIndex(0); setRescanAttempts([]); setRescanDone(null); setPage('workouts') }} className="mt-4 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold">Back to workouts →</button>
              </div>
            )}
          </div>
        )}

        {page === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[['Level', state.level], ['XP', state.xp], ['Streak', `${state.streak} days`], ['Chunks done', `${state.completedChunkIds.length} / ${dsaChunks.length}`]].map(([k, v]) => <div key={k} className="bg-white rounded-2xl shadow p-4 text-center"><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-black">{v}</p></div>)}
            </div>
            <div className="bg-white rounded-2xl shadow p-5 mt-4">
              <h3 className="font-bold">Daily goal — 10 minutes</h3>
              <p className="text-sm text-slate-600 mt-1">Do 1 workout + 1 chunk today. Small every day beats big once a week.</p>
              <p className="text-sm mt-2">Workouts done: {state.workoutDoneIds.length} / {thinkingWorkouts.length} • Brain Type: {state.brainType?.name || 'Take the scan first'}</p>
              <button onClick={() => setPage(state.scanDone ? 'workouts' : 'scan')} className="mt-3 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold">{state.scanDone ? 'Do today’s 10 mins →' : 'Start Brain Scan →'}</button>
            </div>
            <div className="bg-white rounded-2xl shadow p-5 mt-4">
              <h3 className="font-bold mb-3">Mastery per topic</h3>
              {TOPICS.map((t) => <MasteryBar key={t} label={t} value={state.mastery[t] || 0} />)}
            </div>
          </div>
        )}
      </main>
      <footer className="max-w-4xl mx-auto px-4 pb-8 text-center text-xs text-slate-500">
        Brain-Scan DSA V1 • DSA only • Text only, no videos • Free • Light AI runs in your browser, no API keys • Data stays in your browser unless you connect Supabase.
      </footer>
    </div>
  )
}
