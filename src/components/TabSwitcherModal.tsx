import React, { useMemo, useState } from 'react';
import {
  BatteryCharging,
  Copy,
  FolderKanban,
  Globe,
  PauseCircle,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import {
  BrowserProfile,
  BrowserTab,
  ClosedTabEntry,
  TabCategory,
} from '../types/browser';
import { formatDomainDisplay, PROFILE_COLORS } from '../data/defaults';
import { ProfileAvatar } from './ProfileAvatar';

interface TabSwitcherModalProps {
  activeProfile: BrowserProfile;
  isPrivateMode: boolean;
  tabs: BrowserTab[];
  activeTabId: string;
  closedTabs: ClosedTabEntry[];
  onClose: () => void;
  onSelectTab: (tabId: string, isPrivate: boolean) => void;
  onNewTab: (isPrivate: boolean) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllTabs: (isPrivate: boolean) => void;
  onDuplicateTab: (tabId: string) => void;
  onToggleSuspendTab: (tabId: string) => void;
  onSuspendAllInactive: () => void;
  onChangeTabCategory: (tabId: string, category: TabCategory) => void;
  onReopenClosedTab: (closedId: string) => void;
  onSwitchMode: (isPrivate: boolean) => void;
}

const CATEGORIES: Array<'All' | TabCategory> = [
  'All',
  'General',
  'Work',
  'Research',
  'Reading',
  'Media',
];

export const TabSwitcherModal: React.FC<TabSwitcherModalProps> = ({
  activeProfile,
  isPrivateMode,
  tabs,
  activeTabId,
  closedTabs,
  onClose,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onCloseAllTabs,
  onDuplicateTab,
  onToggleSuspendTab,
  onSuspendAllInactive,
  onChangeTabCategory,
  onReopenClosedTab,
  onSwitchMode,
}) => {
  const [viewingPrivate, setViewingPrivate] = useState(isPrivateMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | TabCategory>('All');
  const [showClosedDrawer, setShowClosedDrawer] = useState(false);

  const regularTabs = useMemo(
    () => tabs.filter((t) => !t.isPrivate && t.profileId === activeProfile.id),
    [tabs, activeProfile.id]
  );

  const privateTabs = useMemo(
    () => tabs.filter((t) => t.isPrivate && t.profileId === activeProfile.id),
    [tabs, activeProfile.id]
  );

  const visibleTabs = useMemo(() => {
    const base = viewingPrivate ? privateTabs : regularTabs;
    return base.filter((t) => {
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.url.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [viewingPrivate, privateTabs, regularTabs, selectedCategory, searchQuery]);

  const profileClosedTabs = useMemo(
    () => closedTabs.filter((c) => c.profileId === activeProfile.id),
    [closedTabs, activeProfile.id]
  );

  const palette = PROFILE_COLORS[activeProfile.color] || PROFILE_COLORS.blue;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            avatarId={activeProfile.avatarId}
            customAvatarUrl={activeProfile.customAvatarUrl}
            color={activeProfile.color}
            name={activeProfile.name}
            size="sm"
            isPrivate={viewingPrivate}
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {viewingPrivate ? 'Private Tabs' : `${activeProfile.name} Tabs`}
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {viewingPrivate
                ? `${privateTabs.length} ephemeral tabs`
                : `${regularTabs.length} isolated profile tabs`}
            </div>
          </div>
        </div>

        {/* Regular vs Private Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            onClick={() => {
              setViewingPrivate(false);
              onSwitchMode(false);
            }}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              !viewingPrivate
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Regular ({regularTabs.length})
          </button>
          <button
            onClick={() => {
              setViewingPrivate(true);
              onSwitchMode(true);
            }}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewingPrivate
                ? 'bg-slate-900 text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Private ({privateTabs.length})</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Search & Category Filter Strip */}
      <div className="px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search open tabs by title or URL..."
            className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? `${palette.bg} text-white`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {visibleTabs.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <Globe className="h-8 w-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {viewingPrivate ? 'No Open Private Tabs' : 'No Matching Open Tabs'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {viewingPrivate
                  ? 'Open a private tab to browse without saving history or persistent cookies.'
                  : 'Open a new tab or clear your search filter to view your profile tabs.'}
              </p>
              <button
                onClick={() => {
                  onNewTab(viewingPrivate);
                  onClose();
                }}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                <span>{viewingPrivate ? 'New Private Tab' : 'New Tab'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                const { host, protocolLabel } = formatDomainDisplay(tab.url);
                return (
                  <div
                    key={tab.id}
                    className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition-all ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-white dark:bg-slate-900'
                        : 'border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          onSelectTab(tab.id, tab.isPrivate);
                          onClose();
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            tab.isPrivate
                              ? 'bg-slate-800 text-sky-400'
                              : `${palette.softBg} ${palette.text}`
                          }`}
                        >
                          {host.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {tab.title || host}
                        </span>
                      </button>

                      <button
                        onClick={() => onCloseTab(tab.id)}
                        title="Close tab"
                        className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Card Preview Body */}
                    <button
                      onClick={() => {
                        onSelectTab(tab.id, tab.isPrivate);
                        onClose();
                      }}
                      className="p-4 text-left flex-1 flex flex-col justify-between bg-slate-50/60 dark:bg-slate-950/50 hover:bg-slate-100/60 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {protocolLabel} · {host}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2">
                          {tab.title}
                        </div>
                        <div className="text-xs font-mono text-slate-500 truncate">{tab.url}</div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Group: <strong className="font-medium text-slate-700 dark:text-slate-300">{tab.category}</strong>
                        </span>
                        {tab.isSuspended && (
                          <span className="text-amber-500 flex items-center gap-1 font-medium">
                            <PauseCircle className="h-3 w-3" /> Hibernated
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Card Footer Controls */}
                    <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
                      <select
                        value={tab.category}
                        onChange={(e) =>
                          onChangeTabCategory(tab.id, e.target.value as TabCategory)
                        }
                        aria-label="Tab category"
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300"
                      >
                        <option value="General">General</option>
                        <option value="Work">Work</option>
                        <option value="Research">Research</option>
                        <option value="Reading">Reading</option>
                        <option value="Media">Media</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleSuspendTab(tab.id)}
                          title={tab.isSuspended ? 'Wake tab' : 'Suspend tab to save memory'}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 ${
                            tab.isSuspended
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <BatteryCharging className="h-3.5 w-3.5" />
                          <span>{tab.isSuspended ? 'Wake' : 'Save RAM'}</span>
                        </button>
                        <button
                          onClick={() => onDuplicateTab(tab.id)}
                          title="Duplicate tab"
                          className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Clone</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently Closed Tabs Drawer */}
          {showClosedDrawer && !viewingPrivate && (
            <div className="mt-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                  <span>Recently Closed Tabs ({profileClosedTabs.length})</span>
                </h3>
                <button
                  onClick={() => setShowClosedDrawer(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Hide
                </button>
              </div>
              {profileClosedTabs.length === 0 ? (
                <p className="text-xs text-slate-400">No recently closed tabs in this profile.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profileClosedTabs.map((ct) => (
                    <div
                      key={ct.id}
                      className="py-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {ct.title}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {ct.url}
                        </div>
                      </div>
                      <button
                        onClick={() => onReopenClosedTab(ct.id)}
                        className="min-h-[36px] px-3 py-1 rounded-xl bg-blue-600/10 text-blue-600 dark:text-sky-400 font-semibold shrink-0 hover:bg-blue-600/20"
                      >
                        Reopen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onNewTab(viewingPrivate);
              onClose();
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{viewingPrivate ? 'New Private Tab' : 'New Tab'}</span>
          </button>

          {!viewingPrivate && (
            <button
              onClick={() => setShowClosedDrawer((v) => !v)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Recently Closed ({profileClosedTabs.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!viewingPrivate && regularTabs.length > 1 && (
            <button
              onClick={onSuspendAllInactive}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BatteryCharging className="h-3.5 w-3.5 text-emerald-500" />
              <span>Hibernate Background</span>
            </button>
          )}

          {visibleTabs.length > 0 && (
            <button
              onClick={() => onCloseAllTabs(viewingPrivate)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Close All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
