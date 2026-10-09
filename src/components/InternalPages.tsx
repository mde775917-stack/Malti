import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { BrowserProfile, SitePermissionEntry, StoredCookieItem } from '../types/browser';
import { ANDROID_NATIVE_BLUEPRINT, PROFILE_COLORS } from '../data/defaults';
import { ProfileAvatar } from './ProfileAvatar';

interface AuthLabStatusResponse {
  profileId: string;
  isPrivate: boolean;
  storageDirectory: string;
  cookieHeaderSent: string;
  cookies: StoredCookieItem[];
  authenticated: boolean;
  session: {
    token: string;
    profileId: string;
    username: string;
    email: string;
    role: string;
    signedInAt: string;
  } | null;
}

interface InternalPageProps {
  url: string;
  activeProfile: BrowserProfile;
  allProfiles: BrowserProfile[];
  isPrivate: boolean;
  permissions: SitePermissionEntry[];
  onNavigate: (url: string) => void;
  onSwitchProfile: (profileId: string, openUrl?: string) => void;
  onOpenPrivateTab: (url: string) => void;
  onOpenScreen: (screen: 'create-profile' | 'settings-permissions' | 'about-architecture') => void;
}

export const InternalPageView: React.FC<InternalPageProps> = ({
  url,
  activeProfile,
  allProfiles,
  isPrivate,
  permissions,
  onNavigate,
  onSwitchProfile,
  onOpenPrivateTab,
  onOpenScreen,
}) => {
  if (url.startsWith('uv://diagnostics')) {
    return (
      <DiagnosticsPage
        activeProfile={activeProfile}
        isPrivate={isPrivate}
        permissions={permissions}
        onNavigate={onNavigate}
        onOpenScreen={onOpenScreen}
      />
    );
  }

  if (url.startsWith('uv://architecture')) {
    return <ArchitectureBlueprintPage activeProfile={activeProfile} onNavigate={onNavigate} />;
  }

  return (
    <AuthIsolationLabPage
      activeProfile={activeProfile}
      allProfiles={allProfiles}
      isPrivate={isPrivate}
      onNavigate={onNavigate}
      onSwitchProfile={onSwitchProfile}
      onOpenPrivateTab={onOpenPrivateTab}
      onOpenScreen={onOpenScreen}
    />
  );
};

