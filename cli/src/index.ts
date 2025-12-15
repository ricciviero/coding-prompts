import { promises as fs } from "fs";
import path from "path";
import { Command } from "commander";
import prompts from "prompts";

type InputField = {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  description: string;
  default?: string | number | boolean;
  enum?: Array<string | number | boolean>;
};

type ManifestEntry = {
  id: string;
  category: string;
  stack: string[];
  language: string;
  framework: string;
  purpose: string;
  tags: string[];
  requires: string[];
  outputs: string[];
  placeholders: Record<string, string | number | boolean>;
  inputs: InputField[];
  path: string;
};

const CLI_NAME = "coding-prompts";
const manifestPath = path.resolve(process.cwd(), "manifest.json");

async function loadManifest(): Promise<ManifestEntry[]> {
  const data = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(data) as ManifestEntry[];
}

async function resolveEntry(id: string): Promise<ManifestEntry> {
  const manifest = await loadManifest();
  const entry = manifest.find((item) => item.id === id);
  if (!entry) {
    throw new Error(`Prompt con id "${id}" non trovato. Esegui "coding-prompts list" per vedere le opzioni.`);
  }
  return entry;
}

function applyPlaceholders(content: string, replacements: Record<string, string | number | boolean>) {
  let result = content;
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(pattern, String(value));
  }
  return result;
}

function parseVariables(values: string[] | undefined): Record<string, string> {
  if (!values?.length) return {};
  const entries: Record<string, string> = {};
  for (const pair of values) {
    const [key, ...rest] = pair.split("=");
    if (!key || !rest.length) {
      throw new Error(`Variabile non valida "${pair}". Usa il formato chiave=valore.`);
    }
    entries[key.trim()] = rest.join("=").trim();
  }
  return entries;
}

async function main() {
  const program = new Command();
  program
    .name(CLI_NAME)
    .description("CLI per sfogliare e copiare system prompt dal catalogo Coding Prompts")
    .version("0.1.0");

  program
    .command("list")
    .description("Mostra tutti i prompt disponibili nel manifest")
    .option("-c, --category <category>", "Filtra per categoria (backend, frontend, infra, ...)")
    .option("-l, --language <language>", "Filtra per lingua (it, en, ...)")
    .action(async (options: { category?: string; language?: string }) => {
      try {
        const manifest = await loadManifest();
        const filtered = manifest.filter((entry) => {
          if (options.category && entry.category !== options.category) return false;
          if (options.language && entry.language !== options.language) return false;
          return true;
        });

        if (!filtered.length) {
          console.log("Nessun prompt trovato con i filtri selezionati.");
          return;
        }

        for (const entry of filtered) {
          console.log(`- ${entry.id} [${entry.category}] (${entry.language}) -> ${entry.purpose}`);
        }
      } catch (error) {
        console.error("Impossibile leggere il manifest. Hai gia eseguito npm run manifest?");
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command("show")
    .argument("<id>", "Identificativo del prompt (vedi comando list)")
    .description("Mostra i dettagli completi di un prompt")
    .action(async (id: string) => {
      try {
        const entry = await resolveEntry(id);
        console.log(`ID: ${entry.id}`);
        console.log(`Categoria: ${entry.category}`);
        console.log(`Linguaggio: ${entry.language}`);
        console.log(`Framework: ${entry.framework}`);
        console.log(`Stack: ${entry.stack.join(", ")}`);
        console.log(`Purpose: ${entry.purpose}`);
        if (entry.tags.length) console.log(`Tags: ${entry.tags.join(", ")}`);
        if (entry.requires.length) console.log(`Richiede: ${entry.requires.join(", ")}`);
        if (entry.outputs.length) console.log(`Output: ${entry.outputs.join(", ")}`);
        if (entry.placeholders && Object.keys(entry.placeholders).length) {
          console.log("Placeholders disponibili:");
          for (const [key, value] of Object.entries(entry.placeholders)) {
            console.log(`  - ${key}: ${value}`);
          }
        }
        if (entry.inputs.length) {
          console.log("Input richiesti:");
          for (const input of entry.inputs) {
            const allowed = input.enum ? ` (opzioni: ${input.enum.join(", ")})` : "";
            const def = input.default !== undefined ? ` [default: ${input.default}]` : "";
            console.log(`  - ${input.name}${def}${allowed} -> ${input.description}`);
          }
        }
        console.log(`File: ${entry.path}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command("copy")
    .argument("<id>", "Identificativo del prompt da copiare")
    .description('Crea automaticamente "./prompts/<id>.md" con il contenuto del prompt scelto')
    .option("-v, --var <key=value...>", "Override dei placeholder (ripetibile)")
    .option("--stdout", "Stampa il contenuto a video invece di scrivere su file")
    .action(async (id: string, options: { var?: string[]; stdout?: boolean }) => {
      try {
        const entry = await resolveEntry(id);
        const fileContent = await fs.readFile(path.resolve(process.cwd(), entry.path), "utf-8");
        const overrides = parseVariables(options.var);
        const replacements = { ...entry.placeholders, ...overrides };
        const output = applyPlaceholders(fileContent, replacements);

        if (options.stdout) {
          console.log(output);
          return;
        }

        const defaultDir = path.join(process.cwd(), "prompts");
        const resolvedDestination = path.join(defaultDir, `${entry.id}.md`);
        const targetDir = path.dirname(resolvedDestination);

        await fs.mkdir(targetDir, { recursive: true });
        await fs.writeFile(resolvedDestination, output, "utf-8");
        console.log(`Prompt copiato in ${resolvedDestination}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  program
    .command("init")
    .description("Seleziona interattivamente uno o più prompt e copiali in ./prompts")
    .action(async () => {
      try {
        const manifest = await loadManifest();
        const response = await prompts({
          type: "multiselect",
          name: "selected",
          message: "Scegli i prompt da copiare",
          instructions: "Spazio per selezionare, invio per confermare",
          choices: manifest.map((entry) => ({
            title: `${entry.id} (${entry.category})`,
            description: entry.purpose,
            value: entry.id
          }))
        });

        if (!response.selected || response.selected.length === 0) {
          console.log("Nessun prompt selezionato.");
          return;
        }

        for (const id of response.selected) {
          const entry = await resolveEntry(id);
          const fileContent = await fs.readFile(path.resolve(process.cwd(), entry.path), "utf-8");
          const output = applyPlaceholders(fileContent, entry.placeholders);
          const defaultDir = path.join(process.cwd(), "prompts");
          const resolvedDestination = path.join(defaultDir, `${entry.id}.md`);
          await fs.mkdir(defaultDir, { recursive: true });
          await fs.writeFile(resolvedDestination, output, "utf-8");
          console.log(`Prompt copiato in ${resolvedDestination}`);
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
