/* Minimal inline SVG icon set (no icon-font dependency). Stroke inherits currentColor. */
import type { CSSProperties } from 'react';

const paths: Record<string, JSX.Element> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 6.2a3 3 0 0 1 0 5.6M21.5 20a5.6 5.6 0 0 0-4-5.2" />
    </>
  ),
  patients: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6" />
    </>
  ),
  activity: <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />,
  chart: <path d="M4 20V4M4 20h16M8 20v-6M12 20V9M16 20v-9M20 20v-4" />,
  heart: <path d="M12 20s-7-4.6-9.2-9.2A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9.2 4.8C19 15.4 12 20 12 20Z" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function Icon({
  name,
  size = 20,
  style,
  'aria-hidden': ariaHidden = true,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
      style={style}
    >
      {paths[name] ?? paths.activity}
    </svg>
  );
}
