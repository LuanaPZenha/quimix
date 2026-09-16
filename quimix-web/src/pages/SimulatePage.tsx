import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatConcentration,
  simulateMixture,
  type MixtureResult,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { MixtureBeaker } from "../components/MixtureBeaker";
import { PeriodicTable } from "../components/PeriodicTable";
import { QuimixMark } from "../components/QuimixMark";
import {
  AMOUNT_UNITS,
  amountToVolumeMl,
  compositionLine,
  defaultAmount,
  expandFormula,
  FormulaError,
  parseFormula,
  unitLabel,
  type AmountUnit,
  type MixMode,
} from "../data/formula";
import {
  FORMULA_PRESETS,
  identifyMixture,
  lookupCompound,
  prettyFormula,
} from "../data/mixtureOutcomes";
import {
  CATEGORY_COLORS,
  ELEMENT_BY_SYMBOL,
  elementReagentId,
  type PeriodicElement,
} from "../data/periodicTable";

type ElementItem = {
  element: PeriodicElement;
  amount: string;
};

type FormulaItem = {
  id: string;
  formula: string;
  name: string;
  composition: Record<string, number>;
  amount: string;
};

type FlatItem = {
  element: PeriodicElement;
  amount: number;
};

let formulaSeq = 0;

function roundVolume(value: number): number {
  return Math.round(value * 100) / 100;
}

