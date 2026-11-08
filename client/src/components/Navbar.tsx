import React, { useState, useRef, useEffect } from 'react';
import { Novel, Chapter } from '../types/novel';
import { AuthUser } from '../utils/api';
import {
  BookOpen,
  List,
  Plus,
  BookMarked,
  Download,
  Sliders,
  Settings,
  ChevronDown,
  LogOut,
  LogIn,
  X,
  Sparkles,
  Library
} from 'lucide-react';

interface NavbarProps {
  novels: Novel[];
  currentNovel: Novel | null;
  currentChapter: Chapter | null;
  glossaryCount: number;
  currentUser: AuthUser | null;
  onSelectNovel: (novelId: string) => void;
  onOpenImport: () => void;
  onOpenDrawer: () => void;
  onOpenGlossary: () => void;
  onOpenExport: () => void;
  onOpenReaderSettings: () => void;
  onOpenAISettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  novels,
  currentNovel,
  currentChapter,
  glossaryCount,
  currentUser,
  onSelectNovel,
  onOpenImport,
  onOpenDrawer,
  onOpenGlossary,
  onOpenExport,
  onOpenReaderSettings,
  onOpenAISettings,
  onOpenAuth,
  onLogout
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [novelPickerOpen, setNovelPickerOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const novelPickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (novelPickerRef.current && !novelPickerRef.current.contains(e.target as Node)) {
        setNovelPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectNovel = (id: string) => {
    onSelectNovel(id);
    setNovelPickerOpen(false);
  };

  const novelLabel = currentNovel
    ? (currentNovel.translatedTitle || currentNovel.title)
    : 'Select Novel';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/[0.06] text-slate-100 select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-2 sm:gap-3">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-base shadow-lg shadow-amber-500/25">
              道
            </div>
            <span className="hidden sm:block font-bold text-sm bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent tracking-tight">
              DaoReader
            </span>
          </div>

          {/* ── Novel Picker (custom dropdown) ── */}
          <div className="relative min-w-0 flex-1 max-w-[200px] sm:max-w-xs" ref={novelPickerRef}>
            <button
              onClick={() => setNovelPickerOpen(!novelPickerOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm font-medium text-slate-200 transition-colors min-w-0"
            >
              <Library className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate flex-1 text-left text-xs">{novelLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${novelPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {novelPickerOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#161b22] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                {/* Add Novel CTA */}
                <div className="p-2 border-b border-white/[0.06]">
                  <button
                    onClick={() => { setNovelPickerOpen(false); onOpenImport(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-sm font-semibold transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Novel
                  </button>
                </div>

                {/* Novel List */}
                <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
                  {novels.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No novels yet</p>
                  ) : (
                    novels.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleSelectNovel(n.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition ${
                          currentNovel?.id === n.id
                            ? 'bg-amber-500/15 text-amber-300 font-semibold'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="truncate block">{n.translatedTitle || n.title}</span>
                        {n.translatedTitle && (
                          <span className="text-xs text-slate-500 font-normal block truncate">{n.title}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Chapter Info (desktop) ── */}
          {currentChapter && (
            <button
              onClick={onOpenDrawer}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-300 font-medium transition shrink-0 max-w-[220px] xl:max-w-xs"
            >
              <List className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Ch. {currentChapter.index}: {currentChapter.translatedTitle || currentChapter.chineseTitle}</span>
            </button>
          )}

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* ── Desktop Nav Actions ── */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <NavBtn onClick={onOpenImport} label="Add Novel" icon={<Plus className="w-4 h-4" />} accent />
            <NavBtn onClick={onOpenGlossary} label={glossaryCount > 0 ? `Glossary (${glossaryCount})` : 'Glossary'} icon={<BookMarked className="w-4 h-4 text-amber-400" />} />
            {currentNovel && <NavIconBtn onClick={onOpenExport} title="Export EPUB" icon={<Download className="w-4 h-4" />} />}
            <NavIconBtn onClick={onOpenReaderSettings} title="Reading Appearance" icon={<Sliders className="w-4 h-4" />} />
            <NavIconBtn onClick={onOpenAISettings} title="AI & API Settings" icon={<Settings className="w-4 h-4" />} />

            {/* User Menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {currentUser.username[0].toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate text-slate-200">{currentUser.username}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#161b22] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Signed in as</p>
                        <p className="font-semibold text-sm text-slate-100 mt-0.5 truncate">@{currentUser.username}</p>
                        {currentUser.email && <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>}
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { setUserMenuOpen(false); onLogout(); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm transition font-medium"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/25 transition"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile Quick Actions ── */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-300 text-xs font-semibold transition touch-active"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              onClick={onOpenAISettings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-300 font-semibold transition touch-active"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>API</span>
            </button>
            {/* Mobile hamburger → bottom sheet */}
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition touch-active"
            >
              {currentUser ? (
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.username[0].toUpperCase()}
                </div>
              ) : (
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <span className="block h-0.5 bg-slate-400 rounded" />
                  <span className="block h-0.5 bg-slate-400 rounded w-3/4" />
                  <span className="block h-0.5 bg-slate-400 rounded" />
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Sheet ── */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="relative w-full bg-[#161b22] border-t border-white/[0.1] rounded-t-3xl shadow-2xl z-10 slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* User Info */}
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
                  {currentUser ? currentUser.username[0].toUpperCase() : '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-100">
                    {currentUser ? `@${currentUser.username}` : 'Guest'}
                  </p>
                  {currentUser?.email && (
                    <p className="text-xs text-slate-500 truncate max-w-[180px]">{currentUser.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu items */}
            <div className="p-3 space-y-1">
              <SheetBtn
                icon={<Plus className="w-5 h-5 text-amber-400" />}
                label="Add / Create Novel"
                accent
                onClick={() => { setMobileSheetOpen(false); onOpenImport(); }}
              />
              {currentChapter && (
                <SheetBtn
                  icon={<List className="w-5 h-5 text-amber-400" />}
                  label="Table of Contents"
                  onClick={() => { setMobileSheetOpen(false); onOpenDrawer(); }}
                />
              )}
              <SheetBtn
                icon={<BookMarked className="w-5 h-5 text-amber-400" />}
                label="Glossary & Memory"
                badge={glossaryCount > 0 ? `${glossaryCount}` : undefined}
                onClick={() => { setMobileSheetOpen(false); onOpenGlossary(); }}
              />
              {currentNovel && (
                <SheetBtn
                  icon={<Download className="w-5 h-5 text-slate-400" />}
                  label="Export EPUB Ebook"
                  onClick={() => { setMobileSheetOpen(false); onOpenExport(); }}
                />
              )}
              <SheetBtn
                icon={<Sliders className="w-5 h-5 text-slate-400" />}
                label="Reader Fonts & Themes"
                onClick={() => { setMobileSheetOpen(false); onOpenReaderSettings(); }}
              />
              <SheetBtn
                icon={<Settings className="w-5 h-5 text-slate-400" />}
                label="AI Model & API Keys"
                onClick={() => { setMobileSheetOpen(false); onOpenAISettings(); }}
              />
            </div>

            {/* Footer */}
            <div className="p-3 pt-0 safe-bottom">
              {currentUser ? (
                <button
                  onClick={() => { setMobileSheetOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 font-semibold text-sm transition touch-active"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { setMobileSheetOpen(false); onOpenAuth(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition touch-active"
                >
                  <LogIn className="w-5 h-5" /> Sign In / Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Helper: Desktop nav button with label ──
const NavBtn: React.FC<{ onClick: () => void; label: string; icon: React.ReactNode; accent?: boolean }> = ({
  onClick, label, icon, accent
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
      accent
        ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300'
        : 'text-slate-300 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ── Helper: Desktop icon-only button ──
const NavIconBtn: React.FC<{ onClick: () => void; title: string; icon: React.ReactNode }> = ({
  onClick, title, icon
}) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition"
  >
    {icon}
  </button>
);

// ── Helper: Mobile sheet menu item ──
const SheetBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
  badge?: string;
}> = ({ icon, label, onClick, accent, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition touch-active ${
      accent
        ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 font-semibold'
        : 'text-slate-200 hover:bg-white/[0.06]'
    }`}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {badge && (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
        {badge}
      </span>
    )}
  </button>
);
