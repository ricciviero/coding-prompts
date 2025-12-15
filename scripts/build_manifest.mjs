import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import { z } from "zod";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, "manifest.json");
const SOURCE_GLOBS = ["system-prompts/**/*.md"];

const EntrySchema = z.object({
  id: z.string().min(1),
  category: z.enum(["backend", "frontend", "infra", "fullstack", "utilities"]),
  stack: z.array(z.string().min(1)).min(1),
  language: z.string().min(2),
  framework: z.string().min(1),
  tooling: z.array(z.string().min(1)).min(1),
  purpose: z.string().min(1).max(200),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  last_reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string().min(1)).optional().default([]),
  requires: z.array(z.string().min(1)).optional().default([]),
  outputs: z.array(z.string().min(1)).optional().default([]),
  placeholders: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().default({}),
  inputs: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum(["string", "number", "boolean", "enum"]),
        description: z.string().min(1),
        default: z.union([z.string(), z.number(), z.boolean()]).optional(),
        enum: z.array(z.union([z.string(), z.number(), z.boolean()])).optional()
      })
    )
    .optional()
    .default([])
});

function extractFrontMatter(filePath, content) {
  if (!content.startsWith("---")) {
    throw new Error(`Front matter mancante in ${filePath}`);
  }
  const parsed = matter(content);
  return parsed.data;
}

function validateEntry(raw, filePath) {
  try {
    return EntrySchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(`Schema non valido in ${filePath}:\n${issues}`);
    }
    throw error;
  }
}

async function buildManifest() {
  const files = await fg(SOURCE_GLOBS, { cwd: ROOT, absolute: true });
  const entries = [];
  const ids = new Set();

  for (const file of files) {
    const relPath = path.relative(ROOT, file).replace(/\\/g, "/");
    const raw = await fs.readFile(file, "utf-8");
    try {
      const frontMatter = extractFrontMatter(relPath, raw);
      const validated = validateEntry(frontMatter, relPath);
      if (ids.has(validated.id)) {
        throw new Error(`ID duplicato ${validated.id} (${relPath})`);
      }
      ids.add(validated.id);
      entries.push({ ...validated, path: relPath });
    } catch (error) {
      console.error((error).message);
      process.exitCode = 1;
    }
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error("Manifest non generato a causa di errori");
    return;
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(OUTPUT, JSON.stringify(entries, null, 2) + "\n", "utf-8");
  console.log(`Manifest scritto in ${OUTPUT}`);
}

buildManifest().catch((error) => {
  console.error(error);
  process.exit(1);
});
