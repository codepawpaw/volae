import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";

// Simple JSON-file storage. Files live in data/ and are created from seed/ on first use.
const DATA_DIR = path.join(process.cwd(), "data");
const SEED_DIR = path.join(process.cwd(), "seed");
const COLLECTIONS = ["brands", "categories", "products", "subscribers", "orders"] as const;
type Collection = (typeof COLLECTIONS)[number];

async function readCollection<K extends Collection>(name: K): Promise<Database[K]> {
  const file = path.join(DATA_DIR, `${name}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(SEED_DIR, `${name}.json`), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return [] as Database[K];
  }
}

async function writeCollection(name: Collection, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${name}.json`);
  // Write to a temp file and rename so a crash never leaves a half-written file.
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}

export async function readDatabase(): Promise<Database> {
  const entries = await Promise.all(COLLECTIONS.map(async (name) => [name, await readCollection(name)] as const));
  return Object.fromEntries(entries) as Database;
}

// All writes go through one queue (shared across module instances) so concurrent
// saves cannot overwrite each other.
const globalForDb = globalThis as unknown as { __volaeDbQueue?: Promise<unknown> };

/**
 * Runs `fn` with exclusive access to the database. `fn` may mutate the object it
 * receives; every changed collection is written back once it returns without throwing.
 */
export function transaction<T>(fn: (db: Database) => Promise<T> | T): Promise<T> {
  const run = (globalForDb.__volaeDbQueue ?? Promise.resolve()).then(async () => {
    const db = await readDatabase();
    const before = Object.fromEntries(COLLECTIONS.map((name) => [name, JSON.stringify(db[name])]));
    const result = await fn(db);
    for (const name of COLLECTIONS) {
      if (JSON.stringify(db[name]) !== before[name]) await writeCollection(name, db[name]);
    }
    return result;
  });
  globalForDb.__volaeDbQueue = run.catch(() => undefined);
  return run;
}
