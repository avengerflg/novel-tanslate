export interface GlossaryItem {
  original: string;
  translation: string;
  category?: 'character' | 'realm' | 'sect' | 'item' | 'location' | 'term';
  notes?: string;
}

export interface TranslationRequest {
  chineseTitle?: string;
  chineseContent: string;
  genre?: string; // 'xianxia' | 'wuxia' | 'urban' | 'litrpg' | 'romance' | 'general'
  glossary?: GlossaryItem[];
  provider: 'gemini' | 'deepseek' | 'openrouter' | 'openai' | 'custom';
  apiKey: string;
  model?: string;
  customBaseUrl?: string;
}

export interface TranslationResult {
  translatedTitle?: string;
  translatedContent: string;
  newGlossaryTerms?: GlossaryItem[];
}

function buildPrompt(req: TranslationRequest): { systemInstruction: string; userPrompt: string } {
  const genreDesc = req.genre || 'xianxia/cultivation';

  const glossaryText = (req.glossary && req.glossary.length > 0)
    ? req.glossary.map(g => `- "${g.original}" -> "${g.translation}" (${g.category || 'term'}${g.notes ? ': ' + g.notes : ''})`).join('\n')
    : 'None provided. Infer standard high-quality English equivalents.';

  const systemInstruction = `You are a master literary translator specializing in Chinese web novels (${genreDesc}).
Your mission is to transform raw Chinese web novel chapters into polished, fluent, and highly engaging English that reads like a published fantasy or web novel, NOT stiff machine translation (MTL).

Key translation rules:
1. ACCURACY & VOICE: Translate the tone, subtext, tension, and vivid imagery accurately into natural English sentence structures and dialogue.
2. PRONOUN RESOLUTION: Chinese pronouns (他, 她, 它) are frequently ambiguous or scrambled in raw text. Keep careful track of character gender and identity so pronouns (he/she/it/they) are 100% consistent throughout the scene.
3. GLOSSARY FIDELITY: Strictly adhere to the provided Glossary. NEVER invent alternative names for existing glossary terms.
4. CULTIVATION & GENRE TERMS:
   - Use standard accepted romanization / terminology for established concepts (e.g. Dantian, Qi Condensation, Foundation Establishment, Golden Core, Nascent Soul, Spirit Stones, Spatial Ring, Dao, Karma, Tribulation).
   - Character names should be formatted in standard Pinyin with capitalized separate syllables (e.g. "Xiao Yan", "Gu Yue", "Lin Dong", "Han Li"), unless the glossary specifies otherwise.
5. IDIOMS & PROVERBS (CHENGYU):
   - Translate Chinese idioms/metaphors to readable English equivalents that retain dramatic flavor without being awkward gibberish.
   - For example:
     * 有眼不识泰山 -> "having eyes but failing to see Mount Tai" or "failing to recognize a master"
     * 扮猪吃老虎 -> "playing the pig to eat the tiger" (feigning weakness)
     * 井底之蛙 -> "a frog at the bottom of a well"
     * 顺我者昌，逆我者亡 -> "those who submit shall prosper; those who resist shall perish"
     * 不知死活 / 找死 -> "courting death" / "reckless fool"
6. FORMAT & PARAGRAPHS: Keep narrative pacing crisp. Ensure dialogue has proper English quotation marks ("...") and clear attribution.
7. ENTITY DISCOVERY: Identify any newly introduced proper nouns (characters, sects, realms, locations, special techniques, artifacts) that are NOT yet in the glossary.

Output JSON format strictly:
{
  "translatedTitle": "English Title",
  "translatedContent": "Full translated chapter content with natural paragraph breaks...",
  "newGlossaryTerms": [
    { "original": "中文原词", "translation": "English Equivalent", "category": "character|realm|sect|item|location|term" }
  ]
}`;

  const userPrompt = `### KNOWN GLOSSARY (STRICT MEMORY):
${glossaryText}

### INPUT CHINESE TITLE:
${req.chineseTitle || 'Untitled'}

### INPUT CHINESE CHAPTER CONTENT:
${req.chineseContent}

Translate the chapter now following all instructions. Return strictly valid JSON.`;

  return { systemInstruction, userPrompt };
}

function extractAndParseJson(rawText: string): any {
  if (!rawText) return null;
  let cleanText = rawText.trim();

  // Strip reasoning models <think> ... </think> tags
  cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip Markdown code fences if present (e.g. ```json ... ```)
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7).replace(/```$/, '').trim();
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3).replace(/```$/, '').trim();
  }

  // First direct try
  try {
    return JSON.parse(cleanText);
  } catch {
    // Attempt to locate outermost JSON braces { ... }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleanText.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Fallback failed
      }
    }
    return null;
  }
}

