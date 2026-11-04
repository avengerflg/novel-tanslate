import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { initDatabase } from './db.js';
import { authRouter } from './routes/auth.js';
import { dataRouter } from './routes/userData.js';
import { translateChapter, TranslationRequest } from './services/translator.js';
import { scrapeChapterFromUrl } from './services/scraper.js';
import { parseRawChineseText } from './services/textParser.js';
import { generateEpub, EpubOptions } from './services/epubGenerator.js';

dotenv.config();

// Prevent uncaught errors or unhandled promise rejections from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.use('/api/auth', authRouter);

// 1. Scrape chapter from raw novel URL
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const chapterData = await scrapeChapterFromUrl(url);
    res.json(chapterData);
  } catch (err: any) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message || 'Failed to scrape chapter from URL' });
  }
});

// 2. Parse uploaded raw TXT text into chapters
app.post('/api/parse-txt', (req, res) => {
  try {
    const { text, novelTitle } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const parsed = parseRawChineseText(text, novelTitle);
    res.json(parsed);
  } catch (err: any) {
    console.error('Parse TXT error:', err);
    res.status(500).json({ error: err.message || 'Failed to parse text' });
  }
});

// 3. Translate a single chapter
app.post('/api/translate', async (req, res) => {
  try {
    const body = req.body as TranslationRequest;
    if (!body.chineseContent) {
      return res.status(400).json({ error: 'chineseContent is required' });
    }

    let apiKey = body.apiKey;
    if (!apiKey) {
      if (body.provider === 'gemini') apiKey = process.env.GEMINI_API_KEY || '';
      else if (body.provider === 'deepseek') apiKey = process.env.DEEPSEEK_API_KEY || '';
      else if (body.provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY || '';
      else if (body.provider === 'openai') apiKey = process.env.OPENAI_API_KEY || '';
    }

    if (!apiKey) {
      return res.status(400).json({
        error: `API key for ${body.provider} is missing. Please set it in Settings or in the server .env.`
      });
    }

    const result = await translateChapter({
      ...body,
      apiKey
    });

    res.json(result);
  } catch (err: any) {
    console.error('Translate error:', err);
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

// 4. Export chapters to EPUB
app.post('/api/export-epub', async (req, res) => {
  try {
    const { title, author, description, chapters } = req.body as EpubOptions;
    if (!title || !chapters || chapters.length === 0) {
      return res.status(400).json({ error: 'Title and at least one chapter are required' });
    }

    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.epub"`);

    await generateEpub({ title, author, description, chapters }, res);
  } catch (err: any) {
    console.error('EPUB export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to generate EPUB' });
    }
  }
});

// User-scoped data routes (Novels, Chapters, Glossary, Settings)
app.use('/api', dataRouter);

const SOCKET_PATH = process.env.SOCKET_PATH;

if (SOCKET_PATH) {
  try {
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }
  } catch (e) {}

  app.listen(SOCKET_PATH, () => {
    try {
      fs.chmodSync(SOCKET_PATH, 0o777);
    } catch (e) {}
    console.log(`[NovelTranslate Server] Listening on UNIX socket: ${SOCKET_PATH}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`[NovelTranslate Server] Running on http://localhost:${PORT}`);
  });
}
