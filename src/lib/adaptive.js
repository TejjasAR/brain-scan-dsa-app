// Light AI — rule-based adaptive engine + Elo-style mastery.
// Pure functions only. No React, no network, no LLM, no API keys.
// Deterministic: same attempts in -> same profile out.

export const BRAIN_TYPES = {
  fast_guesser: {
    id: 'fast_guesser', name: 'Fast Guesser',
    tagline: 'Quick, but you jump before you think.',
    strengths: ['Fast at simple steps', 'Not scared to try', 'Good energy'],
    weakSpot: 'Silly mistakes from rushing. You guess when you should pause for 10 seconds.',
    fix: 'We slow you down on purpose: trace first, answer second. Speed training only after accuracy is solid.',
  },
  deep_thinker: {
    id: 'deep_thinker', name: 'Deep Slow Thinker',
    tagline: 'Slow, but mostly correct. You think deeply.',
    strengths: ['Careful', 'Good logic when you take time', 'Rarely guesses blindly'],
    weakSpot: 'Too slow in a test. You can solve it, but time runs out.',
    fix: 'We keep the deep thinking, and add speed drills in small steps. Same idea, less time, bit by bit.',
  },
  pattern_spotter: {
    id: 'pattern_spotter', name: 'Pattern Spotter',
    tagline: 'You see the pattern fast.',
    strengths: ['Good at sequences and patterns', 'Sees the trick quickly'],
    weakSpot: 'Memory and focus slip. You forget steps or lose track in long problems.',
    fix: 'We give you pattern problems, but add memory + focus workouts so you do not drop steps.',
  },
  memorizer: {
    id: 'memorizer', name: 'Memorizer',
    tagline: 'You remember formulas, but new problems feel hard.',
    strengths: ['Good memory', 'Knows formulas and steps you have seen'],
    weakSpot: 'New problems feel blank. You try to recall instead of thinking from scratch.',
    fix: 'We teach Why Chain and Reverse It: start from what you know, build the new idea in small chunks.',
  },
  panic_freezer: {
    id: 'panic_freezer', name: 'Panic Freezer',
    tagline: 'You know it, but you freeze in a test.',
    strengths: ['Knows more than your score shows', 'Good when calm'],
    weakSpot: 'Under time pressure you go blank, even on easy questions.',
    fix: 'We start very easy, give small wins, and slowly add time pressure. Confidence first, speed second.',
  },
}

// attempts: [{ questionId, bucket, correct (bool|null), timeMs, round, type }]
// questions are looked up by caller; this function only needs bucket + correct + time.
export function scoreScan(attempts) {
  const buckets = ['logic', 'pattern', 'memory', 'focus', 'speed']
  const byBucket = {}
  buckets.forEach((b) => { byBucket[b] = { total: 0, correct: 0, timeMs: 0, timed: 0 } })
  let totalScored = 0, totalCorrect = 0, totalTime = 0, timedCount = 0
  let fastGuesses = 0, slowCorrect = 0, givesUp = 0

  for (const a of attempts || []) {
    if (a.correct === null || a.correct === undefined) continue
    const b = byBucket[a.bucket] || byBucket.logic
    b.total += 1; b.correct += a.correct ? 1 : 0
    totalScored += 1; totalCorrect += a.correct ? 1 : 0
    if (typeof a.timeMs === 'number' && a.timeMs > 0) {
      b.timeMs += a.timeMs; b.timed += 1; totalTime += a.timeMs; timedCount += 1
      if (a.timeMs < 5000 && !a.correct) fastGuesses += 1
      if (a.timeMs > 25000 && a.correct) slowCorrect += 1
    }
    if (a.gaveUp) givesUp += 1
  }
  const profile = {}
  buckets.forEach((b) => {
    const s = byBucket[b]
    profile[b] = s.total ? Math.round((s.correct / s.total) * 100) : 50
    profile[b + 'AvgSec'] = s.timed ? Math.round(s.timeMs / s.timed / 1000) : 0
  })
  profile.accuracy = totalScored ? Math.round((totalCorrect / totalScored) * 100) : 0
  profile.avgSec = timedCount ? Math.round(totalTime / timedCount / 1000) : 0
  profile.fastGuesses = fastGuesses
  profile.slowCorrect = slowCorrect
  profile.totalScored = totalScored

  // Brain type — deterministic rules, in priority order.
  let brainType = 'pattern_spotter'
  const { logic, pattern, memory, focus } = profile
  if (profile.avgSec <= 12 && profile.accuracy < 60 && fastGuesses >= 3) brainType = 'fast_guesser'
  else if (profile.avgSec >= 22 && profile.accuracy >= 60) brainType = 'deep_thinker'
  else if (pattern >= 65 && memory < 55) brainType = 'pattern_spotter'
  else if (memory >= 65 && logic < 55) brainType = 'memorizer'
  else if (focus < 50 && profile.accuracy < 65) brainType = 'panic_freezer'
  else if (pattern >= logic && pattern >= 60) brainType = 'pattern_spotter'
  else if (memory >= 60) brainType = 'memorizer'
  else brainType = 'deep_thinker'

  // Starting level 1-5. Lower accuracy / focus -> start easier.
  let startingLevel = 3
  if (profile.accuracy >= 80) startingLevel = 4
  else if (profile.accuracy >= 65) startingLevel = 3
  else if (profile.accuracy >= 45) startingLevel = 2
  else startingLevel = 1
  if (brainType === 'panic_freezer') startingLevel = Math.max(1, startingLevel - 1)

  const chunkSize = startingLevel <= 2 ? 1 : startingLevel === 3 ? 2 : 3
  return { profile, brainType: BRAIN_TYPES[brainType], startingLevel, chunkSize }
}