export function SimulatePage() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<MixMode>("elements");
  const [unit, setUnit] = useState<AmountUnit>("ml");
  const [elementItems, setElementItems] = useState<ElementItem[]>([]);
  const [formulaItems, setFormulaItems] = useState<FormulaItem[]>([]);
  const [formulaDraft, setFormulaDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MixtureResult | null>(null);
  const [sceneId, setSceneId] = useState(0);

  const flattened = useMemo<FlatItem[]>(() => {
    if (mode === "elements") {
      return elementItems
        .map((item) => ({
          element: item.element,
          amount: Number(item.amount) || 0,
        }))
        .filter((item) => item.amount > 0);
    }
    const totals = new Map<string, number>();
    for (const item of formulaItems) {
      const expanded = expandFormula(item.composition, Number(item.amount) || 0, unit);
      for (const [symbol, count] of Object.entries(expanded)) {
        totals.set(symbol, (totals.get(symbol) ?? 0) + count);
      }
    }
    return [...totals.entries()]
      .map(([symbol, amount]) => {
        const element = ELEMENT_BY_SYMBOL[symbol];
        return element ? { element, amount } : null;
      })
      .filter((item): item is FlatItem => item !== null && item.amount > 0);
  }, [mode, elementItems, formulaItems, unit]);

  const selectedSymbols = useMemo(
    () => new Set(flattened.map((item) => item.element.symbol)),
    [flattened],
  );

  const beakerItems = useMemo(
    () =>
      flattened.map((item) => ({
        element: item.element,
        volumeMl: String(item.amount),
      })),
    [flattened],
  );

  const outcome = useMemo(
    () =>
      identifyMixture(
        flattened.map((item) => ({
          symbol: item.element.symbol,
          volumeMl: item.amount,
        })),
        { sourceFormulas: mode === "formula" ? formulaItems.map((item) => item.formula) : undefined },
      ),
    [flattened, mode, formulaItems],
  );

  const visibleWarnings = useMemo(() => {
    if (!result) return [];
    if (outcome.kind === "blend") return result.warnings;
    return result.warnings.filter(
      (warning) => !warning.includes("não há modelagem de reação química"),
    );
  }, [result, outcome.kind]);

  const hasMix = flattened.length > 0;
  const quantityLabel = unitLabel(unit);

  function clearOutcome() {
    setResult(null);
    setError(null);
  }

  function changeMode(next: MixMode) {
    if (next === mode) return;
    setMode(next);
    setElementItems([]);
    setFormulaItems([]);
    setFormulaDraft("");
    clearOutcome();
  }

  function changeUnit(next: AmountUnit) {
    if (next === unit) return;
    setUnit(next);
    setElementItems((prev) =>
      prev.map((item) => ({ ...item, amount: defaultAmount(next, "elements") })),
    );
    setFormulaItems((prev) =>
      prev.map((item) => ({ ...item, amount: defaultAmount(next, "formula") })),
    );
    clearOutcome();
  }

  function toggleElement(element: PeriodicElement) {
    if (mode !== "elements") return;
    clearOutcome();
    setElementItems((prev) => {
      if (prev.some((item) => item.element.symbol === element.symbol)) {
        return prev.filter((item) => item.element.symbol !== element.symbol);
      }
      return [...prev, { element, amount: defaultAmount(unit, "elements") }];
    });
  }

  function addCompound(raw: string) {
    const query = raw.trim();
    if (!query) {
      setError("Digite uma fórmula, como H2O.");
      return;
    }
    try {
      const known = lookupCompound(query);
      const parsed = known
        ? { formula: known.formula, composition: known.stoich }
        : parseFormula(query);
      const named = known ?? lookupCompound(parsed.formula);
      clearOutcome();
      setFormulaItems((prev) => {
        const existing = prev.find((item) => item.formula === parsed.formula);
        if (existing) {
          return prev.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  amount: String((Number(item.amount) || 0) + Number(defaultAmount(unit, "formula"))),
                }
              : item,
          );
        }
        formulaSeq += 1;
        return [
          ...prev,
          {
            id: `cmp-${formulaSeq}`,
            formula: parsed.formula,
            name: named?.name ?? prettyFormula(parsed.formula),
            composition: parsed.composition,
            amount: defaultAmount(unit, "formula"),
          },
        ];
      });
      setFormulaDraft("");
    } catch (err) {
      setError(err instanceof FormulaError ? err.message : "Fórmula inválida.");
    }
  }

  function onFormulaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCompound(formulaDraft);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (flattened.length < 1) {
      setError(
        mode === "formula"
          ? "Adicione ao menos uma fórmula, como H2O."
          : "Selecione ao menos um elemento na tabela periódica.",
      );
      return;
    }

    const components = flattened
      .map((item) => ({
        reagent_id: elementReagentId(item.element.symbol),
        volume_ml: roundVolume(amountToVolumeMl(item.amount, unit)),
      }))
      .filter((item) => item.volume_ml >= 0.01);

    if (components.length < 1) {
      setError("A quantidade precisa ser maior que zero.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await simulateMixture(components);
      setResult(data);
      setSceneId((id) => id + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na simulação");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page simulate-page">
      <header className="topbar">
        <Link className="brand-lockup brand-lockup-sm" to="/">
          <QuimixMark className="brand-mark brand-mark-sm" />
          <span className="brand-link">Quimix</span>
        </Link>
        <div className="topbar-right">
          <span className="topbar-chip">Simulação de misturas</span>
          {user ? (
            <>
              <span className="topbar-user">
                {user.full_name} · {user.role}
              </span>
              <button type="button" className="btn ghost" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <Link className="btn ghost" to="/login">
              Entrar
            </Link>
          )}
        </div>
      </header>

      <section className="simulate-workspace">
        <form className="panel bench-panel" onSubmit={onSubmit}>
          <header className="bench-head">
            <div>
              <p className="eyebrow ink">Bancada</p>
              <h1>{mode === "formula" ? "Por fórmula" : "Tabela periódica"}</h1>
            </div>
            <p className="panel-copy bench-copy">
              {mode === "formula"
                ? "Digite o composto, como H2O, e escolha a unidade da quantidade."
                : "Clique nos elementos e escolha se a quantidade entra em mL, partes ou mol."}
            </p>
          </header>

          <div className="mix-toolbar">
            <div className="mix-modes" role="tablist" aria-label="Como montar a mistura">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "elements"}
                className={mode === "elements" ? "is-active" : ""}
                onClick={() => changeMode("elements")}
              >
                Elementos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "formula"}
                className={mode === "formula" ? "is-active" : ""}
                onClick={() => changeMode("formula")}
              >
                Fórmula
              </button>
            </div>
            <div className="mix-units" role="radiogroup" aria-label="Unidade da quantidade">
              {AMOUNT_UNITS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={unit === option.id}
                  title={option.hint}
                  className={unit === option.id ? "is-active" : ""}
                  onClick={() => changeUnit(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "formula" ? (
            <div className="formula-composer">
              <div className="formula-bar">
                <label className="formula-field">
                  <span className="visually-hidden">Fórmula do composto</span>
                  <input
                    value={formulaDraft}
                    onChange={(event) => setFormulaDraft(event.target.value)}
                    onKeyDown={onFormulaKeyDown}
                    placeholder="H2O, NaCl, Ca(OH)2, água…"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => addCompound(formulaDraft)}
                >
                  Adicionar
                </button>
              </div>
              <div className="formula-presets" aria-label="Compostos prontos">
                {FORMULA_PRESETS.map((formula) => {
                  const known = lookupCompound(formula);
                  return (
                    <button
                      key={formula}
                      type="button"
                      className="formula-preset"
                      title={known?.name ?? formula}
                      onClick={() => addCompound(formula)}
                    >
                      {prettyFormula(formula)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <PeriodicTable
            selectedSymbols={selectedSymbols}
            onToggle={toggleElement}
            interactive={mode === "elements"}
          />

          <div className="bench-dock">
            <div className="selected-tray">
              {!hasMix && mode === "elements" ? (
                <p className="muted">Nenhum elemento selecionado ainda.</p>
              ) : null}
              {!hasMix && mode === "formula" ? (
                <p className="muted">Nenhuma fórmula na bancada ainda.</p>
              ) : null}
              {mode === "elements" && elementItems.length > 0 ? (
                <ul className="selected-list">
                  {elementItems.map((item) => (
                    <li key={item.element.symbol} className="selected-chip">
                      <span
                        className="selected-badge"
                        style={{ background: CATEGORY_COLORS[item.element.category] }}
                      >
                        {item.element.symbol}
                      </span>
                      <span className="selected-chip-name">{item.element.name}</span>
                      <label className="chip-vol">
                        <span className="visually-hidden">
                          Quantidade ({quantityLabel}) de {item.element.name}
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.amount}
                          onChange={(event) =>
                            setElementItems((prev) =>
                              prev.map((row) =>
                                row.element.symbol === item.element.symbol
                                  ? { ...row, amount: event.target.value }
                                  : row,
                              ),
                            )
                          }
                          required
                        />
                        <span>{quantityLabel}</span>
                      </label>
                      <button
                        type="button"
                        className="chip-x"
                        aria-label={`Remover ${item.element.name}`}
                        onClick={() => toggleElement(item.element)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {mode === "formula" && formulaItems.length > 0 ? (
                <ul className="selected-list">
                  {formulaItems.map((item) => (
                    <li key={item.id} className="selected-chip selected-chip-compound">
                      <span className="selected-badge selected-badge-formula">
                        {prettyFormula(item.formula)}
                      </span>
                      <span className="selected-chip-copy">
                        <span className="selected-chip-name">{item.name}</span>
                        <span className="selected-chip-stoich">
                          {compositionLine(item.composition)}
                        </span>
                      </span>
                      <label className="chip-vol">
                        <span className="visually-hidden">
                          Quantidade ({quantityLabel}) de {item.name}
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.amount}
                          onChange={(event) =>
                            setFormulaItems((prev) =>
                              prev.map((row) =>
                                row.id === item.id ? { ...row, amount: event.target.value } : row,
                              ),
                            )
                          }
                          required
                        />
                        <span>{quantityLabel}</span>
                      </label>
                      <button
                        type="button"
                        className="chip-x"
                        aria-label={`Remover ${item.name}`}
                        onClick={() => {
                          clearOutcome();
                          setFormulaItems((prev) => prev.filter((row) => row.id !== item.id));
                        }}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="cta-row bench-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setElementItems([]);
                  setFormulaItems([]);
                  setFormulaDraft("");
                  clearOutcome();
                }}
                disabled={!hasMix && !formulaDraft}
              >
                Limpar
              </button>
              <button className="btn primary" type="submit" disabled={submitting || !hasMix}>
                {submitting ? "Calculando…" : "Simular"}
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </div>
        </form>

        <aside className="panel result-panel">
          <p className="eyebrow ink">Transformação</p>
          <h2>Resultado</h2>
          <MixtureBeaker
            key={sceneId}
            items={beakerItems}
            playing={Boolean(result)}
            busy={submitting}
            sourceFormulas={mode === "formula" ? formulaItems.map((item) => item.formula) : undefined}
          />
          {!result ? (
            <p className="muted">
              Monte a mistura por elementos ou por fórmula e execute para ver a
              transformação, as concentrações e os logs.
            </p>
          ) : (
            <>
              <p>
                Volume equivalente: <strong>{result.total_volume_ml} mL</strong>
                {unit !== "ml" ? (
                  <span className="result-unit-note">
                    {" "}
                    · cálculo a partir de {quantityLabel}
                    {unit === "mol" ? " (1 mol/L no catálogo)" : ""}
                  </span>
                ) : null}
              </p>
              {mode === "formula" && formulaItems.length > 0 ? (
                <p className="result-formula-note">
                  {formulaItems.length > 1 ? "Compostos: " : "Composto: "}
                  {formulaItems
                    .map((item) => `${prettyFormula(item.formula)} (${item.name})`)
                    .join(" · ")}
                </p>
              ) : null}
              <ul className="solute-list">
                {result.solutes.map((solute) => (
                  <li key={solute.reagent_id}>
                    <span>
                      {solute.name} ({solute.formula})
                    </span>
                    <strong>
                      {formatConcentration(solute.resulting_concentration_mol_l)} mol/L
                    </strong>
                  </li>
                ))}
              </ul>
              {visibleWarnings.length > 0 ? (
                <div className="warnings">
                  {visibleWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
              <h3>Logs</h3>
              <ol className="logs">
                {result.logs.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
