import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { login, signup, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      alert('Success');
    } catch (e: any) {
      alert(e?.message ?? 'Failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>{mode === 'login' ? 'Log in' : 'Sign up'}</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input type='email' value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input type='password' value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type='submit' disabled={loading}>
          {loading ? 'Please wait…' : (mode === 'login' ? 'Log in' : 'Sign up')}
        </button>
      </form>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          Switch to {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  );
}