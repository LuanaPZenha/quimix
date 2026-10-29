import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  createMission,
  fetchMissions,
  submitMissionAttempt,
  type ClassMission,
  type DiscoveryFeedback,
  type DiscoveryInput,
  type LearnProgress,
} from "../api/learn";
import { useAuth } from "../auth/AuthContext";
import { effectLabel, kindLabel } from "../data/learnLabels";
import { prettyFormula } from "../data/mixtureOutcomes";

export type LearnTab = "resultado" | "caderno" | "desafios" | "missoes" | "mitos";

const TABS: { id: LearnTab; label: string }[] = [
  { id: "resultado", label: "Resultado" },
  { id: "caderno", label: "Caderno" },
  { id: "desafios", label: "Desafios" },
  { id: "missoes", label: "Missões" },
  { id: "mitos", label: "Mitos" },
];

function feedbackLines(feedback: DiscoveryFeedback): string[] {
  const lines: string[] = [];
  if (feedback.grade === "hit") {
    lines.push(`Previsão certa. Sequência: ${feedback.progress.streak}.`);
  } else if (feedback.grade === "partial") {
    lines.push("Uma das duas previsões acertou. A sequência fica como está.");
  } else if (feedback.grade === "miss") {
    lines.push("O béquer mostrou outro resultado. A sequência de acertos recomeça.");
  } else {
    lines.push("Simulação registrada sem palpite.");
  }
  if (feedback.new_card) {
    const card = feedback.progress.cards.at(-1);
    if (card) lines.push(`Ficha nova: ${card.name}.`);
  }
  for (const id of feedback.cleared_challenge_ids) {
    const challenge = feedback.progress.challenges.find((item) => item.id === id);
    if (challenge) lines.push(`Desafio concluído: ${challenge.title}.`);
  }
  for (const id of feedback.solved_myth_ids) {
    const myth = feedback.progress.myths.find((item) => item.id === id);
    if (myth) lines.push(`Mito conferido: ${myth.claim}`);
  }
  return lines;
}

type Props = {
  tab: LearnTab;
  onTab: (tab: LearnTab) => void;
  progress: LearnProgress | null;
  feedback: DiscoveryFeedback | null;
  learnError: string | null;
  snapshot: DiscoveryInput | null;
  children: ReactNode;
};

