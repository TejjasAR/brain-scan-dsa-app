import { useState, useEffect, useRef } from 'react'

// Generic player for a chunk / workout / scan question.
// Supports MCQ (4 options) and typed answers. Typed answers check:
// - exact match to answerText (case-insensitive, trimmed), OR
// - checkContains: any keyword present (for Teach-Back style answers).
export default function ChunkPlayer({ title, text, example, question, onComplete, buttonLabel = 'Check answer' }) {
  const [selected, setSelected] = useState(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  const startRef = useRef(Date.now())
  useEffect(() => { startRef.current = Date.now(); setSelected(null); setTyped(''); setChecked(false); setCorrect(false) }, [question?.q])

  function checkAnswer() {
    let ok = false
    if (question.type === 'mcq') ok = selected === question.answer
    else {
      const t = typed.trim().toLowerCase()
      if (question.checkContains) ok = question.checkContains.some((k) => t.includes(k.toLowerCase()))
      else if (question.answerText) ok = t === String(question.answerText).trim().toLowerCase()
      else ok = t.length > 2
    }
    setCorrect(ok); setChecked(true)
    const timeMs = Date.now() - startRef.current
    if (onComplete) onComplete({ correct: ok, timeMs })
  }
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      {title && <h3 className="text-xl font-bold mb-3">{title}</h3>}
      {(text || []).map((p, i) => <p key={i} className="mb-2 leading-relaxed">{p}</p>)}
      {example && (
        <div className="bg-slate-900 text-green-100 rounded-xl p-4 my-3 text-sm">
          <div className="font-bold text-white mb-1">Example</div>
          <pre>{example.code}</pre>
          <div className="mt-2 text-slate-300">Trace: {example.trace}</div>
        </div>
      )}
      <div className="mt-4">
        <p className="font-semibold mb-3">{question.q}</p>
        {question.type === 'mcq' ? (
          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <button key={i} disabled={checked} onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${selected === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'} ${checked && i === question.answer ? 'bg-green-100 border-green-600' : ''}`}>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input value={typed} disabled={checked} onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !checked) checkAnswer() }}
            placeholder="Type your answer here…" className="w-full px-4 py-3 rounded-xl border border-slate-300" />
        )}
        {!checked ? (
          <button onClick={checkAnswer} disabled={question.type === 'mcq' ? selected === null : !typed.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold disabled:opacity-40">{buttonLabel}</button>
        ) : (
          <div className={`mt-4 p-4 rounded-xl ${correct ? 'bg-green-50 border border-green-300' : 'bg-amber-50 border border-amber-300'}`}>
            <p className="font-bold">{correct ? '✓ Correct — nice thinking!' : 'Not yet — read this, then try the next chunk.'}</p>
            <p className="mt-1">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
