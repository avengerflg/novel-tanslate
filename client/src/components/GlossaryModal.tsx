import React, { useState } from 'react';
import { GlossaryItem, GlossaryCategory } from '../types/novel';
import { X, Search, Plus, Trash2, BookMarked, Download, Upload, RotateCcw } from 'lucide-react';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GlossaryItem[];
  onSaveItem: (item: GlossaryItem) => void;
  onDeleteItem: (id: string) => void;
  onResetDefaults: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  onClose,
  items,
  onSaveItem,
  onDeleteItem,
  onResetDefaults
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New item form state
  const [newOriginal, setNewOriginal] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newCategory, setNewCategory] = useState<GlossaryCategory>('character');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.original.toLowerCase().includes(search.toLowerCase()) ||
      item.translation.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOriginal.trim() || !newTranslation.trim()) return;

    onSaveItem({
      id: `gloss_${Date.now()}`,
      original: newOriginal.trim(),
      translation: newTranslation.trim(),
      category: newCategory,
      notes: newNotes.trim() || undefined
    });

    setNewOriginal('');
    setNewTranslation('');
    setNewNotes('');
    setIsAdding(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'novel_glossary.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          imported.forEach((it) => {
            if (it.original && it.translation) {
              onSaveItem({
                id: it.id || `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                original: it.original,
                translation: it.translation,
                category: it.category || 'term',
                notes: it.notes
              });
            }
          });
        }
      } catch (err) {
        alert('Invalid JSON glossary file');
      }
    };
    reader.readAsText(file);
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: `All (${items.length})` },
    { id: 'character', label: 'Characters' },
    { id: 'realm', label: 'Realms' },
    { id: 'sect', label: 'Sects' },
    { id: 'item', label: 'Items' },
    { id: 'term', label: 'Terms' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-3xl bg-[#161b22] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] modal-enter">

        {/* Mobile Handle */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Translation Glossary & Memory</h2>
              <p className="text-xs text-slate-400">Lock names, realms, and terminology across chapters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/[0.06] bg-[#0d1117]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Chinese or English..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white/[0.06] transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5 border border-amber-500/25 transition touch-active"
            >
              <Plus className="w-4 h-4" />
              <span>Add Term</span>
            </button>
            <button
              onClick={handleExportJSON}
              title="Export JSON"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition"
            >
              <Download className="w-4 h-4" />
            </button>
            <label
              title="Import JSON"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              onClick={onResetDefaults}
              title="Reset to Cultivation Defaults"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-amber-400 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Term Form */}
        {isAdding && (
          <form onSubmit={handleAddItem} className="p-4 bg-amber-500/5 border-b border-amber-500/20 animate-in slide-in-from-top-2 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Chinese Original</label>
                <input
                  type="text"
                  placeholder="e.g. 萧炎"
                  value={newOriginal}
                  onChange={(e) => setNewOriginal(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-chinese"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">English Translation</label>
                <input
                  type="text"
                  placeholder="e.g. Xiao Yan"
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as GlossaryCategory)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="character">Character</option>
                  <option value="realm">Cultivation Realm</option>
                  <option value="sect">Sect / Clan</option>
                  <option value="item">Item / Artifact</option>
                  <option value="location">Location</option>
                  <option value="term">Term / Idiom</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-white/[0.1] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs whitespace-nowrap shadow-sm touch-active"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Categories Filter Tabs */}
        <div className="px-5 py-2.5 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto text-xs bg-white/[0.01] shrink-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap touch-active ${
                selectedCategory === c.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Glossary Terms Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Search className="w-8 h-8 opacity-40" />
              <p>No matching glossary terms found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition flex items-center justify-between group touch-active"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm font-chinese">{item.original}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-amber-300 font-bold text-sm truncate">{item.translation}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400">
                        {item.category}
                      </span>
                      {item.notes && (
                        <span className="text-xs text-slate-500 truncate">{item.notes}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-white/[0.06] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
