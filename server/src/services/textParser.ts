export interface ParsedChapter {
  index: number;
  title: string;
  content: string;
}

export function parseRawChineseText(text: string, novelTitleFallback?: string): { novelTitle: string; chapters: ParsedChapter[] } {
  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex to match Chinese chapter headings:
  // e.g.: 第1章 ..., 第一百二十三章 ..., 第 1 节 ..., Chapter 1 ...
  const chapterRegex = /(?:^|\n)\s*(第\s*[0-9一二三四五六七八九十百千万0-9]+\s*[章节回卷集幕篇][^\n]*|Chapter\s+[0-9]+[^\n]*)/gi;

  const matches: { index: number; title: string; matchStart: number; matchEnd: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = chapterRegex.exec(normalized)) !== null) {
    const title = match[1].trim();
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    matches.push({
      index: matches.length + 1,
      title,
      matchStart,
      matchEnd
    });
  }

  // If no chapters matched or fewer than 2 chapters matched
  if (matches.length === 0) {
    // Treat whole text as Chapter 1 or split into ~3000 character chunks if very long
    if (normalized.length > 5000) {
      const chunks: ParsedChapter[] = [];
      const paragraphs = normalized.split(/\n+/);
      let currentChunk = '';
      let chunkIdx = 1;

      for (const p of paragraphs) {
        if ((currentChunk.length + p.length > 3500) && currentChunk.length > 1000) {
          chunks.push({
            index: chunkIdx,
            title: `Chapter ${chunkIdx}`,
            content: currentChunk.trim()
          });
          chunkIdx++;
          currentChunk = p + '\n\n';
        } else {
          currentChunk += p + '\n\n';
        }
      }

      if (currentChunk.trim()) {
        chunks.push({
          index: chunkIdx,
          title: `Chapter ${chunkIdx}`,
          content: currentChunk.trim()
        });
      }

      return {
        novelTitle: novelTitleFallback || 'Imported Novel',
        chapters: chunks
      };
    } else {
      return {
        novelTitle: novelTitleFallback || 'Imported Novel',
        chapters: [
          {
            index: 1,
            title: 'Chapter 1',
            content: normalized.trim()
          }
        ]
      };
    }
  }

  const chapters: ParsedChapter[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].matchStart : normalized.length;
    const content = normalized.slice(current.matchEnd, nextStart).trim();

    chapters.push({
      index: current.index,
      title: current.title,
      content
    });
  }

  // Derive novel title if pre-chapter text exists
  let derivedTitle = novelTitleFallback;
  if (!derivedTitle && matches[0].matchStart > 0) {
    const header = normalized.slice(0, matches[0].matchStart).trim();
    const firstLine = header.split('\n')[0].replace(/《|》/g, '').trim();
    if (firstLine && firstLine.length <= 40) {
      derivedTitle = firstLine;
    }
  }

  return {
    novelTitle: derivedTitle || 'Raw Chinese Novel',
    chapters
  };
}
