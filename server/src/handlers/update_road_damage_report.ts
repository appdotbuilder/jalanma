import { db } from '../db';
import { roadDamageReportsTable } from '../db/schema';
import { type UpdateRoadDamageReportInput, type RoadDamageReport } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRoadDamageReport = async (input: UpdateRoadDamageReportInput): Promise<RoadDamageReport | null> => {
  try {
    // First, check if the report exists
    const existingReport = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, input.id))
      .execute();

    if (existingReport.length === 0) {
      return null;
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.reporter_name !== undefined) {
      updateData.reporter_name = input.reporter_name;
    }
    if (input.reporter_phone !== undefined) {
      updateData.reporter_phone = input.reporter_phone;
    }
    if (input.reporter_address !== undefined) {
      updateData.reporter_address = input.reporter_address;
    }
    if (input.report_date !== undefined) {
      updateData.report_date = input.report_date;
    }
    if (input.damage_description !== undefined) {
      updateData.damage_description = input.damage_description;
    }
    if (input.photo_url !== undefined) {
      updateData.photo_url = input.photo_url;
    }
    if (input.latitude !== undefined) {
      updateData.latitude = input.latitude;
    }
    if (input.longitude !== undefined) {
      updateData.longitude = input.longitude;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the report
    const result = await db.update(roadDamageReportsTable)
      .set(updateData)
      .where(eq(roadDamageReportsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Road damage report update failed:', error);
    throw error;
  }
};