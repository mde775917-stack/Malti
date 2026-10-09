import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileDown,
  FolderPlus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BookmarkItem,
  BrowserProfile,
  ClosedTabEntry,
  DownloadItem,
  HistoryEntry,
} from '../types/browser';
import { ProfileAvatar } from './ProfileAvatar';

interface LibraryModalsProps {
  screen: 'bookmarks' | 'history' | 'downloads';
  activeProfile: BrowserProfile;
  currentTabTitle: string;
  currentTabUrl: string;
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  closedTabs: ClosedTabEntry[];
  downloads: DownloadItem[];
  onClose: () => void;
  onNavigateToUrl: (url: string) => void;
  onAddBookmark: (title: string, url: string, folder: string) => void;
  onUpdateBookmark: (id: string, title: string, url: string, folder: string) => void;
  onDeleteBookmark: (id: string) => void;
  onImportBookmarks: (items: Array<{ title: string; url: string; folder?: string }>) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistoryRange: (range: 'hour' | 'day' | 'week' | 'all') => void;
  onReopenClosedTab: (id: string) => void;
  onTriggerDownload: (title: string, url: string, format: 'html' | 'markdown' | 'json') => void;
  onTogglePauseDownload: (id: string) => void;
  onDeleteDownload: (id: string) => void;
}

export const LibraryModals: React.FC<LibraryModalsProps> = ({
  screen,
  activeProfile,
  currentTabTitle,
  currentTabUrl,
  bookmarks,
  history,
  closedTabs,
  downloads,
  onClose,
  onNavigateToUrl,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onImportBookmarks,
  onDeleteHistoryItem,
  onClearHistoryRange,
  onReopenClosedTab,
  onTriggerDownload,
  onTogglePauseDownload,
  onDeleteDownload,
}) => {
  if (screen === 'bookmarks') {
    return (
      <BookmarksView
        activeProfile={activeProfile}
        currentTabTitle={currentTabTitle}
        currentTabUrl={currentTabUrl}
        bookmarks={bookmarks}
        onClose={onClose}
        onNavigateToUrl={onNavigateToUrl}
        onAddBookmark={onAddBookmark}
        onUpdateBookmark={onUpdateBookmark}
        onDeleteBookmark={onDeleteBookmark}
        onImportBookmarks={onImportBookmarks}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryView
        activeProfile={activeProfile}
        history={history}
        closedTabs={closedTabs}
        onClose={onClose}
        onNavigateToUrl={onNavigateToUrl}
        onDeleteHistoryItem={onDeleteHistoryItem}
        onClearHistoryRange={onClearHistoryRange}
        onReopenClosedTab={onReopenClosedTab}
      />
    );
  }

  return (
    <DownloadsView
      activeProfile={activeProfile}
      currentTabTitle={currentTabTitle}
      currentTabUrl={currentTabUrl}
      downloads={downloads}
      onClose={onClose}
      onTriggerDownload={onTriggerDownload}
      onTogglePauseDownload={onTogglePauseDownload}
      onDeleteDownload={onDeleteDownload}
    />
  );
};

