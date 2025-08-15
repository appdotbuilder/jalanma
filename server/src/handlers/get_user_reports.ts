import { db } from '../db';
import { roadDamageReportsTable } from '../db/schema';
import { type RoadDamageReport } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserReports(userId: string): Promise<RoadDamageReport[]> {
  try {
    // Query all reports for the specified user, ordered by creation date (newest first)
    const results = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.user_id, userId))
      .orderBy(desc(roadDamageReportsTable.created_at))
      .execute();

    // Return the results - no type conversion needed as all fields are compatible
    return results;
  } catch (error) {
    console.error('Failed to fetch user reports:', error);
    throw error;
  }
}