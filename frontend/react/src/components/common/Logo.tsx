import React, { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 20, className }) => {
  const uid = useId();
  const bgId = `wbg-${uid}`;
  const sheenId = `wsheen-${uid}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="60" y1="40" x2="452" y2="472" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B9BFF" />
          <stop offset="0.5" stopColor="#2264DC" />
          <stop offset="1" stopColor="#10357F" />
        </linearGradient>
        <linearGradient id={sheenId} x1="256" y1="32" x2="256" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="32" y="32" width="448" height="448" rx="106" fill={`url(#${bgId})`} />
      <rect x="32" y="32" width="448" height="448" rx="106" fill={`url(#${sheenId})`} />
      <rect x="32.75" y="32.75" width="446.5" height="446.5" rx="105.25" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" />
      <path
        d="M136 172 L197 344 L256 206 L315 344 L376 172"
        stroke="#ffffff"
        strokeWidth="50"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};
