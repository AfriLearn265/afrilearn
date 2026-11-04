import clsx from "clsx";

/**
 * Tiko, the AfriLearn tortoise: an original character for the Primary edition.
 * The clever tortoise is a favourite in Nigerian folk tales, so Tiko is a natural guide for young learners.
 */
export function Mascot({ className, pose = "wave", prop = "none", title }: {
  className?: string;
  pose?: "wave" | "stand" | "cheer";
  prop?: "none" | "book" | "cap" | "star";
  title?: string;
}) {
  const ink = "#1E1240";
  return (
    <svg viewBox="0 0 270 230" className={clsx("overflow-visible", className)} role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true} aria-label={title}>
      <ellipse cx="128" cy="214" rx="96" ry="10" fill={ink} opacity="0.14" />

      {/* tail and back legs */}
      <path d="M34 150 L12 160 L36 168 Z" fill="#9BDB4A" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
      <rect x="44" y="160" width="34" height="46" rx="16" fill="#9BDB4A" stroke={ink} strokeWidth="5" />
      <rect x="150" y="160" width="34" height="46" rx="16" fill="#9BDB4A" stroke={ink} strokeWidth="5" />

      {/* shell */}
      <path d="M30 164 C30 82 72 42 120 42 C168 42 212 82 212 164 Z" fill="#6C3EEB" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M56 152 C58 104 84 72 120 70 C156 72 184 104 186 152" fill="none" stroke="#8A63F7" strokeWidth="14" strokeLinecap="round" opacity="0.9" />
      <path d="M120 74 L146 92 L140 124 L100 124 L94 92 Z" fill="#FFCB2E" stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M72 108 L92 96 L98 126 L80 144 L62 136 Z" fill="#FF6BAA" stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M168 108 L148 96 L142 126 L160 144 L178 136 Z" fill="#33C2F2" stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M104 132 L136 132 L144 156 L96 156 Z" fill="#9BDB4A" stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M58 64 C72 52 86 48 98 48" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <rect x="20" y="152" width="202" height="22" rx="11" fill="#FF7A1A" stroke={ink} strokeWidth="5" />

      {/* front leg, and a raised arm behind the shell for waving or cheering */}
      <rect x="96" y="166" width="34" height="42" rx="16" fill="#9BDB4A" stroke={ink} strokeWidth="5" />
      {pose !== "stand" && (
        <g>
          <path d="M46 132 C28 116 22 92 28 70" fill="none" stroke={ink} strokeWidth="27" strokeLinecap="round" />
          <path d="M46 132 C28 116 22 92 28 70" fill="none" stroke="#9BDB4A" strokeWidth="17" strokeLinecap="round" />
          {pose === "wave" && <path d="M10 62 C12 54 16 48 22 44 M42 50 C46 54 48 60 48 66" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />}
        </g>
      )}

      {/* neck and head */}
      <path d="M190 156 C200 142 206 130 208 118" fill="none" stroke={ink} strokeWidth="35" strokeLinecap="round" />
      <path d="M190 156 C200 142 206 130 208 118" fill="none" stroke="#9BDB4A" strokeWidth="25" strokeLinecap="round" />
      <circle cx="214" cy="90" r="42" fill="#9BDB4A" stroke={ink} strokeWidth="5" />
      <ellipse cx="200" cy="86" rx="11.5" ry="13.5" fill="#fff" stroke={ink} strokeWidth="4" />
      <ellipse cx="229" cy="86" rx="11.5" ry="13.5" fill="#fff" stroke={ink} strokeWidth="4" />
      <circle cx="203" cy="89" r="5.8" fill={ink} />
      <circle cx="232" cy="89" r="5.8" fill={ink} />
      <circle cx="205" cy="86.5" r="2.1" fill="#fff" />
      <circle cx="234" cy="86.5" r="2.1" fill="#fff" />
      <ellipse cx="189" cy="106" rx="7" ry="4.5" fill="#FF6BAA" opacity="0.85" />
      <ellipse cx="241" cy="106" rx="7" ry="4.5" fill="#FF6BAA" opacity="0.85" />
      <path d="M203 108 Q214 119 225 108" fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />

      {prop === "cap" && (
        <g>
          <path d="M176 44 L216 26 L256 44 L216 62 Z" fill={ink} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
          <path d="M194 52 L194 62 C204 70 228 70 238 62 L238 52" fill={ink} />
          <path d="M252 46 L252 70" stroke="#FFCB2E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="252" cy="74" r="5" fill="#FFCB2E" />
        </g>
      )}
      {prop === "book" && (
        <g transform="rotate(-8 128 196)">
          <path d="M84 178 L128 186 L172 178 L172 214 L128 222 L84 214 Z" fill="#fff" stroke={ink} strokeWidth="5" strokeLinejoin="round" />
          <path d="M128 186 L128 222" stroke={ink} strokeWidth="4" />
          <path d="M94 190 L118 194 M94 200 L118 204 M138 194 L162 190 M138 204 L162 200" stroke="#B096FF" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {prop === "star" && (
        <path d="M236 52 L243 68 L260 70 L247 82 L251 99 L236 90 L221 99 L225 82 L212 70 L229 68 Z"
          fill="#FFCB2E" stroke={ink} strokeWidth="4.5" strokeLinejoin="round" transform="translate(6 -34)" />
      )}
    </svg>
  );
}

/** Small decorative shapes that echo the mascot's sticker style. */
export function Sparkle({ className, color = "#FFCB2E" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2 C22 14 26 18 38 20 C26 22 22 26 20 38 C18 26 14 22 2 20 C14 18 18 14 20 2 Z" fill={color} stroke="#1E1240" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Squiggle({ className, color = "#FF7A1A" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 30" className={className} aria-hidden="true">
      <path d="M4 18 C16 2 28 2 36 15 C44 28 56 28 64 15 C72 2 84 2 92 15 C100 28 110 26 116 14" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** A soft wave that joins a coloured band to the section below it. */
export function WaveEdge({ className, fill = "var(--color-paper)", flip }: { className?: string; fill?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={clsx("block h-[44px] w-full sm:h-[70px]", flip && "rotate-180", className)} aria-hidden="true">
      <path d="M0 52 C160 8 320 8 480 40 C640 72 800 86 960 58 C1120 30 1280 14 1440 40 L1440 90 L0 90 Z" fill={fill} />
    </svg>
  );
}
