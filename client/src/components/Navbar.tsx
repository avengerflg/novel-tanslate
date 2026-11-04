import React, { useState } from 'react';
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
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNovelSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__create_novel__') {
      onOpenImport();
    } else {
      onSelectNovel(val);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Logo & Novel Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold text-base">
              道
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                DaoReader
              </span>
              <span className="block text-[10px] text-slate-500 leading-none">Web Novel AI</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block shrink-0" />

          {/* Novel Selector Dropdown */}
          <div className="relative min-w-0 max-w-[150px] xs:max-w-[190px] sm:max-w-xs flex-1">
            <select
              value={currentNovel?.id || ''}
              onChange={handleNovelSelectChange}
              className="w-full appearance-none bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 pr-7 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
            >
              <option value="__create_novel__">✨ + Add New Novel...</option>
              {novels.length > 0 && (
                <optgroup label={`Your Novels (${novels.length})`}>
                  {novels.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.translatedTitle || n.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Center: Table of Contents (Shown on large screens) */}
        {currentChapter && (
          <button
            onClick={onOpenDrawer}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs transition shrink-0"
          >
            <List className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[160px] xl:max-w-[240px] font-medium text-slate-200">
              Ch. {currentChapter.index}: {currentChapter.translatedTitle || currentChapter.chineseTitle}
            </span>
          </button>
        )}

        {/* Desktop Navigation Items (md and larger) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Add / Import */}
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Import or Add New Novel"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Novel</span>
          </button>

          {/* Glossary */}
          <button
            onClick={onOpenGlossary}
            className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 text-xs flex items-center gap-1.5 transition"
            title="Glossary & Terminology Memory"
          >
            <BookMarked className="w-4 h-4 text-amber-400" />
            <span>Glossary</span>
            {glossaryCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold rounded-md text-[10px]">
                {glossaryCount}
              </span>
            )}
          </button>

          {/* Export */}
          {currentNovel && (
            <button
              onClick={onOpenExport}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Export EPUB Ebook"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Reading Appearance */}
          <button
            onClick={onOpenReaderSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="Reader Font & Themes"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* AI Settings */}
          <button
            onClick={onOpenAISettings}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="AI Model & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Account / Login Button */}
          <div className="relative ml-1">
            {currentUser ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs transition"
                >
                  <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-200 max-w-[80px] truncate">
                    {currentUser.username}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs animate-in fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Signed In As</p>
                      <p className="font-semibold text-slate-100 truncate">@{currentUser.username}</p>
                      {currentUser.email && (
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 text-left text-red-400 hover:bg-slate-800/60 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Header (< md) - Clean, Uncluttered, Non-overlapping */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          {/* Quick Add Novel Button */}
          <button
            onClick={onOpenImport}
            className="px-2 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
            title="Add Novel"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Add</span>
          </button>

          {/* AI & API Key Settings Quick Button */}
          <button
            onClick={onOpenAISettings}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
            title="Change AI Provider & API Key"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-[11px] text-slate-200">API</span>
          </button>

          {/* Reader Appearance (Font/Theme) */}
          <button
            onClick={onOpenReaderSettings}
            className="p-1.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition"
            title="Appearance"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Mobile Menu Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs transition"
            title="Open Menu"
          >
            {currentUser ? (
              <div className="w-4 h-4 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[9px]">
                {currentUser.username[0].toUpperCase()}
              </div>
            ) : null}
            <Menu className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Mobile Slideout Navigation Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end animate-in fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sheet Drawer */}
          <div className="relative w-72 bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-slate-100 truncate">
                    @{currentUser?.username || 'Guest'}
                  </p>
                  {currentUser?.email && (
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Options */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenImport();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-semibold transition"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Add / Create New Novel</span>
              </button>

              {currentChapter && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDrawer();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 transition"
                >
                  <List className="w-4 h-4 text-amber-400" />
                  <span className="flex-1 text-left truncate">Table of Contents</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGlossary();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <BookMarked className="w-4 h-4 text-amber-400" />
                  <span>Glossary & Memory</span>
                </div>
                {glossaryCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full text-[10px]">
                    {glossaryCount} terms
                  </span>
                )}
              </button>

              {currentNovel && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenExport();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Export EPUB Ebook</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenReaderSettings();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 transition"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Reader Fonts & Themes</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAISettings();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200 hover:bg-slate-800 transition"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>AI Model & API Keys</span>
              </button>
            </div>

            {/* Sheet Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/30">
              {currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-slate-800 rounded-xl transition text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition text-xs font-bold shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
