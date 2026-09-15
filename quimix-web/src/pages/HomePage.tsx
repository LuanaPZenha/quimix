import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { QuimixMark } from "../components/QuimixMark";

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="page hero-page">
      <div className="hero-atmosphere" aria-hidden="true" />
      <section className="hero">
        <div className="brand-lockup">
          <QuimixMark className="brand-mark" />
          <p className="brand">Quimix</p>
        </div>
        <h1>Laboratório químico digital</h1>
        <p className="lede">
          Simule misturas, acompanhe concentrações e registre o raciocínio do
          experimento — sem consumir reagentes reais.
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
      </section>
    </main>
  );
}
