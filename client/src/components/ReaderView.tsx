import React, { useState, useEffect } from 'react';
import { Chapter, Novel, ReaderSettings, TranslationSettings, GlossaryItem } from '../types/novel';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Globe,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Sliders,
  List,
  Settings
} from 'lucide-react';

interface ReaderViewProps {
  novel: Novel;
  chapter: Chapter;
  chapters: Chapter[];
  settings: ReaderSettings;
  translationSettings: TranslationSettings;
  onTranslateChapter: (chapterId: string) => Promise<void>;
  onNavigateChapter: (chapterId: string) => void;
  onFetchNextWebChapter?: (nextUrl: string) => Promise<void>;
  onAddGlossaryItems?: (items: GlossaryItem[]) => void;
  discoveredTerms?: GlossaryItem[];
  onDismissDiscoveredTerms?: () => void;
  isTranslating: boolean;
  onOpenDrawer?: () => void;
  onOpenReaderSettings?: () => void;
  onOpenAISettings?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  novel,
  chapter,
  chapters,
  settings,
  translationSettings,
  onTranslateChapter,
  onNavigateChapter,
  onFetchNextWebChapter,
  onAddGlossaryItems,
  discoveredTerms = [],
  onDismissDiscoveredTerms,
  isTranslating,
  onOpenDrawer,
  onOpenReaderSettings,
  onOpenAISettings
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer for active translation
  useEffect(() => {
    let timer: any;
    if (isTranslating) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTranslating]);

