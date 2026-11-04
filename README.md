# 📖 DaoReader — AI Chinese Web Novel Reader & Multi-User Platform

**DaoReader** is a full-featured web novel reader and translation studio built to transform raw Chinese web novels (cultivation, xianxia, wuxia, system/LitRPG, urban fantasy, romance) into polished, readable English that feels like human-translated prose rather than rigid machine translation (MTL).

---

## 🌟 Key Features

1. **Multi-User System with Full Data Isolation**:
   - **User Accounts & Sign In**: Secure registration and login powered by bcrypt password hashing and JWT authentication.
   - **Independent Systems**: Each user has their own private SQLite-backed database space:
     - Private novel library & chapter list
     - Individual reading progress & bookmarks
     - Custom translation glossaries & terminology memory
     - Personalized API keys and reader appearances
   - Switching accounts immediately isolates and displays only the active user's content.

2. **Anti-MTL Translation Engine**:
   - **Pronoun & Gender Continuity**: Resolves ambiguous Chinese pronouns (他/她/它) using character context so characters aren't mistakenly swapped.
   - **Genre Nuance**: Translates idioms, proverbs, and cultivation concepts (Dantian, Golden Core, Nascent Soul, "courting death", "eyes failing to see Mount Tai") into vivid, natural English.
   - **Multi-Provider AI**: Powered by **Google Gemini** (Gemini 2.5 Flash / Pro with 1M+ context window), **DeepSeek** (acclaimed for Chinese slang & cultivation understanding), or **OpenAI** (GPT-4o).

3. **Persistent Glossary & Entity Memory**:
   - Automatically maintains a dictionary of character names, cultivation realms, sect names, magical items, and locations.
   - **Pre-loaded with 60+ classic Xianxia / Wuxia terms** on account creation.
   - **Auto-Discovery**: AI extracts new proper nouns from translated chapters and suggests them for your glossary.

4. **Multiple Input Methods**:
   - **Web URL Scraper**: Paste a chapter link from popular Chinese raw sites (69shu, biquge, uukanshu, etc.). Automatically decodes GBK/UTF-8 and cleans watermarks.
   - **Continuous Web Reading**: Detects "Next Chapter" links on Chinese websites so you can keep reading and auto-translating subsequent chapters with a single click.
   - **Paste Text**: Paste raw Chinese chapter title and content directly.
   - **Bulk TXT File Upload**: Drag and drop whole `.txt` raw novels; automatically parsed into hundreds of individual chapters.

5. **Distraction-Free Reader Mode**:
   - **4 Reading Themes**: Light, Warm Sepia (eye-friendly book paper), Slate Dark (midnight), and OLED Black.
   - **Typography**: Custom font families (Serif, Sans, Lora), font sizes (14px–26px), line spacing, and column widths.
   - **Bilingual & Hover Modes**: Toggle between English Only, Bilingual side-by-side, or hover over any English paragraph to peek at the original raw Chinese sentence.
   - **Keyboard Navigation**: Use Left/Right arrow keys to switch chapters.

6. **EPUB & TXT Export**:
   - Export your translated chapters into standardized `.epub` ebooks for Kindle, Apple Books, Kobo, or Moon+ Reader, or download clean plain `.txt` files.

---

## 🚀 Quick Start

Both frontend and backend are pre-configured to run with a single command:

```bash
# 1. Install dependencies
bun run install:all
# (or with npm: npm install && cd server && npm install && cd ../client && npm install)

# 2. Start the Application
bun run dev
# (or: npm run dev)
```

- **Frontend Reader**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

### Getting Started:
1. Open `http://localhost:5173` in your browser.
2. Sign in or click **"Create Account"** to register your username.
3. Every new account receives a private copy of the demo novel (*Nine Heavens Emperor Scripture*) and 60+ cultivation terms.
4. Set your API key in **Settings** (or add to `server/.env`) and enjoy reading!

# novel-tanslate
