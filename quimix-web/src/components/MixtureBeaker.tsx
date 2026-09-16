import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  colorForSymbol,
  identifyMixture,
  prettyFormula,
  type MixtureEffect,
  type MixtureKind,
} from "../data/mixtureOutcomes";
import { CATEGORY_COLORS, type PeriodicElement } from "../data/periodicTable";

type BeakerItem = {
  element: PeriodicElement;
  volumeMl: string;
};

type Phase = "idle" | "pour" | "mix" | "reveal";

type Props = {
  items: BeakerItem[];
  playing: boolean;
  busy?: boolean;
  sourceFormulas?: string[];
};

function ProductGlyph({ kind, effect }: { kind: MixtureKind; effect: MixtureEffect }) {
  if (effect === "explode") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <defs>
          <radialGradient id="g-boom" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#fff8e0" />
            <stop offset="28%" stopColor="#ffb347" />
            <stop offset="62%" stopColor="#6a3a22" />
            <stop offset="100%" stopColor="#2a2218" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="36" cy="28" rx="26" ry="16" fill="url(#g-boom)" />
        <ellipse cx="36" cy="38" rx="10" ry="14" fill="#4a443c" opacity="0.55" />
      </svg>
    );
  }
  if (effect === "ignite") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <defs>
          <radialGradient id="g-fire" cx="50%" cy="78%" r="70%">
            <stop offset="0%" stopColor="#fff3c0" />
            <stop offset="35%" stopColor="#ff9a2b" />
            <stop offset="100%" stopColor="#7a1408" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="36" cy="38" rx="22" ry="8" fill="#3a1810" opacity="0.45" />
        <ellipse cx="36" cy="28" rx="16" ry="18" fill="url(#g-fire)" />
      </svg>
    );
  }
  if (effect === "melt" || kind === "acid") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <ellipse cx="36" cy="30" rx="14" ry="12" fill="#c6d96a" opacity="0.85" />
        <path d="M24 8 H48" stroke="#dfe8a8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "powder") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <ellipse cx="36" cy="38" rx="22" ry="6" fill="#2a2118" />
        <circle cx="24" cy="32" r="4" fill="#3a3228" />
        <circle cx="34" cy="30" r="5" fill="#2a2118" />
        <circle cx="44" cy="33" r="3.5" fill="#4a4034" />
        <circle cx="38" cy="26" r="3" fill="#3a3228" />
      </svg>
    );
  }
  if (effect === "freeze" || kind === "ice") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <ellipse cx="36" cy="34" rx="18" ry="8" fill="#c8e4f8" />
        <path d="M36 12 V38 M24 25 H48 M28 18 L44 32 M44 18 L28 32" stroke="#7eb4d6" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "water") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <circle cx="36" cy="20" r="10" fill="#e24b4b" />
        <circle cx="16" cy="34" r="7" fill="#f7fbff" stroke="#c5d7e4" />
        <circle cx="56" cy="34" r="7" fill="#f7fbff" stroke="#c5d7e4" />
        <line x1="28" y1="26" x2="20" y2="30" stroke="#d7e6ef" strokeWidth="2" />
        <line x1="44" y1="26" x2="52" y2="30" stroke="#d7e6ef" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "salt") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <rect x="18" y="14" width="16" height="16" rx="2" fill="#f7fbff" stroke="#c9d6de" transform="rotate(12 26 22)" />
        <rect x="38" y="18" width="14" height="14" rx="2" fill="#eef4f8" stroke="#c9d6de" transform="rotate(-8 45 25)" />
        <rect x="30" y="28" width="12" height="12" rx="2" fill="#fff" stroke="#c9d6de" />
      </svg>
    );
  }
  if (kind === "gas") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <circle cx="22" cy="28" r="8" fill="none" stroke="#d7e6ef" strokeWidth="2" />
        <circle cx="38" cy="18" r="10" fill="none" stroke="#d7e6ef" strokeWidth="2" />
        <circle cx="54" cy="30" r="7" fill="none" stroke="#d7e6ef" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "alloy") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <rect x="14" y="18" width="20" height="16" rx="2" fill="#c5d0d6" />
        <rect x="30" y="14" width="22" height="16" rx="2" fill="#d4b44a" opacity="0.9" />
        <rect x="38" y="22" width="20" height="14" rx="2" fill="#b87333" opacity="0.85" />
      </svg>
    );
  }
  if (kind === "organic") {
    return (
      <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
        <circle cx="18" cy="24" r="7" fill="#3a3a3a" />
        <circle cx="36" cy="24" r="7" fill="#3a3a3a" />
        <circle cx="54" cy="24" r="7" fill="#3a3a3a" />
        <line x1="25" y1="24" x2="29" y2="24" stroke="#d7e6ef" strokeWidth="2" />
        <line x1="43" y1="24" x2="47" y2="24" stroke="#d7e6ef" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className="lab-glyph" viewBox="0 0 72 48" aria-hidden="true">
      <circle cx="36" cy="24" r="11" fill="currentColor" opacity="0.85" />
      <circle cx="22" cy="30" r="7" fill="currentColor" opacity="0.55" />
      <circle cx="50" cy="30" r="7" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function statusCopy(
  kind: MixtureKind,
  effect: MixtureEffect,
  phase: Phase,
  name: string,
  formula: string,
  symbols: string,
): string {
  if (phase === "pour") return "Os elementos caem no béquer…";
  if (phase === "mix") {
    if (effect === "ignite") return "A mistura inflama ao contato com o ar…";
    if (effect === "explode") return "A reação ficou violenta…";
    if (effect === "melt") return "O ácido começa a atacar o vidro…";
    if (effect === "freeze") return "A mistura absorve calor e esfria…";
    if (kind === "gas") return "O gás se libera e enche o béquer…";
    if (kind === "powder") return "Os sólidos se combinam em um pó…";
    return "A mistura reage e muda de aspecto…";
  }
  if (phase === "reveal") {
    if (effect === "ignite") return `Inflamou ao se formar: ${name} (${formula}).`;
    if (effect === "explode") return `A mistura explodiu: ${name} (${formula}).`;
    if (effect === "melt") return `O vidro foi atacado: ${name} (${formula}).`;
    if (effect === "freeze") return `A mistura congelou o entorno: ${name} (${formula}).`;
    return `Transformou-se em ${name} (${formula}).`;
  }
  return symbols ? `Pronto para misturar ${symbols}.` : "Aguardando a simulação…";
}

export function MixtureBeaker({ items, playing, busy = false, sourceFormulas }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const outcome = useMemo(
    () =>
      identifyMixture(
        items.map((item) => ({
          symbol: item.element.symbol,
          volumeMl: Number(item.volumeMl) || 0,
        })),
        { sourceFormulas },
      ),
    [items, sourceFormulas],
  );

  const mixA = items[0]
    ? colorForSymbol(items[0].element.symbol, CATEGORY_COLORS[items[0].element.category])
    : "#7aa392";
  const mixB = items[1]
    ? colorForSymbol(items[1].element.symbol, CATEGORY_COLORS[items[1].element.category])
    : mixA;

  useEffect(() => {
    if (!playing) {
      setPhase("idle");
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("reveal");
      return;
    }
    setPhase("pour");
    const mixAt =
      outcome.effect === "explode"
        ? 560
        : outcome.effect === "ignite"
          ? 650
          : outcome.effect === "melt" || outcome.effect === "freeze"
            ? 720
            : 900;
    const revealAt =
      outcome.effect === "explode"
        ? 1280
        : outcome.effect === "ignite"
          ? 1600
          : outcome.effect === "melt" || outcome.effect === "freeze"
            ? 1680
            : 2100;
    const mixTimer = window.setTimeout(() => setPhase("mix"), mixAt);
    const revealTimer = window.setTimeout(() => setPhase("reveal"), revealAt);
    return () => {
      window.clearTimeout(mixTimer);
      window.clearTimeout(revealTimer);
    };
  }, [playing, outcome.key, outcome.kind, outcome.effect]);

  const formula = prettyFormula(outcome.formula);
  const stageClass = [
    "lab-stage",
    `theme-${outcome.kind}`,
    `effect-${outcome.effect}`,
    items.length > 0 ? "has-items" : "",
    playing || busy ? "is-playing" : "",
    `is-${busy && !playing ? "mix" : phase}`,
  ]
    .filter(Boolean)
    .join(" ");

  const symbols = items.map((item) => item.element.symbol).join(" + ");
  const status =
    busy && !playing
      ? "Calculando a mistura…"
      : items.length === 0
        ? "Monte a mistura para ver a transformação."
        : phase === "reveal" && playing
          ? statusCopy(outcome.kind, outcome.effect, "reveal", outcome.name, formula, symbols)
          : playing
            ? statusCopy(outcome.kind, outcome.effect, phase, outcome.name, formula, symbols)
            : statusCopy(outcome.kind, outcome.effect, "idle", outcome.name, formula, symbols);

  return (
    <div
      className={stageClass}
      style={
        {
          "--mix-a": mixA,
          "--mix-b": mixB,
          "--product": outcome.liquidColor,
        } as CSSProperties
      }
    >
      <div className="lab-drops" aria-hidden="true">
        {items.slice(0, 4).map((item, index) => (
          <span
            key={item.element.symbol}
            className="lab-drop"
            style={{
              background: colorForSymbol(
                item.element.symbol,
                CATEGORY_COLORS[item.element.category],
              ),
              animationDelay: `${0.12 * index}s`,
              left: `${22 + index * 18}%`,
            }}
          >
            {item.element.symbol}
          </span>
        ))}
      </div>

      <div className="lab-boom" aria-hidden="true">
        <div className="lab-flash-veil" />
        <div className="lab-core" />
        <div className="lab-fireball" />
        <div className="lab-shockwave n1" />
        <div className="lab-shockwave n2" />
        <div className="lab-shockwave n3" />
        <div className="lab-puff">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <svg className="lab-atom" viewBox="0 0 240 280" overflow="visible">
          <defs>
            <filter id="qm-smoke" x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="7.5" />
            </filter>
            <filter id="qm-fire" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <radialGradient id="qm-stem" cx="50%" cy="78%" r="72%">
              <stop offset="0%" stopColor="#6e675c" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#2a241c" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="qm-cap" cx="50%" cy="42%" r="58%">
              <stop offset="0%" stopColor="#8a8276" stopOpacity="0.88" />
              <stop offset="48%" stopColor="#3c362e" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#16120e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="qm-core" cx="50%" cy="52%" r="52%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="22%" stopColor="#ffe08a" />
              <stop offset="52%" stopColor="#ff6a14" />
              <stop offset="100%" stopColor="#4a1008" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="atom-stem" filter="url(#qm-smoke)" fill="url(#qm-stem)">
            <ellipse cx="120" cy="236" rx="24" ry="32" />
            <ellipse cx="116" cy="204" rx="20" ry="28" />
            <ellipse cx="124" cy="174" rx="18" ry="26" />
            <ellipse cx="120" cy="150" rx="16" ry="22" />
          </g>
          <g className="atom-cap" filter="url(#qm-smoke)" fill="url(#qm-cap)">
            <ellipse cx="120" cy="118" rx="78" ry="46" />
            <ellipse cx="64" cy="128" rx="44" ry="30" />
            <ellipse cx="176" cy="126" rx="46" ry="32" />
            <ellipse cx="120" cy="90" rx="52" ry="30" />
            <ellipse cx="92" cy="142" rx="28" ry="18" />
            <ellipse cx="150" cy="140" rx="30" ry="18" />
          </g>
          <g className="atom-fire" filter="url(#qm-fire)" fill="url(#qm-core)">
            <ellipse cx="120" cy="112" rx="40" ry="26" />
            <ellipse cx="120" cy="96" rx="22" ry="16" />
          </g>
        </svg>
        <div className="lab-sparks">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className={`n${i + 1}`} />
          ))}
        </div>
        <div className="lab-shards">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`n${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="lab-scene" aria-hidden="true">
        <div className="lab-fire-glow" />
        <div className="lab-flames">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lab-embers">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lab-fog">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="lab-vessel">
          <div className="lab-rim" />
          <div className="lab-liquid lab-liquid-mix" />
          <div className="lab-liquid lab-liquid-product" />
          <div className="lab-shine" />
          <div className="lab-cracks" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="lab-etch" aria-hidden="true" />
          <div className="lab-grains" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="lab-bubbles">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={`lab-bubble n${i + 1}`} />
            ))}
          </div>
          <div className="lab-crystals">
            <span />
            <span />
            <span />
          </div>
          <div className="lab-steam">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="lab-frost" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="lab-melt" aria-hidden="true">
          <span className="lab-drip n1" />
          <span className="lab-drip n2" />
          <span className="lab-drip n3" />
          <span className="lab-drip n4" />
          <span className="lab-puddle" />
        </div>
      </div>

      <div className="lab-copy">
        <ProductGlyph kind={outcome.kind} effect={outcome.effect} />
        <p className="lab-status" aria-live="polite">
          {status}
        </p>
        {playing && phase === "reveal" ? (
          <>
            <p className="lab-equation">{outcome.equation}</p>
            <p className="lab-caption">{outcome.caption}</p>
            {outcome.why ? <p className="lab-why">{outcome.why}</p> : null}
            {outcome.ratioHint ? <p className="lab-hint">{outcome.ratioHint}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
