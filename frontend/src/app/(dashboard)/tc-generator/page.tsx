'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — Test Case Generator Page
// Generate test cases with custom columns from various inputs
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import {
  TableProperties,
  Upload,
  MessageSquare,
  Image,
  FileJson,
  Loader2,
  Download,
  Sparkles,
  Plus,
  X,
  GripVertical,
  Check,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Pencil,
  Save,
  Copy,
  History,
  Clock,
  Trash2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ColumnDef {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

type InputType = 'prompt' | 'screenshot' | 'har';
type Step = 'columns' | 'input' | 'result';

interface HistoryItem {
  id: string;
  title: string;
  input_type: string;
  status: string;
  columns: ColumnDef[];
  created_at: string;
}

const PRESET_COLUMNS: ColumnDef[] = [
  { key: 'tc_id', label: 'Test Case ID', description: 'ID unik test case', enabled: true },
  { key: 'title', label: 'Title', description: 'Judul test case', enabled: true },
  { key: 'preconditions', label: 'Preconditions', description: 'Kondisi awal sebelum test', enabled: true },
  { key: 'steps', label: 'Test Steps', description: 'Langkah-langkah pengujian', enabled: true },
  { key: 'expected_result', label: 'Expected Result', description: 'Hasil yang diharapkan', enabled: true },
  { key: 'priority', label: 'Priority', description: 'Level prioritas (P1-P4)', enabled: true },
  { key: 'type', label: 'Type', description: 'Tipe: happy_path, edge_case, negative', enabled: true },
  { key: 'test_data', label: 'Test Data', description: 'Data test yang digunakan', enabled: false },
  { key: 'tags', label: 'Tags', description: 'Label/kategori test case', enabled: false },
  { key: 'module', label: 'Module/Feature', description: 'Modul atau fitur yang ditest', enabled: false },
  { key: 'actual_result', label: 'Actual Result', description: 'Hasil aktual (diisi saat testing)', enabled: false },
  { key: 'status', label: 'Status', description: 'Status test case (Pass/Fail/Skip)', enabled: false },
  { key: 'notes', label: 'Notes', description: 'Catatan tambahan', enabled: false },
];

export default function TcGeneratorPage() {
  const { token, user, updateUserSettings } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [step, setStep] = useState<Step>('columns');
  const [title, setTitle] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>(PRESET_COLUMNS);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (user?.settings?.tc_columns) {
      setColumns(user.settings.tc_columns);
    }
  }, [user?.settings?.tc_columns]);

  // Auto-save columns to user profile
  useEffect(() => {
    if (!isClient || !token) return;
    
    const currentStr = JSON.stringify(columns);
    const storeStr = JSON.stringify(user?.settings?.tc_columns || PRESET_COLUMNS);
    
    if (currentStr !== storeStr) {
      updateUserSettings({ tc_columns: columns });
      fetch(`${API_URL}/auth/settings`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: { ...user?.settings, tc_columns: columns } }),
      }).catch(err => console.error('Failed to save column settings', err));
    }
  }, [columns, isClient, token, user, updateUserSettings]);

  // Global paste handler for file attachments
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      // Let normal inputs handle their own text paste
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (!e.clipboardData?.files.length) return;
      }

      const files = Array.from(e.clipboardData?.files || []);
      if (files.length === 0) return;

      setUploadedFiles(prev => [...prev, ...files]);

      const hasImage = files.some(f => f.type.startsWith('image/'));
      if (hasImage) setInputType('screenshot');
      else setInputType('har');

      setStep(prev => prev === 'columns' ? 'input' : prev);
    }

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const [customColumnName, setCustomColumnName] = useState('');
  const [customColumnDesc, setCustomColumnDesc] = useState('');
  const [inputType, setInputType] = useState<InputType>('prompt');
  
  // Edit State
  const [editingColumnKey, setEditingColumnKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [promptText, setPromptText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [result, setResult] = useState<Record<string, string>[] | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const enabledColumns = columns.filter((c) => c.enabled);

  function toggleColumn(key: string) {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    );
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedColIndex(index);
    // Needed for Firefox
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;

    setColumns((prevCols) => {
      const newCols = [...prevCols];
      const draggedItem = newCols[draggedColIndex];
      newCols.splice(draggedColIndex, 1);
      newCols.splice(index, 0, draggedItem);
      return newCols;
    });
    setDraggedColIndex(index);
  }

  function handleDragEnd() {
    setDraggedColIndex(null);
  }

  function addCustomColumn() {
    if (!customColumnName.trim()) return;
    const key = customColumnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (columns.find((c) => c.key === key)) {
      toast.error('Kolom dengan nama ini sudah ada');
      return;
    }
    setColumns((prev) => [
      ...prev,
      { key, label: customColumnName.trim(), description: customColumnDesc.trim() || customColumnName.trim(), enabled: true },
    ]);
    setCustomColumnName('');
    setCustomColumnDesc('');
  }

  function removeCustomColumn(key: string) {
    setColumns((prev) => prev.filter((c) => c.key !== key));
  }

  function startEdit(col: ColumnDef) {
    setEditingColumnKey(col.key);
    setEditLabel(col.label);
    setEditDesc(col.description);
  }

  function saveEdit(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!editingColumnKey || !editLabel.trim()) return;
    
    setColumns((prev) =>
      prev.map((c) =>
        c.key === editingColumnKey
          ? { ...c, label: editLabel.trim(), description: editDesc.trim() }
          : c
      )
    );
    setEditingColumnKey(null);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function generate() {
    if (!title.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    if (enabledColumns.length === 0) {
      toast.error('Minimal 1 kolom harus dipilih');
      return;
    }
    if (inputType === 'prompt' && !promptText.trim()) {
      toast.error('Deskripsi fitur wajib diisi');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      // 1. Upload any attached files first
      const file_keys: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch(`${API_URL}/uploads/file`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            file_keys.push(uploadData.data.storage_key);
          } else {
            throw new Error(`Gagal mengunggah file ${file.name}`);
          }
        }
      }

      // 2. Send generation request
      const body = {
        title: title.trim(),
        columns: enabledColumns.map(({ key, label, description }) => ({ key, label, description })),
        input_type: inputType,
        input_data: {
          prompt: promptText || undefined,
          file_keys,
        },
      };

      const res = await fetch(`${API_URL}/tc-generator/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        throw new Error('Gagal initiate generation');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'metadata') {
                setGenerationId(data.data.id);
              } else if (data.type === 'chunk') {
                setStreamProgress((prev) => prev + data.content);
              } else if (data.type === 'done') {
                if (data.data) {
                  setResult(data.data);
                  setStep('result');
                  toast.success(`${data.data.length} test case berhasil digenerate!`);
                } else {
                  throw new Error('Hasil AI tidak valid');
                }
              }
            } catch (e) {
              // Ignore parse error for partial lines
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat generate');
    } finally {
      setIsGenerating(false);
      setStreamProgress('');
    }
  }

  async function exportExcel() {
    if (!generationId) return;
    setIsExporting(true);

    try {
      const res = await fetch(`${API_URL}/tc-generator/${generationId}/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export gagal');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'test-cases'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('File Excel berhasil didownload!');
    } catch {
      toast.error('Gagal export ke Excel');
    } finally {
      setIsExporting(false);
    }
  }

  async function copyTableToClipboard() {
    if (!result) return;
    try {
      const headerRow = enabledColumns.map(col => col.label).join('\t');
      const rows = result.map(row => 
        enabledColumns.map(col => {
          let val = row[col.key] || '';
          // Wrap in double quotes if it contains newline or tab so Excel pastes it as a single cell
          if (val.includes('\n') || val.includes('\t') || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join('\t')
      );
      const text = [headerRow, ...rows].join('\n');
      
      await navigator.clipboard.writeText(text);
      toast.success('Tabel berhasil disalin ke clipboard');
    } catch (err) {
      toast.error('Gagal menyalin tabel');
    }
  }

  function resetAll() {
    setStep('columns');
    setTitle('');
    setColumns(PRESET_COLUMNS);
    setPromptText('');
    setUploadedFiles([]);
    setResult(null);
    setGenerationId(null);
  }

  async function loadHistory() {
    setIsLoadingHistory(true);
    setShowHistory(true);
    try {
      const res = await fetch(`${API_URL}/tc-generator/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistoryList(data.data);
      } else {
        toast.error('Gagal memuat history');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat history');
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function openHistoryItem(id: string) {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/tc-generator/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const item = data.data;
        setTitle(item.title);
        // DB only stores { key, label }, we need to add { enabled: true } so UI renders them
        const loadedColumns = Array.isArray(item.columns) 
          ? item.columns.map((c: any) => ({ ...c, enabled: true }))
          : PRESET_COLUMNS;
          
        setColumns(loadedColumns);
        setInputType(item.input_type as InputType);
        if (item.result) {
          setResult(item.result);
          setGenerationId(item.id);
          setStep('result');
          setShowHistory(false);
          toast.success('History berhasil dimuat');
        } else {
          toast.error('Test case ini belum selesai atau gagal');
        }
      }
    } catch {
      toast.error('Gagal membuka history detail');
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
      const res = await fetch(`${API_URL}/tc-generator/${itemToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('History berhasil dihapus');
        setHistoryList((prev) => prev.filter((item) => item.id !== itemToDelete));
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
            <TableProperties className="w-7 h-7 text-indigo-400" />
            Test Case Generator
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate test case dengan AI — pilih kolom, berikan input, dapatkan hasilnya.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 transition-all"
          >
            <History className="w-4 h-4" />
            History
          </button>
          {step !== 'columns' && (
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 px-1">
        {(['columns', 'input', 'result'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === s
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : i < ['columns', 'input', 'result'].indexOf(step)
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
              }`}
            >
              {i < ['columns', 'input', 'result'].indexOf(step) ? (
                <Check className="w-3 h-3" />
              ) : (
                <span>{i + 1}</span>
              )}
              {s === 'columns' ? 'Kolom' : s === 'input' ? 'Input' : 'Hasil'}
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-slate-600" />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Column Configuration ─── */}
      {step === 'columns' && (
        <div className="space-y-6">
          {/* Title Input */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Judul Test Case</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="contoh: Login Feature — E2E Test Cases"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>

          {/* Column Selector */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-slate-200">Pilih Kolom Output</h3>
              <button onClick={() => setColumns(PRESET_COLUMNS)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Reset Default
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Pilih kolom yang ingin ditampilkan di hasil test case.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {columns.map((col, index) => {
                const isPreset = PRESET_COLUMNS.find((p) => p.key === col.key);
                const isEditing = editingColumnKey === col.key;

                return (
                  <div
                    key={col.key}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { if (!isEditing) toggleColumn(col.key); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group ${
                      !isEditing ? 'cursor-pointer' : ''
                    } ${
                      col.enabled && !isEditing
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    } ${draggedColIndex === index ? 'opacity-40 border-dashed' : ''}`}
                  >
                    {!isEditing && (
                      <>
                        <div className="cursor-grab active:cursor-grabbing hover:text-slate-300 text-slate-500 transition-colors flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <GripVertical className="w-4 h-4" />
                          <span className="text-xs font-mono font-medium text-slate-500 w-4 text-center">{index + 1}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            col.enabled
                              ? 'bg-indigo-500 border-indigo-500'
                              : 'border-slate-600 group-hover:border-slate-500'
                          }`}
                        >
                          {col.enabled && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{col.label}</p>
                          <p className="text-xs text-slate-500 truncate">{col.description}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(col); }}
                            className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                            title="Edit Kolom"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeCustomColumn(col.key); }}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus Kolom"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}

                    {isEditing && (
                      <div className="flex-1 flex flex-col gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              else if (e.key === 'Escape') setEditingColumnKey(null);
                            }}
                            placeholder="Nama kolom"
                            className="flex-1 px-2 py-1.5 bg-slate-800/80 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={saveEdit}
                            disabled={!editLabel.trim()}
                            className="p-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded border border-indigo-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                            title="Simpan"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingColumnKey(null)}
                            className="p-1.5 bg-slate-700/50 text-slate-400 hover:bg-slate-700 rounded border border-slate-600 transition-colors flex-shrink-0"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            else if (e.key === 'Escape') setEditingColumnKey(null);
                          }}
                          placeholder="Deskripsi (opsional)"
                          className="w-full px-2 py-1.5 bg-slate-800/80 border border-slate-600 rounded text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Custom Column */}
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <p className="text-sm text-slate-400 mb-2">Tambah kolom kustom:</p>
              <div className="flex gap-2">
                <input
                  value={customColumnName}
                  onChange={(e) => setCustomColumnName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomColumn(); }}
                  placeholder="Nama kolom"
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <input
                  value={customColumnDesc}
                  onChange={(e) => setCustomColumnDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomColumn(); }}
                  placeholder="Deskripsi (opsional)"
                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  onClick={addCustomColumn}
                  disabled={!customColumnName.trim()}
                  className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setStep('input')}
              disabled={enabledColumns.length === 0 || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lanjut ke Input
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Input ─── */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Input Type Selector */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
            <h3 className="font-medium text-slate-200 mb-4">Pilih Tipe Input</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'prompt' as InputType, icon: MessageSquare, label: 'Prompt / Chat', desc: 'Deskripsikan fitur yang ingin ditest' },
                { type: 'screenshot' as InputType, icon: Image, label: 'Screenshot', desc: 'Upload screenshot UI' },
                { type: 'har' as InputType, icon: FileJson, label: 'HAR File', desc: 'Upload file HTTP Archive' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setInputType(item.type)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition-all text-center ${
                    inputType === item.type
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Content */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
            {inputType === 'prompt' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deskripsikan fitur atau flow yang ingin ditest
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={8}
                  placeholder={`Contoh:\nFitur login pada aplikasi e-commerce. User bisa login menggunakan email dan password. Terdapat validasi email format, password minimal 8 karakter. Jika login berhasil, redirect ke halaman dashboard. Jika gagal 3x, akun akan di-lock selama 30 menit.`}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm leading-relaxed resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Semakin detail deskripsi, semakin baik test case yang dihasilkan.
                </p>
              </div>
            )}

            {(inputType === 'screenshot' || inputType === 'har') && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {inputType === 'screenshot' ? 'Upload Screenshot' : 'Upload HAR File'}
                </label>

                {/* Drop Zone */}
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700/60 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-400">
                    Drag & drop atau <span className="text-indigo-400 font-medium">klik untuk browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {inputType === 'screenshot' ? 'PNG, JPG, WebP (max 50MB)' : '.har file (max 50MB)'}
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept={inputType === 'screenshot' ? 'image/*' : '.har,.json'}
                    multiple={inputType === 'screenshot'}
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                        {inputType === 'screenshot' ? (
                          <Image className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <FileJson className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-sm text-slate-300 flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                        <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-rose-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional prompt for file uploads */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deskripsi tambahan (opsional)
                  </label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={3}
                    placeholder="Tambahkan konteks tentang fitur yang ditampilkan di file tersebut..."
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons or Progress UI */}
          {isGenerating ? (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 shadow-lg shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <h3 className="text-slate-200 font-medium">AI sedang bekerja...</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Menganalisis {inputType === 'prompt' ? 'prompt' : 'lampiran'} dan menyusun struktur test case.
                </p>
                {streamProgress && (
                  <div className="mt-4 px-4 py-2 bg-slate-800/50 rounded-lg max-w-lg mx-auto overflow-hidden">
                    <p className="text-xs font-mono text-indigo-300 truncate">
                      {streamProgress.length} bytes diterima...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={() => setStep('columns')}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
              <button
                onClick={generate}
                disabled={inputType === 'prompt' && !promptText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Generate Test Cases
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 3: Result ─── */}
      {step === 'result' && result && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-200">{title}</h3>
              <p className="text-sm text-slate-400">{result.length} test case digenerate</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setStep('input'); setResult(null); }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Re-generate
              </button>
              <button
                onClick={copyTableToClipboard}
                className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl transition-all shadow-lg"
              >
                <Copy className="w-4 h-4" />
                Copy Table
              </button>
              <button
                onClick={exportExcel}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export Excel
              </button>
            </div>
          </div>

          {/* Result Table */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40 w-10">
                      #
                    </th>
                    {enabledColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/40 whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {result.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{i + 1}</td>
                      {enabledColumns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-slate-300 max-w-xs"
                        >
                          <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                            {row[col.key] || '-'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Modal ─── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">History Test Case</h2>
                  <p className="text-xs text-slate-400">Riwayat test case yang pernah Anda buat</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
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
                    <Clock className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-slate-300 font-medium mb-1">Belum Ada Riwayat</h3>
                  <p className="text-sm text-slate-500">Anda belum pernah men-generate test case.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openHistoryItem(item.id)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                            item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.status === 'processing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">Input: {item.input_type}</span>
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
              <p className="text-sm text-slate-400">
                Apakah Anda yakin ingin menghapus history test case ini? Tindakan ini tidak dapat dibatalkan.
              </p>
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
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
