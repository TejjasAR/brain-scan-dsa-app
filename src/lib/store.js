// Local-first store. Works fully offline with localStorage.
// If VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set, best-effort sync to Supabase.
// No keys = no network calls, no errors.
import { createClient } from '@supabase/supabase-js'

const KEY = 'brainscan-v1'
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabaseConfigured = Boolean(url && anon && !url.includes('your-project'))
export const supabase = supabaseConfigured ? createClient(url, anon) : null

const emptyState = () => ({
  scanAttempts: [], scanDone: false, scanProfile: null, brainType: null, startingLevel: 3,
  target: '', learningStyle: '',
  completedChunkIds: [], mastery: {}, level: 1, xp: 0, streak: 0, lastVisitDate: '',
  workoutDoneIds: [], rescanAttempts: [], rescanDone: false, createdAt: new Date().toISOString(),
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) }
  } catch { return emptyState() }
}
export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  return state
}
export function resetState() { try { localStorage.removeItem(KEY) } catch {} return emptyState() }

// Best-effort Supabase sync — never blocks the UI, never throws.
export async function syncToSupabase(state) {
  if (!supabase) return { ok: false, reason: 'not-configured' }
  try {
    const { error } = await supabase.from('brain_scan_results').upsert({
      id: 'local-user', profile: state.scanProfile || {}, brain_type: state.brainType?.id || null,
      starting_level: state.startingLevel, target: state.target || null, updated_at: new Date().toISOString(),
    })
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (e) { return { ok: false, reason: String(e?.message || e) } }
}
export async function saveAttemptsToSupabase(attempts) {
  if (!supabase || !attempts?.length) return { ok: false, reason: 'not-configured' }
  try {
    const rows = attempts.map((a) => ({ question_id: a.questionId, bucket: a.bucket, correct: a.correct, time_ms: a.timeMs || null, created_at: new Date().toISOString() }))
    const { error } = await supabase.from('attempts').insert(rows)
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (e) { return { ok: false, reason: String(e?.message || e) } }
}
