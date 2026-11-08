import { Novel, Chapter, GlossaryItem, ReaderSettings, TranslationSettings } from '../types/novel';
import { DEFAULT_GLOSSARY } from './defaultGlossary';

const DB_NAME = 'DaoReaderDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('novels')) {
        db.createObjectStore('novels', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chapterStore.createIndex('novelId', 'novelId', { unique: false });
        chapterStore.createIndex('novelId_index', ['novelId', 'index'], { unique: false });
      }
      if (!db.objectStoreNames.contains('glossary')) {
        db.createObjectStore('glossary', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ----------------- NOVELS -----------------

export async function getAllNovels(): Promise<Novel[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('novels', 'readonly');
    const store = tx.objectStore('novels');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getNovel(id: string): Promise<Novel | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('novels', 'readonly');
    const store = tx.objectStore('novels');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveNovel(novel: Novel): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('novels', 'readwrite');
    const store = tx.objectStore('novels');
    const req = store.put(novel);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteNovel(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['novels', 'chapters'], 'readwrite');
    const novelStore = tx.objectStore('novels');
    const chapterStore = tx.objectStore('chapters');

    novelStore.delete(id);

    const index = chapterStore.index('novelId');
    const range = IDBKeyRange.only(id);
    const cursorReq = index.openCursor(range);

    cursorReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- CHAPTERS -----------------

export async function getChaptersForNovel(novelId: string): Promise<Chapter[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const index = store.index('novelId');
    const req = index.getAll(IDBKeyRange.only(novelId));
    req.onsuccess = () => {
      const results = (req.result || []) as Chapter[];
      results.sort((a, b) => a.index - b.index);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getChapter(id: string): Promise<Chapter | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readonly');
    const store = tx.objectStore('chapters');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveChapter(chapter: Chapter): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    const req = store.put(chapter);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveBatchChapters(chapters: Chapter[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chapters', 'readwrite');
    const store = tx.objectStore('chapters');
    for (const ch of chapters) {
      store.put(ch);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- GLOSSARY -----------------

export async function getGlossaryItems(novelId?: string): Promise<GlossaryItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('glossary', 'readonly');
    const store = tx.objectStore('glossary');
    const req = store.getAll();
    req.onsuccess = () => {
      let items = (req.result || []) as GlossaryItem[];
      if (items.length === 0) {
        // Initialize default glossary
        initDefaultGlossary().then(resolve).catch(reject);
        return;
      }
      if (novelId) {
        items = items.filter(item => !item.novelId || item.novelId === novelId);
      }
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

async function initDefaultGlossary(): Promise<GlossaryItem[]> {
  const db = await getDB();
  const items: GlossaryItem[] = DEFAULT_GLOSSARY.map((g, idx) => ({
    ...g,
    id: `def_${idx + 1}_${Date.now()}`
  }));

  return new Promise((resolve, reject) => {
    const tx = db.transaction('glossary', 'readwrite');
    const store = tx.objectStore('glossary');
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve(items);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveGlossaryItem(item: GlossaryItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('glossary', 'readwrite');
    const store = tx.objectStore('glossary');
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteGlossaryItem(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('glossary', 'readwrite');
    const store = tx.objectStore('glossary');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------- LOCAL STORAGE SETTINGS -----------------

export function loadReaderSettings(): ReaderSettings {
  try {
    const saved = localStorage.getItem('novel_reader_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return {
    theme: 'default',
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 1.8,
    maxWidth: 'medium',
    viewMode: 'english',
    showChineseOnHover: true,
    hideHeaderInReader: false,
    infiniteScrollEnabled: false,
    ttsHighlightMode: 'sentence',
    ttsRate: 1.0
  };
}

export function saveReaderSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem('novel_reader_settings', JSON.stringify(settings));
    localStorage.setItem('novel_theme', settings.theme);
  } catch (e) {}
}

export function loadTranslationSettings(): TranslationSettings {
  try {
    const saved = localStorage.getItem('novel_translation_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return {
    provider: 'openrouter',
    geminiApiKey: '',
    geminiModel: 'gemini-2.0-flash',
    deepseekApiKey: '',
    deepseekModel: 'deepseek-chat',
    openrouterApiKey: '',
    openrouterModel: 'deepseek/deepseek-chat:free',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    customApiKey: '',
    customBaseUrl: '',
    customModel: 'gpt-4o-mini',
    defaultGenre: 'xianxia',
    autoExtractGlossary: true
  };
}

export function saveTranslationSettings(settings: TranslationSettings): void {
  try {
    localStorage.setItem('novel_translation_settings', JSON.stringify(settings));
  } catch (e) {}
}

export function getCurrentNovelId(): string | null {
  return localStorage.getItem('current_novel_id');
}

export function setCurrentNovelId(id: string): void {
  localStorage.setItem('current_novel_id', id);
}

