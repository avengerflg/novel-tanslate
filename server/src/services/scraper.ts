import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export interface ScrapedChapter {
  novelTitle: string;
  chapterTitle: string;
  content: string;
  prevUrl?: string;
  nextUrl?: string;
  currentUrl: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

async function fetchPageWithRetry(url: string, origin: string, maxRetries = 3): Promise<Response> {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const ua = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': origin
        },
        signal: AbortSignal.timeout(15000)
      });

      if (res.status === 429 || res.status === 503) {
        if (attempt < maxRetries) {
          console.warn(`[Scraper] Rate limited (${res.status}) on ${url}. Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(r => setTimeout(r, delay));
          delay *= 1.5;
          continue;
        }
      }

      return res;
    } catch (e: any) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 1.5;
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Failed to fetch page after ${maxRetries} attempts`);
}

export async function scrapeChapterFromUrl(url: string): Promise<ScrapedChapter> {
  const parsedUrl = new URL(url);

  const res = await fetchPageWithRetry(url, parsedUrl.origin);

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Failed to fetch page (403 Forbidden: ${parsedUrl.hostname} is protected by Cloudflare). Please use an accessible mirror like 69shuba (e.g. 69shuba.tw) or paste the chapter text directly.`);
    }
    throw new Error(`Failed to fetch page (${res.status} ${res.statusText})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Check encoding from header or meta tags
  const contentType = res.headers.get('content-type') || '';
  let encoding = 'utf-8';

  if (/charset=gbk/i.test(contentType) || /charset=gb2312/i.test(contentType)) {
    encoding = 'gbk';
  } else {
    // Check initial bytes for meta charset
    const preview = buffer.slice(0, 1024).toString('binary');
    if (/charset=["']?(gbk|gb2312)["']?/i.test(preview)) {
      encoding = 'gbk';
    }
  }

  const html = iconv.decode(buffer, encoding);

  // Helper to clean noise and advertising lines
  const cleanContentLines = (raw: string): string => {
    const filterKeywords = [
      '请记住本书首发域名',
      '最新章节',
      '笔趣阁',
      '无弹窗',
      '章节报错',
      '推荐票',
      '月票',
      '书签',
      '上一章',
      '下一章',
      '加入书签',
      '投票推荐',
      '投推荐票',
      '天才一秒记住',
      '免费阅读',
      '手机版阅读网址',
      'http://',
      'https://',
      'www.'
    ];
    const lines = raw.split(/\r?\n/);
    const clean: string[] = [];
    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/^[\u3000\s]+/, '');
      if (!line) continue;
      const isAd = filterKeywords.some(kw => line.includes(kw) && line.length < 60);
      if (isAd) continue;
      clean.push(line);
    }
    return clean.join('\n\n');
  };

  // Special handling for Fanqie Novel (fanqienovel.com) which uses dynamic font obfuscation / PUA
  if (parsedUrl.hostname.includes('fanqienovel.com')) {
    // If it is a novel index/overview page like /page/7083672225286458406
    if (parsedUrl.pathname.includes('/page/')) {
      const $page = cheerio.load(html);
      let firstChapterUrl = '';
      $page('a').each((_, el) => {
        const href = $page(el).attr('href');
        const text = $page(el).text().trim();
        if (href && href.includes('/reader/') && (text.includes('第1章') || text.includes('第一章') || !firstChapterUrl)) {
          firstChapterUrl = new URL(href, url).toString();
          if (text.includes('第1章') || text.includes('第一章')) return false;
        }
      });
      if (firstChapterUrl) {
        return scrapeChapterFromUrl(firstChapterUrl);
      }
    }

    // Reader page: parse __INITIAL_STATE__ to get clean metadata and unencrypted text
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1]);
        const chData = state.reader?.chapterData || {};
        const bookId = chData.bookId || state.reader?.bookId;
        const bookName = chData.bookName || state.reader?.bookName || 'Fanqie Novel';
        const chTitle = chData.title || state.reader?.chapterName || 'Chapter';
        const order = chData.order || chData.realChapterOrder || 1;
        const nextItemId = chData.nextItemId;
        const preItemId = chData.preItemId;

        // Fetch unencrypted text from clean mirror (fanyedao.com)
        if (bookId) {
          try {
            const mirrorUrl = `https://fanyedao.com/read/${bookId}/${order}`;
            const mRes = await fetch(mirrorUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
              }
            });
            if (mRes.ok) {
              const mHtml = await mRes.text();
              const $m = cheerio.load(mHtml);
              const mContainer = $m('.chapter-body, #content, .content, article');
              if (mContainer.length) {
                mContainer.find('br').replaceWith('\n');
                mContainer.find('p').each((_, p) => {
                  $m(p).replaceWith(`\n${$m(p).text()}\n`);
                });
                const cleanText = mContainer.text().trim();
                if (cleanText.length > 50) {
                  const numOrder = Number(order) || 1;
                  return {
                    novelTitle: bookName,
                    chapterTitle: chTitle,
                    content: cleanContentLines(cleanText),
                    prevUrl: numOrder > 1 ? `https://fanyedao.com/read/${bookId}/${numOrder - 1}` : undefined,
                    nextUrl: `https://fanyedao.com/read/${bookId}/${numOrder + 1}`,
                    currentUrl: url
                  };
                }
              }
            }
          } catch (e) {
            console.warn('[Scraper] Failed to fetch clean mirror for Fanqie novel:', e);
          }
        }
      } catch (e) {
        console.warn('[Scraper] Failed to parse Fanqie state:', e);
      }
    }
  }

  const $ = cheerio.load(html);

  // Remove scripts, styles, hidden elements, ads
  $('script, style, noscript, iframe, link, .ad, .advertisement, [id*="ad_"], [class*="ad_"]').remove();

  // Find chapter title
  let chapterTitle = '';
  const titleSelectors = [
    'h1',
    '.title h1',
    '.bookname h1',
    '.readTitle h1',
    '.chapter-title',
    '#title',
    'title'
  ];

  for (const sel of titleSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim()) {
      chapterTitle = el.text().trim();
      break;
    }
  }

  // Find novel title
  let novelTitle = '';
  const novelSelectors = [
    '.bookname .top a',
    '.con_top a',
    '.crumbs a',
    '.weizhi a',
    'meta[property="og:novel:book_name"]',
    'meta[name="book_name"]'
  ];

  for (const sel of novelSelectors) {
    const el = $(sel);
    if (el.is('meta')) {
      novelTitle = el.attr('content') || '';
      if (novelTitle) break;
    } else if (el.length) {
      // Pick second or third breadcrumb
      if (el.length >= 2) {
        novelTitle = $(el[1]).text().trim();
        break;
      }
    }
  }

  if (!novelTitle) {
    // Fallback: extract from title tag or default
    const pageTitle = $('title').text().trim();
    const parts = pageTitle.split(/_|-|\|/);
    if (parts.length > 0 && !/第\s*\d+\s*章/i.test(parts[0])) {
      novelTitle = parts[0].replace(/\(.*?\)/g, '').trim();
    } else if (parts.length > 1) {
      novelTitle = parts[1].replace(/\(.*?\)/g, '').trim();
    } else {
      novelTitle = 'Web Novel';
    }
  }

  if (novelTitle) {
    novelTitle = novelTitle.replace(/《|》/g, '').replace(/免费阅读|最新章节|全文阅读|在线阅读|小说/g, '').trim();
  }

  // Find content container
  const contentSelectors = [
    '#nr1',
    '#nr',
    '.nr_nr',
    '.chapter-body',
    '#chapter-body',
    '.muye-reader-content',
    '#content',
    '#chaptercontent',
    '#chapterContent',
    '#htmlContent',
    '.content',
    '.txtnav',
    '.read-content',
    '#chapter_content',
    '.novel-content',
    '.entry-content',
    'article'
  ];

  let rawContent = '';
  for (const sel of contentSelectors) {
    const container = $(sel);
    if (container.length) {
      // Replace <br> and <p> with newlines
      container.find('br').replaceWith('\n');
      container.find('p').each((_, p) => {
        $(p).replaceWith(`\n${$(p).text()}\n`);
      });
      rawContent = container.text();
      if (rawContent.trim().length > 100) break;
    }
  }

  if (!rawContent.trim()) {
    // Fallback: get largest body text block
    rawContent = $('body').text();
  }

  // Clean watermarks and noise lines
  const cleanLines: string[] = [];
  const lines = rawContent.split(/\r?\n/);

  const filterKeywords = [
    '请记住本书首发域名',
    '最新章节',
    '笔趣阁',
    '无弹窗',
    '章节报错',
    '推荐票',
    '月票',
    '书签',
    '上一章',
    '下一章',
    '加入书签',
    '投票推荐',
    '投推荐票',
    '天才一秒记住',
    '免费阅读',
    '手机版阅读网址',
    'http://',
    'https://',
    'www.'
  ];

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/^[\u3000\s]+/, ''); // remove full-width spaces
    if (!line) continue;

    // Skip short advertising / navigation lines
    const isAd = filterKeywords.some(kw => line.includes(kw) && line.length < 60);
    if (isAd) continue;

    cleanLines.push(line);
  }

  const cleanedContent = cleanLines.join('\n\n');

  // Find prev / next links
  let prevUrl: string | undefined;
  let nextUrl: string | undefined;

  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    try {
      const resolved = new URL(href, url).toString();
      if (/上一章|上页|prev|前一章/i.test(text) && !prevUrl) {
        prevUrl = resolved;
      }
      if (/下一章|下页|next/i.test(text) && !nextUrl) {
        nextUrl = resolved;
      }
    } catch {
      // ignore invalid URLs
    }
  });

  // For fanyedao.com, ensure nextUrl and prevUrl are always explicitly correct (all 2000+ chapters)
  if (parsedUrl.hostname.includes('fanyedao.com')) {
    const fanyeMatch = url.match(/\/read\/(\d+)\/(\d+)/);
    if (fanyeMatch) {
      const bId = fanyeMatch[1];
      const cNum = Number(fanyeMatch[2]);
      if (cNum < 3000) {
        nextUrl = `https://fanyedao.com/read/${bId}/${cNum + 1}`;
      }
      if (cNum > 1) {
        prevUrl = `https://fanyedao.com/read/${bId}/${cNum - 1}`;
      }
    }
  }

  return {
    novelTitle,
    chapterTitle: chapterTitle || 'Chapter',
    content: cleanedContent,
    prevUrl,
    nextUrl,
    currentUrl: url
  };
}

