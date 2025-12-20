import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, workOrders, technicians } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

// Work Orders Queries
export async function getWorkOrders(
  teamId: number,
  filters?: {
    status?: string;
    priority?: string;
    limit?: number;
  }
) {
  const conditions = [eq(workOrders.teamId, teamId)];

  if (filters?.status) {
    conditions.push(eq(workOrders.status, filters.status));
  }

  if (filters?.priority) {
    conditions.push(eq(workOrders.priority, filters.priority));
  }

  return await db.query.workOrders.findMany({
    where: and(...conditions),
    orderBy: [desc(workOrders.receivedAt)],
    limit: filters?.limit || 50,
    with: {
      assignedTechnician: true,
    },
  });
}

export async function getWorkOrderById(id: number, teamId: number) {
  return await db.query.workOrders.findFirst({
    where: and(eq(workOrders.id, id), eq(workOrders.teamId, teamId)),
    with: {
      assignedTechnician: true,
      team: true,
    },
  });
}

export async function getWorkOrderStats(teamId: number) {
  const orders = await db.query.workOrders.findMany({
    where: eq(workOrders.teamId, teamId),
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    total: orders.length,
    new: orders.filter((o) => o.status === 'new').length,
    jobCreated: orders.filter((o) => o.status === 'job_created').length,
    assigned: orders.filter((o) => o.status === 'assigned').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    completedToday: orders.filter(
      (o) => o.status === 'completed' && o.completedAt && o.completedAt >= todayStart
    ).length,
    totalRevenue: orders
      .filter((o) => o.actualValue)
      .reduce((sum, o) => sum + Number(o.actualValue || 0), 0),
    pipelineValue: orders
      .filter((o) => o.status !== 'completed' && o.estimatedValue)
      .reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0),
  };
}

export async function getTechnicians(teamId: number) {
  return await db.query.technicians.findMany({
    where: and(eq(technicians.teamId, teamId), eq(technicians.active, true)),
    orderBy: [desc(technicians.name)],
  });
}
