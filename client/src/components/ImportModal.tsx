import React, { useState } from 'react';
import { X, Globe, FileText, Upload, Sparkles, Loader2, ArrowRight, BookPlus, PlusCircle } from 'lucide-react';
import { getStoredToken } from '../utils/api';
import { Novel } from '../types/novel';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlankNovel: (novelData: {
    title: string;
    translatedTitle?: string;
    author?: string;
    genre: Novel['genre'];
    description?: string;
    initialChapter?: { title: string; content: string };
  }) => Promise<void>;
  onImportSingleChapter: (
    novelTitle: string,
    chapterTitle: string,
    content: string,
    sourceUrl?: string,
    nextUrl?: string,
    prevUrl?: string
  ) => Promise<void>;
  onImportBatchChapters: (
    novelTitle: string,
    chapters: { title: string; content: string }[]
  ) => Promise<void>;
}

type Tab = 'create' | 'url' | 'paste' | 'file';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'create', label: 'Create', icon: <BookPlus className="w-4 h-4" /> },
  { id: 'url',    label: 'Web URL', icon: <Globe className="w-4 h-4" /> },
  { id: 'paste',  label: 'Paste',  icon: <FileText className="w-4 h-4" /> },
  { id: 'file',   label: 'TXT File', icon: <Upload className="w-4 h-4" /> }
];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onCreateBlankNovel,
  onImportSingleChapter,
  onImportBatchChapters
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Create Novel state
  const [createTitle, setCreateTitle] = useState('');
  const [createEnglishTitle, setCreateEnglishTitle] = useState('');
  const [createAuthor, setCreateAuthor] = useState('');
  const [createGenre, setCreateGenre] = useState<Novel['genre']>('xianxia');
  const [createDesc, setCreateDesc] = useState('');
  const [createFirstChapTitle, setCreateFirstChapTitle] = useState('');
  const [createFirstChapContent, setCreateFirstChapContent] = useState('');

  // URL state
  const [url, setUrl] = useState('');

  // Paste state
  const [novelTitle, setNovelTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ novelTitle: string; chaptersCount: number } | null>(null);

  if (!isOpen) return null;

  const clearError = () => setErrorMessage('');

  const handleCreateNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) { setErrorMessage('Please enter a novel title'); return; }
    setIsLoading(true); clearError();
    try {
      await onCreateBlankNovel({
        title: createTitle.trim(),
        translatedTitle: createEnglishTitle.trim() || undefined,
        author: createAuthor.trim() || undefined,
        genre: createGenre,
        description: createDesc.trim() || undefined,
        initialChapter: createFirstChapContent.trim()
          ? { title: createFirstChapTitle.trim() || 'Chapter 1', content: createFirstChapContent.trim() }
          : undefined
      });
      setCreateTitle(''); setCreateEnglishTitle(''); setCreateAuthor('');
      setCreateDesc(''); setCreateFirstChapTitle(''); setCreateFirstChapContent('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create novel');
    } finally { setIsLoading(false); }
  };

  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true); clearError();
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/scrape', { method: 'POST', headers, body: JSON.stringify({ url: url.trim() }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to fetch chapter from URL'); }
      const data = await res.json();
      await onImportSingleChapter(
        data.novelTitle || 'Imported Web Novel',
        data.chapterTitle || 'Chapter',
        data.content,
        data.currentUrl, data.nextUrl, data.prevUrl
      );
      setUrl(''); onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Scraping failed');
    } finally { setIsLoading(false); }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedContent.trim()) return;
    setIsLoading(true); clearError();
    try {
      await onImportSingleChapter(
        novelTitle.trim() || 'My Chinese Novel',
        chapterTitle.trim() || 'Chapter',
        pastedContent.trim()
      );
      setNovelTitle(''); setChapterTitle(''); setPastedContent(''); onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed');
    } finally { setIsLoading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file); setIsLoading(true); clearError();
    try {
      const text = await file.text();
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/parse-txt', { method: 'POST', headers, body: JSON.stringify({ text, novelTitle: file.name.replace(/\.[^/.]+$/, '') }) });
      if (!res.ok) throw new Error('Failed to parse text file');
      const parsed = await res.json();
      setFilePreview({ novelTitle: parsed.novelTitle, chaptersCount: parsed.chapters.length });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not parse TXT file');
    } finally { setIsLoading(false); }
  };

  const handleBatchImport = async () => {
    if (!selectedFile) return;
    setIsLoading(true); clearError();
    try {
      const text = await selectedFile.text();
      const res = await fetch('/api/parse-txt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, novelTitle: filePreview?.novelTitle || selectedFile.name.replace(/\.[^/.]+$/, '') }) });
      const parsed = await res.json();
      await onImportBatchChapters(parsed.novelTitle, parsed.chapters);
      setSelectedFile(null); setFilePreview(null); onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Batch import failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-xl bg-[#161b22] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] modal-enter">

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Add Novel to Library</h2>
              <p className="text-xs text-slate-500">Create, scrape, paste, or upload</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-4 mt-3 bg-white/[0.04] rounded-xl shrink-0">
          {TAB_CONFIG.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); clearError(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === t.id
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.icon}
              <span className="hidden xs:inline sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm flex items-start gap-2 shrink-0">
            <span className="mt-0.5">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">

          {/* TAB: CREATE */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateNovelSubmit} className="space-y-4">
              <Field label="Novel Title (Chinese or Pinyin) *">
                <input type="text" placeholder="e.g. 完美世界 or 逆天邪神" value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)} required
                  className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="English Title (Optional)">
                  <input type="text" placeholder="e.g. Perfect World" value={createEnglishTitle}
                    onChange={(e) => setCreateEnglishTitle(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Author (Optional)">
                  <input type="text" placeholder="e.g. Mars Gravity" value={createAuthor}
                    onChange={(e) => setCreateAuthor(e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Genre / Theme">
                  <select value={createGenre} onChange={(e) => setCreateGenre(e.target.value as Novel['genre'])} className={inputCls}>
                    <option value="xianxia">Xianxia (Immortal Cultivation)</option>
                    <option value="wuxia">Wuxia (Martial Arts, Jianghu)</option>
                    <option value="litrpg">LitRPG / System / Leveling</option>
                    <option value="urban">Urban Cultivation / Rebirth</option>
                    <option value="romance">Romance / Palace Intrigue</option>
                    <option value="general">General Fantasy</option>
                  </select>
                </Field>
                <Field label="Synopsis (Optional)">
                  <input type="text" placeholder="Brief plot or premise..." value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)} className={inputCls} />
                </Field>
              </div>

              {/* Optional first chapter */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">Initial Chapter 1 (Optional)</span>
                  <span className="text-xs text-slate-500 ml-auto">Can add later</span>
                </div>
                <input type="text" placeholder="Chapter 1 Title (e.g. 第一章 觉醒)" value={createFirstChapTitle}
                  onChange={(e) => setCreateFirstChapTitle(e.target.value)} className={inputCls} />
                <textarea placeholder="Paste Chapter 1 raw Chinese text here..."
                  value={createFirstChapContent} onChange={(e) => setCreateFirstChapContent(e.target.value)}
                  rows={4} className={`${inputCls} resize-y font-chinese`} />
              </div>

              <SubmitBtn loading={isLoading} icon={<PlusCircle className="w-4 h-4" />} label="Create Novel & Start Reading" />
            </form>
          )}

          {/* TAB: WEB URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleScrapeUrl} className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Enter any raw Chinese web novel chapter URL (e.g. 69shuba.tw, biquge, fanyedao). The scraper auto-extracts text, title, and links to next chapters.
              </p>

              <Field label="Chapter URL">
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input type="url" placeholder="https://69shuba.tw/txt/..." value={url}
                    onChange={(e) => setUrl(e.target.value)} required
                    className={`${inputCls} pl-10 font-mono`} />
                </div>
              </Field>

              {/* Quick sample buttons */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <p className="text-xs font-semibold text-slate-400">Quick-import sample novels:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '69shu: Martial Peak Ch. 1', url: 'https://www.69shuba.com/txt/11261/7636184' },
                    { label: '69shu: 百鬼夜行 Ch. 1', url: 'https://69shuba.tw/read/351296/396064' },
                    { label: 'fanyedao: 宝塔仙缘 Ch. 1', url: 'https://fanyedao.com/read/7083672225286458406/1' }
                  ].map((s) => (
                    <button key={s.url} type="button" onClick={() => setUrl(s.url)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium transition">
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Tip: Some sites (sto55.com) block scrapers with Cloudflare. Use open mirrors like 69shuba.tw instead.
                </p>
              </div>

              <SubmitBtn loading={isLoading} icon={<ArrowRight className="w-4 h-4" />} label="Fetch Chapter from Web" />
            </form>
          )}

          {/* TAB: PASTE */}
          {activeTab === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Novel Name">
                  <input type="text" placeholder="e.g. 凡人修仙传" value={novelTitle}
                    onChange={(e) => setNovelTitle(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Chapter Title">
                  <input type="text" placeholder="e.g. 第一章 山边小村" value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Raw Chinese Content *">
                <textarea placeholder="Paste the raw Chinese novel text here..." value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)} rows={9}
                  required className={`${inputCls} resize-y font-chinese`} />
              </Field>
              <SubmitBtn loading={isLoading} icon={<ArrowRight className="w-4 h-4" />} label="Import & Translate" />
            </form>
          )}

          {/* TAB: FILE */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Upload a raw Chinese .txt file. The system auto-splits it into chapters using patterns like <code className="text-amber-400 bg-black/30 px-1 py-0.5 rounded">第X章</code>.
              </p>
              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-white/[0.1] hover:border-amber-500/40 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-200">
                    {selectedFile ? selectedFile.name : 'Select or drop .txt novel file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">UTF-8 or GBK encoded text files</p>
                </div>
                <input type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
              </label>

              {filePreview && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-amber-300 text-sm">{filePreview.novelTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{filePreview.chaptersCount} chapters detected</p>
                  </div>
                  <button onClick={handleBatchImport} disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition disabled:opacity-50 shrink-0">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Import All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ──
const inputCls = 'w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white/[0.06] transition';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const SubmitBtn: React.FC<{ loading: boolean; icon: React.ReactNode; label: string }> = ({ loading, icon, label }) => (
  <button type="submit" disabled={loading}
    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-60">
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {label}
  </button>
);
