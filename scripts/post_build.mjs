import { rename } from "fs/promises";
import path from "path";

const source = path.resolve("dist/index.js");
const target = path.resolve("dist/cli.js");

try {
  await rename(source, target);
  console.log(`File rinominato in ${target}`);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.error('File dist/index.js non trovato. Hai eseguito `tsc`?');
    process.exit(1);
  }
  throw error;
}
