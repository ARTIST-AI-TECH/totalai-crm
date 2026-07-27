---
name: supabase-reporter
description: Interact with the Supabase database to check connection, get quick stats, or create custom reports via SQL. Use when the user asks for database reports, table statistics, or specific data queries.
---

# Supabase Reporter

This skill allows you to interact with the project's Supabase instance using direct SQL connection.

## When to Use

- **Check Connection**: When asked to verify if the database is reachable.
- **Quick Stats**: When asked for a summary of the database (tables, row counts).
- **Create Report**: When asked to generate a report or query specific data.
- **Impact Report**: When asked for the "Work Order Impact Report" or "Savings Report".

## Workflows

### 1. Check Connection
Run this script to verify the connection.

```bash
npx tsx .claude/skills/supabase-reporter/scripts/check-connection.ts
```

### 2. Get Quick Stats
Run this script to see all tables and approximate row counts.

```bash
npx tsx .claude/skills/supabase-reporter/scripts/get-stats.ts
```

### 3. Generate Work Order Impact Report
Run this script to generate a comprehensive markdown report on Work Orders, SMS usage, and Time Savings.

```bash
npx tsx .claude/skills/supabase-reporter/scripts/generate-impact-report.ts
```
*Output will be saved to `IMPACT_REPORT.md`.*

### 4. Create Custom Report (Run Query)
To create a custom report:

1.  **Understand the Request**: Determine what data the user needs.
2.  **Inspect Schema (Optional)**: If you don't know the table structure, run `get-stats.ts` first, or run a specific schema query like:
    ```bash
    npx tsx .claude/skills/supabase-reporter/scripts/run-query.ts "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'your_table_name'"
    ```
3.  **Construct SQL**: Write a valid PostgreSQL query.
4.  **Execute**: Run the query using the script.

```bash
npx tsx .claude/skills/supabase-reporter/scripts/run-query.ts "<YOUR_SQL_QUERY>"
```

**Example:**
```bash
npx tsx .claude/skills/supabase-reporter/scripts/run-query.ts "SELECT * FROM users LIMIT 5"
```
