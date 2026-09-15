export function QuimixMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 120"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connecting hose between mouths (top) */}
      <path
        d="M58 22 C72 6, 92 6, 106 18"
        fill="none"
        stroke="#e8a57a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M58 22 C72 6, 92 6, 106 18"
        fill="none"
        stroke="#f4c4a0"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Left flask (Erlenmeyer-like with side neck) */}
      <path
        d="M46 28 L46 42 L28 88 Q26 96 34 96 L70 96 Q78 96 76 88 L58 42 L58 28 Z"
        fill="rgba(244,250,247,0.06)"
        stroke="#f4faf7"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      {/* Side neck + stopper */}
      <path
        d="M46 34 L28 22"
        fill="none"
        stroke="#f4faf7"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <rect
        x="20"
        y="16"
        width="12"
        height="8"
        rx="2"
        transform="rotate(-35 26 20)"
        fill="#f4faf7"
      />
      {/* Mouth rim */}
      <rect x="44" y="24" width="16" height="7" rx="2" fill="#f4faf7" />
      {/* Teal liquid */}
      <path
        d="M33 72 L36 88 Q34 94 40 94 L64 94 Q70 94 68 88 L71 72 Z"
        fill="#3d8f74"
      />
      <circle cx="44" cy="80" r="1.8" fill="#0f2a24" opacity="0.45" />
      <circle cx="54" cy="84" r="1.4" fill="#0f2a24" opacity="0.4" />
      <circle cx="50" cy="76" r="1.2" fill="#0f2a24" opacity="0.35" />

      {/* Right test tube */}
      <rect
        x="100"
        y="28"
        width="24"
        height="68"
        rx="12"
        fill="rgba(244,250,247,0.06)"
        stroke="#f4faf7"
        strokeWidth="3.4"
      />
      <rect x="98" y="24" width="28" height="9" rx="2.5" fill="#f4faf7" />
      {/* Terracotta liquid */}
      <path
        d="M104 58 h16 v26 a8 8 0 0 1 -16 0 z"
        fill="#c45c26"
      />
      <circle cx="110" cy="68" r="1.6" fill="#0f2a24" opacity="0.4" />
      <circle cx="116" cy="74" r="1.3" fill="#0f2a24" opacity="0.35" />
      <circle cx="112" cy="80" r="1.1" fill="#0f2a24" opacity="0.3" />
    </svg>
  );
}
