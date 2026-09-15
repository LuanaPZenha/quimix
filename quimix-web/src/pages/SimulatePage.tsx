import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatConcentration,
  simulateMixture,
  type MixtureResult,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { MixtureBeaker } from "../components/MixtureBeaker";
import { PeriodicTable } from "../components/PeriodicTable";
import { identifyMixture } from "../data/mixtureOutcomes";
import {
  CATEGORY_COLORS,
  elementReagentId,
  type PeriodicElement,
} from "../data/periodicTable";

type SelectedItem = {
  element: PeriodicElement;
  volumeMl: string;
};

export function SimulatePage() {
  const { user, logout } = useAuth();
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MixtureResult | null>(null);
  const [sceneId, setSceneId] = useState(0);

  const selectedSymbols = useMemo(
    () => new Set(selected.map((item) => item.element.symbol)),
    [selected],
  );

  const outcome = useMemo(
    () =>
      identifyMixture(
        selected.map((item) => ({
          symbol: item.element.symbol,
          volumeMl: Number(item.volumeMl) || 0,
        })),
      ),
    [selected],
  );

  const visibleWarnings = useMemo(() => {
    if (!result) return [];
    if (outcome.kind === "blend") return result.warnings;
    return result.warnings.filter(
      (warning) => !warning.includes("não há modelagem de reação química"),
    );
  }, [result, outcome.kind]);

  function toggleElement(element: PeriodicElement) {
    setResult(null);
    setError(null);
    setSelected((prev) => {
      if (prev.some((item) => item.element.symbol === element.symbol)) {
        return prev.filter((item) => item.element.symbol !== element.symbol);
      }
      return [...prev, { element, volumeMl: "50" }];
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (selected.length < 1) {
      setError("Selecione ao menos um elemento na tabela periódica.");
      return;
    }

    setSubmitting(true);
    try {
      const components = selected.map((item) => ({
        reagent_id: elementReagentId(item.element.symbol),
        volume_ml: Number(item.volumeMl),
      }));
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
        <Link className="brand-link" to="/">
          Quimix
        </Link>
        <div className="topbar-right">
          <span className="topbar-label">Simulação de misturas</span>
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

      <section className="simulate-layout simulate-layout-pt">
        <form className="panel pt-panel" onSubmit={onSubmit}>
          <h1>Tabela periódica</h1>
          <p className="panel-copy">
            Clique nos elementos para montar a mistura. Ajuste os volumes e
            execute a simulação.
          </p>

          <PeriodicTable selectedSymbols={selectedSymbols} onToggle={toggleElement} />

          <div className="selected-tray">
            <h2>Mistura atual</h2>
            {selected.length === 0 ? (
              <p className="muted">Nenhum elemento selecionado ainda.</p>
            ) : (
              <ul className="selected-list">
                {selected.map((item) => (
                  <li key={item.element.symbol} className="selected-item">
                    <span
                      className="selected-badge"
                      style={{ background: CATEGORY_COLORS[item.element.category] }}
                    >
                      {item.element.symbol}
                    </span>
                    <div className="selected-meta">
                      <strong>{item.element.name}</strong>
                      <label>
                        Volume (mL)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.volumeMl}
                          onChange={(e) =>
                            setSelected((prev) =>
                              prev.map((row) =>
                                row.element.symbol === item.element.symbol
                                  ? { ...row, volumeMl: e.target.value }
                                  : row,
                              ),
                            )
                          }
                          required
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => toggleElement(item.element)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cta-row">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setSelected([]);
                setResult(null);
                setError(null);
              }}
              disabled={selected.length === 0}
            >
              Limpar seleção
            </button>
            <button
              className="btn primary"
              type="submit"
              disabled={submitting || selected.length === 0}
            >
              {submitting ? "Calculando…" : "Executar simulação"}
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <aside className="panel result-panel">
          <h2>Resultado</h2>
          <MixtureBeaker
            key={sceneId}
            items={selected}
            playing={Boolean(result)}
            busy={submitting}
          />
          {!result ? (
            <p className="muted">
              Selecione elementos na tabela e execute para ver a transformação,
              as concentrações e os logs.
            </p>
          ) : (
            <>
              <p>
                Volume total: <strong>{result.total_volume_ml} mL</strong>
              </p>
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
