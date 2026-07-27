import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
let connectionString = process.env.POSTGRES_URL;

if (fs.existsSync(envPath) && !connectionString) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value && key.trim() === 'POSTGRES_URL') {
            connectionString = value.trim();
        }
    });
}

if (!connectionString) {
    console.error('Error: POSTGRES_URL environment variable is missing.');
    process.exit(1);
}

const sql = postgres(connectionString);

async function getStats() {
    try {
        // Get all tables in public schema
        const tables = await sql`
      SELECT 
        table_name, 
        (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_estimate
      FROM (
        SELECT 
          table_name, 
          query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      ) t
      ORDER BY row_estimate DESC;
    `;

        console.log('# Database Statistics');
        console.log(`Updated at: ${new Date().toISOString()}`);
        console.log('\n## Tables');

        if (tables.length === 0) {
            console.log('No tables found in public schema.');
        } else {
            console.table(tables.map(t => ({ Table: t.table_name, Rows: t.row_estimate })));
        }

    } catch (error) {
        console.error('Failed to get stats:', error);
    } finally {
        await sql.end();
    }
}

getStats();
