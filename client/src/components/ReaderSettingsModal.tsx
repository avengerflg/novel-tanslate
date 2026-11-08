import React, { useState, useEffect } from 'react';
import { ReaderSettings, ReaderTheme, ReaderFont, ReaderMaxWidth, ViewMode } from '../types/novel';
import {
  X,
  Sliders,
  Type,
  Key,
  Minus,
  Plus,
  Volume2,
  Sparkles,
  Check,
  Eye,
  Scroll,
  Maximize2
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'display' | 'audio' | 'ai'>('display');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices.filter((v) => v.lang.startsWith('en')));
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  // Exact 6 themes from KaynScans schema
  const themes: { id: ReaderTheme; name: string; bg: string; text: string; border: string }[] = [
    { id: 'default', name: 'Default', bg: 'bg-[#0c0d10]', text: 'text-slate-100', border: 'border-white/10' },
    { id: 'dark', name: 'Dark', bg: 'bg-[#12141a]', text: 'text-slate-200', border: 'border-slate-800' },
    { id: 'gray', name: 'Gray', bg: 'bg-[#1e2029]', text: 'text-slate-200', border: 'border-slate-700' },
    { id: 'sepia', name: 'Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#38271d]', border: 'border-[#dfc49e]' },
    { id: 'light', name: 'Light', bg: 'bg-[#faf9f5]', text: 'text-[#1a1a1a]', border: 'border-slate-300' },
    { id: 'white', name: 'White', bg: 'bg-[#ffffff]', text: 'text-black', border: 'border-slate-200' }
  ];

  // Exact fonts from KaynScans schema
  const fonts: { id: ReaderFont; name: string; preview: string; fontClass: string }[] = [
    { id: 'serif', name: 'Serif', preview: 'Classic Book', fontClass: 'font-serif' },
    { id: 'merriweather', name: 'Merriweather', preview: 'Editorial', fontClass: 'font-merriweather' },
    { id: 'lora', name: 'Lora', preview: 'Literary', fontClass: 'font-lora' },
    { id: 'literata', name: 'Literata', preview: 'Novels', fontClass: 'font-literata' },
    { id: 'lexend', name: 'Lexend', preview: 'High Legibility', fontClass: 'font-lexend' },
    { id: 'sans', name: 'Sans', preview: 'Clean UI', fontClass: 'font-sans' },
    { id: 'mono', name: 'Mono', preview: 'Technical', fontClass: 'font-mono' }
  ];

  const widths: { id: ReaderMaxWidth; name: string }[] = [
    { id: 'narrow', name: 'Compact (640px)' },
    { id: 'medium', name: 'Optimal (780px)' },
    { id: 'wide', name: 'Wide (940px)' },
    { id: 'full', name: 'Full Width' }
  ];

  const viewModes: { id: ViewMode; name: string; desc: string }[] = [
    { id: 'english', name: 'English Only', desc: 'Immersive translated prose' },
    { id: 'bilingual', name: 'Bilingual', desc: 'English with raw Chinese below' },
    { id: 'raw', name: 'Raw Chinese', desc: 'Original source text' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-lg bg-[#14161f] border border-white/[0.1] rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/90 flex flex-col max-h-[92dvh] modal-enter text-slate-100">

        {/* Mobile Pull Handle */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Reader Settings</h2>
              <p className="text-xs text-slate-400">Appearance, typography, and playback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation: Display vs Audio / TTS */}
        <div className="flex gap-1 p-1.5 mx-6 mt-3 bg-white/[0.04] rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'display'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Appearance & Typography
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Read Aloud (TTS)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {activeTab === 'display' && (
            <>
              {/* 1. Theme Swatches */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Reader Theme
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChange({ ...settings, theme: t.id })}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition touch-active ${t.bg} ${t.text} ${
                        settings.theme === t.id
                          ? 'ring-2 ring-amber-500 shadow-xl font-bold'
                          : `${t.border} opacity-75 hover:opacity-100`
                      }`}
                    >
                      <span className="text-xs font-semibold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Font Family */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Font Family
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {fonts.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onChange({ ...settings, fontFamily: f.id })}
                      className={`p-3 rounded-2xl border text-left transition ${f.fontClass} touch-active ${
                        settings.fontFamily === f.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold ring-1 ring-amber-500/40'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-sm font-semibold">{f.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{f.preview}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Font Size with [-] and [+] Stepper */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Font Size
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, fontSize: Math.max(12, settings.fontSize - 1) })}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-amber-400 font-bold text-sm px-2.5 py-0.5 rounded-lg bg-amber-500/15">
                      {settings.fontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, fontSize: Math.min(48, settings.fontSize + 1) })}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="12"
                  max="40"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/[0.1] rounded-lg"
                />

                {/* Live Preview Box */}
                <div
                  className={`p-3 rounded-xl bg-black/40 border border-white/[0.04] text-slate-300 line-clamp-2 ${settings.fontFamily}`}
                  style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
                >
                  “Children! Swallow the Pill and sit down right where you are.”
                </div>
              </div>

              {/* 4. Line Spacing with [-] and [+] Stepper */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Line Spacing
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, lineHeight: Math.max(1.2, Number((settings.lineHeight - 0.1).toFixed(1))) })}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-amber-400 font-bold text-sm px-2.5 py-0.5 rounded-lg bg-amber-500/15">
                      {settings.lineHeight.toFixed(1)}x
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, lineHeight: Math.min(2.5, Number((settings.lineHeight + 0.1).toFixed(1))) })}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 flex items-center justify-center transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/[0.1] rounded-lg"
                />
              </div>

              {/* 5. Reading Column Width */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Page Reading Width
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

              {/* 6. Display Mode (English, Bilingual, Raw) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Text Mode
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

              {/* 7. Reading Preferences Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                
                {/* Hide Header In Reader */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Hide Header While Reading</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Scroll without distractions; tap to show navigation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hideHeaderInReader ?? false}
                    onChange={(e) => onChange({ ...settings, hideHeaderInReader: e.target.checked })}
                    className="rounded border-white/[0.1] text-amber-500 focus:ring-0 ml-3"
                  />
                </div>

                {/* Continuous / Infinite Scroll */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Continuous Scroll</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Auto-load next chapter when reaching bottom
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.infiniteScrollEnabled ?? false}
                    onChange={(e) => onChange({ ...settings, infiniteScrollEnabled: e.target.checked })}
                    className="rounded border-white/[0.1] text-amber-500 focus:ring-0 ml-3"
                  />
                </div>

                {/* Hover to view Chinese source */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Hover to view raw Chinese</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Hovering paragraph displays original sentence
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
            </>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Voice
                </label>
                <select
                  value={settings.ttsVoice || ''}
                  onChange={(e) => onChange({ ...settings, ttsVoice: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Default System Voice</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* TTS Speed */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Speech Rate</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {(settings.ttsRate ?? 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsRate ?? 1.0}
                  onChange={(e) => onChange({ ...settings, ttsRate: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/[0.1] rounded-lg"
                />
              </div>

              {/* Highlight Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Highlight Text While Speaking
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sentence', 'paragraph', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onChange({ ...settings, ttsHighlightMode: mode })}
                      className={`py-2.5 px-3 rounded-xl border text-center text-xs capitalize transition touch-active ${
                        (settings.ttsHighlightMode ?? 'sentence') === mode
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                Tip: Press the <strong>▷ Autoplay</strong> button on the reading bar to start or pause Read Aloud narration at any time.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0c0d10] flex items-center justify-between shrink-0">
          {onOpenAISettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAISettings();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-amber-400 border border-white/[0.08] text-xs font-bold flex items-center gap-1.5 transition touch-active"
            >
              <Key className="w-3.5 h-3.5" />
              <span>AI Provider &amp; Keys</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition touch-active"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