export async function translateChapter(req: TranslationRequest): Promise<TranslationResult> {
  const { systemInstruction, userPrompt } = buildPrompt(req);
  const cleanApiKey = (req.apiKey || '').trim().replace(/[\r\n\u2028\u2029\s]/g, '');

  if (req.provider === 'gemini') {
    let model = req.model || 'gemini-2.0-flash';
    if (model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash-latest') {
      model = 'gemini-2.0-flash';
    }

    const body = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    };

    let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanApiKey}`;
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000)
    });

    // Fallback if requested model returned 404 (e.g. gemini-1.5-flash)
    if (!res.ok && res.status === 404 && model !== 'gemini-1.5-flash') {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanApiKey}`;
      res = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000)
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json() as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('No translation response returned from Gemini API.');
    }

    const parsed = extractAndParseJson(rawText);
    if (parsed) {
      return {
        translatedTitle: parsed.translatedTitle || req.chineseTitle,
        translatedContent: parsed.translatedContent || rawText,
        newGlossaryTerms: Array.isArray(parsed.newGlossaryTerms) ? parsed.newGlossaryTerms : []
      };
    }

    const cleanedRawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return {
      translatedTitle: req.chineseTitle,
      translatedContent: cleanedRawText,
      newGlossaryTerms: []
    };
  }

  // OpenRouter, DeepSeek, OpenAI, or Custom OpenAI-compatible
  const baseUrl = req.provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : req.provider === 'deepseek'
    ? 'https://api.deepseek.com/v1/chat/completions'
    : req.provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : (req.customBaseUrl || 'https://api.openai.com/v1/chat/completions');

  let model = req.model || (
    req.provider === 'openrouter'
      ? 'openrouter/free'
      : req.provider === 'deepseek'
      ? 'deepseek-chat'
      : 'gpt-4o-mini'
  );

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cleanApiKey}`
  };

  if (req.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://khaki-porcupine-192301.hostingersite.com';
    headers['X-Title'] = 'DaoReader Web Novel AI';
  }

  // Request payload
  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3
  };

  // OpenRouter reasoning bypass: ensures free reasoning models don't exhaust output tokens in thinking
  if (req.provider === 'openrouter') {
    requestBody.reasoning = { effort: 'none' };
  }

  // Only attach response_format for OpenAI or direct DeepSeek
  // Some OpenRouter free community providers error out if response_format is passed
  if (req.provider === 'openai' || req.provider === 'deepseek') {
    requestBody.response_format = { type: 'json_object' };
  }

  let res = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120000)
  });

  // If OpenRouter rejects reasoning: { effort: 'none' } (Reasoning is mandatory for this model), retry without it
  if (!res.ok && res.status === 400 && req.provider === 'openrouter' && requestBody.reasoning) {
    delete requestBody.reasoning;
    res = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    });
  }

  // If OpenRouter returns 404 on deepseek free slug, fallback to openrouter/free
  if (!res.ok && res.status === 404 && req.provider === 'openrouter' && model !== 'openrouter/free') {
    requestBody.model = 'openrouter/free';
    delete requestBody.reasoning;
    res = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120000)
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 402 && req.provider === 'deepseek') {
      throw new Error('DeepSeek API error (402): Insufficient Balance. Please recharge your DeepSeek account or switch to OpenRouter (Free DeepSeek V3) in Settings.');
    }
    try {
      const errJson = JSON.parse(errText);
      const msg = errJson?.error?.message || errText;
      throw new Error(`${req.provider} API error (${res.status}): ${msg}`);
    } catch (e: any) {
      if (e.message && e.message.includes('API error')) throw e;
      throw new Error(`${req.provider} API error (${res.status}): ${errText}`);
    }
  }

  const data = await res.json() as any;
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error(`No translation response returned from ${req.provider} API.`);
  }

  const parsed = extractAndParseJson(rawText);
  if (parsed) {
    return {
      translatedTitle: parsed.translatedTitle || req.chineseTitle,
      translatedContent: parsed.translatedContent || rawText,
      newGlossaryTerms: Array.isArray(parsed.newGlossaryTerms) ? parsed.newGlossaryTerms : []
    };
  }

  const cleanedRawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return {
    translatedTitle: req.chineseTitle,
    translatedContent: cleanedRawText,
    newGlossaryTerms: []
  };
}

