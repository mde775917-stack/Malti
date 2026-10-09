import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  Languages,
  Lock,
  Mic,
  Monitor,
  PictureInPicture2,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  Smartphone,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  ActiveScreen,
  BookmarkItem,
  BrowserProfile,
  BrowserTab,
  HistoryEntry,
  ReaderArticle,
  SearchEngineId,
  StoredCookieItem,
} from '../types/browser';
import {
  formatDomainDisplay,
  PROFILE_COLORS,
  resolveInputToUrl,
  SEARCH_ENGINES,
} from '../data/defaults';
import { ProfileAvatar } from './ProfileAvatar';

// ============================================================================
// 1. First-Launch Onboarding Modal
// ============================================================================
export const OnboardingModal: React.FC<{
  activeProfile: BrowserProfile;
  onUpdateProfile: (updated: BrowserProfile) => void;
  onComplete: () => void;
}> = ({ activeProfile, onUpdateProfile, onComplete }) => {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">
            Step {step + 1} of 3 · Welcome to Unlimited Virtual
          </span>
          <button
            onClick={onComplete}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Skip
          </button>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/15 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Desktop-Grade Multi-Profile Isolation on Mobile
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Switch effortlessly between <strong>Personal</strong>, <strong>Work</strong>, and <strong>Study</strong> profiles—or create unlimited custom profiles. Each profile maintains its own strictly isolated Cookie Jar, DOM storage partition, open tabs, bookmarks, and history.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600/15 text-emerald-500 flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Real Web Proxy Engine &amp; Ephemeral Private Mode
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Navigate real websites with our server-backed profile proxy, or open <strong>uv://auth-lab</strong> to test signing in across profiles and verifying zero cookie or session leakage. Private Tabs run strictly in RAM and self-destruct on close.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-violet-600/15 text-violet-500 flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Choose Your Default Search Engine
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(['duckduckgo', 'google', 'bing', 'brave'] as SearchEngineId[]).map((engId) => {
                const eng = SEARCH_ENGINES[engId];
                const selected = activeProfile.searchEngine === engId;
                return (
                  <button
                    key={engId}
                    onClick={() => onUpdateProfile({ ...activeProfile, searchEngine: engId })}
                    className={`min-h-[44px] p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{eng.name}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              if (step < 2) setStep(step + 1);
              else onComplete();
            }}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-2 hover:bg-blue-500"
          >
            <span>{step < 2 ? 'Continue' : 'Start Browsing'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Omnibox Search & URL Suggestions Screen
// ============================================================================
export const OmniboxOverlay: React.FC<{
  activeProfile: BrowserProfile;
  initialValue: string;
  tabs: BrowserTab[];
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  onClose: () => void;
  onNavigate: (url: string) => void;
  onSwitchToTab: (tabId: string) => void;
  onChangeEngine: (engine: SearchEngineId) => void;
  onOpenVoiceSearch: () => void;
  onOpenQrScanner: () => void;
}> = ({
  activeProfile,
  initialValue,
  tabs,
  bookmarks,
  history,
  onClose,
  onNavigate,
  onSwitchToTab,
  onChangeEngine,
  onOpenVoiceSearch,
  onOpenQrScanner,
}) => {
  const [input, setInput] = useState(
    initialValue === 'uv://home' ? '' : initialValue
  );
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const q = input.trim();
    if (!q || q.startsWith('http://') || q.startsWith('https://') || q.startsWith('uv://')) {
      setRemoteSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search-suggest?q=${encodeURIComponent(q)}`);
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data.suggestions)) {
            setRemoteSuggestions(data.suggestions);
          }
        }
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = resolveInputToUrl(
      input,
      activeProfile.searchEngine,
      activeProfile.customSearchUrl
    );
    onNavigate(targetUrl);
    onClose();
  };

  const qLower = input.trim().toLowerCase();
  const matchingTabs = tabs
    .filter(
      (t) =>
        t.profileId === activeProfile.id &&
        !t.isPrivate &&
        qLower &&
        (t.title.toLowerCase().includes(qLower) || t.url.toLowerCase().includes(qLower))
    )
    .slice(0, 2);

  const matchingBookmarks = bookmarks
    .filter(
      (b) =>
        b.profileId === activeProfile.id &&
        qLower &&
        (b.title.toLowerCase().includes(qLower) || b.url.toLowerCase().includes(qLower))
    )
    .slice(0, 3);

  const matchingHistory = history
    .filter(
      (h) =>
        h.profileId === activeProfile.id &&
        (!qLower || h.title.toLowerCase().includes(qLower) || h.url.toLowerCase().includes(qLower))
    )
    .slice(0, 5);

  const activeEngine = SEARCH_ENGINES[activeProfile.searchEngine] || SEARCH_ENGINES.duckduckgo;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Omnibox Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
      >
        <div className="flex-1 flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 border border-blue-500/50">
          <Search className="h-4 w-4 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Search ${activeEngine.name} or enter URL...`}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenVoiceSearch();
            }}
            className="p-1.5 text-slate-500 hover:text-blue-500"
            title="Voice Search"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenQrScanner();
            }}
            className="p-1.5 text-slate-500 hover:text-blue-500"
            title="QR Scanner"
          >
            <QrCode className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[42px] px-3 text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          Cancel
        </button>
      </form>

      {/* Quick Search Engine Selector Strip */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/50">
        <span className="text-[11px] text-slate-400 mr-1 shrink-0">Search with:</span>
        {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((id) => {
          const eng = SEARCH_ENGINES[id];
          const active = activeProfile.searchEngine === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChangeEngine(id)}
              className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {eng.name}
            </button>
          );
        })}
      </div>

      {/* Suggestions & Profile Matches */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto space-y-5">
        {/* Direct Action */}
        {input.trim() && (
          <button
            onClick={() => {
              const target = resolveInputToUrl(
                input,
                activeProfile.searchEngine,
                activeProfile.customSearchUrl
              );
              onNavigate(target);
              onClose();
            }}
            className="w-full min-h-[48px] p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Globe className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-blue-600 dark:text-sky-400 truncate">
                  {input.trim()}
                </div>
                <div className="text-[11px] text-slate-500 truncate font-mono">
                  {resolveInputToUrl(
                    input,
                    activeProfile.searchEngine,
                    activeProfile.customSearchUrl
                  )}
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-blue-500 shrink-0" />
          </button>
        )}

        {/* Matching Open Tabs */}
        {matchingTabs.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              Switch to Open Tab ({activeProfile.name})
            </div>
            {matchingTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSwitchToTab(t.id);
                  onClose();
                }}
                className="w-full min-h-[46px] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {t.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">{t.url}</div>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-sky-400 shrink-0">
                  Switch to tab
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Autocomplete Search Suggestions */}
        {remoteSuggestions.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              Search Suggestions ({activeEngine.name})
            </div>
            {remoteSuggestions.map((sug, i) => (
              <button
                key={`${sug}-${i}`}
                onClick={() => {
                  const target = resolveInputToUrl(
                    sug,
                    activeProfile.searchEngine,
                    activeProfile.customSearchUrl
                  );
                  onNavigate(target);
                  onClose();
                }}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3 text-left text-xs text-slate-800 dark:text-slate-200"
              >
                <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{sug}</span>
              </button>
            ))}
          </div>
        )}

        {/* Matching Bookmarks */}
        {matchingBookmarks.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              Bookmarks ({activeProfile.name})
            </div>
            {matchingBookmarks.map((bm) => (
              <button
                key={bm.id}
                onClick={() => {
                  onNavigate(bm.url);
                  onClose();
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3 text-left"
              >
                <Bookmark className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {bm.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">{bm.url}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent History Suggestions */}
        {matchingHistory.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 px-1">
              Browsing History ({activeProfile.name})
            </div>
            {matchingHistory.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  onNavigate(h.url);
                  onClose();
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3 text-left"
              >
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {h.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">{h.url}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. Three-Dot Browser Menu Sheet
// ============================================================================
export const ThreeDotMenuSheet: React.FC<{
  activeProfile: BrowserProfile;
  activeTab: BrowserTab;
  isBookmarked: boolean;
  isSpeakingTts: boolean;
  onClose: () => void;
  onNewTab: (isPrivate: boolean) => void;
  onOpenScreen: (screen: ActiveScreen) => void;
  onToggleBookmarkCurrent: () => void;
  onToggleDesktopSite: () => void;
  onToggleReaderMode: () => void;
  onOpenFindInPage: () => void;
  onOpenTranslate: () => void;
  onToggleTts: () => void;
  onTogglePip: () => void;
  onShareOrCopyUrl: () => void;
}> = ({
  activeProfile,
  activeTab,
  isBookmarked,
  isSpeakingTts,
  onClose,
  onNewTab,
  onOpenScreen,
  onToggleBookmarkCurrent,
  onToggleDesktopSite,
  onToggleReaderMode,
  onOpenFindInPage,
  onOpenTranslate,
  onToggleTts,
  onTogglePip,
  onShareOrCopyUrl,
}) => {
  const menuAct = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-end bg-black/50 backdrop-blur-xs sm:p-4">
      <div className="w-full sm:w-80 rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 p-4 shadow-2xl max-h-[85dvh] overflow-y-auto space-y-3">
        {/* Profile Header Row */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => menuAct(() => onOpenScreen('profile-switcher'))}
            className="flex items-center gap-2.5 text-left"
          >
            <ProfileAvatar
              avatarId={activeProfile.avatarId}
              customAvatarUrl={activeProfile.customAvatarUrl}
              color={activeProfile.color}
              name={activeProfile.name}
              size="sm"
              isPrivate={activeTab.isPrivate}
            />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {activeTab.isPrivate ? 'Private Browsing' : activeProfile.name}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-sky-400">
                Tap to switch profile
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Group 1: Tabs & Profiles */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => menuAct(() => onNewTab(false))}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4 text-blue-500" />
            <span>New Tab</span>
          </button>
          <button
            onClick={() => menuAct(() => onNewTab(true))}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2"
          >
            <Shield className="h-4 w-4 text-sky-400" />
            <span>Private Tab</span>
          </button>
          <button
            onClick={() => menuAct(() => onOpenScreen('profile-switcher'))}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2"
          >
            <Users className="h-4 w-4 text-emerald-500" />
            <span>Switch Profile</span>
          </button>
          <button
            onClick={() => menuAct(() => onOpenScreen('create-profile'))}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4 text-violet-500" />
            <span>New Profile</span>
          </button>
        </div>

        {/* Group 2: Library */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button
            onClick={() => menuAct(() => onOpenScreen('bookmarks'))}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span>Bookmarks</span>
            </span>
            <span className="text-[11px] text-slate-400">{activeProfile.name}</span>
          </button>

          <button
            onClick={() => menuAct(() => onOpenScreen('history'))}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Browsing History</span>
            </span>
            <span className="text-[11px] text-slate-400">{activeProfile.name}</span>
          </button>

          <button
            onClick={() => menuAct(() => onOpenScreen('downloads'))}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Download className="h-4 w-4 text-emerald-500" />
              <span>Downloads</span>
            </span>
          </button>
        </div>

        {/* Group 3: Contextual Webpage Tools */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button
            onClick={() => menuAct(onToggleBookmarkCurrent)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Bookmark
                className={`h-4 w-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
              />
              <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark Current Page'}</span>
            </span>
          </button>

          <button
            onClick={() => menuAct(onOpenFindInPage)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span>Find in Page</span>
          </button>

          <button
            onClick={() => menuAct(onOpenTranslate)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <Languages className="h-4 w-4 text-slate-400" />
            <span>Translate Page</span>
          </button>

          <button
            onClick={() => menuAct(onToggleReaderMode)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Reader Mode</span>
            </span>
            {activeTab.readerMode && (
              <span className="text-[11px] font-semibold text-blue-500">ON</span>
            )}
          </button>

          <button
            onClick={() => menuAct(onToggleTts)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              {isSpeakingTts ? (
                <VolumeX className="h-4 w-4 text-rose-500" />
              ) : (
                <Volume2 className="h-4 w-4 text-slate-400" />
              )}
              <span>{isSpeakingTts ? 'Stop Reading Aloud' : 'Listen to Page (TTS)'}</span>
            </span>
          </button>

          <button
            onClick={() => menuAct(onToggleDesktopSite)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <Monitor className="h-4 w-4 text-slate-400" />
              <span>Desktop Site</span>
            </span>
            <input
              type="checkbox"
              readOnly
              checked={activeTab.desktopMode}
              className="h-4 w-4 accent-blue-600 pointer-events-none"
            />
          </button>

          <button
            onClick={() => menuAct(onTogglePip)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <PictureInPicture2 className="h-4 w-4 text-slate-400" />
            <span>Picture-in-Picture Player</span>
          </button>

          <button
            onClick={() => menuAct(onShareOrCopyUrl)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <Share2 className="h-4 w-4 text-slate-400" />
            <span>Share / Copy Page URL</span>
          </button>
        </div>

        {/* Group 4: Settings & Help */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <button
            onClick={() => menuAct(() => onOpenScreen('settings'))}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Browser Settings</span>
          </button>

          <button
            onClick={() => menuAct(() => onOpenScreen('about-architecture'))}
            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-2.5"
          >
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span>About &amp; Android APK Blueprint</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. Security & Cookie Lock Popover
// ============================================================================
export const SecurityLockPopover: React.FC<{
  url: string;
  activeProfile: BrowserProfile;
  isPrivate: boolean;
  onClose: () => void;
  onOpenPermissions: () => void;
  onNavigateDiagnostics: () => void;
}> = ({ url, activeProfile, isPrivate, onClose, onOpenPermissions, onNavigateDiagnostics }) => {
  const [cookies, setCookies] = useState<StoredCookieItem[]>([]);
  const { host, isSecure, protocolLabel } = formatDomainDisplay(url);

  useEffect(() => {
    fetch(
      `/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies?isPrivate=${isPrivate}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.cookies)) {
          setCookies(d.cookies);
        }
      })
      .catch(() => {});
  }, [activeProfile.id, isPrivate]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                isSecure
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-amber-500/15 text-amber-500'
              }`}
            >
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {isSecure ? 'Connection is Secure' : 'Standard Connection'} ({protocolLabel})
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">
                {host}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Isolated Profile Partition:</span>
            <strong className="font-semibold text-slate-900 dark:text-white">
              {isPrivate ? 'Private RAM' : activeProfile.name}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Cookies in Profile Jar:</span>
            <span className="font-mono font-semibold text-blue-600 dark:text-sky-400 tabular-nums">
              {cookies.length} cookies
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onOpenPermissions();
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Site Permissions
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateDiagnostics();
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
          >
            Inspect Cookie Jar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. QR Code Camera Scanner & URL Decoder Modal
// ============================================================================
export const QrScannerModal: React.FC<{
  onClose: () => void;
  onScanUrl: (url: string) => void;
}> = ({ onClose, onScanUrl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setCameraError('Camera stream unavailable in sandboxed preview. Use instant QR test targets below:');
        });
    } else {
      setCameraError('Camera hardware not detected. Use instant QR test targets below:');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const qrTargets = [
    { label: 'Session & Cookie Isolation Lab', url: 'uv://auth-lab' },
    { label: 'Wikipedia Mobile Portal', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
    { label: 'HTTPBin Live Cookie Echo', url: 'https://httpbin.org/cookies' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-bold">Scan QR Code to Open URL</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative h-48 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="p-4 text-center space-y-2">
              <Camera className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">{cameraError || 'Initializing camera...'}</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-6 border-2 border-sky-400/50 rounded-2xl" />
        </div>

        {/* Simulated QR Code Targets for 1-Tap Testing */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400">
            Simulated QR Code Payloads (Tap to Decode &amp; Open):
          </div>
          <div className="space-y-1.5">
            {qrTargets.map((t) => (
              <button
                key={t.url}
                onClick={() => {
                  onScanUrl(t.url);
                  onClose();
                }}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between text-xs"
              >
                <span className="font-medium text-white">{t.label}</span>
                <span className="font-mono text-[11px] text-sky-400">{t.url}</span>
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualUrl.trim()) {
              onScanUrl(manualUrl.trim());
              onClose();
            }
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Or paste decoded QR URL..."
            className="flex-1 min-h-[40px] rounded-xl bg-slate-950 border border-slate-800 px-3 text-xs font-mono text-white"
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 rounded-xl bg-blue-600 text-xs font-semibold text-white"
          >
            Open
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 6. Reader Mode & Page Translation Drawer
// ============================================================================
export const ReaderAndTranslateView: React.FC<{
  article: ReaderArticle;
  isSpeaking: boolean;
  onClose: () => void;
  onToggleSpeak: () => void;
}> = ({ article, isSpeaking, onClose, onToggleSpeak }) => {
  const [paperTheme, setPaperTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontScale, setFontScale] = useState(100);
  const [targetLang, setTargetLang] = useState('es');
  const [translating, setTranslating] = useState(false);
  const [translatedArticle, setTranslatedArticle] = useState<{
    lang: string;
    title: string;
    blocks: Array<{ tag: string; text: string }>;
  } | null>(null);

  const handleTranslate = async (lang: string) => {
    setTargetLang(lang);
    setTranslating(true);
    try {
      const resp = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          blocks: article.blocks,
          targetLang: lang,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setTranslatedArticle({
          lang: data.targetLanguage,
          title: data.translatedTitle,
          blocks: data.translatedBlocks || [],
        });
      }
    } catch {
      // ignore
    } finally {
      setTranslating(false);
    }
  };

  const paperClasses = {
    dark: 'bg-slate-950 text-slate-100',
    sepia: 'bg-amber-50 text-stone-900',
    light: 'bg-white text-slate-900',
  }[paperTheme];

  const activeBlocks = translatedArticle ? translatedArticle.blocks : article.blocks;
  const activeTitle = translatedArticle ? translatedArticle.title : article.title;

  return (
    <div className={`min-h-full ${paperClasses} p-4 sm:p-8 pb-24 transition-colors`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Reader Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-500/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold">Reader &amp; Translation View</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TTS Button */}
            <button
              onClick={onToggleSpeak}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
            </button>

            {/* Language Translate Picker */}
            <select
              value={targetLang}
              onChange={(e) => handleTranslate(e.target.value)}
              aria-label="Translate language"
              className="min-h-[36px] rounded-xl border border-slate-500/30 bg-transparent px-2.5 text-xs font-medium"
            >
              <option value="es">Translate: Spanish</option>
              <option value="fr">Translate: French</option>
              <option value="de">Translate: German</option>
              <option value="ja">Translate: Japanese</option>
              <option value="hi">Translate: Hindi</option>
              <option value="zh">Translate: Chinese</option>
            </select>

            <button
              onClick={() => handleTranslate(targetLang)}
              disabled={translating}
              className="min-h-[36px] px-3 py-1 rounded-xl border border-slate-500/30 text-xs font-medium flex items-center gap-1"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{translating ? 'Translating...' : 'Translate Now'}</span>
            </button>

            {translatedArticle && (
              <button
                onClick={() => setTranslatedArticle(null)}
                className="text-xs text-blue-500 underline"
              >
                Show Original
              </button>
            )}

            {/* Theme Pills */}
            <div className="flex items-center gap-1 border border-slate-500/30 rounded-xl p-0.5">
              {(['light', 'sepia', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPaperTheme(t)}
                  className={`px-2 py-1 rounded-lg text-[11px] capitalize ${
                    paperTheme === t ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-500/20 text-xs font-semibold"
            >
              Exit Reader
            </button>
          </div>
        </div>

        {/* Article Content */}
        <article
          className="space-y-4 leading-relaxed"
          style={{ fontSize: `${fontScale}%` }}
        >
          <div className="text-xs font-mono opacity-60">{article.url}</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            {activeTitle}
          </h1>
          <div className="space-y-4 pt-2">
            {activeBlocks.map((b, idx) =>
              b.tag === 'h1' || b.tag === 'h2' || b.tag === 'h3' ? (
                <h2 key={idx} className="text-lg font-bold pt-2">
                  {b.text}
                </h2>
              ) : (
                <p key={idx} className="text-base leading-relaxed opacity-90">
                  {b.text}
                </p>
              )
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
