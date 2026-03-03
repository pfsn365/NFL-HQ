'use client';

import { useState, useMemo } from 'react';

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

/** Strip common name suffixes (Sr, Jr, II, III, IV, V) from a slug */
function stripSuffixFromSlug(slug: string): string | null {
  const stripped = slug.replace(/-(sr|jr|ii|iii|iv|v)$/, '');
  return stripped !== slug ? stripped : null;
}

export default function PlayerImage({
  slug,
  name,
  size = 'sm',
  teamColor = '#6B7280',
  className = '',
}: PlayerImageProps) {
  const [imageSource, setImageSource] = useState<'pfn' | 'local' | 'pfn-no-suffix' | 'local-no-suffix' | 'fallback'>('pfn');

  const strippedSlug = useMemo(() => stripSuffixFromSlug(slug), [slug]);

  const getInitials = (playerName: string) => {
    return playerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getImageUrl = () => {
    switch (imageSource) {
      case 'pfn':
        return `https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${slug}.png?w=80`;
      case 'local':
        return `/player-images/${slug}.png`;
      case 'pfn-no-suffix':
        return `https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${strippedSlug}.png?w=80`;
      case 'local-no-suffix':
        return `/player-images/${strippedSlug}.png`;
      default:
        return '';
    }
  };

  const handleError = () => {
    if (imageSource === 'pfn') {
      setImageSource('local');
    } else if (imageSource === 'local') {
      // Try without suffix if the slug has one
      if (strippedSlug) {
        setImageSource('pfn-no-suffix');
      } else {
        setImageSource('fallback');
      }
    } else if (imageSource === 'pfn-no-suffix') {
      setImageSource('local-no-suffix');
    } else {
      setImageSource('fallback');
    }
  };

  const sizeClass = sizeClasses[size];

  if (imageSource === 'fallback') {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
        style={{ backgroundColor: `${teamColor}20` }}
      >
        <span className="font-semibold leading-none" style={{ color: teamColor, fontSize: '0.55em' }}>
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={getImageUrl()}
      alt={name}
      className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={handleError}
    />
  );
}
