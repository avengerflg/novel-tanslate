import React, { useState } from 'react';
import { TranslationSettings, AIProvider } from '../types/novel';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">AI & API Key Settings</h2>
              <p className="text-[11px] text-slate-400">Configure AI provider, API keys, and models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 text-sm text-slate-200">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Primary AI Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'openrouter', name: 'OpenRouter', tag: 'DeepSeek Free' },
                { id: 'gemini', name: 'Google Gemini', tag: 'Fast & Free Tier' },
                { id: 'deepseek', name: 'DeepSeek Direct', tag: 'Official API ($)' },
                { id: 'openai', name: 'OpenAI', tag: 'GPT-4o / Mini' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, provider: p.id as AIProvider })}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    formData.provider === p.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold text-slate-100 text-xs sm:text-sm">{p.name}</span>
                  <span className="text-[10px] mt-1 text-amber-400/90 font-medium">{p.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OpenRouter Settings (DeepSeek Free Model) */}
          {formData.provider === 'openrouter' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" /> OpenRouter API Key
                </span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                >
                  Get key on OpenRouter <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={formData.openrouterApiKey}
                onChange={(e) => setFormData({ ...formData, openrouterApiKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Model Slug (Free or Paid)
                </label>
                <select
                  value={formData.openrouterModel}
                  onChange={(e) => setFormData({ ...formData, openrouterModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500 text-xs font-mono"
                >
                  <option value="openrouter/free">
                    openrouter/free (Auto Free Router - 100% Free, Recommended!)
                  </option>
                  <option value="deepseek/deepseek-chat">
                    deepseek/deepseek-chat (DeepSeek V3 - High Quality, ~$0.0007/chap)
                  </option>
                  <option value="deepseek/deepseek-v4.1-flash">
                    deepseek/deepseek-v4.1-flash (DeepSeek V4.1 Flash - Ultra Cheap)
                  </option>
                  <option value="google/gemma-4-31b-it:free">
                    google/gemma-4-31b-it:free (Google Gemma 31B - 100% Free)
                  </option>
                  <option value="xingchen-agi/xing4.0-29b-a4b:free">
                    xingchen-agi/xing4.0-29b-a4b:free (Chinese Web Novel 29B - 100% Free)
                  </option>
                </select>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Or type custom model slug (e.g. openrouter/free or deepseek/deepseek-chat)"
                    value={formData.openrouterModel}
                    onChange={(e) => setFormData({ ...formData, openrouterModel: e.target.value.trim() })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs space-y-1">
                <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Free vs Paid on OpenRouter:
                </p>
                <p className="text-[11px] text-purple-200/80 leading-relaxed">
                  OpenRouter has retired <code className="bg-purple-950/80 px-1 py-0.5 rounded text-purple-300 font-mono">deepseek-chat:free</code>. Use <code className="bg-purple-950/80 px-1 py-0.5 rounded text-purple-300 font-mono">openrouter/free</code> for 100% free models. If you have credits on OpenRouter, choose <code className="bg-purple-950/80 px-1 py-0.5 rounded text-purple-300 font-mono">deepseek/deepseek-chat</code> (~$0.0007/chapter).
                </p>
                <p className="text-[11px] text-amber-300/90 pt-1 font-medium">
                  ⭐ <strong>Alternative 100% Free</strong>: Switch to <strong>Google Gemini</strong> tab! Google AI Studio gives 1,500 completely free translations per day with zero credit card needed.
                </p>
              </div>
            </div>
          )}

          {/* Gemini Settings */}
          {formData.provider === 'gemini' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                >
                  Get free key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Model</label>
                <select
                  value={formData.geminiModel}
                  onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended: Ultra-fast & high context)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Standard & Reliable)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Highest reasoning capacity)</option>
                </select>
              </div>
            </div>
          )}

          {/* DeepSeek Settings */}
          {formData.provider === 'deepseek' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" /> DeepSeek API Key
                </span>
                <a
                  href="https://platform.deepseek.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  Get DeepSeek key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={formData.deepseekApiKey}
                onChange={(e) => setFormData({ ...formData, deepseekApiKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Model</label>
                <select
                  value={formData.deepseekModel}
                  onChange={(e) => setFormData({ ...formData, deepseekModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                >
                  <option value="deepseek-chat">deepseek-chat (V3 - Outstanding Chinese translation)</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (R1 - Deep reasoning)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Settings */}
          {formData.provider === 'openai' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> OpenAI API Key
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Get OpenAI key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                placeholder="sk-..."
                value={formData.openaiApiKey}
                onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Model</label>
                <select
                  value={formData.openaiModel}
                  onChange={(e) => setFormData({ ...formData, openaiModel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & economical)</option>
                  <option value="gpt-4o">gpt-4o (High quality)</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Show API key plain text</span>
            </label>
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Keys stored locally in your browser
            </span>
          </div>

          {/* Genre & Extraction Options */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Default Novel Genre
              </label>
              <select
                value={formData.defaultGenre}
                onChange={(e) => setFormData({ ...formData, defaultGenre: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
              >
                <option value="xianxia">Xianxia / Cultivation (Immortal heroes, Dantian, Qi, Tribulations)</option>
                <option value="wuxia">Wuxia (Martial arts, Jianghu, Sect chivalry)</option>
                <option value="litrpg">LitRPG / Game System / Leveling (Status screens, dungeons, skills)</option>
                <option value="urban">Urban Fantasy / Modern Supernatural (Rebirth, hidden masters)</option>
                <option value="romance">Historical Romance / Court Intrigue (Palace drama, empress)</option>
                <option value="general">General Fantasy / Sci-Fi</option>
              </select>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <input
                type="checkbox"
                id="autoGlossary"
                checked={formData.autoExtractGlossary}
                onChange={(e) => setFormData({ ...formData, autoExtractGlossary: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <label htmlFor="autoGlossary" className="cursor-pointer">
                <span className="font-medium text-slate-200 block text-xs">
                  Auto-discover character names & proper nouns
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  AI will analyze each chapter for new characters, sects, and realm names and automatically suggest them to your glossary memory.
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              {savedToast ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

