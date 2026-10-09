import {
  AvatarIconId,
  BookmarkItem,
  BrowserProfile,
  BrowserTab,
  HistoryEntry,
  ProfileColorId,
  SearchEngineId,
  ShortcutItem,
  SitePermissionEntry,
  WallpaperId,
} from '../types/browser';

export interface SearchEngineConfig {
  id: SearchEngineId;
  name: string;
  searchUrlTemplate: string;
  homeUrl: string;
  badge: string;
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngineConfig> = {
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrlTemplate: 'https://html.duckduckgo.com/html/?q=%s',
    homeUrl: 'https://html.duckduckgo.com/html/',
    badge: 'DDG',
  },
  google: {
    id: 'google',
    name: 'Google',
    searchUrlTemplate: 'https://www.google.com/search?igu=1&q=%s',
    homeUrl: 'https://www.google.com/?igu=1',
    badge: 'G',
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    searchUrlTemplate: 'https://www.bing.com/search?q=%s',
    homeUrl: 'https://www.bing.com',
    badge: 'Bing',
  },
  yahoo: {
    id: 'yahoo',
    name: 'Yahoo',
    searchUrlTemplate: 'https://search.yahoo.com/search?p=%s',
    homeUrl: 'https://www.yahoo.com',
    badge: 'Y!',
  },
  brave: {
    id: 'brave',
    name: 'Brave Search',
    searchUrlTemplate: 'https://search.brave.com/search?q=%s',
    homeUrl: 'https://search.brave.com',
    badge: 'Brave',
  },
  custom: {
    id: 'custom',
    name: 'Custom Engine',
    searchUrlTemplate: 'https://en.wikipedia.org/w/index.php?search=%s',
    homeUrl: 'https://en.wikipedia.org',
    badge: 'URL',
  },
};

export const PROFILE_COLORS: Record<
  ProfileColorId,
  {
    name: string;
    bg: string;
    text: string;
    ring: string;
    softBg: string;
    hex: string;
  }
> = {
  blue: {
    name: 'Cobalt Blue',
    bg: 'bg-blue-600',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500',
    softBg: 'bg-blue-500/10',
    hex: '#2563eb',
  },
  emerald: {
    name: 'Emerald Teal',
    bg: 'bg-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500',
    softBg: 'bg-emerald-500/10',
    hex: '#059669',
  },
  amber: {
    name: 'Amber Gold',
    bg: 'bg-amber-600',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500',
    softBg: 'bg-amber-500/10',
    hex: '#d97706',
  },
  rose: {
    name: 'Crimson Rose',
    bg: 'bg-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500',
    softBg: 'bg-rose-500/10',
    hex: '#e11d48',
  },
  violet: {
    name: 'Royal Violet',
    bg: 'bg-violet-600',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500',
    softBg: 'bg-violet-500/10',
    hex: '#7c3aed',
  },
  cyan: {
    name: 'Arctic Cyan',
    bg: 'bg-cyan-600',
    text: 'text-cyan-600 dark:text-cyan-400',
    ring: 'ring-cyan-500',
    softBg: 'bg-cyan-500/10',
    hex: '#0891b2',
  },
  orange: {
    name: 'Terracotta Orange',
    bg: 'bg-orange-600',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-500',
    softBg: 'bg-orange-500/10',
    hex: '#ea580c',
  },
  slate: {
    name: 'Graphite Slate',
    bg: 'bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-500',
    softBg: 'bg-slate-500/10',
    hex: '#334155',
  },
};

export const AVATAR_OPTIONS: Array<{ id: AvatarIconId; label: string }> = [
  { id: 'user', label: 'Personal' },
  { id: 'briefcase', label: 'Work' },
  { id: 'building', label: 'Business' },
  { id: 'graduation', label: 'Study' },
  { id: 'code', label: 'Engineering' },
  { id: 'globe', label: 'Social' },
  { id: 'shield', label: 'Security' },
  { id: 'compass', label: 'Travel' },
  { id: 'layers', label: 'Research' },
  { id: 'terminal', label: 'DevOps' },
  { id: 'book', label: 'Reading' },
  { id: 'zap', label: 'Creator' },
];

export const WALLPAPER_PRESETS: Record<
  Exclude<WallpaperId, 'custom'>,
  { name: string; lightClass: string; darkClass: string }
