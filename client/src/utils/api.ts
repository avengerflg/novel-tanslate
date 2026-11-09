import { Novel, Chapter, GlossaryItem, TranslationSettings, ReaderSettings } from '../types/novel';

const TOKEN_KEY = 'dao_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------- AUTH API ----------------

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

export async function loginUser(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  setStoredToken(data.token);
  return data;
}

export async function registerUser(username: string, email: string | undefined, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  setStoredToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      removeStoredToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

// ---------------- DATA API ----------------

export async function fetchUserNovels(): Promise<Novel[]> {
  const res = await fetch('/api/novels', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch novels');
  return res.json();
}

export async function saveUserNovel(novel: Partial<Novel>): Promise<{ id: string }> {
  const token = getStoredToken();
  if (!token) return { id: novel.id || '' };
  try {
    const res = await fetch('/api/novels', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(novel)
    });
    if (!res.ok) return { id: novel.id || '' };
    return res.json();
  } catch {
    return { id: novel.id || '' };
  }
}

export async function deleteUserNovel(id: string): Promise<void> {
  const res = await fetch(`/api/novels/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete novel');
}

export async function fetchNovelChapters(novelId: string): Promise<Chapter[]> {
  const res = await fetch(`/api/novels/${novelId}/chapters`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function saveUserChapter(chapter: Partial<Chapter>): Promise<{ id: string }> {
  const token = getStoredToken();
  if (!token) return { id: chapter.id || '' };
  try {
    const res = await fetch('/api/chapters', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(chapter)
    });
    if (!res.ok) return { id: chapter.id || '' };
    return res.json();
  } catch {
    return { id: chapter.id || '' };
  }
}

export async function saveBatchUserChapters(novelId: string, chapters: Partial<Chapter>[]): Promise<void> {
  const res = await fetch('/api/chapters/batch', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ novelId, chapters })
  });
  if (!res.ok) throw new Error('Failed to save batch chapters');
}

export async function deleteUserChapter(id: string): Promise<void> {
  const res = await fetch(`/api/chapters/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete chapter');
}

export async function fetchUserGlossary(novelId?: string): Promise<GlossaryItem[]> {
  const url = novelId ? `/api/glossary?novelId=${novelId}` : '/api/glossary';
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch glossary');
  return res.json();
}

export async function saveUserGlossaryItem(item: Partial<GlossaryItem>): Promise<{ id: string }> {
  const res = await fetch('/api/glossary', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to save glossary item');
  return res.json();
}

export async function deleteUserGlossaryItem(id: string): Promise<void> {
  const res = await fetch(`/api/glossary/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete glossary item');
}

export async function fetchUserSettings(): Promise<{
  translationSettings: TranslationSettings;
  readerSettings: ReaderSettings;
}> {
  const res = await fetch('/api/user-settings', {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const data = await res.json();
  return {
    translationSettings: {
      provider: data.provider || 'openrouter',
      geminiApiKey: data.geminiApiKey || '',
      geminiModel: data.geminiModel || 'gemini-2.0-flash',
      deepseekApiKey: data.deepseekApiKey || '',
      deepseekModel: data.deepseekModel || 'deepseek-chat',
      openrouterApiKey: data.openrouterApiKey || '',
      openrouterModel: data.openrouterModel || 'openrouter/free',
      openaiApiKey: data.openaiApiKey || '',
      openaiModel: data.openaiModel || 'gpt-4o-mini',
      customApiKey: data.customApiKey || '',
      customBaseUrl: data.customBaseUrl || '',
      customModel: data.customModel || 'gpt-4o-mini',
      defaultGenre: data.defaultGenre || 'xianxia',
      autoExtractGlossary: data.autoExtractGlossary !== false
    },
    readerSettings: data.readerSettings || {
      theme: 'dark',
      fontFamily: 'literata',
      fontSize: 18,
      lineHeight: 1.8,
      maxWidth: 'medium',
      viewMode: 'english',
      showChineseOnHover: true
    }
  };
}

export async function saveUserSettings(
  translationSettings: TranslationSettings,
  readerSettings: ReaderSettings
): Promise<void> {
  const res = await fetch('/api/user-settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...translationSettings,
      readerSettings
    })
  });
  if (!res.ok) throw new Error('Failed to save user settings');
}

