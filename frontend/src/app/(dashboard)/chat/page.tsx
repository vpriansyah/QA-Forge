'use client';

// ═══════════════════════════════════════════════════════════
// QA Forge — QA Chat Page
// AI-powered QA Assistant with conversation management
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Loader2,
  Bot,
  User,
  Sparkles,
  X,
  Edit2,
  Check,
  Copy,
  Paperclip,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://101.32.243.235:4000/api/v1';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: { filename: string; storage_key: string; mime_type: string; size: number }[];
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  messages?: { content: string; role: string; created_at: string }[];
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label === 'Copy Table' ? 'Tabel berhasil disalin (format Excel)' : 'Teks berhasil disalin');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin teks');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-all border border-slate-700/40 text-xs font-medium backdrop-blur-sm shadow-md"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default function ChatPage() {
  const { token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  async function saveEditedMessage(messageId: string) {
    if (!editContent.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingContent('');
    setEditingMessageId(null);

    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const updatedMessages = messages.slice(0, msgIndex + 1);
    updatedMessages[msgIndex] = {
      ...updatedMessages[msgIndex],
      content: editContent.trim(),
    };
    setMessages(updatedMessages);

    try {
      const res = await fetch(`${API_URL}/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: editContent.trim(),
          localTime: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (activeConversationRef.current !== activeConversation) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk') {
                  fullContent += payload.content;
                  setStreamingContent(fullContent);
                } else if (payload.type === 'error') {
                  toast.error(payload.content);
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          }
        }
      }

      if (fullContent && activeConversationRef.current === activeConversation) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      toast.error('Gagal memperbarui pesan');
    } finally {
      if (activeConversationRef.current === activeConversation) {
        setIsStreaming(false);
        setStreamingContent('');
      }
    }
  }

  async function retryResponse() {
    if (!activeConversation || isStreaming) return;

    setIsStreaming(true);
    setStreamingContent('');

    const updatedMessages = [...messages];
    if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
      updatedMessages.pop();
    }
    setMessages(updatedMessages);

    try {
      const res = await fetch(`${API_URL}/chat/conversations/${activeConversation}/regenerate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localTime: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (activeConversationRef.current !== activeConversation) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk') {
                  fullContent += payload.content;
                  setStreamingContent(fullContent);
                } else if (payload.type === 'error') {
                  toast.error(payload.content);
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          }
        }
      }

      if (fullContent && activeConversationRef.current === activeConversation) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      toast.error('Gagal meregenerasi response');
    } finally {
      if (activeConversationRef.current === activeConversation) {
        setIsStreaming(false);
        setStreamingContent('');
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/uploads/file`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setPendingAttachments((prev) => [...prev, data.data]);
        } else {
          toast.error(data.error?.message || `Gagal mengunggah ${file.name}`);
        }
      }
    } catch {
      toast.error('Gagal mengunggah file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/uploads/file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPendingAttachments((prev) => [...prev, data.data]);
        } else {
          toast.error(data.error?.message || `Gagal mengunggah file`);
        }
      }
    } catch {
      toast.error('Gagal mengunggah file dari clipboard');
    } finally {
      setIsUploading(false);
    }
  }

  function removePendingAttachment(storageKey: string) {
    setPendingAttachments((prev) => prev.filter((att) => att.storage_key !== storageKey));
  }

  async function handleSaveTitle() {
    if (!editedTitle.trim() || !activeConversation) return;

    try {
      const res = await fetch(`${API_URL}/chat/conversations/${activeConversation}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation ? { ...c, title: data.data.title } : c))
        );
        setIsEditingTitle(false);
        toast.success('Judul percakapan berhasil diperbarui');
      } else {
        toast.error(data.error?.message || 'Gagal memperbarui judul percakapan');
      }
    } catch {
      toast.error('Gagal memperbarui judul percakapan');
    }
  }

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch {
      toast.error('Gagal memuat daftar percakapan');
    } finally {
      setIsLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setActiveConversation(conversationId);
        setIsStreaming(false);
        setStreamingContent('');
      }
    } catch {
      toast.error('Gagal memuat pesan');
    }
  }

  async function createConversation() {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) => [data.data, ...prev]);
        setActiveConversation(data.data.id);
        setMessages([]);
        setIsStreaming(false);
        setStreamingContent('');
      }
    } catch {
      toast.error('Gagal membuat percakapan baru');
    }
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`${API_URL}/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation === id) {
        setActiveConversation(null);
        setMessages([]);
        setIsStreaming(false);
        setStreamingContent('');
      }
    } catch {
      toast.error('Gagal menghapus percakapan');
    }
  }

  async function sendMessage() {
    if ((!input.trim() && pendingAttachments.length === 0) || isStreaming || isUploading) return;

    let conversationId = activeConversation;

    // Auto-create conversation if none active
    if (!conversationId) {
      try {
        const res = await fetch(`${API_URL}/chat/conversations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success) {
          conversationId = data.data.id;
          setConversations((prev) => [data.data, ...prev]);
          setActiveConversation(conversationId);
        }
      } catch {
        toast.error('Gagal membuat percakapan');
        return;
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      attachments: pendingAttachments,
      created_at: new Date().toISOString(),
    };

    const attachmentsToSend = [...pendingAttachments];

    // Optimistic UI update for title if it's the first message
    if (messages.length === 0) {
      let newTitle = userMessage.content.trim().split('\n')[0].substring(0, 35);
      if (userMessage.content.length > 35) newTitle += '...';
      if (!newTitle) newTitle = 'New Chat';

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title: newTitle } : c
        )
      );
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setPendingAttachments([]);
    setIsStreaming(true);
    setStreamingContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }

    try {
      const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage.content,
          attachments: attachmentsToSend,
          localTime: new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (activeConversationRef.current !== conversationId) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk') {
                  fullContent += payload.content;
                  setStreamingContent(fullContent);
                } else if (payload.type === 'title') {
                  // Update conversation title in sidebar
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === conversationId ? { ...c, title: payload.content } : c
                    )
                  );
                } else if (payload.type === 'error') {
                  toast.error(payload.content);
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          }
        }
      }

      // Add the full assistant message
      if (fullContent && activeConversationRef.current === conversationId) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      toast.error('Gagal mendapatkan response dari AI');
    } finally {
      if (activeConversationRef.current === conversationId) {
        setIsStreaming(false);
        setStreamingContent('');
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto resize
    const el = e.target;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight + 2, 200);
    el.style.height = newHeight + 'px';
    if (newHeight >= 200) {
      el.style.overflowY = 'auto';
    } else {
      el.style.overflowY = 'hidden';
    }
  }

  // Simple markdown-ish renderer
  function renderContent(content: string) {
    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
        const lang = match?.[1] || '';
        const code = match?.[2] || part.slice(3, -3);
        return (
          <div key={i} className="my-3 rounded-xl overflow-hidden border border-slate-700/50">
            <div className="bg-slate-800/80 px-4 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-700/50 flex justify-between items-center">
              <span>{lang || 'code'}</span>
              <CopyButton text={code} />
            </div>
            <pre className="bg-slate-900/80 p-4 overflow-x-auto">
              <code className="text-sm font-mono text-slate-300 whitespace-pre">{code}</code>
            </pre>
          </div>
        );
      }

      // Process lines, grouping consecutive table lines together
      const lines = part.split('\n');
      const blocks: (
        | { type: 'table'; headers: string[]; rows: string[][] }
        | { type: 'normal'; lines: string[] }
      )[] = [];

      let currentTableLines: string[] = [];
      let currentNormalLines: string[] = [];

      const flushNormal = () => {
        if (currentNormalLines.length > 0) {
          blocks.push({ type: 'normal', lines: [...currentNormalLines] });
          currentNormalLines = [];
        }
      };

      const flushTable = () => {
        if (currentTableLines.length > 0) {
          const rawHeader = currentTableLines[0];
          const rawRows = currentTableLines.slice(2); // Skip header and separator

          const parseTableRow = (rowStr: string) => {
            const cells = rowStr.split('|').map((c) => c.trim());
            if (cells[0] === '') cells.shift();
            if (cells[cells.length - 1] === '') cells.pop();
            return cells;
          };

          const headers = parseTableRow(rawHeader);
          const rows = rawRows.map((row) => parseTableRow(row));

          blocks.push({ type: 'table', headers, rows });
          currentTableLines = [];
        }
      };

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        const trimmed = line.trim();
        const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');

        if (isTableLine) {
          flushNormal();
          currentTableLines.push(line);
        } else {
          if (currentTableLines.length > 0) {
            if (currentTableLines.length < 2) {
              currentNormalLines.push(...currentTableLines);
              currentTableLines = [];
            } else {
              flushTable();
            }
          }
          currentNormalLines.push(line);
        }
      }

      if (currentTableLines.length > 0) {
        if (currentTableLines.length < 2) {
          currentNormalLines.push(...currentTableLines);
        } else {
          flushTable();
        }
      }
      flushNormal();

      return (
        <div key={i}>
          {blocks.map((block, bIdx) => {
            if (block.type === 'table') {
              return (
                <div key={bIdx} className="group/table relative my-4 rounded-xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm max-w-full">
                  <div className="absolute right-2.5 top-2.5 z-20 opacity-0 group-hover/table:opacity-100 transition-opacity">
                    <CopyButton text={block.headers.join('\t') + '\n' + block.rows.map(r => r.join('\t')).join('\n')} label="Copy Table" />
                  </div>
                  <div className="overflow-x-auto max-w-full">
                    <table className="min-w-full text-left border-collapse text-sm">
                      <thead className="bg-slate-800/60 border-b border-slate-700/50 text-slate-200">
                        <tr>
                          {block.headers.map((header, idx) => (
                            <th key={idx} className="px-4 py-3 font-semibold tracking-wide">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {block.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-3 leading-relaxed">
                                {renderInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return (
              <div key={bIdx}>
                {block.lines.map((line, j) => {
                  // Headers
                  if (line.startsWith('##### ')) return <h6 key={j} className="font-semibold text-slate-400 mt-2.5 mb-1 text-xs uppercase tracking-wider">{line.slice(6)}</h6>;
                  if (line.startsWith('#### ')) return <h5 key={j} className="font-semibold text-slate-300 mt-3 mb-1 text-sm">{line.slice(5)}</h5>;
                  if (line.startsWith('### ')) return <h4 key={j} className="font-semibold text-slate-200 mt-3 mb-1">{line.slice(4)}</h4>;
                  if (line.startsWith('## ')) return <h3 key={j} className="font-bold text-slate-100 mt-4 mb-2 text-lg">{line.slice(3)}</h3>;
                  if (line.startsWith('# ')) return <h2 key={j} className="font-bold text-white mt-4 mb-2 text-xl">{line.slice(2)}</h2>;

                  // List items
                  if (line.match(/^[\-\*] /)) {
                    return <div key={j} className="flex gap-2 ml-2 my-0.5"><span className="text-indigo-400 mt-0.5">•</span><span>{renderInline(line.slice(2))}</span></div>;
                  }
                  if (line.match(/^\d+\. /)) {
                    const num = line.match(/^(\d+)\. /)?.[1];
                    return <div key={j} className="flex gap-2 ml-2 my-0.5"><span className="text-indigo-400 font-medium min-w-[1.5rem]">{num}.</span><span>{renderInline(line.replace(/^\d+\. /, ''))}</span></div>;
                  }

                  // Empty lines
                  if (!line.trim()) return <div key={j} className="h-2" />;

                  // Normal paragraph
                  return <p key={j} className="my-1">{renderInline(line)}</p>;
                })}
              </div>
            );
          })}
        </div>
      );
    });
  }

  const lastUserMessageId = [...messages].reverse().find((m) => m.role === 'user')?.id;

  function renderInline(text: string) {
    // Bold
    let result = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>');
    // Inline code
    result = result.replace(/`([^`]+)`/g, '<code class="bg-slate-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-300">$1</code>');
    // Italic
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  }

  return (
    <div 
      className="w-full grid transition-all duration-300 bg-slate-950 overflow-hidden h-full max-h-full"
      style={{ gridTemplateColumns: sidebarOpen ? '288px 1fr' : '0px 1fr' }}
    >
      {/* ─── Sidebar ─── */}
      <aside className="bg-slate-900/70 backdrop-blur-xl border-r border-slate-800/60 flex flex-col overflow-hidden h-full">
        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800/60">
          <button
            onClick={createConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Chat
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Belum ada percakapan</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  activeConversation === conv.id
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 border border-transparent'
                }`}
                onClick={() => loadMessages(conv.id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ─── Main Chat Area ─── */}
      <div className="grid min-w-0 min-h-0 h-full max-h-full" style={{ gridTemplateRows: '56px 1fr auto' }}>
        {/* Header */}
        <div className="flex items-center px-4 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/50 transition-colors mr-3"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-md">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 w-full"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50 rounded-lg transition-colors" title="Simpan">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors" title="Batal">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="font-medium text-slate-200 text-sm">
                  {activeConversation
                    ? conversations.find((c) => c.id === activeConversation)?.title || 'Chat'
                    : 'QA Forge AI Assistant'}
                </h2>
                {activeConversation && (
                  <button
                    onClick={() => {
                      const currentTitle = conversations.find((c) => c.id === activeConversation)?.title || 'Chat';
                      setEditedTitle(currentTitle);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-all"
                    title="Edit Judul"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollContainerRef}
          className="min-h-0 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-5">
                <Bot className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">QA Forge AI Assistant</h3>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                Tanyakan apapun seputar Quality Assurance — test case, bug analysis, automation script, test strategy, dan lainnya.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 max-w-lg w-full">
                {[
                  'Buatkan test case untuk fitur login',
                  'Bagaimana cara testing API payment gateway?',
                  'Apa perbedaan smoke test dan regression test?',
                  'Review bug report ini dan berikan saran',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                    className="text-left px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 max-w-[75%]">
                <div
                  className={`rounded-2xl px-5 py-3.5 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600/90 text-white rounded-br-md'
                      : 'bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-bl-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-[220px]">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEditedMessage(msg.id);
                            }
                            if (e.key === 'Escape') {
                              setEditingMessageId(null);
                            }
                          }}
                          className="w-full bg-slate-900/60 border border-indigo-500/30 rounded-xl p-2 text-xs text-slate-100 focus:outline-none min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEditedMessage(msg.id)}
                            className="flex items-center justify-center p-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors"
                            title="Simpan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="flex items-center justify-center p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group/user-message">
                        {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-indigo-500/40">
                            {msg.attachments.map((att) => {
                              const isImg = att.mime_type?.startsWith('image/');
                              const downloadUrl = `${API_URL}/uploads/file/${att.storage_key}`;
                              return (
                                <div key={att.storage_key} className="flex flex-col gap-1">
                                  {isImg ? (
                                    <a
                                      href={downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg overflow-hidden border border-indigo-500/30 hover:opacity-90 transition-opacity"
                                    >
                                      <img
                                        src={downloadUrl}
                                        alt={att.filename}
                                        className="max-w-[240px] max-h-[160px] object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 bg-indigo-700/50 hover:bg-indigo-700/85 rounded-xl border border-indigo-500/30 transition-colors text-xs"
                                    >
                                      <FileText className="w-4 h-4 text-indigo-200" />
                                      <div className="flex flex-col truncate max-w-[150px]">
                                        <span className="font-medium truncate text-indigo-100">{att.filename}</span>
                                        <span className="text-[10px] text-indigo-300">{(att.size / 1024).toFixed(1)} KB</span>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div>
                      <div className="text-sm leading-relaxed prose-sm">{renderContent(msg.content)}</div>
                    </div>
                  )}
                </div>

                {/* Action Bar below bubble */}
                {editingMessageId !== msg.id && (
                  <div className={`flex items-center gap-2 px-1 text-slate-500 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.content);
                        toast.success('Pesan disalin');
                      }}
                      className="p-1 hover:bg-slate-800/60 rounded text-slate-500 hover:text-slate-300 transition-all"
                      title="Salin pesan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    
                    {msg.role === 'user' && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="p-1 hover:bg-slate-800/60 rounded text-slate-500 hover:text-slate-300 transition-all"
                        title="Edit pesan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {((msg.role === 'user' && lastUserMessageId === msg.id) || (msg.role === 'assistant' && messages[messages.length - 1]?.id === msg.id)) && !isStreaming && (
                      <button
                        onClick={retryResponse}
                        className="group p-1 hover:bg-slate-800/60 rounded text-slate-500 hover:text-indigo-400 transition-all flex items-center gap-1 text-[10px]"
                        title="Regenerasi response"
                      >
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                        <span>{msg.role === 'user' ? 'Retry' : 'Regenerate'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-700/50 border border-slate-600/50 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-bl-md px-5 py-3.5 bg-slate-800/60 border border-slate-700/50 text-slate-300">
                {streamingContent ? (
                  <div className="text-sm leading-relaxed">{renderContent(streamingContent)}</div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-800/60 p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex flex-col bg-slate-800/50 border border-slate-700/60 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
            {/* Pending Attachments */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border-b border-slate-700/40 bg-slate-900/20 rounded-t-xl">
                {pendingAttachments.map((att) => {
                  const isImg = att.mime_type?.startsWith('image/');
                  return (
                    <div key={att.storage_key} className="relative flex items-center gap-2 p-1.5 pr-8 bg-slate-800/90 rounded-lg border border-slate-700/60 max-w-[200px]">
                      {isImg ? (
                        <img
                          src={`${API_URL}/uploads/file/${att.storage_key}`}
                          alt={att.filename}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-indigo-400 p-1.5 bg-indigo-500/10 rounded flex-shrink-0" />
                      )}
                      <span className="text-xs text-slate-300 truncate flex-1">{att.filename}</span>
                      <button
                        onClick={() => removePendingAttachment(att.storage_key)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-rose-400 text-slate-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center">
              {/* File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isStreaming}
                className="p-3 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                title="Unggah berkas"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Tanyakan seputar QA, testing, bug, automation..."
                rows={1}
                className="flex-1 resize-none py-3 px-2 bg-transparent border-0 text-slate-200 placeholder-slate-500 focus:outline-none text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700"
                style={{ maxHeight: '200px', minHeight: '44px' }}
              />
              <div className="flex items-center pr-2">
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && pendingAttachments.length === 0) || isStreaming || isUploading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md shadow-indigo-500/10 disabled:opacity-30 disabled:bg-slate-700/40 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-600 mt-2">
            QA Forge AI dapat membuat kesalahan. Selalu verifikasi informasi penting.
          </p>
        </div>
      </div>
    </div>
  );
}
