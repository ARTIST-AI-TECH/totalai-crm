import { db } from '../lib/db/drizzle';
import { workOrders, activityLogs } from '../lib/db/schema';

async function cleanTestData() {
  console.log('🧹 Cleaning test data...');

  // Delete all work orders (CASCADE will handle relations)
  const deletedOrders = await db.delete(workOrders).returning();

  // Note: Activity logs stay for audit trail, but you can delete them too if needed
  console.log(`✅ Deleted ${deletedOrders.length} work orders`);
  console.log('🎯 Database clean - ready for fresh test!');

  process.exit(0);
}

cleanTestData().catch(console.error);
