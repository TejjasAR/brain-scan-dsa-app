import { useState, useEffect, useRef } from 'react'
import { scanQuestions } from '../data/scanQuestions.js'

export default function Scan({ onFinish, onExit }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [typed, setTyped] = useState('')
  const [attempts, setAttempts] = useState([])
  const [showRoundResult, setShowRoundResult] = useState(false)
  const [roundScore, setRoundScore] = useState(null)
  const startRef = useRef(Date.now())
  const q = scanQuestions[index]

  useEffect(() => { startRef.current = Date.now(); setSelected(null); setTyped('') }, [index])

  function isCorrect() {
    if (q.answer === null || q.answer === undefined) return null
    if (q.type === 'mcq') return selected === q.answer
    const t = typed.trim().toLowerCase()
    return t === String(q.answerText || '').trim().toLowerCase()
  }
  function next() {
    const correct = isCorrect()
    const timeMs = Date.now() - startRef.current
    const attempt = { questionId: q.id, bucket: q.bucket, correct, timeMs, round: q.round, type: q.type, choice: q.type === 'mcq' ? selected : typed, profileValue: q.profileMap ? q.profileMap[selected ?? 0] : null }
    const all = [...attempts, attempt]
    setAttempts(all)
    const isRoundEnd = index === 14 || index === 29
    if (isRoundEnd) {
      const roundAttempts = all.filter((a) => a.round === q.round && a.correct !== null)
      const c = roundAttempts.filter((a) => a.correct).length
      setRoundScore({ correct: c, total: roundAttempts.length || 1, round: q.round })
      setShowRoundResult(true)
      return
    }
    if (index + 1 >= scanQuestions.length) { onFinish(all); return }
    setIndex(index + 1)
  }
  function continueAfterRound() {
    setShowRoundResult(false)
    if (index + 1 >= scanQuestions.length) { onFinish(attempts); return }
    setIndex(index + 1)
  }
  if (showRoundResult && roundScore) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 text-center">
        <h2 className="text-2xl font-bold">Round {roundScore.round} done!</h2>
        <p className="mt-2 text-lg">You got {roundScore.correct} / {roundScore.total} right in this round.</p>
        <p className="mt-2 text-slate-600">Small win. Keep going — the next round is shorter in your head than it looks.</p>
        <button onClick={continueAfterRound} className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continue to Round {roundScore.round + 1} →</button>
      </div>
    )
  }
  const roundLabel = q.round === 1 ? 'Round 1 — Logic & Pattern' : q.round === 2 ? 'Round 2 — Memory, Speed & Focus' : 'Round 3 — How You Learn + Your Target'
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between text-sm mb-2"><span>{roundLabel}</span><span>{index + 1} / 50</span></div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-4"><div className="h-full bg-blue-600" style={{ width: `${((index + 1) / 50) * 100}%` }} /></div>
      <div className="bg-white rounded-2xl shadow p-5">
        <p className="text-lg font-semibold mb-4">{q.question}</p>
        {q.type === 'mcq' ? (
          <div className="space-y-2">{q.options.map((opt, i) => (
            <button key={i} onClick={() => setSelected(i)} className={`w-full text-left px-4 py-3 rounded-xl border ${selected === i ? 'bg-blue-600 text-white' : 'bg-white border-slate-300'}`}>{opt}</button>
          ))}</div>
        ) : (
          <input value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') next() }} placeholder="Type your answer…" className="w-full px-4 py-3 rounded-xl border border-slate-300" />
        )}
        <p className="text-xs text-slate-500 mt-3">No hard fail on time. We record how long you take — that tells us about your thinking, not just your answer.</p>
        <button onClick={next} disabled={q.type === 'mcq' ? selected === null : !typed.trim()} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-40">{index + 1 === 50 ? 'Finish scan →' : 'Next →'}</button>
        <button onClick={onExit} className="mt-2 w-full text-slate-500 py-2 text-sm">Save &amp; exit for now</button>
      </div>
    </div>
  )
}
