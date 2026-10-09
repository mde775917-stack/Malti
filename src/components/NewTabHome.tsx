import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Clock,
  Compass,
  ExternalLink,
  Globe,
  Mic,
  Plus,
  QrCode,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  BookmarkItem,
  BrowserProfile,
  HistoryEntry,
  SearchEngineId,
  ShortcutItem,
} from '../types/browser';
import {
  DISCOVERY_FEED_ITEMS,
   formatDomainDisplay,
  PROFILE_COLORS,
  SEARCH_ENGINES,
  WALLPAPER_PRESETS,
} from '../data/defaults';
import { ProfileAvatar } from './ProfileAvatar';

interface NewTabHomeProps {
  activeProfile: BrowserProfile;
  isPrivate: boolean;
  privateTabCount: number;
  shortcuts: ShortcutItem[];
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  onNavigate: (urlOrQuery: string) => void;
  onOpenOmnibox: () => void;
  onOpenVoiceSearch: () => void;
  onOpenQrScanner: () => void;
  onChangeSearchEngine: (engine: SearchEngineId) => void;
  onAddShortcut: (title: string, url: string) => void;
  onDeleteShortcut: (id: string) => void;
  onCloseAllPrivateTabs: () => void;
  onOpenHomepageSettings: () => void;
  onOpenProfileSwitcher: () => void;
}

