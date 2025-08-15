import { db } from '../db';
import { roadDamageReportsTable, usersTable } from '../db/schema';
import { type GetReportsQuery, type RoadDamageReport } from '../schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getRoadDamageReports = async (query: GetReportsQuery): Promise<RoadDamageReport[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by status if provided
    if (query.status) {
      conditions.push(eq(roadDamageReportsTable.status, query.status));
    }

    // Filter by user_id if provided
    if (query.user_id) {
      conditions.push(eq(roadDamageReportsTable.user_id, query.user_id));
    }

    // Location-based filtering using Haversine formula for radius search
    if (query.latitude !== undefined && query.longitude !== undefined && query.radius_km) {
      // Using PostgreSQL's earth_distance function approximation
      // Formula: 6371 * 2 * asin(sqrt(sin((lat2-lat1)/2)^2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)^2))
      const earthRadius = 6371; // Earth radius in kilometers
      conditions.push(
        sql`(${earthRadius} * acos(
          cos(radians(${query.latitude})) * 
          cos(radians(${roadDamageReportsTable.latitude})) * 
          cos(radians(${roadDamageReportsTable.longitude}) - radians(${query.longitude})) + 
          sin(radians(${query.latitude})) * 
          sin(radians(${roadDamageReportsTable.latitude}))
        )) <= ${query.radius_km}`
      );
    }

    // Build pagination values
    const limit = query.limit ?? 50; // Default limit
    const offset = query.offset ?? 0; // Default offset

    // Build the complete query in one chain without variable reassignment
    const results = conditions.length > 0
      ? await db.select({
          id: roadDamageReportsTable.id,
          user_id: roadDamageReportsTable.user_id,
          reporter_name: roadDamageReportsTable.reporter_name,
          reporter_phone: roadDamageReportsTable.reporter_phone,
          reporter_address: roadDamageReportsTable.reporter_address,
          report_date: roadDamageReportsTable.report_date,
          damage_description: roadDamageReportsTable.damage_description,
          photo_url: roadDamageReportsTable.photo_url,
          latitude: roadDamageReportsTable.latitude,
          longitude: roadDamageReportsTable.longitude,
          status: roadDamageReportsTable.status,
          created_at: roadDamageReportsTable.created_at,
          updated_at: roadDamageReportsTable.updated_at,
        })
        .from(roadDamageReportsTable)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(roadDamageReportsTable.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
      : await db.select({
          id: roadDamageReportsTable.id,
          user_id: roadDamageReportsTable.user_id,
          reporter_name: roadDamageReportsTable.reporter_name,
          reporter_phone: roadDamageReportsTable.reporter_phone,
          reporter_address: roadDamageReportsTable.reporter_address,
          report_date: roadDamageReportsTable.report_date,
          damage_description: roadDamageReportsTable.damage_description,
          photo_url: roadDamageReportsTable.photo_url,
          latitude: roadDamageReportsTable.latitude,
          longitude: roadDamageReportsTable.longitude,
          status: roadDamageReportsTable.status,
          created_at: roadDamageReportsTable.created_at,
          updated_at: roadDamageReportsTable.updated_at,
        })
        .from(roadDamageReportsTable)
        .orderBy(desc(roadDamageReportsTable.created_at))
        .limit(limit)
        .offset(offset)
        .execute();

    // Convert numeric fields and return
    return results.map(report => ({
      ...report,
      latitude: Number(report.latitude), // Convert real to number
      longitude: Number(report.longitude), // Convert real to number
    }));
  } catch (error) {
    console.error('Failed to fetch road damage reports:', error);
    throw error;
  }
};