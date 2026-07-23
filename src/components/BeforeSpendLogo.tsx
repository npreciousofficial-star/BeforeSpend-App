import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'multicolor' | 'monochrome' | 'white';
  className?: string;
  onClick?: () => void;
}

export const BeforeSpendLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'multicolor',
  className = '',
  onClick,
}) => {
  const imgHeights = {
    sm: 'h-10 sm:h-11',
    md: 'h-12 sm:h-14',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
  };

  // Determine CSS filters based on variant and theme compatibility
  let filterClass = '';
  if (variant === 'white') {
    filterClass = 'brightness-0 invert';
  } else if (variant === 'monochrome') {
    filterClass = 'brightness-0';
  } else {
    // multicolor: in dark mode, invert to white to prevent black-on-black visibility issues
    filterClass = 'dark:brightness-0 dark:invert';
  }

  return (
    <img
      src="/logo.svg"
      alt="BeforeSpend Logo"
      loading="eager"
      fetchPriority="high"
      onClick={onClick}
      className={`object-contain w-auto max-w-none shrink-0 select-none ${imgHeights[size]} ${filterClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    />
  );
};

export default BeforeSpendLogo;
