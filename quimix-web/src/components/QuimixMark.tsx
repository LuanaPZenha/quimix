export function QuimixMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 110 120"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="quimix-logo-flash" cx="50%" cy="48%" r="50%">
          <stop offset="0%" stopColor="#fffce8" />
          <stop offset="38%" stopColor="#ffd27a" />
          <stop offset="72%" stopColor="#e24b1c" />
          <stop offset="100%" stopColor="#e24b1c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="mark-flash" cx="55" cy="68" r="22" fill="url(#quimix-logo-flash)" />
      <circle
        className="mark-ring mark-ring-a"
        cx="55"
        cy="68"
        r="16"
        fill="none"
        stroke="#ffb347"
        strokeWidth="2.4"
      />
      <circle
        className="mark-ring mark-ring-b"
        cx="55"
        cy="68"
        r="16"
        fill="none"
        stroke="#e24b1c"
        strokeWidth="1.8"
      />

      <g className="mark-sparks" fill="#ffd27a">
        <rect className="mark-spark sp1" x="54" y="66" width="2.4" height="11" rx="1" />
        <rect className="mark-spark sp2" x="54" y="66" width="2.4" height="10" rx="1" />
        <rect className="mark-spark sp3" x="54" y="66" width="2.2" height="10" rx="1" />
        <rect className="mark-spark sp4" x="54" y="66" width="2.2" height="9" rx="1" />
        <rect className="mark-spark sp5" x="54" y="66" width="2.4" height="11" rx="1" />
        <rect className="mark-spark sp6" x="54" y="66" width="2.2" height="9" rx="1" />
        <rect className="mark-spark sp7" x="54" y="66" width="2" height="8" rx="1" />
        <rect className="mark-spark sp8" x="54" y="66" width="2" height="9" rx="1" />
      </g>

      <g className="mark-shards">
        <path className="mark-shard sh1" d="M38 42 L18 28 L26 58 Z" fill="#f3efe6" stroke="currentColor" strokeWidth="1.2" />
        <path className="mark-shard sh2" d="M72 40 L94 26 L84 62 Z" fill="#f3efe6" stroke="currentColor" strokeWidth="1.2" />
        <path className="mark-shard sh3" d="M40 92 L22 108 L52 112 Z" fill="#efe8dc" stroke="currentColor" strokeWidth="1.1" />
        <path className="mark-shard sh4" d="M70 90 L90 108 L56 112 Z" fill="#efe8dc" stroke="currentColor" strokeWidth="1.1" />
        <path className="mark-shard sh5" d="M52 24 L42 8 L64 6 Z" fill="#f3efe6" stroke="currentColor" strokeWidth="1.2" />
        <rect className="mark-shard sh6" x="12" y="62" width="12" height="5" rx="1" fill="#f3efe6" stroke="currentColor" strokeWidth="1" transform="rotate(-30 18 64)" />
        <rect className="mark-shard sh7" x="86" y="60" width="12" height="5" rx="1" fill="#f3efe6" stroke="currentColor" strokeWidth="1" transform="rotate(26 92 62)" />
      </g>

      <g className="mark-drops">
        <circle className="mark-drop d1" cx="55" cy="76" r="4.2" fill="#c45c26" />
        <circle className="mark-drop d2" cx="55" cy="76" r="3.2" fill="#e07a3a" />
        <circle className="mark-drop d3" cx="55" cy="76" r="2.8" fill="#c45c26" />
        <circle className="mark-drop d4" cx="55" cy="76" r="2.4" fill="#f0a05a" />
        <circle className="mark-drop d5" cx="55" cy="76" r="2" fill="#ffd27a" />
      </g>

      <g className="mark-beaker">
        <path
          className="mark-glass"
          d="M40 18 L40 30 L24 82 Q22 98 38 100 L72 100 Q88 98 86 82 L70 30 L70 18"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        <path
          d="M70 24 L86 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <rect x="80" y="6" width="13" height="7.5" rx="1.6" fill="currentColor" transform="rotate(-38 86 10)" />
        <rect x="37" y="14" width="36" height="8.5" rx="2" fill="currentColor" />
        <path
          className="mark-liquid"
          d="M31 66 L26 82 Q24 96 40 97.5 L70 97.5 Q86 96 84 82 L79 66 Z"
          fill="#c45c26"
        />
        <path
          d="M33 68 Q55 61 77 68"
          fill="none"
          stroke="#f4c4a0"
          strokeWidth="1.7"
          opacity="0.6"
        />
        <path
          className="mark-crack c1"
          d="M55 28 L50 52 L58 74"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          className="mark-crack c2"
          d="M55 46 L66 62"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle className="mark-bubble b1" cx="44" cy="82" r="2" fill="#0f2a24" opacity="0.4" />
        <circle className="mark-bubble b2" cx="57" cy="88" r="1.6" fill="#0f2a24" opacity="0.35" />
        <circle className="mark-bubble b3" cx="68" cy="80" r="1.4" fill="#0f2a24" opacity="0.32" />
      </g>
    </svg>
  );
}
