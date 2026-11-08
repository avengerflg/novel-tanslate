import React, { useState, useEffect, useRef } from 'react';
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
  Play,
  Pause,
  Languages,
  Scroll,
  Volume2,
  X
} from 'lucide-react';

interface ReaderViewProps {
  novel: Novel;
  chapter: Chapter;
  chapters: Chapter[];
  settings: ReaderSettings;
  translationSettings: TranslationSettings;
  onTranslateChapter: (chapterId: string) => Promise<void>;
  onNavigateChapter: (chapterId: string) => void;
  onBackToDetail?: () => void;
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
  onBackToDetail,
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

  // Autoplay popup & execution state (matches Image 2)
  const [autoplayMenuOpen, setAutoplayMenuOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // pixels per frame
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number>(-1);

  const autoScrollRef = useRef<number | null>(null);

  // Split content into clean paragraphs
  const rawParagraphs = (chapter.rawChineseContent || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const translatedParagraphs = (chapter.translatedContent || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Translation timer
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

  // Scroll percentage tracker
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

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-scroll loop
  useEffect(() => {
    if (isAutoScrolling) {
      let lastTime = performance.now();
      const step = (now: number) => {
        const delta = (now - lastTime) / 16.6;
        lastTime = now;
        window.scrollBy(0, scrollSpeed * delta);
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
          setIsAutoScrolling(false);
          return;
        }
        autoScrollRef.current = requestAnimationFrame(step);
      };
      autoScrollRef.current = requestAnimationFrame(step);
    } else if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Read Aloud feature using Web Speech API
  useEffect(() => {
    if (!isReadingAloud) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setActiveSpeechIdx(-1);
    }
  }, [isReadingAloud]);

  const startReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    setIsReadingAloud(true);
    setAutoplayMenuOpen(false);

    const paragraphs =
      chapter.status === 'translated' && translatedParagraphs.length > 0
        ? translatedParagraphs
        : rawParagraphs;

    let currentIdx = 0;

    const speakNext = () => {
      if (currentIdx >= paragraphs.length) {
        setIsReadingAloud(false);
        setActiveSpeechIdx(-1);
        return;
      }

      setActiveSpeechIdx(currentIdx);
      const utterance = new SpeechSynthesisUtterance(paragraphs[currentIdx]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = chapter.status === 'translated' ? 'en-US' : 'zh-CN';

      utterance.onend = () => {
        currentIdx++;
        speakNext();
      };

      utterance.onerror = () => {
        setIsReadingAloud(false);
        setActiveSpeechIdx(-1);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const stopAllAutoplay = () => {
    setIsAutoScrolling(false);
    setIsReadingAloud(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

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
    stopAllAutoplay();
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
    stopAllAutoplay();
    if (prevChapter) {
      onNavigateChapter(prevChapter.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-[100dvh] pb-32 sm:pb-36 transition-colors duration-200 theme-${settings.theme} relative bg-[#0c0d10]`}>
      
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/[0.06] z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── Top Header (Exact Kayn Scans Image 1 Style) ── */}
      <header className="sticky top-0 z-40 bg-[#0c0d10]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 h-16 flex items-center justify-between gap-3 text-slate-100 select-none">
        
        {/* Left: Circular Back Button `<` */}
        <button
          onClick={onBackToDetail || (() => window.history.back())}
          className="w-10 h-10 rounded-full bg-[#181a20] hover:bg-[#22252e] border border-white/[0.08] flex items-center justify-center text-slate-200 hover:text-white transition shadow-md touch-active shrink-0"
          title="Back to Novel Details"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Title: "Ch. 1 / 390: Mud Monkey" */}
        <div className="flex-1 min-w-0 text-center px-2">
          <p className="text-xs sm:text-sm font-semibold truncate text-slate-200">
            <span className="text-amber-400">Ch. {chapter.index}</span>
            <span className="text-slate-500 font-normal"> / {chapters.length}</span>
            <span className="text-slate-400">: </span>
            <span>{chapter.translatedTitle || chapter.chineseTitle}</span>
          </p>
        </div>

        {/* Right: Circular Menu Button `≡` */}
        <button
          onClick={onOpenDrawer}
          className="w-10 h-10 rounded-full bg-[#181a20] hover:bg-[#22252e] border border-white/[0.08] flex items-center justify-center text-slate-200 hover:text-white transition shadow-md touch-active shrink-0"
          title="Table of Contents"
        >
          <List className="w-5 h-5" />
        </button>
      </header>

      {/* ── Main Prose Content ── */}
      <article
        id="chapter-article"
        role="article"
        className="chapter-content article hentry entry-content reader-article mx-auto px-4 sm:px-8 md:px-12 pt-8 sm:pt-14"
        itemScope
        itemType="http://schema.org/Article"
      >
        <div className={`mx-auto ${maxWidthClass}`}>
          
          {/* Chapter Main Title Display (Kayn Scans Image 1) */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 leading-tight">
              {chapter.translatedTitle || chapter.chineseTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 font-medium">
              Chapter {chapter.index}: {chapter.translatedTitle || chapter.chineseTitle}
            </p>
            {chapter.translatedTitle && (
              <p className="text-xs sm:text-sm text-slate-500 font-chinese mt-1">
                {chapter.chineseTitle}
              </p>
            )}
          </div>

          {/* Quick Translate Button if not translated */}
          {chapter.status !== 'translated' && (
            <div className="mb-10 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-center space-y-4">
              <div>
                <p className="text-base font-bold text-amber-300">
                  {chapter.status === 'error' ? 'Translation Error' : 'Raw Chinese Chapter'}
                </p>
                <p className="text-xs text-amber-200/70 mt-1 max-w-md mx-auto">
                  Translate this chapter using {translationSettings.provider.toUpperCase()} with genre terminology memory.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onTranslateChapter(chapter.id)}
                  disabled={isTranslating}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 touch-active"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Translating ({elapsedSeconds}s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Translate Chapter</span>
                    </>
                  )}
                </button>

                {onOpenAISettings && (
                  <button
                    type="button"
                    onClick={onOpenAISettings}
                    className="px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-amber-400 border border-white/[0.1] text-xs font-semibold flex items-center gap-1.5 transition touch-active"
                  >
                    <Settings className="w-4 h-4" />
                    <span>API Settings</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Translating Skeleton */}
          {isTranslating && (
            <div className="my-12 p-8 sm:p-12 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-base sm:text-lg">
                  Translating with {translationSettings.provider.toUpperCase()} ({elapsedSeconds}s elapsed)...
                </p>
                <p className="text-xs sm:text-sm opacity-60 mt-1.5 max-w-md mx-auto">
                  Applying genre memory, resolving pronouns, and generating English novel prose.
                </p>
              </div>
            </div>
          )}

          {/* Discovered Entities Banner */}
          {discoveredTerms && discoveredTerms.length > 0 && onAddGlossaryItems && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-300">
                    {discoveredTerms.length} New Glossary Terms Found
                  </p>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    {discoveredTerms.slice(0, 2).map((t) => `${t.original} → ${t.translation}`).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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

          {/* Prose Content */}
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
                <div className="space-y-6 sm:space-y-7">
                  {translatedParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-xl transition ${
                        activeSpeechIdx === idx ? 'bg-amber-500/15 p-2 rounded-xl ring-1 ring-amber-500/40' : ''
                      }`}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <p itemProp="text" className="indent-6 sm:indent-8 text-justify md:text-left selection:bg-amber-500/30">
                        {para}
                      </p>

                      {/* Tooltip with raw Chinese on hover */}
                      {settings.showChineseOnHover && hoveredIdx === idx && rawParagraphs[idx] && (
                        <div className="mt-2 p-3 rounded-2xl bg-[#14161d] text-white text-xs sm:text-sm font-chinese leading-relaxed border border-white/10 shadow-2xl animate-in fade-in">
                          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1 tracking-wider">
                            Original Chinese
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
                      className={`p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] ${
                        activeSpeechIdx === idx ? 'ring-2 ring-amber-500/50 bg-amber-500/5' : ''
                      }`}
                    >
                      <p itemProp="text" className="text-justify md:text-left font-medium">
                        {para}
                      </p>
                      {rawParagraphs[idx] && (
                        <p className="mt-2.5 text-xs sm:text-sm opacity-55 font-chinese leading-relaxed border-t border-white/[0.06] pt-2.5">
                          {rawParagraphs[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mode 3: Raw Chinese */}
              {(settings.viewMode === 'raw' || chapter.status !== 'translated') && (
                <div className="font-chinese space-y-5 sm:space-y-6 opacity-90">
                  {rawParagraphs.length === 0 ? (
                    <div className="text-center opacity-40 py-16">No content available</div>
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

          {/* Bottom Desktop Chapter Nav */}
          <footer className="mt-16 pt-8 border-t border-white/[0.08] flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevClick}
              disabled={!prevChapter}
              className="px-5 py-3 rounded-2xl bg-[#14161d] hover:bg-[#1a1d26] border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none touch-active"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Chapter</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {Math.round(scrollProgress)}% read
            </span>

            <button
              type="button"
              onClick={handleNextClick}
              disabled={!nextChapter && !chapter.nextUrl}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none touch-active"
            >
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : nextChapter ? (
                <>
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : chapter.nextUrl ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Fetch Next Web Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <span>End of Novel</span>
              )}
            </button>
          </footer>
        </div>
      </article>

      {/* ── Autoplay Popup Menu (Matches Image 2 Exactly!) ── */}
      {autoplayMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setAutoplayMenuOpen(false)}
          />

          {/* Autoplay Popup Card */}
          <div className="relative w-full max-w-sm bg-[#16181f] border border-white/[0.1] rounded-3xl p-5 shadow-2xl shadow-black/80 z-10 modal-enter text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-100">Autoplay</h3>
              <button
                onClick={() => setAutoplayMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item 1: Auto Scroll */}
            <div
              onClick={() => {
                setIsReadingAloud(false);
                setIsAutoScrolling(!isAutoScrolling);
                setAutoplayMenuOpen(false);
              }}
              className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center gap-3.5 cursor-pointer transition touch-active mb-2.5"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Scroll className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">Scroll</span>
                  {isAutoScrolling && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">The page moves at your reading speed</p>
              </div>
            </div>

            {/* Speed selector for Auto Scroll if active */}
            {isAutoScrolling && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-2.5 text-xs">
                <span className="text-slate-400 font-medium">Scroll Speed</span>
                <div className="flex items-center gap-1.5">
                  {[0.5, 1, 1.5, 2.5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScrollSpeed(s)}
                      className={`px-2 py-0.5 rounded-lg font-mono font-bold transition ${
                        scrollSpeed === s
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Item 2: Read Aloud */}
            <div
              onClick={() => {
                if (isReadingAloud) {
                  stopAllAutoplay();
                } else {
                  startReadAloud();
                }
              }}
              className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center gap-3.5 cursor-pointer transition touch-active"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">Read aloud</span>
                  {isReadingAloud && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
                      Playing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">A voice reads and the page follows</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed">
              Your choice is remembered. Press Autoplay at any time to change it.
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Mobile Bar (Matches Image 1 Exactly!) ── */}
      <nav
        aria-label="Floating Reader Navigation"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#14161e]/95 backdrop-blur-xl border border-white/[0.12] rounded-full px-3 py-2 flex items-center gap-1.5 shadow-2xl shadow-black/80 max-w-[94vw]"
      >
        {/* 1. Prev Chapter `<` */}
        <button
          type="button"
          onClick={handlePrevClick}
          disabled={!prevChapter}
          aria-label="Previous Chapter"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-20 touch-active transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* 2. Autoplay `▷` */}
        <button
          type="button"
          onClick={() => setAutoplayMenuOpen(!autoplayMenuOpen)}
          aria-label="Autoplay"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition touch-active ${
            isAutoScrolling || isReadingAloud
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'text-slate-300 hover:text-amber-400 hover:bg-white/[0.06]'
          }`}
          title="Autoplay & Read Aloud"
        >
          {isAutoScrolling || isReadingAloud ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* 3. Language / Display Mode `文/A` */}
        <button
          type="button"
          onClick={() => {
            const nextMode =
              settings.viewMode === 'english'
                ? 'bilingual'
                : settings.viewMode === 'bilingual'
                ? 'raw'
                : 'english';
            if (onOpenReaderSettings) {
              onOpenReaderSettings();
            }
          }}
          aria-label="Display Mode"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/[0.06] transition touch-active"
          title="Display Mode (English / Bilingual / Raw)"
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* 4. Settings `⚙` */}
        {onOpenReaderSettings && (
          <button
            type="button"
            onClick={onOpenReaderSettings}
            aria-label="Reading Settings"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/[0.06] transition touch-active"
            title="Appearance & Typography"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* 5. Chapters `≡` */}
        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Table of Contents"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/[0.06] transition touch-active"
            title="Table of Contents"
          >
            <List className="w-4 h-4" />
          </button>
        )}

        {/* 6. Next Chapter `>` */}
        <button
          type="button"
          onClick={handleNextClick}
          disabled={!nextChapter && !chapter.nextUrl}
          aria-label="Next Chapter"
          className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 disabled:opacity-20 touch-active transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};
