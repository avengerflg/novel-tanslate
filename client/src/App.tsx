import React, { useState, useEffect, useCallback } from 'react';
import { Novel, Chapter, GlossaryItem, ReaderSettings, TranslationSettings } from './types/novel';
import {
  AuthUser,
  fetchCurrentUser,
  removeStoredToken,
  fetchUserNovels,
  saveUserNovel,
  deleteUserNovel,
  fetchNovelChapters,
  saveUserChapter,
  saveBatchUserChapters,
  deleteUserChapter,
  fetchUserGlossary,
  saveUserGlossaryItem,
  deleteUserGlossaryItem,
  fetchUserSettings,
  saveUserSettings
} from './utils/api';
import {
  loadReaderSettings,
  saveReaderSettings,
  loadTranslationSettings,
  saveTranslationSettings
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { ReaderView } from './components/ReaderView';
import { ChapterDrawer } from './components/ChapterDrawer';
import { ImportModal } from './components/ImportModal';
import { GlossaryModal } from './components/GlossaryModal';
import { SettingsModal } from './components/SettingsModal';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { BookOpen, Sparkles, Upload, UserCheck, LogIn, Plus, Trash2, BookPlus } from 'lucide-react';

export const App: React.FC = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // App data state
  const [novels, setNovels] = useState<Novel[]>([]);
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [glossaryItems, setGlossaryItems] = useState<GlossaryItem[]>([]);

  // Settings: initialize from client-side localStorage
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => loadReaderSettings());
  const [translationSettings, setTranslationSettings] = useState<TranslationSettings>(() => loadTranslationSettings());

  // Status & Discovered items
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingBatch, setIsTranslatingBatch] = useState(false);
  const [discoveredTerms, setDiscoveredTerms] = useState<GlossaryItem[]>([]);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    if (readerSettings.theme === 'dark' || readerSettings.theme === 'oled') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [readerSettings.theme]);

  // Load user data whenever currentUser changes
  const loadUserData = useCallback(async (user: AuthUser) => {
    try {
      // 1. Load user preferences from server while keeping API keys client-side in localStorage
      const settings = await fetchUserSettings().catch(() => null);
      const localTrans = loadTranslationSettings();
      const localReader = loadReaderSettings();

      if (settings) {
        setTranslationSettings({
          ...settings.translationSettings,
          // Retain client-side API keys from local device storage
          geminiApiKey: localTrans.geminiApiKey || '',
          deepseekApiKey: localTrans.deepseekApiKey || '',
          openrouterApiKey: localTrans.openrouterApiKey || '',
          openaiApiKey: localTrans.openaiApiKey || '',
          customApiKey: localTrans.customApiKey || ''
        });
        setReaderSettings({
          ...localReader,
          ...settings.readerSettings
        });
      }

      // 2. Load novels
      const userNovels = await fetchUserNovels();
      setNovels(userNovels);

      if (userNovels.length > 0) {
        const activeNovel = userNovels[0];
        setCurrentNovel(activeNovel);

        // 3. Load chapters for first novel
        const novelChapters = await fetchNovelChapters(activeNovel.id);
        setChapters(novelChapters);

        const activeChap =
          novelChapters.find((c) => c.id === activeNovel.currentChapterId) || novelChapters[0];
        setCurrentChapter(activeChap || null);
      } else {
        setCurrentNovel(null);
        setChapters([]);
        setCurrentChapter(null);
      }

      // 4. Load glossary
      const glossary = await fetchUserGlossary();
      setGlossaryItems(glossary);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, []);

  // Initial check on mount: check if already signed in
  useEffect(() => {
    async function checkAuth() {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        await loadUserData(user);
      } else {
        // Open auth dialog by default so the user can sign in or register
        setIsAuthOpen(true);
      }
    }
    checkAuth();
  }, [loadUserData]);

  // Handle successful login or registration
  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    await loadUserData(user);
  };

  // Handle Logout
  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
    setNovels([]);
    setCurrentNovel(null);
    setChapters([]);
    setCurrentChapter(null);
    setGlossaryItems([]);
    setIsAuthOpen(true);
  };

  // Switch novel
  const handleSelectNovel = async (novelId: string) => {
    const novel = novels.find((n) => n.id === novelId);
    if (!novel) return;

    setCurrentNovel(novel);
    const novelChapters = await fetchNovelChapters(novel.id);
    setChapters(novelChapters);

    const activeChap =
      novelChapters.find((c) => c.id === novel.currentChapterId) || novelChapters[0];
    setCurrentChapter(activeChap || null);
  };

  // Switch chapter
  const handleSelectChapter = async (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !currentNovel) return;

    setCurrentChapter(chapter);
    const updatedNovel = { ...currentNovel, currentChapterId: chapter.id, updatedAt: Date.now() };
    setCurrentNovel(updatedNovel);
    await saveUserNovel(updatedNovel);
  };

  // Translate single chapter
  const handleTranslateChapter = async (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || !currentNovel) return;

    // Pick active API key
    let activeKey = '';
    let activeModel = '';
    if (translationSettings.provider === 'openrouter') {
      activeKey = translationSettings.openrouterApiKey;
      activeModel = translationSettings.openrouterModel || 'deepseek/deepseek-chat:free';
    } else if (translationSettings.provider === 'gemini') {
      activeKey = translationSettings.geminiApiKey;
      activeModel = translationSettings.geminiModel;
    } else if (translationSettings.provider === 'deepseek') {
      activeKey = translationSettings.deepseekApiKey;
      activeModel = translationSettings.deepseekModel;
    } else if (translationSettings.provider === 'openai') {
      activeKey = translationSettings.openaiApiKey;
      activeModel = translationSettings.openaiModel;
    } else {
      activeKey = translationSettings.customApiKey;
      activeModel = translationSettings.customModel;
    }

    // Sanitize API key: strip any carriage returns, newlines, and invisible unicode line/paragraph separators (\u2028, \u2029)
    activeKey = (activeKey || '').trim().replace(/[\r\n\u2028\u2029\s]/g, '');

    if (!activeKey) {
      setIsAISettingsOpen(true);
      return;
    }

    setIsTranslating(true);
    chapter.status = 'translating';
    setChapters([...chapters]);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chineseTitle: chapter.chineseTitle,
          chineseContent: chapter.rawChineseContent,
          genre: currentNovel.genre || translationSettings.defaultGenre,
          glossary: glossaryItems,
          provider: translationSettings.provider,
          apiKey: activeKey,
          model: activeModel,
          customBaseUrl: translationSettings.customBaseUrl
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Translation request failed');
      }

      const result = await res.json();
      const updatedChapter: Chapter = {
        ...chapter,
        translatedTitle: result.translatedTitle || chapter.translatedTitle || chapter.chineseTitle,
        translatedContent: result.translatedContent,
        status: 'translated',
        errorMessage: undefined,
        updatedAt: Date.now()
      };

      // 1. Save chapter to SQLite database via backend API
      await saveUserChapter(updatedChapter);

      // 2. Also cache in browser localStorage for offline resilience
      try {
        localStorage.setItem(`dao_cache_chap_${updatedChapter.id}`, JSON.stringify(updatedChapter));
      } catch {}

      // 3. Update React chapter state
      setChapters((prev) => prev.map((c) => (c.id === updatedChapter.id ? updatedChapter : c)));

      if (currentChapter?.id === updatedChapter.id) {
        setCurrentChapter(updatedChapter);
      }

      // 4. If currentNovel has no English title and translation gave one, persist novel translatedTitle
      if (currentNovel && (!currentNovel.translatedTitle || currentNovel.translatedTitle === currentNovel.title) && result.translatedTitle) {
        const potentialNovelTitle = result.translatedTitle.split(/Chapter|Ch\./i)[0].trim();
        if (potentialNovelTitle && potentialNovelTitle.length > 2) {
          const updatedNov = { ...currentNovel, translatedTitle: potentialNovelTitle, updatedAt: Date.now() };
          await saveUserNovel(updatedNov);
          setCurrentNovel(updatedNov);
          setNovels((prev) => prev.map((n) => (n.id === updatedNov.id ? updatedNov : n)));
        }
      }

      // Check for discovered glossary entities
      if (
        translationSettings.autoExtractGlossary &&
        Array.isArray(result.newGlossaryTerms) &&
        result.newGlossaryTerms.length > 0
      ) {
        const existingSet = new Set(glossaryItems.map((g) => g.original));
        const newItems: GlossaryItem[] = result.newGlossaryTerms
          .filter((t: any) => t.original && !existingSet.has(t.original))
          .map((t: any) => ({
            id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            original: t.original,
            translation: t.translation,
            category: t.category || 'term',
            notes: `Discovered in Ch. ${chapter.index}`
          }));

        if (newItems.length > 0) {
          setDiscoveredTerms(newItems);
        }
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      const failedChapter: Chapter = {
        ...chapter,
        status: 'error',
        errorMessage: err.message || 'Translation error'
      };
      await saveUserChapter(failedChapter);
      setChapters((prev) => prev.map((c) => (c.id === failedChapter.id ? failedChapter : c)));
      if (currentChapter?.id === failedChapter.id) {
        setCurrentChapter(failedChapter);
      }

      if (err.message && (err.message.includes('402') || err.message.includes('Insufficient Balance') || err.message.includes('API key') || err.message.includes('missing'))) {
        if (confirm(`Translation Notice: ${err.message}\n\nWould you like to open AI Settings to enter a valid key or change AI provider?`)) {
          setIsAISettingsOpen(true);
        }
      } else {
        alert(`Translation notice: ${err.message}`);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Batch translate
  const handleBatchTranslate = async (count: number) => {
    const untranslated = chapters.filter((c) => c.status !== 'translated').slice(0, count);
    if (untranslated.length === 0) {
      alert('All chapters are already translated!');
      return;
    }

    setIsTranslatingBatch(true);
    for (const ch of untranslated) {
      await handleTranslateChapter(ch.id);
    }
    setIsTranslatingBatch(false);
  };

  // Fetch next chapter from web automatically with retry & rate-limit resilience
  const handleFetchNextWebChapter = async (nextUrl: string) => {
    if (!currentNovel) return;

    try {
      let res: Response | null = null;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: nextUrl })
          });

          if (res.ok) break;

          if (res.status === 429 || res.status === 503) {
            console.warn(`[Scrape] Upstream mirror rate limited (${res.status}). Retrying attempt ${attempt}/3...`);
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            continue;
          } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server error ${res.status}`);
          }
        } catch (e: any) {
          lastErr = e;
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
      }

      if (!res || !res.ok) {
        throw new Error(lastErr?.message || 'Failed to fetch chapter from web mirror. Please try again in a few seconds.');
      }

      const data = await res.json();

      // Extract real chapter number from title (e.g. 第32章 -> 32) or URL
      let chapterNumber = chapters.length + 1;
      const titleMatch = (data.chapterTitle || '').match(/第\s*(\d+)\s*章/);
      if (titleMatch) {
        chapterNumber = parseInt(titleMatch[1], 10);
      } else {
        const urlMatch = nextUrl.match(/\/read\/\d+\/(\d+)/);
        if (urlMatch) chapterNumber = parseInt(urlMatch[1], 10);
      }

      // If chapter already exists in our array, switch to it
      const existing = chapters.find(
        (c) => c.index === chapterNumber || (c.sourceUrl && c.sourceUrl === data.currentUrl)
      );
      if (existing) {
        await handleSelectChapter(existing.id);
        return;
      }

      const newChapter: Chapter = {
        id: `chap_${Date.now()}`,
        novelId: currentNovel.id,
        index: chapterNumber,
        chineseTitle: data.chapterTitle || `Chapter ${chapterNumber}`,
        rawChineseContent: data.content,
        status: 'raw',
        sourceUrl: data.currentUrl,
        nextUrl: data.nextUrl,
        prevUrl: data.prevUrl,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveUserChapter(newChapter);

      const updatedChapters = [...chapters, newChapter].sort((a, b) => a.index - b.index);
      const updatedChapterIds = updatedChapters.map((c) => c.id);
      const updatedNovel = {
        ...currentNovel,
        chapterIds: updatedChapterIds,
        currentChapterId: newChapter.id
      };

      await saveUserNovel(updatedNovel);
      setCurrentNovel(updatedNovel);
      setChapters(updatedChapters);
      setCurrentChapter(newChapter);

      // Automatically translate newly fetched chapter
      await handleTranslateChapter(newChapter.id);
    } catch (err: any) {
      alert(`Failed to fetch next chapter: ${err.message}`);
    }
  };

  // Create a brand new novel manually
  const handleCreateBlankNovel = async (novelData: {
    title: string;
    translatedTitle?: string;
    author?: string;
    genre: Novel['genre'];
    description?: string;
    initialChapter?: { title: string; content: string };
  }) => {
    const novelId = `nov_${Date.now()}`;
    const newNovel: Novel = {
      id: novelId,
      title: novelData.title,
      translatedTitle: novelData.translatedTitle,
      author: novelData.author,
      description: novelData.description,
      genre: novelData.genre,
      chapterIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveUserNovel(newNovel);

    let createdChapter: Chapter | null = null;
    if (novelData.initialChapter && novelData.initialChapter.content.trim()) {
      const chapId = `chap_${Date.now()}_1`;
      createdChapter = {
        id: chapId,
        novelId,
        index: 1,
        chineseTitle: novelData.initialChapter.title || 'Chapter 1',
        rawChineseContent: novelData.initialChapter.content,
        status: 'raw',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await saveUserChapter(createdChapter);
      newNovel.chapterIds = [chapId];
      newNovel.currentChapterId = chapId;
      await saveUserNovel(newNovel);
    }

    const reloadedNovels = await fetchUserNovels();
    setNovels(reloadedNovels);
    const active = reloadedNovels.find((n) => n.id === novelId) || newNovel;
    setCurrentNovel(active);

    const reloadedChaps = await fetchNovelChapters(novelId);
    setChapters(reloadedChaps);
    setCurrentChapter(reloadedChaps[0] || null);

    if (createdChapter) {
      await handleTranslateChapter(createdChapter.id);
    }
  };

  // Restore sample chapters for testing or empty state
  const handleRestoreSampleChapters = async () => {
    if (!currentNovel) return;
    const sample1: Partial<Chapter> = {
      id: `chap_${Date.now()}_1`,
      novelId: currentNovel.id,
      index: 1,
      chineseTitle: '第一章 陨落的天才与神秘古戒',
      translatedTitle: 'Chapter 1: The Fallen Prodigy and the Mysterious Ancient Ring',
      rawChineseContent: `萧家演武场上，狂风呼啸，测验魔石碑前围满了年轻一代的族人。
