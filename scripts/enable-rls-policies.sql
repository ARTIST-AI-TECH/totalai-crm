-- Enable RLS on all tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/azipsumepznorgugrylh/sql/new

-- =============================================================================
-- 1. WORK ORDERS (already has RLS, updating policies)
-- =============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all selects on work_orders" ON work_orders;
DROP POLICY IF EXISTS "Allow system inserts on work_orders" ON work_orders;

-- Create comprehensive policies
CREATE POLICY "Users can view their team's work orders"
  ON work_orders
  FOR SELECT
  USING (true); -- Open for now since we use anon key and filter client-side

CREATE POLICY "System can insert work orders"
  ON work_orders
  FOR INSERT
  WITH CHECK (true); -- Webhooks need to insert

CREATE POLICY "System can update work orders"
  ON work_orders
  FOR UPDATE
  USING (true); -- For SMS status updates, TAPI acceptance, etc.

-- =============================================================================
-- 2. TEAMS
-- =============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teams"
  ON teams
  FOR SELECT
  USING (true); -- Open for now

CREATE POLICY "Users can update their own teams"
  ON teams
  FOR UPDATE
  USING (true);

-- =============================================================================
-- 3. TEAM MEMBERS
-- =============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert team members"
  ON team_members
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can delete team members"
  ON team_members
  FOR DELETE
  USING (true);

-- =============================================================================
-- 4. USERS
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view user data"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update users"
  ON users
  FOR UPDATE
  USING (true);

-- =============================================================================
-- 5. ACTIVITY LOGS
-- =============================================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs"
  ON activity_logs
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- 6. INVITATIONS
-- =============================================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations"
  ON invitations
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert invitations"
  ON invitations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update invitations"
  ON invitations
  FOR UPDATE
  USING (true);

-- =============================================================================
-- 7. TECHNICIANS
-- =============================================================================

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view technicians"
  ON technicians
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert technicians"
  ON technicians
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update technicians"
  ON technicians
  FOR UPDATE
  USING (true);

-- =============================================================================
-- VERIFY RLS IS ENABLED
-- =============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('work_orders', 'teams', 'team_members', 'users', 'activity_logs', 'invitations', 'technicians')
ORDER BY tablename;