// target: string from scan, e.g. 'service' | 'product' | 'gate' | 'master'
// Returns ordered chunk ids (topic order + level ordering is handled by caller via dsaChunks order).
export function generateRoadmap(profile, target, allChunkIds) {
  const ids = [...(allChunkIds || [])]
  // Pattern spotters start with Two Pointers earlier; memorizers start with Arrays basics + Why Chain.
  // We keep it simple and deterministic: reorder by brain type via profile hints.
  // Caller passes ids in canonical order; we return a roadmap object, not a re-sort that breaks prerequisites.
  // Instead, roadmap = stages with a recommended starting point and pace.
  const pace = profile.accuracy >= 70 ? 'fast' : profile.accuracy >= 50 ? 'steady' : 'slow'
  const dailyGoalMin = pace === 'fast' ? 15 : 10
  return {
    stages: [
      { id: 'foundation', name: 'Foundation', desc: 'Think in small steps. Arrays + Strings, one chunk at a time.' },
      { id: 'thinking', name: 'Thinking', desc: 'Two Pointers + Hashing. Use Why Chain, Reverse It, Teach-Back on every problem.' },
      { id: 'mastery', name: 'Mastery', desc: 'Stack / Queue + Linked List basics. Mixed revision + weekly re-scan.' },
    ],
    chunkIds: ids,
    pace,
    dailyGoalMin,
    target: target || 'master',
    // starting index: slower starters repeat Foundation chunks first (caller uses startingLevel)
    startAtIndex: 0,
  }
}

// Elo-like mastery update. mastery 0-100, correct bool, timeMs, avgTimeMs (expected time for this level).
// Returns { mastery, difficultyDelta, message }
export function updateMastery(currentMastery, correct, timeMs, avgTimeMs) {
  const m = typeof currentMastery === 'number' ? currentMastery : 0
  const expected = typeof avgTimeMs === 'number' && avgTimeMs > 0 ? avgTimeMs : 20000
  const fast = typeof timeMs === 'number' && timeMs > 0 && timeMs < expected * 0.8
  const slow = typeof timeMs === 'number' && timeMs > expected * 1.5
  let next = m
  let difficultyDelta = 0
  let message = ''
  if (correct && fast) { next = Math.min(100, m + 12); difficultyDelta = 1; message = 'Fast and correct — level up. Next chunk gets a little harder.' }
  else if (correct && !slow) { next = Math.min(100, m + 8); difficultyDelta = 0; message = 'Correct. Steady progress.' }
  else if (correct && slow) { next = Math.min(100, m + 5); difficultyDelta = 0; message = 'Correct, but slow. Next chunk stays at this level — speed will come bit by bit.' }
  else if (!correct && slow) { next = Math.max(0, m - 4); difficultyDelta = -1; message = 'Not yet. Let us break this into a smaller chunk.' }
  else { next = Math.max(0, m - 7); difficultyDelta = -1; message = 'Wrong and fast — pause and trace first. Smaller chunk next.' }
  return { mastery: next, difficultyDelta, message }
}

export function nextChunk(roadmap, progress) {
  const completed = new Set((progress && progress.completedChunkIds) || [])
  const ids = (roadmap && roadmap.chunkIds) || []
  for (const id of ids) if (!completed.has(id)) return id
  return null
}

export function masteryForTopic(allMastery, topic) {
  return (allMastery && typeof allMastery[topic] === 'number') ? allMastery[topic] : 0
}
