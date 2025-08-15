import { pgTable, text, timestamp, real, pgEnum, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for the database
export const authProviderEnum = pgEnum('auth_provider', ['google', 'email']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'in_progress', 'resolved', 'rejected']);

// Users table for authentication
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar_url: text('avatar_url'), // Nullable by default
  provider: authProviderEnum('provider').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Road damage reports table
export const roadDamageReportsTable = pgTable('road_damage_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  reporter_name: text('reporter_name').notNull(),
  reporter_phone: text('reporter_phone').notNull(),
  reporter_address: text('reporter_address').notNull(),
  report_date: timestamp('report_date').notNull(),
  damage_description: text('damage_description'), // Nullable by default
  photo_url: text('photo_url').notNull(),
  latitude: real('latitude').notNull(), // Use real for GPS coordinates
  longitude: real('longitude').notNull(), // Use real for GPS coordinates
  status: reportStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  reports: many(roadDamageReportsTable),
}));

export const roadDamageReportsRelations = relations(roadDamageReportsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [roadDamageReportsTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect; // For SELECT operations
export type NewUser = typeof usersTable.$inferInsert; // For INSERT operations

export type RoadDamageReport = typeof roadDamageReportsTable.$inferSelect; // For SELECT operations
export type NewRoadDamageReport = typeof roadDamageReportsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  roadDamageReports: roadDamageReportsTable 
};

export const tableRelations = {
  usersRelations,
  roadDamageReportsRelations,
};