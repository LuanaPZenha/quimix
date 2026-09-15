import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LabAtmosphere } from "../components/LabAtmosphere";
import { QuimixMark } from "../components/QuimixMark";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/simulate";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page auth-page">
      <LabAtmosphere />
      <form className="panel auth-panel" onSubmit={onSubmit}>
        <Link className="brand-lockup brand-lockup-sm" to="/">
          <QuimixMark className="brand-mark brand-mark-sm" />
          <span className="brand-link">Quimix</span>
        </Link>
        <p className="eyebrow ink">Acesso ao laboratório</p>
        <h1>Entrar</h1>
        <p className="panel-copy">
          Use sua conta para executar experimentos e salvar o raciocínio da
          simulação.
        </p>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="cta-row">
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <Link className="btn ghost" to="/register">
            Criar conta
          </Link>
        </div>
      </form>
    </main>
  );
}
