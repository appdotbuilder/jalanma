import { db } from '../db';
import { roadDamageReportsTable, usersTable } from '../db/schema';
import { type RoadDamageReport } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRoadDamageReportById(id: string): Promise<RoadDamageReport | null> {
  try {
    // Query the report with joined user data
    const results = await db.select()
      .from(roadDamageReportsTable)
      .innerJoin(usersTable, eq(roadDamageReportsTable.user_id, usersTable.id))
      .where(eq(roadDamageReportsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    
    // Return the report data in the expected schema format
    // Note: real columns don't need conversion like numeric columns do
    return {
      id: result.road_damage_reports.id,
      user_id: result.road_damage_reports.user_id,
      reporter_name: result.road_damage_reports.reporter_name,
      reporter_phone: result.road_damage_reports.reporter_phone,
      reporter_address: result.road_damage_reports.reporter_address,
      report_date: result.road_damage_reports.report_date,
      damage_description: result.road_damage_reports.damage_description,
      photo_url: result.road_damage_reports.photo_url,
      latitude: result.road_damage_reports.latitude,
      longitude: result.road_damage_reports.longitude,
      status: result.road_damage_reports.status,
      created_at: result.road_damage_reports.created_at,
      updated_at: result.road_damage_reports.updated_at,
    };
  } catch (error) {
    console.error('Failed to get road damage report by ID:', error);
    throw error;
  }
}