import React, { useState } from 'react';
import { Chapter } from '../types/novel';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Loader2,
  Trash2,
  Globe,
  ArrowRight,
  BookOpen
} from 'lucide-react';

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

    // Direct match if chapter already exists in state
    const existing = chapters.find((c) => c.index === num);
    if (existing) {
      onSelectChapter(existing.id);
      onClose();
      return;
    }

    // Attempt web fetch via mirror
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
      `chapter ${ch.index}`.includes(search.toLowerCase()) ||
      `${ch.index}` === search.trim();

    const matchesFilter =
      filter === 'all' ||
      (filter === 'translated' && ch.status === 'translated') ||
      (filter === 'raw' && ch.status !== 'translated');

    return matchesSearch && matchesFilter;
  });

  const translatedCount = chapters.filter((c) => c.status === 'translated').length;
  const progressPercent = Math.round((translatedCount / (chapters.length || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#161b22] border-r border-white/[0.08] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Table of Contents</h2>
              <p className="text-xs text-slate-400">
                {translatedCount} / {chapters.length} translated ({progressPercent}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 border-b border-white/[0.06] space-y-3 bg-[#0d1117]/50 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search chapters or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white/[0.06] transition"
            />
          </div>

          {/* Quick Jump Input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Jump to Ch. # (e.g. 150)..."
              value={jumpChapterNum}
              onChange={(e) => setJumpChapterNum(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJumpChapter();
              }}
              min={1}
              className="flex-1 px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white/[0.06] transition"
            />
            <button
              onClick={handleJumpChapter}
              disabled={!jumpChapterNum || isFetchingNext}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition disabled:opacity-40 flex items-center gap-1.5 shadow-sm touch-active"
            >
              {isFetchingNext ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Jump</span>
            </button>
          </div>

          {/* Filters & Batch translate button */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
              {(['all', 'translated', 'raw'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] capitalize font-medium transition ${
                    filter === f
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => onBatchTranslate(5)}
              disabled={isTranslatingBatch}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/25 transition disabled:opacity-40 touch-active"
            >
              {isTranslatingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Batching...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto Next 5</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 opacity-40" />
              <p>No matching chapters found</p>
            </div>
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
                  className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between group touch-active ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/35 text-amber-200'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                        #{ch.index}
                      </span>
                      <span
                        className={`text-xs font-medium truncate ${
                          isSelected ? 'text-amber-300 font-semibold' : 'text-slate-200'
                        }`}
                      >
                        {ch.translatedTitle || ch.chineseTitle}
                      </span>
                    </div>
                    {ch.translatedTitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-1 font-chinese pl-0.5">
                        {ch.chineseTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ch.status === 'translated' && (
                      <span title="Translated" className="text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    {ch.status === 'translating' && (
                      <span title="Translating" className="text-amber-400 animate-spin">
                        <Loader2 className="w-4 h-4" />
                      </span>
                    )}
                    {ch.status === 'raw' && (
                      <span title="Raw Chinese" className="text-slate-500">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                    {ch.status === 'error' && (
                      <span title="Error" className="text-red-400">
                        <AlertCircle className="w-4 h-4" />
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.06] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Web Fetch Next button */}
        {chapters.length > 0 && chapters[chapters.length - 1]?.nextUrl && onFetchNextWebChapter && (
          <div className="p-3 border-t border-white/[0.06] bg-[#0d1117]/80 shrink-0">
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
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 touch-active"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Chapter {chapters.length + 1}...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Fetch Chapter {chapters.length + 1} from Web</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
