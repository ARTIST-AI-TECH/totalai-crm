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
    console.error('Error: POSTGRES_URL missing.');
    process.exit(1);
}

const query = process.argv[2];
if (!query) {
    console.error('Usage: npx tsx run-query.ts "SELECT * FROM ... LIMIT 5"');
    process.exit(1);
}

const sql = postgres(connectionString);

async function runQuery() {
    try {
        const result = await sql.unsafe(query);
        if (result.length === 0) {
            console.log('No results found.');
        } else {
            console.table(result);
        }
    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        await sql.end();
    }
}

runQuery();
