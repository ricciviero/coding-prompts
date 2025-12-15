# Schema Metadata Prompt

Questo documento descrive il front matter standard (YAML) che ogni system prompt deve includere.

## Struttura generale

Ogni file `.md` inizia con un blocco YAML separato da `---`.

```yaml
---
id: spring-backend-it
category: backend
stack: [java, spring-boot]
language: it
framework: Spring Boot
tooling: [maven, docker, testcontainers]
purpose: Definire il comportamento e gli standard di sviluppo...
version: 1.2.0
last_reviewed: 2025-12-15
inputs:
  - name: server_port
    type: number
    default: 5000
    description: Porta HTTP del servizio
tags: [entity-dto-service, rest, postgres]
requires:
  - java>=17
outputs: [code]
placeholders:
  server_port: 5000
---
```

## Campi obbligatori

| Campo | Tipo | Descrizione |
| --- | --- | --- |
| `id` | string | Slug univoco (minuscole e trattini) usato dal manifest e dalla CLI. |
| `category` | enum | Uno tra `backend`, `frontend`, `infra`, `fullstack`, `utilities`. |
| `stack` | array di string | Tecnologie principali (es. `java`, `spring-boot`). |
| `language` | enum | Lingua del prompt (`it`, `en`, ...). |
| `framework` | string | Framework di riferimento principale. |
| `tooling` | array di string | Tool richiesti o suggeriti (es. `maven`, `docker`). |
| `purpose` | string | Breve descrizione (<= 200 caratteri). |
| `version` | semver | Versione del prompt (`major.minor.patch`). |
| `last_reviewed` | ISO date | Data ultima revisione (`YYYY-MM-DD`). |

## Campi opzionali

- `tags`: array libero per facilitare ricerche (es. `entity-dto-service`).
- `requires`: lista di prerequisiti (`java>=17`, `docker>=24`).
- `outputs`: cosa produce l'agente (`code`, `config`, `docs`).
- `placeholders`: dizionario `chiave: valore` usato per sostituzioni (es. `server_port: 5000`).
- `inputs`: array di oggetti con le seguenti proprieta:
  - `name` (stringa `snake_case`)
  - `type` (`string`, `number`, `boolean`, `enum`)
  - `description`
  - `default` (opzionale)
  - `enum` (opzionale, lista di valori ammessi quando `type` e `enum`)

## Validazione

- Tutte le chiavi obbligatorie devono essere presenti.
- `id` deve essere unico nel repository.
- `stack`, `tooling`, `tags` devono contenere valori minuscoli senza spazi.
- `version` deve rispettare SemVer.
- `last_reviewed` deve essere una data valida.
- Se `inputs` contiene elementi, ogni `name` deve avere un placeholder corrispondente o un `default`.

## Manifest

Uno script leggera i front matter, li validera con questo schema e generera `manifest.json` con informazioni come:

```json
{
  "id": "spring-backend-it",
  "path": "Java/spring_agent.md",
  "category": "backend",
  "stack": ["java", "spring-boot"],
  "language": "it",
  "version": "1.2.0",
  "inputs": [
    { "name": "server_port", "type": "number", "default": 5000 }
  ]
}
```

La CLI usera il manifest per mostrare l'elenco dei prompt, richiedere gli input necessari e copiare automaticamente i file nella repo target dello sviluppatore.
