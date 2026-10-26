const icons: Record<string, React.ReactNode> = {
  x: [<path key="a" d="M18 6 6 18" />, <path key="b" d="m6 6 12 12" />],
  plus: [<path key="a" d="M5 12h14" />, <path key="b" d="M12 5v14" />],
  minus: [<path key="a" d="M5 12h14" />],
  chevronLeft: [<path key="a" d="m15 18-6-6 6-6" />],
  chevronUp: [<path key="a" d="m18 15-6-6-6 6" />],
  check: [<path key="a" d="M20 6 9 17l-5-5" />],
  sliders: [
    <line key="a" x1="4" y1="6" x2="20" y2="6" />,
    <line key="b" x1="4" y1="12" x2="20" y2="12" />,
    <line key="c" x1="4" y1="18" x2="20" y2="18" />,
    <circle key="d" cx="9" cy="6" r="2.4" fill="currentColor" stroke="none" />,
    <circle key="e" cx="15" cy="12" r="2.4" fill="currentColor" stroke="none" />,
    <circle key="f" cx="8" cy="18" r="2.4" fill="currentColor" stroke="none" />,
  ],
  lock: [
    <rect key="a" x="3" y="11" width="18" height="11" rx="2" />,
    <path key="b" d="M7 11V7a5 5 0 0 1 10 0v4" />,
  ],
  info: [
    <circle key="a" cx="12" cy="12" r="10" />,
    <path key="b" d="M12 16v-4" />,
    <path key="c" d="M12 8h.01" />,
  ],
  users: [
    <path key="a" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />,
    <circle key="b" cx="9" cy="7" r="4" />,
    <path key="c" d="M22 21v-2a4 4 0 0 0-3-3.87" />,
    <path key="d" d="M16 3.13a4 4 0 0 1 0 7.75" />,
  ],
  gear: [
    <path key="a" d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />,
    <circle key="b" cx="12" cy="12" r="3" />,
  ],
  reload: [
    <path key="a" d="M21.5 2v6h-6" />,
    <path key="b" d="M2.5 12a9 9 0 0 1 14.68-7.22L21.5 8" />,
    <path key="c" d="M2.5 22v-6h6" />,
    <path key="d" d="M21.5 12a9 9 0 0 1-14.68 7.22L2.5 16" />,
  ],
  chart: [
    <line key="a" x1="18" y1="20" x2="18" y2="10" />,
    <line key="b" x1="12" y1="20" x2="12" y2="4" />,
    <line key="c" x1="6" y1="20" x2="6" y2="14" />,
  ],
  trophy: [
    <path key="a" d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />,
    <path key="b" d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />,
    <path key="c" d="M12 15v5" />,
    <path key="d" d="M8 22h8" />,
    <path key="e" d="M12 2a7 7 0 0 0-7 7c0 3.18 2.12 5.86 5 6.71" />,
    <path key="f" d="M12 2a7 7 0 0 1 7 7c0 3.18-2.12 5.86-5 6.71" />,
  ],
  pause: [
    <rect key="a" x="6" y="4" width="4" height="16" rx="1" />,
    <rect key="b" x="14" y="4" width="4" height="16" rx="1" />,
  ],
  play: [<path key="a" d="M6 4l14 8-14 8z" />],
};

interface FIIconProps {
  name: keyof typeof icons;
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function FIIcon({ name, size = 24, strokeWidth = 2.6, style, className }: FIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      className={className}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}