// ============================================================================
// 1. uv://auth-lab — Multi-Profile Session, Cookie & Storage Isolation Lab
// ============================================================================
const AuthIsolationLabPage: React.FC<{
  activeProfile: BrowserProfile;
  allProfiles: BrowserProfile[];
  isPrivate: boolean;
  onNavigate: (url: string) => void;
  onSwitchProfile: (profileId: string, openUrl?: string) => void;
  onOpenPrivateTab: (url: string) => void;
  onOpenScreen: (screen: 'create-profile' | 'settings-permissions' | 'about-architecture') => void;
}> = ({
  activeProfile,
  allProfiles,
  isPrivate,
  onNavigate,
  onSwitchProfile,
  onOpenPrivateTab,
  onOpenScreen,
}) => {
  const [status, setStatus] = useState<AuthLabStatusResponse | null>(null);
  const [crossProfileMatrix, setCrossProfileMatrix] = useState<Record<string, AuthLabStatusResponse>>({});
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(
    activeProfile.id === 'work'
      ? 'Alex Rivera (Enterprise)'
      : activeProfile.id === 'study'
        ? 'Alex Rivera (Academic)'
        : 'Alex Rivera'
  );
  const [email, setEmail] = useState(
    activeProfile.id === 'work'
      ? 'alex.rivera@acme-enterprise.io'
      : activeProfile.id === 'study'
        ? 'arivera@university.edu'
        : 'alex@personal-mail.io'
  );
  const [role, setRole] = useState(activeProfile.roleLabel || 'Standard Member');
  const [customNoteKey, setCustomNoteKey] = useState('vault_token');
  const [customNoteVal, setCustomNoteVal] = useState(
    `secret_${activeProfile.id}_${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [localItems, setLocalItems] = useState<Array<{ key: string; value: string }>>([]);

  const storagePrefix = isPrivate
    ? `uv_priv_${activeProfile.id}_authlab_`
    : `uv_prof_${activeProfile.id}_authlab_`;

  const loadLocalPartition = useCallback(() => {
    const entries: Array<{ key: string; value: string }> = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(storagePrefix)) {
          entries.push({
            key: k.slice(storagePrefix.length),
            value: window.localStorage.getItem(k) || '',
          });
        }
      }
    } catch {
      // ignore
    }
    setLocalItems(entries);
  }, [storagePrefix]);

  const fetchLabStatus = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `/api/auth-lab/status?profileId=${encodeURIComponent(activeProfile.id)}&isPrivate=${isPrivate}`
      );
      if (resp.ok) {
        const data = (await resp.json()) as AuthLabStatusResponse;
        setStatus(data);
      }

      // Also fetch status for all profiles to populate the Cross-Profile Isolation Matrix
      const matrix: Record<string, AuthLabStatusResponse> = {};
      await Promise.all(
        allProfiles.map(async (p) => {
          const r = await fetch(`/api/auth-lab/status?profileId=${encodeURIComponent(p.id)}&isPrivate=false`);
          if (r.ok) {
            matrix[p.id] = (await r.json()) as AuthLabStatusResponse;
          }
        })
      );
      setCrossProfileMatrix(matrix);
    } catch (e) {
      console.error('Failed to fetch auth lab status:', e);
    } finally {
      setLoading(false);
    }
  }, [activeProfile.id, allProfiles, isPrivate]);

  useEffect(() => {
    setUsername(
      isPrivate
        ? 'Anonymous Visitor'
        : activeProfile.id === 'work'
          ? 'Alex Rivera (Enterprise)'
          : activeProfile.id === 'study'
            ? 'Alex Rivera (University)'
            : `Alex (${activeProfile.name})`
    );
    setEmail(
      isPrivate
        ? 'ephemeral@private.session'
        : activeProfile.id === 'work'
          ? 'alex.rivera@acme-enterprise.io'
          : activeProfile.id === 'study'
            ? 'arivera@university.edu'
            : `${activeProfile.id}@personal-vault.io`
    );
    setRole(isPrivate ? 'Ephemeral Incognito' : activeProfile.roleLabel || 'Profile User');
    setCustomNoteVal(`secret_${activeProfile.id}_${Math.floor(1000 + Math.random() * 9000)}`);
    fetchLabStatus();
    loadLocalPartition();
  }, [activeProfile.id, activeProfile.name, activeProfile.roleLabel, isPrivate, fetchLabStatus, loadLocalPartition]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/auth-lab/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: activeProfile.id,
        isPrivate,
        username,
        email,
        role,
      }),
    });
    try {
      window.localStorage.setItem(`${storagePrefix}last_login_email`, email);
      window.localStorage.setItem(`${storagePrefix}session_role`, role);
    } catch {
      // ignore
    }
    loadLocalPartition();
    await fetchLabStatus();
  };

  const handleSignOut = async () => {
    await fetch('/api/auth-lab/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: activeProfile.id,
        isPrivate,
      }),
    });
    await fetchLabStatus();
  };

  const handleSaveLocalItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNoteKey.trim()) return;
    try {
      window.localStorage.setItem(`${storagePrefix}${customNoteKey.trim()}`, customNoteVal);
      loadLocalPartition();
    } catch {
      // ignore
    }
  };

  const handleClearLocalPartition = () => {
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(storagePrefix)) keysToDelete.push(k);
      }
      keysToDelete.forEach((k) => window.localStorage.removeItem(k));
      loadLocalPartition();
    } catch {
      // ignore
    }
  };

  const palette = PROFILE_COLORS[activeProfile.color] || PROFILE_COLORS.blue;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ProfileAvatar
                avatarId={activeProfile.avatarId}
                customAvatarUrl={activeProfile.customAvatarUrl}
                color={activeProfile.color}
                name={activeProfile.name}
                size="lg"
                isPrivate={isPrivate}
              />
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  uv://auth-lab · Multi-Profile Security Testbench
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                  Session, Cookie &amp; Storage Isolation Verifier
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Active Partition:{' '}
                  <code className="font-mono text-blue-600 dark:text-sky-400">
                    {isPrivate
                      ? `ram://incognito_${activeProfile.id}`
                      : `app_webview_${activeProfile.id}/Default`}
                  </code>
                </p>
              </div>
            </div>

            <button
              onClick={fetchLabStatus}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh State</span>
            </button>
          </div>
        </div>

        {/* Active Session Status & Sign-In Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-blue-500" />
                  <span>1. Profile Login Session ({isPrivate ? 'Private Mode' : activeProfile.name})</span>
                </h2>
              </div>

              {status?.authenticated && status.session ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Authenticated in {isPrivate ? 'Private Session' : activeProfile.name}</span>
                    </div>
                    <div className="mt-2.5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500">User:</span>{' '}
                        <strong className="font-medium">{status.session.username}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>{' '}
                        <code className="font-mono">{status.session.email}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Role:</span> {status.session.role}
                      </div>
                      <div>
                        <span className="text-slate-500">Session Cookie:</span>{' '}
                        <code className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                          {status.session.token}
                        </code>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This login session is stored inside{' '}
                    <strong>{isPrivate ? 'ephemeral RAM' : `${activeProfile.name}'s isolated Cookie Jar`}</strong>.
                    Switch to any other profile below to verify that other profiles remain signed out.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    No active session cookie found in{' '}
                    <strong>{isPrivate ? 'Private Mode' : activeProfile.name}</strong>. Sign in below to mint an
                    isolated <code>HttpOnly</code> session cookie for this profile:
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full min-h-[44px] rounded-xl ${palette.bg} text-white text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity`}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Sign In Under {isPrivate ? 'Private Session' : activeProfile.name}</span>
                  </button>
                </form>
              )}
            </div>

            {status?.authenticated && (
              <button
                onClick={handleSignOut}
                className="mt-4 w-full min-h-[44px] rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out &amp; Destroy Profile Session Cookie</span>
              </button>
            )}
          </div>

          {/* Isolated DOM LocalStorage Partition Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span>2. Isolated LocalStorage Partition</span>
                </h2>
                {localItems.length > 0 && (
                  <button
                    onClick={handleClearLocalPartition}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveLocalItem} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Key"
                  value={customNoteKey}
                  onChange={(e) => setCustomNoteKey(e.target.value)}
                  className="sm:col-span-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Secret value"
                  value={customNoteVal}
                  onChange={(e) => setCustomNoteVal(e.target.value)}
                  className="sm:col-span-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="sm:col-span-1 min-h-[40px] rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-xs font-medium px-3 hover:bg-slate-700 transition-colors"
                >
                  Write
                </button>
              </form>

              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {localItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-500">
                    No keys stored in <code>{storagePrefix}*</code> yet.
                  </div>
                ) : (
                  localItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-xs font-mono"
                    >
                      <span className="text-slate-600 dark:text-slate-300 truncate">{item.key}</span>
                      <span className="text-blue-600 dark:text-sky-400 truncate max-w-[180px]">
                        {item.value}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
              Cookie Header: {status?.cookieHeaderSent || '(none)'}
            </div>
          </div>
        </div>

        {/* Cross-Profile Live Verification Matrix */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>3. Cross-Profile Session Isolation Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compare live server Cookie Jars across all profiles. Tap any profile to switch and verify its isolated session.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenPrivateTab('uv://auth-lab')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-700 transition-colors"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>Test in Private Tab</span>
              </button>
              <button
                onClick={() => onOpenScreen('create-profile')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Profile</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {allProfiles.map((prof) => {
              const profStatus = crossProfileMatrix[prof.id];
              const isCurrent = !isPrivate && prof.id === activeProfile.id;
              return (
                <div
                  key={prof.id}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProfileAvatar
                      avatarId={prof.avatarId}
                      customAvatarUrl={prof.customAvatarUrl}
                      color={prof.color}
                      name={prof.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {prof.name}
                        </span>
                        {isCurrent && (
                          <span className="text-xs font-medium text-blue-600 dark:text-sky-400">
                            · Active Profile
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                        {profStatus?.authenticated && profStatus.session
                          ? `Signed in as ${profStatus.session.email} (${profStatus.cookies.length} cookies)`
                          : 'Signed out · 0 auth cookies in jar'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCurrent && (
                      <button
                        onClick={() => onSwitchProfile(prof.id, 'uv://auth-lab')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Switch &amp; Verify
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* External Live Cookie & Header Verification Links */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            External Real-World Website Tests
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Test our profile-isolated proxy engine against external internet endpoints:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => onNavigate('https://httpbin.org/cookies')}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">HTTPBin Cookies</div>
                <div className="text-[11px] text-slate-500 font-mono">httpbin.org/cookies</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('https://httpbin.org/headers')}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">HTTPBin Headers</div>
                <div className="text-[11px] text-slate-500 font-mono">httpbin.org/headers</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('https://en.m.wikipedia.org/wiki/HTTP_cookie')}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-left flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">Wikipedia Live</div>
                <div className="text-[11px] text-slate-500 font-mono">en.m.wikipedia.org</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. uv://diagnostics — Profile Cookie Jar, Storage & Security Diagnostics
// ============================================================================
const DiagnosticsPage: React.FC<{
  activeProfile: BrowserProfile;
  isPrivate: boolean;
  permissions: SitePermissionEntry[];
  onNavigate: (url: string) => void;
  onOpenScreen: (screen: 'create-profile' | 'settings-permissions' | 'about-architecture') => void;
}> = ({ activeProfile, isPrivate, permissions, onNavigate, onOpenScreen }) => {
  const [cookies, setCookies] = useState<StoredCookieItem[]>([]);
  const [storagePartition, setStoragePartition] = useState('');
  const [newCookieName, setNewCookieName] = useState('theme_pref');
  const [newCookieValue, setNewCookieValue] = useState(`dark_${activeProfile.id}`);
  const [newCookieDomain, setNewCookieDomain] = useState('httpbin.org');

  const fetchCookies = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies?isPrivate=${isPrivate}`
      );
      if (r.ok) {
        const data = await r.json();
        setCookies(data.cookies || []);
        setStoragePartition(data.storagePartition || '');
      }
    } catch {
      // ignore
    }
  }, [activeProfile.id, isPrivate]);

  useEffect(() => {
    fetchCookies();
  }, [fetchCookies]);

  const handleAddCookie = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isPrivate,
        name: newCookieName,
        value: newCookieValue,
        domain: newCookieDomain,
      }),
    });
    fetchCookies();
  };

  const handleClearCookies = async () => {
    await fetch(
      `/api/profiles/${encodeURIComponent(activeProfile.id)}/cookies?isPrivate=${isPrivate}`,
      { method: 'DELETE' }
    );
    fetchCookies();
  };

  const profilePerms = permissions.filter((p) => p.profileId === activeProfile.id);

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500">uv://diagnostics · Real-Time Inspector</div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Profile Storage &amp; Security Diagnostics ({isPrivate ? 'Private RAM' : activeProfile.name})
          </h1>
          <p className="text-xs font-mono text-blue-600 dark:text-sky-400 mt-1">
            Storage Mount: {storagePartition}
          </p>
        </div>

        {/* Cookie Jar Inspector */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>Isolated RFC-6265 Cookie Jar ({cookies.length} entries)</span>
            </h2>
            {cookies.length > 0 && (
              <button
                onClick={handleClearCookies}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge Profile Cookies</span>
              </button>
            )}
          </div>

          <form onSubmit={handleAddCookie} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              value={newCookieDomain}
              onChange={(e) => setNewCookieDomain(e.target.value)}
              placeholder="Domain (e.g. httpbin.org)"
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono"
              required
            />
            <input
              type="text"
              value={newCookieName}
              onChange={(e) => setNewCookieName(e.target.value)}
              placeholder="Cookie Name"
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono"
              required
            />
            <input
              type="text"
              value={newCookieValue}
              onChange={(e) => setNewCookieValue(e.target.value)}
              placeholder="Cookie Value"
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono"
              required
            />
            <button
              type="submit"
              className="min-h-[40px] rounded-xl bg-blue-600 text-white text-xs font-semibold px-3 hover:bg-blue-500 transition-colors"
            >
              Inject Cookie
            </button>
          </form>

          {cookies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500">
              No cookies stored in this profile&apos;s jar. Inject a test cookie for <code>httpbin.org</code> above, then open{' '}
              <button
                onClick={() => onNavigate('https://httpbin.org/cookies')}
                className="text-blue-500 underline"
              >
                https://httpbin.org/cookies
              </button>{' '}
              to see the remote server echo only this profile&apos;s cookies!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cookies.map((c, idx) => (
                <div key={`${c.domain}-${c.name}-${idx}`} className="py-2.5 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {c.name} = <span className="text-blue-600 dark:text-sky-400">{c.value}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Domain: {c.domain} · Path: {c.path} · {c.httpOnly ? 'HttpOnly' : 'JS-Accessible'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Site Permissions Snapshot */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Site Permissions Scoped to {activeProfile.name}</span>
            </h2>
            <button
              onClick={() => onOpenScreen('settings-permissions')}
              className="text-xs text-blue-600 dark:text-sky-400 hover:underline font-medium"
            >
              Manage All Permissions
            </button>
          </div>
          <div className="text-xs text-slate-500 space-y-1.5">
            {profilePerms.map((perm) => (
              <div
                key={perm.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-none"
              >
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{perm.origin}</span>
                <span>
                  Camera: {perm.camera} · Mic: {perm.microphone} · Location: {perm.location} · JS: {perm.javascript}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. uv://architecture — Engine Transparency & Native Android APK Blueprint
// ============================================================================
const ArchitectureBlueprintPage: React.FC<{
  activeProfile: BrowserProfile;
  onNavigate: (url: string) => void;
}> = ({ onNavigate }) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const copyCode = (label: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="text-xs font-medium text-slate-500">
            uv://architecture · Platform &amp; Engine Transparency
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Dual-Layer Browser Architecture &amp; Native Android APK Blueprint
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            This environment runs inside a Linux Node.js container rather than a local Android SDK/Gradle hardware emulator.
            To deliver a genuine, working browser rather than a static UI mockup, Unlimited Virtual Mobile Browser implements a{' '}
            <strong>Server-Backed Profile-Isolated Rendering Proxy</strong> paired with the complete{' '}
            <strong>Kotlin Jetpack Compose + AndroidX WebKit ProfileStore</strong> native code blueprint below.
          </p>
        </div>

        {/* Comparison Table: Web Proxy Engine vs Native Android APK */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <span>Engine Capabilities &amp; Isolation Mechanism</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2.5 pr-3 font-medium">Subsystem</th>
                  <th className="py-2.5 px-3 font-medium">Live Cloud / PWA Runtime</th>
                  <th className="py-2.5 pl-3 font-medium">Native Android APK (Kotlin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Website Rendering</td>
                  <td className="py-2.5 px-3">Real server HTTP/HTTPS proxy stripping X-Frame-Options + DOM Bridge</td>
                  <td className="py-2.5 pl-3">Android System WebView (Chromium Blink engine)</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Cookie Isolation</td>
                  <td className="py-2.5 px-3">Per-profile RFC-6265 Cookie Jar on server (`.data/profile-cookies.json`)</td>
                  <td className="py-2.5 pl-3"><code>androidx.webkit.ProfileStore</code> separate CookieManager per profile</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">DOM Storage</td>
                  <td className="py-2.5 px-3">Injected <code>window.localStorage</code> proxy partitioned by <code>profileId + origin</code></td>
                  <td className="py-2.5 pl-3">Isolated <code>app_webview_&lt;profileId&gt;</code> data directory on disk</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-medium">Private Browsing</td>
                  <td className="py-2.5 px-3">RAM-only ephemeral Cookie Jar purged when private tabs close</td>
                  <td className="py-2.5 pl-3">Ephemeral <code>ProfileStore</code> instance wiped on session exit</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('uv://auth-lab')}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
              Open Interactive Session Isolation Lab (uv://auth-lab)
            </button>
          </div>
        </div>

        {/* Native Kotlin Source Blueprints */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-emerald-500" />
              <span>MultiProfileWebViewEngine.kt (AndroidX WebKit 1.12+)</span>
            </h2>
            <button
              onClick={() => copyCode('kt', ANDROID_NATIVE_BLUEPRINT.profileEngineKt)}
              className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedFile === 'kt' ? 'Copied' : 'Copy Kotlin'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {ANDROID_NATIVE_BLUEPRINT.profileEngineKt}
          </pre>

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-amber-500" />
              <span>app/build.gradle.kts &amp; APK Build Instructions</span>
            </h2>
            <button
              onClick={() => copyCode('gradle', ANDROID_NATIVE_BLUEPRINT.buildGradle)}
              className="min-h-[36px] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedFile === 'gradle' ? 'Copied' : 'Copy Gradle'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {ANDROID_NATIVE_BLUEPRINT.buildGradle}
          </pre>
        </div>
      </div>
    </div>
  );
};
