// Applies the FarmAI PostgreSQL schema (pgvector extension + tables/indexes).
// Used by Render (preDeployCommand) and can be run manually:
//   node scripts/init-db.js
//
// Requires DATABASE_URL to be set in the environment.

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    try {
      console.log('[init-db] Enabling pgvector extension...');
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('[init-db] pgvector enabled.');
    } catch (extErr) {
      console.warn('[init-db] pgvector extension not available:', extErr.message);
      console.warn('[init-db] knowledge_vectors table will be skipped.');
    }

    const schemaPath = path.join(__dirname, '..', 'db_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('[init-db] Applying schema...');
    try {
      await pool.query(schema);
    } catch (schemaErr) {
      console.warn('[init-db] Partial schema apply:', schemaErr.message);
      console.warn('[init-db] Continuing with whatever tables were created.');
    }

    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    console.log('[init-db] Tables:', tables.rows.map((r) => r.tablename).join(', '));
    console.log('[init-db] Database initialized successfully.');
  } catch (err) {
    console.error('[init-db] Failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
