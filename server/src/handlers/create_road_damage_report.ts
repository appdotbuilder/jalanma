import { db } from '../db';
import { roadDamageReportsTable } from '../db/schema';
import { type CreateRoadDamageReportInput, type RoadDamageReport } from '../schema';

export const createRoadDamageReport = async (
  input: CreateRoadDamageReportInput, 
  userId: string
): Promise<RoadDamageReport> => {
  try {
    // Insert road damage report record
    const result = await db.insert(roadDamageReportsTable)
      .values({
        user_id: userId,
        reporter_name: input.reporter_name,
        reporter_phone: input.reporter_phone,
        reporter_address: input.reporter_address,
        report_date: input.report_date,
        damage_description: input.damage_description,
        photo_url: input.photo_url,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'pending' // Default status for new reports
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Road damage report creation failed:', error);
    throw error;
  }
};