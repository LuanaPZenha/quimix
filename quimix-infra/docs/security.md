# Segurança (OWASP) — baseline Quimix

Mitigações aplicadas desde a Fase 1:

| Risco OWASP | Mitigação |
|-------------|-----------|
| Broken Access Control | JWT + papéis (Fase 2); rotas públicas mínimas |
| Cryptographic Failures | HTTPS em produção; secrets em `.env`; bcrypt/argon2 para senhas |
| Injection | Pydantic + SQLAlchemy/parametrizado |
| Insecure Design | Separação de serviços; validação na borda |
| Security Misconfiguration | Headers no gateway; sem stack traces em produção |
| Vulnerable Components | Dependências pinadas; CI por repo |
| Identification/Auth Failures | JWT curto + refresh (Fase 2) |
| Software/Data Integrity | Builds Docker reproduzíveis |
| Logging Failures | Sem log de senha/token |
| SSRF | Gateway só proxya hosts internos conhecidos |

Headers no gateway: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy` (baseline).
