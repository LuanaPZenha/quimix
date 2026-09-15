import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  colorForSymbol,
  identifyMixture,
  prettyFormula,
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
};

const PHASE_COPY: Record<Phase, (name: string, formula: string) => string> = {
  idle: () => "Aguardando a simulação…",
  pour: () => "Os elementos caem no béquer…",
  mix: () => "A mistura reage e muda de cor…",
  reveal: (name, formula) => `Transformou-se em ${name} (${formula}).`,
};

function ProductGlyph({ kind }: { kind: MixtureKind }) {
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

export function MixtureBeaker({ items, playing, busy = false }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const outcome = useMemo(
    () =>
      identifyMixture(
        items.map((item) => ({
          symbol: item.element.symbol,
          volumeMl: Number(item.volumeMl) || 0,
        })),
      ),
    [items],
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
    const mixTimer = window.setTimeout(() => setPhase("mix"), 900);
    const revealTimer = window.setTimeout(() => setPhase("reveal"), 2300);
    return () => {
      window.clearTimeout(mixTimer);
      window.clearTimeout(revealTimer);
    };
  }, [playing, outcome.key]);

  const formula = prettyFormula(outcome.formula);
  const stageClass = [
    "lab-stage",
    `theme-${outcome.kind}`,
    items.length > 0 ? "has-items" : "",
    playing || busy ? "is-playing" : "",
    `is-${busy && !playing ? "mix" : phase}`,
  ]
    .filter(Boolean)
    .join(" ");

  const status =
    busy && !playing
      ? "Calculando a mistura…"
      : items.length === 0
        ? "Selecione elementos para ver a transformação."
        : phase === "reveal" && playing
          ? PHASE_COPY.reveal(outcome.name, formula)
          : playing
            ? PHASE_COPY[phase](outcome.name, formula)
            : `Pronto para misturar ${items.map((item) => item.element.symbol).join(" + ")}.`;

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

      <div className="lab-vessel" aria-hidden="true">
        <div className="lab-rim" />
        <div className="lab-liquid lab-liquid-mix" />
        <div className="lab-liquid lab-liquid-product" />
        <div className="lab-shine" />
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

      <div className="lab-copy">
        <ProductGlyph kind={outcome.kind} />
        <p className="lab-status" aria-live="polite">
          {status}
        </p>
        {playing && phase === "reveal" ? (
          <>
            <p className="lab-equation">{outcome.equation}</p>
            <p className="lab-caption">{outcome.caption}</p>
            {outcome.ratioHint ? <p className="lab-hint">{outcome.ratioHint}</p> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