export function LabAside({
  tab,
  onTab,
  progress,
  feedback,
  learnError,
  snapshot,
  children,
}: Props) {
  const { user } = useAuth();
  const canPublish = user?.role === "professor" || user?.role === "admin";
  const [missions, setMissions] = useState<ClassMission[]>([]);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [draftKind, setDraftKind] = useState<"product" | "concentration" | "myth">("product");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [targetFormula, setTargetFormula] = useState("");
  const [soluteSymbol, setSoluteSymbol] = useState("Na");
  const [targetMol, setTargetMol] = useState("0.5");
  const [targetVolume, setTargetVolume] = useState("100");
  const [mythId, setMythId] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchMissions()
      .then((rows) => {
        if (!cancelled) setMissions(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMissionError(err instanceof Error ? err.message : "Missões indisponíveis.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadMissions() {
    const rows = await fetchMissions();
    setMissions(rows);
  }

  async function onPublish(event: FormEvent) {
    event.preventDefault();
    setMissionError(null);
    setNotice(null);
    setPublishing(true);
    try {
      await createMission({
        title,
        brief,
        kind: draftKind,
        target_formula: draftKind === "myth" ? null : targetFormula,
        target_mol_l: draftKind === "concentration" ? Number(targetMol) : null,
        target_volume_ml:
          draftKind === "concentration" && targetVolume.trim() ? Number(targetVolume) : null,
        solute_symbol: draftKind === "concentration" ? soluteSymbol : null,
        myth_id: draftKind === "myth" ? mythId : null,
      });
      setTitle("");
      setBrief("");
      setTargetFormula("");
      setNotice("Missão publicada para a bancada.");
      await reloadMissions();
    } catch (err) {
      setMissionError(err instanceof Error ? err.message : "Falha ao publicar a missão.");
    } finally {
      setPublishing(false);
    }
  }

  async function onDeliver(missionId: string) {
    if (!snapshot) return;
    setMissionError(null);
    setNotice(null);
    try {
      const result = await submitMissionAttempt(missionId, { ...snapshot, note });
      setNotice(result.message);
      await reloadMissions();
    } catch (err) {
      setMissionError(err instanceof Error ? err.message : "Falha ao entregar a mistura.");
    }
  }

  return (
    <aside className="panel result-panel learn-aside">
      <div className="learn-status">
        <p className="eyebrow ink">{progress?.stage_title ?? "Laboratório"}</p>
        <p className="learn-stats">
          {progress
            ? `${progress.cards.length === 1 ? "1 ficha" : `${progress.cards.length} fichas`} · sequência ${progress.streak}`
            : "Carregando o caderno"}
          {progress && progress.best_streak > progress.streak
            ? ` · melhor ${progress.best_streak}`
            : ""}
        </p>
        {progress ? <p className="learn-hint">{progress.next_hint}</p> : null}
      </div>

      <div className="learn-tabs" role="tablist" aria-label="Laboratório">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""}
            onClick={() => onTab(item.id)}
          >
            {item.label}
            {item.id === "missoes" && missions.length > 0 ? ` ${missions.length}` : ""}
          </button>
        ))}
      </div>

      {learnError ? <p className="error">{learnError}</p> : null}
      {missionError && tab === "missoes" ? <p className="error">{missionError}</p> : null}

      {tab === "resultado" ? (
        <>
          {feedback ? (
            <div className={`grade-banner grade-${feedback.grade}`}>
              {feedbackLines(feedback).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {children}
        </>
      ) : null}

      {tab === "caderno" ? (
        <div className="learn-view">
          <ul className="learn-seals">
            {(progress?.seals ?? []).map((seal) => (
              <li key={seal.id} className={seal.earned ? "is-earned" : ""}>
                {seal.title}
              </li>
            ))}
          </ul>
          {progress && progress.cards.length === 0 ? (
            <p className="muted">Cada composto real que você obtiver vira uma ficha.</p>
          ) : null}
          <ul className="learn-list">
            {(progress?.cards ?? []).map((card) => (
              <li key={card.formula} className="learn-card">
                <h3>
                  {card.name} <span>{prettyFormula(card.formula)}</span>
                </h3>
                <p>
                  {kindLabel(card.kind)} · {effectLabel(card.effect)}
                </p>
                <p className="learn-equation">{card.equation}</p>
              </li>
            ))}
          </ul>
          <h3 className="learn-subtitle">Trilha da tabela</h3>
          <ul className="learn-list">
            {(progress?.stages ?? []).map((stage) => (
              <li key={stage.id} className={`learn-card${stage.open ? " is-open" : ""}`}>
                <h3>{stage.title}</h3>
                <p>{stage.open ? stage.detail : stage.requires}</p>
                {stage.symbols.length > 0 ? (
                  <p className="learn-symbols">{stage.symbols.join(" ")}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "desafios" ? (
        <div className="learn-view">
          <ul className="learn-list">
            {(progress?.challenges ?? []).map((challenge) => (
              <li key={challenge.id} className={`learn-card${challenge.cleared ? " is-open" : ""}`}>
                <h3>
                  {challenge.title}
                  {challenge.cleared ? <span> concluído</span> : null}
                </h3>
                <p>{challenge.brief}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "mitos" ? (
        <div className="learn-view">
          <ul className="learn-list">
            {(progress?.myths ?? []).map((myth) => (
              <li key={myth.id} className={`learn-card${myth.solved ? " is-open" : ""}`}>
                <h3>{myth.claim}</h3>
                <p>{myth.prompt}</p>
                {myth.lesson ? <p className="learn-lesson">{myth.lesson}</p> : null}
              </li>
            ))}
          </ul>
          <p className="muted">Simule a mistura do mito. Se a química bater, a explicação abre aqui.</p>
        </div>
      ) : null}

      {tab === "missoes" ? (
        <div className="learn-view">
          {notice ? <p className="learn-notice">{notice}</p> : null}
          {canPublish ? (
            <form className="learn-form" onSubmit={onPublish}>
              <h3 className="learn-subtitle">Nova missão</h3>
              <label>
                Título
                <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
              </label>
              <label>
                Pedido
                <textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  required
                  minLength={3}
                  rows={2}
                />
              </label>
              <label>
                Tipo
                <select
                  value={draftKind}
                  onChange={(event) =>
                    setDraftKind(event.target.value as "product" | "concentration" | "myth")
                  }
                >
                  <option value="product">Produto</option>
                  <option value="concentration">Concentração</option>
                  <option value="myth">Mito</option>
                </select>
              </label>
              {draftKind !== "myth" ? (
                <label>
                  Fórmula alvo
                  <input
                    value={targetFormula}
                    onChange={(event) => setTargetFormula(event.target.value)}
                    placeholder="NaCl"
                    required
                  />
                </label>
              ) : null}
              {draftKind === "concentration" ? (
                <>
                  <label>
                    Símbolo medido
                    <input
                      value={soluteSymbol}
                      onChange={(event) => setSoluteSymbol(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    mol/L
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={targetMol}
                      onChange={(event) => setTargetMol(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Volume (mL)
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={targetVolume}
                      onChange={(event) => setTargetVolume(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
              {draftKind === "myth" ? (
                <label>
                  Mito
                  <select value={mythId} onChange={(event) => setMythId(event.target.value)} required>
                    <option value="">Escolha</option>
                    {(progress?.myths ?? []).map((myth) => (
                      <option key={myth.id} value={myth.id}>
                        {myth.claim}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button className="btn primary" type="submit" disabled={publishing}>
                {publishing ? "Publicando…" : "Publicar"}
              </button>
            </form>
          ) : null}

          <label className="learn-note">
            Frase da entrega
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={240}
              placeholder="Uma frase sobre o que a mistura mostrou"
            />
          </label>
          {!snapshot ? <p className="muted">Simule a mistura para poder entregar.</p> : null}
          {missions.length === 0 ? <p className="muted">Nenhuma missão publicada ainda.</p> : null}
          <ul className="learn-list">
            {missions.map((mission) => (
              <li key={mission.id} className="learn-card">
                <h3>{mission.title}</h3>
                <p>{mission.brief}</p>
                <p className="learn-meta">{mission.teacher_name}</p>
                {mission.my_attempt ? (
                  <p className="learn-lesson">
                    {mission.my_attempt.correct
                      ? "Sua entrega está certa."
                      : "Dá para simular de novo e entregar outra mistura."}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="btn ghost"
                  disabled={!snapshot}
                  onClick={() => onDeliver(mission.id)}
                >
                  Entregar esta mistura
                </button>
                {canPublish && mission.attempts.length > 0 ? (
                  <ul className="learn-attempts">
                    {mission.attempts.map((attempt) => (
                      <li key={attempt.student_id}>
                        {attempt.student_name}: {attempt.correct ? "certa" : "em aberto"} ·{" "}
                        {attempt.compound_name}
                        {attempt.note ? ` — ${attempt.note}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
