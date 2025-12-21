-- Clean all test work orders and related data
-- Run this to reset the database for fresh testing

-- Delete work order activity logs
DELETE FROM activity_logs
WHERE action IN (
  'WORK_ORDER_RECEIVED',
  'WORK_ORDER_SCRAPED',
  'WORK_ORDER_JOB_CREATED',
  'WORK_ORDER_ASSIGNED',
  'WORK_ORDER_COMPLETED',
  'WORK_ORDER_ERROR',
  'WEBHOOK_RECEIVED',
  'WEBHOOK_PROCESSED',
  'WEBHOOK_ERROR'
);

-- Delete all work orders
DELETE FROM work_orders;

-- Reset sequence (optional - keeps IDs low)
ALTER SEQUENCE work_orders_id_seq RESTART WITH 1;

-- Verify cleanup
SELECT COUNT(*) as work_orders_count FROM work_orders;
SELECT COUNT(*) as activity_logs_count FROM activity_logs;