“斗之力，三段！”
冰冷的五个大字从石碑上闪烁而出，宛如利刃般刺痛着所有人的目光。
台下的少年面容坚毅，双手悄然握紧成拳，指甲深深嵌入掌心，带来一丝钻心的刺痛。三年前，他曾是乌坦城百年难得一见的绝世天才，年仅十一岁便凝聚气旋，跨入斗者之境。然而一夜之间，体内的浩瀚斗气莫名蒸发，沦为了人人嗤之以鼻的废柴。
就在周围嘲讽与讥笑声四起之际，少年手指上一枚不起眼的漆黑古戒，忽然泛起了一丝常人难以察觉的幽光……`,
      status: 'translated',
      translatedContent: `On the martial drill grounds of the Xiao Clan, a fierce wind howled as the younger generation crowded tightly around the towering black testing stone monument.

"Dou Qi: Third Stage!"

The five cold, unyielding characters glowed brightly from the stone surface, like sharp blades stabbing into the gazes of everyone present.

Beneath the stage, the youth stood with a resolute expression, his hands quietly clenching into fists. His fingernails dug deeply into his palms, sending a piercing ache through his veins. Three years ago, he had been the most brilliant prodigy the city of Wutan had witnessed in centuries—condensing a Qi whirlpool and stepping into the Dou Practitioner realm at the mere age of eleven. Yet overnight, his vast sea of Dou Qi had vanished without a trace, reducing him to a crippled waste scorned by all.

