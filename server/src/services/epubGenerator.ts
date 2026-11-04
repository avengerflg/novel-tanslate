import archiver from 'archiver';
import { Writable } from 'stream';

export interface EpubChapter {
  title: string;
  content: string; // Plain text with newlines or HTML
}

export interface EpubOptions {
  title: string;
  author?: string;
  description?: string;
  language?: string;
  chapters: EpubChapter[];
}

export function generateEpub(options: EpubOptions, outputStream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', (err: any) => reject(err));
    outputStream.on('finish', () => resolve());
    outputStream.on('error', (err: any) => reject(err));

    archive.pipe(outputStream);

    // 1. mimetype MUST be first and uncompressed
    archive.append('application/epub+zip', {
      name: 'mimetype',
      store: true
    });

    // 2. META-INF/container.xml
    archive.append(
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
      { name: 'META-INF/container.xml' }
    );

    // 3. CSS
    const css = `
body {
  font-family: Georgia, serif;
  margin: 5%;
  line-height: 1.7;
  color: #1a1a1a;
  background-color: #fafafa;
}
h1, h2 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #111;
  text-align: center;
  margin-bottom: 2rem;
}
p {
  text-indent: 1.5em;
  margin-top: 0;
  margin-bottom: 0.8em;
  text-align: justify;
}
`;
    archive.append(css, { name: 'OEBPS/styles.css' });

    // 4. Chapters
    const manifestItems: string[] = [
      '<item id="css" href="styles.css" media-type="text/css"/>',
      '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
    ];
    const spineItems: string[] = [];
    const navPoints: string[] = [];

    options.chapters.forEach((chapter, index) => {
      const id = `chap_${index + 1}`;
      const filename = `chapter_${index + 1}.xhtml`;

      manifestItems.push(`<item id="${id}" href="${filename}" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="${id}"/>`);
      navPoints.push(`
        <navPoint id="nav_${id}" playOrder="${index + 1}">
          <navLabel><text>${escapeXml(chapter.title)}</text></navLabel>
          <content src="${filename}"/>
        </navPoint>
      `);

      // Format chapter content to paragraphs
      const paragraphs = chapter.content
        .split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => `<p>${escapeXml(p)}</p>`)
        .join('\n');

      const chapterDoc = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h2>${escapeXml(chapter.title)}</h2>
  ${paragraphs}
</body>
</html>`;

      archive.append(chapterDoc, { name: `OEBPS/${filename}` });
    });

    // 5. OEBPS/toc.ncx
    const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:novel-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(options.title)}</text></docTitle>
  <navMap>
    ${navPoints.join('\n')}
  </navMap>
</ncx>`;
    archive.append(ncx, { name: 'OEBPS/toc.ncx' });

    // 6. OEBPS/content.opf
    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(options.title)}</dc:title>
    <dc:language>${options.language || 'en'}</dc:language>
    <dc:creator>${escapeXml(options.author || 'AI Novel Translator')}</dc:creator>
    <dc:identifier id="BookID">urn:uuid:novel-${Date.now()}</dc:identifier>
    <dc:description>${escapeXml(options.description || 'Translated with AI Web Novel Reader')}</dc:description>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    archive.append(opf, { name: 'OEBPS/content.opf' });

    archive.finalize();
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

