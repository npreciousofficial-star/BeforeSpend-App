import React from 'react';

interface AvatarProps {
  avatar?: string;
  name: string;
  className?: string;
}

export const AVATAR_PRESETS = [
  { id: 'preset-emerald', label: 'Emerald Mint', bg: 'from-emerald-500 to-teal-600', text: 'text-white' },
  { id: 'preset-indigo', label: 'Indigo Night', bg: 'from-indigo-500 to-purple-600', text: 'text-white' },
  { id: 'preset-sunset', label: 'Sunset Glow', bg: 'from-amber-500 to-rose-600', text: 'text-white' },
  { id: 'preset-ocean', label: 'Ocean Wave', bg: 'from-blue-500 to-cyan-600', text: 'text-white' },
  { id: 'preset-cosmic', label: 'Cosmic Nebula', bg: 'from-fuchsia-500 to-pink-600', text: 'text-white' },
  { id: 'preset-royal', label: 'Royal Velvet', bg: 'from-violet-600 to-purple-800', text: 'text-white' },
];

export function Avatar({ avatar, name, className = 'w-8 h-8 text-xs' }: AvatarProps) {
  const initials = name ? name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  // Custom upload (base64) or hosted URL from Supabase storage
  if (avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${className} rounded-full object-cover border border-gray-200 dark:border-zinc-800 shadow-2xs`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // If preset selected
  const preset = AVATAR_PRESETS.find((p) => p.id === avatar);
  if (preset) {
    return (
      <div className={`${className} rounded-full bg-gradient-to-br ${preset.bg} ${preset.text} flex items-center justify-center font-bold tracking-wider shadow-2xs overflow-hidden`}>
        <span>{initials}</span>
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`${className} rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold tracking-wider shadow-2xs`}>
      {initials}
    </div>
  );
}
