'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — Settings Page
// Profile updates, password modification, and theme selection
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { User, Lock, Sun, Moon, Shield, Save, Loader2 } from 'lucide-react';

const API_URL = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://101.32.243.235:4000/api/v1');

export default function SettingsPage() {
  const { token, user, updateUser, updateUserSettings } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // Appearance States
  const currentTheme = user?.settings?.theme || 'dark';
  const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);

  // Sync component state when Zustand user loaded
  useEffect(() => {
    if (user) {
      setName(user.name);
      setTheme(user.settings?.theme || 'dark');
    }
  }, [user]);

  // Handle Profile Update (Name)
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateUser(data.data.user);
        toast.success('Nama profil berhasil diperbarui');
      } else {
        toast.error(data.error?.message || 'Gagal memperbarui profil');
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  // Handle Security Update (Password)
  async function handleSecuritySave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Password saat ini wajib diisi');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok');
      return;
    }

    setIsUpdatingSecurity(true);
    try {
      const res = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password berhasil diperbarui');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error?.message || 'Gagal memperbarui password');
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsUpdatingSecurity(false);
    }
  }

  // Handle Theme Change
  async function handleThemeChange(selectedTheme: 'light' | 'dark') {
    setTheme(selectedTheme);
    setIsUpdatingTheme(true);

    // Apply locally instantly
    if (selectedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    try {
      const newSettings = { ...user?.settings, theme: selectedTheme };
      const res = await fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: newSettings }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        updateUserSettings({ theme: selectedTheme });
        toast.success(`Tema diubah ke mode ${selectedTheme}`);
      } else {
        toast.error(data.error?.message || 'Gagal menyimpan preferensi tema');
      }
    } catch {
      toast.error('Gagal menyimpan tema di server');
    } finally {
      setIsUpdatingTheme(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
          Pengaturan Akun
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Kelola profil, keamanan, dan preferensi tampilan aplikasi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <aside className="md:col-span-1 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'profile' as const, label: 'Profil Saya', icon: User },
            { id: 'security' as const, label: 'Keamanan', icon: Lock },
            { id: 'appearance' as const, label: 'Tampilan', icon: Sun },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Box */}
        <main className="md:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 shadow-xl">
          
          {/* TAB 1: Profile Settings */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-indigo-400" />
                  Profil Informasi
                </h3>
                <p className="text-slate-400 text-xs">Informasi umum akun Anda.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Alamat Email (Tidak dapat diubah)</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-800/20 border border-slate-700/30 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleSecuritySave} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Keamanan & Password
                </h3>
                <p className="text-slate-400 text-xs">Ubah password akun Anda secara berkala.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Password Saat Ini</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Password Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Konfirmasi password"
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingSecurity}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Ubah Password
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Appearance Themes */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-1">
                  <Sun className="w-5 h-5 text-indigo-400" />
                  Tema Aplikasi
                </h3>
                <p className="text-slate-400 text-xs">Pilih tema tampilan antar muka aplikasi.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Light Theme Card */}
                <button
                  onClick={() => handleThemeChange('light')}
                  disabled={isUpdatingTheme}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'border-indigo-500/50 bg-indigo-500/5 text-indigo-400 shadow-lg'
                      : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-400/30 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Light Mode</h4>
                    <p className="text-xs opacity-70 mt-0.5">Tampilan terang dan bersih</p>
                  </div>
                </button>

                {/* Dark Theme Card */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  disabled={isUpdatingTheme}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'border-indigo-500/50 bg-indigo-500/5 text-indigo-400 shadow-lg'
                      : 'border-slate-800/80 bg-slate-900/40 text-slate-400 hover:border-slate-700/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Dark Mode</h4>
                    <p className="text-xs opacity-70 mt-0.5">Tampilan premium dan nyaman di mata</p>
                  </div>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
