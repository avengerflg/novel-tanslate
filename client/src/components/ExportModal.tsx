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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Export Novel</h2>
              <p className="text-xs text-slate-400">Download formatted ebook for your phone, e-reader, or Kindle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('epub')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                  format === 'epub'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Book className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold text-slate-100">EPUB Ebook</div>
                  <div className="text-[10px] text-slate-400">Kindle & Apple Books</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('txt')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                  format === 'txt'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold text-slate-100">Clean TXT</div>
                  <div className="text-[10px] text-slate-400">Plain text file</div>
                </div>
              </button>
            </div>
          </div>

          {/* Book Info */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Book Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Author Name</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Chapter filter */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Chapters to Include</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('translated')}
                className={`flex-1 py-1.5 rounded-lg border text-xs transition ${
                  filterMode === 'translated'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                Translated Only ({chapters.filter((c) => c.status === 'translated').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 rounded-lg border text-xs transition ${
                  filterMode === 'all'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                All Chapters ({chapters.length})
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || targetChapters.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Packaging...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export {targetChapters.length} Chapters
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

