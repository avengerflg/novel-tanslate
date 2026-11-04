import path from 'path';
import fs from 'fs';

let Database: any;
if (typeof (globalThis as any).Bun !== 'undefined') {
  Database = require('bun:sqlite').Database;
} else {
  Database = require('better-sqlite3');
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'novels.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
if (typeof db.pragma === 'function') {
  db.pragma('journal_mode = WAL');
} else {
  db.exec('PRAGMA journal_mode = WAL;');
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS novels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      translated_title TEXT,
      author TEXT,
      description TEXT,
      genre TEXT DEFAULT 'xianxia',
      source_url TEXT,
      current_chapter_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      novel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      chapter_index INTEGER NOT NULL,
      chinese_title TEXT NOT NULL,
      translated_title TEXT,
      raw_content TEXT NOT NULL,
      translated_content TEXT,
      status TEXT DEFAULT 'raw',
      source_url TEXT,
      next_url TEXT,
      prev_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (novel_id) REFERENCES novels (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS glossary (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      novel_id TEXT,
      original TEXT NOT NULL,
      translation TEXT NOT NULL,
      category TEXT DEFAULT 'term',
      notes TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      provider TEXT DEFAULT 'gemini',
      gemini_api_key TEXT,
      gemini_model TEXT DEFAULT 'gemini-2.5-flash',
      deepseek_api_key TEXT,
      deepseek_model TEXT DEFAULT 'deepseek-chat',
      openrouter_api_key TEXT,
      openrouter_model TEXT DEFAULT 'deepseek/deepseek-chat:free',
      openai_api_key TEXT,
      openai_model TEXT DEFAULT 'gpt-4o-mini',
      custom_api_key TEXT,
      custom_base_url TEXT,
      custom_model TEXT,
      default_genre TEXT DEFAULT 'xianxia',
      auto_extract_glossary INTEGER DEFAULT 1,
      reader_theme TEXT DEFAULT 'dark',
      font_family TEXT DEFAULT 'serif',
      font_size INTEGER DEFAULT 18,
      line_height REAL DEFAULT 1.8,
      max_width TEXT DEFAULT 'medium',
      view_mode TEXT DEFAULT 'english',
      show_chinese_on_hover INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_novels_user ON novels(user_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, chapter_index);
    CREATE INDEX IF NOT EXISTS idx_chapters_user ON chapters(user_id);
    CREATE INDEX IF NOT EXISTS idx_glossary_user ON glossary(user_id);
  `);

  try {
    db.exec('ALTER TABLE user_settings ADD COLUMN openrouter_api_key TEXT;');
  } catch {}
  try {
    db.exec("ALTER TABLE user_settings ADD COLUMN openrouter_model TEXT DEFAULT 'deepseek/deepseek-chat:free';");
  } catch {}

  console.log('[Database] SQLite initialized at', dbPath);
}
