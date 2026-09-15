import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LabAtmosphere } from "../components/LabAtmosphere";
import { QuimixMark } from "../components/QuimixMark";

const FEATURES = [
  {
    index: "01",
    title: "Misturas visuais",
    copy: "Veja a reação acontecer no béquer, do elemento ao composto.",
  },
  {
    index: "02",
    title: "Tabela periódica viva",
    copy: "Monte o experimento clicando nos elementos e ajustando volumes.",
  },
  {
    index: "03",
    title: "Raciocínio registrado",
    copy: "Concentrações, equações e logs acompanham cada simulação.",
  },
];

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="page hero-page">
      <LabAtmosphere />
      <section className="hero">
        <p className="eyebrow">Laboratório químico digital</p>
        <div className="brand-lockup">
          <QuimixMark className="brand-mark" />
          <p className="brand">Quimix</p>
        </div>
        <h1>Experimente com clareza, sem gastar reagente real.</h1>
        <p className="lede">
          Combine elementos, acompanhe a transformação e registre o raciocínio
          científico — em um ambiente pensado para aula e pesquisa.
        </p>
        <div className="cta-row">
          <Link className="btn primary" to={user ? "/simulate" : "/login"}>
            {user ? "Iniciar simulação" : "Entrar para simular"}
          </Link>
          {user ? (
            <>
              <span className="hero-user">
                {user.full_name} · {user.role}
              </span>
              <button type="button" className="btn ghost" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <Link className="btn ghost" to="/register">
              Criar conta
            </Link>
          )}
        </div>
        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <span className="feature-index">{feature.index}</span>
              <strong>{feature.title}</strong>
              <p>{feature.copy}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
