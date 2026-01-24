import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

// Função para encontrar o arquivo .sqlite do Wrangler
const getLocalD1Path = () => {
  const basePath = path.resolve(
    '.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
  );
  if (!fs.existsSync(basePath)) return null;
  const files = fs.readdirSync(basePath);
  const sqliteFile = files.find((f) => f.endsWith('.sqlite'));
  return sqliteFile ? path.join(basePath, sqliteFile) : null;
};

const dbPath = getLocalD1Path();

if (!dbPath) {
  console.error(
    "❌ Banco de dados local não encontrado. Execute 'bun run dev' pelo menos uma vez.",
  );
  process.exit(1);
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function main() {
  console.log('🌱 Semeando banco de dados...');

  await db.insert(schema.movies).values([
    {
      title: 'The Matrix',
      releaseYear: 1999,
    },
    {
      title: 'The Matrix Reloaded',
      releaseYear: 2003,
    },
    {
      title: 'The Matrix Revolutions',
      releaseYear: 2003,
    },
  ]);

  console.log(`✅ Seeding complete.`);
}

main().catch(console.error);
