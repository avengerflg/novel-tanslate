import React from 'react';
import { ReaderSettings, ReaderTheme, ReaderFont, ReaderMaxWidth, ViewMode } from '../types/novel';
import { X, Sliders, Key, Type } from 'lucide-react';

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

  const fonts: { id: ReaderFont; name: string; family: string; preview: string }[] = [
    { id: 'literata', name: 'Literata', family: 'font-literata', preview: 'Books' },
    { id: 'lora', name: 'Lora', family: 'font-lora', preview: 'Literary' },
    { id: 'serif', name: 'Merriweather', family: 'font-serif', preview: 'Classic' },
    { id: 'sans', name: 'Inter', family: 'font-sans', preview: 'Clean UI' }
  ];

  const widths: { id: ReaderMaxWidth; name: string }[] = [
    { id: 'narrow', name: 'Compact (640px)' },
    { id: 'medium', name: 'Optimal (780px)' },
    { id: 'wide', name: 'Wide (940px)' },
    { id: 'full', name: 'Full Width' }
  ];

  const viewModes: { id: ViewMode; name: string; desc: string }[] = [
    { id: 'english', name: 'English Only', desc: 'Immersive book reading' },
    { id: 'bilingual', name: 'Bilingual', desc: 'English + raw Chinese' },
    { id: 'raw', name: 'Raw Chinese', desc: 'Original source text' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-md bg-[#161b22] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] modal-enter">

        {/* Mobile Handle */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Reading Appearance</h2>
              <p className="text-xs text-slate-400">Typography, theme, and view modes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-slate-200">
          
          {/* Themes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Theme Palette
            </label>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...settings, theme: t.id })}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition touch-active ${t.bg} ${t.text} ${
                    settings.theme === t.id
                      ? 'ring-2 ring-amber-500 shadow-lg font-bold'
                      : `${t.border} opacity-75 hover:opacity-100`
                  }`}
                >
                  <span className="text-xs">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View Modes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Display Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {viewModes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange({ ...settings, viewMode: v.id })}
                  className={`p-3 rounded-2xl border text-center transition touch-active ${
                    settings.viewMode === v.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{v.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Fonts */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChange({ ...settings, fontFamily: f.id })}
                  className={`p-3 rounded-2xl border text-left transition ${f.family} touch-active ${
                    settings.fontFamily === f.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{f.preview}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Height */}
          <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400 font-medium">Font Size</span>
                <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-500/15">
                  {settings.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min="14"
                max="26"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-white/[0.1] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400 font-medium">Line Spacing</span>
                <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded-lg bg-amber-500/15">
                  {settings.lineHeight.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="1.4"
                max="2.4"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-white/[0.1] rounded-lg"
              />
            </div>
          </div>

          {/* Reading Column Width */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Reading Column Width
            </label>
            <div className="grid grid-cols-2 gap-2">
              {widths.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onChange({ ...settings, maxWidth: w.id })}
                  className={`py-2 px-3 rounded-xl border text-center text-xs transition touch-active ${
                    settings.maxWidth === w.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hover translation tooltip */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Hover to view raw Chinese</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Hovering over English paragraphs reveals original Chinese sentence
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.showChineseOnHover}
              onChange={(e) => onChange({ ...settings, showChineseOnHover: e.target.checked })}
              className="rounded border-white/[0.1] text-amber-500 focus:ring-0 ml-3"
            />
          </div>
        </div>

        {/* Footer */}
        {onOpenAISettings && (
          <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0d1117]/80 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">Need to change AI Model or Key?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAISettings();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25 text-xs font-bold flex items-center gap-1.5 transition touch-active"
            >
              <Key className="w-3.5 h-3.5" />
              <span>AI Settings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
