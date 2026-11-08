import React, { useState } from 'react';
import { Novel, Chapter } from '../types/novel';
import {
  BookOpen,
  Play,
  Bookmark,
  Share2,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Plus,
  Maximize2,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Loader2,
  Globe
} from 'lucide-react';

interface NovelDetailViewProps {
  novel: Novel;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onReadChapter: (chapterId: string) => void;
  onOpenLibrary: () => void;
  onOpenGlossary: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenDrawer: () => void;
  onFetchNextWebChapter?: (nextUrl: string) => Promise<void>;
}

export const NovelDetailView: React.FC<NovelDetailViewProps> = ({
  novel,
  chapters,
  currentChapter,
  onReadChapter,
  onOpenLibrary,
  onOpenGlossary,
  onOpenExport,
  onOpenImport,
  onOpenDrawer,
  onFetchNextWebChapter
}) => {
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  const translatedCount = chapters.filter((c) => c.status === 'translated').length;
  const progressPercent = Math.round((translatedCount / (chapters.length || 1)) * 100);

  // Active chapter to continue reading
  const activeChapter = currentChapter || chapters[0];

  // Filtered chapters for inline list
  const filteredChapters = chapters.filter(
    (c) =>
      c.chineseTitle.toLowerCase().includes(chapterSearch.toLowerCase()) ||
      (c.translatedTitle && c.translatedTitle.toLowerCase().includes(chapterSearch.toLowerCase())) ||
      `chapter ${c.index}`.includes(chapterSearch.toLowerCase()) ||
      `${c.index}` === chapterSearch.trim()
  );

  // Genre tags
  const genreList: { label: string; color: string }[] = [];
  if (novel.genre === 'xianxia') {
    genreList.push({ label: 'Cultivation', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
    genreList.push({ label: 'Xianxia', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' });
    genreList.push({ label: 'Action', color: 'bg-red-500/15 text-red-300 border-red-500/30' });
  } else if (novel.genre === 'wuxia') {
    genreList.push({ label: 'Martial Arts', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
    genreList.push({ label: 'Wuxia', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' });
  } else if (novel.genre === 'litrpg') {
    genreList.push({ label: 'LitRPG', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' });
    genreList.push({ label: 'System', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' });
  } else {
    genreList.push({ label: novel.genre || 'Fantasy', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' });
  }

  // Cover image fallback generator
  const coverBg = novel.coverUrl ? (
    <img
      src={novel.coverUrl}
      alt={novel.translatedTitle || novel.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-[#1a1c24] via-[#12141a] to-[#0c0d12] flex flex-col justify-between p-3.5 border border-amber-500/20 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
      <div className="text-[10px] uppercase font-cinzel tracking-widest text-amber-400/80 font-bold">
        DaoReader
      </div>
      <div className="my-auto py-2">
        <span className="font-chinese text-2xl sm:text-3xl font-black text-amber-400 block tracking-wider drop-shadow-md">
          {novel.title.slice(0, 4)}
        </span>
        <p className="text-[11px] font-bold text-slate-200 mt-2 line-clamp-2 leading-tight">
          {novel.translatedTitle || novel.title}
        </p>
      </div>
      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
        {chapters.length} Chapters
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-100 pb-24 sm:pb-32">
      {/* Background Ambience Banner */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-600/15 via-[#0a0b0e]/70 to-[#0a0b0e]" />
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-36 sm:-mt-44 relative z-10">
        
        {/* Novel Hero Card (Matches Kayn Scans Image 4) */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
          
          {/* Cover Art Box */}
          <div className="relative group shrink-0 mx-auto sm:mx-0 w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-[#14161d]">
            {coverBg}
            <button
              onClick={() => setShowCoverModal(true)}
              className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/15 flex items-center gap-1 shadow-lg hover:bg-black transition"
            >
              <Maximize2 className="w-3 h-3 text-amber-400" />
              <span>View</span>
            </button>
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 text-center sm:text-left w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
              {novel.translatedTitle || novel.title}
            </h1>

            {novel.translatedTitle && (
              <p className="text-sm sm:text-base text-slate-400 font-chinese mt-1 tracking-wide">
                {novel.title}
              </p>
            )}

            {/* Scanlator / Translator line */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-black font-bold text-[10px]">
                道
              </div>
              <span className="font-semibold text-xs sm:text-sm text-slate-200">
                {novel.author ? `${novel.author}` : 'DaoReader AI'}
              </span>
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">
                ✓
              </span>
            </div>

            {/* Status Pills */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ongoing
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-medium">Web Novel</span>
              {novel.sourceUrl && (
                <>
                  <span className="text-slate-500">•</span>
                  <a
                    href={novel.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            {/* Add to collection button */}
            <div className="mt-3.5 flex justify-center sm:justify-start">
              <button
                onClick={onOpenImport}
                className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition touch-active"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add chapter from Web/TXT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Big Orange Continue Button (Image 4) */}
        {activeChapter && (
          <div className="mt-6">
            <button
              onClick={() => onReadChapter(activeChapter.id)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 transition touch-active"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Continue Chapter {activeChapter.index}</span>
            </button>
          </div>
        )}

        {/* 3 Secondary Actions Row (Library, Glossary, Share/Export) */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <button
            onClick={onOpenLibrary}
            className="py-3 px-2 rounded-2xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/[0.08] flex flex-col items-center justify-center gap-1 text-slate-300 font-medium text-xs transition touch-active"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Library</span>
          </button>
          <button
            onClick={onOpenGlossary}
            className="py-3 px-2 rounded-2xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/[0.08] flex flex-col items-center justify-center gap-1 text-slate-300 font-medium text-xs transition touch-active"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Glossary</span>
          </button>
          <button
            onClick={onOpenExport}
            className="py-3 px-2 rounded-2xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/[0.08] flex flex-col items-center justify-center gap-1 text-slate-300 font-medium text-xs transition touch-active"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Export EPUB</span>
          </button>
        </div>

        {/* Genre Tags Row */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          {genreList.map((g, idx) => (
            <span
              key={idx}
              className={`px-3.5 py-1 rounded-xl text-xs font-semibold border ${g.color}`}
            >
              {g.label}
            </span>
          ))}
          <span className="px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 text-xs font-medium flex items-center gap-1">
            <span>All {genreList.length}</span>
            <ChevronDown className="w-3 h-3" />
          </span>
        </div>

        {/* Progress Bar Card (Image 4) */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#14161d] border border-white/[0.08]">
          {/* Progress bar track */}
          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-400">
              {translatedCount} of {chapters.length} chapters translated
            </span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">{progressPercent}%</span>
              <button
                onClick={onOpenDrawer}
                className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Layers className="w-3 h-3" />
                <span>Manage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chapter List Header & Search */}
        <div className="mt-8 flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Chapters</h2>
            <span className="text-xs text-slate-500 font-mono">({chapters.length})</span>
          </div>

          {/* Quick search input */}
          <input
            type="text"
            placeholder="Search chapters..."
            value={chapterSearch}
            onChange={(e) => setChapterSearch(e.target.value)}
            className="w-44 sm:w-56 px-3 py-1.5 bg-[#14161d] border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Chapters Cards List (Matches Image 3) */}
        <div className="space-y-2">
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs bg-[#14161d]/50 rounded-2xl border border-white/[0.04]">
              No chapters match your search
            </div>
          ) : (
            filteredChapters.map((ch) => {
              const isCurrent = currentChapter?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => onReadChapter(ch.id)}
                  className={`p-3.5 rounded-2xl transition flex items-center justify-between cursor-pointer group touch-active ${
                    isCurrent
                      ? 'bg-amber-500/15 border border-amber-500/35 shadow-md'
                      : 'bg-[#14161d] hover:bg-[#1a1d26] border border-white/[0.06]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400 font-semibold">
                        Ch. {ch.index}
                      </span>
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-amber-300' : 'text-slate-100'
                        }`}
                      >
                        {ch.translatedTitle || ch.chineseTitle}
                      </span>
                    </div>
                    {ch.translatedTitle && (
                      <p className="text-xs text-slate-500 font-chinese truncate mt-1">
                        {ch.chineseTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {ch.status === 'translated' ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done</span>
                      </span>
                    ) : ch.status === 'translating' ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>Raw</span>
                      </span>
                    )}

                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] group-hover:bg-amber-500 group-hover:text-black flex items-center justify-center transition">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Fetch Next from Web Button */}
        {chapters.length > 0 && chapters[chapters.length - 1]?.nextUrl && onFetchNextWebChapter && (
          <div className="mt-5">
            <button
              onClick={async () => {
                const nextUrl = chapters[chapters.length - 1].nextUrl!;
                setIsFetchingNext(true);
                try {
                  await onFetchNextWebChapter(nextUrl);
                } finally {
                  setIsFetchingNext(false);
                }
              }}
              disabled={isFetchingNext}
              className="w-full py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 touch-active"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Chapter {chapters.length + 1} from Web...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>+ Fetch Chapter {chapters.length + 1} from Web Mirror</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Cover Zoom Modal */}
      {showCoverModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setShowCoverModal(false)}
        >
          <div className="relative max-w-sm w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            {coverBg}
          </div>
        </div>
      )}
    </div>
  );
};

