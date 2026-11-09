import { useState } from 'react'

// LOCAL-ONLY auth for V1 (demo auth, not real auth).
// No server, no Supabase Auth yet, no password is stored or sent anywhere.
// Email + password are accepted locally and only name/email are kept in
// localStorage (brainscan-v1) so the scan can start. Google is a placeholder:
// it asks for name/email and continues locally — it does NOT do real Google OAuth.
export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // login | signup | google | guest
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function displayNameFromEmail(e) {
    const local = String(e || '').split('@')[0] || 'Friend'
    return local.charAt(0).toUpperCase() + local.slice(1)
  }
  function submit(e) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Enter a valid email.'); return }
    if (password.length < 4) { setError('Password needs at least 4 characters.'); return }
    if (mode === 'signup' && !name.trim()) { setError('Tell us your first name.'); return }
    // Password is NOT stored. Local demo auth only.
    onAuth({
      name: mode === 'signup' ? name.trim() : displayNameFromEmail(email),
      email: email.trim(),
      authMethod: 'local',
      createdAt: new Date().toISOString(),
    })
  }
  function submitGoogle(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.includes('@')) { setError('Enter your name and a valid email.'); return }
    onAuth({ name: name.trim(), email: email.trim(), authMethod: 'google-local', createdAt: new Date().toISOString() })
  }
  function submitGuest(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Tell us your first name.'); return }
    onAuth({ name: name.trim(), email: '', authMethod: 'guest', createdAt: new Date().toISOString() })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <p className="text-3xl font-black text-slate-900">SochCode</p>
        <p className="mt-2 text-slate-600">Soch pehle, code baad mein.</p>

        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 text-left shadow-sm">
          {mode === 'guest' ? (
            <form onSubmit={submitGuest}>
              <h2 className="text-lg font-bold">Continue as guest</h2>
              <p className="text-sm text-slate-500 mt-1">Just your first name. No email needed.</p>
              <label className="block text-sm font-medium mt-4">First name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <button type="submit" className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continue →</button>
              <button type="button" onClick={() => setMode('login')} className="mt-3 w-full text-sm text-slate-500 py-2">Back to login</button>
            </form>
          ) : mode === 'google' ? (
            <form onSubmit={submitGoogle}>
              <h2 className="text-lg font-bold">Continue with Google</h2>
              <p className="text-sm text-slate-500 mt-1">Local demo in V1 — enter your name and email to continue. No real Google sign-in yet.</p>
              <label className="block text-sm font-medium mt-4">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              <label className="block text-sm font-medium mt-4">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <button type="submit" className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Continue →</button>
              <button type="button" onClick={() => setMode('login')} className="mt-3 w-full text-sm text-slate-500 py-2">Back to login</button>
            </form>
          ) : (
            <form onSubmit={submit}>
              <h2 className="text-lg font-bold">{mode === 'signup' ? 'Create your account' : 'Log in'}</h2>
              {mode === 'signup' && (<>
                <label className="block text-sm font-medium mt-4">First name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              </>)}
              <label className="block text-sm font-medium mt-4">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              <label className="block text-sm font-medium mt-4">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300" />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              <button type="submit" className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-bold">{mode === 'signup' ? 'Sign up →' : 'Log in →'}</button>
              <button type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} className="mt-3 w-full text-sm text-blue-600 py-2">
                {mode === 'signup' ? 'Already have an account? Log in' : "New here? Sign up"}
              </button>
              <button type="button" onClick={() => { setError(''); setMode('google') }} className="mt-1 w-full bg-white border border-slate-300 py-3 rounded-xl font-bold text-sm">Continue with Google</button>
              <button type="button" onClick={() => { setError(''); setMode('guest') }} className="mt-2 w-full text-sm text-slate-500 py-2">Continue as guest →</button>
            </form>
          )}
          <p className="text-xs text-slate-400 mt-4 text-center">V1 demo login — saved only in this browser. No real account yet.</p>
        </div>
      </div>
    </div>
  )
}
