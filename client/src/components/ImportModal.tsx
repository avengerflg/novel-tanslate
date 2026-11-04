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

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onCreateBlankNovel,
  onImportSingleChapter,
  onImportBatchChapters
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'url' | 'paste' | 'file'>('create');
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

  // Handle Create Novel Form Submission
  const handleCreateNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setErrorMessage('Please enter a novel title');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await onCreateBlankNovel({
        title: createTitle.trim(),
        translatedTitle: createEnglishTitle.trim() || undefined,
        author: createAuthor.trim() || undefined,
        genre: createGenre,
        description: createDesc.trim() || undefined,
        initialChapter: createFirstChapContent.trim()
          ? {
              title: createFirstChapTitle.trim() || 'Chapter 1',
              content: createFirstChapContent.trim()
            }
          : undefined
      });

      // Reset form
      setCreateTitle('');
      setCreateEnglishTitle('');
      setCreateAuthor('');
      setCreateDesc('');
      setCreateFirstChapTitle('');
      setCreateFirstChapContent('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create novel');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL Scrape
  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch chapter from URL');
      }

      const data = await res.json();
      await onImportSingleChapter(
        data.novelTitle || 'Imported Web Novel',
        data.chapterTitle || 'Chapter',
        data.content,
        data.currentUrl,
        data.nextUrl,
        data.prevUrl
      );

      setUrl('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Scraping failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Paste Submission
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedContent.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      await onImportSingleChapter(
        novelTitle.trim() || 'My Chinese Novel',
        chapterTitle.trim() || 'Chapter',
        pastedContent.trim()
      );

      setNovelTitle('');
      setChapterTitle('');
      setPastedContent('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle TXT File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const text = await file.text();
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/parse-txt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          novelTitle: file.name.replace(/\.[^/.]+$/, '')
        })
      });

      if (!res.ok) throw new Error('Failed to parse text file');

      const parsed = await res.json();
      setFilePreview({
        novelTitle: parsed.novelTitle,
        chaptersCount: parsed.chapters.length
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not parse TXT file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const text = await selectedFile.text();
      const res = await fetch('/api/parse-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          novelTitle: filePreview?.novelTitle || selectedFile.name.replace(/\.[^/.]+$/, '')
        })
      });

      const parsed = await res.json();
      await onImportBatchChapters(parsed.novelTitle, parsed.chapters);

      setSelectedFile(null);
      setFilePreview(null);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Batch import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">Add Novel to Library</h2>
              <p className="text-[11px] text-slate-400">Create novel, scrape from website, or upload TXT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-800 text-xs font-medium text-center">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'create'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookPlus className="w-3.5 h-3.5" />
            <span className="truncate">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`py-2.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'url'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate">Web URL</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'paste'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">Paste</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`py-2.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'file'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate">TXT File</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 text-sm text-slate-200">
          {/* TAB 1: CREATE NOVEL */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateNovelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Novel Title (Chinese or Pinyin) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 完美世界 (Perfect World) or 逆天邪神"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    English Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Against the Gods"
                    value={createEnglishTitle}
                    onChange={(e) => setCreateEnglishTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Author (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mars Gravity"
                    value={createAuthor}
                    onChange={(e) => setCreateAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Genre / Theme
                  </label>
                  <select
                    value={createGenre}
                    onChange={(e) => setCreateGenre(e.target.value as Novel['genre'])}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-medium capitalize"
                  >
                    <option value="xianxia">Xianxia (Immortal Cultivation, Dao, Tribulations)</option>
                    <option value="wuxia">Wuxia (Martial Arts, Jianghu, Sects)</option>
                    <option value="litrpg">LitRPG / System / Leveling</option>
                    <option value="urban">Urban Cultivation / Rebirth</option>
                    <option value="romance">Romance / Palace Intrigue</option>
                    <option value="general">General Fantasy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Synopsis / Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief plot or premise..."
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Optional First Chapter Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Initial Chapter 1 (Optional)
                  </span>
                  <span className="text-[10px] text-slate-400">Can add later too</span>
                </div>
                <input
                  type="text"
                  placeholder="Chapter 1 Title (e.g. 第一章 觉醒)"
                  value={createFirstChapTitle}
                  onChange={(e) => setCreateFirstChapTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
                <textarea
                  placeholder="Paste Chapter 1 raw Chinese paragraphs here..."
                  value={createFirstChapContent}
                  onChange={(e) => setCreateFirstChapContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-chinese resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                <span>Create Novel & Start Reading</span>
              </button>
            </form>
          )}

          {/* TAB 2: WEB URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleScrapeUrl} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter the URL of any raw Chinese web novel chapter (e.g. 69shu, Biquge, etc.). The scraper will auto-extract the text, title, and link next chapters automatically!
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Chapter URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    placeholder="https://www.69shuba.com/txt/... or biquge URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              {/* Sample Quick Links */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-400">Quick-import popular novels from 69shu / Biquge:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUrl('https://69shuba.tw/read/351296/396064')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 transition font-medium"
                  >
                    百鬼夜行横推诸天 Ch. 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('https://fanyedao.com/read/7083672225286458406/1')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 transition"
                  >
                    宝塔仙缘 Ch. 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('https://www.69shuba.com/txt/11261/7636184')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                  >
                    Martial Peak Ch. 1
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tip: Some domains (like sto55.com) block scrapers with Cloudflare 403. Use open mirrors like 69shuba.tw or paste chapter text directly in the Paste tab.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Fetch Chapter from Web & Translate</span>
              </button>
            </form>
          )}

          {/* TAB 3: PASTE TEXT */}
          {activeTab === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Novel Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 凡人修仙传 (A Record of a Mortal's Journey)"
                    value={novelTitle}
                    onChange={(e) => setNovelTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 第一章 山边小村"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Raw Chinese Content *
                </label>
                <textarea
                  placeholder="Paste the raw Chinese novel text here..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs font-chinese resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Import Chapter & Start Translation</span>
              </button>
            </form>
          )}

          {/* TAB 4: FILE TXT UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Upload a raw Chinese web novel .txt file. The system will automatically split it into chapters using regex patterns like <code>第X章</code> or <code>Chapter X</code>.
              </p>

              <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition">
                <Upload className="w-8 h-8 text-amber-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Select or drop raw .txt novel file'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">UTF-8 or GBK encoded text files supported</span>
                <input type="file" accept=".txt" onChange={handleFileChange} className="hidden" />
              </label>

              {filePreview && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-amber-300">{filePreview.novelTitle}</p>
                    <p className="text-[11px] text-slate-400">{filePreview.chaptersCount} chapters detected</p>
                  </div>
                  <button
                    onClick={handleBatchImport}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Import All Chapters</span>
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