> = {
  'slate-minimal': {
    name: 'Slate Minimal',
    lightClass: 'bg-slate-50',
    darkClass: 'bg-slate-950',
  },
  'obsidian-carbon': {
    name: 'Obsidian Carbon',
    lightClass: 'bg-zinc-100',
    darkClass: 'bg-zinc-950',
  },
  'nordic-frost': {
    name: 'Nordic Frost',
    lightClass: 'bg-gradient-to-b from-sky-50/90 via-slate-50 to-white',
    darkClass: 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950',
  },
  'dusk-indigo': {
    name: 'Dusk Indigo',
    lightClass: 'bg-gradient-to-br from-indigo-50/80 via-slate-50 to-sky-50/50',
    darkClass: 'bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-900',
  },
  'forest-canopy': {
    name: 'Forest Canopy',
    lightClass: 'bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white',
    darkClass: 'bg-gradient-to-b from-emerald-950/50 via-slate-950 to-slate-950',
  },
  'warm-alabaster': {
    name: 'Warm Alabaster',
    lightClass: 'bg-stone-50',
    darkClass: 'bg-stone-950',
  },
};

export const INITIAL_PROFILES: BrowserProfile[] = [
  {
    id: 'personal',
    name: 'Personal',
    roleLabel: 'Everyday Browsing',
    avatarId: 'user',
    color: 'blue',
    homepage: 'uv://home',
    searchEngine: 'duckduckgo',
    customSearchUrl: 'https://en.wikipedia.org/w/index.php?search=%s',
    theme: 'dark',
    layoutDensity: 'comfortable',
    wallpaper: 'nordic-frost',
    showShortcuts: true,
    showFrequent: true,
    showBookmarksOnHome: true,
    showDiscoveryFeed: true,
    isDefault: true,
    desktopSiteDefault: false,
    javaScriptEnabled: true,
    blockPopups: true,
    doNotTrack: true,
    safeBrowsing: true,
    textScale: 100,
    downloadLocation: '/storage/emulated/0/Download/UVBrowser/Personal',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'work',
    name: 'Work',
    roleLabel: 'Enterprise & Engineering',
    avatarId: 'briefcase',
    color: 'emerald',
    homepage: 'uv://home',
    searchEngine: 'google',
    customSearchUrl: 'https://en.wikipedia.org/w/index.php?search=%s',
    theme: 'dark',
    layoutDensity: 'compact',
    wallpaper: 'slate-minimal',
    showShortcuts: true,
    showFrequent: true,
    showBookmarksOnHome: true,
    showDiscoveryFeed: false,
    isDefault: false,
    desktopSiteDefault: false,
    javaScriptEnabled: true,
    blockPopups: true,
    doNotTrack: true,
    safeBrowsing: true,
    textScale: 100,
    downloadLocation: '/storage/emulated/0/Download/UVBrowser/Work',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'study',
    name: 'Study & Research',
    roleLabel: 'Academic & Reference',
    avatarId: 'graduation',
    color: 'amber',
    homepage: 'uv://home',
    searchEngine: 'duckduckgo',
    customSearchUrl: 'https://en.wikipedia.org/w/index.php?search=%s',
    theme: 'light',
    layoutDensity: 'comfortable',
    wallpaper: 'warm-alabaster',
    showShortcuts: true,
    showFrequent: true,
    showBookmarksOnHome: true,
    showDiscoveryFeed: true,
    isDefault: false,
    desktopSiteDefault: false,
    javaScriptEnabled: true,
    blockPopups: true,
    doNotTrack: true,
    safeBrowsing: true,
    textScale: 105,
    downloadLocation: '/storage/emulated/0/Download/UVBrowser/Study',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export const INITIAL_TABS: BrowserTab[] = [
  {
    id: 'tab-personal-1',
    profileId: 'personal',
    isPrivate: false,
    url: 'uv://home',
    title: 'New Tab — Personal',
    category: 'General',
    historyStack: ['uv://home'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 60000,
  },
  {
    id: 'tab-personal-2',
    profileId: 'personal',
    isPrivate: false,
    url: 'uv://auth-lab',
    title: 'Session & Cookie Isolation Lab',
    category: 'Research',
    historyStack: ['uv://auth-lab'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 120000,
  },
  {
    id: 'tab-personal-3',
    profileId: 'personal',
    isPrivate: false,
    url: 'https://en.m.wikipedia.org/wiki/Web_browser',
    title: 'Web browser — Wikipedia',
    category: 'Reading',
    historyStack: ['https://en.m.wikipedia.org/wiki/Web_browser'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 300000,
  },
  {
    id: 'tab-work-1',
    profileId: 'work',
    isPrivate: false,
    url: 'uv://home',
    title: 'New Tab — Work',
    category: 'Work',
    historyStack: ['uv://home'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 180000,
  },
  {
    id: 'tab-work-2',
    profileId: 'work',
    isPrivate: false,
    url: 'uv://auth-lab',
    title: 'Enterprise Session Isolation Lab',
    category: 'Work',
    historyStack: ['uv://auth-lab'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 240000,
  },
  {
    id: 'tab-work-3',
    profileId: 'work',
    isPrivate: false,
    url: 'https://news.ycombinator.com',
    title: 'Hacker News',
    category: 'Work',
    historyStack: ['https://news.ycombinator.com'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 400000,
  },
  {
    id: 'tab-study-1',
    profileId: 'study',
    isPrivate: false,
    url: 'uv://home',
    title: 'New Tab — Study & Research',
    category: 'Research',
    historyStack: ['uv://home'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 500000,
  },
  {
    id: 'tab-study-2',
    profileId: 'study',
    isPrivate: false,
    url: 'https://en.m.wikipedia.org/wiki/Operating_system',
    title: 'Operating system — Wikipedia',
    category: 'Reading',
    historyStack: ['https://en.m.wikipedia.org/wiki/Operating_system'],
    historyIndex: 0,
    isLoading: false,
    isSuspended: false,
    desktopMode: false,
    readerMode: false,
    lastAccessedAt: Date.now() - 600000,
  },
];

export const INITIAL_SHORTCUTS: ShortcutItem[] = [
  // Personal profile shortcuts
  { id: 'sc-p-1', profileId: 'personal', title: 'Isolation Lab', url: 'uv://auth-lab' },
  { id: 'sc-p-2', profileId: 'personal', title: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
  { id: 'sc-p-3', profileId: 'personal', title: 'Hacker News', url: 'https://news.ycombinator.com' },
  { id: 'sc-p-4', profileId: 'personal', title: 'HTTPBin Cookies', url: 'https://httpbin.org/cookies' },
  { id: 'sc-p-5', profileId: 'personal', title: 'Diagnostics', url: 'uv://diagnostics' },
  { id: 'sc-p-6', profileId: 'personal', title: 'APK Blueprint', url: 'uv://architecture' },
  // Work profile shortcuts
  { id: 'sc-w-1', profileId: 'work', title: 'Work Auth Lab', url: 'uv://auth-lab' },
  { id: 'sc-w-2', profileId: 'work', title: 'HTTP Headers', url: 'https://httpbin.org/headers' },
  { id: 'sc-w-3', profileId: 'work', title: 'Hacker News', url: 'https://news.ycombinator.com' },
  { id: 'sc-w-4', profileId: 'work', title: 'RFC Editor', url: 'https://www.rfc-editor.org' },
  { id: 'sc-w-5', profileId: 'work', title: 'Diagnostics', url: 'uv://diagnostics' },
  { id: 'sc-w-6', profileId: 'work', title: 'Android Engine', url: 'uv://architecture' },
  // Study profile shortcuts
  { id: 'sc-s-1', profileId: 'study', title: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Computer_science' },
  { id: 'sc-s-2', profileId: 'study', title: 'Example Domain', url: 'https://example.com' },
  { id: 'sc-s-3', profileId: 'study', title: 'Isolation Lab', url: 'uv://auth-lab' },
  { id: 'sc-s-4', profileId: 'study', title: 'Architecture', url: 'uv://architecture' },
];

export const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-p-1',
    profileId: 'personal',
    title: 'Multi-Profile Session & Cookie Isolation Lab',
    url: 'uv://auth-lab',
    folder: 'Toolbar',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'bm-p-2',
    profileId: 'personal',
    title: 'Wikipedia — Web Browser Architecture',
    url: 'https://en.m.wikipedia.org/wiki/Web_browser',
    folder: 'Reading List',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'bm-p-3',
    profileId: 'personal',
    title: 'HTTPBin — Live Server Cookie Inspector',
    url: 'https://httpbin.org/cookies',
    folder: 'Toolbar',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'bm-w-1',
    profileId: 'work',
    title: 'Enterprise Session Isolation Testbench',
    url: 'uv://auth-lab',
    folder: 'Work',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'bm-w-2',
    profileId: 'work',
    title: 'Hacker News — Y Combinator',
    url: 'https://news.ycombinator.com',
    folder: 'Work',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'bm-w-3',
    profileId: 'work',
    title: 'Android WebView ProfileStore Architecture',
    url: 'uv://architecture',
    folder: 'Reference',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'bm-s-1',
    profileId: 'study',
    title: 'Computer Science Portal — Wikipedia',
    url: 'https://en.m.wikipedia.org/wiki/Computer_science',
    folder: 'Reference',
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_HISTORY: HistoryEntry[] = [
  {
    id: 'hist-p-1',
    profileId: 'personal',
    title: 'Web browser — Wikipedia',
    url: 'https://en.m.wikipedia.org/wiki/Web_browser',
    visitedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'hist-p-2',
    profileId: 'personal',
    title: 'Multi-Profile Session & Cookie Isolation Lab',
    url: 'uv://auth-lab',
    visitedAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'hist-w-1',
    profileId: 'work',
    title: 'Hacker News',
    url: 'https://news.ycombinator.com',
    visitedAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'hist-w-2',
    profileId: 'work',
    title: 'HTTPBin Request Headers',
    url: 'https://httpbin.org/headers',
    visitedAt: Date.now() - 3600000 * 1.5,
  },
  {
    id: 'hist-s-1',
    profileId: 'study',
    title: 'Operating system — Wikipedia',
    url: 'https://en.m.wikipedia.org/wiki/Operating_system',
    visitedAt: Date.now() - 3600000 * 4,
  },
];

export const INITIAL_PERMISSIONS: SitePermissionEntry[] = [
  {
    id: 'perm-1',
    profileId: 'personal',
    origin: 'https://en.m.wikipedia.org',
    camera: 'block',
    microphone: 'ask',
    location: 'block',
    notifications: 'block',
    popups: 'block',
    javascript: 'allow',
  },
  {
    id: 'perm-2',
    profileId: 'personal',
    origin: 'uv://auth-lab',
    camera: 'allow',
    microphone: 'allow',
    location: 'ask',
    notifications: 'allow',
    popups: 'block',
    javascript: 'allow',
  },
  {
    id: 'perm-3',
    profileId: 'work',
    origin: 'https://news.ycombinator.com',
    camera: 'block',
    microphone: 'block',
    location: 'block',
    notifications: 'block',
    popups: 'block',
    javascript: 'allow',
  },
];

export const DISCOVERY_FEED_ITEMS = [
  {
    id: 'feed-1',
    title: 'How Android WebView ProfileStore Isolates Multi-Tenant Cookies & Storage',
    source: 'AndroidX WebKit Engineering',
    category: 'Browser Architecture',
    readTime: '4 min read',
    url: 'uv://architecture',
    summary:
      'Why instantiating separate WebView objects shares the default CookieManager singleton—and how androidx.webkit.ProfileStore creates genuinely independent data directories on Android.',
  },
  {
    id: 'feed-2',
    title: 'Verify Profile Session Isolation: Interactive Cookie & Storage Testbench',
    source: 'UV Security Lab',
    category: 'Interactive Verification',
    readTime: '2 min test',
    url: 'uv://auth-lab',
    summary:
      'Sign in under Profile A, inspect live RFC-6265 Set-Cookie headers, and switch to Profile B to verify zero cross-profile credential or storage leakage.',
  },
  {
    id: 'feed-3',
    title: 'History and Evolution of Mobile Web Browsers',
    source: 'Wikipedia',
    category: 'Web Standards',
    readTime: '6 min read',
    url: 'https://en.m.wikipedia.org/wiki/Mobile_browser',
    summary:
      'From early WAP microbrowsers to modern Chromium and WebKit rendering engines supporting isolated storage partitions and progressive web applications.',
  },
  {
    id: 'feed-4',
    title: 'HTTP State Management Mechanism (Cookies & SameSite Security)',
    source: 'Wikipedia',
    category: 'Network Security',
    readTime: '5 min read',
    url: 'https://en.m.wikipedia.org/wiki/HTTP_cookie',
    summary:
      'Deep dive into HTTP cookies, session authentication tokens, HttpOnly protection flags, and multi-profile cookie jar partitioning.',
  },
];

export function resolveInputToUrl(
  rawInput: string,
  searchEngine: SearchEngineId,
  customSearchUrl?: string
): string {
  const input = rawInput.trim();
  if (!input) return 'uv://home';

  if (
    input.startsWith('uv://') ||
    input.startsWith('http://') ||
    input.startsWith('https://')
  ) {
    return input;
  }

  // Detect domain-like inputs (e.g. "wikipedia.org", "news.ycombinator.com", "httpbin.org/cookies")
  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
  if (!input.includes(' ') && domainRegex.test(input)) {
    return `https://${input}`;
  }

  // Otherwise treat as a search query using the active profile's search engine
  const engine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.duckduckgo;
  const template =
    searchEngine === 'custom' && customSearchUrl && customSearchUrl.includes('%s')
      ? customSearchUrl
      : engine.searchUrlTemplate;

  return template.replace('%s', encodeURIComponent(input));
}

export function formatDomainDisplay(url: string): {
  host: string;
  isSecure: boolean;
  isInternal: boolean;
  protocolLabel: string;
} {
  if (url.startsWith('uv://')) {
    return {
      host: url,
      isSecure: true,
      isInternal: true,
      protocolLabel: 'UV INTERNAL',
    };
  }
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname.replace(/^www\./, ''),
      isSecure: parsed.protocol === 'https:',
      isInternal: false,
      protocolLabel: parsed.protocol === 'https:' ? 'HTTPS' : 'HTTP',
    };
  } catch {
    return {
      host: url,
      isSecure: false,
      isInternal: false,
      protocolLabel: 'WEB',
    };
  }
}

export const ANDROID_NATIVE_BLUEPRINT = {
  buildGradle: `// app/build.gradle.kts — Native Android Multi-Profile Browser
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.uvbrowser.mobile"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.uvbrowser.mobile"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "2.4.0"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // CRITICAL: androidx.webkit 1.9.0+ provides ProfileStore & Profile APIs
    // for genuine multi-profile WebView cookie, cache, and DOM storage isolation
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.biometric:biometric:1.2.0-alpha05")
}`,
  profileEngineKt: `// MultiProfileWebViewEngine.kt
package com.uvbrowser.mobile.engine

import android.content.Context
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.Profile
import androidx.webkit.ProfileStore
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/**
 * Genuine Multi-Profile Isolation for Android WebView.
 *
 * IMPORTANT ARCHITECTURAL NOTE:
 * Simply instantiating multiple WebView(context) instances does NOT isolate
 * cookies or localStorage on Android—by default all WebViews share the
 * global CookieManager.getInstance() singleton.
 *
 * To achieve true desktop-grade profile isolation on Android, we use
 * WebViewFeature.MULTI_PROFILE with ProfileStore.getInstance():
 * Each profileId maps to an isolated disk directory under
 * /data/data/com.uvbrowser.mobile/app_webview_<profileId>/ with its own
 * CookieManager, WebStorage (IndexedDB / localStorage), and ServiceWorkerController.
 */
class MultiProfileWebViewEngine(private val context: Context) {

    fun createIsolatedWebView(
        profileId: String,
        isPrivateMode: Boolean,
        desktopMode: Boolean,
        javaScriptEnabled: Boolean,
        textZoom: Int
    ): WebView {
        val webView = WebView(context)

        if (WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
            val profileStore = ProfileStore.getInstance()
            val profileName = if (isPrivateMode) {
                "ephemeral_private_\${profileId}"
            } else {
                "uv_profile_\${profileId}"
            }
            // Assigns dedicated CookieManager, WebStorage, and HTTP cache directory
            WebViewCompat.setProfile(webView, profileName)
        }

        webView.settings.apply {
            this.javaScriptEnabled = javaScriptEnabled
            this.domStorageEnabled = true
            this.databaseEnabled = true
            this.textZoom = textZoom
            this.supportMultipleWindows()
            this.javaScriptCanOpenWindowsAutomatically = false // Block pop-ups by default
            this.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            this.userAgentString = if (desktopMode) {
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
            } else {
                defaultUserAgentString
            }
        }
        return webView
    }

    fun clearProfileData(profileId: String) {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
            val profileStore = ProfileStore.getInstance()
            val profile: Profile? = profileStore.getProfile("uv_profile_\${profileId}")
            profile?.cookieManager?.removeAllCookies(null)
            profile?.webStorage?.deleteAllData()
            profileStore.deleteProfile("uv_profile_\${profileId}")
        }
    }
}`,
};
