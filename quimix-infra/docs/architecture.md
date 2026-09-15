# Arquitetura Quimix

## Princípio

Cada microserviço vive em uma pasta independente neste repositório. `quimix-infra` apenas orquestra o ambiente local.

## Fluxo Fase 1

```
Browser (quimix-web)
  -> API Gateway (:8000)
    -> Simulation Service (:8001)
      -> Postgres (quimix_simulation)
```

## Contratos

Comunicação apenas via HTTP/JSON. Cada serviço publica OpenAPI em `/docs`.

## Padrão interno

Clean Architecture por serviço: `domain` → `application` → `infrastructure` → `api`.

## Segurança

Ver [security.md](security.md). Gateway aplica CORS, rate limit e headers OWASP.
