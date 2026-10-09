/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  ExternalLink,
  Globe,
  Home,
  Languages,
  Layers,
  Lock,
  Mic,
  MoreVertical,
  PauseCircle,
  PictureInPicture2,
  Plus,
  QrCode,
  RefreshCw,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  Smartphone,
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
  ClosedTabEntry,
  DownloadItem,
  HistoryEntry,
  ReaderArticle,
  SearchEngineId,
  ShortcutItem,
  SitePermissionEntry,
  TabCategory,
} from './types/browser';
import {
  formatDomainDisplay,
  INITIAL_BOOKMARKS,
  INITIAL_HISTORY,
  INITIAL_PERMISSIONS,
  INITIAL_PROFILES,
  INITIAL_SHORTCUTS,
  INITIAL_TABS,
  PROFILE_COLORS,
  resolveInputToUrl,
  SEARCH_ENGINES,
} from './data/defaults';
import { ProfileAvatar } from './components/ProfileAvatar';
import { InternalPageView } from './components/InternalPages';
import { NewTabHome } from './components/NewTabHome';
import { ProfileModals } from './components/ProfileModals';
import { TabSwitcherModal } from './components/TabSwitcherModal';
import { LibraryModals } from './components/LibraryModals';
import { SettingsModals } from './components/SettingsModals';
import {
  OnboardingModal,
  OmniboxOverlay,
  QrScannerModal,
  ReaderAndTranslateView,
  SecurityLockPopover,
  ThreeDotMenuSheet,
} from './components/BrowserOverlays';
import { OfflineIndicator, PWAInstallButton } from './hooks/usePWAInstall';

const STORAGE_KEY = 'uv_browser_state_v2';