  // Scroll percentage tracker for reading progress
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
        setScrollProgress(pct);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Find prev / next chapter in current novel list
  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // Split into paragraphs
  const rawParagraphs = (chapter.rawChineseContent || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const translatedParagraphs = (chapter.translatedContent || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Responsive max width style
  const maxWidthClass =
    settings.maxWidth === 'narrow'
      ? 'max-w-[620px]'
      : settings.maxWidth === 'medium'
      ? 'max-w-[760px]'
      : settings.maxWidth === 'wide'
      ? 'max-w-[920px]'
      : 'max-w-5xl';

  // Font family class
  const fontClass =
    settings.fontFamily === 'literata'
      ? 'font-literata'
      : settings.fontFamily === 'lora'
      ? 'font-lora'
      : settings.fontFamily === 'serif'
      ? 'font-serif'
      : 'font-sans';

  const handleNextClick = async () => {
    if (nextChapter) {
      onNavigateChapter(nextChapter.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (chapter.nextUrl && onFetchNextWebChapter) {
      setIsFetchingNext(true);
      try {
        await onFetchNextWebChapter(chapter.nextUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsFetchingNext(false);
      }
    }
  };

  const handlePrevClick = () => {
    if (prevChapter) {
      onNavigateChapter(prevChapter.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-[100dvh] pb-24 sm:pb-32 transition-colors duration-200 theme-${settings.theme} relative`}>
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Semantic Article for Safari Reader & Chrome Reading Mode Support */}
      <article
        id="chapter-article"
        role="article"
        className="chapter-content article hentry entry-content reader-article mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-10"
        itemScope
        itemType="http://schema.org/Article"
      >
        <div className={`mx-auto ${maxWidthClass}`}>
          {/* Article Header */}
          <header className="entry-header mb-8 sm:mb-10 pb-6 border-b border-black/10 dark:border-white/10 text-center">
            <p className="text-xs uppercase tracking-widest font-bold opacity-60 mb-2 font-cinzel">
              {novel.translatedTitle || novel.title}
            </p>

            <h1
              className="entry-title text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 leading-tight"
              itemProp="headline"
            >
              {chapter.translatedTitle || chapter.chineseTitle}
            </h1>

            {chapter.translatedTitle && (
              <p className="text-sm opacity-50 font-chinese tracking-wide mb-3">
                {chapter.chineseTitle}
              </p>
            )}

            <div className="entry-meta text-[11px] sm:text-xs opacity-50 flex items-center justify-center flex-wrap gap-2 sm:gap-3 mt-1">
              {novel.author && (
                <>
                  <span itemProp="author">Author: {novel.author}</span>
                  <span>•</span>
                </>
              )}
              <span>Chapter {chapter.index} of {chapters.length}</span>
              <span>•</span>
              <span itemProp="genre" className="capitalize">{novel.genre}</span>
            </div>

            {/* Quick Action Toolbar */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {chapter.status !== 'translated' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTranslateChapter(chapter.id)}
                    disabled={isTranslating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Translating ({elapsedSeconds}s)...
                      </>
                    ) : chapter.status === 'error' ? (
                      <>
                        <RefreshCw className="w-4 h-4" /> Retry Translation ({translationSettings.provider.toUpperCase()})
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Translate Chapter ({translationSettings.provider.toUpperCase()})
                      </>
                    )}
                  </button>

                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={onOpenAISettings}
                      className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-amber-400 text-xs flex items-center gap-1.5 transition"
                      title="Change AI Provider or API Key"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="font-semibold text-slate-200">API Settings</span>
                    </button>
                  )}
                </div>
              )}

              {chapter.status === 'translated' && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Translation Saved
                  </span>
                  <button
                    type="button"
                    onClick={() => onTranslateChapter(chapter.id)}
                    disabled={isTranslating}
                    className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1.5 transition opacity-70 hover:opacity-100"
                    title="Run AI translation again with latest glossary"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} /> Re-translate
                  </button>
                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={onOpenAISettings}
                      className="px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1 transition opacity-70 hover:opacity-100 text-amber-400"
                      title="AI & API Settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="text-[11px] text-slate-200 hidden sm:inline">API</span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Navigation to Next Chapter or Fetch Next Chapter from Web */}
              {nextChapter ? (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateChapter(nextChapter.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1.5 transition text-amber-500 font-semibold"
                  title="Go to next chapter"
                >
                  <span>Ch. {nextChapter.index}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : chapter.nextUrl && onFetchNextWebChapter ? (
                <button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isFetchingNext}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-1.5 transition font-semibold disabled:opacity-50"
                  title="Fetch and add next chapter from web"
                >
                  {isFetchingNext ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching Ch. {chapter.index + 1}...
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" /> + Fetch Ch. {chapter.index + 1}
                    </>
                  )}
                </button>
              ) : null}

              {/* Fullscreen Ambient Mode Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:flex px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs items-center gap-1.5 transition opacity-60 hover:opacity-100"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Distraction-Free Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>

              {chapter.sourceUrl && (
                <a
                  href={chapter.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1.5 transition opacity-60 hover:opacity-100"
                >
                  <Globe className="w-3.5 h-3.5" /> Source Web
                </a>
              )}
            </div>
          </header>

          {/* Discovered Entities Banner */}
          {discoveredTerms && discoveredTerms.length > 0 && onAddGlossaryItems && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-300">
                    {discoveredTerms.length} New Entities Discovered
                  </p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    AI identified novel proper nouns (e.g.{' '}
                    {discoveredTerms.slice(0, 2).map((t) => `${t.original} -> ${t.translation}`).join(', ')}). Add to glossary memory?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onAddGlossaryItems(discoveredTerms)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap shadow-sm"
                >
                  Accept All
                </button>
                {onDismissDiscoveredTerms && (
                  <button
                    type="button"
                    onClick={onDismissDiscoveredTerms}
                    className="px-2 py-1.5 text-xs text-amber-300/60 hover:text-amber-300"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner when chapter translation failed */}
          {chapter.status === 'error' && !isTranslating && (
            <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-300">
                    Translation Incomplete or Failed
                  </p>
                  <p className="text-[11px] text-red-200/80 mt-0.5 max-w-md">
                    {chapter.errorMessage || 'The AI model timed out or encountered an issue. You can retry or verify your API settings.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onTranslateChapter(chapter.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 font-semibold text-xs whitespace-nowrap shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Now
                </button>
                {onOpenAISettings && (
                  <button
                    type="button"
                    onClick={onOpenAISettings}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs whitespace-nowrap"
                  >
                    API Settings
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Translating Skeleton Progress */}
          {isTranslating && (
            <div className="my-12 p-8 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-4 animate-pulse">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <div>
                <p className="font-semibold text-sm">
                  Translating with {translationSettings.provider.toUpperCase()} ({elapsedSeconds}s elapsed)...
                </p>
                <p className="text-xs opacity-60 mt-1 max-w-md mx-auto">
                  Applying genre memory, resolving character pronouns, and refining English novel prose. Free community models may take 30-75s for full chapters.
                </p>
              </div>
            </div>
          )}

          {/* Article Body Content */}
          {!isTranslating && (
            <div
              className={`entry-content ${fontClass}`}
              itemProp="articleBody"
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight
              }}
            >
              {/* Mode 1: English Only (Optimal Reading Flow) */}
              {settings.viewMode === 'english' && chapter.status === 'translated' && (
                <div className="space-y-4 sm:space-y-5">
                  {translatedParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg transition"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <p itemProp="text" className="indent-6 sm:indent-8 text-justify md:text-left selection:bg-amber-500/30">
                        {para}
                      </p>

                      {/* Tooltip with raw Chinese on hover */}
                      {settings.showChineseOnHover &&
                        hoveredIdx === idx &&
                        rawParagraphs[idx] && (
                          <div className="mt-1.5 p-2.5 rounded-xl bg-black/90 backdrop-blur-md text-white text-[13px] font-chinese leading-relaxed opacity-95 border border-white/10 shadow-xl">
                            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5 tracking-wider">
                              Raw Chinese Source
                            </span>
                            {rawParagraphs[idx]}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 2: Bilingual (English + Raw Chinese) */}
              {settings.viewMode === 'bilingual' && chapter.status === 'translated' && (
                <div className="space-y-5 sm:space-y-6">
                  {translatedParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]"
                    >
                      <p itemProp="text" className="text-justify md:text-left font-medium">
                        {para}
                      </p>
                      {rawParagraphs[idx] && (
                        <p className="mt-2 text-xs sm:text-sm opacity-50 font-chinese leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                          {rawParagraphs[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 3: Raw Chinese (or untranslated fallback) */}
              {(settings.viewMode === 'raw' || chapter.status !== 'translated') && (
                <div className="font-chinese space-y-4 sm:space-y-5 opacity-90">
                  {rawParagraphs.length === 0 ? (
                    <p className="text-center opacity-50 py-12">No content available</p>
                  ) : (
                    rawParagraphs.map((para, idx) => (
                      <p key={idx} itemProp="text" className="indent-8 leading-loose tracking-wide">
                        {para}
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Desktop Chapter Navigation Bar */}
          <footer className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevClick}
              disabled={!prevChapter}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-semibold transition disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Chapter
            </button>

            <span className="text-xs opacity-50 font-mono">
              Chapter {chapter.index} of {chapters.length} ({Math.round(scrollProgress)}%)
            </span>

            <button
              type="button"
              onClick={handleNextClick}
              disabled={!nextChapter && !chapter.nextUrl}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-2 text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-30 disabled:pointer-events-none"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching Next Web Chapter...
                </>
              ) : nextChapter ? (
                <>
                  Next Chapter <ChevronRight className="w-4 h-4" />
                </>
              ) : chapter.nextUrl ? (
                <>
                  <Globe className="w-4 h-4" /> Fetch Next Chapter from Web <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'End of Novel'
              )}
            </button>
          </footer>
        </div>
      </article>

      {/* Mobile Floating Reading Bar (Like Kindle / Apple Books Mobile Experience) */}
      <nav
        aria-label="Mobile Chapter Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 sm:hidden flex items-center justify-between safe-bottom shadow-2xl"
      >
        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!prevChapter}
          aria-label="Previous Chapter"
          className="p-2.5 rounded-xl text-slate-300 hover:text-white disabled:opacity-20 active:scale-95 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 active:scale-95 transition"
            >
              <List className="w-3.5 h-3.5 text-amber-400" />
              <span>Ch. {chapter.index} ({Math.round(scrollProgress)}%)</span>
            </button>
          )}

          {onOpenReaderSettings && (
            <button
              type="button"
              onClick={onOpenReaderSettings}
              aria-label="Reader Appearance"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200 active:scale-95 transition"
              title="Reader Appearance"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenAISettings && (
            <button
              type="button"
              onClick={onOpenAISettings}
              aria-label="AI Model & API Keys"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-amber-400 active:scale-95 transition"
              title="AI Model & API Keys"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!nextChapter && !chapter.nextUrl}
          aria-label="Next Chapter"
          className="p-2.5 rounded-xl text-amber-400 hover:text-amber-300 disabled:opacity-20 active:scale-95 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};
