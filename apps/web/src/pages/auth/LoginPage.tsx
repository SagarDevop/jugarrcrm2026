import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Mail, Lock, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'sales'>('admin');
  const [email, setEmail] = useState('sagar@jugarr.in');
  const [password, setPassword] = useState('sagarjugarr2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'admin' | 'sales') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setEmail('sagar@jugarr.in');
      setPassword('sagarjugarr2026');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.user, res.organization, res.accessToken);

      const targetPath = res.user.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/sales/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F5F6F8] font-sans overflow-hidden">
      {/* Left Column: Jugarr Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 bg-gradient-to-br from-[#FCF8F8] via-[#F8F3F3] to-[#F1E8E9] border-r border-[#E8DFDF] overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Identity */}
        <div className="relative z-10 space-y-6">
          {/* Jugarr Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#7F1D1D] border-2 border-[#991B1B] shadow-xl flex items-center justify-center text-white">
            <svg
              className="w-9 h-9"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M24 13V22.5C24 25.5 21.8 28 18.5 28C15.2 28 13 25.5 13 23"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="24" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
              Jugarr
            </h1>
            <p className="text-xs uppercase font-bold tracking-widest text-[#991B1B] mt-1">
              Agency Operating System & CRM
            </p>
          </div>

          <p className="text-sm text-[#4B5563] max-w-md leading-relaxed">
            Experience the perfect blend of functionality, speed, and profitability control with Jugarr, your one-stop-shop for all things agency operations, client directory, and sales intelligence.
          </p>
        </div>

        {/* Bottom Decorative Isometric Grid with Glowing Red Accent Key */}
        <div className="relative z-10 pt-16">
          <div className="w-full max-w-md">
            {/* 3D Keyboard / Modular SaaS Grid pattern matching the reference screenshot */}
            <div className="grid grid-cols-8 gap-2 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-lg">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 rounded-lg transition-all duration-300 ${
                    i === 31
                      ? 'bg-gradient-to-tr from-[#DC2626] to-[#991B1B] shadow-md shadow-red-500/40 scale-105'
                      : i === 22 || i === 23
                      ? 'bg-red-100/70 border border-red-200/60'
                      : 'bg-[#ECEFF3] border border-[#E2E6EC]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-3 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live MongoDB Atlas Connected
              </span>
              <span className="font-semibold text-[#991B1B]">Jugarr Enterprise 2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Clean White Sign-in Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white">
        <div className="w-full max-w-md space-y-7">
          {/* Form Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Welcome back! <span className="inline-block animate-bounce">👋</span>
            </h2>
            <p className="text-xs text-[#6B7280]">
              Discover the power of Jugarr AgencyOS & CRM
            </p>
          </div>

          {/* Quick Profile Selector (Admin vs Sales) */}
          <div className="flex items-center gap-2 p-1.5 bg-[#F5F6F8] rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-[#991B1B] shadow-sm border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <ShieldCheck size={14} className={selectedRole === 'admin' ? 'text-[#991B1B]' : 'text-gray-400'} />
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('sales')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'sales'
                  ? 'bg-white text-[#991B1B] shadow-sm border border-[#E5E7EB]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <UserCheck size={14} className={selectedRole === 'sales' ? 'text-[#991B1B]' : 'text-gray-400'} />
              Sales Member
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#374151]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-[#FFFFFF] border border-[#D1D5DB] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#374151]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#FFFFFF] border border-[#D1D5DB] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B] transition-all"
                />
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => alert('Please contact the agency super administrator to reset your password.')}
                className="text-xs text-[#6B7280] hover:text-[#991B1B] transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Action Button in Dark Red */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#B91C1C] via-[#991B1B] to-[#7F1D1D] hover:from-[#991B1B] hover:to-[#450A0A] text-white text-xs font-bold rounded-lg shadow-md shadow-red-900/20 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Jugarr</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="text-center pt-2">
            <p className="text-xs text-[#6B7280]">
              Don't have an account?{' '}
              <span className="text-[#991B1B] font-semibold cursor-pointer hover:underline">
                Contact Super Admin
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
