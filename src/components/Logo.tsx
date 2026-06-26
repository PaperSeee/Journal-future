// HqGambler monogram — a steel "HQ" mark inside a rounded tile with a subtle
// suit/probability motif (the diamond), evoking "the gamble, mastered".
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="HqGambler"
    >
      <defs>
        <linearGradient id="hqg-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#6EC1F0" />
          <stop offset="1" stopColor="#2E6F9E" />
        </linearGradient>
        <linearGradient id="hqg-tile" x1="0" y1="0" x2="0" y2="48">
          <stop offset="0" stopColor="#1C2230" />
          <stop offset="1" stopColor="#11141B" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#hqg-tile)"
        stroke="#2A3343"
      />
      {/* subtle diamond watermark */}
      <path d="M24 9 L33 24 L24 39 L15 24 Z" fill="url(#hqg-grad)" opacity="0.10" />
      {/* H */}
      <path
        d="M13 16 V32 M13 24 H21 M21 16 V32"
        stroke="url(#hqg-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Q */}
      <circle
        cx="32"
        cy="24"
        r="6.4"
        stroke="url(#hqg-grad)"
        strokeWidth="2.6"
      />
      <path
        d="M33 25 L37.5 30"
        stroke="url(#hqg-grad)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
