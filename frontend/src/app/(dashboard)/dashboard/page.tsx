'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — Dashboard Page (Modern, Rich Aesthetics)
// ═══════════════════════════════════════════════════════════

import { Quote, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out">
        
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/40 border border-slate-700/50 text-slate-400 text-xs font-medium tracking-wide shadow-sm">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>QA Forge Workspace</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-16">
          Welcome back,<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-sm">
            {user?.name?.split(' ')[0] || 'Tester'}.
          </span>
        </h1>

        <div className="relative max-w-2xl px-8">
          <Quote className="absolute -top-8 -left-4 w-12 h-12 text-slate-700/30 rotate-180" />
          <Quote className="absolute -bottom-8 -right-4 w-12 h-12 text-slate-700/30" />
          
          <p className="text-xl sm:text-2xl md:text-3xl font-light text-slate-300 leading-relaxed tracking-wide italic">
            "Pretty good testing is easy to do.<br/>
            <span className="font-medium text-white drop-shadow-md">Excellent testing</span> is quite hard to do."
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-4 opacity-80">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-slate-600" />
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
              James Bach
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-slate-600" />
          </div>
        </div>

      </div>
    </div>
  );
}
