import pg from "pg";
const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL não definida"); process.exit(1); }
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const r = await client.query("select now() as now, current_database() as db");
  console.log("✅ Conectado:", r.rows[0]);
} catch (e) {
  console.error("❌ Falha ao conectar:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
