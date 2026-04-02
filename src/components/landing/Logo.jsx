const Logo = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <rect width="56" height="56" rx="14" fill="#3B6AE6"/>
    <polygon points="32,12 44,16 44,22 38,24 32,22" fill="white"/><polygon points="34,22 44,22 42,26 34,25" fill="white" opacity="0.85"/><circle cx="38" cy="17" r="1.5" fill="#3B6AE6"/><polygon points="32,18 34,24 28,32 26,24" fill="white"/><polygon points="18,28 32,26 34,38 28,44 16,44 12,36" fill="white"/><polygon points="12,36 8,28 10,26 14,32" fill="white"/><line x1="32" y1="30" x2="35" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round"/><polygon points="22,44 20,48 24,48 26,44" fill="white"/><polygon points="28,42 27,48 31,48 30,42" fill="white"/>
  </svg>
);

export default Logo;
