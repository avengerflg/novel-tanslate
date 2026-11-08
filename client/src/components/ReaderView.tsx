import React, { useState, useEffect } from 'react';
import { Chapter, Novel, ReaderSettings, TranslationSettings, GlossaryItem } from '../types/novel';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Sliders,
  List,
  Settings,
  BookOpen
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
      ? 'max-w-[640px]'
      : settings.maxWidth === 'medium'
      ? 'max-w-[780px]'
      : settings.maxWidth === 'wide'
      ? 'max-w-[940px]'
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
    <div className={`min-h-[100dvh] pb-28 sm:pb-36 transition-colors duration-200 theme-${settings.theme} relative`}>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Semantic Article Wrapper */}
      <article
        id="chapter-article"
        role="article"
        className="chapter-content article hentry entry-content reader-article mx-auto px-4 sm:px-6 md:px-10 pt-6 sm:pt-12"
        itemScope
        itemType="http://schema.org/Article"
      >
        <div className={`mx-auto ${maxWidthClass}`}>
          {/* Chapter Header */}
          <header className="entry-header mb-8 sm:mb-12 pb-6 sm:pb-8 border-b border-black/10 dark:border-white/10 text-center">
            {/* Novel Title Subtitle */}
            <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold opacity-60 mb-2 font-cinzel">
              {novel.translatedTitle || novel.title}
            </p>

            {/* Main Chapter Title */}
            <h1
              className="entry-title text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-tight"
              itemProp="headline"
            >
              {chapter.translatedTitle || chapter.chineseTitle}
            </h1>

            {/* Original Chinese Subtitle */}
            {chapter.translatedTitle && (
              <p className="text-sm sm:text-base opacity-50 font-chinese tracking-wide mb-4">
                {chapter.chineseTitle}
              </p>
            )}

            {/* Metadata Pills */}
            <div className="entry-meta flex items-center justify-center flex-wrap gap-2 text-xs opacity-60 mt-2">
              {novel.author && (
                <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" itemProp="author">
                  Author: {novel.author}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                Ch. {chapter.index} of {chapters.length}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 capitalize" itemProp="genre">
                {novel.genre}
              </span>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {chapter.status !== 'translated' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTranslateChapter(chapter.id)}
                    disabled={isTranslating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition disabled:opacity-50 touch-active"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Translating ({elapsedSeconds}s)...</span>
                      </>
                    ) : chapter.status === 'error' ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry Translation ({translationSettings.provider.toUpperCase()})</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Translate Chapter ({translationSettings.provider.toUpperCase()})</span>
                      </>
                    )}
                  </button>

                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={onOpenAISettings}
                      className="px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-amber-500 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition touch-active"
                      title="AI Settings"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </button>
                  )}
                </div>
              )}

              {chapter.status === 'translated' && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Translated</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onTranslateChapter(chapter.id)}
                    disabled={isTranslating}
                    className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium flex items-center gap-1.5 transition opacity-75 hover:opacity-100 touch-active"
                    title="Re-translate with latest glossary"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                    <span>Re-translate</span>
                  </button>
                  {onOpenAISettings && (
                    <button
                      type="button"
                      onClick={onOpenAISettings}
                      className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1 transition opacity-75 hover:opacity-100 text-amber-500 dark:text-amber-400 touch-active"
                      title="AI & API Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Quick Navigation / Next Web Chapter Fetch */}
              {nextChapter ? (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateChapter(nextChapter.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition text-amber-500 dark:text-amber-400 touch-active"
                >
                  <span>Ch. {nextChapter.index}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : chapter.nextUrl && onFetchNextWebChapter ? (
                <button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isFetchingNext}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 touch-active"
                >
                  {isFetchingNext ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching Ch. {chapter.index + 1}...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>+ Fetch Ch. {chapter.index + 1}</span>
                    </>
                  )}
                </button>
              ) : null}

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:flex px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs items-center gap-1.5 transition opacity-65 hover:opacity-100 touch-active"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reading Mode'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>

              {chapter.sourceUrl && (
                <a
                  href={chapter.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs flex items-center gap-1.5 transition opacity-65 hover:opacity-100"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Source Web</span>
                </a>
              )}
            </div>
          </header>

          {/* Discovered Entities Banner */}
          {discoveredTerms && discoveredTerms.length > 0 && onAddGlossaryItems && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-300">
                    {discoveredTerms.length} New Proper Nouns Discovered
                  </p>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    Identified characters/terms (e.g.{' '}
                    {discoveredTerms.slice(0, 2).map((t) => `${t.original} → ${t.translation}`).join(', ')}). Add to glossary memory?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onAddGlossaryItems(discoveredTerms)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition touch-active"
                >
                  Accept All
                </button>
                {onDismissDiscoveredTerms && (
                  <button
                    type="button"
                    onClick={onDismissDiscoveredTerms}
                    className="px-2.5 py-1.5 text-xs text-amber-300/60 hover:text-amber-300 transition"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Translation Error Banner */}
          {chapter.status === 'error' && !isTranslating && (
            <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-red-300">
                    Translation Incomplete or Failed
                  </p>
                  <p className="text-xs text-red-200/80 mt-0.5 max-w-md">
                    {chapter.errorMessage || 'The AI service encountered an issue. You can retry or verify your API settings.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onTranslateChapter(chapter.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-black font-bold text-xs flex items-center gap-1.5 transition touch-active"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                {onOpenAISettings && (
                  <button
                    type="button"
                    onClick={onOpenAISettings}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-amber-400 text-xs font-semibold border border-white/[0.1] transition touch-active"
                  >
                    API Settings
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Translating Skeleton Progress */}
          {isTranslating && (
            <div className="my-12 p-8 sm:p-12 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-base sm:text-lg">
                  Translating with {translationSettings.provider.toUpperCase()} ({elapsedSeconds}s elapsed)...
                </p>
                <p className="text-xs sm:text-sm opacity-60 mt-1.5 max-w-md mx-auto">
                  Applying genre memory, resolving character pronouns, and refining English novel prose.
                </p>
              </div>
            </div>
          )}

          {/* Article Prose Content */}
          {!isTranslating && (
            <div
              className={`entry-content ${fontClass}`}
              itemProp="articleBody"
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight
              }}
            >
              {/* Mode 1: English Only */}
              {settings.viewMode === 'english' && chapter.status === 'translated' && (
                <div className="space-y-5 sm:space-y-6">
                  {translatedParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl transition"
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
                          <div className="mt-2 p-3 rounded-2xl bg-black/90 backdrop-blur-md text-white text-xs sm:text-sm font-chinese leading-relaxed border border-white/10 shadow-2xl animate-in fade-in duration-150">
                            <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1 tracking-wider">
                              Original Chinese Source
                            </span>
                            {rawParagraphs[idx]}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 2: Bilingual */}
              {settings.viewMode === 'bilingual' && chapter.status === 'translated' && (
                <div className="space-y-6 sm:space-y-7">
                  {translatedParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]"
                    >
                      <p itemProp="text" className="text-justify md:text-left font-medium">
                        {para}
                      </p>
                      {rawParagraphs[idx] && (
                        <p className="mt-2.5 text-xs sm:text-sm opacity-55 font-chinese leading-relaxed border-t border-black/5 dark:border-white/5 pt-2.5">
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
                    <div className="text-center opacity-40 py-16 flex flex-col items-center gap-2">
                      <BookOpen className="w-8 h-8" />
                      <p>No content available</p>
                    </div>
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

          {/* Bottom Desktop Chapter Navigation */}
          <footer className="mt-16 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevClick}
              disabled={!prevChapter}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 text-xs font-semibold transition disabled:opacity-30 disabled:pointer-events-none touch-active"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>

            <span className="text-xs opacity-50 font-mono">
              Chapter {chapter.index} of {chapters.length} ({Math.round(scrollProgress)}%)
            </span>

            <button
              type="button"
              onClick={handleNextClick}
              disabled={!nextChapter && !chapter.nextUrl}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-2 text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-30 disabled:pointer-events-none touch-active"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching Next Web Chapter...</span>
                </>
              ) : nextChapter ? (
                <>
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : chapter.nextUrl ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Fetch Next Chapter from Web</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <span>End of Novel</span>
              )}
            </button>
          </footer>
        </div>
      </article>

      {/* ── Mobile Floating Bottom Bar (Modern Kindle/Apple Books aesthetic) ── */}
      <nav
        aria-label="Mobile Reading Bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 py-2 sm:hidden flex items-center justify-between safe-bottom shadow-2xl"
      >
        {/* Prev Chapter */}
        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!prevChapter}
          aria-label="Previous Chapter"
          className="p-3 rounded-xl text-slate-300 hover:text-white disabled:opacity-20 touch-active transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center quick buttons */}
        <div className="flex items-center gap-1.5">
          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center gap-1.5 touch-active transition"
            >
              <List className="w-4 h-4 text-amber-400" />
              <span>Ch. {chapter.index} ({Math.round(scrollProgress)}%)</span>
            </button>
          )}

          {onOpenReaderSettings && (
            <button
              type="button"
              onClick={onOpenReaderSettings}
              aria-label="Reading Appearance"
              className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-slate-300 touch-active transition"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {onOpenAISettings && (
            <button
              type="button"
              onClick={onOpenAISettings}
              aria-label="AI Settings"
              className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-amber-400 touch-active transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Next Chapter */}
        <button
          type="button"
          onClick={handleNextClick}
          disabled={!nextChapter && !chapter.nextUrl}
          aria-label="Next Chapter"
          className="p-3 rounded-xl text-amber-400 hover:text-amber-300 disabled:opacity-20 touch-active transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};
