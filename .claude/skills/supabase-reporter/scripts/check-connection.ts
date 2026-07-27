import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load .env manually to be safe
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

async function checkConnection() {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('Error: POSTGRES_URL environment variable is missing.');
        process.exit(1);
    }

    // Create the connection
    const sql = postgres(connectionString);

    try {
        const result = await sql`SELECT version()`;
        console.log('Successfully connected to Supabase!');
        console.log('Database Version:', result[0].version);
    } catch (error) {
        console.error('Failed to connect to Supabase:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

checkConnection();
