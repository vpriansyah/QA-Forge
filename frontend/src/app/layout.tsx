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
          `
        }}></script>
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background-color: #0f172a;
              color: #f8fafc;
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
