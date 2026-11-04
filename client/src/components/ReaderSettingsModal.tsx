import React from 'react';
import { ReaderSettings, ReaderTheme, ReaderFont, ReaderMaxWidth, ViewMode } from '../types/novel';
import { X, Sun, Moon, Sparkles, Sliders, Type, AlignLeft, Key, Settings } from 'lucide-react';

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (settings: ReaderSettings) => void;
  onOpenAISettings?: () => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
  onOpenAISettings
}) => {
  if (!isOpen) return null;

  const themes: { id: ReaderTheme; name: string; bg: string; text: string; border: string }[] = [
    { id: 'light', name: 'Light', bg: 'bg-[#faf9f5]', text: 'text-[#1a1a1a]', border: 'border-slate-300' },
    { id: 'sepia', name: 'Warm Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#38271d]', border: 'border-[#dfc49e]' },
    { id: 'dark', name: 'Slate Dark', bg: 'bg-[#0f172a]', text: 'text-[#e2e8f0]', border: 'border-slate-700' },
    { id: 'oled', name: 'OLED Black', bg: 'bg-[#000000]', text: 'text-[#d4d4d8]', border: 'border-zinc-800' }
  ];

  const fonts: { id: ReaderFont; name: string; family: string }[] = [
    { id: 'literata', name: 'Literata (Books)', family: 'font-literata' },
    { id: 'lora', name: 'Lora (Literary)', family: 'font-lora' },
    { id: 'serif', name: 'Merriweather', family: 'font-serif' },
    { id: 'sans', name: 'Inter (Clean)', family: 'font-sans' }
  ];

  const widths: { id: ReaderMaxWidth; name: string }[] = [
    { id: 'narrow', name: 'Compact (620px)' },
    { id: 'medium', name: 'Optimal (760px)' },
    { id: 'wide', name: 'Spacious (900px)' },
    { id: 'full', name: 'Full Width' }
  ];

  const viewModes: { id: ViewMode; name: string; desc: string }[] = [
    { id: 'english', name: 'English Only', desc: 'Immersive book reading' },
    { id: 'bilingual', name: 'Bilingual', desc: 'English with raw Chinese below' },
    { id: 'raw', name: 'Raw Chinese', desc: 'Original source text' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Reading Appearance</h2>
              <p className="text-xs text-slate-400">Personalize your reading comfort & typography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-200">
          {/* Theme Colors */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...settings, theme: t.id })}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${t.bg} ${t.text} ${
                    settings.theme === t.id
                      ? 'ring-2 ring-amber-500 shadow-md font-bold'
                      : `${t.border} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span className="text-xs">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Text Display Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {viewModes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange({ ...settings, viewMode: v.id })}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    settings.viewMode === v.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{v.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Typography Font
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ ...settings, fontFamily: f.id })}
                  className={`p-2 rounded-xl border text-center transition ${f.family} ${
                    settings.fontFamily === f.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Spacing */}
          <div className="space-y-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Font Size</span>
                <span className="font-mono text-amber-400">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="26"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Line Spacing</span>
                <span className="font-mono text-amber-400">{settings.lineHeight.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.4"
                max="2.4"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Page Width */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reading Column Width
            </label>
            <div className="grid grid-cols-2 gap-2">
              {widths.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onChange({ ...settings, maxWidth: w.id })}
                  className={`py-1.5 px-3 rounded-lg border text-center text-xs transition ${
                    settings.maxWidth === w.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-medium'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hover tooltips */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Hover to view raw Chinese</span>
              <span className="text-[10px] text-slate-500 block">Hovering over any English paragraph reveals original source sentence</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showChineseOnHover}
              onChange={(e) => onChange({ ...settings, showChineseOnHover: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Footer: Jump to AI Settings */}
        {onOpenAISettings && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Looking to change API Keys?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAISettings();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span>AI & API Settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

