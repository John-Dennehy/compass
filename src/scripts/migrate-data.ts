import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { resources } from '../lib/db/schema';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const jsonPath = path.resolve(__dirname, '../data/resources/community-resources.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const communityResources = JSON.parse(rawData);

  console.log(`Found ${communityResources.length} resources. Migrating...`);

  for (const resource of communityResources) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const { id, ...data } = resource as any;
    
    await db.insert(resources).values({
      name: data.name,
      description: data.description,
      category: data.category,
      audiences: data.audiences,
      tags: data.tags,
      location: data.location,
      schedule: data.schedule,
      contacts: data.contacts,
      links: data.links,
      notes: data.notes,
      status: 'approved',
    }).onConflictDoNothing();
    
    console.log(`Migrated: ${data.name}`);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
