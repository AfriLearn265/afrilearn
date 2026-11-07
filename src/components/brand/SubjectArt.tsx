/**
 * Original illustrations for the core subjects, drawn in the same ink-outline sticker style as Tiko.
 * English: an open storybook with letters. Mathematics: counting blocks. Basic Science: a flask and a seedling.
 */
export function SubjectArt({ code, className }: { code: string; className?: string }) {
  if (code === "english") return <EnglishArt className={className} />;
  if (code === "mathematics") return <MathsArt className={className} />;
  if (code === "basic-science") return <ScienceArt className={className} />;
  return <BooksArt className={className} />;
}

const ink = "#1E1240";

function EnglishArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <path d="M14 34 Q46 22 80 36 L80 106 Q46 92 14 104 Z" fill="#fff" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M146 34 Q114 22 80 36 L80 106 Q114 92 146 104 Z" fill="#FFF6D1" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M26 52 Q46 46 66 54 M26 66 Q46 60 66 68 M26 80 Q46 74 66 82" stroke="#B096FF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <text x="113" y="80" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="34" fill={ink}>Aa</text>
      <circle cx="132" cy="18" r="9" fill="#FF6BAA" stroke={ink} strokeWidth="3.5" />
      <path d="M22 12 l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#FFCB2E" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function MathsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect x="14" y="62" width="40" height="40" rx="8" fill="#FFCB2E" stroke={ink} strokeWidth="4" />
      <rect x="60" y="62" width="40" height="40" rx="8" fill="#33C2F2" stroke={ink} strokeWidth="4" />
      <rect x="37" y="18" width="40" height="40" rx="8" fill="#FF6BAA" stroke={ink} strokeWidth="4" transform="rotate(-8 57 38)" />
      <text x="34" y="92" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="26" fill={ink}>1</text>
      <text x="80" y="92" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="26" fill={ink}>2</text>
      <text x="57" y="48" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="26" fill={ink} transform="rotate(-8 57 38)">3</text>
      <circle cx="128" cy="44" r="22" fill="#fff" stroke={ink} strokeWidth="4" />
      <path d="M128 33 v22 M117 44 h22" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M118 84 l20 16 M138 84 l-20 16" stroke="#6C3EEB" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function ScienceArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <path d="M44 14 h28 M50 14 v28 L24 96 Q20 106 32 106 h52 Q96 106 92 96 L66 42 V14" fill="#fff" stroke={ink} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M33 86 Q58 78 84 88 L90 100 Q92 104 86 104 H30 Q24 104 27 98 Z" fill="#9BDB4A" />
      <circle cx="48" cy="74" r="5" fill="#fff" stroke={ink} strokeWidth="3" />
      <circle cx="64" cy="62" r="3.5" fill="#fff" stroke={ink} strokeWidth="3" />
      <path d="M124 106 V62" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M124 78 Q104 74 100 56 Q120 56 124 78 Z" fill="#9BDB4A" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M124 66 Q142 60 146 42 Q128 42 124 66 Z" fill="#5A9E17" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M108 106 h32" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      <circle cx="132" cy="16" r="10" fill="#FFCB2E" stroke={ink} strokeWidth="3.5" />
    </svg>
  );
}

function BooksArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect x="30" y="30" width="26" height="76" rx="5" fill="#FF9442" stroke={ink} strokeWidth="4" />
      <rect x="60" y="22" width="26" height="84" rx="5" fill="#8A63F7" stroke={ink} strokeWidth="4" />
      <rect x="92" y="40" width="26" height="66" rx="5" fill="#33C2F2" stroke={ink} strokeWidth="4" transform="rotate(10 105 73)" />
    </svg>
  );
}
