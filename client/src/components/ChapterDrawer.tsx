import React, { useState } from 'react';
import { Chapter } from '../types/novel';
import { X, Search, CheckCircle2, Clock, AlertCircle, Play, Loader2, Trash2, Globe, ArrowRight } from 'lucide-react';

interface ChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterId?: string;
  onSelectChapter: (chapterId: string) => void;
  onBatchTranslate: (count: number) => void;
  isTranslatingBatch: boolean;
  onDeleteChapter?: (chapterId: string) => void;
  onFetchNextWebChapter?: (nextUrl: string) => Promise<void>;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterId,
  onSelectChapter,
  onBatchTranslate,
  isTranslatingBatch,
  onDeleteChapter,
  onFetchNextWebChapter
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'translated' | 'raw'>('all');
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [jumpChapterNum, setJumpChapterNum] = useState('');

  if (!isOpen) return null;

  const handleJumpChapter = async () => {
    const num = parseInt(jumpChapterNum.trim(), 10);
    if (!num || num < 1) return;

    // If chapter is already loaded, navigate directly
    const existing = chapters.find((c) => c.index === num);
    if (existing) {
      onSelectChapter(existing.id);
      onClose();
      return;
    }

    // Otherwise fetch from web novel mirror
    if (onFetchNextWebChapter) {
      let bookId = '7083672225286458406';
      for (const ch of chapters) {
        const m = (ch.sourceUrl || ch.nextUrl || '').match(/(\d{15,})/);
        if (m) {
          bookId = m[1];
          break;
        }
      }
      setIsFetchingNext(true);
      try {
        await onFetchNextWebChapter(`https://fanyedao.com/read/${bookId}/${num}`);
        onClose();
      } finally {
        setIsFetchingNext(false);
      }
    }
  };

  const filtered = chapters.filter((ch) => {
    const matchesSearch =
      ch.chineseTitle.toLowerCase().includes(search.toLowerCase()) ||
      (ch.translatedTitle && ch.translatedTitle.toLowerCase().includes(search.toLowerCase())) ||
      `chapter ${ch.index}`.includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'translated' && ch.status === 'translated') ||
      (filter === 'raw' && ch.status !== 'translated');

    return matchesSearch && matchesFilter;
  });

  const translatedCount = chapters.filter((c) => c.status === 'translated').length;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-slate-900 border-r border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Table of Contents</h2>
            <p className="text-[11px] text-slate-400">
              {translatedCount} / {chapters.length} translated ({Math.round((translatedCount / (chapters.length || 1)) * 100)}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Jump / Fetch Specific Chapter Number (1 - 2375) */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Jump to Ch. # (1 - 2375)..."
              value={jumpChapterNum}
              onChange={(e) => setJumpChapterNum(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpChapter();
              }}
              min={1}
              max={3000}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleJumpChapter}
              disabled={!jumpChapterNum || isFetchingNext}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-xs"
              title="Jump directly to this chapter"
            >
              {isFetchingNext ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Jump</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1 text-[11px]">
              {(['all', 'translated', 'raw'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded-md capitalize transition ${
                    filter === f ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => onBatchTranslate(5)}
              disabled={isTranslatingBatch}
              className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-semibold flex items-center gap-1 border border-amber-500/30 transition disabled:opacity-50"
            >
              {isTranslatingBatch ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Batch...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Auto Next 5
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chapters list */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No chapters found</div>
          ) : (
            filtered.map((ch) => {
              const isSelected = ch.id === currentChapterId;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    onSelectChapter(ch.id);
                    onClose();
                  }}
                  className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-500">#{ch.index}</span>
                      <span
                        className={`text-xs font-medium truncate ${
                          isSelected ? 'text-amber-300 font-semibold' : 'text-slate-200'
                        }`}
                      >
                        {ch.translatedTitle || ch.chineseTitle}
                      </span>
                    </div>
                    {ch.translatedTitle && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 font-chinese">
                        {ch.chineseTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ch.status === 'translated' && (
                      <span title="Translated" className="text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {ch.status === 'translating' && (
                      <span title="Translating" className="text-amber-400 animate-spin">
                        <Loader2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {ch.status === 'raw' && (
                      <span title="Raw Chinese" className="text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {ch.status === 'error' && (
                      <span title="Error" className="text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {onDeleteChapter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete chapter "${ch.chineseTitle}"?`)) {
                            onDeleteChapter(ch.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Quick fetch next chapter from web */}
        {chapters.length > 0 && chapters[chapters.length - 1]?.nextUrl && onFetchNextWebChapter && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/90">
            <button
              onClick={async () => {
                const nextUrl = chapters[chapters.length - 1].nextUrl!;
                setIsFetchingNext(true);
                try {
                  await onFetchNextWebChapter(nextUrl);
                  onClose();
                } finally {
                  setIsFetchingNext(false);
                }
              }}
              disabled={isFetchingNext}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching Chapter {chapters.length + 1}...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> Fetch Chapter {chapters.length + 1} from Web
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

