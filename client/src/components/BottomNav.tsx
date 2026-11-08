import React from 'react';
import { LayoutGrid, BookOpen, Search, Plus, User, LogIn } from 'lucide-react';
import { AuthUser } from '../utils/api';

interface BottomNavProps {
  activeTab: 'library' | 'detail';
  hasActiveNovel: boolean;
  currentUser: AuthUser | null;
  onTabChange: (tab: 'library' | 'detail') => void;
  onOpenSearch: () => void;
  onOpenImport: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  hasActiveNovel,
  currentUser,
  onTabChange,
  onOpenSearch,
  onOpenImport,
  onOpenAuth
}) => {
  return (
    <nav
      aria-label="App Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f14]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around safe-bottom shadow-2xl"
    >
      {/* 1. Library */}
      <button
        onClick={() => onTabChange('library')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition touch-active ${
          activeTab === 'library'
            ? 'text-amber-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[10px]">Library</span>
      </button>

      {/* 2. Novel Detail */}
      {hasActiveNovel && (
        <button
          onClick={() => onTabChange('detail')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition touch-active ${
            activeTab === 'detail'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px]">Novel</span>
        </button>
      )}

      {/* 3. Search / TOC */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition touch-active"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px]">Chapters</span>
      </button>

      {/* 4. Add Novel (+) */}
      <button
        onClick={onOpenImport}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition touch-active"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
          <Plus className="w-4 h-4" />
        </div>
        <span className="text-[10px] text-amber-400 font-semibold">Add</span>
      </button>

      {/* 5. Account */}
      <button
        onClick={onOpenAuth}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition touch-active"
      >
        {currentUser ? (
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
            {currentUser.username[0].toUpperCase()}
          </div>
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        <span className="text-[10px]">{currentUser ? currentUser.username.slice(0, 6) : 'Sign In'}</span>
      </button>
    </nav>
  );
};
