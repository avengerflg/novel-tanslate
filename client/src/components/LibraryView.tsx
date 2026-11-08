import React from 'react';
import { Novel } from '../types/novel';
import { Plus, BookOpen, ArrowRight, Trash2 } from 'lucide-react';

interface LibraryViewProps {
  novels: Novel[];
  currentNovel: Novel | null;
  onSelectNovel: (novelId: string) => void;
  onOpenImport: () => void;
  onDeleteNovel?: (novelId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  novels,
  currentNovel,
  onSelectNovel,
  onOpenImport,
  onDeleteNovel
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32 text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Your Library</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {novels.length} {novels.length === 1 ? 'novel' : 'novels'} in collection
          </p>
        </div>

        <button
          onClick={onOpenImport}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition touch-active"
        >
          <Plus className="w-4 h-4" />
          <span>Add Novel</span>
        </button>
      </div>

      {/* Grid of Novel Cards */}
      {novels.length === 0 ? (
        <div className="text-center py-24 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No novels in your library</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Scrape a novel from Chinese web sources, paste raw text, or upload a TXT file.
          </p>
          <button
            onClick={onOpenImport}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-lg touch-active"
          >
            + Add Your First Novel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {novels.map((n) => {
            const isSelected = currentNovel?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => onSelectNovel(n.id)}
                className={`group relative rounded-2xl bg-[#14161d] border overflow-hidden cursor-pointer transition flex flex-col justify-between hover:shadow-2xl hover:border-amber-500/40 touch-active ${
                  isSelected ? 'border-amber-500/50 ring-1 ring-amber-500/40' : 'border-white/[0.08]'
                }`}
              >
                {/* Book Cover Placeholder / Image */}
                <div className="aspect-[3/4] w-full bg-gradient-to-br from-[#1a1c24] via-[#12141a] to-[#0c0d12] flex flex-col justify-between p-3.5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
                  
                  <span className="text-[9px] uppercase font-bold text-amber-400/80 tracking-widest">
                    {n.genre || 'Web Novel'}
                  </span>

                  <div className="my-auto py-2 text-center">
                    <span className="font-chinese text-2xl font-black text-amber-400 block tracking-wider drop-shadow-md">
                      {n.title.slice(0, 4)}
                    </span>
                    <p className="text-[11px] font-bold text-slate-100 mt-1 line-clamp-2 leading-tight">
                      {n.translatedTitle || n.title}
                    </p>
                  </div>

                  <span className="text-[9px] text-slate-500 font-mono text-center">
                    {n.chapterIds?.length || 0} Chs
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-3 bg-[#11131a] border-t border-white/[0.04]">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {n.translatedTitle || n.title}
                  </p>
                  {n.translatedTitle && (
                    <p className="text-[10px] text-slate-500 font-chinese truncate mt-0.5">
                      {n.title}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:underline">
                      <span>Read</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>

                    {onDeleteNovel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete novel "${n.translatedTitle || n.title}"?`)) {
                            onDeleteNovel(n.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                        title="Delete novel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

