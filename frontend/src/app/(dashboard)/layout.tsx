'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — Dashboard Layout (Modern Dark Mode + Glassmorphism)
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { 
  LayoutDashboard, 
  FolderOpen, 
  PlaySquare, 
  BookOpen, 
  BarChart3, 
  Settings,
  LogOut,
  Sparkles,
  MessageSquare,
  TableProperties,
  Code2,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'QA Chat', href: '/chat', icon: MessageSquare },
  { name: 'TC Generator', href: '/tc-generator', icon: TableProperties },
  { name: 'Automation Script', href: '/script-generator?type=automation', icon: Code2 },
  { name: 'Performance Script', href: '/script-generator?type=performance', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
    setIsHydrated(useAuthStore.persist.hasHydrated());
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (isMounted && isHydrated && !user) {
      router.push('/');
    }
  }, [isMounted, isHydrated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-50 selection:bg-indigo-500/30 w-screen max-w-screen">
      
      {/* Sidebar - Sleek Glassmorphism */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/50 backdrop-blur-xl relative z-10 h-full max-h-full overflow-hidden">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              QA Forge
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            let isActive = false;
            
            // For items with query params
            if (item.href.includes('?')) {
              const [basePath, queryStr] = item.href.split('?');
              const params = new URLSearchParams(queryStr);
              
              if (pathname === basePath) {
                let allParamsMatch = true;
                params.forEach((val, key) => {
                  if (searchParams?.get(key) !== val) allParamsMatch = false;
                });
                isActive = allParamsMatch;
              }
            } else {
              // For normal items
              isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-300' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Logout (Bottom) */}
        <div className="p-4 border-t border-slate-800/60 mt-auto">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col h-full max-h-full">
        {/* Subtle Background Glow effect */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div 
          ref={scrollWrapperRef}
          className={`flex-1 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent ${pathname?.startsWith('/chat') ? 'overflow-hidden p-0 h-full max-h-full' : 'overflow-auto p-8'}`}
        >
          {children}
        </div>
      </main>

    </div>
  );
}
