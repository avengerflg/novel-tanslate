import React, { useState, useEffect } from 'react';
import {
  ReaderSettings,
  ReaderTheme,
  ReaderFont,
  ReaderMaxWidth,
  ViewMode
} from '../types/novel';
import {
  X,
  Settings,
  Layout,
  Type,
  Palette,
  Languages,
  Volume2,
  Minus,
  Plus,
  BookOpen,
  Infinity as InfinityIcon,
  Check,
  ChevronRight,
  Cloud,
  Scroll,
  Zap,
  Sliders,
  Keyboard
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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showAllShortcuts, setShowAllShortcuts] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    onChange({
      theme: 'default',
      fontFamily: 'georgia',
      fontSize: 18,
      lineHeight: 1.8,
      maxWidth: 'medium',
      viewMode: 'english',
      showChineseOnHover: true,
      hideHeaderInReader: false,
      infiniteScrollEnabled: false,
      paragraphComments: true,
      autoUnlock: false,
      autoplayMode: 'scroll',
      scrollSpeedPreset: 'normal',
      readingPaceWpm: 240,
      ttsHighlightMode: 'paragraph',
      ttsRate: 1.0,
      followText: true,
      scrollingBehavior: 'page',
      readingLine: 'middle',
      continueNextChapter: true
    });
  };

  const updateSetting = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  // Exact 6 themes from KaynScans Image 3
  const themes: { id: ReaderTheme; name: string; bg: string; text: string; border: string }[] = [
    { id: 'default', name: 'Default', bg: 'bg-[#0c0d10]', text: 'text-slate-100', border: 'border-white/10' },
    { id: 'dark',    name: 'Dark',    bg: 'bg-[#181a24]', text: 'text-slate-200', border: 'border-[#262838]' },
    { id: 'gray',    name: 'Gray',    bg: 'bg-[#262833]', text: 'text-slate-200', border: 'border-[#373a48]' },
    { id: 'sepia',   name: 'Sepia',   bg: 'bg-[#f4ecd8]', text: 'text-[#38271d]', border: 'border-[#dfc49e]' },
    { id: 'light',   name: 'Light',   bg: 'bg-[#f1f1f3]', text: 'text-[#1a1a1a]', border: 'border-slate-300' },
    { id: 'white',   name: 'White',   bg: 'bg-[#ffffff]', text: 'text-black',     border: 'border-slate-200' }
  ];

  // Exact 9 fonts from KaynScans Image 2
  const fonts: { id: ReaderFont; name: string; fontClass: string }[] = [
    { id: 'georgia',      name: 'Georgia',      fontClass: 'font-georgia' },
    { id: 'merriweather', name: 'Merriweather', fontClass: 'font-merriweather' },
    { id: 'lora',         name: 'Lora',         fontClass: 'font-lora' },
    { id: 'literata',     name: 'Literata',     fontClass: 'font-literata' },
    { id: 'sourceserif',  name: 'Source Serif', fontClass: 'font-sourceserif' },
    { id: 'lexend',       name: 'Lexend',       fontClass: 'font-lexend' },
    { id: 'sans',         name: 'System Sans',  fontClass: 'font-sans' },
    { id: 'opensans',     name: 'Open Sans',    fontClass: 'font-opensans' },
    { id: 'mono',         name: 'Monospace',    fontClass: 'font-mono' }
  ];

  const currentFontObj = fonts.find((f) => f.id === settings.fontFamily) || fonts[0];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Left Panel (Matches KaynScans Exactly!) */}
      <div className="relative w-full max-w-md sm:max-w-[460px] bg-[#0c0d10] border-r border-white/[0.08] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300 text-slate-100 overflow-hidden select-none">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0e1015]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-slate-300" />
            <h2 className="text-base font-bold text-slate-100">Reading Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition touch-active"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
          
          {/* ── 1. Live Preview Card (Image 1) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl font-bold text-slate-100 ${currentFontObj.fontClass}`}>
                Aa
              </span>
              <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">
                LIVE PREVIEW
              </span>
            </div>
            <p
              className={`text-slate-200 transition-all ${currentFontObj.fontClass}`}
              style={{
                fontSize: `${Math.min(20, Math.max(14, settings.fontSize))}px`,
                lineHeight: settings.lineHeight
              }}
            >
              The lantern guttered in the night wind, and for a long moment she let the silence settle around her like fresh snow.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[11px] text-emerald-400 font-medium">
              <Cloud className="w-3.5 h-3.5" />
              <span>Synced to your account</span>
            </div>
          </div>

          {/* ── 2. Layout Card (Image 1) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Layout className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Layout</span>
            </div>

            {/* Reading Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Reading Mode</label>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Standard */}
                <button
                  type="button"
                  onClick={() => updateSetting('infiniteScrollEnabled', false)}
                  className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 touch-active ${
                    !settings.infiniteScrollEnabled
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-0.5" />
                  <span className="text-xs font-bold block">Standard</span>
                  <span className="text-[10px] opacity-70 font-normal">One chapter at a time</span>
                </button>

                {/* Infinite */}
                <button
                  type="button"
                  onClick={() => updateSetting('infiniteScrollEnabled', true)}
                  className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 touch-active ${
                    settings.infiniteScrollEnabled
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <InfinityIcon className="w-5 h-5 mb-0.5" />
                  <span className="text-xs font-bold block">Infinite</span>
                  <span className="text-[10px] opacity-70 font-normal">Continuous scrolling</span>
                </button>
              </div>
            </div>

            {/* Toggle 1: Hide header while reading */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Hide header while reading
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  Keep the site's navigation bar out of the way while you read (tablets and computers)
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('hideHeaderInReader', !settings.hideHeaderInReader)}
                className={`w-11 h-6 rounded-full transition relative shrink-0 p-0.5 ${
                  settings.hideHeaderInReader ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                    settings.hideHeaderInReader ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Auto Unlock */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto Unlock</span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  Unlock premium chapters automatically while scrolling
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('autoUnlock', !settings.autoUnlock)}
                className={`w-11 h-6 rounded-full transition relative shrink-0 p-0.5 ${
                  settings.autoUnlock ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                    settings.autoUnlock ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── 3. Typography Card (Image 2) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Type className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Typography</span>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Font Size</span>
                <span className="text-xs font-mono text-slate-400">{settings.fontSize}px</span>
              </div>

              {/* Stepper with slider and number box */}
              <div className="flex items-center gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 1))}
                  className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-slate-200 transition touch-active"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="12"
                  max="36"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
                  className="flex-1 accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => updateSetting('fontSize', Math.min(36, settings.fontSize + 1))}
                  className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center text-slate-200 transition touch-active"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="w-12 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-slate-200">
                  {settings.fontSize}
                </div>
              </div>

              {/* Quick Size Presets [14, 16, 18, 20, 24, 28, 32] */}
              <div className="grid grid-cols-7 gap-1">
                {[14, 16, 18, 20, 24, 28, 32].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateSetting('fontSize', sz)}
                    className={`py-1 rounded-lg text-xs font-bold transition touch-active ${
                      settings.fontSize === sz
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] border border-white/[0.04]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Line Height</span>
                <span className="text-xs font-mono text-slate-400">{settings.lineHeight}</span>
              </div>

              <input
                type="range"
                min="1.3"
                max="2.8"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer mb-2.5"
              />

              {/* Quick Line Height Presets [1.5, 1.8, 2.0, 2.5] */}
              <div className="grid grid-cols-4 gap-1.5">
                {[1.5, 1.8, 2.0, 2.5].map((lh) => (
                  <button
                    key={lh}
                    type="button"
                    onClick={() => updateSetting('lineHeight', lh)}
                    className={`py-1 rounded-lg text-xs font-bold transition touch-active ${
                      settings.lineHeight === lh
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] border border-white/[0.04]'
                    }`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family (Exact 3x3 Grid of 9 Fonts) */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-300">Font Family</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded">
                  F TO CYCLE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {fonts.map((f) => {
                  const isSelected = settings.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateSetting('fontFamily', f.id)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 touch-active ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-sm'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`text-base font-bold ${f.fontClass}`}>Aa</span>
                      <span className="text-[11px] truncate max-w-full font-medium">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. Appearance Card (Image 3) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Appearance</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2.5">Theme</span>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((t) => {
                  const isSelected = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateSetting('theme', t.id)}
                      className={`relative p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1 touch-active ${t.bg} ${t.text} ${
                        isSelected
                          ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                          : 'border-white/[0.1] hover:border-white/25'
                      }`}
                    >
                      {/* Checkmark in circle at top right if selected */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <span className="text-base font-bold">Aa</span>
                      <span className={`text-[11px] font-semibold ${isSelected ? 'text-amber-400' : ''}`}>
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 5. Translation Card (Image 3) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Translation</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Gemini, DeepSeek, or OpenRouter account to translate chapters with customized terminology memory. Free models need no credit; paid ones usually cost a few cents or less.
            </p>

            {onOpenAISettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAISettings();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 touch-active"
              >
                <span>Set up translation</span>
              </button>
            )}
          </div>

          {/* ── 6. Autoplay & Voice Card (Images 3, 4, 5) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Autoplay & voice</span>
            </div>

            {/* Mode: Scroll vs Read aloud */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Mode</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting('autoplayMode', 'scroll')}
                  className={`py-3 px-3 rounded-xl border text-center transition flex items-center justify-center gap-2 text-xs font-bold touch-active ${
                    (settings.autoplayMode || 'scroll') === 'scroll'
                      ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <Scroll className="w-4 h-4" />
                  <span>Scroll</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('autoplayMode', 'readaloud')}
                  className={`py-3 px-3 rounded-xl border text-center transition flex items-center justify-center gap-2 text-xs font-bold touch-active ${
                    settings.autoplayMode === 'readaloud'
                      ? 'bg-amber-500 border-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Read aloud</span>
                </button>
              </div>
            </div>

            {/* Scroll speed */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Scroll speed</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'high'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => updateSetting('scrollSpeedPreset', spd)}
                    className={`py-2 rounded-xl border text-center text-xs capitalize font-bold transition touch-active ${
                      (settings.scrollSpeedPreset || 'normal') === spd
                        ? 'bg-amber-500 border-amber-500 text-black shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>

            {/* Normal pace */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Normal pace</span>
                <span className="text-xs font-mono text-amber-400">
                  {settings.readingPaceWpm || 240} wpm
                </span>
              </div>
              <input
                type="range"
                min="120"
                max="450"
                step="10"
                value={settings.readingPaceWpm || 240}
                onChange={(e) => updateSetting('readingPaceWpm', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Voice Picker */}
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-400 block mb-2">Voice</span>
              <div
                onClick={() => setShowVoicePicker(!showVoicePicker)}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between text-xs cursor-pointer transition touch-active"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300 uppercase">
                    Device
                  </span>
                  <span className="truncate text-slate-200">
                    {settings.ttsVoice
                      ? availableVoices.find((v) => v.name === settings.ttsVoice)?.name || 'Device Voice'
                      : 'Choose a voice · Device voices'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {/* Voice dropdown list */}
              {showVoicePicker && availableVoices.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-[#181a24] border border-white/[0.1] p-1.5 space-y-1">
                  {availableVoices.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        updateSetting('ttsVoice', v.name);
                        setShowVoicePicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition ${
                        settings.ttsVoice === v.name
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {v.name} ({v.lang})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Speed Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-400">Speed</span>
                <span className="text-xs font-mono text-amber-400">{settings.ttsRate || 1}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.ttsRate || 1}
                onChange={(e) => updateSetting('ttsRate', Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer mb-1"
              />
              <p className="text-[10px] text-slate-500">Up to 2x for this voice</p>
            </div>

            {/* Highlight */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Highlight</span>
              <div className="grid grid-cols-3 gap-2">
                {(['word', 'paragraph', 'off'] as const).map((hl) => (
                  <button
                    key={hl}
                    type="button"
                    onClick={() => updateSetting('ttsHighlightMode', hl)}
                    className={`py-2 rounded-xl border text-center text-xs capitalize font-bold transition touch-active ${
                      (settings.ttsHighlightMode || 'paragraph') === hl
                        ? 'bg-amber-500 border-amber-500 text-black shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {hl}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle: Follow the text */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Follow the text
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  Keeps the words being read in view. Scroll away any time and the page lets go; scroll back to reread and it waits.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('followText', !settings.followText)}
                className={`w-11 h-6 rounded-full transition relative shrink-0 p-0.5 ${
                  settings.followText !== false ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                    settings.followText !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Scrolling: Smooth vs Page by page */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Scrolling</span>
              <div className="grid grid-cols-2 gap-2">
                {(['smooth', 'page'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => updateSetting('scrollingBehavior', sc)}
                    className={`py-2 rounded-xl border text-center text-xs font-bold transition touch-active ${
                      (settings.scrollingBehavior || 'page') === sc
                        ? 'bg-amber-500 border-amber-500 text-black shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {sc === 'smooth' ? 'Smooth' : 'Page by page'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reading line: Top third vs Middle vs My spot */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Reading line</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'top', label: 'Top third' },
                  { id: 'middle', label: 'Middle' },
                  { id: 'spot', label: 'My spot' }
                ].map((rl) => (
                  <button
                    key={rl.id}
                    type="button"
                    onClick={() => updateSetting('readingLine', rl.id as any)}
                    className={`py-2 rounded-xl border text-center text-xs font-bold transition touch-active ${
                      (settings.readingLine || 'middle') === rl.id
                        ? 'bg-amber-500 border-amber-500 text-black shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {rl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle: Continue into the next chapter */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-200 block">
                  Continue into the next chapter
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  Never unlocks a chapter by itself.
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSetting('continueNextChapter', !settings.continueNextChapter)}
                className={`w-11 h-6 rounded-full transition relative shrink-0 p-0.5 ${
                  settings.continueNextChapter !== false ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${
                    settings.continueNextChapter !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Read aloud link */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer transition">
                More in Settings › Read aloud
              </span>
            </div>
          </div>

          {/* ── 7. Keyboard Shortcuts Card (Image 6) ── */}
          <div className="bg-[#13151b] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] text-slate-300 flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">Keyboard Shortcuts</span>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {/* Previous Chapter */}
              <div className="flex items-center justify-between text-slate-300">
                <span>Previous chapter</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px] font-bold border border-white/[0.06]">
                    ←
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px] font-bold border border-white/[0.06]">
                    J
                  </span>
                </div>
              </div>

              {/* Next Chapter */}
              <div className="flex items-center justify-between text-slate-300">
                <span>Next chapter</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px] font-bold border border-white/[0.06]">
                    →
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px] font-bold border border-white/[0.06]">
                    K
                  </span>
                </div>
              </div>

              {/* Cycle Font Family */}
              <div className="flex items-center justify-between text-slate-300">
                <span>Cycle font family</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px] font-bold border border-white/[0.06]">
                  F
                </span>
              </div>
            </div>

            {/* All keyboard shortcuts link */}
            <div
              onClick={() => setShowAllShortcuts(!showAllShortcuts)}
              className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs text-amber-400 font-semibold cursor-pointer hover:text-amber-300 transition"
            >
              <span>All keyboard shortcuts</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showAllShortcuts ? 'rotate-90' : ''}`} />
            </div>

            {showAllShortcuts && (
              <div className="pt-2 space-y-2 text-xs border-t border-white/[0.06] text-slate-400 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span>Toggle Header/Controls</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-slate-300">H</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Play/Pause Autoplay</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-slate-300">Space</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cycle Display Mode</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-slate-300">D</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Close Settings / Drawers</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[10px] text-slate-300">Esc</span>
                </div>
              </div>
            )}
          </div>

          {/* Reset to Default Button */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full py-3.5 rounded-2xl bg-[#13151b] hover:bg-white/[0.06] border border-white/[0.08] text-slate-200 font-bold text-xs transition touch-active text-center"
          >
            Reset to Default
          </button>

          {/* All Reading Settings Row */}
          <div
            onClick={() => {
              if (onOpenAISettings) {
                onClose();
                onOpenAISettings();
              }
            }}
            className="p-3.5 rounded-2xl bg-[#13151b] border border-white/[0.08] flex items-center justify-between text-slate-200 hover:bg-[#191b24] cursor-pointer transition touch-active mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-100">All reading settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