interface PersistedState {
  profiles: BrowserProfile[];
  activeProfileId: string;
  tabs: BrowserTab[];
  activeTabByProfile: Record<string, string>;
  closedTabs: ClosedTabEntry[];
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  shortcuts: ShortcutItem[];
  downloads: DownloadItem[];
  permissions: SitePermissionEntry[];
  onboardingComplete: boolean;
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0 && Array.isArray(parsed.tabs)) {
        return {
          profiles: parsed.profiles,
          activeProfileId: parsed.activeProfileId || parsed.profiles[0].id,
          tabs: parsed.tabs.filter((t) => !t.isPrivate),
          activeTabByProfile: parsed.activeTabByProfile || {},
          closedTabs: parsed.closedTabs || [],
          bookmarks: parsed.bookmarks || INITIAL_BOOKMARKS,
          history: parsed.history || INITIAL_HISTORY,
          shortcuts: parsed.shortcuts || INITIAL_SHORTCUTS,
          downloads: parsed.downloads || [],
          permissions: parsed.permissions || INITIAL_PERMISSIONS,
          onboardingComplete: Boolean(parsed.onboardingComplete),
        };
      }
    }
  } catch {
    // ignore storage errors
  }

  return {
    profiles: INITIAL_PROFILES,
    activeProfileId: 'personal',
    tabs: INITIAL_TABS,
    activeTabByProfile: {
      personal: 'tab-personal-1',
      work: 'tab-work-1',
      study: 'tab-study-1',
    },
    closedTabs: [],
    bookmarks: INITIAL_BOOKMARKS,
    history: INITIAL_HISTORY,
    shortcuts: INITIAL_SHORTCUTS,
    downloads: [
      {
        id: 'dl-initial-1',
        profileId: 'personal',
        fileName: 'Android_WebView_ProfileStore_Spec.md',
        url: 'uv://architecture',
        sizeBytes: 18432,
        downloadedBytes: 18432,
        status: 'completed',
        mimeType: 'text/markdown',
        startedAt: Date.now() - 3600000,
        localPath: '/storage/emulated/0/Download/UVBrowser/Personal/Android_WebView_ProfileStore_Spec.md',
      },
    ],
    permissions: INITIAL_PERMISSIONS,
    onboardingComplete: true,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [profiles, setProfiles] = useState<BrowserProfile[]>(initial.profiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(initial.activeProfileId);
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(false);
  const [tabs, setTabs] = useState<BrowserTab[]>(initial.tabs);
  const [activeTabByProfile, setActiveTabByProfile] = useState<Record<string, string>>(
    initial.activeTabByProfile
  );
  const [activePrivateTabId, setActivePrivateTabId] = useState<string | null>(null);
  const [closedTabs, setClosedTabs] = useState<ClosedTabEntry[]>(initial.closedTabs);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initial.bookmarks);
  const [history, setHistory] = useState<HistoryEntry[]>(initial.history);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(initial.shortcuts);
  const [downloads, setDownloads] = useState<DownloadItem[]>(initial.downloads);
  const [permissions, setPermissions] = useState<SitePermissionEntry[]>(initial.permissions);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!initial.onboardingComplete);

  // Navigation & UI Overlays
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('browser');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showSecurityPopover, setShowSecurityPopover] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findStats, setFindStats] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [readerData, setReaderData] = useState<ReaderArticle | null>(null);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [showPipPlayer, setShowPipPlayer] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [desktopInspectorOpen, setDesktopInspectorOpen] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Persist non-private state to localStorage
  useEffect(() => {
    try {
      const payload: PersistedState = {
        profiles,
        activeProfileId,
        tabs: tabs.filter((t) => !t.isPrivate),
        activeTabByProfile,
        closedTabs,
        bookmarks,
        history,
        shortcuts,
        downloads,
        permissions,
        onboardingComplete: !showOnboarding,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [
    profiles,
    activeProfileId,
    tabs,
    activeTabByProfile,
    closedTabs,
    bookmarks,
    history,
    shortcuts,
    downloads,
    permissions,
    showOnboarding,
  ]);

  // Active Profile resolution
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId]
  );

  // Apply Dark / Light Mode class to document root based on active profile or private mode
  useEffect(() => {
    const root = document.documentElement;
    if (isPrivateMode) {
      root.classList.add('dark');
      return;
    }
    if (activeProfile.theme === 'dark') {
      root.classList.add('dark');
    } else if (activeProfile.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [activeProfile.theme, isPrivateMode]);

  // Profile Tabs & Private Tabs
  const profileRegularTabs = useMemo(
    () => tabs.filter((t) => !t.isPrivate && t.profileId === activeProfile.id),
    [tabs, activeProfile.id]
  );

  const profilePrivateTabs = useMemo(
    () => tabs.filter((t) => t.isPrivate && t.profileId === activeProfile.id),
    [tabs, activeProfile.id]
  );

  // Active Tab resolution
  const activeTab = useMemo(() => {
    if (isPrivateMode) {
      const found =
        profilePrivateTabs.find((t) => t.id === activePrivateTabId) || profilePrivateTabs[0];
      if (found) return found;
    }
    const targetId = activeTabByProfile[activeProfile.id];
    const foundRegular =
      profileRegularTabs.find((t) => t.id === targetId) || profileRegularTabs[0];
    if (foundRegular) return foundRegular;

    // Fallback default tab if profile has 0 tabs
    return {
      id: `tab-${activeProfile.id}-default`,
      profileId: activeProfile.id,
      isPrivate: isPrivateMode,
      url: activeProfile.homepage || 'uv://home',
      title: `New Tab — ${activeProfile.name}`,
      category: 'General' as TabCategory,
      historyStack: [activeProfile.homepage || 'uv://home'],
      historyIndex: 0,
      isLoading: false,
      isSuspended: false,
      desktopMode: activeProfile.desktopSiteDefault,
      readerMode: false,
      lastAccessedAt: Date.now(),
    };
  }, [
    isPrivateMode,
    profilePrivateTabs,
    activePrivateTabId,
    activeTabByProfile,
    activeProfile,
    profileRegularTabs,
  ]);

  // Ensure at least one regular tab exists for activeProfile
  useEffect(() => {
    if (!isPrivateMode && profileRegularTabs.length === 0) {
      const newTab: BrowserTab = {
        id: `tab-${activeProfile.id}-${Date.now()}`,
        profileId: activeProfile.id,
        isPrivate: false,
        url: activeProfile.homepage || 'uv://home',
        title: `New Tab — ${activeProfile.name}`,
        category: 'General',
        historyStack: [activeProfile.homepage || 'uv://home'],
        historyIndex: 0,
        isLoading: false,
        isSuspended: false,
        desktopMode: activeProfile.desktopSiteDefault,
        readerMode: false,
        lastAccessedAt: Date.now(),
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabByProfile((prev) => ({ ...prev, [activeProfile.id]: newTab.id }));
    }
  }, [isPrivateMode, profileRegularTabs.length, activeProfile]);

  // Navigate active tab to URL
  const navigateActiveTab = useCallback(
    (rawUrlOrQuery: string) => {
      const resolvedUrl = resolveInputToUrl(
        rawUrlOrQuery,
        activeProfile.searchEngine,
        activeProfile.customSearchUrl
      );
      const { host } = formatDomainDisplay(resolvedUrl);
      const inferredTitle =
        resolvedUrl === 'uv://home'
          ? `New Tab — ${activeProfile.name}`
          : resolvedUrl === 'uv://auth-lab'
            ? 'Session & Cookie Isolation Lab'
            : resolvedUrl === 'uv://diagnostics'
              ? 'Storage & Security Diagnostics'
              : resolvedUrl === 'uv://architecture'
                ? 'Android APK & Engine Blueprint'
                : host;

      setReaderData(null);
      setShowFindBar(false);

      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTab.id) return t;
          const nextStack = [...t.historyStack.slice(0, t.historyIndex + 1), resolvedUrl];
          return {
            ...t,
            url: resolvedUrl,
            title: inferredTitle,
            historyStack: nextStack,
            historyIndex: nextStack.length - 1,
            isLoading: !resolvedUrl.startsWith('uv://'),
            isSuspended: false,
            readerMode: false,
            lastAccessedAt: Date.now(),
          };
        })
      );

      // Record to profile history if not private mode and not uv://home
      if (!activeTab.isPrivate && resolvedUrl !== 'uv://home') {
        const entry: HistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          profileId: activeProfile.id,
          title: inferredTitle,
          url: resolvedUrl,
          visitedAt: Date.now(),
        };
        setHistory((prev) => [entry, ...prev.slice(0, 199)]);
      }
    },
    [activeProfile, activeTab.id, activeTab.isPrivate]
  );

  // Listen to messages from proxied iframe bridge (UV_PAGE_LOADED, UV_NAVIGATE, UV_FIND_RESULTS, UV_READER_DATA, UV_TTS_DATA)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'UV_PAGE_LOADED') {
        const loadedTitle = String(data.title || '');
        const loadedUrl = String(data.url || '');
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTab.id
              ? {
                  ...t,
                  title: loadedTitle || t.title,
                  isLoading: false,
                }
              : t
          )
        );
        if (!activeTab.isPrivate && loadedUrl && !loadedUrl.startsWith('uv://')) {
          setHistory((prev) => {
            if (prev[0] && prev[0].url === loadedUrl && prev[0].profileId === activeProfile.id) {
              return [{ ...prev[0], title: loadedTitle || prev[0].title }, ...prev.slice(1)];
            }
            return prev;
          });
        }
      } else if (data.type === 'UV_NAVIGATE' && data.url) {
        navigateActiveTab(String(data.url));
      } else if (data.type === 'UV_FIND_RESULTS') {
        setFindStats({
          total: Number(data.total || 0),
          current: Number(data.current || 0),
        });
      } else if (data.type === 'UV_READER_DATA' && data.payload) {
        setReaderData(data.payload as ReaderArticle);
      } else if (data.type === 'UV_TTS_DATA' && data.text) {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(String(data.text));
          utter.onend = () => setIsSpeakingTts(false);
          utter.onerror = () => setIsSpeakingTts(false);
          setIsSpeakingTts(true);
          window.speechSynthesis.speak(utter);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTab.id, activeTab.isPrivate, activeProfile.id, navigateActiveTab]);

  // Back / Forward Navigation
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.historyStack.length - 1;

  const handleGoBack = () => {
    if (!canGoBack) return;
    setReaderData(null);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const nextIdx = Math.max(0, t.historyIndex - 1);
        const nextUrl = t.historyStack[nextIdx];
        return {
          ...t,
          historyIndex: nextIdx,
          url: nextUrl,
          isLoading: !nextUrl.startsWith('uv://'),
        };
      })
    );
  };

  const handleGoForward = () => {
    if (!canGoForward) return;
    setReaderData(null);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const nextIdx = Math.min(t.historyStack.length - 1, t.historyIndex + 1);
        const nextUrl = t.historyStack[nextIdx];
        return {
          ...t,
          historyIndex: nextIdx,
          url: nextUrl,
          isLoading: !nextUrl.startsWith('uv://'),
        };
      })
    );
  };

  const handleReload = () => {
    setReloadNonce((n) => n + 1);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id ? { ...t, isLoading: !t.url.startsWith('uv://') } : t
      )
    );
  };

  // Create New Tab
  const handleNewTab = useCallback(
    (privateTab = false, initialUrl?: string) => {
      const targetUrl = initialUrl || (privateTab ? 'uv://home' : activeProfile.homepage || 'uv://home');
      const newTab: BrowserTab = {
        id: `tab-${activeProfile.id}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        profileId: activeProfile.id,
        isPrivate: privateTab,
        url: targetUrl,
        title: privateTab ? 'Private Browsing' : `New Tab — ${activeProfile.name}`,
        category: 'General',
        historyStack: [targetUrl],
        historyIndex: 0,
        isLoading: !targetUrl.startsWith('uv://'),
        isSuspended: false,
        desktopMode: activeProfile.desktopSiteDefault,
        readerMode: false,
        lastAccessedAt: Date.now(),
      };

      setTabs((prev) => [...prev, newTab]);
      setIsPrivateMode(privateTab);
      if (privateTab) {
        setActivePrivateTabId(newTab.id);
      } else {
        setActiveTabByProfile((prev) => ({ ...prev, [activeProfile.id]: newTab.id }));
      }
      setReaderData(null);
    },
    [activeProfile]
  );

  // Switch Profile (preserving previous profile's open tabs and restoring target profile's session)
  const handleSwitchProfile = useCallback(
    (targetProfileId: string, openUrl?: string) => {
      const targetProf = profiles.find((p) => p.id === targetProfileId);
      if (!targetProf) return;

      setIsPrivateMode(false);
      setActiveProfileId(targetProfileId);
      setReaderData(null);
      setShowFindBar(false);

      if (openUrl) {
        const newTab: BrowserTab = {
          id: `tab-${targetProfileId}-${Date.now()}`,
          profileId: targetProfileId,
          isPrivate: false,
          url: openUrl,
          title: openUrl === 'uv://auth-lab' ? 'Session & Cookie Isolation Lab' : openUrl,
          category: 'Research',
          historyStack: [openUrl],
          historyIndex: 0,
          isLoading: !openUrl.startsWith('uv://'),
          isSuspended: false,
          desktopMode: targetProf.desktopSiteDefault,
          readerMode: false,
          lastAccessedAt: Date.now(),
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabByProfile((prev) => ({ ...prev, [targetProfileId]: newTab.id }));
      }

      showToast(`Switched to ${targetProf.name} profile · Isolated session restored`);
    },
    [profiles, showToast]
  );

  // Close individual tab
  const handleCloseTab = (tabId: string) => {
    const target = tabs.find((t) => t.id === tabId);
    if (!target) return;

    if (!target.isPrivate && target.url !== 'uv://home') {
      const closedEntry: ClosedTabEntry = {
        id: `closed-${Date.now()}`,
        profileId: target.profileId,
        url: target.url,
        title: target.title,
        category: target.category,
        closedAt: Date.now(),
      };
      setClosedTabs((prev) => [closedEntry, ...prev.slice(0, 29)]);
    }

    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);

    if (target.isPrivate) {
      const remPriv = remaining.filter((t) => t.isPrivate && t.profileId === activeProfile.id);
      if (remPriv.length === 0) {
        // Purge server RAM cookies when last private tab closes
        fetch(`/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies?isPrivate=true`, {
          method: 'DELETE',
        }).catch(() => {});
        setIsPrivateMode(false);
        setActivePrivateTabId(null);
        showToast('Private session closed & RAM cookies wiped');
      } else if (activePrivateTabId === tabId) {
        setActivePrivateTabId(remPriv[remPriv.length - 1].id);
      }
    } else {
      const remReg = remaining.filter((t) => !t.isPrivate && t.profileId === activeProfile.id);
      if (remReg.length > 0 && activeTabByProfile[activeProfile.id] === tabId) {
        setActiveTabByProfile((prev) => ({
          ...prev,
          [activeProfile.id]: remReg[remReg.length - 1].id,
        }));
      }
    }
  };

  // Close All Tabs (Regular or Private)
  const handleCloseAllTabs = (closePrivate: boolean) => {
    if (closePrivate) {
      setTabs((prev) => prev.filter((t) => !(t.isPrivate && t.profileId === activeProfile.id)));
      fetch(`/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies?isPrivate=true`, {
        method: 'DELETE',
      }).catch(() => {});
      setIsPrivateMode(false);
      setActivePrivateTabId(null);
      showToast('All private tabs closed & ephemeral cookies purged');
    } else {
      setTabs((prev) => prev.filter((t) => !(!t.isPrivate && t.profileId === activeProfile.id)));
      showToast(`Closed all tabs in ${activeProfile.name}`);
    }
  };

  // Duplicate Tab
  const handleDuplicateTab = (tabId: string) => {
    const source = tabs.find((t) => t.id === tabId);
    if (!source) return;
    const copy: BrowserTab = {
      ...source,
      id: `tab-${source.profileId}-${Date.now()}`,
      title: `${source.title} (Copy)`,
      lastAccessedAt: Date.now(),
    };
    setTabs((prev) => [...prev, copy]);
    if (copy.isPrivate) {
      setActivePrivateTabId(copy.id);
    } else {
      setActiveTabByProfile((prev) => ({ ...prev, [activeProfile.id]: copy.id }));
    }
    showToast('Tab duplicated');
  };

  // Reopen Recently Closed Tab
  const handleReopenClosedTab = (closedId: string) => {
    const entry = closedTabs.find((c) => c.id === closedId);
    if (!entry) return;
    setClosedTabs((prev) => prev.filter((c) => c.id !== closedId));
    handleNewTab(false, entry.url);
    showToast(`Restored tab: ${entry.title}`);
  };

  // Clear Profile Data (Cookies, History, LocalStorage Partition)
  const handleClearProfileData = (
    profileId: string,
    options: { history?: boolean; cookies?: boolean; cache?: boolean } = {
      history: true,
      cookies: true,
      cache: true,
    }
  ) => {
    if (options.history) {
      setHistory((prev) => prev.filter((h) => h.profileId !== profileId));
      setClosedTabs((prev) => prev.filter((c) => c.profileId !== profileId));
    }
    if (options.cookies) {
      fetch(`/api/profiles/${encodeURIComponent(profileId)}/cookies?isPrivate=false`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    if (options.cache) {
      try {
        const prefix = `uv_prof_${profileId}_`;
        const keysToDelete: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(prefix)) keysToDelete.push(k);
        }
        keysToDelete.forEach((k) => window.localStorage.removeItem(k));
      } catch {
        // ignore
      }
    }
  };

  // Reader Mode Extraction
  const handleToggleReaderMode = () => {
    if (readerData) {
      setReaderData(null);
      return;
    }
    if (activeTab.url.startsWith('uv://')) {
      setReaderData({
        title: activeTab.title,
        url: activeTab.url,
        blocks: [
          {
            tag: 'h2',
            text: 'Unlimited Virtual Multi-Profile Browser Architecture',
          },
          {
            tag: 'p',
            text: 'Each browser profile operates inside a dedicated storage partition with its own RFC-6265 Cookie Jar, localStorage namespace, bookmarks, open tabs, and site permissions.',
          },
          {
            tag: 'p',
            text: 'On native Android hardware, WebViewCompat.setProfile() binds each WebView instance to an isolated ProfileStore directory so switching profiles never leaks session credentials.',
          },
        ],
      });
      return;
    }
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UV_EXTRACT_READER' }, '*');
    }
  };

  // Text-to-Speech (TTS)
  const handleToggleTts = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported in this browser');
      return;
    }
    if (isSpeakingTts) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      return;
    }
    if (readerData) {
      const text = [readerData.title, ...readerData.blocks.map((b) => b.text)].join('. ');
      const utter = new SpeechSynthesisUtterance(text.slice(0, 4000));
      utter.onend = () => setIsSpeakingTts(false);
      setIsSpeakingTts(true);
      window.speechSynthesis.speak(utter);
      return;
    }
    if (iframeRef.current && iframeRef.current.contentWindow && !activeTab.url.startsWith('uv://')) {
      iframeRef.current.contentWindow.postMessage({ type: 'UV_EXTRACT_TTS' }, '*');
    } else {
      const utter = new SpeechSynthesisUtterance(
        `${activeTab.title}. Active profile is ${activeProfile.name}.`
      );
      utter.onend = () => setIsSpeakingTts(false);
      setIsSpeakingTts(true);
      window.speechSynthesis.speak(utter);
    }
  };

  // Find in Page trigger
  const handleRunFindInPage = (query: string) => {
    setFindQuery(query);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'UV_FIND_IN_PAGE', query },
        '*'
      );
    }
  };

  // Voice Search Handler
  const handleStartVoiceSearch = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec() as {
          lang: string;
          start: () => void;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
        };
        rec.lang = 'en-US';
        rec.onresult = (event) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            navigateActiveTab(transcript);
            setShowVoiceModal(false);
          }
        };
        rec.onerror = () => {
          setShowVoiceModal(true);
        };
        rec.start();
        setShowVoiceModal(true);
        return;
      } catch {
        // fallback to modal
      }
    }
    setShowVoiceModal(true);
  };

  // Trigger Download with simulated progress for Pause/Resume support
  const handleTriggerDownload = (
    title: string,
    url: string,
    format: 'html' | 'markdown' | 'json'
  ) => {
    const cleanName = (title || 'webpage')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    const ext = format === 'markdown' ? 'md' : format;
    const fileName = `${cleanName}_${activeProfile.id}.${ext}`;
    const content =
      format === 'markdown'
        ? `# ${title}\n\nSource: ${url}\nProfile: ${activeProfile.name}\nDownloaded: ${new Date().toISOString()}\n`
        : format === 'json'
          ? JSON.stringify({ title, url, profile: activeProfile.name, timestamp: Date.now() }, null, 2)
          : `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1><p>Saved from <a href="${url}">${url}</a> in profile ${activeProfile.name}</p></body></html>`;

    const sizeBytes = Math.max(4096, content.length * 18);
    const dlId = `dl-${Date.now()}`;

    const newItem: DownloadItem = {
      id: dlId,
      profileId: activeProfile.id,
      fileName,
      url,
      sizeBytes,
      downloadedBytes: Math.round(sizeBytes * 0.25),
      status: 'downloading',
      mimeType:
        format === 'markdown'
          ? 'text/markdown'
          : format === 'json'
            ? 'application/json'
            : 'text/html',
      startedAt: Date.now(),
      localPath: `${activeProfile.downloadLocation}/${fileName}`,
    };

    setDownloads((prev) => [newItem, ...prev]);

    // Trigger real browser file download as well
    const blob = new Blob([content], { type: newItem.mimeType });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(objUrl);

    // Animate progress to completion unless paused
    const interval = setInterval(() => {
      setDownloads((prev) =>
        prev.map((d) => {
          if (d.id !== dlId) return d;
          if (d.status === 'paused') return d;
          const nextBytes = d.downloadedBytes + Math.round(d.sizeBytes * 0.38);
          if (nextBytes >= d.sizeBytes) {
            clearInterval(interval);
            return { ...d, downloadedBytes: d.sizeBytes, status: 'completed' };
          }
          return { ...d, downloadedBytes: nextBytes };
        })
      );
    }, 550);
  };

  const isCurrentPageBookmarked = useMemo(
    () =>
      bookmarks.some(
        (b) => b.profileId === activeProfile.id && b.url === activeTab.url
      ),
    [bookmarks, activeProfile.id, activeTab.url]
  );

  const handleToggleBookmarkCurrent = () => {
    if (isCurrentPageBookmarked) {
      setBookmarks((prev) =>
        prev.filter(
          (b) => !(b.profileId === activeProfile.id && b.url === activeTab.url)
        )
      );
      showToast(`Removed bookmark from ${activeProfile.name}`);
    } else {
      const newBm: BookmarkItem = {
        id: `bm-${Date.now()}`,
        profileId: activeProfile.id,
        title: activeTab.title || activeTab.url,
        url: activeTab.url,
        folder: 'Toolbar',
        createdAt: Date.now(),
      };
      setBookmarks((prev) => [newBm, ...prev]);
      showToast(`Saved bookmark to ${activeProfile.name}`);
    }
  };

  // Build Proxy Iframe URL for external websites
  const proxyIframeUrl = useMemo(() => {
    if (activeTab.url.startsWith('uv://')) return null;
    const params = new URLSearchParams({
      url: activeTab.url,
      profileId: activeProfile.id,
      isPrivate: String(activeTab.isPrivate),
      desktopMode: String(activeTab.desktopMode),
      doNotTrack: String(activeProfile.doNotTrack),
      safeBrowsing: String(activeProfile.safeBrowsing),
      js: String(activeProfile.javaScriptEnabled),
      textScale: String(activeProfile.textScale),
      r: String(reloadNonce),
    });
    return `/api/proxy?${params.toString()}`;
  }, [
    activeTab.url,
    activeTab.isPrivate,
    activeTab.desktopMode,
    activeProfile.id,
    activeProfile.doNotTrack,
    activeProfile.safeBrowsing,
    activeProfile.javaScriptEnabled,
    activeProfile.textScale,
    reloadNonce,
  ]);

  const { host: displayHost, isSecure } = formatDomainDisplay(activeTab.url);
  const openTabCount = isPrivateMode ? profilePrivateTabs.length : profileRegularTabs.length;
  const palette = PROFILE_COLORS[activeProfile.color] || PROFILE_COLORS.blue;

  return (
    <div className="min-h-dvh h-dvh w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <OfflineIndicator />

      {/* ==================================================================== */}
      {/* PRIMARY MOBILE-FIRST BROWSER WORKSPACE                               */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-white dark:bg-slate-950">
        {/* Top Browser Bar (Chrome / Safari Mobile Ergonomic Header) */}
        <header
          className={`shrink-0 border-b transition-colors px-3 py-2 flex items-center gap-2 z-20 ${
            isPrivateMode
              ? 'bg-slate-950 border-slate-800 text-white'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 backdrop-blur-md'
          }`}
        >
          {/* 1. Profile Avatar Switcher Button (Top-Left) */}
          <button
            onClick={() => setActiveScreen('profile-switcher')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative shrink-0"
            title={`Active Profile: ${activeProfile.name} (Tap to switch)`}
          >
            <ProfileAvatar
              avatarId={activeProfile.avatarId}
              customAvatarUrl={activeProfile.customAvatarUrl}
              color={activeProfile.color}
              name={activeProfile.name}
              size="md"
              isPrivate={isPrivateMode}
            />
          </button>

          {/* 2. Combined Search & Address Bar (Omnibox Trigger + Security Lock + Reload + Voice) */}
          <div
            className={`flex-1 min-w-0 min-h-[44px] rounded-2xl border flex items-center px-2.5 gap-1.5 transition-colors ${
              isPrivateMode
                ? 'bg-slate-900 border-slate-700 text-slate-100'
                : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80'
            }`}
          >
            {/* Security Lock Indicator */}
            <button
              onClick={() => setShowSecurityPopover(true)}
              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 shrink-0"
              title="View site security & isolated profile cookies"
            >
              {isPrivateMode ? (
                <Shield className="h-4 w-4 text-sky-400" />
              ) : isSecure ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-amber-500" />
              )}
            </button>

            {/* Address / Search Trigger */}
            <button
              onClick={() => setActiveScreen('omnibox')}
              className="flex-1 min-w-0 text-left py-1 focus:outline-none"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate font-mono">
                  {activeTab.url === 'uv://home'
                    ? `Search ${SEARCH_ENGINES[activeProfile.searchEngine]?.name} or type URL`
                    : displayHost}
                </span>
                {activeTab.desktopMode && (
                  <span className="text-[10px] font-mono text-blue-500 shrink-0">· Desktop</span>
                )}
              </div>
            </button>

            {/* Voice Search Button */}
            <button
              onClick={handleStartVoiceSearch}
              title="Voice search"
              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 shrink-0"
            >
              <Mic className="h-3.5 w-3.5" />
            </button>

            {/* Reload Button */}
            <button
              onClick={handleReload}
              title="Reload page"
              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 shrink-0"
            >
              <RotateCw className={`h-3.5 w-3.5 ${activeTab.isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>

          {/* 3. Tab Counter Button */}
          <button
            onClick={() => setActiveScreen('tabs')}
            title="Switch or manage open tabs"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <span
              className={`h-6 min-w-[24px] px-1.5 rounded-lg border-2 text-xs font-bold font-mono tabular-nums flex items-center justify-center ${
                isPrivateMode
                  ? 'border-sky-400 text-sky-400'
                  : 'border-slate-700 dark:border-slate-200 text-slate-800 dark:text-slate-100'
              }`}
            >
              {openTabCount}
            </span>
          </button>

          {/* 4. Three-Dot Contextual Menu Button */}
          <button
            onClick={() => setShowThreeDotMenu(true)}
            title="Browser menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {/* Desktop Inspector Drawer Toggle (Visible on lg:) */}
          <button
            onClick={() => setDesktopInspectorOpen((v) => !v)}
            className="hidden lg:flex min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Toggle Multi-Profile Isolation Dock"
          >
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            <span>{desktopInspectorOpen ? 'Hide Dock' : 'Profile Dock'}</span>
          </button>
        </header>

        {/* Loading Progress Strip */}
        {activeTab.isLoading && (
          <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
            <div className="h-full w-2/3 bg-blue-600 animate-pulse" />
          </div>
        )}

        {/* Find in Page Bar */}
        {showFindBar && (
          <div className="px-4 py-2 bg-slate-900 text-white border-b border-slate-800 flex items-center gap-2 shrink-0 z-20">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={findQuery}
              onChange={(e) => handleRunFindInPage(e.target.value)}
              placeholder="Find text on webpage..."
              className="flex-1 bg-transparent text-xs text-white focus:outline-none"
            />
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {findStats.current}/{findStats.total}
            </span>
            <button
              onClick={() =>
                iframeRef.current?.contentWindow?.postMessage(
                  { type: 'UV_FIND_NEXT', direction: 'prev' },
                  '*'
                )
              }
              className="p-1 rounded hover:bg-slate-800"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                iframeRef.current?.contentWindow?.postMessage(
                  { type: 'UV_FIND_NEXT', direction: 'next' },
                  '*'
                )
              }
              className="p-1 rounded hover:bg-slate-800"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowFindBar(false);
                iframeRef.current?.contentWindow?.postMessage({ type: 'UV_FIND_CLEAR' }, '*');
              }}
              className="p-1 rounded hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Browser Viewport Content */}
        <main className="flex-1 overflow-y-auto relative">
          {readerData ? (
            <ReaderAndTranslateView
              article={readerData}
              isSpeaking={isSpeakingTts}
              onClose={() => setReaderData(null)}
              onToggleSpeak={handleToggleTts}
            />
          ) : activeTab.isSuspended ? (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div className="max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3 shadow-lg">
                <PauseCircle className="h-10 w-10 text-amber-500 mx-auto" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Background Tab Hibernated
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>{activeTab.title}</strong> was suspended to conserve memory and battery for{' '}
                  {activeProfile.name}.
                </p>
                <button
                  onClick={() =>
                    setTabs((prev) =>
                      prev.map((t) =>
                        t.id === activeTab.id ? { ...t, isSuspended: false } : t
                      )
                    )
                  }
                  className="w-full min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Wake &amp; Restore Tab
                </button>
              </div>
            </div>
          ) : activeTab.url === 'uv://home' ? (
            <NewTabHome
              activeProfile={activeProfile}
              isPrivate={isPrivateMode}
              privateTabCount={profilePrivateTabs.length}
              shortcuts={shortcuts}
              bookmarks={bookmarks}
              history={history}
              onNavigate={navigateActiveTab}
              onOpenOmnibox={() => setActiveScreen('omnibox')}
              onOpenVoiceSearch={handleStartVoiceSearch}
              onOpenQrScanner={() => setActiveScreen('qr-scanner')}
              onChangeSearchEngine={(eng) =>
                setProfiles((prev) =>
                  prev.map((p) => (p.id === activeProfile.id ? { ...p, searchEngine: eng } : p))
                )
              }
              onAddShortcut={(title, url) =>
                setShortcuts((prev) => [
                  ...prev,
                  {
                    id: `sc-${Date.now()}`,
                    profileId: activeProfile.id,
                    title,
                    url: resolveInputToUrl(url, activeProfile.searchEngine),
                  },
                ])
              }
              onDeleteShortcut={(id) =>
                setShortcuts((prev) => prev.filter((s) => s.id !== id))
              }
              onCloseAllPrivateTabs={() => handleCloseAllTabs(true)}
              onOpenHomepageSettings={() => setActiveScreen('settings-homepage')}
              onOpenProfileSwitcher={() => setActiveScreen('profile-switcher')}
            />
          ) : activeTab.url.startsWith('uv://') ? (
            <InternalPageView
              url={activeTab.url}
              activeProfile={activeProfile}
              allProfiles={profiles}
              isPrivate={isPrivateMode}
              permissions={permissions}
              onNavigate={navigateActiveTab}
              onSwitchProfile={handleSwitchProfile}
              onOpenPrivateTab={(url) => handleNewTab(true, url)}
              onOpenScreen={(scr) => setActiveScreen(scr)}
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`${activeTab.id}-${activeProfile.id}-${reloadNonce}`}
              src={proxyIframeUrl || 'about:blank'}
              title={activeTab.title || 'Webpage Content'}
              className="w-full h-full border-0 bg-white"
              onLoad={() =>
                setTabs((prev) =>
                  prev.map((t) =>
                    t.id === activeTab.id ? { ...t, isLoading: false } : t
                  )
                )
              }
            />
          )}

          {/* Floating Picture-in-Picture (PiP) Video Mini-Player */}
          {showPipPlayer && (
            <div className="fixed bottom-20 right-4 z-40 w-72 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden text-white">
              <div className="px-3 py-1.5 bg-slate-900 flex items-center justify-between text-[11px] font-medium">
                <span>PiP Media Stream · {activeProfile.name}</span>
                <button
                  onClick={() => setShowPipPlayer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <video
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-40 bg-black object-cover"
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              />
            </div>
          )}

          {/* Toast Feedback Banner */}
          {toastMessage && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 rounded-2xl bg-slate-900/95 border border-slate-700 px-4 py-2.5 text-xs font-medium text-white shadow-xl flex items-center gap-2 whitespace-nowrap">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </main>

        {/* Bottom Thumb-Friendly Navigation Bar (Back, Forward, Home, Tabs, Menu) */}
        <nav
          aria-label="Bottom browser navigation"
          className={`shrink-0 border-t px-2 py-1 grid grid-cols-5 items-center z-20 ${
            isPrivateMode
              ? 'bg-slate-950 border-slate-800 text-slate-200'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800 backdrop-blur-md'
          }`}
        >
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl disabled:opacity-35 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[10px] font-medium">Back</span>
          </button>

          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl disabled:opacity-35 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
            <span className="text-[10px] font-medium">Forward</span>
          </button>

          <button
            onClick={() => navigateActiveTab(activeProfile.homepage || 'uv://home')}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveScreen('tabs')}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Layers className="h-5 w-5" />
            <span className="text-[10px] font-medium tabular-nums">Tabs ({openTabCount})</span>
          </button>

          <button
            onClick={() => setShowThreeDotMenu(true)}
            className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </nav>
      </div>

      {/* ==================================================================== */}
      {/* DESKTOP MULTI-PROFILE COMMAND & ISOLATION DOCK (Visible on lg:)      */}
      {/* ==================================================================== */}
      {desktopInspectorOpen && (
        <aside className="hidden lg:flex w-88 shrink-0 flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 h-full overflow-y-auto p-4 space-y-5">
          {/* App Identity & PWA Install */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Unlimited Virtual
              </div>
              <div className="text-[11px] text-slate-500">
                Multi-Profile Browser Studio
              </div>
            </div>
            <PWAInstallButton compact />
          </div>

          {/* Fast Profile Switcher Dock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Isolated Profiles ({profiles.length})
              </span>
              <button
                onClick={() => setActiveScreen('create-profile')}
                className="text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Profile</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {profiles.map((prof) => {
                const isCurrent = !isPrivateMode && prof.id === activeProfile.id;
                const profTabCount = tabs.filter(
                  (t) => !t.isPrivate && t.profileId === prof.id
                ).length;
                return (
                  <button
                    key={prof.id}
                    onClick={() => {
                      if (prof.pinCode && prof.id !== activeProfile.id) {
                        setActiveScreen('profile-switcher');
                      } else {
                        handleSwitchProfile(prof.id);
                      }
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-white dark:bg-slate-800 border-blue-500/50 shadow-xs'
                        : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProfileAvatar
                        avatarId={prof.avatarId}
                        customAvatarUrl={prof.customAvatarUrl}
                        color={prof.color}
                        name={prof.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {prof.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          app_webview_{prof.id}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                      {profTabCount} tabs
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  if (profilePrivateTabs.length === 0) {
                    handleNewTab(true);
                  } else {
                    setIsPrivateMode(true);
                  }
                }}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-colors ${
                  isPrivateMode
                    ? 'bg-slate-950 border-sky-500/50 text-white'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Private Browsing</div>
                    <div className="text-[10px] text-slate-400 font-mono">RAM-only Cookie Jar</div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-sky-400 tabular-nums">
                  {profilePrivateTabs.length} tabs
                </span>
              </button>
            </div>
          </div>

          {/* Open Tabs in Active Profile */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {isPrivateMode ? 'Private Tabs' : `${activeProfile.name} Open Tabs`}
              </span>
              <button
                onClick={() => handleNewTab(isPrivateMode)}
                className="text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tab</span>
              </button>
            </div>

            <div className="space-y-1">
              {(isPrivateMode ? profilePrivateTabs : profileRegularTabs).map((t) => {
                const active = t.id === activeTab.id;
                return (
                  <div
                    key={t.id}
                    className={`group rounded-xl px-2.5 py-2 flex items-center justify-between gap-2 text-xs transition-colors ${
                      active
                        ? `${palette.softBg} ${palette.text} font-semibold`
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (t.isPrivate) {
                          setIsPrivateMode(true);
                          setActivePrivateTabId(t.id);
                        } else {
                          setIsPrivateMode(false);
                          setActiveTabByProfile((prev) => ({
                            ...prev,
                            [activeProfile.id]: t.id,
                          }));
                        }
                      }}
                      className="flex-1 text-left truncate"
                    >
                      {t.title}
                    </button>
                    <button
                      onClick={() => handleCloseTab(t.id)}
                      className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification & Architecture Quick Links */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Verification &amp; Native Blueprints
            </div>
            <button
              onClick={() => navigateActiveTab('uv://auth-lab')}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-left flex items-center justify-between hover:border-blue-500/40"
            >
              <span>Session &amp; Cookie Isolation Lab</span>
              <Shield className="h-3.5 w-3.5 text-blue-500" />
            </button>
            <button
              onClick={() => navigateActiveTab('uv://diagnostics')}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-left flex items-center justify-between hover:border-blue-500/40"
            >
              <span>Profile Cookie &amp; Storage Inspector</span>
              <Database className="h-3.5 w-3.5 text-emerald-500" />
            </button>
            <button
              onClick={() => navigateActiveTab('uv://architecture')}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-left flex items-center justify-between hover:border-blue-500/40"
            >
              <span>Kotlin Android APK Blueprint</span>
              <Smartphone className="h-3.5 w-3.5 text-violet-500" />
            </button>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/* CONNECTED SCREENS & MODAL OVERLAYS                                   */}
      {/* ==================================================================== */}

      {showOnboarding && (
        <OnboardingModal
          activeProfile={activeProfile}
          onUpdateProfile={(updated) =>
            setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {activeScreen === 'omnibox' && (
        <OmniboxOverlay
          activeProfile={activeProfile}
          initialValue={activeTab.url}
          tabs={tabs}
          bookmarks={bookmarks}
          history={history}
          onClose={() => setActiveScreen('browser')}
          onNavigate={navigateActiveTab}
          onSwitchToTab={(tabId) => {
            setIsPrivateMode(false);
            setActiveTabByProfile((prev) => ({ ...prev, [activeProfile.id]: tabId }));
          }}
          onChangeEngine={(eng: SearchEngineId) =>
            setProfiles((prev) =>
              prev.map((p) => (p.id === activeProfile.id ? { ...p, searchEngine: eng } : p))
            )
          }
          onOpenVoiceSearch={handleStartVoiceSearch}
          onOpenQrScanner={() => setActiveScreen('qr-scanner')}
        />
      )}

      {(activeScreen === 'profile-switcher' ||
        activeScreen === 'create-profile' ||
        activeScreen === 'edit-profile' ||
        activeScreen === 'profile-management') && (
        <ProfileModals
          screen={activeScreen}
          profiles={profiles}
          activeProfile={activeProfile}
          editingProfileId={editingProfileId}
          isPrivate={isPrivateMode}
          tabs={tabs}
          bookmarks={bookmarks}
          history={history}
          onClose={() => setActiveScreen('browser')}
          onNavigateScreen={(scr, editId) => {
            if (editId) setEditingProfileId(editId);
            setActiveScreen(scr);
          }}
          onSwitchProfile={handleSwitchProfile}
          onEnterPrivateMode={() => {
            if (profilePrivateTabs.length === 0) {
              handleNewTab(true);
            } else {
              setIsPrivateMode(true);
            }
          }}
          onCreateProfile={(data) => {
            const newId = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()
              .toString(36)
              .slice(-4)}`;
            const created: BrowserProfile = {
              ...data,
              id: newId,
              createdAt: Date.now(),
            };
            const firstTab: BrowserTab = {
              id: `tab-${newId}-1`,
              profileId: newId,
              isPrivate: false,
              url: created.homepage || 'uv://home',
              title: `New Tab — ${created.name}`,
              category: 'General',
              historyStack: [created.homepage || 'uv://home'],
              historyIndex: 0,
              isLoading: false,
              isSuspended: false,
              desktopMode: created.desktopSiteDefault,
              readerMode: false,
              lastAccessedAt: Date.now(),
            };
            setProfiles((prev) => [...prev, created]);
            setTabs((prev) => [...prev, firstTab]);
            setActiveTabByProfile((prev) => ({ ...prev, [newId]: firstTab.id }));
            setActiveProfileId(newId);
            setIsPrivateMode(false);
            showToast(`Created isolated profile "${created.name}"`);
          }}
          onUpdateProfile={(updated) => {
            setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            showToast(`Updated profile "${updated.name}"`);
          }}
          onDeleteProfile={(delId) => {
            if (profiles.length <= 1) return;
            handleClearProfileData(delId);
            const remaining = profiles.filter((p) => p.id !== delId);
            setProfiles(remaining);
            setTabs((prev) => prev.filter((t) => t.profileId !== delId));
            setBookmarks((prev) => prev.filter((b) => b.profileId !== delId));
            setShortcuts((prev) => prev.filter((s) => s.profileId !== delId));
            if (activeProfileId === delId) {
              setActiveProfileId(remaining[0].id);
            }
            showToast('Deleted profile and purged its isolated data directory');
          }}
          onClearProfileData={(profId) => handleClearProfileData(profId)}
          onSetDefaultProfile={(profId) => {
            setProfiles((prev) =>
              prev.map((p) => ({ ...p, isDefault: p.id === profId }))
            );
            showToast('Updated default startup profile');
          }}
        />
      )}

      {activeScreen === 'tabs' && (
        <TabSwitcherModal
          activeProfile={activeProfile}
          isPrivateMode={isPrivateMode}
          tabs={tabs}
          activeTabId={activeTab.id}
          closedTabs={closedTabs}
          onClose={() => setActiveScreen('browser')}
          onSelectTab={(tabId, isPriv) => {
            setIsPrivateMode(isPriv);
            if (isPriv) {
              setActivePrivateTabId(tabId);
            } else {
              setActiveTabByProfile((prev) => ({ ...prev, [activeProfile.id]: tabId }));
            }
          }}
          onNewTab={(isPriv) => handleNewTab(isPriv)}
          onCloseTab={handleCloseTab}
          onCloseAllTabs={handleCloseAllTabs}
          onDuplicateTab={handleDuplicateTab}
          onToggleSuspendTab={(tabId) =>
            setTabs((prev) =>
              prev.map((t) =>
                t.id === tabId ? { ...t, isSuspended: !t.isSuspended } : t
              )
            )
          }
          onSuspendAllInactive={() => {
            setTabs((prev) =>
              prev.map((t) =>
                t.profileId === activeProfile.id && !t.isPrivate && t.id !== activeTab.id
                  ? { ...t, isSuspended: true }
                  : t
              )
            );
            showToast('Hibernated background tabs to conserve RAM');
          }}
          onChangeTabCategory={(tabId, category) =>
            setTabs((prev) =>
              prev.map((t) => (t.id === tabId ? { ...t, category } : t))
            )
          }
          onReopenClosedTab={handleReopenClosedTab}
          onSwitchMode={(isPriv) => setIsPrivateMode(isPriv)}
        />
      )}

      {(activeScreen === 'bookmarks' ||
        activeScreen === 'history' ||
        activeScreen === 'downloads') && (
        <LibraryModals
          screen={activeScreen}
          activeProfile={activeProfile}
          currentTabTitle={activeTab.title}
          currentTabUrl={activeTab.url}
          bookmarks={bookmarks}
          history={history}
          closedTabs={closedTabs}
          downloads={downloads}
          onClose={() => setActiveScreen('browser')}
          onNavigateToUrl={navigateActiveTab}
          onAddBookmark={(title, url, folder) => {
            setBookmarks((prev) => [
              {
                id: `bm-${Date.now()}`,
                profileId: activeProfile.id,
                title,
                url,
                folder,
                createdAt: Date.now(),
              },
              ...prev,
            ]);
            showToast(`Bookmark saved to ${activeProfile.name}`);
          }}
          onUpdateBookmark={(id, title, url, folder) => {
            setBookmarks((prev) =>
              prev.map((b) => (b.id === id ? { ...b, title, url, folder } : b))
            );
          }}
          onDeleteBookmark={(id) =>
            setBookmarks((prev) => prev.filter((b) => b.id !== id))
          }
          onImportBookmarks={(items) => {
            const imported: BookmarkItem[] = items
              .filter((it) => it && it.title && it.url)
              .map((it, idx) => ({
                id: `bm-imp-${Date.now()}-${idx}`,
                profileId: activeProfile.id,
                title: String(it.title),
                url: String(it.url),
                folder: String(it.folder || 'Imported'),
                createdAt: Date.now(),
              }));
            setBookmarks((prev) => [...imported, ...prev]);
            showToast(`Imported ${imported.length} bookmarks into ${activeProfile.name}`);
          }}
          onDeleteHistoryItem={(id) =>
            setHistory((prev) => prev.filter((h) => h.id !== id))
          }
          onClearHistoryRange={(range) => {
            const now = Date.now();
            const cutoff =
              range === 'hour'
                ? now - 3600000
                : range === 'day'
                  ? now - 86400000
                  : range === 'week'
                    ? now - 86400000 * 7
                    : 0;
            setHistory((prev) =>
              prev.filter(
                (h) =>
                  h.profileId !== activeProfile.id ||
                  (cutoff > 0 && h.visitedAt < cutoff)
              )
            );
            showToast(`Cleared ${range} history for ${activeProfile.name}`);
          }}
          onReopenClosedTab={handleReopenClosedTab}
          onTriggerDownload={handleTriggerDownload}
          onTogglePauseDownload={(id) =>
            setDownloads((prev) =>
              prev.map((d) =>
                d.id === id
                  ? { ...d, status: d.status === 'paused' ? 'downloading' : 'paused' }
                  : d
              )
            )
          }
          onDeleteDownload={(id) =>
            setDownloads((prev) => prev.filter((d) => d.id !== id))
          }
        />
      )}

      {(activeScreen === 'settings' ||
        activeScreen === 'settings-privacy' ||
        activeScreen === 'settings-search' ||
        activeScreen === 'settings-homepage' ||
        activeScreen === 'settings-permissions' ||
        activeScreen === 'about-architecture' ||
        activeScreen === 'private-info') && (
        <SettingsModals
          screen={activeScreen}
          activeProfile={activeProfile}
          allProfiles={profiles}
          permissions={permissions}
          onClose={() => setActiveScreen('browser')}
          onNavigateScreen={(scr) => setActiveScreen(scr)}
          onUpdateProfile={(updated) =>
            setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          }
          onClearProfileData={handleClearProfileData}
          onUpdatePermission={(entry) =>
            setPermissions((prev) => prev.map((p) => (p.id === entry.id ? entry : p)))
          }
          onAddPermissionOrigin={(origin) =>
            setPermissions((prev) => [
              ...prev,
              {
                id: `perm-${Date.now()}`,
                profileId: activeProfile.id,
                origin,
                camera: 'ask',
                microphone: 'ask',
                location: 'ask',
                notifications: 'ask',
                popups: 'block',
                javascript: 'allow',
              },
            ])
          }
          onDeletePermission={(id) =>
            setPermissions((prev) => prev.filter((p) => p.id !== id))
          }
          onExportFullBackup={() => {
            const json = window.localStorage.getItem(STORAGE_KEY) || '{}';
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `uv-browser-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onImportFullBackup={(jsonText) => {
            try {
              const parsed = JSON.parse(jsonText) as Partial<PersistedState>;
              if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
                setProfiles(parsed.profiles);
                if (Array.isArray(parsed.tabs)) setTabs(parsed.tabs);
                if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
                if (Array.isArray(parsed.history)) setHistory(parsed.history);
              }
            } catch {
              // ignore invalid backup
            }
          }}
          onReplayOnboarding={() => setShowOnboarding(true)}
          onNavigateUrl={navigateActiveTab}
        />
      )}

      {activeScreen === 'qr-scanner' && (
        <QrScannerModal
          onClose={() => setActiveScreen('browser')}
          onScanUrl={navigateActiveTab}
        />
      )}

      {showThreeDotMenu && (
        <ThreeDotMenuSheet
          activeProfile={activeProfile}
          activeTab={activeTab}
          isBookmarked={isCurrentPageBookmarked}
          isSpeakingTts={isSpeakingTts}
          onClose={() => setShowThreeDotMenu(false)}
          onNewTab={(isPriv) => handleNewTab(isPriv)}
          onOpenScreen={(scr) => setActiveScreen(scr)}
          onToggleBookmarkCurrent={handleToggleBookmarkCurrent}
          onToggleDesktopSite={() => {
            setTabs((prev) =>
              prev.map((t) =>
                t.id === activeTab.id ? { ...t, desktopMode: !t.desktopMode } : t
              )
            );
            setReloadNonce((n) => n + 1);
            showToast(
              !activeTab.desktopMode
                ? 'Switched to Desktop Site User-Agent'
                : 'Switched to Mobile Android User-Agent'
            );
          }}
          onToggleReaderMode={handleToggleReaderMode}
          onOpenFindInPage={() => setShowFindBar(true)}
          onOpenTranslate={handleToggleReaderMode}
          onToggleTts={handleToggleTts}
          onTogglePip={() => setShowPipPlayer((v) => !v)}
          onShareOrCopyUrl={() => {
            if (navigator.share) {
              navigator
                .share({ title: activeTab.title, url: activeTab.url })
                .catch(() => {});
            } else {
              navigator.clipboard.writeText(activeTab.url);
              showToast('Copied page URL to clipboard');
            }
          }}
        />
      )}

      {showSecurityPopover && (
        <SecurityLockPopover
          url={activeTab.url}
          activeProfile={activeProfile}
          isPrivate={isPrivateMode}
          onClose={() => setShowSecurityPopover(false)}
          onOpenPermissions={() => setActiveScreen('settings-permissions')}
          onNavigateDiagnostics={() => navigateActiveTab('uv://diagnostics')}
        />
      )}

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="h-14 w-14 rounded-full bg-blue-600/15 text-blue-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Mic className="h-7 w-7 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Voice Search ({SEARCH_ENGINES[activeProfile.searchEngine]?.name})
            </h3>
            <p className="text-xs text-slate-500">
              Speak your search query or enter a voice phrase below:
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (voiceTranscript.trim()) {
                  navigateActiveTab(voiceTranscript.trim());
                  setVoiceTranscript('');
                  setShowVoiceModal(false);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                autoFocus
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="e.g. Wikipedia mobile browser..."
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(false)}
                  className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[40px] rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Search Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
