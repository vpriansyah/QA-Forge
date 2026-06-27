'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — Script Generator Page
// 3-Step Wizard: Configure → Input → Result
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import {
  Code2,
  ChevronRight,
  Loader2,
  RotateCcw,
  Copy,
  Hammer,
  ArrowLeft,
  Download,
  History,
  X,
  Clock,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  ClipboardList,
  Sparkles,
  Check,
} from 'lucide-react';

const API_URL = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://101.32.243.235:4000/api/v1');

// ─── Types ──────────────────────────────────────────────
type Step = 'configure' | 'input' | 'result';
type InputType = 'prompt' | 'screenshot' | 'har' | 'tc_result';
type Framework = 'playwright' | 'cypress' | 'postman' | 'appium' | 'k6' | 'locust' | 'jmeter';
type Language = 'typescript' | 'javascript' | 'python';
type Category = 'automation' | 'performance';

interface HistoryItem {
  id: string;
  title: string;
  framework: string;
  language: string;
  input_type: string;
  status: string;
  created_at: string;
}

// ─── Framework Config ────────────────────────────────────
const AUTOMATION_FRAMEWORKS = [
  { id: 'playwright' as Framework, label: 'Playwright', desc: 'E2E browser automation', color: 'emerald', icon: '🎭', langs: ['typescript', 'javascript'] },
  { id: 'cypress' as Framework, label: 'Cypress', desc: 'Frontend E2E testing', color: 'cyan', icon: '🌲', langs: ['typescript', 'javascript'] },
  { id: 'postman' as Framework, label: 'Postman', desc: 'API collection (JSON)', color: 'orange', icon: '📮', langs: ['javascript'] },
  { id: 'appium' as Framework, label: 'Appium', desc: 'Mobile app automation', color: 'rose', icon: '📱', langs: ['typescript', 'javascript', 'python'] },
];

const PERFORMANCE_FRAMEWORKS = [
  { id: 'k6' as Framework, label: 'k6', desc: 'Load & performance testing', color: 'purple', icon: '📈', langs: ['javascript'] },
  { id: 'locust' as Framework, label: 'Locust', desc: 'Python load testing tool', color: 'amber', icon: '🦗', langs: ['python'] },
  { id: 'jmeter' as Framework, label: 'JMeter', desc: 'XML-based performance test', color: 'indigo', icon: '⚡', langs: ['xml'] },
];

const ALL_FRAMEWORKS = [...AUTOMATION_FRAMEWORKS, ...PERFORMANCE_FRAMEWORKS];

const LANGUAGES: { id: Language; label: string; ext: string }[] = [
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'python', label: 'Python', ext: '.py' },
];

const COLOR_MAP: Record<string, string> = {
  emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
  orange: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
  purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
  rose: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
  amber: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
  indigo: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
};

const LOADING_STATES = [
  "Menganalisis skenario pengujian...",
  "Mengidentifikasi locators & elemen UI...",
  "Menyusun struktur kode automation...",
  "Menggenerate kode script...",
  "Melakukan finalisasi & formatting...",
];

