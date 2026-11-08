export type GlossaryCategory = 'character' | 'realm' | 'sect' | 'item' | 'location' | 'term';

export interface GlossaryItem {
  id: string;
  original: string;
  translation: string;
  category: GlossaryCategory;
  notes?: string;
  novelId?: string; // If undefined, applies globally to all novels
}

export type TranslationStatus = 'raw' | 'translating' | 'translated' | 'error';

export interface Chapter {
  id: string;
  novelId: string;
  index: number;
  chineseTitle: string;
  translatedTitle?: string;
  rawChineseContent: string;
  translatedContent?: string;
  status: TranslationStatus;
  errorMessage?: string;
  sourceUrl?: string;
  prevUrl?: string;
  nextUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Novel {
  id: string;
  title: string;
  translatedTitle?: string;
  author?: string;
  description?: string;
  genre: 'xianxia' | 'wuxia' | 'urban' | 'litrpg' | 'romance' | 'general';
  coverUrl?: string;
  sourceUrl?: string;
  currentChapterId?: string;
  chapterIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'oled';
export type ReaderFont = 'literata' | 'lora' | 'serif' | 'sans';
export type ReaderMaxWidth = 'narrow' | 'medium' | 'wide' | 'full';
export type ViewMode = 'english' | 'bilingual' | 'raw';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number; // e.g. 18
  lineHeight: number; // e.g. 1.8
  maxWidth: ReaderMaxWidth;
  viewMode: ViewMode;
  showChineseOnHover: boolean;
}

export type AIProvider = 'gemini' | 'deepseek' | 'openrouter' | 'openai' | 'custom';

export interface TranslationSettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  openaiApiKey: string;
  openaiModel: string;
  customApiKey: string;
  customBaseUrl: string;
  customModel: string;
  defaultGenre: string;
  autoExtractGlossary: boolean;
}

