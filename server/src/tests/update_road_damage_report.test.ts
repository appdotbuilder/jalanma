import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, roadDamageReportsTable } from '../db/schema';
import { type UpdateRoadDamageReportInput } from '../schema';
import { updateRoadDamageReport } from '../handlers/update_road_damage_report';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'testuser@example.com',
  name: 'Test User',
  provider: 'email' as const,
};

// Test report data
const testReport = {
  reporter_name: 'John Doe',
  reporter_phone: '081234567890',
  reporter_address: 'Jl. Test No. 123',
  report_date: new Date('2024-01-15'),
  damage_description: 'Jalan berlubang besar',
  photo_url: 'https://example.com/photo.jpg',
  latitude: -6.2088,
  longitude: 106.8456,
};

describe('updateRoadDamageReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a road damage report with all fields', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = userResult[0];

    // Create a test report
    const reportResult = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
      })
      .returning()
      .execute();

    const createdReport = reportResult[0];

    // Update input with new data
    const updateInput: UpdateRoadDamageReportInput = {
      id: createdReport.id,
      reporter_name: 'Jane Smith',
      reporter_phone: '089876543210',
      reporter_address: 'Jl. Updated No. 456',
      report_date: new Date('2024-01-20'),
      damage_description: 'Jalan retak parah',
      photo_url: 'https://example.com/updated-photo.jpg',
      latitude: -6.3000,
      longitude: 106.9000,
      status: 'in_progress',
    };

    const result = await updateRoadDamageReport(updateInput);

    // Verify the update was successful
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdReport.id);
    expect(result!.reporter_name).toEqual('Jane Smith');
    expect(result!.reporter_phone).toEqual('089876543210');
    expect(result!.reporter_address).toEqual('Jl. Updated No. 456');
    expect(result!.report_date).toEqual(new Date('2024-01-20'));
    expect(result!.damage_description).toEqual('Jalan retak parah');
    expect(result!.photo_url).toEqual('https://example.com/updated-photo.jpg');
    expect(result!.latitude).toEqual(-6.3000);
    expect(result!.longitude).toEqual(106.9000);
    expect(result!.status).toEqual('in_progress');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = userResult[0];

    // Create a test report
    const reportResult = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
      })
      .returning()
      .execute();

    const createdReport = reportResult[0];

    // Update only specific fields
    const updateInput: UpdateRoadDamageReportInput = {
      id: createdReport.id,
      reporter_name: 'Updated Name',
      status: 'resolved',
    };

    const result = await updateRoadDamageReport(updateInput);

    // Verify only specified fields were updated
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdReport.id);
    expect(result!.reporter_name).toEqual('Updated Name');
    expect(result!.status).toEqual('resolved');
    // Other fields should remain unchanged
    expect(result!.reporter_phone).toEqual(testReport.reporter_phone);
    expect(result!.reporter_address).toEqual(testReport.reporter_address);
    expect(result!.damage_description).toEqual(testReport.damage_description);
    expect(result!.photo_url).toEqual(testReport.photo_url);
    expect(result!.latitude).toEqual(testReport.latitude);
    expect(result!.longitude).toEqual(testReport.longitude);
  });

  it('should save updated report to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = userResult[0];

    // Create a test report
    const reportResult = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
      })
      .returning()
      .execute();

    const createdReport = reportResult[0];

    // Update the report
    const updateInput: UpdateRoadDamageReportInput = {
      id: createdReport.id,
      reporter_name: 'Database Test',
      status: 'in_progress',
    };

    await updateRoadDamageReport(updateInput);

    // Query the database to verify the update was persisted
    const updatedReports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, createdReport.id))
      .execute();

    expect(updatedReports).toHaveLength(1);
    const updatedReport = updatedReports[0];
    expect(updatedReport.reporter_name).toEqual('Database Test');
    expect(updatedReport.status).toEqual('in_progress');
    expect(updatedReport.updated_at).toBeInstanceOf(Date);
    expect(updatedReport.updated_at.getTime()).toBeGreaterThan(updatedReport.created_at.getTime());
  });

  it('should return null when report does not exist', async () => {
    const updateInput: UpdateRoadDamageReportInput = {
      id: '00000000-0000-0000-0000-000000000000',
      reporter_name: 'Non-existent Report',
    };

    const result = await updateRoadDamageReport(updateInput);

    expect(result).toBeNull();
  });

  it('should handle nullable fields correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = userResult[0];

    // Create a test report with non-null damage_description
    const reportResult = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
        damage_description: 'Original description',
      })
      .returning()
      .execute();

    const createdReport = reportResult[0];

    // Update damage_description to null
    const updateInput: UpdateRoadDamageReportInput = {
      id: createdReport.id,
      damage_description: null,
    };

    const result = await updateRoadDamageReport(updateInput);

    expect(result).toBeDefined();
    expect(result!.damage_description).toBeNull();

    // Verify in database
    const dbResult = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, createdReport.id))
      .execute();

    expect(dbResult[0].damage_description).toBeNull();
  });

  it('should update status through different workflow stages', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const createdUser = userResult[0];

    // Create a test report with pending status
    const reportResult = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
        status: 'pending',
      })
      .returning()
      .execute();

    const createdReport = reportResult[0];

    // Test status progression: pending -> in_progress
    let updateInput: UpdateRoadDamageReportInput = {
      id: createdReport.id,
      status: 'in_progress',
    };

    let result = await updateRoadDamageReport(updateInput);
    expect(result!.status).toEqual('in_progress');

    // Test status progression: in_progress -> resolved
    updateInput = {
      id: createdReport.id,
      status: 'resolved',
    };

    result = await updateRoadDamageReport(updateInput);
    expect(result!.status).toEqual('resolved');

    // Create another report to test rejection
    const reportResult2 = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: createdUser.id,
        status: 'pending',
      })
      .returning()
      .execute();

    // Test status progression: pending -> rejected
    updateInput = {
      id: reportResult2[0].id,
      status: 'rejected',
    };

    result = await updateRoadDamageReport(updateInput);
    expect(result!.status).toEqual('rejected');
  });
});