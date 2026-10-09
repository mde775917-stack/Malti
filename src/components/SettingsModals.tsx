import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Database,
  Download,
  FileDown,
  Globe,
  HelpCircle,
  Lock,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Sliders,
  Smartphone,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  ActiveScreen,
  BrowserProfile,
  LayoutDensity,
  PermissionValue,
  ProfileColorId,
  SearchEngineId,
  SitePermissionEntry,
  ThemeMode,
  WallpaperId,
} from '../types/browser';
import {
  ANDROID_NATIVE_BLUEPRINT,
  PROFILE_COLORS,
  SEARCH_ENGINES,
  WALLPAPER_PRESETS,
} from '../data/defaults';
import { PWAInstallButton } from '../hooks/usePWAInstall';

interface SettingsModalsProps {
  screen:
    | 'settings'
    | 'settings-privacy'
    | 'settings-search'
    | 'settings-homepage'
    | 'settings-permissions'
    | 'about-architecture'
    | 'private-info';
  activeProfile: BrowserProfile;
  allProfiles: BrowserProfile[];
  permissions: SitePermissionEntry[];
  onClose: () => void;
  onNavigateScreen: (screen: ActiveScreen) => void;
  onUpdateProfile: (updated: BrowserProfile) => void;
  onClearProfileData: (profileId: string, options?: { history?: boolean; cookies?: boolean; cache?: boolean }) => void;
  onUpdatePermission: (entry: SitePermissionEntry) => void;
  onAddPermissionOrigin: (origin: string) => void;
  onDeletePermission: (id: string) => void;
  onExportFullBackup: () => void;
  onImportFullBackup: (jsonText: string) => void;
  onReplayOnboarding: () => void;
  onNavigateUrl: (url: string) => void;
}

