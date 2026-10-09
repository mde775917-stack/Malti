export type SearchEngineId = 'google' | 'duckduckgo' | 'bing' | 'yahoo' | 'brave' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';

export type LayoutDensity = 'comfortable' | 'compact';

export type WallpaperId =
  | 'slate-minimal'
  | 'obsidian-carbon'
  | 'nordic-frost'
  | 'dusk-indigo'
  | 'forest-canopy'
  | 'warm-alabaster'
  | 'custom';

export type ProfileColorId =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'cyan'
  | 'orange'
  | 'slate';

export type AvatarIconId =
  | 'user'
  | 'briefcase'
  | 'graduation'
  | 'code'
  | 'globe'
  | 'shield'
  | 'compass'
  | 'layers'
  | 'terminal'
  | 'book'
  | 'zap'
  | 'building';

export interface BrowserProfile {
  id: string;
  name: string;
  roleLabel: string;
  avatarId: AvatarIconId;
  customAvatarUrl?: string;
  color: ProfileColorId;
  homepage: string;
  searchEngine: SearchEngineId;
  customSearchUrl: string;
  theme: ThemeMode;
  layoutDensity: LayoutDensity;
  wallpaper: WallpaperId;
  customWallpaperUrl?: string;
  showShortcuts: boolean;
  showFrequent: boolean;
  showBookmarksOnHome: boolean;
  showDiscoveryFeed: boolean;
  isDefault: boolean;
  pinCode?: string; // 4-digit PIN if protected
  desktopSiteDefault: boolean;
  javaScriptEnabled: boolean;
  blockPopups: boolean;
  doNotTrack: boolean;
  safeBrowsing: boolean;
  textScale: number; // 80 to 150
  downloadLocation: string;
  createdAt: number;
}

export type TabCategory = 'General' | 'Work' | 'Research' | 'Reading' | 'Media';

export interface BrowserTab {
  id: string;
  profileId: string;
  isPrivate: boolean;
  url: string;
  title: string;
  category: TabCategory;
  historyStack: string[];
  historyIndex: number;
  isLoading: boolean;
  isSuspended: boolean;
  desktopMode: boolean;
  readerMode: boolean;
  lastAccessedAt: number;
}

export interface ClosedTabEntry {
  id: string;
  profileId: string;
  url: string;
  title: string;
  category: TabCategory;
  closedAt: number;
}

export interface BookmarkItem {
  id: string;
  profileId: string;
  title: string;
  url: string;
  folder: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  profileId: string;
  title: string;
  url: string;
  visitedAt: number;
}

export interface ShortcutItem {
  id: string;
  profileId: string;
  title: string;
  url: string;
}

export interface DownloadItem {
  id: string;
  profileId: string;
  fileName: string;
  url: string;
  sizeBytes: number;
  downloadedBytes: number;
  status: 'downloading' | 'paused' | 'completed' | 'failed';
  mimeType: string;
  startedAt: number;
  localPath: string;
  contentPreview?: string;
}

export type PermissionValue = 'allow' | 'block' | 'ask';

export interface SitePermissionEntry {
  id: string;
  profileId: string;
  origin: string;
  camera: PermissionValue;
  microphone: PermissionValue;
  location: PermissionValue;
  notifications: PermissionValue;
  popups: PermissionValue;
  javascript: PermissionValue;
}

export interface StoredCookieItem {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
  createdAt: number;
  expiresAt: number | null;
}

export interface ReaderArticle {
  title: string;
  url: string;
  blocks: Array<{ tag: string; text: string }>;
}

export type ActiveScreen =
  | 'browser'
  | 'omnibox'
  | 'tabs'
  | 'profile-switcher'
  | 'create-profile'
  | 'edit-profile'
  | 'profile-management'
  | 'bookmarks'
  | 'history'
  | 'downloads'
  | 'private-info'
  | 'settings'
  | 'settings-privacy'
  | 'settings-search'
  | 'settings-homepage'
  | 'settings-permissions'
  | 'about-architecture'
  | 'qr-scanner';
