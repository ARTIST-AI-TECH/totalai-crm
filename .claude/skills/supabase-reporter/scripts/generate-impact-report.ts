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

const sql = postgres(connectionString);

async function generateReport() {
    try {
        // 1. Total Work Orders & SMS Stats
        const totalStats = await sql`
      SELECT 
        COUNT(*) as total_wo,
        SUM(CASE WHEN sms_sent = true THEN 1 ELSE 0 END) as sms_sent,
        SUM(CASE WHEN sms_status = 'delivered' THEN 1 ELSE 0 END) as sms_delivered,
        SUM(CASE WHEN sms_status = 'queued' THEN 1 ELSE 0 END) as sms_queued
      FROM work_orders
    `;
        const { total_wo, sms_sent, sms_delivered, sms_queued } = totalStats[0];

        // 2. Weekly Stats
        const weeklyStats = await sql`
      SELECT 
        DATE_TRUNC('week', created_at)::date as week_start,
        COUNT(*) as count
      FROM work_orders
      GROUP BY week_start
      ORDER BY week_start DESC
    `;

        // 3. Monthly Stats
        const monthlyStats = await sql`
      SELECT 
        DATE_TRUNC('month', created_at)::date as month_start,
        COUNT(*) as count
      FROM work_orders
      GROUP BY month_start
      ORDER BY month_start DESC
    `;

        // 4. Calculations
        // Manual: 5-7 mins. Average 6 mins = 0.1 hours. (User said 5-7, then later 5-10. Let's use 6 mins for manual)
        // Automated: 30-45 seconds. Average 37.5s = ~0.625 mins = ~0.01 hours.
        // Savings per WO: ~5.375 mins = ~0.09 hours.

        // Actually user said: "Average 5-7 minutes" vs "30-45 seconds".
        // Let's use 6 minutes (360s) vs 37.5s.
        // Savings = 322.5s per WO.
        const manualTimeSeconds = 6 * 60; // 360s
        const automatedTimeSeconds = 37.5;
        const savingsPerWoSeconds = manualTimeSeconds - automatedTimeSeconds;

        const totalSavingsSeconds = savingsPerWoSeconds * total_wo;
        const totalSavingsHours = (totalSavingsSeconds / 3600).toFixed(2);
        const totalSavingsMinutes = (totalSavingsSeconds / 60).toFixed(0);

        // Markdown Output
        const reportDate = new Date().toISOString().split('T')[0];
        let md = `# Work Order Impact Report\n`;
        md += `**Date**: ${reportDate}\n\n`;

        md += `## Executive Summary\n`;
        md += `- **Total Work Orders Processed**: ${total_wo}\n`;
        md += `- **Total Man-Hours Saved**: ${totalSavingsHours} hours (${totalSavingsMinutes} minutes)\n`;
        md += `  - *Basis: ~6 mins manual vs ~37.5s automated per order*\n`;
        md += `- **Total SMS Notifications**: ${sms_sent || 0} (Delivered: ${sms_delivered || 0}, Queued: ${sms_queued || 0})\n\n`;

        md += `## Volume by Month\n`;
        md += `| Month | Work Orders |\n`;
        md += `| :--- | :---: |\n`;
        monthlyStats.forEach(row => {
            const dateStr = new Date(row.month_start).toISOString().split('T')[0];
            md += `| ${dateStr} | ${row.count} |\n`;
        });
        md += `\n`;

        md += `## Volume by Week\n`;
        md += `| Week Starting | Work Orders |\n`;
        md += `| :--- | :---: |\n`;
        weeklyStats.forEach(row => {
            const dateStr = new Date(row.week_start).toISOString().split('T')[0];
            md += `| ${dateStr} | ${row.count} |\n`;
        });
        md += `\n`;

        // Write to file
        const outputPath = path.resolve(process.cwd(), 'IMPACT_REPORT.md');
        fs.writeFileSync(outputPath, md);
        console.log(`Report generated at: ${outputPath}`);

    } catch (error) {
        console.error('Report generation failed:', error);
    } finally {
        await sql.end();
    }
}

generateReport();
