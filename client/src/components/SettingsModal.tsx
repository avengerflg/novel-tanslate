import React, { useState } from 'react';
import { TranslationSettings, AIProvider } from '../types/novel';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranslationSettings;
  onSave: (settings: TranslationSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<TranslationSettings>({ ...settings });
  const [showKeys, setShowKeys] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (k?: string) => (k ? k.trim().replace(/[\r\n\u2028\u2029\s]/g, '') : '');
    const sanitizedData: TranslationSettings = {
      ...formData,
      geminiApiKey: clean(formData.geminiApiKey),
      deepseekApiKey: clean(formData.deepseekApiKey),
      openrouterApiKey: clean(formData.openrouterApiKey),
      openaiApiKey: clean(formData.openaiApiKey),
      customApiKey: clean(formData.customApiKey)
    };
    onSave(sanitizedData);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 600);
  };

  const providers: { id: AIProvider; name: string; tag: string; desc: string }[] = [
    { id: 'openrouter', name: 'OpenRouter', tag: '100% Free / Multi', desc: 'openrouter/free or DeepSeek' },
    { id: 'gemini', name: 'Google Gemini', tag: 'Fast & Free', desc: '1,500 free daily reqs' },
    { id: 'deepseek', name: 'DeepSeek Direct', tag: 'Official API ($)', desc: 'Official platform key' },
    { id: 'openai', name: 'OpenAI', tag: 'GPT-4o Mini', desc: 'Fast, official API key' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-xl bg-[#161b22] border border-white/[0.1] rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[92dvh] modal-enter">

        {/* Mobile Handle */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">AI Model & API Keys</h2>
              <p className="text-xs text-slate-400">Configure translation provider and models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          
          {/* Provider Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Primary AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, provider: p.id })}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between touch-active ${
                    formData.provider === p.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.15] hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-slate-100 text-sm">{p.name}</span>
                  <span className="text-[11px] mt-1 text-amber-400 font-medium">{p.tag}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OpenRouter Section */}
          {formData.provider === 'openrouter' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  OpenRouter API Key
                </span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Get key on OpenRouter <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={formData.openrouterApiKey}
                onChange={(e) => setFormData({ ...formData, openrouterApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Model Slug
                </label>
                <select
                  value={formData.openrouterModel}
                  onChange={(e) => setFormData({ ...formData, openrouterModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
                >
                  <option value="openrouter/free">openrouter/free (Auto Free Router - 100% Free!)</option>
                  <option value="deepseek/deepseek-chat">deepseek/deepseek-chat (DeepSeek V3 - High Quality, ~$0.0007/chap)</option>
                  <option value="deepseek/deepseek-v4.1-flash">deepseek/deepseek-v4.1-flash (Ultra Cheap)</option>
                  <option value="google/gemma-4-31b-it:free">google/gemma-4-31b-it:free (Google Gemma 31B - Free)</option>
                  <option value="xingchen-agi/xing4.0-29b-a4b:free">xingchen-agi/xing4.0-29b-a4b:free (Chinese Web Novel 29B - Free)</option>
                </select>
                <input
                  type="text"
                  placeholder="Or type custom model slug..."
                  value={formData.openrouterModel}
                  onChange={(e) => setFormData({ ...formData, openrouterModel: e.target.value.trim() })}
                  className="w-full mt-2 px-3.5 py-2 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1.5 text-purple-200">
                <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Free vs Paid Info:
                </p>
                <p className="text-[11px] leading-relaxed text-purple-200/85">
                  Use <code className="bg-black/30 px-1 py-0.5 rounded text-purple-300 font-mono">openrouter/free</code> for 100% free models. Or switch to <strong>Google Gemini</strong> tab for 1,500 completely free chapters/day.
                </p>
              </div>
            </div>
          )}

          {/* Gemini Section */}
          {formData.provider === 'gemini' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Get free key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                <select
                  value={formData.geminiModel}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended: Fast &amp; free)</option>
                  <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Lightest &amp; fastest)</option>
                  <option value="gemini-2.5-flash-preview-05-20">gemini-2.5-flash (Best quality, free tier)</option>
                </select>
              </div>
            </div>
          )}

          {/* DeepSeek Direct Section */}
          {formData.provider === 'deepseek' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  DeepSeek API Key
                </span>
                <a
                  href="https://platform.deepseek.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Get DeepSeek key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={formData.deepseekApiKey}
                onChange={(e) => setFormData({ ...formData, deepseekApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                <select
                  value={formData.deepseekModel}
                  onChange={(e) => setFormData({ ...formData, deepseekModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="deepseek-chat">deepseek-chat (V3 - Outstanding Chinese translation)</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (R1 - Deep reasoning)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Section */}
          {formData.provider === 'openai' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  OpenAI API Key
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Get OpenAI key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                <select
                  value={formData.openaiModel}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-white/[0.1] rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & economical)</option>
                  <option value="gpt-4o">gpt-4o (High quality)</option>
                </select>
              </div>
            </div>
          )}

          {/* Key visibility toggle & security badge */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="rounded border-white/[0.1] bg-[#0d1117] text-amber-500 focus:ring-0"
              />
              <span>Show plain text keys</span>
            </label>
            <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keys stored locally in your browser</span>
            </span>
          </div>

          {/* Genre & Discovery Options */}
          <div className="border-t border-white/[0.06] pt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Default Novel Genre
              </label>
              <select
                value={formData.defaultGenre}
                onChange={(e) => setFormData({ ...formData, defaultGenre: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-medium"
              >
                <option value="xianxia">Xianxia / Cultivation (Immortal heroes, Dantian, Qi, Tribulations)</option>
                <option value="wuxia">Wuxia (Martial arts, Jianghu, Sect chivalry)</option>
                <option value="litrpg">LitRPG / Game System / Leveling (Status screens, dungeons, skills)</option>
                <option value="urban">Urban Fantasy / Modern Supernatural (Rebirth, hidden masters)</option>
                <option value="romance">Historical Romance / Court Intrigue (Palace drama, empress)</option>
                <option value="general">General Fantasy / Sci-Fi</option>
              </select>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <input
                type="checkbox"
                id="autoGlossary"
                checked={formData.autoExtractGlossary}
                onChange={(e) => setFormData({ ...formData, autoExtractGlossary: e.target.checked })}
                className="mt-0.5 rounded border-white/[0.1] text-amber-500 focus:ring-0"
              />
              <label htmlFor="autoGlossary" className="cursor-pointer select-none">
                <span className="font-semibold text-slate-200 block text-xs">
                  Auto-discover character names & proper nouns
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                  AI will analyze each chapter for new characters, sects, and realm names and automatically suggest them to your glossary memory.
                </span>
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 touch-active"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
