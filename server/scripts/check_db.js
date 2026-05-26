require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to DB');
  const res = await client.query('SELECT id, title, images, "thumbnailUrl" FROM "Property" LIMIT 5');
  res.rows.forEach(r => {
    console.log(`${r.title} | images null? ${r.images === null} | thumb: ${r.thumbnailUrl || 'null'}`);
  });
}

main().catch(e => console.error('❌', e.message)).finally(() => client.end());
