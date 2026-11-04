import React, { useState } from 'react';
import { GlossaryItem, GlossaryCategory } from '../types/novel';
import { X, Search, Plus, Trash2, BookMarked, Download, Upload, RotateCcw } from 'lucide-react';
import { DEFAULT_GLOSSARY } from '../utils/defaultGlossary';

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

  // New item form
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
    { id: 'realm', label: 'Cultivation Realms' },
    { id: 'sect', label: 'Sects & Clans' },
    { id: 'item', label: 'Items & Artifacts' },
    { id: 'term', label: 'Idioms & Terms' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Translation Glossary & Memory</h2>
              <p className="text-xs text-slate-400">
                Fix character names, cultivation realms, and terms across chapters to prevent bad MTL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Chinese character, pinyin, or English translation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition border border-amber-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> Add Term
            </button>
            <button
              onClick={handleExportJSON}
              title="Export JSON"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <Download className="w-4 h-4" />
            </button>
            <label
              title="Import JSON"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              onClick={onResetDefaults}
              title="Reset to Cultivation Defaults"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Term Form */}
        {isAdding && (
          <form onSubmit={handleAddItem} className="p-4 bg-slate-950 border-b border-amber-500/30 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Chinese Original</label>
                <input
                  type="text"
                  placeholder="e.g. 萧炎"
                  value={newOriginal}
                  onChange={(e) => setNewOriginal(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">English Translation</label>
                <input
                  type="text"
                  placeholder="e.g. Xiao Yan"
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as GlossaryCategory)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="character">Character</option>
                  <option value="realm">Cultivation Realm</option>
                  <option value="sect">Sect / Clan</option>
                  <option value="item">Item / Pill / Artifact</option>
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
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Categories Tabs */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs bg-slate-950/20">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-full transition whitespace-nowrap ${
                selectedCategory === c.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Glossary Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching terms found. Try searching or adding a new term.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200 text-sm">{item.original}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-amber-300 font-medium text-sm truncate">{item.translation}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                      {item.notes && (
                        <span className="text-[11px] text-slate-500 truncate">{item.notes}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