As waves of mockery and sarcastic laughter rippled through the surrounding crowd, an inconspicuous, pitch-black ancient ring resting quietly on the youth's finger suddenly flickered with a faint, ghostly luminescence that went completely unnoticed by ordinary mortals...`
    };

    const sample2: Partial<Chapter> = {
      id: `chap_${Date.now()}_2`,
      novelId: currentNovel.id,
      index: 2,
      chineseTitle: '第二章 戒指里的老爷爷与九霄帝诀',
      translatedTitle: 'Chapter 2: The Old Master in the Ring and the Imperial Scripture',
      rawChineseContent: `月上中天，清冷的月光洒在后山孤崖之上。
少年盘膝而坐，正苦苦尝试运转功法，却发现吸收进体内的每一缕微弱天地能量，都在运转至经脉尽头时，被手指上的黑色古戒尽数吞噬。
“嘿嘿，小家伙，老夫沉睡三年，借了你一点斗气滋养残魂，今日终于苏醒了……”
一声带着沧桑与戏谑的苍老笑声，冷不防自古戒内幽幽传出！
少年猛然一惊，翻身跃起：“谁在装神弄鬼？！”
虚空之中，缕缕青烟自戒指盘旋升腾，化作一名虚幻缥缈的白袍老者，抚须而笑：“小家伙，你想重铸经脉，修得至高九霄帝诀吗？”`,
      status: 'raw'
    };

    await saveBatchUserChapters(currentNovel.id, [sample1, sample2]);
    const updatedNovel = {
      ...currentNovel,
      chapterIds: [sample1.id!, sample2.id!],
      currentChapterId: sample1.id!
    };
    await saveUserNovel(updatedNovel);
    setCurrentNovel(updatedNovel);
    const reloaded = await fetchNovelChapters(currentNovel.id);
    setChapters(reloaded);
    setCurrentChapter(reloaded[0] || null);
  };

  // Delete an entire novel
  const handleDeleteNovel = async (novelId: string) => {
    if (!confirm('Are you sure you want to delete this novel and all its chapters?')) return;
    await deleteUserNovel(novelId);
    const reloaded = await fetchUserNovels();
    setNovels(reloaded);
    if (reloaded.length > 0) {
      await handleSelectNovel(reloaded[0].id);
    } else {
      setCurrentNovel(null);
      setChapters([]);
      setCurrentChapter(null);
    }
  };

  // Import single chapter (URL or Paste)
  const handleImportSingleChapter = async (
    novelTitle: string,
    chapterTitle: string,
    content: string,
    sourceUrl?: string,
    nextUrl?: string,
    prevUrl?: string
  ) => {
    let targetNovel = novels.find(
      (n) => n.title.toLowerCase() === novelTitle.toLowerCase() || n.sourceUrl === sourceUrl
    );

    if (!targetNovel) {
      const novelId = `nov_${Date.now()}`;
      targetNovel = {
        id: novelId,
        title: novelTitle,
        genre: 'xianxia',
        sourceUrl,
        chapterIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await saveUserNovel(targetNovel);
      setNovels((prev) => [targetNovel!, ...prev]);
    }

    const novelChapters = await fetchNovelChapters(targetNovel.id);
    const newIndex = novelChapters.length + 1;

    const newChapter: Chapter = {
      id: `chap_${Date.now()}`,
      novelId: targetNovel.id,
      index: newIndex,
      chineseTitle: chapterTitle,
      rawChineseContent: content,
      status: 'raw',
      sourceUrl,
      nextUrl,
      prevUrl,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveUserChapter(newChapter);
    targetNovel.chapterIds = [...targetNovel.chapterIds, newChapter.id];
    targetNovel.currentChapterId = newChapter.id;
    await saveUserNovel(targetNovel);

    setCurrentNovel(targetNovel);
    const updatedChapters = [...novelChapters, newChapter];
    setChapters(updatedChapters);
    setCurrentChapter(newChapter);

    await handleTranslateChapter(newChapter.id);
  };

  // Batch import full TXT
  const handleImportBatchChapters = async (
    novelTitle: string,
    parsedChapters: { title: string; content: string }[]
  ) => {
    const novelId = `nov_${Date.now()}`;
    const chapterObjects: Partial<Chapter>[] = parsedChapters.map((ch, idx) => ({
      id: `chap_${Date.now()}_${idx + 1}`,
      novelId,
      index: idx + 1,
      chineseTitle: ch.title,
      rawChineseContent: ch.content,
      status: 'raw'
    }));

    const newNovel: Novel = {
      id: novelId,
      title: novelTitle,
      genre: 'xianxia',
      chapterIds: chapterObjects.map((c) => c.id!),
      currentChapterId: chapterObjects[0]?.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveUserNovel(newNovel);
    await saveBatchUserChapters(novelId, chapterObjects);

    const reloadedNovels = await fetchUserNovels();
    setNovels(reloadedNovels);
    const active = reloadedNovels.find((n) => n.id === novelId) || reloadedNovels[0];
    setCurrentNovel(active);

    const reloadedChapters = await fetchNovelChapters(novelId);
    setChapters(reloadedChapters);
    setCurrentChapter(reloadedChapters[0] || null);
  };

  // Glossary handlers
  const handleSaveGlossaryItem = async (item: GlossaryItem) => {
    await saveUserGlossaryItem(item);
    setGlossaryItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteGlossaryItem = async (id: string) => {
    await deleteUserGlossaryItem(id);
    setGlossaryItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleResetGlossaryDefaults = async () => {
    if (confirm('Reset to standard Cultivation & Xianxia glossary?')) {
      const reloaded = await fetchUserGlossary();
      setGlossaryItems(reloaded);
    }
  };

  const handleAddDiscoveredTerms = async (terms: GlossaryItem[]) => {
    for (const t of terms) {
      await saveUserGlossaryItem(t);
    }
    setGlossaryItems((prev) => [...terms, ...prev]);
    setDiscoveredTerms([]);
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (!currentNovel) return;
    await deleteUserChapter(chapterId);
    const filtered = chapters.filter((c) => c.id !== chapterId);
    setChapters(filtered);

    if (currentChapter?.id === chapterId) {
      setCurrentChapter(filtered[0] || null);
    }

    const updatedNovel = {
      ...currentNovel,
      chapterIds: filtered.map((c) => c.id),
      currentChapterId: filtered[0]?.id
    };
    await saveUserNovel(updatedNovel);
    setCurrentNovel(updatedNovel);
  };

  // Update Settings handler: persist client keys locally and preferences to server
  const handleSaveSettings = async (
    newTranslationSettings: TranslationSettings,
    newReaderSettings: ReaderSettings
  ) => {
    setTranslationSettings(newTranslationSettings);
    setReaderSettings(newReaderSettings);

    // Save full settings including client API keys to device localStorage
    saveTranslationSettings(newTranslationSettings);
    saveReaderSettings(newReaderSettings);

    // Save only non-sensitive preferences to server database (API keys remain strictly client-side)
    if (currentUser) {
      await saveUserSettings(
        {
          ...newTranslationSettings,
          geminiApiKey: '',
          deepseekApiKey: '',
          openrouterApiKey: '',
          openaiApiKey: '',
          customApiKey: ''
        },
        newReaderSettings
      ).catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        isImportOpen ||
        isGlossaryOpen ||
        isAISettingsOpen ||
        isReaderSettingsOpen ||
        isExportOpen ||
        isAuthOpen
      ) {
        return;
      }

      if (e.key === 'ArrowRight' && chapters.length > 0 && currentChapter) {
        const currIdx = chapters.findIndex((c) => c.id === currentChapter.id);
        if (currIdx < chapters.length - 1) {
          handleSelectChapter(chapters[currIdx + 1].id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowLeft' && chapters.length > 0 && currentChapter) {
        const currIdx = chapters.findIndex((c) => c.id === currentChapter.id);
        if (currIdx > 0) {
          handleSelectChapter(chapters[currIdx - 1].id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    chapters,
    currentChapter,
    isImportOpen,
    isGlossaryOpen,
    isAISettingsOpen,
    isReaderSettingsOpen,
    isExportOpen,
    isAuthOpen
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      {/* Top Navbar */}
      <Navbar
        novels={novels}
        currentNovel={currentNovel}
        currentChapter={currentChapter}
        glossaryCount={glossaryItems.length}
        currentUser={currentUser}
        onSelectNovel={handleSelectNovel}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenReaderSettings={() => setIsReaderSettingsOpen(true)}
        onOpenAISettings={() => setIsAISettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <BookOpen className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to DaoReader</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              Sign in or create your private reader account. Each reader has their own isolated library, reading progress, and customized translation glossary!
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Account
            </button>
          </div>
        ) : novels.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
            <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <BookOpen className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your Novel Library is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Create your own Chinese web novel entry, scrape directly from Chinese websites (69shu, biquge), paste raw text, or upload a TXT file to start reading.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Add / Create Novel
              </button>
            </div>
          </div>
        ) : currentNovel && (!currentChapter || chapters.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
            <div className="p-4 rounded-3xl bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
              <BookOpen className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold mb-1 text-slate-100">
              {currentNovel.translatedTitle || currentNovel.title}
            </h2>
            {currentNovel.translatedTitle && (
              <p className="text-xs text-slate-400 font-chinese mb-2">{currentNovel.title}</p>
            )}
            <p className="text-xs text-amber-300/80 mb-6 max-w-sm">
              This novel does not have any chapters yet. Add your first chapter or restore the sample cultivation chapters to test the AI reader!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> + Add / Scrape Chapter
              </button>
              <button
                onClick={handleRestoreSampleChapters}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Restore Sample Chapters
              </button>
              <button
                onClick={() => handleDeleteNovel(currentNovel.id)}
                className="px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Novel
              </button>
            </div>
          </div>
        ) : currentNovel && currentChapter ? (
          <ReaderView
            novel={currentNovel}
            chapter={currentChapter}
            chapters={chapters}
            settings={readerSettings}
            translationSettings={translationSettings}
            onTranslateChapter={handleTranslateChapter}
            onNavigateChapter={handleSelectChapter}
            onFetchNextWebChapter={handleFetchNextWebChapter}
            onAddGlossaryItems={handleAddDiscoveredTerms}
            discoveredTerms={discoveredTerms}
            onDismissDiscoveredTerms={() => setDiscoveredTerms([])}
            isTranslating={isTranslating}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenReaderSettings={() => setIsReaderSettingsOpen(true)}
            onOpenAISettings={() => setIsAISettingsOpen(true)}
          />
        ) : null}
      </main>

      {/* Slide-out Table of Contents Drawer */}
      <ChapterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        chapters={chapters}
        currentChapterId={currentChapter?.id}
        onSelectChapter={handleSelectChapter}
        onBatchTranslate={handleBatchTranslate}
        isTranslatingBatch={isTranslatingBatch}
        onDeleteChapter={handleDeleteChapter}
        onFetchNextWebChapter={handleFetchNextWebChapter}
      />

      {/* Import & Add Novel Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onCreateBlankNovel={handleCreateBlankNovel}
        onImportSingleChapter={handleImportSingleChapter}
        onImportBatchChapters={handleImportBatchChapters}
      />

      {/* Glossary Modal */}
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        items={glossaryItems}
        onSaveItem={handleSaveGlossaryItem}
        onDeleteItem={handleDeleteGlossaryItem}
        onResetDefaults={handleResetGlossaryDefaults}
      />

      {/* Reader Appearance Settings Modal */}
      <ReaderSettingsModal
        isOpen={isReaderSettingsOpen}
        onClose={() => setIsReaderSettingsOpen(false)}
        settings={readerSettings}
        onChange={(newSettings) => {
          handleSaveSettings(translationSettings, newSettings);
        }}
        onOpenAISettings={() => setIsAISettingsOpen(true)}
      />

      {/* AI Translation Settings Modal */}
      <SettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
        settings={translationSettings}
        onSave={(newSettings) => {
          handleSaveSettings(newSettings, readerSettings);
        }}
      />

      {/* Export Modal */}
      {currentNovel && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          novel={currentNovel}
          chapters={chapters}
        />
      )}

      {/* Auth Modal (Login & Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
