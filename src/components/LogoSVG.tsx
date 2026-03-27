const LogoSVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 320 88"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Class VIP Transfers"
  >
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F7E070" />
        <stop offset="45%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#A07820" />
      </linearGradient>
      <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBE96A" />
        <stop offset="100%" stopColor="#C9A020" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ── Van silhouette ── */}
    {/* Body */}
    <path
      d="M6 62 L6 36 Q7 24 18 21 L44 16 Q54 14 62 14 L76 14 Q84 14 84 22 L84 62 Z"
      fill="url(#goldGrad)"
    />
    {/* Roof cab bump */}
    <path
      d="M18 21 Q12 21 10 28 L10 36 L44 36 L44 16 Z"
      fill="#C9A020"
      opacity="0.4"
    />
    {/* Front windshield */}
    <path
      d="M13 26 Q14 22 20 20 L40 17 L40 34 L13 34 Z"
      fill="#0d1b3e"
      opacity="0.85"
    />
    {/* Side windows */}
    <rect x="46" y="18" width="16" height="14" rx="2" fill="#0d1b3e" opacity="0.85" />
    <rect x="64" y="18" width="14" height="14" rx="2" fill="#0d1b3e" opacity="0.85" />
    {/* Side panel line */}
    <line x1="6" y1="48" x2="84" y2="48" stroke="#A07820" strokeWidth="1" opacity="0.5" />
    {/* Front bumper */}
    <rect x="6" y="60" width="6" height="4" rx="1" fill="#A07820" />
    {/* Rear bumper */}
    <rect x="78" y="60" width="6" height="4" rx="1" fill="#A07820" />
    {/* Headlight */}
    <rect x="7" y="36" width="5" height="7" rx="1" fill="#FBE96A" opacity="0.9" />
    {/* Rear light */}
    <rect x="80" y="36" width="4" height="7" rx="1" fill="#ff6b6b" opacity="0.7" />
    {/* Left wheel */}
    <circle cx="24" cy="64" r="10" fill="#0d1b3e" />
    <circle cx="24" cy="64" r="6" fill="#1a2744" />
    <circle cx="24" cy="64" r="3.5" fill="url(#goldGrad)" />
    {/* Right wheel */}
    <circle cx="68" cy="64" r="10" fill="#0d1b3e" />
    <circle cx="68" cy="64" r="6" fill="#1a2744" />
    <circle cx="68" cy="64" r="3.5" fill="url(#goldGrad)" />
    {/* Ground shadow */}
    <ellipse cx="45" cy="76" rx="42" ry="4" fill="#000" opacity="0.18" />

    {/* ── Brand text ── */}
    {/* "CLASS VIP" */}
    <text
      x="100"
      y="42"
      fontFamily="'Georgia', 'Times New Roman', serif"
      fontSize="34"
      fontWeight="700"
      fill="url(#goldText)"
      letterSpacing="1.5"
      filter="url(#glow)"
    >
      CLASS VIP
    </text>

    {/* Thin gold separator line */}
    <rect x="100" y="47" width="218" height="1.2" fill="url(#goldGrad)" opacity="0.6" />

    {/* "TRANSFERS" */}
    <text
      x="101"
      y="62"
      fontFamily="'Arial', 'Helvetica', sans-serif"
      fontSize="12.5"
      fontWeight="400"
      fill="#e8e0cc"
      letterSpacing="8"
    >
      TRANSFERS
    </text>

    {/* Stars */}
    <text
      x="102"
      y="77"
      fontFamily="'Arial', sans-serif"
      fontSize="9"
      fill="url(#goldGrad)"
      letterSpacing="6"
      opacity="0.9"
    >
      ★ ★ ★ ★ ★
    </text>
  </svg>
);

export default LogoSVG;
