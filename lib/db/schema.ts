import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const technicians = pgTable('technicians', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  status: varchar('status', { length: 50 }).default('available'),
  color: varchar('color', { length: 7 }),
  currentJobId: integer('current_job_id'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),

  // Work Order Identity
  workOrderId: varchar('work_order_id', { length: 50 }).notNull(),
  externalId: varchar('external_id', { length: 50 }).notNull(),
  pmPlatform: varchar('pm_platform', { length: 50 }),

  // Customer/Site (from Simpro)
  simproJobId: integer('simpro_job_id'),
  simproCustomerId: integer('simpro_customer_id'),
  simproCustomerName: varchar('simpro_customer_name', { length: 255 }),
  simproSiteId: integer('simpro_site_id'),
  simproSiteName: varchar('simpro_site_name', { length: 255 }),

  // Tenant Information
  tenantName: varchar('tenant_name', { length: 255 }),
  tenantPhone: varchar('tenant_phone', { length: 50 }),
  tenantEmail: varchar('tenant_email', { length: 255 }),

  // Property Manager
  pmName: varchar('pm_name', { length: 255 }),
  pmEmail: varchar('pm_email', { length: 255 }),

  // Property Details
  propertyAddress: text('property_address').notNull(),
  keyNumber: varchar('key_number', { length: 50 }),

  // Issue Details
  issueTitle: varchar('issue_title', { length: 255 }).notNull(),
  issueDescription: text('issue_description'),
  priority: varchar('priority', { length: 20 }).notNull(),

  // Status Tracking
  status: varchar('status', { length: 50 }).notNull(),
  simproStage: varchar('simpro_stage', { length: 50 }),

  // Attachments
  pdfFileName: varchar('pdf_file_name', { length: 255 }),
  pdfThumbnailPath: varchar('pdf_thumbnail_path', { length: 500 }),
  simproAttachmentId: varchar('simpro_attachment_id', { length: 255 }),
  simproJobUrl: text('simpro_job_url'),

  // Email Metadata
  emailSender: varchar('email_sender', { length: 255 }),
  emailSubject: text('email_subject'),
  emailMessageId: varchar('email_message_id', { length: 255 }),
  sourceUrl: text('source_url'),

  // Timestamps
  receivedAt: timestamp('received_at').notNull(),
  scrapedAt: timestamp('scraped_at'),
  jobCreatedAt: timestamp('job_created_at'),
  assignedAt: timestamp('assigned_at'),
  completedAt: timestamp('completed_at'),

  // Financials
  estimatedValue: numeric('estimated_value', { precision: 10, scale: 2 }),
  actualValue: numeric('actual_value', { precision: 10, scale: 2 }),

  // Assignment
  assignedTo: integer('assigned_to').references(() => technicians.id),
  scheduledFor: timestamp('scheduled_for'),

  // TAPI Acceptance
  tapiAccepted: boolean('tapi_accepted').default(false),
  tapiAcceptedAt: timestamp('tapi_accepted_at'),

  // SMS Notification
  smsSent: boolean('sms_sent').default(false),
  smsSid: varchar('sms_sid', { length: 100 }),
  smsStatus: varchar('sms_status', { length: 50 }),
  smsSentAt: timestamp('sms_sent_at'),

  // Metadata
  isRead: boolean('is_read').default(false),
  rawData: jsonb('raw_data'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  technicians: many(technicians),
  workOrders: many(workOrders),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const techniciansRelations = relations(technicians, ({ one, many }) => ({
  team: one(teams, {
    fields: [technicians.teamId],
    references: [teams.id],
  }),
  assignedWorkOrders: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  team: one(teams, {
    fields: [workOrders.teamId],
    references: [teams.id],
  }),
  assignedTechnician: one(technicians, {
    fields: [workOrders.assignedTo],
    references: [technicians.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type Technician = typeof technicians.$inferSelect;
export type NewTechnician = typeof technicians.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',

  // Work Order Events
  WORK_ORDER_RECEIVED = 'WORK_ORDER_RECEIVED',
  WORK_ORDER_SCRAPED = 'WORK_ORDER_SCRAPED',
  WORK_ORDER_JOB_CREATED = 'WORK_ORDER_JOB_CREATED',
  WORK_ORDER_ASSIGNED = 'WORK_ORDER_ASSIGNED',
  WORK_ORDER_COMPLETED = 'WORK_ORDER_COMPLETED',
  WORK_ORDER_ERROR = 'WORK_ORDER_ERROR',

  // Webhook Events
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED = 'WEBHOOK_PROCESSED',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
}