export const NewTabHome: React.FC<NewTabHomeProps> = ({
  activeProfile,
  isPrivate,
  privateTabCount,
  shortcuts,
  bookmarks,
  history,
  onNavigate,
  onOpenOmnibox,
  onOpenVoiceSearch,
  onOpenQrScanner,
  onChangeSearchEngine,
  onAddShortcut,
  onDeleteShortcut,
  onCloseAllPrivateTabs,
  onOpenHomepageSettings,
  onOpenProfileSwitcher,
}) => {
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('https://');
  const [showEnginePicker, setShowEnginePicker] = useState(false);

  const profileShortcuts = useMemo(
    () => shortcuts.filter((s) => s.profileId === activeProfile.id),
    [shortcuts, activeProfile.id]
  );

  const profileBookmarks = useMemo(
    () => bookmarks.filter((b) => b.profileId === activeProfile.id).slice(0, 6),
    [bookmarks, activeProfile.id]
  );

  const profileHistory = useMemo(
    () => history.filter((h) => h.profileId === activeProfile.id),
    [history, activeProfile.id]
  );

  // Compute frequently visited domains for this profile
  const frequentSites = useMemo(() => {
    const counts = new Map<string, { url: string; title: string; count: number }>();
    for (const h of profileHistory) {
      const { host } = formatDomainDisplay(h.url);
      const existing = counts.get(host);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(host, { url: h.url, title: h.title || host, count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [profileHistory]);

  const recentPages = useMemo(() => profileHistory.slice(0, 4), [profileHistory]);

  const activeEngine = SEARCH_ENGINES[activeProfile.searchEngine] || SEARCH_ENGINES.duckduckgo;
  const palette = PROFILE_COLORS[activeProfile.color] || PROFILE_COLORS.blue;

  // Private Browsing New Tab Interface
  if (isPrivate) {
    return (
      <div className="min-h-full bg-slate-950 text-slate-100 px-4 py-6 sm:px-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-sky-400">
                    Isolated Ephemeral RAM Session
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Private Browsing Mode
                  </h1>
                </div>
              </div>
              <button
                onClick={onCloseAllPrivateTabs}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-colors whitespace-nowrap shrink-0"
              >
                Close Private Tabs ({privateTabCount})
              </button>
            </div>

            {/* Private Search Trigger */}
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-950 border border-slate-800 px-3.5 py-2.5">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <button
                onClick={onOpenOmnibox}
                className="flex-1 text-left text-sm text-slate-400 py-1 truncate"
              >
                Search privately with {activeEngine.name} or enter address...
              </button>
              <button
                onClick={onOpenVoiceSearch}
                title="Voice search"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={onOpenQrScanner}
                title="Scan QR code"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>

            {/* Transparency Notice */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 border-t border-slate-800/80 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <div className="font-semibold text-emerald-400">
                  Unlimited Virtual will NOT save:
                </div>
                <ul className="space-y-1 text-slate-300 list-disc pl-4">
                  <li>Your browsing history or search queries</li>
                  <li>Session cookies and site data after private tabs close</li>
                  <li>Information entered in forms or local storage</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-amber-400">
                  Activity may still be visible to:
                </div>
                <ul className="space-y-1 text-slate-400 list-disc pl-4">
                  <li>Websites you visit and services they use</li>
                  <li>Your employer, school, or network administrator</li>
                  <li>Your internet service provider (ISP)</li>
                </ul>
              </div>
            </div>

            {/* Quick Verification Action */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Verify that Private Mode cookies do not touch <strong>{activeProfile.name}</strong>:
              </span>
              <button
                onClick={() => onNavigate('uv://auth-lab')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Open Session Isolation Lab</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Profile Homepage
  const preset =
    activeProfile.wallpaper !== 'custom'
      ? WALLPAPER_PRESETS[activeProfile.wallpaper] || WALLPAPER_PRESETS['nordic-frost']
      : null;

  const handleCreateShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    onAddShortcut(newTitle.trim(), newUrl.trim());
    setNewTitle('');
    setNewUrl('https://');
    setShowAddShortcut(false);
  };

  return (
    <div
      className={`min-h-full relative px-4 py-6 sm:px-6 pb-24 transition-colors ${
        preset ? `${preset.lightClass} dark:${preset.darkClass}` : 'bg-slate-50 dark:bg-slate-950'
      }`}
      style={
        activeProfile.wallpaper === 'custom' && activeProfile.customWallpaperUrl
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.92)), url(${activeProfile.customWallpaperUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="max-w-2xl mx-auto space-y-7">
        {/* Profile Header & Customize Trigger */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={onOpenProfileSwitcher}
            className="flex items-center gap-3 text-left group rounded-2xl p-1.5 -ml-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
          >
            <ProfileAvatar
              avatarId={activeProfile.avatarId}
              customAvatarUrl={activeProfile.customAvatarUrl}
              color={activeProfile.color}
              name={activeProfile.name}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeProfile.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  · {activeProfile.roleLabel}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Isolated Storage: app_webview_{activeProfile.id}
              </div>
            </div>
          </button>

          <button
            onClick={onOpenHomepageSettings}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Customize</span>
          </button>
        </div>

        {/* Center Hero Search & Omnibox Trigger */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 shadow-sm">
            {/* Search Engine Pill Button */}
            <div className="relative">
              <button
                onClick={() => setShowEnginePicker((v) => !v)}
                className={`min-h-[42px] px-3 rounded-xl ${palette.softBg} ${palette.text} text-xs font-bold flex items-center gap-1.5 transition-colors`}
                title="Switch default search engine"
              >
                <span>{activeEngine.badge}</span>
              </button>

              {showEnginePicker && (
                <div className="absolute left-0 top-12 z-30 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 shadow-xl">
                  {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((engKey) => {
                    const eng = SEARCH_ENGINES[engKey];
                    const active = eng.id === activeProfile.searchEngine;
                    return (
                      <button
                        key={eng.id}
                        onClick={() => {
                          onChangeSearchEngine(eng.id);
                          setShowEnginePicker(false);
                        }}
                        className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{eng.name}</span>
                        <span className="font-mono text-[10px] opacity-75">{eng.badge}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={onOpenOmnibox}
              className="flex-1 min-h-[42px] text-left px-2 text-sm text-slate-500 dark:text-slate-400 truncate"
            >
              Search {activeEngine.name} or type URL...
            </button>

            <button
              onClick={onOpenVoiceSearch}
              title="Voice search"
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={onOpenQrScanner}
              title="Scan QR code"
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Custom Website Shortcuts Grid */}
        {activeProfile.showShortcuts && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Speed Dial · {activeProfile.name} Shortcuts
              </h2>
              <button
                onClick={() => setShowAddShortcut((v) => !v)}
                className="text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Shortcut</span>
              </button>
            </div>

            {showAddShortcut && (
              <form
                onSubmit={handleCreateShortcut}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    New Shortcut for {activeProfile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddShortcut(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Title (e.g. GitHub)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  Save Shortcut
                </button>
              </form>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {profileShortcuts.map((sc) => {
                const { host, isInternal } = formatDomainDisplay(sc.url);
                const initial = sc.title.trim().charAt(0).toUpperCase() || 'W';
                return (
                  <div
                    key={sc.id}
                    className="group relative rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/90 p-3 flex flex-col items-center text-center hover:border-blue-500/40 transition-colors"
                  >
                    <button
                      onClick={() => onDeleteShortcut(sc.id)}
                      title="Remove shortcut"
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-1.5 right-1.5 h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onNavigate(sc.url)}
                      className="w-full flex flex-col items-center gap-2 focus:outline-none"
                    >
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-bold ${
                          isInternal
                            ? `${palette.softBg} ${palette.text}`
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="w-full">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {sc.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {host.replace('uv://', '')}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Frequently Visited & Pinned Bookmarks Split */}
        {(activeProfile.showFrequent || activeProfile.showBookmarksOnHome) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeProfile.showFrequent && (
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>Frequently &amp; Recently Visited</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {recentPages.length} recent
                  </span>
                </div>
                {frequentSites.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No browsing history recorded for {activeProfile.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {frequentSites.map((site, idx) => (
                      <button
                        key={`${site.url}-${idx}`}
                        onClick={() => onNavigate(site.url)}
                        className="w-full min-h-[44px] py-2 flex items-center justify-between gap-2 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {site.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {site.url}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                          {site.count}×
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeProfile.showBookmarksOnHome && (
              <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                    <span>Profile Bookmarks</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {profileBookmarks.length} saved
                  </span>
                </div>
                {profileBookmarks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">
                    No bookmarks saved in {activeProfile.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {profileBookmarks.slice(0, 4).map((bm) => (
                      <button
                        key={bm.id}
                        onClick={() => onNavigate(bm.url)}
                        className="w-full min-h-[44px] py-2 flex items-center justify-between gap-2 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {bm.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {bm.folder} · <span className="font-mono">{bm.url}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional Discovery Feed */}
        {activeProfile.showDiscoveryFeed && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-blue-500" />
                <span>Discovery &amp; Architecture Briefings</span>
              </h2>
            </div>

            <div className="space-y-2.5">
              {DISCOVERY_FEED_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.url)}
                  className="w-full text-left rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-4 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{item.source}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.readTime}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
