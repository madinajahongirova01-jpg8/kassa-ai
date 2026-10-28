type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  label?: string;
};

function a11y(label?: string) {
  return label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
}

export function MicIcon({ size = 14, className, strokeWidth = 2.2, label }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={className} {...a11y(label)}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function TextIcon({ size = 14, className, strokeWidth = 2.2, label }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={className} {...a11y(label)}>
      <path d="M4 7h16M4 12h10M4 17h13" />
    </svg>
  );
}

export function CameraIcon({ size = 14, className, strokeWidth = 2.2, label }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={className} {...a11y(label)}>
      <rect x="4" y="6" width="16" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3.2" />
      <path d="M9 6l1.5-2h3L15 6" />
    </svg>
  );
}

export function CurvedArrow({ className }: { className?: string }) {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className} aria-hidden>
      <path d="M50 4 C 40 30, 20 30, 8 26" />
      <path d="M14 19 L 7 26 L 16 31" />
    </svg>
  );
}