// ─── Main Component ──────────────────────────────────────
export default function ScriptGeneratorPage({ searchParams }: { searchParams: { type?: string } }) {
  const { token, user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center w-24 h-24 mb-4">
        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
        <div className="relative bg-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-2xl flex items-center justify-center">
          <Hammer className="w-10 h-10 text-indigo-400" />
        </div>
      </div>
      
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-white tracking-wide">
          Fitur Sedang Dalam Pemeliharaan
        </h1>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
          Halaman Script Generator ({searchParams.type === 'performance' ? 'Performance' : 'Automation'}) sedang dalam pemeliharaan berkala untuk peningkatan kualitas generator AI. Kami akan segera kembali!
        </p>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95 mt-4"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>
    </div>
  );

  // Step state
  const [step, setStep] = useState<Step>('configure');

  // Configure state
  const isPerformance = searchParams.type === 'performance';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(isPerformance ? 'performance' : 'automation');
  const [framework, setFramework] = useState<Framework>(isPerformance ? 'k6' : 'playwright');
  const [language, setLanguage] = useState<Language>(isPerformance ? 'javascript' : 'typescript');

  // Input state
  const [inputType, setInputType] = useState<InputType>('prompt');
  const [promptText, setPromptText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Loading progress effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const hasCode = result || streamProgress;
    if (isGenerating && !hasCode) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STATES.length - 1 ? prev + 1 : prev));
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, result, streamProgress]);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Paste handler for files
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (!e.clipboardData?.files.length) return;
      }
      const files = Array.from(e.clipboardData?.files || []);
      if (!files.length) return;
      setUploadedFiles(prev => [...prev, ...files]);
      const hasImage = files.some(f => f.type.startsWith('image/'));
      if (hasImage) setInputType('screenshot');
      else setInputType('har');
    }
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Sync state when URL params change (sidebar navigation)
  useEffect(() => {
    if (searchParams.type === 'performance') {
      setCategory('performance');
      setFramework('k6');
      setLanguage('javascript');
    } else {
      setCategory('automation');
      setFramework('playwright');
      setLanguage('typescript');
    }
  }, [searchParams.type]);

  // ─── Step Navigation ──────────────────────────────────

  function goToInput() {
    if (!title.trim()) {
      toast.error('Judul harus diisi terlebih dahulu');
      return;
    }
    setStep('input');
  }

  function goToGenerate() {
    if (inputType === 'prompt' && !promptText.trim()) {
      toast.error('Deskripsi tidak boleh kosong');
      return;
    }
    if ((inputType === 'screenshot' || inputType === 'har') && uploadedFiles.length === 0) {
      toast.error('Silakan upload file terlebih dahulu');
      return;
    }
    startGeneration();
  }

  // ─── Generation ───────────────────────────────────────

  async function startGeneration() {
    setIsGenerating(true);
    setStreamProgress('');
    setStep('result');

    try {
      // Upload files if needed
      let fileKeys: string[] = [];
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach(f => formData.append('files', f));
        const uploadRes = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          fileKeys = uploadData.data.map((f: any) => f.key);
        }
      }

      const inputData: any = {};
      if (inputType === 'prompt') inputData.prompt = promptText;
      if (fileKeys.length > 0) inputData.file_keys = fileKeys;
      if (additionalPrompt.trim()) {
        if (inputData.prompt) inputData.prompt += `\n\n${additionalPrompt}`;
        else inputData.prompt = additionalPrompt;
      }

      const res = await fetch(`${API_URL}/script-generator/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, framework, language, input_type: inputType, input_data: inputData }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('API Error:', errText);
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullResult = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'metadata') setGenerationId(json.data.id);
            if (json.type === 'error') {
              throw new Error(json.message || 'Stream error');
            }
            if (json.type === 'chunk') {
              fullResult += json.content;
              setStreamProgress(fullResult);
            }
            if (json.type === 'done') {
              if (!fullResult.trim()) {
                throw new Error('AI tidak merespon dengan kode apa pun.');
              }
              setResult(fullResult);
              toast.success('Script berhasil di-generate!');
            }
          } catch {}
        }
      }
    } catch (err) {
      toast.error('Gagal men-generate script. Coba lagi.');
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  }

  // ─── Copy / Download ──────────────────────────────────

  function copyCode() {
    const code = result || streamProgress;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Kode berhasil disalin!');
  }

  function downloadCode() {
    const code = result || streamProgress;
    if (!code) return;
    const ext = LANGUAGES.find(l => l.id === language)?.ext || '.ts';
    const filename = `${title.replace(/[^a-zA-Z0-9_\- ]/g, '_')}_${framework}${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded: ${filename}`);
  }

  function resetAll() {
    setStep('configure');
    setTitle('');
    setCategory('automation');
    setFramework('playwright');
    setLanguage('typescript');
    setInputType('prompt');
    setPromptText('');
    setAdditionalPrompt('');
    setUploadedFiles([]);
    setResult(null);
    setStreamProgress('');
    setGenerationId(null);
  }

  // ─── History ──────────────────────────────────────────

  async function loadHistory() {
    setIsLoadingHistory(true);
    setShowHistory(true);
    try {
      const res = await fetch(`${API_URL}/script-generator/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistoryList(data.data);
      else toast.error('Gagal memuat history');
    } catch {
      toast.error('Terjadi kesalahan saat memuat history');
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function openHistoryItem(id: string) {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/script-generator/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const item = data.data;
        setTitle(item.title);
        setFramework(item.framework as Framework);
        setLanguage(item.language as Language);
        setInputType(item.input_type as InputType);
        if (item.result) {
          setResult(item.result);
          setGenerationId(item.id);
          setStep('result');
          setShowHistory(false);
          toast.success('History berhasil dimuat');
        } else {
          toast.error('Script ini belum selesai atau gagal');
        }
      }
    } catch {
      toast.error('Gagal membuka history');
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function requestDeleteHistory(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setItemToDelete(id);
  }

  async function confirmDeleteHistory() {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/script-generator/${itemToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('History berhasil dihapus');
        setHistoryList(prev => prev.filter(item => item.id !== itemToDelete));
        setItemToDelete(null);
      } else {
        toast.error('Gagal menghapus history');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus history');
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  const currentCode = result || streamProgress;
  const frameworkInfo = ALL_FRAMEWORKS.find(f => f.id === framework);
  const activeFrameworks = category === 'automation' ? AUTOMATION_FRAMEWORKS : PERFORMANCE_FRAMEWORKS;
  
  // Determine available languages for selected framework
  const selectedFwConfig = ALL_FRAMEWORKS.find(f => f.id === framework);
  const availableLanguages = LANGUAGES.filter(l => {
    if (!selectedFwConfig?.langs) return true;
    return selectedFwConfig.langs.includes(l.id) || selectedFwConfig.langs.includes('xml');
  });

  const stepConfig = [
    { id: 'configure', label: 'Konfigurasi', num: 1 },
    { id: 'input', label: 'Input', num: 2 },
    { id: 'result', label: 'Hasil', num: 3 },
  ];

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-2">
            <Code2 className="w-7 h-7 text-indigo-400" />
            {category === 'performance' ? 'Performance Script Generator' : 'Automation Script Generator'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate {category === 'performance' ? 'load and performance' : 'automation'} scripts dengan AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all"
          >
            <History className="w-4 h-4" /> History
          </button>
          {step !== 'configure' && (
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 bg-slate-800/30 border border-slate-700/30 rounded-xl hover:bg-slate-800 hover:text-slate-200 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {stepConfig.map((s, i) => {
          const isActive = step === s.id;
          const isDone = stepConfig.findIndex(x => x.id === step) > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300' :
                isDone ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                'bg-slate-800/30 border border-slate-700/30 text-slate-500'
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{s.num}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < stepConfig.length - 1 && <ChevronRight className="w-4 h-4 text-slate-600" />}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Configure ── */}
      {step === 'configure' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 shadow-xl space-y-8">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Judul Script</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Login Flow E2E Test"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Framework */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-slate-300">Framework</label>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                category === 'automation'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}>
                {category === 'automation' ? 'Automation' : 'Performance'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeFrameworks.map(fw => (
                <button
                  key={fw.id}
                  onClick={() => {
                    setFramework(fw.id);
                    // Auto-select first supported language
                    const firstLang = LANGUAGES.find(l => fw.langs.includes(l.id));
                    if (firstLang) setLanguage(firstLang.id);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all hover:-translate-y-0.5 ${
                    framework === fw.id
                      ? `${COLOR_MAP[fw.color]} shadow-lg`
                      : 'border-slate-700/50 bg-slate-800/20 text-slate-400 hover:border-slate-600 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-2xl mb-2">{fw.icon}</div>
                  <div className="font-semibold text-sm">{fw.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{fw.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Bahasa</label>
            <div className="flex gap-3 flex-wrap">
              {(framework === 'jmeter'
                ? [{ id: 'xml' as any, label: 'XML', ext: '.jmx' }]
                : availableLanguages
              ).map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    language === lang.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-700/50 bg-slate-800/20 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {lang.label} <span className="opacity-50">{lang.ext}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={goToInput}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Lanjut ke Input <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Input ── */}
      {step === 'input' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 shadow-xl space-y-6">

          {/* Input Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Tipe Input</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'prompt' as InputType, label: 'Prompt / Chat', icon: MessageSquare, desc: 'Deskripsikan fitur yang ingin ditest' },
                { id: 'screenshot' as InputType, label: 'Screenshot', icon: ImageIcon, desc: 'Upload screenshot UI' },
                { id: 'har' as InputType, label: 'HAR File', icon: FileText, desc: 'Upload file HTTP Archive' },
                { id: 'tc_result' as InputType, label: 'TC Generator', icon: ClipboardList, desc: 'Dari hasil TC Generator' },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setInputType(type.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    inputType === type.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-700/50 bg-slate-800/20 text-slate-400 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}
                >
                  <type.icon className="w-5 h-5 mb-2" />
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs opacity-60 mt-0.5 hidden sm:block">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          {inputType === 'prompt' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi Fitur / Skenario</label>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                rows={8}
                placeholder="Contoh: Buat script Playwright untuk menguji fitur Login dengan skenario: login sukses, password salah, dan akun tidak terdaftar..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm"
              />
            </div>
          )}

          {/* File upload */}
          {(inputType === 'screenshot' || inputType === 'har') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {inputType === 'screenshot' ? 'Upload Screenshot UI' : 'Upload HAR File'}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/60 hover:border-indigo-500/40 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/10 transition-colors">
                  {inputType === 'screenshot' ? <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" /> : <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />}
                </div>
                <p className="text-slate-400 text-sm">Drag & drop atau <span className="text-indigo-400">klik untuk browse</span></p>
                <p className="text-xs text-slate-500 mt-1">{inputType === 'screenshot' ? 'PNG, JPG, WebP (max 50MB)' : '.har file (max 50MB)'}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={inputType === 'screenshot' ? 'image/*' : '.har,application/json'}
                className="hidden"
                onChange={e => setUploadedFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
              />
              {uploadedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between mt-2 px-3 py-2 bg-slate-800/40 border border-slate-700/40 rounded-lg text-sm text-slate-300">
                  <span className="truncate">{file.name}</span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                    <button onClick={() => setUploadedFiles(prev => prev.filter((_, fi) => fi !== i))} className="text-slate-500 hover:text-rose-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Additional description */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Deskripsi tambahan (opsional)</label>
                <textarea
                  value={additionalPrompt}
                  onChange={e => setAdditionalPrompt(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Buatkan dalam bahasa Inggris dan fokus pada test case negatif..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm"
                />
              </div>
            </div>
          )}

          {/* TC Result input */}
          {inputType === 'tc_result' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Paste JSON dari TC Generator</label>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                rows={10}
                placeholder='Paste JSON dari hasil TC Generator di sini, contoh: [{"title": "Login Test", "steps": "..."}]'
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none font-mono text-xs"
              />
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-2">Instruksi tambahan (opsional)</label>
                <textarea
                  value={additionalPrompt}
                  onChange={e => setAdditionalPrompt(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Fokus pada API testing saja, gunakan bahasa Inggris..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('configure')}
              className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all"
            >
              ← Kembali
            </button>
            <button
              onClick={goToGenerate}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Generate Script
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Result ── */}
      {step === 'result' && (
        <div className="space-y-4">

          {/* Result Header */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-200">{title}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">{frameworkInfo?.icon} {frameworkInfo?.label}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700/50">{language}</span>
              </p>
            </div>
            {!isGenerating && currentCode && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setStep('input'); setResult(null); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Re-generate
                </button>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Copy Code'}
                </button>
                <button
                  onClick={downloadCode}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            )}
          </div>

          {/* Code Block */}
          <div className="bg-slate-950 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
            {/* Code header bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs text-slate-500 ml-2 font-mono">
                  {title.replace(/[^a-zA-Z0-9_\- ]/g, '_')}_{framework}{LANGUAGES.find(l => l.id === language)?.ext}
                </span>
              </div>
              {isGenerating && (
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
            </div>

            {/* Code content */}
            <div className="overflow-auto max-h-[60vh]">
              {currentCode ? (
                <pre className="p-6 text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  <code>{currentCode}</code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 space-y-8">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                    <div className="relative bg-slate-900 border border-slate-700/80 p-4 rounded-full shadow-2xl flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-4 text-center">
                    <p className="text-slate-300 font-medium animate-pulse">{LOADING_STATES[loadingStep]}</p>
                    <div className="flex items-center justify-center gap-2">
                      {LOADING_STATES.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === loadingStep ? 'w-6 bg-indigo-500' : 
                            i < loadingStep ? 'w-2 bg-indigo-500/50' : 'w-2 bg-slate-800'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-8 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-right-5 duration-300">
            <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-200">History Script</h2>
                <p className="text-xs text-slate-400">Riwayat script yang pernah Anda buat</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {isLoadingHistory && historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-sm text-slate-400">Memuat riwayat...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-slate-300 font-medium mb-1">Belum Ada Riwayat</h3>
                  <p className="text-sm text-slate-500">Anda belum pernah men-generate script.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => openHistoryItem(item.id)}
                      className="group flex items-center justify-between gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{item.title}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>{item.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{item.framework}</span>
                          <span>•</span>
                          <span className="capitalize">{item.language}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => requestDeleteHistory(e, item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Hapus history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors hidden sm:block" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Hapus History?</h3>
              <p className="text-sm text-slate-400">Apakah Anda yakin ingin menghapus history script ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="bg-slate-800/30 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-800/60">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteHistory}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
