import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PERIODIC_ELEMENTS,
  type ElementCategory,
  type PeriodicElement,
} from "../data/periodicTable";

type Props = {
  selectedSymbols: Set<string>;
  onToggle: (element: PeriodicElement) => void;
};

const MAIN_PERIODS = [1, 2, 3, 4, 5, 6, 7];
const GROUPS = Array.from({ length: 18 }, (_, i) => i + 1);

function cellFor(period: number, group: number): PeriodicElement | undefined {
  return PERIODIC_ELEMENTS.find((el) => el.period === period && el.group === group);
}

function seriesElements(period: number): PeriodicElement[] {
  return PERIODIC_ELEMENTS.filter((el) => el.period === period).sort(
    (a, b) => a.group - b.group,
  );
}

export function PeriodicTable({ selectedSymbols, onToggle }: Props) {
  const categories = Object.keys(CATEGORY_LABELS) as ElementCategory[];

  return (
    <div className="pt-wrap">
      <div className="pt-grid" role="grid" aria-label="Tabela periódica">
        {MAIN_PERIODS.map((period) =>
          GROUPS.map((group) => {
            const el = cellFor(period, group);
            if (!el) {
              return (
                <div
                  key={`empty-${period}-${group}`}
                  className="pt-cell pt-empty"
                  style={{ gridColumn: group, gridRow: period }}
                />
              );
            }
            const selected = selectedSymbols.has(el.symbol);
            return (
              <button
                key={el.symbol}
                type="button"
                className={`pt-cell${selected ? " is-selected" : ""}`}
                style={{
                  gridColumn: group,
                  gridRow: period,
                  background: CATEGORY_COLORS[el.category],
                }}
                title={`${el.name} (${el.symbol})`}
                onClick={() => onToggle(el)}
              >
                <span className="pt-z">{el.z}</span>
                <span className="pt-symbol">{el.symbol}</span>
              </button>
            );
          }),
        )}
      </div>

      <div className="pt-series">
        <div className="pt-series-row">
          <span className="pt-series-label">La–Lu</span>
          {seriesElements(8).map((el) => {
            const selected = selectedSymbols.has(el.symbol);
            return (
              <button
                key={el.symbol}
                type="button"
                className={`pt-cell pt-series-cell${selected ? " is-selected" : ""}`}
                style={{ background: CATEGORY_COLORS[el.category] }}
                title={`${el.name} (${el.symbol})`}
                onClick={() => onToggle(el)}
              >
                <span className="pt-z">{el.z}</span>
                <span className="pt-symbol">{el.symbol}</span>
              </button>
            );
          })}
        </div>
        <div className="pt-series-row">
          <span className="pt-series-label">Ac–Lr</span>
          {seriesElements(9).map((el) => {
            const selected = selectedSymbols.has(el.symbol);
            return (
              <button
                key={el.symbol}
                type="button"
                className={`pt-cell pt-series-cell${selected ? " is-selected" : ""}`}
                style={{ background: CATEGORY_COLORS[el.category] }}
                title={`${el.name} (${el.symbol})`}
                onClick={() => onToggle(el)}
              >
                <span className="pt-z">{el.z}</span>
                <span className="pt-symbol">{el.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ul className="pt-legend">
        {categories.map((cat) => (
          <li key={cat}>
            <span className="pt-swatch" style={{ background: CATEGORY_COLORS[cat] }} />
            {CATEGORY_LABELS[cat]}
          </li>
        ))}
      </ul>
    </div>
  );
}
