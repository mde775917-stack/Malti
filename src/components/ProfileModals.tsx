import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  KeyRound,
  Lock,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ActiveScreen,
  AvatarIconId,
  BookmarkItem,
  BrowserProfile,
  BrowserTab,
  HistoryEntry,
  ProfileColorId,
  SearchEngineId,
  ThemeMode,
} from '../types/browser';
import { AVATAR_OPTIONS, PROFILE_COLORS, SEARCH_ENGINES } from '../data/defaults';
import { ProfileAvatar, renderAvatarIcon } from './ProfileAvatar';

interface ProfileModalsProps {
  screen: 'profile-switcher' | 'create-profile' | 'edit-profile' | 'profile-management';
  profiles: BrowserProfile[];
  activeProfile: BrowserProfile;
  editingProfileId: string | null;
  isPrivate: boolean;
  tabs: BrowserTab[];
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  onClose: () => void;
  onNavigateScreen: (screen: ActiveScreen, editProfileId?: string) => void;
  onSwitchProfile: (profileId: string) => void;
  onEnterPrivateMode: () => void;
  onCreateProfile: (profileData: Omit<BrowserProfile, 'id' | 'createdAt'>) => void;
  onUpdateProfile: (profile: BrowserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onClearProfileData: (profileId: string) => void;
  onSetDefaultProfile: (profileId: string) => void;
}

const PROFILE_PRESETS: Array<{
  name: string;
  roleLabel: string;
  avatarId: AvatarIconId;
  color: ProfileColorId;
  searchEngine: SearchEngineId;
}> = [
  { name: 'Personal', roleLabel: 'Everyday Browsing', avatarId: 'user', color: 'blue', searchEngine: 'duckduckgo' },
  { name: 'Work', roleLabel: 'Enterprise & Cloud', avatarId: 'briefcase', color: 'emerald', searchEngine: 'google' },
  { name: 'Business', roleLabel: 'Finance & Operations', avatarId: 'building', color: 'violet', searchEngine: 'google' },
  { name: 'Study', roleLabel: 'Academic Research', avatarId: 'graduation', color: 'amber', searchEngine: 'duckduckgo' },
  { name: 'Social Media', roleLabel: 'Creator & Feeds', avatarId: 'globe', color: 'rose', searchEngine: 'brave' },
  { name: 'DevOps', roleLabel: 'Localhost & Staging', avatarId: 'terminal', color: 'cyan', searchEngine: 'duckduckgo' },
];

export const ProfileModals: React.FC<ProfileModalsProps> = ({
  screen,
  profiles,
  activeProfile,
  editingProfileId,
  isPrivate,
  tabs,
  bookmarks,
  history,
  onClose,
  onNavigateScreen,
  onSwitchProfile,
  onEnterPrivateMode,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onClearProfileData,
  onSetDefaultProfile,
}) => {
  const [pinPromptProfile, setPinPromptProfile] = useState<BrowserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleRequestSwitch = (target: BrowserProfile) => {
    if (target.pinCode && target.id !== activeProfile.id) {
      setPinPromptProfile(target);
      setPinInput('');
      setPinError('');
      return;
    }
    onSwitchProfile(target.id);
    onClose();
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptProfile) return;
    if (pinInput === pinPromptProfile.pinCode) {
      const id = pinPromptProfile.id;
      setPinPromptProfile(null);
      onSwitchProfile(id);
      onClose();
    } else {
      setPinError('Incorrect 4-digit PIN. Please try again.');
    }
  };

