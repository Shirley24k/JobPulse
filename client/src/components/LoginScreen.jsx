import React, { useState } from 'react';
import { Briefcase, LockKeyhole, UserRound } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <form onSubmit={submit} className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">JobPulse</h1>
            <p className="text-xs text-slate-400">Private career tracker</p>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Sign in</h2>
        <p className="text-sm text-slate-400 mb-6">Your applications and email settings are private.</p>

        <label className="block text-xs font-semibold text-slate-300 mb-2">Username</label>
        <div className="relative mb-4">
          <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500" required />
        </div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
        <div className="relative mb-6">
          <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500" required />
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
