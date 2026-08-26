import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * WORD brand mark — the official geometric "W" logo.
 * Rendered from the shared brand asset (public/logo2.png).
 */
export const Logo: React.FC<LogoProps> = ({ size = 20, className }) => (
  <img
    src="/newlogo.png"
    alt="WORD logo"
    width={size}
    height={size}
    className={className}
    draggable={false}
  />
);