// ============================================================================
// 1. Bookmarks Manager Screen (Profile-Scoped)
// ============================================================================
const BookmarksView: React.FC<{
  activeProfile: BrowserProfile;
  currentTabTitle: string;
  currentTabUrl: string;
  bookmarks: BookmarkItem[];
  onClose: () => void;
  onNavigateToUrl: (url: string) => void;
  onAddBookmark: (title: string, url: string, folder: string) => void;
  onUpdateBookmark: (id: string, title: string, url: string, folder: string) => void;
  onDeleteBookmark: (id: string) => void;
  onImportBookmarks: (items: Array<{ title: string; url: string; folder?: string }>) => void;
}> = ({
  activeProfile,
  currentTabTitle,
  currentTabUrl,
  bookmarks,
  onClose,
  onNavigateToUrl,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onImportBookmarks,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [editingItem, setEditingItem] = useState<BookmarkItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [titleInput, setTitleInput] = useState(currentTabTitle || 'Saved Page');
  const [urlInput, setUrlInput] = useState(currentTabUrl || 'https://');
  const [folderInput, setFolderInput] = useState('Toolbar');

  const profileBookmarks = useMemo(
    () => bookmarks.filter((b) => b.profileId === activeProfile.id),
    [bookmarks, activeProfile.id]
  );

  const folders = useMemo(() => {
    const set = new Set<string>(['All', 'Toolbar', 'Reading List', 'Work', 'Reference']);
    profileBookmarks.forEach((b) => {
      if (b.folder) set.add(b.folder);
    });
    return Array.from(set);
  }, [profileBookmarks]);

  const filteredBookmarks = useMemo(() => {
    return profileBookmarks.filter((b) => {
      const folderMatch = selectedFolder === 'All' || b.folder === selectedFolder;
      const q = search.trim().toLowerCase();
      const queryMatch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.folder.toLowerCase().includes(q);
      return folderMatch && queryMatch;
    });
  }, [profileBookmarks, selectedFolder, search]);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) return;
    if (editingItem) {
      onUpdateBookmark(editingItem.id, titleInput.trim(), urlInput.trim(), folderInput.trim() || 'Toolbar');
      setEditingItem(null);
    } else {
      onAddBookmark(titleInput.trim(), urlInput.trim(), folderInput.trim() || 'Toolbar');
      setShowAddForm(false);
    }
  };

  const handleExportBookmarks = () => {
    const data = JSON.stringify(profileBookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uv-bookmarks-${activeProfile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          onImportBookmarks(parsed);
        }
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeProfile.name} Bookmarks
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {profileBookmarks.length} saved bookmarks in isolated profile storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(null);
                setTitleInput(currentTabTitle || 'Current Page');
                setUrlInput(currentTabUrl || 'https://');
                setFolderInput('Toolbar');
                setShowAddForm(true);
              }}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Bookmark Page</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search & Folder Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookmarks in this profile..."
                className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleExportBookmarks}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <label className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <Upload className="h-3.5 w-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedFolder === folder
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>

        {/* Add / Edit Form */}
        {(showAddForm || editingItem) && (
          <form
            onSubmit={handleSaveForm}
            className="p-4 border-b border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-800/60 space-y-3"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {editingItem ? 'Edit Bookmark' : `Save Bookmark to ${activeProfile.name}`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Bookmark title"
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white"
                required
              />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-mono text-slate-900 dark:text-white"
                required
              />
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Folder (e.g. Toolbar, Work)"
                className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Save Bookmark
              </button>
            </div>
          </form>
        )}

        {/* Bookmark List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredBookmarks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No bookmarks found in this folder for {activeProfile.name}.
            </div>
          ) : (
            filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <button
                  onClick={() => {
                    onNavigateToUrl(bm.url);
                    onClose();
                  }}
                  className="min-w-0 flex-1 text-left hover:opacity-80"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {bm.title}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    <span>{bm.folder}</span> · <span className="font-mono">{bm.url}</span>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(bm);
                      setTitleInput(bm.title);
                      setUrlInput(bm.url);
                      setFolderInput(bm.folder);
                      setShowAddForm(false);
                    }}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBookmark(bm.id)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Browsing History Screen (Profile-Scoped + Time Range Cleaner)
// ============================================================================
const HistoryView: React.FC<{
  activeProfile: BrowserProfile;
  history: HistoryEntry[];
  closedTabs: ClosedTabEntry[];
  onClose: () => void;
  onNavigateToUrl: (url: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistoryRange: (range: 'hour' | 'day' | 'week' | 'all') => void;
  onReopenClosedTab: (id: string) => void;
}> = ({
  activeProfile,
  history,
  closedTabs,
  onClose,
  onNavigateToUrl,
  onDeleteHistoryItem,
  onClearHistoryRange,
  onReopenClosedTab,
}) => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [clearRange, setClearRange] = useState<'hour' | 'day' | 'week' | 'all'>('all');

  const profileHistory = useMemo(
    () =>
      history
        .filter((h) => h.profileId === activeProfile.id)
        .sort((a, b) => b.visitedAt - a.visitedAt),
    [history, activeProfile.id]
  );

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    return profileHistory.filter((h) => {
      if (dateFilter === 'today' && now - h.visitedAt > 86400000) return false;
      if (dateFilter === 'week' && now - h.visitedAt > 86400000 * 7) return false;
      const q = search.trim().toLowerCase();
      return !q || h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q);
    });
  }, [profileHistory, dateFilter, search]);

  const profileClosedTabs = useMemo(
    () => closedTabs.filter((c) => c.profileId === activeProfile.id),
    [closedTabs, activeProfile.id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeProfile.name} Browsing History
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {profileHistory.length} chronological entries · Isolated from other profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search, Date Filter & Clear by Time Range */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by title or URL..."
                className="w-full min-h-[38px] pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={clearRange}
                onChange={(e) =>
                  setClearRange(e.target.value as 'hour' | 'day' | 'week' | 'all')
                }
                aria-label="Clear history time range"
                className="min-h-[38px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="all">All Time</option>
              </select>
              <button
                onClick={() => onClearHistoryRange(clearRange)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20"
              >
                Clear Range
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'today', 'week'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-medium capitalize ${
                  dateFilter === df
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {df === 'all' ? 'All Dates' : df === 'today' ? 'Last 24 Hours' : 'Last 7 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Recently Closed Tabs Section */}
          {profileClosedTabs.length > 0 && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                <span>Recently Closed Tabs</span>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                {profileClosedTabs.slice(0, 4).map((ct) => (
                  <div key={ct.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {ct.title}
                    </span>
                    <button
                      onClick={() => {
                        onReopenClosedTab(ct.id);
                        onClose();
                      }}
                      className="text-blue-600 dark:text-sky-400 font-semibold hover:underline shrink-0"
                    >
                      Restore Tab
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chronological History List */}
          {filteredHistory.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No browsing history entries match your filter for {activeProfile.name}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.map((item) => {
                const timeStr = new Date(item.visitedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = new Date(item.visitedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <button
                      onClick={() => {
                        onNavigateToUrl(item.url);
                        onClose();
                      }}
                      className="min-w-0 flex-1 text-left hover:opacity-80"
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        <span className="font-mono tabular-nums">
                          {dateStr} {timeStr}
                        </span>{' '}
                        · <span className="font-mono">{item.url}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      title="Delete entry"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. Downloads Manager Screen (Pause / Resume & Snapshot Downloader)
// ============================================================================
const DownloadsView: React.FC<{
  activeProfile: BrowserProfile;
  currentTabTitle: string;
  currentTabUrl: string;
  downloads: DownloadItem[];
  onClose: () => void;
  onTriggerDownload: (title: string, url: string, format: 'html' | 'markdown' | 'json') => void;
  onTogglePauseDownload: (id: string) => void;
  onDeleteDownload: (id: string) => void;
}> = ({
  activeProfile,
  currentTabTitle,
  currentTabUrl,
  downloads,
  onClose,
  onTriggerDownload,
  onTogglePauseDownload,
  onDeleteDownload,
}) => {
  const profileDownloads = useMemo(
    () => downloads.filter((d) => d.profileId === activeProfile.id),
    [downloads, activeProfile.id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {activeProfile.name} Downloads
              </h2>
              <p className="text-xs font-mono text-slate-500 truncate max-w-md">
                Directory: {activeProfile.downloadLocation}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Save Active Webpage Actions */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Save active tab (<strong>{currentTabTitle || 'Page'}</strong>) for offline access:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onTriggerDownload(currentTabTitle, currentTabUrl, 'html')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
            >
              Download .HTML
            </button>
            <button
              onClick={() => onTriggerDownload(currentTabTitle, currentTabUrl, 'markdown')}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              Save Reader .MD
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {profileDownloads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No downloaded files in {activeProfile.name}&apos;s isolated download directory yet.
            </div>
          ) : (
            profileDownloads.map((dl) => {
              const pct = Math.min(100, Math.round((dl.downloadedBytes / Math.max(1, dl.sizeBytes)) * 100));
              const kbSize = (dl.sizeBytes / 1024).toFixed(1);
              return (
                <div
                  key={dl.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {dl.fileName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                        {dl.status === 'completed'
                          ? `Completed · ${kbSize} KB · ${dl.mimeType}`
                          : `${dl.status.toUpperCase()} · ${pct}% of ${kbSize} KB`}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {dl.localPath}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {dl.status !== 'completed' && (
                        <button
                          onClick={() => onTogglePauseDownload(dl.id)}
                          className="min-h-[36px] px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1"
                        >
                          {dl.status === 'paused' ? (
                            <>
                              <Play className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="h-3.5 w-3.5 text-amber-500" />
                              <span>Pause</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteDownload(dl.id)}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {dl.status !== 'completed' && (
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
