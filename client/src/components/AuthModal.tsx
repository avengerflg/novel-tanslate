import React, { useState } from 'react';
import { X, User, Lock, Mail, Eye, EyeOff, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { loginUser, registerUser, AuthUser } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { user } = await loginUser(username.trim(), password);
        onAuthSuccess(user);
        onClose();
      } else {
        const { user } = await registerUser(username.trim(), email.trim() || undefined, password);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {mode === 'login' ? 'Sign In to DaoReader' : 'Create DaoReader Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Access your private novels, progress, and glossaries'
                  : 'Get a private novel library with personalized translation memory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-medium text-center">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              mode === 'login'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              mode === 'register'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} method="POST" className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Username / Email */}
          <div>
            <label htmlFor="auth-username" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="auth-username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck="false"
                autoCapitalize="none"
                placeholder={mode === 'login' ? 'Username or email' : 'Choose a unique username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Email (only on register) */}
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-email" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck="false"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="auth-password" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="auth-password"
                name={mode === 'login' ? 'password' : 'new-password'}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-500 mt-2">
            {mode === 'login' ? (
              <>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

