import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login gagal');
        return;
      }
      login(data.token, data.user);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Semua field harus diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registrasi gagal');
        return;
      }
      login(data.token, data.user);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-primary/20 px-6 py-4 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary" aria-hidden="true">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">Zenith</h2>
        </div>
        <div className="hidden md:flex gap-6">
          <button type="button" className="text-sm font-medium hover:text-primary transition-colors">Features</button>
          <button type="button" className="text-sm font-medium hover:text-primary transition-colors">Pricing</button>
          <button type="button" className="text-sm font-medium hover:text-primary transition-colors">Resources</button>
        </div>
      </header>
      
      {/* Main Content: Centered Auth Card */}
      <main className="flex-grow flex items-center justify-center p-6 bg-background-dark">
        <div className="w-full max-w-md bg-white dark:bg-[#181736] rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-primary/10">
          
          {/* Header in Card */}
          <div className="relative h-24 bg-primary overflow-hidden">
            <div className="absolute inset-0 bg-primary"></div>
            <div className="absolute bottom-4 left-6">
              <h1 className="text-xl font-bold text-white">
                {activeTab === 'login' ? 'Welcome back' : 'Buat Akun Baru'}
              </h1>
              <p className="text-primary-100 dark:text-slate-300 text-sm">
                {activeTab === 'login' ? 'Empowering your productivity' : 'Mulai perjalanan fitnessmu'}
              </p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-primary/20">
            <button 
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'login' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}
              onClick={() => { setActiveTab('login'); setError(''); }}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'register' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}
              onClick={() => { setActiveTab('register'); setError(''); }}
            >
              Sign Up
            </button>
          </div>
          
          {/* Form Content */}
          <div className="p-8">
            <div className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium px-4 py-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">error</span>
                  {error}
                </div>
              )}

              {/* Name Field (Sign Up only) */}
              {activeTab === 'register' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">Nama Lengkap</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" aria-hidden="true">person</span>
                    <input 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-[#100f23] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                      id="name" 
                      placeholder="John Doe" 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" aria-hidden="true">mail</span>
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-[#100f23] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                    id="email" 
                    placeholder="name@company.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
                  {activeTab === 'login' && (
                    <button type="button" className="text-xs text-primary font-semibold hover:underline">Forgot?</button>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl" aria-hidden="true">lock</span>
                  <input 
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-[#100f23] text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'login' ? handleLogin() : handleRegister())}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-xl" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Submit Button */}
              <button 
                className={`w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all shadow-lg shadow-primary/20 transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="button"
                disabled={loading}
                onClick={activeTab === 'login' ? handleLogin : handleRegister}
              >
                {loading && <span className="material-symbols-outlined text-lg animate-spin" aria-hidden="true">progress_activity</span>}
                {activeTab === 'login' ? 'Sign In' : 'Buat Akun'}
              </button>
            </div>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-primary/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#181736] px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>
            
            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-primary/20 rounded-lg hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors" aria-label="Sign in with Google">
                <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-primary/20 rounded-lg hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors" aria-label="Sign in with Apple">
                <svg className="size-5 fill-slate-900 dark:fill-white" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.05 20.28c-.96.95-2.05 1.72-3.41 1.72-1.31 0-1.74-.83-3.32-.83-1.58 0-2.06.81-3.32.83-1.31.02-2.56-1.01-3.54-2.39-2.01-2.81-1.54-7.23.94-10.23 1.23-1.49 2.8-2.34 4.31-2.34 1.15 0 2.24.78 2.95.78.7 0 2.04-.95 3.43-.95 1.58 0 2.76.58 3.5 1.63-3.1 1.83-2.6 5.86.51 7.21-.68 1.63-1.59 3.25-3.05 4.57zM12.03 5.43c-.02-2.43 1.95-4.48 4.34-4.54.26 2.5-2.22 4.71-4.34 4.54z"></path>
                </svg>
                <span className="text-sm font-medium">Apple</span>
              </button>
            </div>
          </div>
          
          {/* Footer Section */}
          <div className="px-8 pb-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              By continuing, you agree to Zenith's <button type="button" className="text-primary hover:underline">Terms of Service</button> and <button type="button" className="text-primary hover:underline">Privacy Policy</button>.
            </p>
          </div>
        </div>
      </main>
      
      {/* Simple Page Footer */}
      <footer className="py-6 px-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-primary/10">
        <div className="text-slate-500 dark:text-slate-400 text-xs">
          © 2024 Zenith Productivity Inc.
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <button type="button" className="hover:text-primary">Support</button>
          <button type="button" className="hover:text-primary">API Documentation</button>
          <button type="button" className="hover:text-primary">Status</button>
        </div>
      </footer>
    </div>
  )
}

export default Login;
