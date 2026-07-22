import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: 'multicolor' | 'monochrome' | 'white';
  showBackground?: boolean;
}

export const BeforeSpendIcon: React.FC<IconProps> = ({
  size = 32,
  variant = 'multicolor',
  showBackground = false,
  className = '',
  ...props
}) => {
  const navyColor = variant === 'white' ? '#FFFFFF' : '#0E2A47';
  const tealColor = variant === 'white' ? '#FFFFFF' : (variant === 'monochrome' ? '#0E2A47' : '#00A896');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {showBackground && (
        <rect width="200" height="200" rx="48" fill="#F8F9F5" />
      )}
      
      {/* Outer Monoline B/P Frame */}
      <path
        d="M 58 162 V 62 C 58 36 78 20 106 20 C 134 20 154 38 154 62 C 154 84 136 96 108 96 C 138 96 160 112 160 140 C 160 166 138 182 106 182 H 78 C 64 182 58 172 58 162 Z"
        stroke={navyColor}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner P Loop */}
      <path
        d="M 74 62 C 74 46 88 34 106 34 C 122 34 138 46 138 62 C 138 78 122 84 96 84 H 74"
        stroke={tealColor}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stacked Coins */}
      <g transform="translate(10, 2)">
        {/* Bottom coin base */}
        <path
          d="M 94 146 C 94 151 103 155 114 155 C 125 155 134 151 134 146 V 150 C 134 155 125 159 114 159 C 103 159 94 155 94 150 Z"
          fill={tealColor}
        />
        {/* Middle coin base */}
        <path
          d="M 94 138 C 94 143 103 147 114 147 C 125 147 134 143 134 138 V 142 C 134 147 125 151 114 151 C 103 151 94 147 94 142 Z"
          fill={tealColor}
        />
        {/* Top coin top surface */}
        <ellipse
          cx="114"
          cy="133"
          rx="20"
          ry="6"
          fill={tealColor}
        />
      </g>
    </svg>
  );
};

export default BeforeSpendIcon;
