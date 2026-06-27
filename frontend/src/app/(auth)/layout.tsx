// ═══════════════════════════════════════════════════════════
// QA Forge — Auth Layout (Sleek Dark Mode)
// ═══════════════════════════════════════════════════════════

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden text-slate-100">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px]" />
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
      </div>

      {/* Auth Container */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl leading-none">Q</span>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              QA Forge
            </span>
          </div>
        </div>
        
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 p-8 rounded-2xl shadow-2xl">
          {children}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} QA Forge Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}

