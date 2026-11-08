import React, { useState } from 'react';
import { Chapter, Novel } from '../types/novel';
import { getStoredToken } from '../utils/api';
import { X, Download, Book, FileText, Loader2, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  chapters: Chapter[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  novel,
  chapters
}) => {
  const [format, setFormat] = useState<'epub' | 'txt'>('epub');
  const [filterMode, setFilterMode] = useState<'translated' | 'all'>('translated');
  const [author, setAuthor] = useState(novel.author || 'AI Translated');
  const [title, setTitle] = useState(novel.translatedTitle || novel.title);
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const targetChapters = chapters.filter((c) =>
    filterMode === 'all' ? true : c.status === 'translated'
  );

  const handleExport = async () => {
    if (targetChapters.length === 0) {
      alert('No chapters available for export matching your criteria.');
      return;
    }

    setIsExporting(true);

    try {
      if (format === 'epub') {
        const payload = {
          title,
          author,
          chapters: targetChapters.map((c) => ({
            title: c.translatedTitle || c.chineseTitle,
            content: c.translatedContent || c.rawChineseContent
          }))
        };

        const token = getStoredToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/export-epub', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to generate EPUB');

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.epub`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Plain TXT export
        let fullText = `${title}\nAuthor: ${author}\n\n====================\n\n`;
        targetChapters.forEach((c) => {
          fullText += `\n\n### ${c.translatedTitle || c.chineseTitle}\n\n`;
          fullText += (c.translatedContent || c.rawChineseContent) + '\n';
        });

        const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-md bg-[#161b22] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] modal-enter">

        {/* Mobile Handle */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Export Novel</h2>
              <p className="text-xs text-slate-400">Download formatted ebook for your devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-200">
          
          {/* Format selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('epub')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition touch-active ${
                  format === 'epub'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Book className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-100 text-sm">EPUB Ebook</div>
                  <div className="text-[10px] text-slate-400">Kindle & Apple Books</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('txt')}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition touch-active ${
                  format === 'txt'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-slate-100 text-sm">Clean TXT</div>
                  <div className="text-[10px] text-slate-400">Plain text file</div>
                </div>
              </button>
            </div>
          </div>

          {/* Book Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Book Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Author Name
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Chapter filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Chapters to Include
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('translated')}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition touch-active ${
                  filterMode === 'translated'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400'
                }`}
              >
                Translated Only ({chapters.filter((c) => c.status === 'translated').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition touch-active ${
                  filterMode === 'all'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-400'
                }`}
              >
                All Chapters ({chapters.length})
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || targetChapters.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 touch-active"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export {targetChapters.length} Chapters</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
