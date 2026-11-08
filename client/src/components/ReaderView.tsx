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
  Menu,
  Settings,
  Play,
  Pause,
  Languages,
  Scroll,
  Volume2,
  X,
  MessageCircle,
  MessageSquare,
  Send,
  Heart
} from 'lucide-react';

interface ChapterComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
}

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
  onUpdateSettings?: (newSettings: Partial<ReaderSettings>) => void;
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
  onOpenAISettings,
  onUpdateSettings
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Dynamic Scroll Visibility: show at first, hide when scrolling down, show when scrolling up
  const [controlsVisible, setControlsVisible] = useState(true);
  const [displayModeToast, setDisplayModeToast] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const toastTimeoutRef = useRef<any>(null);

  // Autoplay popup & execution state (matches Image 2)
  const [autoplayMenuOpen, setAutoplayMenuOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.2); // pixels per frame
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number>(-1);

  // Paragraph comments state (saved in localStorage)
  const [activeCommentPara, setActiveCommentPara] = useState<number | null>(null);
  const [paraCommentText, setParaCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, string[]>>({});

  // Chapter-level comments state (saved in localStorage)
  const [chapterComments, setChapterComments] = useState<ChapterComment[]>([]);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`novel_comments_${chapter.id}`);
      if (saved) setCommentsMap(JSON.parse(saved));
      else setCommentsMap({});
    } catch {}

    try {
      const savedCh = localStorage.getItem(`novel_chapter_comments_${chapter.id}`);
      if (savedCh) {
        setChapterComments(JSON.parse(savedCh));
      } else {
        const initial: ChapterComment[] = [
          {
            id: 'c1',
            author: 'DaoistSeeker',
            text: 'Great chapter! The cultivation realm breakthrough in this chapter is so crisp.',
            timestamp: '2 hours ago',
            likes: 5
          },
          {
            id: 'c2',
            author: 'SwordMaster99',
            text: 'Can’t wait to see what happens in the sect selection next!',
            timestamp: '5 hours ago',
            likes: 8
          }
        ];
        setChapterComments(initial);
        localStorage.setItem(`novel_chapter_comments_${chapter.id}`, JSON.stringify(initial));
      }
    } catch {}
  }, [chapter.id]);

  const handleAddComment = (paraIdx: number) => {
    if (!paraCommentText.trim()) return;
    const key = `novel_comments_${chapter.id}`;
    const pKey = `p_${paraIdx}`;
    const nextList = [...(commentsMap[pKey] || []), paraCommentText.trim()];
    const nextMap = { ...commentsMap, [pKey]: nextList };
    setCommentsMap(nextMap);
    try {
      localStorage.setItem(key, JSON.stringify(nextMap));
    } catch {}
    setParaCommentText('');
    setActiveCommentPara(null);
  };

  const handleAddChapterComment = () => {
    if (!newCommentText.trim()) return;
    const author = newCommentAuthor.trim() || 'Cultivator';
    const newComment: ChapterComment = {
      id: `c_${Date.now()}`,
      author,
      text: newCommentText.trim(),
      timestamp: 'Just now',
      likes: 0
    };
    const nextList = [newComment, ...chapterComments];
    setChapterComments(nextList);
    try {
      localStorage.setItem(`novel_chapter_comments_${chapter.id}`, JSON.stringify(nextList));
    } catch {}
    setNewCommentText('');
  };

  const handleLikeChapterComment = (commentId: string) => {
    const nextList = chapterComments.map((c) =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    setChapterComments(nextList);
    try {
      localStorage.setItem(`novel_chapter_comments_${chapter.id}`, JSON.stringify(nextList));
    } catch {}
  };

  const totalParagraphComments = Object.values(commentsMap).reduce((acc, list) => acc + list.length, 0);
  const totalCommentCount = chapterComments.length + totalParagraphComments;

  // Sync scroll speed with settings (low, normal, high, or wpm)
  useEffect(() => {
    if (settings.scrollSpeedPreset === 'low') {
      setScrollSpeed(0.6);
    } else if (settings.scrollSpeedPreset === 'high') {
      setScrollSpeed(2.2);
    } else {
      const pace = settings.readingPaceWpm ? Math.max(0.6, settings.readingPaceWpm / 200) : 1.2;
      setScrollSpeed(pace);
    }
  }, [settings.scrollSpeedPreset, settings.readingPaceWpm]);

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

  // Clean chapter title: removes repetitive "Chapter 26:", "Ch. 26", "第26章", etc.
  const cleanTitle = (rawTitle?: string) => {
    if (!rawTitle) return '';
    return rawTitle
      .replace(/^Chapter\s*\d+\s*[:：\-—]?\s*/i, '')
      .replace(/^Ch\s*\.?\s*\d+\s*[:：\-—]?\s*/i, '')
      .replace(/^第\s*[0-9零一二三四五六七八九十百千万]+\s*[章回节话集]\s*[:：\-—]?\s*/, '')
      .trim() || rawTitle;
  };

  const displayTitle = cleanTitle(chapter.translatedTitle || chapter.chineseTitle) || `Chapter ${chapter.index}`;

  const firstParaHasHeading =
    translatedParagraphs.length > 0 &&
    /^(Chapter\s*\d+|第\s*[0-9零一二三四五六七八九十百千万]+\s*[章回节话集])/i.test(translatedParagraphs[0]);

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

  // Scroll direction & progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.max(0, (currentY / docHeight) * 100));
        setScrollProgress(pct);

        // Infinite scroll: auto load next chapter near bottom if enabled
        if (settings.infiniteScrollEnabled && pct >= 98 && !isFetchingNext && !isTranslating) {
          handleNextClick();
        }
      }

      // If at top of chapter, always keep options visible unless hideHeaderInReader is set
      if (currentY <= 60 && !settings.hideHeaderInReader) {
        setControlsVisible(true);
      } else {
        const diff = currentY - lastScrollY.current;
        // Scroll down past threshold -> hide controls smoothly
        if (diff > 8) {
          setControlsVisible(false);
          setAutoplayMenuOpen(false);
        }
        // Scroll up past threshold -> reveal options again
        else if (diff < -8) {
          setControlsVisible(true);
        }
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [settings.infiniteScrollEnabled, settings.hideHeaderInReader, isFetchingNext, isTranslating]);

  // Tap on text area toggles controls visibility
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('nav') || target.closest('header')) {
      return;
    }
    setControlsVisible((prev) => !prev);
  };

  // Cycle display mode on 文/A button click
  const handleCycleViewMode = () => {
    const order: Array<ReaderSettings['viewMode']> = ['english', 'bilingual', 'raw'];
    const currentIdx = order.indexOf(settings.viewMode);
    const nextMode = order[(currentIdx + 1) % order.length];

    if (onUpdateSettings) {
      onUpdateSettings({ viewMode: nextMode });
    }

    const labels: Record<string, string> = {
      english: 'Display: English Only',
      bilingual: 'Display: Bilingual (Side-by-Side)',
      raw: 'Display: Original Chinese'
    };

    setDisplayModeToast(labels[nextMode]);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setDisplayModeToast(null);
    }, 2200);
  };

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
        if (settings.continueNextChapter !== false && (nextChapter || chapter.nextUrl)) {
          handleNextClick();
        }
        return;
      }

      setActiveSpeechIdx(currentIdx);

      // Follow text auto-scrolling
      if (settings.followText !== false) {
        const el = document.getElementById(`para-${currentIdx}`);
        if (el) {
          const block =
            settings.readingLine === 'top'
              ? 'start'
              : settings.readingLine === 'spot'
              ? 'nearest'
              : 'center';
          el.scrollIntoView({
            behavior: settings.scrollingBehavior === 'page' ? ('instant' as any) : 'smooth',
            block
          });
        }
      }

      const utterance = new SpeechSynthesisUtterance(paragraphs[currentIdx]);
      utterance.rate = settings.ttsRate || 1.0;
      utterance.pitch = 1.0;
      utterance.lang = chapter.status === 'translated' ? 'en-US' : 'zh-CN';

      if (settings.ttsVoice && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find((vox) => vox.name === settings.ttsVoice);
        if (v) utterance.voice = v;
      }

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
    settings.fontFamily === 'georgia'
      ? 'font-georgia'
      : settings.fontFamily === 'merriweather'
      ? 'font-merriweather'
      : settings.fontFamily === 'lora'
      ? 'font-lora'
      : settings.fontFamily === 'literata'
      ? 'font-literata'
      : settings.fontFamily === 'sourceserif'
      ? 'font-sourceserif'
      : settings.fontFamily === 'lexend'
      ? 'font-lexend'
      : settings.fontFamily === 'opensans'
      ? 'font-opensans'
      : settings.fontFamily === 'mono'
      ? 'font-mono'
      : settings.fontFamily === 'sans'
      ? 'font-sans'
      : 'font-serif';

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
    <div className={`min-h-[100dvh] pb-32 sm:pb-36 transition-colors duration-200 theme-${settings.theme} relative gpu-layer`}>
      
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/[0.06] z-50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ── Top Header (Exact Kayn Scans Style) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-[#0c0d10]/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between text-slate-100 select-none transition-all duration-300 ease-in-out gpu-layer ${
          controlsVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Circular Back Button `<` */}
        <button
          onClick={onBackToDetail || (() => window.history.back())}
          className="w-11 h-11 rounded-full bg-[#15161b] hover:bg-[#1f2027] border border-white/[0.08] flex items-center justify-center text-slate-200 hover:text-white transition shadow-sm touch-active shrink-0 z-10"
          title="Back to Novel Details"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center Title: "Ch. 26 / 390: Raise the Price" (Absolute Perfect Centering) */}
        <div className="absolute inset-x-16 top-0 bottom-0 flex items-center justify-center text-center pointer-events-none px-2">
          <p className="text-xs sm:text-sm truncate tracking-tight text-center max-w-full">
            <span className="text-slate-200 font-medium">Ch. {chapter.index}</span>
            <span className="text-slate-500 font-normal"> / {chapters.length}: </span>
            <span className="text-slate-300 font-normal">{displayTitle}</span>
          </p>
        </div>

        {/* Right: Circular Menu Button `≡` */}
        <button
          onClick={onOpenDrawer}
          className="w-11 h-11 rounded-full bg-[#15161b] hover:bg-[#1f2027] border border-white/[0.08] flex items-center justify-center text-slate-200 hover:text-white transition shadow-sm touch-active shrink-0 z-10"
          title="Table of Contents"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
      </header>

      {/* Sleek Floating Progress / XP Pill when scrolling down (Matches Image 10) */}
      <div
        className={`fixed top-4 right-4 z-30 transition-all duration-300 pointer-events-none ${
          !controlsVisible && scrollProgress > 2
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-4 opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14161f]/85 backdrop-blur-md border border-white/[0.08] text-[11px] font-medium text-slate-200 shadow-xl shadow-black/50">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <span className="text-xs">⚡</span> +1 XP
          </span>
          <span className="text-slate-600">—</span>
          <span className="text-slate-400">Chapter read</span>
        </div>
      </div>

      {/* ── Main Prose Content ── */}
      <article
        id="chapter-article"
        role="article"
        onClick={handleContentClick}
        className="chapter-content article hentry entry-content reader-article mx-auto px-4 sm:px-8 md:px-12 pt-20 sm:pt-24 cursor-pointer"
        itemScope
        itemType="http://schema.org/Article"
      >
        <div className={`mx-auto ${maxWidthClass}`}>
          
          {/* Chapter Main Title Display (Matches Image: Clean Title in Center) */}
          <div className="text-center my-6 sm:my-10">
            <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-slate-200">
              {displayTitle}
            </h1>
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
                  {!firstParaHasHeading && (
                    <p className="text-left text-slate-200 font-medium">
                      Chapter {chapter.index}: {displayTitle}
                    </p>
                  )}
                  {translatedParagraphs.map((para, idx) => {
                    const paraComments = commentsMap[`p_${idx}`] || [];
                    const isSpeaking = activeSpeechIdx === idx && settings.ttsHighlightMode !== 'off';
                    return (
                      <div
                        id={`para-${idx}`}
                        key={idx}
                        className={`relative group rounded-xl transition duration-150 ${
                          isSpeaking ? 'bg-amber-500/15 p-3 rounded-xl ring-1 ring-amber-500/40 shadow-sm' : ''
                        }`}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        <p itemProp="text" className="text-left selection:bg-amber-500/30">
                          {para}
                          {settings.paragraphComments !== false && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentPara(activeCommentPara === idx ? null : idx);
                              }}
                              className="inline-flex items-center gap-1 ml-2.5 px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 text-[11px] font-mono transition touch-active select-none align-middle"
                              title="Paragraph notes & comments"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {paraComments.length > 0 && <span>{paraComments.length}</span>}
                            </button>
                          )}
                        </p>

                        {/* Inline paragraph comments popover */}
                        {activeCommentPara === idx && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="my-3 p-3.5 rounded-2xl bg-[#14161f] border border-amber-500/30 shadow-2xl space-y-2.5 text-xs animate-in fade-in"
                          >
                            <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-white/[0.06] pb-2">
                              <span className="flex items-center gap-1.5 text-slate-200">
                                <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Paragraph Notes ({paraComments.length})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveCommentPara(null)}
                                className="w-6 h-6 rounded-full hover:bg-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white"
                              >
                                ✕
                              </button>
                            </div>

                            {paraComments.length > 0 ? (
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {paraComments.map((c, ci) => (
                                  <div key={ci} className="p-2 rounded-xl bg-white/[0.03] text-slate-200 border border-white/[0.04] leading-relaxed">
                                    {c}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic py-1">No comments on this paragraph yet. Add one below!</p>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Add note or comment..."
                                value={paraCommentText}
                                onChange={(e) => setParaCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddComment(idx);
                                }}
                                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddComment(idx)}
                                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition touch-active shrink-0"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

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
                    );
                  })}
                </div>
              )}

              {/* Mode 2: Bilingual */}
              {settings.viewMode === 'bilingual' && chapter.status === 'translated' && (
                <div className="space-y-6 sm:space-y-7">
                  {translatedParagraphs.map((para, idx) => {
                    const paraComments = commentsMap[`p_${idx}`] || [];
                    const isSpeaking = activeSpeechIdx === idx && settings.ttsHighlightMode !== 'off';
                    return (
                      <div
                        id={`para-${idx}`}
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] ${
                          isSpeaking ? 'ring-2 ring-amber-500/50 bg-amber-500/5' : ''
                        }`}
                      >
                        <p itemProp="text" className="text-justify md:text-left font-medium">
                          {para}
                          {settings.paragraphComments !== false && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentPara(activeCommentPara === idx ? null : idx);
                              }}
                              className="inline-flex items-center gap-1 ml-2.5 px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 text-[11px] font-mono transition touch-active select-none align-middle"
                              title="Paragraph notes & comments"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {paraComments.length > 0 && <span>{paraComments.length}</span>}
                            </button>
                          )}
                        </p>
                        {rawParagraphs[idx] && (
                          <p className="mt-2.5 text-xs sm:text-sm opacity-55 font-chinese leading-relaxed border-t border-white/[0.06] pt-2.5">
                            {rawParagraphs[idx]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode 3: Raw Chinese */}
              {(settings.viewMode === 'raw' || chapter.status !== 'translated') && (
                <div className="font-chinese space-y-5 sm:space-y-6 opacity-90">
                  {rawParagraphs.length === 0 ? (
                    <div className="text-center opacity-40 py-16">No content available</div>
                  ) : (
                    rawParagraphs.map((para, idx) => (
                      <p id={`para-${idx}`} key={idx} itemProp="text" className="indent-8 leading-loose tracking-wide">
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

          {/* Chapter Comments Section (Standard Mode: "Full comment section with all comments visible") */}
          {!settings.infiniteScrollEnabled && (
            <section
              id="chapter-comments"
              className="mt-16 pt-10 border-t border-white/[0.08] space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Chapter Comments ({chapterComments.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">Join the discussion with fellow readers</p>
                  </div>
                </div>
              </div>

              {/* Add Comment Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#14161e] border border-white/[0.08] space-y-3 shadow-md">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Your reader name (optional)"
                    value={newCommentAuthor}
                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                    className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="What did you think of this chapter?"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleAddChapterComment}
                    disabled={!newCommentText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-amber-500/20 touch-active"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {chapterComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#13151b] border border-white/[0.06] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/20">
                          {c.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-200">{c.author}</span>
                        <span className="text-[10px] text-slate-500">• {c.timestamp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLikeChapterComment(c.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-rose-400 transition touch-active"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px]">{c.likes || 0}</span>
                      </button>
                    </div>
                    <p className="text-slate-300 leading-relaxed pl-9">{c.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* ── Floating Comment Button (Matches Screenshot 6) ── */}
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById('chapter-comments');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else if (onUpdateSettings) {
            onUpdateSettings({ paragraphComments: !settings.paragraphComments });
          }
        }}
        className={`fixed right-4 sm:right-6 z-30 w-12 h-12 rounded-full bg-[#181a24]/90 hover:bg-[#222533] backdrop-blur-md border border-white/[0.12] text-slate-300 hover:text-amber-400 flex items-center justify-center shadow-2xl shadow-black/60 transition-all duration-300 touch-active gpu-layer ${
          controlsVisible ? 'bottom-20 sm:bottom-6' : 'bottom-6'
        }`}
        title="Chapter Comments"
      >
        <MessageSquare className="w-5 h-5" />
        {totalCommentCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold text-[10px] shadow">
            {totalCommentCount}
          </span>
        )}
      </button>

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
                if (onUpdateSettings) onUpdateSettings({ autoplayMode: 'scroll' });
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
                if (onUpdateSettings) onUpdateSettings({ autoplayMode: 'readaloud' });
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

      {/* Temporary Display Mode Toast */}
      {displayModeToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-[#181a22]/95 backdrop-blur-xl border border-amber-500/30 text-amber-300 font-semibold text-xs shadow-2xl flex items-center gap-2">
            <Languages className="w-3.5 h-3.5" />
            <span>{displayModeToast}</span>
          </div>
        </div>
      )}

      {/* ── Floating Mobile Bar (Matches Image 1 Exactly!) ── */}
      <nav
        aria-label="Floating Reader Navigation"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#14161e]/95 backdrop-blur-xl border border-white/[0.12] rounded-full px-3 py-2 flex items-center gap-1.5 shadow-2xl shadow-black/80 max-w-[94vw] transition-all duration-300 ease-in-out gpu-layer ${
          controlsVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-28 opacity-0 pointer-events-none'
        }`}
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
          onClick={handleCycleViewMode}
          aria-label="Display Mode"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition touch-active ${
            settings.viewMode === 'bilingual'
              ? 'text-amber-400 bg-amber-500/10'
              : settings.viewMode === 'raw'
              ? 'text-orange-400 bg-orange-500/10'
              : 'text-slate-300 hover:text-amber-400 hover:bg-white/[0.06]'
          }`}
          title={`Display Mode: ${settings.viewMode.toUpperCase()} (Click to toggle English/Bilingual/Raw)`}
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
            <Menu className="w-4 h-4 stroke-[2.2]" />
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
