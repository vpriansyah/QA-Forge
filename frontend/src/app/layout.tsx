// ═══════════════════════════════════════════════════════════
// QA Forge — Root Layout
// ═══════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { Toaster } from 'sonner';


export const metadata: Metadata = {
  title: 'QA Forge — AI-Powered Quality Assurance Platform',
  description: 'Generate comprehensive testing artifacts — test cases, automation scripts, bug reports — from simple inputs using AI-powered multi-agent pipeline.',
  keywords: ['QA', 'testing', 'automation', 'AI', 'playwright', 'test cases', 'quality assurance'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#eef2ff',
                      100: '#e0e7ff',
                      500: '#6366f1',
                      600: '#4f46e5',
                      900: '#312e81',
                    }
                  }
                }
              }
            }

            // Immediately load user theme preference
            try {
              const storage = localStorage.getItem('qaforge-auth-storage');
              if (storage) {
                const parsed = JSON.parse(storage);
                const theme = parsed?.state?.user?.settings?.theme || 'dark';
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              }
            } catch (e) {}
          `
        }}></script>
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background-color: #0f172a;
              color: #f8fafc;
              transition: background-color 0.2s, color 0.2s;
            }
            
            /* Light mode overrides */
            html.light body {
              background-color: #f8fafc !important;
              color: #0f172a !important;
            }
            html.light .bg-slate-950,
            html.light .bg-slate-900,
            html.light aside {
              background-color: #ffffff !important;
            }
            html.light .bg-slate-900\/30,
            html.light .bg-slate-900\/70 {
              background-color: rgba(241, 245, 249, 0.8) !important;
            }
            html.light .border-slate-800,
            html.light .border-slate-800\/60,
            html.light .border-r,
            html.light .border-b,
            html.light .border-t {
              border-color: #e2e8f0 !important;
            }
            html.light .text-slate-50,
            html.light .text-slate-100,
            html.light .text-slate-200,
            html.light .text-slate-300,
            html.light h2,
            html.light h3,
            html.light p {
              color: #0f172a !important;
            }
            html.light .text-slate-400 {
              color: #475569 !important;
            }
            html.light .text-slate-500 {
              color: #64748b !important;
            }
            html.light .bg-slate-800\/20,
            html.light .bg-slate-800\/50,
            html.light .bg-slate-800\/60,
            html.light .hover\\:bg-slate-800\\/50:hover {
              background-color: #f1f5f9 !important;
            }
            html.light input,
            html.light textarea {
              background-color: #ffffff !important;
              border-color: #cbd5e1 !important;
              color: #0f172a !important;
            }
            html.light input::placeholder,
            html.light textarea::placeholder {
              color: #94a3b8 !important;
            }
          `
        }}></style>
      </head>
      <body className="antialiased min-h-screen bg-slate-900 text-slate-50">
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
