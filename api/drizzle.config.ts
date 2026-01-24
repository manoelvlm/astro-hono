import { defineConfig } from 'drizzle-kit';
import fs from 'node:fs';
import path from 'node:path';

// Função auxiliar para encontrar o banco local do Wrangler
function getLocalD1Path() {
  const basePath = path.resolve(
    '.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
  );
  if (fs.existsSync(basePath)) {
    const files = fs.readdirSync(basePath);
    const sqliteFile = files.find((f) => f.endsWith('.sqlite'));
    if (sqliteFile) return path.join(basePath, sqliteFile);
  }
}

const localPath = getLocalD1Path();

export default defineConfig({
  out: './drizzle',
  schema: '../packages/db/src/schema.ts',
  dialect: 'sqlite',
  ...(localPath && !process.env.USE_REMOTE_DB
    ? {
        dbCredentials: {
          url: localPath,
        },
      }
    : {
        driver: 'd1-http',
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
          token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
      }),
});
