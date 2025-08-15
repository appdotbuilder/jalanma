import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { roadDamageReportsTable, usersTable } from '../db/schema';
import { type CreateRoadDamageReportInput } from '../schema';
import { createRoadDamageReport } from '../handlers/create_road_damage_report';
import { eq } from 'drizzle-orm';

// Test user for foreign key relationships
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  provider: 'email' as const
};

// Simple test input with all required fields
const testInput: CreateRoadDamageReportInput = {
  reporter_name: 'John Doe',
  reporter_phone: '08123456789',
  reporter_address: 'Jl. Sudirman No. 123, Jakarta',
  report_date: new Date('2023-12-01T10:00:00Z'),
  damage_description: 'Lubang besar di tengah jalan',
  photo_url: 'https://example.com/damage-photo.jpg',
  latitude: -6.2088,
  longitude: 106.8456
};

describe('createRoadDamageReport', () => {
  let testUserId: string;

  beforeEach(async () => {
    await createDB();
    // Create a test user for foreign key relationship
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a road damage report', async () => {
    const result = await createRoadDamageReport(testInput, testUserId);

    // Basic field validation
    expect(result.reporter_name).toEqual('John Doe');
    expect(result.reporter_phone).toEqual('08123456789');
    expect(result.reporter_address).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(result.damage_description).toEqual('Lubang besar di tengah jalan');
    expect(result.photo_url).toEqual('https://example.com/damage-photo.jpg');
    expect(result.latitude).toEqual(-6.2088);
    expect(result.longitude).toEqual(106.8456);
    expect(result.status).toEqual('pending');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.report_date).toBeInstanceOf(Date);
  });

  it('should save report to database', async () => {
    const result = await createRoadDamageReport(testInput, testUserId);

    // Query using proper drizzle syntax
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports).toHaveLength(1);
    expect(reports[0].reporter_name).toEqual('John Doe');
    expect(reports[0].reporter_phone).toEqual('08123456789');
    expect(reports[0].damage_description).toEqual('Lubang besar di tengah jalan');
    expect(reports[0].photo_url).toEqual('https://example.com/damage-photo.jpg');
    expect(reports[0].latitude).toEqual(-6.2088);
    expect(reports[0].longitude).toEqual(106.8456);
    expect(reports[0].status).toEqual('pending');
    expect(reports[0].user_id).toEqual(testUserId);
    expect(reports[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null damage description', async () => {
    const inputWithNullDescription = {
      ...testInput,
      damage_description: null
    };

    const result = await createRoadDamageReport(inputWithNullDescription, testUserId);

    expect(result.damage_description).toBeNull();

    // Verify in database
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports[0].damage_description).toBeNull();
  });

  it('should handle GPS coordinates correctly', async () => {
    const gpsTestInput = {
      ...testInput,
      latitude: -7.2575, // Bandung coordinates
      longitude: 107.5431
    };

    const result = await createRoadDamageReport(gpsTestInput, testUserId);

    expect(result.latitude).toEqual(-7.2575);
    expect(result.longitude).toEqual(107.5431);

    // Verify GPS coordinates are stored correctly
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports[0].latitude).toEqual(-7.2575);
    expect(reports[0].longitude).toEqual(107.5431);
  });

  it('should set default status to pending', async () => {
    const result = await createRoadDamageReport(testInput, testUserId);

    expect(result.status).toEqual('pending');

    // Verify default status in database
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports[0].status).toEqual('pending');
  });

  it('should handle Indonesian phone number format', async () => {
    const indonesianPhoneInput = {
      ...testInput,
      reporter_phone: '+6281234567890'
    };

    const result = await createRoadDamageReport(indonesianPhoneInput, testUserId);

    expect(result.reporter_phone).toEqual('+6281234567890');

    // Verify phone format is preserved in database
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports[0].reporter_phone).toEqual('+6281234567890');
  });

  it('should throw error for non-existent user_id', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID format that doesn't exist

    await expect(
      createRoadDamageReport(testInput, nonExistentUserId)
    ).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should preserve report date accurately', async () => {
    const specificDate = new Date('2023-11-15T14:30:00Z');
    const dateTestInput = {
      ...testInput,
      report_date: specificDate
    };

    const result = await createRoadDamageReport(dateTestInput, testUserId);

    expect(result.report_date).toEqual(specificDate);

    // Verify date is stored correctly in database
    const reports = await db.select()
      .from(roadDamageReportsTable)
      .where(eq(roadDamageReportsTable.id, result.id))
      .execute();

    expect(reports[0].report_date).toEqual(specificDate);
  });
});