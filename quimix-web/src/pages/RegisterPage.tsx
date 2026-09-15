import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Role } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("aluno");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        role,
      });
      navigate("/simulate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page auth-page">
      <form className="panel auth-panel" onSubmit={onSubmit}>
        <Link className="brand-link" to="/">
          Quimix
        </Link>
        <h1>Criar conta</h1>
        <p className="panel-copy">Cadastre-se como aluno ou professor.</p>
        <label>
          Nome completo
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
          />
        </label>
        <label>
          Perfil
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="cta-row">
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Criando…" : "Criar conta"}
          </button>
          <Link className="btn ghost" to="/login">
            Já tenho conta
          </Link>
        </div>
      </form>
    </main>
  );
}
