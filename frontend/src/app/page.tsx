'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Activity, CheckCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function LandingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If user is already logged in, redirect them to dashboard
  useEffect(() => {
    if (isMounted && user) {
      router.push('/dashboard');
    }
  }, [user, isMounted, router]);

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-hidden relative flex flex-col">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
            QA Forge
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/register" 
            className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 mt-[-60px]">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-300">v1.0 is now live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-center max-w-4xl tracking-tight leading-[1.1]">
          Automate Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            Quality Assurance
          </span>
          <br /> with AI
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-slate-400 text-center max-w-2xl font-light leading-relaxed">
          The multi-agent platform that writes test cases, generates scripts, and reports bugs for you. No coding required.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/register" 
            className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-xl shadow-indigo-500/25"
          >
            Create Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/login"
            className="px-8 py-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 text-slate-200 border border-slate-700/50 font-semibold text-lg transition-all backdrop-blur-sm"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { icon: Activity, title: 'Multi-Agent AI', desc: '7 specialized AI agents working sequentially to build your test suite.' },
            { icon: CheckCircle, title: 'Zero Code Needed', desc: 'Upload HAR files or screenshots, and get Playwright/Cypress scripts instantly.' },
            { icon: Shield, title: 'Enterprise Ready', desc: 'Secure by design, ready for Jira integration and CI/CD pipelines.' },
          ].map((feature, i) => (
            <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-slate-500 mt-auto">
        &copy; {new Date().getFullYear()} QA Forge Platform. All rights reserved.
      </footer>
    </div>
  );
}
