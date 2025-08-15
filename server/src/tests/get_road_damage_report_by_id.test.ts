import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, roadDamageReportsTable } from '../db/schema';
import { getRoadDamageReportById } from '../handlers/get_road_damage_report_by_id';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  provider: 'email' as const,
};

const testReport = {
  reporter_name: 'John Doe',
  reporter_phone: '1234567890',
  reporter_address: 'Jl. Test No. 123',
  report_date: new Date('2024-01-15'),
  damage_description: 'Lubang besar di jalan',
  photo_url: 'https://example.com/photo.jpg',
  latitude: -6.2088,
  longitude: 106.8456,
  status: 'pending' as const,
};

describe('getRoadDamageReportById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a road damage report by ID', async () => {
    // Create user first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create report
    const [report] = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: user.id,
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getRoadDamageReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(report.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.reporter_name).toEqual('John Doe');
    expect(result!.reporter_phone).toEqual('1234567890');
    expect(result!.reporter_address).toEqual('Jl. Test No. 123');
    expect(result!.report_date).toEqual(new Date('2024-01-15'));
    expect(result!.damage_description).toEqual('Lubang besar di jalan');
    expect(result!.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result!.latitude).toEqual(-6.2088);
    expect(result!.longitude).toEqual(106.8456);
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent report ID', async () => {
    const result = await getRoadDamageReportById('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBeNull();
  });

  it('should handle reports with null damage_description', async () => {
    // Create user first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create report with null description
    const [report] = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: user.id,
        damage_description: null,
      })
      .returning()
      .execute();

    const result = await getRoadDamageReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.damage_description).toBeNull();
    expect(result!.reporter_name).toEqual('John Doe');
  });

  it('should return report with different status values', async () => {
    // Create user first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Test different status values
    const statuses = ['pending', 'in_progress', 'resolved', 'rejected'] as const;
    
    for (const status of statuses) {
      const [report] = await db.insert(roadDamageReportsTable)
        .values({
          ...testReport,
          user_id: user.id,
          status,
        })
        .returning()
        .execute();

      const result = await getRoadDamageReportById(report.id);

      expect(result).not.toBeNull();
      expect(result!.status).toEqual(status);
    }
  });

  it('should handle valid GPS coordinates correctly', async () => {
    // Create user first
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Test with extreme but valid coordinates
    const [report] = await db.insert(roadDamageReportsTable)
      .values({
        ...testReport,
        user_id: user.id,
        latitude: -89.999,
        longitude: 179.999,
      })
      .returning()
      .execute();

    const result = await getRoadDamageReportById(report.id);

    expect(result).not.toBeNull();
    expect(result!.latitude).toEqual(-89.999);
    expect(result!.longitude).toEqual(179.999);
    expect(typeof result!.latitude).toBe('number');
    expect(typeof result!.longitude).toBe('number');
  });
});