  if (pinPromptProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unlock {pinPromptProfile.name}
              </h3>
            </div>
            <button
              onClick={() => setPinPromptProfile(null)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            This profile&apos;s tabs, cookies, and sessions are protected by a security PIN.
          </p>
          <form onSubmit={handleVerifyPin} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="w-full min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white"
            />
            {pinError && <p className="text-xs text-rose-500 text-center">{pinError}</p>}
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
              Unlock &amp; Switch Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 1. Quick Profile Switcher Bottom Sheet / Modal
  if (screen === 'profile-switcher') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
        <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[88dvh] flex flex-col">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Switch Browser Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each profile runs in an isolated cookie &amp; storage partition
              </p>
            </div>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="my-3 overflow-y-auto space-y-2 pr-1 flex-1">
            {profiles.map((prof) => {
              const isCurrent = !isPrivate && prof.id === activeProfile.id;
              const openTabCount = tabs.filter((t) => !t.isPrivate && t.profileId === prof.id).length;
              return (
                <button
                  key={prof.id}
                  onClick={() => handleRequestSwitch(prof)}
                  className={`w-full min-h-[64px] p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/40'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {prof.name}
                        </span>
                        {prof.isDefault && (
                          <span className="text-[11px] text-slate-400">· Default</span>
                        )}
                        {prof.pinCode && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {prof.roleLabel} ·{' '}
                        <span className="tabular-nums">{openTabCount} open tabs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400">
                        <Check className="h-4 w-4" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Switch
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateScreen('create-profile')}
                className="min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Profile</span>
              </button>
              <button
                onClick={() => onNavigateScreen('profile-management')}
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Manage Profiles</span>
              </button>
            </div>

            <button
              onClick={() => {
                onEnterPrivateMode();
                onClose();
              }}
              className="w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Shield className="h-4 w-4 text-sky-400" />
              <span>Open Ephemeral Private Browsing Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Create or Edit Profile Screen
  if (screen === 'create-profile' || screen === 'edit-profile') {
    const targetToEdit =
      screen === 'edit-profile'
        ? profiles.find((p) => p.id === (editingProfileId || activeProfile.id)) || activeProfile
        : null;

    return (
      <ProfileFormModal
        mode={screen === 'create-profile' ? 'create' : 'edit'}
        initialProfile={targetToEdit}
        onCancel={() => onNavigateScreen('profile-management')}
        onClose={onClose}
        onSaveCreate={(data) => {
          onCreateProfile(data);
          onClose();
        }}
        onSaveEdit={(updated) => {
          onUpdateProfile(updated);
          onNavigateScreen('profile-management');
        }}
      />
    );
  }

  // 3. Dedicated Profile Management Screen
  return (
    <ProfileManagementModal
      profiles={profiles}
      activeProfile={activeProfile}
      tabs={tabs}
      bookmarks={bookmarks}
      history={history}
      onClose={onClose}
      onNavigateScreen={onNavigateScreen}
      onSwitchProfile={handleRequestSwitch}
      onDeleteProfile={onDeleteProfile}
      onClearProfileData={onClearProfileData}
      onSetDefaultProfile={onSetDefaultProfile}
    />
  );
};

// ============================================================================
// Create / Edit Profile Form Screen
// ============================================================================
const ProfileFormModal: React.FC<{
  mode: 'create' | 'edit';
  initialProfile: BrowserProfile | null;
  onCancel: () => void;
  onClose: () => void;
  onSaveCreate: (data: Omit<BrowserProfile, 'id' | 'createdAt'>) => void;
  onSaveEdit: (updated: BrowserProfile) => void;
}> = ({ mode, initialProfile, onCancel, onClose, onSaveCreate, onSaveEdit }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [roleLabel, setRoleLabel] = useState(initialProfile?.roleLabel || 'Custom Workspace');
  const [avatarId, setAvatarId] = useState<AvatarIconId>(initialProfile?.avatarId || 'user');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | undefined>(
    initialProfile?.customAvatarUrl
  );
  const [color, setColor] = useState<ProfileColorId>(initialProfile?.color || 'blue');
  const [homepage, setHomepage] = useState(initialProfile?.homepage || 'uv://home');
  const [searchEngine, setSearchEngine] = useState<SearchEngineId>(
    initialProfile?.searchEngine || 'duckduckgo'
  );
  const [customSearchUrl, setCustomSearchUrl] = useState(
    initialProfile?.customSearchUrl || 'https://en.wikipedia.org/w/index.php?search=%s'
  );
  const [theme, setTheme] = useState<ThemeMode>(initialProfile?.theme || 'dark');
  const [pinCode, setPinCode] = useState(initialProfile?.pinCode || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyPreset = (preset: (typeof PROFILE_PRESETS)[number]) => {
    setName(preset.name);
    setRoleLabel(preset.roleLabel);
    setAvatarId(preset.avatarId);
    setColor(preset.color);
    setSearchEngine(preset.searchEngine);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'edit' && initialProfile) {
      onSaveEdit({
        ...initialProfile,
        name: name.trim(),
        roleLabel: roleLabel.trim() || 'Browser Profile',
        avatarId,
        customAvatarUrl,
        color,
        homepage: homepage.trim() || 'uv://home',
        searchEngine,
        customSearchUrl,
        theme,
        pinCode: pinCode.trim().length === 4 ? pinCode.trim() : undefined,
      });
      return;
    }

    onSaveCreate({
      name: name.trim(),
      roleLabel: roleLabel.trim() || 'Browser Profile',
      avatarId,
      customAvatarUrl,
      color,
      homepage: homepage.trim() || 'uv://home',
      searchEngine,
      customSearchUrl,
      theme,
      layoutDensity: 'comfortable',
      wallpaper: 'nordic-frost',
      showShortcuts: true,
      showFrequent: true,
      showBookmarksOnHome: true,
      showDiscoveryFeed: true,
      isDefault: false,
      pinCode: pinCode.trim().length === 4 ? pinCode.trim() : undefined,
      desktopSiteDefault: false,
      javaScriptEnabled: true,
      blockPopups: true,
      doNotTrack: true,
      safeBrowsing: true,
      textScale: 100,
      downloadLocation: `/storage/emulated/0/Download/UVBrowser/${name.trim().replace(/\s+/g, '_')}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'create' ? 'Create Isolated Browser Profile' : `Edit Profile · ${initialProfile?.name}`}
              </h2>
              <p className="text-xs text-slate-500">
                Dedicated cookies, tabs, history, and site permissions
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Presets (Create Mode) */}
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Quick Profile Templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PROFILE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Avatar Preview & Upload */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <ProfileAvatar
              avatarId={avatarId}
              customAvatarUrl={customAvatarUrl}
              color={color}
              name={name || 'New Profile'}
              size="xl"
            />
            <div className="space-y-2 flex-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {name || 'Unnamed Profile'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {customAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomAvatarUrl(undefined)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Profile Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Work, Finance, Social"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise SSO & Docs"
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Profile Accent Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(PROFILE_COLORS) as ProfileColorId[]).map((cKey) => {
                const c = PROFILE_COLORS[cKey];
                const selected = cKey === color;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`h-10 w-10 rounded-full ${c.bg} text-white flex items-center justify-center transition-transform ${
                      selected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Predefined Avatar Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Avatar Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((opt) => {
                const selected = !customAvatarUrl && avatarId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCustomAvatarUrl(undefined);
                      setAvatarId(opt.id);
                    }}
                    className={`min-h-[44px] rounded-xl border flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {renderAvatarIcon(opt.id, 'h-4 w-4')}
                    <span className="text-[10px] truncate w-full text-center">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Engine, Homepage & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Search Engine
              </label>
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value as SearchEngineId)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
              >
                {(Object.keys(SEARCH_ENGINES) as SearchEngineId[]).map((id) => (
                  <option key={id} value={id}>
                    {SEARCH_ENGINES[id].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Profile Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-white"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Profile Homepage URL
              </label>
              <input
                type="text"
                value={homepage}
                onChange={(e) => setHomepage(e.target.value)}
                placeholder="uv://home or https://..."
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional 4-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Leave blank for no PIN"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
              {mode === 'create' ? 'Create Isolated Profile' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Profile Management Center Screen (With Delete Confirmation Dialog)
// ============================================================================
const ProfileManagementModal: React.FC<{
  profiles: BrowserProfile[];
  activeProfile: BrowserProfile;
  tabs: BrowserTab[];
  bookmarks: BookmarkItem[];
  history: HistoryEntry[];
  onClose: () => void;
  onNavigateScreen: (screen: ActiveScreen, editProfileId?: string) => void;
  onSwitchProfile: (profile: BrowserProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onClearProfileData: (profileId: string) => void;
  onSetDefaultProfile: (profileId: string) => void;
}> = ({
  profiles,
  activeProfile,
  tabs,
  bookmarks,
  history,
  onClose,
  onNavigateScreen,
  onSwitchProfile,
  onDeleteProfile,
  onClearProfileData,
  onSetDefaultProfile,
}) => {
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<BrowserProfile | null>(null);
  const [clearedBanner, setClearedBanner] = useState<string | null>(null);

  const handleClear = (prof: BrowserProfile) => {
    onClearProfileData(prof.id);
    setClearedBanner(`Cleared cookies, history, and local storage for "${prof.name}".`);
    setTimeout(() => setClearedBanner(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90dvh] max-w-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Profile Management &amp; Storage Partitions
              </h2>
              <p className="text-xs text-slate-500">
                Manage isolated browser profiles, cookies, PIN locks, and default startup profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateScreen('create-profile')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              <span>Add Profile</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {clearedBanner && (
          <div className="mx-5 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {clearedBanner}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {profiles.map((prof) => {
            const profTabs = tabs.filter((t) => !t.isPrivate && t.profileId === prof.id).length;
            const profBookmarks = bookmarks.filter((b) => b.profileId === prof.id).length;
            const profHistory = history.filter((h) => h.profileId === prof.id).length;
            const isActive = prof.id === activeProfile.id;

            return (
              <div
                key={prof.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isActive
                    ? 'border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <ProfileAvatar
                      avatarId={prof.avatarId}
                      customAvatarUrl={prof.customAvatarUrl}
                      color={prof.color}
                      name={prof.name}
                      size="lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {prof.name}
                        </span>
                        {isActive && (
                          <span className="text-xs font-medium text-blue-600 dark:text-sky-400">
                            · Active
                          </span>
                        )}
                        {prof.isDefault && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            · Default Startup
                          </span>
                        )}
                        {prof.pinCode && (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            · <Lock className="h-3 w-3" /> PIN Protected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {profTabs} tabs · {profBookmarks} bookmarks · {profHistory} history items · Engine:{' '}
                        {SEARCH_ENGINES[prof.searchEngine]?.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Data dir: /data/user/0/com.uvbrowser.mobile/app_webview_{prof.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isActive && (
                      <button
                        onClick={() => onSwitchProfile(prof)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
                      >
                        Switch
                      </button>
                    )}
                    <button
                      onClick={() => onNavigateScreen('edit-profile', prof.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    {!prof.isDefault && (
                      <button
                        onClick={() => onSetDefaultProfile(prof.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleClear(prof)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                      Clear Data
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => setConfirmDeleteProfile(prof)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mandatory Delete Confirmation Modal */}
        {confirmDeleteProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Profile &ldquo;{confirmDeleteProfile.name}&rdquo;?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                This will permanently delete <strong>{confirmDeleteProfile.name}</strong> and all of its isolated local
                browsing data, including its open tabs, bookmarks, browsing history, saved site permissions, and server
                session cookies. This action cannot be undone.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setConfirmDeleteProfile(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteProfile(confirmDeleteProfile.id);
                    setConfirmDeleteProfile(null);
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                >
                  Permanently Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
