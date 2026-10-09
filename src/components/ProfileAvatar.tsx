import React from 'react';
import {
  BookOpen,
  Briefcase,
  Building2,
  Code2,
  Compass,
  Globe,
  GraduationCap,
  Layers,
  Shield,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { AvatarIconId, ProfileColorId } from '../types/browser';
import { PROFILE_COLORS } from '../data/defaults';

export function renderAvatarIcon(avatarId: AvatarIconId, className = 'h-4 w-4') {
  switch (avatarId) {
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'building':
      return <Building2 className={className} />;
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'user':
    default:
      return <User className={className} />;
  }
}

interface ProfileAvatarProps {
  avatarId: AvatarIconId;
  customAvatarUrl?: string;
  color: ProfileColorId;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isPrivate?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarId,
  customAvatarUrl,
  color,
  name,
  size = 'md',
  isPrivate = false,
}) => {
  const palette = PROFILE_COLORS[color] || PROFILE_COLORS.blue;

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }[size];

  const iconClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-7 w-7',
  }[size];

  if (isPrivate) {
    return (
      <div
        className={`${sizeClasses} rounded-full bg-slate-800 border border-slate-600 text-slate-100 flex items-center justify-center shrink-0 shadow-xs`}
        title="Private Browsing Session"
      >
        <Shield className={iconClasses} />
      </div>
    );
  }

  if (customAvatarUrl) {
    return (
      <div
        className={`${sizeClasses} rounded-full overflow-hidden ring-2 ${palette.ring} shrink-0 bg-slate-800`}
        title={name}
      >
        <img
          src={customAvatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full ${palette.bg} text-white flex items-center justify-center shrink-0 font-semibold shadow-xs`}
      title={name}
    >
      {renderAvatarIcon(avatarId, iconClasses)}
    </div>
  );
};