export const SettingsModals: React.FC<SettingsModalsProps> = ({
  screen,
  activeProfile,
  allProfiles,
  permissions,
  onClose,
  onNavigateScreen,
  onUpdateProfile,
  onClearProfileData,
  onUpdatePermission,
  onAddPermissionOrigin,
  onDeletePermission,
  onExportFullBackup,
  onImportFullBackup,
  onReplayOnboarding,
  onNavigateUrl,
}) => {
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [newOriginInput, setNewOriginInput] = useState('https://');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateProfile({
          ...activeProfile,
          wallpaper: 'custom',
          customWallpaperUrl: reader.result,
        });
        notify('Custom wallpaper applied to profile.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackupImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportFullBackup(reader.result);
        notify('Browser profiles and tabs restored from backup.');
      }
    };
    reader.readAsText(file);
  };

  // Subscreen Header helper
  const renderHeader = (title: string, subtitle: string, backTarget?: ActiveScreen) => (
    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        {backTarget && (
          <button
            onClick={() => onNavigateScreen(backTarget)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  // 1. Privacy & Security Settings Subscreen
  if (screen === 'settings-privacy' || screen === 'private-info') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {renderHeader(
            'Privacy & Security Settings',
            `Scoped to ${activeProfile.name} (${activeProfile.id})`,
            'settings'
          )}

          {statusToast && (
            <div className="mx-5 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              {statusToast}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Clear Browsing Data Controls */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Clear {activeProfile.name} Browsing Data
              </h3>
              <p className="text-xs text-slate-500">
                Clearing data here affects only <strong>{activeProfile.name}</strong>. Other profiles remain untouched.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onClearProfileData(activeProfile.id, { history: true, cookies: false, cache: false });
                    notify(`Cleared browsing history for ${activeProfile.name}.`);
                  }}
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Clear History Only
                </button>
                <button
                  onClick={() => {
                    onClearProfileData(activeProfile.id, { history: false, cookies: true, cache: false });
                    notify(`Cleared isolated cookie jar for ${activeProfile.name}.`);
                  }}
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Clear Cookies &amp; Sessions
                </button>
                <button
                  onClick={() => {
                    onClearProfileData(activeProfile.id, { history: true, cookies: true, cache: true });
                    notify(`Purged all history, cookies, and cache for ${activeProfile.name}.`);
                  }}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                >
                  Clear All Profile Data
                </button>
              </div>
            </div>

            {/* Security Toggles */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <label className="p-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Safe Browsing Protection
                  </div>
                  <div className="text-xs text-slate-500">
                    Block known deceptive, phishing, and malware demonstration domains
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.safeBrowsing}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, safeBrowsing: e.target.checked })
                  }
                  className="h-5 w-5 accent-blue-600 rounded"
                />
              </label>

              <label className="p-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Send &ldquo;Do Not Track&rdquo; &amp; Global Privacy Control
                  </div>
                  <div className="text-xs text-slate-500">
                    Attach <code>DNT: 1</code> and <code>Sec-GPC: 1</code> headers to outbound proxy requests
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.doNotTrack}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, doNotTrack: e.target.checked })
                  }
                  className="h-5 w-5 accent-blue-600 rounded"
                />
              </label>

              <label className="p-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Block Pop-ups and Unsolicited Redirects
                  </div>
                  <div className="text-xs text-slate-500">
                    Prevent sites from automatically opening background windows
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.blockPopups}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, blockPopups: e.target.checked })
                  }
                  className="h-5 w-5 accent-blue-600 rounded"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => onNavigateScreen('settings-permissions')}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
              >
                Open Website Permissions Manager
              </button>
              <button
                onClick={() => {
                  onNavigateUrl('uv://diagnostics');
                  onClose();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Inspect Live Profile Cookie Jar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Search Engine Settings Subscreen
  if (screen === 'settings-search') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {renderHeader(
            `Search Engine · ${activeProfile.name}`,
            'Each profile maintains its own default search provider',
            'settings'
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="space-y-2">
              {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((id) => {
                const eng = SEARCH_ENGINES[id];
                const isSelected = activeProfile.searchEngine === id;
                return (
                  <button
                    key={id}
                    onClick={() => onUpdateProfile({ ...activeProfile, searchEngine: id })}
                    className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {eng.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 truncate max-w-sm">
                        {id === 'custom' ? activeProfile.customSearchUrl : eng.searchUrlTemplate}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {activeProfile.searchEngine === 'custom' && (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Search URL Template (use <code>%s</code> for query)
                </label>
                <input
                  type="text"
                  value={activeProfile.customSearchUrl}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, customSearchUrl: e.target.value })
                  }
                  placeholder="https://example.com/search?q=%s"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Homepage & Appearance Customization Subscreen
  if (screen === 'settings-homepage') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {renderHeader(
            `Homepage & Appearance · ${activeProfile.name}`,
            'Customize theme, wallpaper, density, and homepage sections',
            'settings'
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Theme & Layout Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme Mode
                </label>
                <select
                  value={activeProfile.theme}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, theme: e.target.value as ThemeMode })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
                >
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Toolbar &amp; Layout Density
                </label>
                <select
                  value={activeProfile.layoutDensity}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...activeProfile,
                      layoutDensity: e.target.value as LayoutDensity,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
                >
                  <option value="comfortable">Comfortable (Thumb Ergonomic)</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>

            {/* Wallpaper Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Homepage Surface Wallpaper
                </label>
                <label className="text-xs font-medium text-blue-600 dark:text-sky-400 cursor-pointer hover:underline flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Custom Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWallpaperUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(WALLPAPER_PRESETS) as Array<Exclude<WallpaperId, 'custom'>>).map(
                  (wpKey) => {
                    const wp = WALLPAPER_PRESETS[wpKey];
                    const selected = activeProfile.wallpaper === wpKey;
                    return (
                      <button
                        key={wpKey}
                        onClick={() => onUpdateProfile({ ...activeProfile, wallpaper: wpKey })}
                        className={`min-h-[54px] p-3 rounded-xl border text-left flex items-center justify-between ${
                          selected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {wp.name}
                        </span>
                        {selected && <Check className="h-3.5 w-3.5 text-blue-500" />}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Custom Homepage URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Homepage Address
              </label>
              <input
                type="text"
                value={activeProfile.homepage}
                onChange={(e) => onUpdateProfile({ ...activeProfile, homepage: e.target.value })}
                placeholder="uv://home or https://..."
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            {/* Section Visibility Toggles */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <label className="p-3.5 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Show Custom Website Shortcuts (Speed Dial)
                </span>
                <input
                  type="checkbox"
                  checked={activeProfile.showShortcuts}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, showShortcuts: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
              <label className="p-3.5 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Show Frequently &amp; Recently Visited Sites
                </span>
                <input
                  type="checkbox"
                  checked={activeProfile.showFrequent}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, showFrequent: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
              <label className="p-3.5 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Show Pinned Profile Bookmarks on Homepage
                </span>
                <input
                  type="checkbox"
                  checked={activeProfile.showBookmarksOnHome}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, showBookmarksOnHome: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
              <label className="p-3.5 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Show Discovery &amp; Architecture Feed
                </span>
                <input
                  type="checkbox"
                  checked={activeProfile.showDiscoveryFeed}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, showDiscoveryFeed: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Website Permissions Manager Subscreen
  if (screen === 'settings-permissions') {
    const profilePerms = permissions.filter((p) => p.profileId === activeProfile.id);

    const handleAddSite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newOriginInput.trim()) return;
      onAddPermissionOrigin(newOriginInput.trim());
      setNewOriginInput('https://');
    };

    const cyclePerm = (val: PermissionValue): PermissionValue => {
      if (val === 'ask') return 'allow';
      if (val === 'allow') return 'block';
      return 'ask';
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {renderHeader(
            `Website Permissions · ${activeProfile.name}`,
            'Sensitive permissions are never automatically granted without explicit rule',
            'settings'
          )}

          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <form onSubmit={handleAddSite} className="flex gap-2">
              <input
                type="text"
                value={newOriginInput}
                onChange={(e) => setNewOriginInput(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Add Site Exception
              </button>
            </form>

            <div className="space-y-3">
              {profilePerms.map((perm) => (
                <div
                  key={perm.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {perm.origin}
                    </span>
                    <button
                      onClick={() => onDeletePermission(perm.id)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(
                      ['camera', 'microphone', 'location', 'notifications', 'popups', 'javascript'] as const
                    ).map((key) => {
                      const val = perm[key];
                      return (
                        <button
                          key={key}
                          onClick={() =>
                            onUpdatePermission({ ...perm, [key]: cyclePerm(val) })
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                        >
                          <span className="capitalize text-slate-600 dark:text-slate-300">
                            {key}
                          </span>
                          <span
                            className={`font-semibold uppercase text-[10px] ${
                              val === 'allow'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : val === 'block'
                                  ? 'text-rose-500'
                                  : 'text-amber-500'
                            }`}
                          >
                            {val}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. About Browser & Native Android APK Architecture Screen
  if (screen === 'about-architecture') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
        <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {renderHeader(
            'About Browser & Native Android APK Blueprint',
            'Architecture transparency, implemented subsystems, and Kotlin WebView ProfileStore guide',
            'settings'
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Unlimited Virtual Mobile Browser
              </div>
              <p>
                Built with a dual-engine architecture: a real <strong>Server-Side Profile-Isolated HTTP/HTTPS Rendering Proxy</strong> for instant live web browsing and cookie verification in the cloud preview, plus a complete <strong>Kotlin Jetpack Compose + AndroidX WebKit 1.12 (`ProfileStore`)</strong> native Android implementation blueprint.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <PWAInstallButton compact />
                <button
                  onClick={() => {
                    onNavigateUrl('uv://architecture');
                    onClose();
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold"
                >
                  Open Full Architecture Page (uv://architecture)
                </button>
                <button
                  onClick={() => {
                    onReplayOnboarding();
                    onClose();
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                >
                  Replay First-Launch Onboarding
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Native Android Multi-Profile WebView Engine (Kotlin)
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ANDROID_NATIVE_BLUEPRINT.profileEngineKt);
                    setCopiedKey('kt');
                    setTimeout(() => setCopiedKey(null), 2000);
                  }}
                  className="text-xs text-blue-600 dark:text-sky-400 flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey === 'kt' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                {ANDROID_NATIVE_BLUEPRINT.profileEngineKt}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Main Browser Settings Hub ('settings')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {renderHeader(
          'Browser Settings',
          `Active Profile: ${activeProfile.name} · ${allProfiles.length} Isolated Profiles`
        )}

        {statusToast && (
          <div className="mx-5 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">
            {statusToast}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Navigation Cards to Dedicated Settings Subscreens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateScreen('profile-management')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Profiles &amp; Isolation
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Manage {allProfiles.length} profiles, PIN locks, and startup defaults
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateScreen('settings-search')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Search className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Search Engine
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Current: {SEARCH_ENGINES[activeProfile.searchEngine]?.name}
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateScreen('settings-privacy')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Privacy &amp; Security
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Clear profile cookies, Safe Browsing, Do Not Track
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateScreen('settings-homepage')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Palette className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Appearance &amp; Homepage
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Theme ({activeProfile.theme}), wallpapers, speed dial
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateScreen('settings-permissions')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Website Permissions
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Camera, microphone, location, notifications per origin
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigateScreen('about-architecture')}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-start gap-3.5 transition-colors"
            >
              <Smartphone className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  About &amp; Android APK Blueprint
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Kotlin Jetpack Compose + WebView ProfileStore source
                </div>
              </div>
            </button>
          </div>

          {/* Advanced Engine Controls */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-500" />
              <span>Advanced Rendering Engine Settings ({activeProfile.name})</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Webpage Text Scaling ({activeProfile.textScale}%)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Adjusts rendered font size inside proxied websites
                  </div>
                </div>
                <input
                  type="range"
                  min={80}
                  max={150}
                  step={5}
                  value={activeProfile.textScale}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, textScale: Number(e.target.value) })
                  }
                  className="w-32 accent-blue-600"
                />
              </div>

              <label className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Enable JavaScript Execution
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Allow interactive scripts on websites in this profile
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.javaScriptEnabled}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, javaScriptEnabled: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Default to Desktop User-Agent
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Request desktop websites instead of mobile layouts by default
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.desktopSiteDefault}
                  onChange={(e) =>
                    onUpdateProfile({ ...activeProfile, desktopSiteDefault: e.target.checked })
                  }
                  className="h-4 w-4 accent-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Browser Data Backup & Restore */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Multi-Profile Data Backup &amp; Restore
              </div>
              <div className="text-[11px] text-slate-500">
                Export or restore all profiles, open tabs, bookmarks, and preferences as JSON
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onExportFullBackup}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Export Backup</span>
              </button>
              <label className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
