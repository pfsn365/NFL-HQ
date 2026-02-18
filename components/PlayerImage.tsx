'use client';

import { useState } from 'react';

interface PlayerImageProps {
  slug: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  teamColor?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-28 h-28 lg:w-32 lg:h-32 text-3xl lg:text-4xl',
};

export default function PlayerImage({
  slug,
  name,
  size = 'sm',
  teamColor = '#6B7280',
  className = '',
}: PlayerImageProps) {
  const [imageSource, setImageSource] = useState<'pfn' | 'local' | 'fallback'>('pfn');

  const getInitials = (playerName: string) => {
    return playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pfnUrl = `https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${slug}.png?w=80`;
  const localUrl = `/player-images/${slug}.png`;

  const handleError = () => {
    if (imageSource === 'pfn') {
      setImageSource('local');
    } else if (imageSource === 'local') {
      setImageSource('fallback');
    }
  };

  const sizeClass = sizeClasses[size];

  if (imageSource === 'fallback') {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ backgroundColor: `${teamColor}20` }}
      >
        <span className="font-semibold" style={{ color: teamColor }}>
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSource === 'pfn' ? pfnUrl : localUrl}
      alt={name}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={handleError}
    />
  );
}
