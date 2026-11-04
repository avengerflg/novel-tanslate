import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const dataRouter = Router();

// Apply authMiddleware to all data routes
dataRouter.use(authMiddleware);

// =================== NOVELS ===================

dataRouter.get('/novels', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const novels = db.prepare(`
      SELECT n.*,
        (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id AND c.user_id = ?) as chapters_count
      FROM novels n
      WHERE n.user_id = ?
      ORDER BY n.updated_at DESC
    `).all(userId, userId) as any[];

    // Fetch chapter IDs for each novel
    const result = novels.map(n => {
      const chapterRows = db.prepare('SELECT id FROM chapters WHERE novel_id = ? AND user_id = ? ORDER BY chapter_index ASC').all(n.id, userId) as any[];
      return {
        id: n.id,
        title: n.title,
        translatedTitle: n.translated_title,
        author: n.author,
        description: n.description,
        genre: n.genre,
        sourceUrl: n.source_url,
        currentChapterId: n.current_chapter_id,
        chapterIds: chapterRows.map(r => r.id),
        createdAt: n.created_at,
        updatedAt: n.updated_at
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.post('/novels', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, title, translatedTitle, author, description, genre, sourceUrl, currentChapterId } = req.body;

    const novelId = id || `nov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO novels (id, user_id, title, translated_title, author, description, genre, source_url, current_chapter_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        translated_title = excluded.translated_title,
        author = excluded.author,
        description = excluded.description,
        genre = excluded.genre,
        source_url = excluded.source_url,
        current_chapter_id = excluded.current_chapter_id,
        updated_at = excluded.updated_at
    `).run(
      novelId,
      userId,
      title,
      translatedTitle || null,
      author || null,
      description || null,
      genre || 'xianxia',
      sourceUrl || null,
      currentChapterId || null,
      now,
      now
    );

    res.json({ id: novelId, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.delete('/novels/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const novelId = req.params.id;

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM chapters WHERE novel_id = ? AND user_id = ?').run(novelId, userId);
      db.prepare('DELETE FROM novels WHERE id = ? AND user_id = ?').run(novelId, userId);
    });

    tx();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== CHAPTERS ===================

dataRouter.get('/novels/:novelId/chapters', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { novelId } = req.params;

    const rows = db.prepare(`
      SELECT * FROM chapters
      WHERE novel_id = ? AND user_id = ?
      ORDER BY chapter_index ASC
    `).all(novelId, userId) as any[];

    const chapters = rows.map(r => ({
      id: r.id,
      novelId: r.novel_id,
      index: r.chapter_index,
      chineseTitle: r.chinese_title,
      translatedTitle: r.translated_title,
      rawChineseContent: r.raw_content,
      translatedContent: r.translated_content,
      status: r.status,
      sourceUrl: r.source_url,
      nextUrl: r.next_url,
      prevUrl: r.prev_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json(chapters);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.post('/chapters', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      id,
      novelId,
      index,
      chineseTitle,
      translatedTitle,
      rawChineseContent,
      translatedContent,
      status,
      sourceUrl,
      nextUrl,
      prevUrl
    } = req.body;

    const chapId = id || `chap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO chapters (
        id, novel_id, user_id, chapter_index, chinese_title, translated_title,
        raw_content, translated_content, status, source_url, next_url, prev_url,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        chinese_title = excluded.chinese_title,
        translated_title = excluded.translated_title,
        raw_content = excluded.raw_content,
        translated_content = excluded.translated_content,
        status = excluded.status,
        source_url = excluded.source_url,
        next_url = excluded.next_url,
        prev_url = excluded.prev_url,
        updated_at = excluded.updated_at
    `).run(
      chapId,
      novelId,
      userId,
      index,
      chineseTitle,
      translatedTitle || null,
      rawChineseContent,
      translatedContent || null,
      status || 'raw',
      sourceUrl || null,
      nextUrl || null,
      prevUrl || null,
      now,
      now
    );

    // Update novel updated_at timestamp
    db.prepare('UPDATE novels SET updated_at = ? WHERE id = ? AND user_id = ?').run(now, novelId, userId);

    res.json({ id: chapId, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.post('/chapters/batch', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { novelId, chapters } = req.body;

    if (!Array.isArray(chapters)) {
      return res.status(400).json({ error: 'Chapters array required' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO chapters (
        id, novel_id, user_id, chapter_index, chinese_title, translated_title,
        raw_content, translated_content, status, source_url, next_url, prev_url,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const tx = db.transaction(() => {
      for (const ch of chapters) {
        insertStmt.run(
          ch.id || `chap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          novelId,
          userId,
          ch.index,
          ch.chineseTitle,
          ch.translatedTitle || null,
          ch.rawChineseContent,
          ch.translatedContent || null,
          ch.status || 'raw',
          ch.sourceUrl || null,
          ch.nextUrl || null,
          ch.prevUrl || null,
          now,
          now
        );
      }
      db.prepare('UPDATE novels SET updated_at = ? WHERE id = ? AND user_id = ?').run(now, novelId, userId);
    });

    tx();
    res.json({ success: true, count: chapters.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.delete('/chapters/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const chapterId = req.params.id;

    db.prepare('DELETE FROM chapters WHERE id = ? AND user_id = ?').run(chapterId, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== GLOSSARY ===================

dataRouter.get('/glossary', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { novelId } = req.query;

    let query = 'SELECT * FROM glossary WHERE user_id = ?';
    const params: any[] = [userId];

    if (novelId) {
      query += ' AND (novel_id IS NULL OR novel_id = ?)';
      params.push(novelId);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    const items = rows.map(r => ({
      id: r.id,
      original: r.original,
      translation: r.translation,
      category: r.category,
      notes: r.notes,
      novelId: r.novel_id
    }));

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.post('/glossary', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, original, translation, category, notes, novelId } = req.body;

    const glossId = id || `gloss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO glossary (id, user_id, novel_id, original, translation, category, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        original = excluded.original,
        translation = excluded.translation,
        category = excluded.category,
        notes = excluded.notes,
        novel_id = excluded.novel_id
    `).run(
      glossId,
      userId,
      novelId || null,
      original,
      translation,
      category || 'term',
      notes || null,
      now
    );

    res.json({ id: glossId, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.delete('/glossary/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const glossId = req.params.id;

    db.prepare('DELETE FROM glossary WHERE id = ? AND user_id = ?').run(glossId, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== USER SETTINGS ===================

dataRouter.get('/user-settings', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;

    if (!row) {
      return res.json({
        provider: 'gemini',
        geminiApiKey: '',
        geminiModel: 'gemini-2.0-flash',
        deepseekApiKey: '',
        deepseekModel: 'deepseek-chat',
        openrouterApiKey: '',
        openrouterModel: 'openrouter/free',
        openaiApiKey: '',
        openaiModel: 'gpt-4o-mini',
        customApiKey: '',
        customBaseUrl: '',
        customModel: 'gpt-4o-mini',
        defaultGenre: 'xianxia',
        autoExtractGlossary: true,
        readerSettings: {
          theme: 'dark',
          fontFamily: 'serif',
          fontSize: 18,
          lineHeight: 1.8,
          maxWidth: 'medium',
          viewMode: 'english',
          showChineseOnHover: true
        }
      });
    }

    res.json({
      provider: row.provider,
      geminiApiKey: '',
      geminiModel: row.gemini_model || 'gemini-2.0-flash',
      deepseekApiKey: '',
      deepseekModel: row.deepseek_model || 'deepseek-chat',
      openrouterApiKey: '',
      openrouterModel: row.openrouter_model || 'openrouter/free',
      openaiApiKey: '',
      openaiModel: row.openai_model || 'gpt-4o-mini',
      customApiKey: '',
      customBaseUrl: row.custom_base_url || '',
      customModel: row.custom_model || 'gpt-4o-mini',
      defaultGenre: row.default_genre || 'xianxia',
      autoExtractGlossary: Boolean(row.auto_extract_glossary),
      readerSettings: {
        theme: row.reader_theme || 'dark',
        fontFamily: row.font_family || 'serif',
        fontSize: row.font_size || 18,
        lineHeight: row.line_height || 1.8,
        maxWidth: row.max_width || 'medium',
        viewMode: row.view_mode || 'english',
        showChineseOnHover: Boolean(row.show_chinese_on_hover)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

dataRouter.post('/user-settings', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      provider,
      geminiApiKey,
      geminiModel,
      deepseekApiKey,
      deepseekModel,
      openrouterApiKey,
      openrouterModel,
      openaiApiKey,
      openaiModel,
      customApiKey,
      customBaseUrl,
      customModel,
      defaultGenre,
      autoExtractGlossary,
      readerSettings
    } = req.body;

    db.prepare(`
      INSERT INTO user_settings (
        user_id, provider, gemini_api_key, gemini_model,
        deepseek_api_key, deepseek_model, openrouter_api_key, openrouter_model,
        openai_api_key, openai_model, custom_api_key, custom_base_url,
        custom_model, default_genre, auto_extract_glossary, reader_theme,
        font_family, font_size, line_height, max_width, view_mode, show_chinese_on_hover
      ) VALUES (?, ?, NULL, ?, NULL, ?, NULL, ?, NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        provider = excluded.provider,
        gemini_api_key = NULL,
        gemini_model = excluded.gemini_model,
        deepseek_api_key = NULL,
        deepseek_model = excluded.deepseek_model,
        openrouter_api_key = NULL,
        openrouter_model = excluded.openrouter_model,
        openai_api_key = NULL,
        openai_model = excluded.openai_model,
        custom_api_key = NULL,
        custom_base_url = excluded.custom_base_url,
        custom_model = excluded.custom_model,
        default_genre = excluded.default_genre,
        auto_extract_glossary = excluded.auto_extract_glossary,
        reader_theme = excluded.reader_theme,
        font_family = excluded.font_family,
        font_size = excluded.font_size,
        line_height = excluded.line_height,
        max_width = excluded.max_width,
        view_mode = excluded.view_mode,
        show_chinese_on_hover = excluded.show_chinese_on_hover
    `).run(
      userId,
      provider || 'openrouter',
      geminiModel || 'gemini-2.0-flash',
      deepseekModel || 'deepseek-chat',
      openrouterModel || 'openrouter/free',
      openaiModel || 'gpt-4o-mini',
      customBaseUrl ? customBaseUrl.trim() : null,
      customModel || 'gpt-4o-mini',
      defaultGenre || 'xianxia',
      autoExtractGlossary !== false ? 1 : 0,
      readerSettings?.theme || 'dark',
      readerSettings?.fontFamily || 'serif',
      readerSettings?.fontSize || 18,
      readerSettings?.lineHeight || 1.8,
      readerSettings?.maxWidth || 'medium',
      readerSettings?.viewMode || 'english',
      readerSettings?.showChineseOnHover !== false ? 1 : 0
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

