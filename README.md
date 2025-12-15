# Coding Prompts

Raccolta centralizzata di system prompt (backend, frontend, infra, utility) piu una CLI che permette di sfogliare il catalogo e copiarlo automaticamente dentro i progetti. Tutti i file `.md` destinati agli agent vivono in `system-prompts/` e sono descritti da metadati standardizzati (front matter YAML) cosi da essere indicizzati nel `manifest.json`.

---

## Struttura della repo

| Percorso | Descrizione |
| --- | --- |
| `system-prompts/<Stack>/...` | I prompt reali (uno per file `.md`). Devono rispettare lo schema documentato in `docs/metadata-schema.md`. |
| `manifest.json` | Catalogo generato automaticamente che la CLI usa per conoscere ID, tag, parametri, path dei prompt. |
| `cli/` | Sorgenti TypeScript della CLI (comandi `list`, `show`, `copy`). |
| `dist/cli.js` | Output compilato della CLI (`npm run build`). E lentrypoint usato dal comando `coding-prompts`. |
| `scripts/` | Script di supporto (`build_manifest.mjs`, `post_build.mjs`). |
| `docs/` | Documentazione interna (schema del front matter, ecc.). |

Dipendenze principali: Node.js 20+, npm (o pnpm/yarn), TypeScript, Commander.

---

## Workflow per aggiungere/aggiornare un prompt

1. **Creare/modificare il file Markdown** sotto `system-prompts/<Stack>/...`. In testa al file deve esserci il front matter definito in `docs/metadata-schema.md` (id univoco, categoria, stack, inputs, ecc.).
2. **Rigenerare il manifest** dopo ogni modifica:
   ```sh
   npm run manifest
   ```
   Lo script valida i metadati e produce/aggiorna `manifest.json`. Se compaiono errori, correggi il front matter e ripeti.
3. (Opzionale) **Ricostruire la CLI** per distribuire una nuova versione:
   ```sh
   npm run build
   ```
   Questo produce `dist/cli.js`, usato dal comando `coding-prompts`.

---

## CLI: comandi disponibili

Assicurati di aver generato `manifest.json` prima dell'uso (`npm run manifest`). Durante lo sviluppo puoi richiamare la CLI con `npm run cli -- <comando>`, oppure usare direttamente il file compilato (`node dist/cli.js <comando>`). Quando il pacchetto verrà pubblicato, il comando sarà `coding-prompts`.

### `list`
Mostra tutti i prompt disponibili (filtri opzionali).
```sh
coding-prompts list
coding-prompts list --category backend --language it
```

### `show <id>`
Dettaglia un singolo prompt (stack, tags, requires, placeholders, input richiesti, file di origine).
```sh
coding-prompts show spring-backend-it
```

### `copy <id>`
Crea automaticamente `./prompts/<id>.md` nella repo corrente con il contenuto del prompt selezionato (cartella `prompts/` viene creata se mancante). Puoi sovrascrivere eventuali placeholder dichiarati nel manifest usando `-v chiave=valore`. Con `--stdout` il contenuto viene solo stampato.
```sh
coding-prompts copy spring-backend-it
coding-prompts copy spring-backend-it -v server_port=8080
coding-prompts copy spring-backend-it --stdout
```

### `init`
Wizard interattivo: mostra l'elenco completo dei prompt e permette di selezionarne piu di uno (spazio per selezionare, invio per confermare). Ogni elemento scelto viene salvato automaticamente in `./prompts/<id>.md`.
```sh
coding-prompts init
```

---

## Sviluppo CLI / build

- `npm run cli -- list`  esegue la CLI direttamente da TypeScript tramite `tsx` (utile in fase di sviluppo).
- `npm run build`  compila la CLI in `dist/cli.js` e prepara il file referenziato da `bin` (`coding-prompts`).
- `node dist/cli.js list`  esegue la CLI a partire dal bundle compilato.

Se vuoi installare la CLI globalmente durante lo sviluppo puoi usare `npm link` (dopo `npm run build`), e richiamare `coding-prompts` da qualunque repo.

---

## Contribuire

1. Crea o modifica i prompt allinterno di `system-prompts/`.
2. Aggiorna i metadati seguendo lo schema documentato.
3. Esegui `npm run manifest` (obbligatorio) e, se modifichi la CLI, `npm run build`.
4. Verifica i comandi principali (`npm run cli -- list/show/copy`).
5. Apri la PR includendo il nuovo `manifest.json` e, se serve, il `dist/cli.js` rigenerato.

In futuro verranno aggiunti workflow CI per eseguire automaticamente questi passaggi.
