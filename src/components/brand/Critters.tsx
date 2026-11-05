import clsx from "clsx";

/**
 * Original animal faces pupils can use as their picture instead of a photo.
 * Safer for children, and they match Tiko's sticker style.
 */
export const CRITTERS = ["tortoise", "lion", "elephant", "owl", "frog", "giraffe"] as const;
export type Critter = (typeof CRITTERS)[number];

export const critterLabel: Record<Critter, string> = {
  tortoise: "Tortoise", lion: "Lion cub", elephant: "Elephant", owl: "Owl", frog: "Frog", giraffe: "Giraffe",
};

const INK = "#1E1240";

function Eyes({ y = 46, gap = 14, r = 6 }: { y?: number; gap?: number; r?: number }) {
  return (
    <g>
      <circle cx={50 - gap} cy={y} r={r + 3} fill="#fff" stroke={INK} strokeWidth="2.5" />
      <circle cx={50 + gap} cy={y} r={r + 3} fill="#fff" stroke={INK} strokeWidth="2.5" />
      <circle cx={50 - gap + 1} cy={y + 1} r={r - 1.5} fill={INK} />
      <circle cx={50 + gap + 1} cy={y + 1} r={r - 1.5} fill={INK} />
      <circle cx={50 - gap + 2.5} cy={y - 1} r="1.6" fill="#fff" />
      <circle cx={50 + gap + 2.5} cy={y - 1} r="1.6" fill="#fff" />
    </g>
  );
}

const Smile = ({ y = 62, w = 9 }: { y?: number; w?: number }) => (
  <path d={`M${50 - w} ${y} Q50 ${y + 8} ${50 + w} ${y}`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
);
const Cheeks = ({ y = 58, gap = 24 }: { y?: number; gap?: number }) => (
  <g fill="#FF6BAA" opacity="0.8"><ellipse cx={50 - gap} cy={y} rx="5" ry="3.2" /><ellipse cx={50 + gap} cy={y} rx="5" ry="3.2" /></g>
);

function Face({ kind }: { kind: Critter }) {
  switch (kind) {
    case "tortoise":
      return (
        <g>
          <circle cx="50" cy="54" r="30" fill="#9BDB4A" stroke={INK} strokeWidth="3" />
          <path d="M28 34 Q50 16 72 34" fill="#6C3EEB" stroke={INK} strokeWidth="3" />
          <Eyes y={50} /><Cheeks y={62} /><Smile y={66} />
        </g>
      );
    case "lion":
      return (
        <g>
          <circle cx="50" cy="52" r="36" fill="#FF7A1A" stroke={INK} strokeWidth="3" />
          <circle cx="50" cy="54" r="25" fill="#FFCB2E" stroke={INK} strokeWidth="3" />
          <circle cx="29" cy="31" r="7" fill="#FFCB2E" stroke={INK} strokeWidth="3" />
          <circle cx="71" cy="31" r="7" fill="#FFCB2E" stroke={INK} strokeWidth="3" />
          <Eyes y={50} gap={10} r={5} />
          <path d="M45 60 L55 60 L50 65 Z" fill={INK} />
          <Smile y={67} w={7} />
        </g>
      );
    case "elephant":
      return (
        <g>
          <ellipse cx="20" cy="52" rx="14" ry="20" fill="#B096FF" stroke={INK} strokeWidth="3" />
          <ellipse cx="80" cy="52" rx="14" ry="20" fill="#B096FF" stroke={INK} strokeWidth="3" />
          <circle cx="50" cy="50" r="27" fill="#D2C2FF" stroke={INK} strokeWidth="3" />
          <path d="M50 62 C50 76 44 82 38 80" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
          <path d="M50 62 C50 76 44 82 38 80" fill="none" stroke="#D2C2FF" strokeWidth="5.5" strokeLinecap="round" />
          <Eyes y={46} gap={11} r={5} /><Cheeks y={58} gap={19} />
        </g>
      );
    case "owl":
      return (
        <g>
          <path d="M24 30 L34 40 M76 30 L66 40" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="54" r="30" fill="#33C2F2" stroke={INK} strokeWidth="3" />
          <circle cx="36" cy="50" r="12" fill="#fff" stroke={INK} strokeWidth="3" />
          <circle cx="64" cy="50" r="12" fill="#fff" stroke={INK} strokeWidth="3" />
          <circle cx="37" cy="51" r="5" fill={INK} /><circle cx="65" cy="51" r="5" fill={INK} />
          <circle cx="38.5" cy="49" r="1.6" fill="#fff" /><circle cx="66.5" cy="49" r="1.6" fill="#fff" />
          <path d="M45 62 L55 62 L50 70 Z" fill="#FFCB2E" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      );
    case "frog":
      return (
        <g>
          <circle cx="33" cy="34" r="12" fill="#9BDB4A" stroke={INK} strokeWidth="3" />
          <circle cx="67" cy="34" r="12" fill="#9BDB4A" stroke={INK} strokeWidth="3" />
          <ellipse cx="50" cy="58" rx="33" ry="24" fill="#9BDB4A" stroke={INK} strokeWidth="3" />
          <Eyes y={34} gap={17} r={5} />
          <path d="M32 62 Q50 76 68 62" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <Cheeks y={60} gap={26} />
        </g>
      );
    case "giraffe":
      return (
        <g>
          <path d="M38 26 L36 12 M62 26 L64 12" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="36" cy="11" r="4" fill="#FF7A1A" stroke={INK} strokeWidth="2.5" />
          <circle cx="64" cy="11" r="4" fill="#FF7A1A" stroke={INK} strokeWidth="2.5" />
          <ellipse cx="50" cy="50" rx="26" ry="30" fill="#FFCB2E" stroke={INK} strokeWidth="3" />
          <circle cx="34" cy="34" r="4" fill="#FF7A1A" /><circle cx="68" cy="40" r="5" fill="#FF7A1A" /><circle cx="38" cy="72" r="3.5" fill="#FF7A1A" />
          <ellipse cx="50" cy="66" rx="15" ry="10" fill="#FFE07A" stroke={INK} strokeWidth="2.5" />
          <circle cx="45" cy="64" r="1.8" fill={INK} /><circle cx="55" cy="64" r="1.8" fill={INK} />
          <Eyes y={46} gap={10} r={5} />
        </g>
      );
  }
}

const backgrounds: Record<Critter, string> = {
  tortoise: "#FFE07A", lion: "#8FDCF8", elephant: "#FFA9CD", owl: "#FFE07A", frog: "#D2C2FF", giraffe: "#C4EF8D",
};

export function CritterFace({ kind, className, title }: { kind: Critter; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={clsx("shrink-0 rounded-full", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="50" cy="50" r="50" fill={backgrounds[kind]} />
      <Face kind={kind} />
    </svg>
  );
}

export function critterFromUrl(url: string | null | undefined): Critter | null {
  if (!url?.startsWith("avatar:")) return null;
  const k = url.slice(7);
  return (CRITTERS as readonly string[]).includes(k) ? (k as Critter) : null;
}
